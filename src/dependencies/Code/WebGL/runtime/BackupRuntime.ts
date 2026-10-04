/**
 * Browser runtime for DSL `backUp:` draw blocks, `backUp store`, `backUp restore`,
 * `backUp log`, and `readBackup(path)`. The parser imports this file only when
 * `detectUse` finds one of those forms. Example:
 *
 *   drawTriangles -> [resultTex] size [64,64] {
 *       backUp: /experiment/pass/
 *   }
 *
 * The browser cannot write files itself. Start the package backup API with
 * `dnti_shaderdsl servebackups [port] [path]`, or use `serve` / `parse --serve`.
 * The server implementation is `dist/lib/backups.js`; it can also be started
 * from Node with `node dist/lib/backups.js [port] [path]`. Windows may
 * require an administrator terminal to unlink old backups on recomputation;
 * deletion must also be allowed when starting the server. `--no-backup-server`
 * disables the API. Keep the server on the origin used by the generated page.
 */
/** Resolves DSL backup hints and filenames within one project scope. */
class BackupPaths {
    /** Captures the project-relative backup root. */
    constructor(private defaultScope: string) {}
    /** Formats one date component for a stable timestamp. */
    pad2 = (n:any)=>String(n).padStart(2, "0");
    /** Produces the timestamp used by saved filenames. */
    stamp = ()=>{
        const d = new Date();
        return String(d.getFullYear()) + this.pad2(d.getMonth()+1) + this.pad2(d.getDate()) + this.pad2(d.getHours()) + this.pad2(d.getMinutes());
    };
    /** Prevents path separators and control characters in generated names. */
    safeName = (name:any)=>String(name ?? "backup").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "") || "backup";
    /** Names a standalone backup from its variable and texture metadata. */
    defaultPath = (value:any, varName:any)=>{
        const isTex = value && typeof value === "object" && ("w" in value || "h" in value || "unit" in value || value instanceof WebGLTexture);
        const parts = [this.safeName(varName)];
        if(isTex){
            parts.push(String(value.w ?? value.width ?? "x"));
            parts.push(String(value.h ?? value.height ?? "y"));
            parts.push("TexUnit" + String(value.unit ?? "NA").replace(/^TexUnit/i, ""));
            parts.push(this.safeName(value.__backupProgram ?? value.programName ?? value.program ?? "programNA"));
        }
        parts.push(this.stamp());
        return parts.join("_") + ".txt";
    };
    /** Anchors a DSL path hint under the active backup scope. */
    normalizeScopePath = (pathHint:any)=>{
        const raw = String(pathHint ?? "").trim().replace(/\\/g, "/");
        const scope = String(this.defaultScope || "").replace(/^\/+|\/+$/g, "");
        /** Keeps relative hints within the project's backup scope. */
        const withScope = (value:string)=>{
            const clean = String(value || "").replace(/^\/+/, "");
            if(!scope) return clean;
            if(!clean) return scope;
            if(clean === scope || clean.startsWith(scope + "/")) return clean;
            return scope + "/" + clean;
        };
        if(!raw || raw === "/" || raw === ".") return { path: withScope(""), directoryMode: true };
        if(raw.startsWith("./")){
            const rest = raw.slice(2);
            return { path: withScope(rest), directoryMode: !rest || /\/$/.test(rest) };
        }
        if(raw.startsWith("/")) return { path: withScope(raw.slice(1)), directoryMode: true };
        return { path: withScope(raw), directoryMode: true };
    };
    /** Chooses the base folder or a numbered draw-iteration folder. */
    resolveMultiTarget = (pathHint:any, defaultStem:any, suffix:any, generation:any=1)=>{
        const target = this.normalizeScopePath(pathHint);
        const stem = this.safeName(defaultStem);
        const cleanSuffix = String(suffix ?? "").replace(/^_+/, "");
        const fileName = stem + "_" + cleanSuffix + "_" + this.stamp() + ".txt";
        const gen = Math.max(1, Number(generation) || 1);
        if(target.directoryMode){
            const dirPath = gen > 1 ? (target.path ? String(target.path).replace(/\/+$/g, "") + "/" + String(gen) : String(gen)) : target.path;
            return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };
        }
        const p = target.path;
        if(/\.txt$/i.test(p)){
            const slash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
            const dir = slash >= 0 ? p.slice(0, slash + 1) : "";
            const base = slash >= 0 ? p.slice(slash + 1) : p;
            const dot = base.toLowerCase().endsWith(".txt") ? base.slice(0, -4) : base;
            const genDir = gen > 1 ? (dir ? dir.replace(/\/+$/g, "") + "/" + String(gen) + "/" : String(gen) + "/") : dir;
            return { path: genDir + dot + "_" + cleanSuffix + ".txt", directoryMode: false, generation: gen };
        }
        const dirPath = gen > 1 ? (p ? String(p).replace(/\/+$/g, "") + "/" + String(gen) : String(gen)) : p;
        return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };
    };
}

/** Talks to the backup HTTP API; it never accesses the filesystem directly. */
class BackupServer {
    /** Binds path resolution to the API endpoint. */
    constructor(private paths: BackupPaths, private baseUrl = "/api/backups") {}
    /** Writes a file, appends a log, or requests generation cleanup. */
    put = async (route:string, path:any, content:any, extra:any={})=>{
        const response = await fetch(this.baseUrl + route, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, content, ...extra })
        });
        const raw = await response.text();
        if(!response.ok) throw new Error("Backup request failed: " + response.status + " " + raw);
        try { return raw ? JSON.parse(raw) : { ok: true, path: String(path ?? "") }; }
        catch { return { ok: true, path: String(path ?? ""), raw }; }
    };
    /** Reads a saved backup file as text from the server. */
    fetchText = async (pathHint:any)=>{
        const target = this.paths.normalizeScopePath(pathHint);
        const response = await fetch(this.baseUrl + "/file?path=" + encodeURIComponent(target.path));
        if(!response.ok) throw new Error("Backup restore failed: " + response.status + " " + await response.text());
        return await response.text();
    };
}

/** Converts textures and typed arrays to and from the backup text format. */
class BackupValues {
    /** Uses the active WebGL context for GPU readback. */
    constructor(private gl: WebGL2RenderingContext, private TexExamples: any) {}
    /** Formats the texture grid as aligned, readable rows. */
    texturePreview = (tex:any, varName:any)=>{
        if(!tex || tex.__backupType !== "texture2D") return "";
        const w = Number(tex.w ?? 0) || 0;
        const h = Number(tex.h ?? 0) || 0;
        const dim = Number(tex.dim ?? 1) || 1;
        const name = String(varName ?? "texture");
        const program = String(tex.program ?? "programNA");
        const values = Array.isArray(tex.data) ? tex.data : [];
        /** Aligns scalar values without truncating matrix rows. */
        const formatScalar = (value:any)=>{
            const num = Number(value);
            if(!Number.isFinite(num)) return String(value ?? "").padStart(10, " ");
            return num.toFixed(4).padStart(10, " ");
        };
        const lines = [name + " [" + w + " x " + h + "] " + program];
        for(let y = 0; y < h; y++){
            const row:string[] = [];
            for(let x = 0; x < w; x++){
                const base = (y * w + x) * dim;
                for(let c = 0; c < dim; c++){
                    row.push(formatScalar(values[base + c]));
                }
            }
            lines.push(row.join(" "));
        }
        return lines.join("\n");
    };
    /** Reads GPU pixels into a serializable texture snapshot. */
    readTexture2D = (tex:any)=>{
        //TODO - this should also be accesible through dsl (variable <= texture) command to export just the data
        if(!tex || typeof tex !== "object" || !(tex instanceof WebGLTexture)) return null;
        const w = Number(tex.w ?? tex.width ?? 1) || 1;
        const h = Number(tex.h ?? tex.height ?? 1) || 1;
        const format = tex.format || (this.TexExamples as any).RGBAFloat;
        const dim = format?.[0] === this.gl.RED ? 1 : format?.[0] === this.gl.RG ? 2 : format?.[0] === this.gl.RGB ? 3 : 4;
        const fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.READ_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex, 0);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0);
        const data = new Float32Array(w * h * dim);
        this.gl.readPixels(0, 0, w, h, format[0], format[2], data);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, null);
        this.gl.deleteFramebuffer(fbo);
        return { __backupType: "texture2D", w, h, dim, format: Array.from(format || []), unit: tex.unit, program: tex.__backupProgram, data: Array.from(data) };
    };
    /** Serializes a value, including a readable texture preview. */
    serializeValue = (value:any, varName:any)=>{
        const tex = this.readTexture2D(value);
        if(tex){
            const jsonLine = JSON.stringify({ varName, savedAt: new Date().toISOString(), value: tex });
            return this.texturePreview(tex, varName) + "\n" + jsonLine;
        }
        if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){
            return JSON.stringify({ varName, savedAt: new Date().toISOString(), value: { __backupType: value.constructor.name, data: Array.from(value) } });
        }
        try { return JSON.stringify({ varName, savedAt: new Date().toISOString(), value }); }
        catch { return String(value); }
    };
    /** Converts textures and typed arrays to JSON-safe values. */
    normalizeValue = (value:any, varName:any)=>{
        const tex = this.readTexture2D(value);
        if(tex) return { varName, value: tex };
        if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){
            return { varName, value: { __backupType: value.constructor.name, data: Array.from(value) } };
        }
        return { varName, value };
    };
    /** Decodes the final JSON line or a plain numeric backup. */
    decodeValue = (text:string)=>{
        try {
            const lines = String(text ?? "").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
            const jsonLine = lines.length ? lines[lines.length - 1] : "";
            const parsed = JSON.parse(jsonLine);
            return parsed && Object.prototype.hasOwnProperty.call(parsed, "value") ? parsed.value : parsed;
        } catch {
            const nums = text.trim().split(/[\s,;]+/).map(Number).filter(Number.isFinite);
            return nums.length ? new Float32Array(nums) : text;
        }
    };
}

/** Tracks draw iterations and clears prior generations per recomputation. */
class BackupGenerations {
    /** Starts with no counters or cleared scopes. */
    constructor(private paths: BackupPaths, private server: BackupServer, private generationContext: () => { recomputeTau?: boolean; tauModelStamp?: unknown }) {}
    /** Holds counters and cleanup state for the current model stamp. */
    drawGenerationState = { stamp: Symbol("init"), counts: new Map<string, number>(), clearedScopes: new Set<string>() };
    /** Resets counters when the model stamp changes. */
    refreshGenerationState = ()=>{
        try {
            if(!this.generationContext().recomputeTau) return;
            const stamp = this.generationContext().tauModelStamp ?? "__recompute__";
            if(this.drawGenerationState.stamp !== stamp){
                this.drawGenerationState.stamp = stamp;
                this.drawGenerationState.counts = new Map<string, number>();
                this.drawGenerationState.clearedScopes = new Set<string>();
            }
        } catch {}
    };
    /** Requests one cleanup per draw scope on recomputation. */
    clearDrawScopeGenerationsIfNeeded = async (pathHint:any)=>{
        this.refreshGenerationState();
        try {
            if(!this.generationContext().recomputeTau) return;
            const target = this.paths.normalizeScopePath(pathHint);
            const key = String(target.path || "");
            if(this.drawGenerationState.clearedScopes.has(key)) return;
            this.drawGenerationState.clearedScopes.add(key);
            await this.server.put("/clear-generations", target.path, "");
        } catch (err) {
            console.warn("[backUp clear-generations] failed", pathHint, err);
        }
    };
    /** Returns the next numbered pass for one draw and shader. */
    nextDrawGeneration = (drawKind:any, pathHint:any, program:any, trackWithoutRecompute=false)=>{
        this.refreshGenerationState();
        try {
            if (!trackWithoutRecompute && !this.generationContext().recomputeTau) return 1;
            const target = this.paths.normalizeScopePath(pathHint);
            const drawName = this.paths.safeName(drawKind || "draw");
            const programName = this.paths.safeName(program?.ID ?? program?.fragPath ?? program?.name ?? "program");
            const key = target.path + "::" + programName + "::" + drawName;
            const next = (this.drawGenerationState.counts.get(key) || 0) + 1;
            this.drawGenerationState.counts.set(key, next);
            return next;
        } catch {
            return 1;
        }
    };
}

/** Writes the uniforms and every output texture of a draw as one iteration. */
class BackupDrawWriter {
    /** Shares path, server, codec, and iteration state with the public runtime. */
    constructor(private paths: BackupPaths, private server: BackupServer, private values: BackupValues, private generations: BackupGenerations) {}
    private writes = new Map<string, Promise<unknown>>();
    /** Captures uniforms and outputs, then uploads their snapshots. */
    storeDrawBlock = async (drawKind:any, pathHint:any, outputTextures:any[], uniformEntries:any[], program:any, options:any={})=>{
        try {
            const drawName = this.paths.safeName(drawKind || "draw");
            const generation = this.generations.nextDrawGeneration(drawKind, pathHint, program,
                options?.maxBackUpIterations !== undefined || options?.priority !== undefined);
            const maximum = Number(options?.maxBackUpIterations);
            const limit = Number.isInteger(maximum) && maximum > 0 ? maximum : Infinity;
            const priority = String(options?.priority || "first").toLowerCase();
            const every = /^each-(\d+)$/.exec(priority);
            if (priority !== "first" && priority !== "last" && (!every || Number(every[1]) < 1)) {
                throw new Error(`Prioridad de backup invalida: ${priority}`);
            }
            if (priority === "first" && generation > limit) return { ok: true, skipped: true };
            if (every && ((generation - 1) % Number(every[1]) !== 0 || Math.ceil(generation / Number(every[1])) > limit)) {
                return { ok: true, skipped: true };
            }
            const outputs = Array.isArray(outputTextures) ? outputTextures.filter(Boolean) : [];
            const outputSet = new Set(outputs.map(item => item?.tex).filter(Boolean));
            const programTextures = Array.isArray(program?.textures) ? program.textures.filter((tex:any)=>tex && !outputSet.has(tex)) : [];
            const prependedInputs = programTextures.map((tex:any, idx:number)=>this.values.normalizeValue(tex, tex.__backupVarName || tex.__backupUniformName || ("inputTex" + idx)));
            const normalizedUniforms = (Array.isArray(uniformEntries) ? uniformEntries : []).map((entry:any)=>({
                kind: entry?.kind || "uniform",
                name: entry?.name || "uniform",
                ...this.values.normalizeValue(entry?.value, entry?.name || "uniform")
            }));
            const serializedOutputs = outputs.map((output:any)=>{
                const outputName = output?.name || "output";
                try {
                    return { outputName, ok: true, payload: this.values.serializeValue(output?.tex, outputName) };
                } catch (err) {
                    return {
                        outputName,
                        ok: false,
                        payload: JSON.stringify({
                            varName: outputName,
                            savedAt: new Date().toISOString(),
                            error: String(err)
                        })
                    };
                }
            });
            const uniformPayload = JSON.stringify({
                source: drawKind,
                savedAt: new Date().toISOString(),
                entries: [
                    ...prependedInputs.map((entry:any)=>({ kind: "programTexture", name: entry.varName, value: entry.value })),
                    ...normalizedUniforms
                ]
            });
            const scope = this.paths.normalizeScopePath(pathHint).path;
            const prior = this.writes.get(scope) || Promise.resolve();
            const work = prior.catch(() => undefined).then(async () => {
                await this.generations.clearDrawScopeGenerationsIfNeeded(pathHint);
                const uniformTarget = this.paths.resolveMultiTarget(pathHint, drawName, "uniforms", generation);
                await this.server.put("/file", uniformTarget.path, uniformPayload, uniformTarget.directoryMode ? { directoryMode: true, suggestedName: uniformTarget.suggestedName } : {});
                for (const snapshot of serializedOutputs) {
                    try {
                        const outputTarget = this.paths.resolveMultiTarget(pathHint, drawName, this.paths.safeName(snapshot.outputName), generation);
                        await this.server.put("/file", outputTarget.path, snapshot.payload, outputTarget.directoryMode ? { directoryMode: true, suggestedName: outputTarget.suggestedName } : {});
                        if(!snapshot.ok){
                            console.warn("[backUp draw] stored output fallback payload", snapshot.outputName, pathHint);
                        }
                    } catch (err) {
                        console.error("[backUp draw] output store failed", snapshot.outputName, pathHint, err);
                    }
                }
                if (priority === "last" && Number.isFinite(limit) && generation > limit) {
                    const old = this.paths.resolveMultiTarget(pathHint, drawName, "uniforms", generation - limit);
                    if (old.directoryMode) {
                        await this.server.put("/clear-generation", old.path, "", { prefix: drawName + "_" });
                    } else {
                        const previous = [old, ...serializedOutputs.map(snapshot =>
                            this.paths.resolveMultiTarget(pathHint, drawName, this.paths.safeName(snapshot.outputName), generation - limit))];
                        const folder = old.path.replace(/\/[^/]*$/, "");
                        await this.server.put("/clear-generation", folder, "", {
                            filenames: previous.map(item => item.path.slice(folder.length + 1))
                        });
                    }
                }
                return { ok: true };
            });
            this.writes.set(scope, work);
            void work.then(() => { if (this.writes.get(scope) === work) this.writes.delete(scope); },
                () => { if (this.writes.get(scope) === work) this.writes.delete(scope); });
            return await work;
        } catch (err) {
            console.error("[backUp draw] failed", drawKind, pathHint, err);
            return { ok: false, error: String(err) };
        }
    };
}

/** Reads saved values and restores texture snapshots into live textures. */
class BackupReader {
    /** Connects API text retrieval with value decoding. */
    constructor(private server: BackupServer, private values: BackupValues) {}
    /** Reads one backup without changing a target object. */
    async readBackup(pathHint:any) {
        return this.values.decodeValue(await this.server.fetchText(pathHint));
    }
    /** Fills a texture or returns an array/scalar from a backup. */
    restoreInto = async (target:any, pathHint:any)=>{
        const value = await this.readBackup(pathHint);
        if(target && typeof target.fill === "function" && value?.__backupType === "texture2D"){
            target.fill(new Float32Array(value.data || []), 0, 0, value.w, value.h);
            return target;
        }
        if(value?.__backupType && Array.isArray(value.data)) return new Float32Array(value.data);
        return value;
    };
}

/** Redirects console output to an append-only backup file. */
class BackupConsoleLogger {
    /** Uses the same scoped path and HTTP server as other backup operations. */
    constructor(private paths: BackupPaths, private server: BackupServer) {}
    /** Installs console mirrors for one DSL log destination. */
    log = async (pathHint:any)=>{
        const target = this.paths.normalizeScopePath(pathHint);
        const p = target.path;
        const prevLog = console.log.bind(console);
        const prevWarn = console.warn.bind(console);
        const prevError = console.error.bind(console);
        /** Appends one console event without blocking the original call. */
        const append = (level:string, args:any[])=>{
            const line = "[" + new Date().toISOString() + "] " + level + " " + args.map(a=>{ try{return typeof a === "string" ? a : JSON.stringify(a);}catch{return String(a);} }).join(" ") + "\n";
            this.server.put("/append", p, line, target.directoryMode ? { directoryMode: true, suggestedName: "log_" + this.paths.stamp() + ".txt" } : {}).catch(prevError);
        };
        console.log = (...args:any[])=>{ prevLog(...args); append("log", args); };
        console.warn = (...args:any[])=>{ prevWarn(...args); append("warn", args); };
        console.error = (...args:any[])=>{ prevError(...args); append("error", args); };
        console.log("[backUp log]", p);
    };
}

/** Public API used by generated Shader DSL code. */
export class BackupRuntime {
    private paths: BackupPaths;
    private server: BackupServer;
    private values: BackupValues;
    private generations: BackupGenerations;
    private draws: BackupDrawWriter;
    private reader: BackupReader;
    private logger: BackupConsoleLogger;
    /** Connects the browser WebGL context and recomputation state to the backup API. */
    constructor(gl: WebGL2RenderingContext, TexExamples: any, defaultScope: string,
        generationContext: () => { recomputeTau?: boolean; tauModelStamp?: unknown } = () => ({})) {
        this.paths = new BackupPaths(defaultScope);
        this.server = new BackupServer(this.paths);
        this.values = new BackupValues(gl, TexExamples);
        this.generations = new BackupGenerations(this.paths, this.server, generationContext);
        this.draws = new BackupDrawWriter(this.paths, this.server, this.values, this.generations);
        this.reader = new BackupReader(this.server, this.values);
        this.logger = new BackupConsoleLogger(this.paths, this.server);
    }
    /** Stores one named value at a DSL path hint. */
    store = async (value:any, varName:any, pathHint?:any)=>{
        try {
            const target = this.paths.normalizeScopePath(pathHint);
            const result = await this.server.put("/file", target.path, this.values.serializeValue(value, varName), target.directoryMode ? { directoryMode: true, suggestedName: this.paths.defaultPath(value, varName) } : {});
            console.log("[backUp store]", result.path);
            return result;
        } catch (err) {
            console.error("[backUp store] failed", err);
            return { ok: false, error: String(err) };
        }
    };
    /** Restores a texture in place or returns decoded scalar/array data. */
    restoreInto = (target:any, pathHint:any) => this.reader.restoreInto(target, pathHint);
    /** Mirrors console messages to a backup log file. */
    log = (pathHint:any) => this.logger.log(pathHint);
    /** Captures all outputs of one draw block. */
    storeDrawBlock = (drawKind:any, pathHint:any, outputTextures:any[], uniformEntries:any[], program:any, options:any={}) =>
        this.draws.storeDrawBlock(drawKind, pathHint, outputTextures, uniformEntries, program, options);
    /** Reads one backup value without mutating an existing target. */
    async readBackup(pathHint: any) {
        return this.reader.readBackup(pathHint);
    }
}

/** Parser hook that imports the browser runtime and exposes `readBackup`. */
export const runtimeFeature: import("../parser/runtimeFeature.js").RuntimeFeature = {
    imports: ['import { BackupRuntime } from "/Code/WebGL/runtime/BackupRuntime.js";'],
    setup: ({ backupScope }) => [
        `const backupRuntime = new BackupRuntime(gl, TexExamples, ${JSON.stringify(backupScope)}, () => ({`,
        `    recomputeTau: typeof recomputeTau !== "undefined" && !!recomputeTau,`,
        `    tauModelStamp: typeof tauModelStamp !== "undefined" ? tauModelStamp : undefined`,
        `}));`,
        `const readBackup = (path: string) => backupRuntime.readBackup(path);`,
    ],
};

/** Enables backups only when the DSL contains backup operations. */
export const detectUse = ({ source }: import("../parser/runtimeFeature.js").RuntimeFeatureContext): boolean =>
    /\bbackUp\s*(?::|store\b|restore\b|log\b)|\breadBackup\s*\(/i.test(source);
