export {};
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const tsmod = require("typescript");

async function main() {
    ensureBrowserLikeGlobals();
    const DetailedParser = await loadDetailedParser();
    const baseDir = await resolveBaseDir("parseTextC3.shaderdsl.ts");
    const outPath = await generateParserOutput(DetailedParser, baseDir);
    await patchGeneratedFiles(outPath, baseDir);
    console.log("[DetailedParser-C3] generado:", outPath);
}

function ensureBrowserLikeGlobals() {
    const g: any = globalThis as any;
    if (!g.window) g.window = {} as any;
    if (!g.document) {
        g.document = {
            createElement: () => ({} as any),
            getElementById: () => null,
            querySelector: () => null,
        } as any;
    }
    if (!g.WebGL2RenderingContext) {
        g.WebGL2RenderingContext = new Proxy({} as any, { get: () => 0 }) as any;
    }
}

async function loadDetailedParser() {
    const dynamicImport = new Function("p", "return import(p)");
    try {
        return (await dynamicImport(pathToFileURL(path.resolve(process.cwd(), "src/dependencies/Code/WebGL/webglParser.mts")).href)).DetailedParser;
    } catch {
        return (await dynamicImport(pathToFileURL(path.resolve(process.cwd(), "src/dependencies/Code/WebGL/webglParser.mjs")).href)).DetailedParser;
    }
}

async function resolveBaseDir(parseFileName: string) {
    const repoStyleDir = path.resolve("public/development/blog/02_Fisica/Fluidos/Reologia_01_Intro_a_la_reologia");
    const localStyleDir = path.join(process.cwd(), "src");
    const probePath = path.join(repoStyleDir, parseFileName);
    try {
        await fs.access(probePath);
        return repoStyleDir;
    } catch {
        return localStyleDir;
    }
}

async function ensureSeedFiles(baseDir: string, outPath: string) {
    try {
        await fs.access(outPath);
        return;
    } catch {}
    const seedTsPath = path.join(baseDir, "generated", "generatedParserC2.ts");
    const seedJsPath = path.join(baseDir, "generated", "generatedParserC2.js");
    const remap = (code: string) => code
        .replace(/generatedParserC2/g, "generatedParserC3")
        .replace(/tauHudOverlayC2/g, "tauHudOverlayC3")
        .replace(/tauControlsC2/g, "tauControlsC3")
        .replace(/__c2Host/g, "__c3Host")
        .replace(/__applyCanvasFullscreenC2/g, "__applyCanvasFullscreenC3")
        .replace(/__fsTargetC2/g, "__fsTargetC3")
        .replace(/#F2/g, "#F3")
        .replace(/"c2"/g, '"c3"')
        .replace(/data-id="c2"/g, 'data-id="c3"')
        .replace(/\[DetailedParser-C2\]/g, "[DetailedParser-C3]")
        .replace(/\bC2\b/g, "C3");
    await fs.writeFile(outPath, remap(await fs.readFile(seedTsPath, "utf8")), "utf8");
    try {
        await fs.writeFile(outPath.replace(/\.ts$/i, ".js"), remap(await fs.readFile(seedJsPath, "utf8")), "utf8");
    } catch {}
}

async function generateParserOutput(DetailedParser: any, baseDir: string) {
    const parseTextPath = path.join(baseDir, "parseTextC3.shaderdsl.ts");
    const outDir = path.join(baseDir, "generated");
    const outPath = path.join(outDir, "generatedParserC3.ts");
    const mainImportsPath = path.join(baseDir, "main.ts");
    await fs.mkdir(outDir, { recursive: true });
    await ensureSeedFiles(baseDir, outPath);
    const source = await fs.readFile(parseTextPath, "utf8");
    const text = await resolveShaderDslImports(parseTextPath);
    await DetailedParser.parse(text, null, {}, outPath, mainImportsPath, inferBackupScope(parseTextPath, source));
    return outPath;
}

function inferBackupScope(parseTextPath: string, sourceText: string) {
    if (/parseTextC23\.shaderdsl\.ts/i.test(String(sourceText || ""))) return "parseTextC23";
    if (/parseTextC23/i.test(path.basename(parseTextPath))) return "parseTextC23";
    return path.basename(parseTextPath).replace(/\.shaderdsl\.ts$/i, "");
}

async function resolveShaderDslImports(filePath: string, seen = new Set<string>()) {
    const resolvedPath = path.resolve(filePath);
    if (seen.has(resolvedPath)) {
        throw new Error(`Import circular en shaderdsl: ${resolvedPath}`);
    }
    seen.add(resolvedPath);
    const source = (await fs.readFile(resolvedPath, "utf8")).replace(/^\uFEFF/, "");
    const dir = path.dirname(resolvedPath);
    const lines = source.split(/\r?\n/);
    const out: string[] = [];
    for (const line of lines) {
        const match = line.match(/^\s*import\s*<([A-Za-z]+)>\s*from\s+(.+)\s*$/);
        if (!match) {
            out.push(line);
            continue;
        }
        let importPath = match[2].trim();
        if ((importPath.startsWith("\"") && importPath.endsWith("\"")) || (importPath.startsWith("'") && importPath.endsWith("'"))) {
            importPath = importPath.slice(1, -1);
        }
        const childPath = path.resolve(dir, importPath);
        out.push(await resolveShaderDslImports(childPath, new Set(seen)));
    }
    return out.join("\n");
}

function patchLocalWebGLManUsage(code: string) {
    let next = code;
    if (next.includes("WebGLMan.program(") || next.includes("WebGLMan.setGL(gl)")) {
        next = next.replace(/if\(!WebGLMan\.stWebGLMan\.gl\)\s*WebGLMan\.setGL\(gl\);\r?\n/g, "");
        if (!next.includes("const webglMan=new WebGLMan(gl);")) {
            next = next.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;)/, "$1\n    const webglMan=new WebGLMan(gl);");
        }
        next = next.replace(/WebGLMan\.program\(/g, "webglMan.program(");
    }
    return next;
}

function ensureCommonImports(code: string) {
    const imports = require("node:fs").readFileSync(path.join(process.cwd(), "src", "parser_snippets", "shared", "commonImports.snippet.ts"), "utf8").replace(/^\uFEFF/, "");
    if (code.includes('import {Camera2D, createCanvas, createLayer, GameObject, ImgLoader, ModernCtx, Scene,MouseManager, ListenerManager, openFullscreen, keypress, mousepos, mouseclick, KeyManager} from "/Code/Game/Game.js";')) {
        return code;
    }
    return code.replace(/(import \{ __prepareMathFunction, __mountGlobalBlocks \} from \"\/Code\/opengl\/opengl\.js\";\r?\n)/, `$1${imports}`);
}

function resolveAxisSnippet(source: string, axisIndex: number) {
    const out: string[] = [];
    const lines = source.split(/\r?\n/);
    let activeBlock: number | null = null;
    for (const line of lines) {
        const begin = line.match(/^\s*\/\/\$(\d+)\s*-\s*Begin\s*$/);
        if (begin) {
            activeBlock = parseInt(begin[1], 10);
            continue;
        }
        if (/^\s*\/\/\$\d+\s*-\s*END\s*$/.test(line)) {
            activeBlock = null;
            continue;
        }
        if (/^\s*\/\/\s*@/.test(line)) continue;
        if (activeBlock !== null && activeBlock !== axisIndex) continue;
        out.push(line.replace(/\$\[([\s\S]*?)\]\$/g, (_m: string, body: string) => {
            const parts = body.split(",");
            if (parts.length < 2) return body;
            return (parts[axisIndex] ?? parts[0]).trim();
        }));
    }
    return out.join("\n");
}

function injectGeneratedBlocks(code: string, preSnippet: string, posSnippet: string) {
    let next = code;
    if (next.includes("//</Pos>")) next = next.replace(/(\/\/\<Pos\>\s*[\s\S]*?\s*\/\/\<\/Pos\>)[\s\S]*$/m, "$1");
    if (next.includes("//<Pre>")) next = next.replace(/\/\/\<Pre\>\s*[\s\S]*?\s*\/\/\<\/Pre\>/m, `//<Pre>\n${preSnippet}\n//</Pre>`);
    if (next.includes("//<Pos>")) next = next.replace(/\/\/\<Pos\>\s*[\s\S]*?\s*\/\/\<\/Pos\>/m, `//<Pos>\n${posSnippet}\n//</Pos>`);
    return next;
}

function folderMatchesSnippetId(folderName: string, snippetId: string) {
    const a = String(folderName || "").toLowerCase();
    const b = String(snippetId || "").toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;
    let j = 0;
    for (let i = 0; i < a.length && j < b.length; i++) {
        if (a[i] === b[j]) j++;
    }
    return j === b.length;
}

async function loadSnippetParts(baseDir: string, snippetId: string) {
    const snippetsDir = path.join(baseDir, "parser_snippets");
    const dirEntries = await fs.readdir(snippetsDir, { withFileTypes: true });
    const matchedDirs = dirEntries
        .filter((entry: any) => entry.isDirectory() && folderMatchesSnippetId(entry.name, snippetId))
        .map((entry: any) => entry.name)
        .sort((a: string, b: string) => a.localeCompare(b));
    const contents: string[] = [];
    for (const dirName of matchedDirs) {
        const fullDir = path.join(snippetsDir, dirName);
        const fileEntries = await fs.readdir(fullDir, { withFileTypes: true });
        const files = fileEntries
            .filter((entry: any) => entry.isFile() && /\.snippet\.ts$/i.test(entry.name) && entry.name !== "00_pre_imports_and_async_func_wrapper.snippet.ts")
            .map((entry: any) => entry.name)
            .sort((a: string, b: string) => a.localeCompare(b));
        for (const fileName of files) {
            contents.push(await fs.readFile(path.join(fullDir, fileName), "utf8"));
        }
    }
    return contents.join("\n\n");
}

async function loadPreTemplate(baseDir: string, snippetId: string) {
    const snippetsDir = path.join(baseDir, "parser_snippets");
    const dirEntries = await fs.readdir(snippetsDir, { withFileTypes: true });
    const matchedDirs = dirEntries
        .filter((entry: any) => entry.isDirectory() && folderMatchesSnippetId(entry.name, snippetId))
        .map((entry: any) => entry.name)
        .sort((a: string, b: string) => a.localeCompare(b));
    for (const dirName of matchedDirs) {
        const fullPath = path.join(snippetsDir, dirName, "00_pre_imports_and_async_func_wrapper.snippet.ts");
        try {
            return await fs.readFile(fullPath, "utf8");
        } catch {}
    }
    throw new Error(`No se encontrÃ³ 00_pre_imports_and_async_func_wrapper.snippet.ts para ${snippetId}`);
}

async function buildPreSnippet(baseDir: string, snippetBody: string) {
    const template = resolveAxisSnippet(await loadPreTemplate(baseDir, "c3"), 1);
    return template.replace("__SNIPPET_BODY_C3__", snippetBody);
}

function normalizeCanvasTargets(code: string) {
    return code
        .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
        .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas");
}

function transpileTypeScript(code: string) {
    return tsmod.transpileModule(code, {
        compilerOptions: {
            target: tsmod.ScriptTarget.ES2020,
            module: tsmod.ModuleKind.ES2020,
            removeComments: false
        }
    }).outputText.replace(/^export \{\};\s*/m, "");
}

function sanitizeBrokenTail(code: string) {
    return code
        .replace(/\n\(\);\s*\n\/\/\<\/Pos\>/g, "\n//</Pos>")
        .replace(/\n\(\);\s*$/g, "\n");
}

async function patchGeneratedFiles(outPath: string, baseDir: string) {
    let outCode = await fs.readFile(outPath, "utf8");
    outCode = ensureCommonImports(outCode);
    outCode = patchLocalWebGLManUsage(outCode);
    const fsSnippet = resolveAxisSnippet(await loadSnippetParts(baseDir, "c3"), 1);
    outCode = injectGeneratedBlocks(outCode, await buildPreSnippet(baseDir, fsSnippet), `})();`);
    outCode = normalizeCanvasTargets(outCode);
    await fs.writeFile(outPath, outCode, "utf8");
    const jsCode = sanitizeBrokenTail(transpileTypeScript(outCode));
    await fs.writeFile(outPath.replace(/\.ts$/i, ".js"), jsCode, "utf8");
}

main().catch((err) => {
    console.error("[DetailedParser-C3] error al transpilar:", err);
    process.exit(1);
});


