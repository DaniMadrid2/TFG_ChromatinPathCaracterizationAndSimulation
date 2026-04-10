#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauNMXiFRead;
uniform sampler2D tauNMXiSRead;
uniform sampler2D tauNMCost;
uniform sampler2D tauXiFOpt;
uniform sampler2D tauXiSOpt;
uniform sampler2D tauXiMetaOpt;
uniform int tauMax;
uniform int tauMin;

layout(location = 0) out vec4 tauXiFFinal;
layout(location = 1) out vec4 tauXiSFinal;
layout(location = 2) out vec4 tauXiMetaFinal;

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT
const int NM_VERTS = TAU_TOTAL_TERMS + 1;

int rowOf(int vert, int subseq, int tauMax){ return vert * tauMax + subseq; }

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;
    int tMin = max(tauMin, 1);
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauXiFFinal = vec4(0.0); tauXiSFinal = vec4(0.0); tauXiMetaFinal = vec4(1e9,0.0,0.0,1.0); return;
    }

    float bestCost = 1e30;
    vec4 bestF = vec4(0.0);
    vec4 bestS = vec4(0.0);
    vec4 bestM = vec4(1e9,0.0,0.0,1.0);
    for(int v=0; v<NM_VERTS; v++){
        int row = rowOf(v, subseq, tauMax);
        vec4 m = texelFetch(tauNMCost, ivec2(tau - 1, row), 0);
        if(m.y > 0.5 && m.x < bestCost){
            bestCost = m.x;
            bestF = texelFetch(tauNMXiFRead, ivec2(tau - 1, row), 0);
            bestS = texelFetch(tauNMXiSRead, ivec2(tau - 1, row), 0);
            bestM = m;
        }
    }
    if(bestM.y < 0.5){
        vec4 seedF = texelFetch(tauXiFOpt, ivec2(tau - 1, subseq), 0);
        vec4 seedS = texelFetch(tauXiSOpt, ivec2(tau - 1, subseq), 0);
        vec4 seedM = texelFetch(tauXiMetaOpt, ivec2(tau - 1, subseq), 0);
        tauXiFFinal = seedF;
        tauXiSFinal = seedS;
        tauXiMetaFinal = seedM;
        return;
    }
    tauXiFFinal = bestF;
    tauXiSFinal = bestS;
    tauXiMetaFinal = bestM;
}
