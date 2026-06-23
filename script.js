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

function renderBookingTemplate(text, pageUrl, title) {
  return String(text || '')
    .replace(/\[\{url\}\]/gi, pageUrl)
    .replace(/\[\{title\}\]/gi, title)
    .replace(/\[\{slug\}\]/gi, '')
    .trim();
}

function buildWhatsAppMessage(settings, pageUrl, title = document.title || 'Ijen Bromo Trip') {
  const prefixTemplate = settings.whatsappMessagePrefix || 'Halo, saya ingin booking trip ini: ';
  const suffixTemplate = settings.whatsappMessageSuffix || '';
  const hasTokens = /\[\{(?:url|title|slug)\}\]/i.test(prefixTemplate) || /\[\{(?:url|title|slug)\}\]/i.test(suffixTemplate);

  if (hasTokens) {
    return [
      renderBookingTemplate(prefixTemplate, pageUrl, title),
      renderBookingTemplate(suffixTemplate, pageUrl, title),
    ].filter(Boolean).join(' ').trim();
  }

  const prefix = renderBookingTemplate(prefixTemplate, pageUrl, title);
  const suffix = renderBookingTemplate(suffixTemplate, pageUrl, title);
  const ordered = (settings.whatsappUrlPosition || 'after') === 'before'
    ? [pageUrl, prefix, suffix]
    : [prefix, pageUrl, suffix];

  return ordered.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function applyWhatsAppLinks() {
  const settings = loadAdminSettings();
  const phone = normalizePhone(settings.phone);
  if (!phone) return;

  document.querySelectorAll('[data-wa-link], a[href^="mailto:"]').forEach((link) => {
    const title = link.getAttribute('data-wa-title') || document.title || 'Ijen Bromo Trip';
    const pageUrl = link.getAttribute('data-wa-url') || window.location.href;
    const message = encodeURIComponent(buildWhatsAppMessage(settings, pageUrl, title));
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
