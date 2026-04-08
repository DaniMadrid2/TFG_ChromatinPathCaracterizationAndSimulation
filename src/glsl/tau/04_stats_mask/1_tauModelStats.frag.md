# 1_tauModelStats.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Scan all model costs and compute top-K statistics (best, threshold, maxValid).

## 2. Parámetros, variables y texturas
### Uniforms
- `tauXiMetaFinal` (`sampler2D`): size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
- `tauMax` (`int`):
- `tauMin` (`int`):

### Salidas
- `tauStats` (`vec4`): size: [1, 1] = [bestCost, threshold, maxValid, targetK]

## 3. Funciones auxiliares y casos de uso
- Este shader no define funciones auxiliares fuera de `main()` o sólo usa intrínsecas de GLSL.

## 4. Desglose de `main()`
### 4.1. S es el índice de subsecuencia, que no puede ser mayor que tau
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Si el costo de este modelo es menor que el peor costo en nuestro top-K, lo insertamos en la lista de top-K y la ordenamos.
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Top-K selection** (Selección top-K): Retención de los mejores candidatos según ranking de una métrica escalar.

### Fórmulas importantes
- \[K=\\lceil n \\cdot p/100 \\rceil\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
