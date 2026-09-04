<?php
namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware implements MiddlewareInterface
{
    private string $secret;
    
    public function __construct(string $secret) {
        $this->secret = $secret;
    }

    public function process(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');
        if (empty($header) || !str_starts_with($header, 'Bearer ')) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(['error' => 'Требуется авторизация']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $token = substr($header, 7);
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            $request = $request->withAttribute('admin', $decoded);
            return $handler->handle($request);
        } catch (\Exception $e) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(['error' => 'Неверный токен']));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }
    }
}