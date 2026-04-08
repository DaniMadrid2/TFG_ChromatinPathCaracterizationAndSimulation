var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103, _104, _105, _106, _107, _108, _109, _110, _111, _112, _113, _114, _115, _116, _117, _118, _119, _120, _121, _122, _123, _124, _125, _126, _127, _128, _129, _130, _131, _132, _133, _134, _135, _136, _137, _138, _139, _140, _141, _142, _143, _144, _145, _146, _147, _148, _149, _150, _151, _152, _153, _154, _155, _156, _157, _158, _159, _160, _161, _162, _163, _164, _165, _166, _167, _168, _169, _170, _171, _172, _173, _174, _175, _176, _177, _178, _179, _180, _181, _182, _183, _184, _185, _186, _187, _188, _189, _190, _191, _192, _193, _194, _195, _196, _197, _198, _199, _200, _201, _202, _203, _204, _205, _206, _207, _208, _209, _210, _211, _212, _213, _214, _215, _216, _217, _218, _219, _220, _221, _222, _223, _224, _225, _226, _227, _228, _229, _230, _231, _232, _233, _234, _235, _236, _237, _238, _239, _240, _241, _242, _243;
import { KeyManager } from "/Code/Game/Game.js";
import { addFunc, start } from "/Code/Start/start.js";
import { TexExamples, WebGLMan } from "/Code/WebGL/webglMan.js";
import { __mountGlobalBlocks } from "/Code/opengl/opengl.js";
var lastUsedProgram = null;
var lastFillerProgram = null;
void lastFillerProgram;
var __globalBlocks = [];
var __transpiledShaderFilterRules = [{ stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT"), replacement: () => (("const int TAU_F_TERMS = " + String(tauFTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT"), replacement: () => (("const int TAU_S_TERMS = " + String(tauSTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT"), replacement: () => (("const int TAU_TOTAL_TERMS = " + String(tauTotalTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_F_BASIS_BODY"), replacement: () => ((tauBasisBody(tauFDegrees) + " return 0.0;")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_S_BASIS_BODY"), replacement: () => ((tauBasisBody(tauSDegrees) + " return 0.0;")) }];
var __makeTranspiledShaderFilter = (stage, filePathRaw) => {
    return (source) => {
        let out = String(source !== null && source !== void 0 ? source : "");
        const filePath = String(filePathRaw !== null && filePathRaw !== void 0 ? filePathRaw : "");
        for (const rule of __transpiledShaderFilterRules) {
            if (!rule)
                continue;
            if (rule.stage !== "both" && rule.stage !== stage)
                continue;
            const filePattern = typeof rule.filePattern === "function" ? rule.filePattern() : rule.filePattern;
            if (filePattern !== undefined && filePattern !== null && filePattern !== "*") {
                const matchesFile = (filePattern instanceof RegExp)
                    ? ((filePattern.lastIndex = 0), filePattern.test(filePath))
                    : filePath.includes(String(filePattern));
                if (!matchesFile)
                    continue;
            }
            const searchPattern = typeof rule.searchPattern === "function" ? rule.searchPattern() : rule.searchPattern;
            const search = (searchPattern instanceof RegExp)
                ? new RegExp(searchPattern.source, searchPattern.flags)
                : searchPattern;
            const replacementValue = typeof rule.replacement === "function" ? rule.replacement() : rule.replacement;
            const replacement = String(replacementValue !== null && replacementValue !== void 0 ? replacementValue : "");
            out = (search instanceof RegExp)
                ? out.replace(search, replacement)
                : out.split(String(search !== null && search !== void 0 ? search : "")).join(replacement);
        }
        return out;
    };
};
const __runtimeLetCache = new Map();
const __coerceRuntimeLetValue = (raw) => {
    const text = String(raw !== null && raw !== void 0 ? raw : "").trim();
    if (!text)
        return undefined;
    if (/^(true|false)$/i.test(text))
        return text.toLowerCase() === "true";
    if (/^null$/i.test(text))
        return null;
    if (/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text))
        return Number(text);
    if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
        try {
            return JSON.parse(text);
        }
        catch (_a) { }
    }
    if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
        return text.slice(1, -1);
    }
    return text;
};
const __mergeRuntimeLetArray = (arr) => {
    const out = { __array: arr };
    if (arr.every(item => item && typeof item === "object" && !Array.isArray(item))) {
        for (const item of arr)
            Object.assign(out, item);
    }
    return out;
};
const __parseRuntimeLetText = (text) => {
    const out = {};
    const chunks = String(text !== null && text !== void 0 ? text : "").split(/[\r\n]+/).flatMap(line => line.split(","));
    for (const chunk of chunks) {
        const entry = chunk.trim();
        if (!entry)
            continue;
        const eq = entry.indexOf("=");
        if (eq < 0) {
            out[entry] = true;
            continue;
        }
        const key = entry.slice(0, eq).trim();
        const value = entry.slice(eq + 1).trim();
        if (key)
            out[key] = __coerceRuntimeLetValue(value);
    }
    return out;
};
const __loadRuntimeLetSource = (sourcePath) => __awaiter(void 0, void 0, void 0, function* () {
    const rawPath = String(sourcePath !== null && sourcePath !== void 0 ? sourcePath : "").trim();
    if (!rawPath)
        return {};
    const resolvedPath = new URL(rawPath, import.meta.url).toString();
    if (__runtimeLetCache.has(resolvedPath))
        return __runtimeLetCache.get(resolvedPath);
    const response = yield fetch(resolvedPath);
    if (!response.ok)
        throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");
    let parsed = {};
    if (/\.json(?:$|\?)/i.test(rawPath)) {
        const json = yield response.json();
        if (Array.isArray(json))
            parsed = __mergeRuntimeLetArray(json);
        else if (json && typeof json === "object")
            parsed = json;
        else
            parsed = { __array: json };
    }
    else {
        parsed = __parseRuntimeLetText(yield response.text());
    }
    __runtimeLetCache.set(resolvedPath, parsed);
    return parsed;
});
var tauSignalData = datosX1;
var tauMaxVeces = 100;
var tauMinVeces = 1;
var chromatinIndex = 1;
var nBins = 64;
var tauEStar = 1.0;
var dtSample = 1.0;
var recomputeTau = true;
var tauDebugFrames = 4;
var c2DrawLogFrames = 3;
var bestTau = 1;
var bestSubseq = 0;
var autoPickBest = true;
var useLSView = false;
var afpLrF = 0.04;
var afpLrS = 0.06;
var afpL1F = 0.0004;
var afpL1S = 0.0002;
var afpIters = 5;
var afpOptLrF = 0.02;
var afpOptLrS = 0.03;
var afpOptL1F = 0.0002;
var afpOptL1S = 0.0001;
var afpOptL2F = 0.0008;
var afpOptL2S = 0.0008;
var afpOptIters = 7;
var keepTopPercent = 20;
var useFPFilter = true;
var fpLogSpanMax = 42;
var modelKLSpanMax = 42;
var showFPStationary = true;
var showTauCurves = false;
var showRawKMOverlay = false;
var showLSFOverlay = false;
var showMSDOverlay = false;
var showMSDScoreMap = false;
var scoreWCost = 0.55;
var scoreWKL = 0.35;
var scoreWSpan = 0.10;
var scoreKLMax = 3.0;
var scoreMaxCut = 0.75;
var useScoreSelection = true;
var logTopModels = false;
var tauModelStamp = 0;
var tauMSDMaxLag = 64;
var tauMSDChunkBudgetMs = 8;
var tauBasisMode = "pca";
var tauPcaSecondaryMode = "perp90";
var tauFDegrees = [0, 1, 2, 3];
var tauSDegrees = [0];
var tauPolyExpr = (deg) => deg < 0 ? "0.0" : deg === 0 ? "1.0" : deg === 1 ? "x" : Array(deg).fill("x").join("*");
var tauFTerms = tauFDegrees.length;
var tauSTerms = tauSDegrees.length;
var tauTotalTerms = tauFTerms + tauSTerms;
var tauBasisBody = (degrees) => degrees.map((d, i) => "if(termIdx==" + i + ") return " + tauPolyExpr(d) + ";").join(" ");
if (tauTotalTerms > 8)
    throw new Error("tauTotalTerms debe ser <= 8 con el empaquetado actual (dos RGBA).");
var TauFloatTex = {
    format: TexExamples.RGBAFloat16,
    filter_min: "NEAREST",
    filter_mag: "NEAREST",
    wrap_S: "CLAMP",
    wrap_T: "CLAMP"
};
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var progTauMom = WebGLMan.program(-1, "tau/01_moments/1_tauMaxVeces");
lastUsedProgram = progTauMom;
var tauMom = progTauMom;
await tauMom.loadProgram(tauMom.vertPath, tauMom.fragPath, __makeTranspiledShaderFilter("vert", tauMom.vertPath), __makeTranspiledShaderFilter("frag", tauMom.fragPath));
await ((_a = tauMom.use) === null || _a === void 0 ? void 0 : _a.call(tauMom));
lastUsedProgram = tauMom;
tauMom.createVAO().bind();
var extC2 = gl.getExtension("EXT_color_buffer_float");
if (!extC2) {
    console.log("EXT_color_buffer_float no soportado en C2");
}
var xTex = tauMom.createTexture2D("datosX1", [NMuestras1, 1], TexExamples.RFloat, tauSignalData, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit10");
var yTex = tauMom.createTexture2D("datosY1", [NMuestras1, 1], TexExamples.RFloat, datosY1, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit11");
var tauMom1 = tauMom.createTexture2D("tauMom1", [nBins, tauMaxVeces * tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit14");
var tauMom2 = tauMom.createTexture2D("tauMom2", [nBins, tauMaxVeces * tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit15");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauXi = WebGLMan.program(-1, "tau/02_ls/1_tauXiLS");
await tauXi.loadProgram(tauXi.vertPath, tauXi.fragPath, __makeTranspiledShaderFilter("vert", tauXi.vertPath), __makeTranspiledShaderFilter("frag", tauXi.fragPath));
await ((_b = tauXi.use) === null || _b === void 0 ? void 0 : _b.call(tauXi));
lastUsedProgram = tauXi;
tauXi.createVAO().bind();
var tauXiF = tauXi.createTexture2D("tauXiF", [tauMaxVeces, tauMaxVeces], ((_c = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _c !== void 0 ? _c : TexExamples.RGBAFloat), null, [((_f = (_e = (_d = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _d !== void 0 ? _d : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _e !== void 0 ? _e : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _f !== void 0 ? _f : "NEAREST"), ((_j = (_h = (_g = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _g !== void 0 ? _g : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _h !== void 0 ? _h : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _j !== void 0 ? _j : "NEAREST"), ((_m = (_l = (_k = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _k !== void 0 ? _k : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _l !== void 0 ? _l : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _m !== void 0 ? _m : "CLAMP"), ((_q = (_p = (_o = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _o !== void 0 ? _o : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _p !== void 0 ? _p : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _q !== void 0 ? _q : "CLAMP")], "TexUnit12");
var tauXiS = tauXi.createTexture2D("tauXiS", [tauMaxVeces, tauMaxVeces], ((_r = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _r !== void 0 ? _r : TexExamples.RGBAFloat), null, [((_u = (_t = (_s = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _s !== void 0 ? _s : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _t !== void 0 ? _t : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _u !== void 0 ? _u : "NEAREST"), ((_x = (_w = (_v = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _v !== void 0 ? _v : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _w !== void 0 ? _w : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _x !== void 0 ? _x : "NEAREST"), ((_0 = (_z = (_y = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _y !== void 0 ? _y : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _z !== void 0 ? _z : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _0 !== void 0 ? _0 : "CLAMP"), ((_3 = (_2 = (_1 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _1 !== void 0 ? _1 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _2 !== void 0 ? _2 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _3 !== void 0 ? _3 : "CLAMP")], "TexUnit13");
var tauXiMeta = tauXi.createTexture2D("tauXiMeta", [tauMaxVeces, tauMaxVeces], ((_4 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _4 !== void 0 ? _4 : TexExamples.RGBAFloat), null, [((_7 = (_6 = (_5 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _5 !== void 0 ? _5 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _6 !== void 0 ? _6 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _7 !== void 0 ? _7 : "NEAREST"), ((_10 = (_9 = (_8 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _8 !== void 0 ? _8 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _9 !== void 0 ? _9 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _10 !== void 0 ? _10 : "NEAREST"), ((_13 = (_12 = (_11 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _11 !== void 0 ? _11 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _12 !== void 0 ? _12 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _13 !== void 0 ? _13 : "CLAMP"), ((_16 = (_15 = (_14 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _14 !== void 0 ? _14 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _15 !== void 0 ? _15 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _16 !== void 0 ? _16 : "CLAMP")], "TexUnit16");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauAFP = WebGLMan.program(-1, "tau/03_afp/1_tauAFP0");
await tauAFP.loadProgram(tauAFP.vertPath, tauAFP.fragPath, __makeTranspiledShaderFilter("vert", tauAFP.vertPath), __makeTranspiledShaderFilter("frag", tauAFP.fragPath));
await ((_17 = tauAFP.use) === null || _17 === void 0 ? void 0 : _17.call(tauAFP));
lastUsedProgram = tauAFP;
tauAFP.createVAO().bind();
var tauXiFOpt = tauAFP.createTexture2D("tauXiFOpt", [tauMaxVeces, tauMaxVeces], ((_18 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _18 !== void 0 ? _18 : TexExamples.RGBAFloat), null, [((_21 = (_20 = (_19 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _19 !== void 0 ? _19 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _20 !== void 0 ? _20 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _21 !== void 0 ? _21 : "NEAREST"), ((_24 = (_23 = (_22 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _22 !== void 0 ? _22 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _23 !== void 0 ? _23 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _24 !== void 0 ? _24 : "NEAREST"), ((_27 = (_26 = (_25 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _25 !== void 0 ? _25 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _26 !== void 0 ? _26 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _27 !== void 0 ? _27 : "CLAMP"), ((_30 = (_29 = (_28 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _28 !== void 0 ? _28 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _29 !== void 0 ? _29 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _30 !== void 0 ? _30 : "CLAMP")], "TexUnit18");
var tauXiSOpt = tauAFP.createTexture2D("tauXiSOpt", [tauMaxVeces, tauMaxVeces], ((_31 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _31 !== void 0 ? _31 : TexExamples.RGBAFloat), null, [((_34 = (_33 = (_32 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _32 !== void 0 ? _32 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _33 !== void 0 ? _33 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _34 !== void 0 ? _34 : "NEAREST"), ((_37 = (_36 = (_35 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _35 !== void 0 ? _35 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _36 !== void 0 ? _36 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _37 !== void 0 ? _37 : "NEAREST"), ((_40 = (_39 = (_38 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _38 !== void 0 ? _38 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _39 !== void 0 ? _39 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _40 !== void 0 ? _40 : "CLAMP"), ((_43 = (_42 = (_41 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _41 !== void 0 ? _41 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _42 !== void 0 ? _42 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _43 !== void 0 ? _43 : "CLAMP")], "TexUnit19");
var tauXiMetaOpt = tauAFP.createTexture2D("tauXiMetaOpt", [tauMaxVeces, tauMaxVeces], ((_44 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _44 !== void 0 ? _44 : TexExamples.RGBAFloat), null, [((_47 = (_46 = (_45 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _45 !== void 0 ? _45 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _46 !== void 0 ? _46 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _47 !== void 0 ? _47 : "NEAREST"), ((_50 = (_49 = (_48 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _48 !== void 0 ? _48 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _49 !== void 0 ? _49 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _50 !== void 0 ? _50 : "NEAREST"), ((_53 = (_52 = (_51 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _51 !== void 0 ? _51 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _52 !== void 0 ? _52 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _53 !== void 0 ? _53 : "CLAMP"), ((_56 = (_55 = (_54 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _54 !== void 0 ? _54 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _55 !== void 0 ? _55 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _56 !== void 0 ? _56 : "CLAMP")], "TexUnit20");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauAFPOpt = WebGLMan.program(-1, "tau/03_afp/2_tauAFPOpt");
await tauAFPOpt.loadProgram(tauAFPOpt.vertPath, tauAFPOpt.fragPath, __makeTranspiledShaderFilter("vert", tauAFPOpt.vertPath), __makeTranspiledShaderFilter("frag", tauAFPOpt.fragPath));
await ((_57 = tauAFPOpt.use) === null || _57 === void 0 ? void 0 : _57.call(tauAFPOpt));
lastUsedProgram = tauAFPOpt;
tauAFPOpt.createVAO().bind();
var tauXiFFinal = tauAFPOpt.createTexture2D("tauXiFFinal", [tauMaxVeces, tauMaxVeces], ((_58 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _58 !== void 0 ? _58 : TexExamples.RGBAFloat), null, [((_61 = (_60 = (_59 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _59 !== void 0 ? _59 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _60 !== void 0 ? _60 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _61 !== void 0 ? _61 : "NEAREST"), ((_64 = (_63 = (_62 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _62 !== void 0 ? _62 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _63 !== void 0 ? _63 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _64 !== void 0 ? _64 : "NEAREST"), ((_67 = (_66 = (_65 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _65 !== void 0 ? _65 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _66 !== void 0 ? _66 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _67 !== void 0 ? _67 : "CLAMP"), ((_70 = (_69 = (_68 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _68 !== void 0 ? _68 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _69 !== void 0 ? _69 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _70 !== void 0 ? _70 : "CLAMP")], "TexUnit25");
var tauXiSFinal = tauAFPOpt.createTexture2D("tauXiSFinal", [tauMaxVeces, tauMaxVeces], ((_71 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _71 !== void 0 ? _71 : TexExamples.RGBAFloat), null, [((_74 = (_73 = (_72 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _72 !== void 0 ? _72 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _73 !== void 0 ? _73 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _74 !== void 0 ? _74 : "NEAREST"), ((_77 = (_76 = (_75 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _75 !== void 0 ? _75 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _76 !== void 0 ? _76 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _77 !== void 0 ? _77 : "NEAREST"), ((_80 = (_79 = (_78 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _78 !== void 0 ? _78 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _79 !== void 0 ? _79 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _80 !== void 0 ? _80 : "CLAMP"), ((_83 = (_82 = (_81 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _81 !== void 0 ? _81 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _82 !== void 0 ? _82 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _83 !== void 0 ? _83 : "CLAMP")], "TexUnit26");
var tauXiMetaFinal = tauAFPOpt.createTexture2D("tauXiMetaFinal", [tauMaxVeces, tauMaxVeces], ((_84 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _84 !== void 0 ? _84 : TexExamples.RGBAFloat), null, [((_87 = (_86 = (_85 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _85 !== void 0 ? _85 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _86 !== void 0 ? _86 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _87 !== void 0 ? _87 : "NEAREST"), ((_90 = (_89 = (_88 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _88 !== void 0 ? _88 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _89 !== void 0 ? _89 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _90 !== void 0 ? _90 : "NEAREST"), ((_93 = (_92 = (_91 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _91 !== void 0 ? _91 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _92 !== void 0 ? _92 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _93 !== void 0 ? _93 : "CLAMP"), ((_96 = (_95 = (_94 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _94 !== void 0 ? _94 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _95 !== void 0 ? _95 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _96 !== void 0 ? _96 : "CLAMP")], "TexUnit27");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauStats = WebGLMan.program(-1, "tau/04_stats_mask/1_tauModelStats");
await tauStats.loadProgram(tauStats.vertPath, tauStats.fragPath, __makeTranspiledShaderFilter("vert", tauStats.vertPath), __makeTranspiledShaderFilter("frag", tauStats.fragPath));
await ((_97 = tauStats.use) === null || _97 === void 0 ? void 0 : _97.call(tauStats));
lastUsedProgram = tauStats;
tauStats.createVAO().bind();
var tauStatsTex = tauStats.createTexture2D("tauStats", [1, 1], ((_98 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _98 !== void 0 ? _98 : TexExamples.RGBAFloat), null, [((_101 = (_100 = (_99 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _99 !== void 0 ? _99 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _100 !== void 0 ? _100 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _101 !== void 0 ? _101 : "NEAREST"), ((_104 = (_103 = (_102 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _102 !== void 0 ? _102 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _103 !== void 0 ? _103 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _104 !== void 0 ? _104 : "NEAREST"), ((_107 = (_106 = (_105 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _105 !== void 0 ? _105 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _106 !== void 0 ? _106 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _107 !== void 0 ? _107 : "CLAMP"), ((_110 = (_109 = (_108 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _108 !== void 0 ? _108 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _109 !== void 0 ? _109 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _110 !== void 0 ? _110 : "CLAMP")], "TexUnit21");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauMask = WebGLMan.program(-1, "tau/04_stats_mask/2_tauModelMask");
await tauMask.loadProgram(tauMask.vertPath, tauMask.fragPath, __makeTranspiledShaderFilter("vert", tauMask.vertPath), __makeTranspiledShaderFilter("frag", tauMask.fragPath));
await ((_111 = tauMask.use) === null || _111 === void 0 ? void 0 : _111.call(tauMask));
lastUsedProgram = tauMask;
tauMask.createVAO().bind();
var tauMaskTex = tauMask.createTexture2D("tauMask", [tauMaxVeces, tauMaxVeces], ((_112 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _112 !== void 0 ? _112 : TexExamples.RGBAFloat), null, [((_115 = (_114 = (_113 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _113 !== void 0 ? _113 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _114 !== void 0 ? _114 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _115 !== void 0 ? _115 : "NEAREST"), ((_118 = (_117 = (_116 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _116 !== void 0 ? _116 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _117 !== void 0 ? _117 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _118 !== void 0 ? _118 : "NEAREST"), ((_121 = (_120 = (_119 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _119 !== void 0 ? _119 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _120 !== void 0 ? _120 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _121 !== void 0 ? _121 : "CLAMP"), ((_124 = (_123 = (_122 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _122 !== void 0 ? _122 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _123 !== void 0 ? _123 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _124 !== void 0 ? _124 : "CLAMP")], "TexUnit22");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauFP = WebGLMan.program(-1, "tau/05_filters/1_tauFPProxy");
await tauFP.loadProgram(tauFP.vertPath, tauFP.fragPath, __makeTranspiledShaderFilter("vert", tauFP.vertPath), __makeTranspiledShaderFilter("frag", tauFP.fragPath));
await ((_125 = tauFP.use) === null || _125 === void 0 ? void 0 : _125.call(tauFP));
lastUsedProgram = tauFP;
tauFP.createVAO().bind();
var tauFPTex = tauFP.createTexture2D("tauFP", [tauMaxVeces, tauMaxVeces], ((_126 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _126 !== void 0 ? _126 : TexExamples.RGBAFloat), null, [((_129 = (_128 = (_127 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _127 !== void 0 ? _127 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _128 !== void 0 ? _128 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _129 !== void 0 ? _129 : "NEAREST"), ((_132 = (_131 = (_130 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _130 !== void 0 ? _130 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _131 !== void 0 ? _131 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _132 !== void 0 ? _132 : "NEAREST"), ((_135 = (_134 = (_133 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _133 !== void 0 ? _133 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _134 !== void 0 ? _134 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _135 !== void 0 ? _135 : "CLAMP"), ((_138 = (_137 = (_136 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _136 !== void 0 ? _136 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _137 !== void 0 ? _137 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _138 !== void 0 ? _138 : "CLAMP")], "TexUnit23");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauKL = WebGLMan.program(-1, "tau/05_filters/2_tauModelKL");
await tauKL.loadProgram(tauKL.vertPath, tauKL.fragPath, __makeTranspiledShaderFilter("vert", tauKL.vertPath), __makeTranspiledShaderFilter("frag", tauKL.fragPath));
await ((_139 = tauKL.use) === null || _139 === void 0 ? void 0 : _139.call(tauKL));
lastUsedProgram = tauKL;
tauKL.createVAO().bind();
var tauKLTex = tauKL.createTexture2D("tauKL", [tauMaxVeces, tauMaxVeces], ((_140 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _140 !== void 0 ? _140 : TexExamples.RGBAFloat), null, [((_143 = (_142 = (_141 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _141 !== void 0 ? _141 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _142 !== void 0 ? _142 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _143 !== void 0 ? _143 : "NEAREST"), ((_146 = (_145 = (_144 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _144 !== void 0 ? _144 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _145 !== void 0 ? _145 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _146 !== void 0 ? _146 : "NEAREST"), ((_149 = (_148 = (_147 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _147 !== void 0 ? _147 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _148 !== void 0 ? _148 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _149 !== void 0 ? _149 : "CLAMP"), ((_152 = (_151 = (_150 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _150 !== void 0 ? _150 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _151 !== void 0 ? _151 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _152 !== void 0 ? _152 : "CLAMP")], "TexUnit28");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauScore = WebGLMan.program(-1, "tau/05_filters/3_tauModelScore");
await tauScore.loadProgram(tauScore.vertPath, tauScore.fragPath, __makeTranspiledShaderFilter("vert", tauScore.vertPath), __makeTranspiledShaderFilter("frag", tauScore.fragPath));
await ((_153 = tauScore.use) === null || _153 === void 0 ? void 0 : _153.call(tauScore));
lastUsedProgram = tauScore;
tauScore.createVAO().bind();
var tauScoreTex = tauScore.createTexture2D("tauScore", [tauMaxVeces, tauMaxVeces], ((_154 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _154 !== void 0 ? _154 : TexExamples.RGBAFloat), null, [((_157 = (_156 = (_155 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _155 !== void 0 ? _155 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _156 !== void 0 ? _156 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _157 !== void 0 ? _157 : "NEAREST"), ((_160 = (_159 = (_158 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _158 !== void 0 ? _158 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _159 !== void 0 ? _159 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _160 !== void 0 ? _160 : "NEAREST"), ((_163 = (_162 = (_161 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _161 !== void 0 ? _161 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _162 !== void 0 ? _162 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _163 !== void 0 ? _163 : "CLAMP"), ((_166 = (_165 = (_164 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _164 !== void 0 ? _164 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _165 !== void 0 ? _165 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _166 !== void 0 ? _166 : "CLAMP")], "TexUnit29");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauBest = WebGLMan.program(-1, "tau/06_select/1_tauBestModel");
await tauBest.loadProgram(tauBest.vertPath, tauBest.fragPath, __makeTranspiledShaderFilter("vert", tauBest.vertPath), __makeTranspiledShaderFilter("frag", tauBest.fragPath));
await ((_167 = tauBest.use) === null || _167 === void 0 ? void 0 : _167.call(tauBest));
lastUsedProgram = tauBest;
tauBest.createVAO().bind();
var tauBestTex = tauBest.createTexture2D("tauBest", [1, 1], ((_168 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _168 !== void 0 ? _168 : TexExamples.RGBAFloat), null, [((_171 = (_170 = (_169 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _169 !== void 0 ? _169 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _170 !== void 0 ? _170 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _171 !== void 0 ? _171 : "NEAREST"), ((_174 = (_173 = (_172 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _172 !== void 0 ? _172 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _173 !== void 0 ? _173 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _174 !== void 0 ? _174 : "NEAREST"), ((_177 = (_176 = (_175 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _175 !== void 0 ? _175 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _176 !== void 0 ? _176 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _177 !== void 0 ? _177 : "CLAMP"), ((_180 = (_179 = (_178 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _178 !== void 0 ? _178 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _179 !== void 0 ? _179 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _180 !== void 0 ? _180 : "CLAMP")], "TexUnit17");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauSindy = WebGLMan.program(-1, "tau/07_fields/1_tauSindyFields");
await tauSindy.loadProgram(tauSindy.vertPath, tauSindy.fragPath, __makeTranspiledShaderFilter("vert", tauSindy.vertPath), __makeTranspiledShaderFilter("frag", tauSindy.fragPath));
await ((_181 = tauSindy.use) === null || _181 === void 0 ? void 0 : _181.call(tauSindy));
lastUsedProgram = tauSindy;
tauSindy.createVAO().bind();
var tauSindyTex = tauSindy.createTexture2D("tauSindy", [nBins, 1], ((_182 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _182 !== void 0 ? _182 : TexExamples.RGBAFloat), null, [((_185 = (_184 = (_183 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _183 !== void 0 ? _183 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _184 !== void 0 ? _184 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _185 !== void 0 ? _185 : "NEAREST"), ((_188 = (_187 = (_186 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _186 !== void 0 ? _186 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _187 !== void 0 ? _187 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _188 !== void 0 ? _188 : "NEAREST"), ((_191 = (_190 = (_189 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _189 !== void 0 ? _189 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _190 !== void 0 ? _190 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _191 !== void 0 ? _191 : "CLAMP"), ((_194 = (_193 = (_192 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _192 !== void 0 ? _192 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _193 !== void 0 ? _193 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _194 !== void 0 ? _194 : "CLAMP")], "TexUnit30");
var tauSindyInitTex = tauSindy.createTexture2D("tauSindyInit", [nBins, 1], ((_195 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _195 !== void 0 ? _195 : TexExamples.RGBAFloat), null, [((_198 = (_197 = (_196 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _196 !== void 0 ? _196 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _197 !== void 0 ? _197 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _198 !== void 0 ? _198 : "NEAREST"), ((_201 = (_200 = (_199 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _199 !== void 0 ? _199 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _200 !== void 0 ? _200 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _201 !== void 0 ? _201 : "NEAREST"), ((_204 = (_203 = (_202 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _202 !== void 0 ? _202 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _203 !== void 0 ? _203 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _204 !== void 0 ? _204 : "CLAMP"), ((_207 = (_206 = (_205 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _205 !== void 0 ? _205 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _206 !== void 0 ? _206 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _207 !== void 0 ? _207 : "CLAMP")], "TexUnit31");
var tauSindyTau1RefTex = tauSindy.createTexture2D("tauSindyTau1Ref", [nBins, 1], ((_208 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _208 !== void 0 ? _208 : TexExamples.RGBAFloat), null, [((_211 = (_210 = (_209 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _209 !== void 0 ? _209 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _210 !== void 0 ? _210 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _211 !== void 0 ? _211 : "NEAREST"), ((_214 = (_213 = (_212 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _212 !== void 0 ? _212 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _213 !== void 0 ? _213 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _214 !== void 0 ? _214 : "NEAREST"), ((_217 = (_216 = (_215 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _215 !== void 0 ? _215 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _216 !== void 0 ? _216 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _217 !== void 0 ? _217 : "CLAMP"), ((_220 = (_219 = (_218 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _218 !== void 0 ? _218 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _219 !== void 0 ? _219 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _220 !== void 0 ? _220 : "CLAMP")], "TexUnit9");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var tauFPStat = WebGLMan.program(-1, "tau/07_fields/2_tauFPStationary");
await tauFPStat.loadProgram(tauFPStat.vertPath, tauFPStat.fragPath, __makeTranspiledShaderFilter("vert", tauFPStat.vertPath), __makeTranspiledShaderFilter("frag", tauFPStat.fragPath));
await ((_221 = tauFPStat.use) === null || _221 === void 0 ? void 0 : _221.call(tauFPStat));
lastUsedProgram = tauFPStat;
tauFPStat.createVAO().bind();
var tauFPStatTex = tauFPStat.createTexture2D("tauFPStat", [nBins, 1], ((_222 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.format) !== null && _222 !== void 0 ? _222 : TexExamples.RGBAFloat), null, [((_225 = (_224 = (_223 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_min) !== null && _223 !== void 0 ? _223 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _224 !== void 0 ? _224 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.minFilter) !== null && _225 !== void 0 ? _225 : "NEAREST"), ((_228 = (_227 = (_226 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter_mag) !== null && _226 !== void 0 ? _226 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.filter) !== null && _227 !== void 0 ? _227 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.magFilter) !== null && _228 !== void 0 ? _228 : "NEAREST"), ((_231 = (_230 = (_229 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_S) !== null && _229 !== void 0 ? _229 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _230 !== void 0 ? _230 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapS) !== null && _231 !== void 0 ? _231 : "CLAMP"), ((_234 = (_233 = (_232 = TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap_T) !== null && _232 !== void 0 ? _232 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrap) !== null && _233 !== void 0 ? _233 : TauFloatTex === null || TauFloatTex === void 0 ? void 0 : TauFloatTex.wrapT) !== null && _234 !== void 0 ? _234 : "CLAMP")], "TexUnit24");
if (!WebGLMan.stWebGLMan.gl)
    WebGLMan.setGL(gl);
var drawTau = WebGLMan.program(-1, "tau/08_draw/1_drawTauMaxVeces");
await drawTau.loadProgram(drawTau.vertPath, drawTau.fragPath, __makeTranspiledShaderFilter("vert", drawTau.vertPath), __makeTranspiledShaderFilter("frag", drawTau.fragPath));
await ((_235 = drawTau.use) === null || _235 === void 0 ? void 0 : _235.call(drawTau));
lastUsedProgram = drawTau;
drawTau.createVAO().bind();
drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
drawTau.bindTexName2TexUnit("tauBest", "TexUnit17");
drawTau.bindTexName2TexUnit("tauSindy", "TexUnit30");
drawTau.bindTexName2TexUnit("tauSindyInit", "TexUnit31");
drawTau.bindTexName2TexUnit("tauSindyTau1Ref", "TexUnit9");
drawTau.bindTexName2TexUnit("tauModelMask", "TexUnit22");
drawTau.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
drawTau.bindTexName2TexUnit("tauFPStationary", "TexUnit24");
drawTau.bindTexName2TexUnit("tauModelKL", "TexUnit28");
drawTau.bindTexName2TexUnit("tauModelScore", "TexUnit29");
drawTau.bindTexName2TexUnit("tauStats", "TexUnit21");
(_236 = drawTau.use) === null || _236 === void 0 ? void 0 : _236.call(drawTau);
drawTau.uNum("tauMax", false, false).set((tauMaxVeces));
(_237 = drawTau.use) === null || _237 === void 0 ? void 0 : _237.call(drawTau);
drawTau.uNum("tauMin", false, false).set((tauMinVeces));
(_238 = drawTau.use) === null || _238 === void 0 ? void 0 : _238.call(drawTau);
drawTau.uNum("nBins", false, false).set((nBins));
(_239 = drawTau.use) === null || _239 === void 0 ? void 0 : _239.call(drawTau);
drawTau.uNum("bestTau", false, false).set((bestTau));
(_240 = drawTau.use) === null || _240 === void 0 ? void 0 : _240.call(drawTau);
drawTau.uNum("bestSubseq", false, false).set((bestSubseq));
(_241 = drawTau.use) === null || _241 === void 0 ? void 0 : _241.call(drawTau);
drawTau.uNum("showTauCurves", false, false).set((!!showTauCurves ? 1 : 0));
(_242 = drawTau.use) === null || _242 === void 0 ? void 0 : _242.call(drawTau);
drawTau.uNum("showFPStationary", false, false).set((!!showFPStationary ? 1 : 0));
(_243 = drawTau.use) === null || _243 === void 0 ? void 0 : _243.call(drawTau);
drawTau.uNum("showLSOverlay", false, false).set((!!showLSFOverlay ? 1 : 0));
drawTau.isDepthTest = false;
var __globalBlockFn_0 = (dt) => __awaiter(void 0, void 0, void 0, function* () {
    var _244, _245, _246, _247, _248, _249, _250, _251, _252, _253, _254, _255, _256, _257, _258, _259, _260, _261, _262, _263, _264, _265, _266, _267, _268, _269, _270, _271, _272, _273, _274, _275, _276, _277, _278, _279, _280, _281, _282, _283, _284, _285, _286, _287, _288, _289, _290, _291, _292, _293, _294, _295, _296, _297, _298, _299, _300, _301, _302, _303, _304, _305, _306, _307, _308, _309, _310, _311, _312, _313, _314, _315, _316, _317, _318, _319, _320, _321, _322, _323, _324, _325, _326, _327, _328, _329, _330, _331, _332, _333, _334, _335, _336, _337, _338, _339, _340, _341;
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (bestSubseq >= bestTau) {
        bestSubseq = (Math.max(0, bestTau - 1));
    }
    if (recomputeTau) {
        console.log("C2 recomputeTau=true -> s1 tauMaxVeces + s2 tauXiLS + s2.5 tauAFP0 + s2.6 tauAFPOpt + s2.7 stats/mask + s2.8 fpProxy + s2.9 modelKL/score + s3 bestModel + s4 sindy + s4.5 fpStationary");
        yield ((_244 = tauMom.use) === null || _244 === void 0 ? void 0 : _244.call(tauMom));
        lastUsedProgram = tauMom;
        (_245 = tauMom.use) === null || _245 === void 0 ? void 0 : _245.call(tauMom);
        tauMom.uNum("nSamples", false, false).set((NMuestras1));
        (_246 = tauMom.use) === null || _246 === void 0 ? void 0 : _246.call(tauMom);
        tauMom.uNum("tauMax", false, false).set((tauMaxVeces));
        (_247 = tauMom.use) === null || _247 === void 0 ? void 0 : _247.call(tauMom);
        tauMom.uNum("tauMin", false, false).set((tauMinVeces));
        (_248 = tauMom.use) === null || _248 === void 0 ? void 0 : _248.call(tauMom);
        tauMom.uNum("nBins", false, false).set((nBins));
        (_249 = tauMom.use) === null || _249 === void 0 ? void 0 : _249.call(tauMom);
        tauMom.uNum("dtSample", true, false).set((dtSample));
        (_250 = tauMom.use) === null || _250 === void 0 ? void 0 : _250.call(tauMom);
        tauMom.uNum("tauEStar", true, false).set((tauEStar));
        tauMom.bindTexName2TexUnit("datosX1", "TexUnit10");
        var tauMomFBO = tauMom.cFrameBuffer().bind(["ColAtch0", "ColAtch1"]);
        tauMomFBO.bindColorBuffer(tauMom1, "ColAtch0");
        tauMomFBO.bindColorBuffer(tauMom2, "ColAtch1");
        tauMom.setViewport(0, 0, nBins, tauMaxVeces * tauMaxVeces);
        tauMom.drawArrays("TRIANGLES", 0, 6);
        yield ((_251 = tauXi.use) === null || _251 === void 0 ? void 0 : _251.call(tauXi));
        lastUsedProgram = tauXi;
        (_252 = tauXi.use) === null || _252 === void 0 ? void 0 : _252.call(tauXi);
        tauXi.uNum("tauMax", false, false).set((tauMaxVeces));
        (_253 = tauXi.use) === null || _253 === void 0 ? void 0 : _253.call(tauXi);
        tauXi.uNum("tauMin", false, false).set((tauMinVeces));
        (_254 = tauXi.use) === null || _254 === void 0 ? void 0 : _254.call(tauXi);
        tauXi.uNum("nBins", false, false).set((nBins));
        tauXi.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauXi.bindTexName2TexUnit("tauMom2", "TexUnit15");
        var tauXiFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
        tauXiFBO.bindColorBuffer(tauXiF, "ColAtch0");
        tauXiFBO.bindColorBuffer(tauXiS, "ColAtch1");
        tauXiFBO.bindColorBuffer(tauXiMeta, "ColAtch2");
        (_255 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _255 === void 0 ? void 0 : _255.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_256 = tauAFP.use) === null || _256 === void 0 ? void 0 : _256.call(tauAFP));
        lastUsedProgram = tauAFP;
        (_257 = tauAFP.use) === null || _257 === void 0 ? void 0 : _257.call(tauAFP);
        tauAFP.uNum("tauMax", false, false).set((tauMaxVeces));
        (_258 = tauAFP.use) === null || _258 === void 0 ? void 0 : _258.call(tauAFP);
        tauAFP.uNum("tauMin", false, false).set((tauMinVeces));
        (_259 = tauAFP.use) === null || _259 === void 0 ? void 0 : _259.call(tauAFP);
        tauAFP.uNum("nBins", false, false).set((nBins));
        (_260 = tauAFP.use) === null || _260 === void 0 ? void 0 : _260.call(tauAFP);
        tauAFP.uNum("lrF", true, false).set((afpLrF));
        (_261 = tauAFP.use) === null || _261 === void 0 ? void 0 : _261.call(tauAFP);
        tauAFP.uNum("lrS", true, false).set((afpLrS));
        (_262 = tauAFP.use) === null || _262 === void 0 ? void 0 : _262.call(tauAFP);
        tauAFP.uNum("l1F", true, false).set((afpL1F));
        (_263 = tauAFP.use) === null || _263 === void 0 ? void 0 : _263.call(tauAFP);
        tauAFP.uNum("l1S", true, false).set((afpL1S));
        (_264 = tauAFP.use) === null || _264 === void 0 ? void 0 : _264.call(tauAFP);
        tauAFP.uNum("nIter", false, false).set((afpIters));
        tauAFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauAFP.bindTexName2TexUnit("tauMom2", "TexUnit15");
        tauAFP.bindTexName2TexUnit("tauXiF", "TexUnit12");
        tauAFP.bindTexName2TexUnit("tauXiS", "TexUnit13");
        tauAFP.bindTexName2TexUnit("tauXiMeta", "TexUnit16");
        var tauAFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
        tauAFPFBO.bindColorBuffer(tauXiFOpt, "ColAtch0");
        tauAFPFBO.bindColorBuffer(tauXiSOpt, "ColAtch1");
        tauAFPFBO.bindColorBuffer(tauXiMetaOpt, "ColAtch2");
        (_265 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _265 === void 0 ? void 0 : _265.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_266 = tauAFPOpt.use) === null || _266 === void 0 ? void 0 : _266.call(tauAFPOpt));
        lastUsedProgram = tauAFPOpt;
        (_267 = tauAFPOpt.use) === null || _267 === void 0 ? void 0 : _267.call(tauAFPOpt);
        tauAFPOpt.uNum("tauMax", false, false).set((tauMaxVeces));
        (_268 = tauAFPOpt.use) === null || _268 === void 0 ? void 0 : _268.call(tauAFPOpt);
        tauAFPOpt.uNum("tauMin", false, false).set((tauMinVeces));
        (_269 = tauAFPOpt.use) === null || _269 === void 0 ? void 0 : _269.call(tauAFPOpt);
        tauAFPOpt.uNum("nBins", false, false).set((nBins));
        (_270 = tauAFPOpt.use) === null || _270 === void 0 ? void 0 : _270.call(tauAFPOpt);
        tauAFPOpt.uNum("lrF", true, false).set((afpOptLrF));
        (_271 = tauAFPOpt.use) === null || _271 === void 0 ? void 0 : _271.call(tauAFPOpt);
        tauAFPOpt.uNum("lrS", true, false).set((afpOptLrS));
        (_272 = tauAFPOpt.use) === null || _272 === void 0 ? void 0 : _272.call(tauAFPOpt);
        tauAFPOpt.uNum("l1F", true, false).set((afpOptL1F));
        (_273 = tauAFPOpt.use) === null || _273 === void 0 ? void 0 : _273.call(tauAFPOpt);
        tauAFPOpt.uNum("l1S", true, false).set((afpOptL1S));
        (_274 = tauAFPOpt.use) === null || _274 === void 0 ? void 0 : _274.call(tauAFPOpt);
        tauAFPOpt.uNum("l2F", true, false).set((afpOptL2F));
        (_275 = tauAFPOpt.use) === null || _275 === void 0 ? void 0 : _275.call(tauAFPOpt);
        tauAFPOpt.uNum("l2S", true, false).set((afpOptL2S));
        (_276 = tauAFPOpt.use) === null || _276 === void 0 ? void 0 : _276.call(tauAFPOpt);
        tauAFPOpt.uNum("nIter", false, false).set((afpOptIters));
        tauAFPOpt.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauAFPOpt.bindTexName2TexUnit("tauMom2", "TexUnit15");
        tauAFPOpt.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
        tauAFPOpt.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
        tauAFPOpt.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
        var tauAFPOptFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", 2]);
        tauAFPOptFBO.bindColorBuffer(tauXiFFinal, "ColAtch0");
        tauAFPOptFBO.bindColorBuffer(tauXiSFinal, "ColAtch1");
        tauAFPOptFBO.bindColorBuffer(tauXiMetaFinal, 2);
        (_277 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _277 === void 0 ? void 0 : _277.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_278 = tauStats.use) === null || _278 === void 0 ? void 0 : _278.call(tauStats));
        lastUsedProgram = tauStats;
        (_279 = tauStats.use) === null || _279 === void 0 ? void 0 : _279.call(tauStats);
        tauStats.uNum("tauMax", false, false).set((tauMaxVeces));
        (_280 = tauStats.use) === null || _280 === void 0 ? void 0 : _280.call(tauStats);
        tauStats.uNum("tauMin", false, false).set((tauMinVeces));
        (_281 = tauStats.use) === null || _281 === void 0 ? void 0 : _281.call(tauStats);
        tauStats.uNum("keepPercent", true, false).set((keepTopPercent));
        tauStats.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        var tauStatsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauStatsFBO.bindColorBuffer(tauStatsTex, "ColAtch0");
        (_282 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _282 === void 0 ? void 0 : _282.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, 1, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_283 = tauMask.use) === null || _283 === void 0 ? void 0 : _283.call(tauMask));
        lastUsedProgram = tauMask;
        (_284 = tauMask.use) === null || _284 === void 0 ? void 0 : _284.call(tauMask);
        tauMask.uNum("tauMax", false, false).set((tauMaxVeces));
        (_285 = tauMask.use) === null || _285 === void 0 ? void 0 : _285.call(tauMask);
        tauMask.uNum("tauMin", false, false).set((tauMinVeces));
        tauMask.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauMask.bindTexName2TexUnit("tauStats", "TexUnit21");
        var tauMaskFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauMaskFBO.bindColorBuffer(tauMaskTex, "ColAtch0");
        (_286 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _286 === void 0 ? void 0 : _286.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_287 = tauFP.use) === null || _287 === void 0 ? void 0 : _287.call(tauFP));
        lastUsedProgram = tauFP;
        (_288 = tauFP.use) === null || _288 === void 0 ? void 0 : _288.call(tauFP);
        tauFP.uNum("tauMax", false, false).set((tauMaxVeces));
        (_289 = tauFP.use) === null || _289 === void 0 ? void 0 : _289.call(tauFP);
        tauFP.uNum("tauMin", false, false).set((tauMinVeces));
        (_290 = tauFP.use) === null || _290 === void 0 ? void 0 : _290.call(tauFP);
        tauFP.uNum("nBins", false, false).set((nBins));
        (_291 = tauFP.use) === null || _291 === void 0 ? void 0 : _291.call(tauFP);
        tauFP.uNum("logSpanMax", true, false).set((fpLogSpanMax));
        tauFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauFP.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
        tauFP.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
        tauFP.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauFP.bindTexName2TexUnit("tauModelMask", "TexUnit22");
        var tauFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauFPFBO.bindColorBuffer(tauFPTex, "ColAtch0");
        (_292 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _292 === void 0 ? void 0 : _292.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_293 = tauKL.use) === null || _293 === void 0 ? void 0 : _293.call(tauKL));
        lastUsedProgram = tauKL;
        (_294 = tauKL.use) === null || _294 === void 0 ? void 0 : _294.call(tauKL);
        tauKL.uNum("tauMax", false, false).set((tauMaxVeces));
        (_295 = tauKL.use) === null || _295 === void 0 ? void 0 : _295.call(tauKL);
        tauKL.uNum("tauMin", false, false).set((tauMinVeces));
        (_296 = tauKL.use) === null || _296 === void 0 ? void 0 : _296.call(tauKL);
        tauKL.uNum("nBins", false, false).set((nBins));
        (_297 = tauKL.use) === null || _297 === void 0 ? void 0 : _297.call(tauKL);
        tauKL.uNum("spanMax", true, false).set((modelKLSpanMax));
        tauKL.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauKL.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
        tauKL.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
        tauKL.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        var tauKLFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauKLFBO.bindColorBuffer(tauKLTex, "ColAtch0");
        (_298 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _298 === void 0 ? void 0 : _298.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_299 = tauScore.use) === null || _299 === void 0 ? void 0 : _299.call(tauScore));
        lastUsedProgram = tauScore;
        (_300 = tauScore.use) === null || _300 === void 0 ? void 0 : _300.call(tauScore);
        tauScore.uNum("tauMax", false, false).set((tauMaxVeces));
        (_301 = tauScore.use) === null || _301 === void 0 ? void 0 : _301.call(tauScore);
        tauScore.uNum("tauMin", false, false).set((tauMinVeces));
        (_302 = tauScore.use) === null || _302 === void 0 ? void 0 : _302.call(tauScore);
        tauScore.uNum("wCost", true, false).set((scoreWCost));
        (_303 = tauScore.use) === null || _303 === void 0 ? void 0 : _303.call(tauScore);
        tauScore.uNum("wKL", true, false).set((scoreWKL));
        (_304 = tauScore.use) === null || _304 === void 0 ? void 0 : _304.call(tauScore);
        tauScore.uNum("wSpan", true, false).set((scoreWSpan));
        (_305 = tauScore.use) === null || _305 === void 0 ? void 0 : _305.call(tauScore);
        tauScore.uNum("klMax", true, false).set((scoreKLMax));
        (_306 = tauScore.use) === null || _306 === void 0 ? void 0 : _306.call(tauScore);
        tauScore.uNum("scoreMax", true, false).set((scoreMaxCut));
        tauScore.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauScore.bindTexName2TexUnit("tauModelMask", "TexUnit22");
        tauScore.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
        tauScore.bindTexName2TexUnit("tauModelKL", "TexUnit28");
        tauScore.bindTexName2TexUnit("tauStats", "TexUnit21");
        var tauScoreFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauScoreFBO.bindColorBuffer(tauScoreTex, "ColAtch0");
        (_307 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _307 === void 0 ? void 0 : _307.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_308 = tauBest.use) === null || _308 === void 0 ? void 0 : _308.call(tauBest));
        lastUsedProgram = tauBest;
        (_309 = tauBest.use) === null || _309 === void 0 ? void 0 : _309.call(tauBest);
        tauBest.uNum("tauMax", false, false).set((tauMaxVeces));
        (_310 = tauBest.use) === null || _310 === void 0 ? void 0 : _310.call(tauBest);
        tauBest.uNum("tauMin", false, false).set((tauMinVeces));
        (_311 = tauBest.use) === null || _311 === void 0 ? void 0 : _311.call(tauBest);
        tauBest.uNum("useMask", false, false).set(1);
        (_312 = tauBest.use) === null || _312 === void 0 ? void 0 : _312.call(tauBest);
        tauBest.uNum("useFP", false, false).set((!!useFPFilter ? 1 : 0));
        (_313 = tauBest.use) === null || _313 === void 0 ? void 0 : _313.call(tauBest);
        tauBest.uNum("useScore", false, false).set((!!useScoreSelection ? 1 : 0));
        tauBest.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauBest.bindTexName2TexUnit("tauModelMask", "TexUnit22");
        tauBest.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
        tauBest.bindTexName2TexUnit("tauModelScore", "TexUnit29");
        var tauBestFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauBestFBO.bindColorBuffer(tauBestTex, "ColAtch0");
        (_314 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _314 === void 0 ? void 0 : _314.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, 1, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_315 = tauSindy.use) === null || _315 === void 0 ? void 0 : _315.call(tauSindy));
        lastUsedProgram = tauSindy;
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestSubseq >= bestTau) {
            bestSubseq = (Math.max(0, bestTau - 1));
        }
        (_316 = tauSindy.use) === null || _316 === void 0 ? void 0 : _316.call(tauSindy);
        tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
        (_317 = tauSindy.use) === null || _317 === void 0 ? void 0 : _317.call(tauSindy);
        tauSindy.uNum("nBins", false, false).set((nBins));
        (_318 = tauSindy.use) === null || _318 === void 0 ? void 0 : _318.call(tauSindy);
        tauSindy.uNum("selectedTau", false, false).set((bestTau));
        (_319 = tauSindy.use) === null || _319 === void 0 ? void 0 : _319.call(tauSindy);
        tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
        (_320 = tauSindy.use) === null || _320 === void 0 ? void 0 : _320.call(tauSindy);
        tauSindy.uNum("useSelected", false, false).set(1);
        tauSindy.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit18");
        tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit19");
        tauSindy.bindTexName2TexUnit("tauBest", "TexUnit17");
        var tauSindyInitFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauSindyInitFBO.bindColorBuffer(tauSindyInitTex, "ColAtch0");
        (_321 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _321 === void 0 ? void 0 : _321.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, nBins, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        (_322 = tauSindy.use) === null || _322 === void 0 ? void 0 : _322.call(tauSindy);
        tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
        (_323 = tauSindy.use) === null || _323 === void 0 ? void 0 : _323.call(tauSindy);
        tauSindy.uNum("nBins", false, false).set((nBins));
        (_324 = tauSindy.use) === null || _324 === void 0 ? void 0 : _324.call(tauSindy);
        tauSindy.uNum("selectedTau", false, false).set(1);
        (_325 = tauSindy.use) === null || _325 === void 0 ? void 0 : _325.call(tauSindy);
        tauSindy.uNum("selectedSubseq", false, false).set(0);
        (_326 = tauSindy.use) === null || _326 === void 0 ? void 0 : _326.call(tauSindy);
        tauSindy.uNum("useSelected", false, false).set(1);
        var tauSindyTau1RefFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauSindyTau1RefFBO.bindColorBuffer(tauSindyTau1RefTex, "ColAtch0");
        (_327 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _327 === void 0 ? void 0 : _327.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, nBins, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        (_328 = tauSindy.use) === null || _328 === void 0 ? void 0 : _328.call(tauSindy);
        tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
        (_329 = tauSindy.use) === null || _329 === void 0 ? void 0 : _329.call(tauSindy);
        tauSindy.uNum("nBins", false, false).set((nBins));
        (_330 = tauSindy.use) === null || _330 === void 0 ? void 0 : _330.call(tauSindy);
        tauSindy.uNum("selectedTau", false, false).set((bestTau));
        (_331 = tauSindy.use) === null || _331 === void 0 ? void 0 : _331.call(tauSindy);
        tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
        (_332 = tauSindy.use) === null || _332 === void 0 ? void 0 : _332.call(tauSindy);
        tauSindy.uNum("useSelected", false, false).set(1);
        tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit25");
        tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit26");
        var tauSindyFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauSindyFBO.bindColorBuffer(tauSindyTex, "ColAtch0");
        (_333 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _333 === void 0 ? void 0 : _333.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, nBins, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        yield ((_334 = tauFPStat.use) === null || _334 === void 0 ? void 0 : _334.call(tauFPStat));
        lastUsedProgram = tauFPStat;
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestSubseq >= bestTau) {
            bestSubseq = (Math.max(0, bestTau - 1));
        }
        (_335 = tauFPStat.use) === null || _335 === void 0 ? void 0 : _335.call(tauFPStat);
        tauFPStat.uNum("tauMax", false, false).set((tauMaxVeces));
        (_336 = tauFPStat.use) === null || _336 === void 0 ? void 0 : _336.call(tauFPStat);
        tauFPStat.uNum("tauMin", false, false).set((tauMinVeces));
        (_337 = tauFPStat.use) === null || _337 === void 0 ? void 0 : _337.call(tauFPStat);
        tauFPStat.uNum("nBins", false, false).set((nBins));
        (_338 = tauFPStat.use) === null || _338 === void 0 ? void 0 : _338.call(tauFPStat);
        tauFPStat.uNum("selectedTau", false, false).set((bestTau));
        (_339 = tauFPStat.use) === null || _339 === void 0 ? void 0 : _339.call(tauFPStat);
        tauFPStat.uNum("selectedSubseq", false, false).set((bestSubseq));
        (_340 = tauFPStat.use) === null || _340 === void 0 ? void 0 : _340.call(tauFPStat);
        tauFPStat.uNum("useSelected", false, false).set(1);
        tauFPStat.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauFPStat.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
        tauFPStat.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
        tauFPStat.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
        tauFPStat.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
        tauFPStat.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
        tauFPStat.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauFPStat.bindTexName2TexUnit("tauBest", "TexUnit17");
        var tauFPStatFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauFPStatFBO.bindColorBuffer(tauFPStatTex, "ColAtch0");
        (_341 = lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.use) === null || _341 === void 0 ? void 0 : _341.call(lastUsedProgram);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.setViewport(...[0, 0, nBins, 1]);
        lastUsedProgram === null || lastUsedProgram === void 0 ? void 0 : lastUsedProgram.drawArrays("TRIANGLES", 0, 6);
        if (tauDebugFrames > 0) {
            var statsSample = (tauStatsFBO.readColorAttachment(0, 0, 0, 1, 1, TexExamples.RGBAFloat16, 4));
            var bestSample = (tauBestFBO.readColorAttachment(0, 0, 0, 1, 1, TexExamples.RGBAFloat16, 4));
            var bestArr = (Array.from(bestSample));
            var stArr = (Array.from(statsSample));
            console.log("C2 muestras: y=0 => tau=1,subseq=0 ; y=tauMax => tau=2,subseq=0");
            console.log(Array.from(tauMomFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mom2 tau1-sub0 [fKM,aKM,fErr,aErr] bins 0..3");
            console.log(Array.from(tauMomFBO.readColorAttachment("ColAtch1", 0, tauMaxVeces, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mom2 tau2-sub0 [fKM,aKM,fErr,aErr] bins 0..3");
            console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 LS sample");
            console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 LS sample");
            console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta LS sample [cost,valid,nUsed,reserved]");
            console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 AFP0 sample");
            console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 AFP0 sample");
            console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta AFP0 sample [cost,valid,nUsed,reserved]");
            console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 FINAL sample");
            console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 FINAL sample");
            console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta FINAL sample [cost,valid,nUsed,reserved]");
            console.log((stArr), "C2 stats [bestCost,threshold,maxValidCost,targetK]");
            console.log(Array.from(tauMaskFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mask sample [selected,cost,valid,scoreN]");
            console.log(Array.from(tauFPFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 fpProxy sample [selectedFP,cost,validFP,spanN]");
            console.log(Array.from(tauKLFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 modelKL sample [kl,valid,spanN,sumH]");
            console.log(Array.from(tauScoreFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 modelScore sample [selected,score,valid,costRaw]");
            console.log((bestArr), "C2 bestModel [tau,subseq,cost,found]");
            console.log(Array.from(tauSindyInitFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 sindy INIT sample [x,f,s,a] bins 0..7");
            console.log(Array.from(tauSindyFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 sindy sample [x,f,s,a] bins 0..7");
            console.log(Array.from(tauFPStatFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 fpStationary sample [pHist,pInit,pFinal,valid] bins 0..7");
            if (autoPickBest) {
                bestTau = (Math.max(tauMinVeces, ~~(bestArr[0] || 1)));
                bestTau = (Math.min(bestTau, tauMaxVeces));
                bestSubseq = (Math.max(0, ~~(bestArr[1] || 0)));
            }
            if (logTopModels) {
                var bestX = (Math.max(0, bestTau - 1));
                var bestY = (Math.max(0, bestSubseq));
                var bestXiF = (tauAFPOptFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestXiS = (tauAFPOptFBO.readColorAttachment(1, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestXiMeta = (tauAFPOptFBO.readColorAttachment(2, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestKL = (tauKLFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestScore = (tauScoreFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                console.log((Array.from(bestXiF)), "C2 BEST Xi pack0 [c0..c3]");
                console.log((Array.from(bestXiS)), "C2 BEST Xi pack1 [c4..c7]");
                console.log((Array.from(bestXiMeta)), "C2 BEST Xi meta [cost,valid,nUsed,reserved]");
                console.log((Array.from(bestKL)), "C2 BEST KL [kl,valid,spanN,sumH]");
                console.log((Array.from(bestScore)), "C2 BEST SCORE [selected,score,valid,costRaw]");
            }
            tauDebugFrames -= 1;
        }
        tauFPStat.unbindFBO();
        tauSindy.unbindFBO();
        tauBest.unbindFBO();
        tauScore.unbindFBO();
        tauKL.unbindFBO();
        tauFP.unbindFBO();
        tauMask.unbindFBO();
        tauStats.unbindFBO();
        tauAFPOpt.unbindFBO();
        tauAFP.unbindFBO();
        tauXi.unbindFBO();
        tauMom.unbindFBO();
        tauModelStamp += 1;
        recomputeTau = false;
    }
});
__globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
var __globalBlockFn_1 = (dt) => __awaiter(void 0, void 0, void 0, function* () {
    var _342, _343;
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (bestSubseq >= bestTau) {
        bestSubseq = (Math.max(0, bestTau - 1));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    yield ((_342 = drawTau.use) === null || _342 === void 0 ? void 0 : _342.call(drawTau));
    lastUsedProgram = drawTau;
    drawTau.VAO.bind();
    (_343 = drawTau.use) === null || _343 === void 0 ? void 0 : _343.call(drawTau);
    drawTau.setViewport(...([0, 0, canvas.width, canvas.height]));
    if (useLSView) {
        drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit16");
    }
    else {
        drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    }
    drawTau.bindTexName2TexUnit("tauBest", "TexUnit17");
    drawTau.bindTexName2TexUnit("tauSindy", "TexUnit30");
    drawTau.bindTexName2TexUnit("tauSindyInit", "TexUnit31");
    drawTau.bindTexName2TexUnit("tauSindyTau1Ref", "TexUnit9");
    drawTau.bindTexName2TexUnit("tauModelMask", "TexUnit22");
    drawTau.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
    drawTau.bindTexName2TexUnit("tauModelKL", "TexUnit28");
    drawTau.bindTexName2TexUnit("tauModelScore", "TexUnit29");
    drawTau.bindTexName2TexUnit("tauFPStationary", "TexUnit24");
    drawTau.bindTexName2TexUnit("tauStats", "TexUnit21");
    drawTau.uniforms.tauMax.set((tauMaxVeces));
    drawTau.uniforms.tauMin.set((tauMinVeces));
    drawTau.uniforms.bestTau.set((bestTau));
    drawTau.uniforms.bestSubseq.set((bestSubseq));
    drawTau.uniforms.showTauCurves.set((!!showTauCurves ? 1 : 0));
    drawTau.uniforms.showFPStationary.set((!!showFPStationary ? 1 : 0));
    drawTau.uniforms.showLSOverlay.set((!!showLSFOverlay ? 1 : 0));
    if (c2DrawLogFrames > 0) {
        console.log("C2 drawTauPanel", (bestTau), (bestSubseq), (gl.getParameter(gl.FRAMEBUFFER_BINDING)));
        c2DrawLogFrames -= 1;
    }
    drawTau.drawArrays("TRIANGLES", 0, 6);
    if (typeof __drawTauHud === "function") {
        __drawTauHud();
    }
});
__globalBlocks.push({ priority: 20, order: 1, fn: __globalBlockFn_1 });
KeyManager.OnPress("u", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    recomputeTau = true;
}));
KeyManager.OnPress("q", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    useLSView = (!useLSView);
}));
KeyManager.OnPress("e", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    autoPickBest = (!autoPickBest);
    recomputeTau = true;
}));
KeyManager.OnPress("n", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    keepTopPercent = (Math.min(80, keepTopPercent + 5));
    recomputeTau = true;
}));
KeyManager.OnPress("i", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    keepTopPercent = (Math.max(5, keepTopPercent - 5));
    recomputeTau = true;
}));
KeyManager.OnPress("j", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showMSDOverlay = (!showMSDOverlay);
}));
KeyManager.OnPress("f", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    useFPFilter = (!useFPFilter);
    recomputeTau = true;
}));
KeyManager.OnPress("t", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showTauCurves = (!showTauCurves);
}));
KeyManager.OnPress("b", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showRawKMOverlay = (!showRawKMOverlay);
}));
KeyManager.OnPress("m", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showLSFOverlay = (!showLSFOverlay);
}));
KeyManager.OnPress("r", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showFPStationary = (!showFPStationary);
}));
KeyManager.OnPress("o", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    useScoreSelection = (!useScoreSelection);
    recomputeTau = true;
}));
KeyManager.OnPress("l", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    showMSDScoreMap = (!showMSDScoreMap);
}));
KeyManager.OnPress("x", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    autoPickBest = false;
    var prevTauX = (bestTau);
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    var wasOutX = (bestTau < tauMinVeces || bestTau > tauMaxVeces);
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (!wasOutX) {
        bestTau = (Math.min(bestTau + 1, tauMaxVeces));
    }
    if (bestTau == prevTauX) {
        console.log("C2 x: limite superior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
    }
    if (bestSubseq >= bestTau) {
        bestSubseq = (bestTau - 1);
    }
    bestSubseq = (Math.max(0, ~~bestSubseq));
    recomputeTau = true;
}));
KeyManager.OnPress("z", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    autoPickBest = false;
    var prevTauZ = (bestTau);
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    var wasOutZ = (bestTau < tauMinVeces || bestTau > tauMaxVeces);
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (!wasOutZ) {
        bestTau = (Math.max(bestTau - 1, tauMinVeces));
    }
    if (bestTau == prevTauZ) {
        console.log("C2 z: limite inferior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
    }
    if (bestSubseq >= bestTau) {
        bestSubseq = (bestTau - 1);
    }
    bestSubseq = (Math.max(0, ~~bestSubseq));
    recomputeTau = true;
}));
KeyManager.OnPress("v", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (bestTau > 1) {
        autoPickBest = false;
        bestSubseq = ((bestSubseq + 1) % bestTau);
        bestSubseq = (Math.max(0, ~~bestSubseq));
        recomputeTau = true;
    }
}));
KeyManager.OnPress("c", (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e === null || e === void 0 ? void 0 : e.repeat)
        return;
    tauMinVeces = (Math.max(1, ~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces, ~~bestTau));
    bestTau = (Math.min(bestTau, tauMaxVeces));
    bestSubseq = (Math.max(0, ~~bestSubseq));
    if (bestTau > 1) {
        autoPickBest = false;
        bestSubseq = ((bestSubseq - 1 + bestTau) % bestTau);
        bestSubseq = (Math.max(0, ~~bestSubseq));
        recomputeTau = true;
    }
    else {
        console.log("C2 c: tau actual no tiene subsecuencias", (bestTau));
    }
}));
if (typeof __mountGlobalBlocks === "function")
    __mountGlobalBlocks(__globalBlocks, addFunc);
start();
