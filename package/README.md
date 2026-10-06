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

`dnti_shaderdsl tutorial` muestra 17 capitulos de sintaxis y copia el elegido
a una carpeta nueva del directorio actual. Tambien puedes usar
`dnti_shaderdsl tutorial 3` sin menu. Cada carpeta incluye un
`parseTextC1.shaderdsl.ts`, GLSL especifico y un `index.html`; el capitulo de
imports incluye ademas un DSL compartido y `parser_snippets/`. Dentro del
capitulo ejecuta `dnti_shaderdsl parse . --serve` para generar y abrir el
ejemplo. El modulo de mallas se llama actualmente `MeshCapsule`.

Los capitulos tratan: anclas y `tick`; programas, recursos y texturas; modos
de dibujo; `uniforms`; `rebind`; `attributes`; framebuffer y viewport;
transferencias `<=` y sufijo `b`; `swap` y `pingpong`; backups; snippets e
imports; dos partes de `MeshCapsule`; `derived`; y colores de `TexUnit` en la
extension; sustituciones `glslFilters`; y eventos y bloques globales.
La sintaxis experimental `--` no se incluye.

`dnti_shaderdsl init` pregunta que ejemplo crear: un canvas sencillo, dos
trayectorias sin `tick`, una simulacion de dos campos con WebGL2, o
`pointSimulation` (dos canvases con puntos cuya posicion se actualiza en la GPU).
Este cuarto ejemplo usa `parseTextC12.shaderdsl.ts` como DSL compartido y
snippets distintos para C1 y C2. Para usarlo
sin preguntas:

```sh
dnti_shaderdsl init --template simple --dir mi-proyecto
cd mi-proyecto
dnti_shaderdsl parse .
dnti_shaderdsl runserver
```

`parse .` (o `parseAll`) detecta los archivos `parseText<ID>.shaderdsl.ts`
del directorio actual y omite los que solo se importan como DSL compartido.

En un `.shaderdsl.ts`, `-> codigo` descarta una alternativa y `+> codigo`
la incluye. Las alternativas sin nombre compiten dentro del bloque `{ ... }`
que las contiene; `nombre-> codigo` y `nombre+> codigo` compiten en todo el
documento. `->| codigo` seguido de lineas `| codigo` forma una alternativa
de varias lineas. Para un tramo sin prefijo en cada linea, usa `->` o `+>`
en una linea y cierra con `<-`. El parser omite las importaciones desactivadas.
La extension permite seleccionar con Toggle Line Comment y navegar desde
`->` hasta el `+>` del mismo grupo.

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
un proxy o para usar la API por separado. Tambien se puede ejecutar
`node dist/lib/backups.js [port] [path]` desde este repositorio. En Windows,
si el borrado de backups falla por permisos, inicia esa terminal como
administrador y autoriza el borrado cuando se solicite. La API admite listar (`GET /list`),
leer (`GET /file?path=...`), escribir (`PUT /file`), anexar (`PUT /append`) y
limpiar carpetas numericas de iteraciones (`PUT /clear-generations`) y limpiar
solo los archivos de un draw antiguo (`PUT /clear-generation`). Al
escribir un archivo fechado, solo se reemplaza el backup anterior mas reciente
del mismo nombre base; el resto del historial permanece.

## Flujo

1. Desde el proyecto de destino, ejecutar
   `dnti_shaderdsl parse parseTextC1.shaderdsl.ts parseTextC2.shaderdsl.ts`.
2. Cada archivo puede usar `import <Mid> from ./parseTextC12.shaderdsl.ts`
   para reutilizar bloques Shader DSL. `backUpPathReplace /patron/g -> "texto"`
   sustituye rutas de backup en ese archivo y sus imports.
3. El parser busca primero un par local `lib/Code/WebGL/parser/webglParser.ts` y
   `lib/Code/WebGL/webglMan.ts`. Por compatibilidad admite tambien el par
   antiguo en `lib/Code/WebGL/` o `lib/WebGL/`. Si no existe un par completo, usa la version incluida. Los
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

## Modulos del parser

`src/dependencies/Code/WebGL/parser/objects/` y `parser/functions/` separan
los registros por tema. Cada archivo TS exporta `register(parser, services)`;
El cargador Node descubre los archivos con `fs` al ejecutar el parser; `build:package` los incluye en el paquete sin generar `index.ts`.
El cargador agrupa los registros directamente; no hay agregadores
`registryModules/objects.ts` ni `functions.ts`.
Los modos `drawPoints`, `drawLines`, `drawTriangles`, etc. son un mapa fijo del
parser a constantes WebGL; no son modulos de objetos o funciones.

Un modulo independiente en `registryModules/` exporta `id`, `detectUse(source)`
y `register(parser, services)`. `register` puede devolver `objects`, `functions`,
`transpile`, `browserImports` y `browserSetup`. `capsules.ts` contiene las
clases, funciones y reglas de transpilacion de `MeshCapsule`. Los imports del
codigo generado apuntan directamente a `parser/registryModules/capsules.js`.
`SolidMeshProgram input=TexUnit20 1024x1024` usa la misma API que
`MeshProgram`, pero rellena cada celda con dos triangulos mediante `TRIANGLE_STRIP`.
Su nombre implicito es `solidMeshProgram`; `draw(..., "LINES")` tambien dibuja
la malla solida en esta clase. El color se interpola en el fragment por defecto;
`solidMeshProgram.smoothColor(false)` recupera el color plano anterior y
`smoothColor()` lo vuelve a activar.

`DynamicSolidMeshProgram input=TexUnit20 1024x1024` hereda de la malla solida.
`dynamicSolidMeshProgram.initUniforms().setGridRadius(128).setFullResolutionCells(64).setFalloff(2).setRepeatRadius(100)`

`setFullResolutionCells(n)` keeps native texel spacing for `n` cells in each direction around the LOD center. Beyond that, `setFalloff(0)` distributes remaining vertices linearly; higher values (clamped to 64) keep more detail near the camera before spacing grows. `setRepeatRadius(r)` sets outer reach in texture tiles, not vertex count. Increasing `setGridRadius` adds vertices and GPU cost.

`setMaxLOD(n)` limits outer vertex spacing to at most `n` texture texels. For example, `.setPriorityTexels([[512,512]]).setMaxLOD(512)` keeps the center texel of every repeated tile and gives each tile at least two outer grid intervals per axis; after reaching that spacing, distant tiles stop losing resolution. `setMaxLOD(0)` disables the limit. The native-resolution center remains at one texel per cell. A fixed grid cannot cover arbitrarily many repeats at an arbitrarily fine limit: if the requested spacing needs more vertices than `setGridRadius` supplies, the method throws with guidance to increase the grid or reduce the covered area. Call `setMaxLOD` after `setPriorityTexels` when using both.

`draw(0,0,640,480,{camera3D})` mueve la vista. Si quieres que la resolucion
alta siga a la camara, llama a `setCameraPosition(camera3D.position)` en `tick`;
la posicion se redondea a la celda de la textura para evitar actualizaciones
subcelda. `setLODOrigin(x,z)` fija el centro manualmente.
`setPriorityTexels([[512,512]])` reserva un vertice exacto para ese texel de la
textura **en cada repeticion**; `setPriorityPoints([[x,z]])` reserva puntos
fijos en coordenadas X/Z del mundo. Se admiten hasta 16 puntos. Si faltan
vertices para todas las copias, aumenta `setGridRadius` o reduce
`setRepeatRadius`. Los vertices generales pueden cambiar de sitio con el LOD,
pero las muestras prioritarias siguen en el mismo punto del mundo en cada copia.
Un solo texel prioritario, por ejemplo `[[512,512]]`, reserva el centro de
cada copia sin gastar vertices adicionales en vecinos inmediatos. Para mantener
mas detalle cerca de la camara aumenta `setFullResolutionCells` o `setFalloff`.
Cambiar la textura de alturas sigue cambiando la superficie;
los puntos prioritarios solo evitan que el muestreo espacial los omita.
La geometria sigue siendo finita: el radio cuenta repeticiones a cada lado
(hasta 10000), y `camera3D.far` tambien limita el horizonte visible.

Dentro de `program`, `tex3D volume RES [w x h x d] RGFloat TexUnit7` crea una
textura para `sampler3D`. Fuera del bloque se acepta
`volume = texture3DArray RGFloat {data} "volume" TexUnit7 [w x h x d]`;
`tex3D` y `tex3DArray` son alias de esa forma. `texture2DArray` conserva la
semantica de capas independientes para `sampler2DArray`.

`detectUse` puede devolver `true`, `false` o `"Toggled"`. Con `"Toggled"`, el
modulo se activa si esta nombrado en `dnti.modules.json` del proyecto. El mismo
archivo puede incluir rutas de modulos TS externos (relativas al proyecto):

```json
{
  "modules": ["MeshCapsule", "./modules/MyModule.ts"]
}
```

Un modulo externo debe exportar `detectUse` y `register`; `id` es opcional y,
si falta, se usa el nombre del archivo. Incluir su ruta permite cargarlo:
`true` lo activa, `false` lo omite y `"Toggled"` lo activa por estar listado.
Tambien se
admite `{ "MeshCapsule": true, "./modules/MyModule.ts": true }`. Para
compatibilidad, `registryModules` en `shaderdsl.config.json` sigue pudiendo
activar modulos incluidos por nombre.

Las implementaciones de runtime se registran **a mano** en
`DetailedParser.runtimeFeatures`. Cada archivo de `Code/WebGL/runtime/`
exporta `runtimeFeature` con `imports` y `setup`, y termina con un export
`detectUse(context)` del mismo nombre en todos los modulos. El parser importa
primero esa funcion y carga el descriptor solo cuando hace falta.
`detectUse` puede devolver `true`, `false` o `"Toggled"`; `"Toggled"` solo
se activa desde `shaderdsl.config.json`. Por ejemplo:

```json
{
  "registryModules": ["MeshCapsule"],
  "runtimeFeatures": { "backup": true, "runtimeLet": false }
}
```

`backup`, `runtimeLet` y `shaderFilters` se detectan automaticamente. Backup
incluye `backUp:`, `backUp store`, `backUp restore`, `backUp log` y
`readBackup(path)`. El parser emite imports y configuracion; la logica esta
en `Code/WebGL/runtime/`. `init` crea el JSON vacio si la plantilla no lo trae.

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

Una textura declarada con `tex2D` tambien puede ser la fuente de vertices:
`drawLineStrip {positionTexture}vec2 -> [] size [640,480] { }`. En este caso
no hay transferencia a CPU ni atributo `aPos`: el parser enlaza el sampler
`positionTexture` y usa `texture.w * texture.h` vertices. El vertex shader
debe leer `texelFetch(positionTexture, ivec2(0, gl_VertexID), 0)` para una
textura de anchura 1. No se puede muestrear una textura mientras se escribe
en ella en la misma pasada; utiliza dos texturas y alterna entrada/salida.

Las sentencias `positionTexture <= trajectory` y `trajectory <= positionTexture`
suben valores mediante `.fill()` o los leen mediante `.read()`, respectivamente.
La lectura es sincrona y copia datos de GPU a CPU; el destino debe ser un
array JS redimensionable. El sufijo `b` en `RES [1,trajectory.length]b` o
`drawTriangles -> [positionTexture] size [1,trajectory.length]b` divide la
segunda dimension por los canales del formato (`RG` = 2) y aplica `ceil`.
En un draw con varias salidas usa el formato de la primera; sin salida no
puede inferirse el formato y `b` no esta permitido. `.fill()` completa con
ceros el ultimo texel cuando faltan componentes.

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
