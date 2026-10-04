#version 300 es
precision highp float;
uniform float gain;
out vec4 color;
void main(){ color=vec4(gain,gl_FragCoord.x/640.0,0.5,1.0); }
