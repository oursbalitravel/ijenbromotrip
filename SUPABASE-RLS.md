**Supabase RLS & Admin setup for IjenBromoTrip**

This document explains recommended Row Level Security (RLS) policies, admin onboarding, and example SQL to protect the admin surface while keeping the public homepage readable.

**Goals**
- Allow public site to read public-facing data (published trips, site_settings.layout_json).
- Allow only authenticated admin users to create/update/delete `trips`, `destinations`, and `site_settings`.
- Provide a safe, auditable way to grant/revoke admin access.

**High-level approach**
- Add an `admins` table that stores `user_id` of Supabase Auth users who are allowed to manage content.
- Enable RLS on important tables and create policies:
  - `SELECT` policies that allow public reading of published content (status = 'Active') and allow admins to read/unrestricted.
  - `INSERT`/`UPDATE`/`DELETE` policies that only allow admins.
- Manage admin membership via simple SQL (insert/delete) or via a small internal admin UI (recommended).

**SQL examples (run in Supabase SQL editor)**

-- 1) Create admins table
```sql
create table if not exists admins (
  user_id uuid primary key,
  created_at timestamptz default now()
);
```

-- 2) Enable RLS on tables to protect
```sql
alter table trips enable row level security;
alter table destinations enable row level security;
alter table site_settings enable row level security;
alter table site_metrics enable row level security;
```

-- 3) Helper function to check admin membership (optional)
```sql
create or replace function is_admin(uid uuid) returns boolean as $$
  select exists(select 1 from admins where user_id = uid);
$$ language sql stable;
```

-- 4) Policies for `trips`
-- allow public SELECT only for active trips; admins can select anything
```sql
-- public read: only Active trips
create policy "public_select_active_trips" on trips
  for select
  using (status = 'Active');

-- admins full access
create policy "admins_full_access_trips" on trips
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
```

-- 5) Policies for `destinations`
```sql
create policy "public_select_active_destinations" on destinations
  for select
  using (enabled = true);

create policy "admins_full_access_destinations" on destinations
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
```

-- 6) Policies for `site_settings`
-- allow public SELECT for `site_settings` so public homepage can read `layout_json`
-- require admin for updates
```sql
alter table site_settings enable row level security;

create policy "public_read_site_settings" on site_settings
  for select
  using (true);

create policy "admins_update_site_settings" on site_settings
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "admins_insert_site_settings" on site_settings
  for insert
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
```

-- 7) site_metrics: allow admins only
```sql
create policy "admins_full_site_metrics" on site_metrics
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
```

**Admin onboarding**
- Create a Supabase Auth user (via Supabase dashboard → Authentication → Users → Invite user or create user). Note the user's `id` (UUID).
- Grant admin role by inserting their `user_id` into the `admins` table:
```sql
insert into admins (user_id) values ('<USER_UUID>');
```
- To revoke admin rights:
```sql
delete from admins where user_id = '<USER_UUID>';
```

**Obtaining a user's UID**
- From Supabase Dashboard: Authentication → Users → click user → copy `ID`.
- Or via server-side admin API (do NOT use service_role key in client-side code).

**Auth & client notes**
- Use Supabase Auth on the public `login.html` to sign in admins. The client anon key is safe for auth but cannot bypass RLS.
- NEVER embed the `service_role` key in client-side code; keep it secret on server-side only.
- If your admin UI needs to perform restricted server-only operations, implement a small server-side function or Edge Function that uses `service_role` securely.

**Testing policies**
1. Use Supabase SQL editor to run the SQL above.
2. In the Auth dashboard, create a test admin user and add their UUID to `admins`.
3. From a browser (not signed in), use the public site to confirm you can read `site_settings` and `trips` with status 'Active'.
4. Sign in as the admin and confirm you can `INSERT`/`UPDATE`/`DELETE` using the admin UI.

**Optional: admin flag in JWT (advanced)**
- Instead of `admins` table, you can issue custom claims (e.g., `role: 'admin'`) when creating users via server-side APIs. Policies then check `auth.jwt() ->> 'role' = 'admin'`.
- This requires a server-side signup flow that uses `service_role` to create custom JWT claims.

**Recommendation summary**
- Use an `admins` table + `is_admin(auth.uid())` check: simple, auditable, manageable via SQL or tiny admin UI.
- Keep `site_settings` readable by public to allow homepage rendering; protect updates via admin-only policy.
- Follow the earlier repo changes: use Supabase Auth in `login.html` and guard admin app to redirect unauthenticated users.

If you want, I can:
- Apply the SQL to your Supabase project if you provide database access (I cannot run it from here). 
- Create a tiny admin UI within `admin/` to manage `admins` membership (add/remove users) that requires current admin privileges.
- Draft a CI job that runs a migration SQL file on deploy.
