#!/usr/bin/env node
/**
 * Genera sitemap.xml recorriendo los .html del sitio (raiz y /blog).
 *
 * Reglas:
 *  - Se excluye cualquier pagina con <meta name="robots" content="noindex">.
 *  - La URL sale de la <link rel="canonical"> de cada pagina. Si una pagina
 *    no tiene canonical, se avisa y se omite: preferimos un sitemap corto
 *    y correcto antes que uno largo con URLs inventadas.
 *  - <lastmod> usa la fecha del ultimo commit que toco el archivo; si git
 *    no esta disponible, la fecha de modificacion del archivo.
 *
 * Uso: node scripts/build-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['.', 'blog'];
const OUT = path.join(ROOT, 'sitemap.xml');

// Prioridad por tipo de pagina. Es una señal debil para Google, pero
// comunica la jerarquia del sitio y no cuesta nada mantenerla.
function priorityFor(rel) {
  if (rel === 'index.html') return '1.0';
  if (/^Gestion de /.test(rel)) return '0.9';
  if (/^Servicio de Diagnostico/.test(rel)) return '0.9';
  if (rel === 'blog/index.html') return '0.8';
  if (rel.startsWith('blog/')) return '0.7';
  if (/^(Agendar|Cronograma|Respaldo)/.test(rel)) return '0.6';
  return '0.4';
}

function changefreqFor(rel) {
  if (rel === 'index.html' || rel === 'blog/index.html') return 'weekly';
  if (rel.startsWith('blog/')) return 'monthly';
  return 'monthly';
}

function lastmodFor(abs) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${abs}"`, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (out) return out.slice(0, 10);
  } catch {
    /* git no disponible: caemos al mtime */
  }
  return fs.statSync(abs).mtime.toISOString().slice(0, 10);
}

const entries = [];
const skipped = [];

for (const dir of SCAN_DIRS) {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) continue;

  for (const name of fs.readdirSync(absDir)) {
    if (!name.endsWith('.html')) continue;
    const rel = dir === '.' ? name : `${dir}/${name}`;
    const abs = path.join(ROOT, rel);
    const html = fs.readFileSync(abs, 'utf8');

    if (/<meta name="robots"[^>]*content="[^"]*noindex/i.test(html)) {
      skipped.push(`${rel} (noindex)`);
      continue;
    }

    const match = html.match(/<link rel="canonical" href="([^"]+)"/i);
    if (!match) {
      skipped.push(`${rel} (sin canonical)`);
      continue;
    }

    entries.push({
      loc: match[1],
      lastmod: lastmodFor(abs),
      priority: priorityFor(rel),
      changefreq: changefreqFor(rel),
    });
  }
}

entries.sort((a, b) => Number(b.priority) - Number(a.priority) || a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(OUT, xml);

console.log(`sitemap.xml generado con ${entries.length} URLs`);
if (skipped.length) console.log(`omitidas: ${skipped.join(', ')}`);
