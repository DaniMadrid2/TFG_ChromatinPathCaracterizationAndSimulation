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
dnti-snippets-and-shader-dsl-ext-1.2.2-0.vsix
```

Luego puedes instalarlo con una de estas dos formas:

### Opción 1. Desde terminal

```powershell
code --install-extension .\dnti-snippets-and-shader-dsl-ext-1.2.2-0.vsix
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
