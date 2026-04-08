var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { openFullscreen, keypress, mousepos, mouseclick, KeyManager, W, H } from "../Game/Game.js";
import { Vector3D } from "../Matrix/Matrix.js";
import { addFunc, start, startAsync } from "../Start/start.js";
import { Axis3DGroup, MeshRenderingProgram, MeshFillerProgram } from "./webglCapsules.js";
import { Camera3D } from "../Game3D/Game3D.js";
import { WebGLMan, WebProgram, TexExamples } from "./webglMan.js";
export class DetailedParser {
    static extractRootIdentifiersFromExpr(expr) {
        const out = [];
        const re = /(?<![\w$.])([A-Za-z_$]\w*)/g;
        let m;
        while ((m = re.exec(expr)) !== null)
            out.push(m[1]);
        return [...new Set(out)];
    }
    static extractContextNamesFromCallback(callbackString) {
        const names = new Set();
        (callbackString || "").replace(/{([^{}]+)}/g, (_, raw) => {
            let expr = (raw || "").trim();
            const lastComma = expr.lastIndexOf(",");
            if (lastComma !== -1) {
                const maybeType = expr.substring(lastComma + 1).trim();
                if (_a.GLSL_TYPE_HINTS.has(maybeType)) {
                    expr = expr.substring(0, lastComma).trim();
                }
            }
            for (const id of _a.extractRootIdentifiersFromExpr(expr)) {
                if (!_a.RESERVED_CONTEXT_NAMES.has(id))
                    names.add(id);
            }
            return "";
        });
        return [...names];
    }
    static get lastUsedProgram() {
        return _a.context.lastUsedProgram;
    }
    static set lastUsedProgram(p) {
        _a.context.lastUsedProgram = p;
    }
    static get lastFillerProgram() {
        return _a.context.lastFillerProgram;
    }
    static set lastFillerProgram(p) {
        _a.context.lastFillerProgram = p;
    }
    static getVar(name) {
        return _a.context.vars.get(name);
    }
    static joinIndentedLines(lines) {
        if (lines.length <= 1)
            return lines;
        const result = [];
        let previousLine = lines[0];
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i];
            const previousIndentMatch = previousLine.match(/^(\s*)/);
            const currentIndentMatch = currentLine.match(/^(\s*)/);
            const previousIndent = previousIndentMatch ? previousIndentMatch[1].length : 0;
            const currentIndent = currentIndentMatch ? currentIndentMatch[1].length : 0;
            if (currentIndent > previousIndent && currentLine.trim().length > 0
                && !(previousLine.trim().endsWith("{") || previousLine.trim().endsWith("}"))) {
                previousLine += " " + currentLine;
            }
            else {
                result.push(previousLine);
                previousLine = currentLine;
            }
        }
        result.push(previousLine);
        return result;
    }
    static parseBlockParams(raw) {
        if (!raw)
            return null;
        return raw.split(',')
            .map(p => p.trim())
            .map(p => {
            const rangeMatch = p.match(/^(\w+)\s*=\s*(.+?):(.+)$/);
            if (rangeMatch) {
                return {
                    name: rangeMatch[1],
                    start: rangeMatch[2],
                    end: rangeMatch[3],
                    type: "range"
                };
            }
            const simpleMatch = p.match(/^(\w+)\s*=\s*(.+)$/);
            if (simpleMatch) {
                return {
                    name: simpleMatch[1],
                    value: simpleMatch[2],
                    type: "list"
                };
            }
            return null;
        })
            .filter(Boolean);
    }
    static parseBlockHeader(line) {
        const m = line.match(/^(?:(async)\s+)?(\w+)\s*(.*?)\s*\{$/);
        if (!m)
            return null;
        const isAsync = m[1] === "async";
        const name = m[2];
        let tail = (m[3] || "").trim();
        let priority;
        const prioMatch = tail.match(/\(([-+]?\d+(?:\.\d+)?)\)\s*$/);
        if (prioMatch) {
            const p = Number(prioMatch[1]);
            if (Number.isFinite(p))
                priority = p;
            tail = tail.slice(0, prioMatch.index).trim();
        }
        let rawParams;
        if (tail) {
            if (tail.startsWith("(") && tail.endsWith(")")) {
                rawParams = tail.slice(1, -1).trim();
            }
            else {
                rawParams = tail;
            }
        }
        return { isAsync, name, rawParams, priority };
    }
    static stripInlineComment(line) {
        if (/^\s*(vert|frag|both)\s+/.test(line)) {
            return line;
        }
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < line.length - 1; i++) {
            const ch = line[i];
            const next = line[i + 1];
            if (ch === "'" && !inDouble)
                inSingle = !inSingle;
            if (ch === '"' && !inSingle)
                inDouble = !inDouble;
            if (!inSingle && !inDouble && ch === "/" && next === "/") {
                return line.slice(0, i);
            }
        }
        return line;
    }
    static splitTopLevelByChar(input, separator = ",") {
        const out = [];
        let current = "";
        let depthRound = 0;
        let depthSquare = 0;
        let depthCurly = 0;
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < input.length; i++) {
            const ch = input[i];
            if (ch === "'" && !inDouble) {
                inSingle = !inSingle;
                current += ch;
                continue;
            }
            if (ch === '"' && !inSingle) {
                inDouble = !inDouble;
                current += ch;
                continue;
            }
            if (!inSingle && !inDouble) {
                if (ch === "(")
                    depthRound++;
                if (ch === ")")
                    depthRound--;
                if (ch === "[")
                    depthSquare++;
                if (ch === "]")
                    depthSquare--;
                if (ch === "{")
                    depthCurly++;
                if (ch === "}")
                    depthCurly--;
                if (ch === separator && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
                    out.push(current.trim());
                    current = "";
                    continue;
                }
            }
            current += ch;
        }
        if (current.trim().length > 0)
            out.push(current.trim());
        return out;
    }
    static splitTopLevelArrow(input) {
        let depthRound = 0;
        let depthSquare = 0;
        let depthCurly = 0;
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < input.length - 1; i++) {
            const ch = input[i];
            const next = input[i + 1];
            if (ch === "'" && !inDouble) {
                inSingle = !inSingle;
                continue;
            }
            if (ch === '"' && !inSingle) {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble)
                continue;
            if (ch === "(")
                depthRound++;
            else if (ch === ")")
                depthRound--;
            else if (ch === "[")
                depthSquare++;
            else if (ch === "]")
                depthSquare--;
            else if (ch === "{")
                depthCurly++;
            else if (ch === "}")
                depthCurly--;
            else if (ch === "-" && next === ">" && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
                return [input.slice(0, i).trim(), input.slice(i + 2).trim()];
            }
        }
        return null;
    }
    static parseShaderFilterTokenValue(token) {
        const trimmed = (token || "").trim();
        if (!trimmed)
            return "";
        if (trimmed === "*")
            return "*";
        if (/^\/(?:\\.|[^\/])+\/[gimsuy]*$/.test(trimmed)) {
            const lastSlash = trimmed.lastIndexOf("/");
            return new RegExp(trimmed.slice(1, lastSlash), trimmed.slice(lastSlash + 1));
        }
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
            return _a.parseValue(trimmed);
        }
        return trimmed;
    }
    static transpileShaderFilterToken(token) {
        const trimmed = (token || "").trim();
        if (!trimmed)
            return '""';
        if (trimmed === "*")
            return '"*"';
        if (/^\/(?:\\.|[^\/])+\/[gimsuy]*$/.test(trimmed)) {
            const lastSlash = trimmed.lastIndexOf("/");
            const source = trimmed.slice(1, lastSlash);
            const flags = trimmed.slice(lastSlash + 1);
            return `new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)})`;
        }
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))
            return trimmed;
        if (trimmed.startsWith("{") && trimmed.endsWith("}"))
            return _a.transpileExpr(trimmed);
        return JSON.stringify(trimmed);
    }
    static parseShaderFilterSpec(line) {
        const arrow = _a.splitTopLevelArrow(line);
        if (!arrow)
            return null;
        const [left, rawReplacement] = arrow;
        const tokens = _a.splitByWhitespaceTopLevel(left);
        if (tokens.length < 3)
            return null;
        const stage = (tokens[0] || "both").trim();
        if (!["vert", "frag", "both"].includes(stage))
            return null;
        return {
            stage,
            filePattern: _a.parseShaderFilterTokenValue(tokens[1]),
            searchPattern: _a.parseShaderFilterTokenValue(tokens[2]),
            replacement: _a.parseShaderFilterTokenValue(rawReplacement),
        };
    }
    static loadShaderFiltersFromLines(lines) {
        _a.shaderFilters = [];
        for (const line of lines || []) {
            const rule = _a.parseShaderFilterSpec(line);
            if (rule)
                _a.shaderFilters.push(rule);
        }
    }
    static loadTranspileShaderFiltersFromLines(lines) {
        _a.transpileShaderFilters = [];
        for (const line of lines || []) {
            const arrow = _a.splitTopLevelArrow(line);
            if (!arrow)
                continue;
            const [left, rawReplacement] = arrow;
            const tokens = _a.splitByWhitespaceTopLevel(left);
            if (tokens.length < 3)
                continue;
            const stage = (tokens[0] || "both").trim();
            if (!["vert", "frag", "both"].includes(stage))
                continue;
            _a.transpileShaderFilters.push({
                stage,
                filePatternExpr: _a.transpileShaderFilterToken(tokens[1]),
                searchPatternExpr: _a.transpileShaderFilterToken(tokens[2]),
                replacementExpr: _a.transpileShaderFilterToken(rawReplacement),
            });
        }
    }
    static shaderFilePatternMatches(filePattern, filePath) {
        const pathText = String(filePath || "");
        if (filePattern === undefined || filePattern === null || filePattern === "*")
            return true;
        if (filePattern instanceof RegExp) {
            filePattern.lastIndex = 0;
            return filePattern.test(pathText);
        }
        return pathText.includes(String(filePattern));
    }
    static applyShaderFilterMatch(source, searchPattern, replacement) {
        const search = searchPattern instanceof RegExp ? new RegExp(searchPattern.source, searchPattern.flags) : searchPattern;
        const repl = String(replacement !== null && replacement !== void 0 ? replacement : "");
        if (search instanceof RegExp)
            return source.replace(search, repl);
        return source.split(String(search !== null && search !== void 0 ? search : "")).join(repl);
    }
    static buildShaderFilter(stage, filePath) {
        return (source) => {
            let out = source;
            for (const rule of _a.shaderFilters || []) {
                if (!rule)
                    continue;
                if (rule.stage !== "both" && rule.stage !== stage)
                    continue;
                if (!_a.shaderFilePatternMatches(rule.filePattern, filePath))
                    continue;
                out = _a.applyShaderFilterMatch(out, rule.searchPattern, rule.replacement);
            }
            return out;
        };
    }
    static extractShaderFilterLines(lines) {
        const kept = [];
        const filterLines = [];
        let inShaderFilters = false;
        for (const rawLine of lines || []) {
            const trimmed = (rawLine || "").trim();
            if (!inShaderFilters && /^glslFilters\s*\{$/.test(trimmed)) {
                inShaderFilters = true;
                continue;
            }
            if (inShaderFilters) {
                if (trimmed === "}") {
                    inShaderFilters = false;
                    continue;
                }
                if (trimmed)
                    filterLines.push(trimmed);
                continue;
            }
            kept.push(rawLine);
        }
        return { lines: kept, filterLines };
    }
    static createShaderFromSource(gl, type, source, label = "") {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            console.error(`Error compiling shader${label ? ` (${label})` : ""}: ${info}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    static createProgramFromSources(gl, vertexSource, fragmentSource, vertexLabel = "", fragmentLabel = "") {
        const vert = _a.createShaderFromSource(gl, gl.VERTEX_SHADER, vertexSource, vertexLabel);
        const frag = _a.createShaderFromSource(gl, gl.FRAGMENT_SHADER, fragmentSource, fragmentLabel);
        if (!vert || !frag)
            return null;
        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            console.error(`Error linking program${vertexLabel || fragmentLabel ? ` (${vertexLabel || fragmentLabel})` : ""}: ${info}`);
            gl.deleteProgram(program);
            gl.deleteShader(vert);
            gl.deleteShader(frag);
            return null;
        }
        return { program, vert, frag };
    }
    static loadProgramWithShaderFilters(obj, gl) {
        return __awaiter(this, void 0, void 0, function* () {
            const vertexPath = obj === null || obj === void 0 ? void 0 : obj.vertPath;
            const fragmentPath = obj === null || obj === void 0 ? void 0 : obj.fragPath;
            if (!obj || typeof obj.loadProgram !== "function")
                return obj;
            if (!vertexPath || !fragmentPath) {
                yield obj.loadProgram();
                return obj;
            }
            const vertexFilter = _a.buildShaderFilter("vert", vertexPath);
            const fragmentFilter = _a.buildShaderFilter("frag", fragmentPath);
            yield obj.loadProgram(vertexPath, fragmentPath, vertexFilter, fragmentFilter);
            return obj;
        });
    }
    static transpileShaderFilterFactory(stage, filePathExpr) {
        const rules = (_a.transpileShaderFilters || [])
            .filter(rule => rule && (rule.stage === "both" || rule.stage === stage))
            .map(rule => `{ stage: ${JSON.stringify(rule.stage)}, filePattern: ${rule.filePatternExpr}, searchPattern: ${rule.searchPatternExpr}, replacement: ${rule.replacementExpr} }`)
            .join(", ");
        if (!rules.length)
            return `(source => source)`;
        return `((source) => {
            let out = source;
            const filePath = String(${filePathExpr} ?? "");
            const rules = [${rules}];
            for (const rule of rules) {
                if (!rule) continue;
                if (rule.stage !== "both" && rule.stage !== ${JSON.stringify(stage)}) continue;
                if (rule.filePattern !== undefined && rule.filePattern !== null && rule.filePattern !== "*" && !(rule.filePattern instanceof RegExp ? (rule.filePattern.lastIndex = 0, rule.filePattern.test(filePath)) : filePath.includes(String(rule.filePattern)))) continue;
                const search = rule.searchPattern instanceof RegExp ? new RegExp(rule.searchPattern.source, rule.searchPattern.flags) : rule.searchPattern;
                const replacement = String(rule.replacement ?? "");
                out = search instanceof RegExp ? out.replace(search, replacement) : out.split(String(search ?? "")).join(replacement);
            }
            return out;
        })`;
    }
    static splitByWhitespaceTopLevel(input) {
        const out = [];
        let current = "";
        let depthRound = 0;
        let depthSquare = 0;
        let depthCurly = 0;
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < input.length; i++) {
            const ch = input[i];
            if (ch === "'" && !inDouble) {
                inSingle = !inSingle;
                current += ch;
                continue;
            }
            if (ch === '"' && !inSingle) {
                inDouble = !inDouble;
                current += ch;
                continue;
            }
            if (!inSingle && !inDouble) {
                if (ch === "(")
                    depthRound++;
                if (ch === ")")
                    depthRound--;
                if (ch === "[")
                    depthSquare++;
                if (ch === "]")
                    depthSquare--;
                if (ch === "{")
                    depthCurly++;
                if (ch === "}")
                    depthCurly--;
                if (/\s/.test(ch) && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
                    if (current.trim())
                        out.push(current.trim());
                    current = "";
                    continue;
                }
            }
            current += ch;
        }
        if (current.trim())
            out.push(current.trim());
        return out;
    }
    static splitParamsAndChainTokens(input) {
        const params = [];
        const chains = [];
        for (const token of _a.splitByWhitespaceTopLevel(input || "")) {
            if (token.trim().startsWith(".")) {
                chains.push(token.trim());
            }
            else {
                params.push(token.trim());
            }
        }
        return { params, chains };
    }
    static transpileExpr(rawExpr) {
        let expr = (rawExpr !== null && rawExpr !== void 0 ? rawExpr : "").trim();
        if (!expr)
            return expr;
        let prev = "";
        while (prev !== expr) {
            prev = expr;
            expr = expr.replace(/\{([^{}]+)\}/g, "($1)");
        }
        expr = expr.replace(/\bvec3\s*\(/g, "new Vector3D(");
        expr = expr.replace(/new Vector3D\(\s*([^,()]+)\s*\)/g, "new Vector3D($1,$1,$1)");
        expr = expr.replace(/(?<!["'])\b[Tt]exUnit(\d+)\b(?!["'])/g, "\"TexUnit$1\"");
        expr = expr.replace(/(?<!["'])\b[Cc]olAtch(\d+)\b(?!["'])/g, "\"ColAtch$1\"");
        return expr.trim();
    }
    static normalizeTexUnitToken(token) {
        var _b, _c;
        const m = (_b = token === null || token === void 0 ? void 0 : token.trim()) === null || _b === void 0 ? void 0 : _b.match(/^texunit(\d+)$/i);
        if (m)
            return `"TexUnit${m[1]}"`;
        const m2 = (_c = token === null || token === void 0 ? void 0 : token.trim()) === null || _c === void 0 ? void 0 : _c.match(/^TexUnit(\d+)$/);
        if (m2)
            return `"TexUnit${m2[1]}"`;
        return _a.transpileExpr(token);
    }
    static transpileSizeToken(sizeToken) {
        const sizeParts = _a.splitTopLevelByChar(sizeToken, "x")
            .map(p => _a.transpileExpr(p));
        if (!sizeParts.length)
            return "[]";
        return `[${sizeParts.join(", ")}]`;
    }
    static appendSemicolon(line) {
        const t = line.trim();
        if (!t)
            return t;
        if (t.endsWith(";") || t.endsWith("{") || t.endsWith("}") || t.endsWith(");"))
            return t;
        return t + ";";
    }
    static getNodeRequire() {
        try {
            const g = globalThis;
            if (typeof g.require === "function")
                return g.require;
            return (0, eval)("require");
        }
        catch (_b) {
            return null;
        }
    }
    static readFileSafe(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const req = _a.getNodeRequire();
                if (req) {
                    const fs = req("fs");
                    return yield fs.promises.readFile(filePath, "utf8");
                }
                const fs = yield import("node:fs/promises");
                return yield fs.readFile(filePath, "utf8");
            }
            catch (_b) {
                return null;
            }
        });
    }
    static writeFileSafe(filePath, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = _a.getNodeRequire();
            if (req) {
                const fs = req("fs");
                const path = req("path");
                yield fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                yield fs.promises.writeFile(filePath, content, "utf8");
                return;
            }
            const fs = yield import("node:fs/promises");
            const path = yield import("node:path");
            yield fs.mkdir(path.dirname(filePath), { recursive: true });
            yield fs.writeFile(filePath, content, "utf8");
        });
    }
    static resolveParseTextImports(source, baseDir, seen = new Set()) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = _a.getNodeRequire();
            const pathMod = req ? req("path") : yield import("node:path");
            const cwd = (() => {
                try {
                    return req ? req("process").cwd() : process.cwd();
                }
                catch (_b) {
                    return ".";
                }
            })();
            const rootDir = baseDir || cwd;
            const lines = source.split(/\r?\n/);
            const out = [];
            for (const line of lines) {
                const m = line.match(/^\s*import\s+<([A-Za-z_][\w-]*)>\s+from\s+["']?(.+?\.txt)["']?\s*$/);
                if (!m) {
                    out.push(line);
                    continue;
                }
                const markerName = m[1];
                const rawPath = m[2].trim();
                const resolved = pathMod.resolve(rootDir, rawPath);
                if (seen.has(resolved)) {
                    throw new Error(`Cyclic parseText import detected for <${markerName}> from ${resolved}`);
                }
                const imported = yield _a.readFileSafe(resolved);
                if (imported == null) {
                    throw new Error(`Could not read parseText import <${markerName}> from ${resolved}`);
                }
                seen.add(resolved);
                const nested = yield _a.resolveParseTextImports(imported, pathMod.dirname(resolved), seen);
                seen.delete(resolved);
                out.push(`//<import:${markerName}:${rawPath}>`);
                out.push(nested);
                out.push(`//</import:${markerName}:${rawPath}>`);
            }
            return out.join("\n");
        });
    }
    static extractPreservedSections(source) {
        const map = new Map();
        const lines = source.split(/\r?\n/);
        let current = null;
        let bucket = [];
        for (const line of lines) {
            const open = line.trim().match(/^\/\/<([A-Za-z_][\w-]*)>\s*$/);
            if (open) {
                current = open[1];
                bucket = [];
                continue;
            }
            const close = line.trim().match(/^\/\/<\/([A-Za-z_][\w-]*)>\s*$/);
            if (close && current === close[1]) {
                map.set(current, [...bucket]);
                current = null;
                bucket = [];
                continue;
            }
            if (current)
                bucket.push(line);
        }
        return map;
    }
    static extractImportsFromMain(mainTsPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mainTsPath)
                return [];
            const source = yield _a.readFileSafe(mainTsPath);
            if (!source)
                return [];
            const lines = source.split(/\r?\n/);
            const imports = [];
            let current = [];
            let readingImport = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (!readingImport && trimmed.startsWith("import ")) {
                    readingImport = true;
                    current = [line];
                    if (trimmed.endsWith(";")) {
                        imports.push(current.join("\n"));
                        current = [];
                        readingImport = false;
                    }
                    continue;
                }
                if (readingImport) {
                    current.push(line);
                    if (trimmed.endsWith(";")) {
                        imports.push(current.join("\n"));
                        current = [];
                        readingImport = false;
                    }
                    continue;
                }
                if (imports.length && trimmed.length && !trimmed.startsWith("import ")) {
                    break;
                }
            }
            return _a.ensureOpenGLHelpersImport(_a.ensureWebglCapsulesImport(imports));
        });
    }
    static ensureWebglCapsulesImport(imports) {
        const idx = imports.findIndex(i => /from\s+["'][^"']*webglCapsules\.js["']/.test(i));
        if (idx < 0)
            return imports;
        const imp = imports[idx];
        const m = imp.match(/import\s*{([\s\S]*?)}\s*from\s*["']([^"']*webglCapsules\.js)["'];?/);
        if (!m)
            return imports;
        const names = m[1]
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        if (!names.includes("MeshFillerProgram"))
            names.push("MeshFillerProgram");
        imports[idx] = `import { ${[...new Set(names)].join(", ")} } from "${m[2]}";`;
        return imports;
    }
    static ensureOpenGLHelpersImport(imports) {
        const helperNames = ["__prepareMathFunction", "__mountGlobalBlocks"];
        const idx = imports.findIndex(i => /from\s+["'][^"']*opengl\.js["']/.test(i));
        if (idx < 0) {
            imports.push(`import { ${helperNames.join(", ")} } from "/Code/opengl/opengl.js";`);
            return imports;
        }
        const imp = imports[idx];
        const m = imp.match(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/);
        if (!m)
            return imports;
        const names = m[1].split(",").map(s => s.trim()).filter(Boolean);
        helperNames.forEach(h => { if (!names.includes(h))
            names.push(h); });
        imports[idx] = `import { ${[...new Set(names)].join(", ")} } from "${m[2]}";`;
        return imports;
    }
    static extractAliasesAndCore(rawLine) {
        let aliases = [];
        let core = rawLine.trim();
        const leftMatch = core.match(/^\s*([a-zA-Z_]\w*(?:\s*\|=\s*[a-zA-Z_]\w*)*)\s*=/);
        if (leftMatch) {
            const leftAliases = leftMatch[1]
                .split(/\|=/)
                .map(s => s.trim())
                .filter(Boolean);
            aliases.push(...leftAliases);
            core = core.slice(leftMatch[0].length).trim();
        }
        const rightMatch = core.match(/\|=\s*([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*$/);
        if (rightMatch) {
            const rightAliases = rightMatch[1]
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
            aliases.push(...rightAliases);
            core = core.slice(0, rightMatch.index).trim();
        }
        aliases = [...new Set(aliases)];
        return { aliases, core };
    }
    static transpileUniformLine(programRef, line) {
        const m = line.match(/^(\w+)\s*=\s*(.+?)([iuf])?\s*$/);
        if (!m)
            return [`// TODO(uniform): ${line}`];
        const [, name, rawValue, rawSuffix] = m;
        const suffix = rawSuffix || "f";
        const isFloat = suffix === "f";
        const isUnsigned = suffix === "u";
        const value = rawValue.trim();
        if (value.startsWith("vec3(") && value.endsWith(")")) {
            const inside = value.slice(5, -1);
            const comps = _a.splitTopLevelByChar(inside, ",")
                .map(x => _a.transpileExpr(x));
            return [
                `${programRef}.uVec("${name}", 3, ${isFloat}, ${isUnsigned}).set([${comps.join(", ")}]);`
            ];
        }
        const expr = _a.transpileExpr(rawValue);
        return [`${programRef}.uNum("${name}", ${isFloat}, ${isUnsigned}).set(${expr});`];
    }
    static transpileProgramObject(aliases, core) {
        const m = core.match(/^Program(?:\s+(.+))?$/);
        if (!m || aliases.length === 0)
            return null;
        const firstAlias = aliases[0];
        let argRaw = (m[1] || "").trim();
        if (!argRaw)
            argRaw = firstAlias;
        let argJs = "";
        if (/^["']/.test(argRaw))
            argJs = argRaw;
        else if (argRaw.startsWith("{") && argRaw.endsWith("}"))
            argJs = _a.transpileExpr(argRaw);
        else
            argJs = JSON.stringify(argRaw);
        const out = [
            `if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);`,
            `var ${firstAlias} = WebGLMan.program(-1, ${argJs});`,
            `lastUsedProgram = ${firstAlias};`,
        ];
        for (const alias of aliases.slice(1)) {
            out.push(`var ${alias} = ${firstAlias};`);
        }
        return out;
    }
    static ensureAliasesForClass(aliases, className, declaredVars) {
        const out = aliases.filter(Boolean);
        if (out.length === 0) {
            const base = className.charAt(0).toLowerCase() + className.slice(1);
            let candidate = base;
            let counter = 1;
            while (declaredVars.has(candidate)) {
                candidate = `${base}${counter++}`;
            }
            out.push(candidate);
        }
        out.forEach(a => declaredVars.add(a));
        return out;
    }
    static transpileCamera3DObject(aliases, core) {
        var _b, _c;
        const m = core.match(/^Camera3D(?:\s+(.+))?$/);
        if (!m || aliases.length === 0)
            return null;
        const firstAlias = aliases[0];
        const paramsStr = (m[1] || "").trim();
        const split = _a.splitParamsAndChainTokens(paramsStr);
        const params = new Map();
        if (split.params.length) {
            for (const token of split.params) {
                const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
                if (!pm)
                    continue;
                params.set(pm[1], _a.transpileExpr(pm[2]));
            }
        }
        const ordered = [
            params.get("pos"),
            params.get("fov"),
            (_b = params.get("aspectRatio")) !== null && _b !== void 0 ? _b : params.get("ratio"),
            params.get("near"),
            params.get("far"),
            (_c = params.get("walkspeed")) !== null && _c !== void 0 ? _c : params.get("speed"),
        ];
        while (ordered.length && (ordered[ordered.length - 1] === undefined))
            ordered.pop();
        const ctorArgs = ordered
            .map(v => v === undefined ? "undefined" : v)
            .join(", ");
        const out = [`var ${firstAlias} = new Camera3D(${ctorArgs});`];
        for (const chain of split.chains)
            out.push(`${firstAlias}${chain};`);
        for (const alias of aliases.slice(1)) {
            out.push(`var ${alias} = ${firstAlias};`);
        }
        return out;
    }
    static transpileTexture2DArrayObject(aliases, core) {
        const m = core.match(/^texture2DArray\s+([\s\S]+)$/);
        if (!m || aliases.length === 0)
            return null;
        const tokens = _a.splitByWhitespaceTopLevel(m[1]);
        if (tokens.length < 5)
            return null;
        const firstAlias = aliases[0];
        const format = tokens[0];
        const dataExpr = _a.transpileExpr(tokens[1]);
        const nameArg = tokens[2].startsWith('"') || tokens[2].startsWith("'")
            ? tokens[2]
            : JSON.stringify(tokens[2]);
        const texUnit = _a.normalizeTexUnitToken(tokens[3]);
        const sizeToken = tokens.slice(4).join(" ");
        const sizeExpr = _a.transpileSizeToken(sizeToken);
        const out = [
            `var ${firstAlias} = lastUsedProgram?.texture2DArray?.({`,
            `    format: (TexExamples as any).${format},`,
            `    data: ${dataExpr},`,
            `    name: ${nameArg},`,
            `    texUnit: ${texUnit},`,
            `    size: ${sizeExpr}`,
            `});`
        ];
        for (const alias of aliases.slice(1)) {
            out.push(`var ${alias} = ${firstAlias};`);
        }
        return out;
    }
    static transpileMeshProgramObject(aliases, core) {
        var _b, _c, _d;
        const m = core.match(/^MeshProgram(?:\s+(.+))?$/);
        if (!m || aliases.length === 0)
            return null;
        const firstAlias = aliases[0];
        const paramsStr = (m[1] || "").trim();
        const split = _a.splitParamsAndChainTokens(paramsStr);
        const params = new Map();
        const positional = [];
        if (split.params.length) {
            for (const token of split.params) {
                const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
                if (pm) {
                    params.set(pm[1], _a.transpileExpr(pm[2]));
                }
                else {
                    positional.push(_a.transpileExpr(token));
                }
            }
        }
        const inputExpr = (_c = (_b = params.get("input")) !== null && _b !== void 0 ? _b : positional[0]) !== null && _c !== void 0 ? _c : "undefined";
        const sizeExpr = positional[0] && params.has("input")
            ? positional[0]
            : ((_d = positional[1]) !== null && _d !== void 0 ? _d : "undefined");
        const sizeArg = sizeExpr.includes("x")
            ? _a.transpileSizeToken(sizeExpr)
            : (sizeExpr.startsWith("[") ? sizeExpr : _a.transpileExpr(sizeExpr));
        const out = [
            `var ${firstAlias} = new MeshRenderingProgram(gl, ${inputExpr}, (${sizeArg})[0], (${sizeArg})[1]).includeInWebManList();`,
            `lastUsedProgram = ${firstAlias};`
        ];
        for (const chain of split.chains)
            out.push(`${firstAlias}${chain};`);
        for (const alias of aliases.slice(1))
            out.push(`var ${alias} = ${firstAlias};`);
        return out;
    }
    static transpileAxis3DGroupObject(aliases, core) {
        var _b, _c, _d, _e, _f;
        const m = core.match(/^Axis3DGroup(?:\s+(.+))?$/);
        if (!m || aliases.length === 0)
            return null;
        const firstAlias = aliases[0];
        const paramsStr = (m[1] || "").trim();
        const split = _a.splitParamsAndChainTokens(paramsStr);
        const params = new Map();
        if (split.params.length) {
            for (const token of split.params) {
                const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
                if (!pm)
                    continue;
                params.set(pm[1], _a.transpileExpr(pm[2]));
            }
        }
        const out = [
            `var ${firstAlias} = new Axis3DGroup(gl, ${(_b = params.get("axisLength")) !== null && _b !== void 0 ? _b : "undefined"}, ${(_c = params.get("drawArrows")) !== null && _c !== void 0 ? _c : "undefined"}, ${(_d = params.get("heights")) !== null && _d !== void 0 ? _d : "undefined"}, ${(_e = params.get("radii")) !== null && _e !== void 0 ? _e : "undefined"}, ${(_f = params.get("planes")) !== null && _f !== void 0 ? _f : "undefined"}).includeInWebManList();`
        ];
        for (const chain of split.chains)
            out.push(`${firstAlias}${chain};`);
        for (const alias of aliases.slice(1))
            out.push(`var ${alias} = ${firstAlias};`);
        return out;
    }
    static transpileMeshFillerProgramObject(aliases, core) {
        var _b;
        const m = core.match(/^MeshFillerProgram(?:\s+(.+))?$/);
        if (!m || aliases.length === 0)
            return null;
        const firstAlias = aliases[0];
        const paramsStr = (m[1] || "").trim();
        const split = _a.splitParamsAndChainTokens(paramsStr);
        const tokens = split.params;
        const texUnit = tokens[0] ? _a.normalizeTexUnitToken(tokens[0]) : "undefined";
        const programBody = (_b = tokens[1]) !== null && _b !== void 0 ? _b : undefined;
        const callbackToken = tokens[1] || "";
        let callbackSource = callbackToken;
        if ((callbackSource.startsWith('"') && callbackSource.endsWith('"')) ||
            (callbackSource.startsWith("'") && callbackSource.endsWith("'"))) {
            callbackSource = callbackSource.slice(1, -1);
        }
        callbackSource = callbackSource.replace(/\\(["'\\])/g, "$1");
        const contextNames = _a.extractContextNamesFromCallback(callbackSource)
            .filter(n => n !== "x" && n !== "y");
        const out = [
            `var ${firstAlias} = new MeshFillerProgram(gl, ${texUnit}).includeInWebManList();`
        ];
        if (programBody !== undefined) {
            if (contextNames.length) {
                const ctxName = `__ctx_${firstAlias}`;
                out.push(`var ${ctxName} = {`);
                contextNames.forEach(n => {
                    out.push(`    get ${n}(){ return (typeof ${n} !== "undefined") ? ${n} : (globalThis as any).${n}; },`);
                });
                out.push(`};`);
                out.push(`${firstAlias}.generateProgram(${programBody}, ${ctxName}, globalThis as any);`);
            }
            else {
                out.push(`${firstAlias}.generateProgram(${programBody}, globalThis as any);`);
            }
            out.push(`await ${firstAlias}.loadProgram?.();`);
        }
        for (const chain of split.chains)
            out.push(`${firstAlias}${chain};`);
        out.push(`lastFillerProgram = ${firstAlias};`);
        for (const alias of aliases.slice(1))
            out.push(`var ${alias} = ${firstAlias};`);
        return out;
    }
    static transpileEscapedDestructuring(line, declaredVars) {
        const m = line.match(/^\[\s*([^\]]+)\s*\]\s*=\s*\$(\w+)\$\(([\s\S]*)\)$/);
        if (!m)
            return null;
        const vars = m[1]
            .split(",")
            .map(v => v.trim())
            .filter(Boolean);
        const funcName = m[2].trim();
        const argsRaw = m[3].trim();
        const out = [];
        const undeclared = vars.filter(v => !declaredVars.has(v));
        if (undeclared.length > 0) {
            out.push(`var ${undeclared.join(", ")};`);
            undeclared.forEach(v => declaredVars.add(v));
        }
        const args = argsRaw
            ? _a.splitTopLevelByChar(argsRaw, ",").map(a => _a.transpileExpr(a)).join(", ")
            : "";
        const tuple = `[${vars.join(", ")}]`;
        out.push(`${tuple} = ${funcName}(${args});`);
        return out;
    }
    static transpileCreateIdealMesh(line, declaredVars) {
        var _b;
        const m = line.match(/^(?:([a-zA-Z_]\w*)\s*=\s*)?createIdealMesh\s+([\s\S]+)$/);
        if (!m)
            return null;
        const alias = (_b = m[1]) === null || _b === void 0 ? void 0 : _b.trim();
        let rest = (m[2] || "").trim().replace(/;$/, "");
        const tokens = _a.splitByWhitespaceTopLevel(rest);
        if (!tokens.length)
            return null;
        const texToken = tokens[0];
        rest = rest.slice(rest.indexOf(texToken) + texToken.length).trim();
        let callbackRaw = rest;
        let chainRaw = "";
        const chainMatch = rest.match(/^(.*?)(\s*(?:\.[A-Za-z_]\w*\([^)]*\)\s*)+)$/);
        if (chainMatch) {
            callbackRaw = chainMatch[1].trim();
            chainRaw = chainMatch[2].trim();
        }
        const texExpr = _a.normalizeTexUnitToken(texToken);
        const callbackStr = JSON.stringify(callbackRaw);
        const targetName = alias ? alias : "__meshTexTmp";
        const out = [];
        if (alias && !declaredVars.has(alias)) {
            declaredVars.add(alias);
            out.push(`var ${alias};`);
        }
        out.push(`(()=>{`);
        out.push(`    // createIdealMesh${alias ? ` ${alias}` : ""}`);
        out.push(`    let compiledCreateIdealMeshFn = __prepareMathFunction(${callbackStr});`);
        const createExpr = `lastUsedProgram?.createIdealTexture?.(${texExpr}, compiledCreateIdealMeshFn)`;
        if (alias)
            out.push(`    ${alias} = ${createExpr};`);
        else
            out.push(`    let ${targetName} = ${createExpr};`);
        if (chainRaw) {
            const chainCalls = chainRaw.match(/\.[A-Za-z_]\w*\([^)]*\)/g) || [];
            for (const call of chainCalls) {
                const cm = call.match(/^\.([A-Za-z_]\w*)\(([\s\S]*)\)$/);
                if (!cm)
                    continue;
                const method = cm[1];
                const args = cm[2].trim();
                const transpiledArgs = args ? _a.transpileExpr(args) : "";
                out.push(`    ${targetName}?.${method}?.(${transpiledArgs});`);
            }
        }
        out.push(`})();`);
        return out;
    }
    static transpileSimpleStatement(line, declaredVars) {
        var _b;
        const out = [];
        const escaped = _a.transpileEscapedDestructuring(line, declaredVars);
        if (escaped)
            return escaped;
        const createIdeal = _a.transpileCreateIdealMesh(line, declaredVars);
        if (createIdeal)
            return createIdeal;
        const letMatch = line.match(/^let\s+([a-zA-Z_]\w*)(?:\s*=\s*([\s\S]+))?$/);
        if (letMatch) {
            const [, name, valueRaw] = letMatch;
            if (declaredVars.has(name)) {
                if (valueRaw === undefined)
                    return [`${name} = undefined;`];
                return [`${name} = ${_a.transpileExpr(valueRaw)};`];
            }
            declaredVars.add(name);
            if (valueRaw === undefined)
                return [`var ${name};`];
            return [`var ${name} = ${_a.transpileExpr(valueRaw)};`];
        }
        const useMatch = line.match(/^(lduse|use)\s+(.+)$/);
        if (useMatch) {
            const kind = useMatch[1];
            const obj = _a.transpileExpr(useMatch[2]);
            if (kind === "lduse") {
                const vertFilter = _a.transpileShaderFilterFactory("vert", `${obj}.vertPath`);
                const fragFilter = _a.transpileShaderFilterFactory("frag", `${obj}.fragPath`);
                return [
                    `await ${obj}.loadProgram(${obj}.vertPath, ${obj}.fragPath, ${vertFilter}, ${fragFilter});`,
                    `await ${obj}.use?.();`,
                    `lastUsedProgram = ${obj};`
                ];
            }
            return [
                `await ${obj}.use?.();`,
                `lastUsedProgram = ${obj};`
            ];
        }
        const viewportMatch = line.match(/^viewport\s+([^\s]+)\s+(.+)$/);
        if (viewportMatch) {
            const prog = _a.transpileExpr(viewportMatch[1]);
            const viewExpr = _a.transpileExpr(viewportMatch[2]);
            return [
                `${prog}.use?.();`,
                `${prog}.setViewport(...${viewExpr});`
            ];
        }
        const depthTestMatch = line.match(/^depthTest\s+(.+)$/);
        if (depthTestMatch) {
            return [`if(lastUsedProgram) lastUsedProgram.isDepthTest = ${_a.transpileExpr(depthTestMatch[1])};`];
        }
        if (line.trim() === "start")
            return ["if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);", "start();"];
        if (line.trim() === "startAsync")
            return ["if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);", "await startAsync();"];
        const logMatch = line.match(/^log\s+(.+)$/);
        if (logMatch) {
            const args = _a.splitByWhitespaceTopLevel(logMatch[1])
                .map(t => _a.transpileExpr(t));
            return [`console.log(${args.join(", ")});`];
        }
        const { aliases, core } = _a.extractAliasesAndCore(line);
        const inferredClass = (_b = core.match(/^([A-Z][A-Za-z0-9_]*)\b/)) === null || _b === void 0 ? void 0 : _b[1];
        const objectAliases = inferredClass
            ? _a.ensureAliasesForClass(aliases, inferredClass, declaredVars)
            : aliases;
        if (objectAliases.length > 0) {
            const asProgram = _a.transpileProgramObject(objectAliases, core);
            if (asProgram)
                return asProgram;
            const asMeshProgram = _a.transpileMeshProgramObject(objectAliases, core);
            if (asMeshProgram)
                return asMeshProgram;
            const asMeshFillerProgram = _a.transpileMeshFillerProgramObject(objectAliases, core);
            if (asMeshFillerProgram)
                return asMeshFillerProgram;
            const asAxis = _a.transpileAxis3DGroupObject(objectAliases, core);
            if (asAxis)
                return asAxis;
            const asCamera = _a.transpileCamera3DObject(objectAliases, core);
            if (asCamera)
                return asCamera;
            const asTexArray = _a.transpileTexture2DArrayObject(objectAliases, core);
            if (asTexArray)
                return asTexArray;
        }
        const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*([+\-*/]?=)\s*([\s\S]+)$/);
        if (assignMatch && !line.includes("==")) {
            const [, name, op, value] = assignMatch;
            return [`${name} ${op} ${_a.transpileExpr(value)};`];
        }
        out.push(_a.appendSemicolon(_a.transpileExpr(line)));
        return out;
    }
    static transpileToFile(str, outPath, mainImportsPath) {
        var _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const req = _a.getNodeRequire();
            const pathMod = req ? req("path") : yield import("node:path");
            const parseBaseDir = outPath ? pathMod.dirname(outPath) : undefined;
            str = yield _a.resolveParseTextImports(str, parseBaseDir);
            let resolvedMainPath = mainImportsPath;
            if (!resolvedMainPath) {
                try {
                    const path = req === null || req === void 0 ? void 0 : req("path");
                    resolvedMainPath = path ? path.join(path.dirname(outPath), "main.ts") : undefined;
                }
                catch (_d) {
                    resolvedMainPath = undefined;
                }
            }
            const imports = yield _a.extractImportsFromMain(resolvedMainPath);
            const previousSource = yield _a.readFileSafe(outPath);
            const preserved = previousSource
                ? _a.extractPreservedSections(previousSource)
                : new Map();
            const processed = str
                .replaceAll("\t", "    ");
            let lines = processed.split("\n")
                .map(l => _a.stripInlineComment(l).replace(/\r/g, ""));
            const extractedShaderFilters = _a.extractShaderFilterLines(lines);
            _a.loadTranspileShaderFiltersFromLines(extractedShaderFilters.filterLines);
            lines = extractedShaderFilters.lines;
            lines = _a.joinIndentedLines(lines);
            const body = [];
            const declaredVars = new Set();
            let indent = 0;
            const ind = () => "    ".repeat(indent);
            let scaffoldInserted = false;
            const blockStack = [];
            const usedMarkers = new Set();
            let globalBlockSerial = 0;
            const insertScaffold = () => {
                if (scaffoldInserted)
                    return;
                body.push(`var lastUsedProgram: any = null;`);
                body.push(`var lastFillerProgram: any = null;`);
                body.push(`void lastFillerProgram;`);
                body.push(`var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];`);
                scaffoldInserted = true;
            };
            for (let i = 0; i < lines.length; i++) {
                const raw = lines[i];
                const line = raw.trim();
                if (!line)
                    continue;
                const marker = line.match(/^<(?:\/)?([A-Za-z_][\w-]*)(?:\/)?>$/);
                if (marker) {
                    const name = marker[1];
                    usedMarkers.add(name);
                    body.push(`${ind()}//<${name}>`);
                    const kept = preserved.get(name) || [];
                    kept.forEach(k => body.push(k));
                    body.push(`${ind()}//</${name}>`);
                    continue;
                }
                insertScaffold();
                const currentBlock = blockStack[blockStack.length - 1];
                if ((currentBlock === null || currentBlock === void 0 ? void 0 : currentBlock.kind) === "uniforms") {
                    if (line === "}") {
                        blockStack.pop();
                        continue;
                    }
                    const programs = (currentBlock.uniformPrograms && currentBlock.uniformPrograms.length)
                        ? currentBlock.uniformPrograms
                        : ["lastUsedProgram"];
                    for (const p of programs) {
                        body.push(`${ind()}${p}.use?.();`);
                        const uniLines = _a.transpileUniformLine(p, line);
                        uniLines.forEach(l => body.push(`${ind()}${l}`));
                    }
                    continue;
                }
                const ifMatch = line.match(/^if\s*\(([\s\S]+)\)\s*\{$/);
                if (ifMatch) {
                    body.push(`${ind()}if(${_a.transpileExpr(ifMatch[1])}){`);
                    if (currentBlock)
                        currentBlock.ifDepth++;
                    continue;
                }
                const elseIfMatch = line.match(/^else\s+if\s*\(([\s\S]+)\)\s*\{$/);
                if (elseIfMatch) {
                    body.push(`${ind()}else if(${_a.transpileExpr(elseIfMatch[1])}){`);
                    continue;
                }
                const elseMatch = line.match(/^(?:\}\s*)?else\s*\{$/);
                if (elseMatch) {
                    if (/^\}/.test(line)) {
                        body.push(`${ind()}} else {`);
                    }
                    else {
                        body.push(`${ind()}else{`);
                    }
                    continue;
                }
                const uniformsStart = line.match(/^uniforms(?:\s+(.+?))?\s*\{$/);
                if (uniformsStart) {
                    const programs = uniformsStart[1]
                        ? uniformsStart[1].split(",").map(s => s.trim()).filter(Boolean).map(s => _a.transpileExpr(s))
                        : ["lastUsedProgram"];
                    blockStack.push({
                        kind: "uniforms",
                        name: "uniforms",
                        ifDepth: 0,
                        loopCount: 0,
                        uniformPrograms: programs
                    });
                    continue;
                }
                const blockHeader = _a.parseBlockHeader(line);
                if (blockHeader) {
                    const isAsync = blockHeader.isAsync;
                    const blockName = blockHeader.name;
                    const rawParams = blockHeader.rawParams;
                    const blockPriority = blockHeader.priority;
                    const isKeyBlock = blockName === "OnKey" || blockName === "OnKeyPress" || blockName === "OnKeyRelease";
                    if (isKeyBlock) {
                        const keyExpr = rawParams ? _a.transpileExpr(rawParams.trim()) : "\"\"";
                        if (blockName === "OnKeyRelease") {
                            body.push(`${ind()}window.addEventListener("keyup", async (e)=>{ // ${blockName}`);
                            indent++;
                            body.push(`${ind()}if(((e as any)?.key||"").toLowerCase()===String(${keyExpr}).toLowerCase()){`);
                            indent++;
                            blockStack.push({
                                kind: "keyRelease",
                                name: blockName,
                                ifDepth: 0,
                                loopCount: 0,
                            });
                        }
                        else {
                            const method = blockName === "OnKeyPress" ? "OnPress" : "OnKey";
                            body.push(`${ind()}KeyManager.${method}(${keyExpr}, async (e)=>{ // ${blockName}`);
                            body.push(`${ind()}if((e as any)?.repeat) return;`);
                            indent++;
                            blockStack.push({
                                kind: "key",
                                name: blockName,
                                ifDepth: 0,
                                loopCount: 0,
                            });
                        }
                        continue;
                    }
                    const isSpecial = blockName === "tick" || blockName === "draw";
                    const isGlobalBlock = blockStack.length === 0;
                    const priority = blockPriority !== null && blockPriority !== void 0 ? blockPriority : 10;
                    if (isGlobalBlock) {
                        const fnVarName = `__globalBlockFn_${globalBlockSerial}`;
                        const globalOrder = globalBlockSerial;
                        globalBlockSerial++;
                        body.push(`${ind()}var ${fnVarName} = async (dt)=>{ // ${blockName}`);
                        blockStack.push({
                            kind: isSpecial ? "special" : "named",
                            name: blockName,
                            ifDepth: 0,
                            loopCount: 0,
                            priority,
                            isGlobal: true,
                            fnVarName,
                            globalOrder
                        });
                    }
                    else {
                        body.push(`${ind()}addFunc(async (dt)=>{ // ${blockName}`);
                        blockStack.push({
                            kind: isSpecial ? "special" : "named",
                            name: blockName,
                            ifDepth: 0,
                            loopCount: 0,
                            priority,
                            isGlobal: false,
                        });
                    }
                    indent++;
                    let loopCount = 0;
                    if (!isSpecial && rawParams) {
                        const parsed = _a.parseBlockParams(rawParams) || [];
                        body.push(`${ind()}// <block ${blockName}>`);
                        for (const p of parsed) {
                            if (p.type === "range") {
                                declaredVars.add(p.name);
                                body.push(`${ind()}for (let ${p.name} = ${_a.transpileExpr(p.start)}; ${p.name} <= ${_a.transpileExpr(p.end)}; ${p.name}++) {`);
                                indent++;
                                loopCount++;
                                continue;
                            }
                            if (p.type === "list") {
                                declaredVars.add(p.name);
                                body.push(`${ind()}for (const ${p.name} of ${_a.transpileExpr(p.value)}) {`);
                                indent++;
                                loopCount++;
                                continue;
                            }
                        }
                    }
                    const lastBlock = blockStack[blockStack.length - 1];
                    lastBlock.loopCount = loopCount;
                    continue;
                }
                if (line === "}" && currentBlock) {
                    if (currentBlock.ifDepth > 0) {
                        currentBlock.ifDepth--;
                        body.push(`${ind()}}`);
                        continue;
                    }
                    const closing = blockStack.pop();
                    if (closing.kind === "key") {
                        indent--;
                        body.push(`${ind()}});`);
                        continue;
                    }
                    if (closing.kind === "keyRelease") {
                        indent--;
                        body.push(`${ind()}}`);
                        indent--;
                        body.push(`${ind()});`);
                        continue;
                    }
                    if (closing.kind === "special" || closing.kind === "named") {
                        for (let j = 0; j < closing.loopCount; j++) {
                            indent--;
                            body.push(`${ind()}}`);
                        }
                        if (closing.kind === "named") {
                            body.push(`${ind()}// </block ${closing.name}>`);
                        }
                        indent--;
                        if (closing.isGlobal) {
                            body.push(`${ind()}};`);
                            body.push(`${ind()}__globalBlocks.push({ priority: ${(_b = closing.priority) !== null && _b !== void 0 ? _b : 10}, order: ${(_c = closing.globalOrder) !== null && _c !== void 0 ? _c : 0}, fn: ${closing.fnVarName} });`);
                        }
                        else {
                            body.push(`${ind()}});`);
                        }
                        continue;
                    }
                }
                const transpiled = _a.transpileSimpleStatement(line, declaredVars);
                transpiled.forEach(l => body.push(`${ind()}${l}`));
            }
            if (!scaffoldInserted) {
                insertScaffold();
            }
            for (const [name, kept] of preserved.entries()) {
                if (usedMarkers.has(name))
                    continue;
                body.push(`${ind()}//<${name}>`);
                kept.forEach(k => body.push(k));
                body.push(`${ind()}//</${name}>`);
            }
            const fileLines = [];
            if (imports.length) {
                fileLines.push(...imports, "");
            }
            fileLines.push(...body);
            fileLines.push("");
            const result = fileLines.join("\n");
            yield _a.writeFileSafe(outPath, result);
            return result;
        });
    }
    static parse(str, gl, thiscontext, outPath, mainImportsPath) {
        var _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            if (outPath) {
                return yield _a.transpileToFile(str, outPath, mainImportsPath);
            }
            str = yield _a.resolveParseTextImports(str);
            _a.gctx.gl = gl;
            _a.context = {
                vars: new Map(),
                lookUpNames: [],
                blockName: [],
                isBlockAsync: false,
                blockParams: [],
                lastUsedProgram: null,
                thiscontext
            };
            let processedStr = str
                .replaceAll("\t", "    ");
            let lines = processedStr.split('\n')
                .map(l => _a.stripInlineComment(l).replace(/\r/g, ""));
            const extractedShaderFilters = _a.extractShaderFilterLines(lines);
            _a.loadShaderFiltersFromLines(extractedShaderFilters.filterLines);
            lines = extractedShaderFilters.lines;
            lines = _a.joinIndentedLines(lines);
            let inEvalBlock = false;
            let evalBlockContent = "";
            let tickActions = [];
            let blockRawParamsStack = [];
            let ifStack = [];
            const currentIfConditions = () => ifStack.map(f => f.negate ? `!(${f.condition})` : `(${f.condition})`);
            let inUniforms = false;
            let uniformsPrograms = [];
            for (let i = 0; i < lines.length; i++) {
                const rawLine = lines[i];
                const line = rawLine.trim();
                if (!line)
                    continue;
                const currentBlock = _a.ctx.blockName.at(-1);
                if (line.startsWith("<<")) {
                    inEvalBlock = true;
                    evalBlockContent = "";
                    continue;
                }
                if (line.endsWith(">>") && inEvalBlock) {
                    inEvalBlock = false;
                    const content = evalBlockContent.trim();
                    _a.executeEvalBlock(content);
                    continue;
                }
                if (inEvalBlock) {
                    evalBlockContent += rawLine + "\n";
                    continue;
                }
                const uniMatch = line.match(/^uniforms(?:\s+(.+?))?\s*\{$/);
                if (uniMatch) {
                    inUniforms = true;
                    const programNames = uniMatch[1]
                        ? uniMatch[1].split(",").map(s => s.trim()).filter(Boolean)
                        : [];
                    uniformsPrograms = programNames.length
                        ? programNames.map(n => _a.ctx.vars.get(n)).filter(Boolean)
                        : [_a.ctx.lastUsedProgram];
                    continue;
                }
                if (line === "}" && inUniforms) {
                    inUniforms = false;
                    uniformsPrograms = [];
                    continue;
                }
                if (inUniforms) {
                    const m = line.match(/^(\w+)\s*=\s*(.+?)([iuf]?)$/);
                    if (!m)
                        continue;
                    let [, name, rawValue, suffix] = m;
                    const value = _a.parseValue(rawValue);
                    suffix || (suffix = "f");
                    for (const uniformsProgram of uniformsPrograms) {
                        if (!uniformsProgram)
                            continue;
                        (_b = uniformsProgram.use) === null || _b === void 0 ? void 0 : _b.call(uniformsProgram);
                        if (Array.isArray(value)) {
                            uniformsProgram.uVec(name, value.length, value, suffix === "f", suffix === "u")
                                .set(value);
                        }
                        else {
                            uniformsProgram.uNum(name, suffix === "f", suffix === "u").set(value);
                        }
                    }
                    continue;
                }
                const ifMatch = line.match(/^if\s*\((.+)\)\s*\{$/);
                if (ifMatch) {
                    ifStack.push({ condition: ifMatch[1] });
                    continue;
                }
                const elseIfMatch = line.match(/^else\s+if\s*\((.+)\)\s*\{$/);
                if (elseIfMatch) {
                    ifStack.pop();
                    ifStack.push({ condition: elseIfMatch[1] });
                    continue;
                }
                const elseMatch = line.match(/^(?:\}\s*)?else\s*\{$/);
                if (elseMatch) {
                    const last = ifStack.pop();
                    if (last) {
                        ifStack.push({ condition: last.condition, negate: true });
                    }
                    continue;
                }
                const blockHeader = _a.parseBlockHeader(line);
                if (blockHeader) {
                    const isAsync = blockHeader.isAsync;
                    const blockName = blockHeader.name;
                    const rawParams = blockHeader.rawParams;
                    _a.ctx.blockName.push(blockName);
                    blockRawParamsStack.push(rawParams);
                    _a.ctx.isBlockAsync = isAsync;
                    if (blockName === "OnKey" || blockName === "OnKeyPress" || blockName === "OnKeyRelease") {
                        _a.ctx.blockParams = null;
                    }
                    else {
                        _a.ctx.blockParams = _a.parseBlockParams(rawParams);
                    }
                    ifStack = [];
                    tickActions = [];
                    continue;
                }
                if (line === "}" && currentBlock) {
                    if (ifStack.length > 0) {
                        ifStack.pop();
                        continue;
                    }
                    const closed = _a.ctx.blockName.pop();
                    const closedRawParams = blockRawParamsStack.pop();
                    if (closed === "tick" || closed === "draw") {
                        const captured = [...tickActions];
                        let time = 0;
                        const executeActions = (dt) => __awaiter(this, void 0, void 0, function* () {
                            if (closed === "tick") {
                                time += dt;
                                _a.ctx.vars.set("u_time", time);
                            }
                            _a.ctx.vars.set("dt", dt);
                            if (_a.ctx.isBlockAsync) {
                                for (const a of captured)
                                    yield a();
                            }
                            else {
                                for (const a of captured)
                                    a();
                            }
                        });
                        _a.gctx.addFunc((dt) => __awaiter(this, void 0, void 0, function* () {
                            yield executeActions(dt);
                        }));
                    }
                    if (closed === "OnKey" || closed === "OnKeyPress" || closed === "OnKeyRelease") {
                        const actions = [...tickActions];
                        const key = closedRawParams ? _a.parseValue(closedRawParams.trim()) : "";
                        const runActions = () => __awaiter(this, void 0, void 0, function* () {
                            if (_a.ctx.isBlockAsync) {
                                for (const a of actions)
                                    yield a();
                            }
                            else {
                                actions.forEach(a => a());
                            }
                        });
                        if (closed === "OnKeyRelease") {
                            (_c = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _c === void 0 ? void 0 : _c.call(window, "keyup", (e) => {
                                if ((((e === null || e === void 0 ? void 0 : e.key) || "") + "").toLowerCase() === ((key || "") + "").toLowerCase()) {
                                    void runActions();
                                }
                            });
                        }
                        else if (closed === "OnKeyPress") {
                            (_e = (_d = _a.gctx.KeyManager) === null || _d === void 0 ? void 0 : _d.OnPress) === null || _e === void 0 ? void 0 : _e.call(_d, key, (e) => {
                                if (e === null || e === void 0 ? void 0 : e.repeat)
                                    return;
                                void runActions();
                            });
                        }
                        else {
                            (_g = (_f = _a.gctx.KeyManager) === null || _f === void 0 ? void 0 : _f.OnKey) === null || _g === void 0 ? void 0 : _g.call(_f, key, (e) => {
                                if (e === null || e === void 0 ? void 0 : e.repeat)
                                    return;
                                void runActions();
                            });
                        }
                        _a.ctx.isBlockAsync = false;
                        _a.ctx.blockParams = null;
                        continue;
                    }
                    if (closed !== "tick" && closed !== "draw") {
                        const actions = [...tickActions];
                        const params = _a.ctx.blockParams;
                        _a.gctx.addFunc((dt) => __awaiter(this, void 0, void 0, function* () {
                            if (!params) {
                                if (_a.ctx.isBlockAsync) {
                                    for (const a of actions)
                                        yield a();
                                }
                                else {
                                    actions.forEach(a => a());
                                }
                                return;
                            }
                            const recurse = (idx) => __awaiter(this, void 0, void 0, function* () {
                                if (idx === params.length) {
                                    if (_a.ctx.isBlockAsync) {
                                        for (const a of actions)
                                            yield a();
                                    }
                                    else {
                                        actions.forEach(a => a());
                                    }
                                    return;
                                }
                                const p = params[idx];
                                if (p.type === "range") {
                                    const start = _a.parseValue(p.start);
                                    const end = _a.parseValue(p.end);
                                    for (let v = start; v <= end; v++) {
                                        _a.ctx.vars.set(p.name, v);
                                        _a.ctx.isBlockAsync ? yield recurse(idx + 1) : recurse(idx + 1);
                                    }
                                }
                                if (p.type === "list") {
                                    const list = _a.parseValue(p.value);
                                    if (!Array.isArray(list))
                                        return;
                                    for (const v of list) {
                                        _a.ctx.vars.set(p.name, v);
                                        _a.ctx.isBlockAsync ? yield recurse(idx + 1) : recurse(idx + 1);
                                    }
                                }
                            });
                            yield recurse(0);
                        }));
                        _a.ctx.isBlockAsync = false;
                        _a.ctx.blockParams = null;
                    }
                    continue;
                }
                if (currentBlock) {
                    const action = yield _a.compileJsBlock(rawLine.trimStart(), currentIfConditions());
                    if (action)
                        tickActions.push(action);
                    continue;
                }
                if (yield _a.parseObjectDef(line))
                    continue;
                if (_a.parseFncCall(line))
                    continue;
            }
        });
    }
    static prepareAction(line) {
        if (line.includes('.') && /^([a-z_]\w*)\./.test(line)) {
            return _a.prepareChainAction(line);
        }
        const simpleMatch = line.match(/^([a-z_]\w*)\s+(.*)$/);
        if (simpleMatch) {
            const cmdName = simpleMatch[1];
            const paramsString = simpleMatch[2];
            const reg = _a.ObjectRegistry[cmdName] || _a.FunctionRegistry[cmdName];
            if (reg) {
                return () => __awaiter(this, void 0, void 0, function* () {
                    var _b, _c;
                    const params = new Map();
                    const tokenRegex = /"([^"]*)"|'([^']*)'|([^\s'"]+)/g;
                    let tokenMatch;
                    let index = 0;
                    let matchIndex = 0;
                    while ((tokenMatch = tokenRegex.exec(paramsString)) !== null) {
                        const token = (_c = (_b = tokenMatch[1]) !== null && _b !== void 0 ? _b : tokenMatch[2]) !== null && _c !== void 0 ? _c : tokenMatch[3];
                        const raw = tokenMatch[0];
                        const paramMatch = raw.match(/^([a-zA-Z_]\w*)=([\s\S]+)$/);
                        if (paramMatch) {
                            const key = paramMatch[1];
                            const valRaw = paramMatch[2].replace(/^["']|["']$/g, "");
                            const val = _a.parseValue(valRaw);
                            params.set(key, val);
                            params.set("match" + matchIndex++, key);
                        }
                        else {
                            const val = _a.parseValue(token);
                            params.set(index++, val);
                        }
                    }
                    yield reg(params, _a.gctx.gl);
                });
            }
        }
        return null;
    }
    static createSimpleAction(cmd, args) {
        return () => __awaiter(this, void 0, void 0, function* () {
            const params = new Map();
            args.forEach((arg, idx) => params.set(idx, _a.parseValue(arg)));
            if (_a.ObjectRegistry[cmd]) {
                yield _a.ObjectRegistry[cmd](params, _a.gctx.gl);
            }
            else if (_a.FunctionRegistry[cmd]) {
                yield _a.FunctionRegistry[cmd](params, _a.gctx.gl);
            }
        });
    }
    static createCallAction(line) {
        const frozenLine = line;
        return () => __awaiter(this, void 0, void 0, function* () {
            _a.parseFncCall(frozenLine);
        });
    }
    static chooseActionForLine(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = code.trim().replace(/;$/, "");
            if (yield _a.parseObjectDef(line)) {
                return null;
            }
            const firstWordMatch = line.match(/^([a-zA-Z_]\w*)/);
            const firstWord = firstWordMatch === null || firstWordMatch === void 0 ? void 0 : firstWordMatch[1];
            if (firstWord &&
                (_a.ObjectRegistry[firstWord] ||
                    _a.FunctionRegistry[firstWord])) {
                return _a.prepareAction(line);
            }
            if (/^[a-zA-Z_]\w*\./.test(line)) {
                const chain = _a.prepareChainAction(line);
                if (chain)
                    return chain;
            }
            return _a.createCallAction(line);
        });
    }
    static compileJsBlock(code, ifConditions = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = yield _a.chooseActionForLine(code);
            const conditionFn = new Function('gctx', 'vars', 'thiscontext', `
            with(thiscontext) {
                with(gctx){
                    with(vars) {
                        return ${ifConditions.length
                ? ifConditions.map(c => `(${c})`).join("&&")
                : "true"};
                    }
                }
            }
            `);
            return () => __awaiter(this, void 0, void 0, function* () {
                let ok = false;
                try {
                    ok = conditionFn(_a.gctx, Object.fromEntries(_a.ctx.vars), _a.ctx.thiscontext || {});
                }
                catch (e) {
                    console.error("[CompileJS] condición inválida", ifConditions, e);
                    return;
                }
                if (!ok)
                    return;
                if (action)
                    yield action();
            });
        });
    }
    static executeEvalBlock(code) {
        const scope = Object.assign(Object.assign(Object.assign(Object.assign({}, _a.ctx.thiscontext), _a.gctx), Object.fromEntries(_a.ctx.vars)), { Math });
        try {
            new Function('gctx', 'scope', 'thiscontext', `with(gctx){ with(scope){ with(thiscontext){ ${code} } } }`)(_a.gctx, scope, _a.ctx.thiscontext || {});
        }
        catch (e) {
            console.error("Error en eval inmediato:", e);
        }
    }
    static get ctx() { return _a.context; }
    static get gctx() { return _a.GlobalContext; }
    static parseValue(valueString) {
        valueString = (valueString + "").trimStart();
        if (valueString.startsWith('[') && valueString.endsWith(']')) {
            valueString = "{" + valueString + "}";
        }
        const parts = [];
        let current = "";
        let depthBraces = 0;
        for (let i = 0; i < valueString.length; i++) {
            const ch = valueString[i];
            const prev = valueString[i - 1];
            if (ch === "{")
                depthBraces++;
            if (ch === "}")
                depthBraces--;
            const isSplitX = ch === "x" &&
                depthBraces === 0 &&
                (/[0-9]/.test(prev) || prev === "}");
            if (isSplitX) {
                parts.push(current.trim());
                current = "";
                continue;
            }
            current += ch;
        }
        if (current.trim() !== "") {
            parts.push(current.trim());
        }
        if (parts.length >= 2) {
            const allValid = parts.every(p => !isNaN(Number(p)) ||
                (p.startsWith("{") && p.endsWith("}")));
            if (allValid) {
                const res = parts.map(p => _a.parseValue(p));
                return res;
            }
        }
        if (valueString.startsWith('{') && valueString.endsWith('}')) {
            const expression = valueString.slice(1, -1);
            try {
                let scope = Object.assign(Object.assign(Object.assign(Object.assign({}, _a.ctx.thiscontext), _a.gctx), Object.fromEntries(_a.ctx.vars)), { Math });
                const fn = new Function("scope", `
                    with(scope) {
                        return ${expression};
                    }
                `);
                const res = fn(scope);
                return res;
            }
            catch (e) {
                return undefined;
            }
        }
        if (valueString.startsWith('vec3(') && valueString.endsWith(')')) {
            const inner = valueString.slice(5, -1).trim();
            const components = inner
                .split(',')
                .map(c => c.trim())
                .filter(Boolean)
                .map(c => _a.parseValue(c));
            let x, y, z;
            if (components.length === 1) {
                x = y = z = Number(components[0]);
            }
            else if (components.length === 2) {
                x = Number(components[0]);
                y = z = Number(components[1]);
            }
            else {
                x = Number(components[0]);
                y = Number(components[1]);
                z = Number(components[2]);
            }
            const v = new _a.gctx.Vector3D(x, y, z);
            return v;
        }
        if (valueString.startsWith('\"') && valueString.endsWith('\"')) {
            return valueString.slice(1, -1);
        }
        if (!isNaN(Number(valueString)) && valueString !== '') {
            return Number(valueString);
        }
        if (valueString === 'true')
            return true;
        if (valueString === 'false')
            return false;
        return valueString;
    }
    static parseObjectDef(line) {
        var _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const IDENT = /^[a-zA-Z_]\w*$/;
            let isEscapedFunction = false;
            const extractAliasesAndCore = (rawLine) => {
                let aliases = [];
                let core = rawLine.trim();
                const leftMatch = core.match(/^\s*([a-zA-Z_]\w*(?:\s*\|=\s*[a-zA-Z_]\w*)*)\s*=/);
                if (leftMatch) {
                    const leftAliases = leftMatch[1]
                        .split(/\|=/)
                        .map(s => s.trim());
                    aliases.push(...leftAliases);
                    core = core.slice(leftMatch[0].length).trim();
                }
                const rightMatch = core.match(/\|=\s*([^=]+)$/);
                if (rightMatch) {
                    const rightAliases = rightMatch[1]
                        .split(',')
                        .map(s => s.trim());
                    aliases.push(...rightAliases);
                    core = core.slice(0, rightMatch.index).trim();
                }
                aliases = [...new Set(aliases)];
                return { aliases, core };
            };
            const { aliases, core } = extractAliasesAndCore(line);
            if (!core) {
                return false;
            }
            let destructuredVars = null;
            const destructMatch = core.match(/^\[\s*([^\]]+)\s*\]\s*=/);
            let workingCore = core;
            if (destructMatch) {
                destructuredVars = destructMatch[1]
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => IDENT.test(v));
                workingCore = core.slice(destructMatch[0].length).trim();
            }
            const trimmed = workingCore.trim();
            if (!trimmed) {
                return false;
            }
            let identifier = "";
            let paramsString = "";
            let hasEqualsSign = false;
            if (trimmed.startsWith("$")) {
                const secondDollar = trimmed.indexOf("$", 1);
                isEscapedFunction = true;
                if (secondDollar > 1 && trimmed[secondDollar + 1] === "(") {
                    identifier = trimmed.slice(1, secondDollar);
                    paramsString = trimmed.slice(secondDollar + 1).trim();
                }
                else {
                    return false;
                }
            }
            else {
                let i = 0;
                while (i < trimmed.length &&
                    trimmed[i] !== " " &&
                    trimmed[i] !== "=") {
                    i++;
                }
                identifier = trimmed.slice(0, i);
                let rest = trimmed.slice(i).trim();
                if (rest.startsWith("=")) {
                    hasEqualsSign = true;
                    rest = rest.slice(1).trim();
                }
                paramsString = rest;
            }
            if (isEscapedFunction) {
                const funcName = identifier;
                const globalFunc = _a.gctx[funcName] || _a.ctx.thiscontext[funcName];
                if (typeof globalFunc !== "function") {
                    return false;
                }
                let argsRaw = paramsString.trim();
                if (argsRaw.startsWith("(") && argsRaw.endsWith(")")) {
                    argsRaw = argsRaw.slice(1, -1).trim();
                }
                const rawArgs = argsRaw.length === 0
                    ? []
                    : argsRaw.split(/,(?![^{]*})(?![^(]*\))/);
                const args = rawArgs.map(arg => {
                    const cleaned = arg.trim();
                    return this.parseValue(cleaned);
                });
                const result = yield globalFunc(...args);
                if (destructuredVars && Array.isArray(result)) {
                    destructuredVars.forEach((v, i) => {
                        this.ctx.vars.set(v, result[i]);
                    });
                }
                else {
                    for (const name of aliases) {
                        this.ctx.vars.set(name, result);
                    }
                }
                return true;
            }
            let classNameOrFunc = identifier;
            const params = new Map();
            let funcsToCallInObj = [];
            if (hasEqualsSign) {
                const funcNameMatch = paramsString.match(/^([A-Z_a-z]\w*)/);
                if (funcNameMatch) {
                    classNameOrFunc = funcNameMatch[1];
                    paramsString = paramsString.slice(classNameOrFunc.length).trim();
                }
            }
            params.set("aliases", aliases);
            params.set("firstAlias", aliases[0]);
            const tokenRegex = /"([^"]*)"|'([^']*)'|([^\s'"]+)/g;
            let tokenMatch;
            let index = 0;
            let matchindex = 0;
            while ((tokenMatch = tokenRegex.exec(paramsString)) !== null) {
                const token = (_c = (_b = tokenMatch[1]) !== null && _b !== void 0 ? _b : tokenMatch[2]) !== null && _c !== void 0 ? _c : tokenMatch[3];
                const raw = tokenMatch[0];
                if (raw.startsWith(".")) {
                    funcsToCallInObj.push(raw);
                    continue;
                }
                const paramMatch = raw.match(/^([a-zA-Z_]\w*)=(.+)$/);
                if (paramMatch) {
                    const val = this.parseValue(paramMatch[2].replace(/^["']|["']$/g, ""));
                    params.set(paramMatch[1], val);
                    params.set("match" + matchindex++, paramMatch[1]);
                }
                else {
                    const val = this.parseValue(token);
                    params.set(index++, val);
                }
            }
            const objReg = _a.ObjectRegistry[classNameOrFunc];
            const objFunc = _a.FunctionRegistry[classNameOrFunc];
            if (!objReg && !objFunc) {
                return false;
            }
            let result = yield (objReg
                ? objReg(params, _a.gctx.gl)
                : objFunc(params, _a.gctx.gl));
            const isClassInstanciation = /^[A-Z]/.test(identifier);
            let varName;
            if (hasEqualsSign) {
                varName = identifier;
                const funcNameMatch = paramsString.match(/^([A-Z_a-z]\w*)/);
                if (funcNameMatch) {
                    classNameOrFunc = funcNameMatch[1];
                    paramsString = paramsString.substring(classNameOrFunc.length).trim();
                    params.set("altName", varName);
                }
            }
            else if (isClassInstanciation) {
                varName = identifier.charAt(0).toLowerCase() + identifier.slice(1);
                if (this.ctx.vars.has(varName)) {
                    let counter = 1;
                    while (this.ctx.vars.has(varName + counter)) {
                        counter++;
                    }
                    varName = varName + counter;
                }
            }
            aliases.push(varName);
            for (const call of funcsToCallInObj) {
                const m = call.match(/^\.(\w+)\((.*)\)$/);
                if (m && typeof (result === null || result === void 0 ? void 0 : result[m[1]]) === "function") {
                    const args = m[2]
                        .split(/,(?![^{]*})/)
                        .map(a => this.parseValue(a.trim()));
                    result[m[1]](...args);
                }
            }
            if (destructuredVars && Array.isArray(result)) {
                destructuredVars.forEach((v, i) => {
                    this.ctx.vars.set(v, result[i]);
                });
            }
            else {
                for (const name of aliases) {
                    if (name === undefined)
                        return;
                    this.ctx.vars.set(name, result);
                }
            }
            return true;
        });
    }
    static executeChain(baseObj, chainParts) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentObj = baseObj;
            for (let part of chainParts) {
                if (currentObj == null)
                    return undefined;
                part = part.trim();
                const callMatch = part.match(/^(\w+)\s*\(([\s\S]*)\)$/);
                if (callMatch) {
                    const [, name, argsRaw] = callMatch;
                    const target = currentObj[name];
                    if (typeof target !== "function") {
                        console.error(`[Chain] ${name} no es función`, currentObj);
                        return undefined;
                    }
                    const args = [];
                    if (argsRaw.trim()) {
                        let currentArg = "";
                        let depth = 0;
                        for (let i = 0; i < argsRaw.length; i++) {
                            const char = argsRaw[i];
                            if (char === "(" || char === "[" || char === "{")
                                depth++;
                            if (char === ")" || char === "]" || char === "}")
                                depth--;
                            if (char === "," && depth === 0) {
                                args.push(_a.parseValue(currentArg.trim()));
                                currentArg = "";
                            }
                            else {
                                currentArg += char;
                            }
                        }
                        if (currentArg.trim()) {
                            args.push(_a.parseValue(currentArg.trim()));
                        }
                    }
                    const result = target.apply(currentObj, args);
                    currentObj = (result && typeof result.then === "function")
                        ? yield result
                        : result;
                }
                else {
                    if (!(part in currentObj)) {
                        return undefined;
                    }
                    currentObj = currentObj[part];
                }
            }
            return currentObj;
        });
    }
    static splitChain(methodsString) {
        return methodsString
            .split(/\.(?![^\[\(\{]*[\]\)\}])/)
            .map(p => p.trim())
            .filter(Boolean);
    }
    static parseFncCall(line) {
        const cleanLine = line.trim().replace(/;$/, "").replace("\n", "");
        const callRegex = /^([a-z_]\w*)(?:\.[a-zA-Z_]\w*(?:\s*\([\s\S]*?\))?)+$/i;
        const match = cleanLine.match(callRegex);
        if (!match)
            return false;
        const objectName = match[1];
        const baseObj = this.getVar(objectName);
        if (!baseObj)
            return false;
        const chainString = cleanLine.slice(objectName.length + 1);
        const chainParts = this.splitChain(chainString);
        void this.executeChain(baseObj, chainParts);
        return true;
    }
    static prepareChainAction(line) {
        const cleanLine = line.trim().replace(/;$/, "");
        const match = cleanLine.match(/^([a-z_]\w*)\.(.+)$/);
        if (!match)
            return null;
        const [, objectName, chainString] = match;
        const chainParts = this.splitChain(chainString);
        return () => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            const baseObj = (_c = (_b = _a.getVar(objectName)) !== null && _b !== void 0 ? _b : _a.gctx[objectName]) !== null && _c !== void 0 ? _c : _a.ctx.thiscontext[objectName];
            if (!baseObj) {
                console.warn(`[Chain] Objeto base no encontrado: ${objectName}`);
                return;
            }
            yield _a.executeChain(baseObj, chainParts);
        });
    }
}
_a = DetailedParser;
DetailedParser.GLSL_TYPE_HINTS = new Set([
    "float", "int", "uint", "vec2", "vec3", "vec4", "mat2", "mat3", "mat4"
]);
DetailedParser.RESERVED_CONTEXT_NAMES = new Set([
    "Math",
    "sin", "cos", "tan", "exp", "floor", "ceil", "min", "max", "round", "random", "abs", "pow", "sqrt", "atan2", "log", "PI",
    "true", "false", "null", "undefined",
    "float", "int", "uint", "vec2", "vec3", "vec4", "mat2", "mat3", "mat4"
]);
DetailedParser.shaderFilters = [];
DetailedParser.transpileShaderFilters = [];
DetailedParser.GlobalContext = {
    MeshRenderingProgram,
    MeshFillerProgram,
    Axis3DGroup,
    Camera3D,
    Vector3D,
    KeyManager,
    openFullscreen,
    addFunc,
    W, H, gl: null,
    keypress, mousepos, mouseclick,
    cam: undefined,
    WebProgram, WebGLMan, TexExamples,
};
DetailedParser.ObjectRegistry = {
    'Program': (params, gl) => {
        if (!WebGLMan.stWebGLMan.gl)
            WebGLMan.setGL(gl);
        let program = _a.gctx.WebGLMan.program(-1, params.get(0) || params.get("firstAlias"));
        _a.lastUsedProgram = program;
        return program;
    },
    'MeshProgram': (params, gl) => {
        let program = new _a.gctx.MeshRenderingProgram(gl, params.get('input'), params.get(0)[0], params.get(0)[1]).includeInWebManList();
        _a.lastUsedProgram = program;
        return program;
    },
    'MeshFillerProgram': (params, gl) => __awaiter(void 0, void 0, void 0, function* () {
        let program = new _a.gctx.MeshFillerProgram(gl, params.get(0)).includeInWebManList();
        if (params.get(1)) {
            program.generateProgram(params.get(1), _a.ctx.vars, _a.GlobalContext);
            yield program.loadProgram();
        }
        if (!_a.lastFillerProgram) {
            _a.lastFillerProgram = program;
        }
        return program;
    }),
    'Axis3DGroup': (params, gl) => new _a.gctx.Axis3DGroup(gl, params.get('axisLength'), params.get('drawArrows'), params.get('heights'), params.get('radii'), params.get('planes')).includeInWebManList(),
    'Camera3D': (params, gl) => {
        let cam = new _a.gctx.Camera3D(params.get('pos'), params.get("fov"), params.get("aspectRatio") || params.get("ratio"), params.get("near"), params.get("far"), params.get("walkspeed") || params.get("speed"));
        if (!_a.gctx.cam) {
            _a.gctx.cam = cam;
        }
        return cam;
    }
};
DetailedParser.prepareMathFunction = (callbackString) => {
    const contextVarSet = new Set();
    let bodyPrepared = (callbackString || "").replace(/{([^{}]+)}/g, (_, rawContent) => {
        let expr = (rawContent || "").trim();
        const lastComma = expr.lastIndexOf(",");
        if (lastComma !== -1) {
            const maybeType = expr.substring(lastComma + 1).trim();
            if (_a.GLSL_TYPE_HINTS.has(maybeType)) {
                expr = expr.substring(0, lastComma).trim();
            }
        }
        for (const id of _a.extractRootIdentifiersFromExpr(expr)) {
            if (!_a.RESERVED_CONTEXT_NAMES.has(id))
                contextVarSet.add(id);
        }
        return `(${expr})`;
    });
    const arrowMatch = bodyPrepared.match(/^(?:\(([^)]*)\)|([^=\s]+))\s*=>\s*([\s\S]*)$/);
    let userArgs = ['x', 'y'], body = bodyPrepared;
    if (arrowMatch) {
        const argsStr = arrowMatch[1] || arrowMatch[2] || "";
        userArgs = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
        body = arrowMatch[3].trim();
        if (body.startsWith('{') && body.endsWith('}')) {
            body = body.substring(1, body.length - 1).trim();
        }
    }
    function replacePowers(str) {
        while (str.indexOf('**') !== -1) {
            let index = str.indexOf('**');
            let left = index - 1, base = "", pCount = 0;
            if (str[left] === ')') {
                let j = left;
                for (; j >= 0; j--) {
                    if (str[j] === ')')
                        pCount++;
                    if (str[j] === '(')
                        pCount--;
                    if (pCount === 0)
                        break;
                }
                base = str.substring(j, left + 1);
            }
            else {
                let match = str.substring(0, index).match(/([\w\.\$\?]+)$/);
                base = match ? match[0] : "";
            }
            let right = index + 2, exponent = "", epCount = 0;
            if (str[right] === '(') {
                let j = right;
                for (; j < str.length; j++) {
                    if (str[j] === '(')
                        epCount++;
                    if (str[j] === ')')
                        epCount--;
                    if (epCount === 0)
                        break;
                }
                exponent = str.substring(right, j + 1);
            }
            else {
                let match = str.substring(right).match(/^([\w\.\$\?]+)/);
                exponent = match ? match[0] : "";
            }
            str = str.replace(base + "**" + exponent, `Math.pow(${base},${exponent})`);
        }
        return str;
    }
    let cleanBody = replacePowers(body);
    cleanBody = cleanBody.replace(/(?<!\.)\b(sin|cos|tan|exp|floor|ceil|min|max|round|random|abs|pow|sqrt|atan2|log|PI)\b/g, 'Math.$1');
    try {
        const contextVars = [...contextVarSet].filter(v => !userArgs.includes(v));
        const finalArgs = [...userArgs, ...contextVars];
        const hasLogic = cleanBody.includes('return') || cleanBody.includes('if') || cleanBody.includes(';');
        const finalBody = hasLogic ? cleanBody : `return ${cleanBody}`;
        const compiledFunc = new Function(...finalArgs, finalBody);
        return (...callArgs) => {
            const currentContextValues = contextVars.map(varName => {
                var _b, _c, _d;
                return (_c = (_b = _a.getVar(varName)) !== null && _b !== void 0 ? _b : _a.gctx[varName]) !== null && _c !== void 0 ? _c : (_d = _a.ctx.thiscontext) === null || _d === void 0 ? void 0 : _d[varName];
            });
            return compiledFunc(...callArgs, ...currentContextValues);
        };
    }
    catch (e) {
        throw new Error(`Error sintáctico en función matemática: ${e.message} -> ${cleanBody}`);
    }
};
DetailedParser.FunctionRegistry = Object.assign(Object.assign({ 'createIdealMesh': (params, gl) => {
        let allParts = [];
        let k = 1;
        while (params.has(k)) {
            allParts.push(params.get(k));
            k++;
        }
        let callbackString = allParts.join(' ').trim().replace(/;$/, "");
        try {
            const func = _a.prepareMathFunction(callbackString);
            if (!_a.lastUsedProgram)
                return;
            let texture = _a.lastUsedProgram.createIdealTexture(params.get(0), func);
            const texID = params.get(0).toString().match(/\d+/);
            texture.lastPreparedFunc = callbackString;
            _a.ctx.vars.set("texture" + (texID ? texID : ""), texture);
            _a.ctx.vars.get("texture" + (texID ? texID : ""))
                .func = func;
            return texture;
        }
        catch (e) {
            console.error(e.message);
        }
    }, 'fillMeshTexture': (params, gl) => {
        const targetTexture = _a.getVar(params.get(0));
        if (!targetTexture) {
            console.error(`fillMeshTexture: No se encontró la variable ${params.get(0)}`);
            return;
        }
        const texID = targetTexture.unit;
        let allParts = [];
        let k = 1;
        while (params.has(k)) {
            allParts.push(params.get(k));
            k++;
        }
        let callbackString = allParts.join(' ').trim().replace(/;$/, "");
        if (targetTexture.lastPreparedFunc != callbackString) {
            const func = _a.prepareMathFunction(callbackString);
            targetTexture.func = func;
            targetTexture.lastPreparedFunc = callbackString;
        }
        try {
            let func = _a.ctx.vars.get("texture" + (texID ? texID : ""))
                .func;
            if (!func)
                func = _a.prepareMathFunction(callbackString);
            if (!_a.lastUsedProgram)
                return;
            _a.lastUsedProgram.fillMeshTexture(targetTexture, func);
        }
        catch (e) {
            console.error(e.message);
        }
    }, 'draw': (params, gl) => {
        const obj = _a.getVar(params.get(0));
        if (obj && _a.getVar("camera3D")) {
            _a.lastUsedProgram.use();
            _a.getVar("camera3D").calculateMatrices();
            _a.lastUsedProgram.draw(0, 0, params.get(1), params.get(2), params.get(3));
        }
    }, 'viewport': (params, gl) => {
        var _b;
        let program = _a.lastUsedProgram;
        let viewPort;
        let p0txt = params.get(0);
        if (!p0txt.startsWith("{")) {
            p0txt = "{" + p0txt + "}";
        }
        let p0 = _a.parseValue(p0txt);
        let p1 = params.get(1);
        if ((_b = p0 === null || p0 === void 0 ? void 0 : p0.isWebProgram) === null || _b === void 0 ? void 0 : _b.call(p0)) {
            program = p0;
            Array.isArray(p1);
            viewPort = p1;
        }
        else if (Array.isArray(p0)) {
            viewPort = params.get(0);
        }
        if (!viewPort)
            return;
        program.use();
        program.setViewport(...viewPort);
    }, 'depthTest': (params, gl) => {
        if (_a.lastUsedProgram) {
            _a.lastUsedProgram.isDepthTest = params.get(0);
        }
    }, 'start': (params, gl) => {
        start();
    }, 'startAsync': (params, gl) => __awaiter(void 0, void 0, void 0, function* () {
        yield startAsync();
    }), 'log': (params, gl) => {
    }, 'let': (params, gl) => {
        let a = params.get("match0");
        let b = params.get(params.get("match0"));
        if (b === undefined) {
            _a.ctx.vars.set(a, null);
            return;
        }
        _a.ctx.vars.set(a.trim(), b);
        return;
    }, 'lduse': (params, gl) => __awaiter(void 0, void 0, void 0, function* () {
        const obj = _a.getVar(params.get(0));
        if (obj && typeof obj.use === 'function' && typeof obj.loadProgram === 'function') {
            yield _a.loadProgramWithShaderFilters(obj, gl);
            obj.use();
            _a.lastUsedProgram = obj;
            return obj;
        }
    }), 'use': (params, gl) => __awaiter(void 0, void 0, void 0, function* () {
        const obj = _a.getVar(params.get(0));
        if (obj && typeof obj.use === 'function') {
            obj.use();
            _a.lastUsedProgram = obj;
            return obj;
        }
    }) }, ['uMat4', 'uMat3', 'uMat2', 'uVec', 'uNum', 'uFloat', 'uInt'].reduce((acc, fnName) => {
    acc[fnName] = (params, gl) => {
        var _b, _c, _d, _e, _f;
        const program = _a.lastUsedProgram;
        if (!program)
            return;
        const name = params.get(0);
        let args = [name];
        if (fnName === 'uVec') {
            args = [name, (_b = params.get("dim")) !== null && _b !== void 0 ? _b : params.get("dimension"), (_c = params.get("isFloat")) !== null && _c !== void 0 ? _c : true, (_d = params.get("isUnsignedInt")) !== null && _d !== void 0 ? _d : false];
        }
        else if (fnName === 'uNum') {
            args = [name, (_e = params.get("isFloat")) !== null && _e !== void 0 ? _e : true, (_f = params.get("isUnsignedInt")) !== null && _f !== void 0 ? _f : false];
        }
        const uniformObj = program[fnName](...args);
        _a.ctx.vars.set(`u_${name}`, uniformObj);
        const potentialValueIdx = args.length;
        if (params.has(2)) {
            uniformObj.set(params.get(potentialValueIdx));
        }
        return uniformObj;
    };
    return acc;
}, {})), { 'cFrameBuffer': (params, gl) => {
        var _b;
        return (_b = _a.lastUsedProgram) === null || _b === void 0 ? void 0 : _b.cFrameBuffer();
    }, 'unbindFrameBuffer': (params, gl) => {
        var _b;
        return (_b = _a.lastUsedProgram) === null || _b === void 0 ? void 0 : _b.unbindFrameBuffer();
    }, 'unbindFBO': (params, gl) => {
        var _b;
        return (_b = _a.lastUsedProgram) === null || _b === void 0 ? void 0 : _b.unbindFBO();
    }, 'drawArrays': (params, gl) => {
        var _b, _c, _d, _e, _f, _g, _h, _j;
        const program = _a.lastUsedProgram;
        if (!program)
            return;
        const modeStr = params.get(0) || "TRIANGLES";
        const mode = gl[modeStr.toUpperCase()] || gl.TRIANGLES;
        const vaoOff = (_c = (_b = params.get('off')) !== null && _b !== void 0 ? _b : params.get(1)) !== null && _c !== void 0 ? _c : 0;
        const vertexCount = (_f = (_e = (_d = params.get('vCount')) !== null && _d !== void 0 ? _d : params.get('length')) !== null && _e !== void 0 ? _e : params.get('vertexCount')) !== null && _f !== void 0 ? _f : params.get(2);
        const instanceCount = (_j = (_h = (_g = params.get('instances')) !== null && _g !== void 0 ? _g : params.get('instanceCount')) !== null && _h !== void 0 ? _h : params.get(3)) !== null && _j !== void 0 ? _j : 1;
        return program.drawArrays(mode, vaoOff, vertexCount, instanceCount);
    }, 'drawElements': (params, gl) => {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const program = _a.lastUsedProgram;
        if (!program)
            return;
        const modeStr = params.get(0) || "TRIANGLES";
        const mode = gl[modeStr.toUpperCase()] || gl.TRIANGLES;
        const elementCount = (_d = (_c = (_b = params.get('elCount')) !== null && _b !== void 0 ? _b : params.get('elementCount')) !== null && _c !== void 0 ? _c : params.get(1)) !== null && _d !== void 0 ? _d : ((_e = program.VAO) === null || _e === void 0 ? void 0 : _e.eboLength);
        const rawType = (_g = (_f = params.get('type')) !== null && _f !== void 0 ? _f : params.get(2)) !== null && _g !== void 0 ? _g : "US";
        const typeMap = { "UB": "UNSIGNED_BYTE", "US": "UNSIGNED_SHORT", "UI": "UNSIGNED_INT" };
        const type = typeMap[rawType] || rawType || "UNSIGNED_SHORT";
        const eboOff = (_k = (_j = (_h = params.get('off')) !== null && _h !== void 0 ? _h : params.get('eboOff')) !== null && _j !== void 0 ? _j : params.get(3)) !== null && _k !== void 0 ? _k : 0;
        const instanceCount = (_o = (_m = (_l = params.get('instances')) !== null && _l !== void 0 ? _l : params.get('instanceCount')) !== null && _m !== void 0 ? _m : params.get(4)) !== null && _o !== void 0 ? _o : 0;
        return program.drawElements(mode, elementCount, type, eboOff, instanceCount);
    }, 'texture2DArray': (params, gl) => {
        var _b, _c;
        let sx = 0, sy = 0, sz = 0;
        let sizeParam = params.get(4);
        if (Array.isArray(sizeParam)) {
            if (sizeParam[0] !== undefined)
                sx = sizeParam[0];
            if (sizeParam[1] !== undefined)
                sy = sizeParam[1];
            if (sizeParam[2] !== undefined)
                sz = sizeParam[2];
        }
        let datatxt = params.get(1);
        if (!datatxt.startsWith("{")) {
            datatxt = "{" + datatxt + "}";
        }
        return (_c = (_b = _a.lastUsedProgram) === null || _b === void 0 ? void 0 : _b.texture2DArray) === null || _c === void 0 ? void 0 : _c.call(_b, { format: _a.gctx.TexExamples[params.get(0)],
            data: _a.parseValue(datatxt),
            name: params.get(2),
            texUnit: params.get(3),
            size: [sx, sy, sz]
        });
    } });
DetailedParser.currentBlockContent = [];
