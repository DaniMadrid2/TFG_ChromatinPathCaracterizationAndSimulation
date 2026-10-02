# Sintaxis pendiente para la extension VS Code

La extension `vs_tssnippets_ext` no se ha modificado en este cambio.
Su parser y sus ayudas de edicion deben reconocer:

- `drawPoints`, `drawLines`, `drawLineStrip`, `drawLineLoop`, `drawTriangles`,
  `drawTriangleStrip` y `drawTriangleFan`, sin distinguir mayusculas.
- Cabeceras `drawLineStrip {array}`, `drawLineStrip "aPos" {array}` y
  `drawLineStrip "aPos" {array} count`, antes de `-> [...] size [...]`.
- Sufijo de tipo opcional en esas cabeceras: `drawTriangleStrip {array}vec3`
  o `drawLines "aPos" {array}ivec2 count`.
- Bloques `attributes { ... }` dentro de cualquier bloque `draw`.
- Plantillas `nombre = attributes { ... }`, reutilizables dentro de un bloque
  `attributes` por su nombre.
- Entradas `"nombre" -> {array}tipo` y `{nombre}tipo`, donde `tipo` es
  `f`, `i`, `ui`, `vec2/3/4`, `ivec2/3/4`, `uvec2/3/4` o `mat2/3/4`.

El parser del paquete es la referencia semantica. La extension no debe asumir
seis vertices cuando se proporcionan atributos sin un count explicito.
