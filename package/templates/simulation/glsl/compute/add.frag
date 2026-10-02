#version 300 es
precision highp float;
uniform sampler2D fieldA;
uniform sampler2D fieldB;
uniform int uTarget;
uniform float uClickX;
uniform float uClickY;
uniform float uRadius;
uniform float uClickValue;
out vec4 color;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float previous = uTarget == 1 ? texelFetch(fieldA, p, 0).r : texelFetch(fieldB, p, 0).r;
  float addition = distance(gl_FragCoord.xy, vec2(uClickX, uClickY)) <= uRadius ? uClickValue : 0.0;
  color = vec4(clamp(previous + addition, -1.0, 1.0), 0.0, 0.0, 1.0);
}
