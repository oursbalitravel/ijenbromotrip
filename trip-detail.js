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
  const endpoint = `${config.url}/rest/v1/trips?select=id,title,overview,description,vehicle,duration,group_size,best_time,price,discount,status,cover_image,images,highlights,itinerary,faqs&order=updated_at.desc`;
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
    coverImage: row.cover_image || '',
    images: Array.isArray(row.images) ? row.images : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
  }));
}

async function loadSiteConfigFromSupabase(config) {
  if (!config.enabled || !config.url || !config.anonKey) return null;
  const endpoint = `${config.url}/rest/v1/site_settings?select=id,phone,currency_code,whatsapp_message_prefix,whatsapp_message_suffix,whatsapp_url_position,layout_json&id=eq.main&limit=1`;
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
      currencyCode: (row.currency_code || 'IDR').toUpperCase(),
      phone: row.phone || '',
      whatsappMessagePrefix: row.whatsapp_message_prefix || 'Halo, saya ingin booking trip ini: ',
      whatsappMessageSuffix: row.whatsapp_message_suffix || '',
      whatsappUrlPosition: row.whatsapp_url_position || 'after',
    },
    layout: row.layout_json && typeof row.layout_json === 'object' ? row.layout_json : {},
  };
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

function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
}

function renderBookingTemplate(text, trip, pageUrl) {
  const title = trip?.title || 'Trip package';
  const slug = trip?.slug || slugify(title);
  const url = pageUrl || window.location.href;

  return String(text || '')
    .replace(/\[\{url\}\]/gi, url)
    .replace(/\[\{title\}\]/gi, title)
    .replace(/\[\{slug\}\]/gi, slug)
    .trim();
}

function buildWhatsAppMessage(settings, trip, pageUrl) {
  const prefixTemplate = settings?.whatsappMessagePrefix || 'Halo, saya ingin booking trip ini: ';
  const suffixTemplate = settings?.whatsappMessageSuffix || '';
  const hasTokens = /\[\{(?:url|title|slug)\}\]/i.test(prefixTemplate) || /\[\{(?:url|title|slug)\}\]/i.test(suffixTemplate);

  if (hasTokens) {
    return [
      renderBookingTemplate(prefixTemplate, trip, pageUrl),
      renderBookingTemplate(suffixTemplate, trip, pageUrl),
    ].filter(Boolean).join(' ').trim();
  }

  const prefix = renderBookingTemplate(prefixTemplate, trip, pageUrl);
  const suffix = renderBookingTemplate(suffixTemplate, trip, pageUrl);
  const url = pageUrl || window.location.href;
  const ordered = (settings?.whatsappUrlPosition || 'after') === 'before'
    ? [url, prefix, suffix]
    : [prefix, url, suffix];

  return ordered.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function buildOrderLink(settings, trip) {
  const phone = normalizePhone(settings?.phone || '');
  if (!phone) return '#overview';
  const message = encodeURIComponent(buildWhatsAppMessage(settings, trip, window.location.href));
  return `https://wa.me/${phone}?text=${message}`;
}

function getTripImages(trip) {
  const images = Array.isArray(trip.images) ? trip.images.filter(Boolean) : [];
  const cover = trip?.coverImage ? [trip.coverImage] : [];
  const merged = [...cover, ...images.filter((img) => img !== trip?.coverImage)];
  return merged.length ? merged : ['https://via.placeholder.com/1200x700?text=Trip+Image'];
}

const defaultTripDetailSections = [
  { id: 'media', label: 'Media Gallery', enabled: true, caption: 'Gallery', title: 'Trip Gallery', text: '' },
  { id: 'header', label: 'Trip Header', enabled: true, caption: 'Trip Package', title: '', text: '' },
  { id: 'meta', label: 'Trip Meta', enabled: true, caption: 'Trip Info', title: 'Trip Information', text: '' },
  { id: 'overview', label: 'Overview', enabled: true, caption: 'Overview', title: 'Overview', text: '' },
  { id: 'itinerary', label: 'Itinerary', enabled: true, caption: 'Itinerary', title: 'Itinerary', text: '' },
  { id: 'cost', label: 'Cost', enabled: true, caption: 'Cost', title: 'Cost', text: '' },
  { id: 'know-before-you-go', label: 'Highlights', enabled: true, caption: 'Highlights', title: 'Know before you go', text: '' },
  { id: 'faq', label: 'FAQ', enabled: true, caption: 'FAQ', title: 'FAQ', text: '' },
  { id: 'sidebar', label: 'Sticky Order Card', enabled: true, caption: 'Order', title: 'Order now', text: '' },
];

function resolveTripDetailSections(layout) {
  const raw = layout?.tripDetailSections;
  if (!Array.isArray(raw) || !raw.length) return defaultTripDetailSections;
  return raw
    .filter((section) => section && typeof section === 'object')
    .map((section) => ({ ...section, id: String(section.id || ''), enabled: section.enabled !== false }))
    .filter((section) => section.id);
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

function renderTrip(trip, settings, layout) {
  const root = document.getElementById('trip-detail-root');
  if (!root) return;
  const images = getTripImages(trip);
  const highlights = Array.isArray(trip.highlights) ? trip.highlights.filter(Boolean) : [];
  const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const faqs = Array.isArray(trip.faqs) ? trip.faqs : [];
  const mainImage = images[0];
  const sectionConfig = resolveTripDetailSections(layout);
  const sectionMap = new Map(sectionConfig.map((section) => [section.id, section]));
  const shortcutSections = sectionConfig.filter((section) => ['overview', 'itinerary', 'cost', 'know-before-you-go', 'faq'].includes(section.id) && section.enabled !== false);
  const orderLink = buildOrderLink(settings, trip);

  const overviewSection = sectionMap.get('overview');
  const itinerarySection = sectionMap.get('itinerary');
  const costSection = sectionMap.get('cost');
  const highlightsSection = sectionMap.get('know-before-you-go');
  const faqSection = sectionMap.get('faq');
  const metaSection = sectionMap.get('meta');
  const headerSection = sectionMap.get('header');
  const mediaSection = sectionMap.get('media');
  const sidebarSection = sectionMap.get('sidebar');

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
          ${mediaSection?.enabled !== false ? `
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
          ` : ''}

          ${headerSection?.enabled !== false ? `
          <section class="trip-detail-head">
            <p class="section-label">${headerSection?.caption || 'Trip Package'}</p>
            <h1>${trip.title || 'Untitled Trip'}</h1>
            <p>${headerSection?.text || trip.overview || trip.description || ''}</p>
            <div class="trip-detail-shortcuts" aria-label="Section shortcuts">
              ${shortcutSections.map((section) => `<a class="trip-shortcut-link" href="#${section.id}">${section.label || section.id}</a>`).join('')}
            </div>
          </section>
          ` : ''}

          ${metaSection?.enabled !== false ? `
          <section class="trip-detail-meta">
            <div><strong>Duration</strong><span>${trip.duration || '-'}</span></div>
            <div><strong>Group Size</strong><span>${trip.groupSize || '-'}</span></div>
            <div><strong>Vehicle</strong><span>${trip.vehicle || '-'}</span></div>
            <div><strong>Best Time</strong><span>${trip.bestTime || '-'}</span></div>
          </section>
          ` : ''}

          ${overviewSection?.enabled !== false ? `
          <section class="trip-detail-body" id="overview">
            <h2>${overviewSection?.title || 'Overview'}</h2>
            <p>${trip.description || 'No description yet.'}</p>
            ${overviewSection?.text ? `<p>${overviewSection.text}</p>` : ''}
          </section>
          ` : ''}

          ${itinerarySection?.enabled !== false ? `
          <section class="trip-detail-body" id="itinerary">
            <h2>${itinerarySection?.title || 'Itinerary'}</h2>
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
            ${itinerarySection?.text ? `<p>${itinerarySection.text}</p>` : ''}
          </section>
          ` : ''}

          ${costSection?.enabled !== false ? `
          <section class="trip-detail-body" id="cost">
            <h2>${costSection?.title || 'Cost'}</h2>
            <div class="trip-cost-inline">
              <div>
                <p class="section-label">${costSection?.caption || 'From'}</p>
                <strong>${formatCurrency(trip.price, settings.currencyCode)}</strong>
              </div>
              <div>
                <p class="section-label">Discount</p>
                <strong>${Number(trip.discount || 0) ? `${trip.discount}%` : '-'}</strong>
              </div>
            </div>
            <p class="trip-cost-note">${costSection?.text || 'Price shown is for reference and can change based on availability.'}</p>
          </section>
          ` : ''}

          ${highlightsSection?.enabled !== false ? `
          <section class="trip-detail-body" id="know-before-you-go">
            <h2>${highlightsSection?.title || 'Know before you go'}</h2>
            <ul>
              ${highlights.length ? highlights.map((item) => `<li>${item}</li>`).join('') : '<li>No highlights yet.</li>'}
            </ul>
            ${highlightsSection?.text ? `<p>${highlightsSection.text}</p>` : ''}
          </section>
          ` : ''}

          ${faqSection?.enabled !== false ? `
          <section class="trip-detail-body" id="faq">
            <h2>${faqSection?.title || 'FAQ'}</h2>
            <div class="faq-list">
              ${faqs.length ? faqs.map((faq) => `<details><summary>${faq.question || 'Question'}</summary><p>${faq.answer || ''}</p></details>`).join('') : '<p>No FAQs yet.</p>'}
            </div>
            ${faqSection?.text ? `<p>${faqSection.text}</p>` : ''}
          </section>
          ` : ''}
        </main>

        ${sidebarSection?.enabled !== false ? `
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
        ` : ''}
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

  if (!config.enabled || !config.url || !config.anonKey) {
    renderNotFound();
    return;
  }

  const [trips, siteConfig] = await Promise.all([
    loadTripsFromSupabase(config),
    loadSiteConfigFromSupabase(config),
  ]);

  const trip = trips.find((item) => (item.slug || slugify(item.title)) === slug);
  if (!trip) {
    renderNotFound();
    return;
  }

  const settings = siteConfig?.settings || loadAdminSettings();
  const layout = siteConfig?.layout || {};
  renderTrip(trip, settings, layout);
}

window.addEventListener('load', bootTripPage);
