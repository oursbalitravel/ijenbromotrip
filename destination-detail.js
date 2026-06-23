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
    .replace(/-+/g, '-') || 'destination';
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

function loadAdminDestinations() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const destinations = Array.isArray(parsed?.destinations) ? parsed.destinations : [];
    return destinations.map((destination) => ({
      ...destination,
      slug: slugify(destination.slug || destination.name),
      enabled: destination.enabled !== false,
    }));
  } catch {
    return [];
  }
}

async function loadDestinationsFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return [];

  const endpoint = `${config.url}/rest/v1/destinations?select=id,slug,name,summary,image,status,enabled&order=updated_at.desc`;
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
    slug: slugify(row.slug || row.name || ''),
    name: row.name || '',
    summary: row.summary || '',
    image: row.image || '',
    status: row.status || 'Active',
    enabled: row.enabled !== false,
  }));
}

function getSlugParam() {
  const params = new URLSearchParams(window.location.search);
  return slugify(params.get('slug') || '');
}

function renderDestination(destination) {
  const root = document.getElementById('destination-detail-root');
  if (!root) return;

  const image = destination.image || 'https://via.placeholder.com/1200x700?text=Destination';
  const title = destination.name || 'Untitled Destination';

  root.innerHTML = `
    <article class="trip-detail-shell">
      <section class="trip-media-grid">
        <img class="trip-media-main" src="${image}" alt="${title}" />
        <div class="trip-media-side">
          <img src="${image}" alt="${title}" />
          <img src="${image}" alt="${title}" />
          <img src="${image}" alt="${title}" />
          <img src="${image}" alt="${title}" />
        </div>
      </section>

      <section class="trip-detail-head">
        <p class="section-label">Trip Destination</p>
        <h1>${title}</h1>
        <p>${destination.summary || ''}</p>
      </section>

      <section class="trip-detail-meta">
        <div><strong>Status</strong><span>${destination.status || '-'}</span></div>
        <div><strong>Slug</strong><span>${destination.slug || slugify(destination.name)}</span></div>
      </section>

      <section class="trip-detail-body">
        <h2>About Destination</h2>
        <p>${destination.summary || 'No destination summary available yet.'}</p>
      </section>
    </article>
  `;
}

function renderNotFound() {
  const root = document.getElementById('destination-detail-root');
  if (!root) return;
  root.innerHTML = `
    <section class="page-panel" style="max-width: 760px; margin: 0 auto;">
      <h2>Destination not found</h2>
      <p>The requested destination slug is not available. Please go back and choose a destination from homepage.</p>
      <a class="primary-btn" href="index.html#destinations">Back to Destinations</a>
    </section>
  `;
}

async function bootDestinationPage() {
  const slug = getSlugParam();
  const config = resolveConfig();

  let destinations = await loadDestinationsFromSupabase(config);
  if (!destinations.length) {
    destinations = loadAdminDestinations();
  }

  const destination = destinations.find((item) => (item.slug || slugify(item.name)) === slug);
  if (!destination) {
    renderNotFound();
    return;
  }

  renderDestination(destination);
}

window.addEventListener('load', bootDestinationPage);
