import { BindableTexture, GLMode, TextureUnitType, WebProgram } from "./webglMan.js";
import { Camera3D } from "../Game3D/Game3D.js";
import { Vector3D } from "../Matrix/Matrix.js";
export declare class MeshRenderingProgram extends WebProgram {
    valsTexUnit: TextureUnitType;
    w: number;
    h: number;
    dx: number;
    dy: number;
    totalSegments: number;
    constructor(gl: WebGL2RenderingContext, valsTexUnit?: TextureUnitType, w?: number, h?: number, dx?: number, dy?: number);
    loadProgram(vs?: string, fs?: string): Promise<this>;
    setSize(w?: number, h?: number): this;
    setOffset(x: any, y: any, z: any): this;
    setDXDY(dx: any, dy: any): this;
    setPerXPerY(px?: number, py?: number): this;
    setColorHueScale(scale?: number): this;
    setYScale(scale?: number): this;
    initUniforms(): this;
    draw(x?: number, y?: number, w?: number, h?: number, camera?: Camera3D, mode?: GLMode): void;
    createIdealTexture(texUnit?: TextureUnitType, data?: any | ((x: number, y: number) => number), w?: number, h?: number): BindableTexture;
    fillMeshTexture(texture2D: BindableTexture, data?: any | ((x: number, y: number) => number), w?: number, h?: number): void;
}
export type Plano = "XY" | "XZ" | "YZ";
export type ArrayPlano = Plano[];
export declare class AxisLinesProgram extends WebProgram {
    axisLengths: Vector3D;
    constructor(gl: WebGL2RenderingContext, axisLengths?: Vector3D);
    loadProgram(): Promise<this>;
    initUniforms(): void;
    setAxisLengths(x: any, y: any, z: any): this;
    draw(camera?: Camera3D): void;
}
export declare class AxisConesProgram extends WebProgram {
    arrowHeights: Vector3D;
    arrowRadii: Vector3D;
    axisLengths: Vector3D;
    constructor(gl: WebGL2RenderingContext, arrowHeights?: Vector3D, arrowRadii?: Vector3D, axisLengths?: Vector3D);
    loadProgram(): Promise<this>;
    initVAO(): import("./webglMan.js").VAO;
    initUniforms(): void;
    draw(camera?: Camera3D): void;
}
export declare class AxisGridProgram extends WebProgram {
    planes: ArrayPlano;
    axisLengths: Vector3D;
    vertexCount: number;
    divisions: number;
    cellSize: number;
    constructor(gl: WebGL2RenderingContext, planes?: ArrayPlano, axisLengths?: Vector3D, divisions?: number);
    loadProgram(): Promise<this>;
    initUniforms(axisLengths?: Vector3D): void;
    initVAO(): this;
    addGrid(plane: Plano, vertices: number[]): void;
    draw(camera?: Camera3D): void;
    setDivisions(divisions: number): this;
    setCellSize(size: number): this;
}
export declare class Axis3DGroup {
    private gl;
    axisLengths: Vector3D;
    drawArrows: boolean;
    arrowHeights: Vector3D;
    arrowRadii: Vector3D;
    planes: ArrayPlano;
    lines: AxisLinesProgram;
    cones?: AxisConesProgram;
    grid?: AxisGridProgram;
    constructor(gl: WebGL2RenderingContext, axisLengths?: Vector3D, drawArrows?: boolean, arrowHeights?: Vector3D, arrowRadii?: Vector3D, planes?: ArrayPlano);
    gridDivisions: number;
    initUniforms(): this;
    draw(camera?: Camera3D): void;
    setAxisLengths(x: number, y: number, z: number): this;
    setArrowParams(heights: Vector3D, radii: Vector3D): this;
    setPlanes(planes: ArrayPlano): this;
    setDivisions(divisions: number): AxisGridProgram | this;
    setCellSize(size: number): AxisGridProgram | this;
    includeInWebManList(): this;
    loadProgram(): Promise<this>;
    use(): this;
}
export declare class MeshFillerProgram extends WebProgram {
    valsTexUnit: string;
    w: number;
    h: number;
    private uniformsToUpdate;
    constructor(gl: WebGL2RenderingContext, valsTexUnit?: string, w?: number, h?: number, callBackString?: any, varsContext?: {});
    loadProgram(vs?: string, fs?: string): Promise<this>;
    tick(): this;
    generateProgram(callbackString: string, ...varsContexts: any[]): void;
    draw(): this;
}
