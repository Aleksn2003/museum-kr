<?php
    use Slim\App;
    use App\Controllers\AuthController;
    use App\Controllers\ExhibitController;
    use App\Controllers\CategoryController;
    use App\Controllers\NewsController;
    use App\Middleware\AuthMiddleware;
    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use App\Controllers\EventController;
    use App\Controllers\FunFactController;
    use App\Controllers\PageController;
    use App\Controllers\PageBlocksController;


    return function (App $app) {
        // CORS preflight
        $app->options('/{routes:.+}', function (Request $request, Response $response) {
            return $response;
        });

        // Публичные маршруты
        $app->get('/api/exhibits/featured', [ExhibitController::class, 'featured']);
        $app->get('/api/exhibits/{id}', [ExhibitController::class, 'getOne']);
        $app->get('/api/news/latest', [NewsController::class, 'latest']);
        $app->get('/api/news/{id}', [NewsController::class, 'getOne']);
        $app->get('/api/exhibits', [ExhibitController::class, 'listAll']);
        $app->get('/api/news', [NewsController::class, 'listAll']);
        $app->get('/api/events', [EventController::class, 'listAll']);
        $app->get('/api/events/upcoming', [EventController::class, 'upcoming']);
        $app->get('/api/events/{id}', [EventController::class, 'getOne']);
        $app->get('/api/categories', [CategoryController::class, 'listAll']);
        $app->get('/api/page-blocks', [\App\Controllers\PageBlocksController::class, 'getBlocks']);
       
// Маршрут для синхронизации VK (финальный)
$app->get('/api/sync/vk', function (Request $request, Response $response) {
    $syncKey = $_ENV['VK_SYNC_KEY'] ?? '';
    $accessToken = $_ENV['VK_ACCESS_TOKEN'] ?? '';
    $token = $request->getHeaderLine('X-Sync-Key');

    if ($syncKey === '' || $accessToken === '' || !hash_equals($syncKey, $token)) {
        $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
        return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
    }

    $db = $this->get('database');
    $groupId = (int) ($_ENV['VK_GROUP_ID'] ?? 238549299);
    $ownerId = -$groupId;

    $result = ['news' => 0, 'events' => 0];

    // 1. Получить посты из VK API
    $vkUrl = 'https://api.vk.com/method/wall.get?' . http_build_query([
        'owner_id' => $ownerId,
        'count' => 20,
        'v' => '5.131',
        'access_token' => $accessToken,
    ]);
    $vkResponse = @file_get_contents($vkUrl);
    if (!$vkResponse) {
        $response->getBody()->write(json_encode(['error' => 'VK API request failed']));
        return $response->withStatus(502)->withHeader('Content-Type', 'application/json');
    }
    $vkData = json_decode($vkResponse, true);
    if (!is_array($vkData) || isset($vkData['error'])) {
        $response->getBody()->write(json_encode([
            'error' => 'VK API error',
            'code' => $vkData['error']['error_code'] ?? null,
        ]));
        return $response->withStatus(502)->withHeader('Content-Type', 'application/json');
    }
    $posts = $vkData['response']['items'] ?? [];

    foreach ($posts as $post) {
        // 2. Извлечь хештеги
        preg_match_all('/#([\w]+)/u', $post['text'], $matches);
        $hashtags = $matches[1] ?? [];

        // 3. Определить тип: новость или мероприятие
        $type = null;
        $newsTags = ['новость', 'новости', 'news'];
        $eventTags = ['мероприятие', 'мероприятия', 'афиша', 'событие', 'события', 'event'];
        foreach ($hashtags as $tag) {
            $lower = mb_strtolower($tag);
            if (in_array($lower, $newsTags)) { $type = 'news'; break; }
            if (in_array($lower, $eventTags)) { $type = 'events'; break; }
        }
        if (!$type) continue;

        // 4. Проверить дубликат по vk_post_id
        $checkStmt = $db->prepare("SELECT id FROM {$type} WHERE vk_post_id = ? AND is_deleted = false");
        $checkStmt->execute([$post['id']]);
        if ($checkStmt->fetch()) continue;

        // 5. Извлечь картинку
        $imageUrl = null;
        if (!empty($post['attachments'])) {
            foreach ($post['attachments'] as $att) {
                if ($att['type'] === 'photo') {
                    $sizes = $att['photo']['sizes'];
                    $max = end($sizes);
                    $imageUrl = $max['url'] ?? null;
                    break;
                }
            }
        }

        // Заглушка, если нет картинки
        $placeholderImage = 'img/logo-samartyai.png';
        if (empty($imageUrl)) {
            $imageUrl = $placeholderImage;
        }

        // 6. Формируем заголовок и описание (чистые от хештегов)
        $rawText = $post['text'];

        // Убираем все хештеги из текста, чтобы они не попали в описание
        $cleanText = trim(preg_replace('/#[\w]+/u', '', $rawText));

        $lines = explode("\n", $cleanText);
        $firstLine = trim($lines[0]);

        // Заголовок – первая непустая строка, до 100 символов
        $maxTitleLength = 100;
        $title = mb_substr(strip_tags($firstLine), 0, $maxTitleLength);
        if (mb_strlen($firstLine) > $maxTitleLength) {
            $title .= '…';
        }

        // Описание – всё, что после заголовка, исключая хештеги и пустоты
        $restText = trim(mb_substr($cleanText, mb_strlen($firstLine)));
        // Удаляем оставшиеся пустые строки в начале
        $restText = ltrim($restText);

        if (!empty($restText)) {
            // Обрезаем до 250 символов (примерно 3 строки)
            $shortText = mb_substr(strip_tags($restText), 0, 200);
            // Если получилось слишком мало слов, пробуем взять чуть больше
            $wordCount = count(explode(' ', $shortText));
            if ($wordCount < 3 && mb_strlen($restText) > 200) {
                $shortText = mb_substr(strip_tags($restText), 0, 300);
            }
        } else {
            $shortText = 'Подробнее о новости ниже';
        }

        // На всякий случай, если shortText пустой
        if (empty(trim($shortText))) {
            $shortText = 'Подробнее о новости ниже';
        }

        // 7. Вставка в БД
        if ($type === 'news') {
            try {
    $stmt = $db->prepare('INSERT INTO news (title, short_text, content, image_url, published_at, vk_post_id) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$title, $shortText, $post['text'], $imageUrl, date('Y-m-d H:i:s', $post['date']), $post['id']]);
    $result['news']++;
} catch (\PDOException $e) {
    // Игнорируем дубликаты (новость уже существует)
    if ($e->getCode() != 23505) {
        throw $e; // Пробрасываем другие ошибки
    }
}
} elseif ($type === 'events') {
    try {
        $stmt = $db->prepare('INSERT INTO events (title, short_text, description, start_date, image_url, vk_post_id) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $title,
            $shortText,
            $post['text'],
            date('Y-m-d H:i:s', $post['date']),
            $imageUrl,
            $post['id']
        ]);
        $result['events']++;
    } catch (\PDOException $e) {
        if ($e->getCode() != 23505) {
            throw $e;
        }
    }
}
    }

    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
});
// Поиск по сайту (расширенный)
$app->get('/api/search', function (Request $request, Response $response) {
    $params = $request->getQueryParams();
    $query = trim($params['q'] ?? '');
    if (mb_strlen($query) < 2) {
        $response->getBody()->write(json_encode(['results' => []]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    $db = $this->get('database');
    $like = '%' . $query . '%';

    // Экспонаты (ищем по title, short_description, description)
    $stmt = $db->prepare("SELECT 'exhibit' AS type, id, title, short_description AS excerpt, image_url FROM exhibits WHERE title ILIKE ? OR short_description ILIKE ? OR description ILIKE ? LIMIT 3");
    $stmt->execute([$like, $like, $like]);
    $exhibits = $stmt->fetchAll();

    // Новости (ищем по title, short_text, content)
    $stmt = $db->prepare("SELECT 'news' AS type, id, title, short_text AS excerpt, image_url FROM news WHERE title ILIKE ? OR short_text ILIKE ? OR content ILIKE ? LIMIT 3");
    $stmt->execute([$like, $like, $like]);
    $news = $stmt->fetchAll();

    // Мероприятия (ищем по title, short_text, description)
    $stmt = $db->prepare("SELECT 'event' AS type, id, title, short_text AS excerpt, image_url FROM events WHERE title ILIKE ? OR short_text ILIKE ? OR description ILIKE ? LIMIT 3");
    $stmt->execute([$like, $like, $like]);
    $events = $stmt->fetchAll();

    // Статические страницы с расширенными ключевыми словами
    $pages = [
        ['title' => 'Главная', 'url' => '/', 'keywords' => 'главная, музей, самыртай, кердем, визит, посещение'],
        ['title' => 'О музее', 'url' => '/about.html', 'keywords' => 'о музее, история, основание, роберт захаров, создание, музейный комплекс'],
        ['title' => 'Афиша', 'url' => '/events.html', 'keywords' => 'афиша, мероприятия, события, календарь, выставки, концерты'],
        ['title' => 'Коллекции', 'url' => '/collections.html', 'keywords' => 'коллекции, экспонаты, фонды, предметы, собрание, артефакты'],
        ['title' => 'Новости', 'url' => '/news.html', 'keywords' => 'новости, анонсы, события, пресс-релизы, объявления'],
        ['title' => 'История', 'url' => '/history.html', 'keywords' => 'история, создание, основатель, прошлое, музей, развитие'],
        ['title' => 'Контакты', 'url' => '/contacts.html', 'keywords' => 'контакты, адрес, телефон, как добраться, проехать, маршрут, схема, карта, парковка'],
        ['title' => 'Филиалы', 'url' => '/filialy.html', 'keywords' => 'филиалы, подразделения, другие музеи'],
        ['title' => 'Посетителям', 'url' => '/visit.html', 'keywords' => 'посетить, часы работы, билеты, льготы, экскурсии, правила посещения, стоимость'],
        ['title' => 'Правила и льготы', 'url' => '/rules.html', 'keywords' => 'правила, льготы, посещение, билеты, скидки'],
        ['title' => 'Документы', 'url' => '/documents.html', 'keywords' => 'документы, отчёты, устав, лицензии'],
        ['title' => 'Сведения об учредителе', 'url' => '/founder.html', 'keywords' => 'учредитель, сведения, министерство, администрация'],
        ['title' => 'Оценка качества услуг', 'url' => '/quality.html', 'keywords' => 'оценка, качество, услуги, анкета'],
        ['title' => 'Политика конфиденциальности', 'url' => '/privacy.html', 'keywords' => 'конфиденциальность, политика, данные, защита'],
    ];

    $matchedPages = [];
    $queryLower = mb_strtolower($query);
    foreach ($pages as $page) {
        $titleLower = mb_strtolower($page['title']);
        $keywordsLower = mb_strtolower($page['keywords']);
        if (strpos($titleLower, $queryLower) !== false || strpos($keywordsLower, $queryLower) !== false) {
            $matchedPages[] = [
                'type' => 'page',
                'title' => $page['title'],
                'url' => $page['url'],
                'excerpt' => 'Страница сайта',
                'image_url' => 'img/logo-samartyai.png'
            ];
        }
    }

    $results = array_merge(
        array_map(function($item) { $item['url'] = '/exhibit.html?id=' . $item['id']; return $item; }, $exhibits),
        array_map(function($item) { $item['url'] = '/news-single.html?id=' . $item['id']; return $item; }, $news),
        array_map(function($item) { $item['url'] = '/event.html?id=' . $item['id']; return $item; }, $events),
        $matchedPages
    );  

    $response->getBody()->write(json_encode(['results' => $results]));
    return $response->withHeader('Content-Type', 'application/json');
});
// Полнотекстовый поиск по HTML-страницам
$app->get('/api/fulltext-search', function (Request $request, Response $response) {
    $params = $request->getQueryParams();
    $query = mb_strtolower(trim($params['q'] ?? ''));
    if (mb_strlen($query) < 2) {
        $response->getBody()->write(json_encode(['results' => []]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // Список страниц для поиска (пути к файлам и их заголовки)
    $pages = [
        ['file' => __DIR__ . '/../../frontend/index.html', 'title' => 'Главная', 'url' => '/'],
        ['file' => __DIR__ . '/../../frontend/about.html', 'title' => 'О музее', 'url' => '/about.html'],
        ['file' => __DIR__ . '/../../frontend/events.html', 'title' => 'Афиша', 'url' => '/events.html'],
        ['file' => __DIR__ . '/../../frontend/collections.html', 'title' => 'Коллекции', 'url' => '/collections.html'],
        ['file' => __DIR__ . '/../../frontend/news.html', 'title' => 'Новости', 'url' => '/news.html'],
        ['file' => __DIR__ . '/../../frontend/history.html', 'title' => 'История', 'url' => '/history.html'],
        ['file' => __DIR__ . '/../../frontend/contacts.html', 'title' => 'Контакты', 'url' => '/contacts.html'],
        ['file' => __DIR__ . '/../../frontend/filialy.html', 'title' => 'Филиалы', 'url' => '/filialy.html'],
        ['file' => __DIR__ . '/../../frontend/visit.html', 'title' => 'Посетителям', 'url' => '/visit.html'],
        ['file' => __DIR__ . '/../../frontend/rules.html', 'title' => 'Правила и льготы', 'url' => '/rules.html'],
        ['file' => __DIR__ . '/../../frontend/documents.html', 'title' => 'Документы', 'url' => '/documents.html'],
        ['file' => __DIR__ . '/../../frontend/founder.html', 'title' => 'Сведения об учредителе', 'url' => '/founder.html'],
        ['file' => __DIR__ . '/../../frontend/quality.html', 'title' => 'Оценка качества услуг', 'url' => '/quality.html'],
        ['file' => __DIR__ . '/../../frontend/privacy.html', 'title' => 'Политика конфиденциальности', 'url' => '/privacy.html'],
        ['file' => __DIR__ . '/../../frontend/search.html', 'title' => 'Поиск', 'url' => '/search.html'],
        // можно добавить любые другие HTML-файлы
    ];

    $results = [];

    foreach ($pages as $page) {
        $filePath = $page['file'];
        if (!file_exists($filePath)) continue;

        $htmlContent = file_get_contents($filePath);
        // Удаляем всё, что внутри тегов <script>, <style>, <head>
        $htmlContent = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $htmlContent);
        $htmlContent = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $htmlContent);
        $htmlContent = preg_replace('/<head[^>]*>.*?<\/head>/is', '', $htmlContent);

        $textOnly = strip_tags($htmlContent);
        $textLower = mb_strtolower($textOnly);

        // Ищем все вхождения
        $offset = 0;
        $foundPositions = [];
        while (($pos = mb_strpos($textLower, $query, $offset)) !== false) {
            $foundPositions[] = $pos;
            $offset = $pos + mb_strlen($query);
        }

        if (!empty($foundPositions)) {
            // Берём первое вхождение и формируем сниппет
            $pos = $foundPositions[0];
            $start = max(0, $pos - 50);
            $snippet = mb_substr($textOnly, $start, 100 + mb_strlen($query));
            // Обрезаем по словам
            if ($start > 0) $snippet = '…' . $snippet;
            if ($start + 100 + mb_strlen($query) < mb_strlen($textOnly)) $snippet .= '…';

            $results[] = [
                'type' => 'page',
                'title' => $page['title'],
                'url' => $page['url'],
                'excerpt' => $snippet,
                'image_url' => 'img/logo-samartyai.png'
            ];
        }
    }

    $response->getBody()->write(json_encode(['results' => $results]));
    return $response->withHeader('Content-Type', 'application/json');
});
        // Авторизация
        $app->get('/api/funfact', [\App\Controllers\FunFactController::class, 'random']);
        $app->get('/api/page', [\App\Controllers\PageController::class, 'getContent']);
        $app->post('/api/auth/login', [AuthController::class, 'login']);

        // Защищённые маршруты (админка)
        $app->group('/api', function ($group) {
            $group->post('/page', [\App\Controllers\PageController::class, 'saveContent']);
            $group->post('/page-blocks', [\App\Controllers\PageBlocksController::class, 'saveBlocks']);
            // Экспонаты
            $group->post('/exhibits', [ExhibitController::class, 'create']);
            $group->put('/exhibits/{id}', [ExhibitController::class, 'update']);
            
            $group->post('/categories', [CategoryController::class, 'create']);
$group->put('/categories/{id}', [CategoryController::class, 'update']);
$group->delete('/categories/{id}', [CategoryController::class, 'delete']);

            // Новости
            $group->post('/news', [NewsController::class, 'create']);
            $group->put('/news/{id}', [NewsController::class, 'update']);
            $group->post('/events', [EventController::class, 'create']);
            $group->put('/events/{id}', [EventController::class, 'update']);
            $group->delete('/exhibits/{id}', [ExhibitController::class, 'delete']);
            $group->delete('/news/{id}', [NewsController::class, 'delete']);
            $group->delete('/events/{id}', [EventController::class, 'delete']);
            $group->post('/upload', function (Request $request, Response $response) {
    $uploadedFiles = $request->getUploadedFiles();
    if (empty($uploadedFiles['image'])) {
        $response->getBody()->write(json_encode(['error' => 'Файл не найден']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    

    $image = $uploadedFiles['image'];
    if ($image->getError() !== UPLOAD_ERR_OK) {
        $response->getBody()->write(json_encode(['error' => 'Ошибка загрузки файла']));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }

    $extension = pathinfo($image->getClientFilename(), PATHINFO_EXTENSION);
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array(strtolower($extension), $allowed)) {
        $response->getBody()->write(json_encode(['error' => 'Недопустимый формат']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    $directory = '/var/www/html/uploads';
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }

    $filename = uniqid() . '.' . $extension;
    $image->moveTo($directory . '/' . $filename);

    $url = '/img/uploads/' . $filename;
    $response->getBody()->write(json_encode(['url' => $url]));
    return $response->withHeader('Content-Type', 'application/json');
});
        })->add(new AuthMiddleware($_ENV['JWT_SECRET'] ?? ''));
    };
