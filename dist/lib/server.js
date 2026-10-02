const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createBackupHandler } = require('./backups.js');

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.frag': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.vert': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

function within(root, candidate) {
  return candidate === root || candidate.startsWith(root + path.sep);
}

async function startServer(port = 4178, directory = process.cwd(), { backupServer = true, allowBackupDeletion = false } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Puerto invalido: ${port}`);
  const root = await fs.realpath(path.resolve(directory));
  if (!(await fs.stat(root)).isDirectory()) throw new Error(`No es un directorio: ${root}`);
  const handleBackup = backupServer ? createBackupHandler(root, { allowDeletion: allowBackupDeletion }) : null;
  const server = http.createServer(async (request, response) => {
    if (handleBackup && await handleBackup(request, response)) return;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) throw Object.assign(new Error('Ruta invalida'), { status: 403 });
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const file = path.resolve(root, relative);
      if (!within(root, file)) throw Object.assign(new Error('Fuera del directorio'), { status: 403 });
      const realFile = await fs.realpath(file);
      if (!within(root, realFile)) throw Object.assign(new Error('Fuera del directorio'), { status: 403 });
      const stat = await fs.stat(realFile);
      if (!stat.isFile()) throw Object.assign(new Error('No es un archivo'), { status: 404 });
      response.writeHead(200, {
        'Content-Type': mime[path.extname(realFile).toLowerCase()] || 'application/octet-stream',
        'Content-Length': stat.size,
      });
      if (request.method === 'HEAD') response.end();
      else response.end(await fs.readFile(realFile));
    } catch (error) {
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end(
        status === 404 ? 'Not found' : status === 403 ? 'Forbidden' : 'Server error',
      );
      if (status === 500) console.error('[dnti_shaderdsl] server:', error);
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const address = server.address();
  console.log(`[dnti_shaderdsl] Sirviendo ${root}`);
  console.log(`[dnti_shaderdsl] http://127.0.0.1:${address.port}/`);
  console.log('[dnti_shaderdsl] Ctrl+C para detener el servidor');
  return server;
}

module.exports = { startServer };
