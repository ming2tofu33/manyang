create table if not exists manyang.feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  guest_id uuid,
  subject_type text not null check (subject_type in ('dream_reading', 'tarot_reading', 'archive_record', 'app_flow')),
  subject_id text,
  rating integer check (rating between 1 and 5),
  feedback_text text check (feedback_text is null or char_length(feedback_text) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint feedback_events_identity_check check (
    user_id is not null or guest_id is not null
  )
);

create index if not exists feedback_events_user_created_idx
  on manyang.feedback_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists feedback_events_subject_created_idx
  on manyang.feedback_events (subject_type, subject_id, created_at desc);

alter table manyang.feedback_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'feedback_events' and policyname = 'feedback_events_select_own') then
    create policy feedback_events_select_own
      on manyang.feedback_events for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'manyang' and tablename = 'feedback_events' and policyname = 'feedback_events_insert_own') then
    create policy feedback_events_insert_own
      on manyang.feedback_events for insert
      with check (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select, insert on manyang.feedback_events to authenticated;
grant select, insert, update, delete on manyang.feedback_events to service_role;
