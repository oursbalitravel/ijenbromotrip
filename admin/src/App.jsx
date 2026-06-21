import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'ijen-bromo-admin-data';
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

async function saveStorage(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  try {
    await fetch(`${API_BASE_URL}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn('Unable to save admin data to server:', error);
  }
}

async function loadStorage() {
  if (typeof window === 'undefined') return defaultState;

  try {
    const response = await fetch(`${API_BASE_URL}/api/data`);
    if (response.ok) {
      const payload = await response.json();
      return payload;
    }
  } catch (error) {
    console.warn('Unable to load admin data from server:', error);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultState;
  }
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

function SetupView({ settings, onSave, onNotify }) {
  const [form, setForm] = useState(settings);
  const [logoPreview, setLogoPreview] = useState(settings.logo || '');

  useEffect(() => {
    setForm(settings);
    setLogoPreview(settings.logo || '');
  }, [settings]);

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
            <div className="image-preview-grid">
              {previewImages.map((src, idx) => (
                <img key={idx} src={src} alt={`Preview ${idx + 1}`} />
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
          <button type="button" type="button" className="close-btn" onClick={onCancel}>×</button>
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
  const [alert, setAlert] = useState({ message: '', type: 'success' });
  const isInitialMount = useRef(true);

  useEffect(() => {
    loadStorage().then((stored) => setData(stored));
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveStorage(data);
  }, [data]);

  const notify = (message, type = 'success') => {
    setAlert({ message, type });
    window.setTimeout(() => setAlert({ message: '', type }), 3200);
  };

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

  const exportJson = () => {
    downloadFile('ijen-admin-data.json', JSON.stringify(data, null, 2), 'application/json');
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
      return <SetupView settings={data.settings} onSave={handleSaveSettings} onNotify={notify} />;
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
