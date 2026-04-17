# 11_tauSteadyFP.frag

## Objetivo

Calcular una densidad estacionaria discreta compatible con el modelo actual.

## Ecuación de referencia

\[
J(x)=f(x)p(x)-\partial_x\bigl(a(x)p(x)\bigr)=0.
\]

En el shader, esta condición conduce a un sistema tridiagonal

\[
Ap=b,
\]

que se resuelve por batch con un algoritmo de Thomas y se normaliza imponiendo masa total unitaria.

## Papel en el algoritmo

Introducir un criterio global de coherencia entre la dinámica estimada y la distribución espacial observada.

