<?php
namespace App\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Support\Localization;

class FunFactController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    // GET /api/funfact – возвращает один случайный активный факт
    public function random(Request $request, Response $response): Response
    {
        $db = $this->container->get('database');
        
        // Для теста: меняем каждую минуту (используем дату и время с точностью до минуты)
        // Для продакшена: использовать дату (без времени)
        $currentMinute = date('Y-m-d H:i'); // меняется каждую минуту
        // $currentDay = date('Y-m-d'); // меняется раз в сутки (продакшен)
        
        // Выбираем факт на основе хеша от даты и количества фактов
        $stmt = $db->query("SELECT id, text, text_en FROM fun_facts WHERE is_active = true ORDER BY id");
        $facts = $stmt->fetchAll();
        
        if (empty($facts)) {
            $response->getBody()->write(json_encode(['text' => 'Интересные факты скоро появятся.']));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        // Используем хеш от даты для выбора факта
        $hash = crc32($currentMinute); // для минут
        // $hash = crc32($currentDay); // для суток
        $index = abs($hash) % count($facts);
        
        $fact = Localization::row($facts[$index], Localization::language($request), ['text']);
        $response->getBody()->write(json_encode($fact));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
