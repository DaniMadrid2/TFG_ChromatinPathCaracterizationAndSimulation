import { GameObject, MCTX } from "../Game/Game.mjs";
import { Vector2D } from "../Matrix/Matrix.mjs";
type ColorObj = {
    r?: number;
    g?: number;
    b?: number;
};
type WidthObj = {
    w?: number;
    h?: number;
};
export declare class MathJaxLoader {
    static loadEq(eq: string, color?: ColorObj | string, width?: WidthObj, filterColor?: (img: HTMLImageElement, color: ColorObj, width: WidthObj) => string): HTMLImageElement & {
        loaded: boolean;
    };
    static loadEquation(eq: string, color?: ColorObj | string, width?: WidthObj, filterColor?: (img: HTMLImageElement, color: ColorObj, width: WidthObj) => string): HTMLImageElement & {
        loaded: boolean;
    };
    static filterColorExample(img: any, color: ColorObj, width: WidthObj): string;
    static logHTMLElement(element: HTMLElement, level?: number): void;
    static getLatexPaths(eq: string | String): {
        d: string;
        x: number;
        y: number;
        sx: number;
        sy: number;
    }[];
    private static getTranslateValues;
    static extractPathsFromSVG(svgElement: SVGSVGElement): {
        d: string;
        x: number;
        y: number;
        sx: number;
        sy: number;
    }[];
    static getTransformMatrix(el: SVGElement): DOMMatrix;
    static drawPathsOnCanvas(paths: {
        d: string;
        x: number;
        y: number;
        sx: number;
        sy: number;
        color?: string | CanvasGradient | CanvasPattern;
    }[], canvas: HTMLCanvasElement, color?: ColorObj, size?: number, offset?: {
        x?: number;
        y?: number;
        sx?: number;
        sy?: number;
    }, time?: number): void;
}
export declare class MathJaxObject extends GameObject {
    latex: string;
    r: number;
    g: number;
    b: number;
    anim_time: number;
    paths: any[];
    is_static: boolean;
    constructor(latex: string, x?: number, y?: number, sx?: number, sy?: number, r?: number, g?: number, b?: number, anim_time?: number);
    setLatex(latex: string): void;
    reload(): void;
    setRGB(r: number, g: number, b: number): void;
    get anim(): number;
    set anim(anim: number);
    get sx(): number;
    get sy(): number;
    set sx(w: number);
    set sy(h: number);
    draw(ctx: MCTX): void;
}
export declare class MathJaxMatrix extends MathJaxObject {
    v1: Vector2D;
    v2: Vector2D;
    private last_latex;
    constructor(v1?: Vector2D, v2?: Vector2D, x?: number, y?: number, sx?: number, sy?: number, r?: number, g?: number, b?: number, anim_time?: number);
    getLatex(decimals?: number): string;
    tick(dt: number): void;
}
export {};
