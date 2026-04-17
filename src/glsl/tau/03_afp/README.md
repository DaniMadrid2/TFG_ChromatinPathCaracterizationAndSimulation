# 03_afp

## Propósito del bloque

La carpeta `03_afp` implementa la fase avanzada de ajuste del modelo estocástico unidimensional asociado a cada par \((\tau, \text{subseq})\). Su objetivo es transformar una semilla inicial de coeficientes, obtenida por mínimos cuadrados, en un modelo que sea simultáneamente:

- compatible con los momentos observados en los datos,
- consistente con una dinámica de Fokker-Planck a tiempo finito,
- compatible con una densidad estacionaria razonable,
- estable desde el punto de vista numérico.

El modelo que se ajusta describe dos funciones sobre la coordenada espacial \(x\):

\[
f(x) = \text{drift o deriva},
\]

\[
s(x) = \text{amplitud de ruido},
\]

y a partir de ellas se define la difusión efectiva

\[
a(x) = \frac{1}{2}s(x)^2.
\]

Por tanto, el bloque no ejecuta un ajuste polinómico simple, sino un problema de identificación paramétrica con restricciones físicas y una evaluación del coste basada en operadores discretos de Fokker-Planck.

---

## Esquema global del algoritmo

El flujo completo del bloque `03_afp` puede resumirse en el siguiente esquema:

1. **Entrada**: recepción de una semilla \(\theta_0\) procedente de LS.
2. **Refinamiento inicial**: corrección de la semilla mediante descenso por gradiente y regularización L1 (`1_tauAFP0.frag`).
3. **Inicialización de Nelder-Mead**: construcción de un simplex inicial en el espacio de coeficientes (`4_tauNMSimplexInit.frag`).
4. **Evaluación del coste físico**:
   - reconstrucción de \(f(x)\), \(s(x)\) y \(a(x)\),
   - construcción de \(D_x\), \(D_{xx}\), \(m_1\) y \(m_2\),
   - ensamblado del operador adjunto \(L\),
   - aproximación de la acción de \(e^{L\tau}\) mediante Krylov y Arnoldi,
   - resolución de una versión discreta de `SteadyFP`,
   - cálculo del coste total.
5. **Actualización del simplex**: reflexión, expansión, contracción o shrink (`5_tauNMStep.frag`).
6. **Finalización**: selección del mejor vértice (`6_tauNMFinalize.frag`).

En forma compacta, el algoritmo completo es

\[
\theta_0
\;\longrightarrow\;
\theta_{AFP0}
\;\longrightarrow\;
\text{simplex inicial}
\;\longrightarrow\;
\bigl(f,a,D_x,D_{xx},L,e^{L\tau},p_{stat},J\bigr)
\;\longrightarrow\;
\text{Nelder-Mead}
\;\longrightarrow\;
\theta^*.
\]

---

## Variables, espacios y significado matemático

Sea

\[
\theta = \bigl(\xi^{(f)}, \xi^{(s)}\bigr)
\]

el vector de coeficientes del modelo. Si \(\{\phi_i\}\) es la base funcional del drift y \(\{\psi_j\}\) la base funcional de la amplitud de ruido, el modelo paramétrico se escribe como

\[
f(x) = \sum_{i=0}^{N_f-1} \xi_i^{(f)}\,\phi_i(x),
\]

\[
s(x) = \sum_{j=0}^{N_s-1} \xi_j^{(s)}\,\psi_j(x),
\]

\[
a(x) = \frac{1}{2}s(x)^2.
\]

Esta elección es importante por dos razones:

1. reduce el problema continuo a un problema de dimensión finita en el espacio de coeficientes,
2. fuerza que la difusión efectiva quede ligada a \(s(x)\) de forma explícita.

El objetivo final del bloque es resolver

\[
\theta^* = \arg\min_{\theta} J(\theta),
\]

donde \(J(\theta)\) combina ajuste de momentos, compatibilidad estacionaria y regularización.

---

## Paso 1. Entrada al bloque y papel de LS

Cuando empieza `03_afp`, el pipeline ya ha calculado:

- una discretización espacial en `nBins`,
- momentos empíricos por bin y por modelo, almacenados en `tauMom1` y `tauMom2`,
- una semilla inicial de coeficientes obtenida por LS.

Dicha semilla aproxima de forma directa las estimaciones de Kramers-Moyal observadas,

\[
f_{KM}(x_b), \qquad a_{KM}(x_b),
\]

pero todavía no incorpora la propagación a tiempo finito ni la coherencia global de la densidad estacionaria. En consecuencia, LS es un punto de partida, no la solución final.

---

## Paso 2. Refinamiento inicial por gradiente: `1_tauAFP0.frag`

La primera mejora sobre la semilla LS se realiza mediante un descenso por gradiente con regularización. El funcional que se intenta reducir tiene la forma

\[
J_{AFP0}(\theta)
=
\sum_b
\Bigl[
 w_F(b)\bigl(f(x_b)-f_{KM}(x_b)\bigr)^2
+
 w_A(b)\bigl(a(x_b)-a_{KM}(x_b)\bigr)^2
\Bigr]
+
\lambda_{neg}P_{neg}(s)
+
\lambda_1\|\theta\|_1.
\]

Aquí:

- \(w_F\) y \(w_A\) ponderan la confianza por bin,
- \(P_{neg}(s)\) penaliza comportamientos no físicos, por ejemplo una amplitud de ruido no admisible,
- \(\lambda_1\|\theta\|_1\) favorece soluciones más compactas.

La finalidad de esta fase no es resolver todo el problema, sino producir una semilla intermedia \(\theta_{AFP0}\) mejor condicionada para la búsqueda posterior sin derivadas.

---

## Paso 3. Construcción del simplex: `4_tauNMSimplexInit.frag`

Una vez obtenida la semilla refinada, Nelder-Mead necesita un simplex inicial. Si la dimensión total del espacio de parámetros es

\[
d = N_f + N_s,
\]

entonces el simplex contiene \(d+1\) vértices.

Un vértice coincide con la semilla refinada y los restantes se generan perturbando cada componente del vector de parámetros. Este paso determina la región local de exploración de Nelder-Mead y condiciona tanto la convergencia como la robustez del método.

---

## Paso 4. Reconstrucción de campos físicos: `7_tauAdjointFields.frag`

Para cada vértice del simplex, el primer paso de la evaluación del coste consiste en reconstruir los campos discretos sobre la malla espacial:

\[
f_b = f(x_b),
\qquad
s_b = s(x_b),
\qquad
a_b = \frac{1}{2}s_b^2.
\]

Aquí, \(x_b\) representa el centro del bin \(b\). Este shader transforma una descripción en espacio de coeficientes en una descripción en espacio físico discretizado.

La implicación práctica es importante: a partir de este momento el algoritmo ya no trabaja solo con \(\theta\), sino con la dinámica efectiva que ese \(\theta\) induce sobre el espacio de estados.

---

## Paso 5. Operadores diferenciales y momentos geométricos: `8_tauAdjointDiffOps.frag`

El siguiente paso consiste en construir las aproximaciones por diferencias finitas de los operadores

\[
D_x \approx \partial_x,
\qquad
D_{xx} \approx \partial_{xx},
\]

y los momentos geométricos básicos

\[
m_1(i,j)=x_j-x_i,
\qquad
m_2(i,j)=(x_j-x_i)^2.
\]

Estas magnitudes son la base numérica del método adjunto. En el código Python de referencia, su análogo aparece en la construcción del operador y de los observables propagados. En WebGL, esta información se empaqueta en texturas para permitir un pipeline completamente GPU.

---

## Paso 6. Operador adjunto de Fokker-Planck: `9_tauAdjointOperator.frag`

Con \(f\), \(a\), \(D_x\) y \(D_{xx}\) ya disponibles, se construye la discretización del operador adjunto

\[
L = \operatorname{diag}(f)D_x + \operatorname{diag}(a)D_{xx}.
\]

Este operador es la pieza central del bloque, porque describe cómo se propagan observables bajo la dinámica asociada al modelo.

Su significado matemático es el siguiente: si la ecuación de Fokker-Planck directa describe la evolución de densidades, el operador adjunto describe la evolución de observables. Precisamente por eso resulta adecuado para aproximar momentos a tiempo finito.

---

## Paso 7. Aproximación de \(e^{L\tau}\) mediante Krylov y Arnoldi

### 7.1. Base inicial de observables: `12_tauKrylovInit.frag`

El algoritmo parte de tres observables elementales:

\[
g_0(x)=1,
\qquad
g_1(x)=x,
\qquad
g_2(x)=x^2.
\]

Estos observables son suficientes para reconstruir momentos de orden cero, uno y dos tras la propagación por el operador adjunto.

### 7.2. Cadena de Krylov: `13_tauKrylovStep.frag`

Aplicando repetidamente \(L\) sobre los observables anteriores se construye una cadena de Krylov

\[
K_0,
\quad K_1 = LK_0,
\quad K_2 = LK_1,
\quad K_3 = LK_2,
\quad \dots
\]

Esta cadena genera un subespacio reducido que captura la acción relevante del operador sobre los observables que importan para el coste.

### 7.3. Arnoldi y Hessenberg reducida: `14_tauArnoldiCoeff.frag`

A partir de la base de Krylov, el shader ejecuta una ortonormalización tipo Arnoldi con reortogonalización adaptativa por residuo. El objetivo es encontrar una base ortonormal \(Q\) y una matriz pequeña de Hessenberg \(H\) tales que

\[
LQ \approx QH.
\]

La reortogonalización adaptativa es importante porque evita la pérdida de ortogonalidad cuando el subespacio de Krylov se hace numéricamente degenerado. En la práctica, esto mejora la estabilidad del coste y evita errores espurios en Nelder-Mead.

### 7.4. Exponencial reducida: `10_tauAdjointExp.frag`

Una vez obtenida la Hessenberg reducida, el shader aproxima la acción de la exponencial sobre el subespacio reducido:

\[
e^{L\tau}g \approx Q\,e^{H\tau}e_1\,\|g\|.
\]

La exponencial de \(H\) se evalúa mediante Padé y scaling-and-squaring, lo cual es mucho más barato y estable que intentar construir la exponencial del operador completo para todos los modelos.

De esta forma se obtienen las cantidades propagadas

\[
E_1 \approx e^{L\tau}1,
\qquad
E_x \approx e^{L\tau}x,
\qquad
E_{x^2} \approx e^{L\tau}x^2.
\]

A partir de ellas se reconstruyen los momentos a tiempo finito:

\[
f_{\tau}(x_i) \approx \frac{E_x(i)-x_iE_1(i)}{\tau},
\]

\[
a_{\tau}(x_i) \approx \frac{E_{x^2}(i)-2x_iE_x(i)+x_i^2E_1(i)}{2\tau}.
\]

Este es el punto en el que el bloque se aproxima de forma más clara al algoritmo de referencia basado en Adjoint Fokker-Planck.

---

## Paso 8. Cálculo de la pdf estacionaria: `11_tauSteadyFP.frag`

Además de ajustar momentos, el algoritmo exige que el modelo sea compatible con una densidad estacionaria razonable. Para ello se resuelve una versión discreta del problema estacionario de Fokker-Planck imponiendo flujo nulo:

\[
J(x)=f(x)p(x)-\partial_x\bigl(a(x)p(x)\bigr)=0.
\]

En la implementación actual, esta ecuación se discretiza como un sistema lineal tridiagonal

\[
Ap=b,
\]

que se resuelve por batch con un algoritmo de Thomas. Después se normaliza la solución para imponer

\[
\sum_b p(x_b)\,\Delta x = 1.
\]

El shader incluye distintos modos de gauge y normalización para aproximarse mejor al comportamiento del solver de referencia, aun manteniendo una arquitectura eficiente en GPU.

---

## Paso 9. Función de coste total: `3_tauAdjointCost.frag`

Toda la información anterior se condensa en una función objetivo del tipo

\[
J(\theta)
=
\sum_b
\Bigl[
 w_F(b)\bigl(f_{\tau}(x_b)-f_{KM}(x_b)\bigr)^2
+
 w_A(b)\bigl(a_{\tau}(x_b)-a_{KM}(x_b)\bigr)^2
\Bigr]
+
\lambda_{KL}D_{KL}\bigl(p_{hist}\|p_{stat}\bigr)
+
\lambda_{reg}R(\theta)
+
\lambda_{phys}P_{phys}(\theta).
\]

Esta expresión tiene una interpretación clara:

- el primer bloque mide ajuste local a los momentos observados,
- el segundo mide compatibilidad global entre histograma y pdf estacionaria,
- el tercero controla complejidad o magnitud de los coeficientes,
- el cuarto penaliza soluciones no físicas o numéricamente inestables.

Por tanto, Nelder-Mead no optimiza solo una curva local, sino una combinación de consistencia dinámica, consistencia estacionaria y regularidad del modelo.

---

## Paso 10. Optimización geométrica: `5_tauNMStep.frag`

El simplex se actualiza con las operaciones clásicas de Nelder-Mead. Si \(x_h\) es el peor vértice y \(c\) el centroide del resto, se generan candidatos como

\[
x_r = c + \alpha(c-x_h),
\]

\[
x_e = c + \gamma(x_r-c),
\]

\[
x_c = c + \rho(x_h-c).
\]

Si ninguna alternativa mejora lo suficiente, el simplex se contrae globalmente. La ventaja de Nelder-Mead en este contexto es que evita el uso de derivadas de una función de coste muy compleja, compuesta por múltiples pasadas GPU y varios solvers numéricos intermedios.

---

## Paso 11. Selección final de la solución: `6_tauNMFinalize.frag`

Una vez agotado el presupuesto de iteraciones o alcanzada la convergencia, el shader de finalización escoge el mejor vértice del simplex:

\[
\theta^* = \arg\min_k J(\theta_k).
\]

Si el proceso no produce una solución válida, puede aplicarse un fallback hacia la solución intermedia procedente de `AFP0`. Esta estrategia evita que el resto del pipeline quede sin datos utilizables.

---

## Papel de cada fragment shader

### `1_tauAFP0.frag`
Refina la semilla LS mediante descenso por gradiente y regularización L1.

### `2_tauAFPOpt.frag`
Mantiene la interfaz histórica del ajuste avanzado y la organización conceptual del bloque.

### `3_tauAdjointCost.frag`
Evalúa el coste total usado por Nelder-Mead.

### `4_tauNMSimplexInit.frag`
Construye el simplex inicial a partir de la solución refinada.

### `5_tauNMStep.frag`
Aplica un paso geométrico de Nelder-Mead.

### `6_tauNMFinalize.frag`
Selecciona la mejor solución final.

### `7_tauAdjointFields.frag`
Reconstruye los campos \(f(x)\), \(s(x)\) y \(a(x)\).

### `8_tauAdjointDiffOps.frag`
Construye operadores diferenciales y momentos base.

### `9_tauAdjointOperator.frag`
Ensambla el operador adjunto discreto.

### `10_tauAdjointExp.frag`
Aproxima la acción de \(e^{L\tau}\) sobre el subespacio reducido.

### `11_tauSteadyFP.frag`
Resuelve la pdf estacionaria discreta por batch.

### `12_tauKrylovInit.frag`
Inicializa los observables de la base de Krylov.

### `13_tauKrylovStep.frag`
Aplica repetidamente el operador \(L\) para expandir el subespacio.

### `14_tauArnoldiCoeff.frag`
Ortonormaliza la base, construye la Hessenberg reducida y estabiliza el proceso mediante reortogonalización adaptativa.

---

## Conclusión conceptual

El algoritmo implementado en `03_afp` resuelve un problema de identificación avanzada de modelos estocásticos. No se limita a ajustar polinomios sobre datos observados, sino que intenta encontrar el conjunto de coeficientes que mejor explica, de forma simultánea:

1. los momentos observados a tiempo finito,
2. la propagación adjunta de observables,
3. la distribución estacionaria inducida por la dinámica,
4. las restricciones físicas y numéricas del problema.

Esa es la razón por la que este bloque constituye la parte más rica desde el punto de vista matemático y numéricamente más exigente de todo el pipeline Tau.

