# 1_calcMSD.frag

## Índice
1. Objetivo del shader
2. Parámetros, uniforms y texturas
3. Funciones auxiliares
4. Desglose detallado de `main()`
5. Procesos matemáticos implicados
6. Resumen operativo

## 1. Objetivo del shader
Este shader calcula, para cada cromatina y cada retardo temporal `tau`, la MSD o mean-square displacement. Además empaqueta tres magnitudes derivadas que se usan como proxies de difusión y de respuesta reológica.

La idea física básica es: si una trayectoria se separa mucho entre `t` y `t+tau`, la MSD para ese `tau` será grande.

## 2. Parámetros, uniforms y texturas
### Texturas de entrada
- `datosX` (`sampler2DArray`): coordenadas `x` de todas las trayectorias.
- `datosY` (`sampler2DArray`): coordenadas `y` de todas las trayectorias.

### Uniforms
- `datosXLength`, `datosYLength`: tamaño lineal de cada capa.
- `lCromatin`: longitud temporal de cada cromatina.
- `msdTauCount`: número de retardos `tau` a evaluar.

### Salida
- `outMSD = [msd, D, eta, G]`

### Fragmentos de código relevantes
```glsl
layout(location = 0) out vec4 outMSD; //! size: [nCromatins, msdTauCount] = [msd, D, eta, G]
```

```glsl
float D = msd / max(4.0 * float(tau), 1e-6);
float eta = 1.0 / max(D, 1e-6);
float omega = 1.0 / max(float(tau), 1e-6);
float G = eta * omega;
```

## 3. Funciones auxiliares
### `getX(int idx)` y `getY(int idx)`
Convierten un índice lineal en coordenadas válidas de textura array.

```glsl
int texIdx = idx / datosXLength;
int texX = idx % datosXLength;
return texelFetch(datosX, ivec3(texX, 0, texIdx), 0).r;
```

Se usan para leer el punto `i` y el punto `i+tau`, y así construir el incremento espacial 2D.

## 4. Desglose detallado de `main()`
### 4.1. Decodificación del fragmento actual
Cada fragmento representa una pareja `(cromatina, tau)`:
```glsl
int chrom = pos.x;
int tau = pos.y + 1;
```

### 4.2. Validación del dominio
Se evita calcular casos sin sentido:
```glsl
if (tau > msdTauCount || tau >= lCromatin) {
    outMSD = vec4(0.0);
    return;
}
```

Si `tau` es demasiado grande, ya no hay pares suficientes para formar desplazamientos.

### 4.3. Acumulación del desplazamiento cuadrático
El núcleo del shader está en:
```glsl
float dx = getX(base + i + tau) - getX(base + i);
float dy = getY(base + i + tau) - getY(base + i);
acc += dx * dx + dy * dy;
```

Cada término mide cuánto ha cambiado la posición en 2D tras `tau` pasos.

### 4.4. Promedio final: la MSD
Después del barrido:
```glsl
float msd = (nPairs > 0) ? (acc / float(nPairs)) : 0.0;
```

Eso implementa la definición discreta del desplazamiento cuadrático medio.

### 4.5. Magnitudes derivadas
A partir de `msd` se calculan tres proxies:
- `D`, usando la aproximación browniana 2D;
- `eta = 1/D`, como cantidad inversa de movilidad;
- `G = eta * omega`, con `omega ~ 1/tau`.

No es una derivación microrreológica completa, pero sí una capa de diagnóstico útil.

## 5. Procesos matemáticos implicados
### 5.1. Mean-square displacement
Nombre para buscar:
- `Mean squared displacement`

Fórmula discreta:
\[
MSD(\tau)=\frac{1}{N-\tau}\sum_{i=0}^{N-\tau-1}\left[(x_{i+\tau}-x_i)^2 + (y_{i+\tau}-y_i)^2\right]
\]

### 5.2. Aproximación browniana en 2D
Nombre para buscar:
- `Brownian motion`
- `Einstein relation`

Relación usada:
\[
MSD(\tau) \approx 4D\tau
\]
por tanto
\[
D \approx \frac{MSD(\tau)}{4\tau}
\]

### 5.3. Proxies viscoelásticos simples
El shader define de forma operativa:
\[
\eta \approx \frac{1}{D}, \qquad \omega \approx \frac{1}{\tau}, \qquad G \approx \eta\,\omega
\]

## 6. Resumen operativo
Este shader transforma trayectorias 2D en una curva temporal de dispersión. Si la MSD sale mal, normalmente el problema está en la indexación de las trayectorias o en el rango de `tau` que se está intentando evaluar.
