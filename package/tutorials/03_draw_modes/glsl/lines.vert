#version 300 es
precision highp float;
in vec2 aPos;
void main(){ gl_Position=vec4(aPos,0.0,1.0); gl_PointSize=8.0; }
