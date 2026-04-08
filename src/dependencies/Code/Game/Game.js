var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
var _c;
import { Vector2D, Vector3D, MatrixStack2D, Vector } from "../Matrix/Matrix.mjs";
export var H = 720;
export var W = 1080;
export var resizeBounds = (w, h) => { W = w; H = h; };
function ensureCanvasElement(element) {
    var _a;
    if (!element) {
        return document.createElement("canvas");
    }
    if (element instanceof HTMLCanvasElement) {
        return element;
    }
    else {
        element.id = "";
        const canvas = document.createElement("canvas");
        for (const attr of element.attributes) {
            canvas.setAttribute(attr.name, attr.value);
        }
        (_a = element.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(canvas, element);
        return canvas;
    }
}
export function createCanvas(id = "c1", w = 1080, h = 720, sc, contexttype = "2d") {
    let canvas = ensureCanvasElement(document.getElementById(id));
    if (!!id)
        canvas.id = id;
    canvas.width = w;
    canvas.height = h;
    let ctx = (canvas).getContext(contexttype, { willReadFrequently: true });
    let collec = {
        canvas,
        ctx,
        append: () => {
            document.body.appendChild(canvas);
            return collec;
        },
        center: (ops) => {
            if (!ops || typeof ops !== "object")
                ops = {};
            ops.contexttype = contexttype;
            ModernCanvas(canvas, Object.assign({ maxRes: true }, ops));
            return collec;
        },
        modern: (layer = new Layer(canvas.id, collec.canvas, sc !== null && sc !== void 0 ? sc : new Scene()), autoadd = true) => {
            var _a, _b;
            (_b = (_a = layer === null || layer === void 0 ? void 0 : layer.scene) === null || _a === void 0 ? void 0 : _a.addLayer) === null || _b === void 0 ? void 0 : _b.call(_a, layer);
            let newcollect = {
                canvas: collec.canvas,
                ctx: new ModernCtx(collec.ctx, layer),
                append: () => {
                    document.body.appendChild(canvas);
                    return newcollect;
                },
                center: (ops) => {
                    if (!ops || typeof ops !== "object")
                        ops = {};
                    ModernCanvas(canvas, Object.assign({ maxRes: true }, ops));
                    return newcollect;
                },
            };
            return newcollect;
        },
    };
    return collec;
}
if (typeof window === 'undefined') {
    globalThis.window = {};
}
if (typeof document === 'undefined') {
    globalThis.document = {
        createElement: () => ({}),
        getElementById: () => null,
        querySelector: () => null,
    };
}
function posY(elm) { var test = elm, top = 0; while (!!test && test.tagName.toLowerCase() !== "body") {
    top += test.offsetTop;
    test = test.offsetParent;
} return top; }
function viewPortHeight() { var de = document.documentElement; if (!!(window === null || window === void 0 ? void 0 : window.innerWidth)) {
    return window === null || window === void 0 ? void 0 : window.innerHeight;
}
else if (de && !isNaN(de.clientHeight)) {
    return de.clientHeight;
} return 0; }
function scrollY() { if ((window === null || window === void 0 ? void 0 : window.scrollY) !== undefined) {
    return window === null || window === void 0 ? void 0 : window.scrollY;
} return Math.max(document.documentElement.scrollTop, document.body.scrollTop); }
function checkvisible(elm) {
    const bbox = elm.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    return (bbox.bottom >= 0 &&
        bbox.right >= 0 &&
        bbox.top <= windowHeight &&
        bbox.left <= windowWidth);
}
function ensureSlideContainer(canvas, boundingBox, absolute = false, father, resizeWithFather = false, boundOptions) {
    var _a, _b, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    boundOptions !== null && boundOptions !== void 0 ? boundOptions : (boundOptions = boundingBox);
    let container = canvas.parentElement;
    canvas.isVisible = canvas.setVisible = canvas.Visi = canvas.visi = canvas.visible = canvas.Visible = checkvisible(canvas);
    if (!container || !container.classList.contains("canvasSlideContainer")) {
        container = document.createElement("div");
        container.classList.add("canvasSlideContainer");
        const clases = canvas.classList;
        clases.forEach(clase => {
            (!!container) && container.classList.add(clase);
        });
        canvas.before(container);
        container.appendChild(canvas);
    }
    if (typeof ((_d = (_b = (typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.w) == "function" && ((_a = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.w) === null || _a === void 0 ? void 0 : _a.call(boundingBox)))) !== null && _b !== void 0 ? _b : boundingBox.w) !== null && _d !== void 0 ? _d : 0) == "number")
        container.style.width = `${(typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.w) == "function" && ((((_e = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.w) === null || _e === void 0 ? void 0 : _e.call(boundingBox))))) || boundingBox.w || 0}px`;
    if (typeof ((_h = (_g = (typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.h) == "function" && ((_f = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.h) === null || _f === void 0 ? void 0 : _f.call(boundingBox)))) !== null && _g !== void 0 ? _g : boundingBox.h) !== null && _h !== void 0 ? _h : 0) == "number")
        container.style.height = `${(typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.h) == "function" && ((((_j = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.h) === null || _j === void 0 ? void 0 : _j.call(boundingBox))))) || boundingBox.h || 0}px`;
    if (resizeWithFather && father instanceof HTMLElement) {
        if (typeof (((_l = (typeof boundOptions.w == "function" && ((_k = boundOptions.w) === null || _k === void 0 ? void 0 : _k.call(boundOptions)))) !== null && _l !== void 0 ? _l : boundOptions.w)) == "string") {
            container.style.width = "100%";
        }
        if (typeof ((_o = ((typeof boundOptions.h == "function" && ((_m = boundOptions.h) === null || _m === void 0 ? void 0 : _m.call(boundOptions))))) !== null && _o !== void 0 ? _o : boundOptions.h) == "string")
            container.style.height = father.style.height;
    }
    container.style.boxSizing = "border-box";
    let isXFunc = (typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.x) == "function");
    let xval = (_r = (_q = (isXFunc && ((_p = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.x) === null || _p === void 0 ? void 0 : _p.call(boundingBox, canvas)))) !== null && _q !== void 0 ? _q : boundingBox.x) !== null && _r !== void 0 ? _r : 0;
    if (typeof xval == "string" && /\d$/.test(xval) || typeof xval != "string") {
        xval = (xval || 0) + "px";
    }
    let isYFunc = (typeof (boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.y) == "function");
    let yval = (_u = (_t = (isYFunc && ((_s = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.y) === null || _s === void 0 ? void 0 : _s.call(boundingBox, canvas)))) !== null && _t !== void 0 ? _t : boundingBox.y) !== null && _u !== void 0 ? _u : 0;
    if (typeof yval == "string" && /\d$/.test(yval) || typeof yval != "string") {
        yval = (yval || 0) + "px";
    }
    if (absolute) {
        container.style.position = "absolute";
        container.style.left = xval;
        container.style.top = yval;
    }
    else {
        container.style.marginLeft = xval;
        container.style.marginTop = yval;
        container.style.position = "relative";
    }
    return container;
}
export function ModernCanvas(canvas, options = {}) {
    var _a, _b, _d, _e, _f, _g, _h, _j, _k, _l;
    let { absolute = true, slidePercentage = 0, autoResize = true, maxRes = absolute, preserveAspectRatio = true, father } = options;
    (canvas.boundingBox) = ((_a = Object.assign({}, options)) === null || _a === void 0 ? void 0 : _a.boundingBox) || {
        x: 0,
        y: 0,
        w: window === null || window === void 0 ? void 0 : window.innerWidth,
        h: window === null || window === void 0 ? void 0 : window.innerHeight,
    };
    if ((typeof ((_b = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _b === void 0 ? void 0 : _b.w) == "function" && ((_e = (_d = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _d === void 0 ? void 0 : _d.w) === null || _e === void 0 ? void 0 : _e.call(_d))) || ((_f = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _f === void 0 ? void 0 : _f.w))
        (canvas.boundingBox).w = options.boundingBox.w;
    if ((typeof ((_g = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _g === void 0 ? void 0 : _g.h) == "function" && ((_j = (_h = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _h === void 0 ? void 0 : _h.h) === null || _j === void 0 ? void 0 : _j.call(_h))) || ((_k = options === null || options === void 0 ? void 0 : options.boundingBox) === null || _k === void 0 ? void 0 : _k.h))
        (canvas.boundingBox).h = options.boundingBox.h;
    canvas.running = true;
    canvas.isVisible = canvas.setVisible = canvas.Visi = canvas.visi = canvas.visible = canvas.Visible = checkvisible(canvas);
    canvas.recheckVisible = () => {
        let is = checkvisible(canvas);
        canvas.isVisible = canvas.setVisible = canvas.Visi = canvas.visi = canvas.visible = canvas.Visible = is;
        return is;
    };
    const originalBounding = options.boundingBox;
    if (father === undefined)
        father = window;
    if (father === null)
        father = canvas.parentElement;
    function resizeCanvas(again = false) {
        var _a, _b;
        if (canvas.slidePercentage) {
            slidePercentage = canvas.slidePercentage;
            slidePercentage = Math.min(1, Math.max(-1, slidePercentage));
        }
        const canvasAspectRatio = canvas.width / canvas.height;
        ensureSlideContainer(canvas, (canvas.boundingBox), absolute, father, maxRes && !!father, originalBounding);
        const bbox = (canvas.boundingBox);
        const bboxw = (typeof bbox.w === "function" && ((_a = bbox === null || bbox === void 0 ? void 0 : bbox.w) === null || _a === void 0 ? void 0 : _a.call(bbox))) || (bbox === null || bbox === void 0 ? void 0 : bbox.w) || 0;
        const bboxh = (typeof bbox.h === "function" && ((_b = bbox === null || bbox === void 0 ? void 0 : bbox.h) === null || _b === void 0 ? void 0 : _b.call(bbox))) || (bbox === null || bbox === void 0 ? void 0 : bbox.h) || 1;
        function normalizeDimension(value) {
            if (typeof value === "number") {
                return value + "px";
            }
            else if (typeof value === "string") {
                if (/\d$/.test(value))
                    value = value + "px";
                return value;
            }
            return "0px";
        }
        const normalizedBboxw = normalizeDimension(bboxw);
        const normalizedBboxh = normalizeDimension(bboxh);
        const boundingBoxAspectRatio = parseFloat(normalizedBboxw) / parseFloat(normalizedBboxh);
        if (preserveAspectRatio) {
            if (canvasAspectRatio > boundingBoxAspectRatio) {
                canvas.style.width = normalizedBboxw;
                canvas.style.height = `calc(${normalizedBboxw} / ${canvasAspectRatio})`;
            }
            else {
                canvas.style.height = normalizedBboxh;
                canvas.style.width = `calc(${normalizedBboxh} * ${canvasAspectRatio})`;
            }
        }
        else {
            canvas.style.width = normalizedBboxw;
            canvas.style.height = normalizedBboxh;
        }
        const maxSlideX = `calc((100% - ${normalizedBboxw}) / 2)`;
        const maxSlideY = `calc((100% - ${normalizedBboxh}) / 2)`;
        const leftOffset = `calc((${normalizedBboxw} - (${normalizedBboxh} * ${canvasAspectRatio})) / 2 - ${maxSlideX} * ${slidePercentage})`;
        const topOffset = `calc((${normalizedBboxh} - (${normalizedBboxw} / ${canvasAspectRatio})) / 2 - ${maxSlideY} * ${slidePercentage})`;
        if (canvasAspectRatio < boundingBoxAspectRatio) {
            canvas.style.left = preserveAspectRatio ? leftOffset : "0px";
            canvas.style.top = "0px";
        }
        else {
            canvas.style.top = preserveAspectRatio ? topOffset : "0px";
            canvas.style.left = "0px";
        }
        if (!again) {
            canvas.style.position = "relative";
        }
    }
    resizeCanvas();
    canvas.resize = resizeCanvas;
    canvas.setSlide = (p = canvas.slidePercentage) => { canvas.slidePercentage = p; };
    if (autoResize) {
        (_l = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _l === void 0 ? void 0 : _l.call(window, "resize", () => { resizeCanvas(true); });
    }
    canvas.ctx = canvas.getContext(options.contexttype || "2d");
    canvas.openFullScreen = (canvas) => { openFullscreen(canvas); };
    return canvas;
}
export class ModernCtx {
    constructor(ctx, layer) {
        this.ctx = ctx;
        this.layer = layer;
        this.options = {
            noApplyStack: false,
            stroking: false,
            posStyle: false
        };
        this.tmpoptions = {};
        this.innerRotation = 0;
        this.rRect = (x = 0, y = 0, w, h, color = "black", rot = 0) => {
            h !== null && h !== void 0 ? h : (h = this.layer.getHeight());
            w !== null && w !== void 0 ? w : (w = this.layer.getWidth());
            const W = this.ctx.canvas.width;
            const H = this.ctx.canvas.height;
            [x, y] = this.applyStack(x, y, w, h);
            if (x + w < 0 || x > W || y + h < 0 || y > H) {
                return;
            }
            this.ctx.save();
            this.ctx.fillStyle = color;
            this.ctx.translate(x + w / 2, y + h / 2);
            this.ctx.rotate(rot);
            if (this.getOption('stroking')) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = color;
                this.ctx.strokeRect(-w / 2, -h / 2, w, h);
                this.ctx.closePath();
            }
            else {
                this.ctx.beginPath();
                this.ctx.fillStyle = color;
                this.ctx.fillRect(-w / 2, -h / 2, w, h);
                this.ctx.closePath();
            }
            this.ctx.restore();
        };
        this.rImg = (img, x, y, w = img.width, h = img.height, imgsc = 1, deg = 0, flipX = false, flipY = false) => {
            var _a, _b;
            if (!img || !img.loaded)
                return;
            w !== null && w !== void 0 ? w : (w = (_a = img.width) !== null && _a !== void 0 ? _a : 100);
            h !== null && h !== void 0 ? h : (h = (_b = img.height) !== null && _b !== void 0 ? _b : 100);
            w *= imgsc;
            h *= imgsc;
            [x, y] = this.applyStack(x, y, w, h);
            if (x + w < 0 || x > W || y + h < 0 || y > H) {
                return;
            }
            this.ctx.save();
            this.ctx.beginPath();
            if (flipX) {
                this.ctx.scale(-1, 1);
                w *= -1;
                x *= -1;
            }
            if (flipY) {
                this.ctx.scale(1, -1);
                h *= -1;
                y *= -1;
            }
            this.ctx.translate(x + w / 2, y + h / 2);
            this.ctx.rotate(deg);
            this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
            this.ctx.fill();
            this.ctx.restore();
        };
        ctx.layer = layer;
        this.lastDrawnLayer = layer;
        for (let key of Object.getOwnPropertyNames(ModernCtx.prototype)) {
            if (key !== "constructor" && typeof this[key] === "function") {
                ctx[key] = this[key].bind(this);
            }
        }
        Object.assign(ctx, this);
        return ctx;
    }
    setLastScene(sc) {
        this.lastDrawnScene = sc;
    }
    openFullScreen(ctx = this) {
        openFullscreen(ctx.ctx.canvas);
    }
    setTmpOption(name, val = true) {
        this.tmpoptions[name] = val;
        return this;
    }
    getOption(name) {
        if (this.tmpoptions[name] !== undefined)
            return this.tmpoptions[name];
        return this.options[name];
    }
    applyStack(...coords) {
        var _a, _b, _d, _e, _f;
        if (coords.length < 2)
            return coords;
        let x, y, w, h;
        if (coords.length < 4) {
            w = 0, h = 0;
        }
        else {
            w = coords[2];
            h = coords[3];
        }
        x = coords[0];
        y = coords[1];
        if (this.getOption('posStyle')) {
            [x, y] = [x - w / 2, y - h / 2];
        }
        if (this.getOption('noApplyStack'))
            return [x, y];
        if ((_b = (_a = (this === null || this === void 0 ? void 0 : this.lastDrawnScene)) === null || _a === void 0 ? void 0 : _a.stack) === null || _b === void 0 ? void 0 : _b.apply)
            [x, y] = (this.lastDrawnScene).stack.apply(new Vector(x, y)).values;
        if ((_f = (_e = ((this === null || this === void 0 ? void 0 : this.lastDrawnScene) || ((_d = this === null || this === void 0 ? void 0 : this.lastDrawnLayer) === null || _d === void 0 ? void 0 : _d.scene))) === null || _e === void 0 ? void 0 : _e.cam) === null || _f === void 0 ? void 0 : _f.transformMatrix) {
            [x, y] = (this.lastDrawnScene || this.lastDrawnLayer.scene).cam.transformMatrix.multVector(new Vector(x, y, 1)).values;
        }
        return [x, y];
    }
    applyRotation(angle, cx = 0, cy = 0) {
    }
    rect(x = 0, y = 0, w, h, color = "black") {
        h !== null && h !== void 0 ? h : (h = this.layer.getHeight());
        w !== null && w !== void 0 ? w : (w = this.layer.getWidth());
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        [x, y] = this.applyStack(x, y, w, h);
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        if (this.getOption('stroking')) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.closePath();
        }
        else {
            this.ctx.beginPath();
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, w, h);
            this.ctx.closePath();
        }
    }
    rectTopLeft(x = 0, y = 0, w, h, color = "black") {
        h !== null && h !== void 0 ? h : (h = this.layer.getHeight());
        w !== null && w !== void 0 ? w : (w = this.layer.getWidth());
        this.rect(x + w / 2, y + h / 2, w, h, color);
    }
    circle(x = 0, y = 0, w, h, color = "black", rot = 0, st = 0, et = Math.PI * 2, way = true) {
        w !== null && w !== void 0 ? w : (w = 100);
        h !== null && h !== void 0 ? h : (h = w);
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        w /= 2;
        h /= 2;
        [x, y] = this.applyStack(x, y);
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        if (this.getOption("stroking")) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.ellipse(x, y, w, h, rot, st, et, way);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        else {
            this.ctx.beginPath();
            this.ctx.fillStyle = color;
            this.ctx.ellipse(x, y, w, h, rot, st, et, way);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    line(x, y, x2, y2, lw = 5, color = "brown") {
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        [x, y] = this.applyStack(x, y);
        [x2, y2] = this.applyStack(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = ~~(lw);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    lineVer(x, y, len, lw = 5, color = "brown") {
        this.line(x, y - len / 2, x, y + len / 2, lw, color);
    }
    lineVerBot(x, y, len, lw = 5, color = "brown") {
        this.line(x, y - len, x, y, lw, color);
    }
    lineVerTop(x, y, len, lw = 5, color = "brown") {
        this.line(x, y, x, y + len, lw, color);
    }
    lineHor(x, y, len, lw = 5, color = "brown") {
        this.line(x - len / 2, y, x + len / 2, y, lw, color);
    }
    lineHorLeft(x, y, len, lw = 5, color = "brown") {
        this.line(x, y, x + len, y, lw, color);
    }
    lineHorRight(x, y, len, lw = 5, color = "brown") {
        this.line(x, y, x - len, y, lw, color);
    }
    lineAngled(x, y, len, angle, lw = 5, color = "brown") {
        this.line(x - Math.cos(angle) * len / 2, y - Math.sin(angle) * len / 2, x + Math.cos(angle) * len / 2, y + Math.sin(angle) * len / 2, lw, color);
    }
    arrow(x1, y1, x2, y2, lw = 5, color = "brown", sepAngCoeff = 1, sepSizeCoeff = 3) {
        let x = x2 - x1, y = y2 - y1;
        let CENTER = new Vector2D(x1, y1);
        let drawW = Math.hypot(x, y);
        let ang1 = Math.atan2(y, x);
        let c1 = Math.cos(ang1);
        let s1 = Math.sin(ang1);
        let sepang = Math.PI / 24 * 2 * sepAngCoeff;
        let csep2 = Math.sin(ang1 + sepang - Math.PI / 4);
        let ssep2 = Math.cos(ang1 + sepang - Math.PI / 4);
        let csep = Math.sin(-sepang + ang1 - Math.PI / 4);
        let ssep = Math.cos(-sepang + ang1 - Math.PI / 4);
        let pc = CENTER;
        let pv = new Vector2D(CENTER.x + c1 * drawW, CENTER.y + s1 * drawW);
        let dx = pv.x - pc.x;
        let dy = pv.y - pc.y;
        let l = Math.hypot(dx, dy);
        this.line(pc.x, pc.y, pv.x - dx / l * lw * sepSizeCoeff, pv.y - dy / l * lw * sepSizeCoeff, lw, color);
        let pizq = new Vector2D(pv.x - ssep2 * lw * sepSizeCoeff + csep2 * lw * sepSizeCoeff, pv.y - csep2 * lw * sepSizeCoeff - ssep2 * lw * sepSizeCoeff);
        let pder = new Vector2D(pv.x - ssep * lw * sepSizeCoeff + csep * lw * sepSizeCoeff, pv.y - csep * lw * sepSizeCoeff - ssep * lw * sepSizeCoeff);
        let [pvx, pvy] = this.applyStack(...pv.vals);
        let [pizqx, pizqy] = this.applyStack(...pizq.vals);
        let [pderx, pdery] = this.applyStack(...pder.vals);
        this.ctx.moveTo(pizqx, pizqy);
        this.ctx.lineTo(pvx, pvy);
        this.ctx.lineTo(pderx, pdery);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        if (this.getOption('stroking'))
            this.ctx.stroke();
        else
            this.ctx.fill();
    }
    doubleArrow(x1, y1, x2, y2, lw = 5, color = "brown", sepAngCoeff = 1, sepSizeCoeff = 3) {
        let dx = x2 - x1, dy = y2 - y1;
        this.arrow(x1 + dx / 2, y1 + dy / 2, x2, y2, lw, color, sepAngCoeff, sepSizeCoeff);
        this.arrow(x1 + dx / 2, y1 + dy / 2, x1, y1, lw, color, sepAngCoeff, sepSizeCoeff);
    }
    polygon(x = 0, y = 0, polygon, color = "black") {
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        let w = polygon.w, h = polygon.h;
        [x, y] = this.applyStack(x, y);
        this.ctx.beginPath();
        let isStroking = this.getOption('stroking');
        if (isStroking) {
            this.ctx.strokeStyle = color;
        }
        else {
            this.ctx.fillStyle = color;
        }
        this.ctx.moveTo(polygon.vecs[0][0] + x, polygon.vecs[0][1] + y);
        for (let i = 1; i < polygon.vecs.length; i++) {
            const v = polygon.vecs[i];
            this.ctx.lineTo(v[0] + x, v[1] + y);
        }
        this.ctx.closePath();
        if (isStroking) {
            this.ctx.stroke();
        }
        else {
            this.ctx.fill();
        }
    }
    img(img, x, y, w = img.width, h = img.height, imgsc = 1) {
        var _a, _b;
        if (!img || !img.loaded)
            return;
        w !== null && w !== void 0 ? w : (w = (_a = img.width) !== null && _a !== void 0 ? _a : 100);
        h !== null && h !== void 0 ? h : (h = (_b = img.height) !== null && _b !== void 0 ? _b : 100);
        w *= imgsc;
        h *= imgsc;
        [x, y] = this.applyStack(x, y, w, h);
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        this.ctx.drawImage(img, x, y, w, h);
    }
    imgSlice(img, x, y, w = img.width, h = img.height, imgsc = 1) {
        if (!img || !img.loaded)
            return;
        w *= imgsc;
        h *= imgsc;
        [x, y] = this.applyStack(x, y, w, h);
        let sx = x - w / 2;
        let sy = y - h / 2;
        let sw = w;
        let sh = h;
        sx *= imgsc;
        sy *= imgsc;
        sw *= imgsc;
        sh *= imgsc;
        sx = Math.max(0, Math.min(sx, img.width - sw));
        sy = Math.max(0, Math.min(sy, img.height - sh));
        sw = Math.min(sw, img.width - sx);
        sh = Math.min(sh, img.height - sy);
        this.ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
    image(img, x, y, w = img.width, h = img.height, imgsc = 1) {
        return this.img(img, x, y, w, h, imgsc);
    }
    cls(color = "rgba(0,0,0,0)") {
        this.tmpoptions.noApplyStack = true;
        this.tmpoptions.posStyle = false;
        let [x, y] = this.applyStack(0, 0);
        if ((color === "transparent") || (color === "rgba(0,0,0,0)"))
            this.ctx.clearRect(-x, -y, W, H);
        else
            this.rect(-x, -y, W, H, color);
        this.tmpoptions = {};
    }
}
export class GameObject {
    constructor(x = 0, y = 0, w = 1, h = 1, color = "black") {
        this.w = w;
        this.h = h;
        this.color = color;
        this.layer = 0;
        this.rotation = 0;
        this.dead = false;
        this.m = 1;
        this.inertia = 1;
        this.added = false;
        this.shown = true;
        this.info = {
            changed: {
                position: false,
                size: false,
                velocity: false,
                any: false
            },
            is_static: false
        };
        this.pos = new Vector2D(x, y);
        this.size = new Vector2D(w, h);
        this.vel = new Vector2D(0, 0);
        this.polygon = new Polygon(0, 0, 0 + w, 0, 0 + w, 0 + h, 0, 0 + h);
    }
    selfAdd(layer = 0, sc = Scene.sc) {
        if (this.added)
            return;
        sc.getLayer(layer).add(this);
        this.added = true;
        return this;
    }
    getPosition(sc) {
        var _a, _b;
        if (!sc)
            return this.position;
        let applyPos = (sc instanceof Scene ? sc.stack : sc).apply(this.pos);
        let zoom = 1;
        if (sc instanceof Scene && ((_a = sc === null || sc === void 0 ? void 0 : sc.cam) === null || _a === void 0 ? void 0 : _a.zoom) !== undefined) {
            zoom = (_b = sc === null || sc === void 0 ? void 0 : sc.cam) === null || _b === void 0 ? void 0 : _b.zoom;
        }
        return [applyPos.x, applyPos.y, this.size.x * zoom, this.size.y * zoom];
    }
    get position() {
        let vals = [this.pos.x, this.pos.y, this.size.x, this.size.y];
        vals.pos = [vals[0], vals[1]];
        vals.bounds = [vals[2], vals[3]];
        return vals;
    }
    get poscolor() {
        return [this.pos.x, this.pos.y, this.size.x, this.size.y, this.color];
    }
    draw(ctx) {
    }
    extratick(dt) {
    }
    tick(dt) {
        var _a;
        (_a = this === null || this === void 0 ? void 0 : this.extratick) === null || _a === void 0 ? void 0 : _a.call(this, dt);
    }
    get x() {
        return this.pos.x;
    }
    get y() {
        return this.pos.y;
    }
    set x(x) {
        this.pos.x = x;
    }
    set y(y) {
        this.pos.y = y;
    }
    get vx() {
        return this.vel.x;
    }
    get vy() {
        return this.vel.y;
    }
    set vx(x) {
        this.vel.x = x;
    }
    set vy(y) {
        this.vel.y = y;
    }
    getPol() {
        return this.polygon;
    }
    get pol() {
        return this.getPol();
    }
    set pol(pol) {
        this.polygon = pol;
    }
    get rot() {
        return this.rotation;
    }
    get mass() {
        return this.m;
    }
    set rot(rot) {
        this.rotation = rot;
    }
    set mass(mass) {
        this.m = mass;
    }
    get bounds() {
        return { x: this.w, y: this.h };
    }
    set bounds({ x, y }) {
        this.w = x;
        this.h = y;
    }
    findNearObjects(x, y, radius, conditions, sc = Scene.sc) {
        return sc.findObjects((o) => {
            if (!o)
                return false;
            if (o instanceof GameObject) {
                let pos = o.getPosition(sc);
                let r = Math.hypot(x - pos[0], y - pos[1]);
                return r < radius;
            }
            else {
                return false;
            }
        }, undefined);
    }
    distanceTo(obj) {
        if (!obj)
            return Infinity;
        return Math.hypot(this.x - obj.x, this.y - obj.y);
    }
}
export class GameImage extends GameObject {
    constructor(x, y, w, h, img) {
        super(x, y, (w !== null && w !== void 0 ? w : img === null || img === void 0 ? void 0 : img.width), (h !== null && h !== void 0 ? h : img === null || img === void 0 ? void 0 : img.height));
        this.img = img;
    }
    draw(ctx) {
        var _a, _b, _d, _e;
        ctx.tmpoptions.noApplyStack = false;
        ctx.tmpoptions.posStyle = false;
        let [x, y] = ctx.applyStack(this.x, this.y);
        let zoom = (_e = (_d = (_b = ((ctx === null || ctx === void 0 ? void 0 : ctx.lastDrawnScene) || ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.lastDrawnLayer) === null || _a === void 0 ? void 0 : _a.scene))) === null || _b === void 0 ? void 0 : _b.cam) === null || _d === void 0 ? void 0 : _d.zoom) !== null && _e !== void 0 ? _e : 1;
        ctx.img(this.img, x, y, this.w / zoom, this.h / zoom);
    }
}
export class GameIOStats {
    static getProps(stats) {
        if (typeof (stats) == "object") {
            return GameIOStats.getPropsFromObject(stats);
        }
        if (typeof (stats) == "function" && !!stats.prototype) {
            return GameIOStats.getPropsFromObject(stats === null || stats === void 0 ? void 0 : stats.IOstats);
        }
        return undefined;
    }
    static getPropsFromObject(stats) {
        let props = [];
        let keys = Object.keys(stats);
        for (let i = 0; i < keys.length; i++) {
            let val = stats[keys[i]];
            if (typeof (val) == "number") {
                props.push(keys[i] + "");
            }
        }
        return props;
    }
}
export class Polygon {
    constructor(...vs) {
        this.lines = [];
        this.type = Polygon.PolygonType;
        this.pos = undefined;
        this.r = undefined;
        let vecs = [];
        if (Array.isArray(vs) && !(vs[0] instanceof Vector))
            vecs = vs.flat();
        else if (Array.isArray(vs)) {
            let numarr = (vs.flat().map((v) => [v.x, v.y]));
            for (let i = 0; i < numarr.length; i++) {
                vecs.push(...numarr[i]);
            }
        }
        let vecarr = [];
        for (let i = 0; i < vecs.length - 1; i += 2) {
            let obj = [vecs[i], vecs[i + 1]];
            vecarr[i / 2] = obj;
        }
        this.vecs = vecarr;
        for (let i = 0, j = this.vecs.length - 1; i < this.vecs.length; j = i++) {
            this.lines.push([this.vecs[i], this.vecs[j]]);
        }
    }
    get w() {
        return 100;
    }
    get h() {
        return 100;
    }
    static createCirclePolygon(x, y, r) {
        let circlePol = new Polygon([x, y, r, r]);
        circlePol.type = Polygon.CircleType;
        circlePol.pos = [x, y];
        circlePol.r = r;
    }
}
Polygon.CircleType = "Circle";
Polygon.EllipseType = "Ellipse";
Polygon.PolygonType = "Polygon";
export class GameCircleCollisionHandler {
    tick(dt, objs) {
        for (let i = 0; i < objs.length; i++) {
            let obj1 = objs[i];
            for (let j = i + 1; j < objs.length; j++) {
                let obj2 = objs[j];
                if (!this.nearPhase(obj1, obj2))
                    continue;
                this.handleCollision(obj1, obj2);
            }
        }
    }
    nearPhase(obj1, obj2) {
        const width1 = obj1.w;
        const height1 = obj1.h;
        const width2 = obj2.w;
        const height2 = obj2.h;
        const dx = Math.abs(obj2.x - obj1.x);
        const dy = Math.abs(obj2.y - obj1.y);
        const combinedWidths = width1 + width2;
        const combinedHeights = height1 + height2;
        return (dx + dx <= combinedWidths) && (dy + dy <= combinedHeights);
    }
    handleCollision(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distanceSquared = dx * dx + dy * dy;
        const combinedRadius = obj1.w / 2 + obj2.w / 2;
        const combinedRadiusSquared = combinedRadius * combinedRadius;
        if (distanceSquared > combinedRadiusSquared) {
            return;
        }
        const distance = Math.sqrt(distanceSquared);
        const dvx = obj2.vel.x - obj1.vel.x;
        const dvy = obj2.vel.y - obj1.vel.y;
        const dotProduct = dvx * dx / distance * combinedRadius + dvy * dy / distance * combinedRadius;
        const density = 1;
        let obj1m = density * Math.PI * obj1.w * obj1.w / 4;
        let obj2m = density * Math.PI * obj2.w * obj2.w / 4;
        if (dotProduct > 0) {
            return;
        }
        const collisionScale1 = 2 * ((obj1.vel.x - obj2.vel.x) * -dx / distance * combinedRadius + (obj1.vel.y - obj2.vel.y) * -dy / distance * combinedRadius) / ((obj1m + obj2m) * combinedRadius * combinedRadius);
        const collisionScale2 = 2 * ((obj2.vel.x - obj1.vel.x) * dx / distance * combinedRadius + (obj2.vel.y - obj1.vel.y) * dy / distance * combinedRadius) / ((obj1m + obj2m) * combinedRadius * combinedRadius);
        obj1.vel.x += collisionScale1 * obj2m * dx / distance * combinedRadius;
        obj1.vel.y += collisionScale1 * obj2m * dy / distance * combinedRadius;
        obj2.vel.x -= collisionScale2 * obj1m * dx / distance * combinedRadius;
        obj2.vel.y -= collisionScale2 * obj1m * dy / distance * combinedRadius;
    }
}
function length(p) {
    return Math.sqrt(p[0] * p[0] + p[1] * p[1]);
}
export class CollisionManager {
    constructor() {
        this.offset = [0, 0];
        this.offsetState = 1;
        this.modifyVel = true;
        this.callObjects = true;
    }
    dot(p1, p2) {
        return p1[0] * p2[0] + p1[1] * p2[1];
    }
    closestToLine(p, { 0: a, 1: b }) {
        let ba = [b[0] - a[0], b[1] - a[1]];
        let pa = [p[0] - this.offset[0] * this.offsetState - a[0], p[1] - this.offset[1] * this.offsetState - a[1]];
        let interv = this.dot(pa, ba) / length(a);
        let cos = interv / length(ba);
        if (cos < 0)
            return a;
        if (cos > 1)
            return b;
        return [a[0] + (b[0] - a[0]) * cos, a[1] + (b[1] - a[1]) * cos];
    }
    collideLineToLine(l1, l2) {
        let [[x1, y1], [x2, y2]] = l1;
        let [[x3, y3], [x4, y4]] = l2;
        x3 -= this.offset[0] * this.offsetState;
        x4 -= this.offset[0] * this.offsetState;
        y3 -= this.offset[1] * this.offsetState;
        y4 -= this.offset[1] * this.offsetState;
        var a_dx = x2 - x1;
        var a_dy = y2 - y1;
        var b_dx = x4 - x3;
        var b_dy = y4 - y3;
        let denominator = (-b_dx * a_dy + a_dx * b_dy);
        if (denominator == 0)
            denominator = 0.001;
        var s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / denominator;
        var t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / denominator;
        return (s > 0 && s < 1 && t > 0 && t < 1) ? [x1 + t * a_dx, y1 + t * a_dy, (-a_dy - b_dy) / 2, (a_dx + b_dx) / 2] : false;
    }
    polygonToLine(pol, l2) {
        for (let i = 0; i < pol.lines.length; i++) {
            let pol2line = this.collideLineToLine(pol.lines[i], l2);
            if (!!pol2line)
                return pol2line;
        }
        return 0;
    }
    polygonToPolygon(pol, pol2) {
        for (let i = 0; i < pol.lines.length; i++) {
            let pol2line = (this.polygonToLine(pol2, pol.lines[i]));
            if (pol2line)
                return pol2line;
        }
        return false;
    }
    pointToPolygon(point, polygon) {
        let intersections = 0;
        const vertices = polygon.vecs;
        for (let i = 0; i < vertices.length - 1; i++) {
            const [x1, y1] = vertices[i];
            const [x2, y2] = vertices[(i + 1) % (vertices.length - 1)];
            if ((y1 > point[1]) !== (y2 > point[1]) &&
                point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1) {
                intersections++;
            }
        }
        return intersections % 2 === 1;
    }
    circleToPoint(circle, p) {
        return Math.pow(length([p[0] - circle.pos[0], p[1] - circle.pos[1]]), 2) < circle.r * circle.r;
    }
    circleToLine(circle, l2) {
        let closestP = this.closestToLine(circle.pos, l2);
        return this.circleToPoint(circle, closestP) ? closestP : false;
    }
    circleToPolygon(circle, pol2) {
        let mindis = Infinity;
        let closestp = false;
        for (let i = 0; i < pol2.lines.length; i++) {
            let pol2line = (this.circleToLine(circle, pol2.lines[i]));
            if (pol2line) {
                let dis = length([pol2line[0] - circle.pos[0], pol2line[1] - circle.pos[1]]);
                if (dis < mindis) {
                    mindis = dis;
                    closestp = pol2line;
                }
            }
        }
        return closestp;
    }
    circleToCircle(cir1, cir2) {
        let dx = cir1.pos[0] - cir2.pos[0] + this.offset[0] * this.offsetState;
        let dy = cir1.pos[1] - cir2.pos[1] + this.offset[1] * this.offsetState;
        let l2 = dx * dx + dy * dy;
        if (l2 < (cir1.r + cir2.r) * (cir1.r + cir2.r)) {
            let dis = Math.sqrt(l2);
            return [cir1.pos[0] + dx / dis * cir1.r, cir1.pos[1] + dy / dis * cir1.r];
        }
        return false;
    }
    tick(dt, objs) {
        for (let i = 0; i < objs.length; i++) {
            let obj1 = objs[i];
            for (let j = i + 1; j < objs.length; j++) {
                let obj2 = objs[j];
                this.handleCollision(obj1, obj2, dt);
            }
        }
    }
    nearPhase(obj1, obj2) {
        const width1 = obj1.w;
        const height1 = obj1.h;
        const width2 = obj2.w;
        const height2 = obj2.h;
        const dx = Math.abs(obj2.x - obj1.x);
        const dy = Math.abs(obj2.y - obj1.y);
        const combinedWidths = width1 + width2;
        const combinedHeights = height1 + height2;
        return (dx + dx <= combinedWidths) && (dy + dy <= combinedHeights);
    }
    handleCollision(obj1, obj2, dt) {
        let pol1 = obj1.getPol();
        let pol2 = obj2.getPol();
        let closestPto = false;
        let closestPt = false;
        let closestPt2 = false;
        let n = undefined;
        let n2 = undefined;
        let ntries = 0;
        let dx = obj2.x - obj1.x;
        let dy = obj2.y - obj1.y;
        do {
            dx = obj2.x - obj1.x;
            dy = obj2.y - obj1.y;
            this.offset = [dx, dy];
            this.offsetState = 1;
            closestPt = closestPto;
            closestPto = false;
            if (pol1.type == Polygon.PolygonType && pol2.type == Polygon.PolygonType) {
                this.offsetState = 1;
                closestPto = this.polygonToPolygon(pol1, pol2);
                this.offsetState = -1;
                closestPt2 = this.polygonToPolygon(pol2, pol1);
                this.offsetState = 1;
            }
            else if (pol1.type == Polygon.CircleType && pol2.type == Polygon.PolygonType) {
                closestPto = this.circleToPolygon(pol1, pol2);
            }
            else if (pol1.type == Polygon.PolygonType && pol2.type == Polygon.CircleType) {
                this.offsetState = -1;
                closestPto = this.circleToPolygon(pol2, pol1);
            }
            else if (pol1.type == Polygon.CircleType && pol2.type == Polygon.CircleType) {
                closestPto = this.circleToCircle(pol1, pol2);
            }
            if (closestPto) {
                n = new Vector2D(closestPto[2], closestPto[3]);
                n.normalize();
                n.val();
            }
            ntries++;
        } while (!!closestPto && ntries < 2);
        let overlap = new Vector2D(1 / Math.SQRT2, 1 / Math.SQRT2);
        if (Array.isArray(closestPt2)) {
            let c1 = new Vector2D(closestPt[0], closestPt[1]);
            let c2 = new Vector2D(closestPt2[0], closestPt2[1]);
            overlap = new Vector2D(...c1.substract(c2).values);
            overlap = new Vector2D(overlap.x + dx, overlap.y + dy);
            n2 = new Vector2D(closestPt2[2], closestPt2[3]);
            n2.normalize();
            n2.val();
            let d2 = Math.abs(n2.dot(c2.substract(obj1.pos)) / (c2.substract(obj1.pos).length()));
            let d1 = Math.abs(n.dot(c1.substract(obj2.pos)) / (c1.substract(obj2.pos).length()));
            if (d2 > d1) {
                n = n2;
            }
            obj1.x += -(overlap.x + -dx);
            obj1.y += -(overlap.y + -dy);
            obj2.x -= -(overlap.x + -dx);
            obj2.y -= -(overlap.y + -dy);
        }
        obj1.color = !Array.isArray(closestPt) ? "red" : "green";
        if (!Array.isArray(closestPt))
            return;
        this.lastCollision = closestPt;
        if (this.modifyVel) {
            let m1 = obj1.m, m2 = obj2.m;
            let dv = obj1.vel.substract(obj2.vel);
            let cr = 1;
            let summass = m1 + m2;
            let j = -(1 + cr) * (dv.dot(n)) * m1 * m2 / (summass);
            obj1.vel.add(n.multiplyScalar(j / m1));
            obj2.vel.add(n.multiplyScalar(-j / m2));
            obj1.vel.val();
            obj2.vel.val();
            let { x: px, y: py } = obj1.pos;
            let { x: vpx, y: vpy } = obj1.vel;
            obj1.pos.x = obj2.pos.x;
            obj1.vel.x = obj2.vel.x;
            obj1.pos.y = obj2.pos.y;
            obj1.vel.y = obj2.vel.y;
            obj2.pos.x = px;
            obj2.pos.y = py;
            obj2.vel.x = vpx;
            obj2.vel.y = vpy;
        }
        if (this.callObjects) {
            obj1 === null || obj1 === void 0 ? void 0 : obj1.onCollision(obj2, closestPt);
            obj2 === null || obj2 === void 0 ? void 0 : obj2.onCollision(obj1, closestPt);
        }
    }
}
export class ImgLoader {
    static load(url, w, h) {
        return ImgLoader.loadImage(url, w, h);
    }
    static loadSync(url, w, h) {
        return __awaiter(this, void 0, void 0, function* () {
            let img = this.loadImage(url, w, h);
            return new Promise((res, rej) => {
                img.next = () => {
                    res(img);
                };
            });
        });
    }
    static loadImage(url, w, h) {
        let img = new Image(w, h);
        img.src = url;
        img.loaded = false;
        if (ImgLoader.enableCors) {
            img.crossOrigin = "anonymous";
        }
        img.onload = () => {
            var _a, _b;
            img.loaded = true;
            if (typeof img.next == "function") {
                (_b = (_a = img).next) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
        };
        return img;
    }
    static loadImages(...url) {
        let imgs = [];
        url.forEach((u) => {
            if (Array.isArray(u)) {
                u.forEach((ur) => {
                    let timg = this.loadImage(ur);
                    if (timg)
                        imgs.push(timg);
                    if (ImgLoader.enableCors) {
                        timg.crossOrigin = "anonymous";
                    }
                });
            }
            else {
                let timg = this.loadImage(u);
                if (ImgLoader.enableCors) {
                    timg.crossOrigin = "anonymous";
                }
                if (timg)
                    imgs.push(timg);
            }
        });
        return imgs;
    }
    static loadDirImages(dir, ...url) {
        let imgs = [];
        url.forEach((u) => {
            if (Array.isArray(u)) {
                u.forEach((ur) => {
                    let timg = this.loadImage(dir + ur);
                    if (ImgLoader.enableCors) {
                        timg.crossOrigin = "anonymous";
                    }
                    if (timg)
                        imgs.push(timg);
                });
            }
            else {
                let timg = this.loadImage(dir + u);
                if (ImgLoader.enableCors) {
                    timg.crossOrigin = "anonymous";
                }
                if (timg)
                    imgs.push(timg);
            }
        });
        return imgs;
    }
    static getPathArray(preffix = "", values = "", suffix = "") {
        if (!Array.isArray(values)) {
            return [preffix + values + suffix];
        }
        return values.map(val => preffix + val + suffix);
    }
    static join(...imgs) {
        let allloaded = true;
        let wtot = 0;
        let maxh = 10;
        let maxoffy = 0;
        imgs.forEach((ec) => {
            var _a, _b;
            let offx = 0, offy = 0;
            if (Array.isArray(ec)) {
                offx = (_a = ec[1]) !== null && _a !== void 0 ? _a : 0;
                offy = (_b = ec[2]) !== null && _b !== void 0 ? _b : 0;
                ec = ec[0];
            }
            ;
            if (!(ec === null || ec === void 0 ? void 0 : ec.loaded))
                allloaded = false;
            wtot += (ec === null || ec === void 0 ? void 0 : ec.w) + offx;
            if ((ec === null || ec === void 0 ? void 0 : ec.h) > maxh) {
                maxh = ec.h;
            }
            if (offy < 0 && offy < maxoffy) {
                maxoffy = offy;
            }
            ;
        });
        maxh += Math.abs(maxoffy) * 2;
        if (!allloaded)
            return undefined;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const canvasWidth = wtot;
        const canvasHeight = maxh;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let tx = 0;
        for (let i = 0; i < imgs.length; i++) {
            var ec = imgs[i];
            let offx = 0, offy = 0;
            if (Array.isArray(ec)) {
                offx = ec[1];
                offy = ec[2];
                ec = ec[0];
            }
            ;
            if (!ec)
                continue;
            context.drawImage(ec.img, tx + offx, (maxh - ec.h) / 2 + offy - maxoffy, ec.w, ec.h);
            tx += ec.w + offx;
        }
        let newimg = new Image(canvasWidth, canvasHeight);
        newimg.loaded = false;
        newimg.src = canvas.toDataURL();
        newimg.onload = () => {
            var _a, _b;
            newimg.loaded = true;
            if (typeof newimg.next == "function") {
                (_b = (_a = newimg).next) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
        };
        return newimg;
    }
    static applyFilter(img, r, g, b, w, h) {
        let apply = function () {
            img.loaded = false;
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const canvasWidth = w || img.width;
            const canvasHeight = h || img.height;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            const sourceImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
            const src = sourceImageData.data;
            for (let i = 0; i < src.length; i += 4) {
                src[i] = ~~(Math.min((r * src[i]) / 255, 255));
                src[i + 1] = ~~(Math.min((g * src[i + 1]) / 255, 255));
                src[i + 2] = ~~(Math.min((b * src[i + 2]) / 255, 255));
            }
            context.putImageData(sourceImageData, 0, 0);
            img.src = canvas.toDataURL();
            img.onload = () => {
                var _a, _b;
                img.loaded = true;
                if (typeof img.next == "function" && img.next !== apply) {
                    (_b = (_a = img).next) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
            };
        };
        if (!img.loaded) {
            img.next = apply;
        }
        else {
            apply();
        }
    }
    static fromCanvasOrBitmap(source, w, h) {
        return __awaiter(this, void 0, void 0, function* () {
            let blob;
            if (source instanceof HTMLCanvasElement) {
                blob = yield new Promise((res) => source.toBlob(res));
            }
            else if (source instanceof ImageBitmap) {
                const tmp = document.createElement("canvas");
                tmp.width = source.width;
                tmp.height = source.height;
                const ctx = tmp.getContext("2d");
                if (!ctx)
                    throw new Error("No se pudo crear contexto 2D");
                ctx.drawImage(source, 0, 0);
                blob = yield new Promise((res) => tmp.toBlob(res));
            }
            else {
                throw new Error("Tipo no soportado");
            }
            const url = URL.createObjectURL(blob);
            const img = this.loadImage(url, w, h);
            return new Promise((res) => {
                img.next = () => {
                    URL.revokeObjectURL(url);
                    res(img);
                };
            });
        });
    }
}
ImgLoader.enableCors = false;
ImgLoader.subimg = ImgLoader.subimage = ImgLoader.cut = ImgLoader.cutimg = ImgLoader.cutImage = (img, x, y, w, h) => {
    if (!img)
        return;
    let canvas2 = document.createElement('canvas');
    canvas2.className = "canvas2";
    if (ImgLoader.enableCors) {
        img.crossOrigin = "anonymous";
    }
    canvas2.width = w;
    canvas2.height = h;
    if (w > img.width)
        w = img.width;
    if (h > img.height)
        h = img.height;
    let context = canvas2.getContext("2d");
    document.body.appendChild(canvas2);
    context.drawImage(img, x, y, w, h, 0, 0, canvas2.width, canvas2.height);
    let imgurl = canvas2.toDataURL();
    canvas2.remove();
    return ImgLoader.loadImage(imgurl, w, h);
};
ImgLoader.subimgs = ImgLoader.subimages = ImgLoader.cuts = ImgLoader.cutimgs = ImgLoader.cutImages = (img, imgs) => {
    let timgs = [];
    imgs.forEach((u) => {
        var _a, _b, _d, _e;
        if (Array.isArray(u) && isNaN(u[0])) {
            if (!u)
                return;
            u.forEach((ur) => {
                var _a, _b, _d, _e;
                if (!ur)
                    return;
                let timg = ImgLoader.cut(img, (_a = ur.x) !== null && _a !== void 0 ? _a : ur[0], (_b = ur.y) !== null && _b !== void 0 ? _b : ur[1], (_d = ur.w) !== null && _d !== void 0 ? _d : ur[2], (_e = ur.h) !== null && _e !== void 0 ? _e : ur[3]);
                if (timg)
                    timgs.push(timg);
            });
        }
        else {
            let timg = ImgLoader.cut(img, (_a = u.x) !== null && _a !== void 0 ? _a : u[0], (_b = u.y) !== null && _b !== void 0 ? _b : u[1], (_d = u.w) !== null && _d !== void 0 ? _d : u[2], (_e = u.h) !== null && _e !== void 0 ? _e : u[3]);
            if (timg)
                timgs.push(timg);
        }
    });
    return timgs;
};
export class Camera2D extends GameObject {
    constructor(x, y, w, h, zoom = 1) {
        super(x, y, w, h);
        this.zoom = zoom;
        this.obj = this;
        this.calculateTransformMatrix();
    }
    calculateTransformMatrix() {
        var _a, _b, _d, _e, _f, _g;
        let z = this.zoom > 0 ? this.zoom : (-1 / this.zoom);
        let px = this.obj.pos.x;
        let py = this.obj.pos.y;
        let offzx = ((_d = (_b = (_a = this.zoomCenter) === null || _a === void 0 ? void 0 : _a.pos) === null || _b === void 0 ? void 0 : _b.x) !== null && _d !== void 0 ? _d : 0) - W / 2;
        let offzy = ((_g = (_f = (_e = this.zoomCenter) === null || _e === void 0 ? void 0 : _e.pos) === null || _f === void 0 ? void 0 : _f.y) !== null && _g !== void 0 ? _g : 0) - H / 2;
        if (this.obj !== this) {
            px += this.x;
            py += this.y;
        }
        let transformMatrix = MatrixStack2D.translation(-px - offzx, -py - offzy)
            .mult(MatrixStack2D.translation(-W / 2, -H / 2))
            .mult(MatrixStack2D.rotation(this.rotation))
            .mult(MatrixStack2D.scaling(z, z))
            .mult(MatrixStack2D.translation(W / 2 + offzx, H / 2 + offzy));
        this.lastTransformMatrix = transformMatrix;
        return transformMatrix;
    }
    get transformMatrix() {
        if (this.info.changed.any) {
            this.calculateTransformMatrix();
        }
        return this.lastTransformMatrix;
    }
    follow(obj) {
        if (!obj)
            this.obj = this;
        this.obj = obj;
        return this;
    }
    setZoomCenter(obj) {
        if (!obj)
            this.zoomCenter = undefined;
        this.zoomCenter = obj;
        return this;
    }
}
export class ObjectManager {
    constructor(objs = []) {
        this.ManagerFilter = undefined;
        this.objs = objs;
    }
    add(...objs) {
        for (let i = 0; i < objs.length; i++) {
            this.objs.push(objs[i]);
        }
    }
    func(name, ...args) {
        var _a;
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            (_a = obj === null || obj === void 0 ? void 0 : obj[name]) === null || _a === void 0 ? void 0 : _a.call(obj, ...args);
        }
    }
    filterObjects(filter) {
        let retObjs = this.objs.filter(filter);
        if (!!this.ManagerFilter) {
            return retObjs.filter(this.ManagerFilter);
        }
        return retObjs;
    }
}
export class Layer extends ObjectManager {
    constructor(id, canvas, scene = Scene.sc) {
        super([]);
        this.id = id;
        this.canvas = canvas;
        this.scene = scene;
        this.stack = new MatrixStack2D();
        this.uuid = generateUUID();
    }
    getWidth() {
        return this.canvas.width;
    }
    getHeight() {
        return this.canvas.height;
    }
    draw(...args) {
        var _a, _b;
        this.canvas.ctx.lastDrawnLayer = this;
        (_a = this === null || this === void 0 ? void 0 : this.preExtraDraw) === null || _a === void 0 ? void 0 : _a.call(this, this.canvas.ctx, ...args);
        this.func("draw", this.canvas.ctx, ...args);
        (_b = this === null || this === void 0 ? void 0 : this.posExtraDraw) === null || _b === void 0 ? void 0 : _b.call(this, this.canvas.ctx, ...args);
    }
    tick(...args) {
        var _a, _b;
        this.canvas.ctx;
        (_a = this === null || this === void 0 ? void 0 : this.preExtraTick) === null || _a === void 0 ? void 0 : _a.call(this, ...args);
        this.func("tick", ...args);
        (_b = this === null || this === void 0 ? void 0 : this.posExtraTick) === null || _b === void 0 ? void 0 : _b.call(this, ...args);
    }
    killObjs(filterfc = (o) => !!o && (o === null || o === void 0 ? void 0 : o.dead) !== true) {
        this.objs = this.objs.filter(filterfc);
    }
    findObjects(filter, conditions) {
        let retObjs = [];
        for (let i = 0; i < this.objs.length; i++) {
            let obj = this.objs[i];
            if (obj instanceof GameObject && filter(obj)) {
                retObjs.push(obj);
            }
            else if (obj instanceof ObjectGroup) {
                retObjs.push(...obj.findObjects(filter, conditions));
            }
        }
        return retObjs;
    }
}
class ObjectGroup extends ObjectManager {
    constructor(name, layer, objs = []) {
        super(objs);
        this.name = name;
        this.layer = layer;
    }
    draw(...args) {
        this.func("draw", ...args);
    }
    tick(...args) {
        this.func("tick", ...args);
    }
    killObjs(filterfc = () => true) {
        this.objs = this.objs.filter(filterfc);
    }
    findObjects(filter, conditions) {
        return this.filterObjects(filter);
    }
    static create(layer, ...objs) {
        let length = objs.length;
        let group = new ObjectGroup(`(${length}) ObjGroup`, layer);
    }
}
class StaticDrawBoxObjectGroup extends ObjectGroup {
    constructor(name, layer, objs = [], x = 0, y = 0, w = 1080, h = 720) {
        super(name, layer, objs);
        this.name = name;
        this.layer = layer;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    draw(ctx, ...args) {
        let [x, y] = ctx.applyStack(this.x, this.y, this.w, this.h);
        if (x + this.w < 0 || x > W || y + this.h < 0 || y > H) {
            return;
        }
        this.func("draw", ctx, ...args);
    }
    setBounds(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    findObjects(filter, conditions) {
        if (conditions === null || conditions === void 0 ? void 0 : conditions.obj) {
        }
        return super.findObjects(filter, conditions);
    }
}
export class Scene extends ObjectManager {
    constructor(objs = [], cam = new Camera2D(0, 0, 1)) {
        super(objs);
        this.cam = cam;
        this.stack = new MatrixStack2D();
        this.uuid = generateUUID();
        this.ManagerFilter = undefined;
    }
    setMatrixStack(stack) {
        this.stack = stack;
        return this;
    }
    addLayer(lay) {
        super.add(lay);
    }
    getLayer(n) {
        var _a;
        return ((_a = this === null || this === void 0 ? void 0 : this.objs) === null || _a === void 0 ? void 0 : _a[n]) || undefined;
    }
    getLastLayer() {
        var _a, _b;
        return ((_a = this === null || this === void 0 ? void 0 : this.objs) === null || _a === void 0 ? void 0 : _a[(((_b = this === null || this === void 0 ? void 0 : this.objs) === null || _b === void 0 ? void 0 : _b.length) || 1) - 1]) || undefined;
    }
    getFirstLayer() {
        var _a;
        return ((_a = this === null || this === void 0 ? void 0 : this.objs) === null || _a === void 0 ? void 0 : _a[0]) || undefined;
    }
    add(layer = 0, ...objs) {
        var _a;
        let lay = layer;
        if (!objs)
            objs = [];
        if (layer instanceof Layer)
            lay = this.objs.indexOf(layer);
        else if (typeof layer !== "number") {
            (_a = objs === null || objs === void 0 ? void 0 : objs.push) === null || _a === void 0 ? void 0 : _a.call(objs, layer);
            lay = 0;
        }
        this.objs[lay].add(...objs);
        return this;
    }
    draw(...args) {
        var _a, _b;
        (_a = this === null || this === void 0 ? void 0 : this.preExtraDraw) === null || _a === void 0 ? void 0 : _a.call(this, ...args);
        this.func("draw", ...args);
        (_b = this === null || this === void 0 ? void 0 : this.posExtraDraw) === null || _b === void 0 ? void 0 : _b.call(this, ...args);
    }
    tick(...args) {
        this.func("tick", ...args);
    }
    setCamera2D(cam = this.cam || new Camera2D(0, 0, 10, 10)) {
        this.cam = cam;
        return this;
    }
    funcLayers(name, ...args) {
        var _a;
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            (_a = obj === null || obj === void 0 ? void 0 : obj.func) === null || _a === void 0 ? void 0 : _a.call(obj, name, ...args);
        }
    }
    killObjs(filterfc) {
        this.func("killObjs", filterfc);
    }
    findObjects(filter, conditions) {
        let retObjs = [];
        for (let i = 0; i < this.objs.length; i++) {
            retObjs.push(...this.objs[i].findObjects(filter, conditions));
        }
        return retObjs;
    }
}
Scene.sc = new Scene();
export function createLayer(c, sc) {
    var _a, _b, _d, _e, _f;
    if (!c && !sc)
        return;
    if (!c)
        c = (_b = (_a = sc === null || sc === void 0 ? void 0 : sc.objs) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.canvas.ctx;
    let cnvs = c.canvas;
    let cid = cnvs.id;
    let canvs = cnvs;
    let layer = new Layer(cid, canvs, (_d = sc !== null && sc !== void 0 ? sc : (c.layer.scene)) !== null && _d !== void 0 ? _d : new Scene());
    (_f = (_e = layer === null || layer === void 0 ? void 0 : layer.scene) === null || _e === void 0 ? void 0 : _e.addLayer) === null || _f === void 0 ? void 0 : _f.call(_e, layer);
    let collec = { canvas: canvs, ctx: c, append() {
            return collec;
        }, center(ops) {
            return collec;
        }, };
    return collec;
}
export class Scene3D extends Scene {
}
var pendantAudio = [];
var volume = 1;
export function setVolume(vol) {
    volume = vol;
}
export class AudioLoader {
    constructor(folder) {
        this.folder = folder;
        if (this.folder) {
            this.load = (filename, vol = 1) => {
                var audio = new Audio(this.folder + filename);
                audio.src = this.folder + filename;
                audio.volume = vol;
                audio.vol = vol;
                return audio;
            };
        }
    }
    load(filename, vol = volume) {
        var audio = new Audio(this.folder + filename);
        audio.src = this.folder + filename;
        audio.volume = vol;
        audio.vol = vol;
        return audio;
    }
    static load(filename, vol = 1) {
        var audio = new Audio(filename);
        audio.src = filename;
        audio.volume = vol;
        audio.vol = vol;
        return audio;
    }
    static loadAudios(...url) {
        let auds = [];
        url.forEach((u) => {
            if (Array.isArray(u)) {
                u.forEach((ur) => {
                    let taud = this.load(ur);
                    if (taud)
                        auds.push(taud);
                });
            }
            else {
                let taud = this.load(u);
                if (taud)
                    auds.push(taud);
            }
        });
        return auds;
    }
    playAudio(audio, multi = true) {
        try {
            audio.volume = Math.min(Math.max(volume * audio.vol, 0), 1);
            let promise;
            if (audio.paused)
                promise = audio.play();
            else if (multi) {
                promise = audio.cloneNode(false).play();
                promise.catch(() => {
                    pendantAudio.push([audio, multi]);
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    static playAudio(audio, multi = true) {
        try {
            audio.volume = Math.min(Math.max(volume * audio.vol, 0), 1);
            let promise;
            if (audio.paused)
                promise = audio.play();
            else if (multi) {
                promise = audio.cloneNode(false).play();
                promise.catch(() => {
                    pendantAudio.push([audio, multi]);
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    static setVolume(vol) {
        volume = vol;
    }
    setVolume(vol) {
        volume = vol;
    }
}
export function playAudio(audio, multi = true) {
    if (!audio || !audio.loaded)
        return;
    if (!audioPermitted) {
        pendantAudio.push([audio, multi]);
        return;
    }
    try {
        audio.volume = Math.min(Math.max(volume * audio.vol, 0), 1);
        let promise;
        if (audio.paused)
            promise = audio.play();
        else if (multi) {
            promise = audio.cloneNode(false).play();
            promise.catch(() => {
                pendantAudio.push([audio, multi]);
            });
        }
    }
    catch (error) {
        audioPermitted = false;
        console.log(error);
    }
}
var audioPermitted = true;
export var isAudioPermitted = () => {
    return audioPermitted;
};
export var setAudioPermitted = (is = true) => {
    audioPermitted = is;
};
export function queryAudioPermission(nav = navigator) {
    var _a;
    (_a = nav === null || nav === void 0 ? void 0 : nav.getUserMedia) === null || _a === void 0 ? void 0 : _a.call(nav, {
        audio: true
    }, function (localMediaStream) {
        audioPermitted = true;
    }, function (err) {
        audioPermitted = false;
    });
}
export function usePendantAudio() {
    if (pendantAudio.length == 0)
        return;
    if (!pendantAudio[pendantAudio.length - 1][0].paused && pendantAudio[pendantAudio.length - 1][1]) {
        console.log((pendantAudio[pendantAudio.length - 1][0].cloneNode(false)));
        pendantAudio[pendantAudio.length - 1][0].cloneNode(false).play();
    }
    else
        pendantAudio[pendantAudio.length - 1][0].play();
    pendantAudio.pop();
}
export function addPendantAudio(audio, multi = true) {
    pendantAudio.push([audio, multi]);
}
export let keypress = {
    a: false,
    w: false,
    s: false,
    d: false,
    up: false,
    down: false,
    right: false,
    left: false,
    ctrl: false,
    shift: false,
    q: false,
    e: false,
    t: false,
    g: false,
    r: false,
    f: false,
    i: false,
    o: false,
    h: false,
    y: false,
    p: false,
    m: false,
    n: false,
    b: false,
    v: false,
    c: false,
    x: false,
    z: false,
    u: false,
    l: false,
    j: false,
    Enter: false,
    Backspace: false,
    none: false,
};
keypress.createSwitch = (k1, k2) => {
    return () => {
        return keypress[k1] ? -1 : keypress[k2] ? 1 : 0;
    };
};
keypress.Hor = keypress.Horizontal = () => {
    return keypress.a ? -1 : keypress.d ? 1 : 0;
};
keypress.Ver = keypress.Vertical = () => {
    return keypress.w ? -1 : keypress.s ? 1 : 0;
};
keypress.Depth = () => {
    return keypress.q ? -1 : keypress.e ? 1 : 0;
};
keypress.mv2D = (vel = 1) => {
    return new Vector2D(keypress.Hor() * vel, keypress.Ver() * vel);
};
keypress.mv3D = (vel = 1) => {
    return new Vector3D(keypress.Hor() * vel, keypress.Ver() * vel, keypress.Depth() * vel);
};
Object.defineProperty(keypress, 'space', {
    get: function () {
        return keypress[" "];
    }
});
Object.defineProperty(keypress, 'Backspace', {
    get: function () {
        return keypress["backspace"];
    }
});
Object.defineProperty(keypress, 'Enter', {
    get: function () {
        return keypress["enter"];
    }
});
export class KeyManager {
    static presscb(e) {
        var _a;
        for (let i = 0; i < this.presscbs.length; i++) {
            const cb = this.presscbs[i];
            if (!!cb && cb.key !== undefined && cb.key.toLowerCase() == e.key.toLowerCase()
                && cb.cb !== undefined && typeof cb.cb == "function") {
                (_a = cb.cb) === null || _a === void 0 ? void 0 : _a.call(cb, e);
            }
        }
    }
    static addEventOnPress(key, cb) {
        this.presscbs.push({ key, cb });
    }
    static OnKey(key, cb) {
        this.addEventOnPress(key, cb);
    }
    static OnPress(key, cb) {
        this.addEventOnPress(key, cb);
    }
}
_c = KeyManager;
KeyManager.keypress = keypress;
KeyManager.detectKeys = (keys = keypress) => {
    var _a, _b, _d, _e;
    let space;
    if (!keys || keys.detected === true)
        return;
    keys.detected = true;
    let pressfun = (e) => {
        var _a;
        keys[e.key.toLowerCase()] = true;
        if (_c.presscb)
            (_a = _c.presscb) === null || _a === void 0 ? void 0 : _a.call(_c, e);
    };
    (_a = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _a === void 0 ? void 0 : _a.call(window, "keydown", pressfun);
    (_b = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _b === void 0 ? void 0 : _b.call(window, "keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    (_d = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _d === void 0 ? void 0 : _d.call(window, "keydown", (e) => {
        if (e.key === "ArrowLeft") {
            keypress.left = true;
        }
        if (e.key === "ArrowRight") {
            keypress.right = true;
        }
        if (e.key === "ArrowUp") {
            keypress.up = true;
        }
        if (e.key === "ArrowDown") {
            keypress.down = true;
        }
        if (e.code === 'ShiftRight') {
            keypress["ShiftRight"] = true;
        }
        else if (e.code === 'ShiftLeft') {
            keypress["ShiftLeft"] = true;
        }
    });
    (_e = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _e === void 0 ? void 0 : _e.call(window, "keyup", (e) => {
        if (e.key === "ArrowLeft") {
            keypress.left = false;
        }
        if (e.key === "ArrowRight") {
            keypress.right = false;
        }
        if (e.key === "ArrowUp") {
            keypress.up = false;
        }
        if (e.key === "ArrowDown") {
            keypress.down = false;
        }
        if (e.code === 'ShiftRight') {
            keypress["ShiftRight"] = false;
        }
        else if (e.code === 'ShiftLeft') {
            keypress["ShiftLeft"] = false;
        }
    });
};
KeyManager.presscbs = [];
keypress.listen = () => {
    KeyManager.detectKeys(keypress);
};
const clicklisteners = [];
const wheellisteners = [];
export class ListenerManager {
    static onClick(scene, sc, ...pars) {
        if (!sc)
            return;
        clicklisteners.push({ who: scene, lis: sc, pars: pars });
    }
    static onWheel(scene, sc_funcLayers, ...pars) {
        if (!sc_funcLayers)
            return;
        wheellisteners.push({ who: scene, lis: sc_funcLayers, pars: pars });
    }
}
export var mousepos = { x: 0, y: 0, lastid: "" };
export var mouseposes = [];
export var mouseclick = [false, false, false];
mouseclick.isAny = () => {
    for (let i = 0; i < mouseclick.length; i++) {
        if (mouseclick[i])
            return true;
    }
    return false;
};
mouseclick.isAnyFalse = () => {
    for (let i = 0; i < mouseclick.length; i++) {
        if (!mouseclick[i])
            return true;
    }
    return false;
};
mouseclick.count = () => {
    let count = 0;
    for (let i = 0; i < mouseclick.length; i++) {
        if (mouseclick[i])
            count++;
    }
    return count;
};
const getElementFromIdOrElement = (id) => {
    let element;
    if (typeof (id) == "string")
        element = document.getElementById(id);
    if (!(element instanceof HTMLElement))
        return;
    return element;
};
const mousemove = (e, ic, id) => {
    var _a, _b, _d, _e, _f, _g, _h, _j, _k;
    if (!ic)
        return;
    let canvas = id;
    if (typeof (id) == "string")
        canvas = document.getElementById(id);
    if (!(canvas instanceof HTMLElement))
        return;
    const pos = (_d = (_b = (_a = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _d !== void 0 ? _d : { left: parseInt(canvas.style.marginLeft.substring(0, canvas.style.marginLeft.length - 2)), top: 0 };
    let x, y;
    let x2m, y2m;
    if (e.touches && e.touches.length > 0) {
        x = (_e = (e.touches[0].clientX - pos.left)) !== null && _e !== void 0 ? _e : e.touches[0].screenX;
        y = (_f = (e.touches[0].clientY - pos.top)) !== null && _f !== void 0 ? _f : e.touches[0].screenY;
        for (let i = 0; i < e.touches.length; i++) {
            x2m = (_g = (e.touches[i].clientX - pos.left)) !== null && _g !== void 0 ? _g : e.touches[i].screenX;
            y2m = (_h = (e.touches[i].clientY - pos.top)) !== null && _h !== void 0 ? _h : e.touches[i].screenY;
            if (!mouseposes[e.touches[i].identifier]) {
                mouseposes[e.touches[i].identifier] = { x: 0, y: 0, lastid: "" };
            }
            mouseposes[e.touches[i].identifier].x = x2m;
            mouseposes[e.touches[i].identifier].y = y2m;
            calculatemousepos(x2m, y2m, id, mouseposes[e.touches[i].identifier]);
            mouseclick[e.touches[i].identifier] = true;
        }
    }
    else {
        x = (_j = (e.clientX - pos.left)) !== null && _j !== void 0 ? _j : e.offsetX;
        y = (_k = (e.clientY - pos.top)) !== null && _k !== void 0 ? _k : e.offsetY;
    }
    calculatemousepos(x, y, id);
};
function addCanvasListeners(ccanvas) {
    ccanvas.addEventListener("mousemove", (e) => (mousemove(e, true, ccanvas.id)));
    ccanvas.addEventListener("touchmove", (e) => (mousemove(e, true, ccanvas.id)));
    ccanvas.addEventListener("mousedown", (e) => (mousedown(e, true, ccanvas.id)));
    ccanvas.addEventListener("touchstart", (e) => (mousedown(e, true, ccanvas.id)));
    ccanvas.addEventListener("mouseup", (e) => (mouseup(e, true, ccanvas.id)));
    ccanvas.addEventListener("mouseleave", (e) => (mouseup(e, true, ccanvas.id)));
    ccanvas.addEventListener("touchend", (e) => (mouseup(e, true, ccanvas.id)));
    ccanvas.addEventListener("touchcancel", (e) => (mouseup(e, true, ccanvas.id)));
}
export function isFullScreen() {
    return (window.fullScreen) || ((window === null || window === void 0 ? void 0 : window.innerWidth) == screen.width && (window === null || window === void 0 ? void 0 : window.innerHeight) == screen.height);
}
export class ScreenManager {
    static isFullScreen() {
        return isFullScreen();
    }
    static setFullScreen(canvas) {
        openFullscreen(canvas);
    }
}
(_a = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _a === void 0 ? void 0 : _a.call(window, "mousemove", (e) => {
    if (isFullScreen()) {
        mousemove(e, true, e.target);
    }
});
(_b = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _b === void 0 ? void 0 : _b.call(window, "touchmove", (e) => {
    if (isFullScreen())
        mousemove(e, true, e.target);
});
function calculatemousepos(x, y, canvasid, mpos = mousepos) {
    var _a, _b;
    let can = getElementFromIdOrElement(canvasid);
    if (!can || !window)
        return;
    let stylew;
    let styleh;
    let boundingBox = (_b = (_a = can === null || can === void 0 ? void 0 : can.getBoundingClientRect) === null || _a === void 0 ? void 0 : _a.call(can)) !== null && _b !== void 0 ? _b : { left: parseInt(can.style.marginLeft.substring(0, can.style.marginLeft.length - 2)), top: 0 };
    stylew = can.getBoundingClientRect().width;
    styleh = can.getBoundingClientRect().height;
    if (!isFullScreen()) {
    }
    else {
        x += boundingBox.left - can.getBoundingClientRect().x;
    }
    let cw = stylew, ch = styleh;
    if (can instanceof HTMLCanvasElement) {
        cw = can.width;
        ch = can.height;
    }
    mpos.x = cw * x / stylew;
    mpos.y = ch * y / styleh;
    mpos.lastid = canvasid;
    return mpos;
}
const mousedown = (e, ic, id) => {
    var _a, _b, _d, _e, _f, _g, _h, _j, _k;
    mouseclick[e.button] = true;
    if (!ic)
        return;
    usePendantAudio();
    var pos = (_d = (_b = (_a = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _d !== void 0 ? _d : { left: 0, top: 0 };
    let x, y;
    let x2m, y2m;
    if (e.touches && e.touches.length > 0) {
        x = (_e = (e.touches[0].clientX - pos.left)) !== null && _e !== void 0 ? _e : e.touches[0].screenX;
        y = (_f = (e.touches[0].clientY - pos.top)) !== null && _f !== void 0 ? _f : e.touches[0].screenY;
        for (let i = 0; i < e.touches.length; i++) {
            x2m = (_g = (e.touches[i].clientX - pos.left)) !== null && _g !== void 0 ? _g : e.touches[i].screenX;
            y2m = (_h = (e.touches[i].clientY - pos.top)) !== null && _h !== void 0 ? _h : e.touches[i].screenY;
            if (!mouseposes[e.touches[i].identifier]) {
                mouseposes[e.touches[i].identifier] = { x: 0, y: 0, lastid: "" };
            }
            mouseposes[e.touches[i].identifier].x = x2m;
            mouseposes[e.touches[i].identifier].y = y2m;
            calculatemousepos(x2m, y2m, id, mouseposes[e.touches[i].identifier]);
            mouseclick[e.touches[i].identifier] = true;
        }
    }
    else {
        x = (_j = (e.clientX - pos.left)) !== null && _j !== void 0 ? _j : e.offsetX;
        y = (_k = (e.clientY - pos.top)) !== null && _k !== void 0 ? _k : e.offsetY;
    }
    calculatemousepos(x, y, id);
    const x1 = mousepos.x, y1 = mousepos.y;
    for (let i = 0; i < clicklisteners.length; i++) {
        const lis = clicklisteners[i];
        lis.lis.apply(lis.who, [...lis.pars, x1, y1, true, e.button || 0, ic, id, x2m, y2m]);
    }
};
const mouseup = (e, ic, id) => {
    var _a, _b, _d, _e, _f, _g, _h, _j, _k;
    mouseclick[e.button] = false;
    if (!ic)
        return;
    const pos = (_d = (_b = (_a = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _d !== void 0 ? _d : { left: 0, top: 0 };
    let x, y;
    let x2m, y2m;
    if (e.touches || e.changedTouches) {
        if (e.changedTouches.length > 0) {
            for (const touch of e.changedTouches) {
                mouseclick[touch.identifier] = false;
            }
        }
        if (e.touches.length > 0) {
            x = (_e = (e.touches[0].clientX - pos.left)) !== null && _e !== void 0 ? _e : e.touches[0].screenX;
            y = (_f = (e.touches[0].clientY - pos.top)) !== null && _f !== void 0 ? _f : e.touches[0].screenY;
            for (let i = 0; i < e.touches.length; i++) {
                y2m = (_g = (e.touches[i].clientX - pos.left)) !== null && _g !== void 0 ? _g : e.touches[i].screenX;
                x2m = (_h = (e.touches[i].clientY - pos.top)) !== null && _h !== void 0 ? _h : e.touches[i].screenY;
                if (!mouseposes[e.touches[i].identifier]) {
                    mouseposes[e.touches[i].identifier] = { x: 0, y: 0, lastid: "" };
                }
                mouseposes[e.touches[i].identifier].x = x2m;
                mouseposes[e.touches[i].identifier].y = y2m;
                calculatemousepos(x2m, y2m, id, mouseposes[e.touches[i].identifier]);
            }
        }
        else {
            for (let i = 1; i < mouseposes.length; i++) {
                mouseclick[i] = false;
            }
        }
    }
    else {
        x = (_j = (e.clientX - pos.left)) !== null && _j !== void 0 ? _j : e.offsetX;
        y = (_k = (e.clientY - pos.top)) !== null && _k !== void 0 ? _k : e.offsetY;
    }
    calculatemousepos(x, y, id);
    const x1 = mousepos.x, y1 = mousepos.y;
    for (let i = 0; i < clicklisteners.length; i++) {
        const lis = clicklisteners[i];
        lis.lis.apply(lis.who, [...lis.pars, x1, y1, false, e.button || 0, ic, id, x2m, y2m]);
    }
};
export class MouseManager {
    static EnableCanvas(canvas) {
        addCanvasListeners(canvas);
    }
    static createDoubleClickListenerGameObject(cid) {
        let dbclickList = new GameObject();
        dbclickList.listeners = [];
        dbclickList.add = (lis) => {
            if (typeof lis == "function") {
                dbclickList.listeners.push(lis);
            }
        };
        dbclickList.time = 0;
        dbclickList.wasLast = false;
        dbclickList.onClick = (x1, y1, is, button, ic, id, x2m, y2m) => {
            if (cid && cid !== id)
                return;
            if (button !== 0)
                return;
            if (is) {
                if (!dbclickList.wasLast) {
                    if (x1 > W - 100 && y1 > H - 100) {
                        dbclickList.time = 0;
                        dbclickList.wasLast = true;
                    }
                }
                else if (dbclickList.time > 0.05) {
                    dbclickList.wasLast = false;
                    dbclickList.listeners.forEach(lis => {
                        lis && lis(dbclickList.time);
                    });
                    dbclickList.time = 0;
                }
            }
        };
        dbclickList.tick = (dt) => {
            if (dbclickList.time === undefined || (!dbclickList.wasLast))
                return;
            dbclickList.time += dt;
            if (dbclickList.time > 0.4) {
                dbclickList.wasLast = false;
                dbclickList.time = 0;
                dbclickList.wasLastRelease = false;
            }
        };
        return dbclickList;
    }
}
export function openFullscreen(canv) {
    if (canv.requestFullscreen) {
        canv.requestFullscreen();
    }
    else if (canv.webkitRequestFullscreen) {
        canv.webkitRequestFullscreen();
    }
    else if (canv.msRequestFullscreen) {
        canv.msRequestFullscreen();
    }
}
function generateUUID() {
    const hex = [];
    for (let i = 0; i < 256; i++) {
        hex[i] = (i < 16 ? '0' : '') + i.toString(16);
    }
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;
    return (hex[buffer[0]] + hex[buffer[1]] +
        hex[buffer[2]] + hex[buffer[3]] + '-' +
        hex[buffer[4]] + hex[buffer[5]] + '-' +
        hex[buffer[6]] + hex[buffer[7]] + '-' +
        hex[buffer[8]] + hex[buffer[9]] + '-' +
        hex[buffer[10]] + hex[buffer[11]] +
        hex[buffer[12]] + hex[buffer[13]] +
        hex[buffer[14]] + hex[buffer[15]]);
}
