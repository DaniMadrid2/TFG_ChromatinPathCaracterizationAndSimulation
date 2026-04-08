# 2_drawPCA.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Simple color pass for PCA axis quads (main vs perpendicular).

## 2. Parámetros, variables y texturas
### Uniforms
- `isPerp` (`int`):
- `is3D` (`int`):

### Salidas
- `fragColor` (`vec4`): screen output

## 3. Funciones auxiliares y casos de uso
- Este shader no define funciones auxiliares fuera de `main()` o sólo usa intrínsecas de GLSL.

## 4. Desglose de `main()`
### 4.1. Visual simple: degradado según coord local del quad
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Vec2 uv = vLocal * 0.5 + 0.5; // convertir [-1,1] a [0,1]
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. FragColor = vec4(uv, 0.5, 1.0);
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Principal Component Analysis** (Análisis de componentes principales): Diagonalización de la matriz de correlación para obtener ejes principales.

### Fórmulas importantes
- \[C = V\\Lambda V^T\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
