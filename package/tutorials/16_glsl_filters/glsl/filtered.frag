#version 300 es
precision highp float;
const float LEVEL = 0.4;
out vec4 color;
void main(){ color=vec4(LEVEL,gl_FragCoord.x/640.0,0.2,1.0); }
