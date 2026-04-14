#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;

layout(location = 0) out vec4 tauAdjDiffOpsOut; // [Dx, Dxx, m1, m2]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int packedIJ = pos.x;
    int packedRow = pos.y;
    int i = packedIJ / max(nBins, 1);
    int j = packedIJ - i * nBins;
    int tauLocal = packedRow / max(tauMax * NM_STORE_VERTS, 1);
    int rem = packedRow - tauLocal * tauMax * NM_STORE_VERTS;
    int vert = rem / max(tauMax, 1);
    int subseq = rem - vert * tauMax;
    int tau = tauBatchOffset + tauLocal + 1;
    int tMin = max(tauMin, 1);

    if(i < 0 || i >= nBins || j < 0 || j >= nBins || tauLocal < 0 || tauLocal >= tauBatchCount || vert < 0 || vert >= NM_STORE_VERTS){
        tauAdjDiffOpsOut = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauAdjDiffOpsOut = vec4(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float dx = max(maxAbs, 1e-9) / float(max(nBins, 1));
    float inv2dx = 1.0 / max(2.0 * dx, 1e-6);
    float invdx2 = 1.0 / max(dx * dx, 1e-6);

    float Dx = 0.0;
    if(i == 0){
        if(j == 0) Dx = -3.0 * inv2dx;
        else if(j == 1) Dx = 4.0 * inv2dx;
        else if(j == 2) Dx = -1.0 * inv2dx;
    } else if(i == nBins - 1){
        if(j == nBins - 3) Dx = 1.0 * inv2dx;
        else if(j == nBins - 2) Dx = -4.0 * inv2dx;
        else if(j == nBins - 1) Dx = 3.0 * inv2dx;
    } else {
        if(j == i - 1) Dx = -inv2dx;
        else if(j == i + 1) Dx = inv2dx;
    }

    float Dxx = 0.0;
    if(i == 0){
        if(j == 0) Dxx = -0.25 * invdx2;
        else if(j == 1) Dxx = 1.75 * invdx2;
        else if(j == 2) Dxx = -2.75 * invdx2;
        else if(j == 3) Dxx = 1.25 * invdx2;
    } else if(i == nBins - 1){
        if(j == nBins - 4) Dxx = -0.25 * invdx2;
        else if(j == nBins - 3) Dxx = 1.75 * invdx2;
        else if(j == nBins - 2) Dxx = -2.75 * invdx2;
        else if(j == nBins - 1) Dxx = 1.25 * invdx2;
    } else {
        if(j == i - 1) Dxx = invdx2;
        else if(j == i) Dxx = -2.0 * invdx2;
        else if(j == i + 1) Dxx = invdx2;
    }

    float xi = (float(i) + 0.5) * dx;
    float xj = (float(j) + 0.5) * dx;
    float m1 = xj - xi;
    float m2 = m1 * m1;
    tauAdjDiffOpsOut = vec4(Dx, Dxx, m1, m2);
}
