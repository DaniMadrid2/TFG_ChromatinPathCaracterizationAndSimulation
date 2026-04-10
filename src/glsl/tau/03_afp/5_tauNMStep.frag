#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauNMXiFRead;
uniform sampler2D tauNMXiSRead;
uniform sampler2D tauNMCost;
uniform int tauMax;
uniform int tauMin;
uniform float nelderAlpha;
uniform float nelderGamma;
uniform float nelderRho;
uniform float nelderSigma;
uniform float nelderStopEps;

layout(location = 0) out vec4 tauNMXiFWrite;
layout(location = 1) out vec4 tauNMXiSWrite;
layout(location = 2) out vec4 tauNMMetaWrite;

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT
const int NM_VERTS = TAU_TOTAL_TERMS + 1;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

int rowOf(int vert, int subseq, int tauMax){ return vert * tauMax + subseq; }
void swapV(int i, int j, inout vec4 fArr[NM_VERTS], inout vec4 sArr[NM_VERTS], inout float costs[NM_VERTS], inout float valids[NM_VERTS], inout float uses[NM_VERTS]){
    vec4 tf = fArr[i]; fArr[i] = fArr[j]; fArr[j] = tf;
    vec4 ts = sArr[i]; sArr[i] = sArr[j]; sArr[j] = ts;
    float t = costs[i]; costs[i] = costs[j]; costs[j] = t;
    t = valids[i]; valids[i] = valids[j]; valids[j] = t;
    t = uses[i]; uses[i] = uses[j]; uses[j] = t;
}
void sortSimplex(inout vec4 fArr[NM_VERTS], inout vec4 sArr[NM_VERTS], inout float costs[NM_VERTS], inout float valids[NM_VERTS], inout float uses[NM_VERTS]){
    for(int i=1;i<NM_VERTS;i++) for(int j=i;j>0;j--) if(costs[j] < costs[j-1]) swapV(j,j-1,fArr,sArr,costs,valids,uses);
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int outVert = pos.y / tauMax;
    int subseq = pos.y - outVert * tauMax;
    int tMin = max(tauMin, 1);

    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || outVert < 0 || outVert >= NM_STORE_VERTS){
        tauNMXiFWrite = vec4(0.0); tauNMXiSWrite = vec4(0.0); tauNMMetaWrite = vec4(1e9,0.0,0.0,1.0); return;
    }

    vec4 fArr[NM_VERTS];
    vec4 sArr[NM_VERTS];
    float costs[NM_VERTS];
    float valids[NM_VERTS];
    float uses[NM_VERTS];
    float done0 = 0.0;
    for(int v=0; v<NM_VERTS; v++){
        int row = rowOf(v, subseq, tauMax);
        fArr[v] = texelFetch(tauNMXiFRead, ivec2(tau - 1, row), 0);
        sArr[v] = texelFetch(tauNMXiSRead, ivec2(tau - 1, row), 0);
        vec4 m = texelFetch(tauNMCost, ivec2(tau - 1, row), 0);
        costs[v] = m.x; valids[v] = m.y; uses[v] = m.z; done0 = max(done0, m.w);
    }
    sortSimplex(fArr, sArr, costs, valids, uses);

    float modelValid = valids[0];
    float modelUsed = uses[0];
    float simplexSpan = 0.0;
    simplexSpan = max(simplexSpan, abs(fArr[NM_VERTS-1].x - fArr[0].x));
    simplexSpan = max(simplexSpan, abs(fArr[NM_VERTS-1].y - fArr[0].y));
    simplexSpan = max(simplexSpan, abs(fArr[NM_VERTS-1].z - fArr[0].z));
    simplexSpan = max(simplexSpan, abs(fArr[NM_VERTS-1].w - fArr[0].w));
    simplexSpan = max(simplexSpan, abs(sArr[NM_VERTS-1].x - sArr[0].x));
    simplexSpan = max(simplexSpan, abs(sArr[NM_VERTS-1].y - sArr[0].y));
    simplexSpan = max(simplexSpan, abs(sArr[NM_VERTS-1].z - sArr[0].z));
    simplexSpan = max(simplexSpan, abs(sArr[NM_VERTS-1].w - sArr[0].w));
    float costSpan = abs(costs[NM_VERTS-1] - costs[0]);
    float doneFlag = (done0 > 0.5 || modelValid < 0.5) ? 1.0 : (1.0 - step(max(nelderStopEps, 1e-8), max(simplexSpan, costSpan)));

    vec4 outF = fArr[min(outVert, NM_VERTS - 1)];
    vec4 outS = sArr[min(outVert, NM_VERTS - 1)];

    if(doneFlag < 0.5 && outVert < NM_VERTS){
        vec4 avgF = vec4(0.0);
        vec4 avgS = vec4(0.0);
        for(int v=0; v<NM_VERTS-1; v++){
            avgF += fArr[v];
            avgS += sArr[v];
        }
        float invN = 1.0 / float(NM_VERTS - 1);
        avgF *= invN; avgS *= invN;

        vec4 refF = avgF + nelderAlpha * (avgF - fArr[NM_VERTS-1]);
        vec4 refS = avgS + nelderAlpha * (avgS - sArr[NM_VERTS-1]);
        vec4 expF = avgF + nelderGamma * (refF - avgF);
        vec4 expS = avgS + nelderGamma * (refS - avgS);
        vec4 conF = avgF + nelderRho * (fArr[NM_VERTS-1] - avgF);
        vec4 conS = avgS + nelderRho * (sArr[NM_VERTS-1] - avgS);

        if(outVert == NM_VERTS - 1){
            if(costs[1] < costs[NM_VERTS-1]){ outF = refF; outS = refS; }
            else if(costs[0] < costs[NM_VERTS-1]){ outF = conF; outS = conS; }
            else { outF = expF; outS = expS; }
        } else if(costs[0] >= costs[NM_VERTS-1] && outVert > 0 && outVert < NM_VERTS - 1){
            outF = fArr[0] + nelderSigma * (fArr[outVert] - fArr[0]);
            outS = sArr[0] + nelderSigma * (sArr[outVert] - sArr[0]);
        }
    }

    if(outVert >= NM_VERTS){
        tauNMXiFWrite = vec4(0.0); tauNMXiSWrite = vec4(0.0); tauNMMetaWrite = vec4(1e9,0.0,0.0,1.0); return;
    }
    tauNMXiFWrite = outF;
    tauNMXiSWrite = outS;
    tauNMMetaWrite = vec4(1e9, modelValid, modelUsed, doneFlag);
}
