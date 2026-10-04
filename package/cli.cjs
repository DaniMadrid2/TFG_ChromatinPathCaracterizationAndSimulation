#!/usr/bin/env node
const { parseFiles, parseAll } = require('./runner.cjs');
const { init } = require('./initializer.cjs');
const { startServer } = require('./lib/server.js');
const { askBackupDeletionPermission, startBackupServer } = require('./lib/backups.js');
const { watchProject } = require('./watch.cjs');
const { isWindowsAdministrator, startElevatedServer } = require('./lib/elevation.js');
const { version } = require('./package.json');

const help = `dnti_shaderdsl ${version}

Uso:
  dnti_shaderdsl parse <archivo.shaderdsl.ts> [...] [--out-dir DIR] [--watch] [--serve [port]] [--no-backup-server]
  dnti_shaderdsl parse . [--out-dir DIR] [--watch] [--serve [port]] [--no-backup-server]
  dnti_shaderdsl parseAll [--out-dir DIR] [--watch] [--serve [port]] [--no-backup-server]
  dnti_shaderdsl init [NOMBRE|./] [--template simple|trajectories|simulation|pointSimulation]
  dnti_shaderdsl serve [port] [path] [--no-backup-server]
  dnti_shaderdsl runserver [port] [path] [--no-backup-server]
  dnti_shaderdsl servebackups [port] [path]
  dnti_shaderdsl --help
  dnti_shaderdsl --version

Opciones:
  -h, --help       Muestra esta ayuda.
  -v, --version    Muestra la version del paquete.
  -o, --out-dir    Carpeta de salida (por defecto: ./generated).
  --watch         Regenera al cambiar archivos .ts del proyecto.
  --serve [port]  Tras el primer parseo, sirve el proyecto (puerto 4178 por defecto).
  --no-backup-server  No inicia la API de backups ni solicita elevacion UAC.
  En Windows, la API de backups abre una consola externa elevada mediante UAC.
  --template       Ejemplo para init; si se omite, muestra un menu.
  --dir            Carpeta nueva donde init crea el proyecto.
  serve/runserver  Sirve index.html y glsl/ por HTTP (puerto 4178 por defecto).
  servebackups     Sirve solo /api/backups sobre [path]/backups.

Operacion:
  1. Lee cada Shader DSL y sus import <Mid> desde el directorio actual.
  2. Usa ./lib/Code/WebGL/webglParser.ts + webglMan.ts si existen ambos;
     tambien admite ./lib/WebGL/. Si no, usa los del paquete.
  3. Inserta snippets de ./parser_snippets/shared y del identificador
     (por ejemplo c1 o c2). shaderdsl.config.json permite ubicaciones
     pre, post, before:MARCADOR y after:MARCADOR.
  4. Genera generatedParser<ID>.ts y .js. El JS carga los shaders GLSL
     del programa desde /glsl/<nombre>.vert y /glsl/<nombre>.frag.

Ejemplos:
  dnti_shaderdsl parse parseTextC1.shaderdsl.ts
  dnti_shaderdsl parse parseTextC1.shaderdsl.ts parseTextC2.shaderdsl.ts -o generated
  dnti_shaderdsl parse .
  dnti_shaderdsl parse . --watch --serve
  dnti_shaderdsl parse . --watch --serve 5180
  dnti_shaderdsl init --template simulation --dir mi-simulacion
  dnti_shaderdsl init --template pointSimulation --dir mis-puntos
  dnti_shaderdsl serve 4178 ./GLSLTest
  npm install -g ./dist

El canvas por defecto tiene id="shaderdsl-canvas". Sirve el proyecto por HTTP.
Consulta README.md del paquete para la estructura y los snippets.
`;

async function main(argv) {
  if (argv[0] === 'help' || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(help);
    return;
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(version + '\n');
    return;
  }
  const command = ['parse', 'parseAll', 'init', 'serve', 'runserver', 'servebackups'].includes(argv[0]) ? argv.shift() : 'parse';
  const launchServer = async (port, directory, noBackupServer, serverCommand = 'serve') => {
    if (!noBackupServer && process.platform === 'win32' && !isWindowsAdministrator()) {
      startElevatedServer(serverCommand, port, directory);
      return;
    }
    const allowDeletion = noBackupServer ? false : process.platform === 'win32' ? true : await askBackupDeletionPermission();
    return serverCommand === 'servebackups'
      ? startBackupServer(port, directory, { allowDeletion })
      : startServer(port, directory, { backupServer: !noBackupServer, allowBackupDeletion: allowDeletion });
  };
  if (command === 'runserver' || command === 'serve' || command === 'servebackups') {
    const noBackupServer = argv.includes('--no-backup-server');
    if (noBackupServer && command === 'servebackups') throw new Error('servebackups no admite --no-backup-server');
    argv = argv.filter((arg) => arg !== '--no-backup-server');
    if (argv.length > 2) throw new Error(`Uso: dnti_shaderdsl ${command} [port] [path]`);
    const port = argv[0] && /^\d+$/.test(argv[0]) ? Number(argv.shift()) : 4178;
    if (argv.length > 1) throw new Error(`Uso: dnti_shaderdsl ${command} [port] [path]`);
    return launchServer(port, argv[0] || process.cwd(), noBackupServer, command);
  }
  if (command === 'init') {
    let template;
    let dir;
    let positionalDir;
    for (let index = 0; index < argv.length; index++) {
      const arg = argv[index];
      if (arg === '--template') template = argv[++index];
      else if (arg === '--dir') dir = argv[++index];
      else if (!arg.startsWith('-') && positionalDir === undefined) positionalDir = arg;
      else throw new Error(`Opcion desconocida para init: ${arg}`);
      if ((arg === '--template' || arg === '--dir') && (!argv[index] || argv[index].startsWith('-'))) {
        throw new Error(`${arg} necesita un valor`);
      }
    }
    if (dir !== undefined && positionalDir !== undefined) throw new Error('Usa NOMBRE o --dir, no ambos');
    return init({ template, dir: dir ?? positionalDir });
  }
  if (!argv.length && command !== 'parseAll') {
    process.stderr.write('Faltan archivos Shader DSL. Usa dnti_shaderdsl --help.\n');
    process.exitCode = 1;
    return;
  }
  const files = [];
  let outDir;
  let watch = false;
  let serve = false;
  let noBackupServer = false;
  let servePort = 4178;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--out-dir' || arg === '-o') {
      outDir = argv[++index];
      if (!outDir || outDir.startsWith('-')) throw new Error(`${arg} necesita una carpeta`);
    } else if (arg.startsWith('--out-dir=')) {
      outDir = arg.slice('--out-dir='.length);
      if (!outDir) throw new Error('--out-dir necesita una carpeta');
    } else if (arg === '--watch') {
      watch = true;
    } else if (arg === '--no-backup-server') {
      noBackupServer = true;
    } else if (arg === '--serve') {
      serve = true;
      if (argv[index + 1] && /^\d+$/.test(argv[index + 1])) {
        servePort = Number(argv[++index]);
        if (servePort > 65535) throw new Error(`Puerto invalido: ${servePort}`);
      }
    } else if (arg.startsWith('-')) {
      throw new Error(`Opcion desconocida: ${arg}`);
    } else {
      files.push(arg);
    }
  }
  let run;
  if (command === 'parseAll' || (files.length === 1 && files[0] === '.')) {
    if (command === 'parseAll' && files.length) throw new Error('parseAll no acepta archivos; usa parse para seleccionarlos');
    run = () => parseAll({ cwd: process.cwd(), outDir });
  } else {
    if (!files.length || files.includes('.')) throw new Error('Indica archivos concretos o usa parse .');
    run = () => parseFiles(files, { cwd: process.cwd(), outDir });
  }
  if (watch) {
    try { await run(); } catch (error) { console.error('[dnti_shaderdsl] parse:', error.message || error); }
    const watcher = watchProject({ cwd: process.cwd(), outDir, run });
    try {
      if (serve) {
        await launchServer(servePort, process.cwd(), noBackupServer);
      }
    } catch (error) {
      watcher.close();
      throw error;
    }
    return;
  }
  await run();
  if (serve) {
    await launchServer(servePort, process.cwd(), noBackupServer);
  }
}

Promise.resolve().then(() => main(process.argv.slice(2))).catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
