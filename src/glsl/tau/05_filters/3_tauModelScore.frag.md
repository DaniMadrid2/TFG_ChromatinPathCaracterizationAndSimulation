# 3_tauModelScore.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Desglose detallado de `main()`
4. Procesos matemáticos implicados
5. Resumen operativo

## 1. Objetivo del shader
Este shader condensa en una única cifra varias penalizaciones distintas. Su misión es producir un score escalar que permita ordenar modelos de forma más robusta que usando sólo el coste bruto.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauXiMetaFinal`: coste bruto y validez básica.
- `tauModelMask`: resultado del top-K por coste.
- `tauFPProxy`: validez del proxy estacionario y span.
- `tauModelKL`: divergencia KL y validez asociada.
- `tauStats`: valores globales para normalización del coste.

### Uniforms
- `wCost`, `wKL`, `wSpan`: pesos de mezcla.
- `klMax`: escala de normalización para KL.
- `scoreMax`: umbral máximo aceptable del score.
- `tauMax`, `tauMin`.

### Salida
- `tauModelScore = [selected, score, valid, costRaw]`

### Fragmento de código central
```glsl
float score = wCost * costN + wKL * klN + wSpan * spanN;
```

## 3. Desglose detallado de `main()`
### 3.1. Normalización del coste
A partir de `best` y `threshold` se construye:
```glsl
float costN = clamp((cost - best) / max(thr - best, 1e-6), 0.0, 3.0) / 3.0;
```

### 3.2. Normalización del KL
Se define:
```glsl
float klN = clamp(klv.x / max(klMax, 1e-6), 0.0, 3.0) / 3.0;
```

### 3.3. Incorporación del span FP
El término `spanN` ya llega normalizado desde `tauFPProxy`.

### 3.4. Mezcla ponderada
Se define
\[
score = w_{cost} costN + w_{KL} klN + w_{span} spanN
\]

### 3.5. Validez conjunta
El modelo sólo sigue adelante si pasa simultáneamente:
```glsl
valid *= (mk.x > 0.5) ? 1.0 : 0.0;
valid *= (fp.z > 0.5) ? 1.0 : 0.0;
valid *= (klv.y > 0.5) ? 1.0 : 0.0;
```

### 3.6. Selección final por umbral
```glsl
float selected = (valid > 0.5 && score <= scoreMax) ? 1.0 : 0.0;
```

## 4. Procesos matemáticos implicados
### 4.1. Normalización de magnitudes heterogéneas
El shader convierte coste, KL y span en cantidades comparables antes de sumarlas.

### 4.2. Combinación lineal ponderada
Nombre para buscar:
- `weighted sum model`
- `linear scalarization`

\[
score = w_{cost} costN + w_{KL} klN + w_{span} spanN
\]

### 4.3. Umbralización
Finalmente se aplica un corte escalar `score <= scoreMax`.

## 5. Resumen operativo
Este shader es el lugar donde el pipeline deja de razonar por filtros separados y pasa a razonar con una sola magnitud agregada. Si el orden de modelos parece raro, aquí es donde más sentido tiene mirar primero.
