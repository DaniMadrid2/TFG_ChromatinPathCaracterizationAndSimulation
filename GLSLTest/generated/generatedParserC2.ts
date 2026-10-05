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

import { Axis3DGroup, MeshRenderingProgram, SolidMeshRenderingProgram, MeshFillerProgram } from "/Code/WebGL/parser/registryModules/capsules.js";
import { Camera3D } from "/Code/Game3D/Game3D.js";
import { BindableTexture, GLMode, TexExamples, TextureUnitType, WebGLMan, WebProgram, parseTexUnitType } from "/Code/WebGL/webglMan.js";


// @ts-nocheck

import { BackupRuntime } from "/Code/WebGL/runtime/BackupRuntime.js";

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
let count=1600;
for (let i = 1; i <= count; i++) {
  const t = i / count;
  const x = lastPoint[0] * (1 - t) + firstPoint[0] * t;
  const y = lastPoint[1] * (1 - t) + firstPoint[1] * t;
  trajectory.push(x, y);
}

//</Pre>
var lastUsedProgram: any = null;
var lastFillerProgram: any = null;
void lastFillerProgram;
var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];
const backupRuntime = new BackupRuntime(gl, TexExamples, "parseTextC2", () => ({
    recomputeTau: typeof recomputeTau !== "undefined" && !!recomputeTau,
    tauModelStamp: typeof tauModelStamp !== "undefined" ? tauModelStamp : undefined
}));
const readBackup = (path: string) => backupRuntime.readBackup(path);
var meshProgram = new SolidMeshRenderingProgram(gl, "TexUnit20", ([1024, 1024])[0], ([1024, 1024])[1]).includeInWebManList();
lastUsedProgram = meshProgram;
await meshProgram.loadProgram(meshProgram.vertPath, meshProgram.fragPath, (source => source), (source => source));
await meshProgram.use?.();
lastUsedProgram = meshProgram;
let scaleFactor = 1;;
var time = 0;;
meshProgram.initUniforms().smoothColor(false).setPerXPerY(0.5,0.5).smoothColor(true).setDXDY(0.16*scaleFactor,0.16*scaleFactor).setYScale(scaleFactor).setColorHueScale(0.2).setRepeat(true);
var surface;
(()=>{
    // createIdealMesh surface
    surface = lastUsedProgram?.createIdealTexture?.("TexUnit20");
    if (surface) {
        surface.lastPreparedFunc = "(x, y) => { return sin(x / 10 + {time}) * cos(y / 10) * 2 - 30 / (1 + (Math.pow((x-512)*0.03, 2) + Math.pow((y-512)*0.03, 2)) * 0.1); }";
        surface.meshContext = {
            get time(){ return (typeof time !== "undefined") ? time : (globalThis as any).time; },
        };
    }
    surface?.bind?.();
})();
var camera3D = new Camera3D(new Vector3D(0,4,12));
camera3D.direction = new Vector3D(0,-0.3,-1);
camera3D.calculateMatrices();
var axis3DGroup = new Axis3DGroup(gl, new Vector3D(4,4,4), true, undefined, undefined, undefined).includeInWebManList();
await axis3DGroup.loadProgram(axis3DGroup.vertPath, axis3DGroup.fragPath, (source => source), (source => source));
await axis3DGroup.use?.();
lastUsedProgram = axis3DGroup;
axis3DGroup.setDivisions(4).initUniforms();
camera3D.bindRKey("z");
var meshFillerProgram = new MeshFillerProgram(gl, "TexUnit20").includeInWebManList();
await meshFillerProgram.loadFromTexture();
lastFillerProgram = meshFillerProgram;
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
    void backupRuntime.captureTaggedValue("tick", "2", "offset", offset);
    time += dt*3;;
    camera3D.tick( (dt) , (keypress) , (mousepos) , (mouseclick) );
    await meshFillerProgram.use?.();
    lastUsedProgram = meshFillerProgram;
    meshFillerProgram.tick().draw();
    await meshProgram.use?.();
    lastUsedProgram = meshProgram;
    meshProgram.draw(0,0,640,480,(camera3D),"TRIANGLE_STRIP");
};
__globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
KeyManager.OnKey("f", async (e)=>{ // OnKey
if((e as any)?.repeat) return;
});
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
