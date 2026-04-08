import { Vector, Vector3D, Matrix4D } from "../Matrix/Matrix.mjs";
import { WebProgram } from "../WebGL/webglMan.mjs";
export declare class Camera3D {
    position: Vector3D;
    fov: number;
    aspectRatio: number;
    near: number;
    far: number;
    walkspeed: number;
    viewMatrix: Matrix4D;
    projectionMatrix: Matrix4D;
    direction: Vector3D;
    UP: Vector3D;
    followPosition: Vector3D;
    following: boolean;
    getFollowPos: () => Vector3D;
    protected lastMousePos: {
        x: number;
        y: number;
    };
    invertX: boolean;
    invertY: boolean;
    invertXwhenFollowing: boolean | undefined;
    invertYwhenFollowing: boolean | undefined;
    constructor(position?: Vector3D, fov?: number, aspectRatio?: number, near?: number, far?: number, walkspeed?: number);
    setPos(pos: Vector3D): this;
    setFollowPos(pos: Vector3D): this;
    calculateMatrices(): this;
    tick(dt: number, keypress: any, mousepos: any, mouseclick: any): void;
    keys: {
        a: string;
        w: string;
        s: string;
        d: string;
        q: string;
        e: string;
        left: string;
        right: string;
        up: string;
        down: string;
        shift: string;
        r: string;
        rotMouse: boolean;
    };
    Hor(keypress: any): 0 | 1 | -1;
    Ver(keypress: any): 0 | 1 | -1;
    Depth(keypress: any): 0 | 1 | -1;
    right(keypress: any): any;
    left(keypress: any): any;
    down(keypress: any): any;
    up(keypress: any): any;
    shift(keypress: any): any;
    r(keypress: any): any;
    setMoveControlsAt(key?: "s" | "g" | "k" | "unbind"): this;
    bindRKey(key?: string): this;
    setCamControlsAt(key?: "down" | "g" | "k" | "unbind"): this;
    setMouseControls(key?: "mouse" | "unbind"): void;
    setUniforms(u_viewMatrix: UMAT4, u_projectionMatrix: UMAT4, u_cameraPosition: UVEC): void;
    uniforms: [UMAT4, UMAT4, UVEC][];
    setUniformsProgram(program: WebProgram | any): void;
}
export declare class SunLight {
    color: Vector3D;
    direction: Vector3D;
    lightIndex: number;
    constructor(color?: Vector3D, direction?: Vector3D, lightNumber?: number);
}
export declare class AmbienLight {
    color: Vector3D;
    constructor(color?: Vector3D);
}
export declare class LightManager {
    sunLigths: SunLight[];
    ambientLight: AmbienLight;
    programs: WebProgram[];
    uniforms: {
        sunLights: [UVEC, UVEC][];
        ambientLight: UVEC;
    }[];
    cSunLight(color: Vector3D, direction: Vector3D): SunLight;
    cAmbientLight(color: Vector3D): AmbienLight;
    createUniforms(program?: WebProgram, check?: number): this;
    updateValues(program?: WebProgram | number, check?: number): this;
    addProgram(program: WebProgram): void;
}
type UVEC = (WebGLUniformLocation & {
    set: (vec: Vector | number[], offset?: any, len?: any) => UVEC;
});
type UMAT4 = (WebGLUniformLocation & {
    set: (mat: Matrix4D | number[] | Float32Array, transpose?: boolean, offset?: any, len?: any) => UMAT4;
});
export {};
