# VS TS Snippets Ext

Extensión local de VS Code para dos modos de lenguaje:

- `TS Snippet` para `*.snippet.ts`
- `Shader DSL` para `*.shaderdsl.ts`

## Qué añade

- resaltado base estilo TypeScript
- soporte visual para `$[A,B,C]$`
- soporte visual para bloques `//$n - Begin ... //$n - End`
- colores cíclicos para opciones y bloques
- comandos para forzar el modo de lenguaje:
  - `Set Language Mode: TS Snippet`
  - `Set Language Mode: Shader DSL`
- definición y referencias básicas para ambos lenguajes

## Alternativas del Shader DSL

`->` desactiva una linea; `+>` la activa. Las alternativas sin nombre compiten
solo dentro del mismo bloque `{ ... }`. Un nombre delante del marcador, como
`comidas->`, agrupa alternativas de todo el documento.

```text
comidas+> let plato = "pez"
comidas-> let plato = "carne"

->|let primero = 1
  |let segundo = 2

->
let variante = 3
<-
```

El prefijo `|` agrega lineas al mismo grupo; `->` hasta `<-` agrupa un tramo.
Sobre cualquiera de sus lineas, `Toggle Line Comment` selecciona esa
alternativa usando el atajo configurado en VS Code. La unica alternativa de un
grupo no se desactiva con ese atajo. El comando `Shader DSL: Select Toggle
Alternative` hace lo mismo. Ctrl+clic sobre `->` salta al `+>` del grupo, o
avisa si no hay ninguno.

## Probar en desarrollo

1. Abre la carpeta `TFG_ChromatinPathCaracterizationAndSimulation` en VS Code.
2. Pulsa `F5`.
3. Elige `Run TS Snippet Extension`.
4. En la ventana nueva abre un archivo `*.snippet.ts` o `*.shaderdsl.ts`.

## Instalarla en tu VS Code

Desde la carpeta `vs_tssnippets_ext`:

```powershell
npm ci
npm run package
```

Eso genera un `.vsix` con el nombre real del paquete y su versión, por ejemplo:

```text
dnti-snippets-and-shader-dsl-ext-1.2.2-12.vsix
```

Luego puedes instalarlo con una de estas dos formas:

### Opción 1. Desde terminal

```powershell
code --install-extension .\dnti-snippets-and-shader-dsl-ext-1.2.2-12.vsix --force
```

### Opción 2. Desde VS Code

1. Abre `Extensiones`
2. pulsa en `...`
3. elige `Install from VSIX...`
4. selecciona el archivo `.vsix`

## Scripts útiles

```powershell
npm run package
npm run install-vsix
```

## Registry syntax

`npm run package` first runs `npm run build:syntax`. This reads every TypeScript
file in `src/dependencies/Code/WebGL/parser/{objects,functions,registryModules}`
without executing the parser. It writes `generated/registrySyntax.json` and
updates the generated object/function patterns in the Shader DSL grammar.

Put metadata comments immediately above an object or function entry:

```ts
objects: {
    //@dnti-createsInternalTexture
    //@dnti-color #39FF14
    SolidMeshProgram: (params, gl) => { /* ... */ },
}
```

`createsInternalTexture` tells the extension that `input=TexUnit20` is occupied
by that object; it affects the TexUnit state color and completion ranking.
`color` sets the name's editor color. Other `@dnti-*` comments are retained in
the generated JSON for future rules. The generated metadata also supplies object
parameter and method completions. Implicit object names appear as gray virtual
text; hovering a `TexUnit` lists its textures and hovering an alias shows its
other names. New registry files need no extension edit.

## Nota sobre el soporte de lenguaje

Esta extensión registra dos identificadores de lenguaje:

- `ts-snippet`
- `parse-text-ts`

Ambos comparten parte del sistema de decoraciones, hover y navegación simbólica, pero cada uno activa su propio patrón visual:

- `ts-snippet` resalta los placeholders `$[...]$` y los bloques `//$n - Begin/End`
- `parse-text-ts` resalta la sintaxis del DSL y detecta elementos como `program`, `resource`, `rebind`, `uniforms`, `tex2D`, `texture2DArray` y bloques con `defineTag`

## Draw backup inspector

In any `.shaderdsl.ts` file, hover over `backUp:` in a supported `draw*` block for a temporary image preview; hovering does not open a tab. Use `Open` after the block to open the dockable inspector, then drag its tab between editor groups. HTML selectors for path, scope, iteration and file appear only in that inspector, and each inspector keeps its own selection. The base directory is the first iteration; numbered directories are later iterations. All valid texture matrices render as images with per-channel value ranges. `Open File` opens the selected backing file in the editor.

The extension scans shader DSL files only within the current document's project directory. Code searches use bounded in-memory snapshots instead of opening every match as a VS Code document; the snapshot cache is pruned when its project has no visible editor.

# Recent Shader DSL Syntax

`RES [width,height]b` and `size [width,height]b` mark the `b` with the same
bracket scope as the dimension delimiters. The language also recognizes all
draw modes, `rebind-temp`, `temp`, `swap`, and `pingpong`.

Run **Shader DSL: Extract Repeated Block** with the cursor inside a repeated
`uniforms`, `rebind`, or `attributes` block. It creates one named template in
the current document and replaces identical blocks with calls to that name.
The rebind color marker shows the texture previously occupying a destination
unit on hover.

`derived` names remain italic at every use, including expressions after quoted
`//` text. `program` and `tex2D` aliases separated by `|` share a hover, and
an object declared without a name shows its generated name in light gray.
Registry modules can mark named-parameter-only objects with
`//@dnti-namedParamsOnly` and `namedParamsOnly: ["Camera3D"]`; then
`Camera3D camera2D pos=...` uses `camera2D` instead of an automatic name.
Objects that accept positional values require an explicit `_name` to avoid
confusing the name with a value.

Inline tags such as `tick -2-README {offset}- {` color the complete tag and
show the last runtime value beside `{offset}`. Start the project with the
backup API enabled (`serve`, `parse --serve`, or `servebackups`); the runtime
stores one throttled JSON snapshot per tag in `backups/<scope>/.dnti-tags/`.
Before the block runs, the editor shows `sin ejecutar`. Hover over the name to
see the observed value, its scope, the last static assignment, and nearby
backup lines. A snapshot is the last observed value, not a live debugger state.
