# 8_tauAdjointDiffOps.frag

## Objetivo

Construir los operadores discretos de derivación y los momentos geométricos de referencia.

## Ecuaciones

\[
D_x \approx \partial_x,
\qquad
D_{xx} \approx \partial_{xx},
\qquad
m_1(i,j)=x_j-x_i,
\qquad
m_2(i,j)=(x_j-x_i)^2.
\]

## Papel en el algoritmo

Proporciona la infraestructura discreta con la que se ensamblará el operador adjunto y se reconstruirán momentos a tiempo finito.

