// Builds a deployable ZIP of apps/web/dist (incl. .htaccess) → apps/web/release/sivanmanagment-website.zip
// Usage: pnpm --filter web build && pnpm --filter web package
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = root + 'dist';
if (!existsSync(dist + '/sivan-web-root.txt')) { console.error('Run `pnpm --filter web build` first.'); process.exit(1); }
mkdirSync(root + 'release', { recursive: true });
const out = root + 'release/sivanmanagment-website.zip';
rmSync(out, { force: true });
execFileSync('zip', ['-qr', '-9', out, '.', '-x', '*.DS_Store'], { cwd: dist, stdio: 'inherit' });
console.log('Created', out);
