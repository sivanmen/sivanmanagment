// Remote maintenance client for public/sm-deploy.php (HTTPS, token-protected).
// Usage (token from env SM_DEPLOY_TOKEN, base URL from SM_SITE, default https://sivanmanagment.com):
//   node scripts/remote.mjs status
//   node scripts/remote.mjs clean              # move everything not in the current build to a backup folder
//   node scripts/remote.mjs deploy [zip]       # default: release/sivanmanagment-website.zip
//   node scripts/remote.mjs put <local> <remotePath>
//   node scripts/remote.mjs rollback
//   node scripts/remote.mjs purge <wp-old|site-prev|site-failed|all>
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SITE = (process.env.SM_SITE || 'https://sivanmanagment.com').replace(/\/$/, '');
const TOKEN = process.env.SM_DEPLOY_TOKEN || '';
if (TOKEN.length < 40) { console.error('Set SM_DEPLOY_TOKEN (>= 40 chars).'); process.exit(1); }

async function call(action, params = {}, body, type = 'application/octet-stream') {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${SITE}/sm-deploy.php?${qs}`, { method: 'POST', headers: { 'X-Deploy-Token': TOKEN, 'Content-Type': type }, body });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  if (!res.ok || json.ok === false) { console.error(`${action}: HTTP ${res.status}`, json); process.exit(1); }
  return json;
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'status') console.log(JSON.stringify(await call('status'), null, 2));
else if (cmd === 'clean') {
  const keep = readdirSync(root + 'dist');
  console.log(JSON.stringify(await call('clean', {}, JSON.stringify(keep), 'application/json'), null, 2));
} else if (cmd === 'deploy') {
  const zipPath = a1 || root + 'release/sivanmanagment-website.zip';
  if (!existsSync(zipPath)) { console.error('ZIP not found:', zipPath); process.exit(1); }
  const buf = readFileSync(zipPath);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const id = 'u' + randomBytes(6).toString('hex');
  const CHUNK = 4 * 1024 * 1024;
  for (let i = 0, n = 0; i < buf.length; i += CHUNK, n++) {
    const r = await call('chunk', { id, index: String(n) }, buf.subarray(i, i + CHUNK));
    process.stdout.write(`chunk ${n} → ${r.total} bytes\r`);
  }
  console.log('\n' + JSON.stringify(await call('deploy', { id, sha256 }), null, 2));
} else if (cmd === 'put') console.log(await call('put', { path: a2 }, readFileSync(a1)));
else if (cmd === 'rollback') console.log(await call('rollback'));
else if (cmd === 'purge') console.log(await call('purge_backups', { which: a1 }));
else { console.error('Unknown command. See header of scripts/remote.mjs'); process.exit(1); }
