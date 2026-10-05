const test = require('node:test');
const assert = require('node:assert/strict');
const { declarationAliases, inlineTagSpans, registryBindings, latestAssignment, staticValuePreview, stripComment } = require('./registryIntelligence');

test('tracks aliases and implicit object names without changing the document', () => {
    const text = `let meshProgram = 1
SolidMeshProgram input=TexUnit20
mesh2 = SolidMeshProgram input=TexUnit21 |= second
SolidMeshProgram input=TexUnit22
dataProgram = Program data/1_drawData |= d`;
    const objects = [{ name: 'SolidMeshProgram' }, { name: 'Program' }];
    const result = registryBindings(text, objects);
    assert.deepEqual(result.implicit.map(({ name }) => name), ['solidMeshProgram', 'solidMeshProgram2']);
    assert.deepEqual(result.bindings.get('second').names, ['mesh2', 'second']);
    assert.deepEqual(declarationAliases('dataProgram = Program data/1_drawData |= d'), ['dataProgram', 'd']);
    assert.equal(result.bindings.get('d').object.name, 'Program');
});

test('finds the last static assignment before a tagged comment', () => {
    assert.equal(latestAssignment('let offset = new Vector2D(0,0)\noffset = 2\ntick -2- {offset}- {', 'offset', 2), '2');
    assert.equal(staticValuePreview('new Vector2D(0, 0)'), 'Vector2D x=0, y=0');
});

test('keeps code after slashes inside strings and parses the complete inline tag', () => {
    assert.equal(stripComment('both "tau/" "//Var@COUNT" -> {String(tauFTerms)} // note'),
        'both "tau/" "//Var@COUNT" -> {String(tauFTerms)} ');
    assert.deepEqual(inlineTagSpans('tick -2-README {offset}- {')[0], {
        tag: '2', start: 5, end: 24,
        variables: [{ name: 'offset', start: 15, end: 23 }],
    });
});

test('recognizes program and texture aliases, and keeps implicit names with right aliases', () => {
    assert.deepEqual(declarationAliases('program tauMom|progTauMom "tau/01_moments" {'), ['tauMom', 'progTauMom']);
    assert.deepEqual(declarationAliases('tex2D datosX1|xTex[NMuestras1,1] RFloat TexUnit10'), ['datosX1', 'xTex']);
    const objects = [{ name: 'Camera3D', tags: { namedParamsOnly: true } }, { name: 'MeshProgram' }];
    const result = registryBindings('Camera3D pos=vec3(0,0,0) |= cam2\nCamera3D camera2D pos=vec3(0,0,0)\nMeshProgram input=TexUnit20 4x4', objects);
    assert.deepEqual(result.implicit.map(({ name }) => name), ['camera3D', 'meshProgram']);
    assert.deepEqual(result.bindings.get('cam2').names, ['camera3D', 'cam2']);
    assert.deepEqual(result.bindings.get('camera2D').names, ['camera2D']);
    const aliases = registryBindings('Camera3D camera2D|cam3D pos=vec3(0,4,20) |= cam2|cam4,cam5', objects);
    assert.deepEqual(aliases.implicit, []);
    assert.deepEqual(aliases.bindings.get('cam5').names, ['camera2D', 'cam3D', 'cam2', 'cam4', 'cam5']);
    assert.deepEqual(declarationAliases('Camera3D camera2D|cam3D pos=vec3(0,4,20) |= cam2|cam4,cam5'), ['cam2', 'cam4', 'cam5']);
});
