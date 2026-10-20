/* Builds the static, crawlable pages from src/template.html + assets/js/data.js.
   Run after every content change:   node scripts/build.mjs
   Writes: index.html, cinematic/, about/, work/<id>/, 404.html, sitemap.xml, robots.txt,
   and bumps the ?v= cache-busting version in app.js. No dependencies. */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
const imp = p => import(pathToFileURL(join(ROOT, p)).href + `?v=${VERSION}`);
const { STUDIO, cinematic, info } = await imp('assets/js/data.js');
const { listHTML, workHTML, pageMeta, jsonLdScript, pad, esc } = await imp('assets/js/render.js');

const tpl = readFileSync(join(ROOT, 'src/template.html'), 'utf8');
const LIST = [...cinematic.map(w => ({ ...w, kind: 'cinematic' })), { ...info, kind: 'info' }];
const today = new Date().toISOString().slice(0, 10);

function page({ out, base, view, w = null, robots = 'index, follow, max-image-preview:large, max-video-preview:-1', absBase = false }) {
  const meta = pageMeta({ view, w, studio: STUDIO, cinematic });
  const i = w ? LIST.findIndex(x => x.id === w.id) : 0;
  const detail = !!w;
  const html = tpl
    .replaceAll('{{BASE}}', absBase ? STUDIO.url : base)
    .replaceAll('{{TITLE}}', esc(meta.title))
    .replaceAll('{{DESCRIPTION}}', esc(meta.description))
    .replaceAll('{{CANONICAL}}', meta.url)
    .replaceAll('{{IMAGE}}', meta.image)
    .replaceAll('{{OG_TYPE}}', meta.type)
    .replaceAll('{{ROBOTS}}', robots)
    .replaceAll('{{JSONLD}}', jsonLdScript(meta))
    .replaceAll('{{VIEW}}', view)
    .replaceAll('{{PAGE}}', view === 'home' ? 'home' : w && w.kind === 'info' ? 'about' : 'cinematic')
    .replaceAll('{{HERO_TAG}}', view === 'home' ? 'h1' : 'p')
    .replaceAll('{{COLUMN_CLASS}}', view === 'home' ? 'column' : `column is-open${detail ? ' is-detail' : ''}`)
    .replaceAll('{{COLUMN_HIDDEN}}', view === 'home' ? ' hidden' : '')
    .replaceAll('{{COUNT_A}}', pad(i + 1))
    .replaceAll('{{COUNT_B}}', pad(LIST.length))
    .replaceAll('{{LIST}}', listHTML(LIST, 'cinematic'))
    .replaceAll('{{WORK}}', w ? workHTML(w, { index: i, next: LIST[(i + 1) % LIST.length], side: 'cinematic', studio: STUDIO }) : '')
    .replaceAll('{{VERSION}}', VERSION)
    // the full-screen noscript note only belongs on the home page; the others show their content
    .replace(view === 'home' ? /^(?!)/ : /\n  <noscript>[\s\S]*?<\/noscript>\n/, '\n');
  const file = join(ROOT, out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  return meta.url;
}

// clean old generated work pages
if (existsSync(join(ROOT, 'work'))) rmSync(join(ROOT, 'work'), { recursive: true });

const urls = [];
urls.push([page({ out: 'index.html', base: './', view: 'home' }), '1.0']);
urls.push([page({ out: 'cinematic/index.html', base: '../', view: 'cinematic' }), '0.9']);
for (const w of LIST.filter(x => x.kind === 'cinematic')) {
  urls.push([page({ out: `work/${w.id}/index.html`, base: '../../', view: 'cinematic', w }), '0.8']);
}
urls.push([page({ out: 'about/index.html', base: '../', view: 'cinematic', w: LIST.find(x => x.kind === 'info') }), '0.8']);
page({ out: '404.html', view: 'home', robots: 'noindex', absBase: true });

writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${STUDIO.url}sitemap.xml\n`);

// cache-busting: every module import in app.js carries the build version
const appPath = join(ROOT, 'assets/js/app.js');
writeFileSync(appPath, readFileSync(appPath, 'utf8').replace(/\.js\?v=[\w]+'/g, `.js?v=${VERSION}'`));

console.log(`built ${urls.length} pages + 404, version ${VERSION}`);
urls.forEach(([u]) => console.log('  ' + u));
