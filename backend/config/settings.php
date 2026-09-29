<?php

use function DI\factory;

return [
    'db.config' => [
        'host' => $_ENV['DB_HOST'] ?? 'db',
        'port' => $_ENV['DB_PORT'] ?? '5432',
        'dbname' => $_ENV['DB_NAME'] ?? 'museum_db',
        'user' => $_ENV['DB_USER'] ?? 'museum',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
    ],

    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? '',
        'expires' => 3600 * 8,
    ],

    'database' => factory(function (\Psr\Container\ContainerInterface $c) {
        $config = $c->get('db.config');
        $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$config['dbname']}";
        return new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }),
];
