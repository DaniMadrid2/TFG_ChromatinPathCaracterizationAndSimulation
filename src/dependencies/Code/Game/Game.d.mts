import { Vector2D, Vector3D, MatrixStack2D, Matrix3D, Vector } from "../Matrix/Matrix.mjs";
export declare var H: number;
export declare var W: number;
export declare var resizeBounds: (w: any, h: any) => void;
interface CanvasCtxTuple {
    canvas: HTMLCanvasElement & ModernCanvas;
    ctx: CanvasRenderingContext2D;
    append: () => CanvasCtxTuple;
    center: (ops?: ModernCanvasOptions) => CanvasCtxTuple;
    modern: () => ModernCanvasCtxTuple;
}
interface ModernCanvasCtxTuple {
    canvas: HTMLCanvasElement & ModernCanvas;
    ctx: ModernCtx & CanvasRenderingContext2D;
    append: () => ModernCanvasCtxTuple;
    center: (ops?: ModernCanvasOptions) => ModernCanvasCtxTuple;
}
export declare function createCanvas(id?: string, w?: number, h?: number, sc?: Scene, contexttype?: string): CanvasCtxTuple;
export interface ModernCanvasOptions {
    absolute?: boolean;
    boundingBox?: {
        x?: number | (() => number);
        y?: number | (() => number);
        w?: any | (() => number);
        h?: any | (() => number);
    };
    slidePercentage?: number;
    autoResize?: boolean;
    maxRes?: boolean;
    preserveAspectRatio?: boolean;
    father?: HTMLElement | Window | null;
    contexttype?: string;
}
export interface ModernCanvas {
    resize: () => void;
    slidePercentage: number;
    setSlide: (slide: number) => void;
    ctx: ModernCtx & CanvasRenderingContext2D;
    openFullScreen: () => void;
    visible: boolean;
    recheckVisible: () => void;
    cantPause: boolean;
    running: boolean;
    boundingBox: {
        x: number | (() => number);
        y: number | (() => number);
        w: number | (() => number);
        h: number | (() => number);
    };
}
export declare function ModernCanvas(canvas: HTMLCanvasElement, options?: ModernCanvasOptions): HTMLCanvasElement & ModernCanvas;
type ModernCtxOptions = {
    noApplyStack?: boolean;
    stroking?: boolean;
    posStyle?: boolean;
};
export interface ModernCtx {
    canvas: HTMLCanvasElement & ModernCanvas;
}
export declare class ModernCtx {
    private ctx;
    layer: Layer;
    options: ModernCtxOptions;
    tmpoptions: ModernCtxOptions;
    private innerRotation;
    lastDrawnLayer: any;
    lastDrawnScene: any;
    constructor(ctx: CanvasRenderingContext2D, layer: Layer);
    setLastScene(sc: Scene): void;
    openFullScreen(ctx?: ModernCtx): void;
    setTmpOption(name: any, val?: boolean): this;
    getOption(name: any): any | boolean;
    applyStack(...coords: number[]): number[];
    applyRotation(angle: any, cx?: number, cy?: number): void;
    rect(x?: number, y?: number, w?: number, h?: number, color?: string | CanvasGradient | CanvasPattern): void;
    rRect: (x?: number, y?: number, w?: number, h?: number, color?: string | CanvasGradient | CanvasPattern, rot?: number) => void;
    rectTopLeft(x?: number, y?: number, w?: number, h?: number, color?: string | CanvasGradient | CanvasPattern): void;
    circle(x?: number, y?: number, w?: number, h?: number, color?: string | CanvasGradient | CanvasPattern, rot?: number, st?: number, et?: number, way?: boolean): void;
    line(x: number, y: number, x2: number, y2: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineVer(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineVerBot(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineVerTop(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineHor(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineHorLeft(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineHorRight(x: number, y: number, len: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    lineAngled(x: number, y: number, len: number, angle: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined): void;
    arrow(x1: number, y1: number, x2: number, y2: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined, sepAngCoeff?: number, sepSizeCoeff?: number): void;
    doubleArrow(x1: number, y1: number, x2: number, y2: number, lw?: number, color?: string | CanvasGradient | CanvasPattern | undefined, sepAngCoeff?: number, sepSizeCoeff?: number): void;
    polygon(x: number, y: number, polygon: Polygon, color?: string | CanvasGradient | CanvasPattern): void;
    img(img: any, x: number, y: number, w?: number, h?: number, imgsc?: number): void;
    imgSlice(img: any, x: any, y: any, w?: any, h?: any, imgsc?: number): void;
    image(img: any, x: number, y: number, w?: number, h?: number, imgsc?: number): void;
    rImg: (img: any, x: number, y: number, w?: number, h?: number, imgsc?: number, deg?: number, flipX?: boolean, flipY?: boolean) => void;
    cls(color?: string): void;
}
export type MCTX = ModernCtx & CanvasRenderingContext2D;
export declare class GameObject {
    w: number;
    h: number;
    color: string | CanvasGradient | CanvasPattern;
    pos: Vector2D;
    size: Vector2D;
    layer: number;
    rotation: number;
    dead: boolean;
    vel: Vector2D;
    polygon: Polygon;
    m: number;
    inertia: number;
    private added;
    shown: boolean;
    info: {
        changed: {
            position: boolean;
            size: boolean;
            velocity: boolean;
            any: boolean;
        };
        is_static: boolean;
    };
    constructor(x?: number, y?: number, w?: number, h?: number, color?: string | CanvasGradient | CanvasPattern);
    selfAdd(layer?: number, sc?: Scene): this;
    getPosition(sc?: Scene | MatrixStack2D): [number, number, number, number];
    get position(): [number, number, number, number] & {
        pos: [number, number];
        bounds: [number, number];
    };
    get poscolor(): [number, number, number, number, string | CanvasGradient | CanvasPattern];
    draw(ctx: ModernCtx): void;
    extratick(dt: any): void;
    tick(dt: any): void;
    get x(): number;
    get y(): number;
    set x(x: number);
    set y(y: number);
    get vx(): number;
    get vy(): number;
    set vx(x: number);
    set vy(y: number);
    getPol(): Polygon;
    get pol(): Polygon;
    set pol(pol: Polygon);
    get rot(): number;
    get mass(): number;
    set rot(rot: number);
    set mass(mass: number);
    get bounds(): {
        x: number;
        y: number;
    };
    set bounds({ x, y }: {
        x: number;
        y: number;
    });
    findNearObjects(x: number, y: number, radius: number, conditions?: Object, sc?: Scene): GameObject[];
    distanceTo(obj: GameObject | {
        x: number;
        y: number;
    }): number;
}
export declare class GameImage extends GameObject {
    img: HTMLImageElement;
    constructor(x: any, y: any, w: any, h: any, img: HTMLImageElement);
    draw(ctx: MCTX): void;
}
export declare class GameIOStats {
    static getProps(stats: Object | Function): string[];
    private static getPropsFromObject;
}
type PType = ({
    0: number;
    1: number;
}) | [number, number];
type LType = ({
    0: PType;
    1: PType;
}) | [PType, PType];
export declare class Polygon {
    vecs: ([number, number] & PType)[];
    lines: LType[];
    static CircleType: string;
    static EllipseType: string;
    static PolygonType: string;
    type: string;
    pos: PType;
    r: number;
    constructor(...vs: number[] | Vector[] | [number, number][] | number[][]);
    get w(): number;
    get h(): number;
    static createCirclePolygon(x: any, y: any, r: any): void;
}
export declare class GameCircleCollisionHandler {
    tick(dt: any, objs: any): void;
    nearPhase(obj1: GameObject, obj2: GameObject): boolean;
    handleCollision(obj1: GameObject, obj2: GameObject): void;
}
export declare class CollisionManager {
    protected offset: PType;
    protected offsetState: number;
    modifyVel: boolean;
    callObjects: boolean;
    dot(p1: PType, p2: PType): number;
    closestToLine(p: PType, { 0: a, 1: b }: LType): PType;
    collideLineToLine(l1: LType, l2: LType): boolean | PType;
    polygonToLine(pol: Polygon, l2: LType): true | 0 | {
        0: number;
        1: number;
    };
    polygonToPolygon(pol: Polygon, pol2: Polygon): PType | boolean;
    pointToPolygon(point: PType, polygon: Polygon): boolean;
    circleToPoint(circle: Polygon, p: PType): boolean;
    circleToLine(circle: Polygon, l2: LType): false | {
        0: number;
        1: number;
    };
    circleToPolygon(circle: Polygon, pol2: Polygon): PType;
    circleToCircle(cir1: Polygon, cir2: Polygon): PType | boolean;
    tick(dt: any, objs: any): void;
    nearPhase(obj1: GameObject, obj2: GameObject): boolean;
    handleCollision(obj1: GameObject, obj2: GameObject, dt: number): void;
}
export declare class ImgLoader {
    static enableCors: boolean;
    static load(url: any, w?: any, h?: any): HTMLImageElement & {
        loaded: boolean;
    };
    static loadSync(url: any, w?: any, h?: any): Promise<HTMLImageElement & {
        loaded: boolean;
    }>;
    static loadImage(url: any, w?: any, h?: any): HTMLImageElement & {
        loaded: boolean;
    };
    static loadImages(...url: any[]): (HTMLImageElement & {
        loaded: boolean;
    }[]);
    static loadDirImages(dir: any, ...url: any[]): (HTMLImageElement & {
        loaded: boolean;
    })[];
    static getPathArray(preffix?: string, values?: string[] | string | number | number[] | any | any[], suffix?: string): string[];
    static join(...imgs: any[]): HTMLImageElement & {
        loaded: boolean;
    };
    static applyFilter(img: any, r: number, g: number, b: number, w?: number, h?: number): void;
    static fromCanvasOrBitmap(source: HTMLCanvasElement | ImageBitmap, w?: number, h?: number): Promise<HTMLImageElement & {
        loaded: boolean;
    }>;
}
export declare class Camera2D extends GameObject {
    zoom: number;
    obj: any;
    zoomCenter: GameObject;
    constructor(x: any, y: any, w?: any, h?: any, zoom?: number);
    private lastTransformMatrix;
    private calculateTransformMatrix;
    get transformMatrix(): Matrix3D;
    follow(obj: GameObject): this;
    setZoomCenter(obj: GameObject): this;
}
export declare class ObjectManager<T> {
    objs: Array<T>;
    constructor(objs?: Array<T>);
    add(...objs: any): void;
    func(name: string, ...args: any): void;
    protected ManagerFilter: ((o: any, i: any, arr: any) => Boolean) | undefined;
    filterObjects(filter: (o: any) => Boolean): T[];
}
export declare class Layer extends ObjectManager<any | GameObject> {
    id: string;
    canvas: ModernCanvas & HTMLCanvasElement;
    scene: Scene;
    stack: MatrixStack2D;
    uuid: string;
    constructor(id: string, canvas: ModernCanvas & HTMLCanvasElement, scene?: Scene);
    preExtraTick: undefined | ((...args: any[]) => void);
    posExtraTick: undefined | ((...args: any[]) => void);
    preExtraDraw: undefined | ((ctx: MCTX, ...args: any[]) => void);
    posExtraDraw: undefined | ((ctx: MCTX, ...args: any[]) => void);
    getWidth(): number;
    getHeight(): number;
    draw(...args: any[]): void;
    tick(...args: any[]): void;
    killObjs(filterfc?: (obj: any) => boolean): void;
    findObjects(filter: (o: any) => Boolean, conditions?: Object): GameObject[];
}
export declare class Scene extends ObjectManager<Layer> {
    cam: Camera2D;
    static sc: Scene;
    stack: MatrixStack2D;
    uuid: string;
    constructor(objs?: any[], cam?: Camera2D);
    preExtraTick: undefined | ((...args: any[]) => void);
    posExtraTick: undefined | ((...args: any[]) => void);
    preExtraDraw: undefined | ((...args: any[]) => void);
    posExtraDraw: undefined | ((...args: any[]) => void);
    setMatrixStack(stack: MatrixStack2D): Scene;
    addLayer(lay: Layer): void;
    getLayer(n: number): Layer;
    getLastLayer(): Layer;
    getFirstLayer(): Layer;
    add(layer?: number | Layer | any, ...objs: any): this;
    draw(...args: any[]): void;
    tick(...args: any[]): void;
    setCamera2D(cam?: Camera2D): Scene;
    funcLayers(name: string, ...args: any): void;
    killObjs(filterfc?: (obj: any) => boolean): void;
    ManagerFilter: any;
    findObjects(filter: (o: any) => boolean, conditions?: Object): GameObject[];
}
export declare function createLayer(c?: ModernCtx & CanvasRenderingContext2D, sc?: Scene): ModernCanvasCtxTuple;
export declare class Scene3D extends Scene {
}
export declare function setVolume(vol: any): void;
export declare class AudioLoader {
    folder: string;
    constructor(folder: string);
    load(filename: any, vol?: number): HTMLAudioElement;
    static load(filename: any, vol?: number): HTMLAudioElement;
    static loadAudios(...url: any[]): HTMLAudioElement[];
    playAudio(audio: any, multi?: boolean): void;
    static playAudio(audio: any, multi?: boolean): void;
    static setVolume(vol: any): void;
    setVolume(vol: any): void;
}
export declare function playAudio(audio: any, multi?: boolean): void;
export declare var isAudioPermitted: () => boolean;
export declare var setAudioPermitted: (is?: boolean) => void;
export declare function queryAudioPermission(nav?: Navigator): void;
export declare function usePendantAudio(): void;
export declare function addPendantAudio(audio: any, multi?: boolean): void;
type KeypressTP = {
    a: boolean;
    w: boolean;
    s: boolean;
    d: boolean;
    up: boolean;
    down: boolean;
    right: boolean;
    left: boolean;
    ctrl: boolean;
    shift: boolean;
    space: boolean;
    q: boolean;
    e: boolean;
    t: boolean;
    g: boolean;
    r: boolean;
    f: boolean;
    i: boolean;
    o: boolean;
    h: boolean;
    y: boolean;
    p: boolean;
    m: boolean;
    n: boolean;
    b: boolean;
    v: boolean;
    c: boolean;
    x: boolean;
    z: boolean;
    u: boolean;
    l: boolean;
    j: boolean;
    Enter: boolean;
    Backspace: boolean;
    listen: () => void;
    Hor: () => number;
    Ver: () => number;
    Horizontal: () => number;
    Vertical: () => number;
    Depth: () => number;
    mv2D: (vel?: number) => Vector2D;
    mv3D: (vel?: number) => Vector3D;
    createSwitch: (k1: string, k2: string) => () => number;
};
export declare let keypress: KeypressTP;
export declare class KeyManager {
    static keypress: KeypressTP;
    static detectKeys: (keys?: KeypressTP) => void;
    static presscbs: any[];
    static presscb(e: any): void;
    static addEventOnPress(key: any, cb: any): void;
    static OnKey(key: any, cb: any): void;
    static OnPress(key: any, cb: any): void;
}
export declare class ListenerManager {
    static onClick(scene: any, sc: any, ...pars: any[]): void;
    static onWheel(scene: any, sc_funcLayers: any, ...pars: any[]): void;
}
export declare var mousepos: {
    x: number;
    y: number;
    lastid: string;
};
export declare var mouseposes: any[];
export declare var mouseclick: boolean[];
export declare function isFullScreen(): any;
export declare class ScreenManager {
    static isFullScreen(): any;
    static setFullScreen(canvas: any): void;
}
export declare class MouseManager {
    static EnableCanvas(canvas: HTMLCanvasElement): void;
    static createDoubleClickListenerGameObject(cid?: any): GameObject & {
        add: ((lis: Function) => void);
    };
}
export declare function openFullscreen(canv: any): void;
export {};
