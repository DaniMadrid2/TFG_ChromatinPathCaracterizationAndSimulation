// @ts-nocheck
import { __mountGlobalBlocks } from "/Code/opengl/opengl.js";
import { MouseManager, openFullscreen, keypress, mousepos, mouseclick, KeyManager } from "/Code/Game/Game.js";
import { Vector3D } from "/Code/Matrix/Matrix.js";
import { addFunc, start } from "/Code/Start/start.js";
import { createCanvasNextTo } from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js";
import { Camera3D } from "/Code/Game3D/Game3D.js";
import { TexExamples, WebGLMan } from "/Code/WebGL/webglMan.js";
//<Pre>
import { read as readMat } from "/ExternalCode/mat4js/mat4js.read.js";
// Verificar si la consulta de medios se cumple inicialmente
window.DNTIHandleResize();
// Agregar un listener para el evento de resize en window
window.addEventListener('resize', window.DNTIHandleResize);
function isResized(data_id) {
    const lateralDivs = document.querySelectorAll('.dnti-outside [data-id]');
    for (let i = 0; i < lateralDivs.length; i++) {
        let latDiv = lateralDivs[i];
        if (latDiv.getAttribute("data-id") == data_id) {
            if (latDiv.children.length != 0) {
                return false;
            }
        }
    }
    return true;
}
var colors = {
    pcol: [0.0, 0.203, 0.9],
    matrixcolor: [0.229, 0.603, 0.676],
    darkpastelgreen: [0.01, 0.75, 0.24],
    lambdacolor: [0.066, 0.588, 0.749],
    vcolor: [0, 0.95, 0.04]
};
var colorsrgb = {};
var colorsrgbobj = {};
Object.entries(colors).forEach(([key, c]) => {
    colorsrgb[key] = c.map(v => ~~(v * 255));
    colorsrgbobj[key] = { r: colorsrgb[key][0], g: colorsrgb[key][1], b: colorsrgb[key][2] };
});
//Canvas 1
async function __c1Main() {
    let { screen: screen_props, tickPausedButton } = createCanvasNextTo(undefined, "c1", "#F1", { dx: (isResizedCanvas, offx, c) => {
            return isResizedCanvas ? 0 : (100 - offx);
        }, dy: (isrc) => isrc ? 0 : 132, dw: () => 420, dh: () => 280 }, { preserveAspectRatio: true, absolute: false, contexttype: "webgl2" });
    const { ctx, scene: sc, W, H } = screen_props;
    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);
    const gl = ctx;
    const canvas = ctx.canvas;
        const __fsTargetC1=canvas;
    const __baseCanvasW=canvas.width;
    const __baseCanvasH=canvas.height;
    const __baseCanvasStyle={
        position: canvas.style.position || "",
        top: canvas.style.top || "",
        left: canvas.style.left || "",
        width: canvas.style.width || "",
        height: canvas.style.height || "",
        maxWidth: canvas.style.maxWidth || "",
        maxHeight: canvas.style.maxHeight || "",
        zIndex: canvas.style.zIndex || "",
        display: canvas.style.display || ""
    };
    const __baseBodyOverflow=document.body.style.overflow || "";
    const __baseDocOverflow=document.documentElement.style.overflow || "";
    const __applyCanvasFullscreenC1=()=>{
        const isFs=(document.fullscreenElement===__fsTargetC1);
        if(isFs){
            document.body.style.overflow="hidden";
            document.documentElement.style.overflow="hidden";
            canvas.style.position="fixed";
            canvas.style.top="0";
            canvas.style.left="0";
            canvas.style.width="100%";
            canvas.style.height="100%";
            canvas.style.maxWidth="100vw";
            canvas.style.maxHeight="100vh";
            canvas.style.zIndex="999999";
            canvas.style.display="block";
            canvas.width=window.innerWidth;
            canvas.height=window.innerHeight;
        }else{
            document.body.style.overflow=__baseBodyOverflow;
            document.documentElement.style.overflow=__baseDocOverflow;
            canvas.style.position=__baseCanvasStyle.position;
            canvas.style.top=__baseCanvasStyle.top;
            canvas.style.left=__baseCanvasStyle.left;
            canvas.style.width=__baseCanvasStyle.width;
            canvas.style.height=__baseCanvasStyle.height;
            canvas.style.maxWidth=__baseCanvasStyle.maxWidth;
            canvas.style.maxHeight=__baseCanvasStyle.maxHeight;
            canvas.style.zIndex=__baseCanvasStyle.zIndex;
            canvas.style.display=__baseCanvasStyle.display;
            canvas.width=__baseCanvasW;
            canvas.height=__baseCanvasH;
        }
    };
    canvas.addEventListener("dblclick", ()=>{
        if(document.fullscreenElement) document.exitFullscreen?.();
        else openFullscreen(__fsTargetC1);
        setTimeout(__applyCanvasFullscreenC1, 0);
    });
    document.addEventListener("fullscreenchange", __applyCanvasFullscreenC1);
    window.addEventListener("resize", __applyCanvasFullscreenC1);

    const webglMan = new WebGLMan(gl);
    document.addEventListener("DOMContentLoaded", () => {
        ctx.canvas.recheckVisible?.();
        ;
    });
    document.addEventListener("scroll", () => ctx.canvas.recheckVisible?.());
    const __applyFullscreenLayout = () => {
        const isFs = !!document.fullscreenElement;
        const fsTarget = canvas;
        if (fsTarget?.style) {
            fsTarget.style.width = isFs ? "100vw" : "";
            fsTarget.style.height = isFs ? "100vh" : "";
            fsTarget.style.maxWidth = isFs ? "100vw" : "";
            fsTarget.style.maxHeight = isFs ? "100vh" : "";
        }
        if (canvas?.style) {
            canvas.style.width = isFs ? "100%" : "";
            canvas.style.height = isFs ? "100%" : "";
            canvas.style.display = "block";
        }
        const kmHudCanvas = window["__kmHudCanvas"];
        if (kmHudCanvas?.style) {
            kmHudCanvas.style.width = isFs ? "100%" : "";
            kmHudCanvas.style.height = isFs ? "100%" : "";
        }
    };
    document.addEventListener("fullscreenchange", __applyFullscreenLayout);
    KeyManager.OnKey("f", () => {
        let fsTarget = canvas;
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        }
        else {
            openFullscreen(fsTarget);
        }
        setTimeout(__applyFullscreenLayout, 0);
    });
    //<<<<<<<<<<<< Constants >>>>>>>>>>>>//
    const MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const MAX_ARRAY_TEXTURE_LAYERS = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
    const MAX_TEXTURE_IMAGES_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    const MAX_VERTEX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    window.MAX_TEXTURE_SIZE = MAX_TEXTURE_SIZE;
    window.MAX_ARRAY_TEXTURE_LAYERS = MAX_ARRAY_TEXTURE_LAYERS;
    window.MAX_TEXTURE_IMAGES_UNITS = MAX_TEXTURE_IMAGES_UNITS;
    window.MAX_VERTEX_TEXTURE_IMAGE_UNITS = MAX_VERTEX_TEXTURE_IMAGE_UNITS;
    window.W = W;
    window.H = H;
    var datos_reales;
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext)
        throw new Error('EXT_color_buffer_float not supported');
    const response = await fetch("/danieltidevelopment/secondary/Otros/Sandbox/_3dRenders/CeluloseTrack/data/alive_2.mat", { method: "GET", cache: "no-store" });
    const buf = await response.arrayBuffer();
    const result = await readMat(buf);
    // const result=await selectAndReadMat() as any;
    datos_reales = result.data.Expression1;
    /* Separa los arrays de cromatinas en datosX y en datosY */
    function getDataArrays(data) {
        //data => [number,number][2352][52]
        const nCromatinsLocal = data.length;
        const NMuestrasLocal = data[0].length;
        // drawDataCount=gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const drawDataCountLocal = NMuestrasLocal * nCromatinsLocal;
        console.log(drawDataCountLocal);
        let datX = new Float32Array(drawDataCountLocal);
        let datY = new Float32Array(drawDataCountLocal);
        loadData: for (let i = 0; i < nCromatinsLocal; i++) {
            for (let j = 0; j < NMuestrasLocal; j++) {
                // if(i==0&&j<100) console.log(data[i][j])
                if (i * NMuestrasLocal + j > drawDataCountLocal)
                    break loadData;
                datX[i * NMuestrasLocal + j] = data[i][j][0];
                // datosX[i*NMuestras+j]=(i*NMuestras+j)/100+100;
                datY[i * NMuestrasLocal + j] = data[i][j][1];
            }
        }
        return [datX, datY];
    }
    //</Pre>
    var lastUsedProgram = null;
    var lastFillerProgram = null;
    void lastFillerProgram;
    var __globalBlocks = [];
    const __runtimeLetCache = new Map();
    const __coerceRuntimeLetValue = (raw) => {
        const text = String(raw ?? "").trim();
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
            catch { }
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
        const chunks = String(text ?? "").split(/[\r\n]+/).flatMap(line => line.split(","));
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
    const __loadRuntimeLetSource = async (sourcePath) => {
        const rawPath = String(sourcePath ?? "").trim();
        if (!rawPath)
            return {};
        const resolvedPath = new URL(rawPath, import.meta.url).toString();
        if (__runtimeLetCache.has(resolvedPath))
            return __runtimeLetCache.get(resolvedPath);
        const response = await fetch(resolvedPath);
        if (!response.ok)
            throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");
        let parsed = {};
        if (/\.json(?:$|\?)/i.test(rawPath)) {
            const json = await response.json();
            if (Array.isArray(json))
                parsed = __mergeRuntimeLetArray(json);
            else if (json && typeof json === "object")
                parsed = json;
            else
                parsed = { __array: json };
        }
        else {
            parsed = __parseRuntimeLetText(await response.text());
        }
        __runtimeLetCache.set(resolvedPath, parsed);
        return parsed;
    };
    var camera = new Camera3D(new Vector3D(0, 1, 0), 63);
    camera.setMoveControlsAt("s").setCamControlsAt("down").setMouseControls("mouse");
    camera.keys.a = "a";
    camera.keys.w = "w";
    camera.keys.s = "s";
    camera.keys.d = "d";
    camera.keys.q = "q";
    camera.keys.e = "e";
    camera.keys.r = "r";
    camera.keys.left = "left";
    camera.keys.right = "right";
    camera.keys.up = "up";
    camera.keys.down = "down";
    camera.keys.rotMouse = true;
    let data = (datos_reales);
    let nCromatins = 0;
    let NMuestras = 0;
    let drawDataCount = 0;
    var datosX, datosY;
    [datosX, datosY] = getDataArrays((data));
    var drawData = webglMan.program(-1, "data/1_drawData");
    lastUsedProgram = drawData;
    var d = drawData;
    await d.loadProgram(d.vertPath, d.fragPath, (source => source), (source => source));
    await d.use?.();
    lastUsedProgram = d;
    d.createVAO().bind();
    var datosXtex = lastUsedProgram?.texture2DArray?.({
        format: TexExamples.RFloat,
        data: datosX,
        name: "datosX",
        texUnit: "TexUnit0",
        size: [(MAX_TEXTURE_SIZE), (1), ((~~(datosY.length / MAX_TEXTURE_SIZE / MAX_TEXTURE_SIZE)))]
    });
    var dX = datosXtex;
    var datosYtex = lastUsedProgram?.texture2DArray?.({
        format: TexExamples.RFloat,
        data: datosY,
        name: "datosY",
        texUnit: "TexUnit1",
        size: [(MAX_TEXTURE_SIZE), (1), ((~~(datosY.length / MAX_TEXTURE_SIZE / MAX_TEXTURE_SIZE)))]
    });
    var dY = datosYtex;
    dX.setLengthUniforms();
    dY.setLengthUniforms();
    let is3D = true;
    let showPCA = true;
    let showStartPointer = true;
    let showSimulatedChrom = false;
    let showOtherChromatins = true;
    let simMeanSubseq = false;
    let pcaStride = 1;
    let percentageShown = 1;
    let ShownSpeed = 1;
    let saved3DCamX = 0;
    let saved3DCamY = 1;
    let saved3DCamZ = 0;
    let saved2DOffsetX = 0;
    let saved2DOffsetY = 0;
    let saved2DZoom = 1;
    let selectedChromatin = 0;
    let c2StartTexUnit = "TexUnit30";
    let useExternalStartTex = false;
    let useExternalSimTex = false;
    let simSamples = 2;
    let simTexX = null;
    let simTexY = null;
    let simStartTex = null;
    let simLastStamp = -1;
    let simLastChromatin = -1;
    nCromatins = (data.length);
    NMuestras = (data[0].length);
    drawDataCount = (NMuestras * nCromatins);
    var calcPCAProgram = webglMan.program(-1, "pca/1_calcPCA");
    lastUsedProgram = calcPCAProgram;
    var calcPCA = calcPCAProgram;
    await calcPCA.loadProgram(calcPCA.vertPath, calcPCA.fragPath, (source => source), (source => source));
    await calcPCA.use?.();
    lastUsedProgram = calcPCA;
    calcPCA.createVAO().bind();
    let pcaTex = calcPCA.createTexture2D("datosPCA", [nCromatins, 1], TexExamples.RGBAFloat, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit2");
    let centerTex = calcPCA.createTexture2D("datosCenter", [nCromatins, 1], TexExamples.RGBAFloat, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit3");
    var drawPCAProgram = webglMan.program(-1, "pca/2_drawPCA");
    lastUsedProgram = drawPCAProgram;
    var drawPCA = drawPCAProgram;
    await drawPCA.loadProgram(drawPCA.vertPath, drawPCA.fragPath, (source => source), (source => source));
    await drawPCA.use?.();
    lastUsedProgram = drawPCA;
    drawPCA.createVAO().bind();
    drawPCA.VAO.attribute("aPos", [-1, -1, 1, -1, 1, 1, -1, 1], 2);
    drawPCA.use?.();
    drawPCA.uNum("nCromatin", false, false).set(0);
    drawPCA.use?.();
    drawPCA.uNum("isPerp", false, false).set(0);
    drawPCA.use?.();
    drawPCA.uVec("offset", 3, true, false).set([0, 0, 0]);
    drawPCA.use?.();
    drawPCA.uNum("scale", true, false).set(1);
    drawPCA.use?.();
    drawPCA.uNum("is3D", false, false).set((!!is3D ? 1 : 0));
    drawPCA.bindTexName2TexUnit("datosX", "TexUnit0");
    drawPCA.bindTexName2TexUnit("datosY", "TexUnit1");
    drawPCA.bindTexName2TexUnit("datosPCA", "TexUnit2");
    drawPCA.bindTexName2TexUnit("datosCenter", "TexUnit3");
    drawPCA.uInt("datosXLength").set(MAX_TEXTURE_SIZE);
    drawPCA.isDepthTest = false;
    var drawStartProgram = webglMan.program(-1, "data/2_drawStartPointer");
    lastUsedProgram = drawStartProgram;
    var drawStart = drawStartProgram;
    await drawStart.loadProgram(drawStart.vertPath, drawStart.fragPath, (source => source), (source => source));
    await drawStart.use?.();
    lastUsedProgram = drawStart;
    drawStart.createVAO().bind();
    drawStart.bindTexName2TexUnit("datosX", "TexUnit0");
    drawStart.bindTexName2TexUnit("datosY", "TexUnit1");
    drawStart.bindTexName2TexUnit("startPosTex", "TexUnit30");
    drawStart.use?.();
    drawStart.uNum("selectedChromatin", false, false).set(0);
    drawStart.use?.();
    drawStart.uNum("useStartPosTex", false, false).set(0);
    drawStart.use?.();
    drawStart.uNum("useMeanColor", false, false).set(0);
    drawStart.use?.();
    drawStart.uNum("markerSize", true, false).set(42);
    drawStart.use?.();
    drawStart.uVec("offset", 3, true, false).set([0, 0, 0]);
    drawStart.use?.();
    drawStart.uNum("scale", true, false).set(1);
    drawStart.use?.();
    drawStart.uNum("is3D", false, false).set((!!is3D ? 1 : 0));
    drawStart.isDepthTest = false;
    d.use?.();
    d.uVec("offset", 3, true, false).set([0, 0, 0]);
    d.use?.();
    d.uNum("scale", true, false).set(1);
    d.use?.();
    d.uNum("lCromatin", false, false).set((drawDataCount / nCromatins));
    d.use?.();
    d.uNum("is3D", false, false).set((!!is3D ? 1 : 0));
    await d.use?.();
    lastUsedProgram = d;
    camera.calculateMatrices().setUniforms(d.uMat4("u_viewMatrix"), d.uMat4("u_projectionMatrix"), undefined);
    KeyManager.OnPress("r", async (e) => {
        if (e?.repeat)
            return;
        percentageShown = 0;
        ShownSpeed = (~~(Math.random() * 4) + 1);
    });
    KeyManager.OnPress("p", async (e) => {
        if (e?.repeat)
            return;
        showStartPointer = (!showStartPointer);
    });
    KeyManager.OnPress("h", async (e) => {
        if (e?.repeat)
            return;
        showPCA = (!showPCA);
    });
    KeyManager.OnPress("u", async (e) => {
        if (e?.repeat)
            return;
        showSimulatedChrom = (!showSimulatedChrom);
    });
    KeyManager.OnPress("g", async (e) => {
        if (e?.repeat)
            return;
        showOtherChromatins = (!showOtherChromatins);
    });
    KeyManager.OnPress("y", async (e) => {
        if (e?.repeat)
            return;
        simMeanSubseq = (!simMeanSubseq);
        window.simUseMeanSubseq = (!!simMeanSubseq);
        window.simReqRebuild = (~~(window.simReqRebuild || 0) + 1);
    });
    KeyManager.OnPress("k", async (e) => {
        if (e?.repeat)
            return;
        is3D = (!is3D);
        if (is3D) {
            saved2DOffsetX = (camera.position.x);
            saved2DOffsetY = (camera.position.z);
            saved2DZoom = (camera.position.y);
            camera.position.setVal(0, (saved3DCamX));
            camera.position.setVal(1, (saved3DCamY));
            camera.position.setVal(2, (saved3DCamZ));
            d.uniforms.offset.set([0, 0, 0]);
            d.uniforms.scale.set(1);
            drawStart.uniforms.offset.set([0, 0, 0]);
            drawStart.uniforms.scale.set(1);
        }
        else {
            saved3DCamX = (camera.position.x);
            saved3DCamY = (camera.position.y);
            saved3DCamZ = (camera.position.z);
            camera.position.setVal(0, (saved2DOffsetX));
            camera.position.setVal(1, (saved2DZoom));
            camera.position.setVal(2, (saved2DOffsetY));
            d.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y]);
            d.uniforms.scale.set((camera.position.y));
            drawStart.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y]);
            drawStart.uniforms.scale.set((camera.position.y));
        }
        d.use?.();
        d.uNum("is3D", false, false).set((!!is3D ? 1 : 0));
        drawStart.use?.();
        drawStart.uNum("is3D", false, false).set((!!is3D ? 1 : 0));
    });
    var __globalBlockFn_0 = async (dt) => {
        simMeanSubseq = (!!(window.simUseMeanSubseq || false));
        await calcPCA.use?.();
        lastUsedProgram = calcPCA;
        calcPCA.use?.();
        calcPCA.uNum("lCromatin", false, false).set((drawDataCount / nCromatins));
        calcPCA.use?.();
        calcPCA.uNum("datosXLength", false, false).set((MAX_TEXTURE_SIZE));
        calcPCA.use?.();
        calcPCA.uNum("datosYLength", false, false).set((MAX_TEXTURE_SIZE));
        calcPCA.bindTexName2TexUnit("datosX", "TexUnit0");
        calcPCA.bindTexName2TexUnit("datosY", "TexUnit1");
        let pcaFBO = calcPCA.cFrameBuffer().bind(["ColAtch0", "ColAtch1"]);
        pcaFBO.bindColorBuffer(pcaTex, "ColAtch0");
        pcaFBO.bindColorBuffer(centerTex, "ColAtch1");
        pcaFBO.drawBuffers(["ColAtch0", "ColAtch1"]);
        calcPCA.setViewport(0, 0, nCromatins, 1);
        calcPCA.drawArrays("TRIANGLES", 0, 6);
        calcPCA.unbindFBO();
        await d.use?.();
        lastUsedProgram = d;
        drawStart.uniforms.useMeanColor.set((!!simMeanSubseq ? 1 : 0));
        selectedChromatin = (Math.max(0, Math.min(nCromatins - 1, ~~(window.chromatinIndex || 1) - 1)));
        let simStampX = (~~(window.simStampX || 0));
        let simStampY = (~~(window.simStampY || 0));
        let simStamp = (simStampX * 1000003 + simStampY);
        if (simStamp != simLastStamp || selectedChromatin != simLastChromatin) {
            let sx = (window.simDataX);
            let sy = (window.simDataY);
            if (sx && sy) {
                let simArrX = (sx instanceof Float32Array ? sx : new Float32Array(sx));
                let simArrY = (sy instanceof Float32Array ? sy : new Float32Array(sy));
                let projMeta = (window.__tauProjectionMeta || null);
                if (projMeta && projMeta.mode === "pca" && projMeta.simCoordsMode === "pca-relative") {
                    let recN = (Math.max(2, Math.min(simArrX.length, simArrY.length)));
                    let backX = new Float32Array(recN);
                    let backY = new Float32Array(recN);
                    let cx = (Number.isFinite(projMeta.centerX) ? projMeta.centerX : 0);
                    let cy = (Number.isFinite(projMeta.centerY) ? projMeta.centerY : 0);
                    let vx = (Number.isFinite(projMeta.vx) ? projMeta.vx : 1);
                    let vy = (Number.isFinite(projMeta.vy) ? projMeta.vy : 0);
                    let wx = (Number.isFinite(projMeta.wx) ? projMeta.wx : 0);
                    let wy = (Number.isFinite(projMeta.wy) ? projMeta.wy : 1);
                    let i = 0;
                    while (i < recN) {
                        let a0 = (Number.isFinite(simArrX[i]) ? simArrX[i] : 0);
                        let a1 = (Number.isFinite(simArrY[i]) ? simArrY[i] : 0);
                        backX[i] = cx + a0 * vx + a1 * wx;
                        backY[i] = cy + a0 * vy + a1 * wy;
                        i += 1;
                    }
                    simArrX = (backX);
                    simArrY = (backY);
                }
                let simN = (Math.max(2, Math.min(simArrX.length, simArrY.length)));
                let chromBase = (selectedChromatin * NMuestras);
                let targetStartX = (Number.isFinite(datosX[chromBase]) ? datosX[chromBase] : 0);
                let targetStartY = (Number.isFinite(datosY[chromBase]) ? datosY[chromBase] : 0);
                let shiftX = (targetStartX - (Number.isFinite(simArrX[0]) ? simArrX[0] : 0));
                let shiftY = (targetStartY - (Number.isFinite(simArrY[0]) ? simArrY[0] : 0));
                if (shiftX || shiftY) {
                    let shiftedX = (Float32Array.from(simArrX, (v) => v + shiftX));
                    let shiftedY = (Float32Array.from(simArrY, (v) => v + shiftY));
                    simArrX = (shiftedX);
                    simArrY = (shiftedY);
                }
                simSamples = (simN);
                simTexX = d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrX,
                    name: "simX",
                    texUnit: "TexUnit30",
                    size: [simN, 1, 1]
                });
                simTexY = d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrY,
                    name: "simY",
                    texUnit: "TexUnit31",
                    size: [simN, 1, 1]
                });
                if (simTexX?.setLengthUniforms)
                    simTexX.setLengthUniforms();
                if (simTexY?.setLengthUniforms)
                    simTexY.setLengthUniforms();
                let s0x = (simArrX[0] || 0);
                let s0y = (simArrY[0] || 0);
                simStartTex = (drawStart.createTexture2D("simStartPos", [1, 1], TexExamples.RGBAFloat, new Float32Array([s0x, s0y, 0, 1]), ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit29"));
                useExternalSimTex = true;
                useExternalStartTex = true;
                simLastStamp = (simStamp);
                simLastChromatin = (selectedChromatin);
            }
            else if (!sx || !sy) {
                useExternalSimTex = false;
                useExternalStartTex = false;
                simLastStamp = (simStamp);
                simLastChromatin = (selectedChromatin);
            }
        }
        if (is3D) {
            camera.tick((dt), (keypress), (mousepos), (mouseclick));
            saved3DCamX = (camera.position.x);
            saved3DCamY = (camera.position.y);
            saved3DCamZ = (camera.position.z);
            camera.calculateMatrices();
            camera.setUniformsProgram(d);
            d.uniforms.offset.set([0, 0, 0]);
            d.uniforms.scale.set(1);
            drawStart.uniforms.offset.set([0, 0, 0]);
            drawStart.uniforms.scale.set(1);
        }
        else {
            let camzoom = (camera.position.y);
            let mvdepth = (keypress.Depth());
            if (mvdepth < 0) {
                camzoom = (camzoom * 1.05);
                if (camzoom == 0) {
                    camzoom = 1;
                }
            }
            if (mvdepth > 0) {
                camzoom = (camzoom / 1.05);
                if (camzoom == 0) {
                    camzoom = 1;
                }
            }
            camera.tick((dt / camzoom * 4.5), (keypress), (mousepos), (mouseclick));
            camera.position.setVal(1, (camzoom));
            saved2DOffsetX = (camera.position.x);
            saved2DOffsetY = (camera.position.z);
            saved2DZoom = (camera.position.y);
            d.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y]);
            d.uniforms.scale.set((camzoom));
            drawStart.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y]);
            drawStart.uniforms.scale.set((camzoom));
        }
        if (percentageShown < 1) {
            percentageShown += (dt * ShownSpeed * 0.2);
            if (percentageShown > 1) {
                percentageShown = 1;
            }
        }
    };
    __globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
    var __globalBlockFn_1 = async (dt) => {
        if (showPCA) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            await drawPCA.use?.();
            lastUsedProgram = drawPCA;
            drawPCA.VAO.bind();
            drawPCA.use?.();
            drawPCA.setViewport(...([0, 0, canvas.width, canvas.height]));
            drawPCA.bindTexName2TexUnit("datosX", "TexUnit0");
            drawPCA.bindTexName2TexUnit("datosY", "TexUnit1");
            drawPCA.bindTexName2TexUnit("datosPCA", "TexUnit2");
            drawPCA.bindTexName2TexUnit("datosCenter", "TexUnit3");
            if (is3D) {
                camera.calculateMatrices().setUniforms(drawPCA.uMat4("u_viewMatrix"), drawPCA.uMat4("u_projectionMatrix"), undefined);
                drawPCA.uniforms.offset.set([0, 0, 0]);
                drawPCA.uniforms.scale.set(1);
            }
            else {
                drawPCA.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y]);
                drawPCA.uniforms.scale.set((camera.position.y));
            }
            drawPCA.uniforms.is3D.set((!!is3D ? 1 : 0));
        }
        // </block drawPCASetup>
    };
    __globalBlocks.push({ priority: 19, order: 1, fn: __globalBlockFn_1 });
    var __globalBlockFn_2 = async (dt) => {
        // <block drawPCAAxes>
        for (let n_cromatin = 0; n_cromatin <= (nCromatins - 1); n_cromatin++) {
            if (showPCA) {
                await drawPCA.use?.();
                lastUsedProgram = drawPCA;
                if (n_cromatin % pcaStride == 0) {
                    drawPCA.uniforms.nCromatin.set((n_cromatin));
                    drawPCA.uniforms.isPerp.set(0);
                    drawPCA.drawArrays("TRIANGLE_FAN", 0, 4);
                    drawPCA.uniforms.isPerp.set(1);
                    drawPCA.drawArrays("TRIANGLE_FAN", 0, 4);
                }
            }
        }
        // </block drawPCAAxes>
    };
    __globalBlocks.push({ priority: 20, order: 2, fn: __globalBlockFn_2 });
    var __globalBlockFn_3 = async (dt) => {
        // <block drawCromatin>
        for (let n_cromatin = 0; n_cromatin <= (nCromatins - 1); n_cromatin++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            await d.use?.();
            lastUsedProgram = d;
            d.use?.();
            d.setViewport(...([0, 0, canvas.width, canvas.height]));
            d.VAO.bind();
            n_cromatin = (n_cromatin % nCromatins);
            let lCromatin = (drawDataCount / nCromatins);
            let templCromatin = (lCromatin);
            let templSim = (simSamples);
            d.uniforms.lCromatin.set((lCromatin));
            if (percentageShown != 1) {
                templCromatin = (Math.max(2, ~~(lCromatin * percentageShown)));
                templSim = (Math.max(2, ~~(simSamples * percentageShown)));
            }
            if (showSimulatedChrom) {
                if (n_cromatin == selectedChromatin && useExternalSimTex) {
                    d.bindTexName2TexUnit("datosX", "TexUnit30");
                    d.bindTexName2TexUnit("datosY", "TexUnit31");
                    d.uniforms.lCromatin.set((simSamples));
                    d.drawArrays("LINE_STRIP", 0, (templSim));
                    d.bindTexName2TexUnit("datosX", "TexUnit0");
                    d.bindTexName2TexUnit("datosY", "TexUnit1");
                    d.uniforms.lCromatin.set((lCromatin));
                }
            }
            else {
                if (showOtherChromatins || n_cromatin == selectedChromatin) {
                    d.drawArrays("LINE_STRIP", (lCromatin * n_cromatin), (templCromatin));
                }
                if (n_cromatin == selectedChromatin && useExternalSimTex) {
                    d.bindTexName2TexUnit("datosX", "TexUnit30");
                    d.bindTexName2TexUnit("datosY", "TexUnit31");
                    d.uniforms.lCromatin.set((simSamples));
                    d.drawArrays("LINE_STRIP", 0, (templSim));
                    d.bindTexName2TexUnit("datosX", "TexUnit0");
                    d.bindTexName2TexUnit("datosY", "TexUnit1");
                    d.uniforms.lCromatin.set((lCromatin));
                }
            }
        }
        // </block drawCromatin>
    };
    __globalBlocks.push({ priority: 10, order: 3, fn: __globalBlockFn_3 });
    var __globalBlockFn_4 = async (dt) => {
        if (showStartPointer && useExternalStartTex) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            await drawStart.use?.();
            lastUsedProgram = drawStart;
            drawStart.use?.();
            drawStart.setViewport(...([0, 0, canvas.width, canvas.height]));
            drawStart.VAO.bind();
            drawStart.bindTexName2TexUnit("datosX", "TexUnit0");
            drawStart.bindTexName2TexUnit("datosY", "TexUnit1");
            drawStart.bindTexName2TexUnit("startPosTex", "TexUnit29");
            drawStart.uniforms.selectedChromatin.set((!!useExternalStartTex ? 0 : selectedChromatin));
            drawStart.uniforms.useStartPosTex.set((!!useExternalStartTex ? 1 : 0));
            if (is3D) {
                camera.calculateMatrices().setUniforms(drawStart.uMat4("u_viewMatrix"), drawStart.uMat4("u_projectionMatrix"), undefined);
            }
            drawStart.drawArrays("POINTS", 0, 1);
        }
        // </block drawStartMarker>
    };
    __globalBlocks.push({ priority: 25, order: 4, fn: __globalBlockFn_4 });
    if (typeof __mountGlobalBlocks === "function")
        __mountGlobalBlocks(__globalBlocks, addFunc);
    start();
}
__c1Main();
//<Pos>
//</Pos>
