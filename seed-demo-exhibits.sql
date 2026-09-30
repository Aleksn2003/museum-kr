-- Demonstration exhibit records for a fresh clone.
-- The content and photographs match the museum's Architecture and Heritage page.
-- Safe to run more than once: existing records with these IDs are left unchanged.

INSERT INTO exhibits (
    id,
    title,
    short_description,
    description,
    creation_date,
    image_url,
    images,
    is_featured,
    material,
    dimensions,
    origin,
    title_en,
    short_description_en,
    description_en,
    material_en,
    dimensions_en,
    origin_en
)
VALUES
(
    '30000000-0000-4000-8000-000000000001',
    'Двухуровневый амбар Кирилла Скрябина',
    'Амбар из села Тит‑Эбэ, перевезённый и отреставрированный в музейном комплексе «Самыртай».',
    'Нижний ярус амбара использовался для хранения припасов, верхний — как летнее жильё. Постройка демонстрирует социальное расслоение якутского общества XIX века.',
    'конец XIX века',
    '/img/ambar2_bogacha_kirilla2.jpg',
    '["/img/ambar2_bogacha_kirilla2.jpg", "/img/ambar2_bogacha_kirilla.jpg"]'::jsonb,
    true,
    'Лиственница, рубка «в обло»',
    'Около 45 м²',
    'село Тит‑Эбэ',
    'Two-Level Granary of Kirill Skryabin',
    'A granary from the village of Tit-Ebe, relocated and restored at the Samyrtai Museum Complex.',
    'The lower level was used to store provisions, while the upper level served as summer living space. The building illustrates social differences in 19th-century Sakha society.',
    'Larch; traditional log construction',
    'Approximately 45 m²',
    'Tit-Ebe village'
),
(
    '30000000-0000-4000-8000-000000000002',
    'Шестигранный балаган с летника Даркылах',
    'Редкий тип якутской постройки, перевезённый с летника, принадлежавшего семье Марковых.',
    'Шестигранная форма помогала постройке противостоять сильным ветрам и морозам. Балаган использовался как зимнее жильё.',
    'конец XIX века',
    '/img/chestigrannyi_balbalagan.jpg',
    '["/img/chestigrannyi_balbalagan.jpg", "/img/chestigrannyi_balbalagan2.jpg"]'::jsonb,
    true,
    'Лиственница, рубка «в лапу»',
    'Около 38 м²',
    'летник Даркылах, семья Марковых',
    'Hexagonal Balagan from Darkylakh',
    'A rare Sakha building type, relocated from the Darkylakh summer grounds owned by the Markov family.',
    'Its hexagonal shape helped the building withstand strong winds and cold. The balagan was used as a winter dwelling.',
    'Larch; traditional log construction',
    'Approximately 38 m²',
    'Darkylakh summer grounds; Markov family'
)
ON CONFLICT (id) DO NOTHING;
