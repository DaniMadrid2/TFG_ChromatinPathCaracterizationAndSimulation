# 2_drawMSD.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Draw a compact MSD curve panel from the computed MSD texture.

## 2. Parámetros, variables y texturas
### Uniforms
- `datosMSD` (`highp sampler2D`): size: [nCromatins, msdTauCount] = [msd, D, eta, G]
- `msdTauCount` (`int`):
- `msdChromatinIndex` (`int`):
- `nCromatins` (`int`):

### Salidas
- `fragColor` (`vec4`): screen output

## 3. Funciones auxiliares y casos de uso
### `sampleMSD`
Se invoca 3 vez/veces desde `main()`.

## 4. Desglose de `main()`
### 4.1. Panel arriba derecha
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Ejes
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Mean-square displacement** (Desplazamiento cuadrático medio): Medida de difusión basada en incrementos temporales cuadrados.
- **Smoothstep interpolation** (Interpolación suave): Transición suave entre dos estados usada para bordes y trazado de líneas.
- **Linear interpolation** (Interpolación lineal): Mezcla lineal entre dos cantidades o colores.

### Fórmulas importantes
- \[MSD(\\tau)=\\mathbb{E}[|X_{t+\\tau}-X_t|^2]\]
- \[\\operatorname{smoothstep}(a,b,x)\]
- \[\\operatorname{mix}(a,b,t)=(1-t)a+tb\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
