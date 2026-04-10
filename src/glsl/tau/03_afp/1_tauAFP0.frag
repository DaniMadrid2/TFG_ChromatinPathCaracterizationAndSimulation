#version 300 es
//? Gradient descent refinement with L1 shrinkage over the packed coefficient vector [f terms..., s terms...].
//* Purpose: encourage sparse libraries while lowering fit cost vs raw LS.
//! Outputs are model grids sized [tauMax, tauMax], split as packed coefficients + metadata.
precision highp float;
precision mediump int;

uniform sampler2D tauMom1;   //* size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
uniform sampler2D tauMom2;   //* size: [nBins, tauMax*tauMax] = [fKM,aKM,fErr,aErr]
uniform sampler2D tauXiF;    //* packed coeffs[0..3]
uniform sampler2D tauXiS;    //* packed coeffs[4..7]
uniform sampler2D tauXiMeta; //* [cost, valid, nUsed, reserved]
uniform int tauMax;
uniform int tauMin;
uniform int nBins;
uniform float lrF;
uniform float lrS;
uniform float l1F;
uniform float l1S;
uniform int nIter;

//!Salida
//? Start from LS, run L1-regularized descent, then keep the better of init vs optimized.
//! Writes to RGBA targets sized [tauMax, tauMax].
layout(location = 0) out vec4 tauXiFOpt; //! packed coeffs[0..3]
layout(location = 1) out vec4 tauXiSOpt; //! packed coeffs[4..7]
layout(location = 2) out vec4 tauXiMetaOpt; //! [cost, valid(0/1), nUsed, reserved]

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

float tauEvalSRaw(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    float acc = 0.0;
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
        if(i >= TAU_S_TERMS) break;
        acc += coeffs[TAU_F_TERMS + i] * tauSBasis(i, x);
    }
    return 2.0 * acc;
}

float tauEvalS(float coeffs[TAU_MAX_TOTAL_TERMS], float x){
    return max(abs(tauEvalSRaw(coeffs, x)), 1e-6);
}

float tauSObsErr(float aKM, float aErr){
    float yS = sqrt(max(2.0 * aKM, 0.0));
    return aErr / max(yS, 1e-4);
}

void tauUnpack(vec4 p0, vec4 p1, out float coeffs[TAU_MAX_TOTAL_TERMS]){
    coeffs[0] = p0.x; coeffs[1] = p0.y; coeffs[2] = p0.z; coeffs[3] = p0.w;
    coeffs[4] = p1.x; coeffs[5] = p1.y; coeffs[6] = p1.z; coeffs[7] = p1.w;
}

void tauPack(float coeffs[TAU_MAX_TOTAL_TERMS], out vec4 p0, out vec4 p1){
    p0 = vec4(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
    p1 = vec4(coeffs[4], coeffs[5], coeffs[6], coeffs[7]);
}

float softThreshold(float v, float t){
    float a = abs(v) - t;
    if (a <= 0.0) return 0.0;
    return sign(v) * a;
}

/** Calcula el costo del modelo dado por coeffs, usando los datos de tauMom2 para el modelo modelIdx y el ancho de bin bw.
*? cost = sum_b [ (fKM - fFit)^2 / fErr^2 + (yS - sFit)^2 / ySErr^2 ] / nUsed + 25 * sum_b [max(-rawS,0)] / nUsed

** 25*sum_b*max[rawS,0] es una penalización por s negativo, que es una forma de incorporar el conocimiento a priori de que s debe ser positivo,
** Porque s es la raíz cuadrada de la varianza del ruido, y la varianza no puede ser negativa.
* 
* Donde nUsed normalmente es aproximadamente nBins, pero puede ser menor si hay muchos bins con error negativo (datos faltantes) 
* o si el modelo no se ajusta bien y sFit es negativo en muchos puntos, lo que penaliza la solución.
*/
float tauModelCost(float coeffs[TAU_MAX_TOTAL_TERMS], int modelIdx, float bw, out float nUsed){
    float cost = 0.0;
    float negPenalty = 0.0;
    nUsed = 0.0;
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
        float rawS = tauEvalSRaw(coeffs, x);
        float sFit = max(abs(rawS), 1e-6);
        negPenalty += max(-rawS, 0.0);

        float ySErr = tauSObsErr(aKM, aErr);
        float wF = 1.0 / max(fErr * fErr, 1e-6);
        float wA = 1.0 / max(ySErr * ySErr, 1e-6);
        cost += wF * (fKM - fFit) * (fKM - fFit) + wA * (yS - sFit) * (yS - sFit);
        nUsed += 1.0;
    }
    return cost / max(nUsed, 1.0) + 25.0 * negPenalty / max(nUsed, 1.0);
}

void tauZeroOutputs(float nUsed){
    tauXiFOpt = vec4(0.0);
    tauXiSOpt = vec4(0.0);
    tauXiMetaOpt = vec4(1e9, 0.0, nUsed, 0.0);
}

/*
En resumen:

de LS sacamos unos Xi iniciales
si no son válidos, salimos con coste alto y valid=0

-> iteración de descenso de gradiente con L1 shrinkage:
    para cada bin con datos válidos, calculamos el gradiente del coste respecto a los coeficientes, acumulándolo en grad[]
    luego actualizamos los coeficientes restando lr * grad / nUsed, y aplicamos softThreshold para fomentar la sparsity
    si nUsed es muy bajo, salimos del bucle de optimización para evitar empeorar la solución

El coste (tauModelCost) se calcula como el error cuadrático ponderado de f y s, más una penalización por s negativo, normalizado por nUsed.
cost = sum_b [ (fKM - fFit)^2 / fErr^2 + (yS - sFit)^2 / ySErr^2 ] / nUsed + 25 * sum_b [max(-rawS,0)] / nUsed

Al final, comparamos el coste de la solución optimizada con el coste de la solución inicial, y guardamos la mejor de las dos en las salidas.

*/
void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    //que no esté fuera de rango, 
    //que el subseq sea válido
    //que el modelo inicial tenga suficientes términos
    if (tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau || TAU_TOTAL_TERMS > TAU_MAX_TOTAL_TERMS){
        tauZeroOutputs(0.0);
        return;
    }

    int modelIdx = (tau - 1) * tauMax + subseq;
    float maxAbs = texelFetch(tauMom1, ivec2(0, modelIdx), 0).w;
    float bw = max(maxAbs, 1e-9) / float(nBins);

    //Las seed son el punto de partida para el descenso del gradiente,
    //se calcularon como mínimo LS sin regularización
    //básicamente son las XiF y XiS
    vec4 seed0 = texelFetch(tauXiF, ivec2(tau-1, subseq), 0);
    vec4 seed1 = texelFetch(tauXiS, ivec2(tau-1, subseq), 0);
    //[cost, valid, nUsed, reserved]
    vec4 meta0 = texelFetch(tauXiMeta, ivec2(tau-1, subseq), 0);
    if (meta0.y < 0.5 || meta0.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
        tauZeroOutputs(meta0.z);
        return;
    }

    //Convertimos XiF/XiS a un vector y guardamos una referencia
    float coeffs0[TAU_MAX_TOTAL_TERMS];
    float coeffs[TAU_MAX_TOTAL_TERMS];
    tauUnpack(seed0, seed1, coeffs0);
    tauUnpack(seed0, seed1, coeffs);

    for (int it=0; it<160; it++){
        if (it >= nIter) break;

        float grad[TAU_MAX_TOTAL_TERMS];
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) grad[i] = 0.0;
        float nUsed = 0.0;

        for (int b=0; b<256; b++){
            if (b >= nBins) break;
            //st = [fKM,aKM,fErr,aErr]
            vec4 st = texelFetch(tauMom2, ivec2(b, modelIdx), 0);
            float fKM = st.x;
            float aKM = st.y;
            float fErr = st.z;
            float aErr = st.w;
            if (fErr < 0.0 || aErr < 0.0) continue;

            //x es el punto de evaluación, el centro del bin
            float cx = (float(b) + 0.5) * bw;
            //fFit = f(x)|_x=cx 
            float fFit = tauEvalF(coeffs, cx);
            //yS = sqrt(2 a) es la transformación que linealiza s(x)
            //para que el ajuste sea más estable, y también es la variable
            //con la que se calcula el error observado de s.
            float yS = sqrt(max(2.0 * aKM, 0.0));
            float rawS = tauEvalSRaw(coeffs, cx);
            //sFit = s(x)|_x=cx
            float sFit = max(abs(rawS), 1e-6);
            float sSign = (rawS >= 0.0) ? 1.0 : -1.0;
            //ySErr = aErr/sqrt(2 aKM) es el error observado de yS, 
            //que es la variable con la que se calcula el costo de s
            float ySErr = tauSObsErr(aKM, aErr);
            float wF = 1.0 / max(fErr * fErr, 1e-6);
            float wA = 1.0 / max(ySErr * ySErr, 1e-6);

            //TAU_MAX_TOTAL_TERMS es el tamaño total del vector de coeficientes (f+s),
            for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
                if(i < TAU_F_TERMS){
                    //El gradiente de fFit es 2 (fFit - fKM) * base_i(x), ponderado por wF
                    grad[i] += (2.0 * wF * (fFit - fKM)) * tauFBasis(i, cx);
                } else if(i < TAU_TOTAL_TERMS){
                    int sIdx = i - TAU_F_TERMS;
                    //El gradiente de sFit es 2 (sFit - yS) * base_i(x) * sign(sFit), ponderado por wA
                    grad[i] += (4.0 * wA * (sFit - yS) * sSign) * tauSBasis(sIdx, cx);
                }
            }
            nUsed += 1.0;
        }

        //si nUsed es muy bajo, el gradiente es poco fiable y el descenso puede empeorar mucho la solución.
        if (nUsed < float(max(TAU_F_TERMS, TAU_S_TERMS))) break;

        //Nos movemos por el gradiente
        for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++){
            if(i >= TAU_TOTAL_TERMS) break;
            float lr = (i < TAU_F_TERMS) ? lrF : lrS;
            float l1 = (i < TAU_F_TERMS) ? l1F : l1S;
            //Actualizamos el coeficiente i restando el gradiente, 
            //escalado por lr y normalizado por nUsed para que el 
            //paso sea más estable respecto al número de bins usados.
            coeffs[i] -= lr * (grad[i] / max(nUsed, 1.0));
            //softThreshold es básicamente "restar un valor l1 
            //pero no pasar de 0, y conservar el signo",
            //lo que fomenta que los coeficientes pequeños se 
            //vuelvan exactamente 0, promoviendo soluciones más simples. 
            coeffs[i] = softThreshold(coeffs[i], l1 * lr);
        }
    }

    float nA = 0.0;
    float cA = tauModelCost(coeffs, modelIdx, bw, nA);
    float nB = 0.0;
    float cB = tauModelCost(coeffs0, modelIdx, bw, nB);

    bool keepInit = cB < cA;
    float outCoeffs[TAU_MAX_TOTAL_TERMS];
    for(int i=0; i<TAU_MAX_TOTAL_TERMS; i++) outCoeffs[i] = keepInit ? coeffs0[i] : coeffs[i];
    float outCost = keepInit ? cB : cA;
    float outN = keepInit ? nB : nA;
    float outValid = (abs(outCost) < 1e30 && outN >= float(max(TAU_F_TERMS, TAU_S_TERMS))) ? 1.0 : 0.0;

    tauPack(outCoeffs, tauXiFOpt, tauXiSOpt);
    tauXiMetaOpt = vec4(outCost, outValid, outN, 0.0);
}
