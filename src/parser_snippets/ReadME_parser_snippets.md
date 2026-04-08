# Parser Snippets

## Qué son

Los `parser_snippets` son fragmentos de TypeScript que se inyectan dentro de:

- `generatedParser.ts`
- `generatedParserC2.ts`
- `generatedParserC3.ts`

Se cargan desde:

- `testParser.ts`
- `testParserC2.ts`
- `testParserC3.ts`

Sirven para mantener fuera del DSL el código puente de:

- HUD
- lectura de texturas
- simulación entre canvases
- dibujo auxiliar
- utilidades específicas por panel

## Carpetas activas

Las carpetas activas son, por ahora:

- `c1`
- `c23`

La idea es simple:

- `c1` contiene snippets específicos de `C1`
- `c23` contiene snippets compartidos entre `C2` y `C3`

## Regla de carga

Cada parser usa un identificador único:

- `testParser.ts` -> `c1`
- `testParserC2.ts` -> `c2`
- `testParserC3.ts` -> `c3`

El parser recorre todas las carpetas directas dentro de `parser_snippets/`.

Una carpeta se carga si su nombre:

- hace match exacto con el identificador
- o hace match por subsecuencia, saltándose letras

Ejemplos:

- `c1` carga `c1`
- `c2` carga `c23`
- `c3` carga `c23`

Después de decidir qué carpetas entran:

- se ordenan alfabéticamente las carpetas
- dentro de cada carpeta se cargan todos los `*.snippet.ts`
- también en orden alfabético

Por eso conviene usar prefijos como:

- `01_...`
- `02_...`
- `03_...`
- `04_...`

## Dónde se inyectan

El generado mantiene estas anclas:

- `//<Pre>`
- `//<Pos>`

`Pre` contiene la estructura base:

- imports extra
- inicio del `async`
- creación del canvas
- `ctx`, `gl`, `canvas`
- y después los snippets

`Pos` contiene el cierre:

```ts
//<Pos>
})();
//</Pos>
```

Los snippets no sustituyen esa estructura.

## Convención de nombres

Los archivos de snippet se guardan como:

- `*.snippet.ts`

Ejemplos:

- `01_overlay_controls.snippet.ts`
- `02_texture_reads_and_rank.snippet.ts`
- `03_simulation_bridge.snippet.ts`
- `04_msd_and_draw.snippet.ts`
- `01_fullscreen_bridge.snippet.ts`

## Sintaxis para diferencias C2/C3

### Placeholder corto

Para cambios pequeños de texto se usa:

```ts
$[opcionC2,opcionC3]$
```

Ejemplos:

```ts
__tauMSDProgress$[X,Y]$
```

```ts
axis:"$[x,y]$"
```

```ts
tauHudOverlayC$[2,3]$
```

### Bloques por eje

Para bloques enteros se usa:

```ts
//$0 - Begin
// código solo para C2
//$0 - END

//$1 - Begin
// código solo para C3
//$1 - END
```

Convención:

- `0` = `C2`
- `1` = `C3`

## Cuándo usar cada forma

Usa `$[...]$` si cambia:

- un nombre
- un id
- una etiqueta
- un eje `x/y`
- una referencia `C2/C3`
- una variable `X/Y`

Usa `//$0` y `//$1` si cambia:

- una función entera
- un bloque de UI
- un `if`
- un `append(...)`
- una inicialización que solo existe en uno de los dos paneles

## Resumen

La fuente viva está en carpetas como:

- `parser_snippets/c1`
- `parser_snippets/c23`

Las diferencias entre `C2` y `C3` se expresan dentro de los archivos compartidos mediante:

- `$[...]$`
- `//$0`
- `//$1`
