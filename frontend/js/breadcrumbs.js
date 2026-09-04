(function() {
    const currentPath = window.location.pathname;
    
    // Карта страниц: URL -> Название в крошках
    const pageMap = {
        '/': 'Главная',
        '/index.html': 'Главная',
        '/about.html': 'О музее',
        '/history.html': 'История музея',
        '/collections.html': 'Коллекции',
        '/exhibit.html': 'Экспонат',
        '/news.html': 'Новости',
        '/news-single.html': 'Новость',
        '/events.html': 'Афиша',
        '/event.html': 'Мероприятие',
        '/contacts.html': 'Контакты',
        '/visit.html': 'Посетителям',
        '/architecture.html': 'Архитектура',
        '/explore.html': 'Экспозиция',
        '/tour.html': 'Виртуальный тур'
    };

    // Получаем или создаём историю переходов
    let history = JSON.parse(sessionStorage.getItem('breadcrumb-history') || '[]');

    // Если пользователь только что зашёл на сайт или обновил страницу
    if (history.length === 0) {
        history.push('/');
    }

    // Определяем, как пользователь попал на текущую страницу
    const referrer = document.referrer;
    const cameFromSameSite = referrer && referrer.includes(window.location.hostname);

    if (cameFromSameSite) {
        // Пользователь перешёл по ссылке внутри сайта
        const prevPath = new URL(referrer).pathname;
        
        // Если текущая страница уже есть в истории — обрезаем историю до неё
        const existingIndex = history.indexOf(currentPath);
        if (existingIndex !== -1) {
            history = history.slice(0, existingIndex + 1);
        } else {
            // Проверяем, не вернулся ли пользователь на предыдущую страницу
            const prevIndex = history.indexOf(prevPath);
            if (prevIndex !== -1 && history[history.length - 1] !== prevPath) {
                history = history.slice(0, prevIndex + 1);
                history.push(currentPath);
            } else if (history[history.length - 1] === prevPath) {
                history.push(currentPath);
            } else {
                // Новый путь — добавляем к истории
                history.push(currentPath);
            }
        }
    } else {
        // Пользователь зашёл напрямую или обновил страницу
        if (!history.includes(currentPath)) {
            history.push(currentPath);
        }
    }

    // Ограничиваем историю 5 последними страницами
    if (history.length > 5) {
        history = history.slice(-5);
    }

    // Сохраняем историю
    sessionStorage.setItem('breadcrumb-history', JSON.stringify(history));

    // Рендерим хлебные крошки
    const breadcrumbContainer = document.querySelector('.breadcrumbs');
    if (!breadcrumbContainer) return;

    let html = '';
    history.forEach((path, index) => {
        const name = pageMap[path] || 'Страница';
        
        if (index === history.length - 1) {
            // Текущая страница — не ссылка
            html += '<span class="breadcrumb-current">' + name + '</span>';
        } else {
            // Предыдущие страницы — ссылки
            html += '<a href="' + path + '">' + name + '</a>';
            html += '<span class="breadcrumb-separator">/</span>';
        }
    });

    breadcrumbContainer.innerHTML = html;

    // Обновляем кнопку "Назад" — теперь она ведёт на предыдущую страницу в истории
    const backLink = document.querySelector('.back-link-circle');
    if (backLink && history.length > 1) {
        // Предпоследний элемент истории — это страница, с которой пришли
        const prevPage = history[history.length - 2];
        backLink.href = prevPage;
    }
})();