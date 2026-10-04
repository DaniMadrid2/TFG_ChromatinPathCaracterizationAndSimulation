#version 300 es
precision highp float;

uniform sampler2D positionTextureNext;

uniform float offsetX;
uniform float offsetY;

void main() { 
    vec2 position = texelFetch(positionTextureNext, ivec2(0, gl_VertexID), 0).xy;
    gl_Position = vec4(position * 2.0 - 1.0 + vec2(offsetX, offsetY), 0.0, 1.0);
    gl_PointSize = 10.0;
}
