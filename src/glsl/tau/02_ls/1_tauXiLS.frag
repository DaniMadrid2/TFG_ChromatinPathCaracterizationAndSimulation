#version 300 es
//? Weighted least-squares fit per model with configurable polynomial libraries for drift f(x) and noise amplitude s(x).
//* Purpose: compute a closed-form seed before AFP refinement, now supporting up to 8 total coefficients shared between f and s.
//! Outputs are model grids sized [tauMax, tauMax], split as packed coefficients + metadata.
precision highp float;
precision mediump int;

uniform sampler2D tauMom1; //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauMom2; //* size: [nBins, tauMax*tauMax] = [fKM,aKM,fErr,aErr]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;

//!Salida
//? One texel per (tau,subseq) model in the grid.
//! Writes to RGBA targets sized [tauMax, tauMax].
layout(location = 0) out vec4 tauXiF; //! packed coeffs[0..3]
layout(location = 1) out vec4 tauXiS; //! packed coeffs[4..7]
layout(location = 2) out vec4 tauXiMeta; //! [cost, valid(0/1), nUsed, reserved]

const int TAU_MAX_TOTAL_TERMS = 8;
const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT
const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT
const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT

float tauFBasis(int termIdx, float x){
    return 0.0; //Var@TAU_F_BASIS_BODY
}

float tauSBasis(int termIdx, float x){
    return 0.0; //Var@TAU_S_BASIS_BODY
}

float tauEvalF(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_F_TERMS) break;
        acc += coeffs[i] * tauFBasis(i, x);
    }
    return acc;
}

float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
}

float tauSObsErr(float aKM, float aErr){
    float yS = sqrt(max(2.0 * aKM, 0.0));
    //Revisor: corregido el observable del ajuste de difusion. Ahora se documenta que se ajusta y = sqrt(2 a), no a directamente.
    //Revisor: corregido tambien el peso asociado mediante propagacion de errores: sigma_y ~= sigma_a / sqrt(2 a) = sigma_a / y.
    return aErr / max(yS, 1e-4);
}

void tauZeroOutputs(float nUsed){
    tauXiF = vec4(0.0);
    tauXiS = vec4(0.0);
    tauXiMeta = vec4(1e9, 0.0, nUsed, 0.0);
}

bool tauSolveLinearSystem(int n, float A[64], float b[8], out float x[8]){
    float M[64];
    float rhs[8];
    for(int i=0; i<64; i++) M[i] = A[i];
    for(int i=0; i<8; i++){
        rhs[i] = b[i];
        x[i] = 0.0;
    }

    for(int col=0; col<8; col++){
        if(col >= n) break;
        int pivot = col;
        float pivotAbs = abs(M[col*8 + col]);
        for(int row=0; row<8; row++){
            if(row < col || row >= n) continue;
            float v = abs(M[row*8 + col]);
            if(v > pivotAbs){
                pivotAbs = v;
                pivot = row;
            }
        }
        if(pivotAbs < 1e-7) return false;

        if(pivot != col){
            for(int k=0; k<8; k++){
                float tmp = M[col*8 + k];
                M[col*8 + k] = M[pivot*8 + k];
                M[pivot*8 + k] = tmp;
            }
            float tmpR = rhs[col];
            rhs[col] = rhs[pivot];
            rhs[pivot] = tmpR;
        }

        float piv = M[col*8 + col];
        for(int k=0; k<8; k++) M[col*8 + k] /= piv;
        rhs[col] /= piv;

        for(int row=0; row<8; row++){
            if(row == col || row >= n) continue;
            float factor = M[row*8 + col];
            if(abs(factor) < 1e-12) continue;
            for(int k=0; k<8; k++) M[row*8 + k] -= factor * M[col*8 + k];
            rhs[row] -= factor * rhs[col];
        }
    }

    for(int i=0; i<8; i++){
        if(i >= n) break;
        x[i] = rhs[i];
    }
    return true;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    if (tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || TAU_TOTAL_TERMS > TAU_MAX_TOTAL_TERMS){
        tauZeroOutputs(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-9) / float(nBins);

    float ATAf[64];
    float ATyf[8];
    float ATAs[64];
    float ATys[8];
    for(int i=0; i<64; i++){
        ATAf[i] = 0.0;
        ATAs[i] = 0.0;
    }
    for(int i=0; i<8; i++){
        ATyf[i] = 0.0;
        ATys[i] = 0.0;
    }

    float nUsed = 0.0;
    for (int b=0; b<256; b++){
        if (b >= nBins) break;
        vec4 st = texelFetch(tauMom2, ivec2(b, modelIdx), 0);
        float fKM = st.x;
        float aKM = st.y;
        float fErr = st.z;
        float aErr = st.w;
        if (fErr < 0.0 || aErr < 0.0) continue;

        float x = (float(b) + 0.5) * bw;
        float yS = sqrt(max(2.0 * aKM, 0.0));
        float ySErr = tauSObsErr(aKM, aErr);
        //Revisor: corregido el peso del ajuste. Ahora weighted least squares usa inversa de la varianza 1/sigma^2, no inversa de la desviacion 1/sigma.
        float wF = 1.0 / max(fErr * fErr, 1e-6);
        float wA = 1.0 / max(ySErr * ySErr, 1e-6);

        float phiF[8];
        float phiS[8];
        for(int i=0; i<8; i++){
            phiF[i] = (i < TAU_F_TERMS) ? tauFBasis(i, x) : 0.0;
            phiS[i] = (i < TAU_S_TERMS) ? tauSBasis(i, x) : 0.0;
        }

        for(int i=0; i<8; i++){
            if(i < TAU_F_TERMS){
                ATyf[i] += wF * phiF[i] * fKM;
                for(int j=0; j<8; j++){
                    if(j < TAU_F_TERMS) ATAf[i*8 + j] += wF * phiF[i] * phiF[j];
                }
            }
            if(i < TAU_S_TERMS){
                ATys[i] += wA * (2.0 * phiS[i]) * yS;
                for(int j=0; j<8; j++){
                    if(j < TAU_S_TERMS) ATAs[i*8 + j] += wA * (2.0 * phiS[i]) * (2.0 * phiS[j]);
                }
            }
        }
        nUsed += 1.0;
    }

    if (nUsed < float(max(TAU_F_TERMS, TAU_S_TERMS)) || TAU_F_TERMS <= 0 || TAU_S_TERMS <= 0){
        tauZeroOutputs(nUsed);
        return;
    }

    for(int i=0; i<8; i++){
        if(i < TAU_F_TERMS) ATAf[i*8 + i] += 1e-6;
        if(i < TAU_S_TERMS) ATAs[i*8 + i] += 1e-6;
    }

    float xiFLocal[8];
    float xiSLocal[8];
    bool okF = tauSolveLinearSystem(TAU_F_TERMS, ATAf, ATyf, xiFLocal);
    bool okS = tauSolveLinearSystem(TAU_S_TERMS, ATAs, ATys, xiSLocal);
    if(!okF || !okS){
        tauZeroOutputs(nUsed);
        return;
    }

    float coeffs[TAU_MAX_TOTAL_TERMS];
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) coeffs[i] = 0.0;
    for(int i=0; i<8; i++){
        if(i < TAU_F_TERMS) coeffs[i] = xiFLocal[i];
        if(i < TAU_S_TERMS && (TAU_F_TERMS + i) < TAU_MAX_TOTAL_TERMS) coeffs[TAU_F_TERMS + i] = xiSLocal[i];
    }

    float cost = 0.0;
    float minSFit = 1e30;
    for (int b=0; b<256; b++){
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
        float sFit = tauEvalS(coeffs, x);
        minSFit = min(minSFit, sFit);

        float ySErr = tauSObsErr(aKM, aErr);
        float wF = 1.0 / max(fErr * fErr, 1e-6);
        float wA = 1.0 / max(ySErr * ySErr, 1e-6);
        cost += wF * (fKM - fFit) * (fKM - fFit) + wA * (yS - sFit) * (yS - sFit);
    }
    cost /= max(nUsed, 1.0);

    float valid = minSFit > 0.0 ? 1.0 : 0.0;
    tauXiF = vec4(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
    tauXiS = vec4(coeffs[4], coeffs[5], coeffs[6], coeffs[7]);
    tauXiMeta = vec4(cost, valid, nUsed, 0.0);
}
