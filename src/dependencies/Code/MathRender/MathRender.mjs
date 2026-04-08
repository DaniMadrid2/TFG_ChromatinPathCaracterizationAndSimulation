import { GameObject, W, H, keypress } from "../Game/Game.js";
import { Vector2D, Matrix2D, ObjList, Vector3D } from "../Matrix/Matrix.mjs";
import { MathJaxLoader } from "../MathJax/MathJax.js";
export class Funcion extends GameObject {
    fx;
    offx = 0;
    offy = 0;
    scalex = 1;
    scaley = 1;
    minPX = 0;
    maxPX = W;
    dx;
    sx;
    ex;
    drawtime = 0;
    drawingtime = 0;
    todraw = true;
    drawEvrytime = false;
    txtW = 5;
    maxdis = -1;
    lasty = { x: 0, y: 0 };
    constructor(x = 0, y = 0, fx = (x) => { return x ^ 2; }, dx = 2, sx = 0, ex = W) {
        super(x, y, W, H);
        this.fx = fx;
        this.dx = dx;
        this.sx = sx;
        this.ex = ex;
    }
    setBounds(sx = this.sx, ex = this.ex) {
        this.sx = sx;
        this.ex = ex;
        return this;
    }
    drawEveryTime(det = true) {
        this.drawEvrytime = det;
        return this;
    }
    setMaxDis(md) {
        this.maxdis = md;
        return this;
    }
    setOff(x = this.offx, y = this.offy) {
        this.offx = x;
        this.offy = y;
        return this;
    }
    setMaxDrawBounds(minpx, maxpx = this.maxPX) {
        this.minPX = minpx;
        this.maxPX = maxpx;
        return this;
    }
    setEqMaxBounds() {
        this.minPX = this.sx;
        this.maxPX = this.ex;
        return this;
    }
    setOnAxis(axis) {
        return this.setOff(axis.x, axis.y);
    }
    setScale(x = this.scalex, y = this.scaley) {
        this.scalex = x;
        this.scaley = y;
        return this;
    }
    setWidth(txtW) {
        this.txtW = txtW;
        return this;
    }
    setColor(color) {
        this.color = color;
        return this;
    }
    setDrawTime(drawt) {
        this.drawtime = drawt;
        return this;
    }
    tick(dt) {
        if (this.todraw)
            return;
        this.drawingtime += dt ?? 0;
        if (this.drawingtime >= this.drawtime) {
            this.todraw = true;
        }
        this?.extratick?.(dt);
    }
    extraDetect() {
        return true;
    }
    draw(ctx) {
        if (!this.drawEvrytime && !this.todraw && this.drawtime <= 0)
            return;
        this.todraw = false;
        let lasty = { x: this.sx, y: this.eval(this.sx) };
        this.onStart?.(lasty, ctx);
        let w = this.txtW ?? 5;
        ctx.lineWidth = w;
        ctx.strokeStyle = this.color ?? "black";
        let offx = 0, offy = 0;
        ctx.beginPath();
        let p = { x: (this.sx), y: this.eval(this.sx) };
        let laspp = p;
        let toMove = false;
        ctx.moveTo((p?.x ?? 0) * this.scalex + this.offx, (p?.y ?? 0) * this.scaley + this.offy);
        for (let index = this.sx / this.scalex; index <= (this.ex) / this.scalex + this.dx; index += this.dx) {
            p = { x: (index), y: this.eval(index) };
            let px = p?.x ?? 0 + offx, py = p?.y ?? 0 + offy;
            if (px < -w * 2 + this.minPX)
                px = 0 - w * 2;
            if (px > W + this.maxPX)
                px = W + w * 2;
            if (ctx.isParseInt) {
                px = parseInt(px);
                py = parseInt(py);
            }
            let dx = px - laspp.x, dy = py - laspp.y;
            if ((Math.hypot(dx, dy) > this.maxdis && this.maxdis > 0) || !this?.extraDetect?.(dx, dy)) {
                if (!toMove) {
                    ctx.lineTo(px * this.scalex + this.offx, py * this.scaley + this.offy);
                    ctx.stroke();
                    ctx.closePath();
                }
                if (index + this.dx <= this.ex) {
                    toMove = true;
                }
            }
            else {
                if (toMove) {
                    toMove = false;
                    ctx.beginPath();
                    ctx.moveTo(px * this.scalex + this.offx, py * this.scaley + this.offy);
                }
                else {
                    ctx.lineTo(px * this.scalex + this.offx, py * this.scaley + this.offy);
                }
            }
            laspp = p;
        }
        if (!toMove)
            ctx.stroke();
        this.lasty = lasty;
        this.onEnd?.(lasty, ctx);
    }
    eval(x) {
        return -this.fx((x - this.x) * this.scalex, this.scalex, this.scaley) - this.y;
    }
    onEnd(lasty, ctx) {
    }
    onStart(lasty, ctx) {
    }
    static fromSet(arr = (new Array(100).fill(0)).map(a => Math.random() * 100)) {
        return new Funcion(0, 0, (x) => {
            return arr[x] || 1;
        }, 1, 0, arr.length);
    }
}
export class ArrayFuncion extends Funcion {
    saveSX = 0;
    saveEX = -1;
    storage = new Float32Array(0);
    eval(x) {
        if (this.saveSX < x && x < this.saveEX && this.storage[x - this.saveSX] !== undefined)
            return this.storage[x - this.saveSX];
        let val = -this.fx((x - this.x) * this.scalex, this.scalex, this.scaley) - this.y;
        if (this.saveSX < x && x < this.saveEX && this.storage[x - this.saveSX] === undefined) {
            this.storage[x - this.saveSX] = val;
        }
        return val;
    }
    setStorage(sx = this.sx, ex = this.ex) {
        let lastStorage = this.saveEX - this.saveSX;
        this.saveSX = sx;
        this.saveEX = ex;
        if (ex - sx > lastStorage) {
            let newSt = new Float32Array(ex - sx);
            newSt.set(this.storage, 0);
            this.storage = newSt;
        }
        return this;
    }
}
export class Funcion2D extends Funcion {
    nextToMove = false;
    lineBreak(is = true) {
        this.nextToMove = is;
    }
    constructor(x = 0, y = 0, fx = (x) => { return new Vector2D(Math.cos(x), Math.sin(x)).scalar(20); }, dx = 2, sx = 0, ex = W) {
        super(x, y, fx, dx, sx, ex);
    }
    draw(ctx) {
        if (!this.drawEvrytime && !this.todraw && this.drawtime > 0)
            return;
        this.todraw = false;
        let w = this.txtW ?? 5;
        ctx.lineWidth = ~~(w);
        ctx.strokeStyle = this.color ?? "black";
        let offx = 0, offy = 0;
        ctx.beginPath();
        let p = this.eval(this.sx);
        let lasty = { lambda: this.sx, y: p.y, x: p.x };
        let laspp = p;
        let laspp2 = laspp;
        let tp = this.#ensure_on_View(p.x, p.y, laspp.x, laspp.y);
        p.x = tp.x;
        p.y = tp.y;
        let toMove = false;
        ctx.moveTo((p?.x ?? p?.[0] ?? 0) + this.offx, (p?.y ?? p?.[1] ?? 0) + this.offy);
        for (let index = this.sx; index <= this.ex; index += this.dx) {
            p = this.eval(index);
            let px = p?.x ?? p?.[0] ?? 0 + offx, py = p?.y ?? p?.[1] ?? 0 + offy;
            laspp2 = { x: px, y: py };
            tp = this.#ensure_on_View(px, py, laspp.x + offx, laspp.y + offy);
            p.x = tp.x - offx;
            p.y = tp.y - offy;
            px = tp.x;
            py = tp.y;
            if (ctx.isParseInt) {
                px = parseInt(px);
                py = parseInt(py);
            }
            let dx = px - laspp.x, dy = py - laspp.y;
            if (this.nextToMove || p.lineBreak) {
                this.nextToMove = false;
                toMove = true;
                ctx.stroke();
            }
            let are_p_lastp_outside = (((laspp.x + this.offx < 0) || (laspp.x + this.offx > W) || (laspp.y + this.offy < 0) || (laspp.y + this.offy) > H) &&
                ((p.x + this.offx < 0) || (p.x + this.offx > W) || (p.y + this.offy < 0) || (p.y + this.offy) > H));
            if ((Math.hypot(dx, dy) > this.maxdis && this.maxdis > 0) || !this?.extraDetect?.(dx, dy)) {
                if (!toMove) {
                    if (!are_p_lastp_outside) {
                    }
                }
                if (are_p_lastp_outside) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(px + this.offx, py + this.offy);
                }
                if (index + this.dx <= this.ex) {
                    toMove = true;
                }
            }
            else {
                if (toMove) {
                    toMove = false;
                    ctx.beginPath();
                    ctx.moveTo(px + this.offx, py + this.offy);
                }
                else {
                    if (!are_p_lastp_outside)
                        ctx.lineTo(px + this.offx, py + this.offy);
                    else {
                        ctx.moveTo(px + this.offx, py + this.offy);
                    }
                }
            }
            laspp = laspp2;
        }
        if (!toMove) {
            ctx.stroke();
        }
        this.lasty = lasty;
    }
    noPos = false;
    fx2d(x) {
        return this.fx(x - this.x + (this.noPos ? this.x : 0), this.scalex, this.scaley);
    }
    eval(x) {
        let res = this.fx2d(x);
        res.x += this.x;
        res.y = -res.y + this.y;
        return res;
    }
    #ensure_on_View(px, py, lpx, lpy) {
        let p = { x: px, y: py };
        let lastp = { x: lpx, y: lpy };
        if (p == lastp)
            return p;
        let dx = p.x - lastp.x;
        let dy = p.y - lastp.y;
        let intersectX = p.x;
        let intersectY = p.y;
        if (p.x + this.offx < 0) {
            intersectX = 0 - this.offx;
            intersectY = lastp.y + dy * ((intersectX - lastp.x) / dx);
        }
        else if (p.x + this.offx > W) {
            intersectX = W - this.offx;
            intersectY = lastp.y + dy * ((intersectX - lastp.x) / dx);
        }
        if (p.y + this.offy < 0) {
            intersectY = 0 - this.offy;
            intersectX = lastp.x + dx * ((intersectY - lastp.y) / dy);
        }
        else if (p.y + this.offy > H) {
            intersectY = H - this.offy;
            intersectX = lastp.x + dx * ((intersectY - lastp.y) / dy);
        }
        let dirLength = Math.sqrt(dx * dx + dy * dy);
        let pushFactor = 2 / dirLength;
        p.x = Math.floor(intersectX + -dx * pushFactor);
        p.y = Math.floor(intersectY + -dy * pushFactor);
        return p;
    }
}
export class Axis extends GameObject {
    type;
    txtW;
    hideV = false;
    hideH = false;
    static globalAxis = new Axis(W / 2, H / 2);
    static get globalCenter() {
        return new Vector2D(this.globalAxis.x, this.globalAxis.y);
    }
    constructor(x, y) {
        super(x, y, W, H, "black");
        this.type = "axis";
        this.txtW = 5;
    }
    set(x = this.x, y = this.y) {
        this.x = x;
        this.y = y;
    }
    setColor(col) {
        this.color = col;
        return this;
    }
    hideVertical(hide = true) {
        this.hideV = hide;
        return this;
    }
    hideHorizontal(hide = true) {
        this.hideH = hide;
        return this;
    }
    setWidth(txtW) {
        this.txtW = txtW;
        return this;
    }
    draw(ctx) {
        if (!this.hideH)
            ctx.line(0, this.y, W * 2, this.y, this.txtW, this.color);
        if (!this.hideV)
            ctx.line(this.x, 0, this.x, H * 2, this.txtW, this.color);
    }
}
var axisCols = {
    map: ["black", "#954F00", "transparent", "transparent", "transparent"],
    nomap: ["white", "#239FC3", "#535353", "#1E1E1E", "#494949"]
};
export var addAxisCol = (name, arr) => {
    if (!name || !Array.isArray(arr))
        return;
    if (arr.length < 5) {
        arr.concat(new Array(5 - arr.length).fill("transparent"));
    }
    axisCols[name] = arr;
};
export var addMapStyle = addAxisCol;
export var mapstyle = "nomap";
export var axisprops = {
    four: false,
    two: false,
    one: false,
    onebasis: true,
    basis: 2,
    set: (ax) => {
        let axkeys = Object.keys(ax);
        for (let i = 0; i < axkeys.length; i++) {
            let key = axkeys[i];
            if (key == "set")
                continue;
            axisprops[key] = ax[key];
        }
    }
};
export var setMapStyle = (ms) => mapstyle = ms;
export class Axis2D extends GameObject {
    unitSize = 30;
    mat = Matrix2D.fromValues([[1, 0], [0, 1]]);
    arrow1;
    arrow2;
    listeners = [];
    axisprops = axisprops;
    sx = 20;
    sy = 20;
    constructor(center, mat, v2) {
        super(center.x, center.y, W, H);
        if (mat instanceof Matrix2D)
            this.mat = mat;
        else if (mat instanceof Vector2D) {
            if (!v2)
                v2 = new Vector2D(0, 1);
            this.mat = new Matrix2D(mat, v2);
        }
        this.arrow1 = new Arrow(center.x, center.y, this.mat.vecs[0].x, this.mat.vecs[0].y, this.getColor(0)).setUS(this.US).setLineW(5);
        this.arrow2 = new Arrow(center.x, center.y, this.mat.vecs[1].x, this.mat.vecs[1].y, this.getColor(1)).setUS(this.US).setLineW(5);
        this.v1.updated = () => { this.updatedV1(); };
        this.v2.updated = () => { this.updatedV2(); };
    }
    setUS(unitsize) {
        this.unitSize = unitsize;
        this.arrow1.setUS(unitsize);
        this.arrow2.setUS(unitsize);
        return this;
    }
    setAxisProps(axisprops) {
        this.axisprops = { ...axisprops };
        return this;
    }
    get center() {
        return new Vector2D(this.x, this.y);
    }
    set center(v) {
        this.x = v.x;
        this.y = v.y;
        this.arrow1.x = this.x;
        this.arrow1.y = this.y;
        this.arrow2.x = this.x;
        this.arrow2.y = this.y;
    }
    get v1() {
        return this.mat.vecs[0];
    }
    get v2() {
        return this.mat.vecs[1];
    }
    set v1(v1) {
        this.mat.vecs[0] = v1;
        this.arrow1.vx = v1.x;
        this.arrow1.vy = v1.y;
    }
    set v2(v2) {
        this.mat.vecs[1] = v2;
        this.arrow2.vx = v2.x;
        this.arrow2.vy = v2.y;
    }
    get a1() {
        return this.arrow1;
    }
    get a2() {
        return this.arrow2;
    }
    set a1(a1) {
        this.arrow1 = a1;
        this.v1.x = this.arrow1.vx;
        this.v1.y = this.arrow1.vy;
    }
    set a2(a2) {
        this.arrow2 = a2;
        this.v2.x = this.arrow2.vx;
        this.v2.y = this.arrow2.vy;
    }
    updatedV1() {
        if (!!this.v1) {
            this.arrow1.vx = this.v1.x;
            this.arrow1.vy = this.v1.y;
        }
        ;
        this.updateListeners?.();
    }
    updatedV2() {
        if (!!this.v2) {
            this.arrow2.vx = this.v2.x;
            this.arrow2.vy = this.v2.y;
        }
        this.updateListeners?.();
    }
    add(...arr) {
        this.listeners.push(...arr.filter(v => {
            if (v instanceof Arrow && (v.x !== this.x || v.y !== this.y)) {
                this.add(v.getpoint(this), v.getCenterFromAxis(this));
                return false;
            }
            return !!v;
        }).map(v => {
            if (v.originalAxisX === undefined && v.originalAxisY === undefined) {
                let originalcoords = this.getCoords(v);
                v.originalAxisX = originalcoords.x;
                v.originalAxisY = originalcoords.y;
                return [v, () => ({ x: v.originalAxisX, y: v.originalAxisY })];
            }
            else {
                return [v, this.getCoords(v)];
            }
        }));
    }
    getCoords(v) {
        if (v instanceof Arrow)
            return { x: v.vx, y: v.vy };
        return { x: v.x, y: v.y };
    }
    setCoords(v, { x, y }) {
        if (v instanceof Arrow) {
            v.vx = x;
            v.vy = y;
            v.setUS(this.US);
            return;
        }
        v.x = x;
        v.y = y;
    }
    remove(v) {
        let i = this.listeners.map(v => v?.[0]).indexOf(v);
        if (i !== -1) {
            this.listeners.splice(i, 1);
        }
    }
    updateListeners() {
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i][0];
            const originalPosFunc = this.listeners[i][1];
            let originalPos;
            if (typeof originalPosFunc == "function") {
                originalPos = originalPosFunc();
            }
            else
                originalPos = originalPosFunc;
            let newCoords = this.applyVector(new Vector2D(originalPos.x, originalPos.y));
            this.setCoords(listener, newCoords);
        }
    }
    getColor(i) {
        return i < 0.5 ? "green" : "red";
    }
    draw(ctx) {
        let c1 = this.v1.x;
        let c2 = this.v2.x;
        let s1 = -this.v1.y;
        let s2 = -this.v2.y;
        let l1 = this.sx;
        let l2 = this.sy;
        if (this.axisprops.four && axisCols[mapstyle][3] !== "transparent") {
            if (this.axisprops.basis <= 4) {
                c1 = 1;
                c2 = 0;
                s1 = -0;
                s2 = -1;
            }
            for (let i = -l1 * 4; i < l1 * 4 + 1; i++) {
                ctx.line(this.center.x + i / 4 * (c2 * this.US) - c1 * this.US * 20, this.center.y + i / 4 * (s2 * this.US) - s1 * this.US * 20, this.center.x + i / 4 * (c2 * this.US) + c1 * this.US * 20, this.center.y + i / 4 * (s2 * this.US) + s1 * this.US * 20, 1, axisCols[mapstyle][3]);
            }
            for (let i = -l2 * 4; i < l2 * 4 + 1; i++) {
                ctx.line(this.center.x + i / 4 * (c1 * this.US) - c2 * this.US * 20, this.center.y + i / 4 * (s1 * this.US) - s2 * this.US * 20, this.center.x + i / 4 * (c1 * this.US) + c2 * this.US * 20, this.center.y + i / 4 * (s1 * this.US) + s2 * this.US * 20, 1, axisCols[mapstyle][3]);
            }
        }
        if (this.axisprops.two && axisCols[mapstyle][2] !== "transparent") {
            if (this.axisprops.basis <= 2) {
                c1 = 1;
                c2 = 0;
                s1 = -0;
                s2 = -1;
            }
            for (let i = -l1 * 2; i < l1 * 2 + 1; i++) {
                ctx.line(this.center.x + i / 2 * (c2 * this.US) - c1 * this.US * 20, this.center.y + i / 2 * (s2 * this.US) - s1 * this.US * 20, this.center.x + i / 2 * (c2 * this.US) + c1 * this.US * 20, this.center.y + i / 2 * (s2 * this.US) + s1 * this.US * 20, 1, axisCols[mapstyle][2]);
            }
            for (let i = -l2 * 2; i < l2 * 2 + 1; i++) {
                ctx.line(this.center.x + i / 2 * (c1 * this.US) - c2 * this.US * 20, this.center.y + i / 2 * (s1 * this.US) - s2 * this.US * 20, this.center.x + i / 2 * (c1 * this.US) + c2 * this.US * 20, this.center.y + i / 2 * (s1 * this.US) + s2 * this.US * 20, 1, axisCols[mapstyle][2]);
            }
        }
        if (this.axisprops.one && axisCols[mapstyle][4] !== "transparent") {
            c1 = 1;
            c2 = 0;
            s1 = -0;
            s2 = -1;
            for (let i = -l1; i < l1 + 1; i++) {
                ctx.line(this.center.x + i * (c2 * this.US) - c1 * this.US * 20, this.center.y + i * (s2 * this.US) - s1 * this.US * 20, this.center.x + i * (c2 * this.US) + c1 * this.US * 20, this.center.y + i * (s2 * this.US) + s1 * this.US * 20, 2, axisCols[mapstyle][4]);
            }
            for (let i = -l2; i < l2 + 1; i++) {
                ctx.line(this.center.x + i * (c1 * this.US) - c2 * this.US * 20, this.center.y + i * (s1 * this.US) - s2 * this.US * 20, this.center.x + i * (c1 * this.US) + c2 * this.US * 20, this.center.y + i * (s1 * this.US) + s2 * this.US * 20, 2, axisCols[mapstyle][4]);
            }
        }
        if (this.axisprops.onebasis && axisCols[mapstyle][1] !== "transparent") {
            c1 = this.v1.x;
            c2 = this.v2.x;
            s1 = -this.v1.y;
            s2 = -this.v2.y;
            for (let i = -l1; i < l1 + 1; i++) {
                ctx.line(this.center.x + i * (c2 * this.US) - c1 * this.US * 20, this.center.y + i * (s2 * this.US) - s1 * this.US * 20, this.center.x + i * (c2 * this.US) + c1 * this.US * 20, this.center.y + i * (s2 * this.US) + s1 * this.US * 20, !i ? 2 : 2, (i === 0) ? (axisCols[mapstyle][0]) : (axisCols[mapstyle][1]));
            }
            for (let i = -l2; i < l2 + 1; i++) {
                ctx.line(this.center.x + i * (c1 * this.US) - c2 * this.US * 20, this.center.y + i * (s1 * this.US) - s2 * this.US * 20, this.center.x + i * (c1 * this.US) + c2 * this.US * 20, this.center.y + i * (s1 * this.US) + s2 * this.US * 20, !i ? 2 : 2, (i === 0) ? (axisCols[mapstyle][0]) : (axisCols[mapstyle][1]));
            }
        }
    }
    get US() {
        return this.unitSize;
    }
    applyMatrix(mat) {
        this.mat = this.mat.mult(mat);
    }
    applyVector(vec) {
        return this.mat.multVector(vec);
    }
}
var defcols = ["#7EB663", "#FF7051", "blue", "magenta", "yellow"];
export class MatrixObject extends GameObject {
    arr;
    colors;
    linew;
    defcols;
    brtype;
    constructor(arr, x = W / 4 * 3, y = H / 4, w = 50, h = 50) {
        super(x, y, w, h);
        this.arr = arr;
        this.colors = true;
        this.linew = 4;
        this.color = "white";
        this.defcols = defcols;
        this.brtype = 0;
    }
    draw(ctx) {
        ctx.lineWidth = this.linew;
        let wSc = 1, offy = 0;
        if (this.arr.length === 1) {
            wSc = 0.5;
            offy = this.h * 1.85;
        }
        ctx.circle(this.x - this.w * 0.8, this.y, this.w / 4, this.h * wSc, this.color, 0, -Math.PI / 2 * 1.22, Math.PI / 2 * 1.22, true, false);
        ctx.circle(this.x + this.w * 0.8, this.y, this.w / 4, this.h * wSc, this.color, 0, Math.PI / 2 * 0.78, -Math.PI / 2 * 0.78, true, false);
        let ws = this.arr.length;
        for (let i = 0; i < this.arr.length; i++) {
            let hs = (this.arr?.[i]?.length) || 0;
            for (let j = 0; j < this.arr[i].length; j++) {
                ctx.txt(((this.arr?.[i]?.[j]) || "0"), this.x + this.w / 7 - this.w * (1.6 / hs) * Math.floor(-j + 1.5), this.y - this.h * (1.6 / ws) * Math.floor(-i + 1.5) + offy, this.getColor(i, j, ws, hs), "40px Arial");
            }
        }
    }
    getColor(i, j, ws, hs) {
        return (this.colors ? (this.defcols[hs - j - 1]) : "white");
    }
    setDefCols(dfcs = ["white", "black"]) {
        this.defcols = dfcs;
        return this;
    }
    setColor(col, col2 = col) {
        this.color = col;
        if (!!col2)
            this.getColor = () => {
                return col2;
            };
        return this;
    }
    NoCols(cols = false) {
        this.colors = cols;
        return this;
    }
    dim() {
        return Math.min(this.arr.length, (this.arr?.[0]?.length ?? 10000));
    }
    multiply(mat) {
        if (mat.dim() === this.dim()) {
            let dim = mat.dim();
            let marr = mat.arr;
            let resultarr = new Array(mat.dim()).fill([]);
            for (let i = 0; i < dim; i++) {
                for (let j = 0; j < dim; j++) {
                    resultarr[i][j] = this.arr[i].reduce((pre, curr, k) => { return pre + curr * marr[k][j]; }, 0);
                }
            }
            return new Matrix2D(resultarr);
        }
        return this;
    }
    multiplyVec2D(vec) {
        return new Vector2D(this.arr[0][0] * vec.x + this.arr[1][0] * vec.y, this.arr[0][1] * vec.x + this.arr[1][1] * vec.y);
    }
    toVecs2D() {
        return [new Vector2D(this.arr[0][0], this.arr[0][1]), new Vector2D(this.arr[1][0], this.arr[1][1])];
    }
    static fromVecs2D(v1, v2) {
        return new Matrix2D(new Vector2D(v1.x, v1.y), new Vector2D(v2.x, v2.y));
    }
    toText(pre = "", end = "") {
        let wtxt = pre;
        for (let i = 0; i < this.arr.length; i++) {
            wtxt += "c";
        }
        let brs = ["(", ")"];
        switch (this.brtype) {
            case 1:
                brs = ["[", "]"];
                break;
            case 0:
            default:
                brs = ["(", ")"];
                break;
        }
        let txt = "\\left" + brs[0] + " \\begin{array}{" + wtxt + "} ";
        for (let i = 0; i < (this.arr?.[0]?.length) || 0; i++) {
            for (let j = 0; j < this.arr.length; j++) {
                txt += this.arr[j][i] + "";
                if (j !== this.arr.length - 1) {
                    txt += " & ";
                }
            }
            if (i !== this.arr?.[0].length - 1) {
                txt += " \\\\ ";
            }
        }
        txt += " \\end{array} \\right" + brs[1] + " " + end;
        return txt;
    }
    setBackets(brtype = 0) {
        this.brtype = brtype;
        return this;
    }
    toImage(w = 100, h = 100, r, g, b) {
        return MathJaxLoader.loadEq(this.toText(), { r, g, b }, { w, h });
    }
}
export class Arrow extends GameObject {
    pinned;
    drawW = 0;
    linew = 2;
    unitSize = 30;
    stroke = false;
    isPoint = false;
    isLine = false;
    constructor(x = Axis.globalCenter.x, y = Axis.globalCenter.y, vx, vy, color = "white") {
        super(x, y, vx, vy, color);
    }
    getUnitSize() {
        return this.unitSize;
    }
    setUS(unitsize) {
        this.unitSize = unitsize;
        return this;
    }
    get US() {
        return this.unitSize;
    }
    setLineW(lw) {
        this.linew = lw;
        return this;
    }
    fill(isFill = true) {
        this.stroke = !isFill;
    }
    drawAsPoint(isPoint = true, w = this.linew) {
        this.isPoint = isPoint;
        this.linew = w;
        return this;
    }
    drawAsLine(isLine = true, w = this.linew) {
        this.isLine = isLine;
        this.linew = w;
        return this;
    }
    draw(ctx) {
        if (this.dead)
            return;
        let x = this.vx, y = this.vy;
        let CENTER = new Vector2D(this.x, this.y);
        this.drawW = this.US * Math.hypot(x, y);
        let ang1 = Math.atan2(-y, x);
        let c1 = Math.cos(ang1);
        let s1 = Math.sin(ang1);
        let sepang = Math.PI / 24 * 2;
        let csep2 = Math.sin(-sepang + ang1 + Math.PI / 2);
        let ssep2 = Math.cos(-sepang + ang1 + Math.PI / 2);
        let csep = Math.sin(sepang + ang1);
        let ssep = Math.cos(sepang + ang1);
        let pc = CENTER;
        let pv = new Vector2D(CENTER.x + c1 * this.drawW, CENTER.y + s1 * this.drawW);
        if (this.isPoint) {
            ctx.circle(pv.x, pv.y, this.linew, this.linew, this.color);
            return;
        }
        let dx = pv.x - pc.x;
        let dy = pv.y - pc.y;
        let l = Math.hypot(dx, dy);
        ctx.line(pc.x, pc.y, pv.x - dx / l * this.linew, pv.y - dy / l * this.linew, this.linew, this.color);
        if (this.isLine)
            return;
        let pizq = new Vector2D(CENTER.x + c1 * this.drawW - ssep2 * this.US * 0.1 * this.linew / 3 - csep2 * this.US * 0.1 * this.linew / 3, CENTER.y + s1 * this.drawW - csep2 * this.US * 0.1 * this.linew / 3 + ssep2 * this.US * 0.1 * this.linew / 3);
        let pder = new Vector2D(CENTER.x + c1 * this.drawW - ssep * this.US * 0.1 * this.linew / 3 - csep * this.US * 0.1 * this.linew / 3, CENTER.y + s1 * this.drawW - csep * this.US * 0.1 * this.linew / 3 + ssep * this.US * 0.1 * this.linew / 3);
        let [pvx, pvy] = ctx.applyStack(...pv.vals);
        let [pizqx, pizqy] = ctx.applyStack(...pizq.vals);
        let [pderx, pdery] = ctx.applyStack(...pder.vals);
        ctx.moveTo(pizqx, pizqy);
        ctx.lineTo(pvx, pvy);
        ctx.lineTo(pderx, pdery);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        if (this.stroke)
            ctx.stroke();
        else
            ctx.fill();
    }
    asVector() {
        return new Vector2D(this.vx, this.vy);
    }
    get vector() {
        return this.asVector();
    }
    get vx() {
        return this.w;
    }
    get vy() {
        return this.h;
    }
    set vx(vx) {
        this.w = vx;
    }
    set vy(vy) {
        this.h = vy;
    }
    get center() {
        let c = new Vector2D(this.x, this.y);
        c.updated = () => {
            this.x = c.x;
            this.y = c.y;
        };
        return c;
    }
    getCenterFromAxis(axis) {
        let [x, y] = [axis.x, axis.y];
        let c = new Vector2D((this.x - x), -(this.y - y));
        c.updated = () => {
            this.x = c.x + x;
            this.y = -c.y + y;
        };
        return c;
    }
    getpoint(axis) {
        let [x, y] = [axis.x, axis.y];
        let p = new Vector2D(this.vx + (this.x - x) / this.US, this.vy + -(this.y - y) / this.US);
        p.updated = () => {
            this.vx = p.x + (-this.x + x) / this.US;
            this.vy = p.y + -(-this.y + y) / this.US;
        };
        return p;
    }
    get cx() {
        return this.x;
    }
    get cy() {
        return this.y;
    }
    set cx(cx) {
        this.x = cx;
    }
    set cy(cy) {
        this.y = cy;
    }
    setVector(v) {
        this.vx = v.x;
        this.vy = v.y;
        return this;
    }
    translateCenter(x, y) {
        if (x instanceof Vector2D) {
            y = x.y;
            x = x.x;
        }
        this.cx += x;
        this.cy += y;
        return this;
    }
    add(x, y = 0, color = this.color) {
        if (x instanceof Arrow) {
            y = x.cy / x.US - this.cy / this.US + x.vy;
            x = x.cx / x.US - this.cx / this.US + x.vx;
        }
        else if (x instanceof Vector2D) {
            y = this.cy / this.US + x.y;
            x = this.cx / this.US + x.x;
        }
        return new Arrow(x * this.US + this.cx, y * this.US + this.cy, this.vx, this.vy, color).setUS(this.US);
    }
    substract(x, y = 0, color = this.color) {
        if (x instanceof Arrow) {
            y = -x.cy / x.US - x.vy + this.vy + this.cy / this.US;
            x = -x.cx / x.US - x.vx + this.vx + this.cx / this.US;
        }
        else if (x instanceof Vector2D) {
            y = x.y - this.vy;
            x = x.x - this.vx;
        }
        return new Arrow(this.cx + this.vx * this.US, this.cy + this.vy * this.US, x, y, color).setUS(this.US);
    }
    set(arr, y = 0) {
        if (typeof arr == "number") {
            this.x = arr;
            this.y = y;
            return;
        }
        this.x = arr.x;
        this.y = arr.y;
        this.vx = arr.vx;
        this.vy = arr.vy;
        this.stroke = arr.stroke;
        this.pinned = arr.pinned;
        this.color = arr.color;
        this.drawW = arr.drawW;
        this.linew = arr.linew;
        this.unitSize = arr.US;
    }
    length() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    set _(v) {
        this.set(v);
    }
    get _() {
        return (v) => {
            this._ = v;
        };
    }
}
export class Ellipse extends Arrow {
    axisx;
    axisy;
    v1;
    v2;
    constructor(axisx, axisy, x, y, w, h, color = "orange", rot = 0) {
        super(x, y, w, h, color);
        this.axisx = axisx;
        this.axisy = axisy;
        this.rotation = rot;
        this.v1 = new Arrow(x, y, 1, 0, "transparent");
        this.v2 = new Arrow(x, y, 0, 1, "transparent");
    }
    setUS(unitsize) {
        super.setUS(unitsize);
        this.v1.setUS(unitsize);
        this.v2.setUS(unitsize);
        return this;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.axisx, this.axisy);
        ctx.transform(this.v1.vx, -this.v1.vy, this.v2.vx, -this.v2.vy, 0, 0);
        ctx.tmpoptions.stroking = true;
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.linew;
        ctx.ellipse(this.x * this.US, this.y * this.US, this.w * this.US / 2, this.h * this.US / 2, this.rotation, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    asVectors() {
        return [this.v1, this.v2];
    }
    get vectors() {
        return [this.v1, this.v2];
    }
}
export class Field extends ObjList {
    n;
    m;
    constructor(n, m) {
        super();
        this.n = n;
        this.m = m;
    }
}
export class Funcion3D extends Funcion2D {
    z = 0;
    lastz = 0;
    appply = true;
    FOV = 600;
    constructor(x = 0, y = 0, z = 0, fx = (x) => { return new Vector3D(x, 0, 0.1); }, dx = 2, sx = 0, ex = W) {
        super(x, y, fx, dx, sx, ex);
        this.z = z;
        this.appply = true;
    }
    extraDetect() {
        if (this.lastz <= 0) {
            return false;
        }
        return true;
    }
    setFov(fov = this.FOV) {
        this.FOV = fov;
        return this;
    }
    applyRots3d(pos, x, y, z) {
        return pos;
    }
    setApply(aprots3d, apoffrot) {
        if (aprots3d)
            this.applyRots3d = aprots3d;
        if (apoffrot)
            this.applyOffRot = apoffrot;
        return this;
    }
    applyOffRot(pos, x, y, z) {
        return pos;
    }
    eval(x) {
        let res = this.fx(x, this.scalex, this.scaley);
        res.z ??= 1;
        if (this.appply)
            res = this.applyRots3d?.(res, this.x, this.y, this.z) ?? res;
        res.y += this.y;
        res.x += this.x;
        res.z += (this.z ?? 0) + this.FOV;
        if (res.z === 0)
            res.z = 0.001;
        this.lastz = res.z;
        res.x *= this.FOV / Math.abs(res.z);
        res.y *= -this.FOV / Math.abs(res.z);
        return res;
    }
    noApply() {
        this.appply = false;
        return this;
    }
    setPos(x, y = 0, z = 0) {
        if (x !== undefined)
            if (typeof x == "number") {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            else if (x.x !== undefined && x.y !== undefined && x.z !== undefined) {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
            }
        return this;
    }
    static fromFunc(fx, dx, sx, ex, pos = Vector3D.Zero) {
        let fc3d = new Funcion3D(0, 0, 0, fx, dx, sx, ex).setPos(pos);
        return fc3d;
    }
}
const createGeometryGenerator = (list, extra = (a) => a) => {
    return (pos, axis) => {
        let fc3d = Funcion3D.fromFunc(...list, pos);
        pos.updated = () => { fc3d.setPos(pos); };
        if (axis)
            fc3d.setOnAxis(axis);
        if (extra && typeof extra == "function") {
            extra(fc3d);
        }
        return fc3d;
    };
};
export class GeometryLibrary3D {
    static axis3D(axisSize) {
        let arr = {
            list: [(t) => {
                    if (!t)
                        t = 0;
                    let axis = "x";
                    if (t > axisSize) {
                        axis = "y";
                    }
                    if (t > axisSize * 2) {
                        axis = "z";
                    }
                    t = t % axisSize;
                    switch (axis) {
                        case "x":
                            return new Vector3D(t, 0, 0);
                        case "y":
                            return new Vector3D(0, t, 0);
                        case "z":
                            return new Vector3D(0, 0, 0 - t);
                    }
                    return new Vector3D(0, 0, 0);
                }, 1, 0, axisSize * 3],
            create: () => undefined
        };
        arr.create = createGeometryGenerator(arr.list, (fc3d) => {
            fc3d.setColor("white").setWidth(2);
        });
        return arr;
    }
    static fxMesh3D(axisSize, fx = ((x, y) => 0), resolution = 10, color) {
        const zScale = 1 / 10;
        const intervalLength = axisSize / resolution;
        let arr = {
            list: [(t = 0) => {
                    let nInterval = Math.floor(t);
                    const isVertical = nInterval >= (resolution + 1) * (resolution + 1);
                    nInterval %= (resolution + 1) * (resolution + 1);
                    let y = Math.floor(nInterval / (resolution + 1));
                    let x = (nInterval % (resolution + 1));
                    if (isVertical) {
                        y = (nInterval % (resolution + 1));
                        x = Math.floor(nInterval / (resolution + 1));
                    }
                    x /= (resolution + 1);
                    y /= (resolution + 1);
                    let z = 0;
                    if (typeof fx == "function") {
                        z = fx(x, y);
                    }
                    else if (typeof fx.func == "function") {
                        z = fx.func(x, y);
                    }
                    let retVec = new Vector3D((x * (resolution + 1) * intervalLength) / 100 / 2, (z) * zScale, -(y * (resolution + 1) * intervalLength) / 100 / 2).scalar(axisSize);
                    if ((y == 0 && isVertical) || (x == 0 && !isVertical))
                        retVec.lineBreak = true;
                    if (color && typeof color == "function") {
                        retVec.color = color(retVec);
                    }
                    return retVec;
                }, 1, 0, (resolution + 1) * (resolution + 1) * 2 - 1],
            create: () => undefined
        };
        arr.create = createGeometryGenerator(arr.list, (fc3d) => {
            fc3d.setColor("white").setWidth(2);
        });
        return arr;
    }
}
export class Waiter {
    changers = [];
    current = undefined;
    currenti = 0;
    totali = 0;
    running = false;
    binderrunning = false;
    labels = new Map();
    handlers = [];
    binder;
    time = 0;
    add(...changers) {
        for (let i = 0; i < changers.length; i++) {
            if (Array.isArray(changers[i]))
                for (let j = 0; j < changers[i].length; j++) {
                    this.addSingle(changers[i][j]);
                }
            this.addSingle(changers[i]);
        }
        return this;
    }
    addSingle(changer) {
        this.changers.push(changer);
        if (changer?.added)
            changer?.added?.(this.changers.length - 1, this);
    }
    addHandler(...handlers) {
        for (let i = 0; i < handlers.length; i++) {
            if (Array.isArray(handlers[i]))
                for (let j = 0; j < handlers[i].length; j++) {
                    this.addSingleHandler(handlers[i][j]);
                }
            this.addSingleHandler(handlers[i]);
        }
        return this;
    }
    addSingleHandler(handler) {
        this.handlers.push(handler);
        if (handler?.added)
            handler?.added?.(this.handlers.length - 1, this);
    }
    next(dt) {
        if (!!this.current && this.current.done !== undefined)
            this.current.done = false;
        this.current = this.changers[++this.currenti];
        this.totali++;
        if (this.current === undefined) {
            this.currenti--;
            this.totali--;
        }
        this.time = 0;
        this.current?.change?.(dt, this.time, this.handlers);
        if (this.current !== undefined && this.binder) {
            this.binder.next(this);
        }
    }
    tick(dt) {
        if (this.running) {
            if (!this.current || this.currenti < 0) {
                this.next(dt);
            }
            if ((!this.binder) || this.binderrunning) {
                this.callChanger(this.current, dt);
                if (this.isDone(this.current))
                    this.next(dt);
            }
        }
        if (this.binderrunning)
            this.time += dt;
    }
    start() {
        this.running = true;
        this.binderrunning = true;
        this.current = undefined;
        this.currenti = -1;
    }
    stop() {
        this.running = false;
        this.binderrunning = true;
        this.current = undefined;
        this.currenti = -1;
    }
    logChain(split = 5) {
        let txts = [];
        for (let i = 0; i < this.changers.length; i++) {
            if (this.changers[i]?.name)
                txts.push(this.changers[i].name +
                    (this.isDone(this.changers[i]) ? " d" : "") +
                    ((i % split === 0) ? "\n" : ""));
        }
        console.log(txts.join(","));
    }
    isDone(changer) {
        if (!!changer && changer.done !== undefined)
            return changer.done;
        return true;
    }
    callChanger(changer, dt) {
        if (changer?.tick)
            return (changer.tick?.(dt, this.time, this.handlers), undefined);
        if (typeof changer == "function")
            return changer?.(dt, this);
    }
    label(label = "") {
        this.addSingle({
            added: (i) => {
                this.labels.set(label, i);
            }
        });
    }
    static label(label = "") {
        return {
            added: (i, waiter) => {
                waiter.labels.set(label, i);
            }
        };
    }
    goLabel(label) {
        this.add((dt, waiter) => {
            waiter.currenti = waiter.labels.get(label);
        });
    }
    setGoLabel(label) {
        this.currenti = this.labels.get(label);
    }
    static goLabel(label = "", w) {
        return (dt, waiter) => {
            (w ?? waiter).currenti = (w ?? waiter).labels.get(label);
        };
    }
    addEventListener(name, cb) {
        if (!Waiter.eventListeners[name])
            Waiter.eventListeners[name] = [];
        Waiter.eventListeners[name].push(cb);
    }
    waitEvent(name, cb, anytime = false) {
        if (!name)
            return;
        let received = false;
        let i = this.changers.length;
        this.addEventListener(name, (val) => {
            if (!anytime && this.currenti !== i) {
                return;
            }
            if (received && !anytime)
                return;
            received = true;
            cb?.(val);
        });
        let fx = {
            name: ("wait Event " + name),
            done: false,
            change: () => {
                fx.done = false;
                received = false;
            },
            tick: (dt, time) => {
                fx.done = received;
            }
        };
        this.add(fx);
    }
    static waitEvent(name, cb, anytime = false) {
        return {
            added: (i, waiter) => {
                waiter.waitEvent(name, cb, anytime);
            }
        };
    }
    emitEvent(name, val = "") {
        this.add({
            name: ("emit event " + name),
            change: () => {
                Waiter.emitEvent(name, val);
            }
        });
    }
    static getEmitEvent(name, val) {
        return {
            added: (i, waiter) => {
                waiter.emitEvent(name, val);
            }
        };
    }
    static eventListeners = [];
    static emitEvent = (name, val = "") => {
        let listeners = Waiter.eventListeners[name];
        if (listeners)
            for (let i = 0; i < listeners.length; i++) {
                listeners[i]?.(val);
            }
    };
}
export class WaiterBinder {
    type;
    waiters;
    waiter_runnings = [];
    static Normal = 0;
    static Index = 1;
    static Class = 2;
    static Name = 3;
    static TotalIndex = 4;
    last;
    constructor(type = 4, waiters = []) {
        this.type = type;
        this.waiters = waiters;
        if (!waiters)
            this.waiters = [];
        for (let i = 0; i < this.waiters.length; i++) {
            this.waiter_runnings[i] = false;
        }
    }
    bind(...waiters) {
        for (let i = 0; i < waiters.length; i++) {
            this.bindWaiter(waiters[i]);
        }
    }
    bindWaiter(waiter) {
        if (!(waiter instanceof Waiter))
            return;
        let i = this.waiters.indexOf(waiter);
        if (i === -1) {
            this.waiters.push(waiter);
            this.waiter_runnings[this.waiters.length - 1] = false;
            waiter.binder = this;
        }
    }
    unbind(waiter) {
        if (!waiter)
            return;
        let i = this.waiters.indexOf(waiter);
        waiter.binder = undefined;
        this.waiter_runnings[i] = true;
        this.waiters[i] = undefined;
    }
    calculateLast(i) {
        let waiter = this.waiters[i];
        switch (this.type) {
            case WaiterBinder.Index:
                this.last = waiter.currenti;
            case WaiterBinder.TotalIndex:
                this.last = waiter.totali;
                break;
            case WaiterBinder.Class:
                this.last = waiter.current;
                break;
            case WaiterBinder.Name:
                this.last = waiter.current?.name || "func";
                break;
            case WaiterBinder.Normal:
            default:
                this.last = true;
                break;
        }
        return this.last;
    }
    isAsLast(i) {
        let waiter = this.waiters[i];
        switch (this.type) {
            case WaiterBinder.Index:
                return waiter.currenti == this.last;
            case WaiterBinder.TotalIndex:
                if (waiter.totali >= this.last) {
                    this.last = waiter.totali;
                    for (let j = 0; j < this.waiters.length; j++) {
                        if (!this.waiters[j] || this.waiters[j].binder !== this) {
                            this.waiter_runnings[j] = true;
                            continue;
                        }
                        this.waiter_runnings[j] = this.waiters[j].totali >= this.last;
                        this.waiters[j].binderrunning = !this.waiter_runnings[j];
                    }
                }
                return waiter.totali >= this.last;
            case WaiterBinder.Class:
                return waiter.current.isPrototypeOf(this.last);
            case WaiterBinder.Name:
                return (waiter.current?.name || "func") == this.last;
            case WaiterBinder.Normal:
            default:
                return true;
        }
    }
    next(waiter) {
        let i = this.waiters.indexOf(waiter);
        if (i === -1)
            return;
        if (this.last === undefined) {
            this.calculateLast(i);
        }
        if (this.isAsLast(i)) {
            waiter.binderrunning = false;
            this.waiter_runnings[i] = true;
        }
        if (!this.waiter_runnings.includes(false)) {
            for (let j = 0; j < this.waiter_runnings.length; j++) {
                if (this.waiters[j] && this.waiters[j].binder == this) {
                    this.waiter_runnings[j] = false;
                    this.waiters[j].binderrunning = true;
                    this.last = undefined;
                }
            }
        }
    }
}
export class Changer {
    object;
    cb;
    name = "Change this name to describe action";
    done = false;
    startDone = false;
    constructor(object = null, cb = null) {
        this.object = object;
        this.cb = cb;
    }
    change(...args) { this.done = this.startDone; }
    get = () => this.object;
    then = () => { this?.cb?.(); };
    tick(dt, time) { }
    addToWaiter(waiter) {
        waiter.add(this);
        return this;
    }
}
export class KeyWaiter extends Changer {
    name = "Wait key";
    key;
    constructor(key = " ", cb) {
        super({}, cb);
        this.key = key.toLowerCase();
    }
    change(...args) {
        this.done = false;
    }
    tick(dt, time) {
        if (keypress[this.key])
            this.done = true;
    }
}
export class TimeWaiter extends Changer {
    name = "Wait time";
    maxtime;
    time = 0;
    constructor(time = 0, cb) {
        super({}, cb);
        this.maxtime = time;
    }
    change(...args) {
        this.done = false;
        this.time = 0;
    }
    tick(dt, time) {
        this.time += dt;
        if (this.time > this.maxtime)
            this.done = true;
    }
}
export class LogerW extends Changer {
    txt;
    name = "Wait time";
    constructor(txt = "", cb) {
        super({}, cb);
        this.txt = txt;
        this.done = true;
    }
    tick(...args) {
        this.done = true;
        if (typeof this.txt == "function")
            console.log(this.txt?.(...args));
        else
            console.log(this.txt);
    }
}
export class Easer {
    ease(t) { return t; }
    static Linear;
    static EaseIn;
    static EaseOut;
    static EaseInOut;
}
export class EaserConstant extends Easer {
    constant;
    constructor(constant = 0) {
        super();
        this.constant = constant;
    }
    ease = (t) => this.constant;
}
export class EaserLinear extends Easer {
    ease = (t) => t;
    static { Easer.Linear = new EaserLinear(); }
}
export class EaserIn extends Easer {
    a;
    constructor(a = 3) {
        super();
        this.a = a;
    }
    ease(t) {
        return Math.pow(t, this.a);
    }
    static { Easer.EaseIn = new EaserIn(); }
}
export class EaserOut extends Easer {
    a;
    constructor(a = 3) {
        super();
        this.a = a;
    }
    ease(t) {
        return 1 - Math.pow(1 - t, this.a);
    }
    static { Easer.EaseOut = new EaserOut(); }
}
export class EaserInOut extends Easer {
    a;
    b;
    constructor(a = 3, b = 3) {
        super();
        this.a = a;
        this.b = b;
    }
    ease(t) {
        if (t < 0.5) {
            return Math.pow(2 * t, this.a) / 2;
        }
        return 1 - Math.pow(2 * (1 - t), this.b) / 2;
    }
    static { Easer.EaseInOut = new EaserInOut(); }
}
export class PosChanger extends Changer {
    toPos;
    speed;
    name = "Pos Set";
    firstPos;
    minTime = 0;
    maxTime = 1;
    easer = Easer.Linear;
    constructor(obj, toPos = obj, speed = 1, cb) {
        super(obj, cb);
        this.toPos = toPos;
        this.speed = speed;
        if (!this.object?._) {
            this.object._ = ({ x, y }) => { this.object.x = x; this.object.y = y; };
        }
        this.firstPos = new Vector2D(obj.x, obj.y);
    }
    setEaser(ezer) {
        this.easer = ezer;
        return this;
    }
    change() {
        this.done = false;
        this.firstPos = new Vector2D(this.object.x, this.object.y);
    }
    ease(t) {
        if (!(this.easer instanceof Easer) && typeof this.easer == "function")
            return this.easer?.(t);
        return this.easer?.ease?.(t);
    }
    tick(dt, time) {
        if (this.done)
            return;
        let t = MathFs.clamp(time * this.speed, this.minTime, this.maxTime, 0, 1);
        t = this.ease(t);
        let opos = this.getObjPos(dt, time, this.firstPos, this.toPos, t);
        this.object.x = opos.x;
        this.object.y = opos.y;
        this.done = this.isDone(t);
    }
    getObjPos(dt, time, firstPos, toPos, t) {
        return MathFs.lerp2D(this.firstPos, this.toPos, t);
    }
    isDone(t, ...args) {
        return t >= 1;
    }
    setTimes(minTime = 0, maxTime = 1) {
        this.minTime = minTime;
        this.maxTime = maxTime;
        return this;
    }
}
export class PosChangerByRotation extends PosChanger {
    static Closest = 0;
    static ClockWise = -1;
    static CounterClockWise = 1;
    static CW = -1;
    static CCW = 1;
    direction = PosChangerByRotation.Closest;
    getObjPos(dt, time, firstPos, toPos, t) {
        let sr = Math.hypot(firstPos.x, firstPos.y);
        let fr = Math.hypot(toPos.x, toPos.y);
        let sangle = (Math.atan2(firstPos.y, firstPos.x) + Math.PI * 2) % (Math.PI * 2);
        let fangle = (Math.atan2(toPos.y, toPos.x) + Math.PI * 2) % (Math.PI * 2);
        let angleDiff = fangle - sangle;
        if (this.direction === 0) {
            if (Math.abs(angleDiff) > Math.PI) {
                angleDiff -= Math.sign(angleDiff) * Math.PI * 2;
            }
        }
        else if (this.direction < 0) {
            if (angleDiff > 0)
                angleDiff -= Math.PI * 2;
        }
        else {
            if (angleDiff < 0)
                angleDiff += Math.PI * 2;
        }
        let r = MathFs.lerp(sr, fr, t);
        let angle = sangle + MathFs.lerp(0, angleDiff, t);
        return Vector2D.fromRadiusAndAngle(r, angle);
    }
    setDirection(dir) {
        this.direction = dir;
        return this;
    }
}
export class NearPosChanger extends PosChanger {
    toPos;
    speed;
    name = "Near Pos Set";
    getDirection = (x, y, fx, fy) => {
        return { x: fx - x, y: fy - y };
    };
    constructor(obj, toPos = obj, speed = 100, cb) {
        super(obj, cb);
        this.toPos = toPos;
        this.speed = speed;
        this.easer = (distance) => this.speed;
    }
    tick(dt, time) {
        if (this.done)
            return;
        let distance = Math.hypot(this.toPos.x - this.object.x, this.toPos.y - this.object.y);
        let speed = this.ease(distance);
        let direction = this.getDirection(this.firstPos.x, this.firstPos.y, this.toPos.x, this.toPos.y);
        let l = Math.hypot(direction.x, direction.y);
        if (l) {
            this.object.x += direction.x / l * speed * dt;
            this.object.y += direction.y / l * speed * dt;
        }
        this.done = this.isDone(distance, dt, speed);
        if (this.done && distance !== 0) {
            this.object.x = this.toPos.x;
            this.object.y = this.toPos.y;
        }
    }
    isDone(distance, dt, speed = this.speed) {
        return distance < Math.abs(1.5 * speed * dt);
    }
}
export class Handler {
    objs;
    constructor(objs) {
        this.objs = objs;
    }
    get(dt, time) {
        return this.objs;
    }
    set(obj, i = 0) {
        if (Array.isArray(obj))
            this.objs = obj;
        else
            this.objs[i] = obj;
    }
}
export class ChangerArr extends Changer {
    changers;
    handle;
    important = -1;
    repeat = false;
    handlers = [];
    times = [];
    constructor(changers = [], handle, cb) {
        super({}, cb);
        this.changers = changers;
        this.handle = handle;
    }
    change(dt, time, handlers = [], ...args) {
        this.done = false;
        if (handlers.filter)
            handlers = handlers.filter(h => !!h && h?.get !== undefined);
        this.handlers = handlers;
        this.callChange(dt, time, handlers, ...args);
    }
    callChange(dt, time, handlers, ...args) {
        if (handlers) {
            for (let i = 0; i < handlers.length; i++) {
                const handler = handlers[i];
                args.unshift(...handler.get(dt, time));
            }
        }
        if (typeof this.handle == "function")
            this.handle?.(dt, time, handlers, this.changers);
        for (let i = 0; i < this.changers.length; i++) {
            if (typeof this.changers[i] === "function") {
                this.changers[i]?.(true, dt, this.getTime(i, time), handlers, ...args);
            }
            this.changers[i]?.change?.(dt, this.getTime(i, time), handlers, ...args);
        }
    }
    getTime(i, time) {
        return this.times[i] ?? time;
    }
    tick(dt, time, ...args) {
        for (let i = 0; i < this.changers.length; i++) {
            if (this.repeat) {
                this.times[i] ??= 0;
                this.times[i] += dt;
            }
            if (typeof this.changers[i] === "function") {
                this.changers[i]?.(false, dt, this.getTime(i, time));
            }
            else if (this.changers[i].done === false)
                this.changers[i]?.tick?.(dt, this.getTime(i, time));
            else if (this.repeat && !this.changers[this.important].done) {
                if (this.handlers) {
                    for (let i = 0; i < this.handlers.length; i++) {
                        const handler = this.handlers[i];
                        args.unshift(...handler.get(dt, this.getTime(i, time)));
                    }
                }
                this.changers[i].done = false;
                this.times[i] = 0;
                if (typeof this.handle == "function")
                    this.handle?.(dt, this.getTime(i, time), this.handlers, this.changers);
                this.changers[i]?.change?.(dt, this.getTime(i, time), this.handlers, ...args);
            }
        }
        this.done = this.isDone();
    }
    isDone() {
        for (let i = 0; i < this.changers.length; i++) {
            if (this.changers[i] && (typeof this.changers[i] !== "function") &&
                this.changers[i].done === false && !(this.changers[i] instanceof TickMeCB))
                return false;
        }
        return true;
    }
    untill(i, repeat = true) {
        if (i instanceof Changer)
            i = this.changers.indexOf(i);
        this.important = i;
        this.repeat = repeat;
        return this;
    }
}
export class TickMeCB extends Changer {
    fx;
    constructor(fx = () => { }) {
        super(undefined);
        this.fx = fx;
        this.done = false;
    }
    change() {
        this.done = false;
    }
    tick(...args) {
        this.fx(...args);
    }
}
export class MathFs {
    static clamp(v, a = 0, b = 1, a2, b2) {
        let val = Math.min(Math.max(v, a), b);
        if ((!a2 && a2 !== 0) || (!b2 && b2 !== 0))
            return val;
        return MathFs.lerp(a2, b2, val / (b - a));
    }
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    static lerp2D(a, b, t) {
        return new Vector2D(MathFs.lerp(a.x, b.x, t), MathFs.lerp(a.y, b.y, t));
    }
}
export class Selector {
    values;
    sel = 0;
    constructor(values) {
        this.values = values;
    }
    draw(ctx) {
        for (let i = 0; i < this.values.length; i++) {
            ctx.fillText(this.values[i], 0, 10 * i);
        }
    }
    set(i = this.sel) {
        this.sel = i;
        return this;
    }
    get() {
        return this.values[this.sel];
    }
}
