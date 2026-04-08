#version 300 es
//? Composite debug view: score map, KL map, cost map, and SINDY/FP curves.
//* Purpose: operator-facing diagnostics to validate model selection visually.
//! Output is the screen framebuffer (full-screen quad).
precision highp float;
precision mediump int;

uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform sampler2D tauBest; //* size: [1, 1] = [bestTau, bestSubseq, cost, found]
uniform sampler2D tauSindy; //* size: [nBins, 1] = [x, f_sindy, s_sindy, a_sindy]
uniform sampler2D tauSindyInit; //* size: [nBins, 1] = [x, f_sindy, s_sindy, a_sindy] (init)
uniform sampler2D tauSindyTau1Ref; //* size: [nBins, 1] = LS reference at tau=1, subseq=0
uniform sampler2D tauModelMask; //* size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
uniform sampler2D tauFPProxy; //* size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]
uniform sampler2D tauFPStationary; //* size: [nBins, 1] = [pHist, pInit, pFinal, valid]
uniform sampler2D tauModelKL; //* size: [tauMax, tauMax] = [kl, valid, spanN, sumH]
uniform sampler2D tauModelScore; //* size: [tauMax, tauMax] = [selected, score, valid, costRaw]
uniform sampler2D tauStats; //* size: [1, 1] = [bestCost, threshold, maxValidCost, targetK]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform int bestTau;
uniform int bestSubseq;
uniform int showTauCurves; //* 0 = paneles; 1 = curvas/PDF en alta resolucion
uniform int showFPStationary; //* 0 = ocultar curva FP estacionaria
uniform int showLSOverlay; //* 0 = ocultar overlay LS; 1 = superponer la curva LS en blanco

in vec2 vUV;
out vec4 fragColor; //! screen output

vec4 sampleRowLinear(sampler2D tex, float x01){
    float fx = clamp(x01, 0.0, 1.0) * float(max(nBins - 1, 1));
    int i0 = int(floor(fx));
    int i1 = min(i0 + 1, max(nBins - 1, 0));
    float t = fx - float(i0);
    vec4 a = texelFetch(tex, ivec2(i0, 0), 0);
    vec4 b = texelFetch(tex, ivec2(i1, 0), 0);
    return mix(a, b, t);
}

void main(){
    vec3 col = vec3(0.92, 0.93, 0.95) + vec3(0.04*(vUV.x-0.5), 0.04*(vUV.y-0.5), 0.0);
    float alpha = 1.0;
    int tMin0 = clamp(tauMin - 1, 0, max(tauMax - 1, 0));
    int tCount = max(tauMax - tMin0, 1);
    vec4 bestAuto = texelFetch(tauBest, ivec2(0,0), 0);
    int autoTau = max(1, int(floor(bestAuto.x + 0.5)));
    int autoSub = max(0, int(floor(bestAuto.y + 0.5)));
    float hasAuto = bestAuto.w;

    if(showTauCurves > 0){
        // Layout: panel principal arriba (f), dos abajo (s y a), tira PDF inferior.
        float left = 0.04;
        float right = 0.03;
        float top = 0.03;
        float bottom = 0.04;
        float gapX = 0.03;
        float gapY = 0.035;
        float pdfH = 0.08;
        float topH = 0.44;
        float botH = 0.29;

        float xL = left;
        float xR = 1.0 - right;
        float fullW = max(0.001, xR - xL);
        float halfW = (fullW - gapX) * 0.5;

        float yTop1 = 1.0 - top;
        float yTop0 = yTop1 - topH;
        float yBot1 = yTop0 - gapY;
        float yBot0 = yBot1 - botH;
        float yPdf0 = bottom;
        float yPdf1 = yPdf0 + pdfH;

        float xBL0 = xL;
        float xBL1 = xBL0 + halfW;
        float xBR0 = xBL1 + gapX;
        float xBR1 = xR;

        col = vec3(0.0);
        alpha = 0.0;

        float inTop = step(xL, vUV.x) * step(vUV.x, xR) * step(yTop0, vUV.y) * step(vUV.y, yTop1);
        float inBL = step(xBL0, vUV.x) * step(vUV.x, xBL1) * step(yBot0, vUV.y) * step(vUV.y, yBot1);
        float inBR = step(xBR0, vUV.x) * step(vUV.x, xBR1) * step(yBot0, vUV.y) * step(vUV.y, yBot1);
        float inPdf = step(xL, vUV.x) * step(vUV.x, xR) * step(yPdf0, vUV.y) * step(vUV.y, yPdf1);
        float anyPanel = max(max(inTop, inBL), max(inBR, inPdf));
        if(anyPanel > 0.5){
            col = vec3(0.07, 0.08, 0.10);
            alpha = 0.72;
        }

        float minF = 1e30;
        float maxF = -1e30;
        float minS = 1e30;
        float maxS = -1e30;
        float minA = 1e30;
        float maxA = -1e30;
        float minP = 1e30;
        float maxP = -1e30;
        for(int i=0;i<512;i++){
            if(i >= nBins) break;
            vec4 s0 = texelFetch(tauSindyInit, ivec2(i,0), 0);
            vec4 s1 = texelFetch(tauSindy, ivec2(i,0), 0);
            minF = min(minF, min(s0.y, s1.y));
            maxF = max(maxF, max(s0.y, s1.y));
            minS = min(minS, min(s0.z, s1.z));
            maxS = max(maxS, max(s0.z, s1.z));
            minA = min(minA, min(s0.w, s1.w));
            maxA = max(maxA, max(s0.w, s1.w));
            vec4 p = texelFetch(tauFPStationary, ivec2(i,0), 0);
            minP = min(minP, min(p.x, min(p.y, p.z)));
            maxP = max(maxP, max(p.x, max(p.y, p.z)));
        }
        // Escala fija solicitada para comparar modelos:
        // y=1 en a(t) => 2.7 ; y=1 en s(t) => sqrt(2*2.7)
        float aRef = 2.7;
        float sRef = sqrt(2.0 * aRef);
        minS = 0.0;
        maxS = sRef;
        minA = 0.0;
        maxA = aRef;

        float spanF = max(maxF - minF, 1e-6);
        float spanS = max(maxS - minS, 1e-6);
        float spanA = max(maxA - minA, 1e-6);
        float spanP = max(maxP - minP, 1e-6);

        float w0 = 0.0019;
        float w1 = 0.0024;

        if(inTop > 0.5){
            float xu = clamp((vUV.x - xL) / max(0.001, (xR - xL)), 0.0, 1.0);
            vec4 sf0 = sampleRowLinear(tauSindyInit, xu);
            vec4 sf1 = sampleRowLinear(tauSindy, xu);
            float h = (yTop1 - yTop0);
            float pad = 0.04 * h;
            float y0 = (yTop1 - pad) - ((sf0.y - minF) / spanF) * (h - 2.0 * pad);
            float y1 = (yTop1 - pad) - ((sf1.y - minF) / spanF) * (h - 2.0 * pad);
            float l0 = 1.0 - smoothstep(0.0, w0, abs(vUV.y - y0));
            float l1 = 1.0 - smoothstep(0.0, w1, abs(vUV.y - y1));
            float baseY = (yTop1 - pad) - ((0.0 - minF) / spanF) * (h - 2.0 * pad);
            float base = 1.0 - smoothstep(0.0, 0.0012, abs(vUV.y - baseY));
            col = mix(col, vec3(0.18,0.2,0.23), base * 0.6);
            col += vec3(0.25, 0.75, 0.85) * l0;
            if(showLSOverlay > 0) col += vec3(0.95) * (l0 * 0.95);
            col += vec3(0.05, 0.95, 1.00) * l1;
            alpha = max(alpha, 0.90);
        }

        if(inBL > 0.5){
            float xu = clamp((vUV.x - xBL0) / max(0.001, (xBL1 - xBL0)), 0.0, 1.0);
            vec4 sf0 = sampleRowLinear(tauSindyTau1Ref, xu);
            vec4 sf1 = sampleRowLinear(tauSindy, xu);
            float h = (yBot1 - yBot0);
            float pad = 0.04 * h;
            float y0 = (yBot1 - pad) - ((sf0.z - minS) / spanS) * (h - 2.0 * pad);
            float y1 = (yBot1 - pad) - ((sf1.z - minS) / spanS) * (h - 2.0 * pad);
            float l0 = 1.0 - smoothstep(0.0, w0, abs(vUV.y - y0));
            float l1 = 1.0 - smoothstep(0.0, w1, abs(vUV.y - y1));
            float baseY = (yBot1 - pad) - ((0.0 - minS) / spanS) * (h - 2.0 * pad);
            float base = 1.0 - smoothstep(0.0, 0.0012, abs(vUV.y - baseY));
            col = mix(col, vec3(0.18,0.2,0.23), base * 0.6);
            col += vec3(0.70, 0.30, 0.65) * l0;
            if(showLSOverlay > 0) col += vec3(0.95) * (l0 * 0.95);
            col += vec3(1.00, 0.20, 0.85) * l1;
            alpha = max(alpha, 0.90);
        }

        if(inBR > 0.5){
            float xu = clamp((vUV.x - xBR0) / max(0.001, (xBR1 - xBR0)), 0.0, 1.0);
            vec4 sf0 = sampleRowLinear(tauSindyTau1Ref, xu);
            vec4 sf1 = sampleRowLinear(tauSindy, xu);
            float h = (yBot1 - yBot0);
            float pad = 0.04 * h;
            float y0 = (yBot1 - pad) - ((sf0.w - minA) / spanA) * (h - 2.0 * pad);
            float y1 = (yBot1 - pad) - ((sf1.w - minA) / spanA) * (h - 2.0 * pad);
            float l0 = 1.0 - smoothstep(0.0, w0, abs(vUV.y - y0));
            float l1 = 1.0 - smoothstep(0.0, w1, abs(vUV.y - y1));
            float baseY = (yBot1 - pad) - ((0.0 - minA) / spanA) * (h - 2.0 * pad);
            float base = 1.0 - smoothstep(0.0, 0.0012, abs(vUV.y - baseY));
            col = mix(col, vec3(0.18,0.2,0.23), base * 0.6);
            col += vec3(0.75, 0.65, 0.25) * l0;
            if(showLSOverlay > 0) col += vec3(0.95) * (l0 * 0.95);
            col += vec3(1.00, 0.84, 0.16) * l1;
            alpha = max(alpha, 0.90);
        }

        if(inPdf > 0.5){
            float xu = clamp((vUV.x - xL) / max(0.001, (xR - xL)), 0.0, 1.0);
            vec4 ps = sampleRowLinear(tauFPStationary, xu);
            float h = (yPdf1 - yPdf0);
            float pad = 0.04 * h;
            float yH = (yPdf1 - pad) - ((ps.x - minP) / spanP) * (h - 2.0 * pad);
            float yI = (yPdf1 - pad) - ((ps.y - minP) / spanP) * (h - 2.0 * pad);
            float yF = (yPdf1 - pad) - ((ps.z - minP) / spanP) * (h - 2.0 * pad);
            float lH = 1.0 - smoothstep(0.0, 0.0019, abs(vUV.y - yH));
            float lI = 1.0 - smoothstep(0.0, 0.0019, abs(vUV.y - yI));
            float lF = 1.0 - smoothstep(0.0, 0.0019, abs(vUV.y - yF));
            col += vec3(0.1, 0.9, 1.0) * lH;
            if(showFPStationary > 0){
                col += vec3(0.9, 0.2, 0.9) * lI;
                col += vec3(1.0, 0.65, 0.15) * lF;
            }
            alpha = max(alpha, 0.90);
        }

        float b = 0.0015;
        float edgeTop = inTop * (1.0 - step(b, min(min(vUV.x - xL, xR - vUV.x), min(vUV.y - yTop0, yTop1 - vUV.y))));
        float edgeBL = inBL * (1.0 - step(b, min(min(vUV.x - xBL0, xBL1 - vUV.x), min(vUV.y - yBot0, yBot1 - vUV.y))));
        float edgeBR = inBR * (1.0 - step(b, min(min(vUV.x - xBR0, xBR1 - vUV.x), min(vUV.y - yBot0, yBot1 - vUV.y))));
        float edgePdf = inPdf * (1.0 - step(b, min(min(vUV.x - xL, xR - vUV.x), min(vUV.y - yPdf0, yPdf1 - vUV.y))));
        float edge = max(max(edgeTop, edgeBL), max(edgeBR, edgePdf));
        if(edge > 0.5){
            col = mix(col, vec3(0.92), 0.8);
            alpha = max(alpha, 0.95);
        }

        fragColor = vec4(clamp(col, 0.0, 1.0), alpha);
        return;
    }

    // Panel superior: score final por (tau,subseq)
    if(vUV.y > 0.52){
        vec2 uv = vec2(vUV.x, (vUV.y-0.52)/0.46);
        int txLocal = clamp(int(floor(uv.x*float(tCount))),0,tCount-1);
        int tx = tMin0 + txLocal;
        int sy = clamp(int(floor(uv.y*float(tauMax))),0,tauMax-1);
        vec4 xs = texelFetch(tauXiMetaFinal, ivec2(tx, sy), 0);
        vec4 mk = texelFetch(tauModelMask, ivec2(tx, sy), 0);
        vec4 fp = texelFetch(tauFPProxy, ivec2(tx, sy), 0);
        vec4 sc = texelFetch(tauModelScore, ivec2(tx, sy), 0);
        float valid = xs.y;
        float score = sc.y;

        float cN = clamp(1.0/(1.0+1.8*score), 0.0, 1.0);
        col = mix(vec3(0.25,0.05,0.05), vec3(0.1,0.95,0.3), cN);
        if(valid < 0.5) col *= vec3(0.45,0.45,0.45);

        if(tx == bestTau-1 && sy == bestSubseq){
            col = mix(col, vec3(1.0,1.0,0.2), 0.7);
        }
        if(mk.x > 0.5){
            col = mix(col, vec3(0.15, 1.0, 1.0), 0.35);
        }
        if(fp.x > 0.5){
            col = mix(col, vec3(1.0, 0.55, 0.15), 0.35);
        }else if(fp.z < 0.5 && mk.x > 0.5){
            col *= vec3(0.65, 0.65, 0.9);
        }
        if(sc.x > 0.5){
            col = mix(col, vec3(1.0,1.0,1.0), 0.28);
        }
        if(hasAuto > 0.5 && tx == autoTau-1 && sy == autoSub){
            col = mix(col, vec3(1.0,0.35,1.0), 0.65);
        }
        alpha = 0.95;
    }

    // Panel inferior izquierda: KL mapa
    if(vUV.y < 0.46 && vUV.x < 0.49){
        vec2 uv = vec2(vUV.x/0.49, vUV.y/0.46);
        ivec2 p = ivec2(tMin0 + clamp(int(floor(uv.x*float(tCount))),0,tCount-1),
                        clamp(int(floor(uv.y*float(tauMax))),0,tauMax-1));
        vec4 klv = texelFetch(tauModelKL, p, 0);
        float v = clamp(1.0/(1.0+0.4*klv.x), 0.0, 1.0);
        col = mix(vec3(0.25,0.05,0.08), vec3(0.15,0.95,0.95), v);
        if(klv.y < 0.5) col *= vec3(0.45,0.45,0.45);
        alpha = 0.95;
    }

    // Panel inferior derecha: coste bruto mapa
    if(vUV.y < 0.46 && vUV.x > 0.51){
        vec2 uv = vec2((vUV.x-0.51)/0.49, vUV.y/0.46);
        ivec2 p = ivec2(tMin0 + clamp(int(floor(uv.x*float(tCount))),0,tCount-1),
                        clamp(int(floor(uv.y*float(tauMax))),0,tauMax-1));
        vec4 xs = texelFetch(tauXiMetaFinal, p, 0);
        vec4 st = texelFetch(tauStats, ivec2(0,0), 0);
        float c = xs.x;
        float valid = xs.y;
        float bestCost = max(st.x, 0.0);
        float maxCost = max(st.z, bestCost + 1e-6);
        //Revisor: corregido el mapa de coste para usar el rango real observado y una compresión logarítmica.
        //La versión anterior colapsaba casi todas las celdas en el mismo amarillo cuando el coste vivía en un intervalo estrecho.
        float lo = log(1.0 + max(bestCost, 0.0));
        float hi = log(1.0 + max(maxCost, bestCost + 1e-6));
        float vv = 1.0 - clamp((log(1.0 + max(c, 0.0)) - lo) / max(hi - lo, 1e-6), 0.0, 1.0);
        float v = mix(0.15, 1.0, vv);
        col = mix(vec3(0.2,0.08,0.08), vec3(0.95,0.75,0.2), v);
        if(valid < 0.5) col *= vec3(0.42,0.42,0.42);
        alpha = 0.95;
    }

    // Banda central: curvas sindy inicial/final del modelo seleccionado
    if(vUV.y > 0.47 && vUV.y < 0.51){
        int b = clamp(int(floor(vUV.x * float(nBins))), 0, nBins - 1);
        vec4 sf0 = texelFetch(tauSindyInit, ivec2(b, 0), 0); // inicial
        vec4 sf1 = texelFetch(tauSindy, ivec2(b, 0), 0);     // final

        float yF0 = 0.49 - 0.015 * tanh(sf0.y * 0.15);
        float yA0 = 0.49 - 0.015 * tanh(sf0.w * 0.15);
        float yS0 = 0.49 - 0.015 * tanh(sf0.z * 0.15);

        float yF1 = 0.49 - 0.015 * tanh(sf1.y * 0.15);
        float yA1 = 0.49 - 0.015 * tanh(sf1.w * 0.15);
        float yS1 = 0.49 - 0.015 * tanh(sf1.z * 0.15);

        float lF0 = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yF0));
        float lA0 = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yA0));
        float lS0 = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yS0));

        float lF1 = 1.0 - smoothstep(0.0, 0.0018, abs(vUV.y - yF1));
        float lA1 = 1.0 - smoothstep(0.0, 0.0018, abs(vUV.y - yA1));
        float lS1 = 1.0 - smoothstep(0.0, 0.0018, abs(vUV.y - yS1));

        col = vec3(0.08, 0.08, 0.1);
        col += vec3(0.06, 0.45, 0.55) * lF0;
        col += vec3(0.55, 0.45, 0.08) * lA0;
        col += vec3(0.55, 0.10, 0.45) * lS0;
        col += vec3(0.1, 0.85, 1.0) * lF1;
        col += vec3(1.0, 0.82, 0.2) * lA1;
        col += vec3(1.0, 0.2, 0.85) * lS1;
        alpha = 0.95;
    }

    // Banda inferior: p_hist vs p_steady inicial/final (modelo seleccionado)
    if(vUV.y > 0.005 && vUV.y < 0.035){
        int b = clamp(int(floor(vUV.x * float(nBins))), 0, nBins - 1);
        vec4 ps = texelFetch(tauFPStationary, ivec2(b, 0), 0); // [pHist,pInit,pFinal,valid]
        float yH = 0.008 + 0.025 * clamp(ps.x * 28.0, 0.0, 1.0);
        float yI = 0.008 + 0.025 * clamp(ps.y * 28.0, 0.0, 1.0);
        float yF = 0.008 + 0.025 * clamp(ps.z * 28.0, 0.0, 1.0);

        float lH = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yH));
        float lI = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yI));
        float lF = 1.0 - smoothstep(0.0, 0.0014, abs(vUV.y - yF));

        col = vec3(0.06, 0.06, 0.08);
        col += vec3(0.1, 0.9, 1.0) * lH;
        col += vec3(0.9, 0.2, 0.9) * lI;
        col += vec3(1.0, 0.65, 0.15) * lF;
        if(ps.w < 0.5) col *= vec3(0.5, 0.4, 0.4);
        alpha = 0.96;
    }

    if((vUV.y>=0.459 && vUV.y<=0.461) || (vUV.y>=0.519 && vUV.y<=0.521)){ col = vec3(0.9); alpha = 0.8; }
    if(vUV.x>=0.49 && vUV.x<=0.51 && vUV.y<0.46){ col = vec3(0.9); alpha = 0.8; }

    fragColor = vec4(col, alpha);
}


