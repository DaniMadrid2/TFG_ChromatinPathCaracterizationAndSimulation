# 4_tauNMSimplexInit.frag

## Objetivo

Construir el simplex inicial de Nelder-Mead a partir de la solución refinada por `AFP0`.

## Idea matemática

Si la dimensión del problema es \(d\), el simplex inicial tiene \(d+1\) vértices. Uno coincide con la semilla central y los demás se obtienen mediante perturbaciones controladas sobre cada eje paramétrico.

## Papel en el algoritmo

Fija la geometría inicial de la exploración local. Una mala inicialización del simplex perjudica tanto la velocidad como la estabilidad de la optimización posterior.

