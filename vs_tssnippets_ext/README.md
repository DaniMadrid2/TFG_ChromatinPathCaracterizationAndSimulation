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
- definición y referencias básicas para `TS Snippet`

## Probar en desarrollo

1. Abre la carpeta `TFG_ChromatinPathCaracterizationAndSimulation` en VS Code.
2. Pulsa `F5`.
3. Elige `Run TS Snippet Extension`.
4. En la ventana nueva abre un archivo `*.snippet.ts` o `*.shaderdsl.ts`.

## Instalarla en tu VS Code

Desde la carpeta `vs_tssnippets_ext`:

```powershell
npm run package
```

Eso generará un archivo `.vsix`, normalmente:

```text
vs-tssnippets-ext-0.0.1.vsix
```

Luego puedes instalarlo con una de estas dos formas:

### Opción 1. Desde terminal

```powershell
code --install-extension .\vs-tssnippets-ext-0.0.1.vsix
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
