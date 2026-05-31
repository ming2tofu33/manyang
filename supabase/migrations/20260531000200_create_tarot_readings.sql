create table if not exists manyang.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_date date not null,
  spread text not null check (spread in ('daily_one_card', 'daily_three_card')),
  cards jsonb not null default '[]'::jsonb,
  title text not null,
  overview text not null,
  card_readings jsonb not null default '[]'::jsonb,
  advice text not null,
  raw_reading jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_date, spread)
);

create index if not exists tarot_readings_user_date_idx
  on manyang.tarot_readings (user_id, app_date desc, created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_tarot_readings_updated_at') then
    create trigger set_tarot_readings_updated_at
    before update on manyang.tarot_readings
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.tarot_readings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'tarot_readings' and policyname = 'tarot_readings_select_own') then
    create policy tarot_readings_select_own on manyang.tarot_readings for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'tarot_readings' and policyname = 'tarot_readings_insert_own') then
    create policy tarot_readings_insert_own on manyang.tarot_readings for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'tarot_readings' and policyname = 'tarot_readings_update_own') then
    create policy tarot_readings_update_own on manyang.tarot_readings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'tarot_readings' and policyname = 'tarot_readings_delete_own') then
    create policy tarot_readings_delete_own on manyang.tarot_readings for delete using (user_id = auth.uid());
  end if;
end;
$$;

grant select, insert, update, delete on manyang.tarot_readings to authenticated, service_role;
