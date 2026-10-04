const fs = require('node:fs/promises');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const source = path.join(root, 'src', 'dependencies');
const { registryEntry } = require('./registry-loader.cjs');

async function main() {
  await fs.mkdir(path.join(output, 'lib'), { recursive: true });
  for (const stale of [
    'Code/WebGL/webglParser.ts',
    'Code/WebGL/webglCapsules.js',
    'Code/WebGL/webglCapsules.ts',
    'Code/WebGL/webglCapsules.d.ts',
    'Code/WebGL/registryModules',
    'Code/WebGL/runtimeFeatures',
    'Code/WebGL/parser/runtimeFeatures',
    'Code/WebGL/parser/registryModules/drawModes.ts',
    'Code/WebGL/parser/objects/index.ts',
    'Code/WebGL/parser/functions/index.ts',
    'Code/WebGL/parser/registryModules/index.ts',
    'Code/WebGL/parser/registryModules/objects.ts',
    'Code/WebGL/parser/registryModules/functions.ts',
  ]) {
    const target = path.resolve(output, 'lib', stale);
    if (!target.startsWith(path.resolve(output, 'lib') + path.sep)) throw new Error(`Invalid build path: ${target}`);
    await fs.rm(target, { recursive: true, force: true });
  }
  const parserRoot = path.join(source, 'Code', 'WebGL', 'parser');
  const parser = await esbuild.build({
    stdin: { contents: await registryEntry(path.join(parserRoot, 'webglParser.ts'), parserRoot), resolveDir: parserRoot, sourcefile: path.join(parserRoot, 'registry-entry.ts'), loader: 'ts' },
    outfile: path.join(output, 'parser.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    metafile: true,
    logLevel: 'warning',
  });
  const browser = await esbuild.build({
    entryPoints: [
      path.join(source, 'Code', 'WebGL', 'webglMan.ts'),
      path.join(source, 'Code', 'WebGL', 'runtime', 'BackupRuntime.ts'),
      path.join(source, 'Code', 'WebGL', 'runtime', 'RuntimeLetSource.ts'),
      path.join(source, 'Code', 'WebGL', 'runtime', 'ShaderFilterSet.ts'),
    ],
    outdir: path.join(output, '.runtime-probe'),
    write: false,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    logLevel: 'warning',
  });
  const localOverrideDependencies = await esbuild.build({
    entryPoints: [
      path.join(source, 'Code', 'MathRender', 'MathRender.js'),
      path.join(source, 'Code', 'MathJax', 'MathJax.js'),
    ],
    write: false,
    outdir: path.join(output, '.dependency-probe'),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    logLevel: 'silent',
  });
  const files = new Set([
    ...Object.keys(parser.metafile.inputs),
    ...Object.keys(browser.metafile.inputs),
    ...Object.keys(localOverrideDependencies.metafile.inputs),
  ]);
  for (const relative of files) {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(source + path.sep)) continue;
    if (path.basename(absolute) === 'registry-entry.ts') continue;
    const target = path.join(output, 'lib', path.relative(source, absolute));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(absolute, target);
  }
  for (const relative of ['Code/WebGL/parser/runtimeFeature.ts', 'Code/WebGL/parser/registryModules/types.ts']) {
    const target = path.join(output, 'lib', relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(source, relative), target);
  }
  const capsulesSource = await fs.readFile(path.join(parserRoot, 'registryModules', 'capsules.ts'), 'utf8');
  const capsulesJs = await esbuild.transform(capsulesSource, { loader: 'ts', format: 'esm', target: 'es2020' });
  const capsulesTarget = path.join(output, 'lib', 'Code', 'WebGL', 'parser', 'registryModules', 'capsules.js');
  await fs.mkdir(path.dirname(capsulesTarget), { recursive: true });
  await fs.writeFile(capsulesTarget, capsulesJs.code);
  for (const name of ['cli.cjs', 'runner.cjs', 'registry-loader.cjs', 'watch.cjs', 'initializer.cjs', 'tutorial.cjs', 'README.md', 'EXTENSION_SYNTAX_PENDING.md']) {
    await fs.copyFile(path.join(__dirname, name), path.join(output, name));
  }
  await fs.mkdir(path.join(output, 'lib'), { recursive: true });
  await fs.copyFile(path.join(__dirname, 'lib', 'server.js'), path.join(output, 'lib', 'server.js'));
  await fs.copyFile(path.join(__dirname, 'lib', 'backups.js'), path.join(output, 'lib', 'backups.js'));
  await fs.copyFile(path.join(__dirname, 'lib', 'elevation.js'), path.join(output, 'lib', 'elevation.js'));
  await fs.mkdir(path.join(output, 'lib', 'DNTI_Templates', '00_Canvas_Snippet_Creator'), { recursive: true });
  await fs.mkdir(path.join(output, 'lib', 'DNTI_Templates', 'LinearAlgebra'), { recursive: true });
  await fs.copyFile(path.join(source, 'DNTI_Templates', '00_Canvas_Snippet_Creator', 'Canvas_On_Page.js'),
    path.join(output, 'lib', 'DNTI_Templates', '00_Canvas_Snippet_Creator', 'Canvas_On_Page.js'));
  await fs.copyFile(path.join(__dirname, 'lib', '2DLinear.js'),
    path.join(output, 'lib', 'DNTI_Templates', 'LinearAlgebra', '2DLinear.js'));
  await fs.cp(path.join(__dirname, 'templates'), path.join(output, 'templates'), { recursive: true });
  await fs.cp(path.join(__dirname, 'tutorials'), path.join(output, 'tutorials'), { recursive: true });
  const commonImports = await fs.readFile(path.join(root, 'src', 'parser_snippets', 'shared', 'commonImports.snippet.ts'), 'utf8');
  for (const [name, extras] of Object.entries({
    simple: '',
    trajectories: 'import { drawTrajectory } from "../lib/trajectory.ts";\n',
    simulation: 'import { initializeFields, presentField } from "../lib/fields.ts";\n',
  })) {
    const target = path.join(output, 'templates', name, 'parser_snippets', 'shared', 'commonImports.snippet.ts');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, commonImports.trimEnd() + '\n' + extras);
  }
  const packageJson = {
    name: 'dnti_shaderdsl',
    version: '0.1.0',
    description: 'Shader DSL parser and browser bundle generator',
    main: 'runner.cjs',
    bin: { dnti_shaderdsl: './cli.cjs' },
    files: ['cli.cjs', 'runner.cjs', 'registry-loader.cjs', 'watch.cjs', 'initializer.cjs', 'tutorial.cjs', 'parser.cjs', 'lib', 'templates', 'tutorials', 'README.md', 'EXTENSION_SYNTAX_PENDING.md'],
    engines: { node: '>=20' },
    dependencies: { esbuild: require('esbuild/package.json').version },
  };
  await fs.writeFile(path.join(output, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Package ready: ${output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
