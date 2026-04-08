#version 300 es
//? Gradient descent refinement with L1 shrinkage over the packed coefficient vector [f terms..., s terms...].
//* Purpose: encourage sparse libraries while lowering fit cost vs raw LS.
//! Outputs are model grids sized [tauMax, tauMax], split as packed coefficients + metadata.
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;   //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauMom2;   //* size: [nBins, tauMax*tauMax] = [fKM,aKM,fErr,aErr]
uniform sampler2D tauXiF;    //* packed coeffs[0..3]
uniform sampler2D tauXiS;    //* packed coeffs[4..7]
uniform sampler2D tauXiMeta; //* [cost, valid, nUsed, reserved]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float lrF;
uniform float lrS;
uniform float l1F;
uniform float l1S;
uniform int nIter;

//!Salida
//? Start from LS, run L1-regularized descent, then keep the better of init vs optimized.
//! Writes to RGBA targets sized [tauMax, tauMax].
layout(location = 0) out vec4 tauXiFOpt; //! packed coeffs[0..3]
layout(location = 1) out vec4 tauXiSOpt; //! packed coeffs[4..7]
layout(location = 2) out vec4 tauXiMetaOpt; //! [cost, valid(0/1), nUsed, reserved]

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT

float tauFBasis(int termIdx, float x){
    return 0.0; //Var@TAU_F_BASIS_BODY
}

float tauSBasis(int termIdx, float x){
    return 0.0; //Var@TAU_S_BASIS_BODY
}

float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_F_TERMS) break;
        acc += coeffs[i] * tauFBasis(i, x);
    }
    return acc;
}

float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
}

float tauSObsErr(float aKM, float aErr){
    float yS = sqrt(max(2.0 * aKM, 0.0));
    //Revisor: corregido el comentario para dejar explicito que la funcion objetivo usa y = sqrt(2 a) para linealizar s(x).
    //Revisor: corregido el peso asociado propagando el error a y; sin ese paso, los pesos de la diffusion quedaban mal calibrados.
    return aErr / max(yS, 1e-4);
}

void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){
    coeffs[0] = p0.x; coeffs[1] = p0.y; coeffs[2] = p0.z; coeffs[3] = p0.w;
    coeffs[4] = p1.x; coeffs[5] = p1.y; coeffs[6] = p1.z; coeffs[7] = p1.w;
}

void tauPack(float coeffs[TAU_MAX_TOTAL_TERMS], out vec4 p0, out vec4 p1){
    p0 = vec4(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
    p1 = vec4(coeffs[4], coeffs[5], coeffs[6], coeffs[7]);
}

float softThreshold(float v, float t){
    float a = abs(v) - t;
    if (a <= 0.0) return 0.0;
    return sign(v) * a;
}

float tauModelCost(float coeffs[TAU_MAX_TOTAL_TERMS], int modelIdx, float bw, out float nUsed){
    float cost = 0.0;
    float minS = 1e30;
    nUsed = 0.0;
    for (int b=0; b<256; b++){
        if (b >= nBins) break;
        vec4 st = texelFetch(tauMom2, ivec2(b, modelIdx), 0);
        float fKM = st.x;
        float aKM = st.y;
        float fErr = st.z;
        float aErr = st.w;
        if (fErr < 0.0 || aErr < 0.0) continue;

        float x = (float(b) + 0.5) * bw;
        float fFit = tauEvalF(coeffs, x);
        float yS = sqrt(max(2.0 * aKM, 0.0));
        float sFit = tauEvalS(coeffs, x);
        minS = min(minS, sFit);

        float ySErr = tauSObsErr(aKM, aErr);
        float wF = 1.0 / max(fErr * fErr, 1e-6);
        float wA = 1.0 / max(ySErr * ySErr, 1e-6);
        cost += wF * (fKM - fFit) * (fKM - fFit) + wA * (yS - sFit) * (yS - sFit);
        nUsed += 1.0;
    }
    if(minS <= 0.0) return 1e9;
    return cost / max(nUsed, 1.0);
}

void tauZeroOutputs(float nUsed){
    tauXiFOpt = vec4(0.0);
    tauXiSOpt = vec4(0.0);
    tauXiMetaOpt = vec4(1e9, 0.0, nUsed, 0.0);
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    if (tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || TAU_TOTAL_TERMS > TAU_MAX_TOTAL_TERMS){
        tauZeroOutputs(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-9) / float(nBins);

    vec4 seed0 = texelFetch(tauXiF, ivec2(tau-1, subseq), 0);
    vec4 seed1 = texelFetch(tauXiS, ivec2(tau-1, subseq), 0);
    vec4 meta0 = texelFetch(tauXiMeta, ivec2(tau-1, subseq), 0);
    if (meta0.y < 0.5 || meta0.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauZeroOutputs(meta0.z);
        return;
    }

    float coeffs0[TAU_MAX_TOTAL_TERMS];
    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(seed0, seed1, coeffs0);
    tauUnpack(seed0, seed1, coeffs);

    for (int it=0; it<16; it++){
        if (it >= nIter) break;

        float grad[TAU_MAX_TOTAL_TERMS];
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) grad[i] = 0.0;
        float nUsed = 0.0;

        for (int b=0; b<256; b++){
            if (b >= nBins) break;
            vec4 st = texelFetch(tauMom2, ivec2(b, modelIdx), 0);
            float fKM = st.x;
            float aKM = st.y;
            float fErr = st.z;
            float aErr = st.w;
            if (fErr < 0.0 || aErr < 0.0) continue;

            float x = (float(b) + 0.5) * bw;
            float fFit = tauEvalF(coeffs, x);
            float yS = sqrt(max(2.0 * aKM, 0.0));
            float sFit = tauEvalS(coeffs, x);
            float ySErr = tauSObsErr(aKM, aErr);
            float wF = 1.0 / max(fErr * fErr, 1e-6);
            float wA = 1.0 / max(ySErr * ySErr, 1e-6);

            for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                if(i < TAU_F_TERMS){
                    grad[i] += (2.0 * wF * (fFit - fKM)) * tauFBasis(i, x);
                } else if(i < TAU_TOTAL_TERMS){
                    int sIdx = i - TAU_F_TERMS;
                    grad[i] += (4.0 * wA * (sFit - yS)) * tauSBasis(sIdx, x);
                }
            }
            nUsed += 1.0;
        }

        if (nUsed < float(max(TAU_F_TERMS, TAU_S_TERMS))) break;

        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            if(i >= TAU_TOTAL_TERMS) break;
            float lr = (i < TAU_F_TERMS) ? lrF : lrS;
            float l1 = (i < TAU_F_TERMS) ? l1F : l1S;
            coeffs[i] -= lr * (grad[i] / max(nUsed, 1.0));
            coeffs[i] = softThreshold(coeffs[i], l1 * lr);
        }
    }

    float nA = 0.0;
    float cA = tauModelCost(coeffs, modelIdx, bw, nA);
    float nB = 0.0;
    float cB = tauModelCost(coeffs0, modelIdx, bw, nB);

    bool keepInit = cB < cA;
    float outCoeffs[TAU_MAX_TOTAL_TERMS];
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) outCoeffs[i] = keepInit ? coeffs0[i] : coeffs[i];
    float outCost = keepInit ? cB : cA;
    float outN = keepInit ? nB : nA;
    float outValid = (outCost < 1e8 && outN >= float(max(TAU_F_TERMS, TAU_S_TERMS))) ? 1.0 : 0.0;

    tauPack(outCoeffs, tauXiFOpt, tauXiSOpt);
    tauXiMetaOpt = vec4(outCost, outValid, outN, 0.0);
}
