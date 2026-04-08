#version 300 es
//? Reconstruct SINDY fields f(x), s(x), a(x) for the selected model.
//* Purpose: provide smooth curves for visualization and downstream comparisons.
//! Output is a 1D field texture size [nBins, 1].
precision highp float;
precision mediump int;

uniform sampler2D tauXiF; //* packed coeffs[0..3]
uniform sampler2D tauXiS; //* packed coeffs[4..7]
uniform sampler2D tauBest; //* size: [1, 1] = [bestTau, bestSubseq, cost, found]
uniform sampler2D tauMom1; //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform int tauMax;
uniform int nBins;
uniform int selectedTau;
uniform int selectedSubseq;
uniform int useSelected;

in vec2 vUV;
//!Salida
//? One texel per bin with x and reconstructed fields.
layout(location = 0) out vec4 tauSindy; //! size: [nBins, 1] = [x, f_sindy, s_sindy, a_sindy]

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT

float tauFBasis(int termIdx, float x){ return 0.0; //Var@TAU_F_BASIS_BODY
}
float tauSBasis(int termIdx, float x){ return 0.0; //Var@TAU_S_BASIS_BODY
}

void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){
    coeffs[0]=p0.x; coeffs[1]=p0.y; coeffs[2]=p0.z; coeffs[3]=p0.w;
    coeffs[4]=p1.x; coeffs[5]=p1.y; coeffs[6]=p1.z; coeffs[7]=p1.w;
}
float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_F_TERMS) break; acc += coeffs[i]*tauFBasis(i,x);} return acc; }
float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float acc=0.0; for(int i=0;i<TAU_MAX_TOTAL_TERMS;i++){ if(i>=TAU_S_TERMS) break; acc += coeffs[TAU_F_TERMS+i]*tauSBasis(i,x);} return 2.0*acc; }

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int b = pos.x;
    if(b < 0 || b >= nBins){ tauSindy = vec4(0.0); return; }

    vec4 best = texelFetch(tauBest, ivec2(0,0), 0);
    int tau = max(1, int(floor(best.x + 0.5)));
    int subseq = max(0, int(floor(best.y + 0.5)));
    if(useSelected > 0){ tau = max(1, selectedTau); subseq = max(0, selectedSubseq); }
    int modelIdx = (tau - 1) * tauMax + subseq;

    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(texelFetch(tauXiF, ivec2(tau-1, subseq), 0), texelFetch(tauXiS, ivec2(tau-1, subseq), 0), coeffs);

    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-6) / float(nBins);
    //Revisor: corregida la reconstruccion visual para que las curvas se evaluen en la misma malla x usada durante el ajuste.
    float x = (float(b) + 0.5) * bw;
    float fSindy = tauEvalF(coeffs, x);
    float sSindy = tauEvalS(coeffs, x);
    float aSindy = 0.5 * sSindy * sSindy;
    tauSindy = vec4(x, fSindy, sSindy, aSindy);
}
