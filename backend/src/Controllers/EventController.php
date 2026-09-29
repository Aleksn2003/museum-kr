<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

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
    $stmt = $db->query('SELECT id, title, short_text, start_date, end_date, image_url, location FROM events WHERE is_deleted = false ORDER BY created_at DESC');
    $data = $stmt->fetchAll();
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
}

public function upcoming(Request $request, Response $response): Response
{
    $db = $this->container->get('database');
    $stmt = $db->prepare('SELECT id, title, short_text, start_date, image_url, location FROM events WHERE is_deleted = false ORDER BY created_at DESC LIMIT 3');
    $stmt->execute();
    $data = $stmt->fetchAll();
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
}

    // GET /api/events/{id}
    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$args['id']]);
        $event = $stmt->fetch();
        if (!$event) {
            $response->getBody()->write(json_encode(['error' => 'Мероприятие не найдено']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        $response->getBody()->write(json_encode($event));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/events (требуется авторизация)
    public function create(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');

        $startDate = $body['start_date'] ?? null;
        $endDate = $body['end_date'] ?? null;

        // Преобразование из datetime-local (Y-m-d\TH:i) в формат БД
        if ($startDate) {
            $d = \DateTime::createFromFormat('Y-m-d\TH:i', $startDate);
            $startDate = $d ? $d->format('Y-m-d H:i:s') : date('Y-m-d H:i:s');
        } else {
            $startDate = date('Y-m-d H:i:s');
        }

        if ($endDate) {
            $d = \DateTime::createFromFormat('Y-m-d\TH:i', $endDate);
            $endDate = $d ? $d->format('Y-m-d H:i:s') : null;
        } else {
            $endDate = null;
        }

        $stmt = $db->prepare('INSERT INTO events (title, short_text, description, start_date, end_date, image_url, location, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
        $stmt->execute([
            $body['title'],
            $body['short_text'] ?? null,
            $body['description'] ?? null,
            $startDate,
            $endDate,
            $body['image_url'] ?? null,
            $body['location'] ?? null,
            filter_var($body['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
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

        $startDate = $body['start_date'] ?? null;
        $endDate = $body['end_date'] ?? null;

        if ($startDate) {
            $d = \DateTime::createFromFormat('Y-m-d\TH:i', $startDate);
            $startDate = $d ? $d->format('Y-m-d H:i:s') : null;
        }

        if ($endDate) {
            $d = \DateTime::createFromFormat('Y-m-d\TH:i', $endDate);
            $endDate = $d ? $d->format('Y-m-d H:i:s') : null;
        }

        $stmt = $db->prepare('UPDATE events SET title=?, short_text=?, description=?, start_date=?, end_date=?, image_url=?, location=?, is_featured=? WHERE id=?');
        $stmt->execute([
            $body['title'],
            $body['short_text'] ?? null,
            $body['description'] ?? null,
            $startDate,
            $endDate,
            $body['image_url'] ?? null,
            $body['location'] ?? null,
            filter_var($body['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
            $args['id']
        ]);
        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

public function delete(Request $request, Response $response, array $args): Response
{
    $db = $this->container->get('database');
    $stmt = $db->prepare('UPDATE events SET is_deleted = true WHERE id = ?');
    $stmt->execute([$args['id']]);
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
}
}
