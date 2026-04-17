# 13_tauKrylovStep.frag

## Objetivo

Aplicar repetidamente el operador \(L\) para expandir la base de Krylov.

## Regla de propagación

\[
K_{k+1}=LK_k.
\]

## Papel en el algoritmo

Generar suficiente información direccional para que Arnoldi pueda construir una base ortonormal estable y una Hessenberg reducida informativa.

