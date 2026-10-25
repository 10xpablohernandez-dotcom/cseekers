#!/usr/bin/env node
/**
 * Detecta texto ilegible dentro de los rectangulos de los SVG inline.
 *
 * El caso tipico: una etiqueta en gris apagado cae encima de un relleno
 * verde o negro y el contraste se desploma. Solo se ve abriendo la pagina,
 * y se cuela con facilidad porque en el editor el SVG es texto plano.
 *
 * Solo revisa texto REALMENTE contenido en un rectangulo: compara las
 * coordenadas del <text> contra la caja del <rect> dentro del mismo <g>.
 *
 * Umbral: 3:1, que es el minimo de WCAG para texto grande y elementos
 * graficos. Por debajo de eso se avisa.
 *
 * Uso: node scripts/check-svg-contrast.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'content', 'blog');

// Valores de los tokens que usan los SVG (ver blog.css)
const COLOR = {
  '--viz-ink': '#111111',
  '--viz-green': '#1ed600',
  '--viz-danger': '#ff5a5a',
  '--viz-muted': '#888888',
  '--viz-grid': '#eaeaea',
  '--viz-label': '#555555',
  '--viz-surface': '#ffffff',
};

// Color de relleno por clase de texto, segun blog.css
const FILL_CLASE = {
  'viz-title': '#111111',
  'viz-value': '#111111',
  'viz-label': '#555555',
  'viz-mono': '#888888',
};
const BLANCO = '#ffffff';

function hex(v) {
  if (!v) return null;
  const m = v.match(/var\((--[a-z-]+)\)/);
  if (m) return COLOR[m[1]] || null;
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
}

function luminancia(h) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function colorDelTexto(attrs, clase) {
  const fill = hex((attrs.match(/\sfill="([^"]+)"/) || [])[1]);
  if (fill) return fill;
  if (/on-accent/.test(clase)) return '#0d5200';
  if (/on-light/.test(clase)) return '#4a4a4a';
  if (/on-dark-soft/.test(clase)) return '#a6a6a6';
  if (/on-dark/.test(clase)) return BLANCO;
  for (const k of Object.keys(FILL_CLASE)) if (clase.includes(k)) return FILL_CLASE[k];
  return '#111111';
}

let avisos = 0;
let revisados = 0;

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');

  for (const svgM of html.matchAll(/<svg viewBox="[^"]*"[\s\S]*?<\/svg>/g)) {
    // Dividimos por grupos para que rect y text compartan sistema de coordenadas
    const grupos = svgM[0].split(/(?=<g )|(?=<\/g>)/);

    for (const grupo of grupos) {
      const rects = [...grupo.matchAll(/<rect([^>]*)>/g)]
        .map((m) => {
          const a = m[1];
          const n = (k) => Number((a.match(new RegExp(`\\s${k}="([-\\d.]+)"`)) || [, NaN])[1]);
          return { x: n('x'), y: n('y'), w: n('width'), h: n('height'), fill: hex((a.match(/\sfill="([^"]+)"/) || [])[1]) };
        })
        .filter((r) => r.fill && !Number.isNaN(r.x));

      for (const t of grupo.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)) {
        const attrs = t[1];
        const texto = t[2].replace(/<[^>]+>/g, '').trim();
        if (!texto) continue;
        const clase = (attrs.match(/class="([^"]*)"/) || [, ''])[1];
        const x = Number((attrs.match(/\sx="([-\d.]+)"/) || [, NaN])[1]);
        const y = Number((attrs.match(/\sy="([-\d.]+)"/) || [, NaN])[1]);
        if (Number.isNaN(x) || Number.isNaN(y)) continue;

        // El rect que de verdad contiene el punto de anclaje del texto
        const dentro = rects.find(
          (r) => x >= r.x && x <= r.x + r.w && y >= r.y - 2 && y <= r.y + r.h + 2
        );
        const fondo = dentro ? dentro.fill : BLANCO;
        const tinta = colorDelTexto(attrs, clase);
        revisados++;

        const ratio = contraste(tinta, fondo);
        if (ratio < 3) {
          console.log(
            `${file}\n  ${ratio.toFixed(2)}:1  texto ${tinta} sobre ${fondo}  "${texto.slice(0, 44)}"`
          );
          avisos++;
        }
      }
    }
  }
}

console.log(
  avisos
    ? `\n${avisos} textos con contraste bajo (umbral 3:1) de ${revisados} revisados.`
    : `${revisados} textos revisados, todos por encima de 3:1.`
);
