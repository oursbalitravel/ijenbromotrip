# Ijen Bromo Trip

Homepage and admin project for Ijen Bromo tour booking.

## Deployment

### GitHub Pages
1. Buat repository di GitHub.
2. Tambahkan remote:
   ```bash
git remote add origin https://github.com/<username>/<repo>.git
   ```
3. Push branch utama:
   ```bash
git push -u origin main
   ```
4. GitHub Actions akan otomatis deploy ke branch `gh-pages`.

### Akses
- Homepage: `https://<username>.github.io/<repo>/`
- Admin: jalankan lokal `cd admin && npm run dev` atau host terpisah di subdomain.

## Struktur
- `/` : homepage statis
- `/admin` : React admin panel
- `/server.js` : backend API lokal untuk admin data
- `/admin-data.json` : penyimpanan data admin lokal

## Catatan
- `admin` tetap terpisah dari homepage.
- Homepage memuat data paket dari API backend atau `localStorage`.
- Untuk subdomain admin, pastikan `VITE_API_BASE_URL` dan CORS di `server.js` sudah dikonfigurasi.

## Supabase Sync (Semua Pengunjung)

### 1) Buat tabel di Supabase SQL Editor
```sql
create table if not exists public.trips (
   id text primary key,
   title text not null,
   overview text not null default '',
   description text not null default '',
   vehicle text not null default '',
   duration text not null default '',
   group_size text not null default '',
   best_time text not null default '',
   price numeric not null default 0,
   discount numeric not null default 0,
   status text not null default 'Active',
   images jsonb not null default '[]'::jsonb,
   highlights jsonb not null default '[]'::jsonb,
   itinerary jsonb not null default '[]'::jsonb,
   faqs jsonb not null default '[]'::jsonb,
   updated_at timestamptz not null default now()
);

create table if not exists public.services (
   id text primary key,
   name text not null,
   type text not null default 'Per Pax',
   price numeric not null default 0,
   status text not null default 'Active',
   updated_at timestamptz not null default now()
);

create table if not exists public.destinations (
   id text primary key,
   slug text not null default '',
   name text not null,
   summary text not null default '',
   image text not null default '',
   status text not null default 'Active',
   enabled boolean not null default true,
   updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
   id text primary key,
   company_name text not null default 'Ijen Bromo Trip',
   address text not null default '',
   phone text not null default '',
   email text not null default '',
   logo text not null default '',
   updated_at timestamptz not null default now()
);

create table if not exists public.site_metrics (
   id text primary key,
   users int not null default 0,
   bookings int not null default 0,
   revenue numeric not null default 0,
   updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values ('main')
on conflict (id) do nothing;

insert into public.site_metrics (id)
values ('main')
on conflict (id) do nothing;

alter table public.trips enable row level security;
alter table public.services enable row level security;
alter table public.destinations enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_metrics enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

drop policy if exists "public read trips" on public.trips;
create policy "public read trips"
on public.trips
for select
to anon
using (true);

drop policy if exists "public write trips" on public.trips;
create policy "public write trips"
on public.trips
for all
to anon
using (true)
with check (true);

drop policy if exists "public read services" on public.services;
create policy "public read services"
on public.services
for select
to anon
using (true);

drop policy if exists "public write services" on public.services;
create policy "public write services"
on public.services
for all
to anon
using (true)
with check (true);

drop policy if exists "public read destinations" on public.destinations;
create policy "public read destinations"
on public.destinations
for select
to anon
using (true);

drop policy if exists "public write destinations" on public.destinations;
create policy "public write destinations"
on public.destinations
for all
to anon
using (true)
with check (true);

drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings"
on public.site_settings
for select
to anon
using (id = 'main');

drop policy if exists "public write site_settings" on public.site_settings;
create policy "public write site_settings"
on public.site_settings
for all
to anon
using (id = 'main')
with check (id = 'main');

drop policy if exists "public read site_metrics" on public.site_metrics;
create policy "public read site_metrics"
on public.site_metrics
for select
to anon
using (id = 'main');

drop policy if exists "public write site_metrics" on public.site_metrics;
create policy "public write site_metrics"
on public.site_metrics
for all
to anon
using (id = 'main')
with check (id = 'main');
```

### 2) Admin Setup Page
- Buka menu `Setup` di admin panel.
- Isi `Supabase Project URL` dan `Supabase Anon Key`.
- Aktifkan `Enable Supabase Sync` lalu klik `Save DB Config`.
- Gunakan `Test Connection`, `Pull from Supabase`, dan `Push to Supabase` sesuai kebutuhan.

Catatan:
- Homepage akan membaca koneksi database dari setup admin (`ijen-bromo-db-config`) sehingga cukup setup sekali di admin.
- Ini bekerja saat homepage dan admin berada pada origin yang sama (contoh GitHub Pages: `/` dan `/admin`).

### 3) Homepage Global Read
- Homepage otomatis membaca data dari tabel `trips` menggunakan konfigurasi yang disimpan lewat admin setup.
