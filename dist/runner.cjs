const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const { registryEntry } = require('./registry-loader.cjs');

const packageRoot = __dirname;
const bundledLib = path.join(packageRoot, 'lib');
const dslName = /^parseText([A-Za-z0-9_-]+)\.shaderdsl\.ts$/i;
const dslSuffix = /\.shaderdsl\.ts$/i;

function ensureParserGlobals() {
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.document) {
    globalThis.document = { createElement: () => ({}), getElementById: () => null, querySelector: () => null };
  }
  if (!globalThis.WebGL2RenderingContext) {
    globalThis.WebGL2RenderingContext = new Proxy({}, { get: () => 0 });
  }
}

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

function sourceResolver(cwd, localParser, localMan) {
  const localCode = path.join(cwd, 'lib', 'Code');
  return {
    name: 'shaderdsl-source-resolver',
    setup(build) {
      build.onResolve({ filter: /^\/Code\// }, async ({ path: request }) => {
        if (request === '/Code/WebGL/webglMan.js') {
          return { path: localMan || path.join(bundledLib, 'Code', 'WebGL', 'webglMan.ts') };
        }
        if (request === '/Code/WebGL/webglParser.js' || request === '/Code/WebGL/parser/webglParser.js') {
          return { path: localParser || path.join(bundledLib, 'Code', 'WebGL', 'parser', 'webglParser.ts') };
        }
        const relative = request.slice('/Code/'.length);
        const local = path.join(localCode, relative);
        if (await exists(local)) return { path: local };
        const bundled = path.join(bundledLib, 'Code', relative);
        const typescript = bundled.replace(/\.js$/, '.ts');
        return { path: await exists(bundled) ? bundled : typescript };
      });
      build.onResolve({ filter: /^\/(DNTI_Templates|ExternalCode)\// }, async ({ path: request }) => {
        const local = path.join(cwd, request.slice(1));
        return { path: await exists(local) ? local : path.join(bundledLib, request.slice(1)) };
      });
      build.onResolve({ filter: /^\.{1,2}\// }, async (args) => {
        if (!localParser || ![localParser, localMan].some((file) => path.resolve(args.importer) === path.resolve(file))) return;
        if (path.resolve(args.importer) === path.resolve(localParser) && (args.path === './webglMan.js' || args.path === '../webglMan.js')) return { path: localMan };
        const local = path.resolve(path.dirname(args.importer), args.path);
        if (await exists(local)) return { path: local };
        const relativeDirectory = path.resolve(args.importer) === path.resolve(localMan)
          ? 'Code/WebGL'
          : path.basename(path.dirname(localParser)) === 'parser' ? 'Code/WebGL/parser' : 'Code/WebGL';
        const bundled = path.resolve(bundledLib, relativeDirectory, args.path);
        const typescript = bundled.replace(/\.js$/, '.ts');
        return { path: await exists(bundled) ? bundled : typescript };
      });
    },
  };
}

async function loadParser(cwd) {
  ensureParserGlobals();
  const locations = [path.join(cwd, 'lib', 'Code', 'WebGL'), path.join(cwd, 'lib', 'WebGL')];
  let localParser;
  let localMan;
  for (const directory of locations) {
    const man = path.join(directory, 'webglMan.ts');
    for (const parser of [path.join(directory, 'parser', 'webglParser.ts'), path.join(directory, 'webglParser.ts')]) {
      if (await exists(parser) && await exists(man)) {
        localParser = parser;
        localMan = man;
        break;
      }
    }
    if (localParser) break;
  }
  const registryRoot = path.join(bundledLib, 'Code', 'WebGL', 'parser');
  const parserFile = localParser || path.join(registryRoot, 'webglParser.ts');
  const result = await esbuild.build({
    stdin: { contents: await registryEntry(parserFile, registryRoot), resolveDir: registryRoot,
      sourcefile: path.join(registryRoot, 'registry-entry.ts'), loader: 'ts' },
    bundle: true, write: false, platform: 'node',
    format: 'cjs', target: 'node20', plugins: [sourceResolver(cwd, localParser, localMan)],
  });
  const mod = new Module(parserFile, module);
  mod.filename = parserFile;
  mod.paths = Module._nodeModulePaths(path.dirname(parserFile));
  mod._compile(result.outputFiles[0].text, parserFile);
  if (!mod.exports.DetailedParser) throw new Error(`${parserFile} does not export DetailedParser`);
  return { DetailedParser: mod.exports.DetailedParser, localParser: localParser || null, localMan: localMan || null };
}

async function loadProjectModules(cwd, DetailedParser) {
  const file = path.join(cwd, 'dnti.modules.json');
  if (!await exists(file)) return { forced: [], external: [] };
  const config = JSON.parse(await fs.readFile(file, 'utf8'));
  const entries = Array.isArray(config) ? config : [
    ...(config.modules || []),
    ...Object.entries(config).filter(([key, enabled]) => key !== 'modules' && enabled === true).map(([key]) => key),
  ];
  const forced = new Set();
  const external = [];
  for (const entry of entries) {
    const name = typeof entry === 'string' ? entry : entry?.path || entry?.name;
    if (!name || typeof name !== 'string') throw new Error(`Invalid entry in ${file}`);
    if (!/[\\/]|\.tsx?$/.test(name)) {
      if (!DetailedParser.registryModuleNames?.includes(name)) throw new Error(`Unknown module '${name}' in ${file}`);
      forced.add(name);
      continue;
    }
    const moduleFile = path.resolve(cwd, name);
    if (!await exists(moduleFile)) throw new Error(`Module file not found: ${moduleFile}`);
    const result = await esbuild.build({
      entryPoints: [moduleFile], bundle: true, write: false, platform: 'node', format: 'cjs',
      target: 'node20', plugins: [sourceResolver(cwd, null, null)],
    });
    const loaded = new Module(moduleFile, module);
    loaded.filename = moduleFile;
    loaded.paths = Module._nodeModulePaths(path.dirname(moduleFile));
    loaded._compile(result.outputFiles[0].text, moduleFile);
    const definition = loaded.exports;
    if (typeof definition.detectUse !== 'function' || typeof definition.register !== 'function') {
      throw new Error(`Module ${moduleFile} must export detectUse(source) and register(parser, services)`);
    }
    const id = definition.id || path.basename(moduleFile).replace(/\.tsx?$/, '');
    if (external.some(module => module.id === id) || DetailedParser.registryModuleNames?.includes(id)) {
      throw new Error(`Duplicate module id '${id}' in ${file}`);
    }
    external.push({ id, detectUse: definition.detectUse, register: definition.register });
  }
  return { forced: [...forced], external };
}

function directive(line) {
  const match = line.match(/^\s*backUpPathReplace\s+\/((?:\\.|[^/])+)\/([dgimsuvy]*)\s*->\s*(.+?)\s*$/);
  if (!match) return null;
  const raw = match[3].trim();
  const replacement = /^(["']).*\1$/.test(raw) ? raw.slice(1, -1) : raw;
  return { pattern: new RegExp(match[1], match[2]), replacement };
}

async function resolveDsl(file, inherited = [], ancestors = new Set()) {
  const absolute = path.resolve(file);
  if (ancestors.has(absolute)) throw new Error(`Circular Shader DSL import: ${absolute}`);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(absolute);
  const source = (await fs.readFile(absolute, 'utf8')).replace(/^\uFEFF/, '');
  const lines = source.split(/\r?\n/);
  const active = [...inherited, ...lines.map(directive).filter(Boolean)];
  const output = [];
  for (const line of lines) {
    if (directive(line)) continue;
    const imported = line.match(/^\s*import\s*<([A-Za-z_][\w-]*)>\s+from\s+(.+?)\s*$/);
    if (imported && /\.shaderdsl\.ts["']?$/.test(imported[2])) {
      const target = imported[2].trim().replace(/^["']|["']$/g, '');
      const importedSource = await resolveDsl(path.resolve(path.dirname(absolute), target), active, nextAncestors);
      output.push(importedSource.split(/\r?\n/).filter((importedLine) =>
        !/^\s*<(?:Pre\/?|Pos\/?)>\s*$/.test(importedLine)).join('\n'));
      continue;
    }
    output.push(/^\s*backUp\s*:/.test(line)
      ? active.reduce((current, item) => current.replace(item.pattern, item.replacement), line)
      : line);
  }
  return output.join('\n');
}

function matchesSnippetFolder(folder, id) {
  const a = folder.toLowerCase();
  const b = id.toLowerCase();
  let index = 0;
  for (const char of a) if (char === b[index]) index++;
  return index === b.length;
}

function resolveAxisSnippet(text, id) {
  const axis = /^c2$/i.test(id) ? 0 : /^c3$/i.test(id) ? 1 : null;
  if (axis === null) return text;
  let current = null;
  return text.split(/\r?\n/).filter((line) => {
    const start = line.match(/^\s*\/\/\$(\d+)\s*-\s*Begin\s*$/);
    if (start) { current = Number(start[1]); return false; }
    if (/^\s*\/\/\$\d+\s*-\s*END\s*$/.test(line)) { current = null; return false; }
    return current === null || current === axis;
  }).map((line) => line.replace(/\$\[([^\]]+)\]\$/g, (_, choices) => {
    const parts = choices.split(',');
    return (parts[axis] || parts[0]).trim();
  })).join('\n');
}

async function readSnippets(cwd, id) {
  const root = path.join(cwd, 'parser_snippets');
  if (!await exists(root)) return [];
  const directories = (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && (entry.name === 'shared' || matchesSnippetFolder(entry.name, id)))
    .map((entry) => entry.name).sort();
  const snippets = [];
  for (const directory of directories) {
    const full = path.join(root, directory);
    for (const name of (await fs.readdir(full)).filter((name) => name.endsWith('.snippet.ts')).sort()) {
      const content = resolveAxisSnippet(await fs.readFile(path.join(full, name), 'utf8'), id);
      snippets.push({ name, directory, content });
    }
  }
  return snippets;
}

function insertAtMarker(source, marker, code, after = false) {
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Snippet marker not found: ${marker}`);
  const position = after ? index + marker.length : index;
  return source.slice(0, position) + (after ? '\n' : '') + code + (after ? '' : '\n') + source.slice(position);
}

function applySnippets(source, snippets, config = {}, id = '') {
  const explicit = Array.isArray(config.snippets) ? config.snippets : [];
  const automatic = snippets.filter((item) => item.directory !== 'shared' && !item.name.startsWith('00_'));
  const template = snippets.find((item) => item.name === '00_pre_imports_and_async_func_wrapper.snippet.ts');
  const commonImports = snippets.find((item) => item.name === 'commonImports.snippet.ts');
  const automaticCode = automatic.map((item) => item.content).join('\n');
  const hasBodyMarker = !!template && /__SNIPPET_BODY(?:_C[23])?__/.test(template.content);
  const bootstrap = template
    ? template.content
      .replace(/__SHADERDSL_ID__/g, id.toLowerCase())
      .replace(/__SNIPPET_BODY(?:_C[23])?__/g, automaticCode)
    : '(async () => {\nconst canvas = document.getElementById("shaderdsl-canvas");\nif (!canvas) throw new Error("Missing #shaderdsl-canvas");\nconst gl = canvas.getContext("webgl2");\nif (!gl) throw new Error("WebGL2 is required");\nconst ctx = gl;\nconst webglMan = new WebGLMan(gl);';
  if (!source.includes('//<Pre>') || !source.includes('//</Pre>')) {
    throw new Error('Parser output has no //<Pre> anchor');
  }
  source = source.replace(/\/\/<Pre>\s*[\s\S]*?\/\/<\/Pre>/,
    `//<Pre>\n${bootstrap}${!hasBodyMarker && automaticCode ? '\n' + automaticCode : ''}\n//</Pre>`);
  if (commonImports) source = `${commonImports.content}\n${source}`;
  if (source.includes('//<Pos>')) source = source.replace(/\/\/<Pos>\s*[\s\S]*?\/\/<\/Pos>/, '//<Pos>\n})();\n//</Pos>');
  for (const item of explicit) {
    if (!item || typeof item.file !== 'string') throw new Error('Each snippet needs a file');
    const snippet = item.content;
    const at = item.at || 'pre';
    if (at === 'pre') source = insertAtMarker(source, '//</Pre>', snippet);
    else if (at === 'post') source = insertAtMarker(source, '//<Pos>', snippet, true);
    else if (at.startsWith('before:')) source = insertAtMarker(source, at.slice(7), snippet);
    else if (at.startsWith('after:')) source = insertAtMarker(source, at.slice(6), snippet, true);
    else throw new Error(`Unknown snippet position: ${at}`);
  }
  if (!template) {
    const imports = ['WebGLMan', 'TexExamples'].filter((name) =>
      !new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'][^"']*webglMan\\.(?:js|ts)["']`).test(source));
    if (imports.length) source = `import { ${imports.join(', ')} } from "/Code/WebGL/webglMan.js";\n${source}`;
  }
  const helpers = ['__mountGlobalBlocks', '__prepareMathFunction'].filter((name) =>
    source.includes(name) && !new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source));
  if (helpers.length) source = `import { ${helpers.join(', ')} } from "/Code/opengl/opengl.js";\n${source}`;
  source = source.replace(/if\(!WebGLMan\.stWebGLMan\.gl\)\s*WebGLMan\.setGL\(gl\);\s*/g, '');
  source = source.replace(/WebGLMan\.program\(/g, 'webglMan.program(');
  return source;
}

async function parseFiles(files, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const outDir = path.resolve(cwd, options.outDir || 'generated');
  const { DetailedParser, localParser, localMan } = await loadParser(cwd);
  const configPath = path.join(cwd, 'shaderdsl.config.json');
  const config = await exists(configPath) ? JSON.parse(await fs.readFile(configPath, 'utf8')) : {};
  const projectModules = await loadProjectModules(cwd, DetailedParser);
  const outputs = [];
  for (const input of files) {
    const absolute = path.resolve(cwd, input);
    const fileName = path.basename(absolute);
    if (!dslSuffix.test(fileName)) throw new Error(`Expected *.shaderdsl.ts: ${input}`);
    const match = dslName.exec(fileName);
    const id = match ? match[1] : fileName.replace(dslSuffix, '').replace(/[^A-Za-z0-9_-]/g, '_');
    const source = await resolveDsl(absolute);
    const basename = `generatedParser${id}`;
    const tsFile = path.join(outDir, basename + '.ts');
    const jsFile = path.join(outDir, basename + '.js');
    await fs.mkdir(outDir, { recursive: true });
    await DetailedParser.parse(source, null, {}, tsFile, undefined, fileName.replace(dslSuffix, ''), false,
      config.runtimeFeatures || {}, [...(config.registryModules || []), ...projectModules.forced], projectModules.external);
    const snippets = await readSnippets(cwd, id);
    const explicit = [];
    for (const item of config.snippets || []) {
      explicit.push({ ...item, content: await fs.readFile(path.resolve(cwd, item.file), 'utf8') });
    }
    let generated = await fs.readFile(tsFile, 'utf8');
    generated = applySnippets(generated, snippets, { snippets: explicit }, id);
    await fs.writeFile(tsFile, generated);
    await esbuild.build({
      stdin: { contents: generated, resolveDir: outDir, sourcefile: tsFile, loader: 'ts' },
      outfile: jsFile, bundle: true, platform: 'browser', format: 'esm', target: 'es2022',
      plugins: [sourceResolver(cwd, localParser, localMan)],
    });
    outputs.push({ input: absolute, tsFile, jsFile });
    console.log(`[dnti_shaderdsl] ${jsFile}`);
  }
  return outputs;
}

async function parseAll(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const files = (await fs.readdir(cwd, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && dslSuffix.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (!files.length) throw new Error(`No *.shaderdsl.ts files found in ${cwd}`);
  const imported = new Set();
  for (const file of files) {
    const source = await fs.readFile(path.join(cwd, file), 'utf8');
    for (const match of source.matchAll(/^\s*import\s*<[^>]+>\s+from\s+(.+?\.shaderdsl\.ts)\s*$/gm)) {
      imported.add(path.resolve(cwd, match[1].trim().replace(/^["']|["']$/g, '')));
    }
  }
  const entryPoints = files.filter((file) => !imported.has(path.join(cwd, file)));
  if (!entryPoints.length) throw new Error(`No top-level Shader DSL entry points found in ${cwd}`);
  return parseFiles(entryPoints, { ...options, cwd, outDir: options.outDir || 'generated' });
}

module.exports = { parseFiles, parseAll, resolveDsl, loadParser, loadProjectModules };
