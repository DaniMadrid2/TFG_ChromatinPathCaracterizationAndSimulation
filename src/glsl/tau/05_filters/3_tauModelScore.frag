#version 300 es
//? Combine cost, KL and span into a single normalized score per model.
//* Purpose: rank models with a single scalar and apply a final score cutoff.
//! Output is a model grid size [tauMax, tauMax].
precision highp float;
precision mediump int;

uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform sampler2D tauModelMask; //* size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
uniform sampler2D tauFPProxy; //* size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]
uniform sampler2D tauModelKL; //* size: [tauMax, tauMax] = [kl, valid, spanN, sumH]
uniform sampler2D tauStats; //* size: [1, 1] = [bestCost, threshold, meanTop, targetK]
uniform int tauMax;
uniform int tauMin;
uniform float wCost;
uniform float wKL;
uniform float wSpan;
uniform float klMax;
uniform float scoreMax;

in vec2 vUV;
//!Salida
//? Per-model selection flag plus final score value.
//*score = 
// combinación ponderada de costo normalizado, KL normalizado y
// span normalizado, donde cada componente se normaliza respecto a un
// valor máximo esperado (bestCost para costo, klMax para KL, y 1.0 para span)
// y luego se combina usando pesos wCost, wKL y wSpan.
//*score = wCost * costN + wKL * klN + wSpan * spanN;
//El resultado se escala a [0,1] dividiendo por un scoreMax
// que representa el peor score aceptable.
layout(location = 0) out vec4 tauModelScore; //! size: [tauMax, tauMax] = [selected, score, valid, costRaw]

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    int tMin = max(tauMin, 1);
    if(tau <= 0 || tau > tauMax || tau < tMin || subseq < 0 || subseq >= tau){
        tauModelScore = vec4(0.0, 1e9, 0.0, 1e9);
        return;
    }

    vec4 xs = texelFetch(tauXiMetaFinal, ivec2(tau-1, subseq), 0);
    vec4 mk = texelFetch(tauModelMask, ivec2(tau-1, subseq), 0);
    vec4 fp = texelFetch(tauFPProxy, ivec2(tau-1, subseq), 0);
    vec4 klv = texelFetch(tauModelKL, ivec2(tau-1, subseq), 0);
    vec4 st = texelFetch(tauStats, ivec2(0,0), 0); // [best,thr,meanTop,targetK]

    float cost = xs.x;
    float best = st.x;
    float thr = st.y;
    // costN es el costo normalizado respecto al mejor costo encontrado, escalado a [0,1] usando el umbral como referencia para el peor costo aceptable.
    float costN = clamp((cost - best) / max(thr - best, 1e-6), 0.0, 3.0) / 3.0;
    //kLN es el KL normalizado respecto a un valor máximo esperado klMax, escalado a [0,1].
    float klN = clamp(klv.x / max(klMax, 1e-6), 0.0, 3.0) / 3.0;
    //spanN es el span normalizado, que ya está en [0,1] según el cálculo previo en tauFPProxy.
    float spanN = clamp(fp.w, 0.0, 1.0);
    float score = wCost * costN + wKL * klN + wSpan * spanN;

    float valid = 1.0;
    //* Para que un modelo sea seleccionado, debe ser válido según varios criterios:
    //* debe tener suficientes datos usados (valid en tauXiSFinal),
    //* debe haber sido seleccionado por el filtro de costo (selected en tauModelMask).
    //* debe pasar el filtro de estabilidad numérica (validFP en tauFPProxy),
    //* y debe pasar el filtro de ajuste a la distribución (valid en tauModelKL).
    valid *= (xs.y > 0.5 && xs.z >= 4.0) ? 1.0 : 0.0; //? valid en tauXiSFinal
    valid *= (mk.x > 0.5) ? 1.0 : 0.0; //? seleccionado en tauModelMask
    valid *= (fp.z > 0.5) ? 1.0 : 0.0; //? validFP en tauFPProxy
    valid *= (klv.y > 0.5) ? 1.0 : 0.0; //? valid en tauModelKL

    //? Finalmente, aplicamos un umbral de score para decidir si el modelo es seleccionado o no.

    float selected = (valid > 0.5 && score <= scoreMax) ? 1.0 : 0.0;
    tauModelScore = vec4(selected, score, valid, cost);
}


