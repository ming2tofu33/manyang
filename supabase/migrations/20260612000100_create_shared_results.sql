create table if not exists manyang.shared_results (
  public_id text primary key check (public_id ~ '^[A-Za-z0-9_-]{1,96}$'),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('dream', 'tarot')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists shared_results_kind_created_idx on manyang.shared_results (kind, created_at desc);
create index if not exists shared_results_expires_idx on manyang.shared_results (expires_at) where expires_at is not null;
create index if not exists shared_results_user_created_idx on manyang.shared_results (user_id, created_at desc) where user_id is not null;

alter table manyang.shared_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'shared_results' and policyname = 'shared_results_select_public') then
    create policy shared_results_select_public on manyang.shared_results for select using (expires_at is null or expires_at > now());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'shared_results' and policyname = 'shared_results_insert_own_or_guest') then
    create policy shared_results_insert_own_or_guest on manyang.shared_results for insert with check (user_id is null or user_id = auth.uid());
  end if;
end;
$$;

grant select, insert, delete on manyang.shared_results to authenticated, anon, service_role;
