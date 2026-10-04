#version 300 es
precision highp float;
uniform float brightness;
out vec4 color;
void main(){ color=vec4(brightness,gl_FragCoord.y/480.0,0.3,1.0); }
