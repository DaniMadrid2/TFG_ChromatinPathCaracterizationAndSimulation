# 7_tauAdjointFields.frag

## Objetivo

Reconstruir las funciones del modelo sobre la malla espacial para cada vértice del simplex.

## Ecuaciones

\[
f(x)=\sum_i \xi_i^{(f)}\phi_i(x),
\qquad
s(x)=\sum_j \xi_j^{(s)}\psi_j(x),
\qquad
a(x)=\frac{1}{2}s(x)^2.
\]

## Papel en el algoritmo

Traduce la representación en coeficientes a una representación en espacio físico discretizado. Sin este paso no se podrían construir ni el operador adjunto ni la pdf estacionaria.

