(async () => {
  const canvas = document.getElementById("trajectory-__SHADERDSL_ID__") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing trajectory canvas for __SHADERDSL_ID__");
  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = canvas.width;
  renderCanvas.height = canvas.height;
  const gl = renderCanvas.getContext("webgl2", { preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 is required");
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);
