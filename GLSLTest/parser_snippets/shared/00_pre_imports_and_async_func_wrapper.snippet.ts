(async () => {
  const canvas = document.getElementById("trajectory-__SHADERDSL_ID__") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing trajectory canvas for __SHADERDSL_ID__");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is required");
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);
