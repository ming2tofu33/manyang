create schema if not exists manyang;

create extension if not exists pgcrypto with schema extensions;

create or replace function manyang.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists manyang.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  access_plan text not null default 'free_account' check (access_plan in ('guest', 'free_account', 'moon_pass')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manyang.dream_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dream_text text not null check (char_length(trim(dream_text)) between 1 and 1000),
  dream_date date not null,
  cat_reader_type text check (cat_reader_type is null or cat_reader_type in ('black_cat', 'white_cat', 'cheese_cat', 'gray_cat')),
  wake_mood text,
  dream_atmospheres text[] not null default '{}',
  dream_sensations text[] not null default '{}',
  dream_sensation_other text,
  status text not null default 'completed' check (status in ('completed', 'unavailable')),
  unavailable_reason text,
  safety_notice text,
  source text not null default 'dream_analysis',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manyang.dream_readings (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null unique references manyang.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id text,
  summary text not null,
  interpretation text not null,
  small_prescription text not null,
  reader jsonb not null default '{}'::jsonb,
  symbols text[] not null default '{}',
  emotions text[] not null default '{}',
  themes text[] not null default '{}',
  symbol_readings jsonb not null default '[]'::jsonb,
  reading_basis jsonb not null default '{}'::jsonb,
  reader_note text,
  safety_notice text,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists manyang.dream_cards (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null unique references manyang.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text,
  card_name text not null,
  card_type text,
  card_keywords text[] not null default '{}',
  card_summary text,
  card_message text,
  card_theme text,
  created_at timestamptz not null default now()
);

create table if not exists manyang.user_symbol_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  count integer not null default 1 check (count > 0),
  last_seen_at timestamptz not null default now(),
  related_emotions text[] not null default '{}',
  related_themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists dream_entries_user_date_idx on manyang.dream_entries (user_id, dream_date desc, created_at desc);
create index if not exists dream_readings_user_idx on manyang.dream_readings (user_id, created_at desc);
create index if not exists dream_cards_user_idx on manyang.dream_cards (user_id, created_at desc);
create index if not exists user_symbol_history_user_seen_idx on manyang.user_symbol_history (user_id, last_seen_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_profiles_updated_at') then
    create trigger set_profiles_updated_at
    before update on manyang.profiles
    for each row execute function manyang.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_dream_entries_updated_at') then
    create trigger set_dream_entries_updated_at
    before update on manyang.dream_entries
    for each row execute function manyang.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_user_symbol_history_updated_at') then
    create trigger set_user_symbol_history_updated_at
    before update on manyang.user_symbol_history
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.profiles enable row level security;
alter table manyang.dream_entries enable row level security;
alter table manyang.dream_readings enable row level security;
alter table manyang.dream_cards enable row level security;
alter table manyang.user_symbol_history enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'profiles' and policyname = 'profiles_select_own') then
    create policy profiles_select_own on manyang.profiles for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'profiles' and policyname = 'profiles_insert_own') then
    create policy profiles_insert_own on manyang.profiles for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'profiles' and policyname = 'profiles_update_own') then
    create policy profiles_update_own on manyang.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_entries' and policyname = 'dream_entries_select_own') then
    create policy dream_entries_select_own on manyang.dream_entries for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_entries' and policyname = 'dream_entries_insert_own') then
    create policy dream_entries_insert_own on manyang.dream_entries for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_entries' and policyname = 'dream_entries_delete_own') then
    create policy dream_entries_delete_own on manyang.dream_entries for delete using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_readings' and policyname = 'dream_readings_select_own') then
    create policy dream_readings_select_own on manyang.dream_readings for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_readings' and policyname = 'dream_readings_insert_own') then
    create policy dream_readings_insert_own on manyang.dream_readings for insert with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_cards' and policyname = 'dream_cards_select_own') then
    create policy dream_cards_select_own on manyang.dream_cards for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'dream_cards' and policyname = 'dream_cards_insert_own') then
    create policy dream_cards_insert_own on manyang.dream_cards for insert with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'user_symbol_history' and policyname = 'user_symbol_history_select_own') then
    create policy user_symbol_history_select_own on manyang.user_symbol_history for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'user_symbol_history' and policyname = 'user_symbol_history_insert_own') then
    create policy user_symbol_history_insert_own on manyang.user_symbol_history for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'user_symbol_history' and policyname = 'user_symbol_history_update_own') then
    create policy user_symbol_history_update_own on manyang.user_symbol_history for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end;
$$;

grant usage on schema manyang to authenticated, service_role;
grant select, insert, update, delete on all tables in schema manyang to authenticated, service_role;
grant usage on all sequences in schema manyang to authenticated, service_role;
