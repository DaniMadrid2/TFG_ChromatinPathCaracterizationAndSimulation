# 1_tauBestModel.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Global argmin search across (tau,subseq) with progressively relaxed filters.

## 2. Parámetros, variables y texturas
### Uniforms
- `tauXiMetaFinal` (`sampler2D`): size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
- `tauModelMask` (`sampler2D`): size: [tauMax, tauMax] = [selected, cost, valid, scoreN]
- `tauFPProxy` (`sampler2D`): size: [tauMax, tauMax] = [selectedFP, cost, validFP, spanN]
- `tauModelScore` (`sampler2D`): size: [tauMax, tauMax] = [selected, score, valid, costRaw]
- `tauMax` (`int`):
- `tauMin` (`int`):
- `useMask` (`int`):
- `useFP` (`int`):
- `useScore` (`int`):

### Salidas
- `tauBest` (`vec4`): size: [1, 1] = [bestTau(1-based), bestSubseq, bestCost, found]

## 3. Funciones auxiliares y casos de uso
- Este shader no define funciones auxiliares fuera de `main()` o sólo usa intrínsecas de GLSL.

## 4. Desglose de `main()`
### 4.1. Inicialización del fragmento
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Validación de dominio y casos degenerados
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. Cálculo principal
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.4. Escritura de la salida
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
No se detecta un proceso matemático especializado más allá de operaciones elementales de dibujo, muestreo o selección lógica.

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
