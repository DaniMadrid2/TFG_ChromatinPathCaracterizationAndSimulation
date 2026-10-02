#version 300 es
precision highp float;

in vec2 aPos;

uniform float offsetX;
uniform float offsetY;

void main() { 
    gl_Position = vec4(aPos * 2.0 - 1.0 + vec2(offsetX, offsetY), 0.0, 1.0);
}
