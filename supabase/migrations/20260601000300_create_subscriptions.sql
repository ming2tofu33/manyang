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

create unique index if not exists subscriptions_provider_subscription_unique
  on manyang.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists subscriptions_user_status_idx
  on manyang.subscriptions (user_id, status, current_period_end desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_subscriptions_updated_at') then
    create trigger set_subscriptions_updated_at
    before update on manyang.subscriptions
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.subscriptions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'subscriptions' and policyname = 'subscriptions_select_own') then
    create policy subscriptions_select_own
      on manyang.subscriptions for select
      using (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select on manyang.subscriptions to authenticated;
grant select, insert, update, delete on manyang.subscriptions to service_role;
