#version 300 es
//? Full-screen quad to run the fragment shader once per output texel.
//* Purpose: drive GPU compute over a 2D grid without geometry.
//! gl_VertexID indexes a fixed 2-triangle quad.
precision highp float;

const vec2 quad[6] = vec2[](
    vec2(-1, -1), vec2(1, -1), vec2(-1, 1),
    vec2(-1, 1), vec2(1, -1), vec2(1, 1)
);
void main() {
    gl_Position = vec4(quad[gl_VertexID], 0.0, 1.0);
}


