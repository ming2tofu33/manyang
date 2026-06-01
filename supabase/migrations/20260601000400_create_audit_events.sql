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
