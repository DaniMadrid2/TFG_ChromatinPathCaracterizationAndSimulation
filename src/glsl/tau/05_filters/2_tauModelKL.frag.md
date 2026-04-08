# 2_tauModelKL.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader compara el histograma empírico de la cromatina con la distribución estacionaria que induce el modelo. La comparación se hace con la divergencia de Kullback-Leibler, que aquí funciona como penalización de forma global de la distribución.

A diferencia del coste del ajuste, que mira observables locales por bin, el KL mira si la distribución completa del modelo se parece a la distribución observada.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauMom1`: contiene `count`, `sumD`, `sumD2` y `maxAbs` por bin.
- `tauXiFFinal`, `tauXiSFinal`: coeficientes del modelo final.
- `tauXiMetaFinal`: metadatos del modelo.

### Uniforms
- `tauMax`, `tauMin`, `nBins`
- `spanMax`: cota máxima para el rango logarítmico aceptado en la densidad estacionaria modelada.

### Salida
- `tauModelKL = [kl, valid, spanN, sumH]`

### Fragmentos de código relevantes
```glsl
float logp = -integ - log(ai);
```

```glsl
if(pH > 1e-12) kl += pH * log(pH / max(pS, 1e-12));
```

## 3. Funciones auxiliares
### `tauUnpack`
Reconstruye el vector de coeficientes desde dos texeles RGBA.

### `tauEvalF`, `tauEvalS`, `tauEvalA`
Permiten evaluar drift y difusión efectiva en cada punto de la malla.

### `isFiniteVal`
Controla si una cantidad sigue en rango numérico razonable, evitando NaN o Inf.

## 4. Desglose detallado de `main()`
### 4.1. Validación del modelo y de la rejilla
Antes de cualquier cálculo, el shader exige:
- `(tau, subseq)` dentro del triángulo válido;
- modelo marcado como válido;
- suficientes muestras efectivas.

### 4.2. Construcción del histograma empírico normalizado
Se suma la masa total:
```glsl
sumH += max(texelFetch(tauMom1, ivec2(i, modelIdx), 0).x, 0.0);
```
y luego se define
\[
p_H(b)=\frac{count_b}{sumH}
\]

### 4.3. Reconstrucción de la densidad estacionaria del modelo
Se calcula `log p(x)` usando integración trapezoidal y un corrimiento por `maxLog` para evitar underflow:
```glsl
float logp = -integ - log(ai);
maxLog = max(maxLog, logp);
minLog = min(minLog, logp);
```

### 4.4. Normalización estable de la pdf modelada
En lugar de exponentiar directamente, se usa:
```glsl
denom += exp(logp - maxLog);
```
Eso actúa como estabilización numérica de tipo `log-sum-exp`.

### 4.5. Cálculo de la divergencia KL
Con `pH` el histograma normalizado y `pS` la pdf modelada:
```glsl
if(pH > 1e-12) kl += pH * log(pH / max(pS, 1e-12));
```

### 4.6. Criterio de validez
El modelo se invalida si:
- aparecen NaN o Inf;
- `kl` es negativo o no finito;
- el span logarítmico supera `spanMax`.

## 5. Procesos matemáticos implicados
### 5.1. Densidad estacionaria de Fokker-Planck
Nombre para buscar:
- `Fokker-Planck equation`
- `stationary distribution of diffusion`

\[
p(x) \propto \frac{1}{a(x)}\exp\left(-\int \frac{f(x)}{a(x)}dx\right)
\]

### 5.2. Divergencia de Kullback-Leibler
Nombre para buscar:
- `Kullback-Leibler divergence`

\[
KL(P\|Q)=\sum_i P_i\log\frac{P_i}{Q_i}
\]

Aquí `P = p_H` y `Q = p_S`.

### 5.3. Regla trapezoidal
Nombre para buscar:
- `Trapezoidal rule`

Se usa para aproximar la integral acumulada de `f/a`.

## 6. Resumen operativo
Este shader es de los más importantes del pipeline porque controla la forma global de la distribución. Un modelo puede ajustar bien momentos locales y, sin embargo, inducir una pdf estacionaria mala; este shader existe precisamente para penalizar ese caso.
