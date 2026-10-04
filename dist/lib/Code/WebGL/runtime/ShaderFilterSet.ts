/**
 * Runtime for DSL shader filters. A `glslFilter` rule selects a shader stage,
 * file pattern, search pattern, and replacement; the parser collects those
 * rules and enables this runtime only when at least one rule exists.
 * Example: `glslFilters { both "demo.frag" "OLD" -> {"NEW"} }`.
 * `runtimeFeature.setup` creates one set, then generated shader loads call
 * `shaderFilters.make(stage, path)(source)` before compilation.
 */
/** A lazily evaluated filter rule assembled by the parser. */
type ShaderFilterRule = {
    stage: string;
    filePattern: () => string | RegExp;
    searchPattern: () => string | RegExp;
    replacement: () => unknown;
};

/** Applies the DSL's ordered GLSL substitutions for one shader load. */
export class ShaderFilterSet {
    /** Retains rules without evaluating DSL expressions before shader load. */
    constructor(private rules: ShaderFilterRule[]) {}

    /** Builds the stage- and file-specific source transform. */
    make(stage: string, filePathRaw: unknown) {
        return (source: unknown) => {
            let out = String(source ?? "");
            const filePath = String(filePathRaw ?? "");
            for (const rule of this.rules) {
                if (rule.stage !== "both" && rule.stage !== stage) continue;
                const filePattern = rule.filePattern();
                if (filePattern != null && filePattern !== "*") {
                    const matches = filePattern instanceof RegExp
                        ? ((filePattern.lastIndex = 0), filePattern.test(filePath))
                        : filePath.includes(String(filePattern));
                    if (!matches) continue;
                }
                const pattern = rule.searchPattern();
                const search = pattern instanceof RegExp ? new RegExp(pattern.source, pattern.flags) : String(pattern ?? "");
                const replacement = String(rule.replacement() ?? "");
                out = search instanceof RegExp ? out.replace(search, replacement) : out.split(search).join(replacement);
            }
            return out;
        };
    }
}

/** Parser hook: imports and initializes this runtime when filters are used. */
export const runtimeFeature: import("../parser/runtimeFeature.js").RuntimeFeature = {
    imports: ['import { ShaderFilterSet } from "/Code/WebGL/runtime/ShaderFilterSet.js";'],
    setup: ({ shaderFilterRules }) => [`const shaderFilters = new ShaderFilterSet([${shaderFilterRules}]);`],
};

/** Enables this runtime when the parser collected shader filter rules. */
export const detectUse = ({ shaderFilterRules }: import("../parser/runtimeFeature.js").RuntimeFeatureContext): boolean =>
    !!shaderFilterRules;
