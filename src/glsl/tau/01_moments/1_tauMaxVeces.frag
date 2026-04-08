#version 300 es
//? Compute per-(tau,subseq,bin) Kramers-Moyal moments from deltaX samples.
//* Purpose: build empirical drift/diffusion stats used by the SINDY fitting stage.
//! Outputs are dense model tables: size = [nBins, tauMax*tauMax] (one row per modelIdx).
precision highp float;
precision mediump int;

uniform sampler2D datosX1; //* size: [nSamples, 1] sampled as a 1D signal
uniform int nSamples; //* lenX1
uniform int tauMax; //* max tau to consider (ej.: 100)
uniform int tauMin; //* min tau to consider (ej.: 1)
uniform int nBins;
uniform float dtSample;
uniform float tauEStar;

//!Salida
//? Each fragment stores one (tau, subseq, bin) summary for the model grid.
//! Writes to two RGBA targets sized [nBins, tauMax*tauMax].
layout(location = 0) out vec4 tauMom1; //! size: [nBins, tauMax*tauMax] = [count, sumD, sumD2, maxAbs]
layout(location = 1) out vec4 tauMom2; //! size: [nBins, tauMax*tauMax] = [fKM, aKM, f_err, a_err]

const int MAX_PAIRS = 8192;

float sampleX(int i){
    return texelFetch(datosX1, ivec2(clamp(i,0,nSamples-1), 0), 0).r;
}

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int b = pos.x; //bin index
    int modelIdx = pos.y;

    //+1 porque tau empieza en 1
    //calcula tau y subseq a partir de modelIdx (1 a tauMax^2)
    int tau = modelIdx / tauMax + 1;
    int subseq = modelIdx - (tau - 1) * tauMax;

    int tMin = max(tauMin, 1);
    if (b < 0 || b >= nBins || tau <= 0 || tau > tauMax || tau < tMin || tau >= nSamples || subseq < 0 || subseq >= tau){
        tauMom1 = vec4(0.0);
        tauMom2 = vec4(0.0, 0.0, -1.0, -1.0);
        return;
    }

    //nº de saltos, es decir longitud de la subsecuencia
    //Revisor: corregido y explicitado que m es el numero de incrementos disponibles para este (tau, subseq).
    //Revisor: corregido el comentario para dejar claro que si m > MAX_PAIRS el estimador se trunca por coste computacional, no por una razon estadistica.
    int m = (nSamples - 1 - subseq) / tau;
    if (m <= 0){
        tauMom1 = vec4(0.0);
        tauMom2 = vec4(0.0, 0.0, -1.0, -1.0);
        return;
    }

    //Calculamos la diferencia máxima
    float maxAbs = 0.0;
    for (int j=0; j<MAX_PAIRS; j++){
        if (j >= m) break;
        int i0 = subseq + j * tau;
        int i1 = i0 + tau;
        float d = sampleX(i1) - sampleX(i0);
        maxAbs = max(maxAbs, abs(d));
    }

    // safeMax=maxAbs||1e-9, bw=binWidth, lo=binLowerBound, hi=binUpperBound
    float safeMax = max(maxAbs, 1e-9);
    float bw = safeMax / float(nBins);
    float lo = float(b) * bw;
    float hi = (float(b) + 1.0) * bw;

    float c = 0.0;//count of pairs in this (tau,subseq,bin) that contribute to the moments
    float sumD = 0.0;
    float sumD2 = 0.0;
    float sumD4 = 0.0; //d4 está para calcular el error de aKM usando varD2 = meanD4 - meanD2^2

    for (int j=0; j<MAX_PAIRS; j++){
        if (j >= m) break;
        int i0 = subseq + j * tau;
        int i1 = i0 + tau;
        float d = sampleX(i1) - sampleX(i0);
        float ad = abs(d);
        bool inBin = (b == nBins - 1) ? (ad >= lo && ad <= hi) : (ad >= lo && ad < hi);
        if(!inBin) continue;
        float d2 = d * d;
        c += 1.0;
        sumD += d;
        sumD2 += d2;
        sumD4 += d2 * d2;
    }

    //Estos datos se usarán para calcular los momentos de Kramers-Moyal en el shader de SINDY fitting.
    tauMom1 = vec4(c, sumD, sumD2, safeMax);

    if (c < 1.0){
        tauMom2 = vec4(0.0, 0.0, -1.0, -1.0);
        return;
    }


    float scale = max(tauEStar * dtSample, 1e-9);
    float meanD = sumD / c;
    float meanD2 = sumD2 / c;
    float meanD4 = sumD4 / c;

    float varD = max(meanD2 - meanD * meanD, 0.0);
    float varD2 = max(meanD4 - meanD2 * meanD2, 0.0);

    float fKM = meanD / scale;   // dX = diff/dt
    float aKM = meanD2 / scale;  // dX2 = diff^2/dt
    //Revisor: corregido el escalado del error estandar. Si el observable se divide por "scale",
    //Revisor: el error tipico tambien debe dividirse por "scale"; antes quedaba mal escalado como 1/sqrt(scale).
    float fErr = sqrt(varD / c) / scale;
    float aErr = sqrt(varD2 / c) / scale;

    //Estos datos se usarán para visualizar los momentos de Kramers-Moyal en el shader de diagnóstico.
    tauMom2 = vec4(fKM, aKM, fErr, aErr);
}



