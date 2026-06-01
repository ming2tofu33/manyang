# Manyang Database Schema Rollout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the complete first-phase and second-phase Manyang database schema so authenticated users can sync all meaningful records and the app has a durable foundation for usage limits, subscriptions, admin audit, and feedback.

**Architecture:** Keep user-owned product data in the `manyang` schema with RLS enabled on every multi-tenant table. Add missing first-phase persistence for morning check-ins, then add second-phase operational tables for unified usage, subscriptions, audit events, and feedback. Preserve existing localStorage guest behavior and introduce server sync incrementally through focused API routes and hooks.

**Tech Stack:** Supabase Postgres, Next.js App Router, TypeScript, `pg`, Vitest, existing `manyang-db` server data layer, existing localStorage record helpers.

---

## Design Principles

- Store only durable user records in Postgres: dreams, readings, morning records, night records, tarot, usage, subscription state, feedback, and admin audit.
- Keep static content in code/files: dream encyclopedia, tarot card definitions, cat reader metadata, assets, and generated search indexes.
- Enable RLS on every user-owned table.
- Index every `user_id` and date column used by API queries and RLS policies.
- Use idempotent migrations with `create table if not exists`, `create index if not exists`, and `do $$ ... $$` blocks for constraints/policies.
- Prefer JSONB for LLM output payloads that may evolve, but keep frequently filtered fields as normal columns.
- Keep guest local records local by default. Add server-side guest usage only where abuse prevention needs it.

---

## Target Schema

### Existing First-Phase Tables

- `manyang.profiles`
- `manyang.dream_entries`
- `manyang.dream_readings`
- `manyang.dream_cards`
- `manyang.user_symbol_history`
- `manyang.pawprints`
- `manyang.dream_seeds`
- `manyang.guest_reading_usage`
- `manyang.night_checkins`
- `manyang.tarot_readings`

### New First-Phase Table

- `manyang.morning_checkins`

### New Second-Phase Tables

- `manyang.reading_usage`
- `manyang.subscriptions`
- `manyang.audit_events`
- `manyang.feedback_events`

---

## Task 1: Add Morning Check-Ins Schema

**Files:**
- Create: `supabase/migrations/20260601000100_create_morning_checkins.sql`
- Test: `frontend/src/lib/manyang-routine-schema.test.ts`

**Step 1: Write the failing schema test**

Add assertions that the migration SQL contains:

```ts
expect(sql).toContain("create table if not exists manyang.morning_checkins");
expect(sql).toContain("alter table manyang.morning_checkins enable row level security");
expect(sql).toContain("morning_checkins_user_mood_date_unique");
expect(sql).toContain("morning_checkins_user_date_idx");
```

**Step 2: Run the focused test**

```bash
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts
```

Expected: fail because the migration does not exist or is not referenced.

**Step 3: Create the migration**

```sql
create table if not exists manyang.morning_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_date date not null,
  mood text not null check (char_length(trim(mood)) between 1 and 80),
  mood_color text not null check (char_length(trim(mood_color)) between 1 and 40),
  body_feeling text not null check (char_length(trim(body_feeling)) between 1 and 80),
  thought text not null default '' check (char_length(thought) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint morning_checkins_user_mood_date_unique unique (user_id, mood_date)
);

create index if not exists morning_checkins_user_date_idx
  on manyang.morning_checkins (user_id, mood_date desc, created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_morning_checkins_updated_at') then
    create trigger set_morning_checkins_updated_at
    before update on manyang.morning_checkins
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.morning_checkins enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_select_own') then
    create policy morning_checkins_select_own on manyang.morning_checkins for select using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_insert_own') then
    create policy morning_checkins_insert_own on manyang.morning_checkins for insert with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_update_own') then
    create policy morning_checkins_update_own on manyang.morning_checkins for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_delete_own') then
    create policy morning_checkins_delete_own on manyang.morning_checkins for delete using (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select, insert, update, delete on manyang.morning_checkins to authenticated, service_role;
```

**Step 4: Run the focused test**

```bash
npm --prefix frontend test -- src/lib/manyang-routine-schema.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add supabase/migrations/20260601000100_create_morning_checkins.sql frontend/src/lib/manyang-routine-schema.test.ts
git commit -m "feat(db): add morning check-ins schema"
```

---

## Task 2: Persist Morning Check-Ins on the Server

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/lib/morning-mood.ts`
- Test: `frontend/src/lib/server/manyang-db.test.ts`
- Test: `frontend/src/lib/morning-mood.test.ts`

**Step 1: Add server data layer tests**

Add tests for:

- `listMorningCheckInsForUser(userId)` orders by `mood_date desc`.
- `persistMorningCheckInForUser(input)` upserts by `(user_id, mood_date)`.
- `persistMorningCheckInForUser(input)` returns the normalized record.

**Step 2: Implement types**

Add:

```ts
export type PersistMorningCheckInForUserInput = MorningMoodRecord & {
  userId: string;
};
```

**Step 3: Implement DB functions**

Add:

- `createMorningMoodRecordFromDbRow`
- `listMorningCheckInsForUser`
- `persistMorningCheckInForUser`

Use:

```sql
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
  created_at::text as created_at;
```

**Step 4: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts src/lib/morning-mood.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts frontend/src/lib/morning-mood.ts frontend/src/lib/morning-mood.test.ts
git commit -m "feat(db): persist morning check-ins"
```

---

## Task 3: Add Morning Check-In API Route

**Files:**
- Create: `frontend/src/app/api/morning-checkins/route.ts`
- Create: `frontend/src/app/api/morning-checkins/route.test.ts`
- Modify: `frontend/src/lib/routine-record-api.ts`
- Test: `frontend/src/lib/routine-record-api.test.ts`

**Step 1: Write route tests**

Cover:

- unauthenticated `GET` returns `401`
- authenticated `GET` returns morning check-ins
- unauthenticated `POST` returns `401`
- authenticated `POST` upserts one record
- invalid body returns `400`

**Step 2: Implement route**

Use `getAuthenticatedUserId()`.

Expose:

- `GET /api/morning-checkins`
- `POST /api/morning-checkins`

Validate:

- `moodDate` is `YYYY-MM-DD`
- `thought` length is `<= 80`
- required labels are non-empty strings

**Step 3: Add client helper**

In `routine-record-api.ts`, add:

- `fetchMorningCheckIns`
- `saveMorningCheckIn`

**Step 4: Run focused tests**

```bash
npm --prefix frontend test -- src/app/api/morning-checkins/route.test.ts src/lib/routine-record-api.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/app/api/morning-checkins/route.ts frontend/src/app/api/morning-checkins/route.test.ts frontend/src/lib/routine-record-api.ts frontend/src/lib/routine-record-api.test.ts
git commit -m "feat(api): add morning check-in endpoints"
```

---

## Task 4: Sync Morning Check-Ins in the UI

**Files:**
- Modify: `frontend/src/components/morning-mood-form.tsx`
- Modify: `frontend/src/lib/use-routine-records.ts`
- Modify: `frontend/src/lib/archive-record-view.ts`
- Test: `frontend/src/components/morning-mood-form.test.tsx`
- Test: `frontend/src/lib/use-routine-records.test.ts`
- Test: `frontend/src/lib/archive-record-view.test.ts`

**Step 1: Update tests**

Cover:

- guests save morning records locally only
- authenticated users save locally and attempt server sync
- archive detail can show server-backed morning check-in details
- server records are preferred when available

**Step 2: Update `use-routine-records`**

Include server-backed morning check-ins alongside pawprints and night check-ins.

**Step 3: Update archive view model**

Create morning record detail from `morning_checkins` when available. Keep `pawprints` as lightweight timeline markers.

**Step 4: Run focused tests**

```bash
npm --prefix frontend test -- src/components/morning-mood-form.test.tsx src/lib/use-routine-records.test.ts src/lib/archive-record-view.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/components/morning-mood-form.tsx frontend/src/lib/use-routine-records.ts frontend/src/lib/archive-record-view.ts frontend/src/components/morning-mood-form.test.tsx frontend/src/lib/use-routine-records.test.ts frontend/src/lib/archive-record-view.test.ts
git commit -m "feat(archive): sync morning check-ins"
```

---

## Task 5: Add Unified Reading Usage Schema

**Files:**
- Create: `supabase/migrations/20260601000200_create_reading_usage.sql`
- Test: `frontend/src/lib/manyang-schema.test.ts`

**Step 1: Write the failing schema test**

Assert migration contains:

```ts
expect(sql).toContain("create table if not exists manyang.reading_usage");
expect(sql).toContain("reading_usage_identity_check");
expect(sql).toContain("reading_usage_identity_feature_date_unique");
expect(sql).toContain("reading_usage_user_date_idx");
expect(sql).toContain("reading_usage_guest_date_idx");
```

**Step 2: Create migration**

```sql
create table if not exists manyang.reading_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id uuid,
  usage_date date not null,
  feature_key text not null check (feature_key in ('dream_basic', 'dream_premium', 'tarot_one_card', 'tarot_three_card')),
  usage_count integer not null default 1 check (usage_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_usage_identity_check check (
    (user_id is not null and guest_id is null) or
    (user_id is null and guest_id is not null)
  ),
  constraint reading_usage_identity_feature_date_unique unique (user_id, guest_id, usage_date, feature_key)
);
```

Add indexes:

```sql
create index if not exists reading_usage_user_date_idx
  on manyang.reading_usage (user_id, usage_date desc, feature_key)
  where user_id is not null;

create index if not exists reading_usage_guest_date_idx
  on manyang.reading_usage (guest_id, usage_date desc, feature_key)
  where guest_id is not null;
```

Add trigger, RLS, policies:

- users can select own `user_id` rows
- users can insert own `user_id` rows
- service role has full access
- guest rows are service-role only

**Step 3: Keep old table for compatibility**

Do not delete `guest_reading_usage` in this task. New code can dual-write or read from `reading_usage`; removal should be a later migration after production data is migrated.

**Step 4: Commit**

```bash
git add supabase/migrations/20260601000200_create_reading_usage.sql frontend/src/lib/manyang-schema.test.ts
git commit -m "feat(db): add unified reading usage schema"
```

---

## Task 6: Use Unified Reading Usage in Access Checks

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Test: `frontend/src/lib/server/manyang-db.test.ts`
- Test: `frontend/src/app/api/dreams/analyze/route.test.ts`
- Test: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Add DB helpers**

Add:

- `hasReadingUsageForUserOnDate`
- `hasReadingUsageForGuestOnDate`
- `incrementReadingUsageForUser`
- `incrementReadingUsageForGuest`

Use `insert ... on conflict ... do update set usage_count = manyang.reading_usage.usage_count + 1`.

**Step 2: Migrate dream usage checks**

Replace or wrap:

- `hasCompletedGuestBasicReadingOnDate`
- `persistGuestBasicReadingUsage`
- `hasCompletedBasicReadingForUserOnDate`

Keep compatibility fallbacks to old tables until old data is migrated.

**Step 3: Migrate tarot usage checks**

Use `reading_usage` for `tarot_three_card` limits if needed. Do not block one-card tarot unless product rules require it.

**Step 4: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/server/manyang-db.test.ts src/app/api/dreams/analyze/route.test.ts src/app/api/tarot/readings/route.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/tarot/readings/route.ts frontend/src/lib/server/manyang-db.test.ts frontend/src/app/api/dreams/analyze/route.test.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(access): use unified reading usage"
```

---

## Task 7: Add Subscription Schema

**Files:**
- Create: `supabase/migrations/20260601000300_create_subscriptions.sql`
- Test: `frontend/src/lib/manyang-schema.test.ts`

**Step 1: Write schema test**

Assert:

```ts
expect(sql).toContain("create table if not exists manyang.subscriptions");
expect(sql).toContain("subscriptions_user_provider_unique");
expect(sql).toContain("subscriptions_provider_subscription_unique");
```

**Step 2: Create migration**

```sql
create table if not exists manyang.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  plan_key text not null check (plan_key in ('moon_pass')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw_subscription jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_provider_unique unique (user_id, provider)
);
```

Add provider subscription uniqueness safely:

```sql
create unique index if not exists subscriptions_provider_subscription_unique
  on manyang.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
```

Add index:

```sql
create index if not exists subscriptions_user_status_idx
  on manyang.subscriptions (user_id, status, current_period_end desc);
```

Add RLS:

- users can select own subscriptions
- only service role can insert/update/delete

**Step 3: Commit**

```bash
git add supabase/migrations/20260601000300_create_subscriptions.sql frontend/src/lib/manyang-schema.test.ts
git commit -m "feat(db): add subscription schema"
```

---

## Task 8: Read Subscription State for Access Plan

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/app/api/access-context/route.ts`
- Modify: `frontend/src/lib/access-policy.ts`
- Test: `frontend/src/app/api/access-context/route.test.ts`
- Test: `frontend/src/lib/access-policy.test.ts`

**Step 1: Add tests**

Cover:

- active `moon_pass` subscription returns `moon_pass`
- canceled but still within `current_period_end` returns `moon_pass`
- expired/canceled subscription falls back to profile access plan
- admin still bypasses access gates

**Step 2: Add DB helper**

Add:

- `getActiveSubscriptionPlanForUser(userId)`

Use statuses:

- active
- trialing
- canceled with `current_period_end > now()` only if `cancel_at_period_end = true`

**Step 3: Update access context**

Resolve in this order:

1. admin role bypass
2. active subscription
3. profile `access_plan`
4. default `free_account`

**Step 4: Commit**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/app/api/access-context/route.ts frontend/src/lib/access-policy.ts frontend/src/app/api/access-context/route.test.ts frontend/src/lib/access-policy.test.ts
git commit -m "feat(access): derive plan from subscriptions"
```

---

## Task 9: Add Audit Events Schema

**Files:**
- Create: `supabase/migrations/20260601000400_create_audit_events.sql`
- Test: `frontend/src/lib/manyang-schema.test.ts`

**Step 1: Create migration**

```sql
create table if not exists manyang.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(trim(event_type)) between 1 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_actor_created_idx
  on manyang.audit_events (actor_user_id, created_at desc);

create index if not exists audit_events_target_created_idx
  on manyang.audit_events (target_user_id, created_at desc);

create index if not exists audit_events_type_created_idx
  on manyang.audit_events (event_type, created_at desc);

alter table manyang.audit_events enable row level security;

grant select, insert, update, delete on manyang.audit_events to service_role;
```

Do not grant authenticated direct access yet.

**Step 2: Commit**

```bash
git add supabase/migrations/20260601000400_create_audit_events.sql frontend/src/lib/manyang-schema.test.ts
git commit -m "feat(db): add audit events schema"
```

---

## Task 10: Log Admin and Billing Audit Events

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Test: `frontend/src/lib/server/manyang-db.test.ts`

**Step 1: Add DB helper**

Add:

- `persistAuditEvent`

**Step 2: Use it only where events already exist**

Initial event types:

- `profile.role_changed`
- `subscription.updated`
- `subscription.deleted`
- `admin.access_checked`

Do not add a full admin UI in this task.

**Step 3: Commit**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts
git commit -m "feat(admin): add audit event persistence"
```

---

## Task 11: Add Feedback Events Schema

**Files:**
- Create: `supabase/migrations/20260601000500_create_feedback_events.sql`
- Test: `frontend/src/lib/manyang-schema.test.ts`

**Step 1: Create migration**

```sql
create table if not exists manyang.feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  guest_id uuid,
  subject_type text not null check (subject_type in ('dream_reading', 'tarot_reading', 'archive_record', 'app_flow')),
  subject_id text,
  rating integer check (rating between 1 and 5),
  feedback_text text check (feedback_text is null or char_length(feedback_text) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint feedback_events_identity_check check (
    user_id is not null or guest_id is not null
  )
);

create index if not exists feedback_events_user_created_idx
  on manyang.feedback_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists feedback_events_subject_created_idx
  on manyang.feedback_events (subject_type, subject_id, created_at desc);

alter table manyang.feedback_events enable row level security;
```

RLS:

- authenticated users can insert feedback with their own `user_id`
- authenticated users can select their own feedback
- service role has full access
- guest feedback should go through server route only

**Step 2: Commit**

```bash
git add supabase/migrations/20260601000500_create_feedback_events.sql frontend/src/lib/manyang-schema.test.ts
git commit -m "feat(db): add feedback events schema"
```

---

## Task 12: Add Feedback API and Minimal UI Hook

**Files:**
- Create: `frontend/src/app/api/feedback/route.ts`
- Create: `frontend/src/app/api/feedback/route.test.ts`
- Create: `frontend/src/lib/feedback-api.ts`
- Create: `frontend/src/lib/feedback-api.test.ts`
- Modify only one user-facing surface initially, preferably `frontend/src/components/dream-result-receipt.tsx`

**Step 1: Add route tests**

Cover:

- accepts authenticated feedback
- accepts guest feedback with `guestId`
- rejects missing identity
- rejects invalid subject type
- rejects too-long text

**Step 2: Implement API**

Use `persistFeedbackEvent`.

**Step 3: Add minimal UI**

Add a compact rating/helpfulness control to dream receipt only. Avoid broad UI rollout until the data path is verified.

**Step 4: Commit**

```bash
git add frontend/src/app/api/feedback/route.ts frontend/src/app/api/feedback/route.test.ts frontend/src/lib/feedback-api.ts frontend/src/lib/feedback-api.test.ts frontend/src/components/dream-result-receipt.tsx
git commit -m "feat(feedback): collect dream reading feedback"
```

---

## Task 13: Apply Migrations to Supabase

**Files:**
- No code changes.

**Step 1: Apply migrations in order**

Use Supabase SQL Editor or the existing local DB connection flow.

Order:

1. `20260601000100_create_morning_checkins.sql`
2. `20260601000200_create_reading_usage.sql`
3. `20260601000300_create_subscriptions.sql`
4. `20260601000400_create_audit_events.sql`
5. `20260601000500_create_feedback_events.sql`

**Step 2: Verify tables**

Run:

```sql
select table_name
from information_schema.tables
where table_schema = 'manyang'
order by table_name;
```

Expected new table count: 15.

**Step 3: Verify RLS**

Run:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'manyang'
order by tablename;
```

Expected: all app tables have RLS enabled.

---

## Task 14: Full Verification

**Commands:**

```bash
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

**Manual checks:**

- Guest can still create local dream, morning, and night records.
- Logged-in user can create a morning record and see it after refresh.
- Logged-in user can create a night check-in and see it after refresh.
- Logged-in user can create a dream reading and see it in archive.
- Logged-in user can open `/archive/records`.
- Admin user still receives admin access context.
- Google login still returns to `/archive`.

**Final commit if needed:**

```bash
git status --short
git log --oneline -10
```

---

## Rollout Notes

- Do not delete `guest_reading_usage` until `reading_usage` has been deployed and verified.
- Do not wire Stripe webhooks in this schema rollout unless the subscription provider is ready.
- Keep subscription writes service-role only.
- Keep audit events service-role only.
- Keep guest feedback writes behind an API route, not direct client table access.
- If production has existing local-only morning records, server sync only begins after the user saves or edits a morning record again unless a local-to-server migration flow is added.
