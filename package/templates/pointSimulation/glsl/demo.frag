#version 300 es
precision highp float;



out vec4 color;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(640.0, 480.0);
  // color = vec4(uv.x, 0.35 + 0.65 * uv.y, 0.55, 1.0);
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
    
  // Si la distancia es mayor a 0.5, descartamos el píxel (lo hace redondo)
  if (dist > 0.5) {
      discard;
  }
    
  color = vec4(1.0, 0.0, 0.0, 1.0);
}
