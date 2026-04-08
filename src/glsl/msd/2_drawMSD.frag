#version 300 es
//? Draw a compact MSD curve panel from the computed MSD texture.
//* Purpose: quick visual check of MSD scaling for a selected chromatin.
//! Output is the screen framebuffer (panel overlay).
precision highp float;
precision mediump int;

uniform highp sampler2D datosMSD; //* size: [nCromatins, msdTauCount] = [msd, D, eta, G]
uniform int msdTauCount;
uniform int msdChromatinIndex;
uniform int nCromatins;

in vec2 vUV;
out vec4 fragColor; //! screen output

float sampleMSD(int chrom, int tauIdx){
    int t = clamp(tauIdx, 0, msdTauCount - 1);
    int c = clamp(chrom, 0, nCromatins - 1);
    return texelFetch(datosMSD, ivec2(c, t), 0).r;
}

void main() {
    // Panel arriba derecha
    vec2 pMin = vec2(0.66, 0.62);
    vec2 pMax = vec2(0.98, 0.96);

    if (vUV.x < pMin.x || vUV.x > pMax.x || vUV.y < pMin.y || vUV.y > pMax.y) {
        discard;
    }

    vec2 panelUV = (vUV - pMin) / (pMax - pMin); // 0..1 en panel

    float maxMSD = 1e-6;
    for (int i = 0; i < 1024; i++) {
        if (i >= msdTauCount) break;
        maxMSD = max(maxMSD, sampleMSD(msdChromatinIndex, i));
    }

    float tauF = panelUV.x * float(max(msdTauCount - 1, 1));
    int t0 = int(floor(tauF));
    int t1 = min(t0 + 1, msdTauCount - 1);
    float a = fract(tauF);
    float y0 = sampleMSD(msdChromatinIndex, t0) / maxMSD;
    float y1 = sampleMSD(msdChromatinIndex, t1) / maxMSD;
    float curveY = mix(y0, y1, a);

    float yDist = abs(panelUV.y - curveY);
    float line = smoothstep(0.02, 0.0, yDist);

    // Ejes
    float axisX = smoothstep(0.02, 0.0, abs(panelUV.x - 0.0));
    float axisY = smoothstep(0.02, 0.0, abs(panelUV.y - 0.0));
    float axes = max(axisX, axisY);

    vec3 col = vec3(0.0);
    col += vec3(0.95, 0.95, 0.95) * axes;
    col += vec3(1.0, 0.75, 0.1) * line;

    float alpha = max(axes, line);
    if (alpha < 0.01) discard;
    fragColor = vec4(col, alpha);
}


