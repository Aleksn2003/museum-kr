<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;
use App\Support\AdminDateTime;

class EventController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/events
public function listAll(Request $request, Response $response): Response
{
    $db = $this->container->get('database');
    $stmt = $db->query("SELECT id, title, title_en, short_text, short_text_en, start_date, end_date, image_url, location, location_en FROM events WHERE is_deleted = false AND publication_status = 'published' ORDER BY created_at DESC");
    $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text', 'location']);
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
}

public function upcoming(Request $request, Response $response): Response
{
    $db = $this->container->get('database');
    $featuredOnly = ($request->getQueryParams()['featured'] ?? '') === '1';
    $sql = "SELECT id, title, title_en, short_text, short_text_en, start_date, image_url, location, location_en
            FROM events
            WHERE is_deleted = false AND publication_status = 'published' AND COALESCE(end_date, start_date) >= NOW()";
    if ($featuredOnly) $sql .= ' AND is_featured = true';
    $sql .= ' ORDER BY start_date ASC, id ASC LIMIT 3';
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text', 'location']);
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
}

    // GET /api/events/{id}
    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare("SELECT * FROM events WHERE id = ? AND is_deleted = false AND publication_status = 'published'");
        $stmt->execute([$args['id']]);
        $event = $stmt->fetch();
        if (!$event) {
            $response->getBody()->write(json_encode(['error' => 'Мероприятие не найдено']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        $event = Localization::row($event, Localization::language($request), ['title', 'short_text', 'description', 'location']);
        $response->getBody()->write(json_encode($event));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/events (требуется авторизация)
    public function create(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $status = $this->status($body['publication_status'] ?? 'draft');
        if ($status === null) return $this->invalidStatus($response);

        try {
            $startDate = AdminDateTime::parse($body['start_date'] ?? null);
            if ($startDate === null) throw new \InvalidArgumentException('Укажите дату и время начала мероприятия.');
            $endDate = AdminDateTime::parse($body['end_date'] ?? null);
        } catch (\InvalidArgumentException $error) {
            $response->getBody()->write(json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        $stmt = $db->prepare('INSERT INTO events (title, short_text, description, start_date, end_date, image_url, location, is_featured, title_en, short_text_en, description_en, location_en, publication_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
        $stmt->execute([
            $body['title'],
            $body['short_text'] ?? null,
            $body['description'] ?? null,
            $startDate,
            $endDate,
            $body['image_url'] ?? null,
            $body['location'] ?? null,
            filter_var($body['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
            $body['title_en'] ?? null,
            $body['short_text_en'] ?? null,
            $body['description_en'] ?? null,
            $body['location_en'] ?? null,
            $status,
        ]);
        $newId = $stmt->fetchColumn();
        $response->getBody()->write(json_encode(['id' => $newId]));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    // PUT /api/events/{id} (требуется авторизация)
    public function update(Request $request, Response $response, array $args): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $status = array_key_exists('publication_status', $body) ? $this->status($body['publication_status']) : null;
        if (array_key_exists('publication_status', $body) && $status === null) return $this->invalidStatus($response);

        try {
            $startDate = array_key_exists('start_date', $body) ? AdminDateTime::parse($body['start_date']) : null;
            $endDate = array_key_exists('end_date', $body) ? AdminDateTime::parse($body['end_date']) : null;
        } catch (\InvalidArgumentException $error) {
            $response->getBody()->write(json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        $stmt = $db->prepare('UPDATE events SET title=COALESCE(?, title), short_text=COALESCE(?, short_text), description=COALESCE(?, description), start_date=COALESCE(?, start_date), end_date=CASE WHEN ? THEN ?::timestamptz ELSE end_date END, image_url=COALESCE(?, image_url), location=COALESCE(?, location), is_featured=COALESCE(?, is_featured), title_en=COALESCE(?, title_en), short_text_en=COALESCE(?, short_text_en), description_en=COALESCE(?, description_en), location_en=COALESCE(?, location_en), publication_status=COALESCE(?, publication_status), updated_at=NOW() WHERE id=?');
        $stmt->execute([
            $body['title'] ?? null,
            $body['short_text'] ?? null,
            $body['description'] ?? null,
            $startDate,
            array_key_exists('end_date', $body) ? 'true' : 'false',
            $endDate,
            $body['image_url'] ?? null,
            $body['location'] ?? null,
            isset($body['is_featured']) ? (filter_var($body['is_featured'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false') : null,
            $body['title_en'] ?? null,
            $body['short_text_en'] ?? null,
            $body['description_en'] ?? null,
            $body['location_en'] ?? null,
            $status,
            $args['id']
        ]);
        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function listAdmin(Request $request, Response $response): Response
    {
        $stmt = $this->container->get('database')->query('SELECT id, title, title_en, short_text, short_text_en, start_date, end_date, image_url, location, location_en, publication_status, updated_at FROM events WHERE is_deleted = false ORDER BY updated_at DESC, start_date DESC');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text', 'location']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getAdmin(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->container->get('database')->prepare('SELECT * FROM events WHERE id = ? AND is_deleted = false');
        $stmt->execute([$args['id']]);
        $event = $stmt->fetch();
        if (!$event) {
            $response->getBody()->write(json_encode(['error' => 'Мероприятие не найдено'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }
        $event = Localization::row($event, Localization::language($request), ['title', 'short_text', 'description', 'location']);
        $response->getBody()->write(json_encode($event));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function status(mixed $value): ?string
    {
        $status = (string) $value;
        return in_array($status, ['draft', 'published', 'hidden'], true) ? $status : null;
    }

    private function invalidStatus(Response $response): Response
    {
        $response->getBody()->write(json_encode(['error' => 'Выберите допустимый статус публикации.'], JSON_UNESCAPED_UNICODE));
        return $response->withStatus(422)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

public function delete(Request $request, Response $response, array $args): Response
{
    $db = $this->container->get('database');
    $stmt = $db->prepare('UPDATE events SET is_deleted = true, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$args['id']]);
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
}
}
