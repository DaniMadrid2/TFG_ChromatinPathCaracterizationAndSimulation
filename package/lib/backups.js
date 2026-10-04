const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');

async function askBackupDeletionPermission() {
  if (!process.stdin.isTTY) {
    console.log('[dnti_shaderdsl] Sin terminal interactiva: no se permite borrar backups existentes.');
    return false;
  }
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await prompt.question('Permitir borrar/reemplazar backups anteriores durante esta sesion? [s/N] ');
    return /^(s|si|sí|y|yes)$/i.test(answer.trim());
  } finally {
    prompt.close();
  }
}

function send(response, status, value) {
  response.writeHead(status, {
    'Content-Type': typeof value === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }).end(typeof value === 'string' ? value : JSON.stringify(value));
}

function backupPath(root, name) {
  if (typeof name !== 'string' || !name.trim() || name.includes('\0')) throw Object.assign(new Error('Ruta invalida'), { status: 400 });
  const target = path.resolve(root, name.replace(/\\/g, '/').replace(/^\/+/, ''));
  if (target === root || !target.startsWith(root + path.sep)) throw Object.assign(new Error('Fuera de backups'), { status: 403 });
  return target;
}

async function checkExistingParents(root, target) {
  let current = target;
  while (current !== root) {
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw Object.assign(new Error('Enlace simbolico no permitido'), { status: 403 });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    current = path.dirname(current);
  }
}

async function bodyOf(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 256 * 1024 * 1024) throw Object.assign(new Error('Backup demasiado grande'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('JSON invalido'), { status: 400 }); }
}

async function listFiles(root, dir = root) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(root, file));
    else if (entry.isFile()) {
      const stat = await fs.stat(file);
      result.push({ path: path.relative(root, file).replace(/\\/g, '/'), size: stat.size, mtimeMs: stat.mtimeMs, mtime: stat.mtime.toISOString() });
    }
  }
  return result;
}

async function removePreviousDatedBackup(target) {
  const match = path.basename(target).match(/^(.+)_\d{12}(?:\d{2})?(\.[^.]+)$/);
  if (!match) return;
  const [, stem, extension] = match;
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escape(stem)}_\\d{12}(?:\\d{2})?${escape(extension)}$`);
  const entries = await fs.readdir(path.dirname(target), { withFileTypes: true });
  const previous = entries.filter((entry) => entry.isFile() && entry.name !== path.basename(target) && pattern.test(entry.name))
    .map((entry) => entry.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (previous.length) await fs.unlink(path.join(path.dirname(target), previous[previous.length - 1]));
}

function createBackupHandler(directory = process.cwd(), { allowDeletion = false } = {}) {
  const root = path.resolve(directory, 'backups');
  return async (request, response, url = new URL(request.url, 'http://localhost')) => {
    if (!/^\/api\/backups(?:\/|$)/i.test(url.pathname)) return false;
    try {
      const route = url.pathname.replace(/^\/api\/backups/i, '');
      if (request.method === 'OPTIONS') { response.writeHead(204, { Allow: 'GET, PUT, OPTIONS' }).end(); return true; }
      await fs.mkdir(root, { recursive: true });
      if (request.method === 'GET' && route === '/list') {
        send(response, 200, { root: '/backups', files: await listFiles(root) });
      } else if (request.method === 'GET' && route === '/file') {
        const target = backupPath(root, url.searchParams.get('path'));
        await checkExistingParents(root, target);
        send(response, 200, await fs.readFile(target, 'utf8'));
      } else if (request.method === 'PUT' && route === '/clear-generations') {
        if (!allowDeletion) throw Object.assign(new Error('Borrado de backups no autorizado'), { status: 403 });
        const body = await bodyOf(request);
        const target = backupPath(root, body.path);
        await checkExistingParents(root, target);
        await fs.mkdir(target, { recursive: true });
        for (const entry of await fs.readdir(target, { withFileTypes: true })) {
          if (entry.isDirectory() && /^(?:[2-9]|[1-9]\d+)$/.test(entry.name)) await fs.rm(path.join(target, entry.name), { recursive: true });
        }
        send(response, 200, { ok: true, path: path.relative(root, target).replace(/\\/g, '/') });
      } else if (request.method === 'PUT' && route === '/clear-generation') {
        if (!allowDeletion) throw Object.assign(new Error('Borrado de backups no autorizado'), { status: 403 });
        const body = await bodyOf(request);
        const target = backupPath(root, body.path);
        await checkExistingParents(root, target);
        const byName = Array.isArray(body.filenames);
        if (byName) {
          if (!body.filenames.length || body.filenames.some(name => typeof name !== 'string' || !/^[A-Za-z0-9_.-]+\.txt$/.test(name))) {
            throw Object.assign(new Error('Nombres de archivo invalidos'), { status: 400 });
          }
        } else if (!/^[A-Za-z0-9_.-]+_$/.test(body.prefix)) {
          throw Object.assign(new Error('Prefijo invalido'), { status: 400 });
        }
        const entries = await fs.readdir(target, { withFileTypes: true }).catch(error => {
          if (error.code === 'ENOENT') return [];
          throw error;
        });
        for (const entry of entries) {
          if (entry.isFile() && (byName ? body.filenames.includes(entry.name) : entry.name.startsWith(body.prefix))) {
            await fs.unlink(path.join(target, entry.name));
          }
        }
        send(response, 200, { ok: true, path: path.relative(root, target).replace(/\\/g, '/') });
      } else if (request.method === 'PUT' && (route === '/file' || route === '/append')) {
        const body = await bodyOf(request);
        const name = body.directoryMode ? path.posix.join(String(body.path || ''), String(body.suggestedName || 'backup.txt')) : body.path;
        const target = backupPath(root, name);
        await checkExistingParents(root, target);
        await fs.mkdir(path.dirname(target), { recursive: true });
        if (!allowDeletion) {
          try {
            await fs.access(target);
            throw Object.assign(new Error('Reemplazo de backup no autorizado'), { status: 403 });
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
        }
        if (route === '/append') await fs.appendFile(target, String(body.content ?? ''), 'utf8');
        else {
          if (allowDeletion) await removePreviousDatedBackup(target);
          await fs.writeFile(target, String(body.content ?? ''), 'utf8');
        }
        send(response, 200, { ok: true, path: path.relative(root, target).replace(/\\/g, '/') });
      } else send(response, 404, 'Not found');
    } catch (error) {
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      send(response, status, status === 500 ? 'Backup API error' : error.message);
      if (status === 500) console.error('[dnti_shaderdsl] backups:', error);
    }
    return true;
  };
}

async function startBackupServer(port = 4178, directory = process.cwd(), { allowDeletion = false } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Puerto invalido: ${port}`);
  const root = await fs.realpath(path.resolve(directory));
  if (!(await fs.stat(root)).isDirectory()) throw new Error(`No es un directorio: ${root}`);
  const handle = createBackupHandler(root, { allowDeletion });
  const server = http.createServer(async (request, response) => {
    if (!await handle(request, response)) send(response, 404, 'Not found');
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`[dnti_shaderdsl] API de backups en http://127.0.0.1:${server.address().port}/api/backups (directorio ${root})`);
  return server;
}

module.exports = { askBackupDeletionPermission, createBackupHandler, startBackupServer };

if (require.main === module) {
  const port = process.argv[2] === undefined ? 4178 : Number(process.argv[2]);
  const directory = process.argv[3] || process.cwd();
  askBackupDeletionPermission()
    .then(allowDeletion => startBackupServer(port, directory, { allowDeletion }))
    .catch(error => { console.error(error); process.exitCode = 1; });
}
