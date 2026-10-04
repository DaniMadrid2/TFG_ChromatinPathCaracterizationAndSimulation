# Inventario de webglParser y del codigo inyectado

Estado: inventario historico y seguimiento del refactor; los nombres `__*` de
las tablas describen el codigo anterior a la extraccion.
Fuente principal: `src/dependencies/Code/WebGL/parser/webglParser.ts` (`DetailedParser`).
El README principal de este proyecto esta en `src/README.md`. El paquete se
construye desde `src/dependencies/Code`; `dist/` es salida de build. Un
`lib/Code/WebGL/` del proyecto consumidor solo sustituye el parser incluido
si contiene `parser/webglParser.ts` y `webglMan.ts` (se acepta el par antiguo).

## Estado actual

- `parser/objects/` y `parser/functions/`: registros tematicos con export
  `register`. El cargador Node descubre los archivos TS con `fs` al ejecutar el parser; no genera `index.ts`.
- `parser/registryModules/`: agregadores `objects.ts` y `functions.ts`, mas
  modulos independientes. `capsules.ts` contiene las clases, funciones y
  transpilacion de `MeshCapsule`; las clases se importan desde ese modulo.
  `dnti.modules.json` activa nombres o rutas de modulos externos.
- Los modos de dibujo son un mapa del parser a constantes WebGL, no un modulo
  `blocks` separado.
- `parser/runtimeFeature.ts`: contrato compartido. La lista explicita de
  modulos sigue en el parser, pero cada implementacion de `runtime/` exporta
  su `runtimeFeature` y termina con `detectUse`. El parser consulta primero
  `detectUse` y carga el descriptor solo si se activa. `"Toggled"` necesita
  activacion en el JSON.
- `Code/WebGL/runtime/BackupRuntime.ts`, `RuntimeLetSource.ts` y
  `ShaderFilterSet.ts` sustituyen los helpers `__*` generados. Sus imports
  para el codigo generado solo se emiten si se detectan o se fuerzan.
  `readBackup(path)` es la API de
  lectura; `backUp restore` sigue rellenando un destino existente.

Las tablas siguientes conservan el mapeo del codigo antiguo para revisar
posibles mejoras pendientes; no describen simbolos emitidos hoy.

## Que es cada cosa

- **Metodo del parser**: corre al convertir DSL a TS, o en el interprete
  directo. No debe trasladarse automaticamente al navegador.
- **Runtime inyectado**: texto TS emitido por el parser dentro de cada
  `generatedParser<ID>.ts`. Este es el principal candidato a modulo importado.
- **Temporal emitido**: variable `__*` local de una expresion generada. No es
  una funcion compartida ni una API; conviene darle nombre estable, no crear
  un modulo por cada temporal.
- **Snippet**: codigo del proyecto insertado por `package/runner.cjs`; no
  forma parte de `DetailedParser`. Su refactorizacion pertenece al ejemplo o
  a una libreria de dominio, no necesariamente al paquete universal.

Antes `transpileToFile` llamaba a `buildRuntimeLetHelperLines` y
`buildBackupRuntimeHelperLines` desde `insertScaffold` incluso sin uso del DSL.
Ahora resuelve descriptores y emite imports selectivos. Los `//<Pre>` del paquete reciben el
wrapper y los snippets; `//<Pos>` cierra el wrapper. El CLI
(`package/runner.cjs`) anade imports TS y compila el JS; el parser directo de
`src/parsers/testParser*.ts` conserva ademas secciones existentes por defecto.

## Runtime generado: filtros GLSL

Origen: `buildTranspiledShaderFilterRulesSource`,
`buildTranspiledShaderFilterHelperLines` y `transpileShaderFilterFactory`
(`webglParser.ts`, aproximadamente lineas 1020-1080).

| Simbolo generado | Funcion actual | Ya existe / destino propuesto |
| --- | --- | --- |
| `__transpiledShaderFilterRules` | Guarda las reglas del DSL como funciones que evaluan patron de archivo, busqueda y reemplazo al usar el programa. | No hay registro equivalente en `/Code`; `ShaderFilterSet` en `Code/WebGL/shaderFilters.ts`. |
| `__makeTranspiledShaderFilter(stage, filePath)` | Devuelve un filtro de fuente para vertex/fragment; selecciona reglas por etapa/ruta, clona regex y aplica reemplazos. | `Code/opengl/opengl.ts` ya carga y compila shaders con filtros (`loadShaders`, `__loadProgramWithShaderFilters`), pero no construye reglas. Importar `ShaderFilterSet.createFilter(...)`; dejar `WebProgram.loadProgram(...)` como consumidor. |

El DSL debe seguir aportando **datos de reglas**, no el cuerpo del algoritmo.
La rama del interprete directo (`parseShaderFilterTokenValue`,
`parseShaderFilterSpec`, `loadShaderFiltersFromLines`,
`shaderFilePatternMatches`, `applyShaderFilterMatch`, `buildShaderFilter`,
`loadProgramWithShaderFilters`) implementa una ruta paralela; conviene que
ambas rutas consuman la misma representacion de reglas, no dos algoritmos.

## Runtime generado: `let` desde archivos

Origen: `buildRuntimeLetHelperLines` (aprox. 1257-1322). Lo llama
`transpileGroupedLetBlock` solo cuando un bloque usa una fuente externa.

| Simbolo generado | Funcion actual | Ya existe / destino propuesto |
| --- | --- | --- |
| `__runtimeLetCache` | Cachea el resultado por URL resuelta. | No hay equivalente especifico; estado privado de `RuntimeLetSource` en `Code/Start/runtimeLetSource.ts` o `Code/Utils/runtimeLetSource.ts`. |
| `__coerceRuntimeLetValue(raw)` | Convierte texto a booleano, null, numero, JSON o string sin comillas. | No hay parser equivalente en `/Code`; `RuntimeLetSource.parseScalar`. |
| `__mergeRuntimeLetArray(arr)` | Envuelve arrays JSON en `__array` y fusiona propiedades de sus elementos objeto. | No hay equivalente; `RuntimeLetSource.normalizeJson`. Documentar el contrato `__array` antes de cambiarlo. |
| `__parseRuntimeLetText(text)` | Lee entradas `clave=valor` separadas por lineas o comas; claves sin `=` son `true`. | No hay equivalente; `RuntimeLetSource.parseText`. |
| `__loadRuntimeLetSource(sourcePath)` | Resuelve ruta relativa a `import.meta.url`, hace `fetch`, distingue JSON/texto y cachea. | No hay equivalente; `RuntimeLetSource.load(path, baseUrl)`. Pasar `import.meta.url` desde el generado, no dentro del modulo importado: la ruta relativa debe seguir apuntando al proyecto. |

La sintaxis de bloque `let/var` sin fuente no necesita este runtime: se
convierte en declaraciones TS ordinarias. `__letSource_<aleatorio>` es un
temporal de esa conversion; `__array` es una clave de datos, no una funcion.

## Runtime generado: backups

Origen: `buildBackupRuntimeHelperLines` (aprox. 1323-1609). Actualmente
inyecta toda la infraestructura incluso si no aparece `backUp`. La API HTTP
que recibe las peticiones ya existe en `package/lib/backups.js`, montada por
`package/lib/server.js`; **no** es un modulo navegador. El nuevo cliente
propuesto seria `Code/WebGL/backupClient.ts` o `Code/Backup/backupClient.ts`,
con `BackupClient` (peticiones, rutas, serializacion) y `DrawBackupSession`
(contador/iteraciones). El codigo generado solo crearia una instancia y
llamaria metodos de alto nivel.

| Simbolo generado | Funcion actual | Ya existe / destino propuesto |
| --- | --- | --- |
| `__backupBaseUrl`, `__backupDefaultScope` | Configuracion `/api/backups` y scope inferido del parser. | API de servidor en `package/lib/backups.js`; pasar ambos al constructor `BackupClient`. |
| `__backupPad2(n)` | Rellena con cero un componente de fecha. | `BackupClient.formatStamp` (privado). |
| `__backupStamp()` | Produce fecha local `YYYYMMDDHHmm` para nombres de archivo. | `BackupClient.formatStamp`; mantener formato para compatibilidad con backups existentes. |
| `__backupSafeName(name)` | Sanitiza nombres de programa/textura/ruta. | `BackupClient.safeName`; revisar las mismas reglas que usa el servidor. |
| `__backupDefaultPath(value, varName)` | Sugiere nombre de archivo con variable, tamano, unidad, programa y fecha. | `BackupClient.defaultFileName`. |
| `__backupTexturePreview(tex, varName)` | Convierte una textura ya leida en cabecera y filas numericas de texto. | No hay equivalente en `/Code`; `BackupSerializer.texturePreview`. Mantener el formato visible y la ultima linea JSON. |
| `__backupNormalizeScopePath(pathHint)` | Normaliza slashes y anade el scope por defecto; indica si el destino es directorio. | `BackupClient.resolvePath`. |
| `__backupReadTexture2D(tex)` | Crea FBO temporal, adjunta textura y llama `gl.readPixels` para devolver datos/metadata. | `webglMan.ts` ya aporta `texture.read(...)` (aprox. linea 286) y `FrameBuffer.readColorAttachment(...)` (aprox. 1097). Adaptar a una de esas APIs y comprobar formatos/canales antes de retirar el FBO temporal. |
| `__backupSerializeValue(value, varName)` | Serializa textura como vista de matriz + JSON; typed arrays como JSON; otros valores como JSON/string. | `BackupSerializer.serialize`. |
| `__backupNormalizeValue(value, varName)` | Produce `{varName,value}` para uniforms, entradas y texturas, leyendo GPU si procede. | `BackupSerializer.normalize`. |
| `__backupPut(route, path, content, extra)` | Envia `PUT` JSON al servidor y procesa respuesta/error. | `BackupClient.put`; servidor en `package/lib/backups.js`. |
| `__backupStore(value, varName, pathHint)` | Implementa `backUp store`, genera ruta y persiste un valor. | `BackupClient.store`. |
| `__backupFetchText(pathHint)` | Hace `GET /file` y devuelve texto. | `BackupClient.fetchText`. |
| `__backupDecodeValue(text)` | Extrae el JSON de la ultima linea; si falla, intenta numeros como `Float32Array`. | `BackupSerializer.decode`. |
| `__backupRestoreInto(target, pathHint)` | Restaura textura via `fill`, typed array o valor normal. | `BackupClient.restoreInto`; `texture.fill(...)` ya existe en `webglMan.ts` (aprox. linea 261). |
| `__backupLog(pathHint)` | Sustituye `console.log/warn/error` para anexar mensajes al backup. | `BackupClient.captureConsole`; requiere politica explicita de restauracion para no envolver `console` repetidamente. |
| `__backupDrawGenerationState` | Estado de stamp, contadores y scopes limpiados. | Estado de instancia de `DrawBackupSession`, no variable global. |
| `__backupRefreshGenerationState()` | Reinicia contadores al cambiar `tauModelStamp` durante `recomputeTau`. | `DrawBackupSession.beginGeneration(stamp)`; el llamador debe pasar el stamp y evitar dependencia oculta de nombres de `parseTextC23`. |
| `__backupClearDrawScopeGenerationsIfNeeded(pathHint)` | Solicita `/clear-generations` una vez por scope en la recomputacion actual. | `DrawBackupSession.clearScopeOnce`; servidor ya ofrece la ruta. |
| `__backupNextDrawGeneration(drawKind, pathHint, program)` | Calcula iteracion por scope, programa y modo de draw. | `DrawBackupSession.nextIteration`. |
| `__backupResolveMultiTarget(pathHint, defaultStem, suffix, generation)` | Construye rutas para uniforms y cada textura; iteraciones posteriores van a `/2`, `/3`, etc. | `DrawBackupSession.resolveArtifactPath`; mantener compatibilidad con el lector de backups de la extension. |
| `__backupStoreDrawBlock(drawKind, pathHint, outputs, uniforms, program)` | Captura entradas, uniforms y todas las salidas del draw; guarda cada archivo en orden y tolera errores parciales. | `DrawBackupSession.captureDraw`; el parser solo debe construir las expresiones de entradas y llamar el metodo. |

`transpileDrawCallBlock` emite `void __backupStoreDrawBlock(...)` para todos
los modos de `DRAW_BLOCK_MODES` con `backUp:`. `transpileSimpleStatement`
emite `__backupStore`, `__backupRestoreInto` y `__backupLog` para los comandos
sueltos. `transpileTex2DResourceLine` anota cada textura con
`__backupVarName`, `__backupUniformName` y `__backupProgram`: son metadata de
objeto, no funciones, pero el nuevo cliente debe seguir leyendolas. La
serializacion/lectura GPU puede bloquear; no cambiar a lectura asincrona sin
revisar el orden de captura y el contrato del servidor.

## Runtime ya separado y temporales generados

| Simbolo | Situacion | Propuesta |
| --- | --- | --- |
| `__prepareMathFunction` | Ya es funcion exportada en `Code/opengl/opengl.ts`; compila callbacks para `createIdealMesh`. El interprete tiene otra `prepareMathFunction` mas completa con contexto. | Mantener compatibilidad mientras se unifican contratos; separar en `Code/WebGL/mathCallback.ts` solo si ambos consumidores pueden usar la misma semantica. |
| `__mountGlobalBlocks` | Ya es funcion exportada en `Code/opengl/opengl.ts`; ordena y registra bloques globales en `addFunc`. | Renombrar/importar desde un modulo de scheduler (`Code/Start/...`) cuando se cambie el API; no volver a inyectar su cuerpo. |
| `__loadProgramWithShaderFilters` | Ya es funcion exportada en `Code/opengl/opengl.ts`, usada como compatibilidad para cargar shaders filtrados. | Reutilizar la carga `loadShaders`/`WebProgram.loadProgram`; no crear otro cargador. |
| `__globalBlocks`, `__globalBlockFn_<n>` | Array y callbacks generados para bloques globales con prioridad. | La logica de orden ya esta en `__mountGlobalBlocks`; emitir solo registros de callbacks. |
| `__data`, `__dim`, `__sz`, `__fmt`, `__src`, `__arr`, `__out`, `__i`, `__target`, `__values` | Variables locales de IIFE para atributo inferido, viewport, dimension `]b`, vector uniform y transferencia textura->array. | Mantener en el codigo de la sentencia o sustituir IIFE por llamadas pequenas a APIs existentes; no son helpers globales. |
| `__drawFBO_<n>`, `__fbo_<n>`, `__tplFBO_<n>`, `__meshTexTmp`, `__ctx_<alias>` | Nombres generados para framebuffer, textura temporal y contexto dinamico de `MeshFillerProgram`. | Nombres privados deterministas (contador por parse) facilitarian depuracion; el comportamiento real usa `WebProgram`/`FrameBuffer`/`MeshFillerProgram`. |
| `__recompute__`, `__backupType`, `__array` | Literales/etiquetas de datos, no funciones. | Mantenerlos documentados en tipos compartidos de backup y let. |

`WebProgram.createTexture2D`, `texture.fill/read`, `WebProgram.uNum/uVec`,
`WebProgram.cFrameBuffer`, `FrameBuffer.bindColorBuffer`,
`FrameBuffer.readColorAttachment`, `VAO.attribute` y los draw methods ya
residen en `Code/WebGL/webglMan.ts`. El parser debe seguir emitiendo llamadas
a estas APIs; no duplicar su implementacion en snippets.

## Metodos de `DetailedParser`: inventario por responsabilidad

Estos corren durante el parseo/transpilado (salvo la ruta de interpretacion
directa al final). La extraccion de un metodo a otro archivo es distinta de
extraer codigo que se emite al TS: las primeras son herramientas **Node/build**;
las segundas son libreria **browser/runtime**.

### Tokenizacion, expresiones y valores

| Metodo(s) | Funcion |
| --- | --- |
| `extractRootIdentifiersFromExpr`, `extractContextNamesFromCallback` | Detectan identificadores de contexto en expresiones/callbacks. |
| `joinIndentedLines`, `parseBlockParams`, `parseBlockHeader` | Normalizan lineas y reconocen cabeceras/parametros de bloques DSL. |
| `stripInlineComment`, `stripInlineDslTags` | Retiran comentarios y etiquetas embebidas sin romper cadenas/rutas. |
| `splitTopLevelByChar`, `splitTopLevelArrow`, `splitTopLevelAssignLE`, `splitByWhitespaceTopLevel`, `splitParamsAndChainTokens`, `collectCommaSeparatedEntries` | Separan tokens respetando parentesis, corchetes, llaves y comillas. |
| `transpileExpr`, `normalizeTexUnitToken`, `transpileSizeToken`, `transpileTextureFormatToken`, `normalizeTextureEnumToken` | Convierten expresiones, unidades, dimensiones (incluido `]b`) y formatos/filtros/wrap. |
| `appendSemicolon` | Completa sentencias TS simples. |

Destino sugerido: `Code/WebGL/parser/dslLexer.ts` para escaneo/split y
`dslExpressions.ts` para conversiones. No existe un lexer equivalente en
`/Code`; no mezclar estas reglas con `WebProgram`.

### Filtros de shader

| Metodo(s) | Funcion |
| --- | --- |
| `parseShaderFilterTokenValue`, `parseShaderFilterSpec`, `loadShaderFiltersFromLines` | Parsean y cargan reglas para la ruta de ejecucion directa. |
| `transpileShaderFilterToken`, `loadTranspileShaderFiltersFromLines` | Conservan las expresiones de reglas para el TS generado. |
| `shaderFilePatternMatches`, `applyShaderFilterMatch`, `buildShaderFilter` | Aplican reglas en la ruta directa. |
| `extractShaderFilterLines` | Saca el bloque `glslFilters` antes de parsear el resto. |
| `createShaderFromSource`, `createProgramFromSources`, `loadProgramWithShaderFilters` | Compilan/enlazan GLSL en la ruta directa. `opengl.ts` ya tiene carga/compilacion equivalente. |
| `transpileShaderFilterFactory`, `buildTranspiledShaderFilterRulesSource`, `buildTranspiledShaderFilterHelperLines` | Construyen las reglas y el helper inyectado descritos arriba. |

Destino sugerido: `parser/glslFilterSyntax.ts` (build) + `ShaderFilterSet`
(browser). Comparar primero diferencias entre la ruta directa y la generada.

### Recursos, GPU y bloques draw

| Metodo(s) | Funcion |
| --- | --- |
| `parseUniformSnapshotEntry` | Extrae nombre/valor de uniform para el backup del draw. |
| `transpileResourceBlock`, `transpileTex2DResourceLine` | Transforman presets `resource` y creacion `tex2D`; registran aliases y metadata de backup. |
| `transpileProgramBlock`, `transpileProgramObject` | Crean/cargan programas WebGL y sus aliases. |
| `transpileRebindBlock` | Reconecta texturas a unidades/uniforms. |
| `transpileFramebufferBlock`, `transpileFramebufferInline`, `transpileUnbindFBOBlock` | Emiten creacion, attachment, bind y unbind de FBO. |
| `transpileAttributeLines` | Declara atributos VAO con tipo/dimension/columnas. |
| `transpileDrawCallBlock` | Analiza modo, atributos o textura de cabecera, viewport, outputs, uniforms/rebind/attributes y backup; emite draw. |
| `transpileUniformLine`, `transpileUniformVectorExpr` | Emiten setters de uniforms escalares/vectoriales y expansion de componentes. |

Destino sugerido: `parser/webglResources.ts`, `parser/drawBlocks.ts` y
`parser/uniforms.ts`. La emision final debe llamar a `webglMan.ts`, que ya
implementa el trabajo GPU. `transpileDrawCallBlock` es prioritario: hoy mezcla
parseo de sintaxis, preparacion GPU y serializacion de backups.

### Objetos de alto nivel y sentencias

| Metodo(s) | Funcion |
| --- | --- |
| `extractAliasesAndCore`, `ensureAliasesForClass` | Separan aliases de la definicion y crean uno si falta. |
| `transpileCamera3DObject` | Construye `Camera3D` desde parametros DSL. Ya existe `Code/Game3D/Game3D.ts`. |
| `transpileTexture2DArrayObject` | Llama a `WebProgram.texture2DArray`; ya existe en `webglMan.ts`. |
| `transpileCapsuleObject` (antes `transpileMeshProgramObject`, `transpileAxis3DGroupObject`, `transpileMeshFillerProgramObject`) | Instancia las clases definidas en `parser/registryModules/capsules.ts`, con alias, chaining y contexto. |
| `transpileEscapedDestructuring` | Convierte asignacion multiple con llamada `$fn$`. |
| `transpileCreateIdealMesh` | Compila callback matematico y llama a `createIdealTexture` del programa. |
| `transpileSimpleStatement` | Despachador de `<=`, `let`, `use`, `viewport`, `logFBO`, backups, start, log, objetos y fallback TS. |
| `transpileGroupedLetBlock` | Emite variables locales o carga de fuente remota de let. |

Destino sugerido: `parser/objectConstructors.ts` y
`parser/statementEmitter.ts`; `transpileSimpleStatement` deberia delegar por
tipo de nodo/sentencia, sin mover las clases WebGL existentes.

### Archivos, imports, secciones y orquestacion

| Metodo(s) | Funcion |
| --- | --- |
| `isBackupPathReplaceDirective`, `inferBackupDefaultScope` | Detectan la directiva de ruta e infieren scope; `package/runner.cjs` tambien resuelve imports/reemplazos. |
| `getNodeRequire`, `readFileSafe`, `writeFileSafe` | Acceso a archivos desde Node con fallback dinamico. Son de build, no navegador. |
| `resolveParseTextImports` | Resuelve imports `.txt` del parser; el paquete resuelve ademas imports `.shaderdsl.ts`. |
| `extractPreservedSections` | Recupera contenido de anchors del TS previo en la ruta directa. |
| `extractImportsFromMain`, `ensureWebglCapsulesImport`, `ensureOpenGLHelpersImport` | Copian y completan imports TS de `main.ts`. El runner del paquete hace otra insercion de imports. |
| `transpileToFile` | Coordina el parseo a TS: estado, stack de bloques, helpers, marcadores y escritura. |
| `parse` | Elige entre transpilacion a archivo e interpretacion directa. |

Destino sugerido: `parser/importResolver.ts`, `parser/sectionPreserver.ts`,
`parser/transpileSession.ts` y `parser/nodeFileAccess.ts`. Unificar con
`package/runner.cjs` antes de extraer: hay dos resolutores de imports.

### Interprete directo (no se inyecta como TS)

| Metodo(s) | Funcion |
| --- | --- |
| `ObjectRegistry` (`Program`, `MeshProgram`, `SolidMeshProgram`, `MeshFillerProgram`, `Axis3DGroup`, `Camera3D`) | Construye objetos para interpretacion inmediata; implementaciones finales en `webglMan.ts`, `parser/registryModules/capsules.ts`, `Game3D.ts`. |
| `FunctionRegistry` (`createIdealMesh`, `fillMeshTexture`, `draw`, `viewport`, `depthTest`, `start`, `startAsync`, `log`, `let`, `lduse`, `use`, `uMat4/uMat3/uMat2/uVec/uNum/uFloat/uInt`, `cFrameBuffer`, `unbindFrameBuffer`, `unbindFBO`, `drawArrays`, `drawElements`, `texture2DArray`) | Despacha comandos inmediatos a objetos/funciones ya existentes; algunos, como `log`, son stub. |
| `getVar`, getters/setters `ctx`, `gctx`, `lastUsedProgram`, `lastFillerProgram` | Consultan estado mutable del interprete. |
| `prepareMathFunction` (y su `replacePowers` interno), `parseValue` | Compilan callbacks con contexto y convierten literales DSL. La version `__prepareMathFunction` de `opengl.ts` no es identica. |
| `prepareAction`, `createSimpleAction`, `createCallAction`, `chooseActionForLine`, `compileJsBlock` | Preparan callbacks de comandos/condiciones para ejecucion directa. |
| `executeEvalBlock` | Ejecuta bloques inmediatos con contexto dinamico. |
| `parseObjectDef`, `executeChain`, `splitChain`, `parseFncCall`, `prepareChainAction` | Crean objetos, parsean cadenas y llaman metodos en la ruta directa. |

Destino sugerido: `parser/directInterpreter.ts` con `InterpreterContext` por
instancia. Revisar cuidadosamente `new Function` y `with` antes de cambiar
semantica; este interprete no es el mismo runtime que el TS generado.

## Snippets que anaden funciones al TS

El runner inserta `parser_snippets/<id>/*.snippet.ts` y puede insertar los
`shared` por configuracion. Los `__*` siguientes proceden de snippets,
**no** de `buildBackupRuntimeHelperLines`. Si se extraen, usar imports del
snippet/wrapper y pasar dependencias explicitas (`gl`, texturas, DOM, estado).

| Archivo / grupo | Funciones y papel | Ya existe / destino sugerido |
| --- | --- | --- |
| `src/parser_snippets/c1/01_fullscreen_bridge.snippet.ts` | `__applyCanvasFullscreenC1`: ajusta canvas/estilos al entrar o salir de fullscreen. | `openFullscreen` ya existe en `Code/Game/Game.ts`; sincronizacion de tamano/estilos a `Code/Game/canvasFullscreen.ts` o modulo del ejemplo. |
| `src/parser_snippets/c23/01_overlay_controls.snippet.ts`: datos | `__safeCfg` captura configuracion opcional; `__ensureTauDataLoaded` carga serie; `__clearAOverride` limpia override; `__projectChromatinSeries` proyecta eje; `__initTauAxisDefaults` inicia seleccion. | Funcionalidad de dominio tau; `TauDataController` del proyecto, no parser general. |
| Mismo archivo: controles | `__applyChromTauState`, `__applyChromTau` cambian cromatina/tau; `__isEditingBestInputs`, `__syncBestInputs` protegen y sincronizan formulario; `__publishPanelBest`, `__copyCandidateFromOtherPanel` comparten seleccion; `__requestTauRecompute` dispara calculo; `__getRankMode`, `__gotoRankedCandidate`, `__applyBestTauSubseq` manejan ranking; `__initTauControls` crea DOM; `__tauCtlTimer` sincroniza periodicamente. | `TauControls` + `TauSelectionStore` con estado por panel. No hay clase equivalente en `/Code`. |
| `src/parser_snippets/c23/02_texture_reads_and_rank.snippet.ts` | `__readTexRange`, `__readTexRow`, `__readTexPixel`, `__readTexRect` leen GPU; `__updateHudRanges` calcula rangos; `__getRankedCandidates` ordena candidatos. | `texture.read` y `FrameBuffer.readColorAttachment` ya existen en `webglMan.ts`; usar un adaptador `TextureInspector` compartible y un `TauCandidateRanker` de dominio. |
| `src/parser_snippets/c23/03_simulation_bridge.snippet.ts`: simulacion | `__sampleSindy` interpola, `__safeNum` sanea, `__simulateAxisPath` integra trayectoria, `__simulateAxisFromCoeffs` y `__simulateAxisFromSindyRow` aportan evaluadores. | `TauTrajectorySimulator` en modulo del proyecto; no hay equivalente en `/Code`. |
| Mismo archivo: estadistica/puente | `__collectMeanAxisCoeffs` promedia coeficientes, `__measureAxisSeries` mide escala, `__rowHasSignal` detecta datos, `__estimateAxisGain` ajusta magnitud, `__publishSimTrajectoryFromTau` publica resultado entre canvases. | `TauModelSummary` y `TauPanelBridge`; sustituir `window` global por canal/estado explicito. |
| `src/parser_snippets/c23/04_msd_and_draw.snippet.ts`: MSD | `__calcMSD1DSeries` calcula MSD; `__msdNow` toma tiempo; `__fmtHud` formatea; `__publishMSDProgress`, `__setMSDProgress`, `__updateMSDProgressTick` gestionan progreso; `__buildMSDScoreAxisJob`, `__stepMSDScoreAxisJob`, `__getMSDAxisPack`, `__refreshMSDScoreDisplay` construyen/avanzan el mapa de score. | `TauMsdJob` + `TauMsdProgress` del proyecto; no duplicar en el parser. |
| Mismo archivo: dibujo | `__ensureTauHud`, `__syncTauHud`, `__drawTauHud` crean/sincronizan/pintan overlay; `__legendColor`, `__mix3`, `__scoreColor`, `__klColor`, `__costColor`, `__msdScoreColor`, `__drawLegend` calculan paletas y leyendas; `__applyCanvasFullscreenC2/C3` adapta el panel. | `TauHudRenderer` + controlador de fullscreen; `Code/Game/Game.ts` solo cubre la llamada basica `openFullscreen`. |
| `src/parser_snippets/c23/00_pre_imports_and_async_func_wrapper.snippet.ts` | Inicializa canvas/WebGL, teclado y raton, luego inserta snippets C2/C3. No declara un helper `__*` propio; `__SNIPPET_BODY_C2/C3__` es placeholder de build. | Bootstrap del proyecto; `Game.ts` ya aporta `KeyManager` y `MouseManager`. |
| `GLSLTest/parser_snippets` y `package/templates/pointSimulation/parser_snippets` | Wrapper de canvas y arrays `trajectory` C1/C2; sin helpers `__*` propios. | Mantener como datos del ejemplo. `commonImports.snippet.ts` son imports, no runtime nuevo. |

`__SHADERDSL_ID__` y `__SNIPPET_BODY__` son placeholders de
`package/runner.cjs`, no funciones. Los identificadores `__*` que aparecen
solo en `dist/parser.cjs` pueden ser helpers internos de esbuild/TypeScript;
no son necesariamente codigo emitido por `webglParser.ts`.

## Orden prudente de extraccion

1. Definir contratos y pruebas de salida para `backUp` (estructura de archivos,
   orden, paths, generaciones, metadata, fallback de errores). Extraer
   `BackupClient`/`DrawBackupSession` sin cambiar la API HTTP.
2. Mover `let` remoto y filtros GLSL a modulos browser. Importarlos solo si
   el DSL los usa; conservar la base URL de `import.meta.url` del proyecto.
3. Separar lexer/emisor/estado de `DetailedParser` por sesion de parseo;
   eliminar mapas estaticos compartidos sin cambiar el DSL publico.
4. Mover los snippets tau a modulos **del ejemplo** con estado por canvas;
   usar lecturas existentes de `webglMan.ts` donde los formatos coincidan.
5. Mantener pruebas de la ruta `src/parsers/testParser*.ts`, del CLI
   `package/cli.test.cjs` y de C1/C2/C3 antes de retirar helpers viejos.

La meta de salida seria algo legible como `backup.captureDraw(...)`,
`letSources.load(...)` y `shaderFilters.forProgram(...)` tras imports claros;
el parser conservaria solo el reconocimiento de sintaxis y la emision de
esas llamadas, no sus implementaciones.
