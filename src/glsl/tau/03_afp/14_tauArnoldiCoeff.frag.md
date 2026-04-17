# 14_tauArnoldiCoeff.frag

## Objetivo

Ortonormalizar la base de Krylov, construir la matriz de Hessenberg reducida y estabilizar el procedimiento mediante reortogonalización adaptativa por residuo.

## Ecuación estructural

\[
LQ \approx QH.
\]

## Papel en el algoritmo

Transforma una base de Krylov potencialmente mal condicionada en una representación reducida estable, mucho más adecuada para aproximar la acción de la exponencial del operador adjunto.

