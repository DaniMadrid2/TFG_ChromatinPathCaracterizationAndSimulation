// @ts-nocheck

import {Camera2D, createCanvas, createLayer, GameObject, ImgLoader, ModernCtx, Scene,MouseManager, ListenerManager, openFullscreen, keypress, mousepos, mouseclick, KeyManager} from "/Code/Game/Game.js";
import { Matrix2D, MatrixStack2D, Vector2D, Vector3D } from "/Code/Matrix/Matrix.js";
import {Funcion, Arrow, Field,Axis,Axis2D,Funcion2D,Funcion3D,MatrixObject,axisprops,addMapStyle,mapstyle, setMapStyle,
    Waiter, Changer, PosChanger, NearPosChanger, ChangerArr, MathFs, KeyWaiter, TimeWaiter, LogerW,
    Easer, Handler, PosChangerByRotation,
    EaserConstant, Ellipse
 } from "/Code/MathRender/MathRender.js"
import {addFunc, start, stop, Timer} from "/Code/Start/start.js"
import { MathJaxLoader } from "/Code/MathJax/MathJax.js";
import { createCanvasNextTo} from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js"
import {create2DWithAxis} from "/DNTI_Templates/LinearAlgebra/2DLinear.js"

import { Axis3DGroup, MeshRenderingProgram, MeshFillerProgram } from "/Code/WebGL/webglCapsules.js";
import { Camera3D } from "/Code/Game3D/Game3D.js";
import { BindableTexture, GLMode, TexExamples, TextureUnitType, WebGLMan, WebProgram, parseTexUnitType } from "/Code/WebGL/webglMan.js";
import { __prepareMathFunction, __mountGlobalBlocks } from "/Code/opengl/opengl.js";

//<Pre>
//</Pre>
var lastUsedProgram: any = null;
var lastFillerProgram: any = null;
void lastFillerProgram;
var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];
var __transpiledShaderFilterRules = [{ stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT"), replacement: () => (("const int TAU_F_TERMS = " + String(tauFTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT"), replacement: () => (("const int TAU_S_TERMS = " + String(tauSTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT"), replacement: () => (("const int TAU_TOTAL_TERMS = " + String(tauTotalTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_F_BASIS_BODY"), replacement: () => ((tauBasisBody(tauFDegrees) + " return 0.0;")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_S_BASIS_BODY"), replacement: () => ((tauBasisBody(tauSDegrees) + " return 0.0;")) }];

// Aplica reglas de sustitucion sobre en el texto del shader.
// La lista de reglas se construye una sola vez al generar el parser; aqui solo
// resolvemos si una regla afecta a este archivo y hacemos el replace correspondiente.
var __makeTranspiledShaderFilter = (stage:any, filePathRaw:any) => {
    return (source:any) => {
        // 1) Normalizacion basica. Evita fallos si el cargador entrega null,
        // undefined o cualquier valor no string durante una recompilacion parcial.
        let out = String(source ?? "");
        const filePath = String(filePathRaw ?? "");

        // 2) Filtro por etapa y por ruta. Las reglas de otros shaders no deben
        // tocar este fichero aunque compartan el mismo placeholder.
        for (const rule of __transpiledShaderFilterRules) {
            if (!rule) continue;
            if (rule.stage !== "both" && rule.stage !== stage) continue;

            const filePattern:any = typeof rule.filePattern === "function" ? rule.filePattern() : rule.filePattern;
            if (filePattern !== undefined && filePattern !== null && filePattern !== "*") {
                const matchesFile = (filePattern instanceof RegExp)
                    ? ((filePattern.lastIndex = 0), filePattern.test(filePath))
                    : filePath.includes(String(filePattern));
                if (!matchesFile) continue;
            }

            // 3) Sustitucion. Si el patron es regex lo clonamos para no arrastrar
            // estado interno entre llamadas consecutivas. Si es texto plano usamos
            // split/join porque mantiene el codigo generado corto y predecible.
            const searchPattern:any = typeof rule.searchPattern === "function" ? rule.searchPattern() : rule.searchPattern;
            const search = (searchPattern instanceof RegExp)
                ? new RegExp(searchPattern.source, searchPattern.flags)
                : searchPattern;
            const replacementValue = typeof rule.replacement === "function" ? rule.replacement() : rule.replacement;
            const replacement = String(replacementValue ?? "");

            out = (search instanceof RegExp)
                ? out.replace(search, replacement)
                : out.split(String(search ?? "")).join(replacement);
        }

        return out;
    };
};
const __runtimeLetCache = new Map<string, any>();
const __coerceRuntimeLetValue = (raw:any)=>{
    const text = String(raw ?? "").trim();
    if(!text) return undefined;
    if(/^(true|false)$/i.test(text)) return text.toLowerCase()==="true";
    if(/^null$/i.test(text)) return null;
    if(/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text)) return Number(text);
    if((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))){
        try{ return JSON.parse(text); }catch{}
    }
    if((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))){
        return text.slice(1,-1);
    }
    return text;
};

const __mergeRuntimeLetArray = (arr:any[])=>{
    const out:any = { __array: arr };
    if(arr.every(item => item && typeof item === "object" && !Array.isArray(item))){
        for (const item of arr) Object.assign(out, item);
    }
    return out;
};

const __parseRuntimeLetText = (text:string)=>{
    const out:any = {};
    const chunks = String(text ?? "").split(/[\r\n]+/).flatMap(line => line.split(","));
    for (const chunk of chunks) {
        const entry = chunk.trim();
        if(!entry) continue;
        const eq = entry.indexOf("=");
        if(eq<0){
            out[entry] = true;
            continue;
        }
        const key = entry.slice(0, eq).trim();
        const value = entry.slice(eq + 1).trim();
        if(key) out[key] = __coerceRuntimeLetValue(value);
    }
    return out;
};

const __loadRuntimeLetSource = async (sourcePath:any)=>{
    const rawPath = String(sourcePath ?? "").trim();
    if(!rawPath) return {};
    const resolvedPath = new URL(rawPath, import.meta.url).toString();
    if(__runtimeLetCache.has(resolvedPath)) return __runtimeLetCache.get(resolvedPath);
    const response = await fetch(resolvedPath);
    if(!response.ok) throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");
    let parsed:any = {};
    if(/\.json(?:$|\?)/i.test(rawPath)){
        const json = await response.json();
        if(Array.isArray(json)) parsed = __mergeRuntimeLetArray(json);
        else if(json && typeof json === "object") parsed = json;
        else parsed = { __array: json };
    }else{
        parsed = __parseRuntimeLetText(await response.text());
    }
    __runtimeLetCache.set(resolvedPath, parsed);
    return parsed;
};
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
var tauFDegrees = [0,1,2,3];
var tauSDegrees = [0];
var tauPolyExpr = (deg)=>deg<0?"0.0":deg===0?"1.0":deg===1?"x":Array(deg).fill("x").join("*");
var tauFTerms = tauFDegrees.length;
var tauSTerms = tauSDegrees.length;
var tauTotalTerms = tauFTerms+tauSTerms;
var tauBasisBody = (degrees)=>degrees.map((d,i)=>"if(termIdx=="+i+") return "+tauPolyExpr(d)+";").join(" ");
if(tauTotalTerms>8) throw new Error("tauTotalTerms debe ser <= 8 con el empaquetado actual (dos RGBA).");
var TauFloatTex = {
    format: (TexExamples as any).RGBAFloat16,
    filter_min: "NEAREST",
    filter_mag: "NEAREST",
    wrap_S: "CLAMP",
    wrap_T: "CLAMP"
};
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var progTauMom = WebGLMan.program(-1, "tau/01_moments/1_tauMaxVeces");
lastUsedProgram = progTauMom;
var tauMom = progTauMom;
await tauMom.loadProgram(tauMom.vertPath, tauMom.fragPath, __makeTranspiledShaderFilter("vert", tauMom.vertPath), __makeTranspiledShaderFilter("frag", tauMom.fragPath));
await tauMom.use?.();
lastUsedProgram = tauMom;
tauMom.createVAO().bind();
var extC2 = gl.getExtension("EXT_color_buffer_float");
if(!extC2){
console.log("EXT_color_buffer_float no soportado en C2");
}
var xTex = tauMom.createTexture2D("datosX1", [NMuestras1,1], TexExamples.RFloat, tauSignalData, ["NEAREST","NEAREST","CLAMP","CLAMP"], "TexUnit10");
var yTex = tauMom.createTexture2D("datosY1", [NMuestras1,1], TexExamples.RFloat, datosY1, ["NEAREST","NEAREST","CLAMP","CLAMP"], "TexUnit11");
var tauMom1 = tauMom.createTexture2D("tauMom1", [nBins,tauMaxVeces*tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], "TexUnit14");
var tauMom2 = tauMom.createTexture2D("tauMom2", [nBins,tauMaxVeces*tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], "TexUnit15");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauXi = WebGLMan.program(-1, "tau/02_ls/1_tauXiLS");
await tauXi.loadProgram(tauXi.vertPath, tauXi.fragPath, __makeTranspiledShaderFilter("vert", tauXi.vertPath), __makeTranspiledShaderFilter("frag", tauXi.fragPath));
await tauXi.use?.();
lastUsedProgram = tauXi;
tauXi.createVAO().bind();
var tauXiF = tauXi.createTexture2D("tauXiF", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit12");
var tauXiS = tauXi.createTexture2D("tauXiS", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit13");
var tauXiMeta = tauXi.createTexture2D("tauXiMeta", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit16");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauAFP = WebGLMan.program(-1, "tau/03_afp/1_tauAFP0");
await tauAFP.loadProgram(tauAFP.vertPath, tauAFP.fragPath, __makeTranspiledShaderFilter("vert", tauAFP.vertPath), __makeTranspiledShaderFilter("frag", tauAFP.fragPath));
await tauAFP.use?.();
lastUsedProgram = tauAFP;
tauAFP.createVAO().bind();
var tauXiFOpt = tauAFP.createTexture2D("tauXiFOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit18");
var tauXiSOpt = tauAFP.createTexture2D("tauXiSOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit19");
var tauXiMetaOpt = tauAFP.createTexture2D("tauXiMetaOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit20");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauAFPOpt = WebGLMan.program(-1, "tau/03_afp/2_tauAFPOpt");
await tauAFPOpt.loadProgram(tauAFPOpt.vertPath, tauAFPOpt.fragPath, __makeTranspiledShaderFilter("vert", tauAFPOpt.vertPath), __makeTranspiledShaderFilter("frag", tauAFPOpt.fragPath));
await tauAFPOpt.use?.();
lastUsedProgram = tauAFPOpt;
tauAFPOpt.createVAO().bind();
var tauXiFFinal = tauAFPOpt.createTexture2D("tauXiFFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit25");
var tauXiSFinal = tauAFPOpt.createTexture2D("tauXiSFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit26");
var tauXiMetaFinal = tauAFPOpt.createTexture2D("tauXiMetaFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit27");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauStats = WebGLMan.program(-1, "tau/04_stats_mask/1_tauModelStats");
await tauStats.loadProgram(tauStats.vertPath, tauStats.fragPath, __makeTranspiledShaderFilter("vert", tauStats.vertPath), __makeTranspiledShaderFilter("frag", tauStats.fragPath));
await tauStats.use?.();
lastUsedProgram = tauStats;
tauStats.createVAO().bind();
var tauStatsTex = tauStats.createTexture2D("tauStats", [1, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit21");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauMask = WebGLMan.program(-1, "tau/04_stats_mask/2_tauModelMask");
await tauMask.loadProgram(tauMask.vertPath, tauMask.fragPath, __makeTranspiledShaderFilter("vert", tauMask.vertPath), __makeTranspiledShaderFilter("frag", tauMask.fragPath));
await tauMask.use?.();
lastUsedProgram = tauMask;
tauMask.createVAO().bind();
var tauMaskTex = tauMask.createTexture2D("tauMask", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit22");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauFP = WebGLMan.program(-1, "tau/05_filters/1_tauFPProxy");
await tauFP.loadProgram(tauFP.vertPath, tauFP.fragPath, __makeTranspiledShaderFilter("vert", tauFP.vertPath), __makeTranspiledShaderFilter("frag", tauFP.fragPath));
await tauFP.use?.();
lastUsedProgram = tauFP;
tauFP.createVAO().bind();
var tauFPTex = tauFP.createTexture2D("tauFP", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit23");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauKL = WebGLMan.program(-1, "tau/05_filters/2_tauModelKL");
await tauKL.loadProgram(tauKL.vertPath, tauKL.fragPath, __makeTranspiledShaderFilter("vert", tauKL.vertPath), __makeTranspiledShaderFilter("frag", tauKL.fragPath));
await tauKL.use?.();
lastUsedProgram = tauKL;
tauKL.createVAO().bind();
var tauKLTex = tauKL.createTexture2D("tauKL", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit28");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauScore = WebGLMan.program(-1, "tau/05_filters/3_tauModelScore");
await tauScore.loadProgram(tauScore.vertPath, tauScore.fragPath, __makeTranspiledShaderFilter("vert", tauScore.vertPath), __makeTranspiledShaderFilter("frag", tauScore.fragPath));
await tauScore.use?.();
lastUsedProgram = tauScore;
tauScore.createVAO().bind();
var tauScoreTex = tauScore.createTexture2D("tauScore", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit29");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauBest = WebGLMan.program(-1, "tau/06_select/1_tauBestModel");
await tauBest.loadProgram(tauBest.vertPath, tauBest.fragPath, __makeTranspiledShaderFilter("vert", tauBest.vertPath), __makeTranspiledShaderFilter("frag", tauBest.fragPath));
await tauBest.use?.();
lastUsedProgram = tauBest;
tauBest.createVAO().bind();
var tauBestTex = tauBest.createTexture2D("tauBest", [1, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit17");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauSindy = WebGLMan.program(-1, "tau/07_fields/1_tauSindyFields");
await tauSindy.loadProgram(tauSindy.vertPath, tauSindy.fragPath, __makeTranspiledShaderFilter("vert", tauSindy.vertPath), __makeTranspiledShaderFilter("frag", tauSindy.fragPath));
await tauSindy.use?.();
lastUsedProgram = tauSindy;
tauSindy.createVAO().bind();
var tauSindyTex = tauSindy.createTexture2D("tauSindy", [nBins, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit30");
var tauSindyInitTex = tauSindy.createTexture2D("tauSindyInit", [nBins, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit31");
var tauSindyTau1RefTex = tauSindy.createTexture2D("tauSindyTau1Ref", [nBins, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit9");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var tauFPStat = WebGLMan.program(-1, "tau/07_fields/2_tauFPStationary");
await tauFPStat.loadProgram(tauFPStat.vertPath, tauFPStat.fragPath, __makeTranspiledShaderFilter("vert", tauFPStat.vertPath), __makeTranspiledShaderFilter("frag", tauFPStat.fragPath));
await tauFPStat.use?.();
lastUsedProgram = tauFPStat;
tauFPStat.createVAO().bind();
var tauFPStatTex = tauFPStat.createTexture2D("tauFPStat", [nBins, 1], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit24");
if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
var drawTau = WebGLMan.program(-1, "tau/08_draw/1_drawTauMaxVeces");
await drawTau.loadProgram(drawTau.vertPath, drawTau.fragPath, __makeTranspiledShaderFilter("vert", drawTau.vertPath), __makeTranspiledShaderFilter("frag", drawTau.fragPath));
await drawTau.use?.();
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
drawTau.use?.();
drawTau.uNum("tauMax", false, false).set((tauMaxVeces));
drawTau.use?.();
drawTau.uNum("tauMin", false, false).set((tauMinVeces));
drawTau.use?.();
drawTau.uNum("nBins", false, false).set((nBins));
drawTau.use?.();
drawTau.uNum("bestTau", false, false).set((bestTau));
drawTau.use?.();
drawTau.uNum("bestSubseq", false, false).set((bestSubseq));
drawTau.use?.();
drawTau.uNum("showTauCurves", false, false).set((!!showTauCurves?1:0));
drawTau.use?.();
drawTau.uNum("showFPStationary", false, false).set((!!showFPStationary?1:0));
drawTau.use?.();
drawTau.uNum("showLSOverlay", false, false).set((!!showLSFOverlay?1:0));
drawTau.isDepthTest=false;
var __globalBlockFn_0 = async (dt)=>{ // tick
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestSubseq>=bestTau){
    bestSubseq = (Math.max(0,bestTau-1));
    }
    if(recomputeTau){
    console.log("C2 recomputeTau=true -> s1 tauMaxVeces + s2 tauXiLS + s2.5 tauAFP0 + s2.6 tauAFPOpt + s2.7 stats/mask + s2.8 fpProxy + s2.9 modelKL/score + s3 bestModel + s4 sindy + s4.5 fpStationary");
    await tauMom.use?.();
    lastUsedProgram = tauMom;
    tauMom.use?.();
    tauMom.uNum("nSamples", false, false).set((NMuestras1));
    tauMom.use?.();
    tauMom.uNum("tauMax", false, false).set((tauMaxVeces));
    tauMom.use?.();
    tauMom.uNum("tauMin", false, false).set((tauMinVeces));
    tauMom.use?.();
    tauMom.uNum("nBins", false, false).set((nBins));
    tauMom.use?.();
    tauMom.uNum("dtSample", true, false).set((dtSample));
    tauMom.use?.();
    tauMom.uNum("tauEStar", true, false).set((tauEStar));
    tauMom.bindTexName2TexUnit("datosX1", "TexUnit10");
    var tauMomFBO = tauMom.cFrameBuffer().bind(["ColAtch0","ColAtch1"]);
    tauMomFBO.bindColorBuffer(tauMom1, "ColAtch0");
    tauMomFBO.bindColorBuffer(tauMom2, "ColAtch1");
    tauMom.setViewport(0,0,nBins,tauMaxVeces*tauMaxVeces);
    tauMom.drawArrays("TRIANGLES",0,6);
    await tauXi.use?.();
    lastUsedProgram = tauXi;
    tauXi.use?.();
    tauXi.uNum("tauMax", false, false).set((tauMaxVeces));
    tauXi.use?.();
    tauXi.uNum("tauMin", false, false).set((tauMinVeces));
    tauXi.use?.();
    tauXi.uNum("nBins", false, false).set((nBins));
    tauXi.bindTexName2TexUnit("tauMom1", "TexUnit14");
    tauXi.bindTexName2TexUnit("tauMom2", "TexUnit15");
    var tauXiFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
    tauXiFBO.bindColorBuffer(tauXiF, "ColAtch0");
    tauXiFBO.bindColorBuffer(tauXiS, "ColAtch1");
    tauXiFBO.bindColorBuffer(tauXiMeta, "ColAtch2");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauAFP.use?.();
    lastUsedProgram = tauAFP;
    tauAFP.use?.();
    tauAFP.uNum("tauMax", false, false).set((tauMaxVeces));
    tauAFP.use?.();
    tauAFP.uNum("tauMin", false, false).set((tauMinVeces));
    tauAFP.use?.();
    tauAFP.uNum("nBins", false, false).set((nBins));
    tauAFP.use?.();
    tauAFP.uNum("lrF", true, false).set((afpLrF));
    tauAFP.use?.();
    tauAFP.uNum("lrS", true, false).set((afpLrS));
    tauAFP.use?.();
    tauAFP.uNum("l1F", true, false).set((afpL1F));
    tauAFP.use?.();
    tauAFP.uNum("l1S", true, false).set((afpL1S));
    tauAFP.use?.();
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
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauAFPOpt.use?.();
    lastUsedProgram = tauAFPOpt;
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("tauMax", false, false).set((tauMaxVeces));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("tauMin", false, false).set((tauMinVeces));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("nBins", false, false).set((nBins));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("lrF", true, false).set((afpOptLrF));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("lrS", true, false).set((afpOptLrS));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("l1F", true, false).set((afpOptL1F));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("l1S", true, false).set((afpOptL1S));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("l2F", true, false).set((afpOptL2F));
    tauAFPOpt.use?.();
    tauAFPOpt.uNum("l2S", true, false).set((afpOptL2S));
    tauAFPOpt.use?.();
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
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauStats.use?.();
    lastUsedProgram = tauStats;
    tauStats.use?.();
    tauStats.uNum("tauMax", false, false).set((tauMaxVeces));
    tauStats.use?.();
    tauStats.uNum("tauMin", false, false).set((tauMinVeces));
    tauStats.use?.();
    tauStats.uNum("keepPercent", true, false).set((keepTopPercent));
    tauStats.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    var tauStatsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauStatsFBO.bindColorBuffer(tauStatsTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,1,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauMask.use?.();
    lastUsedProgram = tauMask;
    tauMask.use?.();
    tauMask.uNum("tauMax", false, false).set((tauMaxVeces));
    tauMask.use?.();
    tauMask.uNum("tauMin", false, false).set((tauMinVeces));
    tauMask.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    tauMask.bindTexName2TexUnit("tauStats", "TexUnit21");
    var tauMaskFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauMaskFBO.bindColorBuffer(tauMaskTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauFP.use?.();
    lastUsedProgram = tauFP;
    tauFP.use?.();
    tauFP.uNum("tauMax", false, false).set((tauMaxVeces));
    tauFP.use?.();
    tauFP.uNum("tauMin", false, false).set((tauMinVeces));
    tauFP.use?.();
    tauFP.uNum("nBins", false, false).set((nBins));
    tauFP.use?.();
    tauFP.uNum("logSpanMax", true, false).set((fpLogSpanMax));
    tauFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
    tauFP.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
    tauFP.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
    tauFP.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    tauFP.bindTexName2TexUnit("tauModelMask", "TexUnit22");
    var tauFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauFPFBO.bindColorBuffer(tauFPTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauKL.use?.();
    lastUsedProgram = tauKL;
    tauKL.use?.();
    tauKL.uNum("tauMax", false, false).set((tauMaxVeces));
    tauKL.use?.();
    tauKL.uNum("tauMin", false, false).set((tauMinVeces));
    tauKL.use?.();
    tauKL.uNum("nBins", false, false).set((nBins));
    tauKL.use?.();
    tauKL.uNum("spanMax", true, false).set((modelKLSpanMax));
    tauKL.bindTexName2TexUnit("tauMom1", "TexUnit14");
    tauKL.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
    tauKL.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
    tauKL.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    var tauKLFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauKLFBO.bindColorBuffer(tauKLTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauScore.use?.();
    lastUsedProgram = tauScore;
    tauScore.use?.();
    tauScore.uNum("tauMax", false, false).set((tauMaxVeces));
    tauScore.use?.();
    tauScore.uNum("tauMin", false, false).set((tauMinVeces));
    tauScore.use?.();
    tauScore.uNum("wCost", true, false).set((scoreWCost));
    tauScore.use?.();
    tauScore.uNum("wKL", true, false).set((scoreWKL));
    tauScore.use?.();
    tauScore.uNum("wSpan", true, false).set((scoreWSpan));
    tauScore.use?.();
    tauScore.uNum("klMax", true, false).set((scoreKLMax));
    tauScore.use?.();
    tauScore.uNum("scoreMax", true, false).set((scoreMaxCut));
    tauScore.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    tauScore.bindTexName2TexUnit("tauModelMask", "TexUnit22");
    tauScore.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
    tauScore.bindTexName2TexUnit("tauModelKL", "TexUnit28");
    tauScore.bindTexName2TexUnit("tauStats", "TexUnit21");
    var tauScoreFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauScoreFBO.bindColorBuffer(tauScoreTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,tauMaxVeces,tauMaxVeces]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauBest.use?.();
    lastUsedProgram = tauBest;
    tauBest.use?.();
    tauBest.uNum("tauMax", false, false).set((tauMaxVeces));
    tauBest.use?.();
    tauBest.uNum("tauMin", false, false).set((tauMinVeces));
    tauBest.use?.();
    tauBest.uNum("useMask", false, false).set(1);
    tauBest.use?.();
    tauBest.uNum("useFP", false, false).set((!!useFPFilter?1:0));
    tauBest.use?.();
    tauBest.uNum("useScore", false, false).set((!!useScoreSelection?1:0));
    tauBest.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    tauBest.bindTexName2TexUnit("tauModelMask", "TexUnit22");
    tauBest.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
    tauBest.bindTexName2TexUnit("tauModelScore", "TexUnit29");
    var tauBestFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauBestFBO.bindColorBuffer(tauBestTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,1,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauSindy.use?.();
    lastUsedProgram = tauSindy;
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestSubseq>=bestTau){
    bestSubseq = (Math.max(0,bestTau-1));
    }
    tauSindy.use?.();
    tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
    tauSindy.use?.();
    tauSindy.uNum("nBins", false, false).set((nBins));
    tauSindy.use?.();
    tauSindy.uNum("selectedTau", false, false).set((bestTau));
    tauSindy.use?.();
    tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
    tauSindy.use?.();
    tauSindy.uNum("useSelected", false, false).set(1);
    tauSindy.bindTexName2TexUnit("tauMom1", "TexUnit14");
    tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit18");
    tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit19");
    tauSindy.bindTexName2TexUnit("tauBest", "TexUnit17");
    var tauSindyInitFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauSindyInitFBO.bindColorBuffer(tauSindyInitTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,nBins,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    tauSindy.use?.();
    tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
    tauSindy.use?.();
    tauSindy.uNum("nBins", false, false).set((nBins));
    tauSindy.use?.();
    tauSindy.uNum("selectedTau", false, false).set(1);
    tauSindy.use?.();
    tauSindy.uNum("selectedSubseq", false, false).set(0);
    tauSindy.use?.();
    tauSindy.uNum("useSelected", false, false).set(1);
    var tauSindyTau1RefFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauSindyTau1RefFBO.bindColorBuffer(tauSindyTau1RefTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,nBins,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    tauSindy.use?.();
    tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
    tauSindy.use?.();
    tauSindy.uNum("nBins", false, false).set((nBins));
    tauSindy.use?.();
    tauSindy.uNum("selectedTau", false, false).set((bestTau));
    tauSindy.use?.();
    tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
    tauSindy.use?.();
    tauSindy.uNum("useSelected", false, false).set(1);
    tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit25");
    tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit26");
    var tauSindyFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    tauSindyFBO.bindColorBuffer(tauSindyTex, "ColAtch0");
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,nBins,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    await tauFPStat.use?.();
    lastUsedProgram = tauFPStat;
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestSubseq>=bestTau){
    bestSubseq = (Math.max(0,bestTau-1));
    }
    tauFPStat.use?.();
    tauFPStat.uNum("tauMax", false, false).set((tauMaxVeces));
    tauFPStat.use?.();
    tauFPStat.uNum("tauMin", false, false).set((tauMinVeces));
    tauFPStat.use?.();
    tauFPStat.uNum("nBins", false, false).set((nBins));
    tauFPStat.use?.();
    tauFPStat.uNum("selectedTau", false, false).set((bestTau));
    tauFPStat.use?.();
    tauFPStat.uNum("selectedSubseq", false, false).set((bestSubseq));
    tauFPStat.use?.();
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
    lastUsedProgram?.use?.();
    lastUsedProgram?.setViewport(...[0,0,nBins,1]);
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    if(tauDebugFrames>0){
    var statsSample = (tauStatsFBO.readColorAttachment(0,0,0,1,1,TexExamples.RGBAFloat16,4));
    var bestSample = (tauBestFBO.readColorAttachment(0,0,0,1,1,TexExamples.RGBAFloat16,4));
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
    if(autoPickBest){
    bestTau = (Math.max(tauMinVeces,~~(bestArr[0]||1)));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~(bestArr[1]||0)));
    }
    if(logTopModels){
    var bestX = (Math.max(0,bestTau-1));
    var bestY = (Math.max(0,bestSubseq));
    var bestXiF = (tauAFPOptFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4));
    var bestXiS = (tauAFPOptFBO.readColorAttachment(1,bestX,bestY,1,1,TexExamples.RGBAFloat16,4));
    var bestXiMeta = (tauAFPOptFBO.readColorAttachment(2,bestX,bestY,1,1,TexExamples.RGBAFloat16,4));
    var bestKL = (tauKLFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4));
    var bestScore = (tauScoreFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4));
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
};
__globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
var __globalBlockFn_1 = async (dt)=>{ // drawTauPanel
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestSubseq>=bestTau){
    bestSubseq = (Math.max(0,bestTau-1));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    await drawTau.use?.();
    lastUsedProgram = drawTau;
    drawTau.VAO.bind();
    drawTau.use?.();
    drawTau.setViewport(...([0,0,canvas.width,canvas.height]));
    if(useLSView){
    drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit16");
    } else {
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
    drawTau.uniforms.showTauCurves.set((!!showTauCurves?1:0));
    drawTau.uniforms.showFPStationary.set((!!showFPStationary?1:0));
    drawTau.uniforms.showLSOverlay.set((!!showLSFOverlay?1:0));
    if(c2DrawLogFrames>0){
    console.log("C2 drawTauPanel", (bestTau), (bestSubseq), (gl.getParameter(gl.FRAMEBUFFER_BINDING)));
    c2DrawLogFrames -= 1;
    }
    drawTau.drawArrays("TRIANGLES",0,6);
    if(typeof __drawTauHud==="function"){
    __drawTauHud();
    }
    // </block drawTauPanel>
};
__globalBlocks.push({ priority: 20, order: 1, fn: __globalBlockFn_1 });
KeyManager.OnPress("u", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    recomputeTau = true;
});
KeyManager.OnPress("q", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    useLSView = (!useLSView);
});
KeyManager.OnPress("e", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    autoPickBest = (!autoPickBest);
    recomputeTau = true;
});
KeyManager.OnPress("n", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    keepTopPercent = (Math.min(80,keepTopPercent+5));
    recomputeTau = true;
});
KeyManager.OnPress("i", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    keepTopPercent = (Math.max(5,keepTopPercent-5));
    recomputeTau = true;
});
KeyManager.OnPress("j", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showMSDOverlay = (!showMSDOverlay);
});
KeyManager.OnPress("f", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    useFPFilter = (!useFPFilter);
    recomputeTau = true;
});
KeyManager.OnPress("t", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showTauCurves = (!showTauCurves);
});
KeyManager.OnPress("b", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showRawKMOverlay = (!showRawKMOverlay);
});
KeyManager.OnPress("m", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showLSFOverlay = (!showLSFOverlay);
});
KeyManager.OnPress("r", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showFPStationary = (!showFPStationary);
});
KeyManager.OnPress("o", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    useScoreSelection = (!useScoreSelection);
    recomputeTau = true;
});
KeyManager.OnPress("l", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    showMSDScoreMap = (!showMSDScoreMap);
});
KeyManager.OnPress("x", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    autoPickBest = false;
    var prevTauX = (bestTau);
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    var wasOutX = (bestTau<tauMinVeces || bestTau>tauMaxVeces);
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(!wasOutX){
    bestTau = (Math.min(bestTau+1,tauMaxVeces));
    }
    if(bestTau==prevTauX){
    console.log("C2 x: limite superior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
    }
    if(bestSubseq>=bestTau){
    bestSubseq = (bestTau-1);
    }
    bestSubseq = (Math.max(0,~~bestSubseq));
    recomputeTau = true;
});
KeyManager.OnPress("z", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    autoPickBest = false;
    var prevTauZ = (bestTau);
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    var wasOutZ = (bestTau<tauMinVeces || bestTau>tauMaxVeces);
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(!wasOutZ){
    bestTau = (Math.max(bestTau-1,tauMinVeces));
    }
    if(bestTau==prevTauZ){
    console.log("C2 z: limite inferior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
    }
    if(bestSubseq>=bestTau){
    bestSubseq = (bestTau-1);
    }
    bestSubseq = (Math.max(0,~~bestSubseq));
    recomputeTau = true;
});
KeyManager.OnPress("v", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestTau>1){
    autoPickBest = false;
    bestSubseq = ((bestSubseq+1)%bestTau);
    bestSubseq = (Math.max(0,~~bestSubseq));
    recomputeTau = true;
    }
});
KeyManager.OnPress("c", async (e)=>{ // OnKeyPress
if((e as any)?.repeat) return;
    tauMinVeces = (Math.max(1,~~tauMinVeces));
    tauMaxVeces = (Math.max(tauMinVeces,~~tauMaxVeces));
    bestTau = (Math.max(tauMinVeces,~~bestTau));
    bestTau = (Math.min(bestTau,tauMaxVeces));
    bestSubseq = (Math.max(0,~~bestSubseq));
    if(bestTau>1){
    autoPickBest = false;
    bestSubseq = ((bestSubseq-1+bestTau)%bestTau);
    bestSubseq = (Math.max(0,~~bestSubseq));
    recomputeTau = true;
    } else {
    console.log("C2 c: tau actual no tiene subsecuencias", (bestTau));
    }
});
if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);
start();
//<Pos>
//</Pos>
