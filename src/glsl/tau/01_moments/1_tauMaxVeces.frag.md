# 1_tauMaxVeces.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Compute per-(tau,subseq,bin) Kramers-Moyal moments from deltaX samples.

## 2. Parámetros, variables y texturas
### Uniforms
- `datosX1` (`sampler2D`): size: [nSamples, 1] sampled as a 1D signal
- `nSamples` (`int`): lenX1
- `tauMax` (`int`): max tau to consider (ej.: 100)
- `tauMin` (`int`): min tau to consider (ej.: 1)
- `nBins` (`int`):
- `dtSample` (`float`):
- `tauEStar` (`float`):

### Salidas
- `tauMom1` (`vec4`): size: [nBins, tauMax*tauMax] = [count, sumD, sumD2, maxAbs]
- `tauMom2` (`vec4`): size: [nBins, tauMax*tauMax] = [fKM, aKM, f_err, a_err]

## 3. Funciones auxiliares y casos de uso
### `sampleX`
Se invoca 4 vez/veces desde `main()`.

## 4. Desglose de `main()`
### 4.1. 1 porque tau empieza en 1
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Calcula tau y subseq a partir de modelIdx (1 a tauMax^2)
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. Nº de saltos, es decir longitud de la subsecuencia
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.4. Calculamos la diferencia máxima
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.5. SafeMax=maxAbs||1e-9, bw=binWidth, lo=binLowerBound, hi=binUpperBound
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.6. Estos datos se usarán para calcular los momentos de Kramers-Moyal en el shader de SINDY fitting.
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Kramers-Moyal moments** (Momentos de Kramers-Moyal): Estimación de coeficientes de una expansión de Kramers-Moyal a partir de incrementos discretos.

### Fórmulas importantes
- \[\\Delta X = X_{t+\\tau}-X_t\]
- \[f_{KM} \\approx \\langle \\Delta X \\rangle / \\Delta t\]
- \[a_{KM} \\approx \\langle (\\Delta X)^2 \\rangle / \\Delta t\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
