export {};
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const tsmod = require("typescript");


async function main() {
    ensureBrowserLikeGlobals();
    const DetailedParser = await loadDetailedParser();
    const baseDir = await resolveBaseDir("parseText2.shaderdsl.ts");
    const outPath = await generateParserOutput(DetailedParser, baseDir);
    await patchGeneratedFiles(outPath, baseDir);
    console.log("[DetailedParser] generado:", outPath);
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

async function generateParserOutput(DetailedParser: any, baseDir: string) {
    const parseTextPath = path.join(baseDir, "parseText2.shaderdsl.ts");
    const outDir = path.join(baseDir, "generated");
    const outPath = path.join(outDir, "generatedParser.ts");
    const mainImportsPath = path.join(baseDir, "main.ts");
    await fs.mkdir(outDir, { recursive: true });
    const text = await fs.readFile(parseTextPath, "utf8");
    await DetailedParser.parse(text, null, {}, outPath, mainImportsPath);
    return outPath;
}

function ensureCommonImports(code: string) {
    const imports = require("node:fs").readFileSync(path.join(process.cwd(), "src", "parser_snippets", "shared", "commonImports.snippet.ts"), "utf8").replace(/^\uFEFF/, "");
    if (code.includes('import {Camera2D, createCanvas, createLayer, GameObject, ImgLoader, ModernCtx, Scene,MouseManager, ListenerManager, openFullscreen, keypress, mousepos, mouseclick, KeyManager} from "/Code/Game/Game.js";')) return code;
    return code.replace(/(import \{ __prepareMathFunction, __mountGlobalBlocks \} from \"\/Code\/opengl\/opengl\.js\";\r?\n)/, `$1${imports}`);
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

function resolveSnippetPlain(source: string) {
    const out: string[] = [];
    for (const line of source.split(/\r?\n/)) {
        if (/^\s*\/\/\s*@/.test(line)) continue;
        out.push(line);
    }
    return out.join("\n");
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
            .filter((entry: any) => entry.isFile() && /\.snippet\.ts$/i.test(entry.name))
            .map((entry: any) => entry.name)
            .sort((a: string, b: string) => a.localeCompare(b));
        for (const fileName of files) {
            contents.push(await fs.readFile(path.join(fullDir, fileName), "utf8"));
        }
    }
    return contents.join("\n\n");
}

function injectFullscreenSnippet(code: string, snippet: string) {
    if (code.includes("__applyCanvasFullscreenC1")) {
        return code.replace(/const __fsTargetC1[\s\S]*?window\.addEventListener\("resize", __applyCanvasFullscreenC1\);\r?\n/, snippet + "\n");
    }
    return code.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;[^\n]*\r?\n)/, `$1${snippet}`);
}

function normalizeFullscreenTargets(code: string) {
    return code
        .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
        .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas")
        .replace(/let fsTarget=canvas as any;/g, "let fsTarget=canvas as any;")
        .replace(/const fsTarget = canvas as any;/g, "const fsTarget = canvas as any;");
}

function patchSimTextureArtifacts(code: string) {
    return code
        .replace(/simTexX\s*=\s*texture2DArray\s*RFloat\s*\(simArrX\)\s*"simX"\s*"TexUnit30";\s*\r?\n\s*\(simN\)x\(1\)x\(1\);/g, `simTexX=(d as any).texture2DArray({
                format: TexExamples.RFloat,
                data: simArrX,
                name: "simX",
                texUnit: "TexUnit30",
                size: [simN,1,1]
            });`)
        .replace(/simTexY\s*=\s*texture2DArray\s*RFloat\s*\(simArrY\)\s*"simY"\s*"TexUnit31";\s*\r?\n\s*\(simN\)x\(1\)x\(1\);/g, `simTexY=(d as any).texture2DArray({
                format: TexExamples.RFloat,
                data: simArrY,
                name: "simY",
                texUnit: "TexUnit31",
                size: [simN,1,1]
            });`)
        .replace(/var sx = \(\(window as any\)\.simDataX\);[\s\S]*?var simN = \(Math\.max\(2,Math\.min\(simArrX\.length,simArrY\.length\)\)\);/g, `var sx = ((window as any).simDataX);
    var sy = ((window as any).simDataY);
    if(sx && sy){
    var simPair = ((()=>{
        const simArrXLocal = sx instanceof Float32Array ? sx : new Float32Array(sx);
        const simArrYLocal = sy instanceof Float32Array ? sy : new Float32Array(sy);
        const projMeta = ((window as any).__tauProjectionMeta || null);
        if(projMeta && projMeta.mode === "pca"){
            const recN = Math.max(2, Math.min(simArrXLocal.length, simArrYLocal.length));
            const backX = new Float32Array(recN);
            const backY = new Float32Array(recN);
            const cx = Number.isFinite(projMeta.centerX) ? projMeta.centerX : 0;
            const cy = Number.isFinite(projMeta.centerY) ? projMeta.centerY : 0;
            const vx = Number.isFinite(projMeta.vx) ? projMeta.vx : 1;
            const vy = Number.isFinite(projMeta.vy) ? projMeta.vy : 0;
            const wx = Number.isFinite(projMeta.wx) ? projMeta.wx : 0;
            const wy = Number.isFinite(projMeta.wy) ? projMeta.wy : 1;
            for(let i=0;i<recN;i++){
                const a0 = Number.isFinite(simArrXLocal[i]) ? simArrXLocal[i] : 0;
                const a1 = Number.isFinite(simArrYLocal[i]) ? simArrYLocal[i] : 0;
                backX[i] = cx + a0 * vx + a1 * wx;
                backY[i] = cy + a0 * vy + a1 * wy;
            }
            return { x: backX, y: backY };
        }
        return { x: simArrXLocal, y: simArrYLocal };
    })());
    var simArrX = (simPair.x);
    var simArrY = (simPair.y);
    var simN = (Math.max(2,Math.min(simArrX.length,simArrY.length)));`);
}

function patchGetDataArraysLocals(code: string) {
    return code
        .replace(
`function getDataArrays(data:[number,number][][]):[Float32Array,Float32Array] {
  
    //data => [number,number][2352][52]
    nCromatins=data.length;
    NMuestras=data[0].length;
    // drawDataCount=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    drawDataCount=NMuestras*nCromatins;
    console.log(drawDataCount);
    let datX=new Float32Array(drawDataCount);
    let datY=new Float32Array(drawDataCount);
    loadData:for (let i = 0; i < nCromatins; i++) {
        for (let j = 0; j < NMuestras; j++) {
            // if(i==0&&j<100) console.log(data[i][j])
            if(i*NMuestras+j>drawDataCount) break loadData;
            datX[i*NMuestras+j]=data[i][j][0];
            // datosX[i*NMuestras+j]=(i*NMuestras+j)/100+100;
            datY[i*NMuestras+j]=data[i][j][1];
        }
    }
    return [datX, datY];
}`,
`function getDataArrays(data:[number,number][][]):[Float32Array,Float32Array] {
  
    //data => [number,number][2352][52]
    const nCromatinsLocal=data.length;
    const NMuestrasLocal=data[0].length;
    // drawDataCount=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const drawDataCountLocal=NMuestrasLocal*nCromatinsLocal;
    console.log(drawDataCountLocal);
    let datX=new Float32Array(drawDataCountLocal);
    let datY=new Float32Array(drawDataCountLocal);
    loadData:for (let i = 0; i < nCromatinsLocal; i++) {
        for (let j = 0; j < NMuestrasLocal; j++) {
            // if(i==0&&j<100) console.log(data[i][j])
            if(i*NMuestrasLocal+j>drawDataCountLocal) break loadData;
            datX[i*NMuestrasLocal+j]=data[i][j][0];
            // datosX[i*NMuestras+j]=(i*NMuestras+j)/100+100;
            datY[i*NMuestrasLocal+j]=data[i][j][1];
        }
    }
    return [datX, datY];
}`)
        .replace(
`function getDataArrays(data) {
        //data => [number,number][2352][52]
        nCromatins = data.length;
        NMuestras = data[0].length;
        // drawDataCount=gl.getParameter(gl.MAX_TEXTURE_SIZE);
        drawDataCount = NMuestras * nCromatins;
        console.log(drawDataCount);
        let datX = new Float32Array(drawDataCount);
        let datY = new Float32Array(drawDataCount);
        loadData: for (let i = 0; i < nCromatins; i++) {
            for (let j = 0; j < NMuestras; j++) {
                // if(i==0&&j<100) console.log(data[i][j])
                if (i * NMuestras + j > drawDataCount)
                    break loadData;
                datX[i * NMuestras + j] = data[i][j][0];
                // datosX[i*NMuestras+j]=(i*NMuestras+j)/100+100;
                datY[i * NMuestras + j] = data[i][j][1];
            }
        }`,
`function getDataArrays(data) {
        //data => [number,number][2352][52]
        const nCromatinsLocal = data.length;
        const NMuestrasLocal = data[0].length;
        // drawDataCount=gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const drawDataCountLocal = NMuestrasLocal * nCromatinsLocal;
        console.log(drawDataCountLocal);
        let datX = new Float32Array(drawDataCountLocal);
        let datY = new Float32Array(drawDataCountLocal);
        loadData: for (let i = 0; i < nCromatinsLocal; i++) {
            for (let j = 0; j < NMuestrasLocal; j++) {
                // if(i==0&&j<100) console.log(data[i][j])
                if (i * NMuestrasLocal + j > drawDataCountLocal)
                    break loadData;
                datX[i * NMuestrasLocal + j] = data[i][j][0];
                // datosX[i*NMuestras+j]=(i*NMuestras+j)/100+100;
                datY[i * NMuestrasLocal + j] = data[i][j][1];
            }
        }`);
}

function fixBrokenTail(code: string) {
    let next = code;
    next = next.replace("// </block let>\r\n    });\r\n    }\r\n    if(is3D){", "    }\r\n    if(is3D){");
    next = next.replace("// </block let>\n    });\n    }\n    if(is3D){", "    }\n    if(is3D){");
    next = next.replace(/\r?\n\s*\}\r?\n(\s*addFunc\(async \(dt\)=>\{ \/\/ drawPCASetup)/m, "\n$1");
    next = next.replace(/\r?\n\s*\}\r?\n(\s*addFunc\(\(dt\) => __awaiter\(void 0, void 0, void 0, function\* \(\) \{)/m, "\n$1");
    next = next.replace(/var __globalBlockFn_0 = async \(dt\)=>\{ \/\/ tick\s*\r?\n\}\);\s*\r?\n([\s\S]*?)\r?\n(\s*addFunc\(async \(dt\)=>\{ \/\/ drawPCASetup)/m, 'var __globalBlockFn_0 = async (dt)=>{ // tick\n$1\n};\n__globalBlocks.push({ priority: 0, order: 0, fn: __globalBlockFn_0 });\n$2');
    next = next.replace(/var __globalBlockFn_0 = \(dt\) => __awaiter\(this, void 0, void 0, function\* \(\) \{ \/\/ tick\s*\r?\n\}\)\);\s*\r?\n([\s\S]*?)\r?\n(\s*addFunc\(\(dt\) => __awaiter\(this, void 0, void 0, function\* \(\) \{ \/\/ drawPCASetup)/m, 'var __globalBlockFn_0 = (dt) => __awaiter(this, void 0, void 0, function* () { // tick\n$1\n});\n__globalBlocks.push({ priority: 0, order: 0, fn: __globalBlockFn_0 });\n$2');
    next = next.replace(/(\s*if\(percentageShown<1\)\{[\s\S]*?percentageShown = 1;\s*\}\s*\}\s*)(\r?\n\s*addFunc\(async \(dt\)=>\{ \/\/ drawPCASetup)/m, '$1\n        };\n        __globalBlocks.push({ priority: 0, order: 0, fn: __globalBlockFn_0 });$2');
    next = next.replace(/(\s*if \(percentageShown < 1\) \{[\s\S]*?percentageShown = 1;\s*\}\s*\}\s*)(\r?\n\s*addFunc\(\(dt\) => __awaiter\(this, void 0, void 0, function\* \(\) \{)/m, '$1\n        });\n        __globalBlocks.push({ priority: 0, order: 0, fn: __globalBlockFn_0 });$2');
    next = next.replace(/if \(typeof __mountGlobalBlocks === "function"\)\s*__mountGlobalBlocks\(__globalBlocks,\s*addFunc\);\s*start\(\);\s*\}\)\(\);/m, 'if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);\nstart();\n}\n__c1Main();');
    next = next.replace(/if \(typeof __mountGlobalBlocks === "function"\)\s*__mountGlobalBlocks\(__globalBlocks,\s*addFunc\);\s*start\(\);\s*__c1Main\(\);/m, 'if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);\nstart();\n}\n__c1Main();');
    const c1NeedleWithArgsCRLF = "if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);\r\n    start();\r\n    })();";
    const c1NeedleWithArgs = "if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);\n    start();\n    })();";
    const c1NeedleCRLF = "if (typeof __mountGlobalBlocks === \"function\")\r\n    __mountGlobalBlocks();\r\nstart();\r\n();";
    const c1Needle = "if (typeof __mountGlobalBlocks === \"function\")\n    __mountGlobalBlocks();\nstart();\n();";
    const needleCRLF = "start();\r\n();";
    const needle = "start();\n();";
    const badTail2CRLF = "start();\r\n}))();";
    const badTail2 = "start();\n}))();";
    if (next.includes(c1NeedleWithArgsCRLF)) return next.replace(c1NeedleWithArgsCRLF, "if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);\r\n    start();\r\n}\r\n__c1Main();");
    if (next.includes(c1NeedleWithArgs)) return next.replace(c1NeedleWithArgs, "if (typeof __mountGlobalBlocks === \"function\") __mountGlobalBlocks(__globalBlocks, addFunc);\n    start();\n}\n__c1Main();");
    if (next.includes(c1NeedleCRLF)) return next.replace(c1NeedleCRLF, "if (typeof __mountGlobalBlocks === \"function\")\r\n    __mountGlobalBlocks();\r\nstart();\r\n    });\r\n}\r\n__c1Main();");
    if (next.includes(c1Needle)) return next.replace(c1Needle, "if (typeof __mountGlobalBlocks === \"function\")\n    __mountGlobalBlocks();\nstart();\n    });\n}\n__c1Main();");
    if (next.includes(needleCRLF)) return next.replace(needleCRLF, "start();");
    if (next.includes(needle)) return next.replace(needle, "start();");
    if (next.includes(badTail2CRLF)) return next.replace(badTail2CRLF, "start();");
    if (next.includes(badTail2)) return next.replace(badTail2, "start();");
    return next;
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

function patchGeneratedJavaScript(code: string, snippet: string) {
    const snippetJs = snippet.replace(/ as any/g, "").replace(/const __fsTargetC1=canvas;/, "const __fsTargetC1=canvas;");
    let next = code;
    if (next.includes("__applyCanvasFullscreenC1")) {
        next = next.replace(/const __fsTargetC1[\s\S]*?window\.addEventListener\("resize", __applyCanvasFullscreenC1\);\r?\n/, snippetJs + "\n");
    }
    next = next.replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas");
    next = next.replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas");
    next = next.replace(/\/\/Canvas 1\s*\r?\n\s*\(async\s*\(\)\s*=>\s*\{/m, `//Canvas 1\nasync function __c1Main(){`);
    next = next.replace(/start\(\);\s*\r?\n\s*\}\)\(\);\s*(\r?\n\/\/\<Pos\>)/m, `start();\n}\n__c1Main();$1`);
    next = next.replace(/simTexX\s*=\s*texture2DArray;\s*\r?\n\s*RFloat\(simArrX\);\s*\r?\n\s*"simX";\s*\r?\n\s*"TexUnit30";\s*\r?\n\s*\(simN\);\s*\r?\n\s*x\(1\);\s*\r?\n\s*x\(1\);/g, `simTexX=d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrX,
                    name: "simX",
                    texUnit: "TexUnit30",
                    size: [simN,1,1]
                });`);
    next = next.replace(/simTexY\s*=\s*texture2DArray;\s*\r?\n\s*RFloat\(simArrY\);\s*\r?\n\s*"simY";\s*\r?\n\s*"TexUnit31";\s*\r?\n\s*\(simN\);\s*\r?\n\s*x\(1\);\s*\r?\n\s*x\(1\);/g, `simTexY=d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrY,
                    name: "simY",
                    texUnit: "TexUnit31",
                    size: [simN,1,1]
                });`);
    next = next.replace(/var sx = \(window\.simDataX\);[\s\S]*?var simN = \(Math\.max\(2, Math\.min\(simArrX\.length, simArrY\.length\)\)\);/g, `var sx = (window.simDataX);
                var sy = (window.simDataY);
                if (sx && sy) {
                    var simPair = ((() => {
                        const simArrXLocal = sx instanceof Float32Array ? sx : new Float32Array(sx);
                        const simArrYLocal = sy instanceof Float32Array ? sy : new Float32Array(sy);
                        const projMeta = (window.__tauProjectionMeta || null);
                        if (projMeta && projMeta.mode === "pca") {
                            const recN = Math.max(2, Math.min(simArrXLocal.length, simArrYLocal.length));
                            const backX = new Float32Array(recN);
                            const backY = new Float32Array(recN);
                            const cx = Number.isFinite(projMeta.centerX) ? projMeta.centerX : 0;
                            const cy = Number.isFinite(projMeta.centerY) ? projMeta.centerY : 0;
                            const vx = Number.isFinite(projMeta.vx) ? projMeta.vx : 1;
                            const vy = Number.isFinite(projMeta.vy) ? projMeta.vy : 0;
                            const wx = Number.isFinite(projMeta.wx) ? projMeta.wx : 0;
                            const wy = Number.isFinite(projMeta.wy) ? projMeta.wy : 1;
                            for (let i = 0; i < recN; i++) {
                                const a0 = Number.isFinite(simArrXLocal[i]) ? simArrXLocal[i] : 0;
                                const a1 = Number.isFinite(simArrYLocal[i]) ? simArrYLocal[i] : 0;
                                backX[i] = cx + a0 * vx + a1 * wx;
                                backY[i] = cy + a0 * vy + a1 * wy;
                            }
                            return { x: backX, y: backY };
                        }
                        return { x: simArrXLocal, y: simArrYLocal };
                    })());
                    var simArrX = (simPair.x);
                     var simArrY = (simPair.y);
                     var simN = (Math.max(2, Math.min(simArrX.length, simArrY.length)));`);
    next = next.replace(/(\s*\/\/ <\/block let>\s*)\r?\n\s*\}\);\s*\r?\n(\s*if\(is3D\)\{)/g, `$1\n$2`);
    next = next.replace(/(\s*\/\/ <\/block let>\s*)\r?\n\s*\}\);\s*\r?\n\s*\}\s*\r?\n(\s*if\(is3D\)\{)/g, `$1\n$2`);
    next = next.replace(/(\s*simLastStamp\s*=\s*\(simStamp\);\s*\r?\n\s*\}\s*\r?\n\s*\/\/ <\/block let>\s*)\r?\n\s*\}\);\s*\r?\n\s*\}\s*\r?\n(\s*if\(is3D\)\{)/g, `$1\n$2`);
    return fixBrokenTail(next);
}

async function patchGeneratedFiles(outPath: string, baseDir: string) {
    let outCode = await fs.readFile(outPath, "utf8");
    outCode = patchGetDataArraysLocals(outCode);
    outCode = ensureCommonImports(outCode);
    outCode = patchLocalWebGLManUsage(outCode);
    const snippet = resolveSnippetPlain(await loadSnippetParts(baseDir, "c1"));
    outCode = injectFullscreenSnippet(outCode, snippet);
    outCode = normalizeFullscreenTargets(outCode);
    outCode = patchSimTextureArtifacts(outCode);
    outCode = fixBrokenTail(outCode);
    await fs.writeFile(outPath, outCode, "utf8");
    const outJs = patchGeneratedJavaScript(transpileTypeScript(outCode), snippet);
    await fs.writeFile(outPath.replace(/\.ts$/i, ".js"), outJs, "utf8");
}

main().catch((err) => {
    console.error("[DetailedParser] error al transpilar:", err);
    process.exit(1);
});


