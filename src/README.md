# Código Fuente Del Proyecto

Este directorio reúne las tres piezas que gobiernan el runtime generado:

- `*.shaderdsl.ts`
- `parser_snippets/*.snippet.ts`
- `parsers/testParser*.ts`

La idea general es esta:

1. los archivos `*.shaderdsl.ts` describen escenas, programas, texturas, pases y lógica de actualización en un DSL con sintaxis cercana a TypeScript
2. los `testParser*.ts` leen ese DSL y lo transforman en:
   - `generated/generatedParser.ts`
   - `generated/generatedParserC2.ts`
   - `generated/generatedParserC3.ts`
3. los `*.snippet.ts` inyectan bloques TypeScript auxiliares en los generated cuando ese código no encaja bien dentro del DSL

## Relación con `parser_snippets`

La funcionalidad específica de los archivos `*.snippet.ts` está documentada en:

- `src/parser_snippets/ReadME_parser_snippets.md`

Ese README explica:

- cómo se cargan los snippets
- qué carpetas activan `C1`, `C2` y `C3`
- la sintaxis `$[a,b]$`
- la sintaxis `//$0 - Begin ... //$0 - END`

Los archivos `*.shaderdsl.ts` usan el mismo proyecto y el mismo pipeline de generación, así que conviene leer ambos documentos juntos.

## Qué es `shaderdsl`

`shaderdsl` es un lenguaje de descripción de escenas y pipelines GPU que mezcla:

- sintaxis declarativa para recursos WebGL
- bloques imperativos parecidos a TypeScript
- interpolación de expresiones con `{...}`
- atajos para programas GLSL, uniforms, framebuffers y draw calls

No es TypeScript puro, aunque intenta ser legible para alguien acostumbrado a TS/JS y GLSL.

## Archivos principales

- `parseText1.shaderdsl.ts`
  - experimentos y escenas sencillas de una sola vista
- `parseText2.shaderdsl.ts`
  - escena principal `C1`
- `parseTextC2.shaderdsl.ts`
  - parte específica de `C2`
- `parseTextC3.shaderdsl.ts`
  - parte específica de `C3`
- `parseTextC23.shaderdsl.ts`
  - bloque compartido entre `C2` y `C3`
- `parseText2Total.shaderdsl.ts`
  - archivo de pruebas/ensamblado más amplio

## Cómo se usan dentro del proyecto

Cada parser trabaja sobre un archivo raíz:

- `parsers/testParser.ts` usa `parseText2.shaderdsl.ts`
- `parsers/testParserC2.ts` usa `parseTextC2.shaderdsl.ts`
- `parsers/testParserC3.ts` usa `parseTextC3.shaderdsl.ts`

Esos archivos pueden incluir otros fragmentos compartidos, por ejemplo:

```ts
import <Mid> from ../parseTextC23.shaderdsl.ts
```

Después el parser:

1. resuelve imports del DSL
2. traduce bloques especiales
3. inyecta snippets cuando toca
4. genera TypeScript final en `src/generated/`

## Sintaxis base de `shaderdsl`

### 1. Anclas del parser

Sirven para indicar zonas estructurales del fichero:

```ts
<Pre>
...
<Pos>
```

También existe:

```ts
<Pre/>
```

que se usa cuando el archivo entra directamente en el cuerpo principal sin abrir una nueva sección estructural larga.

### 2. Imports del DSL

No son imports de TypeScript. Se usan para ensamblar trozos de DSL:

```ts
import <Mid> from ../parseTextC23.shaderdsl.ts
```

El marcador `<Mid>` indica dónde se inserta el contenido importado.

### 3. Variables simples

Se pueden declarar variables con expresiones embebidas:

```ts
let is3D=true
let tauFTerms=tauFDegrees.length
let tauBasisBody=(degrees)=>degrees.map((d,i)=>"...").join(" ")
```

El lenguaje acepta expresiones bastante cercanas a JS/TS mientras el parser pueda reinyectarlas como código.

### 4. Bloque `let { ... }`

Permite agrupar declaraciones:

```ts
let {
  tauMaxVeces=100, tauMinVeces=1
  chromatinIndex=1, nBins=64
}
```

Se usa sobre todo para parámetros globales de una escena o de una fase del pipeline.

### 5. Interpolación `{...}`

Dentro del DSL, `{...}` significa “evalúa esta expresión y colócala aquí en el código generado”.

Ejemplos:

```ts
tauMax = {tauMaxVeces}i
offset = vec3(0,0,0)f
drawTau.draw(0,0,{W},{H},{camera3D})
```

Sufijos comunes:

- `i`
- `f`

se usan para indicar cómo se debe emitir ese literal hacia uniforms o helpers del runtime.

### 6. Macros tipo `$nombre$`

Hay macros que el parser/runtime reconoce como funciones auxiliares o puntos de expansión.

Ejemplo:

```ts
[datosX, datosY] = $getDataArrays$({datos_reales})
```

Esto no es TS estándar; es una forma de invocar una utilidad conocida por el sistema de generación.

## Recursos GPU y programas

### 7. Programas GLSL

Hay dos sintaxis frecuentes.

Forma antigua:

```ts
progTauMom = Program tau/01_moments/1_tauMaxVeces |= tauMom
lduse tauMom
tauMom.createVAO().bind()
```

Forma nueva y más compacta:

```ts
program tauScore "tau/05_filters/3_tauModelScore" {
   tex2D tauScore|tauScoreTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit29
}
```

Aquí:

- `tauScore` es el alias del programa
- la cadena apunta al shader en `src/glsl/`
- el bloque puede declarar texturas asociadas al programa

### 8. Recursos reutilizables

Se pueden definir presets:

```ts
resource TauFloatTex {
   format: RGBA16
   filter: NEAREST
   wrap: CLAMP
}
```

Esto evita repetir parámetros de texturas.

### 9. Texturas

Dentro de `program { ... }` se usan líneas como:

```ts
tex2D tauKL|tauKLTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit28
```

La forma general es:

```ts
tex2D nombreUniform|nombreVariable[ancho,alto] recursoODefinicion unidad
```

También existe sintaxis más manual fuera de bloques:

```ts
let xTex = tauMom.createTexture2D("datosX1", [NMuestras1,1], TexExamples.RFloat, tauSignalData, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit10)
```

### 10. Rebind de texturas

Para evitar repeticiones:

```ts
rebind drawTau {
  tauXiMetaFinal -> TexUnit27
  tauBest -> TexUnit17
  tauModelScore -> TexUnit29
}
```

Esto expande llamadas de `bindTexName2TexUnit(...)`.

### 11. Uniforms

Se pueden agrupar uniforms:

```ts
uniforms drawTau {
   tauMax = {tauMaxVeces}i
   nBins = {nBins}i
   showTauCurves = {!!showTauCurves?1:0}i
}
```

También se usa la forma corta:

```ts
uniforms tauXi {
   tauMax = {tauMaxVeces}i
}
```

## Framebuffers, viewport y draw

### 12. Framebuffers

Forma compacta:

```ts
framebuffer tauAFPOptFBO {
  tauXiFFinal -> ColAtch0
  tauXiSFinal -> ColAtch1
  tauXiMetaFinal -> 2
}
```

O por orden:

```ts
framebuffer tauXiFBO [tauXiF, tauXiS, tauXiMeta]
```

### 13. Viewport y draw

Se usan formas abreviadas como:

```ts
viewport [0,0,{nBins},1]
drawTriangles 0 6
```

y también las llamadas más explícitas:

```ts
tauMom.setViewport(0,0,nBins,tauMaxVeces*tauMaxVeces)
tauMom.drawArrays("TRIANGLES",0,6)
```

## Bloques de ejecución

### 14. `tick { ... }`

Es el bloque por frame o por actualización:

```ts
tick {
   if(recomputeTau){
      ...
   }
}
```

Aquí suele vivir:

- la lógica del pipeline
- la actualización de cámara
- el dispatch de programas
- la recomputación de texturas derivadas

### 15. Bloques con prioridad

Algunos bloques aceptan prioridad:

```ts
drawTauPanel (20) {
   ...
}
```

Eso se usa cuando el runtime monta varias funciones y necesita ordenar ejecución o dibujo.

### 16. Bloques de eventos

Ejemplo típico:

```ts
OnKeyPress "k" {
   is3D={!is3D}
}
```

Sirven para traducir eventos declarativos a listeners del runtime.

## GLSL y sustituciones

### 17. `glslFilters { ... }`

Permite parchear código GLSL antes de compilarlo:

```ts
glslFilters {
   both "tau/" "const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT" -> {"const int TAU_F_TERMS = " + String(tauFTerms) + ";"}
}
```

Se usa para:

- cambiar constantes
- inyectar cuerpos de funciones
- adaptar shaders al número real de términos o modos activos

## Comentarios y organización

### 18. Comentarios normales

```ts
// comentario
```

### 19. Comentarios de fase

```ts
//? phase 05_filters - tauScore - file://./glsl/tau/05_filters/3_tauModelScore.frag
```

Se usan para marcar fases del pipeline y dar contexto al lector.

## Cuándo mover código a `snippet`

Conviene dejarlo en `*.snippet.ts` cuando:

- el código ya es TypeScript puro
- es demasiado específico del runtime generado
- no se lee bien en el DSL
- depende de helpers entre canvases, HUD o lecturas auxiliares

Conviene dejarlo en `*.shaderdsl.ts` cuando:

- describe programas, uniforms, texturas o framebuffers
- forma parte del pipeline de cálculo o dibujo
- expresa mejor la estructura declarativa del flujo GPU

## Flujo de trabajo recomendado

1. editar `src/glsl/` si cambia el shader
2. editar `src/parseText*.shaderdsl.ts` si cambia el pipeline
3. editar `src/parser_snippets/*.snippet.ts` si cambia lógica auxiliar inyectada
4. ejecutar los parsers para regenerar `src/generated/`
5. probar en navegador

## Resumen corto

- `*.shaderdsl.ts` describe el pipeline y la escena
- `*.snippet.ts` aporta TypeScript auxiliar inyectado
- `parsers/testParser*.ts` transforman ambos en `generated/*.ts`
- `glsl/` contiene los shaders reales compilados por los programas del DSL
