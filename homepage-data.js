const ADMIN_STORAGE_KEY = 'ijen-bromo-admin-data';
const DB_CONFIG_KEY = 'ijen-bromo-db-config';
const HOMEPAGE_TRIPS_CACHE_KEY = 'ijen-bromo-homepage-trips-cache';
const HOMEPAGE_DESTINATIONS_CACHE_KEY = 'ijen-bromo-homepage-destinations-cache';

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

function resolveSupabaseConfig() {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '', enabled: false };
  }

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

async function loadTripsFromSupabase(config) {
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

async function loadDestinationsFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return [];

  const endpoint = `${config.url}/rest/v1/destinations?select=id,name,summary,image,status&order=updated_at.desc`;
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
    name: row.name || '',
    summary: row.summary || '',
    image: row.image || '',
    status: row.status || 'Active',
  }));
}

function loadAdminData() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadAdminTrips(adminData) {
  if (adminData && Array.isArray(adminData.trips)) {
    return adminData.trips.map((trip) => ({
      ...trip,
      slug: trip.slug || slugify(trip.title),
    }));
  }

  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((trip) => ({ ...trip, slug: trip.slug || slugify(trip.title) }));
    }
    if (Array.isArray(parsed.trips)) {
      return parsed.trips.map((trip) => ({ ...trip, slug: trip.slug || slugify(trip.title) }));
    }
    return [];
  } catch {
    return [];
  }
}

function resolveLayout(adminData) {
  return adminData?.layout || {};
}

function saveTripsCache(trips) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HOMEPAGE_TRIPS_CACHE_KEY, JSON.stringify(trips || []));
  } catch {
    // Ignore cache write errors.
  }
}

function saveDestinationsCache(destinations) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HOMEPAGE_DESTINATIONS_CACHE_KEY, JSON.stringify(destinations || []));
  } catch {
    // Ignore cache write errors.
  }
}

function loadTripsCache() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HOMEPAGE_TRIPS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadDestinationsCache() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HOMEPAGE_DESTINATIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyHeaderMenu(layout) {
  const nav = document.querySelector('.nav-menu');
  const menu = Array.isArray(layout?.headerMenu) ? layout.headerMenu : [];
  if (!nav || !menu.length) return;

  nav.innerHTML = '';
  menu.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href || '#hero';
    link.textContent = item.label || 'Menu';
    nav.appendChild(link);
  });
}

function applyFooterMenu(layout) {
  const links = document.querySelector('.social-links');
  const menu = Array.isArray(layout?.footerMenu) ? layout.footerMenu : [];
  if (!links || !menu.length) return;

  links.innerHTML = '';
  menu.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href || '#footer';
    link.textContent = item.label || 'Footer Link';
    links.appendChild(link);
  });
}

function applyHeroImages(layout) {
  const heroImages = Array.isArray(layout?.heroImages) ? layout.heroImages : [];
  if (!heroImages.length) return;

  const slides = document.querySelectorAll('.hero-slide');
  slides.forEach((slide, index) => {
    if (heroImages[index]) {
      slide.style.backgroundImage = `url('${heroImages[index]}')`;
    }
  });
}

function applySectionLayout(layout) {
  const sections = Array.isArray(layout?.sections) ? layout.sections : [];
  const footerText = document.querySelector('.bottom-footer p');
  if (footerText && layout?.footerText) {
    footerText.textContent = layout.footerText;
  }

  // Remove previously rendered custom blocks before rendering new ones.
  document.querySelectorAll('.custom-layout-section').forEach((el) => el.remove());

  const main = document.querySelector('main');
  const footer = document.querySelector('footer.site-footer');

  if (main && footer) {
    sections
      .filter((section) => !String(section.id || '').startsWith('custom-'))
      .forEach((section) => {
        const node = document.getElementById(section.id);
        if (node) {
          main.insertBefore(node, footer);
        }
      });
  }

  sections.forEach((section) => {
    const isCustom = String(section.id || '').startsWith('custom-');
    if (isCustom) {
      if (!section.enabled || !main || !footer) return;
      const custom = document.createElement('section');
      custom.className = 'section custom-layout-section';
      custom.innerHTML = `
        <div class="container">
          <div class="section-header">
            <p class="section-label">${section.caption || 'Section'}</p>
            <h2>${section.title || section.label || 'Custom Section'}</h2>
            <p>${section.text || ''}</p>
          </div>
        </div>
      `;
      main.insertBefore(custom, footer);
      return;
    }

    const node = document.getElementById(section.id);
    if (!node) return;
    node.style.display = section.enabled ? '' : 'none';

    if (section.id === 'hero') {
      const titleNode = node.querySelector('h1');
      const textNode = node.querySelector('.hero-copy');
      if (titleNode && section.title) titleNode.textContent = section.title;
      if (textNode && section.text) textNode.textContent = section.text;
      return;
    }

    const labelNode = node.querySelector('.section-label');
    const titleNode = node.querySelector('.section-header h2');
    const textNode = node.querySelector('.section-header > p');
    if (labelNode && section.caption) labelNode.textContent = section.caption;
    if (titleNode && section.title) titleNode.textContent = section.title;
    if (textNode && section.text) textNode.textContent = section.text;
  });
}

function renderDestinations(layout, destinations) {
  const items = Array.isArray(destinations) ? destinations : [];
  const grid = document.querySelector('#destinations .dest-grid');
  if (!grid) return;

  const activeItems = items.filter((item) => (item.status || 'Active') === 'Active');
  grid.innerHTML = '';
  const columns = Number(layout?.destinationGrid?.columns || 4);
  const rows = Number(layout?.destinationGrid?.rows || 1);
  const total = Math.max(1, columns) * Math.max(1, rows);

  grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;

  if (!activeItems.length) {
    grid.innerHTML = '<p class="empty-row">Destination belum tersedia. Silakan import dari homepage atau tambah lewat admin.</p>';
    return;
  }

  activeItems.slice(0, total).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'destination-card';
    card.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/800x600?text=Destination'}" alt="${item.name || 'Destination'}" />
      <div>
        <h3>${item.name || 'Destination'}</h3>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderWhyChoose(layout) {
  const grid = document.querySelector('#why-us .features-grid');
  const items = Array.isArray(layout?.whyChooseItems) ? layout.whyChooseItems : [];
  if (!grid || !items.length) return;

  const activeItems = items.filter((item) => item.enabled !== false);
  grid.innerHTML = '';

  activeItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'feature-card';
    card.innerHTML = `
      <h3>${item.title || 'Feature'}</h3>
      <p>${item.text || ''}</p>
    `;
    grid.appendChild(card);
  });
}

function renderFaq(layout) {
  const list = document.querySelector('#faq .faq-list');
  const items = Array.isArray(layout?.faqItems) ? layout.faqItems : [];
  if (!list || !items.length) return;

  const activeItems = items.filter((item) => item.enabled !== false);
  list.innerHTML = '';

  activeItems.forEach((item) => {
    const block = document.createElement('details');
    block.innerHTML = `
      <summary>${item.question || 'Question'}</summary>
      <p>${item.answer || ''}</p>
    `;
    list.appendChild(block);
  });
}

function createPackageCard(trip) {
  const slug = trip.slug || slugify(trip.title);
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
      <a href="trip.html?slug=${encodeURIComponent(slug)}" class="card-cta">View Details</a>
    </div>
  `;
  return article;
}

async function renderAdminPackages() {
  const grid = document.getElementById('packages-grid');
  if (!grid) return;

  const dbConfig = resolveSupabaseConfig();
  const adminData = loadAdminData();
  const layout = resolveLayout(adminData);

  applyHeaderMenu(layout);
  applyFooterMenu(layout);
  applyHeroImages(layout);
  applySectionLayout(layout);
  renderWhyChoose(layout);
  renderFaq(layout);

  // Clear initial hardcoded cards so homepage never silently falls back to old static content.
  grid.innerHTML = '';

  let adminTrips = [];
  let adminDestinations = [];

  // Keep homepage data source consistent with admin setup: Supabase only when enabled.
  if (dbConfig.enabled && dbConfig.url && dbConfig.anonKey) {
    try {
      adminTrips = await loadTripsFromSupabase(dbConfig);
      adminDestinations = await loadDestinationsFromSupabase(dbConfig);
      if (adminTrips.length) {
        saveTripsCache(adminTrips);
      }
      if (adminDestinations.length) {
        saveDestinationsCache(adminDestinations);
      }
    } catch {
      adminTrips = [];
      adminDestinations = [];
    }
  }

  if (!adminTrips.length) {
    adminTrips = loadTripsCache();
  }

  if (!adminTrips.length) {
    adminTrips = loadAdminTrips(adminData);
    if (adminTrips.length) {
      saveTripsCache(adminTrips);
    }
  }

  if (!adminDestinations.length) {
    adminDestinations = loadDestinationsCache();
  }

  if (!adminDestinations.length) {
    adminDestinations = Array.isArray(adminData?.destinations) ? adminData.destinations : [];
    if (adminDestinations.length) {
      saveDestinationsCache(adminDestinations);
    }
  }

  renderDestinations(layout, adminDestinations);

  if (!adminTrips.length) {
    grid.innerHTML = '<p class="empty-row">Trip package belum tersedia. Silakan tambah dari admin lalu push/pull data.</p>';
    return;
  }
  const columns = Number(layout?.packageGrid?.columns || 4);
  const rows = Number(layout?.packageGrid?.rows || 2);
  const total = Math.max(1, columns) * Math.max(1, rows);

  grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;
  adminTrips.slice(0, total).forEach((trip) => grid.appendChild(createPackageCard(trip)));
}

window.addEventListener('load', renderAdminPackages);
