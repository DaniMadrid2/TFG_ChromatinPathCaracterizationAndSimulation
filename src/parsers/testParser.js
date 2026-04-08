var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require("node:path");
const fs = require("node:fs/promises");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const g = globalThis;
        if (!g.window)
            g.window = {};
        if (!g.document) {
            g.document = {
                createElement: () => ({}),
                getElementById: () => null,
                querySelector: () => null,
            };
        }
        if (!g.WebGL2RenderingContext) {
            g.WebGL2RenderingContext = new Proxy({}, {
                get: () => 0
            });
        }
        const dynamicImport = new Function("p", "return import(p)");
        let DetailedParser;
        try {
            ({ DetailedParser } = yield dynamicImport("../../../../../../Plantillas/Codigo/WebGL/webglParser.mts"));
        }
        catch (_a) {
            ({ DetailedParser } = yield dynamicImport("../../../../../../Plantillas/Codigo/WebGL/webglParser.mjs"));
        }
        const repoStyleDir = path.resolve("public/development/blog/02_Fisica/Fluidos/Reologia_01_Intro_a_la_reologia");
        const localStyleDir = process.cwd();
        const probePath = path.join(repoStyleDir, "parseText2.shaderdsl.ts");
        let baseDir = repoStyleDir;
        try {
            yield fs.access(probePath);
        }
        catch (_b) {
            baseDir = localStyleDir;
        }
        const parseTextPath = path.join(baseDir, "parseText2.shaderdsl.ts");
        const outPath = path.join(baseDir, "generatedParser.ts");
        const mainImportsPath = path.join(baseDir, "main.ts");
        const text = yield fs.readFile(parseTextPath, "utf8");
        yield DetailedParser.parse(text, null, {}, outPath, mainImportsPath);
        let outCode = yield fs.readFile(outPath, "utf8");
        if (outCode.includes("WebGLMan.program(") || outCode.includes("WebGLMan.setGL(gl)")) {
            outCode = outCode.replace(/if\(!WebGLMan\.stWebGLMan\.gl\)\s*WebGLMan\.setGL\(gl\);\r?\n/g, "");
            if (!outCode.includes("const webglMan=new WebGLMan(gl);")) {
                outCode = outCode.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;)/, "$1\n    const webglMan=new WebGLMan(gl);");
            }
            outCode = outCode.replace(/WebGLMan\.program\(/g, "webglMan.program(");
            yield fs.writeFile(outPath, outCode, "utf8");
        }
        const fsSnippet = `
    const __fsTargetC1=canvas as any;
    const __baseCanvasW=canvas.width;
    const __baseCanvasH=canvas.height;
    const __baseCanvasStyle={
        position: canvas.style.position || "",
        top: canvas.style.top || "",
        left: canvas.style.left || "",
        width: canvas.style.width || "",
        height: canvas.style.height || "",
        maxWidth: canvas.style.maxWidth || "",
        maxHeight: canvas.style.maxHeight || "",
        zIndex: canvas.style.zIndex || "",
        display: canvas.style.display || ""
    };
    const __baseBodyOverflow=document.body.style.overflow || "";
    const __baseDocOverflow=document.documentElement.style.overflow || "";
    const __applyCanvasFullscreenC1=()=>{
        const isFs=(document.fullscreenElement===__fsTargetC1);
        if(isFs){
            document.body.style.overflow="hidden";
            document.documentElement.style.overflow="hidden";
            canvas.style.position="fixed";
            canvas.style.top="0";
            canvas.style.left="0";
            canvas.style.width="100%";
            canvas.style.height="100%";
            canvas.style.maxWidth="100vw";
            canvas.style.maxHeight="100vh";
            canvas.style.zIndex="999999";
            canvas.style.display="block";
            canvas.width=window.innerWidth;
            canvas.height=window.innerHeight;
        }else{
            document.body.style.overflow=__baseBodyOverflow;
            document.documentElement.style.overflow=__baseDocOverflow;
            canvas.style.position=__baseCanvasStyle.position;
            canvas.style.top=__baseCanvasStyle.top;
            canvas.style.left=__baseCanvasStyle.left;
            canvas.style.width=__baseCanvasStyle.width;
            canvas.style.height=__baseCanvasStyle.height;
            canvas.style.maxWidth=__baseCanvasStyle.maxWidth;
            canvas.style.maxHeight=__baseCanvasStyle.maxHeight;
            canvas.style.zIndex=__baseCanvasStyle.zIndex;
            canvas.style.display=__baseCanvasStyle.display;
            canvas.width=__baseCanvasW;
            canvas.height=__baseCanvasH;
        }
    };
    canvas.addEventListener("dblclick", ()=>{
        if(document.fullscreenElement) document.exitFullscreen?.();
        else openFullscreen(__fsTargetC1);
        setTimeout(__applyCanvasFullscreenC1, 0);
    });
    document.addEventListener("fullscreenchange", __applyCanvasFullscreenC1);
    window.addEventListener("resize", __applyCanvasFullscreenC1);
`;
        if (outCode.includes("__applyCanvasFullscreenC1")) {
            outCode = outCode.replace(/const __fsTargetC1[\s\S]*?window\.addEventListener\("resize", __applyCanvasFullscreenC1\);\r?\n/, fsSnippet + "\n");
        }
        else {
            outCode = outCode.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;[^\n]*\r?\n)/, `$1${fsSnippet}`);
        }
        outCode = outCode
            .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
            .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas")
            .replace(/let fsTarget=canvas as any;/g, "let fsTarget=canvas as any;")
            .replace(/const fsTarget = canvas as any;/g, "const fsTarget = canvas as any;");
        outCode = outCode
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
        yield fs.writeFile(outPath, outCode, "utf8");
        const outJsPath = outPath.replace(/\.ts$/i, ".js");
        try {
            let outJs = yield fs.readFile(outJsPath, "utf8");
            const fsSnippetJs = fsSnippet
                .replace(/ as any/g, "")
                .replace(/const __fsTargetC1=canvas;/, "const __fsTargetC1=canvas;");
            if (outJs.includes("__applyCanvasFullscreenC1")) {
                outJs = outJs.replace(/const __fsTargetC1[\s\S]*?window\.addEventListener\("resize", __applyCanvasFullscreenC1\);\r?\n/, fsSnippetJs + "\n");
            }
            else {
                outJs = outJs.replace(/(const gl = ctx;\r?\n\s*const canvas = ctx\.canvas;\r?\n)/, `$1${fsSnippetJs}`);
            }
            outJs = outJs
                .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
                .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas");
            outJs = outJs
                .replace(/\/\/Canvas 1\s*\r?\n\s*\(async\s*\(\)\s*=>\s*\{/m, `//Canvas 1\nasync function __c1Main(){`)
                .replace(/start\(\);\s*\r?\n\s*\}\)\(\);\s*(\r?\n\/\/<Pos>)/m, `start();\n}\n__c1Main();$1`)
                .replace(/simTexX\s*=\s*texture2DArray;\s*\r?\n\s*RFloat\(simArrX\);\s*\r?\n\s*"simX";\s*\r?\n\s*"TexUnit30";\s*\r?\n\s*\(simN\);\s*\r?\n\s*x\(1\);\s*\r?\n\s*x\(1\);/g, `simTexX=d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrX,
                    name: "simX",
                    texUnit: "TexUnit30",
                    size: [simN,1,1]
                });`)
                .replace(/simTexY\s*=\s*texture2DArray;\s*\r?\n\s*RFloat\(simArrY\);\s*\r?\n\s*"simY";\s*\r?\n\s*"TexUnit31";\s*\r?\n\s*\(simN\);\s*\r?\n\s*x\(1\);\s*\r?\n\s*x\(1\);/g, `simTexY=d.texture2DArray({
                    format: TexExamples.RFloat,
                    data: simArrY,
                    name: "simY",
                    texUnit: "TexUnit31",
                    size: [simN,1,1]
                });`)
                .replace(/var sx = \(window\.simDataX\);[\s\S]*?var simN = \(Math\.max\(2, Math\.min\(simArrX\.length, simArrY\.length\)\)\);/g, `var sx = (window.simDataX);
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
                     var simN = (Math.max(2, Math.min(simArrX.length, simArrY.length)));`)
                .replace(/(\s*\/\/ <\/block let>\s*)\r?\n\s*\}\);\s*\r?\n(\s*if\(is3D\)\{)/g, `$1\n$2`);
            const __fixBrokenTail = (code) => {
                const needle = "start();\n();";
                const needleCRLF = "start();\r\n();";
                const c1Needle = "if (typeof __mountGlobalBlocks === \"function\")\n    __mountGlobalBlocks();\nstart();\n();";
                const c1NeedleCRLF = "if (typeof __mountGlobalBlocks === \"function\")\r\n    __mountGlobalBlocks();\r\nstart();\r\n();";
                const badTail2 = "start();\n}))();";
                const badTail2CRLF = "start();\r\n}))();";
                if (code.includes(c1NeedleCRLF))
                    return code.replace(c1NeedleCRLF, "if (typeof __mountGlobalBlocks === \"function\")\r\n    __mountGlobalBlocks();\r\nstart();\r\n    });\r\n}\r\n__c1Main();");
                if (code.includes(c1Needle))
                    return code.replace(c1Needle, "if (typeof __mountGlobalBlocks === \"function\")\n    __mountGlobalBlocks();\nstart();\n    });\n}\n__c1Main();");
                if (code.includes(needleCRLF))
                    return code.replace(needleCRLF, "start();");
                if (code.includes(needle))
                    return code.replace(needle, "start();");
                if (code.includes(badTail2CRLF))
                    return code.replace(badTail2CRLF, "start();");
                if (code.includes(badTail2))
                    return code.replace(badTail2, "start();");
                return code;
            };
            outCode = __fixBrokenTail(outCode);
            outJs = __fixBrokenTail(outJs);
            yield fs.writeFile(outPath, outCode, "utf8");
            yield fs.writeFile(outJsPath, outJs, "utf8");
        }
        catch (_c) { }
        console.log("[DetailedParser] generado:", outPath);
    });
}
main().catch((err) => {
    console.error("[DetailedParser] error al transpilar:", err);
    process.exit(1);
});
export {};


