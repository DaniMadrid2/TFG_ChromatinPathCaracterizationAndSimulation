import { GameObject, ModernCtx, MCTX } from "../Game/Game.js";
import { Vector2D, Matrix2D, Vector, ObjList, Vector3D } from "../Matrix/Matrix.mjs";
export declare class Funcion extends GameObject {
    fx: (x: number, scalex: number, scaley: number) => number;
    offx: number;
    offy: number;
    scalex: number;
    scaley: number;
    minPX: number;
    maxPX: number;
    dx: number;
    sx: number;
    ex: number;
    drawtime: number;
    drawingtime: number;
    todraw: boolean;
    drawEvrytime: boolean;
    txtW: number;
    maxdis: number;
    lasty: {
        x: number;
        y: number;
    };
    constructor(x?: number, y?: number, fx?: (x: number, scalex: number, scaley: number) => number, dx?: number, sx?: number, ex?: number);
    setBounds(sx?: number, ex?: number): this;
    drawEveryTime(det?: boolean): this;
    setMaxDis(md: any): this;
    setOff(x?: number, y?: number): this;
    setMaxDrawBounds(minpx: any, maxpx?: number): this;
    setEqMaxBounds(): this;
    setOnAxis(axis: Axis | Vector2D): this;
    setScale(x?: number, y?: number): this;
    setWidth(txtW: any): this;
    setColor(color: any): this;
    setDrawTime(drawt: any): this;
    tick(dt: any): void;
    extraDetect(): boolean;
    draw(ctx: any): void;
    eval(x: any): number;
    onEnd(lasty: {
        x: number;
        y: number;
    }, ctx: ModernCtx | HTMLCanvasElement): void;
    onStart(lasty: {
        x: number;
        y: number;
    }, ctx: ModernCtx | HTMLCanvasElement): void;
    static fromSet(arr?: number[]): Funcion;
}
export declare class ArrayFuncion extends Funcion {
    saveSX: number;
    saveEX: number;
    storage: Float32Array;
    eval(x: any): number;
    setStorage(sx?: number, ex?: number): this;
}
export declare class Funcion2D extends Funcion {
    #private;
    nextToMove: boolean;
    lineBreak(is?: boolean): void;
    constructor(x?: number, y?: number, fx?: ((x: number, scalex?: number, scaley?: number) => Vector2D | {
        x: number;
        y: number;
    }), dx?: number, sx?: number, ex?: number);
    draw(ctx: any): void;
    noPos: boolean;
    fx2d(x: number): Vector2D;
    eval(x: number): number;
}
export declare class Axis extends GameObject {
    type: string;
    txtW: number;
    hideV: boolean;
    hideH: boolean;
    static globalAxis: Axis;
    static get globalCenter(): Vector2D;
    constructor(x: any, y: any);
    set(x?: number, y?: number): void;
    setColor(col: any): this;
    hideVertical(hide?: boolean): this;
    hideHorizontal(hide?: boolean): this;
    setWidth(txtW: any): this;
    draw(ctx: any): void;
}
export declare var addAxisCol: (name: any, arr: string[]) => void;
export declare var addMapStyle: (name: any, arr: string[]) => void;
export declare var mapstyle: string;
export declare var axisprops: {
    four: boolean;
    two: boolean;
    one: boolean;
    onebasis: boolean;
    basis: number;
    set: (ax: any) => void;
};
export declare var setMapStyle: (ms: string) => string;
export declare class Axis2D extends GameObject {
    unitSize: number;
    mat: Matrix2D;
    arrow1: Arrow;
    arrow2: Arrow;
    listeners: [(Arrow | Vector2D), Object & {
        x: number;
        y: number;
    }][];
    axisprops: {
        four: boolean;
        two: boolean;
        one: boolean;
        onebasis: boolean;
        basis: number;
        set: (ax: any) => void;
    };
    sx: number;
    sy: number;
    constructor(center: Vector2D, mat: Matrix2D | Vector2D, v2?: Vector2D);
    setUS(unitsize: number): this;
    setAxisProps(axisprops: any): this;
    get center(): Vector2D;
    set center(v: Vector2D);
    get v1(): Vector2D;
    get v2(): Vector2D;
    set v1(v1: Vector2D);
    set v2(v2: Vector2D);
    get a1(): Arrow;
    get a2(): Arrow;
    set a1(a1: Arrow);
    set a2(a2: Arrow);
    protected updatedV1(): void;
    protected updatedV2(): void;
    add(...arr: any[]): void;
    protected getCoords(v: Vector2D | Arrow): {
        x: number;
        y: number;
    };
    protected setCoords(v: Vector2D | Arrow, { x, y }: {
        x: any;
        y: any;
    }): void;
    remove(v: Vector2D | Arrow): void;
    updateListeners(): void;
    getColor(i: number): "red" | "green";
    draw(ctx: MCTX): void;
    get US(): number;
    applyMatrix(mat: Matrix2D): void;
    applyVector(vec: Vector2D): Vector;
}
export declare class MatrixObject extends GameObject {
    arr: any;
    colors: boolean;
    linew: number;
    defcols: string[];
    brtype: number;
    constructor(arr: any, x?: number, y?: number, w?: number, h?: number);
    draw(ctx: any): void;
    getColor(i: any, j: any, ws: any, hs: any): string;
    setDefCols(dfcs?: string[]): this;
    setColor(col: any, col2?: any): this;
    NoCols(cols?: boolean): this;
    dim(): number;
    multiply(mat: any): Matrix2D | this;
    multiplyVec2D(vec: any): Vector2D;
    toVecs2D(): Vector2D[];
    static fromVecs2D(v1: any, v2: any): Matrix2D;
    toText(pre?: string, end?: string): string;
    setBackets(brtype?: number): this;
    toImage(w: number, h: number, r: any, g: any, b: any): HTMLImageElement & {
        loaded: boolean;
    };
}
export declare class Arrow extends GameObject {
    pinned: any;
    drawW: number;
    linew: number;
    unitSize: number;
    stroke: boolean;
    isPoint: boolean;
    isLine: boolean;
    constructor(x: number, y: number, vx: any, vy: any, color?: string | CanvasGradient | CanvasPattern);
    getUnitSize(): number;
    setUS(unitsize: number): this;
    get US(): number;
    setLineW(lw: any): this;
    fill(isFill?: boolean): void;
    drawAsPoint(isPoint?: boolean, w?: number): this;
    drawAsLine(isLine?: boolean, w?: number): this;
    draw(ctx: ModernCtx & CanvasRenderingContext2D): void;
    asVector(): Vector2D;
    get vector(): Vector2D;
    get vx(): number;
    get vy(): number;
    set vx(vx: number);
    set vy(vy: number);
    get center(): Vector2D;
    getCenterFromAxis(axis: Axis2D | Vector2D): Vector2D;
    getpoint(axis: Axis2D | Vector2D): Vector2D;
    get cx(): number;
    get cy(): number;
    set cx(cx: number);
    set cy(cy: number);
    setVector(v: Vector2D | Vector): this;
    translateCenter(x: Vector2D | number, y: number): this;
    add(x: Arrow | Vector2D | number, y?: number, color?: string | CanvasGradient | CanvasPattern): Arrow;
    substract(x: Arrow | Vector2D | number, y?: number, color?: string | CanvasGradient | CanvasPattern): Arrow;
    set(arr: Arrow | number, y?: number): void;
    length(): number;
    set _(v: Arrow);
    get _(): ((v: Arrow) => void);
}
export declare class Ellipse extends Arrow {
    axisx: any;
    axisy: any;
    v1: Arrow;
    v2: Arrow;
    constructor(axisx: any, axisy: any, x: any, y: any, w: any, h: any, color?: string, rot?: number);
    setUS(unitsize: number): this;
    draw(ctx: MCTX): void;
    asVectors(): Arrow[];
    get vectors(): Arrow[];
}
export declare class Field extends ObjList<ObjList<Vector2D>> {
    n: number;
    m: number;
    constructor(n: number, m: number);
}
export declare class Funcion3D extends Funcion2D {
    z: number;
    lastz: number;
    protected appply: boolean;
    FOV: number;
    constructor(x?: number, y?: number, z?: number, fx?: ((t: any) => Vector3D), dx?: number, sx?: number, ex?: number);
    extraDetect(): boolean;
    setFov(fov?: number): this;
    applyRots3d(pos: any, x: any, y: any, z: any): any;
    setApply(aprots3d: any, apoffrot: any): this;
    applyOffRot(pos: any, x: any, y: any, z: any): any;
    eval(x: any): any;
    noApply(): this;
    setPos(x: Vector3D | number, y?: number, z?: number): this;
    static fromFunc(fx?: ((t: any) => Vector3D), dx?: number, sx?: number, ex?: number, pos?: Vector3D): Funcion3D;
}
export type GeometryFuncionParamsList = [
    ((t?: number, scalex?: number, scaley?: number) => Vector3D),
    dx?: number,
    sx?: number,
    ex?: number
];
export type GeometryFuncionParams = {
    list: GeometryFuncionParamsList;
} & {
    create: (pos: Vector3D, axis?: Axis) => Funcion3D;
};
export declare class GeometryLibrary3D {
    static axis3D(axisSize: any): GeometryFuncionParams;
    static fxMesh3D(axisSize: any, fx?: ((x: any, y: any) => number) | {
        func: ((x: any, y: any) => number);
    }, resolution?: number, color?: any): GeometryFuncionParams;
}
type toWait = Changer | Function | ((...args: any) => any | void) | Object;
export declare class Waiter {
    changers: toWait[];
    current: toWait;
    currenti: number;
    totali: number;
    running: boolean;
    binderrunning: boolean;
    labels: Map<string, number>;
    handlers: Handler<any, number>[];
    binder: WaiterBinder;
    private time;
    add(...changers: toWait[]): this;
    protected addSingle(changer: toWait): void;
    addHandler(...handlers: Handler<any, any>[]): this;
    protected addSingleHandler(handler: Handler<any, any>): void;
    next(dt: any): void;
    tick(dt: any): void;
    start(): void;
    stop(): void;
    logChain(split?: number): void;
    isDone(changer: toWait): any;
    callChanger(changer: toWait, dt: any): void;
    label(label?: string): void;
    static label(label?: string): {
        added: (i: any, waiter: any) => void;
    };
    goLabel(label: any): void;
    setGoLabel(label: any): void;
    static goLabel(label?: string, w?: any): (dt: any, waiter: Waiter) => void;
    addEventListener(name: any, cb: any): void;
    waitEvent(name: any, cb?: any, anytime?: boolean): void;
    static waitEvent(name: any, cb?: any, anytime?: boolean): {
        added: (i: any, waiter: any) => void;
    };
    emitEvent(name: any, val?: string): void;
    static getEmitEvent(name: any, val?: any): {
        added: (i: any, waiter: any) => void;
    };
    protected static eventListeners: any;
    static emitEvent: (name: any, val?: string) => void;
}
export declare class WaiterBinder {
    type: number;
    waiters: Waiter[];
    waiter_runnings: boolean[];
    static Normal: number;
    static Index: number;
    static Class: number;
    static Name: number;
    static TotalIndex: number;
    private last;
    constructor(type?: number, waiters?: Waiter[]);
    bind(...waiters: Waiter[]): void;
    bindWaiter(waiter: Waiter): void;
    unbind(waiter: Waiter): void;
    calculateLast(i: number): any;
    isAsLast(i: number): boolean;
    next(waiter: Waiter): void;
}
export declare abstract class Changer {
    object: any;
    cb: any;
    name: string;
    done: boolean;
    protected startDone: boolean;
    constructor(object?: any, cb?: any);
    change(...args: any): void;
    get: () => any;
    then: () => void;
    tick(dt: any, time: any): void;
    addToWaiter(waiter: Waiter): this;
}
export declare class KeyWaiter extends Changer {
    name: string;
    key: string;
    constructor(key?: string, cb?: any);
    change(...args: any): void;
    tick(dt: any, time: any): void;
}
export declare class TimeWaiter extends Changer {
    name: string;
    maxtime: number;
    time: number;
    constructor(time?: number, cb?: any);
    change(...args: any): void;
    tick(dt: any, time: any): void;
}
export declare class LogerW extends Changer {
    txt: string | Function | any;
    name: string;
    constructor(txt?: string | Function | any, cb?: any);
    tick(...args: any[]): void;
}
export declare abstract class Easer {
    ease(t: number): number;
    static Linear: EaserLinear;
    static EaseIn: EaserIn;
    static EaseOut: EaserOut;
    static EaseInOut: EaserInOut;
}
export declare class EaserConstant extends Easer {
    constant: number;
    constructor(constant?: number);
    ease: (t: number) => number;
}
export declare class EaserLinear extends Easer {
    ease: (t: number) => number;
}
export declare class EaserIn extends Easer {
    a: number;
    constructor(a?: number);
    ease(t: number): number;
}
export declare class EaserOut extends Easer {
    a: number;
    constructor(a?: number);
    ease(t: number): number;
}
export declare class EaserInOut extends Easer {
    a: number;
    b: number;
    constructor(a?: number, b?: number);
    ease(t: number): number;
}
export declare class PosChanger extends Changer {
    toPos: Object & {
        x: number;
        y: number;
    };
    speed: number;
    name: string;
    firstPos: Vector2D;
    minTime: number;
    maxTime: number;
    easer: Easer | Function;
    constructor(obj: Object & {
        x: number;
        y: number;
    }, toPos?: Object & {
        x: number;
        y: number;
    }, speed?: number, cb?: any);
    setEaser(ezer: Easer): this;
    change(): void;
    ease(t: any): any;
    tick(dt: any, time: any): void;
    getObjPos(dt: any, time: any, firstPos: Object & {
        x: number;
        y: number;
    }, toPos: Object & {
        x: number;
        y: number;
    }, t: number): Vector2D;
    isDone(t: number, ...args: any[]): boolean;
    setTimes(minTime?: number, maxTime?: number): this;
}
export declare class PosChangerByRotation extends PosChanger {
    static Closest: number;
    static ClockWise: number;
    static CounterClockWise: number;
    static CW: number;
    static CCW: number;
    direction: number;
    getObjPos(dt: any, time: any, firstPos: Object & {
        x: number;
        y: number;
    }, toPos: Object & {
        x: number;
        y: number;
    }, t: number): Vector2D;
    setDirection(dir: number): this;
}
export declare class NearPosChanger extends PosChanger {
    toPos: Object & {
        x: number;
        y: number;
    };
    speed: number;
    name: string;
    getDirection: (x: any, y: any, fx: any, fy: any) => {
        x: number;
        y: number;
    };
    constructor(obj: Object & {
        x: number;
        y: number;
    }, toPos?: Object & {
        x: number;
        y: number;
    }, speed?: number, cb?: any);
    tick(dt: any, time: any): void;
    isDone(distance: number, dt: number, speed?: number): boolean;
}
type Grow<T, A extends Array<T>> = ((x: T, ...xs: A) => void) extends ((...a: infer X) => void) ? X : never;
type GrowToSize<T, A extends Array<T>, N extends number> = {
    0: A;
    1: GrowToSize<T, Grow<T, A>, N>;
}[A['length'] extends N ? 0 : 1];
export type FixedArray<T, N extends number> = GrowToSize<T, [], N>;
export declare class Handler<T, L extends number> {
    objs: T[];
    constructor(objs: T[]);
    get(dt?: any, time?: any): FixedArray<T, L>;
    set(obj: T | T[], i?: number): void;
}
export declare class ChangerArr extends Changer {
    changers: Changer[];
    handle?: any;
    protected important: number;
    protected repeat: boolean;
    protected handlers: Handler<any, any>[];
    protected times: number[];
    constructor(changers?: Changer[], handle?: any, cb?: any);
    change(dt: any, time: any, handlers?: Handler<any, any>[], ...args: any[]): void;
    callChange(dt: any, time: any, handlers: any, ...args: any[]): void;
    getTime(i: number, time?: any): any;
    tick(dt: any, time: any, ...args: any[]): void;
    isDone(): boolean;
    untill(i: Changer | number, repeat?: boolean): this;
}
export declare class TickMeCB extends Changer {
    fx: Function;
    constructor(fx?: Function);
    change(): void;
    tick(...args: any[]): void;
}
export declare class MathFs {
    static clamp(v: number, a?: number, b?: number, a2?: any, b2?: any): any;
    static lerp(a: any, b: any, t: any): any;
    static lerp2D(a: Object & {
        x: number;
        y: number;
    }, b: Object & {
        x: number;
        y: number;
    }, t: any): Vector2D;
}
export declare class Selector {
    values: any[];
    sel: number;
    constructor(values: any[]);
    draw(ctx: MCTX): void;
    set(i?: number): this;
    get(): any;
}
export {};
