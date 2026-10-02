#version 300 es
precision highp float;
uniform sampler2D fieldA;
out vec4 color;
void main() {
  float value = texelFetch(fieldA, ivec2(gl_FragCoord.xy), 0).r;
  color = vec4(0.07 + value * 0.85, 0.12 + value * 0.58, 0.18 + value * 0.35, 1.0);
}
