-- Demo content for a fresh clone. Run this file manually on an existing database
-- only when you intentionally want to archive its current news and events.
BEGIN;

UPDATE news SET is_deleted = true
WHERE id NOT IN (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
);

UPDATE events SET is_deleted = true
WHERE id NOT IN (
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
);

INSERT INTO news (id, title, short_text, content, image_url, published_at, is_deleted)
VALUES
(
    '10000000-0000-4000-8000-000000000001',
    'Знакомство с музейным комплексом «Самыртай»',
    'Демонстрационная новость: территория комплекса объединяет памятники традиционной культуры и истории края.',
    'Это демонстрационная публикация для знакомства с сайтом. На территории музейного комплекса «Самыртай» посетители могут увидеть исторические постройки и узнать о культуре Якутии. Перед публикацией реальной новости замените этот текст в админке.',
    '/img/muzej-kompleks-samyrtaj.jpg',
    NOW() - INTERVAL '1 day',
    false
),
(
    '10000000-0000-4000-8000-000000000002',
    'Качикатская Николаевская церковь: история в фотографиях',
    'Демонстрационная новость о деревянном храме на территории музейного комплекса.',
    'Это демонстрационная публикация. Фотографии показывают Качикатскую Николаевскую церковь в разные годы. Материал подготовлен как пример оформления новости; даты и дополнительные сведения необходимо уточнить перед публичным использованием.',
    '/img/tserkov.jpg',
    NOW() - INTERVAL '2 days',
    false
),
(
    '10000000-0000-4000-8000-000000000003',
    'Постройки и быт: что можно увидеть в «Самыртае»',
    'Демонстрационная новость о постройках, рассказывающих о жизни и хозяйстве прошлого.',
    'Это демонстрационная публикация для проверки раздела новостей. Исторические хозяйственные постройки помогают представить повседневную жизнь жителей края. Для настоящей публикации замените пример достоверным материалом музея.',
    '/img/ambar.jpg',
    NOW() - INTERVAL '3 days',
    false
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_text = EXCLUDED.short_text,
    content = EXCLUDED.content,
    image_url = EXCLUDED.image_url,
    published_at = EXCLUDED.published_at,
    is_deleted = false;

INSERT INTO events (id, title, short_text, description, start_date, end_date, image_url, location, is_featured, is_deleted)
VALUES
(
    '20000000-0000-4000-8000-000000000001',
    'Обзорная экскурсия по комплексу (демо)',
    'Пример афиши: знакомство с территорией и историческими постройками.',
    'Демонстрационное мероприятие для показа сайта. Дата и время приведены как пример и не являются расписанием музея.',
    CURRENT_DATE + INTERVAL '14 days 11 hours',
    CURRENT_DATE + INTERVAL '14 days 13 hours',
    '/img/muzej-kompleks-samyrtaj.jpg',
    'Музейный комплекс «Самыртай»',
    true,
    false
),
(
    '20000000-0000-4000-8000-000000000002',
    'История деревянного зодчества (демо)',
    'Пример афиши: рассказ о деревянных памятниках комплекса.',
    'Демонстрационное мероприятие для проверки афиши. Это не объявление о реальной встрече; перед публикацией замените пример подтверждённой программой.',
    CURRENT_DATE + INTERVAL '28 days 12 hours',
    CURRENT_DATE + INTERVAL '28 days 14 hours',
    '/img/tserkov2.jpg',
    'Музейный комплекс «Самыртай»',
    false,
    false
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_text = EXCLUDED.short_text,
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    image_url = EXCLUDED.image_url,
    location = EXCLUDED.location,
    is_featured = EXCLUDED.is_featured,
    is_deleted = false;

COMMIT;
