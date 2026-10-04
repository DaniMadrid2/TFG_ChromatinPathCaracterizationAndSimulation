#version 300 es
precision highp float;
uniform float area;
uniform float aspect;
out vec4 color;
void main(){ color=vec4(aspect/2.0, area/400000.0,0.5,1.0); }
