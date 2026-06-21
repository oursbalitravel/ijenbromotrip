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
