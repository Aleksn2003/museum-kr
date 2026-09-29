<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;

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
        $stmt = $db->query('SELECT c.id, c.name, c.name_en, c.slug, c.description, c.description_en, c.order_index, COUNT(e.id) AS exhibit_count FROM categories c LEFT JOIN exhibits e ON c.id = e.category_id GROUP BY c.id ORDER BY c.order_index ASC');
        $data = Localization::rows($stmt->fetchAll(), Localization::language($request), ['name', 'description']);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT id, name, name_en, slug, description, description_en, order_index FROM categories WHERE id = ?');
        $stmt->execute([$args['id']]);
        $category = $stmt->fetch();
        if (!$category) {
            $response->getBody()->write(json_encode(['error' => 'Категория не найдена']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        $category = Localization::row($category, Localization::language($request), ['name', 'description']);
        $response->getBody()->write(json_encode($category));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // POST /api/categories (требуется авторизация)
    public function create(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $stmt = $db->prepare('INSERT INTO categories (name, slug, description, order_index, name_en, description_en) VALUES (?, ?, ?, ?, ?, ?) RETURNING id');
        $stmt->execute([$body['name'], $body['slug'], $body['description'] ?? null, $body['order_index'] ?? 0, $body['name_en'] ?? null, $body['description_en'] ?? null]);
        $newId = $stmt->fetchColumn();
        $response->getBody()->write(json_encode(['id' => $newId]));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    // PUT /api/categories/{id}
    public function update(Request $request, Response $response, array $args): Response
    {
        $body = $request->getParsedBody();
        $db = $this->container->get('database');
        $stmt = $db->prepare('UPDATE categories SET name=COALESCE(?, name), slug=COALESCE(?, slug), description=COALESCE(?, description), order_index=COALESCE(?, order_index), name_en=COALESCE(?, name_en), description_en=COALESCE(?, description_en) WHERE id=?');
        $stmt->execute([$body['name'] ?? null, $body['slug'] ?? null, $body['description'] ?? null, $body['order_index'] ?? null, $body['name_en'] ?? null, $body['description_en'] ?? null, $args['id']]);
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
