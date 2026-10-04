#version 300 es
precision highp float;
uniform sampler2D position;
out vec4 color;
void main(){ color=texelFetch(position,ivec2(gl_FragCoord.xy),0)+vec4(0.01,0.0,0.0,0.0); }
