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

function loadAdminSettings() {
  const fallback = {
    currencyCode: 'IDR',
    phone: '',
    whatsappMessagePrefix: 'Halo, saya ingin booking trip ini: ',
    whatsappMessageSuffix: '',
    whatsappUrlPosition: 'after',
  };

  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...(parsed?.settings || {}),
      currencyCode: (parsed?.settings?.currencyCode || fallback.currencyCode).toUpperCase(),
      phone: parsed?.settings?.phone || '',
      whatsappMessagePrefix: parsed?.settings?.whatsappMessagePrefix || fallback.whatsappMessagePrefix,
      whatsappMessageSuffix: parsed?.settings?.whatsappMessageSuffix || fallback.whatsappMessageSuffix,
      whatsappUrlPosition: parsed?.settings?.whatsappUrlPosition || fallback.whatsappUrlPosition,
    };
  } catch {
    return fallback;
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

function formatCurrency(value, currencyCode = 'IDR') {
  const code = (currencyCode || 'IDR').toUpperCase();
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

function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
}

function buildWhatsAppMessage(settings, pageUrl) {
  const prefix = settings?.whatsappMessagePrefix || 'Halo, saya ingin booking trip ini: ';
  const suffix = settings?.whatsappMessageSuffix || '';
  const url = pageUrl || window.location.href;
  const ordered = (settings?.whatsappUrlPosition || 'after') === 'before'
    ? [url, prefix, suffix]
    : [prefix, url, suffix];

  return ordered.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function buildOrderLink(settings) {
  const phone = normalizePhone(settings?.phone || '');
  if (!phone) return '#overview';
  const message = encodeURIComponent(buildWhatsAppMessage(settings, window.location.href));
  return `https://wa.me/${phone}?text=${message}`;
}

function getTripImages(trip) {
  const images = Array.isArray(trip.images) ? trip.images.filter(Boolean) : [];
  return images.length ? images : ['https://via.placeholder.com/1200x700?text=Trip+Image'];
}

function closePreview(root) {
  const modal = root.querySelector('[data-preview-modal]');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function openPreview(root, src, alt) {
  const modal = root.querySelector('[data-preview-modal]');
  const image = root.querySelector('[data-preview-image]');
  const caption = root.querySelector('[data-preview-caption]');
  if (!modal || !image) return;
  image.src = src;
  image.alt = alt || 'Preview image';
  if (caption) {
    caption.textContent = alt || 'Preview image';
  }
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function bindTripInteractions(root) {
  root.querySelectorAll('[data-preview-src]').forEach((button) => {
    button.addEventListener('click', () => {
      const src = button.getAttribute('data-preview-src');
      const alt = button.getAttribute('data-preview-alt') || '';
      if (src) openPreview(root, src, alt);
    });
  });

  const modal = root.querySelector('[data-preview-modal]');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.matches('[data-preview-close]')) {
        closePreview(root);
      }
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePreview(root);
    }
  });
}

function getSlugParam() {
  const params = new URLSearchParams(window.location.search);
  return slugify(params.get('slug') || '');
}

function renderTrip(trip) {
  const root = document.getElementById('trip-detail-root');
  if (!root) return;
  const settings = loadAdminSettings();
  const images = getTripImages(trip);
  const highlights = Array.isArray(trip.highlights) ? trip.highlights.filter(Boolean) : [];
  const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const faqs = Array.isArray(trip.faqs) ? trip.faqs : [];
  const mainImage = images[0];
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'cost', label: 'Cost' },
    { id: 'know-before-you-go', label: 'Know before you go' },
  ];
  const orderLink = buildOrderLink(settings);

  root.innerHTML = `
    <article class="trip-detail-shell">
      <nav class="trip-breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a>
        <span>/</span>
        <a href="index.html#packages">Trip Package</a>
        <span>/</span>
        <span>${trip.title || 'Trip detail'}</span>
      </nav>

      <div class="trip-detail-layout">
        <main class="trip-detail-main">
          <section class="trip-media-grid">
            <button type="button" class="trip-image-trigger trip-media-main-button" data-preview-src="${mainImage}" data-preview-alt="${trip.title || 'Trip'}">
              <img class="trip-media-main" src="${mainImage}" alt="${trip.title || 'Trip'}" />
            </button>
            <div class="trip-media-side">
              ${images.slice(1, 5).map((src, idx) => `
                <button type="button" class="trip-image-trigger" data-preview-src="${src}" data-preview-alt="${trip.title || 'Trip'} image ${idx + 2}">
                  <img src="${src}" alt="Gallery ${idx + 2}" />
                </button>
              `).join('')}
            </div>
          </section>

          <section class="trip-detail-head">
            <p class="section-label">Trip Package</p>
            <h1>${trip.title || 'Untitled Trip'}</h1>
            <p>${trip.overview || trip.description || ''}</p>
            <div class="trip-detail-shortcuts" aria-label="Section shortcuts">
              ${sections.map((section) => `<a class="trip-shortcut-link" href="#${section.id}">${section.label}</a>`).join('')}
            </div>
          </section>

          <section class="trip-detail-meta">
            <div><strong>Duration</strong><span>${trip.duration || '-'}</span></div>
            <div><strong>Group Size</strong><span>${trip.groupSize || '-'}</span></div>
            <div><strong>Vehicle</strong><span>${trip.vehicle || '-'}</span></div>
            <div><strong>Best Time</strong><span>${trip.bestTime || '-'}</span></div>
          </section>

          <section class="trip-detail-body" id="overview">
            <h2>Overview</h2>
            <p>${trip.description || 'No description yet.'}</p>
          </section>

          <section class="trip-detail-body" id="itinerary">
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

          <section class="trip-detail-body" id="cost">
            <h2>Cost</h2>
            <div class="trip-cost-inline">
              <div>
                <p class="section-label">From</p>
                <strong>${formatCurrency(trip.price, settings.currencyCode)}</strong>
              </div>
              <div>
                <p class="section-label">Discount</p>
                <strong>${Number(trip.discount || 0) ? `${trip.discount}%` : '-'}</strong>
              </div>
            </div>
            <p class="trip-cost-note">Price shown is for reference and can change based on availability.</p>
          </section>

          <section class="trip-detail-body" id="know-before-you-go">
            <h2>Know before you go</h2>
            <ul>
              ${highlights.length ? highlights.map((item) => `<li>${item}</li>`).join('') : '<li>No highlights yet.</li>'}
            </ul>
          </section>

          <section class="trip-detail-body" id="faq">
            <h2>FAQ</h2>
            <div class="faq-list">
              ${faqs.length ? faqs.map((faq) => `<details><summary>${faq.question || 'Question'}</summary><p>${faq.answer || ''}</p></details>`).join('') : '<p>No FAQs yet.</p>'}
            </div>
          </section>
        </main>

        <aside class="trip-detail-sidebar">
          <div class="trip-sticky-card">
            <div class="trip-sticky-price-header">
              <span>${(settings.currencyCode || 'IDR').toUpperCase()}</span>
              <span class="trip-sticky-badge">Best price guaranteed</span>
            </div>
            <div class="trip-sticky-price-block">
              <p>From</p>
              <strong>${formatCurrency(trip.price, settings.currencyCode)}</strong>
              <span>/ Adult</span>
            </div>
            <ul class="trip-includes-list">
              <li>Best Price Guaranteed</li>
              <li>No Booking Fees</li>
              <li>Professional Local Guide</li>
            </ul>
            <a class="primary-btn trip-order-btn" href="${orderLink}" target="_blank" rel="noreferrer">Order Now</a>
            <a class="trip-availability-link" href="#overview">Check Availability</a>
            <p class="trip-contact-note">Hi, we are ready to help you order this trip package.</p>
          </div>
        </aside>
      </div>

      <div class="trip-image-preview-modal" data-preview-modal aria-hidden="true">
        <div class="trip-image-preview-dialog" role="dialog" aria-modal="true" aria-label="Image preview">
          <button type="button" class="trip-image-preview-close" data-preview-close>×</button>
          <img data-preview-image src="${mainImage}" alt="${trip.title || 'Trip'}" />
          <p data-preview-caption>${trip.title || 'Trip'} image</p>
        </div>
      </div>
    </article>
  `;

  bindTripInteractions(root);
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

  let trips = await loadTripsFromSupabase(config);
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
