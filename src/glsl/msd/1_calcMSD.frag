#version 300 es
//? Compute mean-square displacement per (chromatin, tau) from 2D trajectories.
//* Purpose: derive MSD, diffusion proxy, and rheology-style scalars for quick diagnostics.
//! Output is a grid texture size [nCromatins, msdTauCount].
precision highp float;
precision mediump int;

uniform highp sampler2DArray datosX; //* size: [datosXLength, 1, nLayers]
uniform int datosXLength;
uniform highp sampler2DArray datosY; //* size: [datosYLength, 1, nLayers]
uniform int datosYLength;
uniform int lCromatin;
uniform int msdTauCount;

//!Salida
//? One texel per (chromatin, tau) with MSD-derived scalars.
layout(location = 0) out vec4 outMSD; //! size: [nCromatins, msdTauCount] = [msd, D, eta, G]

float getX(int idx){
    int texIdx = idx / datosXLength;
    int texX = idx % datosXLength;
    return texelFetch(datosX, ivec3(texX, 0, texIdx), 0).r;
}

float getY(int idx){
    int texIdx = idx / datosYLength;
    int texX = idx % datosYLength;
    return texelFetch(datosY, ivec3(texX, 0, texIdx), 0).r;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int chrom = pos.x;
    int tau = pos.y + 1;

    if (tau > msdTauCount || tau >= lCromatin) {
        outMSD = vec4(0.0);
        return;
    }

    int base = chrom * lCromatin;
    int nPairs = lCromatin - tau;
    float acc = 0.0;
    for (int i = 0; i < 8192; i++) {
        if (i >= nPairs) break;
        float dx = getX(base + i + tau) - getX(base + i);
        float dy = getY(base + i + tau) - getY(base + i);
        acc += dx * dx + dy * dy;
    }

    float msd = (nPairs > 0) ? (acc / float(nPairs)) : 0.0;
    float D = msd / max(4.0 * float(tau), 1e-6); // 2D Brownian approx
    float eta = 1.0 / max(D, 1e-6);              // proxy viscosity
    float omega = 1.0 / max(float(tau), 1e-6);
    float G = eta * omega;                       // proxy frequency modulus

    outMSD = vec4(msd, D, eta, G);
}

