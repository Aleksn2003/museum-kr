<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PageController
{
    private const EDITABLE_PAGES = ['/index.html', '/about.html', '/visit.html', '/history.html', '/architecture.html'];
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/page?url=/about.html — получить сохранённый контент страницы
    public function getContent(Request $request, Response $response): Response
    {
        $url = $request->getQueryParams()['url'] ?? '';
        if (!in_array($url, self::EDITABLE_PAGES, true)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT content, content_en FROM page_content WHERE page_url = ?');
        $stmt->execute([$url]);
        $row = $stmt->fetch();

        $language = ($request->getQueryParams()['lang'] ?? '') === 'en' ? 'en' : 'ru';
        $hasTranslation = $language !== 'en' || !empty($row['content_en']);
        $content = $row ? $row['content'] : null;
        if ($language === 'en' && !empty($row['content_en'])) {
            $content = $row['content_en'];
        }
        $response->getBody()->write(json_encode(['content' => $content, 'has_translation' => $hasTranslation]));
        return $response->withHeader('Content-Type', 'application/json')->withHeader('Cache-Control', 'no-store');
    }

    // POST /api/page — сохранить контент страницы (требуется JWT)
    public function saveContent(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $url = $body['page_url'] ?? '';
        $content = $body['content'] ?? '';
        $language = ($body['lang'] ?? '') === 'en' ? 'en' : 'ru';

        if (!in_array($url, self::EDITABLE_PAGES, true)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $db->beginTransaction();
        try {
        PageEditHistoryController::captureHtml($db, $url, $language);
        $stmt = $language === 'en'
            ? $db->prepare('INSERT INTO page_content (page_url, content, content_en, updated_at) VALUES (?, NULL, ?, NOW()) ON CONFLICT (page_url) DO UPDATE SET content_en = EXCLUDED.content_en, updated_at = NOW()')
            : $db->prepare('INSERT INTO page_content (page_url, content, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (page_url) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()');
        $stmt->execute($language === 'en' ? [$url, $content] : [$url, $content]);
        $db->commit();
        } catch (\Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Не удалось сохранить страницу.'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
