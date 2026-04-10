
AFP - Adaptive Fitting Procedure

-Python:
 Xi -> f(x),a(x) -> AdjFP -> f_tau(x), a_tau(x) -> coste + KL
-GLSL:
 Xi -> f(x),s(x) -> comparación directa con f_KM, a_KM -> Filtros y KL a parte

Qué hacemos en cada carpeta de /tau

- 01_moments — src/parseTextC23.shaderdsl.ts:189

* Calcula los datos base por modelo (tau, subseq).
* Saca tauMom1 y tauMom2.
* Aquí nace todo lo que luego intentamos ajustar: conteos, fKM, aKM, errores, escalas.
* Archivo principal: src/glsl/tau/01_moments/1_tauMaxVeces.frag:1.
- 02_ls — src/parseTextC23.shaderdsl.ts:213

* Hace la semilla inicial por mínimos cuadrados.
* Produce tauXiF, tauXiS, tauXiMeta.
* Es el “primer intento bruto” de coeficientes.
* Archivo: src/glsl/tau/02_ls/1_tauXiLS.frag:1.
- 03_afp

s es la raiz cuadrada de la varianza del ruido porque en el modelo 
de Langevin, el término de ruido se modela como sqrt(2 s(x)) * dW, donde dW es un proceso de Wiener estándar.

- 1_tauAFP0.frag — src/parseTextC23.shaderdsl.ts:234
* Toma la solución LS y la refina con descenso por gradiente + softThreshold.
* Usa coste directo tauModelCost(...) en src/glsl/tau/03_afp/1_tauAFP0.frag:91.
* Tiene regularización L1 durante la actualización, no dentro del coste.
* Salida: tauXiFOpt, tauXiSOpt, tauXiMetaOpt en src/glsl/tau/03_afp/1_tauAFP0.frag:267.
- 2_tauAFPOpt.frag — src/parseTextC23.shaderdsl.ts:263
* Toma la salida de AFP0 y la refina con Nelder-Mead.
* Usa tauObjective(...) en src/glsl/tau/03_afp/2_tauAFPOpt.frag:82.
* Tiene regularización L2 dentro del coste.
* Además ahora usa ping-pong y flag w para reentrada/skip en src/glsl/tau/03_afp/2_tauAFPOpt.frag:201.
* Salida final: tauXiFFinal, tauXiSFinal, tauXiMetaFinal en src/glsl/tau/03_afp/2_tauAFPOpt.frag:317.
- 04_stats_mask

* tauStats resume la distribución de costes y decide umbrales globales.
* tauMask marca qué modelos pasan el primer corte.
* Es una preselección estadística sobre la rejilla.
* Fases en src/parseTextC23.shaderdsl.ts:340 y src/parseTextC23.shaderdsl.ts:359.
- 05_filters

* tauFPProxy — src/parseTextC23.shaderdsl.ts:378
* Hace un chequeo proxy de comportamiento tipo FP/estacionario.
* tauModelKL — src/parseTextC23.shaderdsl.ts:402
* Calcula KL entre histograma y pdf/modelo proxy.
* KL en shader: src/glsl/tau/05_filters/2_tauModelKL.frag:130.
* tauModelScore — src/parseTextC23.shaderdsl.ts:425
* Mezcla coste, KL y span en una puntuación final.
* Esta carpeta no optimiza coeficientes: filtra modelos.
- 06_select — src/parseTextC23.shaderdsl.ts:453

* Elige el mejor modelo final (tau, subseq).
* Salida: tauBest.
* Archivo: src/glsl/tau/06_select/1_tauBestModel.frag:1.
- 07_fields

* tauSindyFields — src/parseTextC23.shaderdsl.ts:478 y src/parseTextC23.shaderdsl.ts:528
* Evalúa las curvas del modelo elegido sobre bins: [x,f,s,a].
* Lo hace para la solución inicial y la final.
* tauFPStationary — src/parseTextC23.shaderdsl.ts:549
* Construye la pdf estacionaria/comparativa que luego dibujas abajo.
* Aquí ya no se optimiza: se proyecta el modelo a curvas y pdf.
- 08_draw

* Solo dibuja.
* Lee tauBest, tauSindy, tauKL, tauScore, tauFPStationary, etc.
* No decide ni ajusta: visualiza el resultado.
* Programa declarado en src/parseTextC23.shaderdsl.ts:149, uso en src/parseTextC23.shaderdsl.ts:676.
* Shader: src/glsl/tau/08_draw/1_drawTauMaxVeces.frag:1.
* Qué calcula el coste hoy en cada optimización

- AFP0: tauModelCost(...) en src/glsl/tau/03_afp/1_tauAFP0.frag:91

*  compara fFit con fKM
*  compara sFit con sqrt(2*aKM)
*  pesa con errores
*  penaliza s negativa
*  luego la sparsity L1 entra en la actualización con softThreshold(...) en src/glsl/tau/03_afp/1_tauAFP0.frag:79
-   AFPOpt: tauObjective(...) en src/glsl/tau/03_afp/2_tauAFPOpt.frag:82

*  misma comparación base con KM
*  misma penalización por s negativa
*  añade L2 explícita sobre coeficientes
*  Nelder-Mead busca minimizar ese coste
*  La frase más honesta para describir el sistema ahora

Sí hacemos una tubería de ajuste y selección bastante rica.
Pero todavía no hacemos el AFP adjoint auténtico del Python.
Lo que hacemos es:
- momentos,
- semilla LS,
- refinado por gradiente,
- refinado por Nelder-Mead,
- filtros de validez/KL/score,
- selección y dibujo.
