# 1_tauFPProxy.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader construye un proxy estacionario de Fokker-Planck para cada modelo final y decide si la densidad que induce es numéricamente razonable. No compara todavía contra el histograma empírico; aquí sólo se comprueba si el modelo parece estable y normalizable.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauXiFFinal`, `tauXiSFinal`: coeficientes finales del modelo.
- `tauXiMetaFinal`: coste y validez del modelo.
- `tauModelMask`: máscara top-K previa.
- `tauMom1`: se usa para recuperar la escala `maxAbs` y fijar la malla física en `x`.

### Uniforms
- `tauMax`, `tauMin`, `nBins`
- `logSpanMax`: cota máxima permitida para el rango logarítmico de la densidad estacionaria.

### Salida
- `tauFPProxy = [selectedFP, cost, validFP, spanN]`

### Fragmentos de código relevantes
```glsl
float tauEvalA(float coeffs[TAU_MAX_TOTAL_TERMS], float x){ float s=tauEvalS(coeffs,x); return 0.5*s*s; }
```

```glsl
float logP = -integ - log(aVal);
```

## 3. Funciones auxiliares
### `tauUnpack`, `tauEvalF`, `tauEvalS`, `tauEvalA`
Reconstruyen `f(x)`, `s(x)` y
\[
a(x)=\tfrac12 s(x)^2.
\]

### `isFiniteVal`
Comprueba que una cantidad no haya desbordado numéricamente.

## 4. Desglose detallado de `main()`
### 4.1. Validación inicial del modelo
Sólo se estudian modelos ya aceptados por `tauModelMask`:
```glsl
float valid = (meta.y > 0.5 && meta.z >= float(max(TAU_F_TERMS, TAU_S_TERMS)) && mk.x > 0.5) ? 1.0 : 0.0;
```

### 4.2. Reconstrucción del modelo continuo
Se desempaquetan coeficientes y se define la malla física:
```glsl
float dx = max(maxAbs, 1e-6) / float(max(nBins, 1));
```

Esto es importante: el shader evalúa `f`, `s` y `a` en la misma malla física usada para el ajuste.

### 4.3. Construcción del logaritmo de la densidad estacionaria
Se define
\[
q(x)=\frac{f(x)}{a(x)}
\]

y luego se integra acumuladamente con regla trapezoidal:
```glsl
integ += 0.5 * (prevQ + q) * dx;
float logP = -integ - log(aVal);
```

### 4.4. Medida del span logarítmico
Se guarda el rango
\[
span = \max(\log p) - \min(\log p)
\]
Si ese rango es demasiado grande, la densidad se considera sospechosa.

### 4.5. Validez final del proxy
Se acepta el modelo sólo si:
- no aparecen cantidades no finitas;
- `a(x)` no se vuelve casi cero de forma peligrosa;
- `span <= logSpanMax`.

## 5. Procesos matemáticos implicados
### 5.1. Densidad estacionaria de Fokker-Planck
Nombre para buscar:
- `Fokker-Planck equation`
- `stationary distribution of a diffusion process`

\[
p(x) \propto \frac{1}{a(x)}\exp\left(-\int \frac{f(x)}{a(x)}dx\right)
\]

### 5.2. Regla trapezoidal
Nombre para buscar:
- `Trapezoidal rule`

\[
\int q(x)dx \approx \sum_k \frac{q_k+q_{k-1}}{2}\,\Delta x
\]

### 5.3. Control de estabilidad numérica
Aquí se usa un criterio práctico: si la densidad logarítmica varía demasiado, el modelo se rechaza por poco fiable.

## 6. Resumen operativo
Este shader impide que modelos aparentemente buenos en coste entren en competición si inducen una densidad estacionaria mal condicionada. Es una criba de estabilidad, no una comparación directa con el histograma real.
