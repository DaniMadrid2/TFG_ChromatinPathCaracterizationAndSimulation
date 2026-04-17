# 2_tauAFPOpt.frag

## Objetivo

Mantener la interfaz histórica del ajuste avanzado y organizar el paso entre la fase de refinamiento inicial y la fase multipaso basada en Nelder-Mead, AdjFP y SteadyFP.

## Papel conceptual

Este shader no concentra ya toda la lógica física del ajuste. Su papel es servir de puente arquitectónico entre la etapa antigua de `AFPOpt` y la tubería actual de coste multipaso.

## Idea matemática

El objetivo global sigue siendo

\[
\theta^* = \arg\min_{\theta} J(\theta),
\]

pero la evaluación de \(J\) se reparte entre varios shaders especializados.

