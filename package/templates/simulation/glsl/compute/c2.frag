#version 300 es
precision highp float;
uniform sampler2D fieldA;
uniform sampler2D fieldB;
out vec4 color;
uniform float uMu1;
float neighbor(ivec2 p, ivec2 offset, float center) {
  ivec2 q = clamp(p + offset, ivec2(0), textureSize(fieldA, 0) - ivec2(1));
  return texelFetch(fieldB, q, 0).r > 0.0 ? abs(texelFetch(fieldA, q, 0).r) : center;
}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float center = texelFetch(fieldA, p, 0).r;
  float adjacent = max(max(neighbor(p, ivec2(1, 0), center), neighbor(p, ivec2(-1, 0), center)),
                       max(neighbor(p, ivec2(0, 1), center), neighbor(p, ivec2(0, -1), center)));
  color = vec4(clamp(max(center * 0.993, mix(adjacent, center, uMu1)), 0.0, 1.0), 0.0, 0.0, 1.0);
}
