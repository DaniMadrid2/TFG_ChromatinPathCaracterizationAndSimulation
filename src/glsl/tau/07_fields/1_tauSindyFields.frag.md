# 1_tauSindyFields.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader reconstruye sobre una malla 1D los campos del modelo seleccionado. Su salida no es una estadística resumida, sino una representación funcional explícita:
- posición física `x`;
- drift `f(x)`;
- amplitud `s(x)`;
- difusión efectiva `a(x)`.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `tauXiF`, `tauXiS`: coeficientes del modelo.
- `tauBest`: mejor modelo automático.
- `tauMom1`: se usa para recuperar `maxAbs` y construir la malla física.

### Uniforms
- `tauMax`, `nBins`
- `selectedTau`, `selectedSubseq`, `useSelected`

### Salida
- `tauSindy = [x, f_sindy, s_sindy, a_sindy]`

### Fragmentos de código relevantes
```glsl
float x = (float(b) + 0.5) * bw;
float fSindy = tauEvalF(coeffs, x);
float sSindy = tauEvalS(coeffs, x);
float aSindy = 0.5 * sSindy * sSindy;
```

## 3. Funciones auxiliares
### `tauUnpack`
Reconstruye el vector de coeficientes a partir de dos RGBA.

### `tauEvalF` y `tauEvalS`
Evalúan la expansión en funciones base de drift y amplitud de ruido.

## 4. Desglose detallado de `main()`
### 4.1. Selección del modelo activo
Por defecto se toma el modelo de `tauBest`, pero el shader puede ser forzado:
```glsl
if(useSelected > 0){ tau = max(1, selectedTau); subseq = max(0, selectedSubseq); }
```

### 4.2. Reconstrucción de la malla física
No se usa una coordenada normalizada arbitraria. Se usa la misma escala que apareció en el ajuste:
```glsl
float bw = max(maxAbs, 1e-6) / float(nBins);
float x = (float(b) + 0.5) * bw;
```

### 4.3. Evaluación del drift y de la difusión
Una vez conocida `x`, se evalúan:
- `f(x)`;
- `s(x)`;
- `a(x)=0.5 s(x)^2`.

### 4.4. Escritura empaquetada
Cada bin de salida guarda las cuatro cantidades a la vez. Esto simplifica bastante los shaders de dibujo posteriores.

## 5. Procesos matemáticos implicados
### 5.1. Evaluación de expansión en base
\[
f(x)=\sum_i c_i \phi_i(x)
\]

y de forma análoga para `s(x)`.

### 5.2. Relación entre amplitud y difusión
Nombre para buscar:
- `Itô diffusion coefficient`
- `Fokker-Planck diffusion term`

\[
a(x)=\tfrac12 s(x)^2
\]

## 6. Resumen operativo
Este shader es el puente entre los coeficientes discretos del modelo y las curvas continuas que luego se ven en los paneles. Si una curva visual sale rara pero los coeficientes parecen razonables, este archivo es uno de los primeros sitios que conviene revisar.
