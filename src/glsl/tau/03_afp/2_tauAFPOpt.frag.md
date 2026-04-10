# 2_tauAFPOpt.frag

## Índice
1. Objetivo del shader
2. Entradas, uniforms y salidas
3. Estructura del simplex
4. Desglose de `main()`
5. Qué está minimizando
6. Resumen operativo

## 1. Objetivo del shader
Este shader aplica una fase de refinamiento por Nelder-Mead sobre cada modelo `(tau, subseq)`.
Toma la semilla producida por `AFP0`, construye un simplex local y busca el vector de coeficientes
que minimiza el coste AFP sobre los momentos `tauMom1` y `tauMom2`.

No hace descenso por gradiente. No usa `softThreshold`. No aplica L1.
La idea es explorar el espacio de coeficientes con una estrategia de simplex, igual que en
`trajectory_analysis.py` se usa `scipy.optimize.minimize(..., method='nelder-mead')`.

## 2. Entradas, uniforms y salidas
### Texturas de entrada
- `tauMom1`: contiene `maxAbs` y metadatos por modelo.
- `tauMom2`: contiene `fKM`, `aKM`, `fErr`, `aErr` por bin y modelo.
- `tauXiFOpt`, `tauXiSOpt`: semilla de coeficientes de AFP0.
- `tauXiMetaOpt`: validez y número de observaciones útiles del modelo inicial.

### Uniforms
- `tauMax`, `tauMin`, `nBins`
- `l2F`, `l2S`
- `nelderShift`, `nelderAlpha`, `nelderGamma`, `nelderRho`, `nelderSigma`
- `nelderIters`
- `nelderStopEps`
- `adjointTauScale`
- `useAdjointAFP`

### Salidas
- `tauXiFFinal`
- `tauXiSFinal`
- `tauXiMetaFinal = [cost, valid, nUsed, reserved]`

## 3. Estructura del simplex
El simplex se guarda en un array plano:

```glsl
const int NM_VERTS = TAU_TOTAL_TERMS + 1;
const int NM_VIEW_SIZE = NM_VERTS * TAU_MAX_TOTAL_TERMS;
```

Cada vértice ocupa un bloque contiguo de `TAU_MAX_TOTAL_TERMS` celdas.
Las funciones `readVertex`, `writeVertex`, `swapVertices`, `sortSimplex` y `shrinkSimplex`
trabajan sobre ese buffer plano para evitar arrays de arrays, que GLSL ES 3.00 no soporta.

## 4. Desglose de `main()`
### 4.1. Validación del modelo / reentrada
El fragmento identifica el modelo actual con `(tau, subseq)` y comprueba que:
- esté dentro del rango válido,
- tenga una semilla AFP0 válida,
- tenga suficiente soporte de datos.

Si falla, escribe una salida inválida con coste muy alto.

Además, `tauXiMetaOpt.w` se usa como flag de convergencia entre pasadas ping-pong:
- si ya vale `> 0.5`, el fragmento no vuelve a ejecutar Nelder-Mead,
- simplemente copia `tauXiFOpt`, `tauXiSOpt` y `tauXiMetaOpt` a la salida,
- así los modelos ya convergidos no siguen consumiendo trabajo GPU en los bloques siguientes.

### 4.2. Construcción inicial del simplex
Se parte de la semilla AFP0:
- vértice 0 = coeficientes base,
- los demás vértices = la misma semilla con un pequeño desplazamiento en una coordenada distinta.

Ese desplazamiento viene de `nelderShift`.

### 4.3. Evaluación inicial
Cada vértice se evalúa con `tauObjective`.
Ahora hay dos variantes internas:
- `tauObjectiveDirect`: compara directamente `f(x)` y `a(x)` con `fKM` y `aKM`,
- `tauObjectiveAdjFP`: aplica una versión truncada del operador adjoint Fokker-Planck para obtener `f_tau` y `a_tau`.

La ruta activa se elige con `useAdjointAFP`.

### 4.4. Iteración Nelder-Mead
En cada iteración:
1. Se ordenan los vértices por coste.
2. Se calcula el punto medio de todos menos el peor.
3. Se refleja el peor vértice.
4. Si mejora mucho, se intenta expansión.
5. Si mejora poco, se acepta la reflexión o se prueba contracción.
6. Si no mejora, se hace shrink hacia el mejor vértice.

El número de iteraciones se limita con `nelderIters`.
La convergencia interna se resume en `tauXiMetaFinal.w`, donde el shader marca si
`max(simplexSpan, costSpan)` ya cayó por debajo de `nelderStopEps`.
Ese flag es justo el que el siguiente bloque ping-pong reutiliza como entrada para
saltar directamente los fragmentos ya terminados.

### 4.5. Selección final
Al final se reordena el simplex y se conserva el mejor vértice:
- sus coeficientes se empaquetan en `tauXiFFinal` y `tauXiSFinal`,
- `tauXiMetaFinal.x` guarda el coste final,
- `tauXiMetaFinal.y` marca si el modelo es válido.

## 5. Qué está minimizando
La función objetivo directa es, de forma simplificada:

\[
J(\theta)=\frac{1}{N}\sum_b \left(
w_F(f_{KM}-f_{fit})^2 + w_A(y_S-s_{fit})^2
\right) + \lambda_F\|\theta_F\|^2 + \lambda_S\|\theta_S\|^2
\]

Donde:
- `fKM` es la deriva estimada por momentos,
- `aKM` es la difusión estimada por momentos,
- `yS = sqrt(2 * aKM)`,
- `f_fit` y `s_fit` salen de los coeficientes del simplex.

Si `s_fit` intenta cruzar a valores negativos, el coste se penaliza, pero ya no se
descarta todo el modelo de forma binaria. Eso hace la búsqueda mucho más estable.

Si `useAdjointAFP = 1`, el shader usa una aproximación de segundo orden del semigrupo adjoint:

\[
\mathcal{L}^\dagger g = f(x)\,\partial_x g + a(x)\,\partial_{xx} g
\]

y corrige los observables a tiempo finito con:

\[
f_\tau \approx f + \frac{\tau}{2}\left(f\,f_x + a\,f_{xx}\right)
\]

\[
a_\tau \approx a + \frac{\tau}{2}\left(f\,a_x + a\,a_{xx}\right)
\]

donde `tau = tauIndex * adjointTauScale`.

Con eso, el coste pasa a comparar:

\[
J_{AdjFP}(\theta)=\frac{1}{N}\sum_b \left(
w_F(f_{KM}-f_{\tau})^2 + w_A(a_{KM}-a_{\tau})^2
\right) + \lambda_F\|\theta_F\|^2 + \lambda_S\|\theta_S\|^2
\]

## 6. Resumen operativo
Esta fase ya no es un refinamiento por gradiente.
Es una búsqueda local por simplex, con semilla AFP0 y un coste tipo Python/Nelder-Mead.

En el pipeline completo, `parseTextC23` la ejecuta en bloques de `nelderChunkIters`
iteraciones internas. Tras cada bloque, la CPU lee la attachment de metadatos una sola vez
para comprobar si todos los modelos válidos ya marcaron `tauXiMetaFinal.w = 1`.
Mientras tanto, dentro del propio shader, cada fragmento que ya venga marcado como terminado
sale al principio y no recalcula nada.

Si el resultado sale raro, los controles más importantes son:
- `nelderShift`
- `nelderIters`
- `nelderStopEps`
- `nelderAlpha`
- `nelderGamma`
- `nelderRho`
- `nelderSigma`
- `l2F` y `l2S`
