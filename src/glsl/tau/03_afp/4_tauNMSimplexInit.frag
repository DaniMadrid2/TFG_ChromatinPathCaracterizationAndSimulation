#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauXiFOpt;
uniform sampler2D tauXiSOpt;
uniform sampler2D tauXiMetaOpt;
uniform int tauMax;
uniform int tauMin;
uniform float nelderShift;

layout(location = 0) out vec4 tauNMXiF;
layout(location = 1) out vec4 tauNMXiS;
layout(location = 2) out vec4 tauNMMeta;

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT
const int NM_VERTS = TAU_TOTAL_TERMS + 1;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int vert = pos.y / tauMax;
    int subseq = pos.y - vert * tauMax;
    int tMin = max(tauMin, 1);

    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || vert < 0 || vert >= NM_STORE_VERTS){
        tauNMXiF = vec4(0.0);
        tauNMXiS = vec4(0.0);
        tauNMMeta = vec4(1e9, 0.0, 0.0, 1.0);
        return;
    }

    vec4 seedF = texelFetch(tauXiFOpt, ivec2(tau - 1, subseq), 0);
    vec4 seedS = texelFetch(tauXiSOpt, ivec2(tau - 1, subseq), 0);
    vec4 seedM = texelFetch(tauXiMetaOpt, ivec2(tau - 1, subseq), 0);

    if(vert >= NM_VERTS || seedM.y < 0.5 || seedM.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauNMXiF = vec4(0.0);
        tauNMXiS = vec4(0.0);
        tauNMMeta = vec4(1e9, 0.0, seedM.z, 1.0);
        return;
    }

    tauNMXiF = seedF;
    tauNMXiS = seedS;
    if(vert > 0){
        int coord = vert - 1;
        if(coord == 0) tauNMXiF.x += max(nelderShift, 1e-5);
        else if(coord == 1) tauNMXiF.y += max(nelderShift, 1e-5);
        else if(coord == 2) tauNMXiF.z += max(nelderShift, 1e-5);
        else if(coord == 3) tauNMXiF.w += max(nelderShift, 1e-5);
        else if(coord == 4) tauNMXiS.x += max(nelderShift, 1e-5);
        else if(coord == 5) tauNMXiS.y += max(nelderShift, 1e-5);
        else if(coord == 6) tauNMXiS.z += max(nelderShift, 1e-5);
        else if(coord == 7) tauNMXiS.w += max(nelderShift, 1e-5);
    }
    tauNMMeta = vec4(1e9, seedM.y, seedM.z, 0.0);
}
