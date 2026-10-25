#!/usr/bin/env node
/**
 * Servidor estatico minimo para ver el sitio en local, sin dependencias.
 * No participa en el build de Vercel: es solo para desarrollo.
 *
 * Uso: node scripts/dev-server.js [puerto]
 *      http://localhost:4321
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4321;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';

    const abs = path.join(ROOT, rel);
    // No servir nada fuera de la carpeta del proyecto
    if (!abs.startsWith(ROOT)) {
      res.writeHead(403).end('403');
      return;
    }

    fs.readFile(abs, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404: ' + rel);
        return;
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(abs)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Sitio en http://localhost:${PORT}`));
