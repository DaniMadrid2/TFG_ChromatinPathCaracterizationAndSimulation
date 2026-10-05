function stripComment(line) {
    let quote = "";
    for (let i = 0; i < line.length - 1; i++) {
        const char = line[i];
        if (quote) {
            if (char === "\\") { i++; continue; }
            if (char === quote) quote = "";
        } else if (char === '"' || char === "'" || char === "`") {
            quote = char;
        } else if (char === "/" && line[i + 1] === "/") {
            return line.slice(0, i);
        }
    }
    return line;
}

function inlineTagSpans(line) {
    const code = stripComment(line);
    const spans = [];
    const regex = /(^|[^A-Za-z0-9_])-\s*([A-Za-z0-9_][A-Za-z0-9_-]*)\s*-(.*?)-(?=\s*(?:\{|$))/g;
    for (const match of code.matchAll(regex)) {
        const start = match.index + match[1].length;
        const end = match.index + match[0].length;
        const bodyStart = start + match[0].slice(match[1].length).indexOf(match[3]);
        const variables = [...match[3].matchAll(/\{([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\}/g)]
            .map((item) => ({ name: item[1], start: bodyStart + item.index, end: bodyStart + item.index + item[0].length }));
        spans.push({ tag: match[2], start, end, variables });
    }
    return spans;
}

function declarationAliases(line) {
    const code = stripComment(line).trim();
    const left = code.match(/^([A-Za-z_]\w*(?:\s*\|=\s*[A-Za-z_]\w*)*)\s*=\s*(?![=>])/);
    const right = code.match(/\|=\s*([A-Za-z_]\w*(?:\s*[,|]\s*[A-Za-z_]\w*)*)\s*$/);
    const names = [
        ...(left ? left[1].split(/\|=/).map((part) => part.trim()) : []),
        ...(right ? right[1].split(/[,|]/).map((part) => part.trim()) : []),
    ];
    const program = code.match(/^program\s+([A-Za-z_]\w*(?:\s*\|\s*[A-Za-z_]\w*)*)\b/);
    const texture = code.match(/^(?:new-|in-)?(?:tex2D|tex3D|tex3DArray)\s+([A-Za-z_]\w*(?:\s*\|\s*[A-Za-z_]\w*)*)/);
    const inline = program || texture;
    if (inline) names.push(...inline[1].split(/\s*\|\s*/));
    return [...new Set(names)];
}

function objectDeclarationParts(line, object) {
    const code = stripComment(line);
    const match = code.match(/^\s*(?:(?<left>[A-Za-z_]\w*(?:\s*\|=\s*[A-Za-z_]\w*)*)\s*=\s*)?(?<class>[A-Z][A-Za-z0-9_]*)\b(?<tail>.*)$/);
    if (!match || match.groups.class !== object.name) return null;
    const explicit = match.groups.left ? match.groups.left.split(/\|=/).map((part) => part.trim()) : [];
    const tail = match.groups.tail.replace(/\|=\s*[A-Za-z_]\w*(?:\s*[,|]\s*[A-Za-z_]\w*)*\s*$/, "").trim();
    const first = tail.match(/^([A-Za-z_]\w*(?:\s*\|\s*[A-Za-z_]\w*)*)(?=\s|$)/)?.[1];
    if (first && (object.tags?.namedParamsOnly || first.startsWith("_"))) {
        explicit.push(...first.split(/\s*\|\s*/));
    }
    const right = code.match(/\|=\s*([A-Za-z_]\w*(?:\s*[,|]\s*[A-Za-z_]\w*)*)\s*$/);
    const extra = right ? right[1].split(/[,|]/).map((part) => part.trim()) : [];
    return { explicit, extra, match };
}

function registryBindings(text, objects) {
    const byClass = new Map(objects.map((object) => [object.name, object]));
    const bindings = new Map();
    const implicit = [];
    const usedNames = new Set();
    for (const [lineNo, rawLine] of text.split(/\r?\n/).entries()) {
        const code = stripComment(rawLine);
        const declared = code.match(/^\s*(?:let|var|const)\s+(?:derived\s+)?([A-Za-z_]\w*)\b/);
        if (declared) usedNames.add(declared[1]);
        const match = code.match(/^\s*(?:(?<left>[A-Za-z_]\w*(?:\s*\|=\s*[A-Za-z_]\w*)*)\s*=\s*)?(?<class>[A-Z][A-Za-z0-9_]*)\b(?<tail>.*)$/);
        if (!match) continue;
        const object = byClass.get(match.groups.class);
        if (!object) continue;
        const parts = objectDeclarationParts(code, object);
        const names = [...parts.explicit];
        if (!names.length) {
            const base = object.name[0].toLowerCase() + object.name.slice(1);
            let name = base;
            for (let number = 2; usedNames.has(name); number++) name = base + number;
            names.push(name);
            implicit.push({ line: lineNo, className: object.name, name });
        }
        names.push(...parts.extra);
        for (const name of names) {
            usedNames.add(name);
            bindings.set(name, { object, names, line: lineNo });
        }
    }
    return { bindings, implicit };
}

function latestAssignment(text, name, beforeLine) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^\\s*(?:(?:let|var|const)\\s+(?:derived\\s+)?)?${escaped}\\s*=\\s*(.+?)\\s*;?\\s*$`);
    const lines = text.split(/\r?\n/);
    let result = null;
    for (let line = 0; line < Math.min(beforeLine, lines.length); line++) {
        const match = stripComment(lines[line]).match(pattern);
        if (match) result = match[1].replace(/;$/, "").trim();
    }
    return result;
}

function staticValuePreview(expression) {
    if (!expression) return null;
    const vector = expression.match(/^new\s+Vector([234])D\s*\(([^()]*)\)$/);
    if (vector) {
        const components = vector[2].split(',').map((part) => part.trim());
        if (components.length === Number(vector[1]) && components.every((part) => /^[-+]?\d+(?:\.\d+)?$/.test(part))) {
            return `Vector${vector[1]}D ${components.map((part, index) => `${'xyzw'[index]}=${part}`).join(', ')}`;
        }
    }
    return /^(?:[-+]?\d+(?:\.\d+)?|true|false|"[^"\n]*"|'[^'\n]*')$/.test(expression) ? expression : null;
}

module.exports = { declarationAliases, inlineTagSpans, objectDeclarationParts, registryBindings, latestAssignment, staticValuePreview, stripComment };
