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

INSERT INTO news (id, title, short_text, content, image_url, published_at, is_deleted, title_en, short_text_en, content_en)
VALUES
(
    '10000000-0000-4000-8000-000000000001',
    'Знакомство с музейным комплексом «Самыртай»',
    'Демонстрационная новость: территория комплекса объединяет памятники традиционной культуры и истории края.',
    'Это демонстрационная публикация для знакомства с сайтом. На территории музейного комплекса «Самыртай» посетители могут увидеть исторические постройки и узнать о культуре Якутии. Перед публикацией реальной новости замените этот текст в админке.',
    '/img/muzej-kompleks-samyrtaj.jpg',
    NOW() - INTERVAL '1 day',
    false,
    'Discover the Samyrtai Museum Complex',
    'Demo story: the complex brings together monuments of traditional culture and local history.',
    'This is a sample story prepared to introduce the website. Visitors to the Samyrtai Museum Complex can see historic buildings and learn about the culture of Yakutia. Replace this sample with a verified museum story before publishing.'
),
(
    '10000000-0000-4000-8000-000000000002',
    'Качикатская Николаевская церковь: история в фотографиях',
    'Демонстрационная новость о деревянном храме на территории музейного комплекса.',
    'Это демонстрационная публикация. Фотографии показывают Качикатскую Николаевскую церковь в разные годы. Материал подготовлен как пример оформления новости; даты и дополнительные сведения необходимо уточнить перед публичным использованием.',
    '/img/tserkov.jpg',
    NOW() - INTERVAL '2 days',
    false,
    'The Kachikatskaya St. Nicholas Church: A Photographic History',
    'A demo story about the wooden church on the museum grounds.',
    'This is a sample story. The photographs show the Kachikatskaya St. Nicholas Church at different times. This sample demonstrates the news layout; dates and further details must be verified before publication.'
),
(
    '10000000-0000-4000-8000-000000000003',
    'Постройки и быт: что можно увидеть в «Самыртае»',
    'Демонстрационная новость о постройках, рассказывающих о жизни и хозяйстве прошлого.',
    'Это демонстрационная публикация для проверки раздела новостей. Исторические хозяйственные постройки помогают представить повседневную жизнь жителей края. Для настоящей публикации замените пример достоверным материалом музея.',
    '/img/ambar.jpg',
    NOW() - INTERVAL '3 days',
    false,
    'Historic Buildings and Daily Life at Samyrtai',
    'A demo story about historic buildings that tell us about life and work in the past.',
    'This sample story is included to demonstrate the news section. Historic farm buildings help visitors picture everyday life in the region. Replace it with verified museum content before publication.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_text = EXCLUDED.short_text,
    content = EXCLUDED.content,
    title_en = EXCLUDED.title_en,
    short_text_en = EXCLUDED.short_text_en,
    content_en = EXCLUDED.content_en,
    image_url = EXCLUDED.image_url,
    published_at = EXCLUDED.published_at,
    is_deleted = false;

INSERT INTO events (id, title, short_text, description, start_date, end_date, image_url, location, is_featured, is_deleted, title_en, short_text_en, description_en, location_en)
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
    false,
    'Guided Tour of the Museum Complex (Demo)',
    'Sample event: discover the grounds and historic buildings.',
    'This sample event demonstrates the events calendar. The date and time are examples and do not represent the museum schedule.',
    'Samyrtai Museum Complex'
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
    false,
    'The History of Wooden Architecture (Demo)',
    'Sample event: a talk about the complex’s wooden monuments.',
    'This sample event is for testing the calendar. It is not an announcement of a real event; replace it with a confirmed programme before publication.',
    'Samyrtai Museum Complex'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_text = EXCLUDED.short_text,
    description = EXCLUDED.description,
    title_en = EXCLUDED.title_en,
    short_text_en = EXCLUDED.short_text_en,
    description_en = EXCLUDED.description_en,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    image_url = EXCLUDED.image_url,
    location = EXCLUDED.location,
    location_en = EXCLUDED.location_en,
    is_featured = EXCLUDED.is_featured,
    is_deleted = false;

COMMIT;
