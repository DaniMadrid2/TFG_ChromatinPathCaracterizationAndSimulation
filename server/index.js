const http = require('http');
const path = require('path');
const fs = require('fs').promises;

const projectRoot = path.resolve(__dirname, '..');
const defaultPort = 3030;
const port = Number(process.env.PORT || defaultPort);
const backupRoot = path.join(projectRoot, 'backups');

const mimeTypes = {
  html: 'text/html; charset=UTF-8',
  js: 'text/javascript; charset=UTF-8',
  css: 'text/css; charset=UTF-8',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  wasm: 'application/wasm',
  mjs: 'text/javascript; charset=UTF-8',
  mts: 'text/javascript; charset=UTF-8',
  txt: 'text/plain; charset=UTF-8',
};

const sendError = (res, status, message) => {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(message);
};

const serveFile = async (res, filePath) => {
  const ext = path.extname(filePath).slice(1);
  const mime = mimeTypes[ext] || 'application/octet-stream';
  const file = await fs.readFile(filePath);
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
  });
  res.end(file);
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const sendNoContent = (res) => {
  res.writeHead(204, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const resolveBackupPath = (relativePath) => {
  const raw = String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const normalized = path.normalize(path.join(backupRoot, raw || '.'));
  if (!normalized.startsWith(backupRoot)) return null;
  return normalized;
};

const listBackupFiles = async (dir = backupRoot, prefix = '') => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      out.push(...await listBackupFiles(fullPath, rel));
      continue;
    }
    if (!entry.isFile()) continue;
    const stats = await fs.stat(fullPath);
    out.push({
      path: rel,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      mtime: stats.mtime.toISOString(),
    });
  }
  return out;
};

const removePreviousDatedBackup = async (target) => {
  const dir = path.dirname(target);
  const fileName = path.basename(target);
  const match = fileName.match(/^(.+)_\d{12}(?:\d{2})?(\.[^.]+)$/);
  if (!match) return;
  const [, stem, ext] = match;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const previousName = new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_\\d{12}(?:\\d{2})?${ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  await Promise.all(entries
    .filter((entry) => entry.isFile() && previousName.test(entry.name) && entry.name !== fileName)
    .map((entry) => fs.unlink(path.join(dir, entry.name)).catch(() => {})));
};

const handleBackupApi = async (req, res, base) => {
  const route = base.pathname.replace(/^\/api\/backups/i, '');
  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return true;
  }
  if (req.method === 'GET' && route === '/list') {
    await fs.mkdir(backupRoot, { recursive: true });
    const files = await listBackupFiles();
    console.log(`[backups:list] ${files.length} files`);
    sendJson(res, 200, { root: '/backups', files });
    return true;
  }

  if (req.method === 'GET' && route === '/file') {
    const requestedPath = base.searchParams.get('path');
    const target = resolveBackupPath(requestedPath);
    if (!target) {
      console.log(`[backups:file] forbidden path=${requestedPath || ''}`);
      sendError(res, 403, 'Forbidden');
      return true;
    }
    try {
      await fs.access(target);
      console.log(`[backups:file] exists=true path=${path.relative(backupRoot, target).replace(/\\/g, '/')}`);
    } catch {
      console.log(`[backups:file] exists=false path=${path.relative(backupRoot, target).replace(/\\/g, '/')}`);
    }
    const ext = path.extname(target).slice(1);
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const file = await fs.readFile(target);
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(file);
    return true;
  }

  if (req.method === 'PUT' && (route === '/file' || route === '/append')) {
    const body = JSON.parse(await readRequestBody(req) || '{}');
    const requestedPath = body.directoryMode
      ? path.posix.join(String(body.path || '').replace(/\\/g, '/'), String(body.suggestedName || 'backup.txt'))
      : body.path;
    const target = resolveBackupPath(requestedPath);
    if (!target) {
      sendError(res, 403, 'Forbidden');
      return true;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (route === '/append') {
      await fs.appendFile(target, String(body.content ?? ''), 'utf8');
    } else {
      await removePreviousDatedBackup(target);
      await fs.writeFile(target, String(body.content ?? ''), 'utf8');
    }
    sendJson(res, 200, {
      ok: true,
      path: path.relative(backupRoot, target).replace(/\\/g, '/'),
    });
    return true;
  }

  return false;
};

const resolvePath = (requestPath) => {
  const safePath = requestPath.replace(/\\/g, '/');
  const relativePath = safePath.replace(/^\/+/, '');
  const normalized = path.normalize(path.join(projectRoot, relativePath));
  if (!normalized.startsWith(projectRoot)) {
    return null;
  }
  return normalized;
};

const remapDependencies = (requestPath) => {
  const staticMathJax = '/dependencies/static/mathjax/';
  const externalMat4 = '/dependencies/ExternalCode/mat4js/';

  if (requestPath.includes(staticMathJax)) {
    return requestPath.replace(staticMathJax, '/dependencies/static/mat4js/mathjax/');
  }

  if (requestPath.includes(externalMat4)) {
    return requestPath.replace(externalMat4, '/dependencies/static/mat4js/');
  }

  return requestPath;
};

http.createServer(async (req, res) => {
  const base = new URL(req.url, `http://localhost:${port}`);
  let requestPath = decodeURIComponent(base.pathname);
  try {
    if (/^\/api\/backups(?:\/|$)/i.test(requestPath)) {
      if (await handleBackupApi(req, res, base)) return;
    }
  } catch (err) {
    sendError(res, 500, err?.message || 'Backup API error');
    return;
  }
  requestPath = remapDependencies(requestPath);
  if (requestPath.endsWith('/')) {
    requestPath += 'index.html';
  }
  let target = resolvePath(requestPath);
  if (!target) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  try {
    const stats = await fs.stat(target);
    if (stats.isDirectory()) {
      target = path.join(target, 'index.html');
      await fs.access(target);
    }
    await serveFile(res, target);
  } catch (err) {
    const fallback = path.join(projectRoot, 'src', 'index.html');
    if (target !== fallback) {
      try {
        await serveFile(res, fallback);
        return;
      } catch (fallbackErr) {
        sendError(res, 500, 'Unable to load index.html');
        return;
      }
    }
    sendError(res, 404, 'Not found');
  }
}).listen(port, () => {
  const entryPath = '/src/index.html';
  console.log(
    `Server ready at http://localhost:${port}${entryPath} (serving ${path.resolve(
      projectRoot,
      'src',
      'index.html',
    )})`,
  );
});
