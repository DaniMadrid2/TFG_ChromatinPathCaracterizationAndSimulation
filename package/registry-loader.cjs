const fs = require('node:fs/promises');
const path = require('node:path');

async function registryEntry(parserFile, registryRoot) {
  const imports = [`import { DetailedParser } from ${JSON.stringify(parserFile)};`];
  const add = (file, prefix) => {
    const name = `${prefix}${imports.length}`;
    imports.push(`import * as ${name} from ${JSON.stringify(file)};`);
    return name;
  };
  const read = async (folder, excludes = []) => (await fs.readdir(path.join(registryRoot, folder), { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.ts') && !excludes.includes(entry.name))
    .map(entry => path.join(registryRoot, folder, entry.name)).sort();
  const objects = (await read('objects', ['index.ts'])).map(file => add(file, 'object'));
  const functions = (await read('functions', ['index.ts'])).map(file => add(file, 'function'));
  const modules = (await read('registryModules', ['index.ts', 'types.ts']))
    .map(file => add(file, 'module'));
  const group = (id, members, field) =>
    `{ id: ${JSON.stringify(id)}, register: (parser, services) => { const parts = [${members.map(name => `${name}.register`).join(',')}].map(register => register(parser, services)); return { id: ${JSON.stringify(id)}, ${field}: Object.assign({}, ...parts.map(part => part.${field} || {})), namedParamsOnly: parts.flatMap(part => part.namedParamsOnly || []) }; } }`;
  return [
    ...imports,
    `DetailedParser.registryDefinitions = [${group('objects', objects, 'objects')}, ${group('functions', functions, 'functions')}, ${modules.join(',')}];`,
    'export { DetailedParser };',
  ].join('\n');
}

module.exports = { registryEntry };
