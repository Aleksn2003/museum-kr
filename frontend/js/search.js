document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация страниц
    const sitePages = [
        { title: 'Главная', url: '/', keywords: 'главная, музей, самыртай, кердем, добраться, проехать, маршрут, контакты, как добраться, адрес, телефон, часы работы' },
        { title: 'О музее', url: '/about.html', keywords: 'о музее, история, основание, роберт захаров, создание, музейный комплекс' },
        { title: 'Афиша', url: '/events.html', keywords: 'афиша, мероприятия, события, календарь, выставки, концерты' },
        { title: 'Коллекции', url: '/collections.html', keywords: 'коллекции, экспонаты, фонды, предметы, собрание, артефакты' },
        { title: 'Новости', url: '/news.html', keywords: 'новости, анонсы, события, пресс-релизы, объявления' },
        { title: 'История', url: '/history.html', keywords: 'история, создание, основатель, прошлое, музей, развитие' },
        { title: 'Контакты', url: '/contacts.html', keywords: 'контакты, адрес, телефон, как добраться, проехать, маршрут, схема, карта, парковка' },
        { title: 'Филиалы', url: '/filialy.html', keywords: 'филиалы, подразделения, другие музеи' },
        { title: 'Посетителям', url: '/visit.html', keywords: 'посетить, часы работы, билеты, льготы, экскурсии, правила посещения, стоимость' },
        { title: 'Правила и льготы', url: '/rules.html', keywords: 'правила, льготы, посещение, билеты, скидки' },
        { title: 'Документы', url: '/documents.html', keywords: 'документы, отчёты, устав, лицензии' },
        { title: 'Сведения об учредителе', url: '/founder.html', keywords: 'учредитель, сведения, министерство, администрация' },
        { title: 'Оценка качества услуг', url: '/quality.html', keywords: 'оценка, качество, услуги, анкета' },
        { title: 'Политика конфиденциальности', url: '/privacy.html', keywords: 'конфиденциальность, политика, данные, защита' }
    ];

    const searchInputId = 'search-input-header';
    const mobileInputId = 'search-input-mobile';
    const dropdownId = 'search-dropdown';

    let currentHighlights = [];
    let currentHighlightIndex = -1;
    let lastQuery = '';

    let dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'search-dropdown hidden absolute top-full left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-96 overflow-y-auto';
        document.body.appendChild(dropdown);
    }

    // Очистка подсветки
    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.outerHTML = el.innerHTML;
        });
        currentHighlights = [];
        currentHighlightIndex = -1;
    }

    // Подсветка всех вхождений
    function highlightAll(query) {
        clearHighlights();
        if (!query || query.length < 2) return [];

        const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const parent = node.parentNode;
                if (['SCRIPT','STYLE','INPUT','TEXTAREA','SELECT'].includes(parent.tagName)) return;
                const newHTML = node.nodeValue.replace(regex, '<span class="search-highlight">$1</span>');
                if (newHTML !== node.nodeValue) {
                    const span = document.createElement('span');
                    span.innerHTML = newHTML;
                    parent.replaceChild(span, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        walk(document.body);

        const highlights = Array.from(document.querySelectorAll('.search-highlight'));
        highlights.forEach(h => h.classList.remove('search-highlight-active'));
        currentHighlights = highlights;
        currentHighlightIndex = -1;
        return highlights;
    }

    // Перемещение к следующему совпадению
    function navigateToNext() {
        if (currentHighlights.length === 0) return;
        if (currentHighlightIndex >= 0 && currentHighlightIndex < currentHighlights.length) {
            currentHighlights[currentHighlightIndex].classList.remove('search-highlight-active');
        }
        currentHighlightIndex++;
        if (currentHighlightIndex >= currentHighlights.length) currentHighlightIndex = 0;
        const el = currentHighlights[currentHighlightIndex];
        el.classList.add('search-highlight-active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Перемещение к предыдущему совпадению
    function navigateToPrev() {
        if (currentHighlights.length === 0) return;
        if (currentHighlightIndex >= 0 && currentHighlightIndex < currentHighlights.length) {
            currentHighlights[currentHighlightIndex].classList.remove('search-highlight-active');
        }
        currentHighlightIndex--;
        if (currentHighlightIndex < 0) currentHighlightIndex = currentHighlights.length - 1;
        const el = currentHighlights[currentHighlightIndex];
        el.classList.add('search-highlight-active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Локальный поиск на странице
    function performLocalSearch(query) {
        lastQuery = query;
        const highlights = highlightAll(query);
        if (highlights.length > 0) {
            navigateToNext();
            showSearchPopup(query, highlights.length);
        }
    }

    // Показ всплывающего окошка со стрелками
    function showSearchPopup(query, count) {
        // Удаляем старый попап, если есть
        const oldPopup = document.querySelector('.search-popup');
        if (oldPopup) oldPopup.remove();

        const popup = document.createElement('div');
        popup.className = 'search-popup';
        popup.innerHTML = `
            <span>«${escapeHTML(query)}» — совпадений: ${count}</span>
            <div class="search-popup-nav">
                <button class="search-popup-arrow" id="search-prev" aria-label="Предыдущее">▲</button>
                <button class="search-popup-arrow" id="search-next" aria-label="Следующее">▼</button>
            </div>
            <button class="search-popup-close" aria-label="Закрыть">×</button>
        `;
        document.body.appendChild(popup);

        popup.querySelector('#search-next').addEventListener('click', navigateToNext);
        popup.querySelector('#search-prev').addEventListener('click', navigateToPrev);
popup.querySelector('.search-popup-close').addEventListener('click', () => {
    clearHighlights();
    popup.remove();
    // Удаляем query-параметр search из URL без перезагрузки
    const url = new URL(window.location);
    url.searchParams.delete('search');
    window.history.replaceState({}, document.title, url.pathname + url.search);
});
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Проверка параметра search в URL (переход с другой страницы)
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search');
    if (searchQuery && searchQuery.trim().length >= 2) {
        setTimeout(() => {
            performLocalSearch(searchQuery.trim());
        }, 600);
    }

    // Дебаунс
    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Загрузка текста страницы по URL
    async function fetchPageText(url) {
        try {
            const res = await fetch(url);
            const html = await res.text();
            const tmp = document.createElement('div');
            tmp.innerHTML = html.replace(/<script[^>]*>.*?<\/script>/gis, '')
                               .replace(/<style[^>]*>.*?<\/style>/gis, '')
                               .replace(/<head[^>]*>.*?<\/head>/gis, '');
            return tmp.textContent || tmp.innerText || '';
        } catch (e) {
            return '';
        }
    }

    // Поиск для выпадающего списка
    async function searchForDropdown(query, inputElement) {
        if (query.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }

        const lowerQ = query.toLowerCase();
        const currentPath = window.location.pathname;
        let onThisPage = [];
        let otherPages = [];

        const thisPageText = document.body.innerText.toLowerCase();
        if (thisPageText.includes(lowerQ)) {
            onThisPage.push({
                title: 'Текущая страница',
                excerpt: 'Найдено на этой странице',
                action: 'local',
                query: query
            });
        }

        for (const page of sitePages) {
            if (page.url === currentPath || (page.url === '/' && currentPath === '/index.html')) continue;
            if (page.keywords && page.keywords.toLowerCase().includes(lowerQ)) {
                otherPages.push({
                    title: page.title,
                    url: page.url,
                    excerpt: 'Найдено по ключевым словам',
                    action: 'navigate',
                    query: query
                });
            } else {
                try {
                    const text = await fetchPageText(page.url);
                    if (text.includes(lowerQ)) {
                        const idx = text.indexOf(lowerQ);
                        const start = Math.max(0, idx - 40);
                        const snippet = '…' + text.substring(start, start + 80) + '…';
                        otherPages.push({
                            title: page.title,
                            url: page.url,
                            excerpt: snippet,
                            action: 'navigate',
                            query: query
                        });
                    }
                } catch (e) {}
            }
        }

        let html = '';
        if (onThisPage.length > 0) {
            html += '<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">На этой странице</div>';
            onThisPage.forEach(item => {
                html += `
                <div class="search-result-item px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100" data-action="local" data-query="${item.query}">
                    <span class="text-sm font-medium text-[#5D4037]">${item.title}</span>
                    <p class="text-xs text-gray-600">${item.excerpt}</p>
                </div>`;
            });
        }
        if (otherPages.length > 0) {
            html += '<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-2">В других разделах</div>';
            otherPages.forEach(item => {
                html += `
                <a href="${item.url}?search=${encodeURIComponent(item.query)}" class="search-result-item px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex flex-col">
                    <span class="text-sm font-medium text-[#3E2723]">${item.title}</span>
                    <p class="text-xs text-gray-600 truncate">${item.excerpt}</p>
                </a>`;
            });
        }
        if (!html) {
            html = '<div class="p-3 text-sm text-gray-500">Ничего не найдено</div>';
        }

        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');

        const rect = inputElement.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.width = rect.width + 'px';
    }

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const action = item.dataset.action;
        if (action === 'local') {
            const q = item.dataset.query;
            performLocalSearch(q);
            dropdown.classList.add('hidden');
        }
    });

    function setupInput(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const debouncedDropdownSearch = debounce(() => {
            const query = input.value.trim();
            searchForDropdown(query, input);
        }, 300);
        input.addEventListener('input', () => {
            debouncedDropdownSearch();
            if (lastQuery !== input.value.trim()) {
                clearHighlights();
                lastQuery = '';
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                if (query.length < 2) return;
                if (query !== lastQuery) {
                    performLocalSearch(query);
                } else {
                    navigateToNext();
                }
                dropdown.classList.add('hidden');
                input.blur();
            }
            if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
                clearHighlights();
            }
        });
    }

    setupInput(searchInputId);
    setupInput(mobileInputId);

    function setupSearchButton(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const query = input.value.trim();
            if (query.length < 2) {
                input.focus();
                return;
            }
            if (query !== lastQuery) {
                performLocalSearch(query);
            } else {
                navigateToNext();
            }
            dropdown.classList.add('hidden');
        });
    }
    setupSearchButton('search-button-header', searchInputId);

    document.addEventListener('click', (e) => {
        const input1 = document.getElementById(searchInputId);
        const input2 = document.getElementById(mobileInputId);
        if ((!input1 || !input1.contains(e.target)) && (!input2 || !input2.contains(e.target)) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
});