const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

test("backup panels render matrices, isolate selectors, and open the selected file", async () => {
    const commands = new Map();
    const panels = [];
    const opened = [];
    let hoverProvider;
    let completionProvider;
    let definitionProvider;
    let visibleEditorsChanged;
    let documentChanged;
    const messages = [];
    const disposable = () => ({ dispose() {} });
    const root = path.resolve("fixture");
    const vscode = {
        EventEmitter: class { constructor() { this.event = () => disposable(); } fire() {} dispose() {} },
        Hover: class { constructor(contents) { this.contents = contents; } },
        Location: class { constructor(uri, range) { this.uri = uri; this.range = range; } },
        CompletionItem: class { constructor(label, kind) { this.label = label; this.kind = kind; } },
        CompletionItemKind: { Method: 1, Property: 2 },
        SnippetString: class { constructor(value) { this.value = value; } },
        MarkdownString: class { constructor(value = "") { this.value = value; } appendMarkdown(value) { this.value += value; } },
        Position: class { constructor(line, character) { this.line = line; this.character = character; } },
        Range: class { constructor(start, end) { this.start = start; this.end = end; } },
        WorkspaceEdit: class {
            constructor() { this.replacements = []; }
            replace(_uri, range, value) { this.replacements.push({ range, value }); }
            get size() { return this.replacements.length; }
        },
        DecorationRangeBehavior: { ClosedClosed: 0 },
        InlayHintKind: { Other: 0 },
        ViewColumn: { Beside: 2 },
        RelativePattern: class { constructor(base, pattern) { this.base = base; this.pattern = pattern; } },
        Uri: { file(fsPath) { return { fsPath, with({ fragment }) { return { toString: () => `${fsPath}#${fragment}` }; }, toString() { return fsPath; } }; } },
        window: {
            visibleTextEditors: [],
            createTextEditorDecorationType: (style) => ({ ...disposable(), style }),
            onDidChangeActiveTextEditor: disposable,
            onDidChangeVisibleTextEditors(callback) { visibleEditorsChanged = callback; return disposable(); },
            createWebviewPanel(_type, title, options) {
                const panel = { title, options, webview: { html: "", onDidReceiveMessage(callback) { panel.receive = callback; return disposable(); } }, onDidDispose(callback) { panel.dispose = callback; return disposable(); } };
                panels.push(panel);
                return panel;
            },
            async showTextDocument(document) { opened.push(document); },
            async showQuickPick(items) { return items.find((item) => item.label === "texA"); },
            showInformationMessage(message) { messages.push(message); },
        },
        languages: new Proxy({}, { get: (_, name) => name === "registerHoverProvider"
            ? (_, provider) => { hoverProvider = provider; return disposable(); }
            : name === "registerDefinitionProvider"
            ? (_, provider) => { definitionProvider = provider; return disposable(); }
            : name === "registerCompletionItemProvider"
            ? (_, provider) => { completionProvider = provider; return disposable(); }
            : disposable }),
        commands: { registerCommand(name, callback) { commands.set(name, callback); return disposable(); } },
        workspace: {
            findFiles: async () => [],
            getWorkspaceFolder: () => ({ uri: { fsPath: root } }),
            openTextDocument: async (uri) => uri,
            async applyEdit(edit) {
                for (const { range, value } of edit.replacements) toggleLines[range.start.line] = value;
                return true;
            },
            textDocuments: [],
            registerTextDocumentContentProvider: disposable,
            onDidChangeTextDocument(callback) { documentChanged = callback; return disposable(); },
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
        existsSync(directory) { return directory.includes(`registrySources${path.sep}`) || directory.includes(`parseTextC2${path.sep}tau`) || directory.includes(`parseTextC1${path.sep}lines`) || directory.includes(`parseTextC1${path.sep}sparse`) || directory.endsWith(`${path.sep}backups`) || directory.endsWith(`tick_2_offset.json`); },
        statSync() { return { mtimeMs: 1, size: 100 }; },
        readdirSync(directory, options) {
            if (options?.withFileTypes) return directory.includes(`${path.sep}sparse`)
                ? [10, 12].map((number) => ({ name: String(number), isDirectory: () => true }))
                : [{ name: "2", isDirectory: () => true }];
            if (directory === root) return ["parseTextC23.shaderdsl.ts"];
            if (directory.endsWith(`${path.sep}sparse`)) return [];
            const kind = directory.includes(`${path.sep}lines`) || directory.includes(`${path.sep}sparse`) ? "drawLines" : "drawTriangles";
            return Object.keys(files).map((name) => `${kind}_${name}_202605141429.txt`);
        },
        readFileSync(file) { return file.endsWith('tick_2_offset.json')
            ? JSON.stringify({ block: 'tick', tag: '2', name: 'offset', value: '{"x":1}' })
            : files[path.basename(file).match(/^draw(?:Triangles|Lines)_(.+?)_\d+\.txt$/)?.[1]] || ""; },
    };
    const source = "use demo\ndrawTriangles -> [texA, texB] size [2,1] {\n  backUp: /parseTextC23/tau/\n}";
    const toggleLines = ['tick {', '  -> let choice = 1', '  +> let choice = 2', '}'];
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

        const registrySource = "meshProgram = MeshProgram input=TexUnit20 4x3\nmeshProgram.smooth\nin-tex2D positionTexture RES [4 x 3] RGFloat TexUnit20\nleft = Program demo |= right\nprogram tauMom|progTauMom \"tau/demo\" {\ntex2D datosX1|xTex[4,1] RFloat TexUnit10\nCamera3D pos=vec3(0,0,0) |= cam2\nmeshProgram.draw(0,0,640,480,{cam2},\"TRI";
        const registryLines = registrySource.split("\n");
        const registryDoc = {
            ...document,
            fileName: path.join(root, "parseTextC1.shaderdsl.ts"),
            uri: vscode.Uri.file(path.join(root, "parseTextC1.shaderdsl.ts")),
            getText(range) { return range ? registryLines[range.start.line].slice(range.start.character, range.end.character) : registrySource; },
            lineAt(line) { return { text: registryLines[line] }; },
            offsetAt(position) { return registryLines.slice(0, position.line).reduce((sum, line) => sum + line.length + 1, 0) + position.character; },
            positionAt(offset) {
                let line = 0;
                while (line < registryLines.length - 1 && offset > registryLines[line].length) offset -= registryLines[line++].length + 1;
                return new vscode.Position(line, offset);
            },
            getWordRangeAtPosition(position) {
                for (const match of registryLines[position.line].matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
                    if (position.character >= match.index && position.character < match.index + match[0].length) {
                        return { start: { line: position.line, character: match.index }, end: { line: position.line, character: match.index + match[0].length } };
                    }
                }
                return null;
            },
        };
        const methods = await completionProvider.provideCompletionItems(registryDoc, { line: 1, character: registryLines[1].length });
        assert.ok(methods.some((item) => item.label === "smoothColor"));
        const modeItems = await completionProvider.provideCompletionItems(registryDoc, { line: 7, character: registryLines[7].length });
        assert.ok(modeItems.some((item) => item.label === 'TRIANGLE_STRIP' && item.insertText === '"TRIANGLE_STRIP"'));
        const drawLocation = await definitionProvider.provideDefinition(registryDoc, { line: 7, character: registryLines[7].indexOf('draw') + 2 });
        assert.match(drawLocation.uri.fsPath, /registrySources[\\/]WebGL[\\/]parser[\\/]registryModules[\\/]capsules\.ts$/);
        const toggleDoc = {
            ...registryDoc,
            uri: vscode.Uri.file(path.join(root, 'toggle.shaderdsl.ts')),
            getText() { return toggleLines.join('\n'); },
            lineAt(line) { return { text: toggleLines[line], range: {
                start: new vscode.Position(line, 0), end: new vscode.Position(line, toggleLines[line].length),
            } }; },
        };
        const toggleLocation = definitionProvider.provideDefinition(toggleDoc, { line: 1, character: 3 });
        assert.equal(toggleLocation.range.line, 2);
        toggleLines[1] = '  // -> let choice = 1';
        documentChanged({ document: toggleDoc, contentChanges: [{ range: { start: { line: 1 } }, text: '// ' }] });
        await new Promise(setImmediate);
        assert.equal(toggleLines[1], '  +> let choice = 1');
        assert.equal(toggleLines[2], '  -> let choice = 2');
        toggleLines[2] = '  +> let choice = 2';
        documentChanged({ document: toggleDoc, contentChanges: [{ range: { start: { line: 2 } }, text: '+' }] });
        await new Promise(setImmediate);
        assert.equal(toggleLines[1], '  -> let choice = 1');
        toggleLines[2] = '  -> let choice = 2';
        assert.equal(await definitionProvider.provideDefinition(toggleDoc, { line: 1, character: 3 }), null);
        assert.match(messages.at(-1), /no active alternative/);
        toggleLines.splice(0, toggleLines.length, '  // +> let only = 1');
        documentChanged({ document: toggleDoc, contentChanges: [{ range: { start: { line: 0 } }, text: '// ' }] });
        await new Promise(setImmediate);
        assert.equal(toggleLines[0], '  +> let only = 1');
        const unitHover = hoverProvider.provideHover(registryDoc, { line: 0, character: registryLines[0].indexOf('TexUnit20') + 2 });
        assert.match(unitHover.contents.value, /positionTexture/);
        const aliasHover = hoverProvider.provideHover(registryDoc, { line: 3, character: registryLines[3].length - 2 });
        assert.match(aliasHover.contents.value, /left/);
        assert.match(hoverProvider.provideHover(registryDoc, { line: 4, character: registryLines[4].indexOf('progTauMom') + 2 }).contents.value, /tauMom/);
        assert.match(hoverProvider.provideHover(registryDoc, { line: 5, character: registryLines[5].indexOf('xTex') + 1 }).contents.value, /datosX1/);
        assert.match(hoverProvider.provideHover(registryDoc, { line: 6, character: 3 }).contents.value, /camera3D/);

        const taggedSource = 'let offset = 1\ntick -2-README {offset}- {\n  backUp store offset /values/\n}';
        const taggedLines = taggedSource.split('\n');
        const taggedDoc = {
            ...registryDoc,
            getText(range) { return range ? taggedLines[range.start.line].slice(range.start.character, range.end.character) : taggedSource; },
            lineAt(line) { return { text: taggedLines[line] }; },
            getWordRangeAtPosition(position) {
                for (const match of taggedLines[position.line].matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
                    if (position.character >= match.index && position.character < match.index + match[0].length) {
                        return { start: { line: position.line, character: match.index }, end: { line: position.line, character: match.index + match[0].length } };
                    }
                }
                return null;
            },
        };
        const taggedHover = hoverProvider.provideHover(taggedDoc, { line: 1, character: taggedLines[1].indexOf('offset') + 2 });
        assert.match(taggedHover.contents.value, /Valor ejecutado/);
        assert.match(taggedHover.contents.value, /linea 3/);
        const drawOnlySource = taggedSource.replace('backUp store offset /values/', 'drawPoints -> [] size [2,2] { backUp: /lines/ }');
        const drawOnlyLines = drawOnlySource.split('\n');
        const drawOnlyDoc = {
            ...taggedDoc,
            getText(range) { return range ? drawOnlyLines[range.start.line].slice(range.start.character, range.end.character) : drawOnlySource; },
            lineAt(line) { return { text: drawOnlyLines[line] }; },
        };
        const drawOnlyHover = hoverProvider.provideHover(drawOnlyDoc, { line: 1, character: drawOnlyLines[1].indexOf('offset') + 2 });
        assert.doesNotMatch(drawOnlyHover.contents.value, /Backups en|backup: /);

        const visualSource = 'let derived tauFTerms=2\nCamera3D pos=vec3(0,0,0) |= cam2\ntick -2-README {offset}- {\n both "tau/" "x //var" -> {"x" + String(tauFTerms)}\n}';
        const visualLines = visualSource.split('\n');
        const visualDoc = {
            ...document,
            getText() { return visualSource; },
            lineAt(line) { return { text: visualLines[line], range: { end: new vscode.Position(line, visualLines[line].length) } }; },
            offsetAt(position) { return visualLines.slice(0, position.line).reduce((sum, line) => sum + line.length + 1, 0) + position.character; },
            positionAt(offset) {
                let line = 0;
                while (line < visualLines.length - 1 && offset > visualLines[line].length) offset -= visualLines[line++].length + 1;
                return new vscode.Position(line, offset);
            },
        };
        const applied = [];
        const visualEditor = { document: visualDoc, setDecorations(type, options) {
            for (const option of options) {
                const range = option.range || option;
                assert.equal(typeof range.start?.line, 'number', 'decoration has a valid start');
                assert.equal(typeof range.end?.line, 'number', 'decoration has a valid end');
            }
            applied.push({ style: type.style, options });
        } };
        vscode.window.visibleTextEditors.length = 0;
        vscode.window.visibleTextEditors.push(visualEditor);
        visibleEditorsChanged();
        assert.ok(applied.some(({ style, options }) => style.fontStyle === 'italic' && options.some((option) => option.start?.line === 3)));
        assert.ok(applied.some(({ style, options }) => style.after?.color === '#aeb4bd' && options.some((option) => option.renderOptions?.after?.contentText.includes('camera3D'))));
        assert.ok(applied.some(({ style, options }) => style.after?.backgroundColor === '#252a32' && options.some((option) => option.renderOptions?.after?.contentText.startsWith(' = '))));
        assert.ok(applied.some(({ style, options }) => style.opacity === '0' && options.length === 2));
        assert.ok(applied.some(({ style, options }) => style.color && options.some((option) => option.start?.line === 2 && option.end?.character === 24)));
    } finally {
        Module._load = originalLoad;
        delete require.cache[require.resolve("./extension")];
    }
});
