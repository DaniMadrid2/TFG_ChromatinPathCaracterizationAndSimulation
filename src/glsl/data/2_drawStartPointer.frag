#version 300 es
precision highp float;
precision mediump int;

uniform int useMeanColor;

out vec4 outColor;

void main(){
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if(r2 > 1.0){
        discard;
    }
    float edge = smoothstep(1.0, 0.75, sqrt(r2));
    vec3 colA = vec3(1.0, 0.85, 0.1);
    vec3 colB = vec3(1.0, 1.0, 0.65);
    if(useMeanColor != 0){
        colA = vec3(0.92, 0.35, 0.95);
        colB = vec3(1.0, 0.72, 0.96);
    }
    vec3 col = mix(colA, colB, edge);
    outColor = vec4(col, 0.95);
}
