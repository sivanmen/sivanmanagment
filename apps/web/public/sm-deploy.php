<?php
/**
 * Sivan Management — secure deploy endpoint (cPanel / PHP 8).
 *
 * Lets the website be deployed and maintained over HTTPS without FTP/cPanel access.
 * Every request must be a POST with header `X-Deploy-Token: <DEPLOY_TOKEN>`, where
 * DEPLOY_TOKEN (≥ 40 chars) is set in ~/sivanmanagment-config.php — one level ABOVE
 * the site folder, never inside it. Without a valid token the endpoint answers 404.
 *
 * Actions (?action=…):
 *   status        environment, limits, listing of the site folder
 *   archive_wp    move everything in the site folder (except .well-known, cgi-bin, this
 *                 file) to ~/sivanmanagment-wp-old-<timestamp>/  (instant, reversible)
 *   chunk         append the raw request body to an upload   (&id=…&index=…)
 *   deploy        assemble upload &id, verify &sha256, extract, back up the current site
 *                 to ~/sivanmanagment-site-prev-<ts>/, publish the new build
 *   put / get     write / read one file inside the site folder (&path=…, body = file bytes)
 *   rollback      restore the most recent ~/sivanmanagment-site-prev-* backup
 * Everything is logged to ~/sivanmanagment-deploy.log.
 */
declare(strict_types=1);
@set_time_limit(300);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$ROOT = rtrim(realpath(__DIR__) ?: __DIR__, '/');          // site folder (document root)
$HOME = dirname($ROOT);                                       // private home folder
$WORK = $HOME . '/sivanmanagment-deploy';
$LOG  = $HOME . '/sivanmanagment-deploy.log';
$KEEP = ['.well-known', 'cgi-bin', '.user.ini', 'php.ini', 'error_log', basename(__FILE__)];

function out(int $code, array $data): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }
function logl(string $m): void { global $LOG; @file_put_contents($LOG, gmdate('c') . ' ' . ($_SERVER['REMOTE_ADDR'] ?? '-') . ' ' . $m . "\n", FILE_APPEND | LOCK_EX); }

// ---------- authentication (404 on any failure, with lockout) ----------
$cfg = is_readable($HOME . '/sivanmanagment-config.php') ? (include $HOME . '/sivanmanagment-config.php') : [];
$token = is_array($cfg) ? (string) ($cfg['DEPLOY_TOKEN'] ?? '') : '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$lock = sys_get_temp_dir() . '/sm-deploy-fail-' . hash('sha256', $ip);
$fails = array_filter(array_map('intval', explode(',', (string) @file_get_contents($lock))), fn ($t) => time() - $t < 3600);
if (count($fails) >= 5) out(404, ['ok' => false]);
$given = (string) ($_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || strlen($token) < 40 || !hash_equals($token, $given)
    || (($_SERVER['HTTPS'] ?? '') !== 'on' && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') !== 'https' && !in_array($ip, ['127.0.0.1', '::1'], true))) {
    $fails[] = time(); @file_put_contents($lock, implode(',', $fails));
    out(404, ['ok' => false]);
}

// ---------- helpers ----------
function safe_path(string $rel): string {
    global $ROOT;
    $rel = ltrim(str_replace('\\', '/', $rel), '/');
    if ($rel === '' || preg_match('#(^|/)\.\.(/|$)#', $rel) || str_contains($rel, "\0")) out(400, ['ok' => false, 'error' => 'BAD_PATH']);
    return $ROOT . '/' . $rel;
}
function rrmdir(string $p): void { if (is_link($p) || is_file($p)) { @unlink($p); return; } if (!is_dir($p)) return; foreach (scandir($p) as $f) if ($f !== '.' && $f !== '..') rrmdir("$p/$f"); @rmdir($p); }
function move_entries(string $from, string $to, array $skip): array {
    @mkdir($to, 0750, true); $moved = [];
    foreach (scandir($from) as $f) { if ($f === '.' || $f === '..' || in_array($f, $skip, true)) continue;
        if (@rename("$from/$f", "$to/$f")) $moved[] = $f; else out(500, ['ok' => false, 'error' => "MOVE_FAILED:$f", 'moved' => $moved]); }
    return $moved;
}
function listing(string $dir): array { $r = []; foreach (scandir($dir) as $f) if ($f !== '.' && $f !== '..') $r[] = $f . (is_dir("$dir/$f") ? '/' : ''); return $r; }

$action = (string) ($_GET['action'] ?? 'status');
@mkdir($WORK, 0750, true);

switch ($action) {
case 'status':
    out(200, ['ok' => true, 'php' => PHP_VERSION, 'zip' => class_exists('ZipArchive'), 'root' => $ROOT,
        'upload_max' => ini_get('upload_max_filesize'), 'post_max' => ini_get('post_max_size'), 'time_limit' => ini_get('max_execution_time'),
        'disk_free_mb' => (int) (@disk_free_space($HOME) / 1048576), 'wordpress' => is_file("$ROOT/wp-config.php"),
        'site_marker' => is_file("$ROOT/sivan-web-root.txt"), 'files' => listing($ROOT),
        'backups' => array_values(array_map('basename', glob("$HOME/sivanmanagment-{wp-old,site-prev}-*", GLOB_BRACE | GLOB_ONLYDIR) ?: []))]);

case 'archive_wp':
    if (!is_file("$ROOT/wp-config.php")) out(409, ['ok' => false, 'error' => 'NO_WORDPRESS_FOUND']);
    $dest = $HOME . '/sivanmanagment-wp-old-' . gmdate('Ymd-His');
    $moved = move_entries($ROOT, $dest, $KEEP);
    logl("archive_wp → $dest (" . count($moved) . ' entries)');
    out(200, ['ok' => true, 'archived_to' => $dest, 'moved' => $moved]);

case 'chunk':
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($_GET['id'] ?? ''));
    $index = (int) ($_GET['index'] ?? -1);
    if ($id === '' || $index < 0) out(400, ['ok' => false, 'error' => 'BAD_CHUNK']);
    $part = "$WORK/$id.part";
    if ($index === 0) @unlink($part);
    $in = fopen('php://input', 'rb'); $fh = fopen($part, 'ab'); $n = stream_copy_to_stream($in, $fh); fclose($fh); fclose($in);
    out(200, ['ok' => true, 'index' => $index, 'bytes' => $n, 'total' => filesize($part)]);

case 'deploy':
    if (!class_exists('ZipArchive')) out(500, ['ok' => false, 'error' => 'NO_ZIPARCHIVE']);
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($_GET['id'] ?? ''));
    $part = "$WORK/$id.part";
    if ($id === '' || !is_file($part)) out(404, ['ok' => false, 'error' => 'NO_UPLOAD']);
    $sha = strtolower((string) ($_GET['sha256'] ?? ''));
    if (!hash_equals(hash_file('sha256', $part), $sha)) out(422, ['ok' => false, 'error' => 'CHECKSUM_MISMATCH']);
    $stage = "$WORK/stage-$id"; rrmdir($stage); mkdir($stage, 0750, true);
    $zip = new ZipArchive();
    if ($zip->open($part) !== true) out(422, ['ok' => false, 'error' => 'BAD_ZIP']);
    for ($i = 0; $i < $zip->numFiles; $i++) { $n = $zip->getNameIndex($i); if (preg_match('#(^|/)\.\.(/|$)#', $n) || str_starts_with($n, '/')) out(422, ['ok' => false, 'error' => 'UNSAFE_ZIP_ENTRY']); }
    $zip->extractTo($stage); $zip->close();
    if (!is_file("$stage/sivan-web-root.txt") || !is_file("$stage/index.html")) { rrmdir($stage); out(422, ['ok' => false, 'error' => 'NOT_A_SITE_BUILD']); }
    if (is_file("$ROOT/wp-config.php")) { rrmdir($stage); out(409, ['ok' => false, 'error' => 'WORDPRESS_PRESENT_RUN_archive_wp_FIRST']); }
    $prev = $HOME . '/sivanmanagment-site-prev-' . gmdate('Ymd-His');
    $skip = array_values(array_diff($KEEP, [basename(__FILE__)]));
    $skip[] = basename(__FILE__);
    move_entries($ROOT, $prev, $skip);                 // current site → backup
    move_entries($stage, $ROOT, [basename(__FILE__)]);  // new build → live (this file is kept as is)
    rrmdir($stage); @unlink($part);
    $prevs = glob("$HOME/sivanmanagment-site-prev-*", GLOB_ONLYDIR) ?: []; sort($prevs);
    while (count($prevs) > 3) rrmdir(array_shift($prevs));
    logl("deploy $id sha256=$sha prev=$prev");
    out(200, ['ok' => true, 'deployed' => true, 'previous_backup' => $prev, 'files' => listing($ROOT)]);

case 'put':
    $dest = safe_path((string) ($_GET['path'] ?? ''));
    if (basename($dest) === basename(__FILE__)) out(403, ['ok' => false, 'error' => 'SELF_PROTECTED']);
    @mkdir(dirname($dest), 0755, true);
    $data = file_get_contents('php://input');
    if (@file_put_contents($dest, $data, LOCK_EX) === false) out(500, ['ok' => false, 'error' => 'WRITE_FAILED']);
    logl('put ' . substr($dest, strlen($ROOT)) . ' (' . strlen((string) $data) . ' bytes)');
    out(200, ['ok' => true, 'path' => substr($dest, strlen($ROOT)), 'bytes' => strlen((string) $data)]);

case 'get':
    $src = safe_path((string) ($_GET['path'] ?? ''));
    if (!is_file($src) || filesize($src) > 2 * 1048576) out(404, ['ok' => false, 'error' => 'NOT_FOUND_OR_TOO_LARGE']);
    out(200, ['ok' => true, 'path' => substr($src, strlen($ROOT)), 'base64' => base64_encode((string) file_get_contents($src))]);

case 'rollback':
    $prevs = glob("$HOME/sivanmanagment-site-prev-*", GLOB_ONLYDIR) ?: []; sort($prevs);
    $last = end($prevs);
    if (!$last) out(404, ['ok' => false, 'error' => 'NO_BACKUP']);
    $failed = $HOME . '/sivanmanagment-site-failed-' . gmdate('Ymd-His');
    move_entries($ROOT, $failed, $KEEP);
    move_entries($last, $ROOT, [basename(__FILE__)]); @rmdir($last);
    logl("rollback to $last (failed build kept in $failed)");
    out(200, ['ok' => true, 'restored' => $last, 'failed_build' => $failed]);

default:
    out(400, ['ok' => false, 'error' => 'UNKNOWN_ACTION']);
}
