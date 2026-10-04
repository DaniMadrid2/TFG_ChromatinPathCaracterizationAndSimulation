const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn, spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadParser, parseFiles, parseAll, resolveDsl } = require('../dist/runner.cjs');
const { startServer } = require('../dist/lib/server.js');
const { startBackupServer } = require('../dist/lib/backups.js');
const { shouldWatchTs, watchProject } = require('../dist/watch.cjs');
const { init } = require('../dist/initializer.cjs');
const { registryEntry } = require('./registry-loader.cjs');

test('discovers registry modules without editing the parser', async () => {
  await temporaryWorkspace(async (root) => {
    const parser = path.join(root, 'Code', 'WebGL', 'parser');
    const folder = path.join(parser, 'registryModules');
    await fs.mkdir(folder, { recursive: true });
    await fs.mkdir(path.join(parser, 'objects'));
    await fs.mkdir(path.join(parser, 'functions'));
    await fs.writeFile(path.join(folder, 'sample.ts'), 'export const id = "sample"; export const register = () => ({ id });\n');
    await fs.writeFile(path.join(parser, 'objects', 'sample.ts'), 'export const register = () => ({ objects: {} });\n');
    await fs.writeFile(path.join(parser, 'functions', 'sample.ts'), 'export const register = () => ({ functions: {} });\n');
    const entry = await registryEntry(path.join(parser, 'webglParser.ts'), parser);
    assert.match(entry, /registryDefinitions = \[/);
    assert.match(entry, /sample\.ts/);
    assert.match(entry, /register\(parser, services\)/);
    await assert.rejects(fs.access(path.join(folder, 'index.ts')));
  });
});

test('capsule implementation contributes object and function DSL handlers', async () => {
  await temporaryWorkspace(async (root) => {
    const { DetailedParser } = await loadParser(root);
    DetailedParser.activateRegistries('MeshProgram SolidMeshProgram createIdealMesh fillMeshTexture');
    assert.equal(typeof DetailedParser.ObjectRegistry.MeshProgram, 'function');
    assert.equal(typeof DetailedParser.ObjectRegistry.SolidMeshProgram, 'function');
    assert.equal(typeof DetailedParser.FunctionRegistry.createIdealMesh, 'function');
    assert.equal(typeof DetailedParser.FunctionRegistry.fillMeshTexture, 'function');
    assert.match(DetailedParser.transpileSimpleStatement('fillMeshTexture a (x,y)=>{sin(x)}', new Set()).join('\n'), /fillMeshTexture.*__prepareMathFunction/);
    assert.match(DetailedParser.transpileSimpleStatement('mesh = MeshProgram input=TexUnit20 4x4', new Set()).join('\n'), /new MeshRenderingProgram/);
    assert.match(DetailedParser.transpileSimpleStatement('MeshProgram input=TexUnit20 1024x1024', new Set()).join('\n'), /var meshProgram = new MeshRenderingProgram/);
    assert.match(DetailedParser.transpileSimpleStatement('SolidMeshProgram input=TexUnit20 4x3', new Set()).join('\n'), /var solidMeshProgram = new SolidMeshRenderingProgram/);
    const SolidMesh = DetailedParser.GlobalContext.SolidMeshRenderingProgram;
    const solid = new SolidMesh({}, 'TexUnit20', 4, 3);
    solid.uInt = () => ({ set() {} });
    solid.setSize(4, 3);
    assert.equal(solid.totalSegments * 2, 18);
    assert.match(solid.vertexPositionCode(), /rowStride = msdLength \* 2 \+ 2/);
    solid.initDepthBefDraw = () => {};
    solid.bindTexName2TexUnit = () => {};
    solid.setViewport = () => {};
    solid.clearColor = () => {};
    let drawCall;
    solid.drawArrays = (...args) => { drawCall = args; };
    solid.draw(0, 0, 640, 480, undefined, 'LINES');
    assert.deepEqual(drawCall, ['TRIANGLE_STRIP', 0, 18]);
    const width = 4;
    const height = 3;
    const stride = width * 2 + 2;
    const vertices = Array.from({ length: drawCall[2] }, (_, id) => {
      const row = Math.floor(id / stride);
      const inRow = id % stride;
      return [inRow === width * 2 + 1 ? 0 : Math.min(Math.floor(inRow / 2), width - 1),
        row + (inRow >= width * 2 ? 1 : inRow % 2)];
    });
    const cells = new Map();
    for (let i = 2; i < vertices.length; i++) {
      const points = vertices.slice(i - 2, i + 1);
      const twiceArea = (points[1][0] - points[0][0]) * (points[2][1] - points[0][1])
        - (points[1][1] - points[0][1]) * (points[2][0] - points[0][0]);
      if (!twiceArea) continue;
      const x = Math.min(...points.map((point) => point[0]));
      const y = Math.min(...points.map((point) => point[1]));
      assert.equal(Math.max(...points.map((point) => point[0])) - x, 1);
      assert.equal(Math.max(...points.map((point) => point[1])) - y, 1);
      const key = `${x},${y}`;
      cells.set(key, (cells.get(key) || 0) + 1);
    }
    assert.equal(cells.size, (width - 1) * (height - 1));
    assert.ok([...cells.values()].every((count) => count === 2));
    assert.match(DetailedParser.transpileSimpleStatement('Axis3DGroup axisLength=vec3(15.3)', new Set()).join('\n'), /new Axis3DGroup/);
    assert.match(DetailedParser.transpileSimpleStatement('MeshFillerProgram TexUnit20 "(x,y)=>x"', new Set()).join('\n'), /new MeshFillerProgram/);
  });
});

test('solid mesh compiles with a direct capsule import', async () => {
  await temporaryWorkspace(async (root) => {
    const snippets = path.join(root, 'parser_snippets', 'shared');
    await fs.mkdir(snippets, { recursive: true });
    await fs.writeFile(path.join(snippets, 'commonImports.snippet.ts'),
      'import { MeshRenderingProgram } from "/Code/WebGL/webglCapsules.js";\n');
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'),
      '<Pre/>\nSolidMeshProgram input=TexUnit20 4x3\n<Pos>\n');
    const [output] = await parseFiles(['parseTextC1.shaderdsl.ts'], { cwd: root });
    const generated = await fs.readFile(output.tsFile, 'utf8');
    assert.match(generated, /new SolidMeshRenderingProgram\(/);
    assert.match(generated, /from "\/Code\/WebGL\/parser\/registryModules\/capsules\.js"/);
    assert.doesNotMatch(generated, /from "\/Code\/WebGL\/webglCapsules\.js"/);
    await fs.access(output.jsFile);
  });
});

test('dnti.modules.json selects a built-in module and loads a TypeScript module by path', async () => {
  await temporaryWorkspace(async (root) => {
    await fs.writeFile(path.join(root, 'dnti.modules.json'), JSON.stringify({ modules: ['MeshCapsule', './Custom.ts'] }));
    await fs.writeFile(path.join(root, 'Custom.ts'), [
      'export const id = "Custom";',
      'export const detectUse = () => "Toggled";',
      'export const register = () => ({ id, browserSetup: ["const customReady = true;"],',
      '  transpile: [(line: string) => line === "customPing" ? ["console.log(customReady);"] : null] });',
    ].join('\n'));
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'), '<Pre>\ncustomPing\n<Pos>\n');
    const [result] = await parseFiles(['parseTextC1.shaderdsl.ts'], { cwd: root });
    const generated = await fs.readFile(result.tsFile, 'utf8');
    assert.match(generated, /const customReady = true;/);
    assert.match(generated, /console\.log\(customReady\);/);
    const { loadProjectModules, loadParser } = require('../dist/runner.cjs');
    const { DetailedParser } = await loadParser(root);
    const modules = await loadProjectModules(root, DetailedParser);
    DetailedParser.activateRegistries('', modules.forced, modules.external);
    assert.ok(DetailedParser.activeRegistryModules.some(module => module.id === 'MeshCapsule'));
    assert.ok(DetailedParser.activeRegistryModules.some(module => module.id === 'Custom'));
    modules.external[0].detectUse = () => false;
    DetailedParser.activateRegistries('', modules.forced, modules.external);
    assert.ok(!DetailedParser.activeRegistryModules.some(module => module.id === 'Custom'));
  });
});

test('emits backup runtime only for backup DSL or explicit configuration', async () => {
  await temporaryWorkspace(async (root) => {
    const name = 'parseTextC1.shaderdsl.ts';
    const file = path.join(root, name);
    await fs.writeFile(file, '<Pre>\ndrawLines -> [] size [1,1] {\n backUp: /test/lines/\n}\n<Pos>\n');
    const [result] = await parseFiles([name], { cwd: root });
    let generated = await fs.readFile(result.tsFile, 'utf8');
    assert.match(generated, /import \{ BackupRuntime \}/);
    assert.match(generated, /backupRuntime\.storeDrawBlock\("drawLines"/);
    assert.doesNotMatch(generated, /import \{ RuntimeLetSource \}/);
    await fs.writeFile(path.join(root, 'shaderdsl.config.json'), JSON.stringify({ runtimeFeatures: { backup: false } }));
    await assert.rejects(parseFiles([name], { cwd: root }), /backup.*disabled/);
  });
});

test('runtime implementations own their detection and packaged contracts', async () => {
  const bundled = path.join(__dirname, '..', 'dist', 'lib', 'Code', 'WebGL');
  for (const name of ['BackupRuntime', 'RuntimeLetSource', 'ShaderFilterSet']) {
    const source = await fs.readFile(path.join(bundled, 'runtime', `${name}.ts`), 'utf8');
    assert.match(source.trimEnd(), /export const detectUse = [\s\S]+;$/);
    assert.match(source, /export const runtimeFeature:/);
  }
  await fs.access(path.join(bundled, 'parser', 'runtimeFeature.ts'));
  await fs.access(path.join(bundled, 'parser', 'registryModules', 'types.ts'));
  await temporaryWorkspace(async (root) => {
    const { DetailedParser } = await loadParser(root);
    assert.equal(DetailedParser.runtimeFeatures.length, 3);
    assert.equal(DetailedParser.runtimeFeatures[0].detectUse({ source: 'backUp: /x/' }), true);
  });
});

async function temporaryWorkspace(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dnti-shaderdsl-'));
  try {
    await run(root);
  } finally {
    assert.equal(path.dirname(root), os.tmpdir());
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('resolves imported Shader DSL and inherited backup path replacement', async () => {
  await temporaryWorkspace(async (root) => {
    const base = path.join(root, 'parseTextC23.shaderdsl.ts');
    const derived = path.join(root, 'parseTextC2.shaderdsl.ts');
    await fs.writeFile(base, 'drawTriangles -> [out] size [1,1] {\n backUp: /parseTextC23/tauMom/\n}\n');
    await fs.writeFile(derived, 'backUpPathReplace /parseTextC23/ -> "parseTextC2"\nimport <Mid> from ./parseTextC23.shaderdsl.ts\n');
    const result = await resolveDsl(derived);
    assert.match(result, /backUp: \/parseTextC2\/tauMom\//);
    assert.doesNotMatch(result, /import <Mid>|backUpPathReplace/);
  });
});

test('uses a complete local WebGL parser and manager pair', async () => {
  for (const directory of ['Code/WebGL', 'WebGL']) await temporaryWorkspace(async (root) => {
    const local = path.join(root, 'lib', directory);
    const bundled = path.join(__dirname, '..', 'dist', 'lib', 'Code', 'WebGL');
    await fs.mkdir(path.join(local, 'parser'), { recursive: true });
    const parser = await fs.readFile(path.join(bundled, 'parser', 'webglParser.ts'), 'utf8');
    assert.match(parser, /^export class DetailedParser\s*\{/m);
    await fs.writeFile(path.join(local, 'parser', 'webglParser.ts'), parser.replace(
      /^export class DetailedParser\s*\{/m,
      'export class DetailedParser { static localOverrideMarker = true;',
    ));
    await fs.copyFile(path.join(bundled, 'webglMan.ts'), path.join(local, 'webglMan.ts'));
    const loaded = await loadParser(root);
    assert.equal(loaded.DetailedParser.localOverrideMarker, true);
    assert.equal(loaded.localMan, path.join(local, 'webglMan.ts'));
  });
});

test('ignores an incomplete local WebGL override', async () => {
  await temporaryWorkspace(async (root) => {
    const local = path.join(root, 'lib', 'Code', 'WebGL');
    await fs.mkdir(local, { recursive: true });
    await fs.writeFile(path.join(local, 'webglParser.ts'), 'throw new Error("LOCAL_PARSER_USED");');
    await fs.writeFile(path.join(local, 'webglMan.js'), 'throw new Error("LOCAL_MANAGER_USED");');
    const loaded = await loadParser(root);
    assert.equal(loaded.localParser, null);
    assert.equal(loaded.localMan, null);
    const name = 'parseTextC1.shaderdsl.ts';
    await fs.writeFile(path.join(root, name),
      '<Pre/>\nprogram demo "demo" {\n}\nuse demo\ndrawTriangles -> [] size [8,8] {\n}\n<Pos>\n');
    const [output] = await parseFiles([name], { cwd: root });
    const browser = await fs.readFile(output.jsFile, 'utf8');
    assert.doesNotMatch(browser, /LOCAL_MANAGER_USED|LOCAL_PARSER_USED/);
    assert.match(browser, /createTexture2D/);
  });
});

test('generates browser output without local WebGL libraries', async () => {
  await temporaryWorkspace(async (root) => {
    const name = 'parseTextC1.shaderdsl.ts';
    await fs.writeFile(path.join(root, name),
      '<Pre/>\nprogram demo "demo" {\n}\nuse demo\ndrawTriangles -> [] size [8,8] {\n}\n<Pos>\n');
    const [output] = await parseFiles([name], { cwd: root });
    assert.equal(output.jsFile, path.join(root, 'generated', 'generatedParserC1.js'));
    assert.match(await fs.readFile(output.tsFile, 'utf8'), /shaderdsl-canvas/);
    assert.match(await fs.readFile(output.jsFile, 'utf8'), /shaderdsl-canvas/);
  });
});

test('transpiles line modes, inferred counts and attribute templates', () => {
  const { DetailedParser: parser } = require('../dist/parser.cjs');
  parser.transpileTemplateBlocks = new Map([['positions', {
    kind: 'attributes', lines: ['{aPos}vec2', '"aMatrix" -> {matrices}mat2'],
  }]]);
  const output = parser.transpileDrawCallBlock(
    'drawLINESTRIP "aPos" {trajectory} -> [] size [640,480]',
    ['attributes {', 'positions', '"aNumber" -> {weights}f', '}'], new Set(),
  ).join('\n');
  assert.match(output, /VAO\.attribute\("aPos", __data, __dim\)/);
  assert.match(output, /VAO\.attribute\("aMatrix", matrices, 2, "FLOAT", 0, 0, false, 2\)/);
  assert.match(output, /VAO\.attribute\("aNumber", weights, 1, "FLOAT"/);
  assert.match(output, /drawArrays\("LINE_STRIP", 0, lastUsedProgram\.VAO\.vaoLength\)/);
  const counted = parser.transpileDrawCallBlock('drawLines "aPos" {trajectory} 10 -> []', [], new Set()).join('\n');
  assert.match(counted, /drawArrays\("LINES", 0, 10\)/);
  const typed = parser.transpileDrawCallBlock('drawTriangleStrip {trajectory}vec3 -> []', [], new Set()).join('\n');
  assert.match(typed, /VAO\.attribute\("aPos", trajectory, 3, "FLOAT", 0, 0, false, 1\)/);
  assert.match(typed, /drawArrays\("TRIANGLE_STRIP", 0, lastUsedProgram\.VAO\.vaoLength\)/);
  const integer = parser.transpileDrawCallBlock('drawPoints "aIndex" {indices}uvec2 4 -> []', [], new Set()).join('\n');
  assert.match(integer, /VAO\.attribute\("aIndex", indices, 2, "UNSIGNED_INT", 0, 0, false, 1\)/);
  assert.match(integer, /drawArrays\("POINTS", 0, 4\)/);
});

test('object declarations accept a trailing semicolon and number implicit aliases from 2', () => {
  const { DetailedParser: parser } = require('../dist/parser.cjs');
  const declared = new Set();
  const explicit = parser.transpileSimpleStatement('camera = Camera3D pos=vec3(0,4,12);', declared).join('\n');
  assert.match(explicit, /var camera = new Camera3D\(new Vector3D\(0,4,12\)\);/);
  assert.doesNotMatch(explicit, /Vector3D\([^)]*\);\)/);
  const first = parser.transpileSimpleStatement('Camera3D pos=vec3(0,4,12);', declared).join('\n');
  const second = parser.transpileSimpleStatement('Camera3D pos=vec3(0,0,5);', declared).join('\n');
  assert.match(first, /var camera3D = new Camera3D/);
  assert.match(second, /var camera3D2 = new Camera3D/);
});

test('transpiles swaps, temporary rebinding and backup retention options', async () => {
  const { DetailedParser: parser } = await loadParser(path.join(__dirname, '..'));
  assert.deepEqual(parser.transpileSimpleStatement('swap {a, b, c}', new Set()), ['[a, b, c] = [b, c, a];']);
  assert.deepEqual(parser.transpileSimpleStatement('a <=> b', new Set()), ['[a, b] = [b, a];']);
  const draw = parser.transpileDrawCallBlock('drawPoints -> [] size [8,8]', [
    'rebind-temp {', 'inputTexture -> TexUnit12', '}',
    'backUp: /test/points/, maxBackUpIterations: 20, priority: last',
  ], new Set()).join('\n');
  assert.match(draw, /getParameter\(gl\.TEXTURE_BINDING_2D\)/);
  assert.match(draw, /gl\.bindTexture\(gl\.TEXTURE_2D, __tempRebind_0_0Old\)/);
  assert.match(draw, /storeDrawBlock\("drawPoints", "\/test\/points\/", \[\], \[\], lastUsedProgram, \{ maxBackUpIterations: 20, priority: "last" \}\)/);
  await temporaryWorkspace(async (root) => {
    const name = 'parseTextC1.shaderdsl.ts';
    await fs.writeFile(path.join(root, name), '<Pre/>\nlet a = 1\nlet b = 2\ntick {\npingpong (a, b) {\n a <=> b\n}\n}\n<Pos>\n');
    const [output] = await parseFiles([name], { cwd: root });
    assert.match(await fs.readFile(output.tsFile, 'utf8'), /\[a, b\] = \[b, a\];/);
  });
});

test('last-priority cleanup removes only the selected draw files', async () => {
  await temporaryWorkspace(async (root) => {
    const folder = path.join(root, 'backups', 'scene', '2');
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'drawPoints_uniforms.txt'), 'old');
    await fs.writeFile(path.join(folder, 'drawTriangles_uniforms.txt'), 'keep');
    const server = await startBackupServer(0, root, { allowDeletion: true });
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/backups/clear-generation`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'scene/2', prefix: 'drawPoints_', content: '' }),
      });
      assert.equal(response.status, 200);
      await assert.rejects(fs.access(path.join(folder, 'drawPoints_uniforms.txt')));
      assert.equal(await fs.readFile(path.join(folder, 'drawTriangles_uniforms.txt'), 'utf8'), 'keep');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});

test('transfers texture values and resolves byte-sized draw dimensions', async () => {
  const { DetailedParser: parser } = await loadParser(path.join(__dirname, '..'));
  parser.transpileTexAliasToTextureVar.set('positionTexture', 'positionTexture');
  parser.transpileTexAliasToUniform.set('positionTexture', 'positionTexture');
  parser.transpileTexDeclaredNames.add('positionTexture');
  assert.match(parser.transpileSimpleStatement('positionTexture <= trajectory', new Set()).join('\n'),
    /positionTexture\.fill\(trajectory\)/);
  assert.match(parser.transpileSimpleStatement('trajectory <= positionTexture', new Set()).join('\n'),
    /positionTexture\.read\(\)/);
  assert.deepEqual(parser.transpileSimpleStatement('unbindFBO movePoints', new Set()),
    ['movePoints.unbindFBO();']);
  const draw = parser.transpileDrawCallBlock(
    'drawLineStrip {positionTexture}vec2 -> [] size [640,480]', [], new Set(),
  ).join('\n');
  assert.match(draw, /bindTexture\(positionTexture, "positionTexture", positionTexture\.unit\)/);
  assert.match(draw, /drawArrays\("LINE_STRIP", 0, positionTexture\.w \* positionTexture\.h\)/);
  assert.doesNotMatch(draw, /VAO\.attribute/);
  const sizedDraw = parser.transpileDrawCallBlock(
    'drawTriangles -> [positionTexture] size [1,trajectory.length]b', [], new Set(),
  ).join('\n');
  assert.match(sizedDraw, /Math\.ceil/);
  assert.match(sizedDraw, /positionTexture as any\)\.format/);
  assert.match(parser.transpileSizeToken('[1,trajectory.length]b', 'TexExamples.RGFloat'), /Math\.ceil/);
});

test('watches project TypeScript without reacting to generated output', async () => {
  await temporaryWorkspace(async (root) => {
    assert.equal(shouldWatchTs('parser_snippets/c1/code.snippet.ts', root, 'generated'), true);
    assert.equal(shouldWatchTs('generated/generatedParserC1.ts', root, 'generated'), false);
    assert.equal(shouldWatchTs('node_modules/tool/index.ts', root, 'generated'), false);
    let resolveChange;
    const changed = new Promise((resolve) => { resolveChange = resolve; });
    const watcher = watchProject({ cwd: root, delay: 30, run: async () => resolveChange() });
    let timeout;
    try {
      await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'), '<Pre/>\n');
      await Promise.race([
        changed,
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('watch timeout')), 3000); }),
      ]);
    } finally {
      clearTimeout(timeout);
      watcher.close();
    }
  });
});

test('parses attributes templates inside a complete draw block', async () => {
  await temporaryWorkspace(async (root) => {
    const name = 'parseTextC1.shaderdsl.ts';
    await fs.writeFile(path.join(root, name), `<Pre/>
let aPos = [[0,0], [1,1]]
positions_a = attributes {
  {aPos}vec2
}
program demo "demo" {
}
use demo
drawLineStrip -> [] size [8,8] {
  attributes {
    positions_a
  }
}
<Pos>
`);
    const [output] = await parseFiles([name], { cwd: root });
    const generated = await fs.readFile(output.tsFile, 'utf8');
    assert.match(generated, /VAO\.attribute\("aPos", aPos, 2, "FLOAT"/);
    assert.match(generated, /drawArrays\("LINE_STRIP", 0, lastUsedProgram\.VAO\.vaoLength\)/);
  });
});

test('parseAll skips imported shared DSL files', async () => {
  await temporaryWorkspace(async (root) => {
    await fs.writeFile(path.join(root, 'parseTextC12.shaderdsl.ts'), 'program demo "demo" {\n}\n');
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'),
      '<Pre/>\nimport <Mid> from ./parseTextC12.shaderdsl.ts\n<Pos>\n');
    const outputs = await parseAll({ cwd: root });
    assert.equal(outputs.length, 1);
    assert.match(outputs[0].tsFile, /generatedParserC1\.ts$/);
  });
});

test('init pointSimulation includes both entry points and GPU shaders', async () => {
  await temporaryWorkspace(async (root) => {
    const target = await init({ cwd: root, dir: 'points', template: 'pointSimulation' });
    for (const file of [
      'index.html', 'parseTextC1.shaderdsl.ts', 'parseTextC12.shaderdsl.ts',
      'parseTextC2.shaderdsl.ts', 'parser_snippets/c1/01_trajectory.snippet.ts',
      'parser_snippets/c2/01_trajectory.snippet.ts', 'glsl/movePoints.frag',
    ]) assert.ok((await fs.stat(path.join(target, file))).isFile(), file);
    const outputs = await parseAll({ cwd: target });
    assert.equal(outputs.length, 2);
  });
});

test('regenerates imported DSL without stale or duplicate snippet anchors', async () => {
  await temporaryWorkspace(async (root) => {
    await fs.writeFile(path.join(root, 'parseTextC12.shaderdsl.ts'),
      '<Pre>\nprogram demo "demo" {\n}\n<Pos>\n');
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'),
      '<Pre/>\nimport <Mid> from ./parseTextC12.shaderdsl.ts\n<Pos>\n');
    const snippetDir = path.join(root, 'parser_snippets', 'c1');
    await fs.mkdir(snippetDir, { recursive: true });
    const snippet = path.join(snippetDir, '01_trajectory.snippet.ts');
    await fs.writeFile(snippet, 'const trajectory = [1, 2];\n');
    const [first] = await parseFiles(['parseTextC1.shaderdsl.ts'], { cwd: root });
    assert.equal((await fs.readFile(first.tsFile, 'utf8')).match(/\/\/<Pre>/g)?.length, 1);
    await fs.writeFile(snippet, 'const trajectory = [3, 4];\n');
    const [second] = await parseFiles(['parseTextC1.shaderdsl.ts'], { cwd: root });
    const generated = await fs.readFile(second.tsFile, 'utf8');
    assert.equal((generated.match(/\/\/<Pre>/g) || []).length, 1);
    assert.equal((generated.match(/\/\/<Pos>/g) || []).length, 1);
    assert.match(generated, /const trajectory = \[3, 4\]/);
    assert.doesNotMatch(generated, /const trajectory = \[1, 2\]|trajectory2/);
  });
});

test('CLI help explains installation, GLSL and local overrides', () => {
  const cli = path.join(__dirname, '..', 'dist', 'cli.cjs');
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /npm install -g/);
  assert.match(result.stdout, /lib\/Code\/WebGL\/parser\/webglParser\.ts/);
  assert.match(result.stdout, /parser_snippets\/shared/);
  assert.match(result.stdout, /\/glsl\//);
  assert.match(result.stdout, /runserver \[port\] \[path\]/);
  assert.match(result.stdout, /--serve \[port\]/);
});

test('parse --serve accepts a port after the option', async () => {
  await temporaryWorkspace(async (root) => {
    await fs.writeFile(path.join(root, 'index.html'), '<h1>Ready</h1>');
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'),
      '<Pre/>\nprogram demo "demo" {\n}\nuse demo\ndrawTriangles -> [] size [8,8] {\n}\n<Pos>\n');
    const cli = path.join(__dirname, '..', 'dist', 'cli.cjs');
    const child = spawn(process.execPath, [cli, 'parse', '.', '--serve', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    try {
      const url = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`server timeout: ${output}`)), 5000);
        child.stdout.on('data', () => {
          const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
          if (match) { clearTimeout(timer); resolve(match[0]); }
        });
        child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`CLI exited ${code}: ${output}`)); });
      });
      const response = await fetch(url);
      assert.equal(await response.text(), '<h1>Ready</h1>');
    } finally {
      if (child.exitCode === null) {
        child.kill();
        await new Promise((resolve) => child.once('exit', resolve));
      }
    }
  });
});

test('runserver serves the selected directory in the foreground', async () => {
  await temporaryWorkspace(async (root) => {
    await fs.writeFile(path.join(root, 'index.html'), '<h1>Shader DSL</h1>');
    await fs.mkdir(path.join(root, 'glsl'));
    await fs.writeFile(path.join(root, 'glsl', 'demo.frag'), '#version 300 es');
    const server = await startServer(0, root);
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      const index = await fetch(base + '/');
      assert.equal(index.status, 200);
      assert.match(index.headers.get('content-type'), /text\/html/);
      assert.equal(await index.text(), '<h1>Shader DSL</h1>');
      const shader = await fetch(base + '/glsl/demo.frag');
      assert.equal(shader.status, 200);
      assert.equal(await shader.text(), '#version 300 es');
      const head = await fetch(base + '/index.html', { method: 'HEAD' });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), '');
      assert.equal((await fetch(base + '/missing.js')).status, 404);
      assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
