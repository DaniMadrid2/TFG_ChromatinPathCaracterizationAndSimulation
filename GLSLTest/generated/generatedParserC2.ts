import { __mountGlobalBlocks } from "/Code/opengl/opengl.js";
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


// @ts-nocheck

//<Pre>
(async () => {
  const canvas = document.getElementById("trajectory-c2") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing trajectory canvas for c2");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is required");
  if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("RG32F render targets are not supported");
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);

let trajectory: number[] = [
  [0.07, 0.19], [0.15, 0.30], [0.23, 0.22], [0.31, 0.49],
  [0.40, 0.41], [0.50, 0.64], [0.61, 0.55], [0.72, 0.77],
  [0.84, 0.68], [0.94, 0.87],
].flat();



const lastPoint = trajectory.slice(-2);
const firstPoint = trajectory.slice(0, 2);
for (let i = 1; i <= 300; i++) {
  const t = i / 300;
  const x = lastPoint[0] * (1 - t) + firstPoint[0] * t;
  const y = lastPoint[1] * (1 - t) + firstPoint[1] * t;
  trajectory.push(x, y);
}

//</Pre>
var lastUsedProgram: any = null;
var lastFillerProgram: any = null;
void lastFillerProgram;
var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];
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
const __backupBaseUrl = "/api/backups";
const __backupDefaultScope = "parseTextC2";
const __backupPad2 = (n:any)=>String(n).padStart(2, "0");
const __backupStamp = ()=>{
    const d = new Date();
    return String(d.getFullYear()) + __backupPad2(d.getMonth()+1) + __backupPad2(d.getDate()) + __backupPad2(d.getHours()) + __backupPad2(d.getMinutes());
};
const __backupSafeName = (name:any)=>String(name ?? "backup").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "") || "backup";
const __backupDefaultPath = (value:any, varName:any)=>{
    const isTex = value && typeof value === "object" && ("w" in value || "h" in value || "unit" in value || value instanceof WebGLTexture);
    const parts = [__backupSafeName(varName)];
    if(isTex){
        parts.push(String(value.w ?? value.width ?? "x"));
        parts.push(String(value.h ?? value.height ?? "y"));
        parts.push("TexUnit" + String(value.unit ?? "NA").replace(/^TexUnit/i, ""));
        parts.push(__backupSafeName(value.__backupProgram ?? value.programName ?? value.program ?? "programNA"));
    }
    parts.push(__backupStamp());
    return parts.join("_") + ".txt";
};
const __backupTexturePreview = (tex:any, varName:any)=>{
    if(!tex || tex.__backupType !== "texture2D") return "";
    const w = Number(tex.w ?? 0) || 0;
    const h = Number(tex.h ?? 0) || 0;
    const dim = Number(tex.dim ?? 1) || 1;
    const name = String(varName ?? "texture");
    const program = String(tex.program ?? "programNA");
    const values = Array.isArray(tex.data) ? tex.data : [];
    const formatScalar = (value:any)=>{
        const num = Number(value);
        if(!Number.isFinite(num)) return String(value ?? "").padStart(10, " ");
        return num.toFixed(4).padStart(10, " ");
    };
    const lines = [name + " [" + w + " x " + h + "] " + program];
    for(let y = 0; y < h; y++){
        const row:string[] = [];
        for(let x = 0; x < w; x++){
            const base = (y * w + x) * dim;
            for(let c = 0; c < dim; c++){
                row.push(formatScalar(values[base + c]));
            }
        }
        lines.push(row.join(" "));
    }
    return lines.join("\n");
};
const __backupNormalizeScopePath = (pathHint:any)=>{
    const raw = String(pathHint ?? "").trim().replace(/\\/g, "/");
    const scope = String(__backupDefaultScope || "").replace(/^\/+|\/+$/g, "");
    const withScope = (value:string)=>{
        const clean = String(value || "").replace(/^\/+/, "");
        if(!scope) return clean;
        if(!clean) return scope;
        if(clean === scope || clean.startsWith(scope + "/")) return clean;
        return scope + "/" + clean;
    };
    if(!raw || raw === "/" || raw === ".") return { path: withScope(""), directoryMode: true };
    if(raw.startsWith("./")){
        const rest = raw.slice(2);
        return { path: withScope(rest), directoryMode: !rest || /\/$/.test(rest) };
    }
    if(raw.startsWith("/")) return { path: withScope(raw.slice(1)), directoryMode: true };
    return { path: withScope(raw), directoryMode: true };
};
const __backupReadTexture2D = (tex:any)=>{
    if(!tex || typeof tex !== "object" || !(tex instanceof WebGLTexture)) return null;
    const w = Number(tex.w ?? tex.width ?? 1) || 1;
    const h = Number(tex.h ?? tex.height ?? 1) || 1;
    const format = tex.format || (TexExamples as any).RGBAFloat;
    const dim = format?.[0] === gl.RED ? 1 : format?.[0] === gl.RG ? 2 : format?.[0] === gl.RGB ? 3 : 4;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    const data = new Float32Array(w * h * dim);
    gl.readPixels(0, 0, w, h, format[0], format[2], data);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    return { __backupType: "texture2D", w, h, dim, format: Array.from(format || []), unit: tex.unit, program: tex.__backupProgram, data: Array.from(data) };
};
const __backupSerializeValue = (value:any, varName:any)=>{
    const tex = __backupReadTexture2D(value);
    if(tex){
        const jsonLine = JSON.stringify({ varName, savedAt: new Date().toISOString(), value: tex });
        return __backupTexturePreview(tex, varName) + "\n" + jsonLine;
    }
    if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){
        return JSON.stringify({ varName, savedAt: new Date().toISOString(), value: { __backupType: value.constructor.name, data: Array.from(value) } });
    }
    try { return JSON.stringify({ varName, savedAt: new Date().toISOString(), value }); }
    catch { return String(value); }
};
const __backupNormalizeValue = (value:any, varName:any)=>{
    const tex = __backupReadTexture2D(value);
    if(tex) return { varName, value: tex };
    if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){
        return { varName, value: { __backupType: value.constructor.name, data: Array.from(value) } };
    }
    return { varName, value };
};
const __backupPut = async (route:string, path:any, content:any, extra:any={})=>{
    const response = await fetch(__backupBaseUrl + route, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content, ...extra })
    });
    const raw = await response.text();
    if(!response.ok) throw new Error("Backup request failed: " + response.status + " " + raw);
    try { return raw ? JSON.parse(raw) : { ok: true, path: String(path ?? "") }; }
    catch { return { ok: true, path: String(path ?? ""), raw }; }
};
const __backupStore = async (value:any, varName:any, pathHint?:any)=>{
    try {
        const target = __backupNormalizeScopePath(pathHint);
        const result = await __backupPut("/file", target.path, __backupSerializeValue(value, varName), target.directoryMode ? { directoryMode: true, suggestedName: __backupDefaultPath(value, varName) } : {});
        console.log("[backUp store]", result.path);
        return result;
    } catch (err) {
        console.error("[backUp store] failed", err);
        return { ok: false, error: String(err) };
    }
};
const __backupFetchText = async (pathHint:any)=>{
    const target = __backupNormalizeScopePath(pathHint);
    const response = await fetch(__backupBaseUrl + "/file?path=" + encodeURIComponent(target.path));
    if(!response.ok) throw new Error("Backup restore failed: " + response.status + " " + await response.text());
    return await response.text();
};
const __backupDecodeValue = (text:string)=>{
    try {
        const lines = String(text ?? "").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
        const jsonLine = lines.length ? lines[lines.length - 1] : "";
        const parsed = JSON.parse(jsonLine);
        return parsed && Object.prototype.hasOwnProperty.call(parsed, "value") ? parsed.value : parsed;
    } catch {
        const nums = text.trim().split(/[\s,;]+/).map(Number).filter(Number.isFinite);
        return nums.length ? new Float32Array(nums) : text;
    }
};
const __backupRestoreInto = async (target:any, pathHint:any)=>{
    const value = __backupDecodeValue(await __backupFetchText(pathHint));
    if(target && typeof target.fill === "function" && value?.__backupType === "texture2D"){
        target.fill(new Float32Array(value.data || []), 0, 0, value.w, value.h);
        return target;
    }
    if(value?.__backupType && Array.isArray(value.data)) return new Float32Array(value.data);
    return value;
};
const __backupLog = async (pathHint:any)=>{
    const target = __backupNormalizeScopePath(pathHint);
    const p = target.path;
    const prevLog = console.log.bind(console);
    const prevWarn = console.warn.bind(console);
    const prevError = console.error.bind(console);
    const append = (level:string, args:any[])=>{
        const line = "[" + new Date().toISOString() + "] " + level + " " + args.map(a=>{ try{return typeof a === "string" ? a : JSON.stringify(a);}catch{return String(a);} }).join(" ") + "\n";
        __backupPut("/append", p, line, target.directoryMode ? { directoryMode: true, suggestedName: "log_" + __backupStamp() + ".txt" } : {}).catch(prevError);
    };
    console.log = (...args:any[])=>{ prevLog(...args); append("log", args); };
    console.warn = (...args:any[])=>{ prevWarn(...args); append("warn", args); };
    console.error = (...args:any[])=>{ prevError(...args); append("error", args); };
    console.log("[backUp log]", p);
};
const __backupDrawGenerationState = { stamp: Symbol("init"), counts: new Map<string, number>(), clearedScopes: new Set<string>() };
const __backupRefreshGenerationState = ()=>{
    try {
        if(typeof recomputeTau === "undefined" || !recomputeTau) return;
        const stamp = (typeof tauModelStamp !== "undefined") ? tauModelStamp : "__recompute__";
        if(__backupDrawGenerationState.stamp !== stamp){
            __backupDrawGenerationState.stamp = stamp;
            __backupDrawGenerationState.counts = new Map<string, number>();
            __backupDrawGenerationState.clearedScopes = new Set<string>();
        }
    } catch {}
};
const __backupClearDrawScopeGenerationsIfNeeded = async (pathHint:any)=>{
    __backupRefreshGenerationState();
    try {
        if(typeof recomputeTau === "undefined" || !recomputeTau) return;
        const target = __backupNormalizeScopePath(pathHint);
        const key = String(target.path || "");
        if(__backupDrawGenerationState.clearedScopes.has(key)) return;
        __backupDrawGenerationState.clearedScopes.add(key);
        await __backupPut("/clear-generations", target.path, "");
    } catch (err) {
        console.warn("[backUp clear-generations] failed", pathHint, err);
    }
};
const __backupNextDrawGeneration = (drawKind:any, pathHint:any, program:any)=>{
    __backupRefreshGenerationState();
    try {
        if(typeof recomputeTau === "undefined" || !recomputeTau) return 1;
        const target = __backupNormalizeScopePath(pathHint);
        const drawName = __backupSafeName(drawKind || "draw");
        const programName = __backupSafeName(program?.ID ?? program?.fragPath ?? program?.name ?? "program");
        const key = target.path + "::" + programName + "::" + drawName;
        const next = (__backupDrawGenerationState.counts.get(key) || 0) + 1;
        __backupDrawGenerationState.counts.set(key, next);
        return next;
    } catch {
        return 1;
    }
};
const __backupResolveMultiTarget = (pathHint:any, defaultStem:any, suffix:any, generation:any=1)=>{
    const target = __backupNormalizeScopePath(pathHint);
    const stem = __backupSafeName(defaultStem);
    const cleanSuffix = String(suffix ?? "").replace(/^_+/, "");
    const fileName = stem + "_" + cleanSuffix + "_" + __backupStamp() + ".txt";
    const gen = Math.max(1, Number(generation) || 1);
    if(target.directoryMode){
        const dirPath = gen > 1 ? (target.path ? String(target.path).replace(/\/+$/g, "") + "/" + String(gen) : String(gen)) : target.path;
        return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };
    }
    const p = target.path;
    if(/\.txt$/i.test(p)){
        const slash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
        const dir = slash >= 0 ? p.slice(0, slash + 1) : "";
        const base = slash >= 0 ? p.slice(slash + 1) : p;
        const dot = base.toLowerCase().endsWith(".txt") ? base.slice(0, -4) : base;
        const genDir = gen > 1 ? (dir ? dir.replace(/\/+$/g, "") + "/" + String(gen) + "/" : String(gen) + "/") : dir;
        return { path: genDir + dot + "_" + cleanSuffix + ".txt", directoryMode: false, generation: gen };
    }
    const dirPath = gen > 1 ? (p ? String(p).replace(/\/+$/g, "") + "/" + String(gen) : String(gen)) : p;
    return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };
};
const __backupStoreDrawBlock = async (drawKind:any, pathHint:any, outputTextures:any[], uniformEntries:any[], program:any)=>{
    try {
        const drawName = __backupSafeName(drawKind || "draw");
        const generation = __backupNextDrawGeneration(drawKind, pathHint, program);
        const outputs = Array.isArray(outputTextures) ? outputTextures.filter(Boolean) : [];
        const outputSet = new Set(outputs.map(item => item?.tex).filter(Boolean));
        const programTextures = Array.isArray(program?.textures) ? program.textures.filter((tex:any)=>tex && !outputSet.has(tex)) : [];
        const prependedInputs = programTextures.map((tex:any, idx:number)=>__backupNormalizeValue(tex, tex.__backupVarName || tex.__backupUniformName || ("inputTex" + idx)));
        const normalizedUniforms = (Array.isArray(uniformEntries) ? uniformEntries : []).map((entry:any)=>({
            kind: entry?.kind || "uniform",
            name: entry?.name || "uniform",
            ...__backupNormalizeValue(entry?.value, entry?.name || "uniform")
        }));
        const serializedOutputs = outputs.map((output:any)=>{
            const outputName = output?.name || "output";
            try {
                return { outputName, ok: true, payload: __backupSerializeValue(output?.tex, outputName) };
            } catch (err) {
                return {
                    outputName,
                    ok: false,
                    payload: JSON.stringify({
                        varName: outputName,
                        savedAt: new Date().toISOString(),
                        error: String(err)
                    })
                };
            }
        });
        const uniformPayload = JSON.stringify({
            source: drawKind,
            savedAt: new Date().toISOString(),
            entries: [
                ...prependedInputs.map((entry:any)=>({ kind: "programTexture", name: entry.varName, value: entry.value })),
                ...normalizedUniforms
            ]
        });
        await __backupClearDrawScopeGenerationsIfNeeded(pathHint);
        const uniformTarget = __backupResolveMultiTarget(pathHint, drawName, "uniforms", generation);
        await __backupPut("/file", uniformTarget.path, uniformPayload, uniformTarget.directoryMode ? { directoryMode: true, suggestedName: uniformTarget.suggestedName } : {});
        for (const snapshot of serializedOutputs) {
            try {
                const outputTarget = __backupResolveMultiTarget(pathHint, drawName, __backupSafeName(snapshot.outputName), generation);
                await __backupPut("/file", outputTarget.path, snapshot.payload, outputTarget.directoryMode ? { directoryMode: true, suggestedName: outputTarget.suggestedName } : {});
                if(!snapshot.ok){
                    console.warn("[backUp draw] stored output fallback payload", snapshot.outputName, pathHint);
                }
            } catch (err) {
                console.error("[backUp draw] output store failed", snapshot.outputName, pathHint, err);
            }
        }
        return { ok: true };
    } catch (err) {
        console.error("[backUp draw] failed", drawKind, pathHint, err);
        return { ok: false, error: String(err) };
    }
};
let offset = new Vector2D(0, 0);
var demo = webglMan.program(-1, "demo");
await demo.loadProgram(demo.vertPath, demo.fragPath, (source => source), (source => source));
await demo.use?.();
lastUsedProgram = demo;
demo.createVAO().bind();
var TauFloatTex = {
    format: (TexExamples as any).RGFloat,
    filter_min: "NEAREST",
    filter_mag: "NEAREST",
    wrap_S: "CLAMP",
    wrap_T: "CLAMP"
};
var movePoints = webglMan.program(-1, "movePoints");
await movePoints.loadProgram(movePoints.vertPath, movePoints.fragPath, (source => source), (source => source));
await movePoints.use?.();
lastUsedProgram = movePoints;
movePoints.createVAO().bind();
var positionTexture = movePoints.createTexture2D("positionTexture", [1, Math.ceil((trajectory.length) / (((__fmt:any) => [gl.RED, gl.RED_INTEGER].includes(__fmt[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(__fmt[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(__fmt[0]) ? 3 : 4)((TauFloatTex?.format ?? (TexExamples as any).RGBAFloat))))], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), trajectory, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit12");
(positionTexture as any).__backupVarName = "positionTexture";
(positionTexture as any).__backupUniformName = "positionTexture";
(positionTexture as any).__backupProgram = (movePoints as any)?.ID ?? (movePoints as any)?.fragPath ?? "movePoints";
var positionTextureNext = movePoints.createTexture2D("positionTextureNext", [1, Math.ceil((trajectory.length) / (((__fmt:any) => [gl.RED, gl.RED_INTEGER].includes(__fmt[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(__fmt[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(__fmt[0]) ? 3 : 4)((TauFloatTex?.format ?? (TexExamples as any).RGBAFloat))))], (TauFloatTex?.format ?? (TexExamples as any).RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit13");
(positionTextureNext as any).__backupVarName = "positionTextureNext";
(positionTextureNext as any).__backupUniformName = "positionTextureNext";
(positionTextureNext as any).__backupProgram = (movePoints as any)?.ID ?? (movePoints as any)?.fragPath ?? "movePoints";
let movePointsFBO = null;
var __globalBlockFn_0 = async (dt)=>{ // tick
    await movePoints.use?.();
    lastUsedProgram = movePoints;
    lastUsedProgram?.use?.();
    (()=>{ const __sz:any = [1, Math.ceil((trajectory.length) / (((__fmt:any) => [gl.RED, gl.RED_INTEGER].includes(__fmt[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(__fmt[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(__fmt[0]) ? 3 : 4)((positionTextureNext as any).format)))]; lastUsedProgram?.setViewport(0,0,__sz[0],__sz[1]); })();
    movePointsFBO = (typeof movePointsFBO !== "undefined" && movePointsFBO) ? movePointsFBO.bind(["ColAtch0"]) : lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
    movePointsFBO.bindColorBuffer(positionTextureNext, "ColAtch0");
    lastUsedProgram.uNum("dt", true, false).set((dt));
    if(typeof positionTexture !== "undefined" && positionTexture?.bind) positionTexture.bind("TexUnit12");
    lastUsedProgram.bindTexName2TexUnit("positionTexture", "TexUnit12");
    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
    movePoints.unbindFBO();
    await demo.use?.();
    lastUsedProgram = demo;
    lastUsedProgram?.use?.();
    lastUsedProgram.bindVAO();
    lastUsedProgram.bindTexture(positionTextureNext, "positionTextureNext", positionTextureNext.unit);
    (()=>{ const __sz:any = [640,480]; lastUsedProgram?.setViewport(0,0,__sz[0],__sz[1]); })();
    lastUsedProgram.uNum("offsetX", true, false).set((offset.x));
    lastUsedProgram.uNum("offsetY", true, false).set((offset.y));
    lastUsedProgram?.drawArrays("POINTS", 0, positionTextureNext.w * positionTextureNext.h);
    let previousTexture = positionTexture;
    positionTexture = positionTextureNext;
    positionTextureNext = previousTexture;
};
__globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
KeyManager.OnKey("a", async (e)=>{ // OnKey
if((e as any)?.repeat) return;
    offset.x += 0.1;
});
KeyManager.OnKey("d", async (e)=>{ // OnKey
if((e as any)?.repeat) return;
    offset.x -= 0.1;
});
KeyManager.OnKey("w", async (e)=>{ // OnKey
if((e as any)?.repeat) return;
    offset.y -= 0.1;
});
KeyManager.OnKey("s", async (e)=>{ // OnKey
if((e as any)?.repeat) return;
    offset.y += 0.1;
});
keypress.listen();
if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);
start();
//<Pos>
})();
//</Pos>
