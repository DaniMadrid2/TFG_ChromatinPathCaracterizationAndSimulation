export type BinaryNumberOperator = (a: number, b: number) => number;
export declare class ObjList<T> {
    values: T[];
    lastReturnValues: T[] | undefined;
    clase: this;
    constructor(...coords: T[] | T[][]);
    Fill(dim: number, val: T): void;
    static Fill(dim: number, val: any): ObjList<any>;
    dim(): number;
    get coords(): T[];
    get vals(): T[];
    toString(): string;
    opp(operator: (a: T, b: T) => T, ...comps: ObjList<T>[] | number[]): ObjList<T>;
    val(): ObjList<T>;
    set(...vals: any[]): void;
    setVal(i: number, val: T): ObjList<T>;
    get(i: number): T;
    clone(vec?: ObjList<T>): ObjList<T>;
    static clone(vec: ObjList<any>): ObjList<any>;
    set _(v: ObjList<T>);
    get _(): ((v: ObjList<T>) => void);
}
export declare class Vector extends ObjList<number> {
    constructor(...coords: number[] | number[][]);
    static Fill<T extends any>(dim: number, val: T): Vector;
    static Zeros(n: number): Vector;
    dim(): number;
    get vals(): number[];
    equals(v: Vector, forced?: boolean): boolean;
    toString(): string;
    get getConstructor(): any;
    opp(operator: BinaryNumberOperator, ...comps: Vector[] | number[]): Vector;
    add(...comps: Vector[] | number[]): Vector;
    substract(...comps: Vector[] | number[]): Vector;
    dot(...comps: Vector[] | number[]): number;
    mult(...comps: Vector[] | number[]): Vector;
    multiplyScalar(scalar: number): Vector;
    scalar(scalar: number): Vector;
    length(): number;
    norm(): number;
    normalize(): Vector;
    snap(): Vector;
    val(): Vector;
    get(i: number): number;
    clone(vec?: Vector): Vector;
    static clone(vec: Vector): Vector;
    updated(): void;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    set x(x: number);
    set y(y: number);
    set z(z: number);
    set w(w: number);
    [Symbol.iterator](): IterableIterator<number>;
}
export declare class Vector2D extends Vector {
    static Identity: Vector2D;
    static Zero: Vector2D;
    static XAxis: Vector2D;
    static YAxis: Vector2D;
    constructor(x: number, y: number);
    cross(vx: number | Vector2D, vy?: number): Vector2D;
    normalizedDot(vx: number | Vector2D, vy?: number): number;
    clone(): Vector2D;
    get arguments(): any[];
    static createArray(...vs: any[]): Vector2D[];
    static fromRadiusAndAngle(r: number, ang: number): Vector2D;
    getRadiusAndAngle(): [number, number];
    [Symbol.hasInstance](): boolean;
}
export declare class Vector3D extends Vector {
    static Identity: Vector3D;
    static Zero: Vector3D;
    static UP: Vector3D;
    static DOWN: Vector3D;
    static LEFT: Vector3D;
    static RIGHT: Vector3D;
    static FRONT: Vector3D;
    static BACK: Vector3D;
    constructor(x: number, y: number, z: number);
    static From(arr: number[]): Vector3D;
    isZero(): boolean;
    cross(vx: number | Vector3D, vy?: number, vz?: number): Vector3D;
    toQuaternion(w?: number): Quaternion;
    clone(): Vector3D;
}
export declare class Quaternion extends Vector {
    static Identity: Quaternion;
    constructor(x: number, y: number, z: number, w: number);
    multiply(q: Quaternion): Quaternion;
    toVector3D(): Vector3D;
    toVector(): Vector;
    getScalar(): number;
    add(q: any): Quaternion;
    substract(q: any): Quaternion;
    conjugate(): Quaternion;
    dot(q: Vector): number;
    normalize(): Quaternion;
    static rotateVector(point: Vector3D, rot: Vector, angle: number): Vector3D;
    static getRotQuaternion(rot: Vector, angle: number): Quaternion;
    getPositivePolarForm(): Quaternion;
    toEuler(): any[];
    static fromEuler(euler: [number, number, number]): Quaternion;
}
export declare class MatrixNM {
    n: number;
    m: number;
    vecs: Vector[];
    constructor(vs: Vector[]);
    static Zeros(n: number, m: number): MatrixNM;
    dim(): number[] | number;
    submatrix(matrix: MatrixNM, rows: number[], cols: number[]): MatrixNM;
    getInnerSquareMatrices(matrix: MatrixNM): MatrixNM[];
    set(i: any, j: any, val: any): MatrixNM;
    trace(): number;
    mulTrace(): number;
    get(i: any, j: any): number;
    luDecomposition(): {
        L: MatrixNM;
        U: MatrixNM;
    };
    determinant(): number | number[];
    det(): number | number[];
    toString(): String;
    static toLaTex(mat: MatrixNM, pre?: string, end?: string, brtype?: number): string;
    rows(): Vector[];
    get getConstructor(): any;
    mult(mat: MatrixNM): MatrixNM;
    multVector(vec: Vector): Vector;
    static fromValues(nums: number[][] | number[], n?: number, m?: number): MatrixNM;
    static fromValuesFlat(nums: number[][] | number[], n: number, m: number): MatrixNM;
    scale(n: number): this;
    toArray(): number[];
    toFloat32(): Float32Array;
    [Symbol.iterator](): IterableIterator<string>;
}
export declare class MatrixNN extends MatrixNM {
    constructor(vs: Vector[]);
    static Zeros(n: number): MatrixNN;
    getRows(): Vector[];
    dim(): number;
    static fromValues(nums: number[][] | number[], n: number): MatrixNN;
    transpose(): any;
}
export declare class Matrix2D extends MatrixNN {
    vecs: Vector2D[];
    static Identity: Matrix2D;
    constructor(v1?: Vector2D, v2?: Vector2D);
    determinant(): number;
    det(): number;
    set(v1: Matrix2D | Vector2D, v2?: Vector2D): Matrix2D;
    rows(): Vector2D[];
    mult(mat: Matrix2D): Matrix2D;
    rotate(angle: number): Matrix2D;
    inverse(): Matrix2D;
    transpose(): Matrix2D;
    adjugate(): Matrix2D;
    static fromRotation(angle: number, scale?: number): Matrix2D;
    toString(): String;
    toArrayString(): String;
    equals(m: Matrix2D): boolean;
    static fromValues(nums: number[][] | number[]): Matrix2D;
    static rotMatrix(ang: number): Matrix2D;
    static rotMatrixDeg(deg: number): Matrix2D;
    [Symbol.iterator](): IterableIterator<string>;
}
export declare class Matrix3D extends MatrixNN {
    vecs: Vector3D[];
    static Identity: Matrix3D;
    constructor(v1?: Vector3D, v2?: Vector3D, v3?: Vector3D);
    set(v1: Matrix3D | Vector3D, v2?: Vector3D, v3?: Vector3D): Matrix3D;
    mult(mat: Matrix3D): Matrix3D;
    rotate(phi: number, theta: number, psi: number): Matrix3D;
    static fromRotation(phi: number, theta: number, psi: number, scale?: number): Matrix3D;
    static fromValues(nums: number[][] | number[]): Matrix3D;
}
export declare class Matrix4D extends MatrixNN {
    vecs: Quaternion[];
    static Identity: Matrix4D;
    constructor(v1?: Quaternion, v2?: Quaternion, v3?: Quaternion, v4?: Quaternion);
    static createViewMatrix(cameraX: number, cameraY: number, cameraZ: number): Matrix4D;
    static createProjectionMatrix(fov: number, aspectRatio: number, near: number, far: number): Matrix4D;
    static createRotationMatrix(direction: [number, number, number] | Vector3D, angle: number): Matrix4D;
    static createLookAtMatrix(cameraPosition: [number, number, number] | Vector3D, target: [number, number, number] | Vector3D, upDirection?: [number, number, number] | Vector3D): Matrix4D;
    static createRotationMatrixFromDirection(cameraDir: Vector3D, upDirection?: Vector3D): Matrix4D;
    static createCameraViewMatrix(cameraPosition: Vector3D, cameraDir: Vector3D, upDirection?: Vector3D): Matrix4D;
    static createLookAtMatrixFromDirection(cameraPosition: [number, number, number] | Vector3D, cameraDir: [number, number, number] | Vector3D, upDirection?: [number, number, number] | Vector3D): Matrix4D;
    static createSnapLookAtMatrixFromDirection(cameraPosition: [number, number, number] | Vector3D, cameraDir: [number, number, number] | Vector3D, upDirection?: [number, number, number] | Vector3D): Matrix4D;
    static createLookAt(eye: Vector3D, center: Vector3D, up: Vector3D): Matrix4D;
    multVector3d(v: Vector3D | Vector): Vector3D;
    static From(arr: number[]): Matrix4D;
}
export declare abstract class MatrixStack<T extends MatrixNM> {
    stack: T[];
    constructor(start: T);
    abstract push(matrix: T): T;
    last(): T;
    apply(v: Vector): Vector;
    propagateBack(): T;
}
export declare class MatrixStack2D extends MatrixStack<Matrix3D> {
    total_rotation: number;
    total_scale: Vector2D;
    total_shear: Vector2D;
    total_translation: Vector2D;
    total_stack: [number, Vector2D, Vector2D][] & {
        last: () => [number, Vector2D, Vector2D];
        first: () => [number, Vector2D, Vector2D];
        total: () => [number, Vector2D, Vector2D];
    };
    constructor();
    push(matrix: Matrix3D): Matrix3D;
    pop(): Matrix3D;
    resetStack(): void;
    getCurrentMatrix(): Matrix3D;
    static translation(x: number, y: number): Matrix3D;
    translate(x: number, y: number): MatrixStack2D;
    static rotation(angle: number): Matrix3D;
    rotate(angle: number): MatrixStack2D;
    static rotationAround(angle: number, cx?: number, cy?: number): Matrix3D;
    rotateAround(angle: number, cx?: number, cy?: number): MatrixStack2D;
    static scaling(sx: number, sy: number): Matrix3D;
    scale(sx: number, sy: number): MatrixStack2D;
    static shearing(sx?: number, sy?: number): Matrix3D;
    shear(sx: number, sy: number): MatrixStack2D;
    apply(v: Vector): Vector;
}
export declare class MatrixStack3D extends MatrixStack<Matrix4D> {
    constructor();
    push(matrix: Matrix4D): Matrix4D;
}
