#!/usr/bin/env node
/**
 * Detecta texto que se sale del viewBox en los SVG inline de los articulos.
 *
 * Es el error que mas facil se cuela al dibujar un SVG a mano: una etiqueta
 * queda cortada en el borde y solo se nota mirando la pagina renderizada.
 * Este script lo encuentra sin abrir el navegador.
 *
 * El ancho del texto se estima con el ancho medio de glifo de cada clase,
 * asi que es una aproximacion deliberadamente conservadora: mejor un aviso
 * de mas que una etiqueta cortada en produccion.
 *
 * Uso: node scripts/check-svg-overflow.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'content', 'blog');

// Ancho medio de glifo por clase, en px. Mono es mas ancho por caracter.
const ANCHO = { 'viz-title': 7.2, 'viz-value': 6.1, 'viz-label': 5.9, 'viz-mono': 6.0 };
const ANCHO_DEFAULT = 6.2;

function anchoDe(clase) {
  for (const k of Object.keys(ANCHO)) if (clase.includes(k)) return ANCHO[k];
  return ANCHO_DEFAULT;
}

let avisos = 0;
let svgs = 0;

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');

  for (const svgM of html.matchAll(/<svg viewBox="0 0 (\d+) (\d+)"[\s\S]*?<\/svg>/g)) {
    const [bloque, wStr, hStr] = svgM;
    const W = Number(wStr);
    const H = Number(hStr);
    svgs++;
    const problemas = [];

    // Recorremos el bloque llevando el translate del <g> abierto mas reciente.
    let tx = 0;
    let ty = 0;
    const tokens = bloque.matchAll(
      /<g transform="translate\(([-\d.]+),\s*([-\d.]+)\)"|<\/g>|<text([^>]*)>([\s\S]*?)<\/text>/g
    );

    for (const t of tokens) {
      if (t[1] !== undefined) {
        tx = Number(t[1]);
        ty = Number(t[2]);
        continue;
      }
      if (t[0] === '</g>') {
        tx = 0;
        ty = 0;
        continue;
      }

      const attrs = t[3] || '';
      const texto = (t[4] || '').replace(/<[^>]+>/g, '').trim();
      if (!texto) continue;

      const clase = (attrs.match(/class="([^"]*)"/) || [, ''])[1];
      const x = Number((attrs.match(/\sx="([-\d.]+)"/) || [, 0])[1]) + tx;
      const y = Number((attrs.match(/\sy="([-\d.]+)"/) || [, 0])[1]) + ty;
      const anchor = (attrs.match(/text-anchor="([^"]*)"/) || [, 'start'])[1];

      const ancho = texto.length * anchoDe(clase);
      let izq = x;
      let der = x + ancho;
      if (anchor === 'middle') {
        izq = x - ancho / 2;
        der = x + ancho / 2;
      } else if (anchor === 'end') {
        izq = x - ancho;
        der = x;
      }

      if (izq < -1) problemas.push(`  izquierda  x=${Math.round(izq)}  "${texto.slice(0, 42)}"`);
      else if (der > W + 1) problemas.push(`  derecha    +${Math.round(der - W)}px  "${texto.slice(0, 42)}"`);
      if (y > H + 1) problemas.push(`  abajo      y=${y} > ${H}  "${texto.slice(0, 42)}"`);
    }

    if (problemas.length) {
      const titulo = (bloque.match(/<title[^>]*>([^<]*)<\/title>/) || [, '(sin titulo)'])[1];
      console.log(`\n${file}\n  "${titulo}" (viewBox ${W}x${H})`);
      problemas.forEach((p) => console.log(p));
      avisos += problemas.length;
    }
  }
}

console.log(
  avisos
    ? `\n${avisos} avisos en ${svgs} SVG. Revisa cada uno en el navegador: la estimacion es aproximada.`
    : `${svgs} SVG revisados, ningun texto se sale del viewBox.`
);
