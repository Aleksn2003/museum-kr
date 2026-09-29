<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PageBlocksController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/page-blocks?url=/about.html — получить все сохранённые блоки страницы
    public function getBlocks(Request $request, Response $response): Response
    {
        $url = $request->getQueryParams()['url'] ?? '';
        if (empty($url)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
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

        if (empty($url)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $stmt = $language === 'en'
            ? $db->prepare("INSERT INTO page_blocks (page_url, block_id, content, content_en, updated_at) VALUES (?, ?, '', ?, NOW()) ON CONFLICT (page_url, block_id) DO UPDATE SET content_en = EXCLUDED.content_en, updated_at = NOW()")
            : $db->prepare('INSERT INTO page_blocks (page_url, block_id, content, updated_at) VALUES (?, ?, ?, NOW()) ON CONFLICT (page_url, block_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()');

        foreach ($blocks as $blockId => $content) {
            $stmt->execute([$url, $blockId, $content]);
        }

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
