#version 300 es
precision highp float;
in vec2 aPos;
in vec3 aColor;
out vec3 vColor;
void main(){ vColor=aColor; gl_Position=vec4(aPos,0.0,1.0); }
