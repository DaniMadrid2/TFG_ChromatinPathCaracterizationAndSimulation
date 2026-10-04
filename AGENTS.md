# Shader DSL parser: source of truth

- Edit `src/dependencies/Code/WebGL/webglParser.ts` and `webglMan.ts` for changes to the default parser or WebGL runtime. Do not edit `dist/` or `GLSLTest/lib/Code/WebGL/` as the primary implementation.
- Run `npm run build:package` after changing either source file. The build bundles the parser into `dist/parser.cjs` and copies the runtime and source libraries into `dist/lib/Code/`.
- `package/runner.cjs` uses a project-local override only when **both** `lib/Code/WebGL/webglParser.ts` and `webglMan.ts` exist (also accepts the legacy `lib/WebGL/` pair). Otherwise it uses the parser and WebGL runtime bundled in `dist`, even if a stray local `.js` or one `.ts` file remains.
- `GLSLTest/lib/Code/WebGL/` is optional and exists only for deliberate project-specific overrides. Never rely on a Windows link, copy, or matching file hash to keep it synchronized with `src/dependencies/Code/WebGL/`.
- Verify the fallback by parsing a project without the local pair, for example `cd GLSLTest` and `node ../dist/cli.cjs parse .`. Tests for both the bundled fallback and the complete local override live in `package/cli.test.cjs`.
