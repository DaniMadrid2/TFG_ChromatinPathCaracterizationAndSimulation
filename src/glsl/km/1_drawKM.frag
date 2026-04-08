#version 300 es
//? Render Kramers-Moyal diagnostics: histograms, pdfs, and parameter bars.
//* Purpose: operator-facing view for KM stats and selected tau coefficients.
//! Output is the screen framebuffer (panel layout).
precision highp float;
precision mediump int;

uniform highp sampler2D kmDiag; //* size: [nBins, 1] = [fKM, aKM, fErr, aErr]
uniform highp sampler2D kmFVals; //* size: [nCromatins, tauMax] = [f0,f1,f2,f3]
uniform highp sampler2D kmAVals; //* size: [nCromatins, tauMax] = [a]
uniform int nBins;
uniform int kmChromatinIndex;
uniform int tauSel;
uniform int tauMax;

in vec2 vUV;
out vec4 fragColor; //! screen output

vec4 diagAt(int b){
    return texelFetch(kmDiag, ivec2(clamp(b,0,nBins-1), 0), 0);
}

float panelLine(float y, float yv, float w){
    return smoothstep(w, 0.0, abs(y - yv));
}

void main() {
    vec3 col = vec3(0.0);
    float alpha = 0.0;

    // Top-left: hist + pdf for f_km and a_km
    vec2 tlMin = vec2(0.02, 0.52), tlMax = vec2(0.48, 0.98);
    // Bottom-left: hist + pdf for f_err and a_err
    vec2 blMin = vec2(0.02, 0.02), blMax = vec2(0.48, 0.48);
    // Bottom-right: f_vals and a_vals
    vec2 brMin = vec2(0.52, 0.02), brMax = vec2(0.98, 0.48);

    // ---------- TL ----------
    if (vUV.x >= tlMin.x && vUV.x <= tlMax.x && vUV.y >= tlMin.y && vUV.y <= tlMax.y) {
        // Visualiza amplitud por bin (hist) y distribucion relativa (pdf) para f_km y a_km.
        vec2 uv = (vUV - tlMin) / (tlMax - tlMin);
        int b = clamp(int(floor(uv.x * float(nBins))), 0, nBins - 1);
        vec4 d = diagAt(b);
        float f = abs(d.x);
        float a = abs(d.y);

        float maxF = 1e-9, maxA = 1e-9, sumF = 0.0, sumA = 0.0;
        for (int i=0;i<128;i++){
            if(i>=nBins) break;
            vec4 di = diagAt(i);
            float fi = abs(di.x), ai = abs(di.y);
            maxF = max(maxF, fi);
            maxA = max(maxA, ai);
            sumF += fi;
            sumA += ai;
        }
        //? Todo se normaliza a [0,1] para que siempre quepa en pantalla.
        float fBar = clamp(f / maxF, 0.0, 1.0);
        float aBar = clamp(a / maxA, 0.0, 1.0);
        float fPdf = f / max(sumF, 1e-9);
        float aPdf = a / max(sumA, 1e-9);
        float maxPdf = 1e-9;
        for (int i=0;i<128;i++){
            if(i>=nBins) break;
            vec4 di = diagAt(i);
            maxPdf = max(maxPdf, abs(di.x)/max(sumF,1e-9));
            maxPdf = max(maxPdf, abs(di.y)/max(sumA,1e-9));
        }
        fPdf = clamp(fPdf / maxPdf, 0.0, 1.0);
        aPdf = clamp(aPdf / maxPdf, 0.0, 1.0);

        float fracBin = fract(uv.x * float(nBins));
        if (fracBin < 0.5 && uv.y <= fBar) {
            col += vec3(0.95, 0.55, 0.15);
            alpha = max(alpha, 0.85);
        }
        if (fracBin >= 0.5 && uv.y <= aBar) {
            col += vec3(0.20, 0.75, 0.95);
            alpha = max(alpha, 0.85);
        }
        float l1 = panelLine(uv.y, fPdf, 0.01);
        float l2 = panelLine(uv.y, aPdf, 0.01);
        col += vec3(1.0, 0.95, 0.20) * l1;
        col += vec3(0.20, 1.0, 0.95) * l2;
        alpha = max(alpha, max(l1, l2));
    }

    // ---------- BL ----------
    if (vUV.x >= blMin.x && vUV.x <= blMax.x && vUV.y >= blMin.y && vUV.y <= blMax.y) {
        // Mismo esquema para errores f_err y a_err.
        // Bins invalidos (sentinel <0) se ignoran en sumas y dibujo.
        vec2 uv = (vUV - blMin) / (blMax - blMin);
        int b = clamp(int(floor(uv.x * float(nBins))), 0, nBins - 1);
        vec4 d = diagAt(b);
        float fRaw = d.z;
        float aRaw = d.w;
        float f = (fRaw >= 0.0) ? abs(fRaw) : 0.0;
        float a = (aRaw >= 0.0) ? abs(aRaw) : 0.0;

        float maxF = 1e-9, maxA = 1e-9, sumF = 0.0, sumA = 0.0;
        for (int i=0;i<128;i++){
            if(i>=nBins) break;
            vec4 di = diagAt(i);
            float fi = di.z, ai = di.w;
            if (fi >= 0.0) {
                fi = abs(fi);
                maxF = max(maxF, fi);
                sumF += fi;
            }
            if (ai >= 0.0) {
                ai = abs(ai);
                maxA = max(maxA, ai);
                sumA += ai;
            }
        }
        float fBar = clamp(f / maxF, 0.0, 1.0);
        float aBar = clamp(a / maxA, 0.0, 1.0);
        float fPdf = f / max(sumF, 1e-9);
        float aPdf = a / max(sumA, 1e-9);
        float maxPdf = 1e-9;
        for (int i=0;i<128;i++){
            if(i>=nBins) break;
            vec4 di = diagAt(i);
            if (di.z >= 0.0) maxPdf = max(maxPdf, abs(di.z)/max(sumF,1e-9));
            if (di.w >= 0.0) maxPdf = max(maxPdf, abs(di.w)/max(sumA,1e-9));
        }
        fPdf = clamp(fPdf / maxPdf, 0.0, 1.0);
        aPdf = clamp(aPdf / maxPdf, 0.0, 1.0);

        float fracBin = fract(uv.x * float(nBins));
        if (fRaw >= 0.0 && fracBin < 0.5 && uv.y <= fBar) {
            col += vec3(0.95, 0.25, 0.65);
            alpha = max(alpha, 0.85);
        }
        if (aRaw >= 0.0 && fracBin >= 0.5 && uv.y <= aBar) {
            col += vec3(0.35, 0.95, 0.35);
            alpha = max(alpha, 0.85);
        }
        float l1 = (fRaw >= 0.0) ? panelLine(uv.y, fPdf, 0.01) : 0.0;
        float l2 = (aRaw >= 0.0) ? panelLine(uv.y, aPdf, 0.01) : 0.0;
        col += vec3(1.0, 0.65, 0.9) * l1;
        col += vec3(0.7, 1.0, 0.6) * l2;
        alpha = max(alpha, max(l1, l2));
    }

    // ---------- BR ----------
    if (vUV.x >= brMin.x && vUV.x <= brMax.x && vUV.y >= brMin.y && vUV.y <= brMax.y) {
        // Barras de parametros agregados:
        // f_vals=[f0,f1,f2,f3] y a_vals para tau seleccionado.
        vec2 uv = (vUV - brMin) / (brMax - brMin);
        int t = clamp(tauSel - 1, 0, tauMax - 1);
        vec4 fv = texelFetch(kmFVals, ivec2(kmChromatinIndex, t), 0);
        float av = texelFetch(kmAVals, ivec2(kmChromatinIndex, t), 0).x;
        float vals[5];
        vals[0] = fv.x; vals[1] = fv.y; vals[2] = fv.z; vals[3] = fv.w; vals[4] = av;
        float maxV = 1e-9;
        for (int i=0;i<5;i++) maxV = max(maxV, abs(vals[i]));

        int idx = clamp(int(floor(uv.x * 5.0)), 0, 4);
        float h = clamp(abs(vals[idx]) / maxV, 0.0, 1.0);
        if (uv.y <= h) {
            if (idx < 4) col += vec3(0.95, 0.85 - 0.18*float(idx), 0.25 + 0.15*float(idx));
            else col += vec3(0.25, 0.95, 0.95);
            alpha = max(alpha, 0.9);
        }
    }

    if (alpha < 0.01) discard;
    fragColor = vec4(col, alpha);
}

