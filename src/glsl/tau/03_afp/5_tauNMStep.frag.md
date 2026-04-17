# 5_tauNMStep.frag

## Objetivo

Aplicar una iteración de Nelder-Mead utilizando los costes calculados por `3_tauAdjointCost.frag`.

## Transformaciones principales

\[
x_r = c + \alpha(c-x_h),
\qquad
x_e = c + \gamma(x_r-c),
\qquad
x_c = c + \rho(x_h-c).
\]

Si ninguna transformación mejora suficientemente el coste, se ejecuta un shrink del simplex.

## Papel en el algoritmo

Es el núcleo geométrico de la optimización sin derivadas. Este shader decide cómo se desplazan los candidatos en el espacio de coeficientes.

