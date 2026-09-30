<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PageEditHistoryController
{
    public function __construct(private ContainerInterface $container) {}

    public static function captureHtml(\PDO $db, string $url, string $language, string $action = 'save'): void
    {
        $stmt = $db->prepare('SELECT content, content_en FROM page_content WHERE page_url = ?');
        $stmt->execute([$url]);
        $row = $stmt->fetch() ?: [];
        self::record($db, $url, $language, 'html', ['content' => $language === 'en' ? ($row['content_en'] ?? null) : ($row['content'] ?? null)], $action, $action === 'save' ? ['Всё содержимое страницы'] : ['Отмена изменения']);
    }

    public static function captureBlocks(\PDO $db, string $url, string $language, string $action = 'save'): array
    {
        $column = $language === 'en' ? 'content_en' : 'content';
        $stmt = $db->prepare("SELECT block_id, {$column} AS content FROM page_blocks WHERE page_url = ? AND {$column} IS NOT NULL");
        $stmt->execute([$url]);
        $snapshot = [];
        foreach ($stmt->fetchAll() as $row) $snapshot[$row['block_id']] = $row['content'];
        self::record($db, $url, $language, 'blocks', $snapshot, $action, $action === 'undo' ? ['Отмена изменения блоков'] : []);
        return $snapshot;
    }

    private static function record(\PDO $db, string $url, string $language, string $type, array $snapshot, string $action, array $changedFields): void
    {
        $stmt = $db->prepare('INSERT INTO page_edit_history (page_url, language, content_type, snapshot, action, changed_fields) VALUES (?, ?, ?, ?::jsonb, ?, ?::jsonb)');
        $stmt->execute([$url, $language, $type, json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $action, json_encode($changedFields, JSON_UNESCAPED_UNICODE)]);
    }

    public static function setLastChangedFields(\PDO $db, string $url, string $language, array $fields): void
    {
        $stmt = $db->prepare("UPDATE page_edit_history SET changed_fields = ?::jsonb WHERE id = (SELECT id FROM page_edit_history WHERE page_url = ? AND language = ? AND action = 'save' ORDER BY created_at DESC LIMIT 1)");
        $stmt->execute([json_encode(array_values($fields), JSON_UNESCAPED_UNICODE), $url, $language]);
    }

    public function list(Request $request, Response $response): Response
    {
        $query = $request->getQueryParams();
        $url = (string) ($query['url'] ?? '');
        $language = ($query['lang'] ?? '') === 'en' ? 'en' : 'ru';
        if (!in_array($url, ['/index.html', '/about.html', '/visit.html', '/history.html', '/architecture.html'], true)) return $this->error($response, 'Неизвестная страница.', 400);
        $stmt = $this->container->get('database')->prepare("SELECT id, page_url, language, content_type, action, changed_fields, reverted_at, created_at, (action = 'save' AND reverted_at IS NULL) AS can_undo FROM page_edit_history WHERE page_url = ? AND language = ? ORDER BY created_at DESC LIMIT 30");
        $stmt->execute([$url, $language]);
        $items = $stmt->fetchAll();
        $undoAvailable = false;
        foreach ($items as &$item) {
            $item['changed_fields'] = json_decode($item['changed_fields'] ?: '[]', true) ?: [];
            $item['can_undo'] = !$undoAvailable && $item['action'] === 'save' && $item['reverted_at'] === null;
            if ($item['can_undo']) $undoAvailable = true;
        }
        $response->getBody()->write(json_encode(['items' => $items], JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    public function undoLatest(Request $request, Response $response, array $args): Response
    {
        $db = $this->container->get('database');
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("SELECT * FROM page_edit_history WHERE id = ? AND action = 'save' AND reverted_at IS NULL FOR UPDATE");
            $stmt->execute([$args['id']]);
            $entry = $stmt->fetch();
            if (!$entry) { $db->rollBack(); return $this->error($response, 'Это изменение уже отменено или не найдено.', 404); }
            $latest = $db->prepare("SELECT id FROM page_edit_history WHERE page_url = ? AND language = ? AND action = 'save' AND reverted_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE");
            $latest->execute([$entry['page_url'], $entry['language']]);
            if ($latest->fetchColumn() !== $entry['id']) { $db->rollBack(); return $this->error($response, 'Можно отменить только последнее изменение этой страницы.', 409); }

            $snapshot = json_decode($entry['snapshot'], true) ?: [];
            if ($entry['content_type'] === 'html') {
                self::captureHtml($db, $entry['page_url'], $entry['language'], 'undo');
                $column = $entry['language'] === 'en' ? 'content_en' : 'content';
                $stmt = $db->prepare("INSERT INTO page_content (page_url, {$column}, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (page_url) DO UPDATE SET {$column} = EXCLUDED.{$column}, updated_at = NOW()");
                $stmt->execute([$entry['page_url'], $snapshot['content'] ?? null]);
            } else {
                self::captureBlocks($db, $entry['page_url'], $entry['language'], 'undo');
                $column = $entry['language'] === 'en' ? 'content_en' : 'content';
                $stmt = $db->prepare("UPDATE page_blocks SET {$column} = NULL, updated_at = NOW() WHERE page_url = ?");
                $stmt->execute([$entry['page_url']]);
                $db->prepare('DELETE FROM page_blocks WHERE page_url = ? AND content IS NULL AND content_en IS NULL')->execute([$entry['page_url']]);
                $save = $db->prepare("INSERT INTO page_blocks (page_url, block_id, {$column}, updated_at) VALUES (?, ?, ?, NOW()) ON CONFLICT (page_url, block_id) DO UPDATE SET {$column} = EXCLUDED.{$column}, updated_at = NOW()");
                foreach ($snapshot as $blockId => $content) $save->execute([$entry['page_url'], $blockId, $content]);
            }
            $db->prepare('UPDATE page_edit_history SET reverted_at = NOW() WHERE id = ?')->execute([$entry['id']]);
            $db->commit();
            $response->getBody()->write(json_encode(['success' => true, 'page_url' => $entry['page_url'], 'language' => $entry['language']], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
        } catch (\Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            return $this->error($response, 'Не удалось отменить изменение страницы.', 500);
        }
    }

    private function error(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['error' => $message], JSON_UNESCAPED_UNICODE));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
}
