const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const extensionRoot = process.env.DNTI_EXTENSION_ROOT || __dirname;
const parserRoot = process.env.DNTI_PARSER_ROOT || path.resolve(__dirname, '..', 'src', 'dependencies', 'Code', 'WebGL', 'parser');
const folders = ['objects', 'functions', 'registryModules'];
const entries = { objects: new Map(), functions: new Map() };

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

for (const folder of folders) {
    for (const file of filesIn(path.join(parserRoot, folder))) {
        if (path.basename(file) === 'types.ts') continue;
        const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        function visit(node) {
            if (ts.isPropertyAssignment(node) && (node.name.getText(sourceFile) === 'objects' || node.name.getText(sourceFile) === 'functions')
                && ts.isObjectLiteralExpression(node.initializer)) {
                const kind = node.name.getText(sourceFile);
                for (const member of node.initializer.properties) {
                    const name = memberName(member);
                    if (!name || !ts.isPropertyAssignment(member) && !ts.isMethodDeclaration(member)) continue;
                    const tags = tagsBefore(sourceFile, member);
                    const existing = entries[kind].get(name) || { name, tags: {} };
                    Object.assign(existing.tags, tags);
                    entries[kind].set(name, existing);
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
    }
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
