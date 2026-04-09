#version 300 es
//? Nelder-Mead refinement timed to the AFPOPT grid. Each fragment executes a simplified Nelder-Mead loop
//* Purpose: approximate the AFP cost landscape without leaving the shader pipeline, then export the best coefficients.
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;   //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauMom2;   //* size: [nBins, tauMax*tauMax] = [fKM,aKM,fErr,aErr]
uniform sampler2D tauXiFOpt;    //* packed coeffs[0..3]
uniform sampler2D tauXiSOpt;    //* packed coeffs[4..7]
uniform sampler2D tauXiMetaOpt; //* [cost, valid, nUsed, reserved]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float l2F;
uniform float l2S;
uniform float nelderShift;
uniform float nelderAlpha;
uniform float nelderGamma;
uniform float nelderRho;
uniform float nelderSigma;
uniform int nelderIters;

layout(location = 0) out vec4 tauXiFFinal;
layout(location = 1) out vec4 tauXiSFinal;
layout(location = 2) out vec4 tauXiMetaFinal;

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT
const int NM_MAX_ITER = 24;
const int NM_VERTS = TAU_TOTAL_TERMS + 1;

float tauFBasis(int termIdx, float x){
    return 0.0; //Var@TAU_F_BASIS_BODY
}

float tauSBasis(int termIdx, float x){
    return 0.0; //Var@TAU_S_BASIS_BODY
}

float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_TOTAL_TERMS; i++){
        if(i >= TAU_F_TERMS) break;
        acc += coeffs[i] * tauFBasis(i, x);
    }
    return acc;
}

float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
}

float tauSObsErr(float aKM, float aErr){
    float yS = sqrt(max(2.0 * aKM, 0.0));
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

float tauObjective(float coeffs[TAU_MAX_TOTAL_TERMS], int modelIdx, float bw, out float nUsed){
    float cost = 0.0;
    float minS = 1e30;
    nUsed = 0.0;
    for(int b=0; b<256; b++){
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

    float l2 = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_TOTAL_TERMS) break;
        float lam = (i < TAU_F_TERMS) ? l2F : l2S;
        l2 += lam * coeffs[i] * coeffs[i];
    }
    return cost / max(nUsed, 1.0) + l2;
}

void tauZeroOutputs(float nUsed){
    tauXiFFinal = vec4(0.0);
    tauXiSFinal = vec4(0.0);
    tauXiMetaFinal = vec4(1e9, 0.0, nUsed, 0.0);
}

void copyCoeffs(float src[TAU_MAX_TOTAL_TERMS], out float dst[TAU_MAX_TOTAL_TERMS]){
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) dst[i] = src[i];
}

void swapVertices(int i, int j, inout float simplex[NM_VERTS][TAU_MAX_TOTAL_TERMS], inout float costs[NM_VERTS], inout float uses[NM_VERTS]){
    float tmp[TAU_MAX_TOTAL_TERMS];
    copyCoeffs(simplex[i], tmp);
    copyCoeffs(simplex[j], simplex[i]);
    copyCoeffs(tmp, simplex[j]);
    float tmpCost = costs[i]; costs[i] = costs[j]; costs[j] = tmpCost;
    float tmpUse = uses[i]; uses[i] = uses[j]; uses[j] = tmpUse;
}

void sortSimplex(inout float simplex[NM_VERTS][TAU_MAX_TOTAL_TERMS], inout float costs[NM_VERTS], inout float uses[NM_VERTS]){
    for(int i=1; i<NM_VERTS; i++){
        for(int j=i; j>0; j--){
            if(costs[j] < costs[j-1]){
                swapVertices(j, j-1, simplex, costs, uses);
            }
        }
    }
}

void computeCentroid(float simplex[NM_VERTS][TAU_MAX_TOTAL_TERMS], out float centroid[TAU_MAX_TOTAL_TERMS]){
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) centroid[i] = 0.0;
    for(int v=0; v<NM_VERTS-1; v++){
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            centroid[i] += simplex[v][i];
        }
    }
    float invN = 1.0 / float(NM_VERTS - 1);
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) centroid[i] *= invN;
}

void deltaBlend(float centroid[TAU_MAX_TOTAL_TERMS], float target[TAU_MAX_TOTAL_TERMS], float factor, out float result[TAU_MAX_TOTAL_TERMS]){
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        result[i] = centroid[i] + factor * (centroid[i] - target[i]);
    }
}

void targetBlend(float centroid[TAU_MAX_TOTAL_TERMS], float target[TAU_MAX_TOTAL_TERMS], float factor, out float result[TAU_MAX_TOTAL_TERMS]){
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        result[i] = centroid[i] + factor * (target[i] - centroid[i]);
    }
}

void shrinkSimplex(float simplex[NM_VERTS][TAU_MAX_TOTAL_TERMS], inout float costs[NM_VERTS], inout float uses[NM_VERTS], int modelIdx, float bw){
    for(int v=1; v<NM_VERTS; v++){
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            simplex[v][i] = simplex[0][i] + nelderSigma * (simplex[v][i] - simplex[0][i]);
        }
        float shrinkUsed;
        costs[v] = tauObjective(simplex[v], modelIdx, bw, shrinkUsed);
        uses[v] = shrinkUsed;
    }
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    if (tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauZeroOutputs(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-9) / float(nBins);

    vec4 seed0 = texelFetch(tauXiFOpt, ivec2(tau-1, subseq), 0);
    vec4 seed1 = texelFetch(tauXiSOpt, ivec2(tau-1, subseq), 0);
    vec4 meta0 = texelFetch(tauXiMetaOpt, ivec2(tau-1, subseq), 0);
    if (meta0.y < 0.5 || meta0.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauZeroOutputs(meta0.z);
        return;
    }

    float seedCoeffs[TAU_MAX_TOTAL_TERMS];
    float simplex[NM_VERTS][TAU_MAX_TOTAL_TERMS];
    float costs[NM_VERTS];
    float uses[NM_VERTS];
    float nUsedDummy;
    tauUnpack(seed0, seed1, seedCoeffs);
    for(int v=0; v<NM_VERTS; v++){
        copyCoeffs(seedCoeffs, simplex[v]);
        if(v > 0 && (v-1) < TAU_TOTAL_TERMS){
            simplex[v][v-1] += max(nelderShift, 1e-5);
        }
        costs[v] = tauObjective(simplex[v], modelIdx, bw, nUsedDummy);
        uses[v] = nUsedDummy;
    }

    int iterCount = NM_MAX_ITER;
    if(nelderIters < iterCount) iterCount = nelderIters;
    if(iterCount <= 0) iterCount = 1;

    for(int iter=0; iter<NM_MAX_ITER; iter++){
        if(iter >= iterCount) break;
        sortSimplex(simplex, costs, uses);
        float centroid[TAU_MAX_TOTAL_TERMS];
        computeCentroid(simplex, centroid);
        float worst[TAU_MAX_TOTAL_TERMS];
        copyCoeffs(simplex[NM_VERTS-1], worst);

        float reflected[TAU_MAX_TOTAL_TERMS];
        deltaBlend(centroid, worst, nelderAlpha, reflected);
        float reflectedUsed;
        float reflectedCost = tauObjective(reflected, modelIdx, bw, reflectedUsed);

        if(reflectedCost < costs[0]){
            float expanded[TAU_MAX_TOTAL_TERMS];
            deltaBlend(centroid, reflected, nelderGamma, expanded);
            float expandedUsed;
            float expandedCost = tauObjective(expanded, modelIdx, bw, expandedUsed);
            if(expandedCost < reflectedCost){
                copyCoeffs(expanded, simplex[NM_VERTS-1]);
                costs[NM_VERTS-1] = expandedCost;
                uses[NM_VERTS-1] = expandedUsed;
            } else {
                copyCoeffs(reflected, simplex[NM_VERTS-1]);
                costs[NM_VERTS-1] = reflectedCost;
                uses[NM_VERTS-1] = reflectedUsed;
            }
        } else if(reflectedCost < costs[NM_VERTS-2]){
            copyCoeffs(reflected, simplex[NM_VERTS-1]);
            costs[NM_VERTS-1] = reflectedCost;
            uses[NM_VERTS-1] = reflectedUsed;
        } else {
            float contraction[TAU_MAX_TOTAL_TERMS];
            if(reflectedCost < costs[NM_VERTS-1]){
                targetBlend(centroid, reflected, nelderRho, contraction);
            } else {
                targetBlend(centroid, worst, nelderRho, contraction);
            }
            float contractionUsed;
            float contractionCost = tauObjective(contraction, modelIdx, bw, contractionUsed);
            if(contractionCost < costs[NM_VERTS-1]){
                copyCoeffs(contraction, simplex[NM_VERTS-1]);
                costs[NM_VERTS-1] = contractionCost;
                uses[NM_VERTS-1] = contractionUsed;
            } else {
                shrinkSimplex(simplex, costs, uses, modelIdx, bw);
            }
        }
    }

    sortSimplex(simplex, costs, uses);
    float resultCoeffs[TAU_MAX_TOTAL_TERMS];
    copyCoeffs(simplex[0], resultCoeffs);
    float finalCost = costs[0];
    float finalUsed = uses[0];
    if(finalUsed < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauZeroOutputs(finalUsed);
        return;
    }
    tauPack(resultCoeffs, tauXiFFinal, tauXiSFinal);
    tauXiMetaFinal = vec4(finalCost, 1.0, finalUsed, 0.0);
}
