#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauAdjOperator;
uniform sampler2D tauKrylovPrev;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;

layout(location = 0) out vec4 tauKrylovOut; // [L g0, L g1, L g2, valid]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

float fetchL(int packedRow, int i, int j){
    return texelFetch(tauAdjOperator, ivec2(j + nBins * i, packedRow), 0).x;
}

vec3 fetchPrev(int packedRow, int j){
    return texelFetch(tauKrylovPrev, ivec2(j, packedRow), 0).xyz;
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
        tauKrylovOut = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauKrylovOut = vec4(0.0);
        return;
    }

    float valid = texelFetch(tauKrylovPrev, ivec2(i, packedRow), 0).w;
    if(valid < 0.5){
        tauKrylovOut = vec4(0.0);
        return;
    }

    vec3 sum = vec3(0.0);
    for(int j = 0; j < 256; j++){
        if(j >= nBins) break;
        float lij = fetchL(packedRow, i, j);
        sum += lij * fetchPrev(packedRow, j);
    }

    tauKrylovOut = vec4(sum, valid);
}
