# 1_drawTauMaxVeces.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Composite debug view: score map, KL map, cost map, and SINDY/FP curves.

## 2. Parámetros, variables y texturas
### Uniforms
- `tauXiMetaFinal` (`sampler2D`): size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
- `tauBest` (`sampler2D`): size: [1, 1] = [bestTau, bestSubseq, cost, found]
- `tauSindy` (`sampler2D`): size: [nBins, 1] = [x, f_sindy, s_sindy, a_sindy]
- `tauSindyInit` (`sampler2D`): size: [nBins, 1] = [x, f_sindy, s_sindy, a_sindy] (init)
- `tauSindyTau1Ref` (`sampler2D`): size: [nBins, 1] = LS reference at tau=1, subseq=0
- `tauModelMask` (`sampler2D`): size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
- `tauFPProxy` (`sampler2D`): size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]
- `tauFPStationary` (`sampler2D`): size: [nBins, 1] = [pHist, pInit, pFinal, valid]
- `tauModelKL` (`sampler2D`): size: [tauMax, tauMax] = [kl, valid, spanN, sumH]
- `tauModelScore` (`sampler2D`): size: [tauMax, tauMax] = [selected, score, valid, costRaw]
- `tauStats` (`sampler2D`): size: [1, 1] = [bestCost, threshold, maxValidCost, targetK]
- `tauMax` (`int`):
- `tauMin` (`int`):
- `nBins` (`int`):
- `bestTau` (`int`):
- `bestSubseq` (`int`):
- `showTauCurves` (`int`): 0 = paneles; 1 = curvas/PDF en alta resolucion
- `showFPStationary` (`int`): 0 = ocultar curva FP estacionaria
- `showLSOverlay` (`int`): 0 = ocultar overlay LS; 1 = superponer la curva LS en blanco

### Salidas
- `fragColor` (`vec4`): screen output

## 3. Funciones auxiliares y casos de uso
### `sampleRowLinear`
Se invoca 7 vez/veces desde `main()`.

## 4. Desglose de `main()`
### 4.1. Layout: panel principal arriba (f), dos abajo (s y a), tira PDF inferior.
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Escala fija solicitada para comparar modelos:
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. Y=1 en a(t) => 2.7 ; y=1 en s(t) => sqrt(2*2.7)
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.4. Panel superior: score final por (tau,subseq)
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.5. Panel inferior izquierda: KL mapa
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.6. Panel inferior derecha: coste bruto mapa
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Kullback-Leibler divergence** (Divergencia de Kullback-Leibler): Medida de discrepancia entre una distribución empírica y una modelada.
- **Top-K selection** (Selección top-K): Retención de los mejores candidatos según ranking de una métrica escalar.
- **Smoothstep interpolation** (Interpolación suave): Transición suave entre dos estados usada para bordes y trazado de líneas.
- **Linear interpolation** (Interpolación lineal): Mezcla lineal entre dos cantidades o colores.

### Fórmulas importantes
- \[KL(P\\|Q)=\\sum_i P_i \\log\\frac{P_i}{Q_i}\]
- \[K=\\lceil n \\cdot p/100 \\rceil\]
- \[\\operatorname{smoothstep}(a,b,x)\]
- \[\\operatorname{mix}(a,b,t)=(1-t)a+tb\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
