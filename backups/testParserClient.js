var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { openFullscreen, keypress, mousepos, mouseclick, KeyManager, MouseManager } from "/Code/Game/Game.js";
import { createCanvasNextTo } from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js";
import { WebGLMan } from "/Code/WebGL/webglMan.js";
import { read as readMat } from "/ExternalCode/mat4js/mat4js.read.js";
window.DNTIHandleResize();
window.addEventListener("resize", window.DNTIHandleResize);
function isResized(data_id) {
    const lateralDivs = document.querySelectorAll(".dnti-outside [data-id]");
    for (let i = 0; i < lateralDivs.length; i++) {
        const latDiv = lateralDivs[i];
        if (latDiv.getAttribute("data-id") == data_id) {
            if (latDiv.children.length != 0)
                return false;
        }
    }
    return true;
}
void isResized;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const { screen: screen_props } = createCanvasNextTo(undefined, "c1", "#F1", {
        dx: (isResizedCanvas, offx) => (isResizedCanvas ? 0 : (100 - offx)),
        dy: (isrc) => (isrc ? 0 : 132),
        dw: () => 420,
        dh: () => 280
    }, { preserveAspectRatio: true, absolute: false, contexttype: "webgl2" });
    const { ctx, W, H } = screen_props;
    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);
    const gl = ctx;
    const canvas = ctx.canvas;
    document.addEventListener("DOMContentLoaded", () => {
        var _a, _b;
        (_b = (_a = ctx.canvas).recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    document.addEventListener("scroll", () => { var _a, _b; return (_b = (_a = ctx.canvas).recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a); });
    KeyManager.OnKey("f", () => openFullscreen(canvas));
    let is3D = false;
    let drawDataCount = null;
    let nCromatins = null;
    let NMuestras = null;
    window.is3D = is3D;
    window.drawDataCount = drawDataCount;
    window.nCromatins = nCromatins;
    window.NMuestras = NMuestras;
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
    let datos_reales;
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext)
        throw new Error("EXT_color_buffer_float not supported");
    const response = yield fetch("/data/alive_2.mat", { method: "GET", cache: "no-store" });
    const buf = yield response.arrayBuffer();
    const result = yield readMat(buf);
    datos_reales = result.data.Expression1;
    function getDataArrays(data) {
        nCromatins = data.length;
        NMuestras = data[0].length;
        drawDataCount = NMuestras * nCromatins;
        const datosX = new Float32Array(drawDataCount);
        const datosY = new Float32Array(drawDataCount);
        loadData: for (let i = 0; i < nCromatins; i++) {
            for (let j = 0; j < NMuestras; j++) {
                if (i * NMuestras + j > drawDataCount)
                    break loadData;
                datosX[i * NMuestras + j] = data[i][j][0];
                datosY[i * NMuestras + j] = data[i][j][1];
            }
        }
        return [datosX, datosY];
    }
    window.getDataArrays = getDataArrays;
    window.datos_reales = datos_reales;
    window.keypress = keypress;
    window.mouseclick = mouseclick;
    window.mousepos = mousepos;
    window.__parserGL = gl;
    WebGLMan.setGL(gl);
    const dynamicImport = new Function("p", "return import(p)");
    yield dynamicImport("./generatedParser.js");
}))();
