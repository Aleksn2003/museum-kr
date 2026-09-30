<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MediaLibraryController
{
    public function __construct(private ContainerInterface $container) {}

    public function list(Request $request, Response $response): Response
    {
        $directory = '/var/www/html/uploads';
        $usage = [];
        $db = $this->container->get('database');
        foreach ($db->query("SELECT id::text, title, image_url, images::text AS images FROM exhibits") as $row) {
            $label = 'Экспонат: ' . $row['title'];
            $this->reference($usage, $row['image_url'], $label . ' (главное фото)');
            foreach (json_decode($row['images'] ?: '[]', true) ?: [] as $url) $this->reference($usage, $url, $label . ' (галерея)');
        }
        foreach ([
            ['news', 'Новость'], ['events', 'Мероприятие']
        ] as [$table, $kind]) {
            foreach ($db->query("SELECT title, image_url FROM {$table} WHERE is_deleted = false") as $row) {
                $this->reference($usage, $row['image_url'], $kind . ': ' . $row['title']);
            }
        }
        foreach ($db->query("SELECT setting_value FROM site_settings WHERE setting_key = 'logo_url'") as $row) {
            $this->reference($usage, $row['setting_value'], 'Логотип сайта');
        }
        foreach (['page_content', 'page_blocks'] as $table) {
            foreach ($db->query("SELECT page_url, content, content_en FROM {$table}") as $row) {
                foreach (['content', 'content_en'] as $column) {
                    if (preg_match_all('~(?:/img/uploads/|/uploads/)([a-f0-9]{32}\.(?:jpg|png|webp|gif))~i', $row[$column] ?? '', $matches)) {
                        foreach ($matches[1] as $filename) $this->reference($usage, '/img/uploads/' . $filename, 'Страница: ' . $row['page_url']);
                    }
                }
            }
        }

        $items = [];
        if (is_dir($directory)) {
            foreach (new \DirectoryIterator($directory) as $file) {
                if (!$file->isFile() || !preg_match('/^[a-f0-9]{32}\.(?:jpg|png|webp|gif)$/i', $file->getFilename())) continue;
                $url = '/img/uploads/' . $file->getFilename();
                $items[] = ['url' => $url, 'name' => $file->getFilename(), 'size' => $file->getSize(), 'modified_at' => gmdate(DATE_ATOM, $file->getMTime()), 'usage' => $usage[$url] ?? []];
            }
        }
        usort($items, fn($a, $b) => strcmp($b['modified_at'], $a['modified_at']));
        $response->getBody()->write(json_encode(['items' => $items], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    private function reference(array &$usage, ?string $url, string $label): void
    {
        if (!$url || !preg_match('~^/img/uploads/[a-f0-9]{32}\.(?:jpg|png|webp|gif)$~i', $url)) return;
        $usage[$url][] = $label;
    }
}
