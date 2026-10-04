/**
 * Runtime for DSL `let`/`var` values loaded from a file. Example:
 * `let ./params.json { speed, radius }` (the parser emits `runtimeLetSource.load`).
 * Text files accept `name=value` entries; JSON may contain an object or an
 * array of objects. Detection happens when the DSL contains a file-backed
 * `let` or `var` block. The parsed result is cached by resolved URL.
 */
/** Loads and decodes file-backed DSL variables in the generated browser code. */
export class RuntimeLetSource {
    /** Resolves relative paths against the generated module URL. */
    constructor(private baseUrl: string) {}
    /** Keeps one parsed value per absolute URL. */
    cache = new Map<string, any>();
    /** Converts a text value into a JSON-like scalar where possible. */
    coerceRuntimeLetValue = (raw:any)=>{
        const text = String(raw ?? "").trim();
        if(!text) return undefined;
        if(/^(true|false)$/i.test(text)) return text.toLowerCase()==="true";
        if(/^null$/i.test(text)) return null;
        if(/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text)) return Number(text);
        if((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))){
            try{ return JSON.parse(text); }catch{}
        }
        if((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))){
            return text.slice(1,-1);
        }
        return text;
    };

    /** Makes array entries addressable by their object keys. */
    mergeRuntimeLetArray = (arr:any[])=>{
        const out:any = { __array: arr };
        if(arr.every(item => item && typeof item === "object" && !Array.isArray(item))){
            for (const item of arr) Object.assign(out, item);
        }
        return out;
    };

    /** Parses comma- or newline-delimited `name=value` text. */
    parseRuntimeLetText = (text:string)=>{
        const out:any = {};
        const chunks = String(text ?? "").split(/[\r\n]+/).flatMap(line => line.split(","));
        for (const chunk of chunks) {
            const entry = chunk.trim();
            if(!entry) continue;
            const eq = entry.indexOf("=");
            if(eq<0){
                out[entry] = true;
                continue;
            }
            const key = entry.slice(0, eq).trim();
            const value = entry.slice(eq + 1).trim();
            if(key) out[key] = this.coerceRuntimeLetValue(value);
        }
        return out;
    };

    /** Fetches, decodes, and caches one external variable source. */
    load = async (sourcePath:any)=>{
        const rawPath = String(sourcePath ?? "").trim();
        if(!rawPath) return {};
        const resolvedPath = new URL(rawPath, this.baseUrl).toString();
        if(this.cache.has(resolvedPath)) return this.cache.get(resolvedPath);
        const response = await fetch(resolvedPath);
        if(!response.ok) throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");
        let parsed:any = {};
        if(/\.json(?:$|\?)/i.test(rawPath)){
            const json = await response.json();
            if(Array.isArray(json)) parsed = this.mergeRuntimeLetArray(json);
            else if(json && typeof json === "object") parsed = json;
            else parsed = { __array: json };
        }else{
            parsed = this.parseRuntimeLetText(await response.text());
        }
        this.cache.set(resolvedPath, parsed);
        return parsed;
    };
}

/** Parser hook for importing and initializing the loader. */
export const runtimeFeature: import("../parser/runtimeFeature.js").RuntimeFeature = {
    imports: ['import { RuntimeLetSource } from "/Code/WebGL/runtime/RuntimeLetSource.js";'],
    setup: () => ['const runtimeLetSource = new RuntimeLetSource(import.meta.url);'],
};

/** Enables the loader for file-backed DSL variable blocks. */
export const detectUse = ({ source }: import("../parser/runtimeFeature.js").RuntimeFeatureContext): boolean =>
    /\b(?:let|var)\s+[^={\n]+?\s*\{/m.test(source);
