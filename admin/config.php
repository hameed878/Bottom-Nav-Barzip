<?php
// Replit proxy serves over HTTPS with a different origin than localhost.
// Session cookies must be SameSite=None;Secure so the browser sends them
// through the iframe proxy; without this every page load appears logged-out.
ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_secure', '1');
ini_set('session.cookie_httponly', '1');
session_start();

// Admin credentials — read from environment (set ADMIN_USER / ADMIN_PASS secrets)
define('ADMIN_USER', getenv('ADMIN_USER') ?: 'admin');
define('ADMIN_PASS', getenv('ADMIN_PASS') ?: 'Clear@Clear');

// DB connection — reads DATABASE_URL first, falls back to individual PG* vars
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dbUrl = getenv('DATABASE_URL');
    if ($dbUrl) {
        // Parse postgresql://user:pass@host:port/dbname?params
        $p = parse_url($dbUrl);
        if ($p === false || empty($p['host'])) {
            throw new \RuntimeException('DATABASE_URL is malformed — cannot connect to database.');
        }
        $host = $p['host'];
        $port = $p['port'] ?? 5432;
        // rawurldecode preserves literal '+' in credentials (urldecode would corrupt it)
        $user = isset($p['user']) ? rawurldecode($p['user']) : 'postgres';
        $pass = isset($p['pass']) ? rawurldecode($p['pass']) : '';
        $rawPath = isset($p['path']) ? ltrim($p['path'], '/') : '';
        $name = $rawPath !== '' ? $rawPath : 'postgres';
        // Allow sslmode override from query string; default to require for Neon
        $allowed  = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];
        $sslmode  = 'require';
        if (!empty($p['query'])) {
            parse_str($p['query'], $qs);
            if (!empty($qs['sslmode']) && in_array($qs['sslmode'], $allowed, true)) {
                $sslmode = $qs['sslmode'];
            }
        }
        $dsn = "pgsql:host=$host;port=$port;dbname=$name;sslmode=$sslmode";
    } else {
        $host = getenv('PGHOST') ?: 'localhost';
        $port = getenv('PGPORT') ?: '5432';
        $user = getenv('PGUSER') ?: 'postgres';
        $pass = getenv('PGPASSWORD') ?: '';
        $name = getenv('PGDATABASE') ?: 'postgres';
        // Force require when host is not localhost — never allow TLS downgrade in remote envs
        $sslmode = ($host === 'localhost' || $host === '127.0.0.1') ? 'prefer' : 'require';
        $dsn = "pgsql:host=$host;port=$port;dbname=$name;sslmode=$sslmode";
    }

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Bootstrap admin-specific tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_moderators (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT,
            password_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        );
        INSERT INTO admin_settings (key, value) VALUES ('usdt_price', '280.00') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('site_name', 'XRT.LLC') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('site_tagline', 'Sports Betting Platform') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('maintenance_mode', '0') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('min_deposit', '500') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('min_withdrawal', '1000') ON CONFLICT (key) DO NOTHING;
        INSERT INTO admin_settings (key, value) VALUES ('trc20_address', 'TF8XLURccFp8Tb1LFjFG33BApP9YVFp6ML') ON CONFLICT (key) DO NOTHING;
    ");
    // Bootstrap wallet_deposits table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS wallet_deposits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount_pkr NUMERIC(18,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            reject_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    ");
    // Add is_frozen column to users if the table already exists
    $tableCheck = $pdo->query("SELECT to_regclass('public.users')")->fetchColumn();
    if ($tableCheck) {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT FALSE");
    }

    return $pdo;
}

function requireLogin(): void {
    if (empty($_SESSION['admin_logged_in'])) {
        header('Location: index.php');
        exit;
    }
}

// ── CSRF helpers ────────────────────────────────────────────────────────────
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (!hash_equals(csrfToken(), $token)) {
        http_response_code(403);
        die('Invalid or missing CSRF token. Go back and try again.');
    }
}

// Shorthand: hidden input for forms
function csrfField(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrfToken()) . '">';
}

function setting(string $key, string $default = ''): string {
    try {
        $db = getDB();
        $st = $db->prepare("SELECT value FROM admin_settings WHERE key = ?");
        $st->execute([$key]);
        $row = $st->fetch();
        return $row ? $row['value'] : $default;
    } catch (Exception $e) {
        return $default;
    }
}
