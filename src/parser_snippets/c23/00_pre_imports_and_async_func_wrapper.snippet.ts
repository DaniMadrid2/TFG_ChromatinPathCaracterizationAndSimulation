/**
Archivo:
- Envuelve los snippets compartidos de C2 y C3 con el preambulo comun de imports, canvas y contexto WebGL.

Objetivos:
- Import comun:
  - readMat
- Bootstrap comun:
  - createCanvasNextTo
  - KeyManager.detectKeys
  - MouseManager.EnableCanvas
  - webglMan
*/
//@ts-nocheck
import {read as readMat} from "/ExternalCode/mat4js/mat4js.read.js";

(async ()=>{
    //? - Bootstrap comun del canvas y del contexto WebGL
    let {screen:screen_props}=createCanvasNextTo(undefined,"$[c2,c3]$","$[#F2,#F3]$",
        {dx:(isResizedCanvas,offx,c)=>{ return isResizedCanvas?0:(100-offx); },dy:(isrc)=>isrc?0:132,dw:()=>420,dh:()=>280},
        {preserveAspectRatio:true,absolute:false, contexttype:"webgl2"});
    const {ctx,W,H}=screen_props;
    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);

    const gl=ctx as any as WebGL2RenderingContext;
    const canvas=ctx.canvas;
    const webglMan=new WebGLMan(gl);

$[__SNIPPET_BODY_C2__,__SNIPPET_BODY_C3__]$
