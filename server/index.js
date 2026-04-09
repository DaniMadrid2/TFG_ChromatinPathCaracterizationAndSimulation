const http = require('http');
const path = require('path');
const fs = require('fs').promises;

const projectRoot = path.resolve(__dirname, '..');
const defaultPort = 3030;
const port = Number(process.env.PORT || defaultPort);

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
