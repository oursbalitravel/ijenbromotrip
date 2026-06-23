import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'ijen-bromo-admin-data';
const DB_CONFIG_KEY = 'ijen-bromo-db-config';
const defaultState = {
  trips: [
    {
      id: crypto.randomUUID(),
      title: 'Ijen Blue Fire & Bromo Sunrise',
      overview: 'Two iconic volcano experiences in one premium package.',
      description: 'Explore Mount Ijen, watch the famous blue fire, and catch sunrise at Mount Bromo with an expert guide.',
      highlights: ['Blue fire trekking', 'Bromo sunrise view', 'Local transport included'],
      vehicle: 'Jeep + Bus',
      duration: '3D2N',
      groupSize: '12 pax',
      bestTime: 'Apr - Oct',
      price: 210,
      discount: 15,
      status: 'Active',
      images: [],
      itinerary: [
        {
          day: 'Day 1',
          items: [{ time: '10:00', activity: 'Pickup and transfer to hotel' }],
        },
        {
          day: 'Day 2',
          items: [{ time: '01:30', activity: 'Ijen Blue Fire trek and crater tour' }],
        },
      ],
      faqs: [
        { question: 'Is transportation included?', answer: 'Yes, all transfers are included in the package.' },
      ],
    },
  ],
  services: [
    { id: crypto.randomUUID(), name: 'Airport Pickup', type: 'Per Booking', price: 35, status: 'Active' },
    { id: crypto.randomUUID(), name: 'Breakfast Package', type: 'Per Pax', price: 12, status: 'Active' },
  ],
  settings: {
    companyName: 'Ijen Bromo Trip',
    address: 'Jl. Bromo No. 12, East Java, Indonesia',
    phone: '+62 812 3456 7890',
    email: 'support@ijenbromotrip.com',
    logo: '',
  },
  users: 1240,
  bookings: 820,
  revenue: 45230,
};

function saveStorage(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const homepageDefaultTrips = [
  {
    id: 'homepage-trip-1',
    title: 'Ijen Blue Fire Adventure',
    overview: 'Experience the iconic blue flame and sunrise view with local expert guides.',
    description: 'Witness the rare natural phenomenon of blue fire deep inside the Ijen crater, then enjoy a stunning sunrise above the acidic turquoise lake. Our experienced local guides ensure a safe and unforgettable journey.',
    highlights: ['Blue fire trekking', 'Ijen crater sunrise', 'Acidic lake view', 'Local expert guide'],
    vehicle: 'Jeep + Trek',
    duration: '1D',
    groupSize: '10 pax',
    bestTime: 'Apr - Oct',
    price: 120,
    discount: 0,
    status: 'Active',
    images: ['https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80'],
    itinerary: [
      { day: 'Day 1', items: [
        { time: '23:00', activity: 'Pickup from hotel in Banyuwangi / Bondowoso' },
        { time: '01:30', activity: 'Start trek to Ijen crater' },
        { time: '02:30', activity: 'Arrive at crater, witness Blue Fire' },
        { time: '05:00', activity: 'Sunrise view at crater rim' },
        { time: '07:00', activity: 'Descend and return to hotel' },
      ]},
    ],
    faqs: [
      { question: 'What should I bring?', answer: 'Warm jacket, mask, sturdy shoes, headlamp, and water.' },
      { question: 'Is it suitable for beginners?', answer: 'Yes, with a guide and moderate fitness it is accessible for most people.' },
    ],
  },
  {
    id: 'homepage-trip-2',
    title: 'Mount Bromo Sunrise Trip',
    overview: 'Catch sunrise over the volcanic crater and ride through the Sea of Sand.',
    description: 'Rise before dawn for a 4WD jeep ride across the famous Sea of Sand, then hike to the Bromo viewpoint for a breathtaking sunrise. Descend to the crater rim and peer into the active volcano.',
    highlights: ['4WD jeep ride', 'Sea of Sand crossing', 'Penanjakan sunrise viewpoint', 'Bromo crater visit'],
    vehicle: 'Jeep',
    duration: '1D',
    groupSize: '6 pax',
    bestTime: 'Apr - Oct',
    price: 95,
    discount: 0,
    status: 'Active',
    images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'],
    itinerary: [
      { day: 'Day 1', items: [
        { time: '03:00', activity: 'Pickup from hotel' },
        { time: '04:00', activity: 'Jeep ride to Penanjakan viewpoint' },
        { time: '05:00', activity: 'Sunrise viewing' },
        { time: '07:00', activity: 'Drive across Sea of Sand to Bromo crater' },
        { time: '09:00', activity: 'Return to hotel' },
      ]},
    ],
    faqs: [
      { question: 'Is transportation included?', answer: 'Yes, 4WD jeep from your hotel is included.' },
    ],
  },
  {
    id: 'homepage-trip-3',
    title: 'Waterfalls of East Java',
    overview: 'Discover Tumpak Sewu, Madakaripura, and hidden waterfall gems.',
    description: 'Explore the most spectacular waterfalls of East Java in one day. Visit the iconic curtain waterfall Tumpak Sewu and the towering Madakaripura, set inside a narrow jungle canyon.',
    highlights: ['Tumpak Sewu waterfall', 'Madakaripura canyon', 'Jungle trekking', 'Professional guide'],
    vehicle: 'Minibus',
    duration: '1D',
    groupSize: '12 pax',
    bestTime: 'May - Sep',
    price: 135,
    discount: 0,
    status: 'Active',
    images: ['https://images.unsplash.com/photo-1519648023493-d82b5f8d7cde?auto=format&fit=crop&w=800&q=80'],
    itinerary: [
      { day: 'Day 1', items: [
        { time: '06:00', activity: 'Pickup from hotel' },
        { time: '09:00', activity: 'Arrive Tumpak Sewu, trek to base' },
        { time: '12:00', activity: 'Lunch at local warung' },
        { time: '13:30', activity: 'Drive to Madakaripura waterfall' },
        { time: '17:00', activity: 'Return to hotel' },
      ]},
    ],
    faqs: [
      { question: 'Do I need to swim?', answer: 'Light wading is needed inside Madakaripura canyon. Wear quick-dry clothes.' },
    ],
  },
  {
    id: 'homepage-trip-4',
    title: 'Full Ijen Bromo Combo',
    overview: 'A perfect 3-day itinerary covering both Ijen and Bromo highlights.',
    description: 'The ultimate East Java volcanic experience: two full days covering Mount Ijen blue fire trek and Mount Bromo sunrise jeep tour, with comfortable hotel stays included.',
    highlights: ['Ijen Blue Fire trek', 'Bromo sunrise & crater', 'Hotel accommodation', 'All transport included'],
    vehicle: 'Jeep + Bus',
    duration: '3D2N',
    groupSize: '8 pax',
    bestTime: 'Apr - Oct',
    price: 210,
    discount: 15,
    status: 'Active',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    itinerary: [
      { day: 'Day 1', items: [{ time: '10:00', activity: 'Pickup and transfer to hotel Banyuwangi' }] },
      { day: 'Day 2', items: [
        { time: '23:00', activity: 'Depart for Ijen Blue Fire trek' },
        { time: '05:00', activity: 'Return to hotel, rest' },
      ]},
      { day: 'Day 3', items: [
        { time: '03:00', activity: 'Depart for Bromo sunrise' },
        { time: '09:00', activity: 'Return transfer, end of tour' },
      ]},
    ],
    faqs: [
      { question: 'Is accommodation included?', answer: 'Yes, 2 nights at a local guesthouse are included.' },
      { question: 'Can I customise the itinerary?', answer: 'Yes, contact us before booking for adjustments.' },
    ],
  },
];

function loadStorage() {
  if (typeof window === 'undefined') return defaultState;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    return JSON.parse(raw);
  } catch {
    return defaultState;
  }
}

function loadDbConfig() {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '', enabled: false };
  }

  const raw = localStorage.getItem(DB_CONFIG_KEY);
  if (!raw) {
    return { url: '', anonKey: '', enabled: false };
  }

  try {
    return { url: '', anonKey: '', enabled: false, ...JSON.parse(raw) };
  } catch {
    return { url: '', anonKey: '', enabled: false };
  }
}

function saveDbConfig(config) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
}

function hasDbConfig(config) {
  return Boolean(config?.url && config?.anonKey);
}

function sanitizeUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

function getSupabaseClient(config) {
  if (!hasDbConfig(config)) return null;

  return createClient(sanitizeUrl(config.url), config.anonKey.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function makeTestClient(config) {
  return createClient(sanitizeUrl(config.url), config.anonKey.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatSupabaseError(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;

  const message = error.message || error.error_description || error.toString();
  const code = error.code ? ` [${error.code}]` : '';
  const details = error.details ? ` ${error.details}` : '';
  const hint = error.hint ? ` Hint: ${error.hint}` : '';
  return `${message}${code}${details}${hint}`.trim();
}

function mapTripRowToState(row) {
  return {
    id: row.id,
    title: row.title || '',
    overview: row.overview || '',
    description: row.description || '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [''],
    vehicle: row.vehicle || '',
    duration: row.duration || '',
    groupSize: row.group_size || '',
    bestTime: row.best_time || '',
    price: Number(row.price ?? 0),
    discount: Number(row.discount ?? 0),
    status: row.status || 'Active',
    images: Array.isArray(row.images) ? row.images : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
  };
}

function normalizeTripForDb(trip) {
  return {
    id: trip.id,
    title: trip.title || '',
    overview: trip.overview || '',
    description: trip.description || '',
    vehicle: trip.vehicle || '',
    duration: trip.duration || '',
    group_size: trip.groupSize || '',
    best_time: trip.bestTime || '',
    price: Number(trip.price ?? 0),
    discount: Number(trip.discount ?? 0),
    status: trip.status || 'Active',
    images: Array.isArray(trip.images) ? trip.images : [],
    highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
    itinerary: Array.isArray(trip.itinerary) ? trip.itinerary : [],
    faqs: Array.isArray(trip.faqs) ? trip.faqs : [],
    updated_at: new Date().toISOString(),
  };
}

function mapServiceRowToState(row) {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'Per Pax',
    price: Number(row.price ?? 0),
    status: row.status || 'Active',
  };
}

function normalizeServiceForDb(service) {
  return {
    id: service.id,
    name: service.name || '',
    type: service.type || 'Per Pax',
    price: Number(service.price ?? 0),
    status: service.status || 'Active',
    updated_at: new Date().toISOString(),
  };
}

function normalizeSettingsForDb(settings) {
  return {
    id: 'main',
    company_name: settings.companyName || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    logo: settings.logo || '',
    updated_at: new Date().toISOString(),
  };
}

function mapSettingsRowToState(row) {
  if (!row) {
    return defaultState.settings;
  }

  return {
    companyName: row.company_name || defaultState.settings.companyName,
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    logo: row.logo || '',
  };
}

function normalizeMetricsForDb(payload) {
  return {
    id: 'main',
    users: Number(payload.users ?? 0),
    bookings: Number(payload.bookings ?? 0),
    revenue: Number(payload.revenue ?? 0),
    updated_at: new Date().toISOString(),
  };
}

async function pullRemoteData(config) {
  const supabase = getSupabaseClient(config);
  if (!supabase) return null;

  const [tripsResult, servicesResult, settingsResult, metricsResult] = await Promise.all([
    supabase
      .from('trips')
      .select('id,title,overview,description,vehicle,duration,group_size,best_time,price,discount,status,images,highlights,itinerary,faqs,updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('services')
      .select('id,name,type,price,status,updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('site_settings')
      .select('id,company_name,address,phone,email,logo,updated_at')
      .eq('id', 'main')
      .maybeSingle(),
    supabase
      .from('site_metrics')
      .select('id,users,bookings,revenue,updated_at')
      .eq('id', 'main')
      .maybeSingle(),
  ]);

  if (tripsResult.error) throw tripsResult.error;
  if (servicesResult.error) throw servicesResult.error;
  if (settingsResult.error) throw settingsResult.error;
  if (metricsResult.error) throw metricsResult.error;

  return {
    ...defaultState,
    trips: (tripsResult.data || []).map(mapTripRowToState),
    services: (servicesResult.data || []).map(mapServiceRowToState),
    settings: mapSettingsRowToState(settingsResult.data),
    users: Number(metricsResult.data?.users ?? defaultState.users),
    bookings: Number(metricsResult.data?.bookings ?? defaultState.bookings),
    revenue: Number(metricsResult.data?.revenue ?? defaultState.revenue),
  };
}

async function syncCollection(supabase, table, rows) {
  if (rows.length) {
    const { error: upsertError } = await supabase
      .from(table)
      .upsert(rows, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select('id');

  if (existingError) throw existingError;

  const keepIds = new Set(rows.map((row) => row.id));
  const deleteIds = (existingRows || [])
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));

  if (deleteIds.length) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .in('id', deleteIds);

    if (deleteError) throw deleteError;
  }
}

async function pushRemoteData(config, payload) {
  const supabase = getSupabaseClient(config);
  if (!supabase) {
    throw new Error('Database config is incomplete.');
  }

  const tripRows = (payload.trips || []).map(normalizeTripForDb);
  const serviceRows = (payload.services || []).map(normalizeServiceForDb);

  await syncCollection(supabase, 'trips', tripRows);
  await syncCollection(supabase, 'services', serviceRows);

  const { error: settingsError } = await supabase
    .from('site_settings')
    .upsert(normalizeSettingsForDb(payload.settings || defaultState.settings), { onConflict: 'id' });
  if (settingsError) throw settingsError;

  const { error: metricsError } = await supabase
    .from('site_metrics')
    .upsert(normalizeMetricsForDb(payload), { onConflict: 'id' });
  if (metricsError) throw metricsError;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Sidebar({ active, onSelect, settings }) {
  const menu = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'trips', label: 'Trip', icon: '🧳' },
    { key: 'services', label: 'Extra Service', icon: '✨' },
    { key: 'setup', label: 'Setup', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">IB</div>
        <div>
          <p className="brand-name">{settings.companyName || 'Ijen Bromo Trip'}</p>
          <p className="brand-scope">Admin Panel</p>
        </div>
      </div>
      <nav className="nav-list">
        {menu.map((item) => (
          <button
            key={item.key}
            type="button"
            className={classNames('nav-link', active === item.key && 'active')}
            onClick={() => onSelect(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Alert({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={classNames('alert', type === 'success' ? 'alert-success' : 'alert-error')}>
      <span>{message}</span>
      <button className="alert-close" onClick={onClose}>×</button>
    </div>
  );
}

function DashboardPanel({ data, onNavigate }) {
  return (
    <div className="panel-grid">
      <div className="panel-card">
        <p className="panel-label">Total Trips</p>
        <h3>{data.trips.length}</h3>
      </div>
      <div className="panel-card">
        <p className="panel-label">Total Bookings</p>
        <h3>{data.bookings}</h3>
      </div>
      <div className="panel-card">
        <p className="panel-label">Total Users</p>
        <h3>{data.users}</h3>
      </div>
      <div className="panel-card">
        <p className="panel-label">Revenue</p>
        <h3>${data.revenue.toLocaleString()}</h3>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, actions }) {
  return (
    <div className="section-header-panel">
      <div>
        <p className="section-label">{title}</p>
        <h2>{description}</h2>
      </div>
      {actions && <div className="button-row">{actions}</div>}
    </div>
  );
}

function TripsView({ data, onAdd, onEdit, onDelete, onNotify }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const openNew = () => {
    setFormData(null);
    setIsFormOpen(true);
  };

  const openEdit = (trip) => {
    setFormData(trip);
    setIsFormOpen(true);
  };

  return (
    <div className="page-panel">
      <SectionHeader
        title="Trips"
        description="Manage Trip Packages"
        actions={<button type="button" className="primary-btn" onClick={openNew}>+ Add New Trip</button>}
      />
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.trips.map((trip) => (
              <tr key={trip.id}>
                <td>
                  <div className="thumb-cell">
                    <img src={trip.images[0] || 'https://via.placeholder.com/120x90?text=Trip'} alt={trip.title} />
                  </div>
                </td>
                <td>{trip.title}</td>
                <td>{trip.duration}</td>
                <td>${trip.price}</td>
                <td>{trip.status}</td>
                <td>
                  <div className="action-group">
                    <button className="text-btn" onClick={() => openEdit(trip)}>Edit</button>
                    <button className="text-btn text-btn-danger" onClick={() => onDelete(trip.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.trips.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-row">No trips available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isFormOpen && (
        <TripForm
          existing={formData}
          onSave={(trip, isUpdate) => {
            onAdd(trip, isUpdate);
            setIsFormOpen(false);
            onNotify(isUpdate ? 'Package has been updated successfully' : 'New package has been added successfully', 'success');
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

function ServicesView({ data, onSave, onDelete, onNotify }) {
  const [service, setService] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openNew = () => {
    setService(null);
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setService(item);
    setIsFormOpen(true);
  };

  return (
    <div className="page-panel">
      <SectionHeader
        title="Extra Service"
        description="Manage extra booking services"
        actions={<button type="button" className="primary-btn" onClick={openNew}>+ Add New Service</button>}
      />
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>${item.price}</td>
                <td>{item.status}</td>
                <td>
                  <div className="action-group">
                    <button className="text-btn" onClick={() => openEdit(item)}>Edit</button>
                    <button className="text-btn text-btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.services.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No extra services yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isFormOpen && (
        <ServiceForm
          existing={service}
          onSave={(item, isUpdate) => {
            onSave(item, isUpdate);
            setIsFormOpen(false);
            onNotify(isUpdate ? 'Service updated successfully' : 'Service added successfully', 'success');
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

function SetupView({ settings, dbConfig, onSave, onSaveDbConfig, onTestDb, onPullDb, onPushDb, onNotify }) {
  const [form, setForm] = useState(settings);
  const [logoPreview, setLogoPreview] = useState(settings.logo || '');
  const [dbForm, setDbForm] = useState(dbConfig);

  useEffect(() => {
    setForm(settings);
    setLogoPreview(settings.logo || '');
  }, [settings]);

  useEffect(() => {
    setDbForm(dbConfig);
  }, [dbConfig]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (file) => {
    if (!file) return;
    const url = await convertImageToWebp(file);
    setForm((prev) => ({ ...prev, logo: url }));
    setLogoPreview(url);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
    onNotify('Setup changes saved successfully', 'success');
  };

  const handleDbSave = () => {
    onSaveDbConfig(dbForm);
    onNotify('Supabase connection settings saved', 'success');
  };

  return (
    <div className="page-panel">
      <SectionHeader title="Setup" description="Global website settings" />
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Company Name
              <input value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} required />
            </label>
            <label>
              Address
              <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} required />
            </label>
            <label>
              Phone Number
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </label>
            <label className="logo-upload">
              Logo Upload
              <div className="upload-box">
                {logoPreview ? <img src={logoPreview} alt="Logo preview" /> : <span>Upload logo</span>}
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
              </div>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">Save Settings</button>
          </div>
        </form>
      </div>

      <div className="form-card">
        <SectionHeader title="Database" description="Supabase connection for global sync" />
        <div className="form-grid">
          <label>
            Supabase Project URL
            <input
              value={dbForm.url}
              onChange={(e) => setDbForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-project-ref.supabase.co"
            />
          </label>
          <label>
            Supabase Anon Key
            <input
              value={dbForm.anonKey}
              onChange={(e) => setDbForm((prev) => ({ ...prev, anonKey: e.target.value }))}
              placeholder="eyJhbGciOi..."
            />
          </label>
          <label>
            Enable Supabase Sync
            <select
              value={dbForm.enabled ? 'yes' : 'no'}
              onChange={(e) => setDbForm((prev) => ({ ...prev, enabled: e.target.value === 'yes' }))}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="primary-btn" onClick={handleDbSave}>Save DB Config</button>
          <button type="button" className="secondary-btn" onClick={() => onTestDb(dbForm)}>Test Connection</button>
          <button type="button" className="secondary-btn" onClick={() => onPullDb(dbForm)}>Pull from Supabase</button>
          <button type="button" className="secondary-btn" onClick={() => onPushDb(dbForm)}>Push to Supabase</button>
        </div>
      </div>
    </div>
  );
}

function TripForm({ existing, onSave, onCancel }) {
  const emptyTrip = {
    id: crypto.randomUUID(),
    title: '',
    overview: '',
    description: '',
    highlights: [''],
    vehicle: '',
    duration: '',
    groupSize: '',
    bestTime: '',
    price: 0,
    discount: 0,
    status: 'Active',
    images: [],
    itinerary: [{ day: 'Day 1', items: [{ time: '', activity: '' }] }],
    faqs: [{ question: '', answer: '' }],
  };

  const [form, setForm] = useState(existing || emptyTrip);
  const [previewImages, setPreviewImages] = useState(existing?.images || []);

  useEffect(() => {
    setForm(existing || emptyTrip);
    setPreviewImages(existing?.images || []);
  }, [existing]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (files) => {
    const filesArray = Array.from(files || []);
    const converted = await Promise.all(filesArray.map(convertImageToWebp));
    const merged = [...previewImages, ...converted].slice(0, 8);
    setPreviewImages(merged);
    setForm((prev) => ({ ...prev, images: merged }));
  };

  const handleSetFrontImage = (index) => {
    if (index <= 0 || index >= previewImages.length) return;
    const reordered = [
      previewImages[index],
      ...previewImages.filter((_, idx) => idx !== index),
    ];
    setPreviewImages(reordered);
    setForm((prev) => ({ ...prev, images: reordered }));
  };

  const handleDeleteImage = (index) => {
    const updated = previewImages.filter((_, idx) => idx !== index);
    setPreviewImages(updated);
    setForm((prev) => ({ ...prev, images: updated }));
  };

  const handleHighlightChange = (index, value) => {
    const highlights = [...form.highlights];
    highlights[index] = value;
    setForm((prev) => ({ ...prev, highlights }));
  };

  const addHighlight = () => setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ''] }));

  const updateItineraryItem = (dayIndex, itemIndex, key, value) => {
    const itinerary = form.itinerary.map((day, idx) => {
      if (idx !== dayIndex) return day;
      const items = day.items.map((item, itemIdx) => itemIdx === itemIndex ? { ...item, [key]: value } : item);
      return { ...day, items };
    });
    setForm((prev) => ({ ...prev, itinerary }));
  };

  const addItineraryDay = () => setForm((prev) => ({
    ...prev,
    itinerary: [...prev.itinerary, { day: `Day ${prev.itinerary.length + 1}`, items: [{ time: '', activity: '' }] }],
  }));

  const addItineraryItem = (dayIndex) => {
    const itinerary = form.itinerary.map((day, idx) => idx === dayIndex ? { ...day, items: [...day.items, { time: '', activity: '' }] } : day);
    setForm((prev) => ({ ...prev, itinerary }));
  };

  const setFaq = (index, key, value) => {
    const faqs = form.faqs.map((faq, idx) => idx === index ? { ...faq, [key]: value } : faq);
    setForm((prev) => ({ ...prev, faqs }));
  };

  const addFaq = () => setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form, Boolean(existing));
  };

  return (
    <div className="overlay-panel">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="section-label">{existing ? 'Edit Package' : 'Add Package'}</p>
            <h2>{existing ? 'Update trip package' : 'Create new trip package'}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onCancel}>×</button>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Info</h3>
            <div className="form-grid-2">
              <label>
                Package Name
                <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
              </label>
              <label>
                Duration
                <input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="e.g. 3D2N" required />
              </label>
              <label>
                Overview
                <input value={form.overview} onChange={(e) => update('overview', e.target.value)} required />
              </label>
              <label>
                Group Size
                <input value={form.groupSize} onChange={(e) => update('groupSize', e.target.value)} required />
              </label>
            </div>
            <label>
              Description
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows="4" required />
            </label>
            <div>
              <p className="label-note">Highlights</p>
              {form.highlights.map((item, idx) => (
                <input
                  key={idx}
                  value={item}
                  onChange={(e) => handleHighlightChange(idx, e.target.value)}
                  placeholder={`Highlight ${idx + 1}`}
                />
              ))}
              <button type="button" className="secondary-btn" onClick={addHighlight}>+ Add highlight</button>
            </div>
          </div>

          <div className="form-section">
            <h3>Trip Info</h3>
            <div className="form-grid-2">
              <label>
                Vehicle
                <input value={form.vehicle} onChange={(e) => update('vehicle', e.target.value)} required />
              </label>
              <label>
                Best Time to Visit
                <input value={form.bestTime} onChange={(e) => update('bestTime', e.target.value)} required />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing</h3>
            <div className="form-grid-2">
              <label>
                Base Price
                <input type="number" value={form.price} onChange={(e) => update('price', Number(e.target.value))} required />
              </label>
              <label>
                Discount (%)
                <input type="number" value={form.discount} onChange={(e) => update('discount', Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Image Upload</h3>
            <label className="upload-input">
              Upload images
              <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} />
            </label>
            {previewImages.length > 0 && (
              <label>
                Front Image (Card Cover)
                <select value="0" onChange={(e) => handleSetFrontImage(Number(e.target.value))}>
                  {previewImages.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {idx === 0 ? `Image ${idx + 1} (Front)` : `Image ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="image-preview-grid">
              {previewImages.map((src, idx) => (
                <div key={`${idx}-${src.slice(0, 24)}`} className="preview-item">
                  <img src={src} alt={`Preview ${idx + 1}`} />
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleSetFrontImage(idx)}
                      disabled={idx === 0}
                    >
                      {idx === 0 ? 'Front Image' : 'Set as Front'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn text-btn-danger"
                      onClick={() => handleDeleteImage(idx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Itinerary Builder</h3>
            {form.itinerary.map((day, dayIndex) => (
              <div key={dayIndex} className="itinerary-day">
                <div className="itinerary-day-header">
                  <span>{day.day}</span>
                  <button type="button" className="secondary-btn" onClick={() => addItineraryItem(dayIndex)}>+ Add entry</button>
                </div>
                {day.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="itinerary-row">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateItineraryItem(dayIndex, itemIndex, 'time', e.target.value)}
                      required
                    />
                    <input
                      value={item.activity}
                      onChange={(e) => updateItineraryItem(dayIndex, itemIndex, 'activity', e.target.value)}
                      placeholder="Activity description"
                      required
                    />
                  </div>
                ))}
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addItineraryDay}>+ Add new day</button>
          </div>

          <div className="form-section">
            <h3>FAQ</h3>
            {form.faqs.map((faq, index) => (
              <div key={index} className="faq-row">
                <input value={faq.question} onChange={(e) => setFaq(index, 'question', e.target.value)} placeholder="Question" required />
                <textarea value={faq.answer} onChange={(e) => setFaq(index, 'answer', e.target.value)} placeholder="Answer" rows="3" required />
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addFaq}>+ Add FAQ item</button>
          </div>

          <div className="form-actions form-actions-end">
            <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
            <button className="primary-btn" type="submit">Save Package</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServiceForm({ existing, onSave, onCancel }) {
  const emptyService = { id: crypto.randomUUID(), name: '', type: 'Per Pax', price: 0, status: 'Active' };
  const [form, setForm] = useState(existing || emptyService);

  useEffect(() => {
    setForm(existing || emptyService);
  }, [existing]);

  const save = (e) => {
    e.preventDefault();
    onSave(form, Boolean(existing));
  };

  return (
    <div className="overlay-panel">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="section-label">{existing ? 'Edit Service' : 'Add Service'}</p>
            <h2>{existing ? 'Update extra service' : 'Create new service'}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onCancel}>×</button>
        </div>
        <form className="form-card" onSubmit={save}>
          <div className="form-grid-2">
            <label>
              Service Name
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option>Per Pax</option>
                <option>Per Booking</option>
              </select>
            </label>
            <label>
              Price
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="form-actions form-actions-end">
            <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
            <button className="primary-btn" type="submit">Save Service</button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function convertImageToWebp(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = 4 / 3;
        const width = 600;
        const height = Math.round(width / ratio);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function downloadFile(filename, data, type) {
  const blob = new Blob([data], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [data, setData] = useState(defaultState);
  const [dbConfig, setDbConfig] = useState(loadDbConfig());
  const [alert, setAlert] = useState({ message: '', type: 'success' });
  const isInitialMount = useRef(true);

  const notify = (message, type = 'success') => {
    setAlert({ message, type });
    window.setTimeout(() => setAlert({ message: '', type }), 3200);
  };

  useEffect(() => {
    const boot = async () => {
      const stored = loadStorage();
      setData(stored);

      if (!dbConfig?.enabled || !hasDbConfig(dbConfig)) {
        return;
      }

      try {
        const remote = await pullRemoteData(dbConfig);
        if (remote) {
          setData(remote);
          saveStorage(remote);
        }
      } catch {
        notify('Failed to pull data from Supabase on startup.', 'error');
      }
    };

    boot();
  }, [dbConfig]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    saveStorage(data);

    if (!dbConfig?.enabled || !hasDbConfig(dbConfig)) {
      return;
    }

    pushRemoteData(dbConfig, data).catch((error) => {
      notify(`Failed to sync latest changes to Supabase: ${formatSupabaseError(error)}`, 'error');
    });
  }, [data, dbConfig]);

  const handleAddOrUpdateTrip = (trip, isUpdate) => {
    setData((prev) => ({
      ...prev,
      trips: isUpdate
        ? prev.trips.map((item) => (item.id === trip.id ? trip : item))
        : [trip, ...prev.trips],
    }));
  };

  const handleDeleteTrip = (id) => {
    setData((prev) => ({ ...prev, trips: prev.trips.filter((item) => item.id !== id) }));
    notify('Trip deleted successfully', 'success');
  };

  const handleSaveService = (service, isUpdate) => {
    setData((prev) => ({
      ...prev,
      services: isUpdate
        ? prev.services.map((item) => (item.id === service.id ? service : item))
        : [service, ...prev.services],
    }));
  };

  const handleDeleteService = (id) => {
    setData((prev) => ({ ...prev, services: prev.services.filter((item) => item.id !== id) }));
    notify('Service deleted successfully', 'success');
  };

  const handleSaveSettings = (settings) => {
    setData((prev) => ({ ...prev, settings }));
  };

  const handleSaveDbSettings = (config) => {
    setDbConfig(config);
    saveDbConfig(config);
  };

  const handleTestDb = async (overrideConfig) => {
    const targetConfig = overrideConfig || dbConfig;

    if (!targetConfig.url || !targetConfig.anonKey) {
      notify('Fill in Supabase Project URL and Anon Key first.', 'error');
      return;
    }

    const client = makeTestClient(targetConfig);

    // Step 1: test connectivity + credentials by querying the trips table
    // NOTE: in supabase-js v2, HTTP status is a top-level field separate from the error object
    const { error: tripsError, status: tripsStatus } = await client
      .from('trips')
      .select('id')
      .limit(1);

    if (tripsError) {
      const httpStatus = tripsStatus;
      const msg = (tripsError.message || '').toLowerCase();
      const code = tripsError.code || '';

      if (httpStatus === 401 || httpStatus === 403 || msg.includes('jwt') || msg.includes('invalid api key') || msg.includes('apikey')) {
        notify(
          'Invalid Anon Key. Open your Supabase project → Settings → API and copy the anon public key.',
          'error',
        );
      } else if (httpStatus === 404 || httpStatus === 406 || code === '42P01' || msg.includes('does not exist') || msg.includes('relation')) {
        notify(
          'Connection OK, but table "trips" not found. Run the SQL setup script from README first.',
          'error',
        );
      } else if (!httpStatus || httpStatus === 0 || httpStatus >= 500) {
        notify(
          `Cannot reach Supabase. Check the Project URL (format: https://xxxx.supabase.co). Raw error: ${tripsError.message || httpStatus}`,
          'error',
        );
      } else {
        notify(`Connection error (HTTP ${httpStatus}): ${tripsError.message || code}`, 'error');
      }
      return;
    }

    // Step 2: check remaining tables
    const remaining = ['services', 'site_settings', 'site_metrics'];
    const missing = [];
    for (const table of remaining) {
      const { error, status } = await client.from(table).select('id').limit(1);
      if (error && status !== 200) missing.push(table);
    }

    if (missing.length) {
      notify(
        `Connection OK, "trips" found, but missing: ${missing.join(', ')}. Run the SQL setup script from README.`,
        'error',
      );
      return;
    }

    notify('Supabase connection successful. All tables found ✓', 'success');
  };

  const handlePullDb = async (overrideConfig) => {
    const targetConfig = overrideConfig || dbConfig;
    try {
      const remote = await pullRemoteData(targetConfig);
      if (!remote) {
        notify('No data found in Supabase tables yet.', 'error');
        return;
      }

      setData(remote);
      saveStorage(remote);
      notify('Data pulled from Supabase.', 'success');
    } catch (error) {
      notify(`Failed to pull data from Supabase: ${formatSupabaseError(error)}`, 'error');
    }
  };

  const handlePushDb = async (overrideConfig) => {
    const targetConfig = overrideConfig || dbConfig;
    try {
      await pushRemoteData(targetConfig, data);
      notify('Data pushed to Supabase.', 'success');
    } catch (error) {
      notify(`Failed to push data to Supabase: ${formatSupabaseError(error)}`, 'error');
    }
  };

  const exportJson = () => {
    downloadFile('ijen-admin-data.json', JSON.stringify(data, null, 2), 'application/json');
  };

  const handleImportFromHomepage = () => {
    const existingIds = new Set(data.trips.map((t) => t.id));
    const newTrips = homepageDefaultTrips.filter((t) => !existingIds.has(t.id));
    if (!newTrips.length) {
      notify('Homepage packages are already imported.', 'success');
      return;
    }
    setData((prev) => ({ ...prev, trips: [...newTrips, ...prev.trips] }));
    notify(`${newTrips.length} package(s) imported. Click "Push to Supabase" to sync.`, 'success');
  };

  const exportCsv = (section) => {
    if (section === 'trips') {
      const csvHeader = 'Title,Duration,Price,Status,Vehicle,Group Size,Best Time\n';
      const rows = data.trips.map((trip) => [trip.title, trip.duration, trip.price, trip.status, trip.vehicle, trip.groupSize, trip.bestTime].map((v) => `"${v}"`).join(','));
      downloadFile('trips.csv', csvHeader + rows.join('\n'), 'text/csv');
    } else if (section === 'services') {
      const csvHeader = 'Name,Type,Price,Status\n';
      const rows = data.services.map((item) => [item.name, item.type, item.price, item.status].map((v) => `"${v}"`).join(','));
      downloadFile('services.csv', csvHeader + rows.join('\n'), 'text/csv');
    }
  };

  const handleImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const parsed = JSON.parse(event.target.result);
          setData((prev) => ({ ...prev, ...parsed }));
          notify('JSON data imported successfully', 'success');
        } else {
          const text = event.target.result;
          const rows = text.trim().split(/\r?\n/).map((line) => line.split(','));
          const header = rows.shift().map((h) => h.replace(/"/g, '').trim().toLowerCase());
          if (header.includes('duration') && header.includes('title')) {
            const trips = rows.map((cols) => {
              const row = Object.fromEntries(header.map((key, i) => [key, cols[i]?.replace(/"/g, '').trim()]));
              return { id: crypto.randomUUID(), title: row.title || '', duration: row.duration || '', price: Number(row.price || 0), status: row.status || 'Active', vehicle: row.vehicle || '', groupSize: row['group size'] || '', bestTime: row['best time'] || '', overview: '', description: '', highlights: [''], images: [], itinerary: [], faqs: [] };
            });
            setData((prev) => ({ ...prev, trips: [...prev.trips, ...trips] }));
            notify('Trip CSV imported successfully', 'success');
          } else if (header.includes('type') && header.includes('name')) {
            const services = rows.map((cols) => {
              const row = Object.fromEntries(header.map((key, i) => [key, cols[i]?.replace(/"/g, '').trim()]));
              return { id: crypto.randomUUID(), name: row.name || '', type: row.type || 'Per Pax', price: Number(row.price || 0), status: row.status || 'Active' };
            });
            setData((prev) => ({ ...prev, services: [...prev.services, ...services] }));
            notify('Service CSV imported successfully', 'success');
          } else {
            notify('Unable to recognize uploaded CSV format', 'error');
          }
        }
      } catch (error) {
        notify('Import failed. Please check your file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const renderContent = () => {
    if (activePage === 'dashboard') {
      return <DashboardPanel data={data} />;
    }
    if (activePage === 'trips') {
      return <TripsView data={data} onAdd={handleAddOrUpdateTrip} onDelete={handleDeleteTrip} onNotify={notify} />;
    }
    if (activePage === 'services') {
      return <ServicesView data={data} onSave={handleSaveService} onDelete={handleDeleteService} onNotify={notify} />;
    }
    if (activePage === 'setup') {
      return (
        <SetupView
          settings={data.settings}
          dbConfig={dbConfig}
          onSave={handleSaveSettings}
          onSaveDbConfig={handleSaveDbSettings}
          onTestDb={handleTestDb}
          onPullDb={handlePullDb}
          onPushDb={handlePushDb}
          onNotify={notify}
        />
      );
    }
    return <div className="page-panel"><p>Page not found.</p></div>;
  };

  return (
    <div className="admin-shell">
      <Sidebar active={activePage} onSelect={setActivePage} settings={data.settings} />
      <main className="main-content">
        <div className="top-toolbar">
          <div>
            <h1>{data.settings.companyName || 'Ijen Bromo Trip'} Admin</h1>
            <p className="top-subtitle">Manage trips, extra services, and global setup from one dashboard.</p>
          </div>
          <div className="toolbar-actions">
            <button className="primary-btn" onClick={handleImportFromHomepage}>Import Homepage Packages</button>
            <button className="secondary-btn" onClick={exportJson}>Export JSON</button>
            <button className="secondary-btn" onClick={() => exportCsv('trips')}>Export Trips CSV</button>
            <input type="file" accept=".json,.csv" onChange={(e) => handleImport(e.target.files?.[0])} className="file-input" />
          </div>
        </div>
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: 'success' })} />
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
