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
    create policy morning_checkins_select_own
      on manyang.morning_checkins for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_insert_own') then
    create policy morning_checkins_insert_own
      on manyang.morning_checkins for insert
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_update_own') then
    create policy morning_checkins_update_own
      on manyang.morning_checkins for update
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'morning_checkins' and policyname = 'morning_checkins_delete_own') then
    create policy morning_checkins_delete_own
      on manyang.morning_checkins for delete
      using (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select, insert, update, delete on manyang.morning_checkins to authenticated, service_role;
