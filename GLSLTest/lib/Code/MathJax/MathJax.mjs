import { GameObject } from "../Game/Game.mjs";
import { Matrix2D, Vector2D } from "../Matrix/Matrix.mjs";
function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function parseColor(color) {
    let rgba = color;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(rgba)) {
        return { ...hexToRgb(rgba) };
    }
    let [r, g, b] = rgba.match(/\d+/g);
    return { r: ~~r, g: ~~g, b: ~~b };
}
export class MathJaxLoader {
    static loadEq(eq, color, width, filterColor) {
        return this.loadEquation(eq, color, width, filterColor);
    }
    static loadEquation(eq, color, width = { w: 100, h: 100 }, filterColor) {
        if (typeof color == "string") {
            color = parseColor(color);
        }
        let svg = MathJax.tex2svg(eq).firstElementChild;
        svg.style = "fill:#060";
        let img = document.createElement('img');
        img.loaded = false;
        let once = (!!filterColor) || (typeof filterColor === "function");
        width?.w && (img.width = width?.w);
        width?.h && (img.height = width?.h);
        color ??= { r: 0, g: 0, b: 0 };
        color.r ??= 0;
        color.g ??= 0;
        color.b ??= 0;
        width.w ??= 200;
        width.h ??= 200;
        img.onload = () => {
            if (once) {
                once = false;
                if (filterColor) {
                    img.src = filterColor(img, color, width);
                }
                else {
                    img.loaded = true;
                }
            }
            img.loaded = true;
        };
        img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + svg.outerHTML);
        return img;
    }
    static filterColorExample(img, color, width) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const canvasWidth = width?.w || img.width;
        const canvasHeight = width?.h || img.height;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let { r = 0, g = 0, b = 0 } = color;
        context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        const sourceImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        const src = sourceImageData.data;
        for (let i = 0; i < src.length; i += 4) {
            src[i] = ~~(Math.min(r + src[i], 256));
            src[i + 1] = ~~(Math.min(g + src[i + 1], 256));
            src[i + 2] = ~~(Math.min(b + src[i + 2], 256));
        }
        context.putImageData(sourceImageData, 0, 0);
        return canvas.toDataURL();
    }
    ;
    static logHTMLElement(element, level = 0) {
        const tab = ' '.repeat(level * 2);
        const attributes = Array.from(element.attributes)
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(' ');
        if (attributes) {
        }
        else {
        }
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            MathJaxLoader.logHTMLElement(child, level + 1);
        }
    }
    static getLatexPaths(eq) {
        let svg = MathJax.tex2svg(eq).firstElementChild;
        MathJaxLoader.logHTMLElement(svg);
        return MathJaxLoader.extractPathsFromSVG(svg);
    }
    static getTranslateValues(string) {
        let [x, y, sx, sy] = [0, 0, 1, 1];
        const translateMatches = string.match(/translate\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (translateMatches) {
            translateMatches.forEach(translate => {
                const [, tx, ty] = translate.match(/translate\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                x = parseFloat(tx);
                y = parseFloat(ty);
            });
        }
        let scaleMatches = string.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (scaleMatches) {
            scaleMatches.forEach(scale => {
                let [, tx, ty] = scale.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                if (tx && ty) {
                    sx = parseFloat(tx);
                    sy = parseFloat(ty);
                }
            });
        }
        scaleMatches = !scaleMatches && string.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (scaleMatches) {
            scaleMatches.forEach(scale => {
                let [, t] = scale.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                if (t || t === 0) {
                    sx *= parseFloat(t);
                    sy *= parseFloat(t);
                }
            });
        }
        return { x, y, sx, sy };
    }
    static extractPathsFromSVG(svgElement) {
        const pathsData = [];
        const processGroup = (group, accumulatedTransform) => {
            const transformString = group.getAttribute("transform") || "";
            if (group.tagName == "svg") {
                accumulatedTransform.x += parseFloat(group.getAttribute("x")) * accumulatedTransform.sx;
                accumulatedTransform.y += parseFloat(group.getAttribute("y")) * accumulatedTransform.sy;
            }
            else {
                let translateValues = this.getTranslateValues(transformString);
                accumulatedTransform.x += translateValues.x * accumulatedTransform.sx;
                accumulatedTransform.y += translateValues.y * accumulatedTransform.sy;
                accumulatedTransform.sx *= translateValues.sx;
                accumulatedTransform.sy *= translateValues.sy;
            }
            const uses = group.querySelectorAll(":scope > use, :scope > svg");
            uses.forEach(use => {
                if (use.parentElement === group ||
                    (use.parentElement.tagName == "svg" && use.parentElement.parentElement === group)) {
                    const href = use.getAttribute("xlink:href")?.substring(1);
                    const pathElement = svgElement.querySelector(`#${href}`);
                    let { x: tx, y: ty, sx: tsx, sy: tsy } = this.getTranslateValues(use.getAttribute("transform") || "");
                    if (pathElement) {
                        const d = pathElement.getAttribute("d") || "";
                        let tempx = accumulatedTransform.x + tx * accumulatedTransform.sx;
                        let tempy = accumulatedTransform.y + ty * accumulatedTransform.sy;
                        let tempsy = accumulatedTransform.sy * tsy;
                        let tempsx = accumulatedTransform.sx * tsx;
                        if (href.includes("TEX-S4")) {
                            if (use.parentElement.tagName !== "svg") {
                            }
                            else {
                                tempsy *= 0.7;
                            }
                        }
                        pathsData.push({ d, x: tempx, y: tempy,
                            sx: tempsx, sy: tempsy, href });
                    }
                }
            });
            const rects = group.querySelectorAll(":scope > rect");
            rects.forEach((rect) => {
                if (rect.parentElement === group) {
                    let tx = parseFloat(rect.getAttribute("x"));
                    let ty = parseFloat(rect.getAttribute("y"));
                    let tw = parseFloat(rect.getAttribute("width"));
                    let th = parseFloat(rect.getAttribute("height"));
                    let tempx = accumulatedTransform.x;
                    let tempy = accumulatedTransform.y;
                    const d = `M ${tx} ${ty} h ${tw} v ${th} h -${tw} Z`;
                    pathsData.push({ d, x: tempx, y: tempy,
                        sx: accumulatedTransform.sx, sy: accumulatedTransform.sy });
                }
            });
            const childGroups = group.children;
            Array.from(childGroups).forEach(childGroup => {
                if (childGroup.tagName == "use")
                    return;
                processGroup(childGroup, { ...accumulatedTransform });
            });
        };
        const groups = svgElement.querySelectorAll(":scope > g");
        Array.from(groups).forEach(group => {
            processGroup(group, { x: 0, y: 0, sx: 1, sy: 1 });
        });
        return pathsData;
    }
    static getTransformMatrix(el) {
        let matrix = new DOMMatrix();
        while (el && el.nodeName !== 'svg') {
            const transform = el.transform.baseVal;
            if (transform.length > 0) {
                matrix = transform.consolidate()?.matrix.multiply(matrix) ?? matrix;
            }
            el = el.parentElement;
        }
        return matrix;
    }
    static drawPathsOnCanvas(paths, canvas, color = { r: 0, g: 0, b: 0 }, size = 1, offset = { x: 0, y: 0, sx: 1, sy: 1 }, time = 0) {
        const context = canvas.getContext("2d");
        if (!context)
            return;
        context.fillStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
        context.strokeStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
        context.lineWidth = 2;
        let scale = 1 / 15 * size;
        let dx = 50;
        let dy = 200;
        paths = paths.sort((a, b) => { return a.x > b.x ? 1 : -1; });
        paths.forEach((pathData, index) => {
            context.beginPath();
            let d = pathData.d;
            if (pathData.color) {
                context.fillStyle = pathData.color;
            }
            else {
                context.fillStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
            }
            let dl = d.split(" ").length;
            let d2 = d.split(" ").reverse().splice(((dl - Math.floor(1 - Math.abs(Math.cos(Math.max(Math.min((time / 5 + (paths.length - index) / paths.length * 0.2 - 0.2) * Math.PI * 1.5, Math.PI / 2), 0))) * dl)) % dl)).reverse().join(" ");
            if (!d2.endsWith("Z"))
                d2 += "Z";
            const path = new Path2D(d2);
            context.save();
            const transformMatrix = new DOMMatrix();
            transformMatrix.translateSelf((pathData.x * scale) * (offset.sx || 1) + dx + (offset.x || 0) * (offset.sx || 1), (pathData.y * scale) * (offset.sy || 1) + dy + (offset.y || 0) * (offset.sy || 1));
            transformMatrix.scaleSelf(pathData.sx * scale * (offset.sx || 1), pathData.sy * scale * (offset.sy || 1));
            context.setTransform(transformMatrix);
            context.fill(path);
            context.restore();
            context.closePath();
        });
    }
}
export class MathJaxObject extends GameObject {
    latex;
    r;
    g;
    b;
    anim_time;
    paths = [];
    is_static = false;
    constructor(latex, x = 0, y = 0, sx = 1, sy = 1, r = 255, g = 255, b = 255, anim_time = 5) {
        super(x, y, sx, sy);
        this.latex = latex;
        this.r = r;
        this.g = g;
        this.b = b;
        this.anim_time = anim_time;
        this.reload();
    }
    setLatex(latex) {
        this.latex = latex;
        this.reload();
    }
    reload() {
        this.paths = MathJaxLoader.getLatexPaths(this.latex + "");
    }
    setRGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    get anim() {
        return this.anim_time;
    }
    set anim(anim) {
        this.anim_time = anim;
    }
    get sx() {
        return this.w;
    }
    get sy() {
        return this.h;
    }
    set sx(w) {
        this.w = w;
    }
    set sy(h) {
        this.h = h;
    }
    draw(ctx) {
        if (!this.paths)
            return;
        let [x, y] = ctx.applyStack(this.x, this.y);
        if (this.is_static) {
            x = this.x;
            y = this.y;
        }
        MathJaxLoader.drawPathsOnCanvas(this.paths, ctx.canvas, { r: this.r, g: this.g, b: this.b }, 1, { x, y, sx: this.sx, sy: this.sy }, this.anim);
    }
}
export class MathJaxMatrix extends MathJaxObject {
    v1;
    v2;
    last_latex = "";
    constructor(v1 = new Vector2D(1, 0), v2 = new Vector2D(0, 1), x = 0, y = 0, sx = 1, sy = 1, r = 255, g = 255, b = 255, anim_time = 5) {
        super(Matrix2D.toLaTex(Matrix2D.fromValues([...v1, ...v2])), x, y, sx, sy, r, g, b, anim_time);
        this.v1 = v1;
        this.v2 = v2;
        this.last_latex = this.latex;
    }
    getLatex(decimals = 2) {
        let dec = Math.pow(10, ~~(decimals));
        return Matrix2D.toLaTex(Matrix2D.fromValues([...this.v1, ...this.v2].map(v => Math.round(v * (dec)) / (dec))));
    }
    tick(dt) {
        this.latex = this.getLatex();
        if (this.latex !== this.last_latex) {
            this.last_latex = this.latex;
            this.reload();
        }
    }
}
