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
    static parse(str, gl, thiscontext) {
        return __awaiter(this, void 0, void 0, function* () {
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
                .replaceAll(/\/\/.*$/gm, "")
                .replaceAll("\t", "    ");
            let lines = processedStr.split('\n');
            lines = _a.joinIndentedLines(lines);
            let inEvalBlock = false;
            let evalBlockContent = "";
            let tickActions = [];
            let ifStack = [];
            const currentIfConditions = () => ifStack.map(f => f.negate ? `!(${f.condition})` : `(${f.condition})`);
            let inUniforms = false;
            let uniformsProgram = null;
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
                const uniMatch = line.match(/^uniforms(?:\s+(\w+))?\s*\{$/);
                if (uniMatch) {
                    inUniforms = true;
                    uniformsProgram =
                        uniMatch[1]
                            ? _a.ctx.vars.get(uniMatch[1])
                            : _a.ctx.lastUsedProgram;
                    continue;
                }
                if (line === "}" && inUniforms) {
                    inUniforms = false;
                    uniformsProgram = null;
                    continue;
                }
                if (inUniforms) {
                    const m = line.match(/^(\w+)\s*=\s*(.+?)([iuf]?)$/);
                    if (!m)
                        continue;
                    let [, name, rawValue, suffix] = m;
                    const value = _a.parseValue(rawValue);
                    suffix || (suffix = "f");
                    if (Array.isArray(value)) {
                        uniformsProgram.uVec(name, value.length, value, suffix === "f", suffix === "u")
                            .set(value);
                    }
                    else {
                        uniformsProgram.uNum(name, suffix === "f", suffix === "u").set(value);
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
                const blockMatch = line.match(/^(?:(async)\s+)?(\w+)\s*(?:\((.*?)\))?\s*\{$/);
                if (blockMatch) {
                    const isAsync = blockMatch[1] === "async";
                    const blockName = blockMatch[2];
                    const rawParams = blockMatch[3];
                    _a.ctx.blockName.push(blockName);
                    _a.ctx.isBlockAsync = isAsync;
                    _a.ctx.blockParams = _a.parseBlockParams(rawParams);
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
                return () => {
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
                    reg(params, _a.gctx.gl);
                };
            }
        }
        return null;
    }
    static createSimpleAction(cmd, args) {
        return () => {
            const params = new Map();
            args.forEach((arg, idx) => params.set(idx, _a.parseValue(arg)));
            if (_a.ObjectRegistry[cmd]) {
                _a.ObjectRegistry[cmd](params, _a.gctx.gl);
            }
            else if (_a.FunctionRegistry[cmd]) {
                _a.FunctionRegistry[cmd](params, _a.gctx.gl);
            }
        };
    }
    static createCallAction(line) {
        const frozenLine = line;
        return () => {
            _a.parseFncCall(frozenLine);
        };
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
                currentObj = target.apply(currentObj, args);
            }
            else {
                if (!(part in currentObj)) {
                    return undefined;
                }
                currentObj = currentObj[part];
            }
        }
        return currentObj;
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
        this.executeChain(baseObj, chainParts);
        return true;
    }
    static prepareChainAction(line) {
        const cleanLine = line.trim().replace(/;$/, "");
        const match = cleanLine.match(/^([a-z_]\w*)\.(.+)$/);
        if (!match)
            return null;
        const [, objectName, chainString] = match;
        const chainParts = this.splitChain(chainString);
        return () => {
            var _b, _c;
            const baseObj = (_c = (_b = _a.getVar(objectName)) !== null && _b !== void 0 ? _b : _a.gctx[objectName]) !== null && _c !== void 0 ? _c : _a.ctx.thiscontext[objectName];
            if (!baseObj) {
                console.warn(`[Chain] Objeto base no encontrado: ${objectName}`);
                return;
            }
            _a.executeChain(baseObj, chainParts);
        };
    }
}
_a = DetailedParser;
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
    const contextVars = [...new Set(callbackString.match(/\{(\w+)\}/g) || [])]
        .map(v => v.replace(/[{}]/g, ""));
    let bodyPrepared = callbackString.replace(/{(\w+)}/g, '$1');
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
        const finalArgs = [...userArgs, ...contextVars];
        const hasLogic = cleanBody.includes('return') || cleanBody.includes('if') || cleanBody.includes(';');
        const finalBody = hasLogic ? cleanBody : `return ${cleanBody}`;
        const compiledFunc = new Function(...finalArgs, finalBody);
        return (...callArgs) => {
            const currentContextValues = contextVars.map(varName => _a.getVar(varName));
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
    }, 'startAsync': (params, gl) => {
        startAsync();
    }, 'log': (params, gl) => {
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
            yield obj.loadProgram();
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
