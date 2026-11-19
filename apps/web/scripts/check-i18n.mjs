// Verifies every locale has the same JSON keys/array lengths as English
// and that every English article has a translation in each locale.
// Usage: pnpm --filter web check:i18n   (exit code 1 on problems)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['he', 'el', 'fr', 'de', 'nl', 'ru', 'zh-cn'];
const root = new URL('../src/', import.meta.url).pathname;
const nsFiles = readdirSync(join(root, 'i18n/locales/en')).filter((f) => f.endsWith('.json'));
const problems = [];

function compare(a, b, path, where) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return problems.push(`${where}: ${path} should be an array`);
    if (a.length !== b.length) problems.push(`${where}: ${path} has ${b.length} items, English has ${a.length}`);
    a.forEach((v, i) => b[i] !== undefined && compare(v, b[i], `${path}[${i}]`, where));
  } else if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return problems.push(`${where}: ${path} should be an object`);
    for (const k of Object.keys(a)) {
      if (!(k in b)) problems.push(`${where}: missing ${path}.${k}`);
      else compare(a[k], b[k], `${path}.${k}`, where);
    }
  } else if (typeof a === 'string' && typeof b === 'string' && b.trim() === '') {
    problems.push(`${where}: empty string at ${path}`);
  }
}

for (const loc of LOCALES) {
  for (const f of nsFiles) {
    const p = join(root, 'i18n/locales', loc, f);
    if (!existsSync(p)) { problems.push(`${loc}: missing file ${f}`); continue; }
    compare(JSON.parse(readFileSync(join(root, 'i18n/locales/en', f), 'utf8')), JSON.parse(readFileSync(p, 'utf8')), f.replace('.json', ''), loc);
  }
  const enArticles = readdirSync(join(root, 'content/insights/en'));
  for (const a of enArticles) {
    if (!existsSync(join(root, 'content/insights', loc, a))) problems.push(`${loc}: article not translated: ${a}`);
  }
}

if (problems.length) { console.error(problems.join('\n')); console.error(`\n${problems.length} problem(s).`); process.exit(1); }
console.log(`i18n OK — ${LOCALES.length} locales × ${nsFiles.length} namespaces, articles complete.`);
