#version 300 es
//? Colorize each vertex by index to distinguish paths.
//* Purpose: quick visual separation of trajectories without extra buffers.
//! Output is the screen framebuffer.
precision highp float;
precision mediump int;

uniform vec3 lineColor;
uniform int datosXLength;
uniform int lCromatin;

flat in int v_idx;

out vec4 outColor; //! screen output


float hue2rgb(float p, float q, float t){
    if(t < 0.0) t += 1.0;
    if(t > 1.0) t -= 1.0;
    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if(t < 1.0/2.0) return q;
    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(float h, float s, float l){
    float q = l < 0.5 ? l * (1.0 + s) : (l + s - l*s);
    float p = 2.0 * l - q;
    return vec3(
        hue2rgb(p, q, h + 1.0/3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0/3.0)
    );
}


void main(){
    outColor=vec4(clamp(hsl2rgb(mod(float(v_idx)/float(lCromatin),1.),1.,0.5),vec3(0.),vec3(1.)),0.6);
}


