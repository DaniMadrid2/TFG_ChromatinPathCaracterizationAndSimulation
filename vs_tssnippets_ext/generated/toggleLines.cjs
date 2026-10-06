"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeToggleLines = analyzeToggleLines;
exports.choiceAtLine = choiceAtLine;
exports.selectToggleChoice = selectToggleChoice;
function parseMarker(line) {
    const match = /^(\s*)(?:(\S+?)\s*)?([+-]>)(\|)?[ \t]*(.*)$/.exec(line);
    if (!match)
        return null;
    const group = match[2] || null;
    const content = match[5];
    if (group && match[3] === "->" && !match[4] &&
        (/^\[/.test(content) || /^(?:TexUnit|texUnit)\d+\b/.test(content)))
        return null;
    return {
        indent: match[1], group, enabled: match[3] === "+>",
        pipe: !!match[4], content,
        markerStart: match[1].length + (group ? match[0].slice(match[1].length).indexOf(match[3]) : 0),
        markerEnd: match[0].length - content.length,
    };
}
function scopeAfter(line, stack, lineNumber) {
    const code = line.trim();
    if (!code || code.startsWith("//"))
        return;
    if (/^}\s*[,;]?$/.test(code))
        stack.pop();
    if (/\{\s*$/.test(code) && !code.startsWith("//"))
        stack.push(lineNumber);
}
function analyzeToggleLines(source) {
    const lines = source.split(/\r?\n/);
    const output = lines.slice();
    const choices = [];
    const stack = [];
    for (let index = 0; index < lines.length; index++) {
        const marker = parseMarker(lines[index]);
        if (!marker) {
            scopeAfter(lines[index], stack, index);
            continue;
        }
        const scope = marker.group ? `global:${marker.group}` : `local:${stack.join("/")}`;
        let end = index;
        let kind = "line";
        if (marker.pipe) {
            kind = "pipe";
            while (end + 1 < lines.length && /^\s*\|(?!\|)/.test(lines[end + 1]))
                end++;
        }
        else if (!marker.content) {
            const close = lines.findIndex((line, candidate) => candidate > index && /^\s*<-\s*$/.test(line));
            if (close >= 0) {
                kind = "block";
                end = close;
            }
        }
        choices.push({ start: index, end, markerStart: marker.markerStart,
            markerEnd: marker.markerStart + 2, scope, group: marker.group,
            enabled: marker.enabled, kind });
        output[index] = kind === "block" || !marker.enabled ? "" : marker.indent + marker.content;
        if (marker.enabled && output[index])
            scopeAfter(output[index], stack, index);
        for (let member = index + 1; member <= end; member++) {
            if (kind === "pipe") {
                const continuation = /^(\s*)\|[ \t]?(.*)$/.exec(lines[member]);
                output[member] = marker.enabled && continuation
                    ? marker.indent + continuation[2].trimStart() : "";
            }
            else {
                output[member] = member === end || !marker.enabled ? "" : lines[member];
            }
            if (marker.enabled && output[member])
                scopeAfter(output[member], stack, member);
        }
        index = end;
    }
    return { choices, output: output.join("\n") };
}
function choiceAtLine(choices, line) {
    return choices.find((choice) => choice.start <= line && line <= choice.end);
}
function selectToggleChoice(source, line, allowDisable = true) {
    const { choices } = analyzeToggleLines(source);
    const selected = choiceAtLine(choices, line);
    if (!selected)
        return source;
    const siblings = choices.filter((choice) => choice.scope === selected.scope);
    const enable = !selected.enabled || !allowDisable || siblings.length === 1;
    const lines = source.split(/\r?\n/);
    for (const choice of siblings) {
        const prefix = lines[choice.start];
        const marker = choice === selected && enable ? "+>" : "->";
        lines[choice.start] = prefix.slice(0, choice.markerStart) + marker + prefix.slice(choice.markerEnd);
    }
    return lines.join("\n");
}
