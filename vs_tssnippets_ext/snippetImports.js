const fs = require("node:fs");
const path = require("node:path");

const cache = new Map();

function matchesSnippetFolder(folder, id) {
    let index = 0;
    for (const char of folder.toLowerCase()) if (char === id[index]) index++;
    return index === id.length;
}

function sourceCandidates(projectRoot, specifier, snippetFile, extensionRoot) {
    const relative = specifier.replace(/\.(?:m?js|tsx?)$/i, "");
    const roots = [];
    if (specifier.startsWith("/")) {
        const local = path.join(projectRoot, "lib", relative.slice(1));
        roots.push(local);
        let parent = projectRoot;
        while (true) {
            roots.push(path.join(parent, "src", "dependencies", relative.slice(1)));
            roots.push(path.join(parent, "dist", "lib", relative.slice(1)));
            const next = path.dirname(parent);
            if (next === parent) break;
            parent = next;
        }
        roots.push(path.join(extensionRoot, "generated", "importSources", relative.slice(1)));
    } else if (specifier.startsWith(".")) {
        roots.push(path.resolve(path.dirname(snippetFile), relative));
    }
    return roots.flatMap((base) => [base + ".ts", base + ".tsx", base + ".js", base + ".mjs"]);
}

function definitionInFile(file, exportedName) {
    if (!file || !fs.existsSync(file)) return null;
    const text = fs.readFileSync(file, "utf8");
    const escaped = exportedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
        new RegExp(`\\b(?:export\\s+)?(?:declare\\s+)?(?:async\\s+)?function\\s+${escaped}\\b`),
        new RegExp(`\\b(?:export\\s+)?(?:declare\\s+)?(?:abstract\\s+)?class\\s+${escaped}\\b`),
        new RegExp(`\\b(?:export\\s+)?(?:declare\\s+)?(?:const|let|var|enum|interface|type)\\s+${escaped}\\b`),
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (!match) continue;
        const offset = match.index + match[0].lastIndexOf(exportedName);
        const before = text.slice(0, offset);
        const line = (before.match(/\n/g) || []).length;
        const character = offset - (before.lastIndexOf("\n") + 1);
        return { file, line, character, kind: /\bfunction\b/.test(match[0]) ? "function" : /\bclass\b/.test(match[0]) ? "class" : "variable" };
    }
    return null;
}

function collectImports(text, file, projectRoot, extensionRoot, symbols) {
    const pattern = /\bimport\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([\s\S]*?)\})?\s*from\s*["']([^"']+)["']/g;
    for (const match of text.matchAll(pattern)) {
        const [, defaultName, members, specifier] = match;
        const source = sourceCandidates(projectRoot, specifier, file, extensionRoot).find((candidate) => fs.existsSync(candidate));
        if (defaultName) symbols.set(defaultName, { name: defaultName, source, definition: source ? definitionInFile(source, defaultName) : null });
        if (!members) continue;
        for (const member of members.split(",")) {
            const names = member.trim().replace(/^type\s+/, "").match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
            if (!names) continue;
            const name = names[2] || names[1];
            symbols.set(name, { name, source, definition: source ? definitionInFile(source, names[1]) : null });
        }
    }
}

function importedSnippetSymbols(projectRoot, shaderFile, extensionRoot, openDocuments = []) {
    const id = path.basename(shaderFile).match(/^parseText(.+)\.shaderdsl\.ts$/i)?.[1]?.toLowerCase()
        || path.basename(path.dirname(shaderFile)).toLowerCase();
    const key = `${projectRoot}:${id}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const symbols = new Map();
    const snippetsRoot = path.join(projectRoot, "parser_snippets");
    if (!fs.existsSync(snippetsRoot)) return symbols;
    for (const entry of fs.readdirSync(snippetsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name !== "shared" && !matchesSnippetFolder(entry.name, id)) continue;
        const directory = path.join(snippetsRoot, entry.name);
        for (const name of fs.readdirSync(directory).filter((item) => item.endsWith(".snippet.ts"))) {
            const file = path.join(directory, name);
            const open = openDocuments.find((document) => document.uri?.fsPath === file);
            collectImports(open ? open.getText() : fs.readFileSync(file, "utf8"), file, projectRoot, extensionRoot, symbols);
        }
    }
    cache.set(key, symbols);
    return symbols;
}

function invalidateSnippetImports(projectRoot) {
    for (const key of cache.keys()) if (!projectRoot || key.startsWith(`${projectRoot}:`)) cache.delete(key);
}

function invalidateSnippetImportsForSource(file) {
    for (const [key, symbols] of cache) {
        if ([...symbols.values()].some((symbol) => symbol.source === file)) cache.delete(key);
    }
}

module.exports = { importedSnippetSymbols, invalidateSnippetImports, invalidateSnippetImportsForSource };
