<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;
use App\Support\AdminDateTime;

class NewsController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container) { $this->container = $container; }

    // GET /api/news/latest
    public function latest(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->query("SELECT id, title, title_en, short_text, short_text_en, published_at, image_url FROM news WHERE is_deleted = false AND publication_status = 'published' ORDER BY published_at DESC");
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // GET /api/news/{id}
    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare("SELECT * FROM news WHERE id=? AND is_deleted = false AND publication_status = 'published'");
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
    $status = $this->status($body['publication_status'] ?? 'draft');
    if ($status === null) return $this->invalidStatus($response);

    try {
        $publishedAt = AdminDateTime::parse($body['published_at'] ?? null)
            ?? (new \DateTimeImmutable('now', new \DateTimeZone($_ENV['APP_TIMEZONE'] ?? 'Asia/Yakutsk')))->format('Y-m-d H:i:sP');
    } catch (\InvalidArgumentException $error) {
        $response->getBody()->write(json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE));
        return $response->withStatus(422)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    $stmt = $db->prepare('INSERT INTO news (title, short_text, content, image_url, published_at, title_en, short_text_en, content_en, publication_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) RETURNING id');
    $stmt->execute([
        $body['title'],
        $body['short_text'] ?? null,
        $body['content'] ?? null,
        $body['image_url'] ?? null,
        $publishedAt ?? date('Y-m-d H:i:s'),
        $body['title_en'] ?? null,
        $body['short_text_en'] ?? null,
        $body['content_en'] ?? null,
        $status
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
        $status = array_key_exists('publication_status', $body) ? $this->status($body['publication_status']) : null;
        if (array_key_exists('publication_status', $body) && $status === null) return $this->invalidStatus($response);
        try {
            $publishedAt = array_key_exists('published_at', $body) ? AdminDateTime::parse($body['published_at']) : null;
        } catch (\InvalidArgumentException $error) {
            $response->getBody()->write(json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(422)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        $stmt = $db->prepare('UPDATE news SET title = COALESCE(?, title), short_text = COALESCE(?, short_text), content = COALESCE(?, content), image_url = COALESCE(?, image_url), published_at = COALESCE(?, published_at), title_en = COALESCE(?, title_en), short_text_en = COALESCE(?, short_text_en), content_en = COALESCE(?, content_en), publication_status = COALESCE(?, publication_status), updated_at = NOW() WHERE id = ? AND is_deleted = false');
        $stmt->execute([
            $body['title'] ?? null,
            $body['short_text'] ?? null,
            $body['content'] ?? null,
            $body['image_url'] ?? null,
            $publishedAt,
            $body['title_en'] ?? null,
            $body['short_text_en'] ?? null,
            $body['content_en'] ?? null,
            $status,
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
    $stmt = $db->query("SELECT id, title, title_en, short_text, short_text_en, published_at, image_url FROM news WHERE is_deleted = false AND publication_status = 'published' ORDER BY published_at DESC");
    $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text']);
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
    }

    public function listAdmin(Request $request, Response $response): Response
    {
        $stmt = $this->container->get('database')->query('SELECT id, title, title_en, short_text, short_text_en, published_at, image_url, publication_status, updated_at FROM news WHERE is_deleted = false ORDER BY updated_at DESC, published_at DESC');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['title', 'short_text']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getAdmin(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->container->get('database')->prepare('SELECT * FROM news WHERE id = ? AND is_deleted = false');
        $stmt->execute([$args['id']]);
        $news = $stmt->fetch();
        if (!$news) {
            $response->getBody()->write(json_encode(['error' => 'Новость не найдена'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }
        $news = Localization::row($news, Localization::language($request), ['title', 'short_text', 'content']);
        $response->getBody()->write(json_encode($news));
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
    $stmt = $db->prepare('UPDATE news SET is_deleted = true, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$args['id']]);
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
}
}

