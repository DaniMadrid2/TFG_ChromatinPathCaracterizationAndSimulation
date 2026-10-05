const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const extensionRoot = process.env.DNTI_EXTENSION_ROOT || __dirname;
const parserRoot = process.env.DNTI_PARSER_ROOT || path.resolve(__dirname, '..', 'src', 'dependencies', 'Code', 'WebGL', 'parser');
const codeRoot = path.resolve(parserRoot, '..', '..');
const folders = ['objects', 'functions', 'registryModules'];
const entries = { objects: new Map(), functions: new Map() };
const classes = new Map();
const literalUnions = new Map();

function definition(node, sourceFile) {
    const start = node.name?.getStart(sourceFile) ?? node.getStart(sourceFile);
    const position = sourceFile.getLineAndCharacterOfPosition(start);
    return { file: path.relative(codeRoot, sourceFile.fileName).replace(/\\/g, '/'), line: position.line, character: position.character };
}

function filesIn(folder) {
    return fs.readdirSync(folder, { withFileTypes: true })
        .flatMap((item) => item.isDirectory() ? filesIn(path.join(folder, item.name))
            : item.isFile() && item.name.endsWith('.ts') ? [path.join(folder, item.name)] : [])
        .sort();
}

function memberName(member) {
    if (!member.name || !ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name)) return null;
    return member.name.text;
}

function tagsBefore(sourceFile, member) {
    const text = sourceFile.getFullText();
    const comments = ts.getLeadingCommentRanges(text, member.getFullStart()) || [];
    const tags = {};
    for (const comment of comments) {
        const commentText = text.slice(comment.pos, comment.end);
        for (const match of commentText.matchAll(/@dnti-([A-Za-z][A-Za-z0-9]*)(?:[ \t]+([^\r\n*]+))?/g)) {
            tags[match[1]] = match[2]?.trim() || true;
        }
    }
    return tags;
}

function classInfo(node, sourceFile) {
    const methods = [];
    const properties = [];
    for (const member of node.members) {
        const name = memberName(member);
        if (!name || member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)) continue;
        if (ts.isMethodDeclaration(member)) methods.push({ name,
            parameters: member.parameters.map((param) => param.name.getText(sourceFile)),
            parameterTypes: member.parameters.map((param) => param.type?.getText(sourceFile) || null),
            definition: definition(member, sourceFile),
        });
        if (ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member)) properties.push(name);
    }
    return {
        name: node.name.text,
        extends: node.heritageClauses?.flatMap((clause) => clause.types.map((type) => type.expression.getText(sourceFile)))?.[0] || null,
        methods,
        properties,
    };
}

function handlerInfo(member, sourceFile) {
    let className = null;
    const parameters = new Set();
    function visit(node) {
        if (!className && ts.isNewExpression(node)) className = node.expression.getText(sourceFile).split('.').at(-1);
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
            && node.expression.name.text === 'get' && node.expression.expression.getText(sourceFile) === 'params'
            && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
            parameters.add(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    }
    visit(member);
    return { className, parameters: [...parameters].filter((name) => !['firstAlias', 'aliases', 'altName'].includes(name)) };
}

for (const folder of folders) {
    for (const file of filesIn(path.join(parserRoot, folder))) {
        if (path.basename(file) === 'types.ts') continue;
        const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        function visit(node) {
            if (ts.isClassDeclaration(node) && node.name) classes.set(node.name.text, classInfo(node, sourceFile));
            if (ts.isPropertyAssignment(node) && (node.name.getText(sourceFile) === 'objects' || node.name.getText(sourceFile) === 'functions')
                && ts.isObjectLiteralExpression(node.initializer)) {
                const kind = node.name.getText(sourceFile);
                for (const member of node.initializer.properties) {
                    const name = memberName(member);
                    if (!name || !ts.isPropertyAssignment(member) && !ts.isMethodDeclaration(member)) continue;
                    const tags = tagsBefore(sourceFile, member);
                    const existing = entries[kind].get(name) || { name, tags: {} };
                    Object.assign(existing.tags, tags);
                    existing.definition = definition(member, sourceFile);
                    if (kind === 'objects') Object.assign(existing, handlerInfo(member, sourceFile));
                    entries[kind].set(name, existing);
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
    }
}

for (const file of [path.join(parserRoot, '..', '..', 'Game3D', 'Game3D.ts'), path.join(parserRoot, '..', 'webglMan.ts')]) {
    if (!fs.existsSync(file)) continue;
    const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) classes.set(node.name.text, classInfo(node, sourceFile));
        if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)) {
            const values = node.type.types.filter(ts.isLiteralTypeNode)
                .map((type) => type.literal).filter(ts.isStringLiteral).map((literal) => literal.text);
            if (values.length === node.type.types.length) literalUnions.set(node.name.text, values);
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
}

function membersFor(className, seen = new Set()) {
    if (!className || seen.has(className)) return { methods: [], properties: [] };
    seen.add(className);
    const own = classes.get(className);
    if (!own) return { methods: [], properties: [] };
    const inherited = membersFor(own.extends, seen);
    return {
        methods: [...new Map([...inherited.methods, ...own.methods].map((method) => [method.name, method])).values()],
        properties: [...new Set([...inherited.properties, ...own.properties])],
    };
}

for (const entry of entries.objects.values()) {
    if (entry.className) {
        Object.assign(entry, membersFor(entry.className));
        entry.methods = entry.methods.map((method) => ({ ...method,
            choices: method.parameterTypes.map((type, index) => method.parameters[index].startsWith('_') ? null : literalUnions.get(type) || null),
        }));
    }
}

const sourceDir = path.join(extensionRoot, 'generated', 'registrySources');
fs.mkdirSync(sourceDir, { recursive: true });
const sourceFiles = new Set();
for (const entry of [...entries.objects.values(), ...entries.functions.values()]) {
    if (entry.definition?.file) sourceFiles.add(entry.definition.file);
    for (const method of entry.methods || []) if (method.definition?.file) sourceFiles.add(method.definition.file);
}
for (const relative of sourceFiles) {
    const source = path.resolve(codeRoot, relative);
    const target = path.resolve(sourceDir, relative);
    if (!source.startsWith(codeRoot + path.sep) || !target.startsWith(sourceDir + path.sep)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

const defaultImportRoot = path.join(extensionRoot, 'generated', 'importSources');
const dependenciesRoot = path.resolve(codeRoot, '..');
function copyDefaultImportSources(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const source = path.join(directory, entry.name);
        if (entry.isDirectory()) copyDefaultImportSources(source);
        else if (entry.isFile() && source.endsWith('.ts') && !source.endsWith('.d.ts')) {
            const target = path.join(defaultImportRoot, path.relative(dependenciesRoot, source));
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(source, target);
        }
    }
}
for (const folder of ['Code', 'DNTI_Templates']) {
    const directory = path.join(dependenciesRoot, folder);
    if (fs.existsSync(directory)) copyDefaultImportSources(directory);
}

const metadata = Object.fromEntries(Object.entries(entries).map(([kind, names]) =>
    [kind, [...names.values()].sort((a, b) => a.name.localeCompare(b.name))]));
const generatedDir = path.join(extensionRoot, 'generated');
fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(path.join(generatedDir, 'registrySyntax.json'), JSON.stringify(metadata, null, 2) + '\n');

const grammarPath = path.join(extensionRoot, 'syntaxes', 'parse-text-ts.tmLanguage.json');
const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
grammar.patterns = grammar.patterns.filter((rule) => !rule.name?.includes('registry-generated.parse-text-ts'));
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rules = [
    ['objects', 'support.class.registry-generated.parse-text-ts'],
    ['functions', 'support.function.registry-generated.parse-text-ts'],
].flatMap(([kind, scope]) => metadata[kind].length ? [{
    name: scope,
    match: `\\b(?:${metadata[kind].map((entry) => escape(entry.name)).join('|')})\\b`,
}] : []);
const insertAt = grammar.patterns.findIndex((rule) => rule.name === 'support.function.parser-helpers.parse-text-ts');
grammar.patterns.splice(insertAt < 0 ? grammar.patterns.length : insertAt, 0, ...rules);
fs.writeFileSync(grammarPath, JSON.stringify(grammar, null, 2) + '\n');
console.log(`Registry syntax: ${metadata.objects.length} objects, ${metadata.functions.length} functions`);
