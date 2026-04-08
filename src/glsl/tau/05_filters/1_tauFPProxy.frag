#version 300 es
//? Build a stationary Fokker-Planck proxy and measure log-density span per model.
//* Purpose: reject models that imply non-normalizable or numerically unstable steady states.
//! Output is a model grid size [tauMax, tauMax].
precision highp float;
precision mediump int;

uniform sampler2D tauXiFFinal; //* packed coeffs[0..3]
uniform sampler2D tauXiSFinal; //* packed coeffs[4..7]
uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform sampler2D tauModelMask; //* size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
uniform sampler2D tauMom1; //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float logSpanMax;

in vec2 vUV;
//!Salida
//? Per-model FP proxy validity and normalized span for filtering.
layout(location = 0) out vec4 tauFPProxy; //! size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT

float tauFBasis(int termIdx, float x){ return 0.0; //Var@TAU_F_BASIS_BODY
}
float tauSBasis(int termIdx, float x){ return 0.0; //Var@TAU_S_BASIS_BODY
}

void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){
    coeffs[0]=p0.x; coeffs[1]=p0.y; coeffs[2]=p0.z; coeffs[3]=p0.w;
    coeffs[4]=p1.x; coeffs[5]=p1.y; coeffs[6]=p1.z; coeffs[7]=p1.w;
}
float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc=0.0;
    for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_F_TERMS) break; acc += coeffs[i]*tauFBasis(i,x); }
    return acc;
}
float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc=0.0;
    for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_S_TERMS) break; acc += coeffs[TAU_F_TERMS+i]*tauSBasis(i,x); }
    return 2.0*acc;
}
float tauEvalA(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float s=tauEvalS(coeffs,x); return 0.5*s*s; }
float isFiniteVal(float x){ return (abs(x) < 1e30) ? 1.0 : 0.0; }

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || TAU_TOTAL_TERMS > TAU_MAX_TOTAL_TERMS){
        tauFPProxy = vec4(0.0, 1e9, 0.0, 1.0);
        return;
    }

    vec4 meta = texelFetch(tauXiMetaFinal, ivec2(tau-1, subseq), 0);
    vec4 mk = texelFetch(tauModelMask, ivec2(tau-1, subseq), 0);
    float cost = meta.x;
    float valid = (meta.y > 0.5 && meta.z >= float(max(TAU_F_TERMS, TAU_S_TERMS)) && mk.x > 0.5) ? 1.0 : 0.0;
    if(valid < 0.5){
        tauFPProxy = vec4(0.0, cost, 0.0, 1.0);
        return;
    }

    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(texelFetch(tauXiFFinal, ivec2(tau-1, subseq), 0), texelFetch(tauXiSFinal, ivec2(tau-1, subseq), 0), coeffs);

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float dx = max(maxAbs, 1e-6) / float(max(nBins, 1));
    //Revisor: corregida la coordenada de evaluacion. El ajuste LS/AFP se hizo en la coordenada fisica x=(b+1/2) bw,
    //Revisor: y aqui se usa ahora esa misma malla; antes, usar x normalizada 0..1 deformaba artificialmente f, s y el potencial efectivo.
    float integ = 0.0;
    float minLog = 1e30;
    float maxLog = -1e30;
    float finiteAll = 1.0;

    float prevX = 0.5 * dx;
    float prevF = tauEvalF(coeffs, prevX);
    float prevA = tauEvalA(coeffs, prevX);
    if(prevA <= 1e-12){
        tauFPProxy = vec4(0.0, cost, 0.0, 1.0);
        return;
    }
    float prevQ = prevF / prevA;
    float prevLogP = -log(prevA);
    minLog = prevLogP;
    maxLog = prevLogP;
    finiteAll *= isFiniteVal(prevF) * isFiniteVal(prevA) * isFiniteVal(prevLogP);

    for(int b=1; b<256; b++){
        if(b >= nBins) break;
        float x = (float(b) + 0.5) * dx;
        float f = tauEvalF(coeffs, x);
        float aVal = tauEvalA(coeffs, x);
        if(aVal <= 1e-12){ finiteAll = 0.0; break; }
        float q = f / aVal;
        integ += 0.5 * (prevQ + q) * dx;
        float logP = -integ - log(aVal);
        minLog = min(minLog, logP);
        maxLog = max(maxLog, logP);
        finiteAll *= isFiniteVal(f) * isFiniteVal(aVal) * isFiniteVal(logP);
        prevQ = q;
    }

    float span = maxLog - minLog;
    float spanN = clamp(span / max(logSpanMax, 1e-6), 0.0, 1.0);
    float validFP = (finiteAll > 0.5 && span <= logSpanMax) ? 1.0 : 0.0;
    tauFPProxy = vec4(validFP, cost, validFP, spanN);
}
