# 1_drawData.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Colorize each vertex by index to distinguish paths.

## 2. Parámetros, variables y texturas
### Uniforms
- `lineColor` (`vec3`):
- `datosXLength` (`int`):
- `lCromatin` (`int`):

### Salidas
- `outColor` (`vec4`): screen output

## 3. Funciones auxiliares y casos de uso
### `hue2rgb`
No aparece invocada directamente desde `main()` en esta versión; su presencia sirve como soporte algebraico o como bloque reutilizable.

### `hsl2rgb`
Se invoca 1 vez/veces desde `main()`.

## 4. Desglose de `main()`
### 4.1. Inicialización del fragmento
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.2. Validación de dominio y casos degenerados
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.3. Cálculo principal
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

### 4.4. Escritura de la salida
Este subproceso aparece explícitamente señalado por la estructura interna del shader y conviene leerlo como una fase diferenciada del cálculo total.

## 5. Resumen matemático
No se detecta un proceso matemático especializado más allá de operaciones elementales de dibujo, muestreo o selección lógica.

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
