#!/usr/bin/env node
/**
 * Copia el sitio a /dist e inyecta el tag de Google Tag Manager
 * en <head> y justo después de <body> de cada .html.
 */

const fs = require('fs');
const path = require('path');

const GTM_ID = process.env.GTM_ID || 'GTM-PSNF5VFK';
const SOURCE_DIR = path.resolve(process.env.SOURCE_DIR || '.');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || 'dist');

const IGNORE = new Set([
  'node_modules', '.git', '.vercel', 'dist', 'scripts',
  '.github', 'package.json', 'package-lock.json', 'vercel.json', '.gitignore'
]);

const HEAD_SNIPPET = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const BODY_SNIPPET = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

let htmlCount = 0;
const failedFiles = [];

function walk(srcDir, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const outPath = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      walk(srcPath, outPath);
    } else if (entry.name.toLowerCase().endsWith('.html')) {
      processHtml(srcPath, outPath);
    } else {
      fs.copyFileSync(srcPath, outPath);
    }
  }
}

function processHtml(srcPath, outPath) {
  let html = fs.readFileSync(srcPath, 'utf8');
  const relPath = path.relative(SOURCE_DIR, srcPath);

  if (html.includes(GTM_ID)) {
    fs.writeFileSync(outPath, html, 'utf8');
    htmlCount++;
    return;
  }

  const headMatch = html.match(/<head[^>]*>/i);
  const bodyMatch = html.match(/<body[^>]*>/i);

  if (!headMatch || !bodyMatch) {
    failedFiles.push(relPath);
    fs.writeFileSync(outPath, html, 'utf8');
    return;
  }

  html = html.replace(headMatch[0], `${headMatch[0]}\n${HEAD_SNIPPET}`);
  html = html.replace(bodyMatch[0], `${bodyMatch[0]}\n${BODY_SNIPPET}`);

  fs.writeFileSync(outPath, html, 'utf8');
  htmlCount++;
}

if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
walk(SOURCE_DIR, OUTPUT_DIR);

console.log(`GTM inyectado en ${htmlCount} archivo(s) HTML.`);

if (failedFiles.length > 0) {
  console.error(`\nERROR: no se encontró <head> o <body> en ${failedFiles.length} archivo(s):`);
  failedFiles.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}
