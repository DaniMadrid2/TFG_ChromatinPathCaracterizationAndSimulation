const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');

const templates = {
  simple: 'Un canvas y un shader GLSL',
  trajectories: 'Dos trayectorias y sus medias, sin tick',
  simulation: 'Dos campos de textura con simulacion y raton',
};

async function chooseTemplate(input = process.stdin, output = process.stdout) {
  if (!input.isTTY) throw new Error('Usa --template simple|trajectories|simulation sin terminal interactiva');
  const names = Object.keys(templates);
  output.write('Elige un ejemplo Shader DSL:\n');
  names.forEach((name, index) => output.write(`  ${index + 1}. ${name}: ${templates[name]}\n`));
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question('Ejemplo [1-3]: ')).trim().toLowerCase();
    const chosen = names[Number(answer) - 1] || (answer in templates ? answer : null);
    if (!chosen) throw new Error(`Ejemplo desconocido: ${answer}`);
    return chosen;
  } finally {
    rl.close();
  }
}

async function init(options = {}) {
  const template = options.template || await chooseTemplate(options.input, options.output);
  if (!(template in templates)) throw new Error(`Ejemplo desconocido: ${template}`);
  const cwd = path.resolve(options.cwd || process.cwd());
  const target = path.resolve(cwd, options.dir === undefined ? `shaderdsl-${template}` : options.dir);
  const source = path.join(__dirname, 'templates', template);
  if (!(await fs.stat(source).catch(() => null))?.isDirectory()) throw new Error(`Plantilla no incluida: ${template}`);
  const current = await fs.readdir(target).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (current.length && target !== cwd) throw new Error(`La carpeta no esta vacia: ${target}`);
  if (target === cwd) {
    const conflicts = await Promise.all(['index.html', 'package.json', 'parseTextC1.shaderdsl.ts'].map(async (name) =>
      (await fs.stat(path.join(target, name)).catch(() => null)) ? name : null));
    if (conflicts.some(Boolean)) throw new Error(`Ya existen archivos del ejemplo: ${conflicts.filter(Boolean).join(', ')}`);
  }
  await fs.mkdir(target, { recursive: true });
  await fs.cp(source, target, { recursive: true });
  await fs.mkdir(path.join(target, 'parser_snippets'), { recursive: true });
  for (const directory of template === 'simple' ? ['shared'] : ['shared', 'c1', 'c2']) {
    await fs.mkdir(path.join(target, 'parser_snippets', directory), { recursive: true });
  }
  const packageJson = {
    name: `shaderdsl-${template}-example`,
    private: true,
    type: 'module',
    scripts: {
      parse: 'dnti_shaderdsl parse .',
      serve: 'dnti_shaderdsl serve',
    },
  };
  await fs.writeFile(path.join(target, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Ejemplo ${template} creado en ${target}`);
  console.log(`Siguiente: cd "${target}"; npm run parse; npm run serve`);
  return target;
}

module.exports = { init, chooseTemplate, templates };
