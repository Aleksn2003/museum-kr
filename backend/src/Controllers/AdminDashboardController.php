<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AdminDashboardController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function overview(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        $counts = [
            'exhibits' => (int) $db->query('SELECT COUNT(*) FROM exhibits')->fetchColumn(),
            'news' => $this->statusCounts($db, 'news'),
            'events' => $this->statusCounts($db, 'events'),
        ];

        $nextEvent = $db->query("SELECT id, title, start_date, location FROM events WHERE is_deleted = false AND publication_status = 'published' AND COALESCE(end_date, start_date) >= NOW() ORDER BY start_date ASC LIMIT 1")->fetch() ?: null;

        $changes = $db->query("
            SELECT item_type, title, changed_at FROM (
                SELECT 'Экспонат' AS item_type, title, updated_at AS changed_at FROM exhibits
                UNION ALL
                SELECT 'Новость', title, updated_at FROM news WHERE is_deleted = false
                UNION ALL
                SELECT 'Мероприятие', title, updated_at FROM events WHERE is_deleted = false
                UNION ALL
                SELECT 'Страница', page_url, updated_at FROM page_content
                UNION ALL
                SELECT 'Страница', page_url, MAX(updated_at) FROM page_blocks GROUP BY page_url
                UNION ALL
                SELECT 'Настройки', 'Настройки сайта', MAX(updated_at) FROM site_settings
            ) changes
            WHERE changed_at IS NOT NULL
            ORDER BY changed_at DESC
            LIMIT 8
        ")->fetchAll();

        $schedule = [
            'status_mode' => 'auto',
            'opening_time' => '10:00',
            'closing_time' => '18:00',
            'open_days' => [0, 2, 3, 4, 5, 6],
        ];
        $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('status_mode', 'opening_time', 'closing_time', 'open_days')");
        foreach ($stmt->fetchAll() as $row) {
            $schedule[$row['setting_key']] = $row['setting_key'] === 'open_days'
                ? (json_decode($row['setting_value'], true) ?: $schedule['open_days'])
                : $row['setting_value'];
        }
        $exception = $db->query("SELECT is_open, opening_time, closing_time, label FROM schedule_exceptions WHERE exception_date = (NOW() AT TIME ZONE 'Asia/Yakutsk')::date LIMIT 1")->fetch() ?: null;
        if ($exception) {
            $exception['is_open'] = in_array($exception['is_open'], [true, 't', '1', 1], true);
            $schedule['exception'] = $exception;
        } else {
            $schedule['exception'] = null;
        }

        $response->getBody()->write(json_encode([
            'counts' => $counts,
            'next_event' => $nextEvent,
            'schedule' => $schedule,
            'recent_changes' => $changes,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    private function statusCounts(\PDO $db, string $table): array
    {
        $result = ['total' => 0, 'draft' => 0, 'published' => 0, 'hidden' => 0];
        $stmt = $db->query("SELECT publication_status, COUNT(*) AS count FROM {$table} WHERE is_deleted = false GROUP BY publication_status");
        foreach ($stmt->fetchAll() as $row) {
            $status = $row['publication_status'];
            if (isset($result[$status])) $result[$status] = (int) $row['count'];
            $result['total'] += (int) $row['count'];
        }
        return $result;
    }
}
