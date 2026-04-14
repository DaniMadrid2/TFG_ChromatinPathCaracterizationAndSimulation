#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;
uniform sampler2D tauAdjFields;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform float fpLogSpanMax;

layout(location = 0) out vec4 tauSteadyFPOut; // [pStat, pHist, valid, logSpan]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

float fieldA(int packedRow, int b){
    return max(texelFetch(tauAdjFields, ivec2(b, packedRow), 0).z, 1e-8);
}

float fieldF(int packedRow, int b){
    return texelFetch(tauAdjFields, ivec2(b, packedRow), 0).y;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int b = pos.x;
    int packedRow = pos.y;
    int tauLocal = packedRow / max(tauMax * NM_STORE_VERTS, 1);
    int rem = packedRow - tauLocal * tauMax * NM_STORE_VERTS;
    int vert = rem / max(tauMax, 1);
    int subseq = rem - vert * tauMax;
    int tau = tauBatchOffset + tauLocal + 1;
    int tMin = max(tauMin, 1);

    if(b < 0 || b >= nBins || tauLocal < 0 || tauLocal >= tauBatchCount || vert < 0 || vert >= NM_STORE_VERTS){
        tauSteadyFPOut = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauSteadyFPOut = vec4(0.0);
        return;
    }

    vec4 field = texelFetch(tauAdjFields, ivec2(b, packedRow), 0);
    if(field.w < 0.5){
        tauSteadyFPOut = vec4(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float dx = max(maxAbs, 1e-9) / float(max(nBins, 1));

    float integ = 0.0;
    for(int k = 0; k < 256; k++){
        if(k >= nBins - 1 || k >= b) break;
        float rk = fieldF(packedRow, k) / fieldA(packedRow, k);
        float rk1 = fieldF(packedRow, k + 1) / fieldA(packedRow, k + 1);
        integ += 0.5 * dx * (rk + rk1);
    }

    float minLogQ = 1e20;
    float maxLogQ = -1e20;
    float norm = 0.0;
    float totalCnt = 0.0;
    for(int k = 0; k < 256; k++){
        if(k >= nBins) break;
        float integK = 0.0;
        for(int q = 0; q < 256; q++){
            if(q >= nBins - 1 || q >= k) break;
            float rq = fieldF(packedRow, q) / fieldA(packedRow, q);
            float rq1 = fieldF(packedRow, q + 1) / fieldA(packedRow, q + 1);
            integK += 0.5 * dx * (rq + rq1);
        }
        float logQk = clamp(integK - log(fieldA(packedRow, k)), -fpLogSpanMax, fpLogSpanMax);
        float qk = exp(logQk);
        norm += qk * dx;
        minLogQ = min(minLogQ, logQk);
        maxLogQ = max(maxLogQ, logQk);
        totalCnt += max(texelFetch(tauMom1, ivec2(k, modelIdx), 0).x, 0.0);
    }

    float logQ = clamp(integ - log(fieldA(packedRow, b)), -fpLogSpanMax, fpLogSpanMax);
    float pStat = exp(logQ) / max(norm, 1e-8);
    float cnt = max(texelFetch(tauMom1, ivec2(b, modelIdx), 0).x, 0.0);
    float pHist = cnt / max(totalCnt * dx, 1e-8);
    float span = maxLogQ - minLogQ;
    float valid = (isfinite(pStat) && isfinite(pHist) && norm > 0.0 && span <= fpLogSpanMax) ? 1.0 : 0.0;
    tauSteadyFPOut = vec4(pStat, pHist, valid, span);
}
