// Zero-dependency static server for the standalone prototype.
//   node .taste-skill/prototype/serve.mjs
//   PORT=4173 node .taste-skill/prototype/serve.mjs
// Open http://127.0.0.1:4173/ . The prototype is static: no build step, no framework.
import { createServer } from 'node:http';
import { statSync, createReadStream } from 'node:fs';
import { resolve, join, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = resolve(join(root, decodeURIComponent(url.pathname)));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end('forbidden'); return; }
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    const stat = statSync(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`MountainsTech prototype: http://127.0.0.1:${port}/`);
  console.log('Ctrl+C to stop.');
});
