# 2_tauFPStationary.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader compara, bin a bin, tres distribuciones:
- el histograma empírico observado `pHist`;
- la distribución estacionaria del modelo inicial `pInit`;
- la distribución estacionaria del modelo final `pFinal`.

Su función es visual: permite ver si el refinamiento AFP ha acercado o alejado la distribución modelada respecto a la observada.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauMom1`: histograma empírico por bin.
- `tauXiFOpt`, `tauXiSOpt`, `tauXiMetaOpt`: solución inicial refinada.
- `tauXiFFinal`, `tauXiSFinal`, `tauXiMetaFinal`: solución final.
- `tauBest`: mejor modelo seleccionado.

### Uniforms
- `tauMax`, `tauMin`, `nBins`
- `selectedTau`, `selectedSubseq`, `useSelected`

### Salida
- `tauFPStationary = [pHist, pInit, pFinal, valid]`

### Fragmentos de código relevantes
```glsl
float pHist = cntB / sumH;
computePAtBin(coeffsInit, bw, b, pInit, validInit);
computePAtBin(coeffsFinal, bw, b, pFinal, validFinal);
```

## 3. Funciones auxiliares
### `computePAtBin`
Es la función más importante del shader. Calcula la probabilidad estacionaria modelada en un bin dado.

Internamente hace dos pasadas:
1. una para construir `maxLog` y controlar estabilidad;
2. otra para normalizar la densidad y extraer el valor del bin pedido.

### `tauEvalF`, `tauEvalS`, `tauEvalA`
Reconstruyen `f`, `s` y `a` del modelo inicial y final.

## 4. Desglose detallado de `main()`
### 4.1. Selección del modelo a comparar
Igual que en otros shaders de fields, se usa `tauBest` salvo que el usuario fuerce un `(tau,subseq)` explícito.

### 4.2. Verificación de validez inicial/final
El shader exige que tanto el modelo inicial como el final sean válidos. Si una de las dos soluciones falla, la comparación deja de tener sentido.

### 4.3. Construcción del histograma empírico normalizado
Se suma la masa total del histograma:
```glsl
sumH += max(texelFetch(tauMom1, ivec2(i, modelIdx), 0).x, 0.0);
```
Luego se normaliza el bin actual:
\[
p_{Hist}(b)=\frac{count_b}{\sum_j count_j}
\]

### 4.4. Evaluación de la densidad estacionaria inicial y final
La función `computePAtBin` se llama dos veces: una con los coeficientes `Opt` y otra con los `Final`.

### 4.5. Construcción del flag de validez
```glsl
float valid = (validInit > 0.5 && validFinal > 0.5) ? 1.0 : 0.0;
```

Solo se considera comparación fiable si ambas curvas se han podido construir de manera estable.

## 5. Procesos matemáticos implicados
### 5.1. Histograma empírico normalizado
Nombre para buscar:
- `empirical distribution`
- `normalized histogram`

### 5.2. Distribución estacionaria de Fokker-Planck
Nombre para buscar:
- `Fokker-Planck stationary distribution`

\[
p(x) \propto \frac{1}{a(x)}\exp\left(-\int \frac{f(x)}{a(x)}dx\right)
\]

### 5.3. Integración trapezoidal
Se usa de nuevo una regla trapezoidal para reconstruir la integral acumulada de `f/a`.

## 6. Resumen operativo
Este shader no decide nada por sí mismo, pero es muy útil para entender si el refinamiento del modelo mejora realmente la forma de la distribución. Cuando el coste mejora pero la distribución empeora, aquí suele verse primero el problema.
