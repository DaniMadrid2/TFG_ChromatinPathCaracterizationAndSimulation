# 2_drawStartPointer.frag

## Índice
1. Objetivo
2. Parámetros, variables y texturas
3. Funciones auxiliares y casos de uso
4. Desglose de `main()`
5. Resumen matemático

## 1. Objetivo
Documentación técnica del shader y de su papel dentro del pipeline.

## 2. Parámetros, variables y texturas
### Uniforms
- `useMeanColor` (`int`):

### Salidas
- `outColor` (`vec4`):

## 3. Funciones auxiliares y casos de uso
- Este shader no define funciones auxiliares fuera de `main()` o sólo usa intrínsecas de GLSL.

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
### Procesos identificados
- **Smoothstep interpolation** (Interpolación suave): Transición suave entre dos estados usada para bordes y trazado de líneas.
- **Linear interpolation** (Interpolación lineal): Mezcla lineal entre dos cantidades o colores.

### Fórmulas importantes
- \[\\operatorname{smoothstep}(a,b,x)\]
- \[\\operatorname{mix}(a,b,t)=(1-t)a+tb\]

### Observación final
Este documento se ha construido a partir del propio código del fragmento: comentarios embebidos, firmas, nombres de funciones y estructura del `main()`. En los shaders analíticos conviene contrastarlo también con el vertex asociado y con el bloque del parser que fija uniforms, texturas y FBOs.
