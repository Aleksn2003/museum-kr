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
      ['image_url', 'Путь к главному изображению', 'image-url'], ['category_id', 'Категория', 'category'], ['is_featured', 'Показывать на главной', 'checkbox']
    ] },
    news: { label: 'новость', list: 'news-list', fields: [
      ['title', 'Заголовок', 'text', true], ['title_en', 'Title (English)', 'text'],
      ['short_text', 'Краткий анонс', 'textarea'], ['short_text_en', 'Short summary (English)', 'textarea'],
      ['content', 'Полный текст', 'textarea'], ['content_en', 'Full text (English)', 'textarea'],
      ['published_at', 'Дата публикации', 'datetime-local'], ['image_url', 'Путь к изображению', 'image-url']
    ] },
    events: { label: 'мероприятие', list: 'events-list', fields: [
      ['title', 'Название', 'text', true], ['title_en', 'Title (English)', 'text'],
      ['short_text', 'Краткое описание', 'textarea'], ['short_text_en', 'Short description (English)', 'textarea'],
      ['description', 'Полное описание', 'textarea'], ['description_en', 'Full description (English)', 'textarea'],
      ['start_date', 'Начало', 'datetime-local', true], ['end_date', 'Окончание', 'datetime-local'],
      ['location', 'Место', 'text'], ['location_en', 'Location (English)', 'text'],
      ['image_url', 'Путь к афише', 'image-url'], ['is_featured', 'Показывать в афише на главной', 'checkbox']
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
  function localDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('ru-RU', withTime ? {} : { dateStyle: 'medium' });
  }
  function createTable(container, rows, headings, emptyText) {
    container.replaceChildren();
    container.classList.remove('load-error');
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = emptyText;
      container.append(empty);
      return;
    }
    const toolbar = document.createElement('div'); toolbar.className = 'table-toolbar';
    const count = document.createElement('span'); count.className = 'table-result-count'; count.textContent = `${rows.length} записей`;
    const search = document.createElement('input'); search.className = 'table-search'; search.type = 'search'; search.placeholder = 'Найти запись…'; search.setAttribute('aria-label', 'Поиск в списке');
    toolbar.append(count, search);
    const table = document.createElement('table');
    const thead = table.createTHead().insertRow();
    [...headings, 'Действия'].forEach((text) => {
      const th = document.createElement('th'); th.textContent = text; thead.append(th);
    });
    const body = table.createTBody();
    rows.forEach(({ item, cells, type }) => {
      const tr = body.insertRow();
      cells.forEach((text) => { const td = tr.insertCell(); td.textContent = text ?? '—'; });
      const actions = tr.insertCell();
      actions.append(
        makeButton('Изменить', () => openEditor(type, item.id), 'secondary-btn'),
        document.createTextNode(' '),
        makeButton('EN', () => openEditor(type, item.id, true), 'translation-btn'),
        document.createTextNode(' '),
        makeButton('Удалить', () => deleteItem(type, item.id), 'delete-btn')
      );
    });
    search.addEventListener('input', () => {
      let visible = 0;
      [...body.rows].forEach((row) => {
        const matches = row.textContent.toLocaleLowerCase('ru').includes(search.value.trim().toLocaleLowerCase('ru'));
        row.hidden = !matches;
        if (matches) visible++;
      });
      count.textContent = search.value ? `${visible} из ${rows.length} записей` : `${rows.length} записей`;
    });
    const listType = rows[0]?.type;
    const navCount = document.createElement('span'); navCount.className = 'nav-count'; navCount.textContent = String(rows.length);
    const nav = listType ? document.querySelector(`#nav-${listType} span:last-child`) : null;
    if (nav) { const previous = nav.querySelector('.nav-count'); if (previous) previous.remove(); nav.append(navCount); }
    container.append(toolbar, table);
  }

  async function loadCategoryOptions(selected = '') {
    const select = byId('ex-category');
    const categories = await api('/api/categories');
    select.replaceChildren(new Option('Без категории', ''));
    categories.forEach((category) => select.add(new Option(category.name, category.id)));
    select.value = selected || '';
  }
  async function loadExhibitsList() {
    const result = await api('/api/exhibits?page=1&per_page=100');
    const items = result.items || result;
    createTable(byId('exhibits-list'), items.map((item) => ({ item, type: 'exhibits', cells: [item.title, item.creation_date || '—'] })), ['Название', 'Эпоха / дата'], 'Экспонатов пока нет.');
  }
  async function loadNewsList() {
    const items = await api('/api/news');
    createTable(byId('news-list'), items.map((item) => ({ item, type: 'news', cells: [item.title, localDate(item.published_at)] })), ['Заголовок', 'Дата публикации'], 'Новостей пока нет.');
  }
  async function loadEventsList() {
    const items = await api('/api/events');
    createTable(byId('events-list'), items.map((item) => ({ item, type: 'events', cells: [item.title, localDate(item.start_date, true)] })), ['Название', 'Начало'], 'Мероприятий пока нет.');
  }
  async function loadCategoriesList() {
    const items = await api('/api/categories');
    createTable(byId('categories-list'), items.map((item) => ({ item, type: 'categories', cells: [item.name, item.slug, item.exhibit_count ?? 0] })), ['Название', 'Slug', 'Экспонатов'], 'Категорий пока нет.');
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
      wrapper.append(input, preview, replaceLabel, replacement, remove);
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
      const record = await api(`/api/${type}/${encodeURIComponent(id)}`);
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
        const label = document.createElement('label'); label.textContent = 'Заменить галерею изображений (до 4)'; label.append(images); form.append(label, galleryPreview);
        const existing = document.createElement('p'); existing.textContent = `В галерее сейчас: ${(record.images || []).length} фото. Выберите новые файлы, чтобы заменить её.`; form.append(existing);
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
          if (gallery?.files.length) {
            const images = [];
            for (const file of [...gallery.files]) images.push(await uploadImage(file));
            body.images = images;
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
        form.reset(); files.forEach((id) => byId(id).dispatchEvent(new Event('change')));
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
  }));
  byId('logout-btn').addEventListener('click', () => { localStorage.removeItem('token'); window.location.replace('/admin.html'); });

  connectPreviews('ex-image-file'); connectPreviews('ex-gallery', 4); connectPreviews('news-image-file'); connectPreviews('event-image-file');
  byId('ex-gallery').addEventListener('change', () => { if (byId('ex-gallery').files.length > 4) alert('В галерею можно добавить не более 4 изображений.'); });

  const exhibitFields = {
    title:'ex-title', title_en:'ex-title-en', short_description:'ex-short', short_description_en:'ex-short-en',
    description:'ex-desc', description_en:'ex-desc-en', creation_date:'ex-date', material:'ex-material', material_en:'ex-material-en',
    dimensions:'ex-dimensions', dimensions_en:'ex-dimensions-en', origin:'ex-origin', origin_en:'ex-origin-en', audio_url:'ex-audio-url',
    quote:'ex-quote', quote_en:'ex-quote-en', quote_author:'ex-quote-author', quote_author_en:'ex-quote-author-en', category_id:'ex-category', is_featured:'ex-featured'
  };
  createFromForm('exhibit-add-form','exhibit-msg','exhibits',async()=>{
    const body=readForm('',exhibitFields); body.image_url=byId('ex-image-file').files[0]?await uploadImage(byId('ex-image-file').files[0]):'';
    body.images=[]; for(const file of [...byId('ex-gallery').files]) body.images.push(await uploadImage(file)); body.category_id=body.category_id||null; return body;
  },['ex-image-file','ex-gallery']);
  createFromForm('news-add-form','news-msg','news',async()=>{
    const body=readForm('',{title:'news-title',title_en:'news-title-en',short_text:'news-short',short_text_en:'news-short-en',content:'news-full',content_en:'news-full-en',published_at:'news-date'});
    body.image_url=byId('news-image-file').files[0]?await uploadImage(byId('news-image-file').files[0]):''; return body;
  },['news-image-file']);
  createFromForm('event-add-form','event-msg','events',async()=>{
    const body=readForm('',{title:'event-title',title_en:'event-title-en',short_text:'event-short',short_text_en:'event-short-en',description:'event-desc',description_en:'event-desc-en',start_date:'event-start',end_date:'event-end',location:'event-location',location_en:'event-location-en',is_featured:'event-featured'});
    body.image_url=byId('event-image-file').files[0]?await uploadImage(byId('event-image-file').files[0]):''; return body;
  },['event-image-file']);
  createFromForm('category-add-form','cat-msg','categories',async()=>readForm('',{name:'cat-name',name_en:'cat-name-en',slug:'cat-slug',description:'cat-desc',description_en:'cat-desc-en',order_index:'cat-order'}));

  const labelNames = {
    'ex-title':'Название экспоната','ex-title-en':'Название на английском','ex-short':'Краткое описание','ex-short-en':'Краткое описание на английском',
    'ex-desc':'Полное описание','ex-desc-en':'Полное описание на английском','ex-date':'Эпоха или дата','ex-material':'Материал','ex-material-en':'Материал на английском',
    'ex-dimensions':'Размеры','ex-dimensions-en':'Размеры на английском','ex-origin':'Происхождение','ex-origin-en':'Происхождение на английском',
    'ex-audio-url':'Ссылка на аудио','ex-quote':'Цитата или легенда','ex-quote-en':'Цитата на английском','ex-quote-author':'Автор цитаты','ex-quote-author-en':'Автор цитаты на английском',
    'ex-category':'Категория экспоната','ex-image-file':'Главное изображение','ex-gallery':'Фотографии галереи (до 4)',
    'news-title':'Заголовок новости','news-title-en':'Заголовок на английском','news-short':'Краткий анонс','news-short-en':'Анонс на английском',
    'news-full':'Полный текст','news-full-en':'Полный текст на английском','news-date':'Дата публикации','news-image-file':'Изображение новости',
    'event-title':'Название мероприятия','event-title-en':'Название на английском','event-short':'Краткое описание','event-short-en':'Краткое описание на английском',
    'event-desc':'Полное описание','event-desc-en':'Полное описание на английском','event-start':'Дата и время начала','event-end':'Дата и время окончания',
    'event-location':'Место проведения','event-location-en':'Место проведения на английском','event-image-file':'Афиша мероприятия',
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
