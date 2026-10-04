(async () => {
  const canvas = document.getElementById("shaderdsl-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is required");
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);
