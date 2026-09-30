(() => {
  'use strict';

  const TOKEN = localStorage.getItem('token');
  window.ADMIN_TOKEN = TOKEN;
  if (!TOKEN) {
    window.location.replace('/admin.html');
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const byId = (id) => document.getElementById(id);
  const types = {
    exhibits: { label: 'экспонат', list: 'exhibits-list', fields: [
      ['title', 'Название', 'text', true], ['title_en', 'Title (English)', 'text'],
      ['short_description', 'Краткое описание', 'textarea'], ['short_description_en', 'Short description (English)', 'textarea'],
      ['description', 'Полное описание', 'textarea'], ['description_en', 'Full description (English)', 'textarea'],
      ['creation_date', 'Эпоха / дата', 'text'], ['material', 'Материал', 'text'], ['material_en', 'Material (English)', 'text'],
      ['dimensions', 'Размеры', 'text'], ['dimensions_en', 'Dimensions (English)', 'text'],
      ['origin', 'Происхождение', 'text'], ['origin_en', 'Origin (English)', 'text'], ['audio_url', 'Ссылка на аудио', 'url'],
      ['quote', 'Цитата или легенда', 'text'], ['quote_en', 'Quote or story (English)', 'text'],
      ['quote_author', 'Автор цитаты', 'text'], ['quote_author_en', 'Quote author (English)', 'text'],
      ['image_url', 'Путь к главному изображению', 'image-url'], ['category_id', 'Категория', 'category'], ['is_featured', 'Показывать на главной', 'checkbox'],
      ['order_index', 'Порядок отображения (меньше — выше)', 'number'], ['is_exhibit_of_day', 'Экспонат дня', 'checkbox']
    ] },
    news: { label: 'новость', list: 'news-list', fields: [
      ['title', 'Заголовок', 'text', true], ['title_en', 'Title (English)', 'text'],
      ['short_text', 'Краткий анонс', 'textarea'], ['short_text_en', 'Short summary (English)', 'textarea'],
      ['content', 'Полный текст', 'textarea'], ['content_en', 'Full text (English)', 'textarea'],
      ['published_at', 'Дата публикации', 'datetime-local'], ['publication_status', 'Статус публикации', 'status'], ['image_url', 'Путь к изображению', 'image-url']
    ] },
    events: { label: 'мероприятие', list: 'events-list', fields: [
      ['title', 'Название', 'text', true], ['title_en', 'Title (English)', 'text'],
      ['short_text', 'Краткое описание', 'textarea'], ['short_text_en', 'Short description (English)', 'textarea'],
      ['description', 'Полное описание', 'textarea'], ['description_en', 'Full description (English)', 'textarea'],
      ['start_date', 'Начало', 'datetime-local', true], ['end_date', 'Окончание', 'datetime-local'],
      ['location', 'Место', 'text'], ['location_en', 'Location (English)', 'text'],
      ['image_url', 'Путь к афише', 'image-url'], ['publication_status', 'Статус публикации', 'status'], ['is_featured', 'Показывать в афише на главной', 'checkbox']
    ] },
    categories: { label: 'категорию', list: 'categories-list', fields: [
      ['name', 'Название', 'text', true], ['name_en', 'Name (English)', 'text'], ['slug', 'URL slug', 'text', true],
      ['description', 'Описание', 'textarea'], ['description_en', 'Description (English)', 'textarea'], ['order_index', 'Порядок сортировки', 'number']
    ] }
  };

  const headers = { Authorization: `Bearer ${TOKEN}` };
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      alert('Сессия завершилась. Войдите в админку снова.');
      window.location.replace('/admin.html');
      throw new Error('Требуется повторный вход.');
    }
    if (!response.ok) throw new Error(payload.error || `Ошибка запроса (${response.status})`);
    return payload;
  }

  function showMessage(element, text, success = true) {
    element.className = `msg ${success ? 'success' : 'error'}`;
    element.textContent = text;
  }
  function makeButton(label, action, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener('click', action);
    return button;
  }
  async function openMediaPicker({ multiple = false, onSelect }) {
    const result = await api('/api/admin/media');
    const items = result.items || [];
    if (!items.length) { alert('Медиатека пока пуста. Сначала загрузите изображение через форму записи.'); return; }
    const dialog = document.createElement('dialog'); dialog.style.cssText = 'width:min(900px,95vw);max-height:90vh;overflow:auto;border:1px solid #ddd;border-radius:14px;padding:20px';
    const heading = document.createElement('h2'); heading.textContent = 'Выберите изображение'; dialog.append(heading);
    const grid = document.createElement('div'); grid.className = 'media-grid';
    const selected = new Set();
    items.forEach((item) => {
      const card = document.createElement('article'); card.className = 'media-card';
      const img = document.createElement('img'); img.src = item.url; img.alt = item.name; img.loading = 'lazy';
      const content = document.createElement('div'); content.className = 'media-card-body';
      const name = document.createElement('p'); name.textContent = item.name;
      const usage = document.createElement('p'); usage.textContent = item.usage.length ? `Используется: ${item.usage.join('; ')}` : 'Пока не используется';
      const button = makeButton(multiple ? 'Выбрать' : 'Использовать', () => {
        if (!multiple) { dialog.close(); onSelect?.(item.url); return; }
        if (selected.has(item.url)) { selected.delete(item.url); button.classList.remove('active'); button.textContent = 'Выбрать'; }
        else { selected.add(item.url); button.classList.add('active'); button.textContent = 'Выбрано'; }
      }, 'secondary-btn');
      content.append(name, usage, button); card.append(img, content); grid.append(card);
    });
    dialog.append(grid);
    const actions = document.createElement('div'); actions.className = 'editor-actions'; actions.style.justifyContent = 'flex-end';
    actions.append(makeButton('Отмена', () => dialog.close(), 'secondary-btn'));
    if (multiple) actions.append(makeButton('Добавить выбранные', () => { dialog.close(); onSelect?.([...selected]); }));
    dialog.append(actions); document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove(), { once: true }); dialog.showModal();
  }
  async function loadMediaLibrary() {
    const container = byId('media-library-content'); if (!container) return;
    container.textContent = 'Загружаю медиатеку…';
    try {
      const { items } = await api('/api/admin/media'); container.replaceChildren();
      if (!items.length) { container.textContent = 'Загруженных фотографий пока нет.'; return; }
      const grid = document.createElement('div'); grid.className = 'media-grid';
      items.forEach((item) => {
        const card = document.createElement('article'); card.className = 'media-card';
        const img = document.createElement('img'); img.src = item.url; img.alt = item.name; img.loading = 'lazy';
        const body = document.createElement('div'); body.className = 'media-card-body';
        const name = document.createElement('p'); name.textContent = item.name;
        const size = document.createElement('p'); size.textContent = `${(item.size / 1024).toFixed(0)} КБ · ${localDate(item.modified_at, true)}`;
        const list = document.createElement('ul'); list.className = 'media-usage';
        if (item.usage.length) item.usage.forEach((place) => { const li = document.createElement('li'); li.textContent = place; list.append(li); });
        else { const li = document.createElement('li'); li.textContent = 'Пока не используется'; list.append(li); }
        const copy = makeButton('Скопировать путь', async () => { try { await navigator.clipboard.writeText(item.url); copy.textContent = 'Путь скопирован'; } catch (_) { window.prompt('Путь к изображению:', item.url); } }, 'secondary-btn');
        body.append(name, size, list, copy); card.append(img, body); grid.append(card);
      });
      container.append(grid);
    } catch (error) { container.textContent = `Не удалось загрузить медиатеку: ${error.message}`; container.classList.add('load-error'); }
  }
  async function loadPageHistory() {
    const list = byId('history-list');
    if (!list) return [];
    list.textContent = 'Загружаю историю…';
    try {
      const url = byId('history-page').value; const lang = byId('history-language').value;
      const result = await api(`/api/admin/page-history?url=${encodeURIComponent(url)}&lang=${lang}`);
      list.replaceChildren(); const items = result.items || [];
      const undo = items.find((item) => item.can_undo);
      byId('undo-page-change').disabled = !undo;
      if (!items.length) { list.textContent = 'Для этой страницы сохранённых изменений пока нет.'; return items; }
      items.forEach((item) => {
        const row = document.createElement('article'); row.className = 'history-row';
        const details = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = item.action === 'undo' ? 'Отмена предыдущей версии' : (item.reverted_at ? 'Изменение отменено' : 'Сохранение страницы');
        const fields = document.createElement('p'); fields.textContent = item.changed_fields.length ? `Изменено: ${item.changed_fields.join(', ')}` : 'Изменения не определены';
        const date = document.createElement('time'); date.textContent = localDate(item.created_at, true);
        details.append(title, fields, date); row.append(details);
        if (item.can_undo) row.append(makeButton('Отменить это изменение', async () => {
          if (!window.confirm('Вернуть сохранённую перед этим изменением версию страницы?')) return;
          try { await api(`/api/admin/page-history/${encodeURIComponent(item.id)}/undo`, { method: 'POST' }); await loadPageHistory(); alert('Предыдущая версия страницы восстановлена.'); }
          catch (error) { alert(error.message); }
        }, 'secondary-btn'));
        list.append(row);
      });
      return items;
    } catch (error) { list.textContent = `Не удалось загрузить историю: ${error.message}`; return []; }
  }
  async function loadScheduleExceptions() {
    const list = byId('schedule-exceptions-list'); if (!list) return;
    list.textContent = 'Загружаю исключения…';
    try {
      const items = await api('/api/admin/schedule-exceptions'); list.replaceChildren();
      if (!items.length) { list.textContent = 'Исключений в расписании пока нет.'; return; }
      items.forEach((item) => {
        const row = document.createElement('article'); row.className = 'schedule-row';
        const detail = document.createElement('div'); const title = document.createElement('strong'); title.textContent = `${String(item.exception_date).slice(0,10)} · ${item.label}`;
        const time = document.createElement('p'); time.textContent = item.is_open ? `Открыто ${String(item.opening_time).slice(0,5)}–${String(item.closing_time).slice(0,5)}` : 'Музей закрыт'; detail.append(title,time);
        const actions = document.createElement('div'); actions.className = 'editor-actions';
        actions.append(makeButton('Изменить', () => {
          byId('exception-date').value = String(item.exception_date).slice(0,10); byId('exception-label').value = item.label;
          exceptionOpen.checked = item.is_open; byId('exception-opening').value = item.opening_time ? String(item.opening_time).slice(0,5) : '10:00'; byId('exception-closing').value = item.closing_time ? String(item.closing_time).slice(0,5) : '18:00'; updateExceptionTimeState();
          byId('schedule-exception-form').scrollIntoView({ behavior:'smooth', block:'center' });
        }, 'secondary-btn'), makeButton('Удалить', async () => { try { await api(`/api/admin/schedule-exceptions/${encodeURIComponent(item.id)}`, { method:'DELETE' }); await loadScheduleExceptions(); } catch(error) { alert(error.message); } }, 'delete-btn'));
        row.append(detail, actions);
        list.append(row);
      });
    } catch(error) { list.textContent = `Не удалось загрузить исключения: ${error.message}`; }
  }
  window.loadPageHistory = loadPageHistory;
  window.openAdminMediaPicker = openMediaPicker;
  function localDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('ru-RU', withTime ? {} : { dateStyle: 'medium' });
  }
  const statusLabels = { draft: 'Черновик', published: 'Опубликовано', hidden: 'Скрыто' };
  function previewUrl(type, id) {
    if (type === 'exhibits') return `/exhibit.html?id=${encodeURIComponent(id)}`;
    if (type === 'news' || type === 'events') return `/admin-preview.html?type=${type === 'news' ? 'news' : 'event'}&id=${encodeURIComponent(id)}`;
    return '';
  }
  let exhibitSearchTimer;
  function createTable(container, rows, headings, emptyText, pagination = null) {
    container.replaceChildren();
    container.classList.remove('load-error');
    const toolbar = document.createElement('div'); toolbar.className = 'table-toolbar';
    const count = document.createElement('span'); count.className = 'table-result-count';
    count.textContent = `${pagination ? pagination.total : rows.length} записей`;
    const search = document.createElement('input'); search.className = 'table-search'; search.type = 'search'; search.placeholder = 'Найти запись…'; search.setAttribute('aria-label', 'Поиск в списке');
    if (pagination) search.value = pagination.query || '';
    toolbar.append(count, search);
    const listType = pagination?.type || rows[0]?.type;
    if (listType) {
      const navCount = document.createElement('span'); navCount.className = 'nav-count';
      navCount.textContent = String(pagination ? pagination.total : rows.length);
      const nav = document.querySelector(`#nav-${listType} span:last-child`);
      if (nav) { const previous = nav.querySelector('.nav-count'); if (previous) previous.remove(); nav.append(navCount); }
    }
    if (pagination?.onSearch) {
      search.addEventListener('input', () => {
        clearTimeout(exhibitSearchTimer);
        const query = search.value.trim();
        exhibitSearchTimer = setTimeout(() => pagination.onSearch(query), 250);
      });
    }
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = pagination?.query ? 'По запросу ничего не найдено.' : emptyText;
      container.append(toolbar, empty);
      return;
    }
    const table = document.createElement('table');
    const thead = table.createTHead().insertRow();
    [...headings, 'Действия'].forEach((text) => {
      const th = document.createElement('th'); th.textContent = text; thead.append(th);
    });
    const body = table.createTBody();
    rows.forEach(({ item, cells, type }) => {
      const tr = body.insertRow();
      cells.forEach((cell) => {
        const td = tr.insertCell();
        if (cell && typeof cell === 'object') {
          const badge = document.createElement('span'); badge.textContent = cell.text ?? '—'; badge.className = cell.className || '';
          td.append(badge);
        } else td.textContent = cell ?? '—';
      });
      const actions = tr.insertCell();
      const url = previewUrl(type, item.id);
      if (url) {
        const preview = document.createElement('a'); preview.href = url; preview.target = '_blank'; preview.rel = 'noopener'; preview.className = 'preview-btn'; preview.textContent = 'Посмотреть';
        actions.append(preview, document.createTextNode(' '));
      }
      actions.append(makeButton('Изменить', () => openEditor(type, item.id), 'secondary-btn'), document.createTextNode(' '), makeButton('EN', () => openEditor(type, item.id, true), 'translation-btn'), document.createTextNode(' '), makeButton('Удалить', () => deleteItem(type, item.id), 'delete-btn'));
    });
    if (!pagination?.onSearch) {
      search.addEventListener('input', () => {
        let visible = 0;
        [...body.rows].forEach((row) => {
          const matches = row.textContent.toLocaleLowerCase('ru').includes(search.value.trim().toLocaleLowerCase('ru'));
          row.hidden = !matches;
          if (matches) visible++;
        });
        count.textContent = search.value ? `${visible} из ${rows.length} записей` : `${rows.length} записей`;
      });
    }
    container.append(toolbar, table);
    if (pagination && pagination.total > pagination.perPage) {
      const pager = document.createElement('div'); pager.className = 'table-pagination';
      const first = (pagination.page - 1) * pagination.perPage + 1;
      const last = Math.min(pagination.page * pagination.perPage, pagination.total);
      const summary = document.createElement('span'); summary.textContent = `Записи ${first}–${last} из ${pagination.total}`;
      const controls = document.createElement('div'); controls.className = 'table-pagination-controls';
      const previous = makeButton('Назад', () => pagination.onPageChange(pagination.page - 1), 'secondary-btn');
      previous.disabled = pagination.page <= 1;
      const pageLabel = document.createElement('span'); pageLabel.textContent = `${pagination.page} / ${Math.ceil(pagination.total / pagination.perPage)}`;
      const next = makeButton('Вперёд', () => pagination.onPageChange(pagination.page + 1), 'secondary-btn');
      next.disabled = pagination.page >= Math.ceil(pagination.total / pagination.perPage);
      controls.append(previous, pageLabel, next); pager.append(summary, controls); container.append(pager);
    }
  }

  async function loadCategoryOptions(selected = '') {
    const select = byId('ex-category');
    const categories = await api('/api/categories');
    select.replaceChildren(new Option('Без категории', ''));
    categories.forEach((category) => select.add(new Option(category.name, category.id)));
    select.value = selected || '';
  }
  let exhibitsPage = 1;
  let exhibitsSearch = '';
  const exhibitsPerPage = 25;
  async function loadExhibitsList() {
    const query = new URLSearchParams({ page: String(exhibitsPage), per_page: String(exhibitsPerPage) });
    if (exhibitsSearch) query.set('q', exhibitsSearch);
    let result = await api(`/api/exhibits?${query}`);
    const lastPage = Math.max(1, Math.ceil(result.total / result.per_page));
    if (exhibitsPage > lastPage) {
      exhibitsPage = lastPage;
      query.set('page', String(exhibitsPage));
      result = await api(`/api/exhibits?${query}`);
    }
    createTable(byId('exhibits-list'), result.items.map((item) => ({ item, type: 'exhibits', cells: [item.title, item.order_index ?? 0, item.is_exhibit_of_day ? 'Экспонат дня' : '—', item.creation_date || '—'] })), ['Название', 'Порядок', 'Отметка', 'Эпоха / дата'], 'Экспонатов пока нет.', {
      type: 'exhibits', total: result.total, page: result.page, perPage: result.per_page, query: exhibitsSearch,
      onPageChange: async (page) => { exhibitsPage = page; await loadExhibitsList(); },
      onSearch: async (value) => { exhibitsSearch = value; exhibitsPage = 1; await loadExhibitsList(); }
    });
  }
  async function loadNewsList() {
    const items = await api('/api/admin/news');
    createTable(byId('news-list'), items.map((item) => ({ item, type: 'news', cells: [item.title, localDate(item.published_at), { text: statusLabels[item.publication_status] || item.publication_status, className: `status-badge status-${item.publication_status}` }] })), ['Заголовок', 'Дата публикации', 'Статус'], 'Новостей пока нет.');
  }
  async function loadEventsList() {
    const items = await api('/api/admin/events');
    createTable(byId('events-list'), items.map((item) => ({ item, type: 'events', cells: [item.title, localDate(item.start_date, true), { text: statusLabels[item.publication_status] || item.publication_status, className: `status-badge status-${item.publication_status}` }] })), ['Название', 'Начало', 'Статус'], 'Мероприятий пока нет.');
  }
  async function loadCategoriesList() {
    const items = await api('/api/categories');
    createTable(byId('categories-list'), items.map((item) => ({ item, type: 'categories', cells: [item.name, item.slug, item.exhibit_count ?? 0] })), ['Название', 'Slug', 'Экспонатов'], 'Категорий пока нет.');
  }
  function overviewWorkingStatus(schedule) {
    if (schedule.status_mode === 'open') return 'Открыто вручную';
    if (schedule.status_mode === 'closed') return 'Закрыто вручную';
    const parts = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Yakutsk', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const day = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[values.weekday];
    const time = `${values.hour}:${values.minute}`;
    if (schedule.exception) {
      const exception = schedule.exception;
      const open = exception.is_open && time >= String(exception.opening_time).slice(0,5) && time < String(exception.closing_time).slice(0,5);
      return open ? `Сейчас открыто · ${exception.label}` : `Сейчас закрыто · ${exception.label}`;
    }
    const isOpen = (schedule.open_days || []).map(Number).includes(day) && time >= schedule.opening_time && time < schedule.closing_time;
    return isOpen ? `Сейчас открыто · до ${schedule.closing_time}` : `Сейчас закрыто · ${schedule.opening_time}–${schedule.closing_time}`;
  }
  async function loadOverview() {
    const container = byId('overview-content');
    if (!container) return;
    container.textContent = 'Загружаю данные…';
    try {
      const data = await api('/api/admin/overview');
      container.replaceChildren();
      const grid = document.createElement('div'); grid.className = 'dashboard-grid';
      [
        ['Экспонаты', data.counts.exhibits, 'Все записи коллекции'],
        ['Новости', data.counts.news.total, `${data.counts.news.published} опубликовано · ${data.counts.news.draft} черновиков · ${data.counts.news.hidden} скрыто`],
        ['Мероприятия', data.counts.events.total, `${data.counts.events.published} опубликовано · ${data.counts.events.draft} черновиков · ${data.counts.events.hidden} скрыто`]
      ].forEach(([label, value, detail]) => {
        const card = document.createElement('div'); card.className = 'dashboard-card';
        const caption = document.createElement('small'); caption.textContent = label;
        const total = document.createElement('strong'); total.textContent = value;
        const note = document.createElement('span'); note.textContent = detail;
        card.append(caption, total, note); grid.append(card);
      });
      const columns = document.createElement('div'); columns.className = 'dashboard-columns';
      const current = document.createElement('section'); current.className = 'dashboard-panel';
      const currentTitle = document.createElement('h3'); currentTitle.textContent = 'Сейчас на сайте';
      const status = document.createElement('p'); status.textContent = overviewWorkingStatus(data.schedule);
      const schedule = document.createElement('p'); schedule.className = 'admin-subtitle'; schedule.textContent = `Расписание: ${data.schedule.opening_time}–${data.schedule.closing_time}`;
      const eventTitle = document.createElement('h3'); eventTitle.textContent = 'Ближайшее мероприятие';
      const event = document.createElement('p'); event.textContent = data.next_event ? `${data.next_event.title} · ${localDate(data.next_event.start_date, true)}` : 'Опубликованных предстоящих мероприятий нет.';
      current.append(currentTitle, status, schedule, eventTitle, event);
      const recent = document.createElement('section'); recent.className = 'dashboard-panel';
      const recentTitle = document.createElement('h3'); recentTitle.textContent = 'Последние изменения';
      const list = document.createElement('ul'); list.className = 'dashboard-list';
      (data.recent_changes || []).forEach((change) => {
        const item = document.createElement('li');
        const name = document.createElement('span'); name.textContent = `${change.item_type}: ${change.title}`;
        const date = document.createElement('time'); date.textContent = localDate(change.changed_at, true);
        item.append(name, date); list.append(item);
      });
      if (!list.children.length) { const item = document.createElement('li'); item.textContent = 'Изменений пока нет.'; list.append(item); }
      recent.append(recentTitle, list); columns.append(current, recent); container.append(grid, columns);
    } catch (error) {
      container.className = 'load-error'; container.textContent = `Не удалось загрузить обзор: ${error.message}`;
    }
  }
  const reload = { exhibits: loadExhibitsList, news: loadNewsList, events: loadEventsList, categories: loadCategoriesList };

  async function deleteItem(type, id) {
    const definition = types[type];
    if (!confirm(`Удалить ${definition.label}? Это действие нельзя отменить.`)) return;
    try {
      await api(`/api/${type}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await reload[type]();
      if (type === 'categories') await loadCategoryOptions();
      alert('Запись удалена.');
    } catch (error) { alert(error.message); }
  }

  function fieldElement(field, record, englishOnly) {
    const [key, label, kind] = field;
    const wrapper = document.createElement('div'); wrapper.className = 'form-group';
    const caption = document.createElement('label'); caption.textContent = label; wrapper.append(caption);
    let input;
    if (kind === 'textarea') { input = document.createElement('textarea'); input.rows = key.includes('content') || key.includes('description') ? 5 : 3; }
    else if (kind === 'category') {
      input = document.createElement('select'); input.add(new Option('Без категории', ''));
      JSON.parse(byId('category-cache').textContent || '[]').forEach((category) => input.add(new Option(category.name, category.id)));
    } else if (kind === 'status') {
      input = document.createElement('select');
      Object.entries(statusLabels).forEach(([value, text]) => input.add(new Option(text, value)));
    } else if (kind === 'checkbox') { input = document.createElement('input'); input.type = 'checkbox'; input.checked = Boolean(record[key]); }
    else { input = document.createElement('input'); input.type = kind === 'image-url' ? 'text' : kind; }
    input.name = key;
    if (kind !== 'checkbox') {
      let value = record[key] ?? '';
      if (kind === 'datetime-local' && value) {
        const date = new Date(value);
        const pad = (part) => String(part).padStart(2, '0');
        if (!Number.isNaN(date.getTime())) value = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
      input.value = value;
    }
    input.required = field[3] === true;
    if (kind === 'image-url') {
      const preview = document.createElement('img'); preview.alt = 'Текущее изображение'; preview.style.cssText = 'display:block;max-width:220px;max-height:140px;object-fit:contain;margin-top:.5rem';
      if (input.value) preview.src = input.value;
      input.addEventListener('input', () => { if (input.value) preview.src = input.value; else preview.removeAttribute('src'); });
      const replaceLabel = document.createElement('small'); replaceLabel.textContent = 'Заменить изображение';
      const replacement = document.createElement('input'); replacement.type = 'file'; replacement.accept = 'image/jpeg,image/png,image/webp,image/gif'; replacement.dataset.imageReplacement = 'true';
      replacement.addEventListener('change', () => {
        try {
          validateImageSelection(replacement);
          if (replacement.files[0]) {
            const objectUrl = URL.createObjectURL(replacement.files[0]);
            preview.onload = () => URL.revokeObjectURL(objectUrl);
            preview.src = objectUrl;
          }
        }
        catch (error) { alert(error.message); preview.src = input.value; }
      });
      const remove = makeButton('Убрать изображение', () => { input.value = ''; preview.removeAttribute('src'); replacement.value = ''; });
      const choose = makeButton('Выбрать из медиатеки', () => openMediaPicker({ onSelect: (url) => { input.value = url; input.dispatchEvent(new Event('input')); replacement.value = ''; preview.src = url; } }), 'secondary-btn');
      wrapper.append(input, choose, preview, replaceLabel, replacement, remove);
    } else wrapper.append(input);
    if (englishOnly) {
      const sourceKey = key.replace(/_en$/, '');
      const hint = document.createElement('small'); hint.textContent = `Русский оригинал: ${record[sourceKey] || 'не заполнен'}`; wrapper.append(hint);
    }
    return { wrapper, input };
  }

  async function openEditor(type, id, englishOnly = false) {
    const definition = types[type];
    try {
      const recordUrl = type === 'news' ? `/api/admin/news/${encodeURIComponent(id)}` : type === 'events' ? `/api/admin/events/${encodeURIComponent(id)}` : `/api/${type}/${encodeURIComponent(id)}`;
      const record = await api(recordUrl);
      if (type === 'exhibits') {
        const cache = await api('/api/categories');
        byId('category-cache').textContent = JSON.stringify(cache);
      }
      const dialog = document.createElement('dialog');
      dialog.style.cssText = 'width:min(760px,94vw);max-height:90vh;overflow:auto;border:1px solid #aaa;border-radius:8px;padding:1.25rem';
      const form = document.createElement('form');
      const heading = document.createElement('h2'); heading.textContent = englishOnly ? 'English translation' : `Редактировать: ${definition.label}`; form.append(heading);
      if (!englishOnly) {
        const hint = document.createElement('p'); hint.className = 'notice'; hint.textContent = 'Пустые значения можно очистить; для этого поля не отправляются, пока вы не измените их.'; form.append(hint);
      }
      const includedFields = definition.fields.filter(([key]) => !englishOnly || key.endsWith('_en'));
      const controls = includedFields.map((field) => {
        const item = fieldElement(field, record, englishOnly); form.append(item.wrapper); return item.input;
      });
      let selectedGallery = [];
      if (type === 'exhibits' && !englishOnly) {
        const images = document.createElement('input'); images.type = 'file'; images.accept = 'image/jpeg,image/png,image/webp,image/gif'; images.multiple = true; images.dataset.gallery = 'true';
        const galleryPreview = document.createElement('div'); galleryPreview.className = 'image-preview';
        images.addEventListener('change', () => {
          try {
            validateImageSelection(images, 4); galleryPreview.replaceChildren();
            [...images.files].forEach((file) => {
              const preview = document.createElement('img'); preview.alt = file.name;
              const objectUrl = URL.createObjectURL(file); preview.onload = () => URL.revokeObjectURL(objectUrl); preview.src = objectUrl; galleryPreview.append(preview);
            });
          } catch (error) { images.value = ''; galleryPreview.replaceChildren(); alert(error.message); }
        });
        const label = document.createElement('label'); label.textContent = 'Состав галереи (до 4 фотографий)'; label.append(images);
        const chooseGallery = makeButton('Выбрать фотографии из медиатеки', () => openMediaPicker({ multiple: true, onSelect: (urls) => { selectedGallery = urls.slice(0, 4); galleryPreview.replaceChildren(); selectedGallery.forEach((url) => { const img = document.createElement('img'); img.src = url; img.alt = 'Выбранная фотография'; galleryPreview.append(img); }); } }), 'secondary-btn');
        form.append(label, chooseGallery, galleryPreview);
        const existing = document.createElement('p'); existing.textContent = `Сейчас в галерее: ${(record.images || []).length} фото. Выбор новых файлов или из медиатеки полностью заменит её.`; form.append(existing);
        images.dataset.selectedUrls = '[]';
        images.addEventListener('change', () => { selectedGallery = []; images.dataset.selectedUrls = '[]'; });
      }
      if (!englishOnly && ['news', 'events'].includes(type)) {
        // The default editor includes both Russian and English fields, so translations remain editable together.
      }
      const actions = document.createElement('div'); actions.style.cssText = 'display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem';
      const cancel = makeButton('Отмена', () => dialog.close()); cancel.className = '';
      const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'Сохранить';
      actions.append(cancel, save); form.append(actions); dialog.append(form); document.body.append(dialog);
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); save.disabled = true;
        try {
          const body = {};
          controls.forEach((control) => {
            if (control.type === 'checkbox') body[control.name] = control.checked;
            else if (control.name === 'end_date') body[control.name] = control.value || null;
            else if (control.name === 'category_id' && control.value === '') return;
            else body[control.name] = control.value;
          });
          const gallery = $('[data-gallery]', form);
          if (gallery?.files.length || selectedGallery.length) {
            const images = [...selectedGallery];
            for (const file of [...gallery.files]) images.push(await uploadImage(file));
            body.images = images.slice(0, 4);
          }
          const replacement = $('[data-image-replacement]', form);
          if (replacement?.files[0]) body.image_url = await uploadImage(replacement.files[0]);
          await api(`/api/${type}/${encodeURIComponent(id)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
          dialog.close(); await reload[type]();
          if (type === 'categories') await loadCategoryOptions();
          alert('Изменения сохранены.');
        } catch (error) { alert(error.message); save.disabled = false; }
      });
      dialog.addEventListener('close', () => dialog.remove(), { once: true });
      dialog.showModal();
    } catch (error) { alert(error.message); }
  }
  window.editEnglish = (type, id) => openEditor(type, id, true);

  function validateImageSelection(input, maxFiles = 1) {
    const accepted = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (input.files.length > maxFiles) { input.value = ''; throw new Error(`Можно выбрать не более ${maxFiles} изображений.`); }
    for (const file of input.files) {
      if (!accepted.has(file.type)) { input.value = ''; throw new Error('Поддерживаются JPEG, PNG, WebP и GIF.'); }
      if (file.size > 10 * 1024 * 1024) { input.value = ''; throw new Error('Размер каждого изображения не должен превышать 10 МБ.'); }
    }
  }
  async function uploadImage(file) {
    const data = new FormData(); data.append('image', file);
    const result = await api('/api/upload', { method: 'POST', body: data });
    return result.url;
  }
  function connectPreviews(inputId, maxFiles = 1) {
    const input = byId(inputId);
    const preview = document.createElement('div'); preview.className = 'image-preview'; input.parentElement.append(preview);
    input.addEventListener('change', () => {
      try {
        validateImageSelection(input, maxFiles); preview.replaceChildren();
        [...input.files].forEach((file) => { const image = document.createElement('img'); image.alt = file.name; image.src = URL.createObjectURL(file); image.onload = () => URL.revokeObjectURL(image.src); preview.append(image); });
      } catch (error) { preview.replaceChildren(); alert(error.message); }
    });
  }
  function connectLibraryPicker(buttonId, hiddenId, fileId) {
    const button = byId(buttonId); const selected = byId(hiddenId); const file = byId(fileId);
    button.addEventListener('click', () => openMediaPicker({ onSelect: (url) => {
      selected.value = url; file.value = '';
      let preview = file.parentElement.querySelector('.image-preview');
      if (!preview) { preview = document.createElement('div'); preview.className = 'image-preview'; file.parentElement.append(preview); }
      preview.replaceChildren(); const img = document.createElement('img'); img.src = url; img.alt = 'Выбрано из медиатеки'; preview.append(img);
    } }));
    file.addEventListener('change', () => { if (file.files.length) selected.value = ''; });
  }
  function readForm(selector, mapping) {
    const output = {};
    Object.entries(mapping).forEach(([key, id]) => {
      const input = byId(id);
      output[key] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return output;
  }
  async function createFromForm(formId, messageId, type, buildBody, files = []) {
    const form = byId(formId); const message = byId(messageId); const submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); submit.disabled = true; showMessage(message, 'Сохраняю…');
      try {
        const body = await buildBody();
        const result = await api(`/api/${type}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        if (!result.id) throw new Error('Сервер не подтвердил создание записи.');
        if (type === 'exhibits') { exhibitsPage = 1; exhibitsSearch = ''; }
        form.reset(); if (type === 'exhibits') selectedNewGallery = []; files.forEach((id) => byId(id).dispatchEvent(new Event('change')));
        showMessage(message, 'Запись добавлена.'); await reload[type]();
      } catch (error) { showMessage(message, error.message, false); }
      finally { submit.disabled = false; }
    });
  }

  document.querySelectorAll('.tab-btn').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-selected', String(item === button));
    });
    document.querySelectorAll('.tab-content').forEach((item) => item.classList.toggle('hidden', item.id !== `tab-${button.dataset.tab}`));
    if (button.dataset.tab === 'overview') loadOverview();
    if (button.dataset.tab === 'media') loadMediaLibrary();
    if (button.dataset.tab === 'history') loadPageHistory();
    if (button.dataset.tab === 'settings') loadScheduleExceptions();
  }));
  byId('logout-btn').addEventListener('click', () => { localStorage.removeItem('token'); window.location.replace('/admin.html'); });

  connectPreviews('ex-image-file'); connectPreviews('ex-gallery', 4); connectPreviews('news-image-file'); connectPreviews('event-image-file');
  connectLibraryPicker('ex-image-library', 'ex-image-url', 'ex-image-file');
  connectLibraryPicker('news-image-library', 'news-image-url', 'news-image-file');
  connectLibraryPicker('event-image-library', 'event-image-url', 'event-image-file');
  let selectedNewGallery = [];
  byId('ex-gallery-library').addEventListener('click', () => openMediaPicker({ multiple: true, onSelect: (urls) => {
    selectedNewGallery = urls.slice(0, 4); const preview = byId('ex-gallery').parentElement.querySelector('.image-preview'); preview.replaceChildren();
    selectedNewGallery.forEach((url) => { const img = document.createElement('img'); img.src = url; img.alt = 'Фото из медиатеки'; preview.append(img); });
  } }));
  byId('ex-gallery').addEventListener('change', () => { if (byId('ex-gallery').files.length) selectedNewGallery = []; });
  document.getElementById('setting-logo-library').addEventListener('click', () => openMediaPicker({ onSelect: (url) => {
    document.getElementById('setting-logo-url').value = url; document.getElementById('setting-logo-file').value = ''; showLogoPreview(url);
  } }));
  const exceptionOpen = byId('exception-open');
  const updateExceptionTimeState = () => { byId('exception-opening').disabled = !exceptionOpen.checked; byId('exception-closing').disabled = !exceptionOpen.checked; };
  exceptionOpen.addEventListener('change', updateExceptionTimeState); updateExceptionTimeState();
  byId('schedule-exception-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const message = byId('schedule-exception-msg');
    try {
      await api('/api/admin/schedule-exceptions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ exception_date:byId('exception-date').value, label:byId('exception-label').value.trim(), is_open:exceptionOpen.checked, opening_time:byId('exception-opening').value, closing_time:byId('exception-closing').value }) });
      showMessage(message, 'Исключение расписания сохранено.'); byId('schedule-exception-form').reset(); exceptionOpen.checked = false; updateExceptionTimeState(); await loadScheduleExceptions();
    } catch(error) { showMessage(message, error.message, false); }
  });
  byId('history-page').addEventListener('change', loadPageHistory);
  byId('history-language').addEventListener('change', loadPageHistory);
  byId('undo-page-change').addEventListener('click', async () => {
    const items = await loadPageHistory(); const item = items.find((entry) => entry.can_undo); if (!item) return;
    if (!window.confirm('Восстановить версию страницы до последнего сохранения?')) return;
    try { await api(`/api/admin/page-history/${encodeURIComponent(item.id)}/undo`, { method:'POST' }); await loadPageHistory(); alert('Предыдущая версия страницы восстановлена.'); }
    catch(error) { alert(error.message); }
  });
  byId('page-select').addEventListener('change', () => { byId('history-page').value = byId('page-select').value || '/index.html'; loadPageHistory(); });
  byId('page-language').addEventListener('change', () => { byId('history-language').value = byId('page-language').value; loadPageHistory(); });
  byId('ex-gallery').addEventListener('change', () => { if (byId('ex-gallery').files.length > 4) alert('В галерею можно добавить не более 4 изображений.'); });

  const exhibitFields = {
    title:'ex-title', title_en:'ex-title-en', short_description:'ex-short', short_description_en:'ex-short-en',
    description:'ex-desc', description_en:'ex-desc-en', creation_date:'ex-date', material:'ex-material', material_en:'ex-material-en',
    dimensions:'ex-dimensions', dimensions_en:'ex-dimensions-en', origin:'ex-origin', origin_en:'ex-origin-en', audio_url:'ex-audio-url',
    quote:'ex-quote', quote_en:'ex-quote-en', quote_author:'ex-quote-author', quote_author_en:'ex-quote-author-en', category_id:'ex-category', is_featured:'ex-featured', order_index:'ex-display-order', is_exhibit_of_day:'ex-is-day'
  };
  createFromForm('exhibit-add-form','exhibit-msg','exhibits',async()=>{
    const body=readForm('',exhibitFields); body.image_url=byId('ex-image-file').files[0]?await uploadImage(byId('ex-image-file').files[0]):byId('ex-image-url').value;
    body.images=[...selectedNewGallery]; for(const file of [...byId('ex-gallery').files]) body.images.push(await uploadImage(file)); body.images=body.images.slice(0,4); body.category_id=body.category_id||null; return body;
  },['ex-image-file','ex-gallery']);
  createFromForm('news-add-form','news-msg','news',async()=>{
    const body=readForm('',{title:'news-title',title_en:'news-title-en',short_text:'news-short',short_text_en:'news-short-en',content:'news-full',content_en:'news-full-en',published_at:'news-date',publication_status:'news-status'});
    body.image_url=byId('news-image-file').files[0]?await uploadImage(byId('news-image-file').files[0]):byId('news-image-url').value; return body;
  },['news-image-file']);
  createFromForm('event-add-form','event-msg','events',async()=>{
    const body=readForm('',{title:'event-title',title_en:'event-title-en',short_text:'event-short',short_text_en:'event-short-en',description:'event-desc',description_en:'event-desc-en',start_date:'event-start',end_date:'event-end',location:'event-location',location_en:'event-location-en',publication_status:'event-status',is_featured:'event-featured'});
    body.image_url=byId('event-image-file').files[0]?await uploadImage(byId('event-image-file').files[0]):byId('event-image-url').value; return body;
  },['event-image-file']);
  createFromForm('category-add-form','cat-msg','categories',async()=>readForm('',{name:'cat-name',name_en:'cat-name-en',slug:'cat-slug',description:'cat-desc',description_en:'cat-desc-en',order_index:'cat-order'}));

  const labelNames = {
    'ex-title':'Название экспоната','ex-title-en':'Название на английском','ex-short':'Краткое описание','ex-short-en':'Краткое описание на английском',
    'ex-desc':'Полное описание','ex-desc-en':'Полное описание на английском','ex-date':'Эпоха или дата','ex-material':'Материал','ex-material-en':'Материал на английском',
    'ex-dimensions':'Размеры','ex-dimensions-en':'Размеры на английском','ex-origin':'Происхождение','ex-origin-en':'Происхождение на английском',
    'ex-audio-url':'Ссылка на аудио','ex-quote':'Цитата или легенда','ex-quote-en':'Цитата на английском','ex-quote-author':'Автор цитаты','ex-quote-author-en':'Автор цитаты на английском',
    'ex-category':'Категория экспоната','ex-image-file':'Главное изображение','ex-gallery':'Фотографии галереи (до 4)','ex-display-order':'Порядок отображения',
    'news-title':'Заголовок новости','news-title-en':'Заголовок на английском','news-short':'Краткий анонс','news-short-en':'Анонс на английском',
    'news-full':'Полный текст','news-full-en':'Полный текст на английском','news-date':'Дата публикации','news-status':'Статус публикации','news-image-file':'Изображение новости',
    'event-title':'Название мероприятия','event-title-en':'Название на английском','event-short':'Краткое описание','event-short-en':'Краткое описание на английском',
    'event-desc':'Полное описание','event-desc-en':'Полное описание на английском','event-start':'Дата и время начала','event-end':'Дата и время окончания',
    'event-location':'Место проведения','event-location-en':'Место проведения на английском','event-status':'Статус публикации','event-image-file':'Афиша мероприятия',
    'cat-name':'Название категории','cat-name-en':'Название на английском','cat-slug':'Адресное имя (slug)','cat-desc':'Описание категории','cat-desc-en':'Описание на английском','cat-order':'Порядок отображения'
  };
  Object.entries(labelNames).forEach(([id, text]) => {
    const input = byId(id);
    if (!input) return;
    if (input.type === 'checkbox') return;
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = text;
    const parent = input.parentElement;
    if (input.type === 'file' && parent.tagName === 'LABEL') {
      parent.insertAdjacentElement('beforebegin', label);
      return;
    }
    input.insertAdjacentElement('beforebegin', label);
    input.removeAttribute('placeholder');
    input.setAttribute('aria-label', text);
  });

  const cache = document.createElement('script'); cache.id = 'category-cache'; cache.type = 'application/json'; cache.textContent = '[]'; document.body.append(cache);
  const initialLoads = [
    ['overview-content', loadOverview],
    ['exhibits-list', loadExhibitsList], ['news-list', loadNewsList], ['events-list', loadEventsList],
    ['categories-list', loadCategoriesList], ['ex-category', loadCategoryOptions]
  ];
  Promise.allSettled(initialLoads.map(([, load]) => load())).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const target = byId(initialLoads[index][0]);
        const message = `Не удалось загрузить данные: ${result.reason.message}`;
        if (target.tagName === 'SELECT') target.replaceChildren(new Option('Ошибка загрузки категорий', ''));
        else { target.textContent = message; target.classList.add('load-error'); }
      }
    });
  });
})();
