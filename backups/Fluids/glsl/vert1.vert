#version 300 es
precision highp float;

in vec2 a_position;   // Input vertex position (full-screen quad)
in vec2 a_texCoord;   // Input texture coordinates
in float a_size;   // Input texture coordinates

out vec2 v_texCoord;  // Output texture coordinates to fragment shader
out float v_size;  // Output texture coordinates to fragment shader
flat out int v_idx;      

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_idx=gl_VertexID;
    v_size=a_size;
}
