const vscode = require("vscode");

const OPTION_COLORS = [
    { color: "#00F5FF", background: "rgba(0, 245, 255, 0.10)" },
    { color: "#FF6A00", background: "rgba(255, 106, 0, 0.10)" },
    { color: "#fbff00", background: "rgba(225, 255, 0, 0.1)" },
    { color: "#19B5FE", background: "rgba(25, 181, 254, 0.10)" },
    { color: "#39FF14", background: "rgba(57, 255, 20, 0.10)" },
    { color: "#B026FF", background: "rgba(176, 38, 255, 0.10)" },
];

const SNIPPET_SELECTOR = { language: "ts-snippet", scheme: "*" };

const optionDecorations = OPTION_COLORS.map(({ color }) =>
    vscode.window.createTextEditorDecorationType({
        color,
        fontWeight: "700",
    }),
);

const blockDecorations = OPTION_COLORS.map(({ background }) =>
    vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: background,
    }),
);

const delimiterDecoration = vscode.window.createTextEditorDecorationType({
    color: "#7a7a7a",
    opacity: "0.9",
});

const branchDecoration = vscode.window.createTextEditorDecorationType({
    color: "#8b949e",
    fontStyle: "italic",
});

function activate(context) {
    console.log("[vs_tssnippets_ext] activate");

    const refreshAllEditors = () => {
        for (const editor of vscode.window.visibleTextEditors) {
            refreshEditorDecorations(editor);
        }
    };

    context.subscriptions.push(
        ...optionDecorations,
        ...blockDecorations,
        delimiterDecoration,
        branchDecoration,
        vscode.commands.registerCommand("vsTSSnippets.setTsSnippetLanguage", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            await vscode.languages.setTextDocumentLanguage(editor.document, "ts-snippet");
            refreshEditorDecorations(editor);
        }),
        vscode.commands.registerCommand("vsTSSnippets.setShaderDslLanguage", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            await vscode.languages.setTextDocumentLanguage(editor.document, "parse-text-ts");
            refreshEditorDecorations(editor);
        }),
        vscode.languages.registerDefinitionProvider(SNIPPET_SELECTOR, {
            provideDefinition(document, position) {
                return provideSnippetDefinition(document, position);
            },
        }),
        vscode.languages.registerReferenceProvider(SNIPPET_SELECTOR, {
            provideReferences(document, position) {
                return provideSnippetReferences(document, position);
            },
        }),
        vscode.window.onDidChangeActiveTextEditor((editor) => refreshEditorDecorations(editor)),
        vscode.window.onDidChangeVisibleTextEditors(refreshAllEditors),
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.visibleTextEditors.find(
                (candidate) => candidate.document.uri.toString() === event.document.uri.toString(),
            );
            if (editor) {
                refreshEditorDecorations(editor);
            }
        }),
    );

    refreshAllEditors();
}

function deactivate() {}

function refreshEditorDecorations(editor) {
    if (!editor || editor.document.languageId !== "ts-snippet") {
        return;
    }

    console.log("[vs_tssnippets_ext] decorate", editor.document.fileName);

    const optionRanges = OPTION_COLORS.map(() => []);
    const blockRanges = OPTION_COLORS.map(() => []);
    const delimiterRanges = [];
    const branchRanges = [];
    const text = editor.document.getText();

    collectPlaceholderDecorations(editor.document, text, optionRanges, delimiterRanges);
    collectBranchDecorations(editor.document, text, branchRanges, blockRanges);

    optionDecorations.forEach((decoration, index) => {
        editor.setDecorations(decoration, optionRanges[index]);
    });
    blockDecorations.forEach((decoration, index) => {
        editor.setDecorations(decoration, blockRanges[index]);
    });
    editor.setDecorations(delimiterDecoration, delimiterRanges);
    editor.setDecorations(branchDecoration, branchRanges);
}

function collectPlaceholderDecorations(document, text, optionRanges, delimiterRanges) {
    const placeholderRegex = /\$\[([\s\S]*?)\]\$/g;
    let match;
    while ((match = placeholderRegex.exec(text)) !== null) {
        const full = match[0];
        const inner = match[1];
        const matchStart = match.index;
        const innerStart = matchStart + 2;

        delimiterRanges.push(rangeFromOffsets(document, matchStart, matchStart + 2));
        delimiterRanges.push(rangeFromOffsets(document, matchStart + full.length - 2, matchStart + full.length));

        let tokenStart = 0;
        let optionIndex = 0;
        for (let i = 0; i <= inner.length; i++) {
            const atEnd = i === inner.length;
            const isSeparator = !atEnd && inner[i] === ",";
            if (!atEnd && !isSeparator) {
                continue;
            }

            const absoluteStart = innerStart + tokenStart;
            const absoluteEnd = innerStart + i;
            if (absoluteEnd > absoluteStart) {
                optionRanges[optionIndex % OPTION_COLORS.length].push(
                    rangeFromOffsets(document, absoluteStart, absoluteEnd),
                );
            }

            if (isSeparator) {
                delimiterRanges.push(rangeFromOffsets(document, innerStart + i, innerStart + i + 1));
            }

            tokenStart = i + 1;
            optionIndex += 1;
        }
    }
}

function collectBranchDecorations(document, text, branchRanges, blockRanges) {
    const branchRegex = /^\/\/\$\d+\s*-\s*(?:Begin|End|END)\b.*$/gm;
    const openBlocks = new Map();
    let match;
    while ((match = branchRegex.exec(text)) !== null) {
        const lineRange = rangeFromOffsets(document, match.index, match.index + match[0].length);
        branchRanges.push(lineRange);

        const blockMatch = match[0].match(/^\/\/\$(\d+)\s*-\s*(Begin|End|END)\b/i);
        if (!blockMatch) {
            continue;
        }

        const blockIndex = Number.parseInt(blockMatch[1], 10);
        const isBegin = /^begin$/i.test(blockMatch[2]);
        const line = document.positionAt(match.index).line;

        if (isBegin) {
            openBlocks.set(blockIndex, line);
            continue;
        }

        const startLine = openBlocks.get(blockIndex);
        if (startLine === undefined) {
            continue;
        }

        blockRanges[blockIndex % OPTION_COLORS.length].push(
            new vscode.Range(
                new vscode.Position(startLine, 0),
                document.lineAt(line).range.end,
            ),
        );
        openBlocks.delete(blockIndex);
    }

    const lastLine = Math.max(0, document.lineCount - 1);
    for (const [blockIndex, startLine] of openBlocks.entries()) {
        blockRanges[blockIndex % OPTION_COLORS.length].push(
            new vscode.Range(
                new vscode.Position(startLine, 0),
                document.lineAt(lastLine).range.end,
            ),
        );
    }
}

function rangeFromOffsets(document, start, end) {
    return new vscode.Range(document.positionAt(start), document.positionAt(end));
}

async function provideSnippetDefinition(document, position) {
    const symbol = getSymbolAtPosition(document, position);
    if (!symbol) {
        return null;
    }

    const docs = await getSearchDocuments(document);
    const declarationMatchers = buildDeclarationMatchers(symbol.text);

    for (const doc of docs) {
        for (const matcher of declarationMatchers) {
            const match = matcher.exec(doc.getText());
            if (!match) {
                continue;
            }
            const start = match.index + match[0].indexOf(symbol.text);
            const end = start + symbol.text.length;
            return new vscode.Location(doc.uri, rangeFromOffsets(doc, start, end));
        }
    }

    return null;
}

async function provideSnippetReferences(document, position) {
    const symbol = getSymbolAtPosition(document, position);
    if (!symbol) {
        return [];
    }

    const docs = await getSearchDocuments(document);
    const references = [];
    const finder = new RegExp(`\\b${escapeRegExp(symbol.text)}\\b`, "g");

    for (const doc of docs) {
        const text = doc.getText();
        let match;
        while ((match = finder.exec(text)) !== null) {
            const start = match.index;
            const end = start + symbol.text.length;
            references.push(new vscode.Location(doc.uri, rangeFromOffsets(doc, start, end)));
        }
    }

    return references;
}

function getSymbolAtPosition(document, position) {
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!range) {
        return null;
    }
    return {
        text: document.getText(range),
        range,
    };
}

function buildDeclarationMatchers(symbol) {
    const name = escapeRegExp(symbol);
    return [
        new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, "m"),
        new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\b`, "m"),
        new RegExp(`\\bclass\\s+${name}\\b`, "m"),
        new RegExp(`\\b(?:interface|type|enum)\\s+${name}\\b`, "m"),
        new RegExp(`\\b${name}\\s*=\\s*\\(`, "m"),
        new RegExp(`\\b${name}\\s*:\\s*\\(`, "m"),
    ];
}

async function getSearchDocuments(currentDocument) {
    const uris = await vscode.workspace.findFiles("**/*.{snippet.ts,ts,tsx,js,mjs,cjs}");
    const docs = [currentDocument];
    const seen = new Set([currentDocument.uri.toString()]);

    for (const uri of uris) {
        const key = uri.toString();
        if (seen.has(key)) {
            continue;
        }
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            docs.push(doc);
            seen.add(key);
        } catch {}
    }

    return docs;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
    activate,
    deactivate,
};
