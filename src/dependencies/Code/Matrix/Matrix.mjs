export class ObjList {
    values;
    lastReturnValues;
    clase = this;
    constructor(...coords) {
        let vals = [];
        for (let i = 0; i < coords.length; i++) {
            const coord = coords[i];
            if (Array.isArray(coord)) {
                for (let j = 0; j < coord.length; j++) {
                    const c = coord[j];
                    vals.push(c);
                }
            }
            else {
                vals.push(coord);
            }
        }
        this.values = vals;
    }
    Fill(dim, val) {
        let vals = [];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        this.values = vals;
    }
    static Fill(dim, val) {
        let vals = [];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        return new ObjList(vals);
    }
    dim() {
        return this.values.length;
    }
    get coords() {
        return this.values;
    }
    get vals() {
        return this.values;
    }
    toString() {
        let str = "";
        for (let i = 0; i < this.values.length; i++) {
            const val = this.values[i];
            str += val;
            if (i !== this.values.length) {
                str += ", ";
            }
        }
        return str;
    }
    opp(operator, ...comps) {
        let newValues = [];
        if (typeof comps[0] === "object") {
            let vect = comps[0];
            for (let i = 0; i < this.values.length; i++) {
                newValues[i] = operator(this.values[i], vect.values[i]);
            }
        }
        else {
            for (let i = 0; i < this.values.length; i++) {
                newValues[i] = operator(this.values[i], comps[i]);
            }
        }
        return new ObjList(newValues);
    }
    val() {
        if (!!this.lastReturnValues) {
            this.values = this.lastReturnValues;
        }
        return this;
    }
    set(...vals) {
        if (vals?.[0] instanceof ObjList)
            vals = vals?.[0].values;
        for (let i = 0; i < vals.length; i++)
            if (typeof vals[i] == "number")
                this.values[i] = vals[i];
        if (this.updated && typeof this.updated == "function")
            this.updated(-1);
    }
    setVal(i, val) {
        this.values[i] = val;
        this.lastReturnValues = undefined;
        return this;
    }
    get(i) {
        return this.values[i];
    }
    clone(vec = this) {
        return new ObjList(...vec.values);
    }
    static clone(vec) {
        return vec.clone();
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
export class Vector extends ObjList {
    constructor(...coords) {
        super(...coords);
    }
    static Fill(dim, val) {
        let vals = [];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        return new Vector(vals);
    }
    static Zeros(n) {
        return Vector.Fill(n, 0);
    }
    dim() {
        return this.values.length;
    }
    get vals() {
        return this.values;
    }
    equals(v, forced = false) {
        if (forced && v.values.length !== v?.values.length)
            return false;
        for (let i = 0; i < Math.min(this.values.length, v?.values?.length); i++) {
            if (this.values[i] !== v?.values[i])
                return false;
        }
    }
    toString() {
        let str = "";
        for (let i = 0; i < this.values.length; i++) {
            const val = this.values[i];
            str += val;
            if (i !== this.values.length) {
                str += ", ";
            }
        }
        return str;
    }
    get getConstructor() {
        return Object.getPrototypeOf(this).constructor;
    }
    opp(operator, ...comps) {
        return new this.getConstructor(super.opp(operator, ...comps).values);
    }
    add(...comps) {
        let last = this.opp((a, b) => a + b, ...comps);
        this.lastReturnValues = last.values;
        return last;
    }
    substract(...comps) {
        let last = this.opp((a, b) => a - b, ...comps);
        this.lastReturnValues = last.values;
        return last;
    }
    dot(...comps) {
        return this.opp((a, b) => a * b, ...comps).values.reduce((a, b) => a + b, 0);
    }
    mult(...comps) {
        let last = this.opp((a, b) => a * b);
        this.lastReturnValues = last.values;
        return last;
    }
    multiplyScalar(scalar) {
        let last = new this.getConstructor(this.values.map((a) => a * scalar));
        this.lastReturnValues = last.values;
        return last;
    }
    scalar(scalar) {
        return this.multiplyScalar(scalar);
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
    norm() {
        return this.dot(this);
    }
    normalize() {
        let len = this.length();
        if (len === 0)
            return this;
        return this.multiplyScalar(1 / len);
    }
    snap() {
        return new this.getConstructor(...this.values.map(a => (a > 0.5 ? Math.sign(a) : 0)));
    }
    val() {
        if (!!this.lastReturnValues) {
            this.values = this.lastReturnValues;
        }
        return this;
    }
    get(i) {
        return this.values[i];
    }
    clone(vec = this) {
        return new this.getConstructor(...vec.values);
    }
    static clone(vec) {
        return vec.clone();
    }
    updated() {
    }
    get x() {
        return this.values[0];
    }
    get y() {
        return this.values[1];
    }
    get z() {
        return this.values[2];
    }
    get w() {
        return this.values[3];
    }
    set x(x) {
        this.updated();
        this.values[0] = x;
    }
    set y(y) {
        this.updated();
        this.values[1] = y;
    }
    set z(z) {
        this.updated();
        this.values[2] = z;
    }
    set w(w) {
        this.updated();
        this.values[3] = w;
    }
    [Symbol.iterator]() {
        return this.values[Symbol.iterator]();
    }
}
export class Vector2D extends Vector {
    static Identity = new Vector2D(1, 1);
    static Zero = new Vector2D(0, 0);
    static XAxis = new Vector2D(1, 0);
    static YAxis = new Vector2D(0, 1);
    constructor(x, y) {
        if (Array.isArray(x) && y !== 0 && !y) {
            y = x[1];
            x = x[0];
        }
        super(x, y);
    }
    cross(vx, vy) {
        if (typeof vx === "object") {
            let vect = vx;
            return new Vector2D(-this.y * vect.x, this.x * vect.y);
        }
        else {
            if (!vy && vy !== 0)
                return this;
            return new Vector2D(-this.y * vx, this.x * vy);
        }
    }
    normalizedDot(vx, vy) {
        if (typeof vx === "object") {
            let vect = vx;
            return (-this.y * vect.x + this.x * vect.y) / (vx.dot(vx) * this.dot(this));
        }
        else {
            if (!vy && vy !== 0)
                return 0;
            return (-this.y * vx + this.x * vy) / ((vx * vx + vy * vy) + this.dot(this));
        }
    }
    clone() {
        return super.clone();
    }
    get arguments() {
        return [];
    }
    static createArray(...vs) {
        let v2arr = [];
        for (let i = 0; i < vs.length - 1; i += 2) {
            v2arr.push(new Vector2D(vs[i], vs[i + 1]));
        }
        return v2arr;
    }
    static fromRadiusAndAngle(r, ang) {
        return new Vector2D(r * Math.cos(ang), r * Math.sin(ang));
    }
    getRadiusAndAngle() {
        return [Math.hypot(this.x, this.y), Math.atan2(this.y, this.x)];
    }
    [Symbol.hasInstance]() {
        return true;
    }
}
export class Vector3D extends Vector {
    static Identity = new Vector3D(1, 1, 1);
    static Zero = new Vector3D(0, 0, 0);
    static UP = new Vector3D(0, 1, 0);
    static DOWN = new Vector3D(0, -1, 0);
    static LEFT = new Vector3D(-1, 0, 0);
    static RIGHT = new Vector3D(1, 0, 0);
    static FRONT = new Vector3D(0, 0, 1);
    static BACK = new Vector3D(0, 0, -1);
    constructor(x, y, z) {
        if (Array.isArray(x) && ((y !== 0 && !y) || (z !== 0 && !z))) {
            z = x[2];
            y = x[1];
            x = x[0];
        }
        super(x, y, z);
    }
    static From(arr) {
        return new Vector3D(arr[0], arr[1], arr[2]);
    }
    isZero() {
        return this.x == 0 && this.y == 0 && this.z == 0;
    }
    cross(vx, vy, vz) {
        if (typeof vx === "object") {
            let vect = vx;
            const resultX = this.y * vect.z - this.z * vect.y;
            const resultY = this.z * vect.x - this.x * vect.z;
            const resultZ = this.x * vect.y - this.y * vect.x;
            return new Vector3D(resultX, resultY, resultZ);
        }
        else if (typeof vx === "number" && typeof vy === "number" && typeof vz === "number") {
            const resultX = this.y * vz - this.z * vy;
            const resultY = this.z * vx - this.x * vz;
            const resultZ = this.x * vy - this.y * vx;
            return new Vector3D(resultX, resultY, resultZ);
        }
        else {
            return this;
        }
    }
    toQuaternion(w = 0) {
        return new Quaternion(this.x, this.y, this.z, w);
    }
    clone() {
        return super.clone();
    }
}
export class Quaternion extends Vector {
    static Identity = new Quaternion(1, 0, 0, 0);
    constructor(x, y, z, w) {
        super(x, y, z, w);
    }
    multiply(q) {
        let w1 = this.w;
        let x1 = this.x;
        let y1 = this.y;
        let z1 = this.z;
        let w2 = q.w;
        let x2 = q.x;
        let y2 = q.y;
        let z2 = q.z;
        let w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
        let x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
        let y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
        let z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
        return new Quaternion(x, y, z, w);
    }
    toVector3D() {
        return new Vector3D(this.x, this.y, this.z);
    }
    toVector() {
        return new Vector3D(this.x, this.y, this.z);
    }
    getScalar() {
        return this.w;
    }
    add(q) {
        return new Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
    }
    substract(q) {
        return new Quaternion(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w);
    }
    conjugate() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }
    dot(q) {
        return this.w * q.w +
            this.x * q.x +
            this.y * q.y +
            this.z * q.z;
    }
    normalize() {
        return super.normalize();
    }
    static rotateVector(point, rot = this, angle) {
        let p = point.toQuaternion();
        let rotation = rot;
        let sin = Math.sin(angle / 2);
        let cos = Math.cos(angle / 2);
        var r = new Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
        r = r.normalize();
        let rCon = r.conjugate();
        let resultP = r.multiply(p).multiply(rCon);
        return resultP.toVector3D();
    }
    static getRotQuaternion(rot = this, angle) {
        let rotation = rot;
        let sin = Math.sin(angle / 2);
        let cos = Math.cos(angle / 2);
        var r = new Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
        r = r.normalize();
        return r;
    }
    getPositivePolarForm() {
        if (this.w < 0) {
            let unitQ = this.normalize();
            return new Quaternion(-unitQ.x, -unitQ.y, -unitQ.z, -unitQ.w);
        }
        else {
            return this.normalize();
        }
    }
    toEuler() {
        const [x, y, z, w] = [this.x, this.y, this.z, this.w];
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);
        const sinp = 2 * (w * y - z * x);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.sign(sinp) * (Math.PI / 2);
        }
        else {
            pitch = Math.asin(sinp);
        }
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);
        return [roll, pitch, yaw];
    }
    static fromEuler(euler) {
        const [roll, pitch, yaw] = euler;
        const cy = Math.cos(yaw * 0.5);
        const sy = Math.sin(yaw * 0.5);
        const cp = Math.cos(pitch * 0.5);
        const sp = Math.sin(pitch * 0.5);
        const cr = Math.cos(roll * 0.5);
        const sr = Math.sin(roll * 0.5);
        const w = cr * cp * cy + sr * sp * sy;
        const x = sr * cp * cy - cr * sp * sy;
        const y = cr * sp * cy + sr * cp * sy;
        const z = cr * cp * sy - sr * sp * cy;
        return new Quaternion(x, y, z, w);
    }
}
export class MatrixNM {
    n;
    m;
    vecs;
    constructor(vs) {
        let maxn = 0;
        this.m = vs.length;
        this.vecs = vs || [];
        for (let i = 0; i < vs.length; i++) {
            const v = vs[i];
            if (v.dim() > maxn) {
                maxn = v.dim();
            }
        }
        this.n = maxn;
    }
    static Zeros(n, m) {
        let vecs = [];
        for (let col = 0; col < m; col++) {
            vecs.push(Vector.Zeros(n));
        }
        return new MatrixNM(vecs);
    }
    dim() {
        return [this.n, this.m];
    }
    submatrix(matrix, rows, cols) {
        const subVectors = [];
        for (let i = 0; i < matrix.m; i++) {
            const tmpCol = matrix.vecs[i];
            if (cols.indexOf(i) != -1) {
                let subValues = [];
                for (let j = 0; j < matrix.n; j++) {
                    if (rows.indexOf(j) != -1) {
                        subValues.push(tmpCol.values[j] || 0);
                    }
                }
                subVectors.push(new Vector(subValues));
            }
        }
        return new this.getConstructor(subVectors);
    }
    getInnerSquareMatrices(matrix) {
        const innerMatrices = [];
        const maxSize = Math.max(matrix.n, matrix.m);
        const minSize = Math.min(matrix.n, matrix.m);
        const nMatrices = maxSize - minSize + 1;
        let rows, cols;
        let maxSlice = new Array(minSize).fill(1).map((v, ti) => { return ti; });
        for (let i = 0; i < nMatrices; i++) {
            let nslice = new Array(minSize).fill(1).map((v, ti) => { return ti + i; });
            if (minSize == matrix.n) {
                rows = maxSlice;
                cols = nslice;
            }
            else {
                cols = maxSlice;
                rows = nslice;
            }
            const innerMatrix = this.submatrix(this, rows, cols);
            innerMatrices.push(innerMatrix);
        }
        return innerMatrices;
    }
    set(i, j, val) {
        this.vecs[j].values[i] = val;
        return this;
    }
    trace() {
        let minN = Math.min(this.n, this.m);
        let sum = 0;
        for (let i = 0; i < minN; i++) {
            sum += this.get(i, i);
        }
        return sum;
    }
    mulTrace() {
        let minN = Math.min(this.n, this.m);
        let mul = 1;
        for (let i = 0; i < minN; i++) {
            mul *= this.get(i, i);
        }
        return mul;
    }
    get(i, j) {
        return this.vecs[j].values[i];
    }
    luDecomposition() {
        const rows = this.n;
        const cols = this.m;
        const L = MatrixNM.Zeros(rows, cols);
        const U = MatrixNM.Zeros(rows, cols);
        for (let i = 0; i < rows; i++) {
            L.set(i, i, 1);
            for (let j = i; j < cols; j++) {
                let sum = 0;
                for (let k = 0; k < i; k++) {
                    sum += L.get(i, k) * U.get(k, j);
                }
                U.set(i, j, this.get(i, j) - sum);
            }
            for (let j = i + 1; j < rows; j++) {
                let sum = 0;
                for (let k = 0; k < i; k++) {
                    sum += L.get(j, k) * U.get(k, i);
                }
                L.set(j, i, (this.get(j, i) - sum) / U.get(i, i));
            }
        }
        L.det = (L.mulTrace);
        U.det = (U.mulTrace);
        return { L, U };
    }
    determinant() {
        if (this.n != this.m) {
            console.log("rect");
            const innerMatrices = this.getInnerSquareMatrices(this);
            const determinants = [];
            for (const innerMatrix of innerMatrices) {
                determinants.push(innerMatrix.determinant());
            }
            return determinants;
        }
        if (this.n === 1) {
            return this.vecs[0].values[0];
        }
        if (this.n === 2) {
            return this.vecs[0].values[0] * this.vecs[1].values[1] -
                this.vecs[0].values[1] * this.vecs[1].values[0];
        }
        const { L, U } = this.luDecomposition();
        return (L.det() * U.det());
    }
    det() {
        return this.determinant();
    }
    toString() {
        let str = "";
        for (let i = 0; i < this.vecs.length; i++) {
            str += this.vecs[i] + "";
            if (i !== this.vecs.length - 1) {
                str += "\\\\ ";
            }
        }
        return str;
    }
    static toLaTex(mat, pre = "", end = "", brtype = 0) {
        let wtxt = pre;
        for (let i = 0; i < mat.vecs.length; i++) {
            wtxt += "c";
        }
        let brs = ["(", ")"];
        switch (brtype) {
            case 1:
                brs = ["[", "]"];
                break;
            case 0:
            default:
                brs = ["(", ")"];
                break;
        }
        let txt = "\\left" + brs[0] + " \\begin{array}{" + wtxt + "} ";
        for (let i = 0; i < (mat.vecs?.[0]?.values.length) || 0; i++) {
            for (let j = 0; j < mat.vecs.length; j++) {
                txt += mat.vecs[j].values[i] + "";
                if (j !== mat.vecs.length - 1) {
                    txt += " & ";
                }
            }
            if (i !== mat.vecs?.[0]?.values.length - 1) {
                txt += " \\\\ ";
            }
        }
        txt += " \\end{array} \\right" + brs[1] + " " + end;
        return txt;
    }
    rows() {
        const rows = [];
        for (let row = 0; row < this.n; row++) {
            const rowData = [];
            for (let col = 0; col < this.m; col++) {
                const vector = this.vecs[col];
                rowData.push(vector.values[row]);
            }
            rows.push(new Vector(...rowData));
        }
        return rows;
    }
    get getConstructor() {
        return Object.getPrototypeOf(this).constructor;
    }
    mult(mat) {
        let rows = mat.rows();
        let cols = this.vecs;
        let newCols = [];
        let minN = Math.min(this.n, mat.m);
        let minM = Math.min(this.m, mat.n);
        for (let nCol = 0; nCol < minM; nCol++) {
            let newColValues = [];
            for (let nRow = 0; nRow < minN; nRow++) {
                newColValues[nRow] = rows[nRow].dot(cols[nCol]);
            }
            newCols.push(new Vector(newColValues));
        }
        return new this.getConstructor(...newCols);
    }
    multVector(vec) {
        let rows = this.rows();
        let newColValues = [];
        let minN = Math.min(vec.dim(), this.n);
        for (let nRow = 0; nRow < minN; nRow++) {
            newColValues[nRow] = rows[nRow].dot(vec);
        }
        return new vec.getConstructor(...newColValues);
    }
    static fromValues(nums, n, m) {
        if (nums && nums[0] && Array.isArray(nums[0])) {
            m = nums.length;
            n = nums[0].length;
            nums = nums.flat();
        }
        if (!m && n) {
            let l = nums.length;
            m = Math.floor(l / n);
        }
        if (!n && m) {
            let l = nums.length;
            n = Math.floor(l / m);
        }
        if (!m && !n) {
            let l = nums.length;
            n = m = Math.floor(Math.sqrt(l));
        }
        return this.fromValuesFlat(nums, n, m);
    }
    static fromValuesFlat(nums, n, m) {
        nums = nums.flat();
        let vs = [];
        for (let i = 0; i < m; i++) {
            let nnums = [];
            for (let j = 0; j < n; j++) {
                nnums.push(nums[i * m + j]);
            }
            vs[i] = new Vector(...(nnums));
        }
        return new MatrixNM(vs);
    }
    scale(n) {
        n = Math.sqrt(n);
        for (let i = 0; i < this.vecs.length; i++) {
            this.vecs[i]._ = this.vecs[i].multiplyScalar(n);
        }
        return this;
    }
    toArray() {
        return this.vecs.map(v => v.vals).flat();
    }
    toFloat32() {
        return new Float32Array(this.toArray());
    }
    [Symbol.iterator]() {
        return this.vecs.map((a) => (a.toString()))[Symbol.iterator]();
    }
}
export class MatrixNN extends MatrixNM {
    constructor(vs) {
        super(vs);
        let minN = Math.min(this.n, this.m);
        this.n = this.m = minN;
    }
    static Zeros(n) {
        return super.Zeros(n, n);
    }
    getRows() {
        let rowVecs = [];
        for (let i = 0; i < this.n; i++) {
            let tRow = [];
            for (let j = 0; j < this.m; j++) {
                const element = this.m[j];
            }
            rowVecs.push(new Vector(tRow));
        }
        return rowVecs;
    }
    dim() {
        return this.n;
    }
    static fromValues(nums, n) {
        nums = nums.flat();
        let vs = [];
        for (let i = 0; i < n; i++) {
            let nnums = [];
            for (let j = 0; j < n; j++) {
                nnums.push(nums[i * n + j]);
            }
            vs[i] = new Vector(...(nnums));
        }
        return new MatrixNN(vs);
    }
    transpose() {
        let vecs = new Array(this.n);
        for (let i = 0; i < this.n; i++) {
            vecs[i] = new Vector(new Array(this.n));
            for (let j = 0; j < this.n; j++) {
                vecs[i].vals[j] = this.get(j, i);
            }
        }
        return new this.getConstructor(...vecs);
    }
}
export class Matrix2D extends MatrixNN {
    vecs = [];
    static Identity = new Matrix2D();
    constructor(v1 = new Vector2D(1, 0), v2 = new Vector2D(0, 1)) {
        super([v1, v2]);
        this.vecs = [v1, v2];
    }
    determinant() {
        return this.vecs[0].x * this.vecs[1].y - this.vecs[0].y * this.vecs[1].x;
    }
    det() {
        return this.determinant();
    }
    set(v1, v2 = Vector2D.Zero) {
        if (v1 instanceof Matrix2D) {
            this.vecs = [v1.vecs[0], v1.vecs[1]];
        }
        else {
            this.vecs = [v1.clone(), v2.clone()];
        }
        return this;
    }
    rows() {
        return [new Vector2D(this.vecs[0].x, this.vecs[1].x), new Vector2D(this.vecs[0].y, this.vecs[1].y)];
    }
    mult(mat) {
        let rows = mat.rows();
        let cols = this.vecs;
        return new Matrix2D(new Vector2D(cols[0].dot(rows[0]), cols[0].dot(rows[1])), new Vector2D(cols[1].dot(rows[0]), cols[1].dot(rows[1])));
    }
    rotate(angle) {
        return this.set(this.mult(Matrix2D.fromRotation(angle)));
    }
    inverse() {
        let det = this.det();
        if (det == 0)
            det = Number.EPSILON;
        return Matrix2D.fromValues([this.vecs[1].y / det, -this.vecs[0].y / det, -this.vecs[1].x / det, this.vecs[0].x / det]);
    }
    transpose() {
        return Matrix2D.fromValues([this.vecs[0].x, this.vecs[1].x, this.vecs[0].y, this.vecs[1].y]);
    }
    adjugate() {
        return Matrix2D.fromValues([this.vecs[1].y, -this.vecs[1].x, -this.vecs[0].y, this.vecs[0].x]);
    }
    static fromRotation(angle, scale = 1) {
        return new Matrix2D(new Vector2D(Math.cos(angle) * scale, Math.sin(angle) * scale), new Vector2D(-Math.sin(angle) * scale, Math.cos(angle)));
    }
    toString() {
        return `${this.vecs[0].x}, ${this.vecs[0].y} \\\\ ${this.vecs[1].x}, ${this.vecs[1].y}`;
    }
    toArrayString() {
        return `[${this.vecs[0].x}, ${this.vecs[0].y}, ${this.vecs[1].x}, ${this.vecs[1].y}]`;
    }
    equals(m) {
        return this.vecs[0].equals(m?.vecs?.[0]) && this.vecs[1].equals(m?.vecs?.[1]);
    }
    static fromValues(nums) {
        nums = nums.flat();
        let vs = [];
        for (let i = 0; i < 2; i++) {
            let nnums = [];
            for (let j = 0; j < 2; j++) {
                nnums.push(nums[i * 2 + j]);
            }
            vs[i] = new Vector2D(...nnums);
        }
        return new Matrix2D(vs[0], vs[1]);
    }
    static rotMatrix(ang) {
        return Matrix2D.fromValues([
            [Math.cos(ang), Math.sin(ang)],
            [Math.sin(-ang), Math.cos(ang)]
        ]);
    }
    static rotMatrixDeg(deg) {
        return Matrix2D.rotMatrix(deg / 180 * Math.PI);
    }
    [Symbol.iterator]() {
        return this.vecs.map((a) => (a.toString()))[Symbol.iterator]();
    }
}
export class Matrix3D extends MatrixNN {
    vecs = [];
    static Identity = new Matrix3D();
    constructor(v1 = new Vector3D(1, 0, 0), v2 = new Vector3D(0, 1, 0), v3 = new Vector3D(0, 0, 1)) {
        super([v1, v2, v3]);
        this.vecs = [v1, v2, v3];
    }
    set(v1, v2 = Vector3D.Zero, v3 = Vector3D.Zero) {
        if (v1 instanceof Matrix3D) {
            this.vecs = [v1.vecs[0], v1.vecs[1], v1.vecs[2]];
        }
        else {
            this.vecs = [v1.clone(), v2.clone(), v3.clone()];
        }
        return this;
    }
    mult(mat) {
        return super.mult(mat);
    }
    rotate(phi, theta, psi) {
        return this.mult(Matrix3D.fromRotation(phi, theta, psi));
    }
    static fromRotation(phi, theta, psi, scale = 1) {
        const phiRad = (phi * Math.PI) / 180;
        const thetaRad = (theta * Math.PI) / 180;
        const psiRad = (psi * Math.PI) / 180;
        const cosPhi = Math.cos(phiRad);
        const sinPhi = Math.sin(phiRad);
        const cosTheta = Math.cos(thetaRad);
        const sinTheta = Math.sin(thetaRad);
        const cosPsi = Math.cos(psiRad);
        const sinPsi = Math.sin(psiRad);
        const rotationMatrix = [
            new Vector3D(cosTheta * cosPsi * scale, cosPhi * sinPsi + sinPhi * sinTheta * cosPsi * scale, sinPhi * sinPsi - cosPhi * sinTheta * cosPsi),
            new Vector3D(-cosTheta * sinPsi * scale, cosPhi * cosPsi - sinPhi * sinTheta * sinPsi * scale, sinPhi * cosPsi + cosPhi * sinTheta * sinPsi),
            new Vector3D(sinTheta * scale, -sinPhi * cosTheta * scale, cosPhi * cosTheta),
        ];
        if (scale !== 1) {
            for (let i = 0; i < 9; i++) {
                rotationMatrix[i];
            }
        }
        return new Matrix3D(...rotationMatrix);
    }
    static fromValues(nums) {
        nums = nums.flat();
        let vs = [];
        for (let i = 0; i < 3; i++) {
            let nnums = [];
            for (let j = 0; j < 3; j++) {
                nnums.push(nums[i * 3 + j]);
            }
            vs[i] = new Vector3D(...nnums);
        }
        return new Matrix3D(vs[0], vs[1], vs[2]);
    }
}
export class Matrix4D extends MatrixNN {
    vecs = [];
    static Identity = new Matrix4D();
    constructor(v1 = new Quaternion(1, 0, 0, 0), v2 = new Quaternion(0, 1, 0, 0), v3 = new Quaternion(0, 0, 1, 0), v4 = new Quaternion(0, 0, 0, 1)) {
        super([v1, v2, v3, v4]);
        this.vecs = [v1, v2, v3, v4];
    }
    static createViewMatrix(cameraX, cameraY, cameraZ) {
        return new Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(-cameraX, -cameraY, -cameraZ, 1));
    }
    static createProjectionMatrix(fov, aspectRatio, near, far) {
        const f = 1 / Math.tan((fov / 2 * Math.PI) / 360);
        const rangeInv = 1 / (near - far);
        return new Matrix4D(new Quaternion(f / aspectRatio, 0, 0, 0), new Quaternion(0, f, 0, 0), new Quaternion(0, 0, (far + near) * rangeInv, -1), new Quaternion(0, 0, 2 * far * near * rangeInv, 0));
    }
    static createRotationMatrix(direction, angle) {
        const [dx, dy, dz] = direction;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0)
            throw new Error("Direction vector cannot be zero.");
        const x = dx / length, y = dy / length, z = dz / length;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        return new Matrix4D(new Quaternion(t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0), new Quaternion(t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0), new Quaternion(t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0), new Quaternion(0, 0, 0, 1));
    }
    static createLookAtMatrix(cameraPosition, target, upDirection = [0, 1, 0]) {
        const [cx, cy, cz] = cameraPosition;
        const [tx, ty, tz] = target;
        const [ux, uy, uz] = upDirection;
        let fx = tx - cx, fy = ty - cy, fz = tz - cz;
        const fLength = Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx /= fLength;
        fy /= fLength;
        fz /= fLength;
        let rx = fy * uz - fz * uy, ry = fz * ux - fx * uz, rz = fx * uy - fy * ux;
        const rLength = Math.sqrt(rx * rx + ry * ry + rz * rz);
        rx /= rLength;
        ry /= rLength;
        rz /= rLength;
        const uxAdjusted = ry * fz - rz * fy;
        const uyAdjusted = rz * fx - rx * fz;
        const uzAdjusted = rx * fy - ry * fx;
        return new Matrix4D(new Quaternion(rx, ry, rz, 0), new Quaternion(uxAdjusted, uyAdjusted, uzAdjusted, 0), new Quaternion(-fx, -fy, -fz, 0), new Quaternion(-cx, -cy, -cz, 1));
    }
    static createRotationMatrixFromDirection(cameraDir, upDirection = new Vector3D(0, 1, 0)) {
        const cameraDirNormalized = cameraDir;
        const upDirNormalized = upDirection;
        const right = cameraDirNormalized.cross(upDirNormalized);
        const up = right.cross(cameraDirNormalized);
        return new Matrix4D(new Quaternion(right.x, right.y, right.z, 0), new Quaternion(up.x, up.y, up.z, 0), new Quaternion(-cameraDirNormalized.x, -cameraDirNormalized.y, -cameraDirNormalized.z, 0), new Quaternion(0, 0, 0, 1));
    }
    static createCameraViewMatrix(cameraPosition, cameraDir, upDirection = new Vector3D(0, 1, 0)) {
        const [cx, cy, cz] = cameraPosition;
        let rotMatrix = Matrix4D.createRotationMatrixFromDirection(cameraDir, upDirection);
        let translationMatrix = new Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(cx, cy, cz, 0));
        let inverseTranslationMatrix = new Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(-cx, -cy, -cz, 0));
        let viewMatrix = translationMatrix.mult(rotMatrix).mult(inverseTranslationMatrix);
        return viewMatrix.transpose();
    }
    static createLookAtMatrixFromDirection(cameraPosition, cameraDir, upDirection = [0, 1, 0]) {
        const [cx, cy, cz] = cameraPosition;
        let [fx, fy, fz] = cameraDir;
        let [ux, uy, uz] = upDirection;
        const fLen = Math.hypot(fx, fy, fz);
        fx /= fLen;
        fy /= fLen;
        fz /= fLen;
        let rx = fy * uz - fz * uy;
        let ry = fz * ux - fx * uz;
        let rz = fx * uy - fy * ux;
        const rLen = Math.hypot(rx, ry, rz);
        rx /= rLen;
        ry /= rLen;
        rz /= rLen;
        const uxAdj = ry * fz - rz * fy;
        const uyAdj = rz * fx - rx * fz;
        const uzAdj = rx * fy - ry * fx;
        return new Matrix4D(new Quaternion(rx, uxAdj, -fx, 0), new Quaternion(ry, uyAdj, -fy, 0), new Quaternion(rz, uzAdj, -fz, 0), new Quaternion(-(rx * cx + ry * cy + rz * cz), -(uxAdj * cx + uyAdj * cy + uzAdj * cz), fx * cx + fy * cy + fz * cz, 1));
    }
    static createSnapLookAtMatrixFromDirection(cameraPosition, cameraDir, upDirection = [0, 1, 0]) {
        const EPS = 1e-6;
        const pos = Vector3D.From([...cameraPosition]);
        const dirToCenter = Vector3D.Zero.substract(pos).normalize();
        let camF = Vector3D.From([...cameraDir]).normalize();
        if (isNaN(camF.x) || (Math.abs(camF.x) < EPS && Math.abs(camF.y) < EPS && Math.abs(camF.z) < EPS)) {
            camF = dirToCenter.clone();
        }
        const camUpOrig = Vector3D.From([...upDirection]).normalize();
        const worldUp = new Vector3D(0, 1, 0);
        let projWorldUp = worldUp.substract(camF.multiplyScalar(worldUp.dot(camF)));
        if (projWorldUp.length() < EPS) {
            projWorldUp = new Vector3D(0, 0, 1).substract(camF.multiplyScalar(new Vector3D(0, 0, 1).dot(camF)));
        }
        projWorldUp = projWorldUp.normalize();
        let projCamUp = camUpOrig.substract(camF.multiplyScalar(camUpOrig.dot(camF)));
        if (projCamUp.length() < EPS) {
            projCamUp = projWorldUp.clone();
        }
        projCamUp = projCamUp.normalize();
        const sinRoll = camF.dot(projWorldUp.cross(projCamUp));
        const cosRoll = Math.max(-1, Math.min(1, projWorldUp.dot(projCamUp)));
        const rollCurrent = Math.atan2(sinRoll, cosRoll);
        const quarter = Math.PI / 2;
        const rollSnapped = Math.round(rollCurrent / quarter) * quarter;
        const deltaRoll = rollSnapped - rollCurrent;
        function rotateAroundAxis(v, axis, angle) {
            const k = axis.normalize();
            const cosA = Math.cos(angle), sinA = Math.sin(angle);
            const term1 = v.multiplyScalar(cosA);
            const term2 = k.cross(v).multiplyScalar(sinA);
            const term3 = k.multiplyScalar(k.dot(v) * (1 - cosA));
            return term1.add(term2).add(term3);
        }
        const adjustedUp = rotateAroundAxis(camUpOrig, camF, deltaRoll).normalize();
        const candidates = [
            new Vector3D(1, 0, 0),
            new Vector3D(-1, 0, 0),
            new Vector3D(0, 1, 0),
            new Vector3D(0, -1, 0),
            new Vector3D(0, 0, 1),
            new Vector3D(0, 0, -1)
        ];
        function snapToAxis(v) {
            const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
            if (ax >= ay && ax >= az)
                return new Vector3D(Math.sign(v.x), 0, 0);
            if (ay >= ax && ay >= az)
                return new Vector3D(0, Math.sign(v.y), 0);
            return new Vector3D(0, 0, Math.sign(v.z));
        }
        const snappedForward = snapToAxis(dirToCenter);
        let projectedUp = adjustedUp.substract(snappedForward.multiplyScalar(adjustedUp.dot(snappedForward)));
        if (projectedUp.length() < EPS) {
            if (Math.abs(snappedForward.x) === 1)
                projectedUp = new Vector3D(0, 1, 0);
            else if (Math.abs(snappedForward.y) === 1)
                projectedUp = new Vector3D(0, 0, 1);
            else
                projectedUp = new Vector3D(0, 1, 0);
        }
        projectedUp = projectedUp.normalize();
        const snappedRight = projectedUp.cross(snappedForward).normalize();
        const snappedUp = snappedForward.cross(snappedRight).normalize();
        const m00 = snappedRight.x, m01 = snappedRight.y, m02 = snappedRight.z;
        const m10 = snappedUp.x, m11 = snappedUp.y, m12 = snappedUp.z;
        const m20 = snappedForward.x, m21 = snappedForward.y, m22 = snappedForward.z;
        const tx = -snappedRight.dot(pos);
        const ty = -snappedUp.dot(pos);
        const tz = -snappedForward.dot(pos);
        const lookAt = Matrix4D.From([
            m00, m10, m20, 0,
            m01, m11, m21, 0,
            m02, m12, m22, 0,
            0, 0, 0, 1
        ]);
        return lookAt;
    }
    static createLookAt(eye, center, up) {
        const f = center.add(eye.multiplyScalar(-1)).normalize();
        const s = f.cross(up).normalize();
        const u = s.cross(f);
        return new Matrix4D(new Quaternion(s.x, u.x, -f.x, 0), new Quaternion(s.y, u.y, -f.y, 0), new Quaternion(s.z, u.z, -f.z, 0), new Quaternion(-s.dot(eye), -u.dot(eye), f.dot(eye), 1));
    }
    multVector3d(v) {
        return Vector3D.From(super.multVector(new Quaternion(v.x, v.y, v.z, 1)).vals);
    }
    static From(arr) {
        return new Matrix4D(new Quaternion(arr[0], arr[1], arr[2], arr[3]), new Quaternion(arr[4], arr[5], arr[6], arr[7]), new Quaternion(arr[8], arr[9], arr[10], arr[11]), new Quaternion(arr[12], arr[13], arr[14], arr[15]));
    }
}
export class MatrixStack {
    stack;
    constructor(start) {
        this.stack = [start];
    }
    last() {
        if (this.stack.length == 0)
            return undefined;
        return this.stack[this.stack.length - 1];
    }
    apply(v) {
        return this.last().multVector(v);
    }
    propagateBack() {
        if (this.stack.length < 2)
            return this.last();
        this.stack[this.stack.length - 2] = this.last();
        this.stack.pop();
    }
}
export class MatrixStack2D extends MatrixStack {
    total_rotation = 0;
    total_scale = new Vector2D(1, 1);
    total_shear = new Vector2D(0, 0);
    total_translation = new Vector2D(0, 0);
    total_stack = [];
    constructor() {
        super(Matrix3D.Identity);
        this.total_stack.last = () => { return this.total_stack[this.total_stack.length - 1]; };
        this.total_stack.first = () => { return this.total_stack[0]; };
        this.total_stack.total = () => { return [this.total_rotation, this.total_scale, this.total_shear]; };
    }
    push(matrix) {
        const topMatrix = this.stack[this.stack.length - 1];
        const newMatrix = topMatrix.mult(matrix);
        this.stack.push(newMatrix);
        this.total_translation = newMatrix.multVector(new Vector(0, 0, 1));
        let new_transform = [0, new Vector2D(1, 1), new Vector2D(0, 0)];
        this.total_stack.push(new_transform);
        return newMatrix;
    }
    pop() {
        if (this.stack.length > 1) {
            this.total_stack.pop();
            return this.stack.pop();
        }
        return Matrix3D.Identity;
    }
    resetStack() {
        this.stack = [Matrix3D.Identity];
    }
    getCurrentMatrix() {
        return this.stack[this.stack.length - 1];
    }
    static translation(x, y) {
        return new Matrix3D(new Vector3D(1, 0, 0), new Vector3D(0, 1, 0), new Vector3D(x, y, 1));
    }
    translate(x, y) {
        const translationMatrix = MatrixStack2D.translation(x, y);
        this.push(translationMatrix);
        return this;
    }
    static rotation(angle) {
        return new Matrix3D(new Vector3D(Math.cos(angle), Math.sin(angle), 0), new Vector3D(-Math.sin(angle), Math.cos(angle), 0), new Vector3D(0, 0, 1));
    }
    rotate(angle) {
        const rotationMatrix = MatrixStack2D.rotation(angle);
        this.push(rotationMatrix);
        this.total_rotation += angle;
        this.total_stack.last()[0] += angle;
        return this;
    }
    static rotationAround(angle, cx = 0, cy = 0) {
        const translationMatrixInv = MatrixStack2D.translation(-cx, -cy);
        const rotationMatrix = MatrixStack2D.rotation(angle);
        const translationMatrix = MatrixStack2D.translation(cx, cy);
        return translationMatrixInv.mult(rotationMatrix).mult(translationMatrix);
    }
    rotateAround(angle, cx = 0, cy = 0) {
        this.push(MatrixStack2D.rotationAround(angle, cx, cy));
        this.total_rotation += angle;
        this.total_stack.last()[0] += angle;
        return this;
    }
    static scaling(sx, sy) {
        return new Matrix3D(new Vector3D(sx, 0, 0), new Vector3D(0, sy, 0), new Vector3D(0, 0, 1));
    }
    scale(sx, sy) {
        const scalingMatrix = MatrixStack2D.scaling(sx, sy);
        this.push(scalingMatrix);
        this.total_scale.mult(sx, sy);
        this.total_stack.last()[1].mult(sx, sy);
        return this;
    }
    static shearing(sx = 0, sy = 0) {
        return new Matrix3D(new Vector3D(1 + sx * sy, sx, 0), new Vector3D(sy, 1, 0), new Vector3D(0, 0, 1));
    }
    shear(sx, sy) {
        const scalingMatrix = MatrixStack2D.shearing(sx, sy);
        this.push(scalingMatrix);
        this.total_shear.add(sx, sy);
        this.total_stack.last()[2].add(sx, sy);
        return this;
    }
    apply(v) {
        if (v.dim() < 3) {
            return this.last().multVector(new Vector3D(v.x ?? 0, v.y ?? 0, 1));
        }
        return this.last().multVector(v);
    }
}
export class MatrixStack3D extends MatrixStack {
    constructor() {
        super(Matrix4D.Identity);
    }
    push(matrix) {
        const topMatrix = this.stack[this.stack.length - 1];
        const newMatrix = topMatrix.mult(matrix);
        this.stack.push(newMatrix);
        return newMatrix;
    }
}
