#version 300 es
precision highp float;
uniform sampler2D source;
out vec4 color;
void main(){ color=texture(source,vec2(0.5))+vec4(0.1,0.2,0.3,1.0); }
