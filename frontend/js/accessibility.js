(function () {
  'use strict';

  const STORAGE_KEY = 'a11y-settings-v2';

  const defaults = {
    active: false,
    fontSize: 16,
    colorScheme: 'default',
    hideImages: false,
    grayscaleImages: false,
    letterSpacing: 0,
    lineHeight: 1.5,
    letterSpacingLevel: 'normal',   // 'normal' | 'plus' | 'big'
    lineHeightLevel: 'normal',       // 'normal' | 'plus' | 'big'
    fontFamily: 'default',
    disableMedia: false,
    speakOnFocus: false,
    readingSpeed: 1.0
  };

  let settings = JSON.parse(JSON.stringify(defaults));

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) Object.assign(settings, saved);
  } catch (e) {}

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  // ========== Голосовые уведомления ==========
  function speakText(text, rate = 1.0) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  // ========== Чтение страницы ==========
  let isReading = false;
  let currentUtterance = null;
  let lastFocusPhrase = '';

  function getMainText() {
    const main = document.querySelector('main') || document.body;
    const excludeSelectors = [
      'script', 'style',
      '#a11y-panel', '#a11y-player', '#a11y-focus-player',
      '[aria-hidden="true"]',
      '.hidden',
      '[style*="display:none"]',
      '[style*="display: none"]',
      '#news-carousel',
      '#events-list',
      '#featured-exhibits-container'
    ];
    const parts = [];
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/[ \t]+/g, ' ').trim();
        if (text) parts.push(text);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      for (const selector of excludeSelectors) {
        if (node.matches && node.matches(selector)) return;
      }
      node.childNodes.forEach(walk);
    }
    walk(main);
    return parts.join('\n');
  }

  function startReading() {
    if (isReading) return;
    const text = getMainText();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = settings.readingSpeed;
    utterance.onstart = () => { isReading = true; updatePlayerState(); };
    utterance.onend = () => { isReading = false; updatePlayerState(); };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    showPlayer();
    updatePlayerState();
  }

  function pauseReading() {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isReading = false;
      updatePlayerState();
    }
  }

  function resumeReading() {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isReading = true;
      updatePlayerState();
    }
  }

  function stopReading() {
    window.speechSynthesis.cancel();
    isReading = false;
    currentUtterance = null;
    hidePlayer();
    updatePlayerState();
  }

  function setReadingSpeed(speed) {
    settings.readingSpeed = parseFloat(speed);
    saveSettings();
    if (currentUtterance && isReading) {
      const text = currentUtterance.text;
      window.speechSynthesis.cancel();
      const newUtterance = new SpeechSynthesisUtterance(text);
      newUtterance.lang = 'ru-RU';
      newUtterance.rate = settings.readingSpeed;
      newUtterance.onstart = () => { isReading = true; updatePlayerState(); };
      newUtterance.onend = () => { isReading = false; updatePlayerState(); };
      currentUtterance = newUtterance;
      window.speechSynthesis.speak(newUtterance);
    }
  }

  function showPlayer() {
    const oldPlayer = document.getElementById('a11y-player');
    if (oldPlayer) return;
    const player = document.createElement('div');
    player.id = 'a11y-player';
    player.innerHTML = `
      <div class="a11y-player-inner">
        <button class="a11y-player-btn" id="a11y-player-pause" title="Пауза"><i class="ri-pause-fill"></i></button>
        <button class="a11y-player-btn" id="a11y-player-stop" title="Стоп"><i class="ri-stop-fill"></i></button>
        <button class="a11y-player-btn" id="a11y-player-repeat" title="Повторить"><i class="ri-loop-right-line"></i></button>
        <label class="a11y-player-speed">
          Скорость:
          <input type="range" id="a11y-player-speed" min="0.5" max="3" step="0.25" value="${settings.readingSpeed}">
          <span id="a11y-speed-value">${settings.readingSpeed}x</span>
        </label>
      </div>
    `;
    document.body.appendChild(player);
    document.getElementById('a11y-player-pause').addEventListener('click', () => {
      if (isReading) pauseReading();
      else resumeReading();
    });
    document.getElementById('a11y-player-stop').addEventListener('click', stopReading);
    document.getElementById('a11y-player-repeat').addEventListener('click', () => {
      stopReading();
      startReading();
    });
    document.getElementById('a11y-player-speed').addEventListener('input', e => {
      setReadingSpeed(e.target.value);
      document.getElementById('a11y-speed-value').textContent = parseFloat(e.target.value).toFixed(2) + 'x';
    });
  }

  function hidePlayer() {
    const player = document.getElementById('a11y-player');
    if (player) player.remove();
  }

  function updatePlayerState() {
    const pauseBtn = document.getElementById('a11y-player-pause');
    if (pauseBtn) {
      pauseBtn.innerHTML = isReading ? '<i class="ri-pause-fill"></i>' : '<i class="ri-play-fill"></i>';
      pauseBtn.title = isReading ? 'Пауза' : 'Продолжить';
    }
  }

  // ========== Панель ==========
  let panel = null;

  function createPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Панель доступности');
    panel.innerHTML = `
      <div class="a11y-panel-inner">
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-font-size-2"></i> Шрифт</span>
          <button class="a11y-btn" id="a11y-font-minus" title="Уменьшить">−</button>
          <button class="a11y-btn" id="a11y-font-plus" title="Увеличить">+</button>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-palette-line"></i> Схема</span>
          <select class="a11y-select" id="a11y-color-scheme">
            <option value="default">По умолчанию</option>
            <option value="light">Чёрный на белом</option>
            <option value="dark">Белый на чёрном</option>
            <option value="blue">Синий на голубом</option>
          </select>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-image-line"></i> Изображения</span>
          <button class="a11y-btn a11y-toggle" id="a11y-hide-images">Скрыть</button>
          <button class="a11y-btn a11y-toggle" id="a11y-grayscale">Ч/Б</button>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-text-spacing"></i> Интервалы</span>
          <div class="a11y-btn-group">
            <span class="a11y-sub-label">Буквы</span>
            <button class="a11y-btn a11y-toggle" id="a11y-letter-spacing-normal">Норм.</button>
            <button class="a11y-btn a11y-toggle" id="a11y-letter-spacing-plus">Увел.</button>
            <button class="a11y-btn a11y-toggle" id="a11y-letter-spacing-big">Бол.</button>
          </div>
          <div class="a11y-btn-group">
            <span class="a11y-sub-label">Строки</span>
            <button class="a11y-btn a11y-toggle" id="a11y-line-height-normal">Норм.</button>
            <button class="a11y-btn a11y-toggle" id="a11y-line-height-plus">Увел.</button>
            <button class="a11y-btn a11y-toggle" id="a11y-line-height-big">Бол.</button>
          </div>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-font-family"></i> Шрифт</span>
          <button class="a11y-btn a11y-toggle" id="a11y-font-serif">Serif</button>
          <button class="a11y-btn a11y-toggle" id="a11y-font-sans">Sans</button>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-movie-line"></i> Медиа</span>
          <button class="a11y-btn a11y-toggle" id="a11y-disable-media">Отключить</button>
        </div>
        <div class="a11y-group">
          <span class="a11y-group-title"><i class="ri-volume-up-line"></i> Озвучивание</span>
          <button class="a11y-btn a11y-toggle" id="a11y-speak-focus">Читать при фокусе</button>
          <button class="a11y-btn" id="a11y-read-page"><i class="ri-headphone-line"></i> Прослушать страницу</button>
        </div>
        <button class="a11y-btn a11y-close-btn" id="a11y-close" title="Закрыть панель и сбросить настройки">✕ Сбросить и закрыть</button>
      </div>
    `;

    document.body.appendChild(panel);
    updateControlsFromSettings();
    bindEvents();
  }

  function updateControlsFromSettings() {
    setSelect('a11y-color-scheme', settings.colorScheme);
    setRange('a11y-letter-spacing', settings.letterSpacing);
    setRange('a11y-line-height', settings.lineHeight);
    updateToggle('a11y-hide-images', settings.hideImages, 'Скрыть', 'Показать');
    updateToggle('a11y-grayscale', settings.grayscaleImages, 'Ч/Б', 'Цветные');
    updateToggle('a11y-font-serif', settings.fontFamily === 'serif', 'Serif', 'Serif');
    updateToggle('a11y-font-sans', settings.fontFamily === 'sans', 'Sans', 'Sans');
    updateToggle('a11y-disable-media', settings.disableMedia, 'Отключить', 'Показать');
    updateToggle('a11y-speak-focus', settings.speakOnFocus, 'Читать при фокусе', 'Озвучка выкл');
    updateIntervalsButtons();
  }

  function setSelect(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
  function setRange(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
  function updateToggle(id, state, textOn, textOff) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', state);
    btn.textContent = state ? textOff : textOn;
  }

  // ========== Применение настроек ==========
  function applyAllSettings() {
    document.documentElement.style.fontSize = settings.fontSize + 'px';
    document.body.classList.remove('a11y-scheme-light', 'a11y-scheme-dark', 'a11y-scheme-blue');
    if (settings.active && settings.colorScheme === 'light') document.body.classList.add('a11y-scheme-light');
    if (settings.active && settings.colorScheme === 'dark') document.body.classList.add('a11y-scheme-dark');
    if (settings.active && settings.colorScheme === 'blue') document.body.classList.add('a11y-scheme-blue');

    document.body.classList.toggle('a11y-hide-images', settings.hideImages);
    document.body.classList.toggle('a11y-grayscale-images', settings.grayscaleImages);
    setLetterSpacingLevel(settings.letterSpacingLevel);
    setLineHeightLevel(settings.lineHeightLevel);
    document.body.classList.remove('a11y-font-serif', 'a11y-font-sans');
    if (settings.fontFamily === 'serif') document.body.classList.add('a11y-font-serif');
    if (settings.fontFamily === 'sans') document.body.classList.add('a11y-font-sans');
    handleMediaElements(settings.disableMedia);
    handleSpeakOnFocus(settings.speakOnFocus);
    document.body.classList.remove('visually-impaired');
  }

  // ========== Обработчики ==========
  function bindEvents() {
    document.getElementById('a11y-font-plus').addEventListener('click', () => { changeFontSize(2); speakText('Размер шрифта увеличен'); });
    document.getElementById('a11y-font-minus').addEventListener('click', () => { changeFontSize(-2); speakText('Размер шрифта уменьшен'); });
    document.getElementById('a11y-color-scheme').addEventListener('change', e => { setColorScheme(e.target.value); speakText(schemeSpeech(e.target.value)); });
    document.getElementById('a11y-hide-images').addEventListener('click', () => { toggleHideImages(); speakText(settings.hideImages ? 'Изображения скрыты' : 'Изображения показаны'); });
    document.getElementById('a11y-grayscale').addEventListener('click', () => { toggleGrayscale(); speakText(settings.grayscaleImages ? 'Черно-белые изображения' : 'Цветные изображения'); });
    document.getElementById('a11y-letter-spacing-normal').addEventListener('click', () => { setLetterSpacingLevel('normal'); speakText('Межбуквенный интервал обычный'); });
    document.getElementById('a11y-letter-spacing-plus').addEventListener('click', () => { setLetterSpacingLevel('plus'); speakText('Межбуквенный интервал увеличен'); });
    document.getElementById('a11y-letter-spacing-big').addEventListener('click', () => { setLetterSpacingLevel('big'); speakText('Межбуквенный интервал большой'); });
    document.getElementById('a11y-line-height-normal').addEventListener('click', () => { setLineHeightLevel('normal'); speakText('Межстрочный интервал обычный'); });
    document.getElementById('a11y-line-height-plus').addEventListener('click', () => { setLineHeightLevel('plus'); speakText('Межстрочный интервал увеличен'); });
    document.getElementById('a11y-line-height-big').addEventListener('click', () => { setLineHeightLevel('big'); speakText('Межстрочный интервал большой'); });
    document.getElementById('a11y-font-serif').addEventListener('click', () => { setFontFamily('serif'); speakText('Шрифт с засечками'); });
    document.getElementById('a11y-font-sans').addEventListener('click', () => { setFontFamily('sans'); speakText('Шрифт без засечек'); });
    document.getElementById('a11y-disable-media').addEventListener('click', () => { toggleDisableMedia(); speakText(settings.disableMedia ? 'Медиа отключены' : 'Медиа включены'); });
    document.getElementById('a11y-speak-focus').addEventListener('click', () => { toggleSpeakOnFocus(); speakText(settings.speakOnFocus ? 'Озвучивание при фокусе включено' : 'Озвучивание при фокусе отключено'); });
    document.getElementById('a11y-read-page').addEventListener('click', startReading);
    document.getElementById('a11y-close').addEventListener('click', closePanel);
  }

  function schemeSpeech(scheme) {
    if (scheme === 'light') return 'Черный на белом';
    if (scheme === 'dark') return 'Белый на черном';
    if (scheme === 'blue') return 'Синий на голубом';
    return 'Схема по умолчанию';
  }

  function changeFontSize(delta) {
    settings.fontSize = Math.min(28, Math.max(12, settings.fontSize + delta));
    document.documentElement.style.fontSize = settings.fontSize + 'px';
    saveSettings();
  }
  function setColorScheme(scheme) {
    settings.colorScheme = scheme;
    document.body.classList.remove('a11y-scheme-light', 'a11y-scheme-dark', 'a11y-scheme-blue');
    if (scheme !== 'default') document.body.classList.add(`a11y-scheme-${scheme}`);
    saveSettings();
  }
  function toggleHideImages() {
    settings.hideImages = !settings.hideImages;
    document.body.classList.toggle('a11y-hide-images', settings.hideImages);
    updateControlsFromSettings();
    saveSettings();
  }
  function toggleGrayscale() {
    settings.grayscaleImages = !settings.grayscaleImages;
    document.body.classList.toggle('a11y-grayscale-images', settings.grayscaleImages);
    updateControlsFromSettings();
    saveSettings();
  }
  function setLetterSpacingLevel(level) {
    settings.letterSpacingLevel = level;
    const values = { normal: 0, plus: 2, big: 4 };
    document.documentElement.style.letterSpacing = values[level] + 'px';
    settings.letterSpacing = values[level];
    updateIntervalsButtons();
    saveSettings();
  }
  function setLineHeightLevel(level) {
    settings.lineHeightLevel = level;
    const values = { normal: 1.5, plus: 1.8, big: 2.2 };
    document.documentElement.style.lineHeight = values[level];
    settings.lineHeight = values[level];
    updateIntervalsButtons();
    saveSettings();
  }
  function updateIntervalsButtons() {
    const letterMap = { normal: 'a11y-letter-spacing-normal', plus: 'a11y-letter-spacing-plus', big: 'a11y-letter-spacing-big' };
    const lineMap = { normal: 'a11y-line-height-normal', plus: 'a11y-line-height-plus', big: 'a11y-line-height-big' };
    [...Object.values(letterMap), ...Object.values(lineMap)].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    const activeLetterBtn = document.getElementById(letterMap[settings.letterSpacingLevel]);
    const activeLineBtn = document.getElementById(lineMap[settings.lineHeightLevel]);
    if (activeLetterBtn) activeLetterBtn.classList.add('active');
    if (activeLineBtn) activeLineBtn.classList.add('active');
  }
  function setFontFamily(family) {
    settings.fontFamily = family;
    document.body.classList.remove('a11y-font-serif', 'a11y-font-sans');
    if (family === 'serif') document.body.classList.add('a11y-font-serif');
    if (family === 'sans') document.body.classList.add('a11y-font-sans');
    updateControlsFromSettings();
    saveSettings();
  }
  function toggleDisableMedia() {
    settings.disableMedia = !settings.disableMedia;
    handleMediaElements(settings.disableMedia);
    updateControlsFromSettings();
    saveSettings();
  }

  // ========== Озвучка при фокусе ==========
  let focusHandler = null;
  function handleSpeakOnFocus(enable) {
    if (enable && !focusHandler) {
      focusHandler = e => {
        const el = e.target;
        if (!el || el.closest('#a11y-panel') || el.closest('#a11y-player')) return;
        let label = '';
        if (el.getAttribute('aria-label')) {
          label = el.getAttribute('aria-label');
        } else if (el.tagName === 'INPUT') {
          label = el.getAttribute('placeholder') || el.value || '';
        } else {
          label = (el.textContent || '').trim();
        }
        if (label) {
          lastFocusPhrase = label;
          speakText(label, settings.readingSpeed);
        }
      };
      document.addEventListener('focusin', focusHandler);
    } else if (!enable && focusHandler) {
      document.removeEventListener('focusin', focusHandler);
      window.speechSynthesis.cancel();
      focusHandler = null;
    }
  }
  function toggleSpeakOnFocus() {
    settings.speakOnFocus = !settings.speakOnFocus;
    handleSpeakOnFocus(settings.speakOnFocus);
    if (settings.speakOnFocus) {
      showFocusPlayer();
    } else {
      hideFocusPlayer();
    }
    updateControlsFromSettings();
    saveSettings();
  }

  function showFocusPlayer() {
    const old = document.getElementById('a11y-focus-player');
    if (old) return;
    const player = document.createElement('div');
    player.id = 'a11y-focus-player';
    player.innerHTML = `
      <div class="a11y-focus-player-inner">
        <button class="a11y-player-btn" id="a11y-focus-repeat" title="Повторить"><i class="ri-loop-right-line"></i></button>
        <label class="a11y-player-speed">
          Скорость:
          <input type="range" id="a11y-focus-speed" min="0.5" max="3" step="0.25" value="${settings.readingSpeed}">
          <span id="a11y-focus-speed-value">${settings.readingSpeed}x</span>
        </label>
        <button class="a11y-player-btn a11y-close-btn" id="a11y-focus-close" title="Скрыть плеер"><i class="ri-close-line"></i></button>
      </div>
    `;
    document.body.appendChild(player);
    document.getElementById('a11y-focus-repeat').addEventListener('click', () => {
      if (lastFocusPhrase) speakText(lastFocusPhrase, settings.readingSpeed);
    });
    document.getElementById('a11y-focus-speed').addEventListener('input', e => {
      settings.readingSpeed = parseFloat(e.target.value);
      document.getElementById('a11y-focus-speed-value').textContent = settings.readingSpeed.toFixed(2) + 'x';
      saveSettings();
    });
    document.getElementById('a11y-focus-close').addEventListener('click', hideFocusPlayer);
  }

  function hideFocusPlayer() {
    const player = document.getElementById('a11y-focus-player');
    if (player) player.remove();
  }

  function handleMediaElements(disable) {
    document.querySelectorAll('video, audio').forEach(el => {
      if (disable) {
        el.setAttribute('data-a11y-controls', el.hasAttribute('controls'));
        el.pause();
        el.controls = false;
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.controls = el.getAttribute('data-a11y-controls') === 'true';
        el.removeAttribute('data-a11y-controls');
      }
    });
    document.querySelectorAll('iframe').forEach(iframe => {
      if (disable) {
        iframe.setAttribute('data-a11y-src', iframe.src);
        iframe.src = '';
        iframe.style.display = 'none';
      } else {
        if (iframe.getAttribute('data-a11y-src')) {
          iframe.src = iframe.getAttribute('data-a11y-src');
          iframe.removeAttribute('data-a11y-src');
          iframe.style.display = '';
        }
      }
    });
  }

  // ========== Открыть / Закрыть ==========
function openPanel(announce = false) {
  if (!panel) createPanel();
  settings.active = true;
  if (settings.colorScheme === 'default') {
    settings.colorScheme = 'light';
  }
  saveSettings();
  applyAllSettings();

  // Показываем панель
  panel.classList.add('show');

  // Добавляем отступ body, чтобы контент не залезал под панель
  adjustBodyPadding();

  if (announce) {
    speakText('Режим для слабовидящих включён. Установлена светлая схема.');
    sessionStorage.setItem('a11y-welcome-announced', '1');
  }
}

function closePanel() {
  if (panel) {
    panel.classList.remove('show');
  }
  hidePlayer();
   hideFocusPlayer();
  document.body.style.paddingTop = '';   // сброс отступа
  settings = JSON.parse(JSON.stringify(defaults));
  document.documentElement.style.fontSize = '';
  document.documentElement.style.letterSpacing = '';
  document.documentElement.style.lineHeight = '';
  document.body.classList.remove(
    'a11y-scheme-light', 'a11y-scheme-dark', 'a11y-scheme-blue',
    'a11y-hide-images', 'a11y-grayscale-images',
    'a11y-font-serif', 'a11y-font-sans', 'visually-impaired'
  );
  handleMediaElements(false);
  handleSpeakOnFocus(false);
  settings.active = false;
  saveSettings();
  speakText('Режим для слабовидящих отключён.');
}
function adjustBodyPadding() {
  const panel = document.getElementById('a11y-panel');
  if (panel && panel.classList.contains('show')) {
    document.body.style.paddingTop = panel.offsetHeight + 'px';
  } else {
    document.body.style.paddingTop = '';
  }
}

  function handleToggle(e) {
    e.preventDefault();
    if (panel && panel.classList.contains('show')) {
      closePanel();
    } else {
      openPanel(true);
    }
  }
  // ========== Инициализация ==========
if (settings.active) {
  if (!sessionStorage.getItem('a11y-welcome-announced')) {
    openPanel(true);
  } else {
    openPanel(false);
  }
}

  document.getElementById('visual-impaired-btn')?.addEventListener('click', handleToggle);
  document.getElementById('visual-impaired-btn-mobile')?.addEventListener('click', handleToggle);
})();