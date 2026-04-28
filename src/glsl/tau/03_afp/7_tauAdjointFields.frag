#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;
uniform sampler2D tauNMXiFRead;
uniform sampler2D tauNMXiSRead;
uniform sampler2D tauNMMetaRead;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;

layout(location = 0) out vec4 tauAdjFields; // [x, f(x), a(x), valid]

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

float tauFBasis(int termIdx, float x){ return 0.0; //Var@TAU_F_BASIS_BODY
}
float tauSBasis(int termIdx, float x){ return 0.0; //Var@TAU_S_BASIS_BODY
}
void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){
    coeffs[0]=p0.x; coeffs[1]=p0.y; coeffs[2]=p0.z; coeffs[3]=p0.w;
    coeffs[4]=p1.x; coeffs[5]=p1.y; coeffs[6]=p1.z; coeffs[7]=p1.w;
}
float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i = 0; i < TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_F_TERMS) break;
        acc += coeffs[i] * tauFBasis(i, x);
    }
    return acc;
}
float tauEvalSRaw(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i = 0; i < TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
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
        tauAdjFields = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauAdjFields = vec4(0.0);
        return;
    }

    int simplexRow = vert * tauMax + subseq;
    vec4 metaIn = texelFetch(tauNMMetaRead, ivec2(tau - 1, simplexRow), 0);
    if(metaIn.y < 0.5){
        tauAdjFields = vec4(0.0);
        return;
    }

    vec4 p0 = texelFetch(tauNMXiFRead, ivec2(tau - 1, simplexRow), 0);
    vec4 p1 = texelFetch(tauNMXiSRead, ivec2(tau - 1, simplexRow), 0);
    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(p0, p1, coeffs);

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-9) / float(max(nBins, 1));
    float x = (float(b) + 0.5) * bw;
    float f = tauEvalF(coeffs, x);
    float s = max(abs(tauEvalSRaw(coeffs, x)), 1e-6);
    float a = 0.5 * s * s;
    tauAdjFields = vec4(x, f, a, 1.0);
}
