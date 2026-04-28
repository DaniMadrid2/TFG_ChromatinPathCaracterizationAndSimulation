#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauAdjFields;
uniform sampler2D tauAdjDiffOps;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;

layout(location = 0) out vec4 tauAdjOperator; // [L_ij, f_i, a_i, valid]

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
        tauAdjOperator = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauAdjOperator = vec4(0.0);
        return;
    }

    vec4 field = texelFetch(tauAdjFields, ivec2(i, packedRow), 0);
    vec4 ops = texelFetch(tauAdjDiffOps, ivec2(packedIJ, packedRow), 0);
    float f = field.y;
    float a = field.z;
    float valid = field.w;
    float Lij = f * ops.x + a * ops.y;
    tauAdjOperator = vec4(Lij, f, a, valid);
}
