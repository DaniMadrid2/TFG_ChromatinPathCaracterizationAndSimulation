const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');

const chapters = [
  ['01_basics', 'Anclas, let, tick y draw'],
  ['02_programs_textures', 'Programas, resources y texturas'],
  ['03_draw_modes', 'Puntos, lineas y triangulos'],
  ['04_uniforms', 'Uniforms y plantillas'],
  ['05_rebind', 'Rebind y rebind temporal'],
  ['06_attributes', 'Atributos de vertices'],
  ['07_gpu_commands', 'Framebuffer, viewport y draw GPU'],
  ['08_transfers', 'Transferencias con <= y tamanos b'],
  ['09_pingpong', 'Swap, <=> y pingpong'],
  ['10_backups', 'Backups e iteraciones'],
  ['11_snippets_imports', 'Snippets e imports Shader DSL'],
  ['12_mesh_capsule', 'MeshCapsule: malla y camara'],
  ['13_mesh_capsule_draw', 'MeshCapsule: dibujo y actualizacion'],
  ['14_derived', 'Derived y variables calculadas'],
  ['15_texunit_colors', 'TexUnit y colores de la extension'],
  ['16_glsl_filters', 'Sustituciones GLSL con glslFilters'],
  ['17_events_blocks', 'OnKeyPress y bloques globales'],
];

async function tutorial({ chapter, cwd = process.cwd(), input = process.stdin, output = process.stdout } = {}) {
  output.write(chapters.map(([folder, title], index) => `${index + 1}. ${title} (${folder})`).join('\n') + '\n');
  if (chapter === undefined) {
    if (!input.isTTY) throw new Error('Indica un capitulo: dnti_shaderdsl tutorial 1');
    const rl = readline.createInterface({ input, output });
    try { chapter = Number((await rl.question('Capitulo: ')).trim()); }
    finally { rl.close(); }
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters.length) throw new Error(`Capitulo invalido: ${chapter}`);
  const folder = chapters[chapter - 1][0];
  const destination = path.join(cwd, folder);
  try { await fs.mkdir(destination); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`La carpeta ya existe: ${destination}`);
    throw error;
  }
  const base = path.join(__dirname, 'tutorials', '_shared');
  const source = path.join(__dirname, 'tutorials', folder);
  try {
    await fs.cp(base, destination, { recursive: true });
    await fs.cp(source, destination, { recursive: true, force: true });
  } catch (error) {
    await fs.rm(destination, { recursive: true, force: true });
    throw error;
  }
  output.write(`Capitulo ${chapter}: ${destination}\n`);
  return destination;
}

module.exports = { chapters, tutorial };
