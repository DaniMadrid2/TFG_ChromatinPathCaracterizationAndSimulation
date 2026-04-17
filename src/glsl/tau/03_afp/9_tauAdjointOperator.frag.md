# 9_tauAdjointOperator.frag

## Objetivo

Construir la discretización del operador adjunto de Fokker-Planck.

## Ecuación principal

\[
L = \operatorname{diag}(f)D_x + \operatorname{diag}(a)D_{xx}.
\]

## Papel en el algoritmo

Este operador encapsula la dinámica local del modelo y permite propagar observables en el tiempo sin resolver directamente la ecuación completa de densidades en cada paso de Nelder-Mead.

