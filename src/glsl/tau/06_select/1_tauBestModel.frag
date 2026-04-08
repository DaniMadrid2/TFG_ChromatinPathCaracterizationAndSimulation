#version 300 es
//? Global argmin search across (tau,subseq) with progressively relaxed filters.
//* Purpose: pick a single best model even if strict filters eliminate all candidates.
//! Output is a single-pixel selection texture size [1, 1].
precision highp float;
precision mediump int;

uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform sampler2D tauModelMask; //* size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
uniform sampler2D tauFPProxy; //* size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]
uniform sampler2D tauModelScore; //* size: [tauMax, tauMax] = [selected, score, valid, costRaw]
uniform int tauMax;
uniform int tauMin;
uniform int useMask;
uniform int useFP;
uniform int useScore;

in vec2 vUV;
//!Salida
//? Single winner: (tau, subseq) plus cost and found flag.
layout(location = 0) out vec4 tauBest; //! size: [1, 1] = [bestTau(1-based), bestSubseq, bestCost, found]

void main(){
    float bestCost = 1e30;
    int bestTau = 1;
    int bestSub = 0;
    float found = 0.0;

    int tMin = max(tauMin, 1);
    for(int pass=0; pass<5; pass++){
        if(found > 0.5) break;
        bool mustUseScoreSel = (useScore > 0) && (pass == 0);
        bool mustUseScoreValid = (useScore > 0) && (pass == 1);
        bool mustUseFP = (useFP > 0) && (pass == 2);
        bool mustUseMask = (useMask > 0) && (pass == 3);

        for(int t=1; t<=256; t++){
            if(t>tauMax) break;
            if(t<tMin) continue;
            for(int s=0; s<256; s++){
                if(s>=t) break;
                vec4 xs = texelFetch(tauXiMetaFinal, ivec2(t-1, s), 0);
                float valid = xs.y;
                float nUsed = xs.z;
                if(valid <= 0.5 || nUsed < 4.0) continue;

                vec4 sc = texelFetch(tauModelScore, ivec2(t-1, s), 0);
                float selScore = sc.x;
                float scoreVal = sc.y;
                float scoreValid = sc.z;
                float cost = (useScore > 0) ? scoreVal : xs.x;

                if(mustUseScoreSel && selScore <= 0.5) continue;
                if(mustUseScoreValid && scoreValid <= 0.5) continue;

                if(mustUseMask){
                    float sel = texelFetch(tauModelMask, ivec2(t-1, s), 0).x;
                    if(sel <= 0.5) continue;
                }
                if(mustUseFP){
                    float selFP = texelFetch(tauFPProxy, ivec2(t-1, s), 0).x;
                    if(selFP <= 0.5) continue;
                }

                if(cost < bestCost){
                    bestCost = cost;
                    bestTau = t;
                    bestSub = s;
                    found = 1.0;
                }
            }
        }
    }

    tauBest = vec4(float(bestTau), float(bestSub), bestCost, found);
}


