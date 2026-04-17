# 3_tauAdjointCost.frag

## Objetivo

Evaluar el coste total asociado a un vértice del simplex de Nelder-Mead.

## Coste evaluado

\[
J(\theta)=
\sum_b \Bigl[w_F(b)(f_{\tau}(x_b)-f_{KM}(x_b))^2 + w_A(b)(a_{\tau}(x_b)-a_{KM}(x_b))^2\Bigr]
+ \lambda_{KL}D_{KL}(p_{hist}\|p_{stat}) + \lambda_{reg}R(\theta) + \lambda_{phys}P_{phys}(\theta).
\]

## Papel en el algoritmo

Convierte toda la información física y numérica del pipeline en un escalar comparable entre vértices. Ese escalar es el que usa Nelder-Mead para decidir cómo mover el simplex.

