import { __mountGlobalBlocks, __prepareMathFunction } from "/Code/opengl/opengl.js";
import { KeyManager, MouseManager, keypress, mousepos, mouseclick } from "/Code/Game/Game.js";
import { Vector3D } from "/Code/Matrix/Matrix.js";
import { Camera3D } from "/Code/Game3D/Game3D.js";
import { MeshRenderingProgram, MeshFillerProgram, Axis3DGroup } from "/Code/WebGL/webglCapsules.js";
import { WebGLMan } from "/Code/WebGL/webglMan.js";
import { addFunc, start } from "/Code/Start/start.js";

// @ts-nocheck

//<Pre>
(async () => {
  const canvas = document.getElementById("shaderdsl-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is required");
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);

//</Pre>
var lastUsedProgram: any = null;
var lastFillerProgram: any = null;
void lastFillerProgram;
var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];
var meshProgram = new MeshRenderingProgram(gl, "TexUnit20", ([32, 32])[0], ([32, 32])[1]).includeInWebManList();
lastUsedProgram = meshProgram;
await meshProgram.loadProgram(meshProgram.vertPath, meshProgram.fragPath, (source => source), (source => source));
await meshProgram.use?.();
lastUsedProgram = meshProgram;
meshProgram.initUniforms().setPerXPerY(1,0).setColorHueScale(1);
var surface;
(()=>{
    // createIdealMesh surface
    let compiledCreateIdealMeshFn = __prepareMathFunction("(x,y)=>{sin(x/4)*cos(y/4)}");
    surface = lastUsedProgram?.createIdealTexture?.("TexUnit20", compiledCreateIdealMeshFn);
    surface?.bind?.();
})();
var camera3D = new Camera3D(new Vector3D(0,4,12));
camera3D.calculateMatrices();
var axis3DGroup = new Axis3DGroup(gl, new Vector3D(4,4,4), true, undefined, undefined, undefined).includeInWebManList();
await axis3DGroup.loadProgram(axis3DGroup.vertPath, axis3DGroup.fragPath, (source => source), (source => source));
await axis3DGroup.use?.();
lastUsedProgram = axis3DGroup;
axis3DGroup.setDivisions(4).initUniforms();
var __globalBlockFn_0 = async (dt)=>{ // tick
    camera3D.tick((dt),(keypress),(mousepos),(mouseclick));
    if(lastUsedProgram) lastUsedProgram.isDepthTest = true;
    await meshProgram.use?.();
    lastUsedProgram = meshProgram;
    meshProgram.draw(0,0,640,480,(camera3D),"LINES");
    await axis3DGroup.use?.();
    lastUsedProgram = axis3DGroup;
    axis3DGroup.draw((camera3D));
};
__globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);
start();
//<Pos>
})();
//</Pos>
