alter table manyang.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'manyang.profiles'::regclass
  ) then
    alter table manyang.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

create index if not exists profiles_role_idx
  on manyang.profiles (role);

revoke insert, update on manyang.profiles from authenticated;

grant insert (user_id, display_name) on manyang.profiles to authenticated;
grant update (display_name) on manyang.profiles to authenticated;
grant select on manyang.profiles to authenticated;
grant all on manyang.profiles to service_role;
