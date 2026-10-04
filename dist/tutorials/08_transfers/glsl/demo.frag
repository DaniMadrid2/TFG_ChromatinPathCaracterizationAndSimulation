#version 300 es
precision highp float;
uniform sampler2D positionTexture;
out vec4 color;
void main(){ color=vec4(texelFetch(positionTexture,ivec2(0,0),0).xy,0.5,1.0); }
