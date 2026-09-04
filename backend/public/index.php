<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Dotenv\Dotenv;

// Загрузка .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Контейнер PHP-DI
$containerBuilder = new ContainerBuilder();
$containerBuilder->addDefinitions(__DIR__ . '/../config/settings.php');
$container = $containerBuilder->build();

AppFactory::setContainer($container);
$app = AppFactory::create();

// Middleware (CORS, JSON)
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

// Подключение маршрутов
(require __DIR__ . '/../src/routes.php')($app);

$app->run();