const fs = require('node:fs');
const path = require('node:path');

function shouldWatchTs(filename, cwd, outDir) {
  if (!filename) return true;
  const absolute = path.resolve(cwd, String(filename));
  const relative = path.relative(cwd, absolute);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) return false;
  const parts = relative.split(path.sep);
  if (parts.some((part) => ['.git', 'node_modules', 'dist', 'backups'].includes(part))) return false;
  const output = path.resolve(cwd, outDir || 'generated');
  if (absolute === output || absolute.startsWith(output + path.sep)) return false;
  return absolute.endsWith('.ts');
}

function watchProject({ cwd = process.cwd(), outDir, run, delay = 150 }) {
  let timer;
  let running = false;
  let pending = false;
  async function flush() {
    if (running) return;
    running = true;
    while (pending) {
      pending = false;
      try {
        console.log('[dnti_shaderdsl] Cambio .ts detectado; regenerando...');
        await run();
      } catch (error) {
        console.error('[dnti_shaderdsl] parse:', error.message || error);
      }
    }
    running = false;
  }
  const watcher = fs.watch(cwd, { recursive: true }, (_event, filename) => {
    if (!shouldWatchTs(filename, cwd, outDir)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      pending = true;
      void flush();
    }, delay);
  });
  watcher.on('close', () => clearTimeout(timer));
  watcher.on('error', (error) => console.error('[dnti_shaderdsl] watch:', error));
  console.log(`[dnti_shaderdsl] Observando archivos .ts en ${path.resolve(cwd)}`);
  return watcher;
}

module.exports = { shouldWatchTs, watchProject };
