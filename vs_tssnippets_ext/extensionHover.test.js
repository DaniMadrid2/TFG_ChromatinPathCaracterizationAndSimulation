const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

test("backup panels render matrices, isolate selectors, and open the selected file", async () => {
    const commands = new Map();
    const panels = [];
    const opened = [];
    let hoverProvider;
    const disposable = () => ({ dispose() {} });
    const root = path.resolve("fixture");
    const vscode = {
        EventEmitter: class { constructor() { this.event = () => disposable(); } fire() {} dispose() {} },
        Hover: class { constructor(contents) { this.contents = contents; } },
        MarkdownString: class { constructor(value = "") { this.value = value; } appendMarkdown(value) { this.value += value; } },
        Position: class { constructor(line, character) { this.line = line; this.character = character; } },
        Range: class { constructor(start, end) { this.start = start; this.end = end; } },
        DecorationRangeBehavior: { ClosedClosed: 0 },
        InlayHintKind: { Other: 0 },
        ViewColumn: { Beside: 2 },
        RelativePattern: class { constructor(base, pattern) { this.base = base; this.pattern = pattern; } },
        Uri: { file(fsPath) { return { fsPath, toString() { return fsPath; } }; } },
        window: {
            visibleTextEditors: [],
            createTextEditorDecorationType: disposable,
            onDidChangeActiveTextEditor: disposable,
            onDidChangeVisibleTextEditors: disposable,
            createWebviewPanel(_type, title, options) {
                const panel = { title, options, webview: { html: "", onDidReceiveMessage(callback) { panel.receive = callback; return disposable(); } }, onDidDispose(callback) { panel.dispose = callback; return disposable(); } };
                panels.push(panel);
                return panel;
            },
            async showTextDocument(document) { opened.push(document); },
            async showQuickPick(items) { return items.find((item) => item.label === "texA"); },
        },
        languages: new Proxy({}, { get: (_, name) => name === "registerHoverProvider"
            ? (_, provider) => { hoverProvider = provider; return disposable(); }
            : disposable }),
        commands: { registerCommand(name, callback) { commands.set(name, callback); return disposable(); } },
        workspace: {
            findFiles: async () => [],
            getWorkspaceFolder: () => ({ uri: { fsPath: root } }),
            openTextDocument: async (uri) => uri,
            textDocuments: [],
            registerTextDocumentContentProvider: disposable,
            onDidChangeTextDocument: disposable,
            onDidCloseTextDocument: disposable,
            onDidCreateFiles: disposable,
            onDidDeleteFiles: disposable,
            onDidRenameFiles: disposable,
        },
    };
    const files = {
        uniforms: JSON.stringify({ entries: [{ kind: "uniform", name: "speed", value: 2 }] }),
        texA: "texA [2 x 1]:\n0 1\n" + JSON.stringify({ value: { w: 2, h: 1, dim: 1, data: [0, 1] } }),
        texB: "texB [2 x 1]:\n1 0\n" + JSON.stringify({ value: { w: 2, h: 1, dim: 1, data: [1, 0] } }),
    };
    const fs = {
        existsSync(directory) { return directory.includes(`parseTextC2${path.sep}tau`) || directory.includes(`parseTextC1${path.sep}lines`) || directory.includes(`parseTextC1${path.sep}sparse`); },
        statSync() { return { mtimeMs: 1 }; },
        readdirSync(directory, options) {
            if (options?.withFileTypes) return directory.includes(`${path.sep}sparse`)
                ? [10, 12].map((number) => ({ name: String(number), isDirectory: () => true }))
                : [{ name: "2", isDirectory: () => true }];
            if (directory === root) return ["parseTextC23.shaderdsl.ts"];
            if (directory.endsWith(`${path.sep}sparse`)) return [];
            const kind = directory.includes(`${path.sep}lines`) || directory.includes(`${path.sep}sparse`) ? "drawLines" : "drawTriangles";
            return Object.keys(files).map((name) => `${kind}_${name}_202605141429.txt`);
        },
        readFileSync(file) { return files[path.basename(file).match(/^draw(?:Triangles|Lines)_(.+?)_\d+\.txt$/)?.[1]] || ""; },
    };
    const source = "use demo\ndrawTriangles -> [texA, texB] size [2,1] {\n  backUp: /parseTextC23/tau/\n}";
    const lines = source.split("\n");
    const document = {
        languageId: "parse-text-ts", fileName: path.join(root, "parseTextC23.shaderdsl.ts"),
        uri: vscode.Uri.file(path.join(root, "parseTextC23.shaderdsl.ts")), version: 1,
        lineCount: lines.length, getText() { return source; },
        lineAt(line) { return { text: lines[line], range: { end: { line, character: lines[line].length } } }; },
    };
    const editor = { document, selection: { active: { line: 2, character: 4 } }, revealRange() {} };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === "vscode") return vscode;
        if (request === "node:fs") return fs;
        return originalLoad.call(this, request, parent, isMain);
    };
    try {
        delete require.cache[require.resolve("./extension")];
        require("./extension").activate({ subscriptions: [] });
        vscode.window.visibleTextEditors.push(editor);
        const blockKey = "1|3|drawTriangles|demo|parseTextC23/tau|texA,texB";
        await commands.get("vsTSSnippets.openDrawBackupPreviewAtBlock")(document.uri.toString(), blockKey);
        await commands.get("vsTSSnippets.openDrawBackupPreviewAtBlock")(document.uri.toString(), blockKey);
        assert.equal(panels.length, 2);
        assert.equal((panels[0].webview.html.match(/data:image\/png;base64,/g) || []).length, 2);
        assert.match(panels[0].webview.html, /<select id="generation">/);
        assert.match(panels[0].webview.html, /1 \(base, primera\)/);
        await panels[0].receive({ type: "select", field: "generation", value: "2" });
        assert.match(panels[0].webview.html, /<option value="2" selected>/);
        assert.match(panels[1].webview.html, /<option value="1" selected>/);
        await panels[0].receive({ type: "open", value: "texB" });
        assert.match(opened[0].fsPath, /[\\/]2[\\/]drawTriangles_texB_/);
        await commands.get("vsTSSnippets.openDrawBackupBackingFileAtBlock")(document.uri.toString(), blockKey);
        assert.equal(opened.length, 2);
        const hover = hoverProvider.provideHover(document, { line: 2, character: 4 });
        assert.equal(panels.length, 2);
        assert.match(hover.contents.value, /data:image\/png;base64,/);
        assert.doesNotMatch(hover.contents.value, /Path:|Scope:|Gen:/);

        const linesSource = "use demo\ndrawLines -> [texA, texB] size [2,1] {\n  backUp: /parseTextC1/lines/\n}";
        const drawLines = {
            ...document,
            fileName: path.join(root, "parseTextC1.shaderdsl.ts"),
            uri: vscode.Uri.file(path.join(root, "parseTextC1.shaderdsl.ts")),
            getText() { return linesSource; },
            lineAt(line) { const text = linesSource.split("\n")[line]; return { text, range: { end: { line, character: text.length } } }; },
        };
        vscode.window.visibleTextEditors.push({ ...editor, document: drawLines });
        const linesHover = hoverProvider.provideHover(drawLines, { line: 2, character: 4 });
        assert.match(linesHover.contents.value, /data:image\/png;base64,/);
        assert.equal(panels.length, 2);

        const sparseSource = linesSource.replace("/parseTextC1/lines/", "/parseTextC1/sparse/");
        const sparse = {
            ...drawLines,
            uri: vscode.Uri.file(path.join(root, "parseTextC1Sparse.shaderdsl.ts")),
            fileName: path.join(root, "parseTextC1Sparse.shaderdsl.ts"),
            getText() { return sparseSource; },
            lineAt(line) { const text = sparseSource.split("\n")[line]; return { text, range: { end: { line, character: text.length } } }; },
        };
        vscode.window.visibleTextEditors.push({ ...editor, document: sparse });
        const sparseKey = "1|3|drawLines|demo|parseTextC1/sparse|texA,texB";
        await commands.get("vsTSSnippets.openDrawBackupPreviewAtBlock")(sparse.uri.toString(), sparseKey);
        assert.match(panels[2].webview.html, /<option value="10" selected>10<\/option>/);
        assert.match(panels[2].webview.html, /<option value="12">12<\/option>/);
        assert.doesNotMatch(panels[2].webview.html, /<option value="11"/);
        await panels[2].receive({ type: "select", field: "generation", value: "12" });
        await panels[2].receive({ type: "open", value: "texB" });
        assert.match(opened.at(-1).fsPath, /[\\/]12[\\/]drawLines_texB_/);
    } finally {
        Module._load = originalLoad;
        delete require.cache[require.resolve("./extension")];
    }
});
