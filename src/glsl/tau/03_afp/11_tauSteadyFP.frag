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
uniform int steadyFPGaugeMode;

layout(location = 0) out vec4 tauSteadyFPOut; // [pStat, pHist, valid, logSpan]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;
const int TAU_MAX_BINS = 256;

bool tauFinite(float v){
    return (v == v) && (abs(v) < 1e30);
}

float fieldA(int packedRow, int b){
    return max(texelFetch(tauAdjFields, ivec2(b, packedRow), 0).z, 1e-8);
}

float fieldF(int packedRow, int b){
    return texelFetch(tauAdjFields, ivec2(b, packedRow), 0).y;
}

float bernoulliSG(float u){
    float au = abs(u);
    if(au < 1e-4){
        float u2 = u * u;
        return 1.0 - 0.5 * u + u2 / 12.0;
    }
    return u / (exp(u) - 1.0);
}

void buildTridiagonal(
    int packedRow,
    float dx,
    int anchor,
    out float lower[TAU_MAX_BINS],
    out float diag[TAU_MAX_BINS],
    out float upper[TAU_MAX_BINS],
    out float rhs[TAU_MAX_BINS]
){
    for(int k = 0; k < TAU_MAX_BINS; k++){
        lower[k] = 0.0;
        diag[k] = 0.0;
        upper[k] = 0.0;
        rhs[k] = 0.0;
        if(k >= nBins) break;
    }

    if(nBins <= 0) return;

    for(int k = 0; k < TAU_MAX_BINS; k++){
        if(k >= nBins) break;
        if(k == anchor){
            diag[k] = 1.0;
            rhs[k] = 1.0;
            continue;
        }

        if(k == 0){
            // Left no-flux boundary: B(u) p0 - B(-u) p1 = 0
            int k1 = min(1, nBins - 1);
            float aFace = max(0.5 * (fieldA(packedRow, 0) + fieldA(packedRow, k1)), 1e-8);
            float fFace = 0.5 * (fieldF(packedRow, 0) + fieldF(packedRow, k1));
            float u = clamp(dx * fFace / aFace, -fpLogSpanMax, fpLogSpanMax);
            diag[k] = bernoulliSG(u);
            upper[k] = -bernoulliSG(-u);
            continue;
        }

        if(k == nBins - 1){
            // Right no-flux boundary.
            int km1 = max(k - 1, 0);
            float aFace = max(0.5 * (fieldA(packedRow, km1) + fieldA(packedRow, k)), 1e-8);
            float fFace = 0.5 * (fieldF(packedRow, km1) + fieldF(packedRow, k));
            float u = clamp(dx * fFace / aFace, -fpLogSpanMax, fpLogSpanMax);
            lower[k] = -bernoulliSG(u);
            diag[k] = bernoulliSG(-u);
            continue;
        }

        int km1 = max(k - 1, 0);
        int kp1 = min(k + 1, nBins - 1);

        float aFaceL = max(0.5 * (fieldA(packedRow, km1) + fieldA(packedRow, k)), 1e-8);
        float aFaceR = max(0.5 * (fieldA(packedRow, k) + fieldA(packedRow, kp1)), 1e-8);
        float fFaceL = 0.5 * (fieldF(packedRow, km1) + fieldF(packedRow, k));
        float fFaceR = 0.5 * (fieldF(packedRow, k) + fieldF(packedRow, kp1));
        float uL = clamp(dx * fFaceL / aFaceL, -fpLogSpanMax, fpLogSpanMax);
        float uR = clamp(dx * fFaceR / aFaceR, -fpLogSpanMax, fpLogSpanMax);

        float sL0 = aFaceL * bernoulliSG(uL);
        float sL1 = aFaceL * bernoulliSG(-uL);
        float sR0 = aFaceR * bernoulliSG(uR);
        float sR1 = aFaceR * bernoulliSG(-uR);

        lower[k] = -sL0;
        diag[k] = sL1 + sR0;
        upper[k] = -sR1;
    }
}

bool solveTridiagonal(
    out float sol[TAU_MAX_BINS],
    float lower[TAU_MAX_BINS],
    float diag[TAU_MAX_BINS],
    float upper[TAU_MAX_BINS],
    float rhs[TAU_MAX_BINS]
){
    float cPrime[TAU_MAX_BINS];
    float dPrime[TAU_MAX_BINS];

    for(int k = 0; k < TAU_MAX_BINS; k++){
        cPrime[k] = 0.0;
        dPrime[k] = 0.0;
        sol[k] = 0.0;
        if(k >= nBins) break;
    }
    if(nBins <= 0) return false;

    float denom0 = diag[0];
    if(abs(denom0) < 1e-10) return false;
    cPrime[0] = upper[0] / denom0;
    dPrime[0] = rhs[0] / denom0;

    for(int k = 1; k < TAU_MAX_BINS; k++){
        if(k >= nBins) break;
        float denom = diag[k] - lower[k] * cPrime[k - 1];
        if(abs(denom) < 1e-10) return false;
        cPrime[k] = (k < nBins - 1) ? upper[k] / denom : 0.0;
        dPrime[k] = (rhs[k] - lower[k] * dPrime[k - 1]) / denom;
    }

    sol[nBins - 1] = dPrime[nBins - 1];
    for(int k = TAU_MAX_BINS - 2; k >= 0; k--){
        if(k >= nBins - 1) continue;
        sol[k] = dPrime[k] - cPrime[k] * sol[k + 1];
    }
    return true;
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

    int anchor = clamp(nBins / 2, 0, max(nBins - 1, 0));
    if(steadyFPGaugeMode == 0){
        float bestCnt = -1.0;
        for(int k = 0; k < TAU_MAX_BINS; k++){
            if(k >= nBins) break;
            float cnt = max(texelFetch(tauMom1, ivec2(k, modelIdx), 0).x, 0.0);
            if(cnt > bestCnt){
                bestCnt = cnt;
                anchor = k;
            }
        }
    }

    float lower[TAU_MAX_BINS];
    float diag[TAU_MAX_BINS];
    float upper[TAU_MAX_BINS];
    float rhs[TAU_MAX_BINS];
    float sol[TAU_MAX_BINS];
    buildTridiagonal(packedRow, dx, anchor, lower, diag, upper, rhs);
    bool ok = solveTridiagonal(sol, lower, diag, upper, rhs);
    if(!ok){
        tauSteadyFPOut = vec4(0.0);
        return;
    }

    float minLogP = 1e20;
    float maxLogP = -1e20;
    float mass = 0.0;
    float totalCnt = 0.0;
    float negativeMass = 0.0;
    for(int k = 0; k < TAU_MAX_BINS; k++){
        if(k >= nBins) break;
        float pkRaw = sol[k];
        if(pkRaw < 0.0) negativeMass += -pkRaw;
        float pk = max(pkRaw, 1e-12);
        float logPk = log(pk);
        minLogP = min(minLogP, logPk);
        maxLogP = max(maxLogP, logPk);
        float w = (k == 0 || k == nBins - 1) ? 0.5 : 1.0;
        mass += w * pk * dx;
        totalCnt += max(texelFetch(tauMom1, ivec2(k, modelIdx), 0).x, 0.0);
    }

    float pk = max(sol[b], 1e-12);
    float pStat = pk / max(mass, 1e-8);
    float cnt = max(texelFetch(tauMom1, ivec2(b, modelIdx), 0).x, 0.0);
    float pHist = cnt / max(totalCnt * dx, 1e-8);
    float span = maxLogP - minLogP;

    float maxFlux = 0.0;
    for(int k = 0; k < TAU_MAX_BINS; k++){
        if(k >= nBins - 1) break;
        float p0 = max(sol[k], 1e-12) / max(mass, 1e-8);
        float p1 = max(sol[k + 1], 1e-12) / max(mass, 1e-8);
        float aFace = max(0.5 * (fieldA(packedRow, k) + fieldA(packedRow, k + 1)), 1e-8);
        float fFace = 0.5 * (fieldF(packedRow, k) + fieldF(packedRow, k + 1));
        float u = clamp(dx * fFace / aFace, -fpLogSpanMax, fpLogSpanMax);
        float flux = (aFace / max(dx, 1e-8)) * (bernoulliSG(u) * p0 - bernoulliSG(-u) * p1);
        maxFlux = max(maxFlux, abs(flux));
    }

    float fluxTol = 1e-2;
    float negTol = 1e-3;
    float valid = (tauFinite(pStat) && tauFinite(pHist) && mass > 0.0 && span <= fpLogSpanMax &&
                  maxFlux <= fluxTol && negativeMass <= negTol) ? 1.0 : 0.0;
    tauSteadyFPOut = vec4(pStat, pHist, valid, span);
}
