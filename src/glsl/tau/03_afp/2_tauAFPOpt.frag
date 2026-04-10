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
uniform float nelderStopEps;
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
const int NM_VIEW_SIZE = NM_VERTS * TAU_MAX_TOTAL_TERMS;

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

float tauEvalSRaw(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
}

float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    return max(abs(tauEvalSRaw(coeffs, x)), 1e-6);
}

float tauEvalA(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float s = tauEvalS(coeffs, x);
    return 0.5 * s * s;
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

float tauObjectiveDirect(float coeffs[TAU_MAX_TOTAL_TERMS], int modelIdx, float bw, out float nUsed){
    float cost = 0.0;
    float negPenalty = 0.0;
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
        float rawS = tauEvalSRaw(coeffs, x);
        float sFit = max(abs(rawS), 1e-6);
        negPenalty += max(-rawS, 0.0);

        float ySErr = tauSObsErr(aKM, aErr);
        float wF = 1.0 / max(fErr * fErr, 1e-6);
        float wA = 1.0 / max(ySErr * ySErr, 1e-6);
        cost += wF * (fKM - fFit) * (fKM - fFit) + wA * (yS - sFit) * (yS - sFit);
        nUsed += 1.0;
    }

    float l2 = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_TOTAL_TERMS) break;
        float lam = (i < TAU_F_TERMS) ? l2F : l2S;
        l2 += lam * coeffs[i] * coeffs[i];
    }
    return cost / max(nUsed, 1.0) + l2 + 25.0 * negPenalty / max(nUsed, 1.0);
}

float tauObjective(float coeffs[TAU_MAX_TOTAL_TERMS], int modelIdx, float bw, out float nUsed){
    return tauObjectiveDirect(coeffs, modelIdx, bw, nUsed);
}

void tauZeroOutputs(float nUsed){
    tauXiFFinal = vec4(0.0);
    tauXiSFinal = vec4(0.0);
    tauXiMetaFinal = vec4(1e9, 0.0, nUsed, 1.0);
}

int baseIdx(int vert){
    return vert * TAU_MAX_TOTAL_TERMS;
}

void readVertex(float simplex[NM_VIEW_SIZE], int idx, out float dst[TAU_MAX_TOTAL_TERMS]){
    int base = baseIdx(idx);
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        dst[i] = simplex[base + i];
    }
}

void writeVertex(float simplex[NM_VIEW_SIZE], int idx, float src[TAU_MAX_TOTAL_TERMS]){
    int base = baseIdx(idx);
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        simplex[base + i] = src[i];
    }
}

void swapVertices(int i, int j, inout float simplex[NM_VIEW_SIZE], inout float costs[NM_VERTS], inout float uses[NM_VERTS]){
    float tmp[TAU_MAX_TOTAL_TERMS];
    int baseI = baseIdx(i);
    int baseJ = baseIdx(j);
    for(int k=0; k<TAU_MAX_TOTAL_TERMS; k++) tmp[k] = simplex[baseI + k];
    for(int k=0; k<TAU_MAX_TOTAL_TERMS; k++) simplex[baseI + k] = simplex[baseJ + k];
    for(int k=0; k<TAU_MAX_TOTAL_TERMS; k++) simplex[baseJ + k] = tmp[k];
    float tmpCost = costs[i]; costs[i] = costs[j]; costs[j] = tmpCost;
    float tmpUse = uses[i]; uses[i] = uses[j]; uses[j] = tmpUse;
}

void sortSimplex(inout float simplex[NM_VIEW_SIZE], inout float costs[NM_VERTS], inout float uses[NM_VERTS]){
    for(int i=1; i<NM_VERTS; i++){
        for(int j=i; j>0; j--){
            if(costs[j] < costs[j-1]){
                swapVertices(j, j-1, simplex, costs, uses);
            }
        }
    }
}

void shrinkSimplex(float simplex[NM_VIEW_SIZE], inout float costs[NM_VERTS], inout float uses[NM_VERTS], int modelIdx, float bw){
    float bestVertex[TAU_MAX_TOTAL_TERMS];
    readVertex(simplex, 0, bestVertex);
    for(int v=1; v<NM_VERTS; v++){
        float vertex[TAU_MAX_TOTAL_TERMS];
        readVertex(simplex, v, vertex);
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            vertex[i] = bestVertex[i] + nelderSigma * (vertex[i] - bestVertex[i]);
        }
        float shrinkUsed;
        costs[v] = tauObjective(vertex, modelIdx, bw, shrinkUsed);
        uses[v] = shrinkUsed;
        writeVertex(simplex, v, vertex);
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
    if (meta0.w > 0.5){
        tauXiFFinal = seed0;
        tauXiSFinal = seed1;
        tauXiMetaFinal = vec4(meta0.x, meta0.y, meta0.z, 1.0);
        return;
    }

    float seedCoeffs[TAU_MAX_TOTAL_TERMS];
    float simplex[NM_VIEW_SIZE];
    float costs[NM_VERTS];
    float uses[NM_VERTS];
    float nUsedDummy;
    tauUnpack(seed0, seed1, seedCoeffs);
    for(int v=0; v<NM_VERTS; v++){
        int base = baseIdx(v);
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) simplex[base + i] = seedCoeffs[i];
        if(v > 0 && (v-1) < TAU_TOTAL_TERMS){
            int shiftIdx = base + (v-1);
            simplex[shiftIdx] += max(nelderShift, 1e-5);
        }
        float tempSegment[TAU_MAX_TOTAL_TERMS];
        readVertex(simplex, v, tempSegment);
        costs[v] = tauObjective(tempSegment, modelIdx, bw, nUsedDummy);
        uses[v] = nUsedDummy;
    }

    int iterCount = NM_MAX_ITER;
    if(nelderIters < iterCount) iterCount = nelderIters;
    if(iterCount <= 0) iterCount = 1;

    for(int iter=0; iter<NM_MAX_ITER; iter++){
        if(iter >= iterCount) break;
        sortSimplex(simplex, costs, uses);
        float avgPoint[TAU_MAX_TOTAL_TERMS];
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) avgPoint[i] = 0.0;
        int verts = NM_VERTS - 1;
        for(int v=0; v<verts; v++){
            int base = baseIdx(v);
            for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                avgPoint[i] += simplex[base + i];
            }
        }
        float invN = 1.0 / float(verts);
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) avgPoint[i] *= invN;
        float worst[TAU_MAX_TOTAL_TERMS];
        int worstBase = baseIdx(NM_VERTS-1);
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) worst[i] = simplex[worstBase + i];

        float reflected[TAU_MAX_TOTAL_TERMS];
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            reflected[i] = avgPoint[i] + nelderAlpha * (avgPoint[i] - worst[i]);
        }
        float reflectedUsed;
        float reflectedCost = tauObjective(reflected, modelIdx, bw, reflectedUsed);

        if(reflectedCost < costs[0]){
            float expanded[TAU_MAX_TOTAL_TERMS];
            for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                expanded[i] = avgPoint[i] + nelderGamma * (reflected[i] - avgPoint[i]);
            }
            float expandedUsed;
            float expandedCost = tauObjective(expanded, modelIdx, bw, expandedUsed);
            if(expandedCost < reflectedCost){
            writeVertex(simplex, NM_VERTS-1, expanded);
            costs[NM_VERTS-1] = expandedCost;
            uses[NM_VERTS-1] = expandedUsed;
            } else {
                writeVertex(simplex, NM_VERTS-1, reflected);
                costs[NM_VERTS-1] = reflectedCost;
                uses[NM_VERTS-1] = reflectedUsed;
            }
        } else if(reflectedCost < costs[NM_VERTS-2]){
            for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) simplex[worstBase + i] = reflected[i];
            costs[NM_VERTS-1] = reflectedCost;
            uses[NM_VERTS-1] = reflectedUsed;
        } else {
            float contraction[TAU_MAX_TOTAL_TERMS];
            if(reflectedCost < costs[NM_VERTS-1]){
                for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                    contraction[i] = avgPoint[i] + nelderRho * (reflected[i] - avgPoint[i]);
                }
            } else {
                for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                    contraction[i] = avgPoint[i] + nelderRho * (worst[i] - avgPoint[i]);
                }
            }
            float contractionUsed;
            float contractionCost = tauObjective(contraction, modelIdx, bw, contractionUsed);
            if(contractionCost < costs[NM_VERTS-1]){
                writeVertex(simplex, NM_VERTS-1, contraction);
                costs[NM_VERTS-1] = contractionCost;
                uses[NM_VERTS-1] = contractionUsed;
            } else {
                shrinkSimplex(simplex, costs, uses, modelIdx, bw);
            }
        }
    }

    sortSimplex(simplex, costs, uses);
    float resultCoeffs[TAU_MAX_TOTAL_TERMS];
    readVertex(simplex, 0, resultCoeffs);
    float finalCost = costs[0];
    float finalUsed = uses[0];
    float simplexSpan = 0.0;
    int bestBase = baseIdx(0);
    int worstBaseFinal = baseIdx(NM_VERTS-1);
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        simplexSpan = max(simplexSpan, abs(simplex[worstBaseFinal + i] - simplex[bestBase + i]));
    }
    float costSpan = abs(costs[NM_VERTS-1] - costs[0]);
    float doneFlag = 1.0 - step(max(nelderStopEps, 1e-8), max(simplexSpan, costSpan));
    if(finalUsed < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauZeroOutputs(finalUsed);
        return;
    }
    tauPack(resultCoeffs, tauXiFFinal, tauXiSFinal);
    tauXiMetaFinal = vec4(finalCost, 1.0, finalUsed, doneFlag);
}
