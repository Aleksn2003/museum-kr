<?php
declare(strict_types=1);

$password = $_ENV['ADMIN_PASSWORD'] ?? getenv('ADMIN_PASSWORD');
if (!is_string($password) || strlen($password) < 16) {
    fwrite(STDERR, "ADMIN_PASSWORD must contain at least 16 characters.\n");
    exit(1);
}

$dsn = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s',
    $_ENV['DB_HOST'] ?? 'db',
    $_ENV['DB_PORT'] ?? '5432',
    $_ENV['DB_NAME'] ?? 'museum_db'
);
$db = new PDO($dsn, $_ENV['DB_USER'] ?? 'museum', $_ENV['DB_PASSWORD'] ?? '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

// Older installations did not create this table, although the API uses it.
$db->exec('CREATE TABLE IF NOT EXISTS page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    block_id TEXT NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_url, block_id)
)');

// Keep existing Docker volumes compatible with the optional English fields.
foreach ([
    'categories' => ['name_en VARCHAR(255)', 'description_en TEXT'],
    'exhibits' => ['title_en VARCHAR(255)', 'short_description_en TEXT', 'description_en TEXT', 'material_en TEXT', 'dimensions_en TEXT', 'origin_en TEXT', 'quote_en TEXT', 'quote_author_en TEXT'],
    'news' => ['title_en VARCHAR(255)', 'short_text_en TEXT', 'content_en TEXT'],
    'events' => ['title_en VARCHAR(255)', 'short_text_en TEXT', 'description_en TEXT', 'location_en TEXT'],
    'page_content' => ['content_en TEXT'],
    'page_blocks' => ['content_en TEXT'],
    'fun_facts' => ['text_en TEXT'],
] as $table => $columns) {
    foreach ($columns as $column) {
        $db->exec("ALTER TABLE {$table} ADD COLUMN IF NOT EXISTS {$column}");
    }
}

// Seed translations for the bundled sample content without overwriting edits.
$demoTranslations = [
    'news' => [
        '10000000-0000-4000-8000-000000000001' => ['Discover the Samyrtai Museum Complex', 'Demo story: the complex brings together monuments of traditional culture and local history.', 'This is a sample story prepared to introduce the website. Visitors to the Samyrtai Museum Complex can see historic buildings and learn about the culture of Yakutia. Replace this sample with a verified museum story before publishing.'],
        '10000000-0000-4000-8000-000000000002' => ['The Kachikatskaya St. Nicholas Church: A Photographic History', 'A demo story about the wooden church on the museum grounds.', 'This is a sample story. The photographs show the Kachikatskaya St. Nicholas Church at different times. This sample demonstrates the news layout; dates and further details must be verified before publication.'],
        '10000000-0000-4000-8000-000000000003' => ['Historic Buildings and Daily Life at Samyrtai', 'A demo story about historic buildings that tell us about life and work in the past.', 'This sample story is included to demonstrate the news section. Historic farm buildings help visitors picture everyday life in the region. Replace it with verified museum content before publication.'],
    ],
    'events' => [
        '20000000-0000-4000-8000-000000000001' => ['Guided Tour of the Museum Complex (Demo)', 'Sample event: discover the grounds and historic buildings.', 'This sample event demonstrates the events calendar. The date and time are examples and do not represent the museum schedule.', 'Samyrtai Museum Complex'],
        '20000000-0000-4000-8000-000000000002' => ['The History of Wooden Architecture (Demo)', 'Sample event: a talk about the complex’s wooden monuments.', 'This sample event is for testing the calendar. It is not an announcement of a real event; replace it with a confirmed programme before publication.', 'Samyrtai Museum Complex'],
    ],
];
foreach ($demoTranslations['news'] as $id => [$title, $summary, $content]) {
    $stmt = $db->prepare('UPDATE news SET title_en = ?, short_text_en = ?, content_en = ? WHERE id = ? AND title_en IS NULL');
    $stmt->execute([$title, $summary, $content, $id]);
}
foreach ($demoTranslations['events'] as $id => [$title, $summary, $description, $location]) {
    $stmt = $db->prepare('UPDATE events SET title_en = ?, short_text_en = ?, description_en = ?, location_en = ? WHERE id = ? AND title_en IS NULL');
    $stmt->execute([$title, $summary, $description, $location, $id]);
}

// English text for the exhibit examples already present in older project databases.
$exhibitTranslations = [
    'b4d6f861-7880-4200-8661-87c73c08361a' => ['Ancient Exhibit', "On the other hand, today's economic agenda highlights the need for new principles for developing the material and staffing base.", "On the other hand, today's economic agenda highlights the need for new principles for developing the material and staffing base.", 'Larch', null, 'Tit-Ebe', 'It was considered legendary.', null],
    'a084837f-6b99-47f7-b347-63f46b777248' => ['Motorcycle', 'The key features of the project structure are clearly divided into independent elements. In trying to improve the user experience, we overlook how some internal-policy issues gain popularity among certain groups and must therefore be addressed.', 'The key features of the project structure are clearly divided into independent elements. In trying to improve the user experience, we overlook how some internal-policy issues gain popularity among certain groups and must therefore be addressed.', 'Larch', null, 'Tit-Ebe', 'It was considered legendary.', null],
    'd08a971d-6e12-44e1-80ca-82164cd2f82d' => ['Motorcycle', 'The key features of the project structure are clearly divided into independent elements.', 'The key features of the project structure are clearly divided into independent elements. In trying to improve the user experience, we overlook how some internal-policy issues gain popularity among certain groups and must therefore be addressed.', 'Larch', null, 'Tit-Ebe', 'It was considered legendary.', null],
    '38b76fb4-2de8-4688-b7b9-350116787a77' => ['Knife', 'An antique knife from the 18th century.', 'An antique knife from the 18th century, made for self-defence.', null, null, null, null, null],
    '2a5897c3-23b0-473a-b70d-ed87568bc0f1' => ['Sakha Decorative Box', 'A small box from the collection of the Samyrtai Museum Complex named after R. K. Zakharov.', 'This small box was donated in the 1990s by Viktor Egorov, a resident of Kachikat, while museum founder Robert Zakharov was collecting objects. Egorov did not provide its history, so its earlier provenance is unknown. It measures 10.5 cm high, 17.5 cm long and 13 cm wide. The wooden box is reinforced with thin metal and decorated with dark metal fittings. The lid has two hinges, one of which has come loose. Its outer surface has corner ornaments and a central decorative motif framed by a floral pattern. Some decorative elements are missing.', null, null, null, null, null],
    'fed8b201-cb58-45a4-9fbd-19ac9444aedd' => ['Motorcycle', 'A 1956 IZH-49 motorcycle was donated to the museum by Afanasiy Mikhailov on 6 April 2024. It had belonged to his father, Ilya Mikhailov, and had been used for many years.', 'On 6 April 2024, Afanasiy Prokopyevich Mikhailov donated his father Ilya Filippovich Mikhailov’s 1956 IZH-49 motorcycle to the museum. The family had used it for many years. The motorcycle is now 68 years old. Its documents and part of its registration plate have been preserved. Afanasiy restored the motorcycle, with help from the Mikhailov family. It is an unusual addition to the museum collection.', null, null, null, null, null],
    '5124ea5f-7d4b-4732-a6e2-851c957b10b4' => ['Sakha Saddle', 'The Samyrtai collection includes an ornate Sakha riding saddle decorated with distinctive imagery.', 'The Samyrtai collection includes an ornate Sakha riding saddle decorated with distinctive imagery. Its rounded front pommel is covered with a silver plate backed with birch bark. The plate has a rich floral design, with engraved images of a giraffe and an ostrich labelled “giraffe” and “ostrich”. An inscription reads “Semyon Zasimov Barashkov, 29 June 1892”. A flat-iron hook, known as a hoŋsuochchu, is attached to the front pommel. The rear pommel and seat panels are also covered with engraved silver plates. Two rivets retain raised silver washers decorated with concentric lines and diagonal notches. The saddle is 55 cm long, and its panels are 5.5–7 cm wide. The cushion may have been filled with down, moose hair and hay. The date may be connected with the construction of the Kachikatskaya St. Nicholas Church. The names in the inscription refer to Zasim, the uncle of patron S. P. Barashkov. Semyon Barashkov served as churchwarden and contributed personally to the church’s construction. P. M. Nikiforov found the saddle in a state-farm warehouse in the Second Zhemkon and donated it to the museum.', null, null, null, null, null],
    '9eb7b5a9-a4e6-4d1c-b536-49b40477ba02' => ['Painted Spinning Wheel', null, null, null, null, null, null, null],
    'b8d1dc0c-d18f-4fb5-81af-d7186e5a65da' => ["Shaman's Amulet", null, null, null, null, null, null, null],
    '18ca129a-2932-4f7b-b385-252259596e97' => ['Ancient Exhibit', null, null, null, null, null, null, null],
];
$exhibitUpdate = $db->prepare('UPDATE exhibits SET title_en = ?, short_description_en = ?, description_en = ?, material_en = ?, dimensions_en = ?, origin_en = ?, quote_en = ?, quote_author_en = ? WHERE id = ? AND title_en IS NULL');
foreach ($exhibitTranslations as $id => $translation) {
    $exhibitUpdate->execute([...$translation, $id]);
}

$factTranslations = [
    'В музее собрано более 900 экспонатов, рассказывающих о быте и культуре якутов.' => 'The museum holds more than 900 objects documenting Sakha life and culture.',
    'Качикатская Николаевская церковь (1896 г.) — единственный сохранившийся в улусе образец русского деревянного зодчества.' => 'The Kachikatskaya St. Nicholas Church (1896) is the only surviving example of Russian wooden architecture in the district.',
    'Шестигранный балаган с летника Даркылах — редчайший тип якутской постройки, обеспечивавший устойчивость к сильным ветрам.' => 'The hexagonal balagan from Darkylakh is a rare Sakha building type designed to withstand strong winds.',
    'Музей носит имя своего основателя — краеведа Роберта Константиновича Захарова с 2020 года.' => 'Since 2020, the museum has borne the name of its founder, local historian Robert Konstantinovich Zakharov.',
    'На территории комплекса находится двухуровневый амбар богача Кирилла Скрябина из села Тит-Эбэ.' => 'The grounds include a two-storey barn that belonged to Kirill Skryabin of Tit-Ebe village.',
    'С 2021 года музей является филиалом Хангаласского улусного краеведческого музея им. Г.В. Ксенофонтова.' => 'Since 2021, the museum has been a branch of the G. V. Ksenofontov Khangalassky District Museum of Local History.',
    'В музее проводятся самобытные праздники: ысыах, куйур, соревнования по национальным видам спорта.' => 'The museum hosts traditional celebrations, including Ysyakh, Kuyur and competitions in national sports.',
    'Зерносушилка мецената С.П. Барашкова — один из экспонатов, демонстрирующий хозяйственный быт XIX века.' => 'The grain dryer donated by S. P. Barashkov illustrates 19th-century agricultural life.',
];
$factUpdate = $db->prepare("UPDATE fun_facts SET text_en = ? WHERE text = ? AND (text_en IS NULL OR text_en = '')");
foreach ($factTranslations as $russian => $english) {
    $factUpdate->execute([$english, $russian]);
}

$existing = $db->query("SELECT password FROM admins WHERE username = 'admin'")->fetchColumn();
$hash = password_hash($password, PASSWORD_DEFAULT);

if ($existing === false) {
    $stmt = $db->prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    $stmt->execute(['admin', $hash]);
} elseif (!password_verify($password, $existing)) {
    $stmt = $db->prepare('UPDATE admins SET password = ? WHERE username = ?');
    $stmt->execute([$hash, 'admin']);
}
