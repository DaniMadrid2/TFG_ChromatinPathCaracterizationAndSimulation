#version 300 es
precision highp float;
out vec4 color;
void main(){ color=vec4(gl_FragCoord.xy/8.0,0.4,1.0); }
