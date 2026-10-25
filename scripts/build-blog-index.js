#!/usr/bin/env node
/**
 * Genera blog/index.html leyendo los articulos que existen en /blog.
 *
 * De cada articulo toma:
 *   <title>                              -> titulo de la tarjeta
 *   <meta name="description">            -> resumen
 *   <meta property="article:section">    -> cluster (filtro)
 *   <meta property="article:published_time"> -> orden cronologico
 *
 * Asi el indice nunca se desincroniza: se agrega un articulo y se
 * vuelve a correr. El build de Vercel lo ejecuta antes del sitemap.
 *
 * Uso: node scripts/build-blog-index.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const ORDEN_CLUSTERS = ['Google Ads', 'Meta Ads', 'SEO', 'Rentabilidad'];

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : '';
}

const posts = fs
  .readdirSync(BLOG)
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .map((file) => {
    const html = fs.readFileSync(path.join(BLOG, file), 'utf8');
    return {
      file,
      title: pick(html, /<title>([^<]*)<\/title>/).replace(/\s*[·|]\s*CSeekers.*$/, ''),
      desc: pick(html, /<meta name="description" content="([^"]*)"/),
      cluster: pick(html, /<meta property="article:section" content="([^"]*)"/) || 'Rentabilidad',
      date: pick(html, /<meta property="article:published_time" content="([^"]*)"/),
    };
  })
  .sort((a, b) => {
    const ia = ORDEN_CLUSTERS.indexOf(a.cluster);
    const ib = ORDEN_CLUSTERS.indexOf(b.cluster);
    if (ia !== ib) return ia - ib;
    return a.title.localeCompare(b.title, 'es');
  });

const clusters = ORDEN_CLUSTERS.filter((c) => posts.some((p) => p.cluster === c));

const filtros = ['Todos', ...clusters]
  .map(
    (c, i) =>
      `      <button type="button" data-filtro="${c === 'Todos' ? 'todos' : c}" aria-pressed="${
        i === 0 ? 'true' : 'false'
      }">${c}</button>`
  )
  .join('\n');

const items = posts
  .map(
    (p) => `      <li data-cluster="${p.cluster}">
        <a href="${encodeURIComponent(p.file)}">
          <span class="hub-cluster">${p.cluster}</span>
          <div>
            <h2>${p.title}</h2>
            <p>${p.desc}</p>
          </div>
        </a>
      </li>`
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog · Google Ads, Meta Ads y SEO con criterio de margen · CSeekers</title>
<meta name="description" content="Articulos sobre Google Ads, Meta Ads y SEO escritos desde dentro de cuentas reales: que cobra una agencia, como auditarla y como medir rentabilidad y no vanidad." />
<link rel="canonical" href="https://www.cseekers.com/blog/index.html" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CSeekers" />
<meta property="og:url" content="https://www.cseekers.com/blog/index.html" />
<meta property="og:title" content="Blog · Google Ads, Meta Ads y SEO con criterio de margen · CSeekers" />
<meta property="og:image" content="https://www.cseekers.com/assets/og-index.webp" />
<meta property="og:description" content="Articulos sobre Google Ads, Meta Ads y SEO escritos desde dentro de cuentas reales." />
<meta property="og:locale" content="es_MX" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css" />
<link rel="stylesheet" href="blog.css" />
<script type="application/ld+json">
${JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        name: 'Blog de CSeekers',
        description:
          'Articulos sobre Google Ads, Meta Ads y SEO escritos desde dentro de cuentas reales.',
        url: 'https://www.cseekers.com/blog/index.html',
        inLanguage: 'es-MX',
        publisher: { '@type': 'Organization', name: 'CSeekers', url: 'https://www.cseekers.com/' },
      },
      {
        '@type': 'ItemList',
        itemListElement: posts.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.title,
          url: `https://www.cseekers.com/blog/${encodeURIComponent(p.file)}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.cseekers.com/' },
          { '@type': 'ListItem', position: 2, name: 'Blog' },
        ],
      },
    ],
  },
  null,
  2
)}
</script>
</head>
<body class="blog-body blog">
<a href="#contenido" class="blog-skip">Saltar al contenido</a>

<nav class="blog-nav">
  <div class="blog-nav-inner">
    <a href="../index.html" aria-label="CSeekers inicio"><img src="../assets/cseekers-logo-black.png" alt="CSeekers" /></a>
    <div class="blog-nav-links">
      <a href="../Gestion%20de%20Google%20Ads.html">Google Ads</a>
      <a href="../Gestion%20de%20Meta%20Ads.html">Meta Ads</a>
      <a href="../Gestion%20de%20SEO.html">SEO</a>
      <a href="../Servicio%20de%20Diagnostico.html">Diagnostico</a>
      <a href="../Agendar%20Sesion.html" class="blog-nav-cta">Agendar llamada</a>
    </div>
  </div>
</nav>

<main id="contenido" class="blog-wrap">
  <nav class="blog-crumbs" aria-label="Ruta de navegacion">
    <a href="../index.html">Inicio</a><span>/</span>Blog
  </nav>

  <div class="hub-head">
    <h1>Lo que casi nadie te dice de tu pauta y tu SEO.</h1>
    <p>Articulos escritos desde dentro de cuentas reales, con presupuesto real y margen real en juego. Sin humo, sin ROAS de vanidad y sin prometer lo que no se puede sostener.</p>
  </div>

  <div class="hub-filters" role="group" aria-label="Filtrar por tema">
${filtros}
  </div>

  <ul class="hub-list">
${items}
  </ul>
</main>

<footer class="blog-footer">
  <div class="blog-footer-inner">
    <img src="../assets/cseekers-logo-black.png" alt="CSeekers" />
    <div class="tag">Consistency Seekers · Google Ads · Meta Ads · SEO</div>
    <div class="blog-footer-links">
      <a href="../index.html">Inicio</a>
      <a href="../Respaldo%20y%20sustento.html">Respaldo</a>
      <a href="../Aviso%20de%20Privacidad.html">Aviso de privacidad</a>
    </div>
  </div>
  <div class="blog-footer-copy">© 2026 Consistency Seekers. Todos los derechos reservados.</div>
</footer>

<script>
  // Filtro por cluster. Sin dependencias: muestra u oculta <li>.
  const botones = document.querySelectorAll('.hub-filters button');
  const filas = document.querySelectorAll('.hub-list li');
  botones.forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.dataset.filtro;
      botones.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      filas.forEach((li) => {
        li.hidden = f !== 'todos' && li.dataset.cluster !== f;
      });
    });
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(BLOG, 'index.html'), html);
console.log(`blog/index.html generado con ${posts.length} articulos (${clusters.join(', ')})`);
