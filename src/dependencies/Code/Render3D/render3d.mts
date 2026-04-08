import { Vector2D, Vector3D, Quaternion } from "../Matrix/Matrix.js";

export class Triangle3D{
    constructor(public v0:Vector3D, public v1:Vector3D, public v2:Vector3D){
        
    }
}
export class Triangle2D{
    constructor(public v0:Vector2D, public v1:Vector2D, public v2:Vector2D){

    }
    barycentricCoords(p: Vector2D): [number, number, number] {
        const v0 = this.v1.substract(this.v0);
        const v1 = this.v2.substract(this.v0);
        const v2 = p.substract(this.v0);
    
        const d00 = v0.dot(v0);
        const d01 = v0.dot(v1);
        const d11 = v1.dot(v1);
        const d20 = v2.dot(v0);
        const d21 = v2.dot(v1);
    
        const denom = d00 * d11 - d01 * d01;
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1.0 - v - w;
    
        return [u, v, w];
    }
    isPointInTriangle(p: Vector2D): boolean {
        const [u, v, w] = this.barycentricCoords(p);
    
        // Verificar si las coordenadas baricéntricas están dentro del rango [0, 1] y suman 1
        return u >= 0 && v >= 0 && w >= 0 && (u + v + w) <= 1;
    }
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
    subKernels?: { name: string; source: string; property: string | number }[];
    strictIntegers?: boolean;
    debug?: boolean;
  };
  
  export type GPUTextureType
    = 'NumberTexture'
    | 'ArrayTexture(4)';
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
    constructor(settings: IGPUTextureSettings);
    toArray(): TextureArrayOutput;
    clone(): Texture;
    delete(): void;
    clear(): void;
    kernel: GPUKernel;
  }
  
  export type TextureArrayOutput
    = number[]
    | number[][]
    | number[][][]
  
    | Float32Array
    | Float32Array[]
    | Float32Array[][]
  
    | [number, number][]
    | [number, number][][]
    | [number, number][][][]
  
    | [number, number, number][]
    | [number, number, number][][]
    | [number, number, number][][][]
  
    | [number, number, number, number][]
    | [number, number, number, number][][]
    | [number, number, number, number][][][]
    ;
  export type KernelOutput = void
    | number
    | number[]
    | number[][]
    | number[][][]
  
    | Float32Array
    | Float32Array[]
    | Float32Array[][]
  
    | [number, number][]
    | [number, number, number][]
    | [number, number, number, number][]
  
    | [number, number][][]
    | [number, number, number][][]
    | [number, number, number, number][][]
  
    | [number, number][][][]
    | [number, number, number][][][]
    | [number, number, number, number][][][]
  
    | Texture;
  export type OutputDimensions = [number] | [number, number] | [number, number, number] | Int32Array;
  export type TextureDimensions = [number, number];
  
    
  export interface Input {
    value: number[];
    size: number[];
    constructor(value: number[], size: OutputDimensions);
  }
  export type KernelVariable =
    boolean
    | number
    | Texture
    | Input
    | HTMLCanvasElement
    | OffscreenCanvas
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLImageElement[]
    | ImageBitmap
    | ImageData
    | Float32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Uint8ClampedArray
    | KernelOutput;

  export type GPUKernel = {
    run(...args: any[]): any;
    setOutput(out:number[]): GPUKernel;
    setPipeline(flag: boolean): GPUKernel;
    setGraphical(is:boolean): GPUKernel;
    canvas:HTMLCanvasElement;

  }&((...as: KernelVariable[])=>void);
  
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
    setNativeFunctions(nativeFunctions: Record<string, { name: string; source: string }>): GPU;
    addFunction(source: Function, settings?: GPUSettings): GPU;
    addNativeFunction(name: string, source: string, settings?: GPUSettings): GPU;
    injectNative(source: string): GPU;
    destroy(): Promise<void>;
    disableValidation();
    enableValidation();
    isGPUSupported();
    isKernelMapSupported();
    isOffscreenCanvasSupported();
    isWebGLSupported();
    isWebGL2Supported();
    isHeadlessGLSupported();
    isCanvasSupported();
    isGPUHTMLImageArraySupported();
    isSinglePrecisionSupported();
    // Define aquí otras propiedades y métodos relevantes de la clase GPU
  };
  
export declare const GPU: GPUStatic;
export type ColorFunc = (r:number,g:number,b:number,a:number)=>void
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
    color:ColorFunc;
};
  
// const gpu: GPU = new GPU({mode:"gpu"});
export type GPUFunction = (this: GPUThis, ...args:any) => void;
