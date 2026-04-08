# 1_tauAFP0.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader toma la solución obtenida por mínimos cuadrados y la refina mediante un proceso iterativo. Su papel es doble:
- reducir el coste del ajuste;
- favorecer soluciones más parsimoniosas usando penalización L1.

En otras palabras: es una fase de optimización de coeficientes posterior al ajuste cerrado de LS.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauMom1`: estadística geométrica y de escala por bin.
- `tauMom2`: observables empíricos `fKM`, `aKM` y sus errores.
- `tauXiF`, `tauXiS`: coeficientes iniciales procedentes de LS.
- `tauXiMeta`: metadatos de esa solución inicial.

### Uniforms
- `tauMax`, `tauMin`, `nBins`: geometría de la rejilla de modelos.
- `lrF`, `lrS`: learning rates para drift y difusión.
- `l1F`, `l1S`: intensidad de la penalización L1.
- `nIter`: número máximo de iteraciones.

### Salidas
- `tauXiFOpt`, `tauXiSOpt`: coeficientes refinados.
- `tauXiMetaOpt = [cost, valid, nUsed, reserved]`.

### Fragmentos de código relevantes
```glsl
uniform float lrF;
uniform float lrS;
uniform float l1F;
uniform float l1S;
uniform int nIter;
```

```glsl
coeffs[i] -= lr * (grad[i] / max(nUsed, 1.0));
coeffs[i] = softThreshold(coeffs[i], l1 * lr);
```

## 3. Funciones auxiliares
### `tauUnpack` y `tauPack`
Traducen entre la representación empaquetada en dos `vec4` y el vector interno de coeficientes.

### `tauModelCost`
Evalúa el coste medio del modelo sobre todos los bins válidos.

```glsl
cost += wF * (fKM - fFit) * (fKM - fFit)
     + wA * (yS - sFit) * (yS - sFit);
```

Se usa para comparar la solución refinada con la solución inicial.

### `softThreshold`
Implementa el operador proximal de la norma L1:
```glsl
float softThreshold(float v, float t){
    float a = abs(v) - t;
    if (a <= 0.0) return 0.0;
    return sign(v) * a;
}
```

## 4. Desglose detallado de `main()`
### 4.1. Validación del fragmento y del modelo semilla
Se descartan posiciones fuera del triángulo `(tau, subseq)` y también semillas LS no válidas:
```glsl
if (meta0.y < 0.5 || meta0.z < float(max(TAU_F_TERMS, TAU_S_TERMS))){
    tauZeroOutputs(meta0.z);
    return;
}
```

### 4.2. Reconstrucción de la semilla inicial
Los coeficientes se cargan en dos vectores:
- `coeffs0`: copia inmutable de la semilla;
- `coeffs`: copia mutable que se va refinando.

### 4.3. Bucle principal de optimización
En cada iteración se hace:
1. inicializar gradiente a cero;
2. recorrer bins válidos;
3. calcular `fFit` y `sFit`;
4. acumular derivadas;
5. aplicar el paso de gradiente y el shrinkage L1.

```glsl
for (int it=0; it<16; it++){
    if (it >= nIter) break;
    ...
}
```

### 4.4. Construcción del gradiente
Para drift aparece, por ejemplo:
```glsl
grad[i] += (2.0 * wF * (fFit - fKM)) * tauFBasis(i, x);
```

y para difusión:
```glsl
grad[i] += (4.0 * wA * (sFit - yS)) * tauSBasis(sIdx, x);
```

### 4.5. Paso de descenso y esparsidad
Tras acumular el gradiente:
```glsl
coeffs[i] -= lr * (grad[i] / max(nUsed, 1.0));
coeffs[i] = softThreshold(coeffs[i], l1 * lr);
```

Primero se desciende; después se contraen los coeficientes pequeños.

### 4.6. Comparación entre solución inicial y refinada
El shader compara ambas:
```glsl
float cA = tauModelCost(coeffs, modelIdx, bw, nA);
float cB = tauModelCost(coeffs0, modelIdx, bw, nB);
bool keepInit = cB < cA;
```

Si iterar empeora, se recupera la semilla original.

## 5. Procesos matemáticos implicados
### 5.1. Descenso por gradiente
Nombre para buscar:
- `Gradient descent`

\[
\theta_{k+1} = \theta_k - \eta \nabla J(\theta_k)
\]

### 5.2. Regularización L1
Nombre para buscar:
- `L1 regularization`
- `Lasso`
- `soft thresholding`

\[
S_t(v) = \operatorname{sign}(v)\max(|v|-t,0)
\]

### 5.3. Coste cuadrático ponderado
\[
J(\theta)=\frac{1}{nUsed}\sum_b w_F(f_{KM}-f_{fit})^2 + w_A(y_S-s_{fit})^2
\]

## 6. Resumen operativo
`1_tauAFP0.frag` es la primera fase claramente iterativa del pipeline. Si los coeficientes finales salen demasiado grandes o extraños, este shader es uno de los primeros sitios que conviene inspeccionar.
