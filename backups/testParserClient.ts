import { openFullscreen, keypress, mousepos, mouseclick, KeyManager, MouseManager } from "/Code/Game/Game.js";
import { createCanvasNextTo } from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js";
import { WebGLMan } from "/Code/WebGL/webglMan.js";
import { read as readMat } from "/ExternalCode/mat4js/mat4js.read.js";

// Verificar si la consulta de medios se cumple inicialmente
(window as any).DNTIHandleResize();
window.addEventListener("resize", (window as any).DNTIHandleResize);

function isResized(data_id) {
    const lateralDivs = document.querySelectorAll(".dnti-outside [data-id]");
    for (let i = 0; i < lateralDivs.length; i++) {
        const latDiv = lateralDivs[i];
        if (latDiv.getAttribute("data-id") == data_id) {
            if (latDiv.children.length != 0) return false;
        }
    }
    return true;
}

void isResized;

(async () => {
    const { screen: screen_props } = createCanvasNextTo(
        undefined,
        "c1",
        "#F1",
        {
            dx: (isResizedCanvas, offx) => (isResizedCanvas ? 0 : (100 - offx)),
            dy: (isrc) => (isrc ? 0 : 132),
            dw: () => 420,
            dh: () => 280
        },
        { preserveAspectRatio: true, absolute: false, contexttype: "webgl2" }
    );
    const { ctx, W, H } = screen_props;

    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);

    const gl = ctx as any as WebGL2RenderingContext;
    const canvas = ctx.canvas;
    document.addEventListener("DOMContentLoaded", () => {
        (ctx.canvas as any).recheckVisible?.();
    });
    document.addEventListener("scroll", () => (ctx.canvas as any).recheckVisible?.());

    KeyManager.OnKey("f", () => openFullscreen(canvas));

    let is3D = false;
    let drawDataCount = null;
    let nCromatins = null;
    let NMuestras = null;
    (window as any).is3D = is3D;
    (window as any).drawDataCount = drawDataCount;
    (window as any).nCromatins = nCromatins;
    (window as any).NMuestras = NMuestras;

    const MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const MAX_ARRAY_TEXTURE_LAYERS = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
    const MAX_TEXTURE_IMAGES_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    const MAX_VERTEX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);

    (window as any).MAX_TEXTURE_SIZE = MAX_TEXTURE_SIZE;
    (window as any).MAX_ARRAY_TEXTURE_LAYERS = MAX_ARRAY_TEXTURE_LAYERS;
    (window as any).MAX_TEXTURE_IMAGES_UNITS = MAX_TEXTURE_IMAGES_UNITS;
    (window as any).MAX_VERTEX_TEXTURE_IMAGE_UNITS = MAX_VERTEX_TEXTURE_IMAGE_UNITS;
    (window as any).W = W;
    (window as any).H = H;
    let datos_reales: [number, number][][];

    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) throw new Error("EXT_color_buffer_float not supported");

    const response = await fetch(
        "/data/alive_2.mat",
        { method: "GET", cache: "no-store" }
    );
    const buf = await response.arrayBuffer();
    const result = await readMat(buf);
    datos_reales = result.data.Expression1;

    function getDataArrays(data: [number, number][][]): [Float32Array, Float32Array] {
        nCromatins = data.length;
        NMuestras = data[0].length;
        drawDataCount = NMuestras * nCromatins;
        const datosX = new Float32Array(drawDataCount);
        const datosY = new Float32Array(drawDataCount);
        loadData: for (let i = 0; i < nCromatins; i++) {
            for (let j = 0; j < NMuestras; j++) {
                if (i * NMuestras + j > drawDataCount) break loadData;
                datosX[i * NMuestras + j] = data[i][j][0];
                datosY[i * NMuestras + j] = data[i][j][1];
            }
        }
        return [datosX, datosY];
    }

    (window as any).getDataArrays = getDataArrays;
    (window as any).datos_reales = datos_reales;
    (window as any).keypress = keypress;
    (window as any).mouseclick = mouseclick;
    (window as any).mousepos = mousepos;
    (window as any).__parserGL = gl;

    WebGLMan.setGL(gl);
    const dynamicImport = new Function("p", "return import(p)") as (p: string) => Promise<any>;
    await dynamicImport("./generatedParser.js");
})();
