<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class SiteSettingsController
{
    private ContainerInterface $container;

    private const DEFAULTS = [
        'museum_name' => 'Кердемский музей',
        'museum_name_en' => 'Kerdem Museum',
        'branch_name' => 'филиал комплекс «Самыртай» им. Р.К. Захарова',
        'branch_name_en' => 'Samyrtai Museum Complex branch named after R. K. Zakharov',
        'logo_url' => '/img/logo-samartyai.png',
        'status_mode' => 'auto',
        'opening_time' => '10:00',
        'closing_time' => '18:00',
        'open_days' => [0, 2, 3, 4, 5, 6],
    ];

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function getSettings(Request $request, Response $response): Response
    {
        $settings = self::DEFAULTS;
        $stmt = $this->container->get('database')->query('SELECT setting_key, setting_value FROM site_settings');
        foreach ($stmt->fetchAll() as $row) {
            if (array_key_exists($row['setting_key'], $settings)) {
                $settings[$row['setting_key']] = $row['setting_key'] === 'open_days'
                    ? (json_decode($row['setting_value'], true) ?? self::DEFAULTS['open_days'])
                    : $row['setting_value'];
            }
        }

        $response->getBody()->write(json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withHeader('Cache-Control', 'no-store');
    }

    public function saveSettings(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $values = [
            'museum_name' => trim((string) ($body['museum_name'] ?? '')),
            'museum_name_en' => trim((string) ($body['museum_name_en'] ?? '')),
            'branch_name' => trim((string) ($body['branch_name'] ?? '')),
            'branch_name_en' => trim((string) ($body['branch_name_en'] ?? '')),
            'logo_url' => trim((string) ($body['logo_url'] ?? '')),
            'status_mode' => (string) ($body['status_mode'] ?? ''),
            'opening_time' => (string) ($body['opening_time'] ?? ''),
            'closing_time' => (string) ($body['closing_time'] ?? ''),
            'open_days' => $body['open_days'] ?? null,
        ];

        if ($values['museum_name'] === '' || mb_strlen($values['museum_name']) > 120
            || $values['museum_name_en'] === '' || mb_strlen($values['museum_name_en']) > 120
            || $values['branch_name'] === '' || mb_strlen($values['branch_name']) > 180
            || $values['branch_name_en'] === '' || mb_strlen($values['branch_name_en']) > 180) {
            return $this->jsonError($response, 'Укажите русские и английские названия музея и филиала (до 120 и 180 символов).', 422);
        }
        if (!in_array($values['status_mode'], ['auto', 'open', 'closed'], true)) {
            return $this->jsonError($response, 'Выберите допустимый режим статуса.', 422);
        }
        if (!preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/', $values['opening_time'])
            || !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/', $values['closing_time'])
            || $values['opening_time'] >= $values['closing_time']) {
            return $this->jsonError($response, 'Укажите корректное время: открытие должно быть раньше закрытия.', 422);
        }
        if (!is_array($values['open_days']) || count($values['open_days']) < 1 || count($values['open_days']) > 7) {
            return $this->jsonError($response, 'Выберите хотя бы один рабочий день.', 422);
        }
        $openDays = [];
        foreach ($values['open_days'] as $day) {
            if (!is_scalar($day) || !ctype_digit((string) $day) || (int) $day < 0 || (int) $day > 6) {
                return $this->jsonError($response, 'В списке рабочих дней есть недопустимое значение.', 422);
            }
            $openDays[] = (int) $day;
        }
        $openDays = array_values(array_unique($openDays));
        sort($openDays);
        if (!preg_match('~^/img/(?:logo-samartyai\.png|uploads/[a-f0-9]{32}\.(?:jpg|png|webp|gif))$~i', $values['logo_url'])) {
            return $this->jsonError($response, 'Логотип должен быть стандартным логотипом или изображением, загруженным через админку.', 422);
        }

        $db = $this->container->get('database');
        $stmt = $db->prepare('INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()');
        $values['open_days'] = $openDays;
        foreach ($values as $key => $value) {
            if ($key === 'open_days') {
                $value = json_encode($value);
            }
            $stmt->execute([$key, $value]);
        }

        $response->getBody()->write(json_encode(['success' => true, 'settings' => $values], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    private function jsonError(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['error' => $message], JSON_UNESCAPED_UNICODE));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
}
