// ========== ЭКСПОНАТЫ ==========

async function loadFeaturedExhibits() {
  const container = document.getElementById('featured-exhibits-container');
  if (!container) return;

  try {
    const response = await fetch('/api/exhibits/featured');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Ошибка данных');

    if (data.length > 0) {
      container.innerHTML = data.map(item => `
        <div class="exhibit-card cursor-pointer" data-id="${item.id}">
          <img src="${item.image_url || 'https://picsum.photos/400/250?random=' + Math.random()}" alt="${item.title}" class="h-48 w-full object-cover border-b-2 border-[#5D4037]">
          <div class="p-4">
            <span class="text-xs bg-[#5D4037] text-white px-2 py-1 rounded-full">${item.creation_date || 'Без даты'}</span>
            <h3 class="font-serif text-xl font-bold mt-2 mb-1">${item.title}</h3>
            <p class="text-gray-600 text-sm line-clamp-2">${item.short_description || ''}</p>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="col-span-3 text-center text-gray-500">Избранные экспонаты появятся позже.</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="col-span-3 text-center text-red-500">Ошибка загрузки</p>';
  }
}

// Открывает модальное окно с информацией об экспонате
async function openExhibitModal(id) {
  const modal = document.getElementById('exhibit-modal');
  const content = document.getElementById('exhibit-modal-content');
  if (!modal || !content) return;

  // Показываем окно с заглушкой загрузки
  document.getElementById('modal-exhibit-title').textContent = 'Загрузка…';
  document.getElementById('modal-exhibit-desc').textContent = '';
  document.getElementById('modal-exhibit-date').textContent = '';
  document.getElementById('modal-exhibit-image').src = '';
  document.getElementById('modal-exhibit-link').href = '#';

  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.classList.add('opacity-100', 'pointer-events-auto');
  content.classList.remove('scale-95');
  content.classList.add('scale-100');

  try {
    const res = await fetch(`/api/exhibits/${id}`);
    const exhibit = await res.json();
    if (exhibit && !exhibit.error) {
      document.getElementById('modal-exhibit-title').textContent = exhibit.title;
      document.getElementById('modal-exhibit-desc').textContent = exhibit.short_description || 'Описание отсутствует';
      document.getElementById('modal-exhibit-date').textContent = exhibit.creation_date || '';
      if (exhibit.image_url) {
        document.getElementById('modal-exhibit-image').src = exhibit.image_url;
        document.getElementById('modal-exhibit-image').alt = exhibit.title;
      }
      document.getElementById('modal-exhibit-link').href = `/exhibit.html?id=${exhibit.id}`;
      // В будущем админка может установить data-show-detail-button="false"
      document.getElementById('modal-exhibit-link').style.display = 'inline-block';
    } else {
      document.getElementById('modal-exhibit-title').textContent = 'Ошибка загрузки';
    }
  } catch (err) {
    document.getElementById('modal-exhibit-title').textContent = 'Не удалось загрузить данные';
  }
}

// Закрывает модальное окно
function closeExhibitModal() {
  const modal = document.getElementById('exhibit-modal');
  const content = document.getElementById('exhibit-modal-content');
  if (!modal || !content) return;
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.classList.remove('opacity-100', 'pointer-events-auto');
  content.classList.add('scale-95');
  content.classList.remove('scale-100');
}
// Делегирование клика на карточки экспонатов (только один раз)
document.addEventListener('click', async (e) => {
  const card = e.target.closest('.exhibit-card');
  if (!card) return;
  const id = card.dataset.id;
  if (id) openExhibitModal(id);
});
// Закрытие по клику на оверлей или Escape
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('exhibit-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeExhibitModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeExhibitModal();
    });
  }
});

// ========== НОВОСТИ (КАРТОЧКИ-ССЫЛКИ) ==========
async function loadNews() {
  const track = document.getElementById('news-carousel-track');
  if (!track) return;

  try {
    //const response = await fetch('/api/news/latest');
    const response = await fetch('/api/news/latest', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
});
    const data = await response.json();

    if (data.length > 0) {
      track.innerHTML = data.map(item => {
        const raw = item.published_at || '';
        const [datePart, timePart] = raw.split(' ');
        const [year, month, day] = (datePart || '').split('-');
        const time = (timePart || '').substring(0, 5);
        let dateStr = raw;
        if (year && month && day) {
          const d = new Date(year, month - 1, day);
          dateStr = d.toLocaleDateString(document.documentElement.lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
          if (time) dateStr += ', ' + time;
        }
        return `
          <a href="/news-single.html?id=${item.id}" class="news-card flex-shrink-0 w-56 bg-[#FDF8F5] rounded border border-gray-200 shadow overflow-hidden group cursor-pointer">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="h-32 w-full object-cover">` : ''}
            <div class="p-3">
              <span class="text-xs text-[#8D6E63] font-semibold"> ${dateStr}</span>
              <h3 class="font-serif font-bold text-sm mt-1 mb-1 group-hover:text-[#5D4037] transition">${item.title}</h3>
              <p class="text-xs text-gray-600 line-clamp-2">${item.short_text || ''}</p>
            </div>
          </a>
        `;
      }).join('');

      const cards = track.querySelectorAll('.news-card');
      cards.forEach(card => requestAnimationFrame(() => card.classList.add('visible')));

const images = track.querySelectorAll('img');
const imagePromises = Array.from(images).map(img => {
  if (img.complete) return Promise.resolve();
  return new Promise(resolve => {
    img.addEventListener('load', resolve);
    img.addEventListener('error', resolve);
  });
});
await Promise.all(imagePromises);

centerNewsTrack(); // теперь гарантированно правильные размеры
    } else {
      track.innerHTML = '<p class="text-gray-500">Новостей пока нет.</p>';
    }
  } catch (err) {
    console.error(err);
    track.innerHTML = '<p class="text-red-500">Ошибка загрузки</p>';
  }
}

// ========== МЕРОПРИЯТИЯ (СПИСОК С ЧЁТКИМИ ГРАНИЦАМИ) ==========
async function loadEventsList() {
  const container = document.getElementById('events-list');
  if (!container) return;

  try {
    const res = await fetch('/api/events/upcoming');
    const data = await res.json();
    if (data.length > 0) {
      container.innerHTML = data.map(item => `
        <a href="/event.html?id=${item.id}" class="event-list-item no-underline hover:shadow-md transition-shadow duration-200">
          <img src="${item.image_url || 'https://picsum.photos/80/80?random=' + Math.random()}" alt="${item.title}" class="event-avatar">
          <div>
            <div class="event-date">${new Date(item.start_date).toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <h3>${item.title}</h3>
            <p class="text-sm text-gray-600 line-clamp-1">${item.short_text || ''}</p>
          </div>
        </a>
      `).join('');
    } else {
      container.innerHTML = '<p class="p-4 text-center text-gray-500">Мероприятий пока нет.</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="p-4 text-center text-red-500">Ошибка загрузки</p>';
  }
}

function initNewsCarousel() {
  const carousel = document.getElementById('news-carousel');
  const leftBtn = document.getElementById('news-scroll-left');
  const rightBtn = document.getElementById('news-scroll-right');
  window.addEventListener('resize', centerNewsTrack);
  if (!carousel || !leftBtn || !rightBtn) return;

  const scrollAmount = 300;
  leftBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  rightBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const mobile = document.getElementById('mobile-menu');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => mobile.classList.toggle('hidden'));
    mobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobile.classList.add('hidden'));
    });
  }
}

function centerNewsTrack() {
  const track = document.getElementById('news-carousel-track');
  const carousel = document.getElementById('news-carousel');
  if (!track || !carousel) return;

  // Считаем реальную ширину всех карточек
  const totalCardsWidth = track.scrollWidth;
  const containerWidth = carousel.clientWidth;

  if (totalCardsWidth <= containerWidth) {
    track.classList.add('news-track-centered');
    track.classList.remove('w-max');
  } else {
    track.classList.remove('news-track-centered');
    track.classList.add('w-max');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  if (document.getElementById('featured-exhibits-container')) loadFeaturedExhibits();
if (document.getElementById('news-carousel-track')) {
  loadNews().then(() => initNewsCarousel());
}
  if (document.getElementById('events-list')) loadEventsList();
});

document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('exhibit-of-day-title');
    if (!titleEl) return;

    try {
        const res = await fetch('/api/exhibits');
        const data = await res.json();
        if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            titleEl.textContent = random.title || 'Без названия';
        } else {
            titleEl.textContent = 'Нет экспонатов';
        }
    } catch (err) {
        titleEl.textContent = 'Ошибка загрузки';
    }
});

let museumSettingsPromise;
function getMuseumSiteSettings() {
    if (!museumSettingsPromise) {
        museumSettingsPromise = fetch('/api/site-settings', { cache: 'no-store' })
            .then((response) => response.ok ? response.json() : null)
            .catch(() => null);
    }
    return museumSettingsPromise;
}

async function updateWorkingHours() {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const iconEl = document.getElementById('status-icon');
    if (!statusDot || !statusText || !iconEl) return;

    const settings = await getMuseumSiteSettings();

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Yakutsk', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday);
    const hour = Number(values.hour);
    const minute = Number(values.minute);

    const currentTime = hour * 60 + minute;
    const openDays = Array.isArray(settings?.open_days) ? settings.open_days.map(Number) : [0, 2, 3, 4, 5, 6];
    const openingTime = settings?.opening_time || '10:00';
    const closingTime = settings?.closing_time || '18:00';
    const [openingHour, openingMinute] = openingTime.split(':').map(Number);
    const [closingHour, closingMinute] = closingTime.split(':').map(Number);
    const openTime = openingHour * 60 + openingMinute;
    const closeTime = closingHour * 60 + closingMinute;
    const isOpenDay = openDays.includes(day);
    const isOpen = settings?.status_mode === 'open'
        ? true
        : settings?.status_mode === 'closed'
            ? false
            : isOpenDay && currentTime >= openTime && currentTime < closeTime;

    if (isOpen) {
        statusDot.style.backgroundColor = '#22c55e'; // зелёный
        statusText.textContent = 'Сейчас открыто';
        statusText.className = 'text-green-700 font-semibold';
        iconEl.className = 'sidebar-icon bg-green-100 text-green-700';
    } else {
        statusDot.style.backgroundColor = '#ef4444'; // красный
        statusText.textContent = 'Сейчас закрыто';
        statusText.className = 'text-red-700 font-semibold';
        iconEl.className = 'sidebar-icon bg-red-100 text-red-700';
    }
}

async function applyMuseumSiteSettings() {
    const settings = await getMuseumSiteSettings();
    if (!settings) return;

    let language = 'ru';
    try { language = localStorage.getItem('samyrtay-language') === 'en' ? 'en' : 'ru'; } catch (_) { /* Use Russian by default. */ }
    const museumName = language === 'en' ? settings.museum_name_en : settings.museum_name;
    const branchName = language === 'en' ? settings.branch_name_en : settings.branch_name;

    document.querySelectorAll('header img[src*="logo-samartyai.png"]').forEach((logo) => {
        logo.src = settings.logo_url || '/img/logo-samartyai.png';
        logo.alt = museumName ? `Логотип: ${museumName}` : 'Логотип музея';
        const brand = logo.closest('a');
        const labels = brand?.querySelectorAll('span') || [];
        if (labels[0] && museumName) labels[0].textContent = museumName;
        if (labels[1] && branchName) labels[1].textContent = branchName;
    });

    if (museumName) document.title = document.title.replace(/Кердемский музей(?:-комплекс)?|Kerdem Museum(?: Complex)?/, museumName);
}

async function applySavedPageContent() {
    const contentRoot = document.getElementById('page-content');
    if (!contentRoot) return;

    try {
        const response = await fetch('/api/page?url=' + encodeURIComponent(window.location.pathname), { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.content === 'string' && data.content.trim()) {
            const template = document.createElement('template');
            template.innerHTML = data.content;

            // Keep the live map instance while applying edited visitor-page text.
            const currentMap = contentRoot.querySelector('#dgis-map');
            const savedMap = template.content.querySelector('#dgis-map');
            if (currentMap && savedMap) {
                currentMap.className = savedMap.className;
                currentMap.style.cssText = savedMap.style.cssText;
                savedMap.replaceWith(currentMap);
            }

            contentRoot.replaceChildren(template.content);
            window.initMuseumCompareSliders?.(contentRoot);
            if (currentMap) window.dispatchEvent(new Event('resize'));
        }
    } catch (_) {
        // Keep the bundled page content available if the API is temporarily offline.
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyMuseumSiteSettings();
    applySavedPageContent();
});



// Ближайшее мероприятие
async function loadUpcomingEventSidebar() {
  const titleEl = document.getElementById('upcoming-event-title');
  const dateEl = document.getElementById('upcoming-event-date');
  const linkEl = document.getElementById('upcoming-event-link');
  const imgEl = document.getElementById('upcoming-event-image');
  const iconContainer = document.getElementById('event-icon-container');
  if (!titleEl || !dateEl || !linkEl) return;

  try {
    const res = await fetch('/api/events/upcoming');
    const data = await res.json();
    if (data && data.length > 0) {
      const event = data[0];
      titleEl.textContent = event.title;
      const date = new Date(event.start_date);
      dateEl.textContent = date.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      linkEl.href = '/event.html?id=' + event.id;
      linkEl.classList.remove('hidden');

      if (event.image_url) {
        imgEl.src = event.image_url;
        imgEl.classList.remove('hidden');
        if (iconContainer) iconContainer.classList.add('hidden');
      } else {
        imgEl.classList.add('hidden');
        if (iconContainer) iconContainer.classList.remove('hidden');
      }
    } else {
      titleEl.textContent = 'Пока нет мероприятий';
      dateEl.textContent = '';
      linkEl.classList.add('hidden');
      imgEl.classList.add('hidden');
      if (iconContainer) iconContainer.classList.remove('hidden');
    }
  } catch (err) {
    titleEl.textContent = 'Ошибка загрузки';
    dateEl.textContent = '';
    linkEl.classList.add('hidden');
    imgEl.classList.add('hidden');
  }
}

// Загрузка интересного факта

async function loadFunFact() {
    const factText = document.getElementById('fun-fact-text');
    if (!factText) return;
    try {
        //const res = await fetch('/api/funfact');
        const res = await fetch('/api/funfact', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
});
        const data = await res.json();
        factText.textContent = data.text || 'Интересные факты скоро появятся.';
    } catch (err) {
        factText.textContent = 'Не удалось загрузить факт.';
    }
}

// Загрузка экспоната дня
async function loadExhibitOfDay() {
    const container = document.getElementById('exhibit-of-day-card');
    const img = document.getElementById('exhibit-of-day-img');
    const title = document.getElementById('exhibit-of-day-title');
    const date = document.getElementById('exhibit-of-day-date');
    const desc = document.getElementById('exhibit-of-day-desc');
    const link = document.getElementById('exhibit-of-day-link');

    if (!container || !title || !date || !link) return;

    try {
        //const res = await fetch('/api/exhibits?per_page=100');
        const res = await fetch('/api/exhibits?per_page=100', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
});
        const data = await res.json();
        const exhibits = data.items || data;

        if (!exhibits || exhibits.length === 0) {
            container.style.display = 'none';
            return;
        }

        const now = new Date();
        const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours() * 60 + now.getMinutes();
        const index = seed % exhibits.length;
        const exhibit = exhibits[index];

        title.textContent = exhibit.title || 'Без названия';
        date.textContent = exhibit.creation_date || '';
        if (desc) {
            desc.textContent = exhibit.short_description || '';
        }
        link.href = '/exhibit.html?id=' + exhibit.id;

        if (exhibit.image_url) {
            img.src = exhibit.image_url;
            img.style.display = 'block';
            img.alt = exhibit.title;
        } else {
            img.style.display = 'none';
        }
    } catch (err) {
        console.error('Ошибка загрузки экспоната дня:', err);
    }
}

// В DOMContentLoaded добавьте:
if (document.getElementById('fun-fact-text')) {
    loadFunFact();
}

document.addEventListener('DOMContentLoaded', () => {
    updateWorkingHours();
    loadUpcomingEventSidebar();
    setInterval(() => {
        museumSettingsPromise = null;
        updateWorkingHours();
    }, 60000);

    // Сначала скрываем оба блока
    const funFactCard = document.getElementById('fun-fact-card');
    const exhibitCard = document.getElementById('exhibit-of-day-card');

    if (funFactCard && exhibitCard) {
        funFactCard.style.display = 'none';
        exhibitCard.style.display = 'none';

        // Случайно выбираем, что показывать
        const showFact = Math.random() < 0.5;

        if (showFact) {
            loadFunFact().then(() => {
                funFactCard.style.display = 'flex';
            });
        } else {
            loadExhibitOfDay().then(() => {
                exhibitCard.style.display = 'flex';
            });
        }
    } else {
        // Если второго блока нет (старые страницы), просто грузим факт
        if (document.getElementById('fun-fact-text')) {
            loadFunFact();
        }
    }
});


