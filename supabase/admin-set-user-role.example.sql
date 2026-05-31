-- Grant admin access to an owner/testing account.
-- Replace USER_UUID_HERE with the Supabase Auth user id.

insert into manyang.profiles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id) do update
set role = 'admin',
    updated_at = now();

-- Revoke admin access.

update manyang.profiles
set role = 'user',
    updated_at = now()
where user_id = 'USER_UUID_HERE';
