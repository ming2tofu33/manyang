create table if not exists manyang.night_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null,
  mood_id text not null,
  mood_label text not null,
  condition_id text not null,
  condition_label text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint night_checkins_user_check_in_date_unique unique (user_id, check_in_date)
);

create index if not exists night_checkins_user_date_idx
  on manyang.night_checkins (user_id, check_in_date desc, created_at desc);

alter table manyang.night_checkins enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_select_own'
  ) then
    create policy night_checkins_select_own
      on manyang.night_checkins for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_insert_own'
  ) then
    create policy night_checkins_insert_own
      on manyang.night_checkins for insert
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_update_own'
  ) then
    create policy night_checkins_update_own
      on manyang.night_checkins for update
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'manyang'
      and tablename = 'night_checkins'
      and policyname = 'night_checkins_delete_own'
  ) then
    create policy night_checkins_delete_own
      on manyang.night_checkins for delete
      using (user_id = (select auth.uid()));
  end if;
end $$;

grant select, insert, update, delete on manyang.night_checkins to authenticated, service_role;
