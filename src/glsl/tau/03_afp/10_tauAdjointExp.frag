#version 300 es
precision highp float;
precision mediump int;

uniform sampler2D tauKrylov0;
uniform sampler2D tauKrylov1;
uniform sampler2D tauKrylov2;
uniform sampler2D tauKrylov3;
uniform sampler2D tauKrylov4;
uniform sampler2D tauKrylov5;
uniform sampler2D tauArnoldiCoeff;
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int tauBatchOffset;
uniform int tauBatchCount;
uniform float adjointTauScale;
uniform int tauExpTerms;

layout(location = 0) out vec4 tauAdjExp; // [E1, Ex, Ex2, valid]

const int TAU_MAX_TOTAL_TERMS = 8;
const int NM_STORE_VERTS = TAU_MAX_TOTAL_TERMS + 1;

vec3 coeffAt(int packedRow, int idx){
    return texelFetch(tauArnoldiCoeff, ivec2(idx, packedRow), 0).xyz;
}

float validAt(int packedRow){
    return texelFetch(tauArnoldiCoeff, ivec2(0, packedRow), 0).w;
}

vec3 reconstructQ1(vec3 k0, vec3 k1, vec3 beta, vec3 h00, vec3 h10){
    vec3 q0 = k0 / beta;
    vec3 w1 = k1 / beta;
    return (w1 - h00 * q0) / h10;
}

vec3 reconstructQ2(vec3 k0, vec3 k1, vec3 k2, vec3 beta, vec3 h00, vec3 h10, vec3 h01, vec3 h11, vec3 h21){
    vec3 q0 = k0 / beta;
    vec3 w1 = k1 / beta;
    vec3 q1 = reconstructQ1(k0, k1, beta, h00, h10);
    vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
    return (Lq1 - h01 * q0 - h11 * q1) / h21;
}

vec3 reconstructQ3(
    vec3 k0, vec3 k1, vec3 k2, vec3 k3,
    vec3 beta, vec3 h00, vec3 h10,
    vec3 h01, vec3 h11, vec3 h21,
    vec3 h02, vec3 h12, vec3 h22, vec3 h32
){
    vec3 q0 = k0 / beta;
    vec3 w1 = k1 / beta;
    vec3 q1 = reconstructQ1(k0, k1, beta, h00, h10);
    vec3 Lq1 = (k2 / beta - h00 * w1) / h10;
    vec3 q2 = reconstructQ2(k0, k1, k2, beta, h00, h10, h01, h11, h21);
    vec3 LLq1 = (k3 / beta - h00 * (k2 / beta)) / h10;
    vec3 Lq2 = (LLq1 - h01 * w1 - h11 * Lq1) / h21;
    return (Lq2 - h02 * q0 - h12 * q1 - h22 * q2) / h32;
}

float matInfNorm(mat4 M){
    vec4 c0 = M[0];
    vec4 c1 = M[1];
    vec4 c2 = M[2];
    vec4 c3 = M[3];
    float r0 = abs(c0.x) + abs(c1.x) + abs(c2.x) + abs(c3.x);
    float r1 = abs(c0.y) + abs(c1.y) + abs(c2.y) + abs(c3.y);
    float r2 = abs(c0.z) + abs(c1.z) + abs(c2.z) + abs(c3.z);
    float r3 = abs(c0.w) + abs(c1.w) + abs(c2.w) + abs(c3.w);
    return max(max(r0, r1), max(r2, r3));
}

vec4 taylorAction(mat4 H, float beta, float tauLag, int expTerms){
    vec4 e1 = vec4(1.0, 0.0, 0.0, 0.0);
    vec4 y = beta * e1;
    if(expTerms >= 1){
        y += beta * tauLag * (H * e1);
    }
    if(expTerms >= 2){
        vec4 H2e1 = H * (H * e1);
        y += beta * (0.5 * tauLag * tauLag) * H2e1;
    }
    if(expTerms >= 3){
        vec4 H3e1 = H * (H * (H * e1));
        y += beta * (tauLag * tauLag * tauLag / 6.0) * H3e1;
    }
    if(expTerms >= 4){
        vec4 H4e1 = H * (H * (H * (H * e1)));
        y += beta * (tauLag * tauLag * tauLag * tauLag / 24.0) * H4e1;
    }
    return y;
}

vec4 pade33Action(mat4 H, float beta, float tauLag){
    mat4 I = mat4(1.0);
    mat4 A = tauLag * H;
    float normA = matInfNorm(A);
    float theta = 0.5;
    int s = 0;
    if(normA > theta){
        s = int(ceil(log2(normA / theta)));
    }
    s = clamp(s, 0, 8);

    float invScale = exp2(-float(s));
    mat4 As = A * invScale;
    mat4 A2 = As * As;
    mat4 A3 = A2 * As;

    mat4 P = I + 0.5 * As + 0.1 * A2 + (1.0 / 120.0) * A3;
    mat4 Q = I - 0.5 * As + 0.1 * A2 - (1.0 / 120.0) * A3;
    float detQ = determinant(Q);
    if(abs(detQ) < 1e-10){
        return taylorAction(H, beta, tauLag, 4);
    }

    mat4 R = inverse(Q) * P;
    for(int k = 0; k < 8; k++){
        if(k >= s) break;
        R = R * R;
    }
    return beta * (R * vec4(1.0, 0.0, 0.0, 0.0));
}

float arnoldiActionScalar(
    float beta,
    float h00, float h10,
    float h01, float h11, float h21,
    float h02, float h12, float h22, float h32,
    float h03, float h13, float h23, float h33,
    float q0, float q1, float q2, float q3,
    float tauLag,
    int expTerms
){
    mat4 H = mat4(
        h00, h10, 0.0, 0.0,
        h01, h11, h21, 0.0,
        h02, h12, h22, h32,
        h03, h13, h23, h33
    );
    vec4 y = (expTerms >= 4) ? pade33Action(H, beta, tauLag) : taylorAction(H, beta, tauLag, expTerms);
    return q0 * y.x + q1 * y.y + q2 * y.z + q3 * y.w;
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
        tauAdjExp = vec4(0.0);
        return;
    }
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauAdjExp = vec4(0.0);
        return;
    }

    float valid = validAt(packedRow);
    if(valid < 0.5){
        tauAdjExp = vec4(0.0);
        return;
    }

    vec3 k0 = texelFetch(tauKrylov0, ivec2(i, packedRow), 0).xyz;
    vec3 k1 = texelFetch(tauKrylov1, ivec2(i, packedRow), 0).xyz;
    vec3 k2 = texelFetch(tauKrylov2, ivec2(i, packedRow), 0).xyz;
    vec3 k3 = texelFetch(tauKrylov3, ivec2(i, packedRow), 0).xyz;

    vec3 beta = max(coeffAt(packedRow, 0), vec3(1e-12));
    vec3 h00 = coeffAt(packedRow, 1);
    vec3 h10 = max(coeffAt(packedRow, 2), vec3(1e-12));
    vec3 h01 = coeffAt(packedRow, 3);
    vec3 h11 = coeffAt(packedRow, 4);
    vec3 h21 = max(coeffAt(packedRow, 5), vec3(1e-12));
    vec3 h02 = coeffAt(packedRow, 6);
    vec3 h12 = coeffAt(packedRow, 7);
    vec3 h22 = coeffAt(packedRow, 8);
    vec3 h32 = max(coeffAt(packedRow, 9), vec3(1e-12));
    vec3 h03 = coeffAt(packedRow, 10);
    vec3 h13 = coeffAt(packedRow, 11);
    vec3 h23 = coeffAt(packedRow, 12);
    vec3 h33 = coeffAt(packedRow, 13);

    vec3 q0 = k0 / beta;
    vec3 q1 = reconstructQ1(k0, k1, beta, h00, h10);
    vec3 q2 = reconstructQ2(k0, k1, k2, beta, h00, h10, h01, h11, h21);
    vec3 q3 = reconstructQ3(k0, k1, k2, k3, beta, h00, h10, h01, h11, h21, h02, h12, h22, h32);
    float tauLag = max(float(max(tau, 1)) * adjointTauScale, 1e-6);

    float E1 = arnoldiActionScalar(beta.x, h00.x, h10.x, h01.x, h11.x, h21.x, h02.x, h12.x, h22.x, h32.x, h03.x, h13.x, h23.x, h33.x, q0.x, q1.x, q2.x, q3.x, tauLag, tauExpTerms);
    float Ex = arnoldiActionScalar(beta.y, h00.y, h10.y, h01.y, h11.y, h21.y, h02.y, h12.y, h22.y, h32.y, h03.y, h13.y, h23.y, h33.y, q0.y, q1.y, q2.y, q3.y, tauLag, tauExpTerms);
    float Ex2 = arnoldiActionScalar(beta.z, h00.z, h10.z, h01.z, h11.z, h21.z, h02.z, h12.z, h22.z, h32.z, h03.z, h13.z, h23.z, h33.z, q0.z, q1.z, q2.z, q3.z, tauLag, tauExpTerms);

    tauAdjExp = vec4(E1, Ex, Ex2, valid);
}
