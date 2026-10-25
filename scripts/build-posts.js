#!/usr/bin/env node
/**
 * Genera los articulos del blog a partir de /content/blog/<slug>.html
 *
 * Cada archivo fuente tiene dos partes:
 *
 *   <!--meta
 *   { "title": "...", "h1": "...", "desc": "...", "cluster": "SEO",
 *     "date": "2026-10-25", "min": 8, "lead": "...",
 *     "faq": [ { "q": "...", "a": "..." } ],
 *     "related": [ "slug-de-otro-post", "../Gestion%20de%20SEO.html|SEO|Titulo" ] }
 *   -->
 *   <p>...cuerpo del articulo en HTML...</p>
 *
 * El script se encarga de todo lo repetitivo y facil de equivocar:
 *   - <head> completo con canonical autorreferencial, robots y Open Graph
 *   - JSON-LD de Article + BreadcrumbList + FAQPage (desde el array faq,
 *     para que el schema y el HTML visible nunca se desincronicen)
 *   - tabla de contenidos automatica leyendo los <h2 id> del cuerpo
 *   - nav, CTA, relacionados y footer
 *
 * Uso: node scripts/build-posts.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content', 'blog');
const OUT = path.join(ROOT, 'blog');
const ORIGIN = 'https://www.cseekers.com';

const CLUSTER_LABEL = {
  'Google Ads': 'Google Ads',
  'Meta Ads': 'Meta Ads',
  SEO: 'SEO',
  Rentabilidad: 'Rentabilidad',
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON-LD: escapamos solo lo que rompe el bloque <script>
const jsonText = (s) => String(s).replace(/<\/script/gi, '<\\/script').replace(/\s+/g, ' ').trim();

function parseSource(file) {
  const raw = fs.readFileSync(path.join(SRC, file), 'utf8');
  const m = raw.match(/<!--meta([\s\S]*?)-->/);
  if (!m) throw new Error(`${file}: falta el bloque <!--meta ... -->`);
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`${file}: el bloque meta no es JSON valido (${e.message})`);
  }
  const body = raw.slice(m.index + m[0].length).trim();
  const slug = file.replace(/\.html$/, '');
  return { slug, meta, body };
}

function tocFrom(body) {
  const out = [];
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  let m;
  while ((m = re.exec(body))) {
    out.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() });
  }
  return out;
}

const NAV = `<nav class="blog-nav">
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
</nav>`;

const FOOTER = `<footer class="blog-footer">
  <div class="blog-footer-inner">
    <img src="../assets/cseekers-logo-black.png" alt="CSeekers" />
    <div class="tag">Consistency Seekers · Google Ads · Meta Ads · SEO</div>
    <div class="blog-footer-links">
      <a href="../index.html">Inicio</a>
      <a href="index.html">Blog</a>
      <a href="../Respaldo%20y%20sustento.html">Respaldo</a>
      <a href="../Aviso%20de%20Privacidad.html">Aviso de privacidad</a>
    </div>
  </div>
  <div class="blog-footer-copy">© 2026 Consistency Seekers. Todos los derechos reservados.</div>
</footer>`;

const FECHA_LARGA = (iso) => {
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y, mo, d] = iso.split('-').map(Number);
  return `${d} de ${meses[mo - 1]} de ${y}`;
};

// --- Indice de titulos, para resolver "related" por slug ---
const sources = fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).map(parseSource);
const bySlug = new Map(sources.map((s) => [s.slug, s]));

function relatedItems(meta, slug) {
  return (meta.related || [])
    .map((ref) => {
      // Formato "href|etiqueta|titulo" para enlaces fuera del blog
      if (ref.includes('|')) {
        const [href, label, title] = ref.split('|');
        return { href, label, title };
      }
      const target = bySlug.get(ref);
      if (!target) {
        console.warn(`  aviso: ${slug} enlaza a "${ref}" y ese articulo no existe todavia`);
        return null;
      }
      return {
        href: `${ref}.html`,
        label: CLUSTER_LABEL[target.meta.cluster] || target.meta.cluster,
        title: target.meta.h1,
      };
    })
    .filter(Boolean);
}

function render({ slug, meta, body }) {
  const url = `${ORIGIN}/blog/${slug}.html`;
  const toc = tocFrom(body);
  const faq = meta.faq || [];
  const related = relatedItems(meta, slug);
  const ogImage = meta.ogImage || `${ORIGIN}/assets/og-index.webp`;

  const graph = [
    {
      '@type': 'Article',
      headline: meta.h1,
      description: meta.desc,
      inLanguage: 'es-MX',
      datePublished: meta.date,
      dateModified: meta.modified || meta.date,
      author: { '@type': 'Person', name: 'Pablo Rivera', url: `${ORIGIN}/Respaldo%20y%20sustento.html` },
      publisher: { '@type': 'Organization', name: 'CSeekers', url: `${ORIGIN}/` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: meta.cluster,
      image: ogImage,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ORIGIN}/blog/index.html` },
        { '@type': 'ListItem', position: 3, name: meta.h1 },
      ],
    },
  ];

  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: jsonText(f.q),
        acceptedAnswer: { '@type': 'Answer', text: jsonText(f.a.replace(/<[^>]+>/g, ' ')) },
      })),
    });
  }

  const faqHtml = faq.length
    ? `
      <h2 id="faq">Preguntas frecuentes</h2>

      <div class="post-faq">
${faq
  .map(
    (f) => `        <details>
          <summary>${esc(f.q)}</summary>
          <div class="faq-a">${f.a.trim().startsWith('<') ? f.a : `<p>${f.a}</p>`}</div>
        </details>`
  )
  .join('\n')}
      </div>
`
    : '';

  const relatedHtml = related.length
    ? `
      <div class="post-related">
        <h2>Seguir leyendo</h2>
        <ul>
${related
  .map(
    (r) => `          <li><a href="${r.href}"><span class="rel-cluster">${esc(r.label)}</span>${esc(r.title)}</a></li>`
  )
  .join('\n')}
        </ul>
      </div>
`
    : '';

  const tocHtml = [...toc, ...(faq.length ? [{ id: 'faq', text: 'Preguntas frecuentes' }] : [])]
    .map((t) => `        <li><a href="#${t.id}">${esc(t.text)}</a></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="CSeekers" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(meta.h1)}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:description" content="${esc(meta.desc)}" />
<meta property="og:locale" content="es_MX" />
<meta property="article:section" content="${esc(meta.cluster)}" />
<meta property="article:published_time" content="${meta.date}" />
<meta property="article:author" content="Pablo Rivera" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(meta.h1)}" />
<meta name="twitter:description" content="${esc(meta.desc)}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css" />
<link rel="stylesheet" href="blog.css" />
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}
</script>
</head>
<body class="blog-body blog">
<a href="#contenido" class="blog-skip">Saltar al contenido</a>

${NAV}

<main id="contenido" class="blog-wrap">
  <nav class="blog-crumbs" aria-label="Ruta de navegacion">
    <a href="../index.html">Inicio</a><span>/</span><a href="index.html">Blog</a><span>/</span>${esc(meta.cluster)}
  </nav>

  <div class="post-head">
    <span class="post-eyebrow">${esc(meta.cluster)}</span>
    <h1>${esc(meta.h1)}</h1>
    <p class="post-lead">${meta.lead}</p>
    <div class="post-meta">
      <span>Por <strong>Pablo Rivera</strong></span>
      <span>${FECHA_LARGA(meta.date)}</span>
      <span>Lectura <strong>${meta.min} min</strong></span>
    </div>
  </div>

  <div class="post-grid">
    <div class="post-body">

${body}
${faqHtml}
      <div class="post-cta">
        <h2>${esc(meta.ctaTitle || '¿Tu canal funciona pero el negocio no lo siente?')}</h2>
        <p>${meta.ctaText || 'En una llamada de 30 minutos revisamos tus números reales y te decimos dónde está la fuga. Sin costo y sin compromiso de contratar.'}</p>
        <a class="btn-cta" href="../Agendar%20Sesion.html">Agendar llamada de descubrimiento</a>
        <span class="cta-micro">30 min · sin costo · te contactamos en menos de 24 h</span>
      </div>
${relatedHtml}
    </div>

    <aside class="post-aside">
      <h2>En este artículo</h2>
      <ul class="post-toc">
${tocHtml}
      </ul>
    </aside>
  </div>
</main>

${FOOTER}
</body>
</html>
`;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let n = 0;
for (const src of sources) {
  fs.writeFileSync(path.join(OUT, `${src.slug}.html`), render(src));
  n++;
}
console.log(`${n} articulos generados en /blog`);
