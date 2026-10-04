#version 300 es
precision highp float;
out vec4 color;
void main(){ color=vec4(gl_FragCoord.xy/vec2(640.0,480.0),0.2,1.0); }
