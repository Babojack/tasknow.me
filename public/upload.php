<?php
/**
 * upload.php - File upload endpoint for TaskNow, hosted on Hostinger
 * alongside the built SPA (this file lives in public/ so `npm run build`
 * copies it verbatim into dist/, and it ends up at https://tasknow.me/upload.php).
 *
 * Auth: verifies a Firebase ID token (RS256) passed as
 * "Authorization: Bearer <token>" - no Firebase Admin SDK / Composer
 * needed, just PHP's built-in openssl extension plus Google's public
 * signing certs (fetched and cached for an hour).
 *
 * IMPORTANT: change FIREBASE_PROJECT_ID below if you ever switch Firebase
 * projects - token verification checks the token's audience/issuer against
 * this exact project id.
 */

const FIREBASE_PROJECT_ID = 'tasknowme-4dcef';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TO_EXT = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'application/pdf' => 'pdf',
];

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function fail(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

// --- Firebase ID token verification (pure PHP, no dependencies) -----------

function base64UrlDecode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function httpGet(string $url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($result !== false && $httpCode === 200) ? $result : false;
    }
    return @file_get_contents($url);
}

function getGooglePublicCerts(): array {
    $cacheFile = sys_get_temp_dir() . '/tasknow_firebase_certs.json';
    $cacheTtl = 3600;

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
        $cached = json_decode((string) file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            return $cached;
        }
    }

    $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    $json = httpGet($url);
    if ($json === false) {
        // Fall back to a stale cache rather than hard-failing every upload
        // if Google's endpoint is briefly unreachable.
        if (file_exists($cacheFile)) {
            $cached = json_decode((string) file_get_contents($cacheFile), true);
            if (is_array($cached)) {
                return $cached;
            }
        }
        return [];
    }

    $certs = json_decode($json, true);
    if (is_array($certs)) {
        @file_put_contents($cacheFile, $json);
        return $certs;
    }
    return [];
}

/**
 * Verifies a Firebase ID token's signature and standard claims.
 * Returns the decoded payload (includes 'sub' = the user's Firebase uid)
 * on success, or null if the token is missing, malformed, expired, or
 * fails signature verification.
 */
function verifyFirebaseIdToken(string $idToken, string $projectId): ?array {
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $sigB64] = $parts;

    $header = json_decode(base64UrlDecode($headerB64), true);
    $payload = json_decode(base64UrlDecode($payloadB64), true);
    $signature = base64UrlDecode($sigB64);

    if (!is_array($header) || !is_array($payload)) {
        return null;
    }
    if (($header['alg'] ?? '') !== 'RS256') {
        return null;
    }

    $kid = $header['kid'] ?? null;
    if (!$kid) {
        return null;
    }

    $certs = getGooglePublicCerts();
    if (!isset($certs[$kid])) {
        return null;
    }

    $publicKey = openssl_pkey_get_public($certs[$kid]);
    if ($publicKey === false) {
        return null;
    }

    $signedData = $headerB64 . '.' . $payloadB64;
    $verified = openssl_verify($signedData, $signature, $publicKey, OPENSSL_ALGO_SHA256);
    if ($verified !== 1) {
        return null;
    }

    $now = time();
    if (($payload['exp'] ?? 0) < $now) {
        return null; // expired
    }
    if (($payload['iat'] ?? PHP_INT_MAX) > $now + 60) {
        return null; // issued in the future (allow small clock skew)
    }
    if (($payload['aud'] ?? '') !== $projectId) {
        return null;
    }
    if (($payload['iss'] ?? '') !== "https://securetoken.google.com/{$projectId}") {
        return null;
    }
    if (empty($payload['sub'])) {
        return null;
    }

    return $payload;
}

// --- Auth check -------------------------------------------------------------

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (!preg_match('/^Bearer\s+(.+)$/', $authHeader, $matches)) {
    fail(401, 'Missing bearer token');
}

$payload = verifyFirebaseIdToken($matches[1], FIREBASE_PROJECT_ID);
if (!$payload) {
    fail(401, 'Invalid or expired token');
}
$uid = $payload['sub'];

// --- File validation ---------------------------------------------------------

if (!isset($_FILES['file'])) {
    fail(400, 'No file uploaded');
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    fail(400, 'Upload error (code ' . $file['error'] . ')');
}
if ($file['size'] > MAX_FILE_SIZE) {
    fail(400, 'File too large (max 10 MB)');
}

// Sniff the actual file content - never trust the client-supplied
// filename/extension or Content-Type header (that's how you get a ".jpg"
// that's actually a PHP shell). The saved file's extension is derived
// only from this verified MIME type.
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset(ALLOWED_MIME_TO_EXT[$mime])) {
    fail(400, 'File type not allowed: ' . $mime);
}
$ext = ALLOWED_MIME_TO_EXT[$mime];

// --- Save the file ---------------------------------------------------------

$uidSafe = preg_replace('/[^a-zA-Z0-9_-]/', '', $uid);
$safeName = time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;

$uploadDir = __DIR__ . "/uploads/{$uidSafe}";
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    fail(500, 'Could not create upload directory');
}

$destPath = "{$uploadDir}/{$safeName}";
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    fail(500, 'Failed to save file');
}

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$fileUrl = "{$protocol}://{$host}/uploads/{$uidSafe}/{$safeName}";

echo json_encode(['file_url' => $fileUrl]);
