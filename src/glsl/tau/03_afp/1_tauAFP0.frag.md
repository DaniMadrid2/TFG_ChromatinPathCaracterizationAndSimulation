# 1_tauAFP0.frag

## Objetivo

Refinar la solución inicial procedente de mínimos cuadrados antes de entrar en la optimización de Nelder-Mead.

## Modelo que ajusta

\[
f(x) = \sum_i \xi_i^{(f)}\phi_i(x),
\qquad
s(x) = \sum_j \xi_j^{(s)}\psi_j(x),
\qquad
a(x)=\frac{1}{2}s(x)^2.
\]

## Función objetivo

\[
J_{AFP0}(\theta)=
\sum_b \Bigl[w_F(b)(f(x_b)-f_{KM}(x_b))^2 + w_A(b)(a(x_b)-a_{KM}(x_b))^2\Bigr]
+ \lambda_{neg}P_{neg}(s) + \lambda_1\|\theta\|_1.
\]

## Papel en el algoritmo

Genera una semilla mejor condicionada que la salida directa de LS y reduce la probabilidad de que Nelder-Mead arranque en una región pobre del espacio de parámetros.

