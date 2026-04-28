#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauKrylov0;
uniform sampler2D tauKrylov1;
uniform sampler2D tauKrylov2;
uniform sampler2D tauKrylov3;
uniform sampler2D tauKrylov4;
uniform sampler2D tauKrylov5;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform int tauArnoldiReorth;
uniform float tauArnoldiResidTol;

layout(location = 0) out vec4 tauArnoldiCoeff; // x in [0..13] selects coeff vec3 + valid

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

vec3 fetchK(sampler2D tex, int b, int packedRow){
    return texelFetch(tex, ivec2(b, packedRow), 0).xyz;
}

void accumR1(int packedRow, vec3 beta, vec3 h00, out vec3 corr00, out vec3 r1Sq){
    corr00 = vec3(0.0);
    r1Sq = vec3(0.0);
    for(int b = 0; b < 256; b++){
        if(b >= nBins) break;
        vec3 k0 = fetchK(tauKrylov0, b, packedRow);
        vec3 k1 = fetchK(tauKrylov1, b, packedRow);
        vec3 q0 = k0 / beta;
        vec3 w1 = k1 / beta;
        vec3 r1 = w1 - h00 * q0;
        corr00 += q0 * r1;
        r1Sq += r1 * r1;
    }
}

void accumR2(int packedRow, vec3 beta, vec3 h00, vec3 h10, vec3 h01, vec3 h11, out vec3 corr01, out vec3 corr11, out vec3 r2Sq){
    corr01 = vec3(0.0);
    corr11 = vec3(0.0);
    r2Sq = vec3(0.0);
    for(int b = 0; b < 256; b++){
        if(b >= nBins) break;
        vec3 k0 = fetchK(tauKrylov0, b, packedRow);
        vec3 k1 = fetchK(tauKrylov1, b, packedRow);
        vec3 k2 = fetchK(tauKrylov2, b, packedRow);
        vec3 q0 = k0 / beta;
        vec3 w1 = k1 / beta;
        vec3 r1 = w1 - h00 * q0;
        vec3 q1 = r1 / h10;
        vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
        vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
        corr01 += q0 * r2;
        corr11 += q1 * r2;
        r2Sq += r2 * r2;
    }
}

void accumR3(
    int packedRow,
    vec3 beta,
    vec3 h00, vec3 h10,
    vec3 h01, vec3 h11, vec3 h21,
    vec3 h02, vec3 h12, vec3 h22,
    out vec3 corr02, out vec3 corr12, out vec3 corr22, out vec3 r3Sq
){
    corr02 = vec3(0.0);
    corr12 = vec3(0.0);
    corr22 = vec3(0.0);
    r3Sq = vec3(0.0);
    for(int b = 0; b < 256; b++){
        if(b >= nBins) break;
        vec3 k0 = fetchK(tauKrylov0, b, packedRow);
        vec3 k1 = fetchK(tauKrylov1, b, packedRow);
        vec3 k2 = fetchK(tauKrylov2, b, packedRow);
        vec3 k3 = fetchK(tauKrylov3, b, packedRow);
        vec3 q0 = k0 / beta;
        vec3 w1 = k1 / beta;
        vec3 r1 = w1 - h00 * q0;
        vec3 q1 = r1 / h10;
        vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
        vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
        vec3 q2 = r2 / h21;
        vec3 LLq1 = (k3 / beta - h00 * (k2 / beta)) / h10;
        vec3 Lq2 = (LLq1 - h01 * w1 - h11 * Lq1) / h21;
        vec3 r3 = Lq2 - h02 * q0 - h12 * q1 - h22 * q2;
        corr02 += q0 * r3;
        corr12 += q1 * r3;
        corr22 += q2 * r3;
        r3Sq += r3 * r3;
    }
}

void accumCol3(
    int packedRow,
    vec3 beta,
    vec3 h00, vec3 h10,
    vec3 h01, vec3 h11, vec3 h21,
    vec3 h02, vec3 h12, vec3 h22, vec3 h32,
    out vec3 h03, out vec3 h13, out vec3 h23, out vec3 h33
){
    h03 = vec3(0.0);
    h13 = vec3(0.0);
    h23 = vec3(0.0);
    h33 = vec3(0.0);
    for(int b = 0; b < 256; b++){
        if(b >= nBins) break;
        vec3 k0 = fetchK(tauKrylov0, b, packedRow);
        vec3 k1 = fetchK(tauKrylov1, b, packedRow);
        vec3 k2 = fetchK(tauKrylov2, b, packedRow);
        vec3 k3 = fetchK(tauKrylov3, b, packedRow);
        vec3 k4 = fetchK(tauKrylov4, b, packedRow);
        vec3 k5 = fetchK(tauKrylov5, b, packedRow);
        vec3 q0 = k0 / beta;
        vec3 w1 = k1 / beta;
        vec3 r1 = w1 - h00 * q0;
        vec3 q1 = r1 / h10;
        vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
        vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
        vec3 q2 = r2 / h21;
        vec3 LLq1 = (k3 / beta - h00 * (k2 / beta)) / h10;
        vec3 Lq2 = (LLq1 - h01 * w1 - h11 * Lq1) / h21;
        vec3 r3 = Lq2 - h02 * q0 - h12 * q1 - h22 * q2;
        vec3 q3 = r3 / h32;

        vec3 v2 = k2 / beta;
        vec3 v3 = k3 / beta;
        vec3 v4 = k4 / beta;
        vec3 v5 = k5 / beta;
        vec3 LLq2 = (v4 - h00 * v3 - h10 * (h01 * v2 + h11 * LLq1)) / max(h10 * h21, vec3(1e-12));
        vec3 Lq3 = (LLq2 - h02 * w1 - h12 * Lq1 - h22 * Lq2) / h32;

        // one-step consistency correction using v5
        vec3 LLLq2 = (v5 - h00 * v4 - h10 * (h01 * v3 + h11 * (h01 * v2 + h11 * LLq1 + h21 * LLq2))) / max(h10 * h21, vec3(1e-12));
        Lq3 = 0.5 * (Lq3 + (LLLq2 - h02 * v2 - h12 * LLq1 - h22 * LLq2) / max(h32, vec3(1e-12)));

        h03 += q0 * Lq3;
        h13 += q1 * Lq3;
        h23 += q2 * Lq3;
        h33 += q3 * Lq3;
    }
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int coeffIdx = pos.x;
    int packedRow = pos.y;
    int tauLocal = packedRow / max(tauMax * NM_STORE_VERTS, 1);
    int rem = packedRow - tauLocal * tauMax * NM_STORE_VERTS;
    int vert = rem / max(tauMax, 1);
    int subseq = rem - vert * tauMax;
    int tau = tauBatchOffset + tauLocal + 1;
    int tMin = max(tauMin, 1);

    if(coeffIdx < 0 || coeffIdx >= 14 || tauLocal < 0 || tauLocal >= tauBatchCount || vert < 0 || vert >= NM_STORE_VERTS){
        tauArnoldiCoeff = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauArnoldiCoeff = vec4(0.0);
        return;
    }

    float valid = texelFetch(tauKrylov0, ivec2(0, packedRow), 0).w;
    vec3 betaSq = vec3(0.0);
    vec3 beta = vec3(1.0);
    vec3 h00 = vec3(0.0);
    vec3 h10 = vec3(1.0);
    vec3 h01 = vec3(0.0);
    vec3 h11 = vec3(0.0);
    vec3 h21 = vec3(1.0);
    vec3 h02 = vec3(0.0);
    vec3 h12 = vec3(0.0);
    vec3 h22 = vec3(0.0);
    vec3 h32 = vec3(1.0);
    vec3 h03 = vec3(0.0);
    vec3 h13 = vec3(0.0);
    vec3 h23 = vec3(0.0);
    vec3 h33 = vec3(0.0);

    int maxPasses = clamp(tauArnoldiReorth, 1, 4);
    float residTol = clamp(tauArnoldiResidTol, 1e-4, 0.9);

    if(valid > 0.5){
        for(int b = 0; b < 256; b++){
            if(b >= nBins) break;
            vec3 k0 = fetchK(tauKrylov0, b, packedRow);
            betaSq += k0 * k0;
        }
        beta = sqrt(max(betaSq, vec3(1e-12)));

        vec3 reorthMask = vec3(1.0);
        for(int pass = 0; pass < 4; pass++){
            if(pass >= maxPasses) break;
            vec3 corr00, r1Sq;
            accumR1(packedRow, beta, h00, corr00, r1Sq);
            h00 += reorthMask * corr00;
            vec3 res1 = sqrt(max(r1Sq, vec3(1e-12)));
            reorthMask = step(residTol * res1, abs(corr00));
        }
        vec3 dummyCorr, r1Sq;
        accumR1(packedRow, beta, h00, dummyCorr, r1Sq);
        h10 = sqrt(max(r1Sq, vec3(1e-12)));

        reorthMask = vec3(1.0);
        for(int pass = 0; pass < 4; pass++){
            if(pass >= maxPasses) break;
            vec3 corr01, corr11, r2Sq;
            accumR2(packedRow, beta, h00, h10, h01, h11, corr01, corr11, r2Sq);
            h01 += reorthMask * corr01;
            h11 += reorthMask * corr11;
            vec3 res2 = sqrt(max(r2Sq, vec3(1e-12)));
            vec3 corrMag = max(abs(corr01), abs(corr11));
            reorthMask = step(residTol * res2, corrMag);
        }
        vec3 dummy01, dummy11, r2Sq;
        accumR2(packedRow, beta, h00, h10, h01, h11, dummy01, dummy11, r2Sq);
        h21 = sqrt(max(r2Sq, vec3(1e-12)));

        reorthMask = vec3(1.0);
        for(int pass = 0; pass < 4; pass++){
            if(pass >= maxPasses) break;
            vec3 corr02, corr12, corr22, r3Sq;
            accumR3(packedRow, beta, h00, h10, h01, h11, h21, h02, h12, h22, corr02, corr12, corr22, r3Sq);
            h02 += reorthMask * corr02;
            h12 += reorthMask * corr12;
            h22 += reorthMask * corr22;
            vec3 res3 = sqrt(max(r3Sq, vec3(1e-12)));
            vec3 corrMag = max(abs(corr02), max(abs(corr12), abs(corr22)));
            reorthMask = step(residTol * res3, corrMag);
        }
        vec3 dummy02, dummy12, dummy22, r3Sq;
        accumR3(packedRow, beta, h00, h10, h01, h11, h21, h02, h12, h22, dummy02, dummy12, dummy22, r3Sq);
        h32 = sqrt(max(r3Sq, vec3(1e-12)));

        accumCol3(packedRow, beta, h00, h10, h01, h11, h21, h02, h12, h22, h32, h03, h13, h23, h33);

        if(any(lessThanEqual(beta, vec3(1e-9))) || any(lessThanEqual(h10, vec3(1e-9))) ||
           any(lessThanEqual(h21, vec3(1e-9))) || any(lessThanEqual(h32, vec3(1e-9)))){
            valid = 0.0;
        }
    }

    vec3 coeff = vec3(0.0);
    if(coeffIdx == 0) coeff = beta;
    else if(coeffIdx == 1) coeff = h00;
    else if(coeffIdx == 2) coeff = h10;
    else if(coeffIdx == 3) coeff = h01;
    else if(coeffIdx == 4) coeff = h11;
    else if(coeffIdx == 5) coeff = h21;
    else if(coeffIdx == 6) coeff = h02;
    else if(coeffIdx == 7) coeff = h12;
    else if(coeffIdx == 8) coeff = h22;
    else if(coeffIdx == 9) coeff = h32;
    else if(coeffIdx == 10) coeff = h03;
    else if(coeffIdx == 11) coeff = h13;
    else if(coeffIdx == 12) coeff = h23;
    else if(coeffIdx == 13) coeff = h33;
    tauArnoldiCoeff = vec4(coeff, valid);
}
