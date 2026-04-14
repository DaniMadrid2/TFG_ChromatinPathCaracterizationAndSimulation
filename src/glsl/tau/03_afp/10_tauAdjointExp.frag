#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauAdjFields;
uniform sampler2D tauAdjOperator;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform float adjointTauScale;
uniform int tauExpTerms;

layout(location = 0) out vec4 tauAdjExpOut; // [E1, Ex, Ex2, valid]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

float fetchL(int packedRow, int i, int j){
    return texelFetch(tauAdjOperator, ivec2(j + nBins * i, packedRow), 0).x;
}

float fetchX(int packedRow, int j){
    return texelFetch(tauAdjFields, ivec2(j, packedRow), 0).x;
}

float applyLToBasis(int packedRow, int i, int basisKind){
    float sum = 0.0;
    for(int j = 0; j < 256; j++){
        if(j >= nBins) break;
        float gj = 1.0;
        float xj = fetchX(packedRow, j);
        if(basisKind == 1) gj = xj;
        else if(basisKind == 2) gj = xj * xj;
        sum += fetchL(packedRow, i, j) * gj;
    }
    return sum;
}

float applyL2ToBasis(int packedRow, int i, int basisKind){
    float sum = 0.0;
    for(int k = 0; k < 256; k++){
        if(k >= nBins) break;
        float Lgk = applyLToBasis(packedRow, k, basisKind);
        sum += fetchL(packedRow, i, k) * Lgk;
    }
    return sum;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int i = pos.x;
    int packedRow = pos.y;
    int tauLocal = packedRow / max(tauMax * NM_STORE_VERTS, 1);
    int rem = packedRow - tauLocal * tauMax * NM_STORE_VERTS;
    int vert = rem / max(tauMax, 1);
    int subseq = rem - vert * tauMax;
    int tau = tauBatchOffset + tauLocal + 1;
    int tMin = max(tauMin, 1);

    if(i < 0 || i >= nBins || tauLocal < 0 || tauLocal >= tauBatchCount || vert < 0 || vert >= NM_STORE_VERTS){
        tauAdjExpOut = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauAdjExpOut = vec4(0.0);
        return;
    }

    float valid = texelFetch(tauAdjFields, ivec2(i, packedRow), 0).w;
    if(valid < 0.5){
        tauAdjExpOut = vec4(0.0);
        return;
    }

    float tauLag = max(float(max(tau, 1)) * adjointTauScale, 1e-6);
    float xi = fetchX(packedRow, i);

    float E1 = 1.0;
    float Ex = xi;
    float Ex2 = xi * xi;

    if(tauExpTerms >= 1){
        E1 += tauLag * applyLToBasis(packedRow, i, 0);
        Ex += tauLag * applyLToBasis(packedRow, i, 1);
        Ex2 += tauLag * applyLToBasis(packedRow, i, 2);
    }
    if(tauExpTerms >= 2){
        float c2 = 0.5 * tauLag * tauLag;
        E1 += c2 * applyL2ToBasis(packedRow, i, 0);
        Ex += c2 * applyL2ToBasis(packedRow, i, 1);
        Ex2 += c2 * applyL2ToBasis(packedRow, i, 2);
    }

    tauAdjExpOut = vec4(E1, Ex, Ex2, valid);
}
