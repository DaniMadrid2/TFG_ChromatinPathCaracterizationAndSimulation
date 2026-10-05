const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { importedSnippetSymbols, invalidateSnippetImports } = require('./snippetImports');

test('indexes only applicable snippet imports and prefers a project-local definition', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dnti-snippet-imports-'));
    try {
        const shared = path.join(root, 'parser_snippets', 'shared');
        const c1 = path.join(root, 'parser_snippets', 'c1');
        const c2 = path.join(root, 'parser_snippets', 'c2');
        const local = path.join(root, 'lib', 'Code', 'Game');
        for (const dir of [shared, c1, c2, local]) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(shared, 'commonImports.snippet.ts'), 'import { openFullscreen as fullscreen } from "/Code/Game/Game.js";');
        fs.writeFileSync(path.join(c1, 'one.snippet.ts'), 'import { onlyC1 } from "/Code/Game/Game.js";');
        fs.writeFileSync(path.join(c2, 'two.snippet.ts'), 'import { onlyC2 } from "/Code/Game/Game.js";');
        fs.writeFileSync(path.join(local, 'Game.ts'), 'export function openFullscreen() {}\nexport const onlyC1 = 1;\nexport const onlyC2 = 2;');
        const names = importedSnippetSymbols(root, path.join(root, 'parseTextC1.shaderdsl.ts'), __dirname);
        assert.equal(names.get('fullscreen').definition.file, path.join(local, 'Game.ts'));
        assert.equal(names.get('fullscreen').definition.line, 0);
        assert.ok(names.has('onlyC1'));
        assert.ok(!names.has('onlyC2'));
        const sharedNames = importedSnippetSymbols(root, path.join(shared, 'commonImports.snippet.ts'), __dirname);
        assert.ok(sharedNames.has('fullscreen'));
        assert.ok(!sharedNames.has('onlyC1'));
    } finally {
        invalidateSnippetImports(root);
        fs.rmSync(root, { recursive: true, force: true });
    }
});
