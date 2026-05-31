import { Pool, type PoolClient, type PoolConfig } from "pg";

import {
  createCompletedDreamRecordFromDbRow,
  createDreamRecordInsertModels,
  type PersistCompletedDreamReadingInput,
} from "@/lib/manyang-dream-records";
import type { DreamCompletedPayload, DreamRecord } from "@/lib/dream-storage";
import type { NightCheckInRecord } from "@/lib/night-checkin";
import type { PawprintInput, PawprintRecord, PawprintSaveResult, PawprintSource } from "@/lib/pawprints";
import { getSupabaseDatabaseUrl } from "@/lib/supabase/env";

let manyangPool: Pool | null = null;

export type PersistGuestBasicReadingUsageInput = {
  guestId: string;
  dreamDate: string;
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

export async function hasCompletedGuestBasicReadingOnDate(
  guestId: string,
  dreamDate: string,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query<{ has_completed_guest_basic_reading: boolean }>(
    `
      select exists (
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

export type PersistPawprintForUserInput = PawprintInput & {
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
