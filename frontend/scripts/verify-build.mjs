// Frontend build check: run after "vite build" to confirm the output is usable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const problems = [];

const indexPath = path.join(dist, 'index.html');
if (!fs.existsSync(indexPath)) {
  problems.push('dist/index.html is missing');
} else {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('id="root"')) problems.push('index.html has no #root element');
  if (!/assets\/[^"']+\.js/.test(html)) problems.push('index.html does not reference a JS bundle');
}

const assetsDir = path.join(dist, 'assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
if (!assets.some((f) => f.endsWith('.js'))) problems.push('no JavaScript bundle in dist/assets');
if (!assets.some((f) => f.endsWith('.css'))) problems.push('no CSS file in dist/assets');

if (problems.length > 0) {
  console.error('Frontend build check FAILED:');
  problems.forEach((p) => console.error(` - ${p}`));
  process.exit(1);
}
console.log(`Frontend build check passed (${assets.length} asset files in dist/assets).`);
