var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MouseManager, openFullscreen, keypress, mousepos, mouseclick, KeyManager } from "/Code/Game/Game.js";
import { Vector3D } from "/Code/Matrix/Matrix.js";
import { addFunc, start } from "/Code/Start/start.js";
import { createCanvasNextTo } from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js";
import { Axis3DGroup, MeshRenderingProgram } from "/Code/WebGL/webglCapsules.js";
import { Camera3D } from "/Code/Game3D/Game3D.js";
import { WebGLMan } from "/Code/WebGL/webglMan.js";
function getElementBySelector(selector, i = 0) {
    let objs = document.querySelectorAll(selector);
    if (objs.length == 0)
        return;
    if (i > objs.length - 1)
        i = objs.length - 1;
    return objs[i];
}
function getPositionOf(targetElement) {
    if (!targetElement)
        return {
            top: 0, left: 0, y: 0, x: 0, width: 0, height: 0, bottom: 0, right: 0
        };
    let rect = targetElement.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        x: rect.left + window.scrollX,
        height: rect.height,
        width: rect.width,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
    };
}
window.DNTIHandleResize();
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    let { screen: screen_props, tickPausedButton } = createCanvasNextTo(undefined, "c1", "#F1", { dx: (isResizedCanvas, offx, c) => {
            return isResizedCanvas ? 0 : (100 - offx);
        }, dy: (isrc) => isrc ? 0 : 132, dw: () => 420, dh: () => 280 }, { preserveAspectRatio: true, absolute: false, contexttype: "webgl2" });
    const { ctx, scene: sc, W, H } = screen_props;
    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);
    const gl = ctx;
    const canvas = ctx.canvas;
    document.addEventListener("DOMContentLoaded", () => {
        var _a, _b;
        (_b = (_a = ctx.canvas).recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a);
        ;
    });
    document.addEventListener("scroll", () => { var _a, _b; return (_b = (_a = ctx.canvas).recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a); });
    WebGLMan.setGL(gl);
    let meshProgram = new MeshRenderingProgram(gl, "TexUnit20", 1024, 1024).includeInWebManList();
    (yield meshProgram.loadProgram()).use().initUniforms().setPerXPerY(1, 0);
    let meshTexure = meshProgram.createIdealTexture("TexUnit20", (i, j) => { return (Math.sin(i / 50) + Math.sin(j / 50)); }).bind();
    let axisProgram = new Axis3DGroup(gl, new Vector3D(15.3, 15.3, 15.3), true, new Vector3D(0.6, 0.8, 0.8), new Vector3D(0.125, 0.125, 0.125), ["XZ", "XY", "YZ"])
        .includeInWebManList();
    (yield axisProgram.loadProgram()).use().setDivisions(4).initUniforms();
    const applyFullscreenLayout = () => {
        const isFs = !!document.fullscreenElement;
        const fsTarget = (ctx.canvas.parentElement || canvas);
        if (fsTarget === null || fsTarget === void 0 ? void 0 : fsTarget.style) {
            fsTarget.style.width = isFs ? "100vw" : "";
            fsTarget.style.height = isFs ? "100vh" : "";
            fsTarget.style.maxWidth = isFs ? "100vw" : "";
            fsTarget.style.maxHeight = isFs ? "100vh" : "";
        }
        if (canvas === null || canvas === void 0 ? void 0 : canvas.style) {
            canvas.style.width = isFs ? "100%" : "";
            canvas.style.height = isFs ? "100%" : "";
            canvas.style.display = "block";
        }
        const kmHudCanvas = window["__kmHudCanvas"];
        if (kmHudCanvas === null || kmHudCanvas === void 0 ? void 0 : kmHudCanvas.style) {
            kmHudCanvas.style.width = isFs ? "100%" : "";
            kmHudCanvas.style.height = isFs ? "100%" : "";
        }
    };
    document.addEventListener("fullscreenchange", applyFullscreenLayout);
    KeyManager.OnKey("f", () => {
        var _a;
        const fsTarget = (ctx.canvas.parentElement || canvas);
        if (document.fullscreenElement) {
            (_a = document.exitFullscreen) === null || _a === void 0 ? void 0 : _a.call(document);
        }
        else {
            openFullscreen(fsTarget);
        }
        setTimeout(applyFullscreenLayout, 0);
    });
    let camera = new Camera3D(new Vector3D(0, 4, 20));
    camera.calculateMatrices();
    addFunc((dt) => {
        var _a;
        if (((_a = ctx.canvas) === null || _a === void 0 ? void 0 : _a.visible) === false)
            return;
        meshProgram.isDepthTest = true;
        meshProgram.use();
        camera.tick(dt, keypress, mousepos, mouseclick);
        meshProgram.draw(0, 0, W, H, camera);
        axisProgram.use();
        axisProgram.draw(camera);
    });
}))();
start();
