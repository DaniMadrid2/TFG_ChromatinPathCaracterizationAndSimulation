import { Vector2D, Vector3D } from "../Matrix/Matrix.js";
export declare class Triangle3D {
    v0: Vector3D;
    v1: Vector3D;
    v2: Vector3D;
    constructor(v0: Vector3D, v1: Vector3D, v2: Vector3D);
}
export declare class Triangle2D {
    v0: Vector2D;
    v1: Vector2D;
    v2: Vector2D;
    constructor(v0: Vector2D, v1: Vector2D, v2: Vector2D);
    barycentricCoords(p: Vector2D): [number, number, number];
    isPointInTriangle(p: Vector2D): boolean;
}
export type GPUSettings = {
    canvas?: HTMLCanvasElement | null;
    context?: WebGLRenderingContext | WebGL2RenderingContext | null;
    mode?: string;
    graphical?: boolean;
    argumentTypes?: any[];
    constantTypes?: any[];
    loopMaxIterations?: number;
    constants?: Record<string, any>;
    dynamicOutput?: boolean;
    dynamicArgument?: boolean;
    output?: [number, number] | [number, number, number];
    precision?: 'single' | 'half' | 'mixed';
    pipeline?: boolean;
    immutable?: boolean;
    optimizeFloatMemory?: boolean;
    fixIntegerDivisionAccuracy?: boolean;
    functions?: Function[];
    nativeFunctions?: object;
    injectedNative?: string;
    subKernels?: {
        name: string;
        source: string;
        property: string | number;
    }[];
    strictIntegers?: boolean;
    debug?: boolean;
};
export type GPUTextureType = 'NumberTexture' | 'ArrayTexture(4)';
export interface IGPUTextureSettings {
    texture: WebGLTexture;
    size: number[];
    dimensions: number[];
    output: number[];
    context: WebGLRenderingContext;
    kernel: GPUKernel;
    gpu?: GPU;
    type?: GPUTextureType;
}
export interface Texture {
    constructor(settings: IGPUTextureSettings): any;
    toArray(): TextureArrayOutput;
    clone(): Texture;
    delete(): void;
    clear(): void;
    kernel: GPUKernel;
}
export type TextureArrayOutput = number[] | number[][] | number[][][] | Float32Array | Float32Array[] | Float32Array[][] | [number, number][] | [number, number][][] | [number, number][][][] | [number, number, number][] | [number, number, number][][] | [number, number, number][][][] | [number, number, number, number][] | [number, number, number, number][][] | [number, number, number, number][][][];
export type KernelOutput = void | number | number[] | number[][] | number[][][] | Float32Array | Float32Array[] | Float32Array[][] | [number, number][] | [number, number, number][] | [number, number, number, number][] | [number, number][][] | [number, number, number][][] | [number, number, number, number][][] | [number, number][][][] | [number, number, number][][][] | [number, number, number, number][][][] | Texture;
export type OutputDimensions = [number] | [number, number] | [number, number, number] | Int32Array;
export type TextureDimensions = [number, number];
export interface Input {
    value: number[];
    size: number[];
    constructor(value: number[], size: OutputDimensions): any;
}
export type KernelVariable = boolean | number | Texture | Input | HTMLCanvasElement | OffscreenCanvas | HTMLVideoElement | HTMLImageElement | HTMLImageElement[] | ImageBitmap | ImageData | Float32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | KernelOutput;
export type GPUKernel = {
    run(...args: any[]): any;
    setOutput(out: number[]): GPUKernel;
    setPipeline(flag: boolean): GPUKernel;
    setGraphical(is: boolean): GPUKernel;
    canvas: HTMLCanvasElement;
} & ((...as: KernelVariable[]) => void);
export type GPUStatic = {
    disableValidation(): void;
    enableValidation(): void;
    isGPUSupported: boolean;
    isKernelMapSupported: boolean;
    isOffscreenCanvasSupported: boolean;
    isWebGLSupported: boolean;
    isWebGL2Supported: boolean;
    isHeadlessGLSupported: boolean;
    isCanvasSupported: boolean;
    isGPUHTMLImageArraySupported: boolean;
    isSinglePrecisionSupported: boolean;
    new (settings: GPUSettings): GPU;
};
export interface GPU {
    createKernel(source: string | Function, settings?: GPUSettings): GPUKernel;
    createKernelMap(source: string | Function, settings?: GPUSettings): GPUKernel;
    combineKernels(...kernels: GPUKernel[]): Function;
    setFunctions(functions: Function[]): GPU;
    setNativeFunctions(nativeFunctions: Record<string, {
        name: string;
        source: string;
    }>): GPU;
    addFunction(source: Function, settings?: GPUSettings): GPU;
    addNativeFunction(name: string, source: string, settings?: GPUSettings): GPU;
    injectNative(source: string): GPU;
    destroy(): Promise<void>;
    disableValidation(): any;
    enableValidation(): any;
    isGPUSupported(): any;
    isKernelMapSupported(): any;
    isOffscreenCanvasSupported(): any;
    isWebGLSupported(): any;
    isWebGL2Supported(): any;
    isHeadlessGLSupported(): any;
    isCanvasSupported(): any;
    isGPUHTMLImageArraySupported(): any;
    isSinglePrecisionSupported(): any;
}
export declare const GPU: GPUStatic;
export type ColorFunc = (r: number, g: number, b: number, a: number) => void;
export type GPUThis = {
    thread: {
        x: number;
        y: number;
        z: number;
    };
    signature: string;
    type: string;
    property: string;
    name: string;
    origin: string;
    color: ColorFunc;
};
export type GPUFunction = (this: GPUThis, ...args: any) => void;
