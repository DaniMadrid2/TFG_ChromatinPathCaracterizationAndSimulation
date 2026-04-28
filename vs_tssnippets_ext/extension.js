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

let runtimeContext = null;
const dynamicDecorationCache = new Map();

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
        delimiterDecoration,
        branchDecoration,
        derivedKeywordDecoration,
        derivedVariableDecoration,
        optiDecoration,
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
        vscode.languages.registerHoverProvider(SHADERDSL_SELECTOR, {
            provideHover(document, position) {
                return provideShaderDslTagHover(document, position);
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

function stripLineComment(line) {
    const commentIndex = line.indexOf("//");
    return commentIndex >= 0 ? line.slice(0, commentIndex) : line;
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
    const normalizeUnitToken = (token) => {
        const t = String(token || "").trim().replace(/^"(.*)"$/, "$1");
        const texUnitMatch = t.match(/^TexUnit(\d+)$/i);
        if (texUnitMatch) return Number.parseInt(texUnitMatch[1], 10);
        if (/^\d+$/.test(t)) return Number.parseInt(t, 10);
        return null;
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

    const tex2DUnitRegex = /\btex2D\b[\s\S]*?\b(?:TexUnit|texUnit)?(\d+)\b(?:\s*<=|\s*$)/g;
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
    const text = editor.document.getText();
    const tagDefinitions = isShaderDsl ? parseDefineTagBlocks(text) : null;

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
    const programNames = new Set();
    const nonTextureNames = new Set();

    const registerAssociation = (name, unitIndex) => {
        if (!name || unitIndex < 0 || unitIndex >= TEX_UNIT_COLORS.length) return;
        currentTextureByName.set(name, unitIndex);
        if (!texturesPerUnit.has(unitIndex)) texturesPerUnit.set(unitIndex, new Set());
        texturesPerUnit.get(unitIndex).add(name);
    };

    const registerAliasAssociation = (aliasName, sourceName) => {
        const mappedUnit = currentTextureByName.get(sourceName);
        if (mappedUnit !== undefined) {
            registerAssociation(aliasName, mappedUnit);
        }
    };

    const parseTextureDecl = (line) => {
        const tex2DMatch = line.match(/\btex2D\s+([A-Za-z_]\w*)(?:\s*\|\s*([A-Za-z_]\w*)|\s*~\s*([A-Za-z_]\w*))?(?:[\s\S]*?)\b(?:TexUnit|texUnit)(\d+)\b(?:\s*<=|\s*$)/);
        if (tex2DMatch) {
            const unitIndex = Number.parseInt(tex2DMatch[4], 10);
            if (tex2DMatch[3]) {
                nonTextureNames.add(tex2DMatch[1]);
                registerAssociation(tex2DMatch[3], unitIndex);
            } else {
                if (tex2DMatch[2]) {
                    registerAssociation(tex2DMatch[1], unitIndex);
                    registerAssociation(tex2DMatch[2], unitIndex);
                } else {
                    registerAssociation(tex2DMatch[1], unitIndex);
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
        const assignmentRegex = /\b([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\b/g;
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

        const tex2DUnitRegex = /\btex2D\b[\s\S]*?\]\s+[A-Za-z_]\w*\s+((?:TexUnit|texUnit)\d+|\d+)\b(?:\s*<=|\s*$)/g;
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

            const mappedUnit = currentTextureByName.get(token);
            if (mappedUnit !== undefined) {
                textureRanges[mappedUnit].push(rangeFromOffsets(document, absStart, absEnd));
            }
        }
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

    if (symbol.kind === "texunit") {
        const docs = await getSearchDocuments(document);
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

    const docs = await getSearchDocuments(document);
    const declarationMatchers = buildDeclarationMatchers(symbol.text);

    for (const doc of docs) {
        const dslLoc = findDslDefinition(doc, symbol.text);
        if (dslLoc) return dslLoc;
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

    if (symbol.kind === "texunit") {
        const docs = await getSearchDocuments(document);
        const references = [];
        for (const doc of docs) {
            references.push(...findTexUnitReferences(doc, symbol.unitIndex));
        }
        return references;
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
    const line = document.lineAt(position.line).text;
    const unitSymbol = findTexUnitSymbolAtPosition(line, position.character);
    if (unitSymbol) {
        return unitSymbol;
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
        new RegExp(`\\b(?:const|let|var)\\s+${name}\\b`, "m"),
        new RegExp(`\\b(?:let|var)\\s*\\{[\\s\\S]*?\\b${name}\\s*=`, "m"),
        new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\b`, "m"),
        new RegExp(`\\bclass\\s+${name}\\b`, "m"),
        new RegExp(`\\b(?:interface|type|enum)\\s+${name}\\b`, "m"),
        new RegExp(`\\b${name}\\s*=\\s*\\(`, "m"),
        new RegExp(`\\b${name}\\s*:\\s*\\(`, "m"),
        new RegExp(`\\bprogram\\s+[^\\n{]*\\b${name}\\b`, "m"),
        new RegExp(`\\btex2D\\s+[^\\n]*\\b${name}\\b`, "m"),
    ];
}

function findDslDefinition(document, symbol) {
    const escaped = escapeRegExp(symbol);
    const checks = [
        new RegExp(`^\\s*(?:const|let|var)\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*(?:let|var)\\s*\\{[\\s\\S]*?\\b${escaped}\\s*=`, "m"),
        new RegExp(`^\\s*(?:async\\s+)?function\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*class\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*(?:interface|type|enum)\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*program\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*tex2D\\s+${escaped}(?:\\s*(?:\\||~|\\[|\\b))`, "m"),
        new RegExp(`^\\s*tex2D\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*(?:\\||~)\\s*${escaped}\\b`, "m"),
        new RegExp(`^\\s*texture2DArray\\s+[A-Za-z_][A-Za-z0-9_$]*\\s+${escaped}\\s+"`, "m"),
        new RegExp(`^\\s*resource\\s+${escaped}\\b`, "m"),
        new RegExp(`^\\s*texturePreset\\s+${escaped}\\b`, "m"),
    ];
    for (const re of checks) {
        const text = document.getText();
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

async function getSearchDocuments(currentDocument) {
    const uris = await vscode.workspace.findFiles("**/*.{snippet.ts,shaderdsl.ts,ts,tsx,js,mjs,cjs}");
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
