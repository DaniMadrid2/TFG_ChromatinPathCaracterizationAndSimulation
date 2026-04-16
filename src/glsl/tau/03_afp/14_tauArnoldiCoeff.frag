#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauKrylov0;
uniform sampler2D tauKrylov1;
uniform sampler2D tauKrylov2;
uniform sampler2D tauKrylov3;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform int tauArnoldiReorth;

layout(location = 0) out vec4 tauArnoldiCoeffOut; // x in [0..8] selects coeff vec3 + valid

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

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

    if(coeffIdx < 0 || coeffIdx >= 9 || tauLocal < 0 || tauLocal >= tauBatchCount || vert < 0 || vert >= NM_STORE_VERTS){
        tauArnoldiCoeffOut = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauArnoldiCoeffOut = vec4(0.0);
        return;
    }

    vec3 betaSq = vec3(0.0);
    vec3 r1Sq = vec3(0.0);
    vec3 r2Sq = vec3(0.0);
    vec3 h02Num = vec3(0.0);
    vec3 h12Num = vec3(0.0);
    vec3 h22Num = vec3(0.0);
    float valid = texelFetch(tauKrylov0, ivec2(0, packedRow), 0).w;

    vec3 beta = vec3(1.0);
    vec3 h00 = vec3(0.0);
    vec3 h10 = vec3(1.0);
    vec3 h01 = vec3(0.0);
    vec3 h11 = vec3(0.0);
    vec3 h21 = vec3(1.0);
    vec3 h02 = vec3(0.0);
    vec3 h12 = vec3(0.0);
    vec3 h22 = vec3(0.0);
    int reorthPasses = clamp(tauArnoldiReorth, 1, 3);

    if(valid > 0.5){
        for(int b = 0; b < 256; b++){
            if(b >= nBins) break;
            vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
            betaSq += k0 * k0;
        }
        beta = sqrt(max(betaSq, vec3(1e-12)));

        for(int pass = 0; pass < 3; pass++){
            if(pass >= reorthPasses) break;
            vec3 corr00 = vec3(0.0);
            for(int b = 0; b < 256; b++){
                if(b >= nBins) break;
                vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
                vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
                vec3 q0 = k0 / beta;
                vec3 w1 = k1 / beta;
                vec3 r1 = w1 - h00 * q0;
                corr00 += q0 * r1;
            }
            h00 += corr00;
        }

        for(int b = 0; b < 256; b++){
            if(b >= nBins) break;
            vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
            vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
            vec3 q0 = k0 / beta;
            vec3 w1 = k1 / beta;
            vec3 r1 = w1 - h00 * q0;
            r1Sq += r1 * r1;
        }
        h10 = sqrt(max(r1Sq, vec3(1e-12)));

        for(int pass = 0; pass < 3; pass++){
            if(pass >= reorthPasses) break;
            vec3 corr01 = vec3(0.0);
            for(int b = 0; b < 256; b++){
                if(b >= nBins) break;
                vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
                vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
                vec3 k2 = texelFetch(tauKrylov2, ivec2(b, packedRow), 0).xyz;
                vec3 q0 = k0 / beta;
                vec3 w1 = k1 / beta;
                vec3 r1 = w1 - h00 * q0;
                vec3 q1 = r1 / h10;
                vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
                vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
                corr01 += q0 * r2;
            }
            h01 += corr01;

            vec3 corr11 = vec3(0.0);
            for(int b = 0; b < 256; b++){
                if(b >= nBins) break;
                vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
                vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
                vec3 k2 = texelFetch(tauKrylov2, ivec2(b, packedRow), 0).xyz;
                vec3 q0 = k0 / beta;
                vec3 w1 = k1 / beta;
                vec3 r1 = w1 - h00 * q0;
                vec3 q1 = r1 / h10;
                vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
                vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
                corr11 += q1 * r2;
            }
            h11 += corr11;
        }

        for(int b = 0; b < 256; b++){
            if(b >= nBins) break;
            vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
            vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
            vec3 k2 = texelFetch(tauKrylov2, ivec2(b, packedRow), 0).xyz;
            vec3 q0 = k0 / beta;
            vec3 w1 = k1 / beta;
            vec3 r1 = w1 - h00 * q0;
            vec3 q1 = r1 / h10;
            vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
            vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
            r2Sq += r2 * r2;
        }
        h21 = sqrt(max(r2Sq, vec3(1e-12)));

        for(int b = 0; b < 256; b++){
            if(b >= nBins) break;
            vec3 k0 = texelFetch(tauKrylov0, ivec2(b, packedRow), 0).xyz;
            vec3 k1 = texelFetch(tauKrylov1, ivec2(b, packedRow), 0).xyz;
            vec3 k2 = texelFetch(tauKrylov2, ivec2(b, packedRow), 0).xyz;
            vec3 k3 = texelFetch(tauKrylov3, ivec2(b, packedRow), 0).xyz;
            vec3 q0 = k0 / beta;
            vec3 w1 = k1 / beta;
            vec3 r1 = w1 - h00 * q0;
            vec3 q1 = r1 / h10;
            vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
            vec3 r2 = Lq1 - h01 * q0 - h11 * q1;
            vec3 q2 = r2 / h21;
            vec3 LLq1 = (k3 / beta - h00 * (k2 / beta)) / h10;
            vec3 Lq2 = (LLq1 - h01 * w1 - h11 * Lq1) / h21;
            h02Num += q0 * Lq2;
            h12Num += q1 * Lq2;
            h22Num += q2 * Lq2;
        }
        h02 = h02Num;
        h12 = h12Num;
        h22 = h22Num;
        if(any(lessThanEqual(beta, vec3(1e-9))) || any(lessThanEqual(h10, vec3(1e-9))) || any(lessThanEqual(h21, vec3(1e-9)))){
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
    tauArnoldiCoeffOut = vec4(coeff, valid);
}
