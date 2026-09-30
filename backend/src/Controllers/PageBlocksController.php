<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PageBlocksController
{
    private const PAGE_PREFIXES = [
        '/index.html' => 'home.',
        '/architecture.html' => 'architecture.',
    ];
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/page-blocks?url=/about.html — получить все сохранённые блоки страницы
    public function getBlocks(Request $request, Response $response): Response
    {
        $url = $request->getQueryParams()['url'] ?? '';
        if (!isset(self::PAGE_PREFIXES[$url])) {
            $response->getBody()->write(json_encode(['error' => 'Страница не поддерживает редактирование по полям'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $language = ($request->getQueryParams()['lang'] ?? '') === 'en' ? 'en' : 'ru';
        $contentColumn = $language === 'en' ? 'COALESCE(NULLIF(content_en, \'\'), content)' : 'content';
        $stmt = $db->prepare("SELECT block_id, {$contentColumn} AS content FROM page_blocks WHERE page_url = ?");
        $stmt->execute([$url]);
        $blocks = $stmt->fetchAll();

        $result = [];
        foreach ($blocks as $block) {
            if ($block['content'] === null) {
                continue;
            }
            $result[$block['block_id']] = $block['content'];
        }

        $response->getBody()->write(json_encode(['blocks' => $result]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/page-blocks — сохранить несколько блоков сразу
    public function saveBlocks(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $url = $body['page_url'] ?? '';
        $blocks = $body['blocks'] ?? [];
        $language = ($body['lang'] ?? '') === 'en' ? 'en' : 'ru';

        if (!isset(self::PAGE_PREFIXES[$url])) {
            $response->getBody()->write(json_encode(['error' => 'Страница не поддерживает редактирование по полям'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        if (!is_array($blocks) || count($blocks) > 100) {
            $response->getBody()->write(json_encode(['error' => 'Некорректный набор полей'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $prefix = self::PAGE_PREFIXES[$url];
        foreach ($blocks as $blockId => $content) {
            if (!is_string($blockId) || !str_starts_with($blockId, $prefix) || !preg_match('/^[a-z0-9._-]+$/', $blockId) || !is_string($content) || strlen($content) > 80000) {
                $response->getBody()->write(json_encode(['error' => 'Одно из полей страницы содержит некорректные данные'], JSON_UNESCAPED_UNICODE));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }

        $db = $this->container->get('database');
        $db->beginTransaction();
        try {
        $previousBlocks = PageEditHistoryController::captureBlocks($db, $url, $language);
        $changedFields = [];
        foreach ($blocks as $blockId => $content) {
            if (!array_key_exists($blockId, $previousBlocks) || $previousBlocks[$blockId] !== $content) $changedFields[] = $blockId;
        }
        PageEditHistoryController::setLastChangedFields($db, $url, $language, $changedFields);
        $stmt = $language === 'en'
            ? $db->prepare('INSERT INTO page_blocks (page_url, block_id, content, content_en, updated_at) VALUES (?, ?, NULL, ?, NOW()) ON CONFLICT (page_url, block_id) DO UPDATE SET content_en = EXCLUDED.content_en, updated_at = NOW()')
            : $db->prepare('INSERT INTO page_blocks (page_url, block_id, content, updated_at) VALUES (?, ?, ?, NOW()) ON CONFLICT (page_url, block_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()');

        foreach ($blocks as $blockId => $content) {
            $stmt->execute([$url, $blockId, $content]);
        }
        $db->commit();
        } catch (\Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Не удалось сохранить блоки страницы.'], JSON_UNESCAPED_UNICODE));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
