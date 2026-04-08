# 1_calcPCA.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Compute per-chromatin 2D PCA directions and centers from trajectory points.

## 2. Parámetros, variables y texturas
### Uniforms
- `datosX` (`highp sampler2DArray`): size: [datosXLength, 1, nLayers]
- `datosXLength` (`int`):
- `datosY` (`highp sampler2DArray`): size: [datosYLength, 1, nLayers]
- `datosYLength` (`int`):
- `lCromatin` (`int`):

### Salidas
- `outData` (`vec4`): size: [nCromatins, 1] = [v1.x, v1.y, v2.x, v2.y]
- `outCenters` (`vec4`): size: [nCromatins, 1] = [meanX, meanY, 0, 0]

## 3. Funciones auxiliares y casos de uso
### `getX`
Se invoca 2 vez/veces desde `main()`.

### `getY`
Se invoca 2 vez/veces desde `main()`.

### `meanVec2`
No aparece invocada directamente desde `main()` en esta versión; su presencia sirve como soporte algebraico o como bloque reutilizable.

### `gramMatrix`
No aparece invocada directamente desde `main()` en esta versión; su presencia sirve como soporte algebraico o como bloque reutilizable.

### `eigSym2`
No aparece invocada directamente desde `main()` en esta versión; su presencia sirve como soporte algebraico o como bloque reutilizable.

## 4. Desglose de `main()`
### 4.1. Matriz de correlación
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. --- Eigenvalues ---
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. --- Eigenvector principal (v1) ---
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.4. --- Segundo eigenvector ortogonal ---
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.5. Ejemplo de salida
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
### Procesos identificados
- **Principal Component Analysis** (Análisis de componentes principales): Diagonalización de la matriz de correlación para obtener ejes principales.
- **Singular Value Decomposition** (Descomposición en valores singulares): Factorización matricial usada para relacionar la base principal con la matriz de Gram.

### Fórmulas importantes
- \[C = V\\Lambda V^T\]
- \[X = U\\Sigma V^T\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
