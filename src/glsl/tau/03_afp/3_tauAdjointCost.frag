#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;
uniform sampler2D tauMom2;
uniform sampler2D tauNMXiFRead;
uniform sampler2D tauNMXiSRead;
uniform sampler2D tauNMMetaRead;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float l2F;
uniform float l2S;
uniform float adjointTauScale;
uniform int useAdjointAFP;

layout(location = 0) out vec4 tauNMCostOut;

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
float tauEvalA(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float s=max(abs(tauEvalSRaw(coeffs,x)),1e-6); return 0.5*s*s; }
float tauL2(float coeffs[TAU_MAX_TOTAL_TERMS]){ float l2=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_TOTAL_TERMS) break; float lam=(i<TAU_F_TERMS)?l2F:l2S; l2 += lam*coeffs[i]*coeffs[i]; } return l2; }
float tauXAtBin(int idx, float bw){ int clamped=clamp(idx,0,max(nBins-1,0)); return (float(clamped)+0.5)*bw; }
void tauEvalAtBin(float coeffs[TAU_MAX_TOTAL_TERMS], int idx, float bw, out float fVal, out float aVal, out float rawS){ float x=tauXAtBin(idx,bw); fVal=tauEvalF(coeffs,x); rawS=tauEvalSRaw(coeffs,x); float s=max(abs(rawS),1e-6); aVal=0.5*s*s; }
void tauDerivsAt(float coeffs[TAU_MAX_TOTAL_TERMS], int idx, float bw, out float f0, out float a0, out float rawS0, out float fDx, out float fDxx, out float aDx, out float aDxx){
    float fm2,am2,sm2,fm1,am1,sm1,fp1,ap1,sp1,fp2,ap2,sp2;
    tauEvalAtBin(coeffs, idx, bw, f0, a0, rawS0);
    tauEvalAtBin(coeffs, idx - 1, bw, fm1, am1, sm1);
    tauEvalAtBin(coeffs, idx + 1, bw, fp1, ap1, sp1);
    tauEvalAtBin(coeffs, idx - 2, bw, fm2, am2, sm2);
    tauEvalAtBin(coeffs, idx + 2, bw, fp2, ap2, sp2);
    float dx=max(bw,1e-6); float dx2=max(dx*dx,1e-6); int last=max(nBins-1,0);
    if(nBins<=1){ fDx=0.0; fDxx=0.0; aDx=0.0; aDxx=0.0; return; }
    if(nBins==2){ fDx=(fp1-f0)/dx; aDx=(ap1-a0)/dx; fDxx=0.0; aDxx=0.0; return; }
    if(idx<=0){ float f3=tauEvalF(coeffs,tauXAtBin(3,bw)); float a3=tauEvalA(coeffs,tauXAtBin(3,bw)); fDx=(-3.0*f0+4.0*fp1-fp2)/max(2.0*dx,1e-6); aDx=(-3.0*a0+4.0*ap1-ap2)/max(2.0*dx,1e-6); fDxx=(-0.25*f0+1.75*fp1-2.75*fp2+1.25*f3)/dx2; aDxx=(-0.25*a0+1.75*ap1-2.75*ap2+1.25*a3)/dx2; return; }
    if(idx>=last){ float fm3=tauEvalF(coeffs,tauXAtBin(last-3,bw)); float am3=tauEvalA(coeffs,tauXAtBin(last-3,bw)); fDx=(3.0*f0-4.0*fm1+fm2)/max(2.0*dx,1e-6); aDx=(3.0*a0-4.0*am1+am2)/max(2.0*dx,1e-6); fDxx=(1.25*f0-2.75*fm1+1.75*fm2-0.25*fm3)/dx2; aDxx=(1.25*a0-2.75*am1+1.75*am2-0.25*am3)/dx2; return; }
    fDx=(fp1-fm1)/max(2.0*dx,1e-6); aDx=(ap1-am1)/max(2.0*dx,1e-6); fDxx=(fm1-2.0*f0+fp1)/dx2; aDxx=(am1-2.0*a0+ap1)/dx2;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int vert = pos.y / tauMax;
    int subseq = pos.y - vert * tauMax;
    int tMin = max(tauMin, 1);
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || vert < 0 || vert >= NM_STORE_VERTS){ tauNMCostOut = vec4(1e9,0.0,0.0,1.0); return; }

    vec4 metaIn = texelFetch(tauNMMetaRead, ivec2(tau - 1, pos.y), 0);
    if(metaIn.y < 0.5 || metaIn.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){ tauNMCostOut = vec4(1e9,0.0,metaIn.z,metaIn.w); return; }

    int modelIdx=(tau-1)*tauMax+subseq;
    float maxAbs=texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw=max(maxAbs,1e-9)/float(max(nBins,1));
    float tauLag=max(float(max(tau,1))*adjointTauScale,1e-6);

    vec4 p0=texelFetch(tauNMXiFRead, ivec2(tau-1,pos.y), 0);
    vec4 p1=texelFetch(tauNMXiSRead, ivec2(tau-1,pos.y), 0);
    float coeffs[TAU_MAX_TOTAL_TERMS]; tauUnpack(p0,p1,coeffs);

    float cost=0.0; float nUsed=0.0; float negPenalty=0.0;
    for(int b=0;b<256;b++){
        if(b>=nBins) break;
        vec4 st=texelFetch(tauMom2, ivec2(b,modelIdx), 0);
        float fKM=st.x, aKM=st.y, fErr=st.z, aErr=st.w;
        float f0,a0,rawS0,fDx,fDxx,aDx,aDxx;
        tauDerivsAt(coeffs,b,bw,f0,a0,rawS0,fDx,fDxx,aDx,aDxx);
        negPenalty += max(-rawS0,0.0);
        if(fErr < 0.0 || aErr < 0.0) continue;
        float fModel=f0; float aModel=a0;
        if(useAdjointAFP>0){ fModel = f0 + 0.5*tauLag*(f0*fDx + a0*fDxx); aModel = max(a0 + 0.5*tauLag*(f0*aDx + a0*aDxx), 1e-8); }
        float wF=1.0/max(fErr*fErr,1e-6); float wA=1.0/max(aErr*aErr,1e-6);
        cost += wF*(fKM-fModel)*(fKM-fModel) + wA*(aKM-aModel)*(aKM-aModel);
        nUsed += 1.0;
    }
    cost = cost / max(nUsed,1.0) + tauL2(coeffs) + 25.0 * negPenalty / max(float(nBins),1.0);
    float valid=(abs(cost)<1e30 && nUsed >= float(max(TAU_F_TERMS, TAU_S_TERMS))) ? 1.0 : 0.0;
    tauNMCostOut = vec4(cost, valid, nUsed, metaIn.w);
}
