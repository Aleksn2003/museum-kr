<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ScheduleExceptionsController
{
    public function __construct(private ContainerInterface $container) {}

    public function publicList(Request $request, Response $response): Response
    {
        $stmt = $this->container->get('database')->query('SELECT exception_date, is_open, opening_time, closing_time, label FROM schedule_exceptions WHERE exception_date >= (NOW() AT TIME ZONE \'Asia/Yakutsk\')::date ORDER BY exception_date LIMIT 120');
        $items = $stmt->fetchAll();
        foreach ($items as &$item) $item['is_open'] = in_array($item['is_open'], [true, 't', '1', 1], true);
        $response->getBody()->write(json_encode($items, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    public function adminList(Request $request, Response $response): Response
    {
        $stmt = $this->container->get('database')->query('SELECT id, exception_date, is_open, opening_time, closing_time, label, updated_at FROM schedule_exceptions ORDER BY exception_date DESC');
        $items = $stmt->fetchAll();
        foreach ($items as &$item) $item['is_open'] = in_array($item['is_open'], [true, 't', '1', 1], true);
        $response->getBody()->write(json_encode($items, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    public function save(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody() ?: [];
        $date = (string) ($body['exception_date'] ?? '');
        $label = trim((string) ($body['label'] ?? ''));
        $isOpen = filter_var($body['is_open'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $opening = (string) ($body['opening_time'] ?? '');
        $closing = (string) ($body['closing_time'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4)) || $label === '' || mb_strlen($label) > 180) return $this->error($response, 'Укажите корректную дату и причину исключения (до 180 символов).', 422);
        if ($isOpen && (!preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/', $opening) || !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/', $closing) || $opening >= $closing)) return $this->error($response, 'Для рабочего дня укажите время открытия раньше времени закрытия.', 422);
        $db = $this->container->get('database');
        $stmt = $db->prepare('INSERT INTO schedule_exceptions (exception_date, is_open, opening_time, closing_time, label, updated_at) VALUES (?, ?, ?, ?, ?, NOW()) ON CONFLICT (exception_date) DO UPDATE SET is_open = EXCLUDED.is_open, opening_time = EXCLUDED.opening_time, closing_time = EXCLUDED.closing_time, label = EXCLUDED.label, updated_at = NOW() RETURNING id');
        $stmt->execute([$date, $isOpen ? 'true' : 'false', $isOpen ? $opening : null, $isOpen ? $closing : null, $label]);
        $response->getBody()->write(json_encode(['success' => true, 'id' => $stmt->fetchColumn()]));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->container->get('database')->prepare('DELETE FROM schedule_exceptions WHERE id = ?');
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    private function error(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['error' => $message], JSON_UNESCAPED_UNICODE));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
}
