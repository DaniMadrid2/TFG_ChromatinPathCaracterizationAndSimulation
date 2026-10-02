# dnti_shaderdsl

CLI para generar modulos de navegador a partir de `parseText<ID>.shaderdsl.ts`.
Requiere Node.js 20 o posterior.

## Instalacion

Desde la raiz de este repositorio:

```sh
npm run build:package
npm install -g ./dist
dnti_shaderdsl --help
```

Tambien se puede usar localmente con `npm install ./dist` o, desde otro
proyecto, `npm install /ruta/absoluta/al/dist`. El paquete publicable esta en
`dist/`; `npm pack ./dist` permite crear el tarball para instalarlo sin el
repositorio original.

## Crear y servir un proyecto

`dnti_shaderdsl init` pregunta que ejemplo crear: un canvas sencillo, dos
trayectorias sin `tick`, o una simulacion de dos campos con WebGL2. Para usarlo
sin preguntas:

```sh
dnti_shaderdsl init --template simple --dir mi-proyecto
cd mi-proyecto
dnti_shaderdsl parse .
dnti_shaderdsl runserver
```

`parse .` (o `parseAll`) detecta los archivos `parseText<ID>.shaderdsl.ts`
del directorio actual y omite los que solo se importan como DSL compartido.

`--watch` regenera al cambiar cualquier `.ts` del proyecto, incluidos snippets
y librerias locales; excluye `generated/`, `dist/`, `node_modules/` y backups.
`--serve [port]` sirve el proyecto despues del primer parseo. Su puerto
predeterminado es 4178; por ejemplo, `--serve 5180` usa el puerto 5180. Las
opciones `--serve`, `serve` y `runserver` solicitan elevacion UAC en Windows
cuando la API de backups esta habilitada. El servidor se abre en una consola
externa con permisos de administrador; `parse --serve --watch` mantiene el
watcher en la consola original. VS Code no puede elevar una terminal integrada
ya abierta; para tener el servidor integrado, inicia VS Code como administrador.
Fuera de Windows se solicita confirmacion para borrar o reemplazar backups:
si se rechaza (o no hay terminal interactiva), la API conserva los existentes.
`--no-backup-server` en `parse`, `parseAll`, `serve` o `runserver` desactiva
la API y evita la elevacion, incluso junto con `--serve`.
Las
dos opciones pueden combinarse: el proceso mantiene el servidor y la vigilancia
activos a la vez. Sin `--watch`, `--serve` hace un solo parseo y deja el servidor
abierto. Por ejemplo:

```sh
dnti_shaderdsl parse . --watch --serve
dnti_shaderdsl parse . --watch --serve 5180
dnti_shaderdsl parseAll --watch
dnti_shaderdsl parse parseTextC1.shaderdsl.ts --serve
```

`runserver [port] [path?]` sirve `index.html`, `generated/`, `glsl/` y los
demas archivos del directorio elegido. `serve` es un alias. Ambos incluyen la
API de backups en `/api/backups`, que escribe en `[path]/backups/`. El puerto predeterminado es 4178 y
la ruta predeterminada es el directorio actual. Permanece en primer plano,
escribe la URL en la consola y se detiene con Ctrl+C. Por ejemplo:

```sh
dnti_shaderdsl runserver 5180 ./GLSLTest
dnti_shaderdsl runserver 5180
dnti_shaderdsl runserver ./GLSLTest
```

Para ejecutar solo la API, sin servir `index.html`, usa
`dnti_shaderdsl servebackups [port] [path?]`. El codigo generado solicita
`/api/backups` al mismo origen que sirve el HTML: por eso normalmente conviene
usar `serve` o `parse --serve`. `servebackups` sirve para integrarla mediante
un proxy o para usar la API por separado. La API admite listar (`GET /list`),
leer (`GET /file?path=...`), escribir (`PUT /file`), anexar (`PUT /append`) y
limpiar carpetas numericas de iteraciones (`PUT /clear-generations`). Al
escribir un archivo fechado, solo se reemplaza el backup anterior mas reciente
del mismo nombre base; el resto del historial permanece.

## Flujo

1. Desde el proyecto de destino, ejecutar
   `dnti_shaderdsl parse parseTextC1.shaderdsl.ts parseTextC2.shaderdsl.ts`.
2. Cada archivo puede usar `import <Mid> from ./parseTextC12.shaderdsl.ts`
   para reutilizar bloques Shader DSL. `backUpPathReplace /patron/g -> "texto"`
   sustituye rutas de backup en ese archivo y sus imports.
3. El parser busca primero un par local `lib/Code/WebGL/webglParser.ts` y
   `lib/Code/WebGL/webglMan.ts`. Por compatibilidad admite tambien
   `lib/WebGL/`. Si no existe un par completo, usa la version incluida. Los
   imports `/Code/...` buscan primero `lib/Code/` del proyecto y despues los
   archivos incluidos en el paquete. Un parser local antiguo prevalece sobre
   las sintaxis nuevas del paquete: actualizalo o retira el par local para
   usar el parser incluido.
4. Los snippets opcionales del proyecto se insertan en el TypeScript generado.
   `parser_snippets/shared/commonImports.snippet.ts` puede contener imports TS
   normales, por ejemplo `import { drawTrajectory } from "../lib/trajectory.ts";`.
   La ruta relativa se resuelve desde `generated/`. Otros `*.snippet.ts` de
   `parser_snippets/<id>/` se insertan en orden de nombre en `<Pre>`.
5. El CLI escribe `generated/generatedParser<ID>.ts` y un JS ESM autonomo
   `generated/generatedParser<ID>.js`. El programa DSL llamado `demo` carga
   `/glsl/demo.vert` y `/glsl/demo.frag` al ejecutarse en el navegador.

Incluye el JS en HTML con `<script type="module">` y sirve el proyecto por
HTTP; abrir el HTML directamente no permite cargar los GLSL con `fetch`.
Sin un snippet de arranque, el canvas debe tener `id="shaderdsl-canvas"` y
soportar WebGL2.

## Snippets

`parser_snippets/<id>/00_pre_imports_and_async_func_wrapper.snippet.ts`
puede reemplazar el arranque por defecto. Dentro admite `__SHADERDSL_ID__`
(identificador en minusculas). Los demas snippets de ese identificador se
anaden secuencialmente al final de ese bloque `<Pre>`. `__SNIPPET_BODY__`
sigue admitido para colocar esos snippets en otra posicion dentro del wrapper,
pero no es necesario en el caso habitual. Los snippets compartidos no se insertan automaticamente
salvo `commonImports.snippet.ts`; se pueden colocar con
`shaderdsl.config.json`:

```json
{
  "snippets": [
    { "file": "parser_snippets/shared/drawResult.snippet.ts", "at": "post" },
    { "file": "snippets/extra.ts", "at": "before://<Pos>" }
  ]
}
```
(Nota: drawREsult es sólo un ejemplo de nombre, no hay snippets predefinidos)

`at` admite `pre`, `post`, `before:MARCADOR` y `after:MARCADOR`. La configuracion
se aplica a cada archivo parseado en esa ejecucion. Los `testParser*.ts` y los
snippets propios del repositorio original **no** se incluyen en el paquete.

`GLSLTest/` muestra C1 y C2 importando un DSL C12 comun, dos trayectorias
distintas, un helper TypeScript compartido y un canvas visible para cada una.

## Dibujos y atributos

Los bloques `drawPoints`, `drawLines`, `drawLineStrip`, `drawLineLoop`,
`drawTriangles`, `drawTriangleStrip` y `drawTriangleFan` comparten sintaxis.
El nombre del modo no distingue mayusculas. Para una trayectoria `vec2`:

```text
drawLineStrip {trajectory} -> [] size [640,480] {
}
drawLineStrip "aPos" {trajectory} -> [] size [640,480] {
}
drawLineStrip "aPos" {trajectory} 10 -> [] size [640,480] {
}
drawTriangleStrip {trajectory}vec3 -> [] size [640,480] {
}
```

La primera forma usa el atributo `aPos`; si se omite el tipo, un array plano
se interpreta como `vec2` y un array de tuplas usa el tamano de la primera
tupla. El sufijo opcional (`vec3` en el cuarto ejemplo) fija el tipo del
atributo directamente en la cabecera. Tambien se admiten `f`, `i`, `ui`,
`ivec2/3/4`, `uvec2/3/4` y `mat2/3/4`. Si se omite el recuento, se infiere
del array; el tercer ejemplo fuerza 10 vertices. El grosor de las lineas WebGL depende
del navegador y la GPU; para lineas anchas portables usa triangulos.

Para varios atributos, define el tipo de cada uno. Cada entrada usa un array
plano o un array de tuplas del tamano indicado; las matrices ocupan varias
posiciones consecutivas del VAO. Los tipos admitidos son `f`, `i`, `ui`,
`vec2/3/4`, `ivec2/3/4`, `uvec2/3/4` y `mat2/3/4`.

```text
positions_a = attributes {
  {aPos}vec2
  "aTransform" -> {transforms}mat2
}

drawLines -> [] size [640,480] {
  attributes {
    positions_a
    "aWeight" -> {weights}f
  }
}
```

Si no se indica un numero de vertices, `draw` usa la longitud del ultimo
atributo configurado en el VAO. Los datos se envian con `WebProgram.VAO.attribute`;
los atributos enteros usan `vertexAttribIPointer`.
