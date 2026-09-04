<?php
namespace App\Controllers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $container) {
        $this->container = $container;
    }

    public function login(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';

        $db = $this->container->get('database');
        $stmt = $db->prepare('SELECT id, username, password FROM admins WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($password, $admin['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Неверные учетные данные']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $secret = $this->container->get('jwt')['secret'];
        $expires = $this->container->get('jwt')['expires'];
        $payload = [
            'sub' => $admin['id'],
            'username' => $admin['username'],
            'iat' => time(),
            'exp' => time() + $expires,
        ];

        $token = JWT::encode($payload, $secret, 'HS256');
        $data = ['token' => $token];
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }
}