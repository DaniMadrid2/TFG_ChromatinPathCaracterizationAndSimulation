#version 300 es
precision highp float;
uniform sampler2D source;
out vec4 color;
void main(){ color=texelFetch(source,ivec2(0,int(gl_FragCoord.y)),0); }
