# 2_tauAFPOpt.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader es una segunda fase de refinamiento. Toma la solución `AFP0` y vuelve a optimizarla, pero ahora con una penalización L2 adicional. La intención es mantener la esparsidad inducida por L1 sin perder estabilidad numérica.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauMom1`, `tauMom2`
- `tauXiFOpt`, `tauXiSOpt`, `tauXiMetaOpt`

### Uniforms
- `lrF`, `lrS`
- `l1F`, `l1S`
- `l2F`, `l2S`
- `nIter`
- `tauMax`, `tauMin`, `nBins`

### Salidas
- `tauXiFFinal`, `tauXiSFinal`
- `tauXiMetaFinal = [cost, valid, nUsed, reserved]`

### Fragmentos de código relevantes
```glsl
uniform float l2F;
uniform float l2S;
```

```glsl
grad[i] = grad[i] / max(nUsed, 1.0) + 2.0 * l2 * coeffs[i];
coeffs[i] -= lr * grad[i];
coeffs[i] = softThreshold(coeffs[i], l1 * lr);
```

## 3. Funciones auxiliares
### `tauObjective`
Es la función clave de esta fase. A diferencia de `tauModelCost`, incorpora regularización L2:
```glsl
l2 += lam * coeffs[i] * coeffs[i];
return cost / max(nUsed, 1.0) + l2;
```

### `softThreshold`
Se conserva igual que en AFP0. Por eso esta fase mezcla realmente L1 y L2.

## 4. Desglose detallado de `main()`
### 4.1. Lectura y validación de la semilla AFP0
Se leen los coeficientes optimizados de la primera fase. Si esa semilla no es válida, el shader no intenta rescatarla.

### 4.2. Construcción del gradiente del ajuste
Igual que en AFP0, se acumulan derivadas del error de drift y difusión respecto a cada coeficiente.

### 4.3. Incorporación del término L2
Aquí aparece la diferencia clave:
```glsl
grad[i] = grad[i] / max(nUsed, 1.0) + 2.0 * l2 * coeffs[i];
```
Ese término adicional reduce la tendencia a coeficientes excesivos.

### 4.4. Actualización con regularización mixta
Después del término L2 se aplica:
1. paso de gradiente;
2. shrinkage L1.

### 4.5. Selección final entre semilla y refinado
Se evalúa la función objetivo con y sin refinar:
```glsl
float jA = tauObjective(coeffs, modelIdx, bw, nA);
float jB = tauObjective(coeffs0, modelIdx, bw, nB);
```
Y se conserva la solución con menor objetivo.

## 5. Procesos matemáticos implicados
### 5.1. Descenso por gradiente
Nombre para buscar:
- `Gradient descent`

### 5.2. Regularización L2
Nombre para buscar:
- `Ridge regression`
- `Tikhonov regularization`
- `L2 regularization`

\[
J(\theta)=J_{fit}(\theta)+\sum_i \lambda_i\theta_i^2
\]

### 5.3. Combinación L1 + L2
Nombre para buscar:
- `Elastic net`

Aunque no se nombre así en el shader, el comportamiento es análogo.

## 6. Resumen operativo
Esta fase intenta estabilizar la solución obtenida por AFP0. Si AFP0 parece razonable pero AFPOpt la empeora o la aplana demasiado, los parámetros `l2F`, `l2S`, `lrF`, `lrS` y `nIter` son los primeros que conviene revisar.
