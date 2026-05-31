create table if not exists manyang.pawprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_date date not null,
  source text not null check (source in ('morning_record', 'forgotten_dream', 'receipt_saved')),
  source_id text not null check (char_length(trim(source_id)) between 1 and 160),
  created_at timestamptz not null default now(),
  constraint pawprints_user_app_source_unique unique (user_id, app_date, source, source_id)
);

create table if not exists manyang.dream_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_date date not null,
  intent_id text not null check (char_length(trim(intent_id)) between 1 and 48),
  intent_label text not null check (char_length(trim(intent_label)) between 1 and 80),
  atmosphere text not null check (char_length(trim(atmosphere)) between 1 and 40),
  note text not null default '' check (char_length(note) <= 100),
  created_at timestamptz not null default now(),
  constraint dream_seeds_user_seed_date_unique unique (user_id, seed_date)
);

create index if not exists pawprints_user_date_idx on manyang.pawprints (user_id, app_date desc, created_at desc);
create index if not exists dream_seeds_user_date_idx on manyang.dream_seeds (user_id, seed_date desc, created_at desc);

alter table manyang.pawprints enable row level security;
alter table manyang.dream_seeds enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'pawprints' and policyname = 'pawprints_select_own') then
    create policy pawprints_select_own on manyang.pawprints for select using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'pawprints' and policyname = 'pawprints_insert_own') then
    create policy pawprints_insert_own on manyang.pawprints for insert with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'pawprints' and policyname = 'pawprints_delete_own') then
    create policy pawprints_delete_own on manyang.pawprints for delete using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_seeds' and policyname = 'dream_seeds_select_own') then
    create policy dream_seeds_select_own on manyang.dream_seeds for select using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_seeds' and policyname = 'dream_seeds_insert_own') then
    create policy dream_seeds_insert_own on manyang.dream_seeds for insert with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_seeds' and policyname = 'dream_seeds_update_own') then
    create policy dream_seeds_update_own on manyang.dream_seeds for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_seeds' and policyname = 'dream_seeds_delete_own') then
    create policy dream_seeds_delete_own on manyang.dream_seeds for delete using (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select, insert, update, delete on manyang.pawprints to authenticated, service_role;
grant select, insert, update, delete on manyang.dream_seeds to authenticated, service_role;
