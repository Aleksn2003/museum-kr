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
        $stmt = $db->query('SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url FROM exhibits WHERE is_featured = true ORDER BY created_at DESC LIMIT 3');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_description']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
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
        $exhibit = Localization::row($exhibit, Localization::language($request), ['title', 'short_description', 'description', 'material', 'dimensions', 'origin', 'quote', 'quote_author']);
        $response->getBody()->write(json_encode($exhibit));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/exhibits (требуется авторизация)
public function create(Request $request, Response $response): Response
{
    $body = $request->getParsedBody();
    $db = $this->container->get('database');
    $stmt = $db->prepare('INSERT INTO exhibits (title, short_description, description, creation_date, image_url, is_featured, category_id, material, dimensions, origin, audio_url, quote, quote_author, images, title_en, short_description_en, description_en, material_en, dimensions_en, origin_en, quote_en, quote_author_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
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
    ]);
    $newId = $stmt->fetchColumn();
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
        quote_author_en = COALESCE(?, quote_author_en)
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
        $args['id']
    ]);

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

    $where = '';
    $bindings = [];
    if (!empty($params['category_id'])) {
        $where = 'WHERE category_id = ?';
        $bindings[] = $params['category_id'];
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM exhibits {$where}");
    $countStmt->execute($bindings);
    $total = $countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;
    $stmt = $db->prepare("SELECT id, title, title_en, short_description, short_description_en, creation_date, image_url, category_id FROM exhibits {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute(array_merge($bindings, [$perPage, $offset]));
    $items = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_description']);

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

