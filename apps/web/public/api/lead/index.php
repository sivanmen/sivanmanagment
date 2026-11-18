<?php
/**
 * POST /api/lead/ — property-assessment requests from the website (cPanel / PHP 8).
 *
 * Delivery (any that is configured; e-mail works out of the box on cPanel):
 *   1. E-mail to LEAD_EMAIL_TO (default support@sivanmanagment.com) via PHP mail()
 *   2. Airtable (AIRTABLE_TOKEN + AIRTABLE_BASE_ID [+ AIRTABLE_TABLE])
 *   3. Webhook (LEAD_WEBHOOK_URL), e.g. an n8n flow
 *   + a backup line in a JSONL file outside the web root.
 *
 * Secrets live OUTSIDE the web root in ~/sivanmanagment-config.php (see
 * docs/website/DEPLOYMENT.md) — never in this file or in the repository.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------- configuration ----------
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 2), '/');
$privateDir = dirname($docRoot); // e.g. /home/<user> — not web-accessible
$config = [
    'LEAD_EMAIL_TO'   => 'support@sivanmanagment.com',
    'LEAD_EMAIL_FROM' => 'website@sivanmanagment.com',
    'ALLOWED_ORIGINS' => ['https://sivanmanagment.com', 'https://www.sivanmanagment.com'],
    'AIRTABLE_TOKEN'  => '',
    'AIRTABLE_BASE_ID'=> '',
    'AIRTABLE_TABLE'  => 'Leads',
    'LEAD_WEBHOOK_URL'=> '',
    'LOG_FILE'        => $privateDir . '/sivanmanagment-leads.jsonl',
];
$configFile = $privateDir . '/sivanmanagment-config.php';
if (is_readable($configFile)) {
    $local = include $configFile;
    if (is_array($local)) $config = array_merge($config, $local);
}

// ---------- request checks ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(405, ['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $config['ALLOWED_ORIGINS'], true)) respond(403, ['ok' => false, 'error' => 'FORBIDDEN']);

$raw = file_get_contents('php://input', false, null, 0, 20000) ?: '';
$in = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;
if (!is_array($in) || !$in) respond(400, ['ok' => false, 'error' => 'BAD_REQUEST']);

// Rate limit: 5 submissions / 10 minutes / IP (file-based, private dir).
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = sys_get_temp_dir() . '/sm-lead-' . hash('sha256', $ip . __FILE__);
$now = time();
$hits = array_filter(array_map('intval', explode(',', (string) @file_get_contents($rlFile))), fn ($t) => $now - $t < 600);
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits), LOCK_EX);
if (count($hits) > 5) respond(429, ['ok' => false, 'error' => 'RATE_LIMITED']);

// ---------- validation ----------
$enum = function (string $key, array $allowed, ?string $default = null) use ($in) {
    $v = isset($in[$key]) ? (string) $in[$key] : $default;
    return in_array($v, $allowed, true) ? $v : null;
};
$str = function (string $key, int $max) use ($in): string {
    $v = isset($in[$key]) && is_scalar($in[$key]) ? trim((string) $in[$key]) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
};
$SERVICES = ['short-term-rental-management','long-term-rental-management','commercial-property-management',
    'hotel-hospitality-management','property-maintenance','asset-management','property-marketing-sales'];

$errors = [];
$lead = [
    'locale'       => $enum('locale', ['en','he','el','fr','de','nl','ru','zh-cn'], 'en') ?? 'en',
    'propertyType' => $enum('propertyType', ['short-term','long-term','commercial','hospitality','not-sure']),
    'units'        => max(1, min(500, (int) ($in['units'] ?? 1))),
    'location'     => $enum('location', ['chania','rethymno','heraklion','other']),
    'area'         => $str('area', 120),
    'status'       => $enum('status', ['rented','vacant','renovation','managed']) ?? '',
    'services'     => array_values(array_intersect((array) ($in['services'] ?? []), $SERVICES)),
    'goals'        => $str('goals', 2000),
    'name'         => $str('name', 120),
    'email'        => $str('email', 160),
    'phone'        => $str('phone', 40),
    'preferred'    => $enum('preferred', ['email','phone','whatsapp'], 'email') ?? 'email',
    'source'       => $str('source', 1500),
];
if (!$lead['propertyType']) $errors[] = 'propertyType';
if (!$lead['location']) $errors[] = 'location';
if (mb_strlen($lead['name']) < 2) $errors[] = 'name';
if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if ($lead['phone'] !== '' && !preg_match('/^[+()\d\s.\-]*$/', $lead['phone'])) $errors[] = 'phone';
if (($in['consent'] ?? '') !== 'yes') $errors[] = 'consent';
if ($errors) respond(422, ['ok' => false, 'error' => 'VALIDATION_ERROR', 'fields' => $errors]);

// Bots: honeypot filled or implausibly fast submission → pretend success.
$startedAt = (int) ($in['startedAt'] ?? 0);
if (($in['website'] ?? '') !== '' || ($startedAt > 0 && (int) (microtime(true) * 1000) - $startedAt < 2500)) {
    respond(200, ['ok' => true]);
}

$record = [
    'Name' => $lead['name'], 'Email' => $lead['email'], 'Phone' => $lead['phone'],
    'Preferred Contact' => $lead['preferred'], 'Property Type' => $lead['propertyType'],
    'Units' => $lead['units'], 'Location' => $lead['location'], 'Area' => $lead['area'],
    'Current Status' => $lead['status'], 'Services' => implode(', ', $lead['services']),
    'Goals' => $lead['goals'], 'Locale' => $lead['locale'], 'Source' => $lead['source'],
    'Consent' => true, 'Consent At' => gmdate('c'), 'Status' => 'New',
];

$delivered = false;

// ---------- 1. e-mail ----------
if ($config['LEAD_EMAIL_TO']) {
    $lines = [];
    foreach ($record as $k => $v) $lines[] = str_pad($k . ':', 20) . (is_bool($v) ? ($v ? 'yes' : 'no') : (string) $v);
    $body = "New property assessment request from sivanmanagment.com\n\n" . implode("\n", $lines) . "\n";
    $subject = '=?UTF-8?B?' . base64_encode('New lead: ' . $lead['name'] . ' — ' . $lead['propertyType'] . ' / ' . $lead['location']) . '?=';
    $replyTo = preg_replace('/[\r\n]/', '', $lead['email']);
    $headers = implode("\r\n", [
        'From: Sivan Management Website <' . $config['LEAD_EMAIL_FROM'] . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    if (@mail($config['LEAD_EMAIL_TO'], $subject, $body, $headers, '-f' . $config['LEAD_EMAIL_FROM'])) $delivered = true;
    else error_log('[lead] mail() failed');
}

// ---------- 2/3. Airtable + webhook ----------
$post = function (string $url, array $payload, array $headers = []): bool {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300) error_log("[lead] POST $url → HTTP $code");
    return $code >= 200 && $code < 300;
};
if ($config['AIRTABLE_TOKEN'] && $config['AIRTABLE_BASE_ID'] && function_exists('curl_init')) {
    $url = 'https://api.airtable.com/v0/' . rawurlencode($config['AIRTABLE_BASE_ID']) . '/' . rawurlencode($config['AIRTABLE_TABLE']);
    if ($post($url, ['records' => [['fields' => $record]], 'typecast' => true], ['Authorization: Bearer ' . $config['AIRTABLE_TOKEN']])) $delivered = true;
}
if ($config['LEAD_WEBHOOK_URL'] && function_exists('curl_init')) {
    if ($post($config['LEAD_WEBHOOK_URL'], $record)) $delivered = true;
}

// ---------- backup log (outside web root) ----------
if ($config['LOG_FILE'] && @file_put_contents($config['LOG_FILE'], json_encode($record, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false) {
    @chmod($config['LOG_FILE'], 0600);
    $delivered = true;
}

$delivered ? respond(200, ['ok' => true]) : respond(502, ['ok' => false, 'error' => 'DELIVERY_FAILED']);
