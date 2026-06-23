const ADMIN_STORAGE_KEY = 'ijen-bromo-admin-data';
const DB_CONFIG_KEY = 'ijen-bromo-db-config';

function sanitizeUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'trip-package';
}

function resolveConfig() {
  try {
    const raw = window.localStorage.getItem(DB_CONFIG_KEY);
    if (!raw) return { url: '', anonKey: '', enabled: false };
    const parsed = JSON.parse(raw);
    return {
      url: sanitizeUrl(parsed?.url),
      anonKey: (parsed?.anonKey || '').trim(),
      enabled: Boolean(parsed?.enabled),
    };
  } catch {
    return { url: '', anonKey: '', enabled: false };
  }
}

function loadAdminTrips() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const trips = Array.isArray(parsed?.trips) ? parsed.trips : Array.isArray(parsed) ? parsed : [];
    return trips.map((trip) => ({ ...trip, slug: trip.slug || slugify(trip.title) }));
  } catch {
    return [];
  }
}

async function loadTripsFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return [];
  const endpoint = `${config.url}/rest/v1/trips?select=id,title,overview,description,vehicle,duration,group_size,best_time,price,discount,status,images,highlights,itinerary,faqs&order=updated_at.desc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });
  if (!response.ok) return [];

  const rows = await response.json();
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    id: row.id,
    slug: slugify(row.slug || row.title || ''),
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

function getSlugParam() {
  const params = new URLSearchParams(window.location.search);
  return slugify(params.get('slug') || '');
}

function renderTrip(trip) {
  const root = document.getElementById('trip-detail-root');
  if (!root) return;

  const images = Array.isArray(trip.images) && trip.images.length
    ? trip.images
    : ['https://via.placeholder.com/1200x700?text=Trip+Image'];

  const highlights = Array.isArray(trip.highlights) ? trip.highlights.filter(Boolean) : [];
  const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const faqs = Array.isArray(trip.faqs) ? trip.faqs : [];

  root.innerHTML = `
    <article class="trip-detail-shell">
      <section class="trip-media-grid">
        <img class="trip-media-main" src="${images[0]}" alt="${trip.title || 'Trip'}" />
        <div class="trip-media-side">
          ${images.slice(1, 5).map((src, idx) => `<img src="${src}" alt="Gallery ${idx + 2}" />`).join('')}
        </div>
      </section>

      <section class="trip-detail-head">
        <p class="section-label">Trip Package</p>
        <h1>${trip.title || 'Untitled Trip'}</h1>
        <p>${trip.overview || trip.description || ''}</p>
      </section>

      <section class="trip-detail-meta">
        <div><strong>Duration</strong><span>${trip.duration || '-'}</span></div>
        <div><strong>Group Size</strong><span>${trip.groupSize || '-'}</span></div>
        <div><strong>Vehicle</strong><span>${trip.vehicle || '-'}</span></div>
        <div><strong>Best Time</strong><span>${trip.bestTime || '-'}</span></div>
        <div><strong>Price</strong><span>$${trip.price || 0} / person</span></div>
      </section>

      <section class="trip-detail-body">
        <h2>Overview</h2>
        <p>${trip.description || 'No description yet.'}</p>
      </section>

      <section class="trip-detail-body">
        <h2>Highlights</h2>
        <ul>
          ${highlights.length ? highlights.map((item) => `<li>${item}</li>`).join('') : '<li>No highlights yet.</li>'}
        </ul>
      </section>

      <section class="trip-detail-body">
        <h2>Itinerary</h2>
        <div class="trip-itinerary-list">
          ${itinerary.length ? itinerary.map((day) => `
            <div class="trip-itinerary-day">
              <h3>${day.day || 'Day'}</h3>
              <ul>
                ${(Array.isArray(day.items) ? day.items : []).map((item) => `<li><strong>${item.time || ''}</strong> ${item.activity || ''}</li>`).join('')}
              </ul>
            </div>
          `).join('') : '<p>No itinerary available.</p>'}
        </div>
      </section>

      <section class="trip-detail-body">
        <h2>FAQ</h2>
        <div class="faq-list">
          ${faqs.length ? faqs.map((faq) => `<details><summary>${faq.question || 'Question'}</summary><p>${faq.answer || ''}</p></details>`).join('') : '<p>No FAQs yet.</p>'}
        </div>
      </section>
    </article>
  `;
}

function renderNotFound() {
  const root = document.getElementById('trip-detail-root');
  if (!root) return;
  root.innerHTML = `
    <section class="page-panel" style="max-width: 760px; margin: 0 auto;">
      <h2>Trip not found</h2>
      <p>The requested trip slug is not available. Please go back and choose a trip package from homepage.</p>
      <a class="primary-btn" href="index.html#packages">Back to Trip Packages</a>
    </section>
  `;
}

async function bootTripPage() {
  const slug = getSlugParam();
  const config = resolveConfig();

  let trips = [];
  trips = await loadTripsFromSupabase(config);
  if (!trips.length) {
    trips = loadAdminTrips();
  }

  const trip = trips.find((item) => (item.slug || slugify(item.title)) === slug);
  if (!trip) {
    renderNotFound();
    return;
  }

  renderTrip(trip);
}

window.addEventListener('load', bootTripPage);
