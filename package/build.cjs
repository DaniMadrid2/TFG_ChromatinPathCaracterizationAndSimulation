const fs = require('node:fs/promises');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const source = path.join(root, 'src', 'dependencies');

async function main() {
  await fs.mkdir(path.join(output, 'lib'), { recursive: true });
  const parser = await esbuild.build({
    entryPoints: [path.join(source, 'Code', 'WebGL', 'webglParser.ts')],
    outfile: path.join(output, 'parser.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    metafile: true,
    logLevel: 'warning',
  });
  const browser = await esbuild.build({
    entryPoints: [path.join(source, 'Code', 'WebGL', 'webglMan.ts')],
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
    const target = path.join(output, 'lib', path.relative(source, absolute));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(absolute, target);
  }
  for (const name of ['cli.cjs', 'runner.cjs', 'watch.cjs', 'initializer.cjs', 'README.md', 'EXTENSION_SYNTAX_PENDING.md']) {
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
    files: ['cli.cjs', 'runner.cjs', 'watch.cjs', 'initializer.cjs', 'parser.cjs', 'lib', 'templates', 'README.md', 'EXTENSION_SYNTAX_PENDING.md'],
    engines: { node: '>=20' },
    dependencies: { esbuild: require('esbuild/package.json').version },
  };
  await fs.writeFile(path.join(output, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Package ready: ${output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
