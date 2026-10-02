export function initializeFields(gl: WebGL2RenderingContext, textures: WebGLTexture[]): void {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  for (const texture of textures) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(framebuffer);
}

export function presentField(canvas: HTMLCanvasElement, source: HTMLCanvasElement, label: string): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required');
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(10, 23, 27, 0.78)';
  context.fillRect(0, 0, canvas.width, 42);
  context.fillStyle = '#ffffff';
  context.font = '600 18px system-ui';
  context.fillText(label, 16, 27);
}
