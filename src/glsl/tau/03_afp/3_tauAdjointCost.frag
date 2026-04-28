#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;
uniform sampler2D tauMom2;
uniform sampler2D tauNMXiFRead;
uniform sampler2D tauNMXiSRead;
uniform sampler2D tauNMMetaRead;
uniform sampler2D tauAdjFields;
uniform sampler2D tauAdjExp;
uniform sampler2D tauSteadyFP;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform float l2F;
uniform float l2S;
uniform float adjointTauScale;
uniform int useAdjointAFP;
uniform float klReg;

layout(location = 0) out vec4 tauNMCost;

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
float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_TOTAL_TERMS;i++){ if(i>=TAU_F_TERMS) break; acc += coeffs[i]*tauFBasis(i,x);} return acc; }
float tauEvalSRaw(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_TOTAL_TERMS;i++){ if(i>=TAU_S_TERMS) break; acc += coeffs[TAU_F_TERMS+i]*tauSBasis(i,x);} return 2.0*acc; }
float tauL2(float coeffs[TAU_MAX_TOTAL_TERMS]){ float l2=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_TOTAL_TERMS) break; float lam=(i<TAU_F_TERMS)?l2F:l2S; l2 += lam*coeffs[i]*coeffs[i]; } return l2; }

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int tauLocal = tau - tauBatchOffset - 1;
    int vert = pos.y / tauMax;
    int subseq = pos.y - vert * tauMax;
    int tMin = max(tauMin, 1);
    if(tau <= 0 || tau > tauMax || tau < tMin || tauLocal < 0 || tauLocal >= tauBatchCount || subseq < 0 || subseq >= tau || vert < 0 || vert >= NM_STORE_VERTS){ tauNMCost = vec4(1e9,0.0,0.0,1.0); return; }

    vec4 metaIn = texelFetch(tauNMMetaRead, ivec2(tau - 1, pos.y), 0);
    if(metaIn.y < 0.5 || metaIn.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){ tauNMCost = vec4(1e9,0.0,metaIn.z,metaIn.w); return; }

    int modelIdx=(tau-1)*tauMax+subseq;
    int packedRow = tauLocal * tauMax * NM_STORE_VERTS + vert * tauMax + subseq;
    float tauLag=max(float(max(tau,1))*adjointTauScale,1e-6);

    vec4 p0=texelFetch(tauNMXiFRead, ivec2(tau-1,pos.y), 0);
    vec4 p1=texelFetch(tauNMXiSRead, ivec2(tau-1,pos.y), 0);
    float coeffs[TAU_MAX_TOTAL_TERMS]; tauUnpack(p0,p1,coeffs);

    float cost=0.0; float nUsed=0.0; float negPenalty=0.0;
    for(int b=0;b<256;b++){
        if(b>=nBins) break;
        vec4 st=texelFetch(tauMom2, ivec2(b,modelIdx), 0);
        float fKM=st.x, aKM=st.y, fErr=st.z, aErr=st.w;
        if(fErr < 0.0 || aErr < 0.0) continue;
        float x = texelFetch(tauAdjFields, ivec2(b, packedRow), 0).x;
        float rawS0 = tauEvalSRaw(coeffs, x);
        negPenalty += max(-rawS0, 0.0);
        float fModel = 0.0;
        float aModel = 0.0;
        if(useAdjointAFP > 0){
            vec4 adj = texelFetch(tauAdjExp, ivec2(b, packedRow), 0);
            float E1 = adj.x;
            float Ex = adj.y;
            float Ex2 = adj.z;
            fModel = (Ex - x * E1) / tauLag;
            aModel = max((Ex2 - 2.0 * x * Ex + x * x * E1) / max(2.0 * tauLag, 1e-6), 1e-8);
        } else {
            float f0 = texelFetch(tauAdjFields, ivec2(b, packedRow), 0).y;
            float a0 = texelFetch(tauAdjFields, ivec2(b, packedRow), 0).z;
            fModel = f0;
            aModel = a0;
        }
        float wF=1.0/max(fErr*fErr,1e-6); float wA=1.0/max(aErr*aErr,1e-6);
        cost += wF*(fKM-fModel)*(fKM-fModel) + wA*(aKM-aModel)*(aKM-aModel);
        nUsed += 1.0;
    }
    if(klReg > 0.0){
        float kl = 0.0;
        for(int b=0;b<256;b++){
            if(b>=nBins) break;
            vec4 fpv = texelFetch(tauSteadyFP, ivec2(b, packedRow), 0);
            if(fpv.z < 0.5) continue;
            float pStat = max(fpv.x, 1e-8);
            float pHist = max(fpv.y, 0.0);
            if(pHist > 1e-8){
                float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
                float dx = max(maxAbs, 1e-9) / float(max(nBins, 1));
                kl += pHist * log(pHist / pStat) * dx;
            }
        }
        cost += klReg * max(kl, 0.0);
    }
    cost = cost / max(nUsed,1.0) + tauL2(coeffs) + 25.0 * negPenalty / max(float(nBins),1.0);
    float valid=(abs(cost)<1e30 && nUsed >= float(max(TAU_F_TERMS, TAU_S_TERMS))) ? 1.0 : 0.0;
    tauNMCost = vec4(cost, valid, nUsed, metaIn.w);
}
