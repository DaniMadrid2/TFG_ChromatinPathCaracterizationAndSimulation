#version 300 es
precision highp float;
uniform sampler2D first;
out vec4 color;
void main(){ color=vec4(0.2,0.5,0.8,1.0)+texture(first,vec2(0.5))*0.1; }
