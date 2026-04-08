#version 300 es
//? Simple color pass for PCA axis quads (main vs perpendicular).
//* Purpose: visually separate PCA axes in the overlay.
//! Output is the screen framebuffer for the PCA overlay.
precision highp float;
precision mediump int;

uniform int isPerp;
uniform int is3D;

in vec2 vLocal;
out vec4 fragColor; //! screen output

void main() {
    // Visual simple: degradado según coord local del quad
    // vec2 uv = vLocal * 0.5 + 0.5; // convertir [-1,1] a [0,1]
    // fragColor = vec4(uv, 0.5, 1.0);
    if(isPerp==0)
        fragColor = vec4(0.,0., 0.5, is3D==0?1.:0.2);
    else
        fragColor = vec4(0.5,0., 0., is3D==0?1.:0.2);
}

