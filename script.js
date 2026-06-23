const ADMIN_STORAGE_KEY = 'ijen-bromo-admin-data';
const slides = document.querySelectorAll('.hero-slide');
const prevButton = document.querySelector('.carousel-arrow.prev');
const nextButton = document.querySelector('.carousel-arrow.next');
let activeIndex = 0;

function loadAdminSettings() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      return {
        phone: '',
        whatsappMessagePrefix: 'Halo, saya ingin booking trip ini: ',
        whatsappMessageSuffix: '',
        whatsappUrlPosition: 'after',
      };
    }

    const parsed = JSON.parse(raw);
    return {
      phone: parsed?.settings?.phone || '',
      whatsappMessagePrefix: parsed?.settings?.whatsappMessagePrefix || 'Halo, saya ingin booking trip ini: ',
      whatsappMessageSuffix: parsed?.settings?.whatsappMessageSuffix || '',
      whatsappUrlPosition: parsed?.settings?.whatsappUrlPosition || 'after',
    };
  } catch {
    return {
      phone: '',
      whatsappMessagePrefix: 'Halo, saya ingin booking trip ini: ',
      whatsappMessageSuffix: '',
      whatsappUrlPosition: 'after',
    };
  }
}

function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
}

function buildWhatsAppMessage(settings, pageUrl) {
  const prefix = settings.whatsappMessagePrefix || 'Halo, saya ingin booking trip ini: ';
  const suffix = settings.whatsappMessageSuffix || '';
  const url = pageUrl || window.location.href;
  const ordered = (settings.whatsappUrlPosition || 'after') === 'before'
    ? [url, prefix, suffix]
    : [prefix, url, suffix];

  return ordered.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function applyWhatsAppLinks() {
  const settings = loadAdminSettings();
  const phone = normalizePhone(settings.phone);
  if (!phone) return;

  document.querySelectorAll('[data-wa-link], a[href^="mailto:"]').forEach((link) => {
    const message = encodeURIComponent(buildWhatsAppMessage(settings, window.location.href));
    link.href = `https://wa.me/${phone}?text=${message}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
  });
}

function showSlide(index) {
  slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === index);
  });
}

function nextSlide() {
  activeIndex = (activeIndex + 1) % slides.length;
  showSlide(activeIndex);
}

function prevSlide() {
  activeIndex = (activeIndex - 1 + slides.length) % slides.length;
  showSlide(activeIndex);
}

nextButton.addEventListener('click', nextSlide);
prevButton.addEventListener('click', prevSlide);

setInterval(nextSlide, 6000);
applyWhatsAppLinks();
