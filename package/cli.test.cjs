const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn, spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadParser, parseFiles, parseAll, resolveDsl } = require('../dist/runner.cjs');
const { startServer } = require('../dist/lib/server.js');
const { shouldWatchTs, watchProject } = require('../dist/watch.cjs');

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
    await fs.mkdir(local, { recursive: true });
    const parser = await fs.readFile(path.join(bundled, 'webglParser.ts'), 'utf8');
    assert.match(parser, /^export class DetailedParser\s*\{/m);
    await fs.writeFile(path.join(local, 'webglParser.ts'), parser.replace(
      /^export class DetailedParser\s*\{/m,
      'export class DetailedParser { static localOverrideMarker = true;',
    ));
    await fs.copyFile(path.join(bundled, 'webglMan.ts'), path.join(local, 'webglMan.ts'));
    const loaded = await loadParser(root);
    assert.equal(loaded.DetailedParser.localOverrideMarker, true);
    assert.equal(loaded.localMan, path.join(local, 'webglMan.ts'));
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

test('CLI help explains installation, GLSL and local overrides', () => {
  const cli = path.join(__dirname, '..', 'dist', 'cli.cjs');
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /npm install -g/);
  assert.match(result.stdout, /lib\/Code\/WebGL\/webglParser\.ts/);
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
