<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;

class ExhibitController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container) {
        $this->container = $container;
    }

    // GET /api/exhibits/featured
    public function featured(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->query('SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url FROM exhibits WHERE is_featured = true ORDER BY order_index ASC, created_at DESC LIMIT 3');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_description']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function exhibitOfDay(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->query('SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url FROM exhibits WHERE is_exhibit_of_day = true ORDER BY updated_at DESC LIMIT 1');
        $exhibit = $stmt->fetch();
        if (!$exhibit) {
            $stmt = $db->query('SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url FROM exhibits ORDER BY md5(id::text || (NOW() AT TIME ZONE \'Asia/Yakutsk\')::date::text) LIMIT 1');
            $exhibit = $stmt->fetch();
        }
        if (!$exhibit) $exhibit = null;
        elseif ($exhibit) $exhibit = Localization::row($exhibit, Localization::language($request), ['title', 'short_description']);
        $response->getBody()->write(json_encode($exhibit, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    // GET /api/exhibits/{id}
    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT * FROM exhibits WHERE id = ?');
        $stmt->execute([$args['id']]);
        $exhibit = $stmt->fetch();
        // Преобразуем JSON-строку в массив
if ($exhibit && isset($exhibit['images'])) {
    $exhibit['images'] = json_decode($exhibit['images'], true) ?? [];
}
        if (!$exhibit) {
            $response->getBody()->write(json_encode(['error' => 'Экспонат не найден']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        foreach (['is_featured', 'is_exhibit_of_day'] as $flag) {
            if (array_key_exists($flag, $exhibit)) $exhibit[$flag] = in_array($exhibit[$flag], [true, 't', '1', 1], true);
        }
        $exhibit = Localization::row($exhibit, Localization::language($request), ['title', 'short_description', 'description', 'material', 'dimensions', 'origin', 'quote', 'quote_author']);
        $response->getBody()->write(json_encode($exhibit));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/exhibits (требуется авторизация)
public function create(Request $request, Response $response): Response
{
    $body = $request->getParsedBody();
    $db = $this->container->get('database');
    $isDay = filter_var($body['is_exhibit_of_day'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $db->beginTransaction();
    try {
    $stmt = $db->prepare('INSERT INTO exhibits (title, short_description, description, creation_date, image_url, is_featured, category_id, material, dimensions, origin, audio_url, quote, quote_author, images, title_en, short_description_en, description_en, material_en, dimensions_en, origin_en, quote_en, quote_author_en, is_exhibit_of_day, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
    $stmt->execute([
        $body['title'],
        $body['short_description'] ?? null,
        $body['description'] ?? null,
        $body['creation_date'] ?? null,
        $body['image_url'] ?? null,
        filter_var($body['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
        $body['category_id'] ?? null,
        $body['material'] ?? null,
        $body['dimensions'] ?? null,
        $body['origin'] ?? null,
        $body['audio_url'] ?? null,
        $body['quote'] ?? null,
        $body['quote_author'] ?? null,
        !empty($body['images']) ? json_encode($body['images']) : '[]',
        $body['title_en'] ?? null,
        $body['short_description_en'] ?? null,
        $body['description_en'] ?? null,
        $body['material_en'] ?? null,
        $body['dimensions_en'] ?? null,
        $body['origin_en'] ?? null,
        $body['quote_en'] ?? null,
        $body['quote_author_en'] ?? null,
        $isDay ? 'true' : 'false',
        max(0, (int) ($body['order_index'] ?? 0)),
    ]);
    $newId = $stmt->fetchColumn();
    if ($isDay) $db->prepare('UPDATE exhibits SET is_exhibit_of_day = false WHERE id <> ?')->execute([$newId]);
    $db->commit();
    } catch (\Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }
    $response->getBody()->write(json_encode(['id' => $newId]));
    return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
}

// PUT /api/exhibits/{id}
public function update(Request $request, Response $response, array $args): Response
{
    $body = $request->getParsedBody();
    $db = $this->container->get('database');

    // Если передан массив изображений, преобразуем его в JSON-строку
    $images = isset($body['images']) ? json_encode($body['images']) : null;

    $db->beginTransaction();
    try {

    $stmt = $db->prepare('UPDATE exhibits SET 
        title = COALESCE(?, title),
        short_description = COALESCE(?, short_description),
        description = COALESCE(?, description),
        creation_date = COALESCE(?, creation_date),
        image_url = COALESCE(?, image_url),
        is_featured = COALESCE(?, is_featured),
        category_id = COALESCE(?, category_id),
        material = COALESCE(?, material),
        dimensions = COALESCE(?, dimensions),
        origin = COALESCE(?, origin),
        audio_url = COALESCE(?, audio_url),
        quote = COALESCE(?, quote),
        quote_author = COALESCE(?, quote_author),
        images = COALESCE(?, images),
        title_en = COALESCE(?, title_en),
        short_description_en = COALESCE(?, short_description_en),
        description_en = COALESCE(?, description_en),
        material_en = COALESCE(?, material_en),
        dimensions_en = COALESCE(?, dimensions_en),
        origin_en = COALESCE(?, origin_en),
        quote_en = COALESCE(?, quote_en),
        quote_author_en = COALESCE(?, quote_author_en),
        is_exhibit_of_day = COALESCE(?, is_exhibit_of_day),
        order_index = COALESCE(?, order_index),
        updated_at = NOW()
        WHERE id = ?');

    $stmt->execute([
        $body['title'] ?? null,
        $body['short_description'] ?? null,
        $body['description'] ?? null,
        $body['creation_date'] ?? null,
        $body['image_url'] ?? null,
        isset($body['is_featured']) ? (filter_var($body['is_featured'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false') : null,
        $body['category_id'] ?? null,
        $body['material'] ?? null,
        $body['dimensions'] ?? null,
        $body['origin'] ?? null,
        $body['audio_url'] ?? null,
        $body['quote'] ?? null,
        $body['quote_author'] ?? null,
        $images,
        $body['title_en'] ?? null,
        $body['short_description_en'] ?? null,
        $body['description_en'] ?? null,
        $body['material_en'] ?? null,
        $body['dimensions_en'] ?? null,
        $body['origin_en'] ?? null,
        $body['quote_en'] ?? null,
        $body['quote_author_en'] ?? null,
        array_key_exists('is_exhibit_of_day', $body) ? (filter_var($body['is_exhibit_of_day'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false') : null,
        isset($body['order_index']) ? max(0, (int) $body['order_index']) : null,
        $args['id']
    ]);
    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        $response->getBody()->write(json_encode(['error' => 'Экспонат не найден'], JSON_UNESCAPED_UNICODE));
        return $response->withStatus(404)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (filter_var($body['is_exhibit_of_day'] ?? false, FILTER_VALIDATE_BOOLEAN)) $db->prepare('UPDATE exhibits SET is_exhibit_of_day = false WHERE id <> ?')->execute([$args['id']]);
    $db->commit();
    } catch (\Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }

    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
}

    // GET /api/exhibits
    public function listAll(Request $request, Response $response): Response
{
    $params = $request->getQueryParams();
    $db = $this->container->get('database');

    $page = max(1, (int)($params['page'] ?? 1));
    $perPage = min(50, max(1, (int)($params['per_page'] ?? 12))); // по умолчанию 12, можно до 50

    $conditions = [];
    $bindings = [];
    if (!empty($params['category_id'])) {
        $conditions[] = 'category_id = ?';
        $bindings[] = $params['category_id'];
    }
    $query = trim((string) ($params['q'] ?? ''));
    if ($query !== '') {
        $conditions[] = "(title ILIKE ? OR COALESCE(title_en, '') ILIKE ? OR COALESCE(creation_date, '') ILIKE ?)";
        $pattern = '%' . $query . '%';
        array_push($bindings, $pattern, $pattern, $pattern);
    }
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM exhibits {$where}");
    $countStmt->execute($bindings);
    $total = $countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;
    $stmt = $db->prepare("SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url, category_id, order_index, is_exhibit_of_day FROM exhibits {$where} ORDER BY order_index ASC, created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute(array_merge($bindings, [$perPage, $offset]));
    $items = $stmt->fetchAll();
    foreach ($items as &$item) $item['is_exhibit_of_day'] = in_array($item['is_exhibit_of_day'], [true, 't', '1', 1], true);
    unset($item);
    $items = Localization::rows($items, Localization::language($request), ['title', 'short_description']);

    $response->getBody()->write(json_encode([
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage
    ]));
    return $response->withHeader('Content-Type', 'application/json');
}

    // DELETE /api/exhibits/{id}
    public function delete(Request $request, Response $response, array $args): Response
    {
    $db = $this->container->get('database');
    $stmt = $db->prepare('DELETE FROM exhibits WHERE id = ?');
    $stmt->execute([$args['id']]);
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
    }
}

