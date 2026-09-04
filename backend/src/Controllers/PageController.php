<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PageController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/page?url=/about.html — получить сохранённый контент страницы
    public function getContent(Request $request, Response $response): Response
    {
        $url = $request->getQueryParams()['url'] ?? '';
        if (empty($url)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT content FROM page_content WHERE page_url = ?');
        $stmt->execute([$url]);
        $row = $stmt->fetch();

        $response->getBody()->write(json_encode([
            'content' => $row ? $row['content'] : null
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/page — сохранить контент страницы (требуется JWT)
    public function saveContent(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $url = $body['page_url'] ?? '';
        $content = $body['content'] ?? '';

        if (empty($url)) {
            $response->getBody()->write(json_encode(['error' => 'URL не указан']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $db = $this->container->get('database');
        $stmt = $db->prepare('INSERT INTO page_content (page_url, content, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (page_url) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()');
        $stmt->execute([$url, $content]);

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}