#version 300 es
//? Compute KL divergence between empirical histogram and model steady-state pdf.
//* Purpose: penalize models that fit moments but mismatch the full distribution.
//! Output is a model grid size [tauMax, tauMax].
precision highp float;
precision mediump int;

uniform sampler2D tauMom1; //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauXiFFinal; //* packed coeffs[0..3]
uniform sampler2D tauXiSFinal; //* packed coeffs[4..7]
uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float spanMax;

in vec2 vUV;
//!Salida
//? Per-model KL plus validity/span diagnostics.
layout(location = 0) out vec4 tauModelKL; //! size: [tauMax, tauMax] = [kl, valid, spanN, sumH]

const int MAX_BINS = 256;
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
        tauModelKL = vec4(1e9, 0.0, 1.0, 0.0);
        return;
    }

    vec4 meta = texelFetch(tauXiMetaFinal, ivec2(tau-1, subseq), 0);
    if(meta.y < 0.5 || meta.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauModelKL = vec4(1e9, 0.0, 1.0, 0.0);
        return;
    }

    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(texelFetch(tauXiFFinal, ivec2(tau-1, subseq), 0), texelFetch(tauXiSFinal, ivec2(tau-1, subseq), 0), coeffs);

    int modelIdx = (tau - 1) * tauMax + subseq;
    float sumH = 0.0;
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        sumH += max(texelFetch(tauMom1, ivec2(i, modelIdx), 0).x, 0.0);
    }
    if(sumH <= 0.0){
        tauModelKL = vec4(1e9, 0.0, 1.0, 0.0);
        return;
    }

    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-6) / float(nBins);

    float integ = 0.0;
    float maxLog = -1e30;
    float minLog = 1e30;
    float prevX = 0.5 * bw;
    float prevF = tauEvalF(coeffs, prevX);
    float prevA = tauEvalA(coeffs, prevX);
    if(prevA <= 1e-12){
        tauModelKL = vec4(1e9, 0.0, 1.0, 0.0);
        return;
    }
    float prevQ = prevF / prevA;
    float finiteAll = isFiniteVal(prevF) * isFiniteVal(prevA);


    //Se integra porque? Porque el KL requiere la integral de pS(x) log(pS(x)/pH(x)) dx, donde pS es la pdf del modelo y pH es la pdf empírica. La integral se aproxima numéricamente usando la regla del trapecio sobre los bins.
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        float x = (float(i) + 0.5) * bw;
        float fi = tauEvalF(coeffs, x);
        float ai = tauEvalA(coeffs, x);
        if(ai <= 1e-12){ finiteAll = 0.0; break; }
        float qi = fi / ai;
        if(i > 0) integ += 0.5 * (prevQ + qi) * bw;
        float logp = -integ - log(ai);
        maxLog = max(maxLog, logp);
        minLog = min(minLog, logp);
        finiteAll *= isFiniteVal(fi) * isFiniteVal(ai) * isFiniteVal(logp);
        prevQ = qi;
    }

    float denom = 0.0;
    float integ2 = 0.0;
    float prevQ2 = prevF / prevA;
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        float x = (float(i) + 0.5) * bw;
        float fi = tauEvalF(coeffs, x);
        float ai = tauEvalA(coeffs, x);
        float qi = fi / max(ai, 1e-12);
        if(i > 0) integ2 += 0.5 * (prevQ2 + qi) * bw;
        float logp = -integ2 - log(max(ai, 1e-12));
        denom += exp(logp - maxLog);
        prevQ2 = qi;
    }
    denom = max(denom, 1e-9);

    float kl = 0.0;
    float integ3 = 0.0;
    float prevQ3 = prevF / prevA;
    for(int i=0; i<MAX_BINS; i++){
        if(i >= nBins) break;
        float x = (float(i) + 0.5) * bw;
        float fi = tauEvalF(coeffs, x);
        float ai = tauEvalA(coeffs, x);
        float qi = fi / max(ai, 1e-12);
        if(i > 0) integ3 += 0.5 * (prevQ3 + qi) * bw;
        float logp = -integ3 - log(max(ai, 1e-12));
        float pS = exp(logp - maxLog) / denom;
        float pH = max(texelFetch(tauMom1, ivec2(i, modelIdx), 0).x, 0.0) / sumH;
        if(pH > 1e-12) kl += pH * log(pH / max(pS, 1e-12));
        prevQ3 = qi;
    }


    //kl se calcula como: kl = sum_over_bins( pH(x) * log(pH(x)/pS(x)) ),
    // donde pH(x) es la pdf empírica dada por el histograma de datos, y
    // pS(x) es la pdf del modelo dada por la función ajustada.
    // La integral se aproxima numéricamente usando la regla del trapecio sobre los bins, 
    //y se normaliza para evitar problemas numéricos. El resultado es el KL divergence que mide cuánto difiere la distribución del modelo de la distribución empírica.
    float span = maxLog - minLog;
    float spanN = clamp(span / max(spanMax, 1e-6), 0.0, 1.0);
    float valid = (finiteAll > 0.5 && !isnan(kl) && !isinf(kl) && kl >= 0.0 && span <= spanMax) ? 1.0 : 0.0;
    tauModelKL = vec4(kl, valid, spanN, sumH);
}
