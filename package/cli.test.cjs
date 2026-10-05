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
    DetailedParser.activateRegistries('MeshProgram SolidMeshProgram Camera3D Axis3DGroup createIdealMesh fillMeshTexture');
    assert.equal(typeof DetailedParser.ObjectRegistry.MeshProgram, 'function');
    assert.equal(typeof DetailedParser.ObjectRegistry.SolidMeshProgram, 'function');
    assert.equal(typeof DetailedParser.FunctionRegistry.createIdealMesh, 'function');
    assert.equal(typeof DetailedParser.FunctionRegistry.fillMeshTexture, 'function');
    assert.match(DetailedParser.transpileSimpleStatement('fillMeshTexture a (x,y)=>{sin(x)}', new Set()).join('\n'), /fillMeshTexture.*__prepareMathFunction/);
    assert.match(DetailedParser.transpileSimpleStatement('mesh = MeshProgram input=TexUnit20 4x4', new Set()).join('\n'), /new MeshRenderingProgram/);
    assert.match(DetailedParser.transpileSimpleStatement('MeshProgram input=TexUnit20 1024x1024', new Set()).join('\n'), /var meshProgram = new MeshRenderingProgram/);
    assert.match(DetailedParser.transpileSimpleStatement('SolidMeshProgram input=TexUnit20 4x3', new Set()).join('\n'), /var solidMeshProgram = new SolidMeshRenderingProgram/);
    assert.match(DetailedParser.transpileSimpleStatement('DynamicSolidMeshProgram input=TexUnit20 1024x1024', new Set()).join('\n'), /var dynamicSolidMeshProgram = new DynamicSolidMeshRenderingProgram/);
    const DynamicMesh = DetailedParser.GlobalContext.DynamicSolidMeshRenderingProgram;
    const dynamic = new DynamicMesh({}, 'TexUnit20', 1024, 1024);
    assert.match(dynamic.vertexExtraUniforms(), /lodFullResolutionCells/);
    assert.match(dynamic.vertexExtraUniforms(), /lodAnchorDistance/);
    assert.match(dynamic.vertexExtraUniforms(), /lodPeriodicXPositive/);
    assert.doesNotMatch(dynamic.vertexExtraUniforms(), /\b(?:float|int|vec[234])\s+flat\b/);
    assert.match(dynamic.vertexPositionCode(), /lodPriorityPoints\[i\]/);
    assert.doesNotMatch(dynamic.vertexPositionCode(), /lodCameraXZ/);
    assert.match(dynamic.vertexPositionCode(), /texelFetch\(values, wrapped, 0\)/);
    assert.match(dynamic.vertexExtraUniforms(), /lodOriginXZ/);
    assert.equal(dynamic.setGridRadius(128), dynamic);
    assert.equal(dynamic.totalSegments * 2, (257 * 2 + 2) * 256);
    assert.equal(dynamic.setRepeatRadius(500), dynamic);
    assert.equal(dynamic.setFullResolutionCells(48), dynamic);
    assert.equal(dynamic.setFalloff(8), dynamic);
    assert.equal(dynamic.setGridRadius(256), dynamic);
    assert.equal(dynamic.setRepeatRadius(100), dynamic);
    assert.equal(dynamic.setPriorityTexels([[512, 512]]), dynamic);
    assert.equal(dynamic.setGridRadius(512), dynamic);
    assert.equal(dynamic.setPriorityTexels([[512, 512], [508, 512], [516, 512], [512, 508], [512, 516]]), dynamic);
    assert.equal(dynamic.setLODOrigin(0, 0), dynamic);
    assert.equal(dynamic.nearestAxisIndex(0, dynamic.dx, dynamic.w, 0), 0);
    assert.equal(dynamic.setCameraPosition({ x: 50, z: 50 }), dynamic);
    assert.deepEqual(dynamic.lodOriginXZ, [50, 50]);
    assert.deepEqual(dynamic.priorityTexels[0], [512, 512]);
    assert.throws(() => new DynamicMesh({}, 'TexUnit20', 1024, 1024)
        .setGridRadius(128).setRepeatRadius(100).setPriorityTexels([[512, 512]]),
        /Not enough LOD vertices/);
    const outerCells = 512 - 128;
    const repeatedCenters = 100;
    const falloff = 64;
    let previousIndex = -1;
    for (let tile = 0; tile <= repeatedCenters; tile++) {
      const density = tile === repeatedCenters ? 1
        : (1 - Math.exp(-falloff * tile / repeatedCenters)) / (1 - Math.exp(-falloff));
      const index = tile === repeatedCenters ? outerCells
        : tile + Math.floor((outerCells - repeatedCenters) * density);
      assert.ok(index > previousIndex, `tile ${tile} must have its own vertex`);
      previousIndex = index;
      const texel = Math.round(tile * 1024 * 0.16 / 0.16 + 512);
      assert.equal(((texel % 1024) + 1024) % 1024, 512);
      const negativeTexel = Math.round(-tile * 1024 * 0.16 / 0.16 + 512);
      assert.equal(((negativeTexel % 1024) + 1024) % 1024, 512);
    }
    assert.throws(() => dynamic.setPriorityPoints(Array.from({ length: 17 }, (_, i) => [i, i])), /at most 16/);
    const cameraAliases = DetailedParser.transpileSimpleStatement('Camera3D camera2D|cam3D pos=vec3(0,4,20) |= cam2|cam4,cam5', new Set()).join('\n');
    assert.match(cameraAliases, /var camera2D = new Camera3D/);
    assert.match(cameraAliases, /var cam3D = camera2D;/);
    assert.match(cameraAliases, /var cam2 = camera2D;/);
    assert.match(cameraAliases, /var cam4 = camera2D;/);
    assert.match(cameraAliases, /var cam5 = camera2D;/);
    assert.doesNotMatch(cameraAliases, /var camera3D/);
    assert.match(DetailedParser.transpileSimpleStatement('Camera3D pos=vec3(0,0,0) |= cam2', new Set()).join('\n'), /var camera3D = new Camera3D/);
    const seededMesh = DetailedParser.transpileSimpleStatement('surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x+{time})+{offset.x,float};}.bind()', new Set()).join('\n');
    assert.match(seededMesh, /createIdealTexture\?\.\("TexUnit20"\)/);
    assert.doesNotMatch(seededMesh, /__prepareMathFunction|compiledCreateIdealMeshFn/);
    assert.match(seededMesh, /get time\(\)/);
    assert.match(seededMesh, /lastPreparedFunc =/);
    assert.match(seededMesh, /meshContext =/);
    const reusedMesh = DetailedParser.transpileSimpleStatement('MeshFillerProgram TexUnit20', new Set()).join('\n');
    assert.match(reusedMesh, /await meshFillerProgram\.loadFromTexture\(\)/);
    const filler = DetailedParser.GlobalContext.MeshFillerProgram;
    const calls = [];
    await filler.prototype.loadFromTexture.call({
      valsTexUnit: 'TexUnit20',
      getTextureByUnit: () => ({ lastPreparedFunc: '(x,y)=>{return {time};}', meshContext: { time: 7 } }),
      generateProgram: (...args) => calls.push(args),
      loadProgram: async () => calls.push('loaded'),
    });
    assert.equal(calls[0][0], '(x,y)=>{return {time};}');
    assert.equal(calls[0].at(-1).time, 7);
    assert.equal(calls[1], 'loaded');
    assert.deepEqual(DetailedParser.extractContextNamesFromCallback('(x,y)=>{let r=1;if(r) return r;}'), []);
    assert.deepEqual(DetailedParser.extractContextNamesFromCallback('(x,y)=>{let r={time};if(r) return r;}'), ['time']);
    const complexTexture = { lastPreparedFunc: '(x,y)=>{let r=x+{time};if(r>2) return 10;return r;}', meshContext: { get time() { return 2; } } };
    const gpuFiller = Object.create(filler.prototype);
    gpuFiller.valsTexUnit = 'TexUnit20';
    gpuFiller.getTextureByUnit = () => complexTexture;
    gpuFiller.generateProgram = (...args) => calls.push(args);
    gpuFiller.loadProgram = async () => calls.push('loaded');
    await gpuFiller.loadFromTexture();
    assert.equal(calls.at(-2)[0], complexTexture.lastPreparedFunc);
    const shaderFiller = Object.create(filler.prototype);
    shaderFiller.uniformsToUpdate = [];
    shaderFiller.generateProgram('(x,y)=>{let r=x+y;if(r===0) return 10;return cos(r)/r;}');
    assert.match(shaderFiller.fragPath, /float r =\s*x\+y;/);
    assert.match(shaderFiller.fragPath, /if\(r==0\.0\) \{ outRed = 10\.0; return; \}/);
    assert.doesNotMatch(shaderFiller.fragPath, /get if|float res/);
    shaderFiller.generateProgram('(x,y)=>{let r=0;for(let i=0;i<3;i++){r+=i;}while(r<4){r+=1;}return r;}');
    assert.match(shaderFiller.fragPath, /for\(float i =\s*0\.0;i<3\.0;i\+\+\)/);
    assert.match(shaderFiller.fragPath, /while\(r<4\.0\)/);
    shaderFiller.generateProgram('(x, y) => {let dx = (x - 512) * 0.05;let dy = (y - 512) * 0.05;let r = Math.sqrt(dx * dx + dy * dy);if (r === 0) return 10; return (cos(r) / r) * 15;}');
    assert.match(shaderFiller.fragPath, /float r =\s*sqrt\(dx \* dx \+ dy \* dy\)/);
    assert.match(shaderFiller.fragPath, /if \(r == 0\.0\) \{ outRed = 10\.0; return; \}/);
    const fillerWithoutProgram = Object.create(filler.prototype);
    assert.equal(fillerWithoutProgram.tick(), fillerWithoutProgram);
    assert.equal(fillerWithoutProgram.tick().draw(), fillerWithoutProgram);
    const updatedMesh = DetailedParser.transpileSimpleStatement('fillMeshTexture surface (x,y)=>{return sin(x+{time});}', new Set()).join('\n');
    assert.match(updatedMesh, /fillMeshTexture.*__prepareMathFunction/);
    assert.match(updatedMesh, /"time": time/);
    const SolidMesh = DetailedParser.GlobalContext.SolidMeshRenderingProgram;
    const solid = new SolidMesh({}, 'TexUnit20', 4, 3);
    const uniformChanges = [];
    solid.uInt = (name) => ({ set(value) { uniformChanges.push([name, value]); } });
    solid.smoothColor(false);
    assert.deepEqual(uniformChanges.at(-1), ['smoothColor', 0]);
    solid.smoothColor();
    assert.deepEqual(uniformChanges.at(-1), ['smoothColor', 1]);
    const repeatCalls = [];
    const repeatTexture = {};
    const repeatGl = {
      ACTIVE_TEXTURE: 1, TEXTURE_BINDING_2D: 2, TEXTURE0: 100, TEXTURE_2D: 3,
      TEXTURE_WRAP_S: 4, TEXTURE_WRAP_T: 5, REPEAT: 6, CLAMP_TO_EDGE: 7,
      getParameter: (key) => key === 1 ? 120 : null,
      activeTexture: (unit) => repeatCalls.push(['active', unit]),
      bindTexture: (target, texture) => repeatCalls.push(['bind', target, texture]),
      texParameteri: (target, axis, wrap) => repeatCalls.push(['wrap', axis, wrap]),
    };
    const repeatedMesh = new SolidMesh(repeatGl, 'TexUnit20', 4, 3);
    repeatedMesh.program = {};
    repeatedMesh.use = () => repeatedMesh;
    repeatedMesh.uInt = (name) => ({ set(value) { repeatCalls.push(['uniform', name, value]); } });
    repeatedMesh.getTextureByUnit = () => repeatTexture;
    assert.equal(repeatedMesh.setRepeat(true), repeatedMesh);
    assert.deepEqual(repeatCalls.filter((entry) => entry[0] === 'wrap'), [['wrap', 4, 6], ['wrap', 5, 6]]);
    assert.equal(repeatedMesh.setRepeat(false), repeatedMesh);
    assert.deepEqual(repeatCalls.filter((entry) => entry[0] === 'wrap').slice(-2), [['wrap', 4, 7], ['wrap', 5, 7]]);
    repeatedMesh.getTextureByUnit = () => undefined;
    assert.equal(repeatedMesh.setRepeat(true), repeatedMesh);
    repeatedMesh.getTextureByUnit = () => repeatTexture;
    repeatedMesh.setRepeat(true);
    assert.deepEqual(repeatCalls.filter((entry) => entry[0] === 'wrap').slice(-2), [['wrap', 4, 6], ['wrap', 5, 6]]);
    assert.match(DetailedParser.transpileSimpleStatement('meshProgram.setRepeat(true)', new Set()).join('\n'), /meshProgram\.setRepeat\(true\)/);
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

test('math callbacks receive typed and untyped DSL values at creation time', async () => {
  const source = await fs.readFile(path.join(__dirname, '..', 'src', 'dependencies', 'Code', 'opengl', 'opengl.js'), 'utf8');
  const helpers = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const callback = helpers.__prepareMathFunction('(x,y)=>{return sin(x+{time})+{offset.x,float};}', { time: 1, 'offset.x': 2 });
  assert.equal(callback(0, 0), Math.sin(1) + 2);
  const later = helpers.__prepareMathFunction('(x,y)=>{return sin(x+{time});}', { time: 3 });
  assert.equal(later(0, 0), Math.sin(3));
});

test('transpiles 3D textures inside programs and object-style aliases', () => {
  const { DetailedParser: parser } = require('../dist/parser.cjs');
  const declared = new Set(['samples']);
  const texture = parser.transpileTex2DResourceLine('demo', 'tex3D volume RES [4 x 4 x 3] RGFloat TexUnit7 <= samples', declared).join('\n');
  assert.match(texture, /demo\.createTexture3D\("volume", \[4, 4, 3\]/);
  assert.match(texture, /TexUnit7/);
  const object = parser.transpileSimpleStatement('volume |= other = texture3DArray RGFloat {samples} "volume" TexUnit7 [4 x 4 x 3]', new Set()).join('\n');
  assert.match(object, /texture3DArray/);
  assert.match(object, /var other = volume/);
  const program = parser.transpileSimpleStatement('calcPCAProgram = Program pca\/1_calcPCA |= calcPCA', new Set()).join('\n');
  assert.match(program, /var calcPCA = calcPCAProgram/);
});

test('parses a complete program with tex3D using the bundled runtime', async () => {
  await temporaryWorkspace(async (root) => {
    const name = 'parseTextC1.shaderdsl.ts';
    await fs.writeFile(path.join(root, name), `<Pre/>
let samples = new Float32Array(4 * 4 * 3 * 2)
program demo "demo" {
    tex3D volume RES [4 x 4 x 3] RGFloat TexUnit7 <= samples
}
volumeCopy = texture3DArray RGFloat {samples} "volumeCopy" TexUnit8 [4 x 4 x 3]
layers |= layerAlias = texture2DArray RFloat {samples} "layers" TexUnit9 [4 x 4 x 1]
<Pos>
`);
    const [output] = await parseFiles([name], { cwd: root });
    const generated = await fs.readFile(output.tsFile, 'utf8');
    assert.match(generated, /demo\.createTexture3D\("volume", \[4, 4, 3\]/);
    assert.match(generated, /var volumeCopy = lastUsedProgram\?\.texture3DArray\?\./);
    assert.match(generated, /var layers = lastUsedProgram\?\.texture2DArray\?\./);
    assert.match(generated, /var layerAlias = layers/);
    assert.ok((await fs.stat(output.jsFile)).size > 0);
  });
});

test('solid mesh compiles with a direct capsule import', async () => {
  await temporaryWorkspace(async (root) => {
    const snippets = path.join(root, 'parser_snippets', 'shared');
    await fs.mkdir(snippets, { recursive: true });
    await fs.writeFile(path.join(snippets, 'commonImports.snippet.ts'),
      'import { MeshRenderingProgram } from "/Code/WebGL/webglCapsules.js";\n');
    await fs.writeFile(path.join(root, 'parseTextC1.shaderdsl.ts'),
      '<Pre/>\nSolidMeshProgram input=TexUnit20 4x3\nDynamicSolidMeshProgram input=TexUnit21 4x3\ndynamicSolidMeshProgram.setRepeatRadius(100).setGridRadius(64)\n<Pos>\n');
    const [output] = await parseFiles(['parseTextC1.shaderdsl.ts'], { cwd: root });
    const generated = await fs.readFile(output.tsFile, 'utf8');
    assert.match(generated, /new SolidMeshRenderingProgram\(/);
    assert.match(generated, /new DynamicSolidMeshRenderingProgram\(/);
    assert.match(generated, /dynamicSolidMeshProgram\.setRepeatRadius\(100\)\.setGridRadius\(64\)/);
    assert.match(generated, /import \{[^}]*DynamicSolidMeshRenderingProgram[^}]*\} from "\/Code\/WebGL\/parser\/registryModules\/capsules\.js"/);
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
  parser.activateRegistries('Camera3D MeshProgram');
  const declared = new Set();
  const explicit = parser.transpileSimpleStatement('camera = Camera3D pos=vec3(0,4,12);', declared).join('\n');
  assert.match(explicit, /var camera = new Camera3D\(new Vector3D\(0,4,12\)\);/);
  assert.doesNotMatch(explicit, /Vector3D\([^)]*\);\)/);
  const first = parser.transpileSimpleStatement('Camera3D pos=vec3(0,4,12);', declared).join('\n');
  const second = parser.transpileSimpleStatement('Camera3D pos=vec3(0,0,5);', declared).join('\n');
  assert.match(first, /var camera3D = new Camera3D/);
  assert.match(second, /var camera3D2 = new Camera3D/);
  const added = parser.transpileSimpleStatement('Camera3D pos=vec3(0,0,1) |= cam2', declared).join('\n');
  assert.match(added, /var camera3D3 = new Camera3D/);
  assert.match(added, /var cam2 = camera3D3/);
  const named = parser.transpileSimpleStatement('Camera3D camera2D pos=vec3(0,0,0)', declared).join('\n');
  assert.match(named, /var camera2D = new Camera3D/);
  const underscore = parser.transpileSimpleStatement('MeshProgram _mesh input=TexUnit20 4x4', declared).join('\n');
  assert.match(underscore, /var _mesh = new MeshRenderingProgram/);
});

test('tagged runtime values overwrite one scoped snapshot without writing every tick', async () => {
  const esbuild = require('esbuild');
  const file = path.join(__dirname, '..', 'src', 'dependencies', 'Code', 'WebGL', 'runtime', 'BackupRuntime.ts');
  const built = await esbuild.build({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs' });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', built.outputFiles[0].text)(module, module.exports, require);
  const { BackupRuntime } = module.exports;
  const requests = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, text: async () => '{}' };
  };
  try {
    const runtime = new BackupRuntime({}, {}, 'parseTextC1');
    runtime.captureTaggedValue('tick', '2', 'offset', { x: 1 });
    await new Promise(resolve => setTimeout(resolve, 0));
    runtime.captureTaggedValue('tick', '2', 'offset', { x: 2 });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.path, 'parseTextC1/.dnti-tags/tick_2_offset.json');
    assert.equal(JSON.parse(requests[0].body.content).value, '{"x":1}');
  } finally {
    global.fetch = originalFetch;
  }
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
