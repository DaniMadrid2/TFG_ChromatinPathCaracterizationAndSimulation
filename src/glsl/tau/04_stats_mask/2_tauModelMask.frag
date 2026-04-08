#version 300 es
//? Mark models whose cost is within the top-K threshold from tauModelStats.
//* Purpose: cheap boolean mask to prune the search space before heavier filters.
//! Output is a model grid size [tauMax, tauMax].
precision highp float;
precision mediump int;

uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform sampler2D tauStats; //* size: [1, 1] = [bestCost, threshold, meanTop, targetK]
uniform int tauMax;
uniform int tauMin;

in vec2 vUV;
//!Salida
//? Per-model mask and normalized cost score for later filters.
//* selected = (valid > 0.5 && cost <= threshold)
//* scoreN = (cost - bestCost) / (threshold - bestCost), clamped to [0,1] para usarlo como un peso de filtrado suave en etapas posteriores.
layout(location = 0) out vec4 tauModelMask; //! size: [tauMax, tauMax] = [selected, cost, valid, scoreN]

void main(){
    ivec2 pos = ivec2(gl_FragCoord.xy - vec2(0.5));
    int tau = pos.x + 1;
    int subseq = pos.y;

    if(tau <= 0 || tau > tauMax || tau < max(tauMin,1) || subseq < 0 || subseq >= tau){
        tauModelMask = vec4(0.0, 1e9, 0.0, 1.0);
        return;
    }

    vec4 xs = texelFetch(tauXiMetaFinal, ivec2(tau-1, subseq), 0);
    float cost = xs.x;
    float valid = (xs.y > 0.5 && xs.z >= 4.0) ? 1.0 : 0.0;

    vec4 st = texelFetch(tauStats, ivec2(0,0), 0);
    float bestCost = st.x;
    float threshold = st.y;
    float denom = max(threshold - bestCost, 1e-6);
    float scoreN = clamp((cost - bestCost) / denom, 0.0, 1.0);
    float selected = (valid > 0.5 && cost <= threshold) ? 1.0 : 0.0;

    tauModelMask = vec4(selected, cost, valid, scoreN);
}


