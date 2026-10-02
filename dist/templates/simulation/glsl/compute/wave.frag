#version 300 es
precision highp float;
uniform sampler2D fieldANext;
uniform sampler2D fieldB;
uniform float uTime;
out vec4 color;
uniform float uEpsilon1;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float field = texelFetch(fieldANext, p, 0).r;
  float previous = texelFetch(fieldB, p, 0).r;
  float wave = field > 0.001 ? sin(uTime * uEpsilon1 + float(p.x) * 0.08 + float(p.y) * 0.045) : 0.0;
  color = vec4(mix(previous, wave, 0.28), 0.0, 0.0, 1.0);
}
