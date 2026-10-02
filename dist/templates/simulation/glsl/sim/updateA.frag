#version 300 es
precision highp float;
uniform sampler2D fieldA;
uniform sampler2D fieldB;
uniform float uClickX;
uniform float uClickY;
uniform float uRadius;
uniform float uClickValue;
out vec4 color;
const float MU1 = 0.24;

float candidate(ivec2 p, ivec2 delta, float center) {
  ivec2 q = clamp(p + delta, ivec2(0), textureSize(fieldA, 0) - ivec2(1));
  float signal = texelFetch(fieldB, q, 0).r;
  return signal > 0.0 ? abs(texelFetch(fieldA, q, 0).r) : center;
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float center = texelFetch(fieldA, p, 0).r;
  float adjacent = max(max(candidate(p, ivec2(1, 0), center), candidate(p, ivec2(-1, 0), center)),
                       max(candidate(p, ivec2(0, 1), center), candidate(p, ivec2(0, -1), center)));
  float nextValue = max(center * 0.993, adjacent * (1.0 - MU1) + center * MU1);
  if (distance(gl_FragCoord.xy, vec2(uClickX, uClickY)) <= uRadius) nextValue = uClickValue;
  color = vec4(clamp(nextValue, 0.0, 1.0), 0.0, 0.0, 1.0);
}
