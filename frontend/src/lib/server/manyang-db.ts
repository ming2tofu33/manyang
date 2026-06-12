import type { DreamAnalysisResponse } from "@manyang/backend";
import { Pool, type PoolClient, type PoolConfig } from "pg";

import type { AccessPlan } from "@/lib/access-policy";
import {
  createCompletedDreamRecordFromDbRow,
  createDreamRecordInsertModels,
  type PersistCompletedDreamReadingInput,
} from "@/lib/manyang-dream-records";
import type { DreamCompletedPayload, DreamRecord } from "@/lib/dream-storage";
import type { MorningMoodRecord } from "@/lib/morning-mood";
import type { NightCheckInRecord } from "@/lib/night-checkin";
import type { PawprintInput, PawprintRecord, PawprintSaveResult, PawprintSource } from "@/lib/pawprints";
import type { DailyTarotReading, TarotSpread } from "@/lib/daily-tarot";
import type { ShareRecordKind } from "@/lib/share-records";
import { getSupabaseDatabaseUrl } from "@/lib/supabase/env";

let manyangPool: Pool | null = null;

export type PersistGuestBasicReadingUsageInput = {
  guestId: string;
  dreamDate: string;
};

export type PersistCompletedTarotReadingInput = {
  userId: string;
  reading: DailyTarotReading;
};

export type ReadingUsageFeatureKey = "dream_basic" | "dream_premium" | "tarot_one_card" | "tarot_three_card";

export type PersistAuditEventInput = {
  actorUserId?: string | null;
  targetUserId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
};

export type FeedbackSubjectType = "dream_reading" | "tarot_reading" | "archive_record" | "app_flow";

export type PersistFeedbackEventInput = {
  userId?: string | null;
  guestId?: string | null;
  subjectType: FeedbackSubjectType;
  subjectId?: string | null;
  rating?: number | null;
  feedbackText?: string | null;
  metadata?: Record<string, unknown>;
};

export type PersistSharedResultInput = {
  publicId: string;
  kind: ShareRecordKind;
  payload: Record<string, unknown>;
  userId?: string | null;
};

export type SharedResultRecord = {
  id: string;
  kind: ShareRecordKind;
  payload: Record<string, unknown>;
  createdAt: string;
};

export function createManyangDbPool(config: PoolConfig = {}): Pool {
  return new Pool({
    connectionString: getSupabaseDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ...config,
  });
}

export function getManyangDbPool(): Pool {
  manyangPool ??= createManyangDbPool();

  return manyangPool;
}

export async function hasCompletedBasicReadingForUserOnDate(
  userId: string,
  dreamDate: string,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query<{ has_completed_basic_reading: boolean }>(
    `
      select exists (
        select 1
        from manyang.dream_entries
        where user_id = $1
          and dream_date = $2::date
          and status = 'completed'
          and coalesce(cat_reader_type, 'black_cat') in ('black_cat', 'white_cat', 'cheese_cat')
      ) as has_completed_basic_reading
    `,
    [userId, dreamDate],
  );

  return result.rows[0]?.has_completed_basic_reading === true;
}

/**
 * 같은 유저가 같은 날 같은 꿈 텍스트로 이미 받은 해몽이 있으면 그 해몽을 그대로 돌려준다.
 * 같은 꿈 재제출(리롤)을 막아 "같은 꿈 → 같은 해몽"을 보장하고 재분석 비용을 아낀다.
 * 다른 날 같은 텍스트는 별개의 (재발) 꿈으로 보고 매치하지 않는다.
 */
export async function findCompletedReadingForUserDreamOnDate(
  userId: string,
  dreamDate: string,
  dreamText: string,
  pool = getManyangDbPool(),
): Promise<DreamAnalysisResponse | null> {
  const result = await pool.query<{ raw_analysis: DreamAnalysisResponse }>(
    `
      select dr.raw_analysis
      from manyang.dream_entries de
      join manyang.dream_readings dr on dr.dream_id = de.id
      where de.user_id = $1
        and de.dream_date = $2::date
        and de.status = 'completed'
        and de.dream_text = $3
      order by de.created_at desc
      limit 1
    `,
    [userId, dreamDate, dreamText],
  );

  return result.rows[0]?.raw_analysis ?? null;
}

export async function hasCompletedGuestBasicReadingOnDate(
  guestId: string,
  dreamDate: string,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query<{ has_completed_guest_basic_reading: boolean }>(
    `
      select exists (
        select 1
        from manyang.reading_usage
        where guest_id = $1::uuid
          and usage_date = $2::date
          and feature_key = 'dream_basic'
      ) or exists (
        select 1
        from manyang.guest_reading_usage
        where guest_id = $1::uuid
          and usage_date = $2::date
          and reading_kind = 'basic'
      ) as has_completed_guest_basic_reading
    `,
    [guestId, dreamDate],
  );

  return result.rows[0]?.has_completed_guest_basic_reading === true;
}

export async function persistGuestBasicReadingUsage(
  input: PersistGuestBasicReadingUsageInput,
  pool = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      insert into manyang.reading_usage (
        guest_id,
        usage_date,
        feature_key
      )
      values ($1::uuid, $2::date, 'dream_basic')
      on conflict on constraint reading_usage_identity_feature_date_unique do nothing
    `,
    [input.guestId, input.dreamDate],
  );

  await pool.query(
    `
      insert into manyang.guest_reading_usage (
        guest_id,
        usage_date,
        reading_kind
      )
      values ($1::uuid, $2::date, 'basic')
      on conflict (guest_id, usage_date, reading_kind) do nothing
    `,
    [input.guestId, input.dreamDate],
  );
}

export async function persistCompletedTarotReading(
  input: PersistCompletedTarotReadingInput,
  pool = getManyangDbPool(),
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
      insert into manyang.tarot_readings (
        user_id,
        app_date,
        spread,
        cards,
        title,
        overview,
        card_readings,
        advice,
        raw_reading
      )
      values ($1, $2::date, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9::jsonb)
      on conflict (user_id, app_date, spread) do update
        set cards = excluded.cards,
            title = excluded.title,
            overview = excluded.overview,
            card_readings = excluded.card_readings,
            advice = excluded.advice,
            raw_reading = excluded.raw_reading,
            updated_at = now()
      returning id
    `,
    [
      input.userId,
      input.reading.appDate,
      input.reading.spread,
      JSON.stringify(input.reading.cards ?? []),
      input.reading.generated?.title ?? input.reading.title,
      input.reading.generated?.overview ?? input.reading.message,
      JSON.stringify(input.reading.generated?.cardReadings ?? []),
      input.reading.generated?.advice ?? input.reading.advice,
      JSON.stringify(input.reading),
    ],
  );
  const tarotReadingId = result.rows[0]?.id;

  if (!tarotReadingId) {
    throw new Error("Failed to create manyang tarot reading");
  }

  return tarotReadingId;
}

/**
 * 같은 유저가 같은 날 같은 스프레드로 이미 받은 타로 리딩이 있으면 그대로 돌려준다.
 * 타로 리딩은 (user, app_date, spread)당 결정론적으로 1개이므로, 재요청 시 LLM을
 * 다시 부르지 않고 저장본을 반환해 비용을 아낀다(같은 날 → 같은 리딩).
 */
export async function findCompletedTarotReadingForUser(
  userId: string,
  appDate: string,
  spread: TarotSpread,
  pool = getManyangDbPool(),
): Promise<DailyTarotReading | null> {
  const result = await pool.query<{ raw_reading: DailyTarotReading }>(
    `
      select raw_reading
      from manyang.tarot_readings
      where user_id = $1
        and app_date = $2::date
        and spread = $3
      limit 1
    `,
    [userId, appDate, spread],
  );

  return result.rows[0]?.raw_reading ?? null;
}

export async function listTarotReadingsForUser(
  userId: string,
  pool = getManyangDbPool(),
): Promise<DailyTarotReading[]> {
  const result = await pool.query<{ raw_reading: DailyTarotReading }>(
    `
      select raw_reading
      from manyang.tarot_readings
      where user_id = $1
      order by app_date desc, created_at desc
      limit 120
    `,
    [userId],
  );

  return result.rows.map((row) => row.raw_reading);
}

function createSharedResultRecordFromDbRow(row: {
  public_id: string;
  kind: ShareRecordKind;
  payload: Record<string, unknown>;
  created_at: string;
}): SharedResultRecord {
  return {
    id: row.public_id,
    kind: row.kind,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

export async function persistSharedResult(
  input: PersistSharedResultInput,
  pool = getManyangDbPool(),
): Promise<SharedResultRecord> {
  const result = await pool.query<{
    public_id: string;
    kind: ShareRecordKind;
    payload: Record<string, unknown>;
    created_at: string;
  }>(
    `
      insert into manyang.shared_results (
        public_id,
        kind,
        payload,
        user_id
      )
      values ($1, $2, $3::jsonb, $4)
      returning
        public_id,
        kind,
        payload,
        created_at::text as created_at
    `,
    [input.publicId, input.kind, JSON.stringify(input.payload), input.userId ?? null],
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to create manyang shared result");
  }

  return createSharedResultRecordFromDbRow(row);
}

export async function findSharedResult(
  publicId: string,
  kind: ShareRecordKind,
  pool = getManyangDbPool(),
): Promise<SharedResultRecord | null> {
  const result = await pool.query<{
    public_id: string;
    kind: ShareRecordKind;
    payload: Record<string, unknown>;
    created_at: string;
  }>(
    `
      select
        public_id,
        kind,
        payload,
        created_at::text as created_at
      from manyang.shared_results
      where public_id = $1
        and kind = $2
        and (expires_at is null or expires_at > now())
      limit 1
    `,
    [publicId, kind],
  );

  return result.rows[0] ? createSharedResultRecordFromDbRow(result.rows[0]) : null;
}

export async function isAdminUser(userId: string, pool = getManyangDbPool()): Promise<boolean> {
  const result = await pool.query<{ is_admin: boolean }>(
    `
      select exists (
        select 1
        from manyang.profiles
        where user_id = $1
          and role = 'admin'
      ) as is_admin
    `,
    [userId],
  );

  return result.rows[0]?.is_admin === true;
}

export async function getActiveSubscriptionPlanForUser(
  userId: string,
  pool = getManyangDbPool(),
): Promise<Extract<AccessPlan, "moon_pass"> | null> {
  const result = await pool.query<{ plan_key: Extract<AccessPlan, "moon_pass"> }>(
    `
      select plan_key
      from manyang.subscriptions
      where user_id = $1
        and plan_key = 'moon_pass'
        and (
          status in ('active', 'trialing')
          or (
            status = 'canceled'
            and cancel_at_period_end = true
            and current_period_end is not null
            and current_period_end > now()
          )
        )
      order by current_period_end desc nulls last, updated_at desc
      limit 1
    `,
    [userId],
  );

  return result.rows[0]?.plan_key ?? null;
}

export async function hasReadingUsageForUserOnDate(
  userId: string,
  usageDate: string,
  featureKey: ReadingUsageFeatureKey,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query<{ has_usage: boolean }>(
    `
      select exists (
        select 1
        from manyang.reading_usage
        where user_id = $1
          and usage_date = $2::date
          and feature_key = $3
      ) as has_usage
    `,
    [userId, usageDate, featureKey],
  );

  return result.rows[0]?.has_usage === true;
}

export async function hasReadingUsageForGuestOnDate(
  guestId: string,
  usageDate: string,
  featureKey: ReadingUsageFeatureKey,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query<{ has_usage: boolean }>(
    `
      select exists (
        select 1
        from manyang.reading_usage
        where guest_id = $1::uuid
          and usage_date = $2::date
          and feature_key = $3
      ) as has_usage
    `,
    [guestId, usageDate, featureKey],
  );

  return result.rows[0]?.has_usage === true;
}

export async function incrementReadingUsageForUser(
  userId: string,
  usageDate: string,
  featureKey: ReadingUsageFeatureKey,
  pool = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      insert into manyang.reading_usage (
        user_id,
        usage_date,
        feature_key
      )
      values ($1, $2::date, $3)
      on conflict on constraint reading_usage_identity_feature_date_unique do update
        set usage_count = manyang.reading_usage.usage_count + 1,
            updated_at = now()
    `,
    [userId, usageDate, featureKey],
  );
}

export async function incrementReadingUsageForGuest(
  guestId: string,
  usageDate: string,
  featureKey: ReadingUsageFeatureKey,
  pool = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      insert into manyang.reading_usage (
        guest_id,
        usage_date,
        feature_key
      )
      values ($1::uuid, $2::date, $3)
      on conflict on constraint reading_usage_identity_feature_date_unique do update
        set usage_count = manyang.reading_usage.usage_count + 1,
            updated_at = now()
    `,
    [guestId, usageDate, featureKey],
  );
}

export async function persistAuditEvent(
  input: PersistAuditEventInput,
  pool = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      insert into manyang.audit_events (
        actor_user_id,
        target_user_id,
        event_type,
        metadata
      )
      values ($1, $2, $3, $4::jsonb)
    `,
    [
      input.actorUserId ?? null,
      input.targetUserId ?? null,
      input.eventType,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function persistFeedbackEvent(
  input: PersistFeedbackEventInput,
  pool = getManyangDbPool(),
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
      insert into manyang.feedback_events (
        user_id,
        guest_id,
        subject_type,
        subject_id,
        rating,
        feedback_text,
        metadata
      )
      values ($1, $2::uuid, $3, $4, $5, $6, $7::jsonb)
      returning id
    `,
    [
      input.userId ?? null,
      input.guestId ?? null,
      input.subjectType,
      input.subjectId ?? null,
      input.rating ?? null,
      input.feedbackText ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  const feedbackId = result.rows[0]?.id;

  if (!feedbackId) {
    throw new Error("Failed to create manyang feedback event");
  }

  return feedbackId;
}

async function withTransaction<T>(pool: Pool, run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function persistCompletedDreamReading(
  input: PersistCompletedDreamReadingInput,
  pool = getManyangDbPool(),
): Promise<string> {
  const rows = createDreamRecordInsertModels(input);

  return withTransaction(pool, async (client) => {
    await client.query(
      `
        insert into manyang.profiles (user_id)
        values ($1)
        on conflict (user_id) do nothing
      `,
      [input.userId],
    );

    const entryResult = await client.query<{ id: string }>(
      `
        insert into manyang.dream_entries (
          user_id,
          dream_text,
          dream_date,
          cat_reader_type,
          wake_mood,
          dream_atmospheres,
          dream_sensations,
          dream_sensation_other,
          status,
          source
        )
        values ($1, $2, $3::date, $4, $5, $6::text[], $7::text[], $8, $9, $10)
        returning id
      `,
      [
        rows.entry.user_id,
        rows.entry.dream_text,
        rows.entry.dream_date,
        rows.entry.cat_reader_type ?? null,
        rows.entry.wake_mood ?? null,
        rows.entry.dream_atmospheres,
        rows.entry.dream_sensations,
        rows.entry.dream_sensation_other ?? null,
        rows.entry.status,
        rows.entry.source,
      ],
    );
    const dreamId = entryResult.rows[0]?.id;

    if (!dreamId) {
      throw new Error("Failed to create manyang dream entry");
    }

    await client.query(
      `
        insert into manyang.dream_readings (
          dream_id,
          user_id,
          analysis_id,
          summary,
          interpretation,
          small_prescription,
          reader,
          symbols,
          emotions,
          themes,
          symbol_readings,
          reading_basis,
          reader_note,
          safety_notice,
          raw_analysis
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::text[], $9::text[], $10::text[], $11::jsonb, $12::jsonb, $13, $14, $15::jsonb)
      `,
      [
        dreamId,
        rows.reading.user_id,
        rows.reading.analysis_id,
        rows.reading.summary,
        rows.reading.interpretation,
        rows.reading.small_prescription,
        JSON.stringify(rows.reading.reader),
        rows.reading.symbols,
        rows.reading.emotions,
        rows.reading.themes,
        JSON.stringify(rows.reading.symbol_readings),
        JSON.stringify(rows.reading.reading_basis),
        rows.reading.reader_note ?? null,
        rows.reading.safety_notice ?? null,
        JSON.stringify(rows.reading.raw_analysis),
      ],
    );

    await client.query(
      `
        insert into manyang.dream_cards (
          dream_id,
          user_id,
          card_id,
          card_name,
          card_type,
          card_keywords,
          card_summary,
          card_message,
          card_theme
        )
        values ($1, $2, $3, $4, $5, $6::text[], $7, $8, $9)
      `,
      [
        dreamId,
        rows.card.user_id,
        rows.card.card_id,
        rows.card.card_name,
        rows.card.card_type,
        rows.card.card_keywords,
        rows.card.card_summary,
        rows.card.card_message,
        rows.card.card_theme,
      ],
    );

    for (const symbol of rows.symbolHistory) {
      await client.query(
        `
          insert into manyang.user_symbol_history (
            user_id,
            symbol,
            related_emotions,
            related_themes
          )
          values ($1, $2, $3::text[], $4::text[])
          on conflict (user_id, symbol) do update
            set count = manyang.user_symbol_history.count + 1,
                last_seen_at = now(),
                related_emotions = excluded.related_emotions,
                related_themes = excluded.related_themes,
                updated_at = now()
        `,
        [symbol.user_id, symbol.symbol, symbol.related_emotions, symbol.related_themes],
      );
    }

    return dreamId;
  });
}

export async function listDreamRecordsForUser(userId: string, pool = getManyangDbPool()): Promise<DreamRecord[]> {
  const result = await pool.query<{
    id: string;
    saved_at: string;
    dream_text: string;
    dream_date: string;
    cat_reader_type?: DreamRecord["catReaderType"] | null;
    wake_mood?: string | null;
    dream_atmospheres: string[];
    dream_sensations: string[];
    dream_sensation_other?: string | null;
    raw_analysis: DreamCompletedPayload["analysis"];
  }>(
    `
      select
        de.id,
        de.created_at::text as saved_at,
        de.dream_text,
        to_char(de.dream_date, 'YYYY-MM-DD') as dream_date,
        de.cat_reader_type,
        de.wake_mood,
        de.dream_atmospheres,
        de.dream_sensations,
        de.dream_sensation_other,
        dr.raw_analysis
      from manyang.dream_entries de
      join manyang.dream_readings dr on dr.dream_id = de.id
      where de.user_id = $1
        and de.status = 'completed'
      order by de.dream_date desc, de.created_at desc
      limit 100
    `,
    [userId],
  );

  return result.rows.map((row) => createCompletedDreamRecordFromDbRow(row));
}

export async function deleteDreamRecordForUser(
  userId: string,
  dreamId: string,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query(
    `
      delete from manyang.dream_entries
      where id = $1
        and user_id = $2
    `,
    [dreamId, userId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteAllProductRecordsForUser(userId: string, pool = getManyangDbPool()): Promise<void> {
  await withTransaction(pool, async (client) => {
    await client.query("delete from manyang.dream_entries where user_id = $1", [userId]);
    await client.query("delete from manyang.user_symbol_history where user_id = $1", [userId]);
    await client.query("delete from manyang.pawprints where user_id = $1", [userId]);
    await client.query("delete from manyang.morning_checkins where user_id = $1", [userId]);
    await client.query("delete from manyang.night_checkins where user_id = $1", [userId]);
    await client.query("delete from manyang.tarot_readings where user_id = $1", [userId]);
    await client.query("delete from manyang.reading_usage where user_id = $1", [userId]);
  });
}

export type PersistPawprintForUserInput = PawprintInput & {
  userId: string;
};

export type PersistMorningCheckInForUserInput = MorningMoodRecord & {
  userId: string;
};

export type PersistNightCheckInForUserInput = Omit<NightCheckInRecord, "savedAt"> & {
  userId: string;
};

function createPawprintRecordFromDbRow(row: {
  id: string;
  app_date: string;
  source: PawprintSource;
  source_id: string;
  created_at: string;
}): PawprintRecord {
  return {
    id: row.id,
    appDate: row.app_date,
    source: row.source,
    sourceId: row.source_id,
    createdAt: row.created_at,
  };
}

function createNightCheckInRecordFromDbRow(row: {
  check_in_date: string;
  mood_id: string;
  mood_label: string;
  condition_id: string;
  condition_label: string;
  note: string | null;
  created_at: string;
}): NightCheckInRecord {
  return {
    checkInDate: row.check_in_date,
    moodId: row.mood_id,
    moodLabel: row.mood_label,
    conditionId: row.condition_id,
    conditionLabel: row.condition_label,
    note: row.note ?? "",
    savedAt: row.created_at,
  };
}

function createMorningMoodRecordFromDbRow(row: {
  id: string;
  mood_date: string;
  mood: string;
  mood_color: string;
  body_feeling: string;
  thought: string;
  created_at: string;
}): MorningMoodRecord {
  return {
    id: row.id,
    moodDate: row.mood_date,
    mood: row.mood,
    moodColor: row.mood_color,
    bodyFeeling: row.body_feeling,
    thought: row.thought,
    savedAt: row.created_at,
  };
}

export async function listPawprintsForUser(userId: string, pool = getManyangDbPool()): Promise<PawprintRecord[]> {
  const result = await pool.query<{
    id: string;
    app_date: string;
    source: PawprintSource;
    source_id: string;
    created_at: string;
  }>(
    `
      select
        id,
        to_char(app_date, 'YYYY-MM-DD') as app_date,
        source,
        source_id,
        created_at::text as created_at
      from manyang.pawprints
      where user_id = $1
      order by app_date desc, created_at desc
      limit 120
    `,
    [userId],
  );

  return result.rows.map((row) => createPawprintRecordFromDbRow(row));
}

export async function persistPawprintForUser(
  input: PersistPawprintForUserInput,
  pool = getManyangDbPool(),
): Promise<PawprintSaveResult> {
  const inserted = await pool.query<{
    id: string;
    app_date: string;
    source: PawprintSource;
    source_id: string;
    created_at: string;
  }>(
    `
      insert into manyang.pawprints (
        user_id,
        app_date,
        source,
        source_id
      )
      values ($1, $2::date, $3, $4)
      on conflict on constraint pawprints_user_app_source_unique do nothing
      returning
        id,
        to_char(app_date, 'YYYY-MM-DD') as app_date,
        source,
        source_id,
        created_at::text as created_at
    `,
    [input.userId, input.appDate, input.source, input.sourceId],
  );

  const insertedRecord = inserted.rows[0];

  if (insertedRecord) {
    return {
      created: true,
      record: createPawprintRecordFromDbRow(insertedRecord),
    };
  }

  const existing = await pool.query<{
    id: string;
    app_date: string;
    source: PawprintSource;
    source_id: string;
    created_at: string;
  }>(
    `
      select
        id,
        to_char(app_date, 'YYYY-MM-DD') as app_date,
        source,
        source_id,
        created_at::text as created_at
      from manyang.pawprints
      where user_id = $1
        and app_date = $2::date
        and source = $3
        and source_id = $4
      limit 1
    `,
    [input.userId, input.appDate, input.source, input.sourceId],
  );
  const existingRecord = existing.rows[0];

  if (!existingRecord) {
    throw new Error("Failed to create or load manyang pawprint");
  }

  return {
    created: false,
    record: createPawprintRecordFromDbRow(existingRecord),
  };
}

export async function listMorningCheckInsForUser(
  userId: string,
  pool = getManyangDbPool(),
): Promise<MorningMoodRecord[]> {
  const result = await pool.query<{
    id: string;
    mood_date: string;
    mood: string;
    mood_color: string;
    body_feeling: string;
    thought: string;
    created_at: string;
  }>(
    `
      select
        id,
        to_char(mood_date, 'YYYY-MM-DD') as mood_date,
        mood,
        mood_color,
        body_feeling,
        thought,
        created_at::text as created_at
      from manyang.morning_checkins
      where user_id = $1
      order by mood_date desc, created_at desc
      limit 120
    `,
    [userId],
  );

  return result.rows.map((row) => createMorningMoodRecordFromDbRow(row));
}

export async function persistMorningCheckInForUser(
  input: PersistMorningCheckInForUserInput,
  pool = getManyangDbPool(),
): Promise<MorningMoodRecord> {
  const result = await pool.query<{
    id: string;
    mood_date: string;
    mood: string;
    mood_color: string;
    body_feeling: string;
    thought: string;
    created_at: string;
  }>(
    `
      insert into manyang.morning_checkins (
        user_id,
        mood_date,
        mood,
        mood_color,
        body_feeling,
        thought
      )
      values ($1, $2::date, $3, $4, $5, $6)
      on conflict on constraint morning_checkins_user_mood_date_unique do update
        set mood = excluded.mood,
            mood_color = excluded.mood_color,
            body_feeling = excluded.body_feeling,
            thought = excluded.thought,
            updated_at = now()
      returning
        id,
        to_char(mood_date, 'YYYY-MM-DD') as mood_date,
        mood,
        mood_color,
        body_feeling,
        thought,
        created_at::text as created_at
    `,
    [input.userId, input.moodDate, input.mood, input.moodColor, input.bodyFeeling, input.thought],
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to create manyang morning check-in");
  }

  return createMorningMoodRecordFromDbRow(row);
}

export async function listNightCheckInsForUser(
  userId: string,
  pool = getManyangDbPool(),
): Promise<NightCheckInRecord[]> {
  const result = await pool.query<{
    check_in_date: string;
    mood_id: string;
    mood_label: string;
    condition_id: string;
    condition_label: string;
    note: string | null;
    created_at: string;
  }>(
    `
      select
        to_char(check_in_date, 'YYYY-MM-DD') as check_in_date,
        mood_id,
        mood_label,
        condition_id,
        condition_label,
        note,
        created_at::text as created_at
      from manyang.night_checkins
      where user_id = $1
      order by check_in_date desc, created_at desc
      limit 120
    `,
    [userId],
  );

  return result.rows.map((row) => createNightCheckInRecordFromDbRow(row));
}

export async function persistNightCheckInForUser(
  input: PersistNightCheckInForUserInput,
  pool = getManyangDbPool(),
): Promise<NightCheckInRecord> {
  const result = await pool.query<{
    check_in_date: string;
    mood_id: string;
    mood_label: string;
    condition_id: string;
    condition_label: string;
    note: string | null;
    created_at: string;
  }>(
    `
      insert into manyang.night_checkins (
        user_id,
        check_in_date,
        mood_id,
        mood_label,
        condition_id,
        condition_label,
        note
      )
      values ($1, $2::date, $3, $4, $5, $6, $7)
      on conflict on constraint night_checkins_user_check_in_date_unique do update
        set mood_id = excluded.mood_id,
            mood_label = excluded.mood_label,
            condition_id = excluded.condition_id,
            condition_label = excluded.condition_label,
            note = excluded.note,
            created_at = now()
      returning
        to_char(check_in_date, 'YYYY-MM-DD') as check_in_date,
        mood_id,
        mood_label,
        condition_id,
        condition_label,
        note,
        created_at::text as created_at
    `,
    [
      input.userId,
      input.checkInDate,
      input.moodId,
      input.moodLabel,
      input.conditionId,
      input.conditionLabel,
      input.note,
    ],
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to create manyang night check-in");
  }

  return createNightCheckInRecordFromDbRow(row);
}
