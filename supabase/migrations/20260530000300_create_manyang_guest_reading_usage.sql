create table if not exists manyang.guest_reading_usage (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null,
  usage_date date not null,
  reading_kind text not null check (reading_kind in ('basic')),
  created_at timestamptz not null default now(),
  unique (guest_id, usage_date, reading_kind)
);

create index if not exists guest_reading_usage_guest_date_idx
  on manyang.guest_reading_usage (guest_id, usage_date desc, created_at desc);

alter table manyang.guest_reading_usage enable row level security;

grant select, insert, update, delete on manyang.guest_reading_usage to service_role;
