<?php
declare(strict_types=1);

$password = $_ENV['ADMIN_PASSWORD'] ?? getenv('ADMIN_PASSWORD');
if (!is_string($password) || strlen($password) < 16) {
    fwrite(STDERR, "ADMIN_PASSWORD must contain at least 16 characters.\n");
    exit(1);
}

$dsn = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s',
    $_ENV['DB_HOST'] ?? 'db',
    $_ENV['DB_PORT'] ?? '5432',
    $_ENV['DB_NAME'] ?? 'museum_db'
);
$db = new PDO($dsn, $_ENV['DB_USER'] ?? 'museum', $_ENV['DB_PASSWORD'] ?? '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

// Older installations did not create this table, although the API uses it.
$db->exec('CREATE TABLE IF NOT EXISTS page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    block_id TEXT NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_url, block_id)
)');

$existing = $db->query("SELECT password FROM admins WHERE username = 'admin'")->fetchColumn();
$knownDefaultHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
$hash = password_hash($password, PASSWORD_DEFAULT);

if ($existing === false) {
    $stmt = $db->prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    $stmt->execute(['admin', $hash]);
} elseif ($existing === $knownDefaultHash) {
    $stmt = $db->prepare('UPDATE admins SET password = ? WHERE username = ?');
    $stmt->execute([$hash, 'admin']);
}
