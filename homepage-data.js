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
  if (!config.enabled || !config.url || !config.anonKey) return [];

  const endpoint = `${config.url}/rest/v1/trips?select=id,title,overview,description,vehicle,duration,group_size,best_time,price,discount,status,cover_image,images,highlights,itinerary,faqs&order=updated_at.desc`;
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
    coverImage: row.cover_image || '',
    images: Array.isArray(row.images) ? row.images : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
  }));
}

async function loadDestinationsFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return [];

  const endpoint = `${config.url}/rest/v1/destinations?select=id,slug,name,summary,description,image,images,highlights,faqs,status,enabled&order=updated_at.desc`;
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
    description: row.description || '',
    image: row.image || '',
    images: Array.isArray(row.images) ? row.images : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    status: row.status || 'Active',
    enabled: row.enabled !== false,
  }));
}

async function loadSiteConfigFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return null;

  const endpoint = `${config.url}/rest/v1/site_settings?select=id,company_name,address,phone,email,currency_code,whatsapp_message_prefix,whatsapp_message_suffix,whatsapp_url_position,logo,layout_json&id=eq.main&limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });

  if (!response.ok) return null;

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  return {
    settings: {
      companyName: row.company_name || '',
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      currencyCode: String(row.currency_code || 'IDR').trim().toUpperCase(),
      whatsappMessagePrefix: row.whatsapp_message_prefix || 'Halo, saya ingin booking trip ini: ',
      whatsappMessageSuffix: row.whatsapp_message_suffix || '',
      whatsappUrlPosition: row.whatsapp_url_position === 'before' ? 'before' : 'after',
      logo: row.logo || '',
    },
    layout: row.layout_json && typeof row.layout_json === 'object' ? row.layout_json : {},
  };
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

function loadAdminSettings(adminData) {
  const raw = adminData?.settings || {};
  return {
    ...raw,
    currencyCode: 'IDR',
    phone: raw?.phone ? String(raw.phone) : '',
    whatsappMessagePrefix: raw?.whatsappMessagePrefix
      ? String(raw.whatsappMessagePrefix)
      : 'Halo, saya ingin booking trip ini: ',
    whatsappMessageSuffix: raw?.whatsappMessageSuffix ? String(raw.whatsappMessageSuffix) : '',
    whatsappUrlPosition: raw?.whatsappUrlPosition === 'before' ? 'before' : 'after',
    currencyCode: String(raw?.currencyCode || 'IDR').trim().toUpperCase(),
  };
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
  const raw = adminData?.layout || {};
  if (raw?.frontPage && typeof raw.frontPage === 'object') {
    return raw.frontPage;
  }
  return raw;
}

function resolveFrontLayout(siteConfig) {
  const remoteLayout = siteConfig?.layout || {};
  if (remoteLayout?.frontPage && typeof remoteLayout.frontPage === 'object') {
    return remoteLayout.frontPage;
  }
  if (Object.keys(remoteLayout).length) {
    return remoteLayout;
  }
  return {};
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
  if (!nav) return;

  nav.innerHTML = '';
  if (!menu.length) return;

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
  if (!links) return;

  links.innerHTML = '';
  if (!menu.length) return;

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
  const sections = (Array.isArray(layout?.sections) ? layout.sections : [])
    .filter((section) => section && typeof section === 'object')
    .map((section) => ({
      ...section,
      id: String(section.id || ''),
      enabled: section.enabled !== false,
    }))
    .filter((section) => section.id);
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

  const destinationItems = Array.isArray(layout?.destinationItems) ? layout.destinationItems : [];
  const visibilityById = new Map(destinationItems.map((item) => [item.id, item.enabled !== false]));
  const activeItems = items.filter((item) => {
    const sectionVisible = visibilityById.has(item.id) ? visibilityById.get(item.id) : true;
    return sectionVisible && item.enabled !== false && (item.status || 'Active') === 'Active';
  });
  grid.innerHTML = '';
  const columns = Number(layout?.destinationGrid?.columns || 4);
  const rows = Number(layout?.destinationGrid?.rows || 1);
  const total = Math.max(1, columns) * Math.max(1, rows);

  grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;

  if (!activeItems.length) {
    grid.innerHTML = '<p class="empty-row">Destination belum tersedia. Silakan isi dari admin lalu push ke database.</p>';
    return;
  }

  activeItems.slice(0, total).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'destination-card';
    card.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/800x600?text=Destination'}" alt="${item.name || 'Destination'}" />
      <div>
        <h3><a href="destination.html?slug=${encodeURIComponent(item.slug || slugify(item.name))}">${item.name || 'Destination'}</a></h3>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderWhyChoose(layout) {
  const grid = document.querySelector('#why-us .features-grid');
  const items = Array.isArray(layout?.whyChooseItems) ? layout.whyChooseItems : [];
  if (!grid) return;

  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = '<p class="empty-row">Section Why Choose Us masih kosong. Silakan isi dari menu Layout di admin.</p>';
    return;
  }

  const activeItems = items.filter((item) => item.enabled !== false);
  if (!activeItems.length) {
    grid.innerHTML = '<p class="empty-row">Semua item Why Choose Us sedang disembunyikan dari admin.</p>';
    return;
  }

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
  if (!list) return;

  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<p class="empty-row">FAQ masih kosong. Silakan isi dari menu Layout di admin.</p>';
    return;
  }

  const activeItems = items.filter((item) => item.enabled !== false);
  if (!activeItems.length) {
    list.innerHTML = '<p class="empty-row">Semua FAQ sedang disembunyikan dari admin.</p>';
    return;
  }

  activeItems.forEach((item) => {
    const block = document.createElement('details');
    block.innerHTML = `
      <summary>${item.question || 'Question'}</summary>
      <p>${item.answer || ''}</p>
    `;
    list.appendChild(block);
  });
}

function formatCurrency(value, currencyCode = 'IDR') {
  const code = String(currencyCode || 'IDR').trim().toUpperCase() || 'IDR';
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${code} ${Number(value || 0).toLocaleString('id-ID')}`;
  }
}

function getTripCardImage(trip) {
  if (!trip) return null;

  const candidates = [trip.coverImage];
  const image = candidates.find((item) => typeof item === 'string' && item.trim());
  return image || null;
}

function createPackageCard(trip, settings) {
  const image = getTripCardImage(trip);
  if (!image) return null;

  const slug = trip.slug || slugify(trip.title);
  const article = document.createElement('article');
  article.className = 'package-card';
  article.innerHTML = `
    <img src="${image}" alt="${trip.title || 'Trip package'}" />
    <div class="card-content">
      <h3>${trip.title || 'Untitled Package'}</h3>
      <p>${trip.overview || trip.description || 'Explore this amazing package with our expert guides.'}</p>
      <div class="card-meta">
        <span>${trip.duration || trip.groupSize || 'N/A'}</span>
        <span class="price">${formatCurrency(trip.price, settings?.currencyCode)} / person</span>
      </div>
      <a href="trip.html?slug=${encodeURIComponent(slug)}" class="card-cta">View Details</a>
    </div>
  `;
  return article;
}

function renderSetupState(reason) {
  const titleNode = document.querySelector('.hero-content h1');
  const textNode = document.querySelector('.hero-copy');
  const packageGrid = document.getElementById('packages-grid');
  const destinationGrid = document.querySelector('#destinations .dest-grid');
  const blogGrid = document.querySelector('#blog .blog-grid');
  const whyGrid = document.querySelector('#why-us .features-grid');
  const faqList = document.querySelector('#faq .faq-list');

  if (titleNode) titleNode.textContent = 'Website belum siap tayang';
  if (textNode) textNode.textContent = 'Lengkapi konten dan layout di Admin Panel, lalu Push ke Supabase untuk menampilkan homepage.';

  if (packageGrid) {
    packageGrid.innerHTML = `<p class="empty-row">${reason}</p>`;
  }
  if (destinationGrid) {
    destinationGrid.innerHTML = '<p class="empty-row">Destination belum tersedia. Silakan isi dari admin dan push ke database.</p>';
  }
  if (blogGrid) {
    blogGrid.innerHTML = '<p class="empty-row">Konten blog belum diatur dari admin.</p>';
  }
  if (whyGrid) {
    whyGrid.innerHTML = '<p class="empty-row">Section Why Choose Us belum diatur dari admin.</p>';
  }
  if (faqList) {
    faqList.innerHTML = '<p class="empty-row">FAQ belum diatur dari admin.</p>';
  }
}

async function renderAdminPackages() {
  const grid = document.getElementById('packages-grid');
  if (!grid) return;

  const dbConfig = resolveSupabaseConfig();
  const adminData = loadAdminData();
  let settings = loadAdminSettings(adminData);
  let layout = resolveLayout(adminData);

  // Clear initial hardcoded cards so homepage never silently falls back to old static content.
  grid.innerHTML = '';

  let adminTrips = [];
  let adminDestinations = [];

  if (!dbConfig.enabled || !dbConfig.url || !dbConfig.anonKey) {
    renderSetupState('Supabase Sync belum aktif. Aktifkan Setup di admin lalu Push data terlebih dahulu.');
    return;
  }

  // Keep homepage data source consistent with admin setup: Supabase only when enabled.
  if (dbConfig.enabled && dbConfig.url && dbConfig.anonKey) {
    try {
      const [siteConfig, trips, destinations] = await Promise.all([
        loadSiteConfigFromSupabase(dbConfig),
        loadTripsFromSupabase(dbConfig),
        loadDestinationsFromSupabase(dbConfig),
      ]);

      if (siteConfig?.settings) {
        settings = { ...settings, ...siteConfig.settings };
      }
      layout = resolveFrontLayout(siteConfig);

      if (!Object.keys(layout).length) {
        renderSetupState('Layout Front Page belum diset di admin. Buka menu Layout lalu Save dan Push.');
        return;
      }

      adminTrips = trips;
      adminDestinations = destinations;
    } catch {
      renderSetupState('Gagal membaca data Supabase. Cek Setup admin dan koneksi database Anda.');
      return;
    }
  }

  applyHeaderMenu(layout);
  applyFooterMenu(layout);
  applyHeroImages(layout);
  applySectionLayout(layout);
  renderWhyChoose(layout);
  renderFaq(layout);

  renderDestinations(layout, adminDestinations);

  const activeTrips = adminTrips
    .filter((trip) => (trip.status || 'Active') === 'Active')
    .filter((trip) => Boolean(getTripCardImage(trip)));

  if (!activeTrips.length) {
    grid.innerHTML = '<p class="empty-row">Trip belum tampil karena data kosong atau Front Image belum diset di admin.</p>';
    return;
  }
  const columns = Number(layout?.packageGrid?.columns || 4);
  const rows = Number(layout?.packageGrid?.rows || 2);
  const total = Math.max(1, columns) * Math.max(1, rows);

  grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;
  activeTrips.slice(0, total).forEach((trip) => {
    const card = createPackageCard(trip, settings);
    if (card) grid.appendChild(card);
  });
}

window.addEventListener('load', renderAdminPackages);
