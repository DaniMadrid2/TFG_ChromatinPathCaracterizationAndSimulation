# 1_tauXiLS.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Weighted least-squares fit per model with configurable polynomial libraries for drift f(x) and noise amplitude s(x).

## 2. Parámetros, variables y texturas
### Uniforms
- `tauMom1` (`sampler2D`): size: [nBins, tauMax*tauMax] = [count,sumD,sumD2,maxAbs]
- `tauMom2` (`sampler2D`): size: [nBins, tauMax*tauMax] = [fKM,aKM,fErr,aErr]
- `tauMax` (`int`):
- `tauMin` (`int`):
- `nBins` (`int`):

### Salidas
- `tauXiF` (`vec4`): packed coeffs[0..3]
- `tauXiS` (`vec4`): packed coeffs[4..7]
- `tauXiMeta` (`vec4`): [cost, valid(0/1), nUsed, reserved]

## 3. Funciones auxiliares y casos de uso
### `tauFBasis`
Se invoca 1 vez/veces desde `main()`.

### `tauSBasis`
Se invoca 1 vez/veces desde `main()`.

### `tauEvalF`
Se invoca 1 vez/veces desde `main()`.

### `tauEvalS`
Se invoca 1 vez/veces desde `main()`.

### `tauSObsErr`
Se invoca 2 vez/veces desde `main()`.

### `tauZeroOutputs`
Se invoca 3 vez/veces desde `main()`.

### `tauSolveLinearSystem`
Se invoca 2 vez/veces desde `main()`.

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
### Procesos identificados
- **Weighted least squares** (Mínimos cuadrados ponderados): Ajuste lineal con pesos inversamente proporcionales a la varianza.
- **Gaussian elimination with partial pivoting** (Eliminación gaussiana con pivoteo parcial): Resolución estable de sistemas lineales pequeños.

### Fórmulas importantes
- \[\\min_\\theta \\sum_i w_i (y_i-\\phi_i^T\\theta)^2\]
- \[(A^TWA)\\theta = A^TWy\]
- \[Ax=b\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
