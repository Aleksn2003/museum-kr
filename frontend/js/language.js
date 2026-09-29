(() => {
  'use strict';

  const STORAGE_KEY = 'samyrtay-language';
  const translations = {
    'Главная': 'Home', 'О музее': 'About the Museum', 'История': 'History',
    'Архитектура': 'Architecture', 'Исследовать комплекс': 'Explore the Complex',
    'Коллекции': 'Collections', 'Новости': 'News', 'Афиша': 'Events',
    'Посетителям': 'Visitor Information', 'Контакты': 'Contacts', 'Посетить': 'Visit',
    'О музее': 'About the Museum', 'Экспозиция': 'Exhibitions',
    'Кердемский музей.': 'Kerdem Museum.', 'Комплекс «Самыртай»': 'Samyrtai Complex',
    'Кердемский музей': 'Kerdem Museum', 'Музейный комплекс «Самыртай»': 'Samyrtai Museum Complex',
    'Этнографический музей под открытым небом. Памятники XIX века, быт и культура якутов.': 'An open-air ethnographic museum featuring 19th-century monuments and Sakha life and culture.',
    'Исследовать комплекс': 'Explore the Complex', 'Как добраться': 'How to Get Here',
    'Часы работы': 'Opening Hours', 'Билеты и цены': 'Tickets and Prices', 'Стоимость билетов': 'Ticket prices',
    'Свежие новости': 'Latest News', 'Все новости': 'All News', 'Читать подробнее': 'Read More',
    'Наше наследие в цифрах': 'Our Heritage in Numbers', 'год основания': 'year founded',
    'единиц хранения': 'collection items', 'памятника архитектуры': 'architectural monuments', 'года работы': 'years of history',
    'Памятники под открытым небом': 'Open-Air Monuments',
    'ФОНДЫ МУЗЕЯ': 'MUSEUM COLLECTIONS', 'Уникальные экспонаты': 'Unique Exhibits',
    'АФИША': 'WHAT’S ON', 'Мероприятий и событий': 'Events and Activities',
    'Часто задаваемые вопросы': 'Frequently Asked Questions', 'Как проехать': 'Getting Here',
    'На автомобиле:': 'By car:', 'На автобусе:': 'By bus:', 'Парковка:': 'Parking:',
    'Вход в музей': 'Museum Entrance', 'Главный вход музейного комплекса': 'Main entrance to the museum complex',
    'Написать в мессенджеры:': 'Message us:', 'Заказать экскурсию или задать вопрос': 'Book a Tour or Ask a Question',
    'Оставьте заявку — мы свяжемся с вами в ближайшее время': 'Send us a message and we will get back to you shortly.',
    'Отправить заявку': 'Send Request', 'Партнёрство': 'Partnership', 'Сотрудничество': 'Cooperation',
    'Волонтёрство': 'Volunteering', 'Дарителям': 'For Donors', 'Отзывы': 'Reviews',
    'Документы': 'Documents', 'Сведения об учредителе': 'Founder Information',
    'Оценка качества услуг': 'Service Quality', 'Правила и льготы': 'Visitor Rules and Discounts',
    'Версия для слабовидящих': 'Accessible Version', 'ПОЛЕЗНЫЕ ССЫЛКИ': 'USEFUL LINKS',
    'Политика конфиденциальности': 'Privacy Policy', 'Сохраняем историю и культуру якутского народа.': 'Preserving the history and culture of the Sakha people.',
    'ОСНОВАН В 1991 ГОДУ': 'FOUNDED IN 1991', 'НАСЛЕДИЕ': 'HERITAGE', 'СВЯЗЬ': 'CONTACT',
    'Поиск': 'Search', 'Поиск…': 'Search…', 'Поиск по сайту': 'Search the Site',
    'Поиск по сайту — музей Самыртай': 'Search the Site — Samyrtai Museum',
    'Поисковый запрос': 'Search query', 'Результаты поиска': 'Search results',
    'Найдите информацию на страницах музея, в новостях, афише и коллекциях.': 'Find information about the museum, its news, events and collections.',
    'Например, история музея': 'For example, museum history', 'Найти': 'Search',
    'Введите не менее двух символов, чтобы начать поиск.': 'Enter at least two characters to start searching.',
    'Ищем…': 'Searching…', 'Не удалось выполнить поиск. Попробуйте ещё раз.': 'Search failed. Please try again.',
    'Поиск временно недоступен.': 'Search is temporarily unavailable.',
    'Ищем по страницам сайта, новостям, афише и экспонатам…': 'Searching the site, news, events and exhibits…',
    'По вашему запросу ничего не найдено. Попробуйте изменить формулировку.': 'No results found. Try a different search term.',
    'Все результаты': 'All results', 'Материал': 'Content', 'Без названия': 'Untitled',
    'Показать ещё': 'Show more', 'Подробнее': 'Learn more', 'Читать далее': 'Read more',
    'Все новости': 'All news', 'Все мероприятия': 'All events', 'Все коллекции': 'All collections',
    'Афиша мероприятий': 'Events calendar', 'Архитектура и наследие': 'Architecture and Heritage',
    'Архитектурное наследие': 'Architectural Heritage', 'История музея': 'Museum History',
    'О музее — Кердемский музей-комплекс «Самыртай»': 'About the Museum — Samyrtai Museum Complex',
    'Посетителям — Кердемский музей-комплекс «Самыртай»': 'Visitor Information — Samyrtai Museum Complex',
    'Коллекции — Кердемский музей-комплекс «Самыртай»': 'Collections — Samyrtai Museum Complex',
    'Новости музея': 'Museum News', 'Мероприятие — Кердемский музей-комплекс «Самыртай»': 'Event — Samyrtai Museum Complex',
    'Афиша — Кердемский музей-комплекс «Самыртай»': 'Events — Samyrtai Museum Complex',
    'Коллекции — Кердемский музей-комплекс «Самыртай»': 'Collections — Samyrtai Museum Complex',
    'Архитектурное наследие — Кердемский музей-комплекс «Самыртай»': 'Architectural Heritage — Samyrtai Museum Complex',
    'Исследовать комплекс — Кердемский музей': 'Explore the Complex — Kerdem Museum',
    'История создания музея': 'The Museum’s History', 'Музей сегодня': 'The Museum Today',
    'Общая информация': 'General Information', 'Официальная информация': 'Official Information',
    'Полное наименование': 'Full Name', 'Краткое наименование': 'Short Name',
    'Учредитель': 'Founder', 'Юридический адрес': 'Legal Address', 'Реквизиты': 'Registration Details',
    'Учредительные документы': 'Founding Documents', 'Структура': 'Organisation',
    'Руководство и сотрудники': 'Management and Staff',
    'Доступность для маломобильных граждан': 'Accessibility for Visitors with Reduced Mobility',
    'Физическая доступность': 'Physical Accessibility', 'Услуги для инвалидов': 'Services for Visitors with Disabilities',
    'Контакты ответственного лица': 'Accessibility Contact', 'Контакты и режим работы': 'Contacts and Opening Hours',
    'График работы': 'Opening Hours', 'Стоимость билетов и льготы': 'Ticket Prices and Concessions',
    'Быстрая связь': 'Quick Contact', 'Краткая информация': 'At a Glance',
    'Архитектурное наследие': 'Architectural Heritage', 'Качикатская Николаевская церковь, 1896 г.': 'Kachikatskaya St. Nicholas Church, 1896',
    'Амбар 2‑уровневый богача Кирилла Скрябина, с. Тит‑Эбэ': 'Two-Storey Barn of Kirill Skryabin, Tit-Ebe',
    'Башня-двухэтажный амбар с бойницами, сер. XIX в. (ОКН)': 'Tower Barn with Defensive Openings, Mid-19th Century',
    'Балаган 6‑гранный, летник Даркылах (семья Марковых)': 'Hexagonal Balagan from the Darkylakh Summer Camp (Markov Family)',
    'Детали интерьера': 'Interior Details', 'История': 'History', 'Подробнее об истории': 'More about the history',
    'Мероприятия': 'Events', 'Новости музея': 'Museum News', 'Коллекции': 'Collections',
    'Экспонат дня': 'Object of the Day', 'Афиша мероприятий': 'Events Calendar',
    'Вход в музей': 'Museum Entrance', 'Правила посещения': 'Visitor Rules',
    'Направления деятельности': 'Areas of Activity', 'Сведения о музее': 'About the Museum',
    'Маршрут': 'Directions', 'Заказать экскурсию': 'Book a Guided Tour',
    'Кердемский музей-комплекс «Самыртай» им. Р.К. Захарова': 'Samyrtai Museum Complex named after R. K. Zakharov, Kerdem',
    'Виртуальный тур 360°': '360° Virtual Tour', 'Виртуальный тур': 'Virtual tour',
    'Режим работы': 'Opening hours', 'Часы работы': 'Opening hours', 'Стоимость билетов': 'Ticket prices',
    'Купить билет': 'Buy a ticket', 'Записаться на экскурсию': 'Book a guided tour',
    'Экскурсии': 'Guided tours', 'Адрес': 'Address', 'Контакты и как добраться': 'Contacts and directions',
    'Как добраться': 'How to get here', 'Телефон': 'Phone', 'Телефон для справок': 'Information phone',
    'Важно:': 'Please note:', 'Взрослый билет': 'Adult ticket', 'Детский билет': 'Child ticket',
    'Студенческий билет': 'Student ticket', 'Льготный билет': 'Concession ticket',
    'Бесплатно': 'Free admission', 'Выходной': 'Closed', 'Понедельник': 'Monday',
    'Вторник': 'Tuesday', 'Среда': 'Wednesday', 'Четверг': 'Thursday', 'Пятница': 'Friday',
    'Суббота': 'Saturday', 'Воскресенье': 'Sunday', '10:00–18:00 (Вт–Сб)': '10:00 am–6:00 pm (Tue–Sat)',
    'Понедельник и воскресенье — выходные дни': 'Closed on Mondays and Sundays',
    'Закрыто в понедельник и воскресенье': 'Closed on Mondays and Sundays',
    'В музее собраны уникальные предметы быта и этнографические коллекции народа саха.': 'The museum preserves unique household objects and ethnographic collections of the Sakha people.',
    'Создан по инициативе краеведа Роберта Константиновича Захарова. Сегодня в фондах музея более 900 предметов, рассказывающих о традиционном быте якутов, природе края и истории Кердема. На территории комплекса расположены памятники архитектуры XIX века.': 'Founded on the initiative of local historian Robert Konstantinovich Zakharov, the museum now holds more than 900 objects documenting Sakha traditions, the local environment and the history of Kerdem. The grounds include 19th-century architectural monuments.',
    'Центральное место занимает Качикатская Николаевская церковь (1896 г.) — единственный сохранившийся в улусе образец русского деревянного зодчества с элементами местной строительной культуры. Рядом с ней располагаются двухуровневый амбар богача Кирилла Скрябина из с. Тит‑Эбэ, шестигранный балаган, перевезённый с летника Даркылах, зерносушилка мецената С.П. Барашкова и другие уникальные постройки, позволяющие в деталях представить жизнь якутского наслега XIX – начала XX веков.': 'At the heart of the complex stands the Kachikatskaya St. Nicholas Church (1896), the only surviving example in the district of Russian wooden architecture with local building traditions. Nearby are a two-storey barn belonging to Kirill Skryabin of Tit-Ebe, a hexagonal balagan moved from Darkylakh, a grain dryer donated by S. P. Barashkov, and other buildings that offer a glimpse of Sakha village life in the 19th and early 20th centuries.',
    'Музей является филиалом Хангаласского улусного краеведческого музея им. Г.В. Ксенофонтова с 2021 года. Это открыло новые возможности для научной работы, пополнения фондов и проведения культурных мероприятий. Сегодня «Самыртай» — не только хранилище артефактов, но и живая площадка для праздников, мастер-классов и исследовательской деятельности.': 'Since 2021, the museum has been a branch of the G. V. Ksenofontov Khangalassky District Museum of Local History. This has expanded opportunities for research, growing the collections and hosting cultural events. Today, Samyrtai is both a place where artefacts are preserved and an active venue for celebrations, workshops and research.',
    'На территории музейного комплекса «Самыртай» расположены уникальные архитектурные свидетельства ушедших эпох, перевезённые из разных уголков Хангаласского улуса и бережно восстановленные мастерами-реставраторами. Каждое строение — живой рассказ о быте, традициях и мастерстве якутских зодчих XIX – начала XX веков.': 'The Samyrtai grounds bring together distinctive historic buildings relocated from across Khangalassky District and carefully restored. Each structure tells a story of everyday life, traditions and Sakha craftsmanship from the 19th and early 20th centuries.',
    'Двухэтажный амбар, построенный в XIX веке, принадлежал зажиточному якуту Кириллу Скрябину. Нижний ярус использовался как склад, верхний — как летнее жильё. Постройка отличается сложной конструкцией и богатой резьбой по дереву.': 'Built in the 19th century, this two-storey barn belonged to the prosperous Sakha farmer Kirill Skryabin. The lower level served as storage and the upper floor as summer accommodation. Its complex construction and richly carved woodwork make it distinctive.',
    'Создан по инициативе краеведа Роберта Константиновича Захарова.': 'Founded on the initiative of local historian Robert Konstantinovich Zakharov.',
    'Кердемский музей-комплекс «Самыртай» им. Р.К. Захарова.': 'Samyrtai Museum Complex named after R. K. Zakharov.',
    'В музее собрано более 2 000 экспонатов, рассказывающих об истории и культуре народа саха.': 'The museum holds more than 2,000 objects that tell the story of Sakha history and culture.',
    '1892 год: Строительство Качикатской Николаевской церкви': '1892: Construction of the Kachikatskaya St. Nicholas Church',
    '1922 год: Трагические события у церкви': '1922: Tragic events at the church',
    '1989 год: Спасение церкви и решение о создании музея': '1989: The church is saved and plans for a museum begin',
    '1990–1991 гг.: Перенос экспонатов и открытие комплекса': '1990–1991: Objects are moved and the complex opens',
    'События': 'Events', 'Анонсы ближайших событий, лекций, мастер-классов и праздников музея.': 'Upcoming museum events, talks, workshops and celebrations.',
    'Новости музея': 'Museum news', 'Экспонаты и коллекции': 'Exhibits and collections',
    'Экспонат дня': 'Object of the day', 'Узнать больше': 'Discover more', 'Назад': 'Back',
    '← Музей Самыртай': '← Samyrtai Museum', 'Загрузка…': 'Loading…', 'Загрузка...': 'Loading…',
    'Без категории': 'Uncategorized', 'Все категории': 'All categories', 'Выберите': 'Select',
    'Имя': 'Name', 'Email:': 'Email:', 'Отправить': 'Submit', 'Сохранить': 'Save',
    'Администратор': 'Administrator', 'Админ‑панель': 'Admin panel',
    'Вход в админку': 'Administrator login', 'Для посетителей': 'For visitors',
    'Планируйте визит': 'Plan your visit', 'Полезная информация': 'Useful information',
    'Доступная среда': 'Accessibility', 'Парковка': 'Parking', 'Вход бесплатный': 'Free admission',
    'Действуют льготы': 'Discounts are available', 'Кердем': 'Kerdem',
    'Республика Саха (Якутия)': 'Republic of Sakha (Yakutia)', 'Республика Саха (Якутия), Хангаласский улус, с. Кердем, ул. Ленина': 'Lenina Street, Kerdem village, Khangalassky District, Republic of Sakha (Yakutia)',
    'Головной музей': 'Main Museum', 'Смотреть всё': 'View all', 'Текущая страница': 'Current page',
    'Пушкинская карта': 'Pushkin Card', 'Оплата доступна': 'Payment available', 'Ближайшее мероприятие': 'Upcoming Event',
    'Интересный факт': 'Did You Know?', 'Полезные ссылки': 'Useful Links', 'Экспонаты': 'Exhibits',
    'История музея': 'Museum History', 'Слабовидящим': 'Accessible Version', 'Слабовидящим': 'Accessible Version',
    'Открыть карточку': 'Open exhibit details', 'Показать еще': 'Show more', 'Читать историю музея': 'Read the museum history',
    'В браузере нет поддержки аудио.': 'Your browser does not support audio playback.',
    'Ваш браузер не поддерживает аудиоэлемент.': 'Your browser does not support audio playback.',
    'Основан в 1991 году': 'Founded in 1991', 'Фонды музея': 'Museum Collections', 'Новостной': 'News',
    'Исследуйте комплекс': 'Explore the Complex',
    'Выберите одно из направлений, чтобы погрузиться в историю и культуру нашего музея': 'Choose a section to explore the history and culture of our museum.',
    'Исторические здания и памятники под открытым небом, уникальный облик якутской деревни XIX века.': 'Historic buildings and open-air monuments reveal the distinctive character of a 19th-century Sakha village.',
    'Исследовать': 'Explore', 'Экспонаты и коллекции': 'Exhibits and Collections',
    'Уникальные предметы быта, национальная одежда, орудия труда и документы.': 'Discover unique household objects, traditional clothing, tools and documents.',
    'Перейти к коллекциям': 'Browse the Collections', 'Посетите музей, не выходя из дома. Прогуляйтесь по территории комплекса.': 'Visit the museum from home and take a virtual walk around the grounds.',
    'Начать тур': 'Start the Tour', 'Пандус при входе': 'Entrance ramp', 'Кнопка вызова персонала': 'Staff assistance call button',
    'Тактильная плитка на территории': 'Tactile paving on the grounds', 'Специализированный туалет (в планах)': 'Accessible restroom (planned)',
    'Подъемник (в планах)': 'Lift (planned)', 'Экскурсии с тифлокомментированием — по предварительной заявке': 'Guided tours with audio description by prior arrangement',
    'Сурдоперевод — по предварительной заявке': 'Sign language interpretation by prior arrangement',
    'Вход с собакой-проводником разрешён (при наличии документа)': 'Guide dogs are welcome with the required documentation.',
    'Вторник – Суббота: 10:00 – 18:00': 'Tuesday–Saturday: 10:00 am–6:00 pm',
    'Вторник – Воскресенье: 10:00 – 18:00': 'Tuesday–Sunday: 10:00 am–6:00 pm',
    'Воскресенье, Понедельник: выходной': 'Closed on Sundays and Mondays', 'Понедельник — выходной день': 'Closed on Mondays',
    'Последняя пятница месяца — санитарный день': 'Closed for maintenance on the last Friday of each month',
    'Санитарный день: последняя пятница месяца': 'Maintenance day: the last Friday of each month',
    'Касса закрывается за 30 минут до окончания работы музея.': 'The ticket office closes 30 minutes before the museum.',
    'Категория': 'Category', 'Цена': 'Price', 'Пенсионный билет': 'Senior ticket', 'Школьный билет': 'School student ticket',
    'Бесплатные категории (при предъявлении подтверждающего документа):': 'Free admission (valid proof required):',
    'Дети до 7 лет, ветераны ВОВ, многодетные семьи, инвалиды I и II групп, сотрудники музеев РФ.': 'Children under 7, Second World War veterans, large families, visitors with Group I or II disabilities, and museum staff from across Russia.',
    'Пушкинская карта:': 'Pushkin Card:', 'Стоимость экскурсионного обслуживания: 300 руб./группа.': 'Guided tour: RUB 300 per group.',
    'Быстрая связь': 'Quick Contact', 'Позвонить в кассу': 'Call the Ticket Office', 'Написать нам': 'Message Us',
    'Краткая информация': 'At a Glance', 'Вт–Вс 10:00–18:00': 'Tue–Sun, 10:00 am–6:00 pm', 'Выходной:': 'Closed:',
    'Подробные контакты и схема проезда': 'Contact Details and Directions', 'Проложить маршрут в 2ГИС': 'Get directions in 2GIS',
    'Передвиньте стрелки ← → для сравнения. Слева — 1939 г., справа — 2024 г.': 'Move the slider arrows ← → to compare. Left: 1939; right: 2024.',
    'Резной наличник, дверная ручка, угол сруба, текстура дерева': 'Carved window frame, door handle, log corner and wood grain',
    'Подробнее об основании церкви и комплекса читайте в разделе': 'Read more about the church and the museum complex in',
    'Рассказ о церкви': 'The Church’s Story', 'Рассказ об амбаре': 'The Barn’s Story', 'Рассказ о балагане': 'The Balagan’s Story',
    'Рассказ о башне-амбаре': 'The Tower Barn’s Story', '— из воспоминаний старожилов села': '— from the recollections of village elders',
    '— из рассказов потомков Скрябиных': '— from stories passed down by the Skryabin family', '— из легенд семьи Марковых': '— from Markov family legends',
    '— из архивных записей': '— from archival records', 'Резной декор, задвижка, угловое соединение, текстура': 'Carved decoration, latch, corner joint and wood texture',
    'Очаг, нары, утварь, фрагмент сруба': 'Hearth, sleeping platform, household items and log wall',
    'Бойницы, крепёж, лестница, фрагмент сруба': 'Defensive openings, fittings, ladder and log wall',
    'Республика Саха (Якутия), Хангаласский улус, с. Кердем, ул. Ленина': 'Lenina Street, Kerdem village, Khangalassky District, Republic of Sakha (Yakutia)',
    'Лекции, мастер-классы, праздники и другие события музейного комплекса': 'Talks, workshops, celebrations and other events at the museum complex',
    'Вся афиша': 'All Events', 'Все новости': 'All News', 'Все коллекции': 'All Collections',
    'Нужно ли записываться заранее?': 'Do I need to book in advance?',
    'Одиночные туристы могут посещать музей в часы работы без предварительной записи.': 'Individual visitors can visit during opening hours without booking.',
    'Для экскурсионных групп от 5 человек требуется предварительная бронь по телефону': 'Groups of five or more must book by phone in advance',
    '(за 2–3 дня до визита).': '(2–3 days before their visit).',
    'Как купить билет и действует ли Пушкинская карта?': 'How can I buy a ticket? Is the Pushkin Card accepted?',
    'На кассе принимаются наличные и банковские карты:': 'Cash and bank cards are accepted at the ticket office:',
    'Онлайн-оплата через боковую панель сайта': 'Online payment is available through the website sidebar',
    'Пушкинская карта принимается только при онлайн-покупке. Оплатить ею на кассе филиала нельзя.': 'The Pushkin Card is accepted for online purchases only. It cannot be used at the branch ticket office.',
    'Сколько времени заложить на осмотр и как одеться?': 'How much time should I allow, and what should I wear?',
    'Среднее время осмотра павильона и уличных памятников — от 1 до 1,5 часов.': 'Allow 1 to 1.5 hours to visit the exhibition hall and outdoor monuments.',
    'Разрешена ли фотосъемка и можно ли с детьми?': 'Is photography allowed? Can I bring children?',
    'Любительская фотосъемка на телефоны без вспышки и штативов разрешена и приветствуется.': 'Casual photography on phones is welcome. Please do not use flash or tripods.',
    'Скачать правила посещения (PDF)': 'Download the Visitor Rules (PDF)', 'Скачать договор оферты (PDF)': 'Download the Terms of Service (PDF)',
    'По Покровскому тракту до поворота на Кердем, далее 15 км по асфальтированной дороге. Координаты для навигатора: 61.429328, 129.201886.': 'Follow the Pokrovsky Highway to the Kerdem turn-off, then continue for 15 km on a paved road. Coordinates: 61.429328, 129.201886.',
    'Из Якутска автобусы № 102, 105 до остановки «Кердем». Время в пути около 2 часов.': 'From Yakutsk, take bus 102 or 105 to the Kerdem stop. The journey takes about two hours.',
    'Бесплатная парковка на обочине ул. Ленина, рядом с церковью.': 'Free roadside parking is available on Lenina Street near the church.',
    'Дети до 7 лет — бесплатно. Для детей старше 7 лет действуют льготные билеты (приобретаются в кассе).': 'Children under 7 enter free. Reduced-price tickets for older children are available at the ticket office.',
    'Адрес:': 'Address:', 'Телефон:': 'Phone:', 'Часы работы:': 'Opening hours:', 'Сейчас открыто': 'Open now', 'Сейчас закрыто': 'Closed now',
    'Пока нет мероприятий': 'No events at the moment', 'Мероприятий пока нет.': 'There are no events yet.', 'Новостей пока нет.': 'There is no news yet.',
    'Нет экспонатов': 'No exhibits found', 'Без даты': 'Date not specified', 'Все': 'All',
    'Материал:': 'Material:', 'Год постройки:': 'Year built:', 'Происхождение:': 'Origin:', 'Площадь:': 'Area:',
    'кон. XIX в.': 'Late 19th century', 'середина XIX века': 'Mid-19th century', 'конец XIX века': 'Late 19th century',
    'с. Тит‑Эбэ': 'Tit-Ebe village', 'с. Качикат, Хангаласский улус': 'Kachikat village, Khangalassky District',
    '≈ 45 кв. м': 'Approx. 45 m²', '≈ 38 кв. м': 'Approx. 38 m²', '≈ 32 кв. м': 'Approx. 32 m²', '≈ 52 кв. м': 'Approx. 52 m²',
    'Лиственница (рубка «в обло»)': 'Larch (notched corner joints)', 'лиственница (рубка «в обло»)': 'Larch (notched corner joints)',
    'Лиственница (рубка «в лапу»)': 'Larch (interlocking corner joints)', 'лиственница (рубка «в лапу»)': 'Larch (interlocking corner joints)',
    'Кердемский музей-комплекс «Самыртай» основан в 1991 году по инициативе краеведа Роберта Константиновича Захарова. Музей расположен в селе Кердем Хангаласского улуса Республики Саха (Якутия) и представляет собой этнографический комплекс под открытым небом. Подробная история создания музея, включая хронологию строительства церкви и переноса архитектурных памятников, представлена на отдельной странице.': 'The Samyrtai Museum Complex was founded in 1991 on the initiative of local historian Robert Konstantinovich Zakharov. Located in Kerdem village, Khangalassky District, Republic of Sakha (Yakutia), it is an open-air ethnographic museum. A detailed history, including the church construction and relocation of historic buildings, is available on a separate page.',
    'Кердемский музей-комплекс «Самыртай» имени Р.К. Захарова — филиал Муниципального бюджетного учреждения культуры «Хангаласский улусный краеведческий музей имени Г.В. Ксенофонтова»': 'The Samyrtai Museum Complex named after R. K. Zakharov is a branch of the G. V. Ksenofontov Khangalassky District Museum of Local History, a municipal cultural institution.',
    'Филиал МБУК «Хангаласский улусный краеведческий музей им. Г.В. Ксенофонтова» — Кердемский музей-комплекс «Самыртай»': 'Kerdem Museum Complex “Samyrtai”, a branch of the G. V. Ksenofontov Khangalassky District Museum of Local History',
    'В состав музея входят: экспозиционный отдел, отдел учета и хранения фондов, административно-хозяйственная часть. Филиалов не имеет.': 'The museum includes an exhibition department, a collections registration and storage department, and an administrative and facilities unit. It has no sub-branches.',
    'Дежурный администратор: +7 (41144) 24-3-17 (в часы работы музея). Администратор встретит посетителя с инвалидностью у входа.': 'Duty administrator: +7 (41144) 24-3-17 (during museum opening hours). The administrator can meet visitors with disabilities at the entrance.',
    'Расположение музея: село Кердем, улица Ленина. Ориентир — рядом с церковью. Координаты: 61.429328, 129.201886.': 'The museum is at  Lenina Street, Kerdem village, near the church. Coordinates: 61.429328, 129.201886.',
    'На территории музея находятся архитектурные памятники XIX века. Эти постройки — живые свидетели быта и культуры якутов, сохранившиеся до наших дней.': 'The museum grounds are home to 19th-century architectural monuments. These buildings have survived as witnesses to Sakha life and culture.',
    'Деревянная Николаевская церковь, построенная в 1896 году в селе Качикат, является одной из старейших сохранившихся церквей Хангаласского улуса. Её архитектура сочетает традиции русского деревянного зодчества с местными приёмами строительства.': 'Built in Kachikat village in 1896, the wooden St. Nicholas Church is one of the oldest surviving churches in Khangalassky District. Its architecture combines Russian wooden building traditions with local techniques.',
    'Церковь была перевезена на территорию музейного комплекса для сохранения и реставрации. Сегодня она открыта для посетителей и продолжает оставаться духовным центром.': 'The church was moved to the museum grounds for preservation and restoration. It is now open to visitors and remains an important spiritual landmark.',
    'Двухэтажный амбар из села Тит‑Эбэ принадлежал зажиточному якуту Кириллу Скрябину. Нижний ярус использовался для хранения припасов, верхний — как летнее жильё. Постройка отличается сложной конструкцией и богатой резьбой по дереву.': 'The two-storey barn from Tit-Ebe village belonged to the prosperous Sakha farmer Kirill Skryabin. The lower level was used to store supplies and the upper floor as summer accommodation. The building is notable for its complex construction and richly carved woodwork.',
    'Амбар был перевезён в музейный комплекс «Самыртай» и полностью отреставрирован. Сегодня он является ценным экспонатом, демонстрирующим социальное расслоение якутского общества XIX века.': 'The barn was moved to the Samyrtai Museum Complex and fully restored. Today, it illustrates social differences in 19th-century Sakha society.',
    '«Говорят, Кирилл Скрябин был настолько богат, что зерно из этого амбара кормило половину наслега...»': '“They say Kirill Skryabin was so wealthy that the grain from this barn fed half the nasleg…”',
    'Редкий тип якутской постройки — шестигранный балаган, перевезённый с летника Даркылах, принадлежавшего семье Марковых. В отличие от прямоугольных жилищ, такая форма обеспечивала лучшую устойчивость к сильным ветрам и морозам.': 'This rare hexagonal Sakha balagan was moved from the Markov family’s summer camp at Darkylakh. Its shape offered better protection from strong winds and severe cold than rectangular dwellings.',
    'Балаган использовался как зимнее жильё. На сегодняшний день это единственный сохранившийся образец подобной архитектуры в Хангаласском улусе.': 'The balagan served as a winter home. It is now the only surviving example of this type of architecture in Khangalassky District.',
    'Деревянная башня-двухэтажный амбар с бойницами, построенная в середине XIX века, является объектом культурного наследия регионального значения. Массивные стены и проёмы для обороны говорят о её двойном назначении — хозяйственном и оборонительном.': 'Built in the mid-19th century, this wooden tower barn with defensive openings is a regional cultural heritage site. Its massive walls and narrow openings reflect its dual role as a storehouse and a defensive structure.',
    'Башня перевезена в комплекс «Самыртай» и отреставрирована. Это уникальный образец фортификационной архитектуры якутов, не имеющий аналогов в республике.': 'The tower was moved to the Samyrtai complex and restored. It is a unique example of Sakha defensive architecture with no known equivalent in the republic.',
    'Деревянная башня-двухэтажный амбар с бойницами, построенная в середине XIX века, является объектом культурного наследия регионального значения. Массивные стены и проёмы для обороны говорят о двойном назначении — хозяйственном и оборонительном.': 'Built in the mid-19th century, this wooden two-storey tower barn with defensive openings is a regional cultural heritage site. Its massive walls and narrow openings reflect its dual role as a storehouse and defensive structure.',
    'Редкий тип якутской постройки — шестигранный балаган, перевезённый с летника Даркылах, принадлежавшего семье Марковых. Форма обеспечивала устойчивость к сильным ветрам и морозам, использовался как зимнее жильё.': 'This rare hexagonal Sakha balagan was moved from the Markov family’s summer camp at Darkylakh. Its shape helped it withstand strong winds and cold, and it was used as a winter home.',
    '«Эту башню строили не для зерна, а для защиты от набегов — из неё просматривается вся долина...»': '“They built this tower not for grain, but to defend against raids — from here you can see across the whole valley…”',
    'В 1892 году началось строительство Качикатской Николаевской церкви в с. Кердем. Благочинный Якутских церквей священник Василий Бережнее дал рапорт Его Первосвященству Мелентию — епископу Якутскому и Вилюйскому: «Честь имею благопокорнейше донести, что по благословению Вашего первосвященства, закладка фундамента Качикатского Николаевского храма на речке Лютенгэ свершена мною 24 апреля 1892 года». (Рукопись Н.Д. Тордеева.)': 'Construction of the Kachikatskaya St. Nicholas Church in Kerdem began in 1892. Priest Vasily Berezhnee, dean of the Yakut churches, reported to Melenty, Bishop of Yakutsk and Vilyuysk, that he had laid the church foundation by the Lyutenge River on 24 April 1892, with the bishop’s blessing. (Manuscript by N. D. Tordeev.)',
    'По сооружению Качикатской церкви, согласно контракту, подрядчиком был некий Чагин, вероятно, из якутских купцов или предпринимателей. Из местных жителей мастерами работали Петр Тихонов по прозвищу Чемчок из Качикатского наслега и Николай Алексеевич Борисов по прозвищу Бэриэскин из 2-го Жемконского наслега — знатоки строительства русских домов.': 'According to the construction contract, the builder was a man named Chagin, probably a Yakutsk merchant or contractor. Local craftsmen included Pyotr Tikhonov, known as Chemchok, from Kachikatsky nasleg, and Nikolai Alekseevich Borisov, known as Berieskin, from the Second Zhemkonsky nasleg. Both were skilled builders of Russian-style houses.',
    'В 1906–1909 гг. старостой церкви был избран Гавриил Константинович Павлов — богач 2-го Жемконского наслега, а с 1910 г. — Семен Петрович Барашков, известный богач Качикатского наслега. Оба внесли огромный вклад в обустройство храма и поддержку духовной жизни наслега. Их имена до сих пор с уважением упоминаются в документах прихода.': 'From 1906 to 1909, the churchwarden was Gavriil Konstantinovich Pavlov, a wealthy resident of the Second Zhemkonsky nasleg. From 1910, the role was held by Semyon Petrovich Barashkov, a prominent landowner from Kachikatsky nasleg. Both supported the church and local spiritual life; parish records still mention them with respect.',
    'Из архивных материалов известно, что Г.К. Павлов пожертвовал в пользу церкви 500 рублей от себя и 2500 рублей, собранных с населения. А С.П. Барашков от себя — 700 рублей и от населения своего наслега — 300 рублей. За эту меценатскую деятельность в 1912 году оба были награждены серебряными медалями на Станиславской ленте для ношения на груди. В представлении к награде С.П. Барашкова стоит подпись старшины Качикатского наслега Афанасия Елисеевича Кулаковского.': 'Archival records show that G. K. Pavlov donated 500 rubles of his own money and raised another 2,500 rubles from local residents. S. P. Barashkov gave 700 rubles himself and collected 300 rubles from his nasleg. In 1912, both men received silver medals on the Order of St. Stanislaus ribbon for their charitable work. The nomination for Barashkov was signed by Kachikatsky nasleg elder Afanasiy Eliseevich Kulakovsky.',
    'При церкви с 1 сентября 1898 года существовала церковно-приходская школа. Приход составляли якуты Качикатского и двух Жемконских наслегов. Численность прихожан в 1914 году составляла 4175 человек. Все церковники владели якутским языком и передавали слово Божье местному населению на их родном языке. Храм стал настоящим культурным и духовным центром, вокруг которого кипела жизнь села, проходили ярмарки, собирались сходы.': 'A parish school opened at the church on 1 September 1898. The parish served Sakha communities in Kachikatsky and two Zhemkonsky naslegs; by 1914 it had 4,175 parishioners. Church staff spoke Sakha and preached in the local language. The church became a cultural and spiritual centre, around which village life, fairs and community meetings gathered.',
    '12–13 февраля 1922 года около церкви разыгралось трагическое событие, когда небольшой отряд во главе с пьяным командиром зарубил и расстрелял последнего попа и 16 мирных жителей. «Вина» последних состояла в том, что у кого-то из них повстанцы реквизировали сено, кого-то под страхом расстрела заставили собрать свечи у населения. Красные же усмотрели в поступках этих несчастных пособничество бандитам.': 'On 12–13 February 1922, a tragic event took place near the church. A small detachment led by a drunken commander killed the last priest and 16 civilians. Their alleged “crime” was that rebels had requisitioned hay from some of them and forced others, under threat of execution, to collect candles from residents. The Red forces accused these people of aiding bandits.',
    'В 1929 году, в «год великого перелома», активистами Советской власти были собраны кресты и колокола. Во времена советской власти здание церкви долгое время служило клубом, складом, затем и вовсе простаивало. Осенью здесь размещали студентов, прибывших на уборочную работу. О былой красоте напоминал лишь чудом уцелевший иконостас.': 'In 1929, during the “Great Break” campaign, Soviet activists removed the crosses and bells. Under Soviet rule, the church building was used as a club and a warehouse, then left empty. Students who came for the autumn harvest were sometimes housed there. Only the iconostasis, which survived by chance, recalled the church’s former beauty.',
    'Несмотря на все тяготы, жители села хранили память о святыне. Старожилы втайне поддерживали порядок вокруг церкви, надеясь, что когда-нибудь в ней снова зазвучат молитвы. Эти надежды сбылись лишь спустя десятилетия.': 'Despite these hardships, villagers kept the memory of the church alive. Elders quietly maintained the grounds, hoping that prayers would one day be heard there again. Their hopes were realised only decades later.',
    'В феврале 1989 года писатель Суорун Омоллоон, в то время работавший над организацией Соттинского музея, прибыл с указом Министерства культуры о передаче здания церкви в Соттинский музей. В тот же вечер был созван срочный сельский сход. Местные жители, многие из которых помнили храм с детства, категорически отказались отдавать святыню. Единогласно решили: церковь останется в Кердеме.': 'In February 1989, writer Suorun Omolloon arrived with a Ministry of Culture order to transfer the church to the Sottinsky Museum, which he was helping to establish. That evening, villagers held an urgent meeting. Many remembered the church from childhood and firmly opposed its removal. They unanimously decided that it would remain in Kerdem.',
    'Постановлением схода было решено реставрировать здание и создать на его базе историко-этнографический музей. Ответственным был назначен Захаров Роберт Константинович. Начался долгий путь восстановления: собирали средства, искали мастеров, расчищали прилегающую территорию.': 'The village meeting resolved to restore the building and establish a historical and ethnographic museum there, appointing Robert Konstantinovich Zakharov to lead the work. The long restoration process began: funds were raised, craftspeople were sought, and the surrounding grounds were cleared.',
    'С того момента произведено огромное количество работ по улучшению и расширению музейного комплекса. Церковь стала не просто архитектурным памятником, но и центром культурного возрождения всего наслега.': 'Since then, extensive work has improved and expanded the museum complex. The church has become more than an architectural monument: it is also a centre of cultural renewal for the nasleg.',
    'В 1990 году директор совхоза «50 лет Октября» Н.Ф. Трофимов предоставил 4-квартирный дом для музея. В 1991 году все экспонаты, собранные жителями наслега, были перевезены в новый дом. Территория музейного комплекса занимает 1 га самого высокого холма села.': 'In 1990, N. F. Trofimov, director of the “50 Years of October” state farm, provided a four-apartment building for the museum. In 1991, residents moved the collected objects into the new premises. The museum complex now occupies one hectare on the village’s highest hill.',
    'С 1991 года по инициативе энтузиаста-краеведа Захарова Р.К. в с. Кердем создан этнографический музейный комплекс «Самыртай». На территории музея расположены памятники истории и архитектуры: уникальная, единственная в улусе дошедшая до наших дней Качикатская Николаевская церковь (1892 г.); зерносушилка богача-мецената С.П. Барашкова; шестигранный дом-бабарына (XVIII в.); двухуровневый амбар богача Кирилла Скрябина (XIX в.); летний балаган (XVIII в.). Каждый из этих объектов — живая страница истории якутского народа.': 'The Samyrtai ethnographic museum complex was established in Kerdem in 1991 at the initiative of local historian R. K. Zakharov. Its historic buildings include the unique Kachikatskaya St. Nicholas Church (1892), the only one of its kind to survive in the district; S. P. Barashkov’s grain dryer; an 18th-century hexagonal dwelling known as a babaryna; Kirill Skryabin’s 19th-century two-storey barn; and an 18th-century summer balagan. Each is a living page in Sakha history.',
    'Комплекс быстро стал известен за пределами улуса: сюда приезжали этнографы, школьные делегации и просто неравнодушные люди, чтобы прикоснуться к подлинной старине. Экскурсии проводили сами сотрудники музея, часто — сам Роберт Константинович.': 'The complex soon became known beyond the district. Ethnographers, school groups and other visitors came to experience its historic buildings. Museum staff led the tours, often with Robert Konstantinovich himself as their guide.',
    'В музее собраны уникальные экспонаты, рассказывающие о быте и культуре якутов, о флоре и фауне края, документы и фотографии по истории края и села. Здесь можно увидеть эвенские и якутские сёдла с древней чеканкой из серебра. Проводятся самобытные праздники (ысыах, куйур), спортивные соревнования по национальным видам спорта, конкурсы ледовых скульптур. Туристы могут получить представление о древней культуре народа саха: услышать звон хомуса и тойук, увидеть национальные обряды — очищения, встречи солнца.': 'The collections tell of Sakha life and culture, local wildlife, and the history of the region and village through objects, documents and photographs. Visitors can see Even and Sakha saddles decorated with ancient silverwork. The museum hosts traditional celebrations such as Ysyakh and Kuyur, national sports competitions and ice-sculpture contests. Visitors can also encounter Sakha traditions through the sounds of the khomus and toyuk and ceremonies of purification and greeting the sun.',
    'Сегодня музей продолжает активно развиваться: открываются новые залы, пополняются фонды, осваиваются грантовые программы. Сотрудники комплекса бережно сохраняют наследие предков и делятся им с новыми поколениями, воспитывая уважение к истории и любовь к родному краю.': 'The museum continues to grow: new exhibition rooms open, the collections expand, and grant-funded projects are underway. Staff preserve the heritage of earlier generations and share it with younger visitors, encouraging respect for history and care for their homeland.',
    'Онлайн-покупка билетов, в том числе по Пушкинской карте, временно находится в разработке. Продажа билетов осуществляется в кассе музея.': 'Online ticket sales, including payment with the Pushkin Card, are currently in development. Tickets are available at the museum ticket office.',
    'Для организованных групп (школьные классы, туристические автобусы) проводится экскурсионное обслуживание по предварительной записи за 3 дня до визита.': 'Guided tours for organised groups, including school classes and coach tours, must be booked at least three days in advance.',
    'Сохраняем историю и культуру якутского народа.': 'Preserving the history and culture of the Sakha people.',
    '© 2026 Кердемский музей-комплекс «Самыртай» им. Р.К. Захарова.': '© 2026 Samyrtai Museum Complex named after R. K. Zakharov.',
    '© 2026 Кердемский музей-комплекс «Самыртай» им. Р.К. Захарова. Филиал МБУК «Хангаласский улусный краеведческий музей им. Г.В. Ксенофонтова».': '© 2026 Samyrtai Museum Complex named after R. K. Zakharov. A branch of the G. V. Ksenofontov Khangalassky District Museum of Local History.',
    'ИНН 1234567890 / ОГРН 1234567890123': 'Tax ID 1234567890 / State Registration No. 1234567890123',
    '👁️ Слабовидящим': '👁️ Accessible version',
    'филиал комплекс «Самыртай» им. Р.К. Захарова': 'Samyrtai Museum Complex branch named after R. K. Zakharov',
    'Вт–Сб 10:00–18:00': 'Tue–Sat, 10:00 am–6:00 pm',
    '© 2026 Кердемский музей-комплекс «Самыртай» им. Р.К. Захарова. Филиал МБУК «Хангаласский улусный краеведческий музей им. Г.В. Ксенофонтова». ИНН 1234567890 / ОГРН 1234567890123': '© 2026 Samyrtai Museum Complex named after R. K. Zakharov. A branch of the G. V. Ksenofontov Khangalassky District Museum of Local History. Tax ID 1234567890 / State Registration No. 1234567890123',
    '678014, Республика Саха (Якутия), Хангаласский улус, с. Кердем, ул. Ленина': 'Lenina Street, Kerdem village, Khangalassky District, Republic of Sakha (Yakutia), 678014',
    'с. Кердем, ул. Ленина': 'Lenina Street, Kerdem village', 'Вт–Сб: 10:00–18:00': 'Tue–Sat: 10:00 am–6:00 pm',
    'Оплата доступна': 'Payment available', 'Два ракурса одного объекта': 'Two views of the same object',
    'В музее собрано более 900 экспонатов, рассказывающих о быте и культуре якутов.': 'The museum holds more than 900 objects documenting Sakha life and culture.',
    'При включении режима для слабовидящих карта заменяется текстовым описанием маршрута.': 'When the accessible mode is enabled, the map is replaced with written directions.',
    'Наследие': 'Heritage', 'летник Даркылах': 'Darkylakh summer camp', 'с. Кердем (окрестности)': 'Near Kerdem village',
    '50 руб.': 'RUB 50', '100 руб.': 'RUB 100', '30 руб.': 'RUB 30',
    'Министерство культуры и духовного развития Республики Саха (Якутия)': 'Ministry of Culture and Spiritual Development of the Republic of Sakha (Yakutia)',
    'Устав (PDF)': 'Charter (PDF)', 'Свидетельство о регистрации (PDF)': 'Registration Certificate (PDF)',
    'План ФХД (PDF)': 'Financial and Business Plan (PDF)', 'Отчет об услугах (PDF)': 'Service Report (PDF)',
    'Ф.И.О.': 'Full Name', 'Должность': 'Position', 'Приём': 'Reception Hours',
    'Директор филиала': 'Branch Director', 'Заведующий фондами': 'Collections Manager', 'Научный сотрудник': 'Researcher',
    'Телефон: +7 (41144) 24-3-17': 'Phone: +7 (41144) 24-3-17',
    '1896 г.': '1896', 'с. Качикат, Хангаласский улус': 'Kachikat village, Khangalassky District', '≈ 52 кв. м': 'Approx. 52 m²',
    '«Старики говорили, что эта церковь была самым крепким строением во всей округе...»': '“The elders said this church was the strongest building in the whole area…”',
    '«Даркылахский балаган пережил столько бурь, что старожилы считали его заколдованным...»': '“The Darkylakh balagan survived so many storms that the elders thought it was enchanted…”',
    'сер. XIX в.': 'Mid-19th century', 'Экспонат — Кердемский музей-комплекс «Самыртай»': 'Exhibit — Samyrtai Museum Complex',
    'С 2020 года носит имя основателя —': 'Since 2020, it has borne the name of its founder,',
    'Роберта Константиновича Захарова': 'Robert Konstantinovich Zakharov',
    'Все коллекции': 'All Collections', 'Исследовать территорию': 'Explore the Grounds',
    'В витринах и запасниках музейного комплекса «Самыртай» собрано более 800 предметов, каждый из которых является частью живой истории якутского народа. От старинных орудий труда до национальных украшений — наша коллекция раскрывает богатство и разнообразие культурного наследия Хангаласского улуса.': 'The Samyrtai Museum Complex preserves more than 800 objects, each part of the living history of the Sakha people. From historic tools to traditional jewellery, the collection reflects the rich cultural heritage of Khangalassky District.',
    'Анонсы ближайших событий, лекций, мастер-классов и праздников, которые проводит музей. Выберите интересное вам мероприятие и запланируйте визит.': 'Discover upcoming events, talks, workshops and celebrations at the museum. Choose an event and plan your visit.',
    'Территория музея имеет грунтовые дорожки, поэтому рекомендуем удобную обувь и одежду по погоде. На территории есть лавочки и зоны отдыха.': 'The museum grounds have unpaved paths, so comfortable shoes and weather-appropriate clothing are recommended. Benches and rest areas are available.',
    'Мир': 'MIR', 'Скачать договор оферты (PDF)': 'Download the Public Offer (PDF)', 'Связь': 'Contact',
    'Новость — Кердемский музей-комплекс «Самыртай»': 'News — Samyrtai Museum Complex',
    'Вся необходимая информация для вашего визита в музей': 'Everything you need to plan your visit to the museum',
    'Информация': 'Information', 'Режим работы:': 'Opening hours:', 'Стоимость билетов и льготы': 'Ticket Prices and Concessions',
    'Цена': 'Price', 'Взрослый билет': 'Adult ticket', 'Пенсионный билет': 'Senior ticket', 'Школьный билет': 'School student ticket',
    'Стоимость экскурсионного обслуживания: 300 руб./группа.': 'Guided tour: RUB 300 per group.',
    'Контакты и карта': 'Contacts and Map', 'Позвонить в кассу': 'Call the Ticket Office', 'Написать нам': 'Message Us',
    'Вся необходимая информация для вашего визита в музей': 'Everything you need to plan your visit to the museum',
    'На автобусе:': 'By bus:', 'Парковка:': 'Parking:', 'Как проехать': 'Getting Here',
  };
  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  let currentLanguage = 'ru';
  try {
    currentLanguage = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ru';
  } catch (_) { /* Use Russian when storage is unavailable. */ }
  document.documentElement.lang = currentLanguage;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const source = input instanceof Request ? input.url : String(input);
      const url = new URL(source, window.location.href);
      if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
        if (currentLanguage === 'en') url.searchParams.set('lang', 'en');
        else url.searchParams.delete('lang');
        input = input instanceof Request ? new Request(url.toString(), input) : url.toString();
      }
    } catch (_) { /* Pass through non-URL fetch inputs. */ }
    return nativeFetch(input, init);
  };

  function translateNode(node, isObservedUpdate = false) {
    if (node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    if (node.parentElement.closest('script, style, noscript, textarea, [data-no-translate]')) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    let original = originals.get(node);
    if (isObservedUpdate) {
      const priorText = original.trim();
      const priorTranslation = translations[priorText];
      const expectedText = currentLanguage === 'en' && priorTranslation
        ? original.replace(priorText, priorTranslation)
        : original;
      if (node.nodeValue !== expectedText) {
        original = node.nodeValue;
        originals.set(node, original);
      }
    }
    const trimmed = original.trim();
    if (!trimmed) return;
    const translated = translations[trimmed];
    if (currentLanguage === 'en' && translated) {
      const english = original.replace(trimmed, translated);
      if (node.nodeValue !== english) node.nodeValue = english;
    } else if (currentLanguage === 'ru' && node.nodeValue !== original) {
      node.nodeValue = original;
    }
  }

  function translateAttributes() {
    document.querySelectorAll('[placeholder], [aria-label], [title], meta[name="description"]').forEach((element) => {
      ['placeholder', 'aria-label', 'title', 'content'].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        let savedAttributes = originalAttributes.get(element);
        if (!savedAttributes) {
          savedAttributes = new Map();
          originalAttributes.set(element, savedAttributes);
        }
        if (!savedAttributes.has(attribute)) savedAttributes.set(attribute, element.getAttribute(attribute));
        const saved = savedAttributes.get(attribute);
        element.setAttribute(attribute, currentLanguage === 'en' ? (translations[saved] || saved) : saved);
      });
    });
  }

  function applyLanguage(language) {
    currentLanguage = language === 'en' ? 'en' : 'ru';
    document.documentElement.lang = currentLanguage;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateNode(walker.currentNode);
    if (document.querySelector('title')) translateNode(document.querySelector('title').firstChild);
    translateAttributes();
    document.querySelectorAll('.lang-btn[data-lang="ru"], .lang-btn[data-lang="en"]').forEach((button) => {
      const active = button.dataset.lang === currentLanguage;
      button.classList.toggle('bg-[#5D4037]', active);
      button.classList.toggle('text-white', active);
      button.classList.toggle('text-[#5D4037]', !active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem(STORAGE_KEY, currentLanguage); } catch (_) { /* Storage may be disabled. */ }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.lang-btn[data-lang]');
    if (!button || (button.dataset.lang !== 'ru' && button.dataset.lang !== 'en')) return;
    const nextLanguage = button.dataset.lang;
    if (nextLanguage === currentLanguage) return;
    try { localStorage.setItem(STORAGE_KEY, nextLanguage); } catch (_) { /* Continue for this page view. */ }
    window.location.reload();
  });
  document.addEventListener('DOMContentLoaded', () => {
    let saved = 'ru';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'ru'; } catch (_) { /* Use Russian by default. */ }
    applyLanguage(saved);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'characterData') translateNode(record.target, true);
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) translateNode(walker.currentNode);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  });
})();
