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

  const endpoint = `${config.url}/rest/v1/destinations?select=*&order=updated_at.desc`;
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

  const endpoint = `${config.url}/rest/v1/site_settings?select=id,layout_json&id=eq.main&limit=1`;
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
    layout: row.layout_json && typeof row.layout_json === 'object' ? row.layout_json : {},
  };
}

const defaultDestinationDetailSections = [
  { id: 'media', label: 'Media Gallery', enabled: true, caption: 'Gallery', title: 'Destination Gallery', text: '' },
  { id: 'header', label: 'Destination Header', enabled: true, caption: 'Destination', title: '', text: '' },
  { id: 'about', label: 'About', enabled: true, caption: 'About', title: 'About', text: '' },
  { id: 'highlights', label: 'Highlights', enabled: true, caption: 'Highlights', title: 'Highlights', text: '' },
  { id: 'faq', label: 'FAQ', enabled: true, caption: 'FAQ', title: 'Frequently Asked Questions', text: '' },
  { id: 'meta', label: 'Meta', enabled: true, caption: 'Meta', title: 'Destination Info', text: '' },
];

function resolveDestinationDetailSections(layout) {
  const raw = layout?.destinationDetailSections;
  if (!Array.isArray(raw) || !raw.length) return defaultDestinationDetailSections;
  return raw
    .filter((section) => section && typeof section === 'object')
    .map((section) => ({ ...section, id: String(section.id || ''), enabled: section.enabled !== false }))
    .filter((section) => section.id);
}

function getSlugParam() {
  const params = new URLSearchParams(window.location.search);
  return slugify(params.get('slug') || '');
}

function renderDestination(destination, layout) {
  const root = document.getElementById('destination-detail-root');
  if (!root) return;

  const image = destination.image || 'https://via.placeholder.com/1200x700?text=Destination';
  const title = destination.name || 'Untitled Destination';
  const gallery = Array.isArray(destination.images) && destination.images.length > 0 ? destination.images : [image];
  const sections = resolveDestinationDetailSections(layout);
  const byId = new Map(sections.map((section) => [section.id, section]));
  const highlightsSection = byId.get('highlights');
  const faqSection = byId.get('faq');
  const aboutSection = byId.get('about');
  const mediaSection = byId.get('media');
  const headerSection = byId.get('header');
  const metaSection = byId.get('meta');

  const highlightsHtml = highlightsSection?.enabled !== false && Array.isArray(destination.highlights) && destination.highlights.length > 0
    ? `<section class="trip-detail-highlights">
         <h2>${highlightsSection?.title || 'Highlights'}</h2>
         <ul>
           ${destination.highlights.map(h => `<li>${h}</li>`).join('')}
         </ul>
         ${highlightsSection?.text ? `<p>${highlightsSection.text}</p>` : ''}
       </section>`
    : highlightsSection?.enabled !== false
      ? '<section class="trip-detail-highlights"><h2>Highlights</h2><p>No highlights yet. Add content from admin.</p></section>'
      : '';
  
  const faqsHtml = faqSection?.enabled !== false && Array.isArray(destination.faqs) && destination.faqs.length > 0
    ? `<section class="trip-detail-faqs">
         <h2>${faqSection?.title || 'Frequently Asked Questions'}</h2>
         <div class="faq-list">
           ${destination.faqs.map(f => `
             <details class="faq-item">
               <summary>${f.question}</summary>
               <p>${f.answer}</p>
             </details>
           `).join('')}
         </div>
         ${faqSection?.text ? `<p>${faqSection.text}</p>` : ''}
       </section>`
    : faqSection?.enabled !== false
      ? '<section class="trip-detail-faqs"><h2>FAQ</h2><p>No FAQs yet. Add content from admin.</p></section>'
      : '';

  const galleryHtml = gallery.length > 1
    ? `<div class="trip-media-side">
         ${gallery.slice(1, 5).map(img => `<img src="${img}" alt="${title}" />`).join('')}
       </div>`
    : `<div class="trip-media-side">
         <img src="${image}" alt="${title}" />
         <img src="${image}" alt="${title}" />
         <img src="${image}" alt="${title}" />
         <img src="${image}" alt="${title}" />
       </div>`;

  root.innerHTML = `
    <article class="trip-detail-shell">
      ${mediaSection?.enabled !== false ? `
      <section class="trip-media-grid">
        <img class="trip-media-main" src="${image}" alt="${title}" />
        ${galleryHtml}
      </section>
      ` : ''}

      ${headerSection?.enabled !== false ? `
      <section class="trip-detail-head">
        <p class="section-label">${headerSection?.caption || 'Destination'}</p>
        <h1>${title}</h1>
        <p>${headerSection?.text || destination.summary || ''}</p>
      </section>
      ` : ''}

      ${aboutSection?.enabled !== false && destination.description ? `
      <section class="trip-detail-body">
        <h2>${aboutSection?.title || 'About'}</h2>
        <p>${destination.description}</p>
        ${aboutSection?.text ? `<p>${aboutSection.text}</p>` : ''}
      </section>
      ` : (aboutSection?.enabled !== false ? '<section class="trip-detail-body"><h2>About</h2><p>No description yet. Add content from admin.</p></section>' : '')}

      ${highlightsHtml}

      ${faqsHtml}

      ${metaSection?.enabled !== false ? `
      <section class="trip-detail-meta">
        <div><strong>Status</strong><span>${destination.status || 'Active'}</span></div>
        <div><strong>Slug</strong><span>${destination.slug || slugify(destination.name)}</span></div>
      </section>
      ` : ''}
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

  if (!config.enabled || !config.url || !config.anonKey) {
    renderNotFound();
    return;
  }

  const [destinations, siteConfig] = await Promise.all([
    loadDestinationsFromSupabase(config),
    loadSiteConfigFromSupabase(config),
  ]);

  const destination = destinations.find((item) => (item.slug || slugify(item.name)) === slug);
  if (!destination) {
    renderNotFound();
    return;
  }

  renderDestination(destination, siteConfig?.layout || {});
}

window.addEventListener('load', bootDestinationPage);
