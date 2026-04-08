# 1_drawKM.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este fragment shader no estima parámetros nuevos. Su trabajo es mostrar de forma legible varios diagnósticos ya calculados en pasos previos: momentos de Kramers-Moyal, errores asociados y coeficientes seleccionados para un `tau` dado.

Lo importante aquí es entender que el shader actúa como un panel compuesto con tres zonas:
- panel superior izquierdo: magnitud y pseudo-distribución de `fKM` y `aKM`;
- panel inferior izquierdo: magnitud y pseudo-distribución de `fErr` y `aErr`;
- panel inferior derecho: barras de coeficientes `f0..f3` y `a` para el `tau` seleccionado.

Dicho de forma simple: este shader convierte texturas numéricas en una vista de inspección rápida para decidir si los observables empíricos y los parámetros tienen sentido.

## 2. Parámetros, uniforms y texturas
### Uniforms de entrada
- `kmDiag` (`highp sampler2D`): textura `[nBins, 1]` con `vec4(fKM, aKM, fErr, aErr)`.
- `kmFVals` (`highp sampler2D`): textura `[nCromatins, tauMax]` con los cuatro coeficientes de drift.
- `kmAVals` (`highp sampler2D`): textura `[nCromatins, tauMax]` con el coeficiente o amplitud agregada de difusión.
- `nBins` (`int`): número de bins del diagnóstico KM.
- `kmChromatinIndex` (`int`): cromatina seleccionada.
- `tauSel` (`int`): valor de `tau` que se quiere inspeccionar.
- `tauMax` (`int`): cota superior de `tau` disponible en las texturas de parámetros.

### Variables interpoladas
- `vUV`: coordenada UV normalizada del quad de pantalla.

### Salida
- `fragColor` (`vec4`): color final del framebuffer.

### Fragmentos de código relevantes
```glsl
uniform highp sampler2D kmDiag;
uniform highp sampler2D kmFVals;
uniform highp sampler2D kmAVals;
```

```glsl
// Top-left: hist + pdf for f_km and a_km
// Bottom-left: hist + pdf for f_err and a_err
// Bottom-right: f_vals and a_vals
```

## 3. Funciones auxiliares
### `diagAt(int b)`
Lee el bin `b` de la textura `kmDiag`.

```glsl
vec4 diagAt(int b){
    return texelFetch(kmDiag, ivec2(clamp(b,0,nBins-1), 0), 0);
}
```

Se usa tanto para acceder al bin visible en pantalla como para recorrer todos los bins y calcular máximos y sumas de normalización.

### `panelLine(float y, float yv, float w)`
Genera una línea suave centrada en `yv` con semianchura `w`.

```glsl
float panelLine(float y, float yv, float w){
    return smoothstep(w, 0.0, abs(y - yv));
}
```

Se usa para trazar visualmente las pseudo-pdfs de `fKM`, `aKM`, `fErr` y `aErr`.

## 4. Desglose detallado de `main()`
### 4.1. Inicialización del lienzo compuesto
El shader parte de fondo transparente:
```glsl
vec3 col = vec3(0.0);
float alpha = 0.0;
```
Cada panel añade color sólo si `vUV` cae dentro de su rectángulo.

### 4.2. Definición geométrica de paneles
Se fijan tres cajas UV:
```glsl
vec2 tlMin = vec2(0.02, 0.52), tlMax = vec2(0.48, 0.98);
vec2 blMin = vec2(0.02, 0.02), blMax = vec2(0.48, 0.48);
vec2 brMin = vec2(0.52, 0.02), brMax = vec2(0.98, 0.48);
```
Esto organiza por completo la lectura visual del panel.

### 4.3. Panel superior izquierdo: `fKM` y `aKM`
Subproceso:
1. localizar el bin actual;
2. leer `fKM` y `aKM`;
3. recorrer todos los bins para hallar máximos y sumas;
4. normalizar amplitudes y pseudo-pdfs;
5. dibujar barras alternadas y curvas suaves.

```glsl
float fBar = clamp(f / maxF, 0.0, 1.0);
float aBar = clamp(a / maxA, 0.0, 1.0);
float fPdf = f / max(sumF, 1e-9);
float aPdf = a / max(sumA, 1e-9);
```

Aquí no se estima una pdf continua; se dibuja una distribución discreta reescalada por bins.

### 4.4. Panel inferior izquierdo: `fErr` y `aErr`
Repite la misma lógica pero sobre errores. La diferencia importante es que se ignoran bins marcados como inválidos:
```glsl
if (fRaw >= 0.0 && fracBin < 0.5 && uv.y <= fBar) {
    ...
}
```

Eso evita que errores no definidos contaminen la escala visual.

### 4.5. Panel inferior derecho: parámetros del modelo
Se toma `tauSel` y se construye el vector de cinco barras:
```glsl
vals[0] = fv.x; vals[1] = fv.y; vals[2] = fv.z; vals[3] = fv.w; vals[4] = av;
```
Cada barra se divide por el mayor valor absoluto del grupo para poder comparar magnitudes relativas.

### 4.6. Descarte final
Si ningún panel genera señal visible:
```glsl
if (alpha < 0.01) discard;
```

## 5. Procesos matemáticos implicados
### 5.1. Momentos de Kramers-Moyal
Nombre para buscar en Wikipedia:
- `Kramers-Moyal expansion`
- `Kramers-Moyal coefficients`

Aunque este shader no los calcula, sí visualiza el primer y segundo momento efectivos y sus errores.

### 5.2. Normalización por máximo
Se usa para convertir amplitudes heterogéneas en barras comparables:
\[
bar_b = \frac{|x_b|}{\max_j |x_j|}
\]

### 5.3. Normalización discreta por suma
Se usa para construir una pseudo-distribución en bins:
\[
p_b = \frac{|x_b|}{\sum_j |x_j|}
\]

### 5.4. Interpolación suave
Se usa `smoothstep` como perfil suave alrededor de una altura objetivo.

## 6. Resumen operativo
Este shader es importante para inspección, pero no decide el mejor modelo. Si algo se ve raro aquí, el origen del problema suele estar antes, en cómo se calcularon los observables KM o cómo se empaquetaron los parámetros asociados al `tau` seleccionado.
