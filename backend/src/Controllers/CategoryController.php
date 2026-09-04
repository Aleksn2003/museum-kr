<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CategoryController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container) {
        $this->container = $container;
    }

    // GET /api/categories – список категорий с количеством экспонатов
    public function listAll(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->query('SELECT c.id, c.name, c.slug, c.description, c.order_index, COUNT(e.id) AS exhibit_count FROM categories c LEFT JOIN exhibits e ON c.id = e.category_id GROUP BY c.id ORDER BY c.order_index ASC');
        $data = $stmt->fetchAll();
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/categories (требуется авторизация)
    public function create(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $stmt = $db->prepare('INSERT INTO categories (name, slug, description, order_index) VALUES (?, ?, ?, ?) RETURNING id');
        $stmt->execute([$body['name'], $body['slug'], $body['description'] ?? null, $body['order_index'] ?? 0]);
        $newId = $stmt->fetchColumn();
        $response->getBody()->write(json_encode(['id' => $newId]));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    // PUT /api/categories/{id}
    public function update(Request $request, Response $response, array $args): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $stmt = $db->prepare('UPDATE categories SET name=?, slug=?, description=?, order_index=? WHERE id=?');
        $stmt->execute([$body['name'], $body['slug'], $body['description'] ?? null, $body['order_index'] ?? 0, $args['id']]);
        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE /api/categories/{id}
    public function delete(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare('DELETE FROM categories WHERE id=?');
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}