const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('builds registry highlighting and object rules from TypeScript modules', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dnti-registry-syntax-'));
    try {
        const parser = path.join(root, 'parser');
        const extension = path.join(root, 'extension');
        fs.mkdirSync(path.join(parser, 'registryModules'), { recursive: true });
        fs.mkdirSync(path.join(parser, 'objects'));
        fs.mkdirSync(path.join(parser, 'functions'));
        fs.copyFileSync(path.join(__dirname, '..', 'src', 'dependencies', 'Code', 'WebGL', 'parser', 'toggleLines.ts'),
            path.join(parser, 'toggleLines.ts'));
        fs.mkdirSync(path.join(extension, 'syntaxes'), { recursive: true });
        fs.writeFileSync(path.join(extension, 'syntaxes', 'parse-text-ts.tmLanguage.json'),
            JSON.stringify({ patterns: [{ name: 'support.function.parser-helpers.parse-text-ts', match: 'draw' }] }));
        fs.writeFileSync(path.join(parser, 'registryModules', 'example.ts'), `
            export class FilledProgram { draw(count: number) {} setHue(value: number) {} }
            function buildHandlers() { return {
                objects: {
                    //@dnti-color #12ab34
                    //@dnti-createsInternalTexture
                    Filled: (params) => { const program = new FilledProgram(); params.get("input"); return program; },
                },
                functions: { ping: () => {} },
            }; }
        `);
        const result = spawnSync(process.execPath, [path.join(__dirname, 'build-registry-syntax.cjs')], {
            env: { ...process.env, DNTI_PARSER_ROOT: parser, DNTI_EXTENSION_ROOT: extension },
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        const metadata = JSON.parse(fs.readFileSync(path.join(extension, 'generated', 'registrySyntax.json'), 'utf8'));
        assert.equal(metadata.objects.length, 1);
        const filled = metadata.objects[0];
        assert.equal(filled.name, 'Filled');
        assert.deepEqual(filled.tags, { color: '#12ab34', createsInternalTexture: true });
        assert.equal(filled.className, 'FilledProgram');
        assert.deepEqual(filled.parameters, ['input']);
        assert.deepEqual(filled.methods.map((method) => method.name), ['draw', 'setHue']);
        assert.deepEqual(filled.methods[0].parameters, ['count']);
        assert.match(filled.methods[0].definition.file, /registryModules\/example\.ts$/);
        assert.ok(fs.existsSync(path.join(extension, 'generated', 'registrySources', filled.methods[0].definition.file)));
        assert.deepEqual(metadata.functions.map((item) => item.name), ['ping']);
        const grammar = JSON.parse(fs.readFileSync(path.join(extension, 'syntaxes', 'parse-text-ts.tmLanguage.json'), 'utf8'));
        assert.match(grammar.patterns[0].match, /Filled/);
        assert.match(grammar.patterns[1].match, /ping/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('generated metadata includes MeshCapsule internal texture markers', () => {
    const metadata = require('./generated/registrySyntax.json');
    for (const name of ['MeshProgram', 'SolidMeshProgram', 'DynamicSolidMeshProgram']) {
        assert.equal(metadata.objects.find((item) => item.name === name)?.tags.createsInternalTexture, true);
    }
    assert.ok(metadata.objects.find((item) => item.name === 'SolidMeshProgram').methods.some((method) => method.name === 'smoothColor'));
    assert.ok(metadata.objects.find((item) => item.name === 'DynamicSolidMeshProgram').methods.some((method) => method.name === 'setRepeatRadius'));
});
