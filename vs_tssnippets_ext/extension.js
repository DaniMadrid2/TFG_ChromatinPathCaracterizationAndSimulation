const vscode = require("vscode");

const OPTION_COLORS = [
    { color: "#00F5FF", background: "rgba(0, 245, 255, 0.10)" },
    { color: "#FF6A00", background: "rgba(255, 106, 0, 0.10)" },
    { color: "#fbff00", background: "rgba(225, 255, 0, 0.1)" },
    { color: "#19B5FE", background: "rgba(25, 181, 254, 0.10)" },
    { color: "#39FF14", background: "rgba(57, 255, 20, 0.10)" },
    { color: "#B026FF", background: "rgba(176, 38, 255, 0.10)" },
];

const DERIVED_STYLE = {
    fontStyle: "italic",
};

const OPTI_LINE_STYLE = {
    color: "#355dff",
};

const OPTI_FADED_STYLE = {
    color: "rgba(53, 93, 255, 0.55)",
};

const TEX_UNIT_COLORS = [
    // Grupo Cálidos (Evitando el amarillo pálido)
    "#E6194B", "#9A6324", "#FFD8B1", "#FABEBE", "#911EB4", "#F032E6", "#800000", "#FF1493",
    // Grupo Verdes/Cianos (Diferentes al azul estándar)
    "#3CB44B", "#AAFFC3", "#008080", "#2E8B57", "#00FF7F", "#ADFF2F", "#556B2F", "#00FF00",
    // Grupo Fríos (Diferentes al violeta de swap)
    "#4363D8", "#000075", "#469990", "#808000", "#000080", "#1E90FF", "#00BFFF", "#87CEEB",
    // Grupo Neutros/Tierra (Para completar los 32)
    "#F58231", "#FFE119", "#BFEF45", "#808080", "#A9A9A9", "#FFFFFF", "#BC8F8F", "#D2691E"
];

// Change this if you want a different tone for variables created with `name = uniforms { ... }`.
const UNIFORMS_BLOCK_VARIABLE_COLOR = "#dcdcaa";
const UNIFORMS_ASSIGNMENT_NAME_COLOR = "#ce9178";
// Change this if you want a different style for explicit uniforms that override a value coming from an included uniforms block.
const UNIFORM_OVERRIDE_TEXT_DECORATION = "underline solid #ffd166";

const SNIPPET_SELECTOR = { language: "ts-snippet", scheme: "*" };
const SHADERDSL_SELECTOR = { language: "parse-text-ts", scheme: "*" };

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

const derivedKeywordDecoration = vscode.window.createTextEditorDecorationType(DERIVED_STYLE);
const derivedVariableDecoration = vscode.window.createTextEditorDecorationType(DERIVED_STYLE);
const optiKeywordDecoration = vscode.window.createTextEditorDecorationType(OPTI_LINE_STYLE);
const optiFadedDecoration = vscode.window.createTextEditorDecorationType(OPTI_FADED_STYLE);

const tagDecorationPalette = OPTION_COLORS.map(({ color, background }) =>
    vscode.window.createTextEditorDecorationType({
        color,
        fontWeight: "700",
    }),
);

const optiDecoration = vscode.window.createTextEditorDecorationType({
    color: "#355dff",
    fontWeight: "700",
});

const resourceNameDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ffd166",
    fontWeight: "700",
});

const textureFormatDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ffd166",
    fontWeight: "700",
});

const textureTextLikeDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ce9178",
});

const uniformsBlockVariableDecoration = vscode.window.createTextEditorDecorationType({
    color: UNIFORMS_BLOCK_VARIABLE_COLOR,
    fontWeight: "700",
});

const shaderDslKeywordDecoration = vscode.window.createTextEditorDecorationType({
    color: "#569cd6",
    fontWeight: "700",
});

const uniformsAssignmentNameDecoration = vscode.window.createTextEditorDecorationType({
    color: UNIFORMS_ASSIGNMENT_NAME_COLOR,
});

const uniformOverrideDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: UNIFORM_OVERRIDE_TEXT_DECORATION,
});

const invalidShaderBindingDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ff6b6b",
    fontWeight: "700",
    textDecoration: "underline wavy #ff6b6b",
});

const warningDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ffd166",
    fontWeight: "700",
    textDecoration: "underline wavy #ffd166",
});

const dimensionXDecoration = vscode.window.createTextEditorDecorationType({
    color: "#c586c0",
    fontWeight: "700",
});

const emptySquareDecoration = vscode.window.createTextEditorDecorationType({
    before: {
        contentText: "□ ",
        color: "#7b7f86",
    },
});

const texUnitStateDecorations = {
    unused: vscode.window.createTextEditorDecorationType({ color: "#7b7f86", fontWeight: "600" }),
    single: vscode.window.createTextEditorDecorationType({ fontWeight: "600" }),
    double: vscode.window.createTextEditorDecorationType({ color: "#14b1ff ", fontWeight: "600" }),
    multi: vscode.window.createTextEditorDecorationType({ color: "#dbdbdb  ", fontWeight: "900" }),
};

const textureBindingDecorations = TEX_UNIT_COLORS.map((color) =>
    vscode.window.createTextEditorDecorationType({
        color,
    }),
);

const rebindSquareDecorations = TEX_UNIT_COLORS.map((color) =>
    vscode.window.createTextEditorDecorationType({
        before: {
            contentText: "■ ",
            color,
        },
    }),
);

let runtimeContext = null;
const dynamicDecorationCache = new Map();
const SEARCH_EXCLUDE_GLOB = "**/{node_modules,dist,build,out,.git,.next,.turbo,coverage,tmp,.tmp_build}/**";
const searchUriCache = new Map();
const TEX2D_DECL_KEYWORD_RE = "(?:new-|in-)?tex2D";

function activate(context) {
    runtimeContext = context;
    console.log("[vs_tssnippets_ext] activate");

    const refreshAllEditors = () => {
        for (const editor of vscode.window.visibleTextEditors) {
            refreshEditorDecorations(editor);
        }
    };

    context.subscriptions.push(
        ...optionDecorations,
        ...blockDecorations,
        ...tagDecorationPalette,
        ...textureBindingDecorations,
        ...rebindSquareDecorations,
        delimiterDecoration,
        branchDecoration,
        derivedKeywordDecoration,
        derivedVariableDecoration,
        optiDecoration,
        resourceNameDecoration,
        textureFormatDecoration,
        textureTextLikeDecoration,
        shaderDslKeywordDecoration,
        uniformsBlockVariableDecoration,
        uniformsAssignmentNameDecoration,
        uniformOverrideDecoration,
        invalidShaderBindingDecoration,
        warningDecoration,
        dimensionXDecoration,
        emptySquareDecoration,
        texUnitStateDecorations.unused,
        texUnitStateDecorations.single,
        texUnitStateDecorations.double,
        texUnitStateDecorations.multi,
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
        vscode.languages.registerDefinitionProvider(SHADERDSL_SELECTOR, {
            provideDefinition(document, position) {
                return provideSnippetDefinition(document, position);
            },
        }),
        vscode.languages.registerReferenceProvider(SNIPPET_SELECTOR, {
            provideReferences(document, position) {
                return provideSnippetReferences(document, position);
            },
        }),
        vscode.languages.registerReferenceProvider(SHADERDSL_SELECTOR, {
            provideReferences(document, position) {
                return provideSnippetReferences(document, position);
            },
        }),
        vscode.languages.registerRenameProvider(SNIPPET_SELECTOR, {
            provideRenameEdits(document, position, newName) {
                return provideSnippetRenameEdits(document, position, newName);
            },
            prepareRename(document, position) {
                return prepareSnippetRename(document, position);
            },
        }),
        vscode.languages.registerRenameProvider(SHADERDSL_SELECTOR, {
            provideRenameEdits(document, position, newName) {
                return provideSnippetRenameEdits(document, position, newName);
            },
            prepareRename(document, position) {
                return prepareSnippetRename(document, position);
            },
        }),
        vscode.languages.registerHoverProvider(SHADERDSL_SELECTOR, {
            provideHover(document, position) {
                return provideShaderDslTagHover(document, position);
            },
        }),
        vscode.languages.registerCompletionItemProvider(
            SHADERDSL_SELECTOR,
            {
                async provideCompletionItems(document, position) {
                    return provideShaderDslCompletions(document, position);
                },
            },
            ".",
            "\"",
            " ",
            "{",
            "\n",
        ),
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
        vscode.workspace.onDidCreateFiles(invalidateSearchCache),
        vscode.workspace.onDidDeleteFiles(invalidateSearchCache),
        vscode.workspace.onDidRenameFiles(invalidateSearchCache),
    );

    refreshAllEditors();
}

function deactivate() {}

function isSearchableCodeDocument(document) {
    const name = document.fileName || "";
    return /\.(snippet\.ts|shaderdsl\.ts|ts|tsx|js|mjs|cjs)$/i.test(name);
}

function getWorkspaceCacheKey(document, family) {
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    return `${folder ? folder.uri.toString() : "workspace"}::${family}`;
}

async function getCachedWorkspaceUris(document, family, includeGlob) {
    const key = getWorkspaceCacheKey(document, family);
    const cached = searchUriCache.get(key);
    if (cached) {
        return cached;
    }
    const uris = await vscode.workspace.findFiles(includeGlob, SEARCH_EXCLUDE_GLOB);
    searchUriCache.set(key, uris);
    return uris;
}

function invalidateSearchCache() {
    searchUriCache.clear();
}

function stripLineComment(line) {
    const commentIndex = line.indexOf("//");
    return commentIndex >= 0 ? line.slice(0, commentIndex) : line;
}

function stripLineCommentPreserveLength(line) {
    const commentIndex = line.indexOf("//");
    if (commentIndex < 0) return line;
    return line.slice(0, commentIndex) + " ".repeat(line.length - commentIndex);
}

function stripLineCommentsPreserveOffsets(text) {
    return text.replace(/[^\r\n]*(?:\r\n|\n|\r|$)/g, (line) => {
        if (!line) return line;
        const newline = line.endsWith("\r\n")
            ? "\r\n"
            : line.endsWith("\n")
                ? "\n"
                : line.endsWith("\r")
                    ? "\r"
                    : "";
        const body = newline ? line.slice(0, -newline.length) : line;
        return stripLineCommentPreserveLength(body) + newline;
    });
}

function parseTex2DDeclarationLine(line) {
    const code = stripLineComment(line);
    const match = code.match(new RegExp(`^\\s*(${TEX2D_DECL_KEYWORD_RE})\\s+([A-Za-z_]\\w*)(?:\\s*(\\||~)\\s*([A-Za-z_]\\w*))?([\\s\\S]*)$`));
    if (!match) return null;
    return {
        keyword: match[1],
        internalName: match[2],
        aliasOperator: match[3] || "",
        aliasName: match[4] || "",
        tail: match[5] || "",
        isNewTexture: match[1] === "new-tex2D",
        isInputTexture: match[1] === "in-tex2D",
    };
}

function extractTex2DUnitIndex(line) {
    const match = stripLineComment(line).match(/\b(?:TexUnit|texUnit)(\d+)\b(?:\s*<=|\s*$)/);
    return match ? Number.parseInt(match[1], 10) : null;
}

function parseQuotedOrRawValue(value) {
    const trimmed = String(value || "").trim().replace(/;$/, "");
    if (!trimmed) return "";
    const quoted = trimmed.match(/^"(.*)"$/);
    if (quoted) return quoted[1];
    return trimmed;
}

function parseColorValue(value) {
    const raw = parseQuotedOrRawValue(value);
    return raw || null;
}

function parseAlphaValue(value) {
    const raw = parseQuotedOrRawValue(value);
    if (!raw) return null;
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? Math.max(0, Math.min(1, num)) : null;
}

function mixColorWithAlpha(color, alpha) {
    if (!color) return null;
    if (alpha === null || alpha === undefined) return color;
    const hex = color.trim();
    if (/^rgba?\(/i.test(hex)) return hex;
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return color;
    const expand = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const r = Number.parseInt(expand.slice(1, 3), 16);
    const g = Number.parseInt(expand.slice(3, 5), 16);
    const b = Number.parseInt(expand.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function collectTexUnitTokenSpans(code) {
    const spans = [];
    const aliasRootByName = new Map();
    const isTextureArrowContext = (line) => /\brebind\b/.test(line) || /^\s*[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*->/.test(line);
    const normalizeUnitToken = (token) => {
        const t = String(token || "").trim().replace(/^"(.*)"$/, "$1");
        const texUnitMatch = t.match(/^TexUnit(\d+)$/i);
        if (texUnitMatch) return Number.parseInt(texUnitMatch[1], 10);
        if (/^\d+$/.test(t)) return Number.parseInt(t, 10);
        return null;
    };
    const findAliasRoot = (name) => {
        let current = name;
        const seen = new Set();
        while (aliasRootByName.has(current) && !seen.has(current)) {
            seen.add(current);
            current = aliasRootByName.get(current);
        }
        return current;
    };
    const pushSpan = (start, token, unitIndex) => {
        if (unitIndex === null || unitIndex < 0 || unitIndex >= TEX_UNIT_COLORS.length) return;
        spans.push({ start, end: start + token.length, unitIndex, token });
    };

    let match;
    const texWordRegex = /\b(?:TexUnit|texUnit)(\d+)\b/g;
    while ((match = texWordRegex.exec(code)) !== null) {
        pushSpan(match.index, match[0], Number.parseInt(match[1], 10));
    }

    const tex2DUnitRegex = /\b(?:new-|in-)?tex2D\b[\s\S]*?\b(?:TexUnit|texUnit)?(\d+)\b(?:\s*<=|\s*$)/g;
    while ((match = tex2DUnitRegex.exec(code)) !== null) {
        const unitToken = match[0].match(/\b(?:TexUnit|texUnit)?(\d+)\b(?:\s*<=|\s*$)/);
        if (!unitToken) continue;
        const token = unitToken[0].replace(/\s*(?:<=|\s*)$/, "");
        const unitIndex = normalizeUnitToken(token);
        const tokenStart = match.index + match[0].lastIndexOf(token);
        pushSpan(tokenStart, token, unitIndex);
    }

    const tex2DArrayUnitRegex = /\btexture2DArray\b[\s\S]*?\b([A-Za-z_]\w*)\s+"[^"]*"\s+((?:TexUnit|texUnit)\d+|\d+)\b/g;
    while ((match = tex2DArrayUnitRegex.exec(code)) !== null) {
        const token = match[2];
        const unitIndex = normalizeUnitToken(token);
        const tokenStart = match.index + match[0].lastIndexOf(token);
        pushSpan(tokenStart, token, unitIndex);
    }

    const aliasRegex = /\b(?:let|var|const)?\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\b/g;
    while ((match = aliasRegex.exec(code)) !== null) {
        aliasRootByName.set(match[1], findAliasRoot(match[2]));
    }

    if (isTextureArrowContext(code)) {
        const arrowRegex = /->([^{}\n]+)/g;
        while ((match = arrowRegex.exec(code)) !== null) {
            const rhs = match[1];
            const rhsStart = match.index + 2;
            const unitTokenRegex = /\b(?:TexUnit|texUnit)?(\d+)\b/g;
            let unitMatch;
            while ((unitMatch = unitTokenRegex.exec(rhs)) !== null) {
                const token = unitMatch[0];
                const unitIndex = normalizeUnitToken(token);
                const tokenStart = rhsStart + unitMatch.index;
                pushSpan(tokenStart, token, unitIndex);
            }
        }
    }

    return spans;
}

function getOrCreateDecoration(style) {
    const key = JSON.stringify(style);
    let decoration = dynamicDecorationCache.get(key);
    if (!decoration) {
        decoration = vscode.window.createTextEditorDecorationType(style);
        dynamicDecorationCache.set(key, decoration);
        if (runtimeContext) {
            runtimeContext.subscriptions.push(decoration);
        }
    }
    return decoration;
}

function parseDefineTagBlocks(text) {
    const defs = new Map();
    const aliases = new Map();
    const blockRegex = /^\s*defineTag\s+([A-Za-z_]\w*)\s*\{([\s\S]*?)^\s*\}/gm;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
        const name = match[1];
        const body = match[2] || "";
        const def = {
            name,
            lineColor: null,
            commentColor: null,
            backgroundColor: null,
            lineAlpha: null,
            description: "",
            aliases: [],
        };
        const fieldRegex = /^\s*([A-Za-z_]\w*)\s*:\s*(.*?)\s*$/gm;
        let field;
        while ((field = fieldRegex.exec(body)) !== null) {
            const key = field[1].toLowerCase();
            const value = field[2];
            if (key === "linecolor") def.lineColor = parseColorValue(value);
            else if (key === "commentcolor") def.commentColor = parseColorValue(value);
            else if (key === "backgroundcolor") def.backgroundColor = parseColorValue(value);
            else if (key === "linealpha") def.lineAlpha = parseAlphaValue(value);
            else if (key === "description") def.description = parseQuotedOrRawValue(value);
            else if (key === "alias" || key === "aliases") {
                def.aliases = parseQuotedOrRawValue(value)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }
        defs.set(name.toLowerCase(), def);
        aliases.set(name.toLowerCase(), name.toLowerCase());
        for (const alias of def.aliases) {
            aliases.set(alias.toLowerCase(), name.toLowerCase());
        }
    }
    if (!defs.has("opti")) {
        defs.set("opti", {
            name: "opti",
            lineColor: "#355dff",
            commentColor: null,
            backgroundColor: null,
            lineAlpha: 0.5,
            description: "Optimization tag",
            aliases: [],
        });
        aliases.set("opti", "opti");
    }
    return { defs, aliases };
}

function parseResourceDefinitions(text) {
    const defs = new Map();
    const blockRegex = /^\s*resource\s+([A-Za-z_]\w*)(?:\s*-\s*([^{}]*?)\s*-)?\s*\{([\s\S]*?)^\s*\}/gm;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
        const name = match[1];
        const comment = (match[2] || "").trim();
        const body = match[3] || "";
        const def = {
            name,
            comment,
            format: "RGBAFloat",
            filter: "NEAREST",
            wrap: "CLAMP",
            start: match.index,
        };
        const fieldRegex = /^\s*(format|filter|wrap)\s*:\s*(.*?)\s*$/gm;
        let field;
        while ((field = fieldRegex.exec(body)) !== null) {
            const key = field[1].toLowerCase();
            const value = parseQuotedOrRawValue(field[2]);
            if (!value) continue;
            def[key] = value;
        }
        defs.set(name, def);
    }
    return defs;
}

function provideResourceHover(document, position) {
    const text = document.getText();
    const resourceDefs = parseResourceDefinitions(text);
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!range) return null;
    const name = document.getText(range);
    const def = resourceDefs.get(name);
    if (!def) return null;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${name}**`);
    if (def.comment) {
        md.appendMarkdown(`\n\n${def.comment}`);
    }
    md.appendMarkdown(`\n\nFormat: \`${def.format}\``);
    md.appendMarkdown(`\nFilter: \`${def.filter}\``);
    md.appendMarkdown(`\nWrap: \`${def.wrap}\``);
    return new vscode.Hover(md, range);
}

function getTexExampleNames() {
    return new Set([
        "RFloat", "RGFloat", "RGBFloat", "RGBAFloat",
        "RFloat16", "RGFloat16", "RGBFloat16", "RGBAFloat16",
        "R", "RG", "RGB", "RGBA",
        "RInt", "RGInt", "RGBInt", "RGBAInt",
        "RInt16", "RGInt16", "RGBInt16", "RGBAInt16",
        "RInt8", "RGInt8", "RGBInt8", "RGBAInt8",
        "RUInt", "RGUInt", "RGBUInt", "RGBAUInt",
        "RUInt16", "RGUInt16", "RGBUInt16", "RGBAUInt16",
        "RUInt8", "RGUInt8", "RGBUInt8", "RGBAUInt8",
        "RUBYTE8", "RGUBYTE8", "RGBUBYTE8", "RGBAUBYTE8",
        "NEAREST", "LINEAR", "CLAMP", "REPEAT", "MIRROR",
        "RGBA16", "RGBA16F", "R16F", "RG16F", "RGBA32F", "R32F", "RG32F",
    ]);
}

async function provideShaderDslCompletions(document, position) {
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const text = document.getText();
    const texExampleNames = Array.from(getTexExampleNames()).filter((name) => !["NEAREST", "LINEAR", "CLAMP", "REPEAT", "MIRROR"].includes(name));
    const resourceContext = findEnclosingResourceBlock(text, position);
    const glslFiltersContext = findEnclosingNamedBlock(text, position, "glslFilters");
    const rebindBlockProgram = findEnclosingRebindProgram(text, position);
    const programBlock = findEnclosingProgramDefinition(text, position, document.uri.fsPath);
    const outAliasesContext = findEnclosingOutAliasesContext(text, position, document.uri.fsPath);
    const currentBoundProgramName = findCurrentBoundProgramName(text, position);
    const texUnitTargetMatch = linePrefix.match(/^\s*([A-Za-z_]\w*)\s*->\s*(?:TexUnit|texUnit)?[A-Za-z0-9_]*$/);

    const drawOutputsMatch = linePrefix.match(/^\s*(?:drawPoints|drawLineStrip|drawLineLoop|drawLines|drawTriangleStrip|drawTriangleFan|drawTriangles)\b[\s\S]*?->\s*\[([^\]]*)$/);
    if (drawOutputsMatch && currentBoundProgramName) {
        const programDefs = parseProgramTextureDefinitions(text, document.uri.fsPath);
        const currentProgramDef = programDefs.get(currentBoundProgramName);
        const ioInfo = readFragmentShaderIO(currentProgramDef ? { ...currentProgramDef, name: currentBoundProgramName } : null);
        const textureEntries = currentProgramDef?.textures || [];
        const textureNames = textureEntries.map((entry) => entry.name);
        const outputTextureNames = ioInfo.outputs
            .map((out) => textureEntries.find((entry) => entry.internalName === out.name)?.name || null)
            .filter(Boolean);
        const ordered = [
            ...outputTextureNames,
            ...textureNames.filter((name) => !outputTextureNames.includes(name)),
        ];
        return [...new Set(ordered)].map((name, index) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
            item.detail = index < outputTextureNames.length ? `program output texture ${currentBoundProgramName}` : `texture ${currentBoundProgramName}`;
            return item;
        });
    }

    if (rebindBlockProgram && texUnitTargetMatch) {
        return buildTexUnitCompletionItems(text, texUnitTargetMatch[1]);
    }

    if (programBlock) {
        const outAliasesMatch = linePrefix.match(/^\s*out-aliases\s+([A-Za-z_]\w*)\s*:\s*(?:\[.*)?$/);
        if (outAliasesMatch) {
            const ioInfo = readFragmentShaderIO(programBlock);
            const firstOutput = ioInfo.outputs[0] || null;
            if (firstOutput && outAliasesMatch[1] === firstOutput.name) {
                const usedOutputs = collectProgramDrawOutputTargets(text).get(programBlock.name) || [];
                const item = new vscode.CompletionItem("out-aliases list", vscode.CompletionItemKind.Snippet);
                const indent = " ".repeat((document.lineAt(position.line).firstNonWhitespaceCharacterIndex || 0) + 3);
                const closeIndent = " ".repeat(document.lineAt(position.line).firstNonWhitespaceCharacterIndex || 0);
                const chunks = [];
                for (let i = 0; i < usedOutputs.length; i += 4) {
                    chunks.push(`${indent}${usedOutputs.slice(i, i + 4).join(" ")}`);
                }
                const body = usedOutputs.length
                    ? `[\n${chunks.join("\n")}\n${closeIndent}]`
                    : "[\n" + indent + "${1}\n" + closeIndent + "]";
                item.insertText = new vscode.SnippetString(body);
                item.detail = `first draw output textures for ${programBlock.name}`;
                return [item];
            }
        }
        const programTexCompletions = buildProgramTex2DCompletions(document, text, position, programBlock, texExampleNames);
        if (programTexCompletions.length) {
            return programTexCompletions;
        }
    }

        if (outAliasesContext?.programDef) {
            const ioInfo = readFragmentShaderIO(outAliasesContext.programDef);
            const firstOutput = ioInfo.outputs[0] || null;
            if (firstOutput && outAliasesContext.aliasName === firstOutput.name) {
                const usedOutputs = collectProgramDrawOutputTargets(text).get(outAliasesContext.programDef.name) || [];
                const declaredOutputs = (parseProgramOutAliases(text).get(outAliasesContext.programDef.name)?.get(outAliasesContext.aliasName)) || [];
                const missingOutputs = usedOutputs.filter((name) => !declaredOutputs.includes(name));
                return missingOutputs.map((name) => {
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                    item.detail = `missing out-alias for ${outAliasesContext.programDef.name}`;
                    return item;
                });
            }
        }

    if (resourceContext || /^\s*resource\s+[A-Za-z_]\w*\s*\{\s*$/.test(linePrefix) || /^\s*(format|filter|wrap)\s*:\s*[A-Za-z_0-9]*$/.test(linePrefix)) {
        if (/format\s*:\s*[A-Za-z_0-9]*$/.test(linePrefix)) {
            return texExampleNames.map((name) => new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant));
        }
        if (/filter\s*:\s*[A-Za-z_0-9]*$/.test(linePrefix)) {
            return ["NEAREST", "LINEAR"].map((name) => new vscode.CompletionItem(name, vscode.CompletionItemKind.EnumMember));
        }
        if (/wrap\s*:\s*[A-Za-z_0-9]*$/.test(linePrefix)) {
            return ["CLAMP", "REPEAT", "MIRROR"].map((name) => new vscode.CompletionItem(name, vscode.CompletionItemKind.EnumMember));
        }
        return [
            createSnippetCompletion("format", `format: \${1|${texExampleNames.join(",")}|}`, "resource field"),
            createSnippetCompletion("filter", "filter: ${1|NEAREST,LINEAR|}", "resource field"),
            createSnippetCompletion("wrap", "wrap: ${1|CLAMP,REPEAT,MIRROR|}", "resource field"),
        ];
    }

    if (glslFiltersContext || /^\s*glslFilters\s*\{?\s*$/.test(linePrefix) || /^\s*(both|vert|frag)?\s*"?[^"]*"?\s*"?[^"]*"?\s*->?\s*$/.test(linePrefix)) {
        return ["both", "vert", "frag"].map((name) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
            item.insertText = new vscode.SnippetString(`${name} "\${1:filePattern}" "\${2:searchPattern}" -> {\${3:replacement}}`);
            item.detail = "glslFilters stage";
            return item;
        });
    }

    const rebindMatch = linePrefix.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{?\s*$/);
    if (rebindMatch) {
        return await buildRebindTargetCompletions(document, text, rebindMatch[1]);
    }

    if (rebindBlockProgram && !linePrefix.includes("->")) {
        return await buildRebindTargetCompletions(document, text, rebindBlockProgram);
    }

    return [];
}

function createSnippetCompletion(label, snippet, detail) {
    const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
    item.insertText = new vscode.SnippetString(snippet);
    item.detail = detail;
    return item;
}

function buildProgramTex2DCompletions(document, text, position, programBlock, texExampleNames) {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const ioInfo = readFragmentShaderIO(programBlock);
    const resourceNames = Array.from(parseResourceDefinitions(text).keys());
    const missingInternalDeclMatch = lineText.match(new RegExp(`^\\s*(${TEX2D_DECL_KEYWORD_RE})(\\s+)(?=(?:~|RES\\b))`));

    if (new RegExp(`^\\s*${TEX2D_DECL_KEYWORD_RE}\\s*$`).test(linePrefix)) {
        return ioInfo.outputs.map((out) => {
            const item = new vscode.CompletionItem(out.name, vscode.CompletionItemKind.Variable);
            item.insertText = new vscode.SnippetString(`${out.name} ~ ${out.name}Tex RES ${out.sizeHint || "[${1:w} x ${2:h}]"} ${out.resourceHint || "${3:TauFloatTex}"} \${4:TexUnit0}`);
            item.detail = "fragment output";
            return item;
        });
    }

    if (missingInternalDeclMatch) {
        const insertionCharacter = lineText.indexOf(missingInternalDeclMatch[1]) + missingInternalDeclMatch[1].length + missingInternalDeclMatch[2].length;
        return ioInfo.outputs.map((out) => {
            const item = new vscode.CompletionItem(out.name, vscode.CompletionItemKind.Variable);
            item.insertText = out.name;
            item.range = new vscode.Range(position.line, insertionCharacter, position.line, insertionCharacter);
            item.detail = "fragment output";
            return item;
        });
    }

    const texDecl = parseTex2DDeclarationLine(lineText);
    if (texDecl) {
        const internalName = texDecl.internalName;
        const output = ioInfo.outputByName.get(internalName);
        const keywordStart = lineText.search(new RegExp(TEX2D_DECL_KEYWORD_RE));
        const nameStart = keywordStart + texDecl.keyword.length + 1;
        const nameEnd = nameStart + texDecl.internalName.length;
        const hasExistingStructure = /\bRES\b/.test(texDecl.tail) || /\b(?:TexUnit|texUnit)\d+\b/.test(texDecl.tail);
        const shouldOnlyReplaceInternalName = hasExistingStructure && position.character >= nameStart && position.character <= nameEnd + 1;

        if (shouldOnlyReplaceInternalName) {
            return ioInfo.outputs.map((out) => {
                const item = new vscode.CompletionItem(out.name, vscode.CompletionItemKind.Variable);
                item.insertText = out.name;
                item.range = new vscode.Range(position.line, nameStart, position.line, nameEnd);
                item.detail = "fragment output";
                return item;
            });
        }

        if (!/\sRES\b/.test(linePrefix)) {
            const item = new vscode.CompletionItem("RES", vscode.CompletionItemKind.Keyword);
            item.insertText = "RES";
            item.detail = "texture declaration";
            return [item];
        }
        if (/\sRES\s*$/.test(linePrefix)) {
            if (output?.sizeHint) {
                const item = new vscode.CompletionItem(output.sizeHint, vscode.CompletionItemKind.Value);
                item.insertText = output.sizeHint;
                item.detail = "size from fragment hint";
                return [item];
            }
        }
        if (/\[[^\]]*\]\s*$/.test(linePrefix)) {
            const items = [];
            let idx = 0;
            for (const name of resourceNames) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                item.detail = "resource";
                item.sortText = `0_${String(idx++).padStart(3, "0")}_${name}`;
                items.push(item);
            }
            idx = 0;
            for (const name of texExampleNames) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
                item.detail = "texture format";
                item.sortText = `1_${String(idx++).padStart(3, "0")}_${name}`;
                items.push(item);
            }
            return items;
        }
        const formatOrResourceMatch = linePrefix.match(/\[[^\]]*\]\s+([A-Za-z_]\w*)\s*$/);
        if (formatOrResourceMatch) {
            return buildTexUnitCompletionItems(text, internalName);
        }
    }

    return [];
}

function findEnclosingResourceBlock(text, position) {
    return findEnclosingNamedBlock(text, position, "resource", true);
}

function findEnclosingNamedBlock(text, position, blockName, allowNameSuffix = false) {
    const lines = text.split(/\r?\n/);
    for (let lineNo = position.line; lineNo >= 0; lineNo--) {
        const line = lines[lineNo];
        const escaped = escapeRegExp(blockName);
        const re = allowNameSuffix
            ? new RegExp(`^\\s*${escaped}\\s+[A-Za-z_]\\w*(?:\\s*-\\s*[^{}]*\\s*-)?\\s*\\{`)
            : new RegExp(`^\\s*${escaped}\\b[^{]*\\{`);
        if (re.test(line)) return true;
        if (/^\s*}\s*$/.test(line) && lineNo !== position.line) break;
    }
    return false;
}

function parseProgramTextureDefinitions(text, sourcePath = "") {
    const defs = new Map();
    const blockRegex = /^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{([\s\S]*?)^\s*\}/gm;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
        const programName = match[1];
        const fragPath = match[2] || "";
        const body = match[3] || "";
        const textures = [];
        const texRegex = new RegExp(`^\\s*(${TEX2D_DECL_KEYWORD_RE})\\s+([A-Za-z_]\\w*)(?:\\s*\\|\\s*([A-Za-z_]\\w*)|\\s*~\\s*([A-Za-z_]\\w*))?`, "gm");
        let texMatch;
        while ((texMatch = texRegex.exec(body)) !== null) {
            const keyword = texMatch[1];
            const internalName = texMatch[2];
            const aliasPipe = texMatch[3];
            const aliasTilde = texMatch[4];
            if (aliasTilde) {
                textures.push({ name: aliasTilde, isTexture: true, internalName, keyword });
            } else {
                textures.push({ name: internalName, isTexture: true, internalName, keyword });
                if (aliasPipe) textures.push({ name: aliasPipe, isTexture: true, internalName, keyword });
            }
        }
        defs.set(programName, { textures, fragPath, sourcePath });
    }
    return defs;
}

async function buildRebindTargetCompletions(document, text, programName) {
    const localDefs = parseProgramTextureDefinitions(text, document.uri.fsPath);
    const programDef = localDefs.get(programName) || { textures: [], fragPath: "", sourcePath: document.uri.fsPath };
    const uniformNames = readFragmentSamplerUniformNames(programDef);
    const names = new Map();
    for (const { name } of programDef.textures) names.set(name, "texture from program");
    for (const uniformName of uniformNames) {
        if (!names.has(uniformName)) names.set(uniformName, "sampler uniform from fragment");
    }
    return Array.from(names.entries()).map(([name, detail]) => {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
        item.detail = `${detail} ${programName}`;
        item.sortText = `0_${name}`;
        item.insertText = new vscode.SnippetString(`${name} -> \${1:TexUnit0}`);
        return item;
    });
}

function readFragmentSamplerUniformNames(programDef) {
    if (!programDef?.fragPath) return [];
    try {
        const path = require("path");
        const fs = require("node:fs");
        const normalized = programDef.fragPath.endsWith(".frag") ? programDef.fragPath : `${programDef.fragPath}.frag`;
        const baseDir = programDef.sourcePath ? path.dirname(programDef.sourcePath) : (vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd());
        const resolved = path.resolve(baseDir, "glsl", normalized);
        const fragText = fs.readFileSync(resolved, "utf8");
        const names = [];
        const uniformRegex = /^\s*uniform\s+(?:sampler2D|usampler2D|isampler2D)\s+([A-Za-z_]\w*)\s*;/gm;
        let match;
        while ((match = uniformRegex.exec(fragText)) !== null) {
            names.push(match[1]);
        }
        return names;
    } catch {
        return [];
    }
}

function readFragmentShaderIO(programDef) {
    const empty = { outputs: [], outputByName: new Map() };
    if (!programDef?.fragPath) return empty;
    try {
        const path = require("path");
        const fs = require("node:fs");
        const normalized = programDef.fragPath.endsWith(".frag") ? programDef.fragPath : `${programDef.fragPath}.frag`;
        const baseDir = programDef.sourcePath ? path.dirname(programDef.sourcePath) : (vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd());
        const resolved = path.resolve(baseDir, "glsl", normalized);
        const fragText = fs.readFileSync(resolved, "utf8");
        const outputs = [];
        const regexes = [
            /^[ \t]*layout[ \t]*\([^\)]*\)[ \t]*out\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_]\w*)[ \t]*;[ \t]*(?:\/\/|\/\*!?|\/\/\!|\*\/)?[ \t]*(.*)$/gm,
            /^[ \t]*out\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_]\w*)[ \t]*;[ \t]*(?:\/\/|\/\*!?|\/\/\!|\*\/)?[ \t]*(.*)$/gm,
        ];
        const seenNames = new Set();
        for (const regex of regexes) {
            let match;
            while ((match = regex.exec(fragText)) !== null) {
                const comment = match[3] || "";
                const sizeMatch = comment.match(/size\s*:\s*(\[[^\]]+\])/i);
                const outputName = match[2];
                if (seenNames.has(outputName)) {
                    continue;
                }
                seenNames.add(outputName);
                outputs.push({
                    type: match[1],
                    name: outputName,
                    sizeHint: sizeMatch ? sizeMatch[1] : "",
                    resourceHint: "",
                });
            }
        }
        return { outputs, outputByName: new Map(outputs.map((o) => [o.name, o])) };
    } catch {
        return empty;
    }
}

function parseDrawHeaderOutputs(code) {
    const match = code.match(/^\s*(?:drawPoints|drawLineStrip|drawLineLoop|drawLines|drawTriangleStrip|drawTriangleFan|drawTriangles)\b[\s\S]*?->\s*\[([^\]]*)\]/);
    if (!match) return [];
    return match[1].split(",").map((item) => item.trim()).filter(Boolean);
}

function analyzeDrawBlock(lines, startLine) {
    const rebinds = new Map();
    let hasFramebuffer = false;
    let depth = countNetBraces(stripLineComment(lines[startLine] || ""));
    let endLine = startLine;
    for (let lineNo = startLine + 1; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo] || "");
        if (/^\s*framebuffer\s*:/.test(code) || /^\s*framebuffer\b/.test(code)) {
            hasFramebuffer = true;
        }
        const pairRegex = /([A-Za-z_]\w*)\s*->\s*(?:TexUnit|texUnit)?(\d+)/g;
        let pair;
        while ((pair = pairRegex.exec(code)) !== null) {
            rebinds.set(pair[1], Number.parseInt(pair[2], 10));
        }
        depth += countNetBraces(code);
        endLine = lineNo;
        if (depth <= 0) {
            break;
        }
    }
    return { endLine, rebinds, hasFramebuffer };
}

function collectProgramDrawOutputTargets(text) {
    const lines = text.split(/\r?\n/);
    const byProgram = new Map();
    let currentProgram = null;
    let pendingFramebufferOutputs = null;
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        const useMatch = code.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
        if (useMatch) {
            currentProgram = useMatch[1];
        }
        const framebufferInlineMatch = code.match(/^\s*framebuffer\s+[A-Za-z_]\w*\s*\[([^\]]*)\]/);
        if (currentProgram && framebufferInlineMatch) {
            pendingFramebufferOutputs = framebufferInlineMatch[1]
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        const outputs = parseDrawHeaderOutputs(code);
        if (!currentProgram || outputs.length === 0) continue;
        const blockInfo = analyzeDrawBlock(lines, lineNo);
        if (pendingFramebufferOutputs?.length) {
            if (!byProgram.has(currentProgram)) {
                byProgram.set(currentProgram, []);
            }
            byProgram.get(currentProgram).push(pendingFramebufferOutputs[0]);
            pendingFramebufferOutputs = null;
        } else if (blockInfo.hasFramebuffer) {
            if (!byProgram.has(currentProgram)) {
                byProgram.set(currentProgram, []);
            }
            byProgram.get(currentProgram).push(outputs[0]);
        }
        lineNo = Math.max(lineNo, blockInfo.endLine);
    }
    for (const [program, values] of byProgram.entries()) {
        byProgram.set(program, [...new Set(values)]);
    }
    return byProgram;
}

function findCurrentBoundProgramName(text, position) {
    const lines = text.split(/\r?\n/);
    let currentProgram = null;
    for (let lineNo = 0; lineNo <= position.line && lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        const useMatch = code.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
        if (useMatch) {
            currentProgram = useMatch[1];
        }
    }
    return currentProgram;
}

function parseProgramOutAliases(text) {
    const byProgram = new Map();
    const lines = text.split(/\r?\n/);
    let currentProgram = null;
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        const programMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]+)"\s*\{/);
        if (programMatch) {
            currentProgram = programMatch[1];
            if (!byProgram.has(currentProgram)) byProgram.set(currentProgram, new Map());
            continue;
        }
        const aliasMatch = code.match(/^\s*out-aliases\s+([A-Za-z_]\w*)\s*:\s*(.*)$/);
        if (!currentProgram || !aliasMatch) continue;
        const aliasName = aliasMatch[1];
        const values = [];
        let tail = (aliasMatch[2] || "").trim();
        if (tail.startsWith("[")) {
            tail = tail.slice(1).trim();
        }
        if (tail && tail !== "]") {
            values.push(...tail.replace(/\]$/, "").split(/\s+/).filter(Boolean));
        }
        while (!/\]\s*$/.test(lines[lineNo] || "")) {
            lineNo++;
            if (lineNo >= lines.length) break;
            const more = stripLineComment(lines[lineNo]).trim();
            if (!more || more === "]") continue;
            values.push(...more.replace(/\]$/, "").split(/\s+/).filter(Boolean));
        }
        byProgram.get(currentProgram).set(aliasName, values);
    }
    return byProgram;
}

function findEnclosingOutAliasesContext(text, position, sourcePath = "") {
    const lines = text.split(/\r?\n/);
    const currentProgram = findEnclosingProgramDefinition(text, position, sourcePath);
    for (let lineNo = position.line; lineNo >= 0; lineNo--) {
        const code = stripLineComment(lines[lineNo]);
        const match = code.match(/^\s*out-aliases\s+([A-Za-z_]\w*)\s*:\s*(.*)$/);
        if (!match) continue;
        let endLine = lineNo;
        while (endLine < lines.length && !/\]\s*$/.test(lines[endLine])) {
            endLine++;
        }
        if (position.line < lineNo || position.line > endLine) continue;
        return {
            programDef: currentProgram,
            aliasName: match[1],
            startLine: lineNo,
            endLine,
        };
    }
    return null;
}

function countNetBraces(code) {
    const opens = (code.match(/\{/g) || []).length;
    const closes = (code.match(/\}/g) || []).length;
    return opens - closes;
}

function isSpecialDrawBlockType(type) {
    return /^draw(?:Triangles|POINTS|LINE_STRIP|LINE_LOOP|LINES|TRIANGLE_STRIP|TRIANGLE_FAN|TRIANGLES)?$/i.test(String(type || ""));
}

function parseNamedAssignedBlocks(text, document) {
    const lines = text.split(/\r?\n/);
    const blocks = new Map();
    const stack = [];
    let depth = 0;

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        const headerMatch = code.match(/^\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\b[^{]*\{/);
        if (headerMatch) {
            const name = headerMatch[1];
            const type = headerMatch[2];
            stack.push({
                name,
                type,
                startLine: lineNo,
                startDepth: depth + 1,
                startOffset: document.offsetAt(new vscode.Position(lineNo, 0)),
                nameStart: line.indexOf(name),
            });
        }

        depth += countNetBraces(code);
        while (stack.length && depth < stack[stack.length - 1].startDepth) {
            const block = stack.pop();
            const nameStart = block.startOffset + Math.max(0, block.nameStart);
            blocks.set(block.name, {
                name: block.name,
                type: block.type,
                startLine: block.startLine,
                endLine: lineNo,
                nameRange: rangeFromOffsets(document, nameStart, nameStart + block.name.length),
            });
        }
    }

    return blocks;
}

function extractUniformEntriesFromLines(lines, startLine, endLine) {
    const assignments = [];
    const includes = [];
    for (let lineNo = startLine; lineNo <= endLine; lineNo++) {
        const rawLine = lines[lineNo] || "";
        const code = stripLineComment(rawLine);
        if (!code.trim()) continue;

        const assignmentRegex = /\b([A-Za-z_]\w*)\s*=/g;
        let assignmentMatch;
        while ((assignmentMatch = assignmentRegex.exec(code)) !== null) {
            assignments.push({
                name: assignmentMatch[1],
                lineNo,
                start: assignmentMatch.index,
                end: assignmentMatch.index + assignmentMatch[1].length,
            });
        }

        const includeMatch = code.match(/^\s*([A-Za-z_]\w*)\s*[;,]?\s*$/);
        if (includeMatch) {
            includes.push({
                name: includeMatch[1],
                lineNo,
                start: includeMatch.index + includeMatch[0].indexOf(includeMatch[1]),
                end: includeMatch.index + includeMatch[0].indexOf(includeMatch[1]) + includeMatch[1].length,
            });
        }
    }
    return { assignments, includes };
}

function resolveUniformNamesFromNamedBlock(blockName, namedBlocks, lines, cache, visiting = new Set()) {
    if (cache.has(blockName)) return cache.get(blockName);
    if (visiting.has(blockName)) return new Set();
    visiting.add(blockName);

    const block = namedBlocks.get(blockName);
    if (!block || block.type !== "uniforms") {
        const empty = new Set();
        cache.set(blockName, empty);
        visiting.delete(blockName);
        return empty;
    }

    const resolved = new Set();
    const entries = extractUniformEntriesFromLines(lines, block.startLine + 1, Math.max(block.startLine + 1, block.endLine - 1));
    for (const assignment of entries.assignments) {
        resolved.add(assignment.name);
    }
    for (const include of entries.includes) {
        const nested = resolveUniformNamesFromNamedBlock(include.name, namedBlocks, lines, cache, visiting);
        for (const uniformName of nested) {
            resolved.add(uniformName);
        }
    }

    cache.set(blockName, resolved);
    visiting.delete(blockName);
    return resolved;
}

function buildUniformBlockDiagnostics(document, text, namedBlocks) {
    const lines = text.split(/\r?\n/);
    const uniformNameCache = new Map();
    const overrideOptions = [];
    const duplicateErrorOptions = [];
    let depth = 0;
    const uniformsStack = [];

    const pushUniformContext = (lineNo, kind, blockName = "") => {
        uniformsStack.push({
            kind,
            blockName,
            startDepth: depth + 1,
            occurrences: [],
            startLine: lineNo,
        });
    };

    const pushRangeMessage = (target, range, message) => {
        target.push({
            range,
            hoverMessage: new vscode.MarkdownString(message),
        });
    };

    const analyzeUniformContext = (ctx) => {
        const seen = new Map();
        for (const occurrence of ctx.occurrences) {
            const previous = seen.get(occurrence.uniformName);
            if (!previous) {
                seen.set(occurrence.uniformName, occurrence);
                continue;
            }

            if (occurrence.source === "explicit" && previous.source === "include") {
                pushRangeMessage(
                    overrideOptions,
                    occurrence.range,
                    `\`${occurrence.uniformName}\` sobrescribe el valor heredado desde \`${previous.blockName}\`. La asignacion explicita gana.`,
                );
                seen.set(occurrence.uniformName, occurrence);
                continue;
            }

            const previousLabel = previous.source === "include"
                ? `ya llega desde \`${previous.blockName}\``
                : "ya estaba asignado antes en este mismo bloque";
            pushRangeMessage(
                duplicateErrorOptions,
                occurrence.range,
                `Uniform duplicado: \`${occurrence.uniformName}\` ${previousLabel}.`,
            );
            seen.set(occurrence.uniformName, occurrence);
        }
    };

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const namedUniformHeaderMatch = code.match(/^\s*([A-Za-z_]\w*)\s*=\s*uniforms\b[^{]*\{/);
        const plainUniformHeaderMatch = code.match(/^\s*uniforms\b(?:\s+([A-Za-z_]\w*))?\b[^{]*\{/);
        const opensUniformBlock = Boolean(namedUniformHeaderMatch || plainUniformHeaderMatch);

        if (opensUniformBlock) {
            pushUniformContext(lineNo, namedUniformHeaderMatch ? "named" : "inline", namedUniformHeaderMatch?.[1] || plainUniformHeaderMatch?.[1] || "");
        } else if (uniformsStack.length) {
            const current = uniformsStack[uniformsStack.length - 1];
            const entries = extractUniformEntriesFromLines(lines, lineNo, lineNo);
            for (const assignment of entries.assignments) {
                current.occurrences.push({
                    uniformName: assignment.name,
                    source: "explicit",
                    blockName: current.blockName,
                    range: rangeFromOffsets(document, lineStart + assignment.start, lineStart + assignment.end),
                });
            }
            for (const include of entries.includes) {
                const includedNames = resolveUniformNamesFromNamedBlock(include.name, namedBlocks, lines, uniformNameCache);
                for (const includedName of includedNames) {
                    current.occurrences.push({
                        uniformName: includedName,
                        source: "include",
                        blockName: include.name,
                        range: rangeFromOffsets(document, lineStart + include.start, lineStart + include.end),
                    });
                }
            }
        }

        depth += countNetBraces(code);
        while (uniformsStack.length && depth < uniformsStack[uniformsStack.length - 1].startDepth) {
            analyzeUniformContext(uniformsStack.pop());
        }
    }

    while (uniformsStack.length) {
        analyzeUniformContext(uniformsStack.pop());
    }

    return { overrideOptions, duplicateErrorOptions };
}

function buildTexUnitCompletionItems(text, targetName) {
    const usage = collectTextureUnitUsage(text);
    const rankedUnits = rankTexUnitsForTarget(usage, targetName);
    const units = [];
    for (const i of rankedUnits) {
        units.push({
            name: `TexUnit${i}`,
            count: usage.unitUseCount.get(i) || 0,
            preferred: rankedUnits[0] === i,
        });
    }
    return units.map((unit) => {
        const item = new vscode.CompletionItem(unit.name, vscode.CompletionItemKind.EnumMember);
        item.sortText = `${String(rankedUnits.indexOf(Number.parseInt(unit.name.replace("TexUnit", ""), 10))).padStart(3, "0")}_${unit.name}`;
        item.detail = unit.preferred ? "preferred for this target" : `used ${unit.count} times`;
        return item;
    });
}

function collectTextureUnitUsage(text) {
    const lines = text.split(/\r?\n/);
    const unitUseCount = new Map();
    const nameToUnit = new Map();
    const textureDeclaredUnit = new Map();
    const bindHistoryByName = new Map();
    const internalNameToUnits = new Map();
    for (const line of lines) {
        const code = stripLineComment(line);
        if (!code.trim()) continue;
        const texDecl = parseTex2DDeclarationLine(code);
        const unit = extractTex2DUnitIndex(code);
        if (texDecl && unit !== null) {
            unitUseCount.set(unit, (unitUseCount.get(unit) || 0) + 1);
            const names = [texDecl.internalName, texDecl.aliasName].filter(Boolean);
            for (const name of names) {
                nameToUnit.set(name, unit);
                textureDeclaredUnit.set(name, unit);
            }
        }
        const texArrayDecl = code.match(/\b([A-Za-z_]\w*)(?:\s*\|=\s*([A-Za-z_]\w*))?\s*=\s*texture2DArray\s+[A-Za-z_]\w*\s+([A-Za-z_]\w*)\s+"([^"]+)"\s+(?:TexUnit|texUnit)(\d+)\b/);
        if (texArrayDecl) {
            const unit = Number.parseInt(texArrayDecl[5], 10);
            unitUseCount.set(unit, (unitUseCount.get(unit) || 0) + 1);
            const internalName = texArrayDecl[4];
            if (!internalNameToUnits.has(internalName)) internalNameToUnits.set(internalName, []);
            internalNameToUnits.get(internalName).push(unit);
            for (const name of [texArrayDecl[1], texArrayDecl[2], texArrayDecl[3]].filter(Boolean)) {
                nameToUnit.set(name, unit);
                textureDeclaredUnit.set(name, unit);
            }
        }
        const bindRegex = /\b([A-Za-z_]\w*)\s*->\s*(?:TexUnit|texUnit)(\d+)\b/g;
        let match;
        while ((match = bindRegex.exec(code)) !== null) {
            const unit = Number.parseInt(match[2], 10);
            unitUseCount.set(unit, (unitUseCount.get(unit) || 0) + 1);
            if (!bindHistoryByName.has(match[1])) bindHistoryByName.set(match[1], []);
            bindHistoryByName.get(match[1]).unshift(unit);
        }
    }
    return { unitUseCount, nameToUnit, textureDeclaredUnit, bindHistoryByName, internalNameToUnits };
}

function rankTexUnitsForTarget(usage, targetName) {
    const ranked = [];
    const pushUnique = (unit) => {
        if (unit === undefined || unit === null) return;
        if (unit < 0 || unit >= 32) return;
        if (!ranked.includes(unit)) ranked.push(unit);
    };

    if (usage.textureDeclaredUnit.has(targetName)) {
        pushUnique(usage.textureDeclaredUnit.get(targetName));
        for (const unit of usage.bindHistoryByName.get(targetName) || []) {
            pushUnique(unit);
        }
    } else {
        for (const unit of usage.internalNameToUnits.get(targetName) || []) {
            pushUnique(unit);
        }
    }

    const remaining = [];
    for (let i = 0; i < 32; i++) {
        if (!ranked.includes(i)) remaining.push(i);
    }
    remaining.sort((a, b) => {
        const ca = usage.unitUseCount.get(a) || 0;
        const cb = usage.unitUseCount.get(b) || 0;
        const ba = ca === 0 ? 0 : ca === 1 ? 1 : ca === 2 ? 2 : 3;
        const bb = cb === 0 ? 0 : cb === 1 ? 1 : cb === 2 ? 2 : 3;
        if (ba !== bb) return ba - bb;
        if (ca !== cb) return ca - cb;
        return a - b;
    });
    return ranked.concat(remaining);
}

function findEnclosingRebindProgram(text, position) {
    const lines = text.split(/\r?\n/);
    let insideAnonymousRebind = false;
    for (let lineNo = position.line; lineNo >= 0; lineNo--) {
        const line = stripLineComment(lines[lineNo]);
        const match = line.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{/);
        if (match) return match[1];
        if (/^\s*rebind\s*\{/.test(line)) {
            insideAnonymousRebind = true;
            continue;
        }
        if (insideAnonymousRebind) {
            const useMatch = line.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
            if (useMatch) return useMatch[1];
        }
        if (/^\s*}\s*$/.test(line) && lineNo !== position.line && !insideAnonymousRebind) break;
    }
    return null;
}

function findEnclosingUniformsProgram(text, position) {
    const lines = text.split(/\r?\n/);
    let insideAnonymousUniforms = false;
    for (let lineNo = position.line; lineNo >= 0; lineNo--) {
        const line = stripLineComment(lines[lineNo]);
        const namedMatch = line.match(/^\s*uniforms\s+([A-Za-z_]\w*)\s*\{/);
        if (namedMatch) return namedMatch[1];
        if (/^\s*uniforms\s*\{/.test(line)) {
            insideAnonymousUniforms = true;
            continue;
        }
        if (insideAnonymousUniforms) {
            const useMatch = line.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
            if (useMatch) return useMatch[1];
        }
        if (/^\s*}\s*$/.test(line) && lineNo !== position.line && !insideAnonymousUniforms) break;
    }
    return null;
}

function resolveTagName(rawName, aliasMap) {
    const lower = String(rawName || "").toLowerCase();
    return aliasMap.get(lower) || lower;
}

function findInlineTagUsages(code) {
    const usages = [];
    const prefixRegex = /^(\s*)([A-Za-z_]\w*)-(.*)$/;
    const prefixMatch = code.match(prefixRegex);
    if (prefixMatch) {
        usages.push({
            tag: prefixMatch[2],
            tagStart: prefixMatch.index + prefixMatch[1].length,
            tagEnd: prefixMatch.index + prefixMatch[1].length + prefixMatch[2].length + 1,
            commentStart: prefixMatch.index + prefixMatch[1].length + prefixMatch[2].length + 1,
            commentEnd: code.length,
            kind: "prefix",
        });
    }

    const inlineRegex = /(^|[^A-Za-z0-9_])-\s*([A-Za-z_]\w*)\s*-\s*([^{}]*?)(?=\s*(?:\{|$))/g;
    let m;
    while ((m = inlineRegex.exec(code)) !== null) {
        const prefixLen = m[1].length;
        usages.push({
            tag: m[2],
            tagStart: m.index + prefixLen,
            tagEnd: m.index + prefixLen + m[0].length - prefixLen,
            commentStart: m.index + prefixLen + m[0].indexOf(m[3]),
            commentEnd: m.index + prefixLen + m[0].indexOf(m[3]) + m[3].length,
            kind: "inline",
        });
    }
    return usages;
}

function provideShaderDslTagHover(document, position) {
    const line = document.lineAt(position.line).text;
    const code = stripLineComment(line);
    if (!code.trim()) return null;

    const resourceHover = provideResourceHover(document, position);
    if (resourceHover) return resourceHover;

    const { defs: tagDefs, aliases: tagAliases } = parseDefineTagBlocks(document.getText());
    const usages = findInlineTagUsages(code);
    const lineStart = document.offsetAt(new vscode.Position(position.line, 0));

    for (const usage of usages) {
        const start = lineStart + usage.tagStart;
        const end = lineStart + usage.tagEnd;
        if (position.character < usage.tagStart || position.character > usage.tagEnd) {
            continue;
        }
        const canonical = resolveTagName(usage.tag, tagAliases);
        const tagDef = tagDefs.get(canonical);
        if (!tagDef) return null;

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportHtml = false;
        md.appendMarkdown(`**${canonical}**`);
        if (tagDef.description) {
            md.appendMarkdown(`\n\n${tagDef.description}`);
        }
        if (tagDef.aliases && tagDef.aliases.length) {
            md.appendMarkdown(`\n\nAliases: ${tagDef.aliases.join(", ")}`);
        }
        if (tagDef.lineColor) {
            md.appendMarkdown(`\n\nLine color: \`${tagDef.lineColor}\``);
        }
        if (tagDef.commentColor) {
            md.appendMarkdown(`\nComment color: \`${tagDef.commentColor}\``);
        }
        if (tagDef.backgroundColor) {
            md.appendMarkdown(`\nBackground: \`${tagDef.backgroundColor}\``);
        }
        return new vscode.Hover(md, new vscode.Range(document.positionAt(start), document.positionAt(end)));
    }

    return null;
}

function refreshEditorDecorations(editor) {
    if (!editor) {
        return;
    }
    const lang = editor.document.languageId;
    const isSnippet = lang === "ts-snippet";
    const isShaderDsl = lang === "parse-text-ts";
    if (!isSnippet && !isShaderDsl) return;

    const optionRanges = OPTION_COLORS.map(() => []);
    const blockRanges = OPTION_COLORS.map(() => []);
    const delimiterRanges = [];
    const branchRanges = [];
    const tagRanges = OPTION_COLORS.map(() => []);
    const derivedKeywordRanges = [];
    const derivedVariableRanges = [];
    const optiRanges = [];
    const optiLineRanges = [];
    const optiFadedRanges = [];
    const optiTextRanges = [];
    const texUnitRanges = {
        unused: [],
        single: [],
        double: [],
        multi: [],
    };
    const textureRanges = TEX_UNIT_COLORS.map(() => []);
    const resourceNameRanges = [];
    const textureFormatRanges = [];
    const textureTextLikeRanges = [];
    const shaderDslKeywordRanges = [];
    const namedBlockVariableRanges = [];
    const namedBlockUsageRanges = [];
    const uniformsAssignmentNameRanges = [];
    const invalidShaderBindingOptions = [];
    const warningOptions = [];
    const duplicateUniformErrorOptions = [];
    const uniformOverrideOptions = [];
    const dimensionXRanges = [];
    const rebindSquareRangesByUnit = TEX_UNIT_COLORS.map(() => []);
    const rebindEmptySquareRanges = [];
    const text = editor.document.getText();
    const tagDefinitions = isShaderDsl ? parseDefineTagBlocks(text) : null;
    const namedBlocks = isShaderDsl ? parseNamedAssignedBlocks(text, editor.document) : new Map();

    for (const [key, decoration] of dynamicDecorationCache.entries()) {
        if (key.includes("\"contentText\"")) {
            continue;
        }
        editor.setDecorations(decoration, []);
    }

    if (isSnippet) {
        collectPlaceholderDecorations(editor.document, text, optionRanges, delimiterRanges);
        collectBranchDecorations(editor.document, text, branchRanges, blockRanges);
    }
    if (isShaderDsl) {
        collectTagDecorations(
            editor.document,
            text,
            editor,
            tagRanges,
            derivedKeywordRanges,
            derivedVariableRanges,
            optiRanges,
            optiLineRanges,
            optiFadedRanges,
            optiTextRanges,
            tagDefinitions,
        );
        collectTexUnitAndTextureDecorations(editor.document, text, texUnitRanges, textureRanges);
        collectResourceAndDslVisuals(
            editor.document,
            text,
            resourceNameRanges,
            textureFormatRanges,
            textureTextLikeRanges,
            shaderDslKeywordRanges,
            namedBlockVariableRanges,
            namedBlockUsageRanges,
            uniformsAssignmentNameRanges,
            invalidShaderBindingOptions,
            warningOptions,
            dimensionXRanges,
            rebindSquareRangesByUnit,
            rebindEmptySquareRanges,
            namedBlocks,
        );
        const uniformDiagnostics = buildUniformBlockDiagnostics(editor.document, text, namedBlocks);
        duplicateUniformErrorOptions.push(...uniformDiagnostics.duplicateErrorOptions);
        uniformOverrideOptions.push(...uniformDiagnostics.overrideOptions);
    }

    optionDecorations.forEach((decoration, index) => {
        editor.setDecorations(decoration, optionRanges[index]);
    });
    blockDecorations.forEach((decoration, index) => {
        editor.setDecorations(decoration, blockRanges[index]);
    });
    editor.setDecorations(delimiterDecoration, delimiterRanges);
    editor.setDecorations(branchDecoration, branchRanges);
    editor.setDecorations(derivedKeywordDecoration, derivedKeywordRanges);
    editor.setDecorations(derivedVariableDecoration, derivedVariableRanges);
    tagDecorationPalette.forEach((d, i) => editor.setDecorations(d, tagRanges[i]));
    editor.setDecorations(optiDecoration, optiRanges);
    editor.setDecorations(optiKeywordDecoration, optiTextRanges);
    editor.setDecorations(optiFadedDecoration, optiFadedRanges);
    editor.setDecorations(texUnitStateDecorations.unused, texUnitRanges.unused);
    editor.setDecorations(texUnitStateDecorations.single, texUnitRanges.single);
    editor.setDecorations(texUnitStateDecorations.double, texUnitRanges.double);
    editor.setDecorations(texUnitStateDecorations.multi, texUnitRanges.multi);
    textureBindingDecorations.forEach((d, i) => editor.setDecorations(d, textureRanges[i]));
    editor.setDecorations(resourceNameDecoration, resourceNameRanges);
    editor.setDecorations(textureFormatDecoration, textureFormatRanges);
    editor.setDecorations(textureTextLikeDecoration, textureTextLikeRanges);
    editor.setDecorations(shaderDslKeywordDecoration, shaderDslKeywordRanges);
    editor.setDecorations(uniformsBlockVariableDecoration, namedBlockVariableRanges.concat(namedBlockUsageRanges));
    editor.setDecorations(uniformsAssignmentNameDecoration, uniformsAssignmentNameRanges);
    editor.setDecorations(uniformOverrideDecoration, uniformOverrideOptions);
    editor.setDecorations(invalidShaderBindingDecoration, invalidShaderBindingOptions.concat(duplicateUniformErrorOptions));
    editor.setDecorations(warningDecoration, warningOptions);
    editor.setDecorations(dimensionXDecoration, dimensionXRanges);
    textureBindingDecorations.forEach((d, i) => {
        const squareDecoration = getOrCreateDecoration({
            before: {
                contentText: "■ ",
                color: TEX_UNIT_COLORS[i],
            },
        });
        editor.setDecorations(squareDecoration, rebindSquareRangesByUnit[i]);
    });
    editor.setDecorations(emptySquareDecoration, rebindEmptySquareRanges);
}

function collectTagDecorations(document, text, editor, tagRanges, derivedKeywordRanges, derivedVariableRanges, optiRanges, optiLineRanges, optiFadedRanges, optiTextRanges, tagDefinitionsInfo) {
    const lines = text.split(/\r?\n/);
    const colorById = new Map();
    const optiNames = new Set();
    const dynamicRanges = new Map();
    const { defs: tagDefs, aliases: tagAliases } = tagDefinitionsInfo || { defs: new Map(), aliases: new Map() };

    const addDynamicRange = (style, range) => {
        const decoration = getOrCreateDecoration(style);
        if (!dynamicRanges.has(decoration)) {
            dynamicRanges.set(decoration, []);
        }
        dynamicRanges.get(decoration).push(range);
    };

    const applyTagStyle = (tagName, lineNo, lineStart, lineEnd, lineText, tokenRange, commentRange) => {
        const canonicalTag = resolveTagName(tagName, tagAliases);
        const tagDef = tagDefs.get(canonicalTag) || null;
        const isOptiTag = canonicalTag === "opti" || tagName.toLowerCase() === "opti" || tagName.toLowerCase().startsWith("opti-");
        if (tagDef) {
            const lineColor = mixColorWithAlpha(tagDef.lineColor, tagDef.lineAlpha);
            if (lineColor) {
                if (commentRange && tagDef.commentColor) {
                    if (commentRange.start.character > 0) {
                        addDynamicRange(
                            { color: lineColor, fontWeight: "700" },
                            new vscode.Range(
                                new vscode.Position(lineNo, 0),
                                commentRange.start,
                            ),
                        );
                    }
                    if (commentRange.end.character < lineText.length) {
                        addDynamicRange(
                            { color: lineColor, fontWeight: "700" },
                            new vscode.Range(
                                commentRange.end,
                                new vscode.Position(lineNo, lineText.length),
                            ),
                        );
                    }
                } else {
                    addDynamicRange(
                        { color: lineColor, fontWeight: "700" },
                        rangeFromOffsets(document, lineStart, lineEnd),
                    );
                }
            }
            if (tagDef.backgroundColor) {
                addDynamicRange(
                    { isWholeLine: true, backgroundColor: tagDef.backgroundColor },
                    new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, lineText.length)),
                );
            }
            if (tagDef.commentColor && commentRange) {
                addDynamicRange(
                    { color: tagDef.commentColor, fontStyle: "italic" },
                    commentRange,
                );
            }
            return { isOptiTag };
        }
        return { isOptiTag };
    };

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const code = stripLineComment(line);
        if (!code.trim()) {
            continue;
        }

        const inlineTagRegex = /(^|[^A-Za-z0-9_])-\s*([A-Za-z0-9_][A-Za-z0-9_-]*)\s*-\s*([^{}]*?)(?=\s*(?:\{|$))/gi;
        let tagMatch;
        while ((tagMatch = inlineTagRegex.exec(code)) !== null) {
            const prefixLen = tagMatch[1].length;
            const tagTokenStart = lineStart + tagMatch.index + prefixLen;
            const tagTokenEnd = tagTokenStart + tagMatch[2].length + 2;
            const commentStartAbs = lineStart + tagMatch.index + prefixLen + tagMatch[0].indexOf(tagMatch[3]);
            const commentEndAbs = commentStartAbs + tagMatch[3].length;
            const resolved = applyTagStyle(
                tagMatch[2],
                lineNo,
                lineStart,
                lineStart + code.length,
                line,
                rangeFromOffsets(document, tagTokenStart, tagTokenEnd),
                commentEndAbs > commentStartAbs ? rangeFromOffsets(document, commentStartAbs, commentEndAbs) : null,
            );

            if (!resolved.isOptiTag) {
                const rawTagId = tagMatch[2].toLowerCase();
                let paletteIndex = colorById.get(rawTagId);
                if (paletteIndex === undefined) {
                    paletteIndex = stableColorIndex(rawTagId, tagRanges.length);
                    colorById.set(rawTagId, paletteIndex);
                }
                tagRanges[paletteIndex].push(rangeFromOffsets(document, tagTokenStart, tagTokenEnd));
            } else {
                optiRanges.push(rangeFromOffsets(document, tagTokenStart, tagTokenEnd));
                optiTextRanges.push(rangeFromOffsets(document, lineStart, lineStart + code.length));
                optiLineRanges.push(new vscode.Range(
                    new vscode.Position(lineNo, 0),
                    new vscode.Position(lineNo, code.length),
                ));
            }
        }

        const prefixMatch = code.match(/^(\s*)([A-Za-z_]\w*)-(.+)$/);
        if (prefixMatch) {
            const tagName = prefixMatch[2];
            const tagTokenStart = lineStart + prefixMatch[1].length;
            const tagTokenEnd = tagTokenStart + tagName.length + 1;
            const tagDef = tagDefs.get(resolveTagName(tagName, tagAliases)) || null;
            if (tagDef) {
                const commentStart = line.indexOf(prefixMatch[3]);
                const commentRange = commentStart >= 0 && tagDef.commentColor
                    ? rangeFromOffsets(document, lineStart + commentStart, lineStart + line.length)
                    : null;
                const lineColor = mixColorWithAlpha(tagDef.lineColor, tagDef.lineAlpha);
                if (lineColor) {
                    addDynamicRange(
                        { color: lineColor, fontWeight: "700" },
                        rangeFromOffsets(document, lineStart, lineStart + code.length),
                    );
                }
                if (tagDef.backgroundColor) {
                    addDynamicRange(
                        { isWholeLine: true, backgroundColor: tagDef.backgroundColor },
                        new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, line.length)),
                    );
                }
                if (commentRange) {
                    addDynamicRange(
                        { color: tagDef.commentColor, fontStyle: "italic" },
                        commentRange,
                    );
                }
                if (tagName.toLowerCase() === "opti") {
                    optiRanges.push(rangeFromOffsets(document, tagTokenStart, tagTokenEnd));
                    optiTextRanges.push(rangeFromOffsets(document, lineStart, lineStart + code.length));
                    optiLineRanges.push(new vscode.Range(
                        new vscode.Position(lineNo, 0),
                        new vscode.Position(lineNo, code.length),
                    ));
                }
            }
        }

        const optiVarRegex = /\bopti-(?:let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
        let ov;
        while ((ov = optiVarRegex.exec(code)) !== null) {
            const kwStart = lineStart + ov.index;
            const kwEnd = kwStart + ov[0].indexOf(ov[1]);
            optiRanges.push(rangeFromOffsets(document, kwStart, kwEnd));
            optiTextRanges.push(rangeFromOffsets(document, lineStart, lineStart + code.length));
            optiNames.add(ov[1]);
        }

        const wordRegex = /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g;
        let w;
        while ((w = wordRegex.exec(code)) !== null) {
            if (!optiNames.has(w[0])) continue;
            optiFadedRanges.push(rangeFromOffsets(document, lineStart + w.index, lineStart + w.index + w[0].length));
        }
    }

    const derivedRegex = /\b(?:let|var)\s+(derived)\s+([A-Za-z_]\w*)/g;
    let m;
    while ((m = derivedRegex.exec(text)) !== null) {
        const derivedStart = m.index + m[0].indexOf(m[1]);
        const varStart = m.index + m[0].lastIndexOf(m[2]);
        derivedKeywordRanges.push(rangeFromOffsets(document, derivedStart, derivedStart + m[1].length));
        derivedVariableRanges.push(rangeFromOffsets(document, varStart, varStart + m[2].length));
    }

    for (const [decoration, ranges] of dynamicRanges.entries()) {
        editor.setDecorations(decoration, ranges);
    }
}

function collectTexUnitAndTextureDecorations(document, text, texUnitRanges, textureRanges) {
    const lines = text.split(/\r?\n/);
    const currentTextureByName = new Map();
    const texturesPerUnit = new Map();
    const aliasRootByName = new Map();
    const programNames = new Set();
    const nonTextureNames = new Set();
    const isTextureArrowContext = (line) => /\brebind\b/.test(line) || /^\s*[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*->/.test(line);
    let currentBoundProgram = null;

    const findAliasRoot = (name) => {
        let current = name;
        const seen = new Set();
        while (aliasRootByName.has(current) && !seen.has(current)) {
            seen.add(current);
            current = aliasRootByName.get(current);
        }
        return current;
    };

    const registerAssociation = (name, unitIndex) => {
        if (!name || unitIndex < 0 || unitIndex >= TEX_UNIT_COLORS.length) return;
        currentTextureByName.set(name, unitIndex);
        if (!texturesPerUnit.has(unitIndex)) texturesPerUnit.set(unitIndex, new Set());
        texturesPerUnit.get(unitIndex).add(findAliasRoot(name));
    };

    const registerAliasAssociation = (aliasName, sourceName) => {
        aliasRootByName.set(aliasName, findAliasRoot(sourceName));
        const mappedUnit = currentTextureByName.get(sourceName);
        if (mappedUnit !== undefined) {
            registerAssociation(aliasName, mappedUnit);
        }
    };

    const parseTextureDecl = (line) => {
        const texDecl = parseTex2DDeclarationLine(line);
        const unitIndex = extractTex2DUnitIndex(line);
        if (texDecl && unitIndex !== null) {
            if (texDecl.aliasOperator === "~" && texDecl.aliasName) {
                nonTextureNames.add(texDecl.internalName);
                registerAssociation(texDecl.aliasName, unitIndex);
            } else {
                if (texDecl.aliasOperator === "|" && texDecl.aliasName) {
                    registerAssociation(texDecl.internalName, unitIndex);
                    registerAssociation(texDecl.aliasName, unitIndex);
                } else {
                    registerAssociation(texDecl.internalName, unitIndex);
                }
            }
            return;
        }
        const texArrAliasMatch = line.match(/\b([A-Za-z_]\w*)(?:\s*\|=\s*([A-Za-z_]\w*))?\s*=\s*texture2DArray\s+[A-Za-z_]\w*\s+([A-Za-z_]\w*)\s+"[^"]*"\s+(?:TexUnit|texUnit)?(\d+)\b/);
        if (texArrAliasMatch) {
            const unitIndex = Number.parseInt(texArrAliasMatch[4], 10);
            registerAssociation(texArrAliasMatch[1], unitIndex);
            if (texArrAliasMatch[2]) registerAssociation(texArrAliasMatch[2], unitIndex);
            registerAssociation(texArrAliasMatch[3], unitIndex);
            return;
        }
        const texArrMatch = line.match(/\btexture2DArray\s+[A-Za-z_]\w*\s+([A-Za-z_]\w*)\s+"[^"]*"\s+(?:TexUnit|texUnit)?(\d+)\b/);
        if (texArrMatch) {
            const unitIndex = Number.parseInt(texArrMatch[2], 10);
            registerAssociation(texArrMatch[1], unitIndex);
        }
    };

    const parseAliasAssignments = (line) => {
        const assignmentRegex = /\b(?:let|var|const)?\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\b/g;
        let match;
        while ((match = assignmentRegex.exec(line)) !== null) {
            registerAliasAssociation(match[1], match[2]);
        }
    };

    const normalizeUnitToken = (token) => {
        const t = String(token || "").trim().replace(/^"(.*)"$/, "$1");
        const texUnitMatch = t.match(/^TexUnit(\d+)$/i);
        if (texUnitMatch) return Number.parseInt(texUnitMatch[1], 10);
        if (/^\d+$/.test(t)) return Number.parseInt(t, 10);
        return null;
    };

    const parseNamesList = (lhs) => lhs
        .split(",")
        .map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
        .filter(Boolean);

    const parseUnitsList = (rhs) => rhs
        .split(",")
        .map((s) => normalizeUnitToken(s))
        .filter((v) => v !== null);

    const parseRebindSegments = (segment) => {
        const pairs = [];
        const arrowIdx = segment.indexOf("->");
        if (arrowIdx < 0) return pairs;
        const lhs = segment.slice(0, arrowIdx).trim();
        const rhs = segment.slice(arrowIdx + 2).trim();
        const names = parseNamesList(lhs);
        const units = parseUnitsList(rhs);
        const n = Math.min(names.length, units.length);
        for (let i = 0; i < n; i++) pairs.push([names[i], units[i]]);
        return pairs;
    };

    const unitRangesInLine = (code) => {
        const ranges = [];
        const pushExplicitRange = (start, token, unitIndex) => {
            if (unitIndex < 0 || unitIndex >= TEX_UNIT_COLORS.length) return;
            ranges.push({ start, end: start + token.length, unitIndex });
        };

        let match;
        const texWordRegex = /\b(?:TexUnit|texUnit)(\d+)\b/g;
        while ((match = texWordRegex.exec(code)) !== null) {
            pushExplicitRange(match.index, match[0], Number.parseInt(match[1], 10));
        }

        const tex2DUnitRegex = /\b(?:new-|in-)?tex2D\b[\s\S]*?\]\s+[A-Za-z_]\w*\s+((?:TexUnit|texUnit)\d+|\d+)\b(?:\s*<=|\s*$)/g;
        while ((match = tex2DUnitRegex.exec(code)) !== null) {
            const token = match[1];
            const unitIndex = normalizeUnitToken(token);
            if (unitIndex === null) continue;
            const tokenStart = match.index + match[0].lastIndexOf(token);
            pushExplicitRange(tokenStart, token, unitIndex);
        }

        const tex2DArrayUnitRegex = /(?:\b[A-Za-z_]\w*(?:\s*\|=\s*[A-Za-z_]\w*)?\s*=\s*)?\btexture2DArray\b[\s\S]*?\b([A-Za-z_]\w*)\s+"[^"]*"\s+((?:TexUnit|texUnit)\d+|\d+)\b/g;
        while ((match = tex2DArrayUnitRegex.exec(code)) !== null) {
            const token = match[2];
            const unitIndex = normalizeUnitToken(token);
            if (unitIndex === null) continue;
            const tokenStart = match.index + match[0].lastIndexOf(token);
            pushExplicitRange(tokenStart, token, unitIndex);
        }

        if (isTextureArrowContext(code)) {
            const arrowRegex = /->([^{}\n]+)/g;
            while ((match = arrowRegex.exec(code)) !== null) {
                const rhs = match[1];
                const rhsStart = match.index + 2;
                const unitTokenRegex = /\b(?:TexUnit|texUnit)?(\d+)\b/g;
                let unitMatch;
                while ((unitMatch = unitTokenRegex.exec(rhs)) !== null) {
                    const token = unitMatch[0];
                    const unitIndex = normalizeUnitToken(token);
                    if (unitIndex === null) continue;
                    pushExplicitRange(rhsStart + unitMatch.index, token, unitIndex);
                }
            }
        }

        return ranges;
    };

    for (const line of lines) {
        const code = stripLineComment(line);
        if (!code.trim()) continue;
        const programMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)\b/);
        if (programMatch) {
            programNames.add(programMatch[1]);
        }
        parseTextureDecl(code);
        parseAliasAssignments(code);

        const bindMatch = code.match(/\b([A-Za-z_]\w*)\.bind\(\s*"TexUnit(\d+)"\s*\)/);
        if (bindMatch) {
            registerAssociation(bindMatch[1], Number.parseInt(bindMatch[2], 10));
        }

        if (/\brebind\b/.test(code) || /->/.test(code)) {
            const parts = code.split(";").map((s) => s.trim()).filter(Boolean);
            for (const part of parts) {
                for (const [name, unit] of parseRebindSegments(part)) {
                    registerAssociation(name, unit);
                }
            }
        }
    }

    const unitUsageState = new Map();
    for (let i = 0; i < 32; i++) {
        const count = (texturesPerUnit.get(i)?.size) || 0;
        unitUsageState.set(i, count <= 0 ? "unused" : count === 1 ? "single" : count === 2 ? "double" : "multi");
    }

    const wordRegex = /[A-Za-z_$][A-Za-z0-9_$]*/g;
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        if (!code.trim()) continue;
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const useMatch = code.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
        if (useMatch) {
            currentBoundProgram = useMatch[1];
            programNames.add(currentBoundProgram);
        }

        parseTextureDecl(code);
        parseAliasAssignments(code);
        const bindMatch = code.match(/\b([A-Za-z_]\w*)\.bind\(\s*"TexUnit(\d+)"\s*\)/);
        if (bindMatch) {
            registerAssociation(bindMatch[1], Number.parseInt(bindMatch[2], 10));
        }
        if (/\brebind\b/.test(code) || /->/.test(code)) {
            const parts = code.split(";").map((s) => s.trim()).filter(Boolean);
            for (const part of parts) {
                for (const [name, unit] of parseRebindSegments(part)) {
                    registerAssociation(name, unit);
                }
            }
        }

        const drawOutputs = parseDrawHeaderOutputs(code);
        const drawHeaderEffectiveUnits = new Map();
        if (currentBoundProgram && drawOutputs.length) {
            const blockInfo = analyzeDrawBlock(lines, lineNo);
            for (const outputName of drawOutputs) {
                const reboundUnit = blockInfo.rebinds.get(outputName);
                const effectiveUnit = reboundUnit ?? currentTextureByName.get(outputName);
                if (effectiveUnit !== undefined) {
                    drawHeaderEffectiveUnits.set(outputName, effectiveUnit);
                    registerAssociation(outputName, effectiveUnit);
                }
            }
        }

        for (const unitRange of unitRangesInLine(code)) {
            texUnitRanges[unitUsageState.get(unitRange.unitIndex)].push(
                rangeFromOffsets(document, lineStart + unitRange.start, lineStart + unitRange.end),
            );
        }

        let w;
        wordRegex.lastIndex = 0;
        while ((w = wordRegex.exec(code)) !== null) {
            const token = w[0];
            const absStart = lineStart + w.index;
            const absEnd = absStart + token.length;

            const texUnitMatch = token.match(/^TexUnit(\d+)$/);
            if (texUnitMatch) {
                continue;
            }
            if (nonTextureNames.has(token)) {
                continue;
            }
            if (programNames.has(token)) {
                continue;
            }

            const overriddenUnit = drawHeaderEffectiveUnits.get(token);
            if (overriddenUnit !== undefined) {
                textureRanges[overriddenUnit].push(rangeFromOffsets(document, absStart, absEnd));
                continue;
            }

            const mappedUnit = currentTextureByName.get(token);
            if (mappedUnit !== undefined) {
                textureRanges[mappedUnit].push(rangeFromOffsets(document, absStart, absEnd));
            }
        }
    }
}

function collectResourceAndDslVisuals(
    document,
    text,
    resourceNameRanges,
    textureFormatRanges,
    textureTextLikeRanges,
    shaderDslKeywordRanges,
    namedBlockVariableRanges,
    namedBlockUsageRanges,
    uniformsAssignmentNameRanges,
    invalidShaderBindingOptions,
    warningOptions,
    dimensionXRanges,
    rebindSquareRangesByUnit,
    rebindEmptySquareRanges,
    namedBlocks,
) {
    const lines = text.split(/\r?\n/);
    const resourceDefs = parseResourceDefinitions(text);
    const texExampleNames = getTexExampleNames();
    const programTextureDefs = parseProgramTextureDefinitions(text);
    const allKnownTextureNames = new Set(
        Array.from(programTextureDefs.values()).flatMap((programDef) => (programDef?.textures || []).map((entry) => entry.name))
    );
    const programOutAliases = parseProgramOutAliases(text);
    const drawOutputTargetsByProgram = collectProgramDrawOutputTargets(text);
    const currentTextureByName = new Map();
    let currentRebindProgram = null;
    let currentBoundProgram = null;
    let currentProgram = null;
    let depth = 0;
    let insideUniformsBlock = false;
    const pendingTextureUpdates = [];

    const pushErrorOption = (range, message) => {
        invalidShaderBindingOptions.push({
            range,
            hoverMessage: new vscode.MarkdownString(message),
        });
    };
    const pushWarningOption = (range, message) => {
        warningOptions.push({
            range,
            hoverMessage: new vscode.MarkdownString(message),
        });
    };

    const registerTextureName = (name, unitIndex) => {
        if (!name || unitIndex < 0 || unitIndex >= TEX_UNIT_COLORS.length) return;
        currentTextureByName.set(name, unitIndex);
    };

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        if (!code.trim()) continue;

        const programHeaderMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]+)"\s*\{/);
        if (programHeaderMatch) {
            currentProgram = {
                name: programHeaderMatch[1],
                fragPath: programHeaderMatch[2],
                sourcePath: document.uri.fsPath,
            };
        } else if (/^\s*}\s*$/.test(code) && currentProgram && !currentRebindProgram) {
            currentProgram = null;
        }

        const useMatch = code.match(/^\s*(?:lduse|use)\s+([A-Za-z_]\w*)\b/);
        if (useMatch) {
            currentBoundProgram = useMatch[1];
        }

        const outAliasesMatch = code.match(/^\s*(out-aliases)\s+([A-Za-z_]\w*)\s*:/);
        if (outAliasesMatch) {
            const keywordStart = line.indexOf(outAliasesMatch[1]);
            shaderDslKeywordRanges.push(rangeFromOffsets(document, lineStart + keywordStart, lineStart + keywordStart + outAliasesMatch[1].length));
            const aliasName = outAliasesMatch[2];
            const aliasStart = line.indexOf(aliasName, keywordStart + outAliasesMatch[1].length);
            if (aliasStart >= 0) {
                textureTextLikeRanges.push(rangeFromOffsets(document, lineStart + aliasStart, lineStart + aliasStart + aliasName.length));
                const shaderIO = readFragmentShaderIO(currentProgram);
                if (!shaderIO.outputByName.has(aliasName)) {
                    pushErrorOption(
                        rangeFromOffsets(document, lineStart + aliasStart, lineStart + aliasStart + aliasName.length),
                        `\`${aliasName}\` no existe como salida del fragment shader del programa \`${currentProgram?.name || "desconocido"}\`.`,
                    );
                } else {
                    const expected = drawOutputTargetsByProgram.get(currentProgram?.name || "") || [];
                    const declared = programOutAliases.get(currentProgram?.name || "")?.get(aliasName) || [];
                    const missing = expected.filter((name) => !declared.includes(name));
                    const extras = declared.filter((name) => !expected.includes(name));
                    if (missing.length || extras.length || expected.length !== declared.length) {
                        const details = [];
                        if (missing.length) details.push(`faltan: \`${missing.join(" ")}\``);
                        if (extras.length) details.push(`sobran: \`${extras.join(" ")}\``);
                        pushWarningOption(
                            rangeFromOffsets(document, lineStart + aliasStart, lineStart + aliasStart + aliasName.length),
                            `\`out-aliases ${aliasName}\` no coincide con las primeras salidas usadas por \`${currentProgram?.name || "desconocido"}\`. Esperado: \`${expected.join(" ")}\`${details.length ? `. ${details.join(". ")}.` : "."}`,
                        );
                    }
                }
            }
        }

        const resourceMatch = code.match(/^\s*resource\s+([A-Za-z_]\w*)(?:\s*-\s*([^{}]*?)\s*-)?\s*\{/);
        if (resourceMatch) {
            const name = resourceMatch[1];
            const start = line.indexOf(name);
            resourceNameRanges.push(rangeFromOffsets(document, lineStart + start, lineStart + start + name.length));
        }

        const namedBlockAssignmentMatch = code.match(/^\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\b[^{]*\{/);
        if (namedBlockAssignmentMatch && !isSpecialDrawBlockType(namedBlockAssignmentMatch[2])) {
            const name = namedBlockAssignmentMatch[1];
            const start = line.indexOf(name);
            namedBlockVariableRanges.push(rangeFromOffsets(document, lineStart + start, lineStart + start + name.length));
        }

        if (depth > 0) {
            const namedBlockUsageMatch = code.match(/^\s*([A-Za-z_]\w*)\s*[;,]?\s*$/);
            if (namedBlockUsageMatch) {
                const blockName = namedBlockUsageMatch[1];
                const blockDef = namedBlocks.get(blockName);
                if (blockDef && !isSpecialDrawBlockType(blockDef.type)) {
                    const start = line.indexOf(blockName);
                    namedBlockUsageRanges.push(rangeFromOffsets(document, lineStart + start, lineStart + start + blockName.length));
                }
            }
        }

        const uniformsAssignmentBlockMatch = code.match(/^\s*([A-Za-z_]\w*)\s*=\s*uniforms\b[^{]*\{/);
        if (uniformsAssignmentBlockMatch) {
            insideUniformsBlock = true;
        } else if (/^\s*uniforms\b[^{]*\{/.test(code)) {
            insideUniformsBlock = true;
        }

        if (insideUniformsBlock) {
            const assignmentNameRegex = /\b([A-Za-z_]\w*)\s*=\s*(?!\s*uniforms\b)/g;
            let assignmentMatch;
            while ((assignmentMatch = assignmentNameRegex.exec(code)) !== null) {
                const name = assignmentMatch[1];
                const start = lineStart + assignmentMatch.index;
                uniformsAssignmentNameRanges.push(rangeFromOffsets(document, start, start + name.length));
            }
        }

        const texDecl = parseTex2DDeclarationLine(code);
        const texUnitIndex = extractTex2DUnitIndex(code);
        if (texDecl && texUnitIndex !== null) {
            if (texDecl.aliasOperator === "~" && texDecl.aliasName) {
                const textLikeStart = line.indexOf(texDecl.internalName);
                textureTextLikeRanges.push(rangeFromOffsets(document, lineStart + textLikeStart, lineStart + textLikeStart + texDecl.internalName.length));
                if (!texDecl.isNewTexture) {
                    const shaderIO = readFragmentShaderIO(currentProgram);
                    if (!shaderIO.outputByName.has(texDecl.internalName) && !readFragmentSamplerUniformNames(currentProgram).includes(texDecl.internalName)) {
                        pushErrorOption(
                            rangeFromOffsets(document, lineStart + textLikeStart, lineStart + textLikeStart + texDecl.internalName.length),
                            `\`${texDecl.internalName}\` no existe en el fragment shader del programa \`${currentProgram?.name || "desconocido"}\` como salida ni como sampler uniform.`,
                        );
                    }
                }
            } else if (!texDecl.isNewTexture && texDecl.aliasOperator !== "|") {
                const shaderIO = readFragmentShaderIO(currentProgram);
                const internalStart = line.indexOf(texDecl.internalName);
                if (
                    texDecl.internalName
                    && internalStart >= 0
                    && !shaderIO.outputByName.has(texDecl.internalName)
                    && !readFragmentSamplerUniformNames(currentProgram).includes(texDecl.internalName)
                ) {
                    pushErrorOption(
                        rangeFromOffsets(document, lineStart + internalStart, lineStart + internalStart + texDecl.internalName.length),
                        `\`${texDecl.internalName}\` no existe en el fragment shader del programa \`${currentProgram?.name || "desconocido"}\` como salida ni como sampler uniform.`,
                    );
                }
            }
            if (texDecl.aliasOperator === "~" && texDecl.aliasName) {
                registerTextureName(texDecl.aliasName, texUnitIndex);
            } else {
                registerTextureName(texDecl.internalName, texUnitIndex);
                if (texDecl.aliasOperator === "|" && texDecl.aliasName) registerTextureName(texDecl.aliasName, texUnitIndex);
            }
        }

        const texArrMatch = code.match(/\b([A-Za-z_]\w*)(?:\s*\|=\s*([A-Za-z_]\w*))?\s*=\s*texture2DArray\s+([A-Za-z_]\w*)\s+(".*?")\s+(?:TexUnit|texUnit)?(\d+)\b/);
        if (texArrMatch) {
            registerTextureName(texArrMatch[1], Number.parseInt(texArrMatch[5], 10));
            if (texArrMatch[2]) registerTextureName(texArrMatch[2], Number.parseInt(texArrMatch[5], 10));
            registerTextureName(texArrMatch[3], Number.parseInt(texArrMatch[5], 10));
            const quoted = texArrMatch[4];
            const quotedStart = line.indexOf(quoted);
            textureTextLikeRanges.push(rangeFromOffsets(document, lineStart + quotedStart, lineStart + quotedStart + quoted.length));
        }

        const framebufferInlineMatch = code.match(/^\s*framebuffer\s+[A-Za-z_]\w*\s*\[([^\]]*)\]/);
        if (framebufferInlineMatch) {
            const outputs = framebufferInlineMatch[1].split(",").map((item) => item.trim()).filter(Boolean);
            for (const outputName of outputs) {
                const tokenIndex = line.indexOf(outputName);
                if (tokenIndex < 0) continue;
                if (!currentTextureByName.has(outputName)) {
                    const isKnownTexture = allKnownTextureNames.has(outputName);
                    if (isKnownTexture) {
                        continue;
                    }
                    pushErrorOption(
                        rangeFromOffsets(document, lineStart + tokenIndex, lineStart + tokenIndex + outputName.length),
                        `\`${outputName}\` no existe o no es una textura/copía de textura válida para framebuffer.`,
                    );
                }
            }
        }

        const dimRegex = /\[([^\]]+)\]/g;
        let dimMatch;
        while ((dimMatch = dimRegex.exec(code)) !== null) {
            const dimText = dimMatch[1];
            const localOffset = dimMatch.index + 1;
            const xRegex = /\sx\s/g;
            let xMatch;
            while ((xMatch = xRegex.exec(dimText)) !== null) {
                const abs = lineStart + localOffset + xMatch.index + 1;
                dimensionXRanges.push(rangeFromOffsets(document, abs, abs + 1));
            }
        }

        const wordRegex = /\b[A-Za-z_]\w*\b/g;
        let wordMatch;
        while ((wordMatch = wordRegex.exec(code)) !== null) {
            const token = wordMatch[0];
            if (resourceDefs.has(token) || texExampleNames.has(token)) {
                textureFormatRanges.push(rangeFromOffsets(document, lineStart + wordMatch.index, lineStart + wordMatch.index + token.length));
            }
        }

        const rebindHeaderMatch = code.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{/);
        if (rebindHeaderMatch) {
            currentRebindProgram = rebindHeaderMatch[1];
        } else if (/^\s*rebind\s*\{/.test(code)) {
            currentRebindProgram = currentBoundProgram;
        } else if (/^\s*}\s*$/.test(code)) {
            currentRebindProgram = null;
            insideUniformsBlock = false;
        }

        if (/^\s*rebind\b/.test(code) || /^\s*[A-Za-z_]\w*\s*->/.test(code)) {
            const pairRegex = /([A-Za-z_]\w*)\s*->\s*(?:TexUnit|texUnit)?(\d+)/g;
            let pair;
            while ((pair = pairRegex.exec(code)) !== null) {
                const lhs = pair[1];
                const lhsStart = lineStart + pair.index;
                const knownProgramTextures = new Set(((programTextureDefs.get(currentRebindProgram)?.textures) || []).map((entry) => entry.name));
                const isRealTexture = knownProgramTextures.has(lhs) || currentTextureByName.has(lhs);
                if (!isRealTexture) {
                    textureTextLikeRanges.push(rangeFromOffsets(document, lhsStart, lhsStart + lhs.length));
                    const currentProgramDef = programTextureDefs.get(currentRebindProgram);
                    const shaderIO = readFragmentShaderIO(currentProgramDef ? { ...currentProgramDef, sourcePath: document.uri.fsPath } : null);
                    const validNames = new Set([
                        ...shaderIO.outputs.map((o) => o.name),
                        ...readFragmentSamplerUniformNames(currentProgramDef ? { ...currentProgramDef, sourcePath: document.uri.fsPath } : null),
                    ]);
                    if (!validNames.has(lhs)) {
                        pushErrorOption(
                            rangeFromOffsets(document, lhsStart, lhsStart + lhs.length),
                            `\`${lhs}\` no pertenece al programa \`${currentRebindProgram || "desconocido"}\`: no existe como textura declarada, salida del fragment shader ni sampler uniform.`,
                        );
                    }
                    continue;
                }
                let prevUnit = currentTextureByName.get(lhs);
                for (const pending of pendingTextureUpdates) {
                    if (lineNo <= pending.endLine && pending.prevUnits.has(lhs)) {
                        prevUnit = pending.prevUnits.get(lhs);
                    }
                }
                if (prevUnit === undefined) {
                    rebindEmptySquareRanges.push(rangeFromOffsets(document, lhsStart, lhsStart));
                } else {
                    rebindSquareRangesByUnit[prevUnit].push(rangeFromOffsets(document, lhsStart, lhsStart));
                }
            }
        }

        const drawOutputs = parseDrawHeaderOutputs(code);
        if (currentBoundProgram && drawOutputs.length) {
            const blockInfo = analyzeDrawBlock(lines, lineNo);
            const prevUnits = new Map();
            const newUnits = new Map();
            for (const outputName of drawOutputs) {
                const tokenIndex = line.indexOf(outputName);
                if (tokenIndex < 0) continue;
                if (!currentTextureByName.has(outputName) && !allKnownTextureNames.has(outputName)) {
                    pushErrorOption(
                        rangeFromOffsets(document, lineStart + tokenIndex, lineStart + tokenIndex + outputName.length),
                        `\`${outputName}\` no existe o no es una textura/copía de textura válida para \`drawTriangles -> []\`.`,
                    );
                }
                const prevUnit = currentTextureByName.get(outputName);
                const effectiveUnit = blockInfo.rebinds.get(outputName) ?? prevUnit;
                prevUnits.set(outputName, prevUnit);
                newUnits.set(outputName, effectiveUnit);
                if (prevUnit === undefined) {
                    rebindEmptySquareRanges.push(rangeFromOffsets(document, lineStart + tokenIndex, lineStart + tokenIndex));
                } else {
                    rebindSquareRangesByUnit[prevUnit].push(rangeFromOffsets(document, lineStart + tokenIndex, lineStart + tokenIndex));
                }
            }
            pendingTextureUpdates.push({ endLine: blockInfo.endLine, prevUnits, newUnits });
        }

        for (let pendingIndex = pendingTextureUpdates.length - 1; pendingIndex >= 0; pendingIndex--) {
            const pending = pendingTextureUpdates[pendingIndex];
            if (pending.endLine === lineNo) {
                for (const [outputName, unitIndex] of pending.newUnits.entries()) {
                    if (unitIndex !== undefined) {
                        registerTextureName(outputName, unitIndex);
                    }
                }
                pendingTextureUpdates.splice(pendingIndex, 1);
            }
        }

        depth += countNetBraces(code);
    }
}

function stableColorIndex(tagId, size) {
    let h = 2166136261;
    for (let i = 0; i < tagId.length; i++) {
        h ^= tagId.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0) % Math.max(1, size);
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

    if (symbol.kind === "programPath") {
        const path = require("path");
        const resolved = path.resolve(path.dirname(document.uri.fsPath), "glsl", symbol.text.endsWith(".frag") ? symbol.text : `${symbol.text}.frag`);
        return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
    }

    const localDslContextLoc = resolveLocalShaderDslContextDefinition(document, position, symbol);
    if (localDslContextLoc) {
        return localDslContextLoc;
    }

    const rebindSymbolLoc = resolveRebindSymbolDefinition(document, position, symbol);
    if (rebindSymbolLoc) {
        return rebindSymbolLoc;
    }

    const uniformsSymbolLoc = resolveUniformsSymbolDefinition(document, position, symbol);
    if (uniformsSymbolLoc) {
        return uniformsSymbolLoc;
    }

    if (symbol.kind === "shaderIOName" && symbol.programName) {
        const refs = await findContextualSymbolReferences(document, symbol);
        if (refs && refs.length > 1) {
            return refs;
        }
    }

    if (symbol.kind === "parseTextImportPath" || symbol.kind === "parseTextImportMarker") {
        return resolveParseTextImportLocation(document, symbol);
    }

    if (symbol.kind === "texunit") {
        const docs = await getSearchDocuments(document, { family: "dsl-first" });
        let fallback = null;
        for (const doc of docs) {
            const loc = findTexUnitDefinition(doc, symbol.unitIndex);
            if (!loc) continue;
            const tokenText = doc.getText(loc.range);
            if (/^TexUnit\d+$/i.test(tokenText)) {
                return loc;
            }
            if (!fallback) {
                fallback = loc;
            }
        }
        return fallback;
    }

    const localDslLoc = findDslDefinition(document, symbol.text);
    if (localDslLoc) {
        return localDslLoc;
    }

    const declarationMatchers = buildDeclarationMatchers(symbol.text);
    const docs = await getSearchDocuments(document, { family: "code" });

    for (const doc of docs) {
        if (doc.uri.toString() === document.uri.toString()) {
            continue;
        }
        const dslLoc = findDslDefinition(doc, symbol.text);
        if (dslLoc) return dslLoc;
        const searchableText = stripLineCommentsPreserveOffsets(doc.getText());
        for (const matcher of declarationMatchers) {
            const match = matcher.exec(searchableText);
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

    if (symbol.kind === "texunit") {
        const docs = await getSearchDocuments(document, { family: "dsl-first" });
        const references = [];
        for (const doc of docs) {
            references.push(...findTexUnitReferences(doc, symbol.unitIndex));
        }
        return references;
    }

    const contextualReferences = await findContextualSymbolReferences(document, symbol);
    if (contextualReferences) {
        return contextualReferences;
    }

    const docs = await getSearchDocuments(document, { family: "code" });
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

function prepareSnippetRename(document, position) {
    const symbol = getSymbolAtPosition(document, position);
    if (!symbol || symbol.kind === "texunit" || symbol.kind === "programPath" || symbol.kind === "parseTextImportPath" || symbol.kind === "parseTextImportMarker") {
        return null;
    }
    const range = symbol.range || document.getWordRangeAtPosition(position, /[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!range) return null;
    return { range, placeholder: document.getText(range) };
}

async function provideSnippetRenameEdits(document, position, newName) {
    const symbol = getSymbolAtPosition(document, position);
    if (!symbol || !newName || symbol.kind === "texunit" || symbol.kind === "programPath" || symbol.kind === "parseTextImportPath" || symbol.kind === "parseTextImportMarker") {
        return null;
    }
    let references = await provideSnippetReferences(document, position);
    if (symbol.kind === "shaderIOName") {
        references = references.filter((ref) => ref.uri.toString() === document.uri.toString() || /\.(snippet\.ts|shaderdsl\.ts)$/i.test(ref.uri.fsPath || ""));
    }
    const edit = new vscode.WorkspaceEdit();
    for (const ref of references) {
        edit.replace(ref.uri, ref.range, newName);
    }
    return edit;
}

function getSymbolAtPosition(document, position) {
    const line = document.lineAt(position.line).text;
    const programPathSymbol = findProgramPathSymbolAtPosition(line, position.character);
    if (programPathSymbol) {
        return programPathSymbol;
    }
    const parseTextImportSymbol = findParseTextImportSymbolAtPosition(line, position.character);
    if (parseTextImportSymbol) {
        return parseTextImportSymbol;
    }
    const unitSymbol = findTexUnitSymbolAtPosition(line, position.character);
    if (unitSymbol) {
        return unitSymbol;
    }

    const contextualSymbol = findDslContextualSymbolAtPosition(document, position);
    if (contextualSymbol) {
        return contextualSymbol;
    }

    const range = document.getWordRangeAtPosition(position, /[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!range) {
        return null;
    }
    return {
        text: document.getText(range),
        range,
        kind: "text",
    };
}

function findDslContextualSymbolAtPosition(document, position) {
    const line = document.lineAt(position.line).text;
    const code = stripLineComment(line);
    const lineStart = document.offsetAt(new vscode.Position(position.line, 0));
    const absoluteOffset = document.offsetAt(position);

    const programMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
    if (programMatch) {
        const programName = programMatch[1];
        const programStart = lineStart + code.indexOf(programName);
        const programEnd = programStart + programName.length;
        if (absoluteOffset >= programStart && absoluteOffset <= programEnd) {
            return {
                text: programName,
                range: new vscode.Range(document.positionAt(programStart), document.positionAt(programEnd)),
                kind: "programName",
            };
        }
    }

    const rebindHeaderMatch = code.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{/);
    if (rebindHeaderMatch) {
        const programName = rebindHeaderMatch[1];
        const programStart = lineStart + code.indexOf(programName);
        const programEnd = programStart + programName.length;
        if (absoluteOffset >= programStart && absoluteOffset <= programEnd) {
            return {
                text: programName,
                range: new vscode.Range(document.positionAt(programStart), document.positionAt(programEnd)),
                kind: "programName",
            };
        }
    }

    const useOrUniformsMatch = code.match(/^\s*(use|uniforms)\s+([A-Za-z_]\w*)\b/);
    if (useOrUniformsMatch) {
        const programName = useOrUniformsMatch[2];
        const programStart = lineStart + code.indexOf(programName);
        const programEnd = programStart + programName.length;
        if (absoluteOffset >= programStart && absoluteOffset <= programEnd) {
            return {
                text: programName,
                range: new vscode.Range(document.positionAt(programStart), document.positionAt(programEnd)),
                kind: "programName",
            };
        }
    }

    const outAliasesMatch = code.match(/^\s*out-aliases\s+([A-Za-z_]\w*)\s*:/);
    if (outAliasesMatch) {
        const aliasName = outAliasesMatch[1];
        const aliasStart = lineStart + code.indexOf(aliasName);
        const aliasEnd = aliasStart + aliasName.length;
        if (absoluteOffset >= aliasStart && absoluteOffset <= aliasEnd) {
            const programDef = findEnclosingProgramDefinition(document.getText(), position, document.uri.fsPath);
            return {
                text: aliasName,
                range: new vscode.Range(document.positionAt(aliasStart), document.positionAt(aliasEnd)),
                kind: "shaderIOName",
                programName: programDef?.name || null,
                programDef,
            };
        }
    }

    const texDeclMatch = parseTex2DDeclarationLine(code);
    if (texDeclMatch) {
        const internalName = texDeclMatch.internalName;
        const internalStart = lineStart + code.indexOf(internalName);
        const internalEnd = internalStart + internalName.length;
        if (absoluteOffset >= internalStart && absoluteOffset <= internalEnd) {
            const programDef = findEnclosingProgramDefinition(document.getText(), position, document.uri.fsPath);
            return {
                text: internalName,
                range: new vscode.Range(document.positionAt(internalStart), document.positionAt(internalEnd)),
                kind: "shaderIOName",
                programName: programDef?.name || null,
                programDef,
            };
        }
    }

    const rebindProgramName = findEnclosingRebindProgram(document.getText(), position);
    if (rebindProgramName && code.includes("->")) {
        const arrowIndex = code.indexOf("->");
        const lhs = code.slice(0, arrowIndex);
        const lhsTokenRegex = /[A-Za-z_]\w*/g;
        let match;
        while ((match = lhsTokenRegex.exec(lhs)) !== null) {
            const tokenStart = lineStart + match.index;
            const tokenEnd = tokenStart + match[0].length;
            if (absoluteOffset >= tokenStart && absoluteOffset <= tokenEnd) {
                return {
                    text: match[0],
                    range: new vscode.Range(document.positionAt(tokenStart), document.positionAt(tokenEnd)),
                    kind: "shaderIOName",
                    programName: rebindProgramName,
                    programDef: findProgramDefinitionByNameInDocument(document, rebindProgramName),
                };
            }
        }
    }

    return null;
}

async function findContextualSymbolReferences(document, symbol) {
    if (symbol.kind === "programName") {
        const docs = await getSearchDocuments(document, { family: "dsl-first" });
        const references = [];
        for (const doc of docs) {
            references.push(...findProgramNameReferences(doc, symbol.text));
        }
        return dedupeLocations(references);
    }

    if (symbol.kind === "shaderIOName") {
        const references = [];
        if (symbol.programName) {
            const docs = await getSearchDocuments(document, { family: "dsl-first" });
            for (const doc of docs) {
                references.push(...findProgramScopedShaderIOReferences(doc, symbol.programName, symbol.text));
            }
        }
        const shaderLoc = resolveShaderIOInFragment(symbol.programDef, symbol.text);
        if (shaderLoc) {
            references.push(shaderLoc);
        }
        return dedupeLocations(references);
    }

    return null;
}

function findProgramNameReferences(document, programName) {
    const references = [];
    const lines = document.getText().split(/\r?\n/);
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const programMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
        if (programMatch && programMatch[1] === programName) {
            const start = lineStart + code.indexOf(programName);
            const end = start + programName.length;
            references.push(new vscode.Location(document.uri, rangeFromOffsets(document, start, end)));
        }
        const rebindMatch = code.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{/);
        if (rebindMatch && rebindMatch[1] === programName) {
            const start = lineStart + code.indexOf(programName);
            const end = start + programName.length;
            references.push(new vscode.Location(document.uri, rangeFromOffsets(document, start, end)));
        }
        const useOrUniformsMatch = code.match(/^\s*(use|uniforms)\s+([A-Za-z_]\w*)\b/);
        if (useOrUniformsMatch && useOrUniformsMatch[2] === programName) {
            const start = lineStart + code.indexOf(programName);
            const end = start + programName.length;
            references.push(new vscode.Location(document.uri, rangeFromOffsets(document, start, end)));
        }
    }
    return references;
}

function findProgramScopedShaderIOReferences(document, programName, symbolName) {
    const references = [];
    const regex = new RegExp(`\\b${escapeRegExp(symbolName)}\\b`, "g");
    const lines = document.getText().split(/\r?\n/);
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        let match;
        while ((match = regex.exec(code)) !== null) {
            const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
            const start = lineStart + match.index;
            const end = start + symbolName.length;
            references.push(new vscode.Location(document.uri, rangeFromOffsets(document, start, end)));
        }
    }
    return references;
}

function findNamedTokenReferencesInRange(document, token, startOffset, endOffset, lineFilter = null) {
    const references = [];
    const startPos = document.positionAt(startOffset);
    const endPos = document.positionAt(endOffset);
    for (let lineNo = startPos.line; lineNo <= endPos.line; lineNo++) {
        const line = document.lineAt(lineNo).text;
        if (lineFilter && !lineFilter(line)) {
            continue;
        }
        const code = stripLineComment(line);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const regex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "g");
        let match;
        while ((match = regex.exec(code)) !== null) {
            const start = lineStart + match.index;
            const end = start + token.length;
            references.push(new vscode.Location(document.uri, rangeFromOffsets(document, start, end)));
        }
    }
    return references;
}

function findProgramBlockRangeByName(document, programName) {
    for (let lineNo = 0; lineNo < document.lineCount; lineNo++) {
        const rawLine = document.lineAt(lineNo).text;
        const line = stripLineComment(rawLine);
        const match = line.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
        if (match && match[1] === programName) {
            const start = document.offsetAt(new vscode.Position(lineNo, 0));
            let end = document.offsetAt(document.lineAt(lineNo).range.end);
            for (let scan = lineNo + 1; scan < document.lineCount; scan++) {
                const candidateLine = document.lineAt(scan).text;
                const candidate = stripLineComment(candidateLine);
                end = document.offsetAt(document.lineAt(scan).range.end);
                if (/^\s*}\s*$/.test(candidate)) {
                    return { start, end };
                }
            }
            return { start, end };
        }
    }
    return null;
}

function findRebindBlockRangesByProgram(document, programName) {
    const ranges = [];
    for (let lineNo = 0; lineNo < document.lineCount; lineNo++) {
        const rawLine = document.lineAt(lineNo).text;
        const line = stripLineComment(rawLine);
        const match = line.match(/^\s*rebind\s+([A-Za-z_]\w*)\s*\{/);
        if (match && match[1] === programName) {
            const start = document.offsetAt(new vscode.Position(lineNo, 0));
            let end = document.offsetAt(document.lineAt(lineNo).range.end);
            for (let scan = lineNo + 1; scan < document.lineCount; scan++) {
                const candidateLine = document.lineAt(scan).text;
                const candidate = stripLineComment(candidateLine);
                end = document.offsetAt(document.lineAt(scan).range.end);
                if (/^\s*}\s*$/.test(candidate)) {
                    ranges.push({ start, end });
                    break;
                }
            }
        }
    }
    return ranges;
}

function findProgramDefinitionByNameInDocument(document, programName) {
    const text = document.getText();
    const defs = parseProgramTextureDefinitions(text, document.uri.fsPath);
    const programDef = defs.get(programName);
    if (!programDef) {
        return null;
    }
    return {
        name: programName,
        fragPath: programDef.fragPath || "",
        sourcePath: programDef.sourcePath || document.uri.fsPath,
    };
}

function dedupeLocations(locations) {
    const seen = new Set();
    const deduped = [];
    for (const loc of locations) {
        const key = `${loc.uri.toString()}:${loc.range.start.line}:${loc.range.start.character}:${loc.range.end.line}:${loc.range.end.character}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(loc);
    }
    return deduped;
}

function findTexUnitSymbolAtPosition(line, character) {
    for (const span of collectTexUnitTokenSpans(line)) {
        if (character >= span.start && character <= span.end) {
            return {
                text: `TexUnit${span.unitIndex}`,
                range: null,
                kind: "texunit",
                unitIndex: span.unitIndex,
            };
        }
    }

    return null;
}

function findParseTextImportSymbolAtPosition(line, character) {
    const importRegex = /^\s*import\s+<([A-Za-z_]\w*)>\s+from\s+([^\s]+)\s*$/;
    const match = line.match(importRegex);
    if (!match) {
        return null;
    }

    const marker = match[1];
    const rawPath = match[2];
    const pathText = rawPath.replace(/^["']|["']$/g, "");
    const markerStart = line.indexOf(`<${marker}>`) + 1;
    const markerEnd = markerStart + marker.length;
    if (character >= markerStart && character <= markerEnd) {
        return {
            text: marker,
            importPath: pathText,
            range: null,
            kind: "parseTextImportMarker",
        };
    }

    const pathStart = line.indexOf(rawPath) + (rawPath.startsWith("\"") || rawPath.startsWith("'") ? 1 : 0);
    const pathEnd = pathStart + pathText.length;
    if (character >= pathStart && character <= pathEnd) {
        return {
            text: pathText,
            importPath: pathText,
            range: null,
            kind: "parseTextImportPath",
        };
    }

    return null;
}

function findProgramPathSymbolAtPosition(line, character) {
    const match = line.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]+)"\s*\{/);
    if (!match) return null;
    const pathText = match[2];
    const start = line.indexOf(`"${pathText}"`) + 1;
    const end = start + pathText.length;
    if (character < start || character > end) return null;
    return {
        text: pathText,
        range: null,
        kind: "programPath",
    };
}

function resolveParseTextImportLocation(document, symbol) {
    const path = require("path");
    const fs = require("node:fs");
    const resolvedPath = path.resolve(path.dirname(document.uri.fsPath), symbol.importPath);

    if (symbol.kind === "parseTextImportPath") {
        return new vscode.Location(vscode.Uri.file(resolvedPath), new vscode.Position(0, 0));
    }

    try {
        const text = fs.readFileSync(resolvedPath, "utf8");
        const markerRegex = new RegExp(`<${escapeRegExp(symbol.text)}\\s*\\/?>`, "m");
        const match = markerRegex.exec(text);
        if (match) {
            return new vscode.Location(
                vscode.Uri.file(resolvedPath),
                rangeFromOffsets({ positionAt: (offset) => {
                    const docText = text.slice(0, offset).split(/\r?\n/);
                    const line = docText.length - 1;
                    const ch = docText[docText.length - 1].length;
                    return new vscode.Position(line, ch);
                } }, match.index, match.index + match[0].length),
            );
        }
    } catch {}

    return new vscode.Location(vscode.Uri.file(resolvedPath), new vscode.Position(0, 0));
}

function findTexUnitDefinition(document, unitIndex) {
    const lines = document.getText().split(/\r?\n/);
    let fallback = null;
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        for (const span of collectTexUnitTokenSpans(code)) {
            if (span.unitIndex === unitIndex) {
                const location = new vscode.Location(
                    document.uri,
                    rangeFromOffsets(document, lineStart + span.start, lineStart + span.end),
                );
                if (/^TexUnit\d+$/i.test(span.token)) {
                    return location;
                }
                if (!fallback) {
                    fallback = location;
                }
            }
        }
    }
    return fallback;
}

function resolveRebindSymbolDefinition(document, position, symbol) {
    if (symbol.kind !== "text" && symbol.kind !== "shaderIOName") return null;
    const text = document.getText();
    const programName = findEnclosingRebindProgram(text, position);
    if (!programName) return null;

    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    if (linePrefix.includes("->")) return null;

    const defs = parseProgramTextureDefinitions(text, document.uri.fsPath);
    const programDef = defs.get(programName);
    if (!programDef?.fragPath) return null;

    try {
        const path = require("path");
        const fs = require("node:fs");
        const normalized = programDef.fragPath.endsWith(".frag") ? programDef.fragPath : `${programDef.fragPath}.frag`;
        const baseDir = path.dirname(programDef.sourcePath || document.uri.fsPath);
        const resolved = path.resolve(baseDir, "glsl", normalized);
        const fragText = fs.readFileSync(resolved, "utf8");
        return resolveShaderIOInFragment({
            name: programName,
            fragPath: programDef.fragPath,
            sourcePath: programDef.sourcePath || document.uri.fsPath,
        }, symbol.text);
    } catch {
        return null;
    }
}

function resolveUniformsSymbolDefinition(document, position, symbol) {
    if (symbol.kind !== "text" && symbol.kind !== "shaderIOName") return null;
    const text = document.getText();
    const programName = findEnclosingUniformsProgram(text, position);
    if (!programName) return null;

    const line = document.lineAt(position.line).text;
    const code = stripLineComment(line);
    if (!isUniformNameAtPosition(code, position.character, symbol.text)) return null;

    const defs = parseProgramTextureDefinitions(text, document.uri.fsPath);
    const programDef = defs.get(programName);
    if (!programDef?.fragPath) return null;

    return resolveUniformInFragment({
        name: programName,
        fragPath: programDef.fragPath,
        sourcePath: programDef.sourcePath || document.uri.fsPath,
    }, symbol.text);
}

function isUniformNameAtPosition(code, character, symbolName) {
    if (!symbolName) return false;
    const assignmentRegex = /\b([A-Za-z_]\w*)\s*=\s*(?!uniforms\b)/g;
    let match;
    while ((match = assignmentRegex.exec(code)) !== null) {
        if (match[1] !== symbolName) continue;
        const start = match.index + match[0].indexOf(match[1]);
        const end = start + match[1].length;
        if (character >= start && character <= end) return true;
    }

    return false;
}

function resolveLocalShaderDslContextDefinition(document, position, symbol) {
    if (symbol.kind !== "text" && symbol.kind !== "shaderIOName" && symbol.kind !== "programName") return null;
    const line = document.lineAt(position.line).text;
    const code = stripLineComment(line);
    const lineStart = document.offsetAt(new vscode.Position(position.line, 0));

    const programMatch = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
    if (programMatch) {
        const programName = programMatch[1];
        const start = code.indexOf(programName);
        const end = start + programName.length;
        if (symbol.text === programName && position.character >= start && position.character <= end) {
            return new vscode.Location(document.uri, rangeFromOffsets(document, lineStart + start, lineStart + end));
        }
    }

    const useOrUniformsMatch = code.match(/^\s*(use|uniforms)\s+([A-Za-z_]\w*)\b/);
    if (useOrUniformsMatch) {
        const programName = useOrUniformsMatch[2];
        const start = code.indexOf(programName);
        const end = start + programName.length;
        if (symbol.text === programName && position.character >= start && position.character <= end) {
            const definition = findProgramNameDefinition(document, programName);
            if (definition) {
                return definition;
            }
        }
    }

    const texDeclMatch = parseTex2DDeclarationLine(code);
    if (texDeclMatch && symbol.text === texDeclMatch.internalName) {
        const tokenStart = code.indexOf(texDeclMatch.internalName);
        const tokenEnd = tokenStart + texDeclMatch.internalName.length;
        if (position.character >= tokenStart && position.character <= tokenEnd) {
            const programDef = findEnclosingProgramDefinition(document.getText(), position, document.uri.fsPath);
            const shaderIOLoc = resolveShaderIOInFragment(programDef, symbol.text);
            if (shaderIOLoc) return shaderIOLoc;
        }
    }

    return null;
}

function findProgramNameDefinition(document, programName) {
    const lines = document.getText().split(/\r?\n/);
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const code = stripLineComment(lines[lineNo]);
        const match = code.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
        if (!match || match[1] !== programName) {
            continue;
        }
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        const start = lineStart + code.indexOf(programName);
        const end = start + programName.length;
        return new vscode.Location(document.uri, rangeFromOffsets(document, start, end));
    }
    return null;
}

function findEnclosingProgramDefinition(text, position, sourcePath = "") {
    const lines = text.split(/\r?\n/);
    for (let lineNo = position.line; lineNo >= 0; lineNo--) {
        const line = stripLineComment(lines[lineNo]);
        const match = line.match(/^\s*program\s+([A-Za-z_]\w*)(?:\s*\|\s*[A-Za-z_]\w*)?\s+"([^"]*)"\s*\{/);
        if (match) {
            return { name: match[1], fragPath: match[2] || "", sourcePath };
        }
        if (/^\s*}\s*$/.test(line) && lineNo !== position.line) break;
    }
    return null;
}

function resolveShaderIOInFragment(programDef, symbolName) {
    if (!programDef?.fragPath || !symbolName) return null;
    try {
        const path = require("path");
        const fs = require("node:fs");
        const normalized = programDef.fragPath.endsWith(".frag") ? programDef.fragPath : `${programDef.fragPath}.frag`;
        const baseDir = path.dirname(programDef.sourcePath || "");
        const resolved = path.resolve(baseDir, "glsl", normalized);
        const fragText = fs.readFileSync(resolved, "utf8");
        const patterns = [
            new RegExp(`^\\s*uniform\\s+(?:sampler2D|usampler2D|isampler2D)\\s+${escapeRegExp(symbolName)}\\s*;`, "m"),
            new RegExp(`^\\s*layout\\s*\\([^\\)]*\\)\\s*out\\s+[A-Za-z_][A-Za-z0-9_]*\\s+${escapeRegExp(symbolName)}\\s*;`, "m"),
            new RegExp(`^\\s*out\\s+[A-Za-z_][A-Za-z0-9_]*\\s+${escapeRegExp(symbolName)}\\s*;`, "m"),
        ];
        for (const pattern of patterns) {
            const match = pattern.exec(fragText);
            if (!match) continue;
            const start = match.index + match[0].indexOf(symbolName);
            const end = start + symbolName.length;
            const pseudoDoc = {
                positionAt(offset) {
                    const lines = fragText.slice(0, offset).split(/\r?\n/);
                    return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
                },
            };
            return new vscode.Location(vscode.Uri.file(resolved), rangeFromOffsets(pseudoDoc, start, end));
        }
        return null;
    } catch {
        return null;
    }
}

function resolveUniformInFragment(programDef, symbolName) {
    if (!programDef?.fragPath || !symbolName) return null;
    try {
        const path = require("path");
        const fs = require("node:fs");
        const normalized = programDef.fragPath.endsWith(".frag") ? programDef.fragPath : `${programDef.fragPath}.frag`;
        const baseDir = path.dirname(programDef.sourcePath || "");
        const resolved = path.resolve(baseDir, "glsl", normalized);
        const fragText = fs.readFileSync(resolved, "utf8");
        const pattern = new RegExp(`^\\s*uniform\\s+(?:[A-Za-z_][A-Za-z0-9_]*\\s+){1,4}${escapeRegExp(symbolName)}\\s*(?:\\[[^\\]]*\\])?\\s*;`, "m");
        const match = pattern.exec(fragText);
        if (!match) return null;
        const start = match.index + match[0].indexOf(symbolName);
        const end = start + symbolName.length;
        const pseudoDoc = {
            positionAt(offset) {
                const lines = fragText.slice(0, offset).split(/\r?\n/);
                return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
            },
        };
        return new vscode.Location(vscode.Uri.file(resolved), rangeFromOffsets(pseudoDoc, start, end));
    } catch {
        return null;
    }
}

function findTexUnitReferences(document, unitIndex) {
    const references = [];
    const lines = document.getText().split(/\r?\n/);
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        const code = stripLineComment(line);
        const lineStart = document.offsetAt(new vscode.Position(lineNo, 0));
        for (const span of collectTexUnitTokenSpans(code)) {
            if (span.unitIndex === unitIndex) {
                references.push(new vscode.Location(
                    document.uri,
                    rangeFromOffsets(document, lineStart + span.start, lineStart + span.end),
                ));
            }
        }
    }
    return references;
}

function buildDeclarationMatchers(symbol) {
    const name = escapeRegExp(symbol);
    return [
        new RegExp(`^\\s*(?:const|let|var)\\s+${name}\\b`, "m"),
        new RegExp(`^\\s*(?:let|var)\\s*\\{[\\s\\S]*?\\b${name}\\s*=`, "m"),
        new RegExp(`^\\s*(?:async\\s+)?function\\s+${name}\\b`, "m"),
        new RegExp(`^\\s*class\\s+${name}\\b`, "m"),
        new RegExp(`^\\s*(?:interface|type|enum)\\s+${name}\\b`, "m"),
        new RegExp(`^\\s*${name}\\s*=\\s*\\(`, "m"),
        new RegExp(`^\\s*${name}\\s*:\\s*\\(`, "m"),
        new RegExp(`^\\s*program\\s+[^\\n{]*\\b${name}\\b`, "m"),
        new RegExp(`^\\s*(?:new-|in-)?tex2D\\s+[^\\n]*\\b${name}\\b`, "m"),
    ];
}

function findDslDefinition(document, symbol) {
    const escaped = escapeRegExp(symbol);
    const text = stripLineCommentsPreserveOffsets(document.getText());
    const checks = [
        new RegExp(`^\\s*(?:const|let|var)\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*(?:let|var)\\s*\\{[\\s\\S]*?\\b${escaped}\\s*=`, "m"),
        new RegExp(`^\\s*(?:async\\s+)?function\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*class\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*(?:interface|type|enum)\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*program\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*(?:new-|in-)?tex2D\\s+${escaped}(?:\\s*(?:\\||~|\\[|\\b))`, "m"),
        new RegExp(`^\\s*(?:new-|in-)?tex2D\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*(?:\\||~)\\s*${escaped}\\b`, "m"),
        new RegExp(`^\\s*texture2DArray\\s+[A-Za-z_][A-Za-z0-9_$]*\\s+${escaped}\\s+"`, "m"),
        new RegExp(`^\\s*resource\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*texturePreset\\s+${escaped}\\b`, "m"),
    ];
    for (const re of checks) {
        const m = re.exec(text);
        if (!m) continue;
        const start = m.index + m[0].lastIndexOf(symbol);
        const end = start + symbol.length;
        if (start >= m.index) {
            return new vscode.Location(document.uri, rangeFromOffsets(document, start, end));
        }
    }
    return null;
}

async function getSearchDocuments(currentDocument, options = {}) {
    const family = options.family || "code";
    const includeGlobs = family === "dsl-first"
        ? ["**/*.shaderdsl.ts", "**/*.snippet.ts"]
        : ["**/*.shaderdsl.ts", "**/*.snippet.ts", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"];

    const docs = [currentDocument];
    const seen = new Set([currentDocument.uri.toString()]);

    for (const doc of vscode.workspace.textDocuments) {
        if (!isSearchableCodeDocument(doc)) continue;
        const key = doc.uri.toString();
        if (seen.has(key)) continue;
        docs.push(doc);
        seen.add(key);
    }

    for (const includeGlob of includeGlobs) {
        const uris = await getCachedWorkspaceUris(currentDocument, `${family}:${includeGlob}`, includeGlob);
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
