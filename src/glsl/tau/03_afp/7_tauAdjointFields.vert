#version 300 es
//? Full-screen quad to run the fragment shader once per output texel.
//* Purpose: drive GPU compute over a 2D grid without geometry.
//! gl_VertexID indexes a fixed 2-triangle quad.
const vec2 quad[6] = vec2[](
    vec2(-1.0,-1.0), vec2(1.0,-1.0), vec2(-1.0,1.0),
    vec2(-1.0,1.0), vec2(1.0,-1.0), vec2(1.0,1.0)
);
out vec2 vUV;
void main(){
    vec2 p = quad[gl_VertexID];
    vUV = p*0.5 + 0.5;
    gl_Position = vec4(p,0.0,1.0);
}

