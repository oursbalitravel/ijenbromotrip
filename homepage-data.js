const ADMIN_STORAGE_KEY = 'ijen-bromo-admin-data';
const DB_CONFIG_KEY = 'ijen-bromo-db-config';

function sanitizeUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

function resolveSupabaseConfig() {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '' };
  }

  try {
    const raw = window.localStorage.getItem(DB_CONFIG_KEY);
    if (!raw) return { url: '', anonKey: '' };

    const parsed = JSON.parse(raw);
    return {
      url: sanitizeUrl(parsed?.url),
      anonKey: (parsed?.anonKey || '').trim(),
    };
  } catch {
    return { url: '', anonKey: '' };
  }
}

async function loadTripsFromSupabase() {
  const config = resolveSupabaseConfig();
  if (!config.url || !config.anonKey) return [];

  const endpoint = `${config.url}/rest/v1/trips?select=id,title,overview,description,vehicle,duration,group_size,best_time,price,discount,status,images,highlights,itinerary,faqs&order=updated_at.desc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch data from Supabase (HTTP ${response.status}).`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    id: row.id,
    title: row.title || '',
    overview: row.overview || '',
    description: row.description || '',
    vehicle: row.vehicle || '',
    duration: row.duration || '',
    groupSize: row.group_size || '',
    bestTime: row.best_time || '',
    price: Number(row.price ?? 0),
    discount: Number(row.discount ?? 0),
    status: row.status || 'Active',
    images: Array.isArray(row.images) ? row.images : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
  }));
}

function loadAdminTrips() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.trips)) return parsed.trips;
    return [];
  } catch (error) {
    return [];
  }
}

function createPackageCard(trip) {
  const article = document.createElement('article');
  article.className = 'package-card';
  article.innerHTML = `
    <img src="${trip.images?.[0] || 'https://via.placeholder.com/600x450?text=Trip'}" alt="${trip.title || 'Trip package'}" />
    <div class="card-content">
      <h3>${trip.title || 'Untitled Package'}</h3>
      <p>${trip.overview || trip.description || 'Explore this amazing package with our expert guides.'}</p>
      <div class="card-meta">
        <span>${trip.duration || trip.groupSize || 'N/A'}</span>
        <span class="price">$${trip.price ?? 0} / person</span>
      </div>
      <a href="#destinations" class="card-cta">View Details</a>
    </div>
  `;
  return article;
}

async function renderAdminPackages() {
  const grid = document.getElementById('packages-grid');
  if (!grid) return;

  let adminTrips = [];
  try {
    adminTrips = await loadTripsFromSupabase();
  } catch (error) {
    // Fallback for local development or missing shared DB config.
    adminTrips = [];
  }

  if (!adminTrips.length) {
    adminTrips = loadAdminTrips();
  }

  if (!adminTrips.length) return;
  grid.innerHTML = '';
  adminTrips.slice(0, 8).forEach((trip) => grid.appendChild(createPackageCard(trip)));
}

window.addEventListener('load', renderAdminPackages);
