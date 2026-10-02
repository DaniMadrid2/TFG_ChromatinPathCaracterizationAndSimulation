#version 300 es
precision highp float;
uniform sampler2D fieldB;
out vec4 color;
void main() {
  float value = texelFetch(fieldB, ivec2(gl_FragCoord.xy), 0).r;
  color = vec4(0.15 + max(value, 0.0) * 0.77, 0.19 + abs(value) * 0.52, 0.28 + max(-value, 0.0) * 0.65, 1.0);
}
