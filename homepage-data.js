const ADMIN_STORAGE_KEY = 'ijen-bromo-admin-data';

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
  const adminTrips = loadAdminTrips();
  if (!adminTrips.length) return;
  grid.innerHTML = '';
  adminTrips.slice(0, 8).forEach((trip) => grid.appendChild(createPackageCard(trip)));
}

window.addEventListener('load', renderAdminPackages);
