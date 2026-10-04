const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { chapters, tutorial } = require('../dist/tutorial.cjs');

test('tutorial chapters copy once and parse with the bundled parser', async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'shaderdsl-tutorial-'));
  try {
    for (let chapter = 1; chapter <= chapters.length; chapter++) {
      await t.test(chapters[chapter - 1][0], async () => {
        const folder = await tutorial({ chapter, cwd, output: { write() {} } });
        assert.equal(path.basename(folder), chapters[chapter - 1][0]);
        assert.ok((await fs.readdir(path.join(folder, 'glsl'))).length);
        await assert.rejects(tutorial({ chapter, cwd, output: { write() {} } }), /ya existe/);
        const result = spawnSync(process.execPath, [path.resolve(__dirname, '../dist/cli.cjs'), 'parse', '.'], {
          cwd: folder, encoding: 'utf8', timeout: 30000,
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        await fs.access(path.join(folder, 'generated', 'generatedParserC1.js'));
      });
    }
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('tutorial CLI accepts a chapter number', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'shaderdsl-tutorial-cli-'));
  try {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../dist/cli.cjs'), 'tutorial', '3'], {
      cwd, encoding: 'utf8', timeout: 30000,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Capitulo 3:/);
    await fs.access(path.join(cwd, '03_draw_modes', 'parseTextC1.shaderdsl.ts'));
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
