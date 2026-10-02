(async () => {
  const canvas = document.getElementById("field-__SHADERDSL_ID__") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing field canvas");
  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = 192;
  renderCanvas.height = 192;
  const gl = renderCanvas.getContext("webgl2", { preserveDrawingBuffer: true });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("WebGL2 with EXT_color_buffer_float is required");
  }
  const ctx = gl;
  const webglMan = new WebGLMan(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);
  let pendingClick = false;
  canvas.addEventListener("mousedown", (event) => { if (event.button === 0) pendingClick = true; });
