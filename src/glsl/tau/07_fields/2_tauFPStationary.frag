#version 300 es
//? Compare histogram pHist with steady-state p(x) from initial and final models.
//* Purpose: visualize how refinement shifts the stationary distribution.
//! Output is a 1D field texture size [nBins, 1].
precision highp float;
precision mediump int;

uniform sampler2D tauMom1; //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauXiFOpt; //* init packed coeffs[0..3]
uniform sampler2D tauXiSOpt; //* init packed coeffs[4..7]
uniform sampler2D tauXiMetaOpt; //* init meta [cost, valid, nUsed, reserved]
uniform sampler2D tauXiFFinal; //* final packed coeffs[0..3]
uniform sampler2D tauXiSFinal; //* final packed coeffs[4..7]
uniform sampler2D tauXiMetaFinal; //* final meta [cost, valid, nUsed, reserved]
uniform sampler2D tauBest; //* size: [1, 1] = [bestTau, bestSubseq, cost, found]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int selectedTau;
uniform int selectedSubseq;
uniform int useSelected;

in vec2 vUV;
//!Salida
//? One texel per bin with histogram vs model stationary probabilities.
layout(location = 0) out vec4 tauFPStationary; //! size: [nBins, 1] = [pHist, pInit, pFinal, valid]

const int MAX_BINS = 256;
const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT

float tauFBasis(int termIdx, float x){ return 0.0; //Var@TAU_F_BASIS_BODY
}
float tauSBasis(int termIdx, float x){ return 0.0; //Var@TAU_S_BASIS_BODY
}
void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){ coeffs[0]=p0.x; coeffs[1]=p0.y; coeffs[2]=p0.z; coeffs[3]=p0.w; coeffs[4]=p1.x; coeffs[5]=p1.y; coeffs[6]=p1.z; coeffs[7]=p1.w; }
float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_F_TERMS) break; acc += coeffs[i]*tauFBasis(i,x);} return acc; }
float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_S_TERMS) break; acc += coeffs[TAU_F_TERMS+i]*tauSBasis(i,x);} return 2.0*acc; }
float tauEvalA(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float s=tauEvalS(coeffs,x); return 0.5*s*s; }
float finite1(float v){ return (abs(v) < 1e30) ? 1.0 : 0.0; }

void computePAtBin(float coeffs[TAU_MAX_TOTAL_TERMS], float bw, int b, out float pBin, out float valid){
    float maxLog = -1e30;
    float integ = 0.0;
    float prevX = 0.5 * bw;
    float prevF = tauEvalF(coeffs, prevX);
    float prevA = tauEvalA(coeffs, prevX);
    if(prevA <= 1e-12){ pBin = 0.0; valid = 0.0; return; }
    float prevQ = prevF / prevA;
    float ok = finite1(prevF) * finite1(prevA);
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        float x = (float(i) + 0.5) * bw;
        float fi = tauEvalF(coeffs, x);
        float ai = tauEvalA(coeffs, x);
        if(ai <= 1e-12){ pBin = 0.0; valid = 0.0; return; }
        float qi = fi / ai;
        if(i > 0) integ += 0.5 * (prevQ + qi) * bw;
        float logp = -integ - log(ai);
        maxLog = max(maxLog, logp);
        ok *= finite1(fi) * finite1(ai) * finite1(logp);
        prevQ = qi;
    }

    float denom = 0.0;
    float integ2 = 0.0;
    float prevQ2 = prevF / prevA;
    float logpB = -1e30;
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        float x = (float(i) + 0.5) * bw;
        float fi = tauEvalF(coeffs, x);
        float ai = tauEvalA(coeffs, x);
        float qi = fi / max(ai, 1e-12);
        if(i > 0) integ2 += 0.5 * (prevQ2 + qi) * bw;
        float logp = -integ2 - log(max(ai, 1e-12));
        denom += exp(logp - maxLog);
        if(i == b) logpB = logp;
        prevQ2 = qi;
    }

    denom = max(denom, 1e-9);
    pBin = exp(logpB - maxLog) / denom;
    valid = ok;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int b = pos.x;
    if(b < 0 || b >= nBins){ tauFPStationary = vec4(0.0); return; }

    vec4 best = texelFetch(tauBest, ivec2(0,0), 0);
    int tau = max(1, int(floor(best.x + 0.5)));
    int subseq = max(0, int(floor(best.y + 0.5)));
    if(useSelected > 0){ tau = max(1, selectedTau); subseq = max(0, selectedSubseq); }
    int tMin = max(tauMin, 1);
    if(tau > tauMax || tau < tMin || subseq >= tau){ tauFPStationary = vec4(0.0); return; }

    int modelIdx = (tau - 1) * tauMax + subseq;
    vec4 metaInit = texelFetch(tauXiMetaOpt, ivec2(tau-1, subseq), 0);
    vec4 metaFinal = texelFetch(tauXiMetaFinal, ivec2(tau-1, subseq), 0);
    if(metaInit.y < 0.5 || metaFinal.y < 0.5){ tauFPStationary = vec4(0.0); return; }

    float coeffsInit[TAU_MAX_TOTAL_TERMS];
    float coeffsFinal[TAU_MAX_TOTAL_TERMS];
    tauUnpack(texelFetch(tauXiFOpt, ivec2(tau-1, subseq), 0), texelFetch(tauXiSOpt, ivec2(tau-1, subseq), 0), coeffsInit);
    tauUnpack(texelFetch(tauXiFFinal, ivec2(tau-1, subseq), 0), texelFetch(tauXiSFinal, ivec2(tau-1, subseq), 0), coeffsFinal);

    float sumH = 0.0;
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        sumH += max(texelFetch(tauMom1, ivec2(i, modelIdx), 0).x, 0.0);
    }
    if(sumH <= 0.0){ tauFPStationary = vec4(0.0); return; }

    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-6) / float(nBins);
    float cntB = max(texelFetch(tauMom1, ivec2(b, modelIdx), 0).x, 0.0);
    float pHist = cntB / sumH;

    float pInit = 0.0; float validInit = 0.0;
    float pFinal = 0.0; float validFinal = 0.0;
    computePAtBin(coeffsInit, bw, b, pInit, validInit);
    computePAtBin(coeffsFinal, bw, b, pFinal, validFinal);
    float valid = (validInit > 0.5 && validFinal > 0.5) ? 1.0 : 0.0;
    tauFPStationary = vec4(pHist, pInit, pFinal, valid);
}
