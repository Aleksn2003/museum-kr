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
        $app->get('/api/categories/{id}', [CategoryController::class, 'getOne']);
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
// Search public pages and published content.
$app->get('/api/search', function (Request $request, Response $response) {
    $query = trim($request->getQueryParams()['q'] ?? '');
    if (mb_strlen($query) < 2) {
        $response->getBody()->write(json_encode(['results' => []], JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    // Treat SQL LIKE metacharacters as ordinary search text.
    $escapedQuery = strtr($query, ['!' => '!!', '%' => '!%', '_' => '!_']);
    $like = '%' . $escapedQuery . '%';
    $db = $this->get('database');
    $results = [];
    $english = ($request->getQueryParams()['lang'] ?? '') === 'en';
    $localizedField = static fn (string $field): string => $english
        ? "COALESCE(NULLIF({$field}_en, ''), {$field})"
        : $field;
    $searchGroups = [
        [
            'sql' => "SELECT id, {$localizedField('title')} AS title, {$localizedField('short_description')} AS excerpt, image_url FROM exhibits WHERE {$localizedField('title')} ILIKE ? ESCAPE '!' OR {$localizedField('short_description')} ILIKE ? ESCAPE '!' OR {$localizedField('description')} ILIKE ? ESCAPE '!' ORDER BY CASE WHEN {$localizedField('title')} ILIKE ? ESCAPE '!' THEN 0 ELSE 1 END, title LIMIT 10",
            'type' => 'exhibit', 'url' => '/exhibit.html?id=',
        ],
        [
            'sql' => "SELECT id, {$localizedField('title')} AS title, {$localizedField('short_text')} AS excerpt, image_url FROM news WHERE is_deleted = false AND ({$localizedField('title')} ILIKE ? ESCAPE '!' OR {$localizedField('short_text')} ILIKE ? ESCAPE '!' OR {$localizedField('content')} ILIKE ? ESCAPE '!') ORDER BY CASE WHEN {$localizedField('title')} ILIKE ? ESCAPE '!' THEN 0 ELSE 1 END, published_at DESC LIMIT 10",
            'type' => 'news', 'url' => '/news-single.html?id=',
        ],
        [
            'sql' => "SELECT id, {$localizedField('title')} AS title, {$localizedField('short_text')} AS excerpt, image_url FROM events WHERE is_deleted = false AND ({$localizedField('title')} ILIKE ? ESCAPE '!' OR {$localizedField('short_text')} ILIKE ? ESCAPE '!' OR {$localizedField('description')} ILIKE ? ESCAPE '!') ORDER BY CASE WHEN {$localizedField('title')} ILIKE ? ESCAPE '!' THEN 0 ELSE 1 END, start_date DESC LIMIT 10",
            'type' => 'event', 'url' => '/event.html?id=',
        ],
    ];

    foreach ($searchGroups as $group) {
        $stmt = $db->prepare($group['sql']);
        $stmt->execute([$like, $like, $like, $like]);
        foreach ($stmt->fetchAll() as $item) {
            $item['type'] = $group['type'];
            $item['url'] = $group['url'] . rawurlencode((string)$item['id']);
            $item['excerpt'] = trim(strip_tags((string)($item['excerpt'] ?? '')));
            $results[] = $item;
        }
    }

    // Search visible text in the real static pages; ignore repeated navigation and scripts.
    $pages = [
        ['file' => 'index.html', 'title' => $english ? 'Home' : 'Главная', 'url' => '/'],
        ['file' => 'about.html', 'title' => $english ? 'About the Museum' : 'О музее', 'url' => '/about.html'],
        ['file' => 'events.html', 'title' => $english ? 'Events' : 'Афиша', 'url' => '/events.html'],
        ['file' => 'collections.html', 'title' => $english ? 'Collections' : 'Коллекции', 'url' => '/collections.html'],
        ['file' => 'news.html', 'title' => $english ? 'News' : 'Новости', 'url' => '/news.html'],
        ['file' => 'history.html', 'title' => $english ? 'History' : 'История', 'url' => '/history.html'],
        ['file' => 'explore.html', 'title' => $english ? 'Explore the Complex' : 'Экспозиция', 'url' => '/explore.html'],
        ['file' => 'architecture.html', 'title' => $english ? 'Architecture and Heritage' : 'Архитектура и наследие', 'url' => '/architecture.html'],
        ['file' => 'visit.html', 'title' => $english ? 'Visitor Information' : 'Посетителям', 'url' => '/visit.html'],
    ];
    $frontendDir = dirname(__DIR__) . '/frontend/';
    foreach ($pages as $page) {
        $path = $frontendDir . $page['file'];
        if (!is_readable($path)) continue;
        $html = file_get_contents($path);
        $html = preg_replace('/<(script|style|header|footer|nav)\\b[^>]*>.*?<\\/\\1>/is', ' ', $html);
        $text = html_entity_decode(preg_replace('/\\s+/u', ' ', strip_tags($html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $position = mb_stripos($text, $query);
        if ($position === false) continue;
        $start = max(0, $position - 70);
        $excerpt = mb_substr($text, $start, 180);
        if ($start > 0) $excerpt = '…' . $excerpt;
        if ($start + 180 < mb_strlen($text)) $excerpt .= '…';
        $results[] = ['type' => 'page', 'title' => $page['title'], 'url' => $page['url'], 'excerpt' => trim($excerpt)];
    }

    $response->getBody()->write(json_encode(['results' => $results], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
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
