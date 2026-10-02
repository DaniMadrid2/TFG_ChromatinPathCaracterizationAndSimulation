#version 300 es
precision highp float;
uniform sampler2D fieldA;
out vec4 color;
void main() {
  float value = texelFetch(fieldA, ivec2(gl_FragCoord.xy), 0).r;
  color = vec4(0.07 + value * 0.85, 0.17 + value * 0.55, 0.23 + value * 0.20, 1.0);
}
