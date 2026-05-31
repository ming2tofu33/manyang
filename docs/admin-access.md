# Manyang Admin Access

Admin access is for owner/testing accounts that need to run repeated dream-reading experiments without changing production user limits.

## What Admin Can Bypass

- Basic dream-reading daily limit.
- Moon Pass-only `gray_cat` detailed reading gate.
- Client-side UI gates that would otherwise hide or lock detailed testing flows.

Admin does not bypass:

- Dream text validation.
- Safety policy.
- LLM provider availability checks.
- Archive persistence behavior.

## Source of Truth

Admin is trusted only from `manyang.profiles.role`.

Do not treat these as admin authority:

- request body fields
- localStorage
- Supabase `user_metadata`
- client-side state

The client may receive an access-context response that opens testing UI, but `/api/dreams/analyze` checks the database again before bypassing gates.

The migration revokes broad authenticated `insert`/`update` privileges on `manyang.profiles` and grants only:

- `insert (user_id, display_name)`
- `update (display_name)`

That keeps users from promoting themselves by writing `role = 'admin'` or `access_plan = 'moon_pass'` through the browser Supabase client.

## Grant Admin

Replace `USER_UUID_HERE` with the Supabase Auth user id.

```sql
insert into manyang.profiles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id) do update
set role = 'admin',
    updated_at = now();
```

## Revoke Admin

```sql
update manyang.profiles
set role = 'user',
    updated_at = now()
where user_id = 'USER_UUID_HERE';
```

## Verify

```sql
select user_id, role, access_plan
from manyang.profiles
where user_id = 'USER_UUID_HERE';
```

Expected result:

- `role = 'admin'` for owner/testing accounts.
- `role = 'user'` for normal accounts.

## Current Caveat

Admin dream readings are still saved as normal completed dream entries. If admin experiments should not affect archive, symbol history, or routine metrics, add a separate `admin_lab` source flow in a later task.
