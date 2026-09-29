(function () {
    const typeLabels = { news: 'Новость', event: 'Афиша', exhibit: 'Экспонат', page: 'Раздел сайта' };
    const minQueryLength = 2;

    function resultUrl(query) {
        return '/search.html?q=' + encodeURIComponent(query);
    }

    function destinationUrl(url, query) {
        try {
            const destination = new URL(url || resultUrl(query), window.location.origin);
            if (destination.origin === window.location.origin && destination.pathname !== '/search.html') {
                destination.searchParams.set('search', query);
            }
            return destination.pathname + destination.search + destination.hash;
        } catch (error) {
            return resultUrl(query);
        }
    }

    function highlightText(element, text, query) {
        element.replaceChildren();
        if (!query) {
            element.textContent = text;
            return;
        }
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp(escaped, 'giu');
        let cursor = 0;
        for (const match of text.matchAll(matcher)) {
            const index = match.index;
            if (index > cursor) element.append(document.createTextNode(text.slice(cursor, index)));
            const mark = document.createElement('mark');
            mark.className = 'site-search-highlight';
            mark.textContent = match[0];
            element.append(mark);
            cursor = index + match[0].length;
        }
        if (cursor < text.length) element.append(document.createTextNode(text.slice(cursor)));
        if (cursor === 0) element.textContent = text;
    }

    function highlightCurrentPage(query) {
        document.querySelectorAll('mark.site-search-highlight').forEach((mark) => {
            mark.replaceWith(document.createTextNode(mark.textContent || ''));
        });
        const root = document.querySelector('main') || document.body;
        root.normalize();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                if (parent.closest('script, style, noscript, textarea, input, select, button, svg, mark, .search-dropdown, .search-popup')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        let firstMatch = null;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp(escaped, 'giu');
        textNodes.forEach((node) => {
            const text = node.nodeValue;
            matcher.lastIndex = 0;
            if (!matcher.test(text)) return;
            matcher.lastIndex = 0;
            const fragment = document.createDocumentFragment();
            let cursor = 0;
            for (const match of text.matchAll(matcher)) {
                const index = match.index;
                if (index > cursor) fragment.append(document.createTextNode(text.slice(cursor, index)));
                const mark = document.createElement('mark');
                mark.className = 'site-search-highlight';
                mark.textContent = match[0];
                if (!firstMatch) firstMatch = mark;
                fragment.append(mark);
                cursor = index + match[0].length;
            }
            if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
            node.replaceWith(fragment);
        });
        return firstMatch;
    }

    function setupPageHighlights() {
        const query = (new URLSearchParams(window.location.search).get('search') || '').trim();
        if (query.length < minQueryLength) return;
        let attempts = 0;
        let scrolled = false;
        const timer = window.setInterval(() => {
            const firstMatch = highlightCurrentPage(query);
            attempts++;
            if (firstMatch && !scrolled) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scrolled = true;
            }
            if (attempts >= 8 || (firstMatch && attempts >= 3)) window.clearInterval(timer);
        }, 400);
    }

    async function fetchResults(query) {
        const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Search request failed');
        const data = await response.json();
        return Array.isArray(data.results) ? data.results : [];
    }

    function renderDropdown(dropdown, results, query) {
        dropdown.replaceChildren();
        if (!results.length) {
            const empty = document.createElement('p');
            empty.className = 'px-3 py-3 text-sm text-gray-600';
            empty.textContent = 'Ничего не найдено';
            dropdown.append(empty);
        } else {
            results.slice(0, 8).forEach((result) => {
                const link = document.createElement('a');
                link.className = 'block border-b border-gray-100 px-3 py-2 hover:bg-gray-50';
                link.href = destinationUrl(result.url, query);
                const kind = document.createElement('span');
                kind.className = 'block text-xs text-gray-500';
                kind.textContent = typeLabels[result.type] || 'Материал';
                const title = document.createElement('span');
                title.className = 'block text-sm font-medium text-[#3E2723]';
                highlightText(title, result.title || 'Без названия', query);
                const excerpt = document.createElement('span');
                excerpt.className = 'block truncate text-xs text-gray-600';
                highlightText(excerpt, result.excerpt || '', query);
                link.append(kind, title, excerpt);
                dropdown.append(link);
            });
            const all = document.createElement('a');
            all.className = 'block px-3 py-2 text-sm font-medium text-[#5D4037] hover:bg-gray-50';
            all.href = resultUrl(query);
            all.textContent = 'Все результаты';
            dropdown.append(all);
        }
        dropdown.classList.remove('hidden');
    }

    function setupHeaderSearch(input) {
        const wrapper = input.closest('.relative');
        const dropdown = wrapper && wrapper.querySelector('[id^="search-dropdown"]');
        if (!dropdown) return;
        let timer;
        let requestId = 0;

        const run = async () => {
            const query = input.value.trim();
            const id = ++requestId;
            if (query.length < minQueryLength) {
                dropdown.classList.add('hidden');
                dropdown.replaceChildren();
                return;
            }
            const loading = document.createElement('p');
            loading.className = 'px-3 py-3 text-sm text-gray-500';
            loading.textContent = 'Ищем…';
            dropdown.replaceChildren(loading);
            dropdown.classList.remove('hidden');
            try {
                const results = await fetchResults(query);
                if (id === requestId) renderDropdown(dropdown, results, query);
            } catch (error) {
                if (id !== requestId) return;
                dropdown.replaceChildren();
                const message = document.createElement('p');
                message.className = 'px-3 py-3 text-sm text-red-700';
                message.textContent = 'Не удалось выполнить поиск. Попробуйте ещё раз.';
                dropdown.append(message);
            }
        };

        input.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(run, 250);
        });
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = input.value.trim();
                if (query.length >= minQueryLength) window.location.assign(resultUrl(query));
            } else if (event.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });
        const button = wrapper.querySelector('button');
        if (button) button.addEventListener('click', () => {
            const query = input.value.trim();
            if (query.length >= minQueryLength) window.location.assign(resultUrl(query));
            else input.focus();
        });
        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) dropdown.classList.add('hidden');
        });
    }

    function renderSearchResults(container, results, query) {
        container.replaceChildren();
        if (!results.length) {
            const empty = document.createElement('p');
            empty.className = 'search-empty';
            empty.textContent = 'По вашему запросу ничего не найдено. Попробуйте изменить формулировку.';
            container.append(empty);
            return;
        }
        results.forEach((result) => {
            const article = document.createElement('article');
            article.className = 'search-result-card';
            const link = document.createElement('a');
            link.href = destinationUrl(result.url, query);
            const type = document.createElement('span');
            type.className = 'search-result-type';
            type.textContent = typeLabels[result.type] || 'Материал';
            const title = document.createElement('h2');
            highlightText(title, result.title || 'Без названия', query);
            const excerpt = document.createElement('p');
            highlightText(excerpt, result.excerpt || '', query);
            link.append(type, title, excerpt);
            article.append(link);
            container.append(article);
        });
    }

    function initSearch() {
        const highlightStyle = document.createElement('style');
        highlightStyle.textContent = '.site-search-highlight{background:#ffeb3b;color:inherit;padding:0 .08em;border-radius:2px}';
        document.head.append(highlightStyle);
        setupPageHighlights();
        document.querySelectorAll('#search-input-header, #search-input-mobile').forEach(setupHeaderSearch);

        const form = document.getElementById('search-page-form');
        const input = document.getElementById('search-page-input');
        const resultsContainer = document.getElementById('search-results');
        if (!form || !input || !resultsContainer) return;

        const params = new URLSearchParams(window.location.search);
        const query = (params.get('q') || '').trim();
        input.value = query;
        const summary = document.getElementById('search-summary');
        let searchTimer;
        let requestId = 0;

        async function searchPage(nextQuery, updateUrl = false) {
            const id = ++requestId;
            if (updateUrl && nextQuery.length >= minQueryLength) {
                try {
                    window.history.pushState({}, '', resultUrl(nextQuery));
                } catch (error) {
                    // Search still works when a browser disallows history updates.
                }
            }
            if (nextQuery.length < minQueryLength) {
                summary.textContent = 'Введите не менее двух символов, чтобы начать поиск.';
                resultsContainer.replaceChildren();
                return;
            }
            summary.textContent = 'Ищем по страницам сайта, новостям, афише и экспонатам…';
            try {
                const results = await fetchResults(nextQuery);
                if (id !== requestId) return;
                summary.textContent = `По запросу «${nextQuery}» показано результатов: ${results.length}`;
                renderSearchResults(resultsContainer, results, nextQuery);
            } catch (error) {
                if (id !== requestId) return;
                summary.textContent = 'Поиск временно недоступен.';
                resultsContainer.replaceChildren();
            }
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            clearTimeout(searchTimer);
            searchPage(input.value.trim(), true);
        });
        input.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => searchPage(input.value.trim()), 300);
        });
        window.addEventListener('popstate', () => {
            input.value = (new URLSearchParams(window.location.search).get('q') || '').trim();
            searchPage(input.value);
        });
        searchPage(query);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch, { once: true });
    } else {
        initSearch();
    }
})();
