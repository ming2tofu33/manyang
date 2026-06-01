create table if not exists manyang.reading_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id uuid,
  identity_type text generated always as (
    case
      when user_id is not null then 'user'
      else 'guest'
    end
  ) stored,
  identity_id uuid generated always as (
    coalesce(user_id, guest_id)
  ) stored,
  usage_date date not null,
  feature_key text not null check (feature_key in ('dream_basic', 'dream_premium', 'tarot_one_card', 'tarot_three_card')),
  usage_count integer not null default 1 check (usage_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_usage_identity_check check (
    (user_id is not null and guest_id is null) or
    (user_id is null and guest_id is not null)
  ),
  constraint reading_usage_identity_feature_date_unique unique (identity_type, identity_id, usage_date, feature_key)
);

create index if not exists reading_usage_user_date_idx
  on manyang.reading_usage (user_id, usage_date desc, feature_key)
  where user_id is not null;

create index if not exists reading_usage_guest_date_idx
  on manyang.reading_usage (guest_id, usage_date desc, feature_key)
  where guest_id is not null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_reading_usage_updated_at') then
    create trigger set_reading_usage_updated_at
    before update on manyang.reading_usage
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.reading_usage enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'reading_usage' and policyname = 'reading_usage_select_own') then
    create policy reading_usage_select_own
      on manyang.reading_usage for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'reading_usage' and policyname = 'reading_usage_insert_own') then
    create policy reading_usage_insert_own
      on manyang.reading_usage for insert
      with check (user_id = (select auth.uid()) and guest_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'reading_usage' and policyname = 'reading_usage_update_own') then
    create policy reading_usage_update_own
      on manyang.reading_usage for update
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()) and guest_id is null);
  end if;
end;
$$;

grant select, insert, update on manyang.reading_usage to authenticated;
grant select, insert, update, delete on manyang.reading_usage to service_role;
