const assert = require('node:assert/strict');
const test = require('node:test');
const { analyzeToggleLines, choiceAtLine, selectToggleChoice } = require('./generated/toggleLines.cjs');

test('keeps DSL draw arrows and selects anonymous choices only within their block', () => {
    const source = [
        'drawTriangles -> [] size [2,2] {',
        '  -> let value = 1',
        '  +> let value = 2',
        '}',
        'tick {',
        '  -> let value = 3',
        '  +> let value = 4',
        '}',
    ].join('\n');
    const parsed = analyzeToggleLines(source);
    assert.equal(parsed.choices.length, 4);
    assert.match(parsed.output, /drawTriangles -> \[\]/);
    assert.doesNotMatch(parsed.output, /let value = 1|let value = 3/);
    assert.match(parsed.output, /let value = 2/);
    assert.equal(choiceAtLine(parsed.choices, 1).scope, choiceAtLine(parsed.choices, 2).scope);
    assert.notEqual(choiceAtLine(parsed.choices, 1).scope, choiceAtLine(parsed.choices, 5).scope);
    const selected = selectToggleChoice(source, 1);
    assert.match(selected, /  \+> let value = 1\n  -> let value = 2/);
    assert.match(selected, /  \+> let value = 4/);
});

test('named choices span blocks and pipe and bracket groups keep their lines', () => {
    const source = [
        'food->|let first = 1',
        '   |let second = 2',
        'tick {',
        '  food+> let third = 3',
        '  ->',
        '  let skipped = 4',
        '  <-',
        '}',
    ].join('\n');
    const parsed = analyzeToggleLines(source);
    assert.equal(parsed.choices.length, 3);
    assert.equal(parsed.choices[0].kind, 'pipe');
    assert.equal(parsed.choices[2].kind, 'block');
    assert.match(parsed.output, /let third = 3/);
    assert.doesNotMatch(parsed.output, /first|second|skipped/);
    const selected = selectToggleChoice(source, 1);
    assert.match(selected, /food\+>\|let first = 1/);
    assert.match(selected, /food-> let third = 3/);
    const active = analyzeToggleLines(selected).output;
    assert.match(active, /let first = 1\nlet second = 2/);
    assert.doesNotMatch(active, /let third = 3/);
});

test('the sole active alternative stays enabled when toggled', () => {
    assert.equal(selectToggleChoice('+> let only = 1', 0), '+> let only = 1');
    assert.equal(selectToggleChoice('-> let only = 1', 0), '+> let only = 1');
});
