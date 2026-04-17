# 6_tauNMFinalize.frag

## Objetivo

Seleccionar el mejor vértice del simplex una vez terminada la optimización y escribirlo como salida final del bloque.

## Regla de selección

\[
\theta^* = \arg\min_k J(\theta_k).
\]

## Papel en el algoritmo

Cierra el proceso de Nelder-Mead y garantiza que el resto del pipeline reciba un conjunto de coeficientes utilizable, incluso si se necesita fallback hacia `AFP0`.

