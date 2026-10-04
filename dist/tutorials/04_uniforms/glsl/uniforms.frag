#version 300 es
precision highp float;
uniform float gain;
uniform int phase;
out vec4 color;
void main(){ color=vec4(gain, float(phase)*0.2, 0.5, 1.0); }
