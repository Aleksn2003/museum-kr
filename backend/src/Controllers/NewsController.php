<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;

class NewsController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container) { $this->container = $container; }

    // GET /api/news/latest
    public function latest(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->query('SELECT id, title, title_en, short_text, short_text_en, published_at, image_url FROM news WHERE is_deleted = false ORDER BY published_at DESC');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // GET /api/news/{id}
    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT * FROM news WHERE id=?');
        $stmt->execute([$args['id']]);
        $news = $stmt->fetch();
        if (!$news) {
            $response->getBody()->write(json_encode(['error' => 'Новость не найдена']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        $news = Localization::row($news, Localization::language($request), ['title', 'short_text', 'content']);
        $response->getBody()->write(json_encode($news));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/news
    public function create(Request $request, Response $response): Response
    {
    $body = $request->getParsedBody();
    $db = $this->container->get('database');

    // Преобразование даты из формата datetime-local в формат БД
    $publishedAt = null;
    if (!empty($body['published_at'])) {
        $d = \DateTime::createFromFormat('Y-m-d\TH:i', $body['published_at']);
        if ($d) {
            $publishedAt = $d->format('Y-m-d H:i:s');
        }
    }

    $stmt = $db->prepare('INSERT INTO news (title, short_text, content, image_url, published_at, title_en, short_text_en, content_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
    $stmt->execute([
        $body['title'],
        $body['short_text'] ?? null,
        $body['content'] ?? null,
        $body['image_url'] ?? null,
        $publishedAt ?? date('Y-m-d H:i:s'),
        $body['title_en'] ?? null,
        $body['short_text_en'] ?? null,
        $body['content_en'] ?? null
    ]);
    $newId = $stmt->fetchColumn();
    $response->getBody()->write(json_encode(['id' => $newId]));
    return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    // PUT /api/news/{id}
    public function update(Request $request, Response $response, array $args): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $publishedAt = null;
        if (!empty($body['published_at'])) {
            $date = \DateTime::createFromFormat('Y-m-d\\TH:i', $body['published_at']);
            $publishedAt = $date ? $date->format('Y-m-d H:i:s') : null;
        }

        $stmt = $db->prepare('UPDATE news SET title = COALESCE(?, title), short_text = COALESCE(?, short_text), content = COALESCE(?, content), image_url = COALESCE(?, image_url), published_at = COALESCE(?, published_at), title_en = COALESCE(?, title_en), short_text_en = COALESCE(?, short_text_en), content_en = COALESCE(?, content_en) WHERE id = ? AND is_deleted = false');
        $stmt->execute([
            $body['title'] ?? null,
            $body['short_text'] ?? null,
            $body['content'] ?? null,
            $body['image_url'] ?? null,
            $publishedAt,
            $body['title_en'] ?? null,
            $body['short_text_en'] ?? null,
            $body['content_en'] ?? null,
            $args['id'],
        ]);
        if ($stmt->rowCount() === 0) {
            $response->getBody()->write(json_encode(['error' => 'Новость не найдена']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // GET /api/news
    public function listAll(Request $request, Response $response): Response
    {
    $db = $this->container->get('database');
    $stmt = $db->query('SELECT id, title, title_en, short_text, short_text_en, published_at, image_url FROM news WHERE is_deleted = false ORDER BY published_at DESC');
    $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text']);
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
    }

public function delete(Request $request, Response $response, array $args): Response
{
    $db = $this->container->get('database');
    $stmt = $db->prepare('UPDATE news SET is_deleted = true WHERE id = ?');
    $stmt->execute([$args['id']]);
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
}
}

