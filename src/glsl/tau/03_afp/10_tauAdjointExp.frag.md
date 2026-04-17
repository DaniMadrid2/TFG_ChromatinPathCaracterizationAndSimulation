# 10_tauAdjointExp.frag

## Objetivo

Aproximar la acción de \(e^{L\tau}\) sobre los observables relevantes para el coste.

## Idea matemática

Si el proceso de Arnoldi produce \(LQ \approx QH\), entonces

\[
e^{L\tau}g \approx Q\,e^{H\tau}e_1\,\|g\|.
\]

La exponencial reducida \(e^{H\tau}\) se evalúa con Padé y scaling-and-squaring.

## Papel en el algoritmo

Permite aproximar de forma eficiente la propagación adjunta sin construir una exponencial matricial completa para todos los modelos.

