var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dependencies/Code/WebGL/webglParser.ts
var webglParser_exports = {};
__export(webglParser_exports, {
  DetailedParser: () => DetailedParser
});
module.exports = __toCommonJS(webglParser_exports);

// src/dependencies/Code/Matrix/Matrix.mjs
var ObjList = class _ObjList {
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
      } else {
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
    return new _ObjList(vals);
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
    } else {
      for (let i = 0; i < this.values.length; i++) {
        newValues[i] = operator(this.values[i], comps[i]);
      }
    }
    return new _ObjList(newValues);
  }
  val() {
    if (!!this.lastReturnValues) {
      this.values = this.lastReturnValues;
    }
    return this;
  }
  set(...vals) {
    if (vals?.[0] instanceof _ObjList)
      vals = vals?.[0].values;
    for (let i = 0; i < vals.length; i++)
      if (typeof vals[i] == "number")
        this.values[i] = vals[i];
    if (this.updated && typeof this.updated == "function")
      this.updated(-1);
  }
  setVal(i, val) {
    this.values[i] = val;
    this.lastReturnValues = void 0;
    return this;
  }
  get(i) {
    return this.values[i];
  }
  clone(vec = this) {
    return new _ObjList(...vec.values);
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
};
var Vector = class _Vector extends ObjList {
  constructor(...coords) {
    super(...coords);
  }
  static Fill(dim, val) {
    let vals = [];
    for (let i = 0; i < dim; i++) {
      vals.push(val);
    }
    return new _Vector(vals);
  }
  static Zeros(n) {
    return _Vector.Fill(n, 0);
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
    return new this.getConstructor(...this.values.map((a) => a > 0.5 ? Math.sign(a) : 0));
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
};
var Vector2D = class _Vector2D extends Vector {
  static Identity = new _Vector2D(1, 1);
  static Zero = new _Vector2D(0, 0);
  static XAxis = new _Vector2D(1, 0);
  static YAxis = new _Vector2D(0, 1);
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
      return new _Vector2D(-this.y * vect.x, this.x * vect.y);
    } else {
      if (!vy && vy !== 0)
        return this;
      return new _Vector2D(-this.y * vx, this.x * vy);
    }
  }
  normalizedDot(vx, vy) {
    if (typeof vx === "object") {
      let vect = vx;
      return (-this.y * vect.x + this.x * vect.y) / (vx.dot(vx) * this.dot(this));
    } else {
      if (!vy && vy !== 0)
        return 0;
      return (-this.y * vx + this.x * vy) / (vx * vx + vy * vy + this.dot(this));
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
      v2arr.push(new _Vector2D(vs[i], vs[i + 1]));
    }
    return v2arr;
  }
  static fromRadiusAndAngle(r, ang) {
    return new _Vector2D(r * Math.cos(ang), r * Math.sin(ang));
  }
  getRadiusAndAngle() {
    return [Math.hypot(this.x, this.y), Math.atan2(this.y, this.x)];
  }
  [Symbol.hasInstance]() {
    return true;
  }
};
var Vector3D = class _Vector3D extends Vector {
  static Identity = new _Vector3D(1, 1, 1);
  static Zero = new _Vector3D(0, 0, 0);
  static UP = new _Vector3D(0, 1, 0);
  static DOWN = new _Vector3D(0, -1, 0);
  static LEFT = new _Vector3D(-1, 0, 0);
  static RIGHT = new _Vector3D(1, 0, 0);
  static FRONT = new _Vector3D(0, 0, 1);
  static BACK = new _Vector3D(0, 0, -1);
  constructor(x, y, z) {
    if (Array.isArray(x) && (y !== 0 && !y || z !== 0 && !z)) {
      z = x[2];
      y = x[1];
      x = x[0];
    }
    super(x, y, z);
  }
  static From(arr) {
    return new _Vector3D(arr[0], arr[1], arr[2]);
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
      return new _Vector3D(resultX, resultY, resultZ);
    } else if (typeof vx === "number" && typeof vy === "number" && typeof vz === "number") {
      const resultX = this.y * vz - this.z * vy;
      const resultY = this.z * vx - this.x * vz;
      const resultZ = this.x * vy - this.y * vx;
      return new _Vector3D(resultX, resultY, resultZ);
    } else {
      return this;
    }
  }
  toQuaternion(w = 0) {
    return new Quaternion(this.x, this.y, this.z, w);
  }
  clone() {
    return super.clone();
  }
};
var Quaternion = class _Quaternion extends Vector {
  static Identity = new _Quaternion(1, 0, 0, 0);
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
    return new _Quaternion(x, y, z, w);
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
    return new _Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
  }
  substract(q) {
    return new _Quaternion(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w);
  }
  conjugate() {
    return new _Quaternion(-this.x, -this.y, -this.z, this.w);
  }
  dot(q) {
    return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
  }
  normalize() {
    return super.normalize();
  }
  static rotateVector(point, rot = this, angle) {
    let p = point.toQuaternion();
    let rotation = rot;
    let sin = Math.sin(angle / 2);
    let cos = Math.cos(angle / 2);
    var r = new _Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
    r = r.normalize();
    let rCon = r.conjugate();
    let resultP = r.multiply(p).multiply(rCon);
    return resultP.toVector3D();
  }
  static getRotQuaternion(rot = this, angle) {
    let rotation = rot;
    let sin = Math.sin(angle / 2);
    let cos = Math.cos(angle / 2);
    var r = new _Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
    r = r.normalize();
    return r;
  }
  getPositivePolarForm() {
    if (this.w < 0) {
      let unitQ = this.normalize();
      return new _Quaternion(-unitQ.x, -unitQ.y, -unitQ.z, -unitQ.w);
    } else {
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
    } else {
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
    return new _Quaternion(x, y, z, w);
  }
};
var MatrixNM = class _MatrixNM {
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
    return new _MatrixNM(vecs);
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
    let maxSlice = new Array(minSize).fill(1).map((v, ti) => {
      return ti;
    });
    for (let i = 0; i < nMatrices; i++) {
      let nslice = new Array(minSize).fill(1).map((v, ti) => {
        return ti + i;
      });
      if (minSize == matrix.n) {
        rows = maxSlice;
        cols = nslice;
      } else {
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
    const L = _MatrixNM.Zeros(rows, cols);
    const U = _MatrixNM.Zeros(rows, cols);
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
    L.det = L.mulTrace;
    U.det = U.mulTrace;
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
      return this.vecs[0].values[0] * this.vecs[1].values[1] - this.vecs[0].values[1] * this.vecs[1].values[0];
    }
    const { L, U } = this.luDecomposition();
    return L.det() * U.det();
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
    for (let i = 0; i < mat.vecs?.[0]?.values.length || 0; i++) {
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
      vs[i] = new Vector(...nnums);
    }
    return new _MatrixNM(vs);
  }
  scale(n) {
    n = Math.sqrt(n);
    for (let i = 0; i < this.vecs.length; i++) {
      this.vecs[i]._ = this.vecs[i].multiplyScalar(n);
    }
    return this;
  }
  toArray() {
    return this.vecs.map((v) => v.vals).flat();
  }
  toFloat32() {
    return new Float32Array(this.toArray());
  }
  [Symbol.iterator]() {
    return this.vecs.map((a) => a.toString())[Symbol.iterator]();
  }
};
var MatrixNN = class _MatrixNN extends MatrixNM {
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
      vs[i] = new Vector(...nnums);
    }
    return new _MatrixNN(vs);
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
};
var Matrix2D = class _Matrix2D extends MatrixNN {
  vecs = [];
  static Identity = new _Matrix2D();
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
    if (v1 instanceof _Matrix2D) {
      this.vecs = [v1.vecs[0], v1.vecs[1]];
    } else {
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
    return new _Matrix2D(new Vector2D(cols[0].dot(rows[0]), cols[0].dot(rows[1])), new Vector2D(cols[1].dot(rows[0]), cols[1].dot(rows[1])));
  }
  rotate(angle) {
    return this.set(this.mult(_Matrix2D.fromRotation(angle)));
  }
  inverse() {
    let det = this.det();
    if (det == 0)
      det = Number.EPSILON;
    return _Matrix2D.fromValues([this.vecs[1].y / det, -this.vecs[0].y / det, -this.vecs[1].x / det, this.vecs[0].x / det]);
  }
  transpose() {
    return _Matrix2D.fromValues([this.vecs[0].x, this.vecs[1].x, this.vecs[0].y, this.vecs[1].y]);
  }
  adjugate() {
    return _Matrix2D.fromValues([this.vecs[1].y, -this.vecs[1].x, -this.vecs[0].y, this.vecs[0].x]);
  }
  static fromRotation(angle, scale = 1) {
    return new _Matrix2D(new Vector2D(Math.cos(angle) * scale, Math.sin(angle) * scale), new Vector2D(-Math.sin(angle) * scale, Math.cos(angle)));
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
    return new _Matrix2D(vs[0], vs[1]);
  }
  static rotMatrix(ang) {
    return _Matrix2D.fromValues([
      [Math.cos(ang), Math.sin(ang)],
      [Math.sin(-ang), Math.cos(ang)]
    ]);
  }
  static rotMatrixDeg(deg) {
    return _Matrix2D.rotMatrix(deg / 180 * Math.PI);
  }
  [Symbol.iterator]() {
    return this.vecs.map((a) => a.toString())[Symbol.iterator]();
  }
};
var Matrix3D = class _Matrix3D extends MatrixNN {
  vecs = [];
  static Identity = new _Matrix3D();
  constructor(v1 = new Vector3D(1, 0, 0), v2 = new Vector3D(0, 1, 0), v3 = new Vector3D(0, 0, 1)) {
    super([v1, v2, v3]);
    this.vecs = [v1, v2, v3];
  }
  set(v1, v2 = Vector3D.Zero, v3 = Vector3D.Zero) {
    if (v1 instanceof _Matrix3D) {
      this.vecs = [v1.vecs[0], v1.vecs[1], v1.vecs[2]];
    } else {
      this.vecs = [v1.clone(), v2.clone(), v3.clone()];
    }
    return this;
  }
  mult(mat) {
    return super.mult(mat);
  }
  rotate(phi, theta, psi) {
    return this.mult(_Matrix3D.fromRotation(phi, theta, psi));
  }
  static fromRotation(phi, theta, psi, scale = 1) {
    const phiRad = phi * Math.PI / 180;
    const thetaRad = theta * Math.PI / 180;
    const psiRad = psi * Math.PI / 180;
    const cosPhi = Math.cos(phiRad);
    const sinPhi = Math.sin(phiRad);
    const cosTheta = Math.cos(thetaRad);
    const sinTheta = Math.sin(thetaRad);
    const cosPsi = Math.cos(psiRad);
    const sinPsi = Math.sin(psiRad);
    const rotationMatrix = [
      new Vector3D(cosTheta * cosPsi * scale, cosPhi * sinPsi + sinPhi * sinTheta * cosPsi * scale, sinPhi * sinPsi - cosPhi * sinTheta * cosPsi),
      new Vector3D(-cosTheta * sinPsi * scale, cosPhi * cosPsi - sinPhi * sinTheta * sinPsi * scale, sinPhi * cosPsi + cosPhi * sinTheta * sinPsi),
      new Vector3D(sinTheta * scale, -sinPhi * cosTheta * scale, cosPhi * cosTheta)
    ];
    if (scale !== 1) {
      for (let i = 0; i < 9; i++) {
        rotationMatrix[i];
      }
    }
    return new _Matrix3D(...rotationMatrix);
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
    return new _Matrix3D(vs[0], vs[1], vs[2]);
  }
};
var Matrix4D = class _Matrix4D extends MatrixNN {
  vecs = [];
  static Identity = new _Matrix4D();
  constructor(v1 = new Quaternion(1, 0, 0, 0), v2 = new Quaternion(0, 1, 0, 0), v3 = new Quaternion(0, 0, 1, 0), v4 = new Quaternion(0, 0, 0, 1)) {
    super([v1, v2, v3, v4]);
    this.vecs = [v1, v2, v3, v4];
  }
  static createViewMatrix(cameraX, cameraY, cameraZ) {
    return new _Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(-cameraX, -cameraY, -cameraZ, 1));
  }
  static createProjectionMatrix(fov, aspectRatio, near, far) {
    const f = 1 / Math.tan(fov / 2 * Math.PI / 360);
    const rangeInv = 1 / (near - far);
    return new _Matrix4D(new Quaternion(f / aspectRatio, 0, 0, 0), new Quaternion(0, f, 0, 0), new Quaternion(0, 0, (far + near) * rangeInv, -1), new Quaternion(0, 0, 2 * far * near * rangeInv, 0));
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
    return new _Matrix4D(new Quaternion(t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0), new Quaternion(t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0), new Quaternion(t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0), new Quaternion(0, 0, 0, 1));
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
    return new _Matrix4D(new Quaternion(rx, ry, rz, 0), new Quaternion(uxAdjusted, uyAdjusted, uzAdjusted, 0), new Quaternion(-fx, -fy, -fz, 0), new Quaternion(-cx, -cy, -cz, 1));
  }
  static createRotationMatrixFromDirection(cameraDir, upDirection = new Vector3D(0, 1, 0)) {
    const cameraDirNormalized = cameraDir;
    const upDirNormalized = upDirection;
    const right = cameraDirNormalized.cross(upDirNormalized);
    const up = right.cross(cameraDirNormalized);
    return new _Matrix4D(new Quaternion(right.x, right.y, right.z, 0), new Quaternion(up.x, up.y, up.z, 0), new Quaternion(-cameraDirNormalized.x, -cameraDirNormalized.y, -cameraDirNormalized.z, 0), new Quaternion(0, 0, 0, 1));
  }
  static createCameraViewMatrix(cameraPosition, cameraDir, upDirection = new Vector3D(0, 1, 0)) {
    const [cx, cy, cz] = cameraPosition;
    let rotMatrix = _Matrix4D.createRotationMatrixFromDirection(cameraDir, upDirection);
    let translationMatrix = new _Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(cx, cy, cz, 0));
    let inverseTranslationMatrix = new _Matrix4D(new Quaternion(1, 0, 0, 0), new Quaternion(0, 1, 0, 0), new Quaternion(0, 0, 1, 0), new Quaternion(-cx, -cy, -cz, 0));
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
    return new _Matrix4D(new Quaternion(rx, uxAdj, -fx, 0), new Quaternion(ry, uyAdj, -fy, 0), new Quaternion(rz, uzAdj, -fz, 0), new Quaternion(-(rx * cx + ry * cy + rz * cz), -(uxAdj * cx + uyAdj * cy + uzAdj * cz), fx * cx + fy * cy + fz * cz, 1));
  }
  static createSnapLookAtMatrixFromDirection(cameraPosition, cameraDir, upDirection = [0, 1, 0]) {
    const EPS = 1e-6;
    const pos = Vector3D.From([...cameraPosition]);
    const dirToCenter = Vector3D.Zero.substract(pos).normalize();
    let camF = Vector3D.From([...cameraDir]).normalize();
    if (isNaN(camF.x) || Math.abs(camF.x) < EPS && Math.abs(camF.y) < EPS && Math.abs(camF.z) < EPS) {
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
    const lookAt = _Matrix4D.From([
      m00,
      m10,
      m20,
      0,
      m01,
      m11,
      m21,
      0,
      m02,
      m12,
      m22,
      0,
      0,
      0,
      0,
      1
    ]);
    return lookAt;
  }
  static createLookAt(eye, center, up) {
    const f = center.add(eye.multiplyScalar(-1)).normalize();
    const s = f.cross(up).normalize();
    const u = s.cross(f);
    return new _Matrix4D(new Quaternion(s.x, u.x, -f.x, 0), new Quaternion(s.y, u.y, -f.y, 0), new Quaternion(s.z, u.z, -f.z, 0), new Quaternion(-s.dot(eye), -u.dot(eye), f.dot(eye), 1));
  }
  multVector3d(v) {
    return Vector3D.From(super.multVector(new Quaternion(v.x, v.y, v.z, 1)).vals);
  }
  static From(arr) {
    return new _Matrix4D(new Quaternion(arr[0], arr[1], arr[2], arr[3]), new Quaternion(arr[4], arr[5], arr[6], arr[7]), new Quaternion(arr[8], arr[9], arr[10], arr[11]), new Quaternion(arr[12], arr[13], arr[14], arr[15]));
  }
};
var MatrixStack = class {
  stack;
  constructor(start2) {
    this.stack = [start2];
  }
  last() {
    if (this.stack.length == 0)
      return void 0;
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
};
var MatrixStack2D = class _MatrixStack2D extends MatrixStack {
  total_rotation = 0;
  total_scale = new Vector2D(1, 1);
  total_shear = new Vector2D(0, 0);
  total_translation = new Vector2D(0, 0);
  total_stack = [];
  constructor() {
    super(Matrix3D.Identity);
    this.total_stack.last = () => {
      return this.total_stack[this.total_stack.length - 1];
    };
    this.total_stack.first = () => {
      return this.total_stack[0];
    };
    this.total_stack.total = () => {
      return [this.total_rotation, this.total_scale, this.total_shear];
    };
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
    const translationMatrix = _MatrixStack2D.translation(x, y);
    this.push(translationMatrix);
    return this;
  }
  static rotation(angle) {
    return new Matrix3D(new Vector3D(Math.cos(angle), Math.sin(angle), 0), new Vector3D(-Math.sin(angle), Math.cos(angle), 0), new Vector3D(0, 0, 1));
  }
  rotate(angle) {
    const rotationMatrix = _MatrixStack2D.rotation(angle);
    this.push(rotationMatrix);
    this.total_rotation += angle;
    this.total_stack.last()[0] += angle;
    return this;
  }
  static rotationAround(angle, cx = 0, cy = 0) {
    const translationMatrixInv = _MatrixStack2D.translation(-cx, -cy);
    const rotationMatrix = _MatrixStack2D.rotation(angle);
    const translationMatrix = _MatrixStack2D.translation(cx, cy);
    return translationMatrixInv.mult(rotationMatrix).mult(translationMatrix);
  }
  rotateAround(angle, cx = 0, cy = 0) {
    this.push(_MatrixStack2D.rotationAround(angle, cx, cy));
    this.total_rotation += angle;
    this.total_stack.last()[0] += angle;
    return this;
  }
  static scaling(sx, sy) {
    return new Matrix3D(new Vector3D(sx, 0, 0), new Vector3D(0, sy, 0), new Vector3D(0, 0, 1));
  }
  scale(sx, sy) {
    const scalingMatrix = _MatrixStack2D.scaling(sx, sy);
    this.push(scalingMatrix);
    this.total_scale.mult(sx, sy);
    this.total_stack.last()[1].mult(sx, sy);
    return this;
  }
  static shearing(sx = 0, sy = 0) {
    return new Matrix3D(new Vector3D(1 + sx * sy, sx, 0), new Vector3D(sy, 1, 0), new Vector3D(0, 0, 1));
  }
  shear(sx, sy) {
    const scalingMatrix = _MatrixStack2D.shearing(sx, sy);
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
};

// src/dependencies/Code/Game/Game.js
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var _a;
var _b;
var _c;
var H = 720;
var W = 1080;
if (typeof window === "undefined") {
  globalThis.window = {};
}
if (typeof document === "undefined") {
  globalThis.document = {
    createElement: () => ({}),
    getElementById: () => null,
    querySelector: () => null
  };
}
var GameObject = class _GameObject {
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
    var _a2, _b2;
    if (!sc)
      return this.position;
    let applyPos = (sc instanceof Scene ? sc.stack : sc).apply(this.pos);
    let zoom = 1;
    if (sc instanceof Scene && ((_a2 = sc === null || sc === void 0 ? void 0 : sc.cam) === null || _a2 === void 0 ? void 0 : _a2.zoom) !== void 0) {
      zoom = (_b2 = sc === null || sc === void 0 ? void 0 : sc.cam) === null || _b2 === void 0 ? void 0 : _b2.zoom;
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
    var _a2;
    (_a2 = this === null || this === void 0 ? void 0 : this.extratick) === null || _a2 === void 0 ? void 0 : _a2.call(this, dt);
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
      if (o instanceof _GameObject) {
        let pos = o.getPosition(sc);
        let r = Math.hypot(x - pos[0], y - pos[1]);
        return r < radius;
      } else {
        return false;
      }
    }, void 0);
  }
  distanceTo(obj) {
    if (!obj)
      return Infinity;
    return Math.hypot(this.x - obj.x, this.y - obj.y);
  }
};
var Polygon = class _Polygon {
  constructor(...vs) {
    this.lines = [];
    this.type = _Polygon.PolygonType;
    this.pos = void 0;
    this.r = void 0;
    let vecs = [];
    if (Array.isArray(vs) && !(vs[0] instanceof Vector))
      vecs = vs.flat();
    else if (Array.isArray(vs)) {
      let numarr = vs.flat().map((v) => [v.x, v.y]);
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
    let circlePol = new _Polygon([x, y, r, r]);
    circlePol.type = _Polygon.CircleType;
    circlePol.pos = [x, y];
    circlePol.r = r;
  }
};
Polygon.CircleType = "Circle";
Polygon.EllipseType = "Ellipse";
Polygon.PolygonType = "Polygon";
var ImgLoader = class _ImgLoader {
  static load(url, w, h) {
    return _ImgLoader.loadImage(url, w, h);
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
    if (_ImgLoader.enableCors) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      var _a2, _b2;
      img.loaded = true;
      if (typeof img.next == "function") {
        (_b2 = (_a2 = img).next) === null || _b2 === void 0 ? void 0 : _b2.call(_a2);
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
          if (_ImgLoader.enableCors) {
            timg.crossOrigin = "anonymous";
          }
        });
      } else {
        let timg = this.loadImage(u);
        if (_ImgLoader.enableCors) {
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
          if (_ImgLoader.enableCors) {
            timg.crossOrigin = "anonymous";
          }
          if (timg)
            imgs.push(timg);
        });
      } else {
        let timg = this.loadImage(dir + u);
        if (_ImgLoader.enableCors) {
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
    return values.map((val) => preffix + val + suffix);
  }
  static join(...imgs) {
    let allloaded = true;
    let wtot = 0;
    let maxh = 10;
    let maxoffy = 0;
    imgs.forEach((ec2) => {
      var _a2, _b2;
      let offx = 0, offy = 0;
      if (Array.isArray(ec2)) {
        offx = (_a2 = ec2[1]) !== null && _a2 !== void 0 ? _a2 : 0;
        offy = (_b2 = ec2[2]) !== null && _b2 !== void 0 ? _b2 : 0;
        ec2 = ec2[0];
      }
      ;
      if (!(ec2 === null || ec2 === void 0 ? void 0 : ec2.loaded))
        allloaded = false;
      wtot += (ec2 === null || ec2 === void 0 ? void 0 : ec2.w) + offx;
      if ((ec2 === null || ec2 === void 0 ? void 0 : ec2.h) > maxh) {
        maxh = ec2.h;
      }
      if (offy < 0 && offy < maxoffy) {
        maxoffy = offy;
      }
      ;
    });
    maxh += Math.abs(maxoffy) * 2;
    if (!allloaded)
      return void 0;
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
      var _a2, _b2;
      newimg.loaded = true;
      if (typeof newimg.next == "function") {
        (_b2 = (_a2 = newimg).next) === null || _b2 === void 0 ? void 0 : _b2.call(_a2);
      }
    };
    return newimg;
  }
  static applyFilter(img, r, g, b, w, h) {
    let apply = function() {
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
        src[i] = ~~Math.min(r * src[i] / 255, 255);
        src[i + 1] = ~~Math.min(g * src[i + 1] / 255, 255);
        src[i + 2] = ~~Math.min(b * src[i + 2] / 255, 255);
      }
      context.putImageData(sourceImageData, 0, 0);
      img.src = canvas.toDataURL();
      img.onload = () => {
        var _a2, _b2;
        img.loaded = true;
        if (typeof img.next == "function" && img.next !== apply) {
          (_b2 = (_a2 = img).next) === null || _b2 === void 0 ? void 0 : _b2.call(_a2);
        }
      };
    };
    if (!img.loaded) {
      img.next = apply;
    } else {
      apply();
    }
  }
  static fromCanvasOrBitmap(source, w, h) {
    return __awaiter(this, void 0, void 0, function* () {
      let blob;
      if (source instanceof HTMLCanvasElement) {
        blob = yield new Promise((res) => source.toBlob(res));
      } else if (source instanceof ImageBitmap) {
        const tmp = document.createElement("canvas");
        tmp.width = source.width;
        tmp.height = source.height;
        const ctx = tmp.getContext("2d");
        if (!ctx)
          throw new Error("No se pudo crear contexto 2D");
        ctx.drawImage(source, 0, 0);
        blob = yield new Promise((res) => tmp.toBlob(res));
      } else {
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
};
ImgLoader.enableCors = false;
ImgLoader.subimg = ImgLoader.subimage = ImgLoader.cut = ImgLoader.cutimg = ImgLoader.cutImage = (img, x, y, w, h) => {
  if (!img)
    return;
  let canvas2 = document.createElement("canvas");
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
    var _a2, _b2, _d, _e;
    if (Array.isArray(u) && isNaN(u[0])) {
      if (!u)
        return;
      u.forEach((ur) => {
        var _a3, _b3, _d2, _e2;
        if (!ur)
          return;
        let timg = ImgLoader.cut(img, (_a3 = ur.x) !== null && _a3 !== void 0 ? _a3 : ur[0], (_b3 = ur.y) !== null && _b3 !== void 0 ? _b3 : ur[1], (_d2 = ur.w) !== null && _d2 !== void 0 ? _d2 : ur[2], (_e2 = ur.h) !== null && _e2 !== void 0 ? _e2 : ur[3]);
        if (timg)
          timgs.push(timg);
      });
    } else {
      let timg = ImgLoader.cut(img, (_a2 = u.x) !== null && _a2 !== void 0 ? _a2 : u[0], (_b2 = u.y) !== null && _b2 !== void 0 ? _b2 : u[1], (_d = u.w) !== null && _d !== void 0 ? _d : u[2], (_e = u.h) !== null && _e !== void 0 ? _e : u[3]);
      if (timg)
        timgs.push(timg);
    }
  });
  return timgs;
};
var Camera2D = class extends GameObject {
  constructor(x, y, w, h, zoom = 1) {
    super(x, y, w, h);
    this.zoom = zoom;
    this.obj = this;
    this.calculateTransformMatrix();
  }
  calculateTransformMatrix() {
    var _a2, _b2, _d, _e, _f, _g;
    let z = this.zoom > 0 ? this.zoom : -1 / this.zoom;
    let px = this.obj.pos.x;
    let py = this.obj.pos.y;
    let offzx = ((_d = (_b2 = (_a2 = this.zoomCenter) === null || _a2 === void 0 ? void 0 : _a2.pos) === null || _b2 === void 0 ? void 0 : _b2.x) !== null && _d !== void 0 ? _d : 0) - W / 2;
    let offzy = ((_g = (_f = (_e = this.zoomCenter) === null || _e === void 0 ? void 0 : _e.pos) === null || _f === void 0 ? void 0 : _f.y) !== null && _g !== void 0 ? _g : 0) - H / 2;
    if (this.obj !== this) {
      px += this.x;
      py += this.y;
    }
    let transformMatrix = MatrixStack2D.translation(-px - offzx, -py - offzy).mult(MatrixStack2D.translation(-W / 2, -H / 2)).mult(MatrixStack2D.rotation(this.rotation)).mult(MatrixStack2D.scaling(z, z)).mult(MatrixStack2D.translation(W / 2 + offzx, H / 2 + offzy));
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
      this.zoomCenter = void 0;
    this.zoomCenter = obj;
    return this;
  }
};
var ObjectManager = class {
  constructor(objs = []) {
    this.ManagerFilter = void 0;
    this.objs = objs;
  }
  add(...objs) {
    for (let i = 0; i < objs.length; i++) {
      this.objs.push(objs[i]);
    }
  }
  func(name, ...args) {
    var _a2;
    for (let i = 0; i < this.objs.length; i++) {
      const obj = this.objs[i];
      (_a2 = obj === null || obj === void 0 ? void 0 : obj[name]) === null || _a2 === void 0 ? void 0 : _a2.call(obj, ...args);
    }
  }
  filterObjects(filter) {
    let retObjs = this.objs.filter(filter);
    if (!!this.ManagerFilter) {
      return retObjs.filter(this.ManagerFilter);
    }
    return retObjs;
  }
};
var Layer = class extends ObjectManager {
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
    var _a2, _b2;
    this.canvas.ctx.lastDrawnLayer = this;
    (_a2 = this === null || this === void 0 ? void 0 : this.preExtraDraw) === null || _a2 === void 0 ? void 0 : _a2.call(this, this.canvas.ctx, ...args);
    this.func("draw", this.canvas.ctx, ...args);
    (_b2 = this === null || this === void 0 ? void 0 : this.posExtraDraw) === null || _b2 === void 0 ? void 0 : _b2.call(this, this.canvas.ctx, ...args);
  }
  tick(...args) {
    var _a2, _b2;
    this.canvas.ctx;
    (_a2 = this === null || this === void 0 ? void 0 : this.preExtraTick) === null || _a2 === void 0 ? void 0 : _a2.call(this, ...args);
    this.func("tick", ...args);
    (_b2 = this === null || this === void 0 ? void 0 : this.posExtraTick) === null || _b2 === void 0 ? void 0 : _b2.call(this, ...args);
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
      } else if (obj instanceof ObjectGroup) {
        retObjs.push(...obj.findObjects(filter, conditions));
      }
    }
    return retObjs;
  }
};
var ObjectGroup = class _ObjectGroup extends ObjectManager {
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
    let group = new _ObjectGroup(`(${length}) ObjGroup`, layer);
  }
};
var Scene = class extends ObjectManager {
  constructor(objs = [], cam = new Camera2D(0, 0, 1)) {
    super(objs);
    this.cam = cam;
    this.stack = new MatrixStack2D();
    this.uuid = generateUUID();
    this.ManagerFilter = void 0;
  }
  setMatrixStack(stack) {
    this.stack = stack;
    return this;
  }
  addLayer(lay) {
    super.add(lay);
  }
  getLayer(n) {
    var _a2;
    return ((_a2 = this === null || this === void 0 ? void 0 : this.objs) === null || _a2 === void 0 ? void 0 : _a2[n]) || void 0;
  }
  getLastLayer() {
    var _a2, _b2;
    return ((_a2 = this === null || this === void 0 ? void 0 : this.objs) === null || _a2 === void 0 ? void 0 : _a2[(((_b2 = this === null || this === void 0 ? void 0 : this.objs) === null || _b2 === void 0 ? void 0 : _b2.length) || 1) - 1]) || void 0;
  }
  getFirstLayer() {
    var _a2;
    return ((_a2 = this === null || this === void 0 ? void 0 : this.objs) === null || _a2 === void 0 ? void 0 : _a2[0]) || void 0;
  }
  add(layer = 0, ...objs) {
    var _a2;
    let lay = layer;
    if (!objs)
      objs = [];
    if (layer instanceof Layer)
      lay = this.objs.indexOf(layer);
    else if (typeof layer !== "number") {
      (_a2 = objs === null || objs === void 0 ? void 0 : objs.push) === null || _a2 === void 0 ? void 0 : _a2.call(objs, layer);
      lay = 0;
    }
    this.objs[lay].add(...objs);
    return this;
  }
  draw(...args) {
    var _a2, _b2;
    (_a2 = this === null || this === void 0 ? void 0 : this.preExtraDraw) === null || _a2 === void 0 ? void 0 : _a2.call(this, ...args);
    this.func("draw", ...args);
    (_b2 = this === null || this === void 0 ? void 0 : this.posExtraDraw) === null || _b2 === void 0 ? void 0 : _b2.call(this, ...args);
  }
  tick(...args) {
    this.func("tick", ...args);
  }
  setCamera2D(cam = this.cam || new Camera2D(0, 0, 10, 10)) {
    this.cam = cam;
    return this;
  }
  funcLayers(name, ...args) {
    var _a2;
    for (let i = 0; i < this.objs.length; i++) {
      const obj = this.objs[i];
      (_a2 = obj === null || obj === void 0 ? void 0 : obj.func) === null || _a2 === void 0 ? void 0 : _a2.call(obj, name, ...args);
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
};
Scene.sc = new Scene();
var keypress = {
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
  none: false
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
Object.defineProperty(keypress, "space", {
  get: function() {
    return keypress[" "];
  }
});
Object.defineProperty(keypress, "Backspace", {
  get: function() {
    return keypress["backspace"];
  }
});
Object.defineProperty(keypress, "Enter", {
  get: function() {
    return keypress["enter"];
  }
});
var KeyManager = class {
  static presscb(e) {
    var _a2;
    for (let i = 0; i < this.presscbs.length; i++) {
      const cb = this.presscbs[i];
      if (!!cb && cb.key !== void 0 && cb.key.toLowerCase() == e.key.toLowerCase() && cb.cb !== void 0 && typeof cb.cb == "function") {
        (_a2 = cb.cb) === null || _a2 === void 0 ? void 0 : _a2.call(cb, e);
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
};
_c = KeyManager;
KeyManager.keypress = keypress;
KeyManager.detectKeys = (keys = keypress) => {
  var _a2, _b2, _d, _e;
  let space;
  if (!keys || keys.detected === true)
    return;
  keys.detected = true;
  let pressfun = (e) => {
    var _a3;
    keys[e.key.toLowerCase()] = true;
    if (_c.presscb)
      (_a3 = _c.presscb) === null || _a3 === void 0 ? void 0 : _a3.call(_c, e);
  };
  (_a2 = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _a2 === void 0 ? void 0 : _a2.call(window, "keydown", pressfun);
  (_b2 = window === null || window === void 0 ? void 0 : window.addEventListener) === null || _b2 === void 0 ? void 0 : _b2.call(window, "keyup", (e) => {
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
    if (e.code === "ShiftRight") {
      keypress["ShiftRight"] = true;
    } else if (e.code === "ShiftLeft") {
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
    if (e.code === "ShiftRight") {
      keypress["ShiftRight"] = false;
    } else if (e.code === "ShiftLeft") {
      keypress["ShiftLeft"] = false;
    }
  });
};
KeyManager.presscbs = [];
keypress.listen = () => {
  KeyManager.detectKeys(keypress);
};
var mousepos = { x: 0, y: 0, lastid: "" };
var mouseposes = [];
var mouseclick = [false, false, false];
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
var getElementFromIdOrElement = (id) => {
  let element;
  if (typeof id == "string")
    element = document.getElementById(id);
  if (!(element instanceof HTMLElement))
    return;
  return element;
};
var mousemove = (e, ic, id) => {
  var _a2, _b2, _d, _e, _f, _g, _h, _j, _k;
  if (!ic)
    return;
  let canvas = id;
  if (typeof id == "string")
    canvas = document.getElementById(id);
  if (!(canvas instanceof HTMLElement))
    return;
  const pos = (_d = (_b2 = (_a2 = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a2 === void 0 ? void 0 : _a2.getBoundingClientRect) === null || _b2 === void 0 ? void 0 : _b2.call(_a2)) !== null && _d !== void 0 ? _d : { left: parseInt(canvas.style.marginLeft.substring(0, canvas.style.marginLeft.length - 2)), top: 0 };
  let x, y;
  let x2m, y2m;
  if (e.touches && e.touches.length > 0) {
    x = (_e = e.touches[0].clientX - pos.left) !== null && _e !== void 0 ? _e : e.touches[0].screenX;
    y = (_f = e.touches[0].clientY - pos.top) !== null && _f !== void 0 ? _f : e.touches[0].screenY;
    for (let i = 0; i < e.touches.length; i++) {
      x2m = (_g = e.touches[i].clientX - pos.left) !== null && _g !== void 0 ? _g : e.touches[i].screenX;
      y2m = (_h = e.touches[i].clientY - pos.top) !== null && _h !== void 0 ? _h : e.touches[i].screenY;
      if (!mouseposes[e.touches[i].identifier]) {
        mouseposes[e.touches[i].identifier] = { x: 0, y: 0, lastid: "" };
      }
      mouseposes[e.touches[i].identifier].x = x2m;
      mouseposes[e.touches[i].identifier].y = y2m;
      calculatemousepos(x2m, y2m, id, mouseposes[e.touches[i].identifier]);
      mouseclick[e.touches[i].identifier] = true;
    }
  } else {
    x = (_j = e.clientX - pos.left) !== null && _j !== void 0 ? _j : e.offsetX;
    y = (_k = e.clientY - pos.top) !== null && _k !== void 0 ? _k : e.offsetY;
  }
  calculatemousepos(x, y, id);
};
function isFullScreen() {
  return window.fullScreen || (window === null || window === void 0 ? void 0 : window.innerWidth) == screen.width && (window === null || window === void 0 ? void 0 : window.innerHeight) == screen.height;
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
  var _a2, _b2;
  let can = getElementFromIdOrElement(canvasid);
  if (!can || !window)
    return;
  let stylew;
  let styleh;
  let boundingBox = (_b2 = (_a2 = can === null || can === void 0 ? void 0 : can.getBoundingClientRect) === null || _a2 === void 0 ? void 0 : _a2.call(can)) !== null && _b2 !== void 0 ? _b2 : { left: parseInt(can.style.marginLeft.substring(0, can.style.marginLeft.length - 2)), top: 0 };
  stylew = can.getBoundingClientRect().width;
  styleh = can.getBoundingClientRect().height;
  if (!isFullScreen()) {
  } else {
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
function openFullscreen(canv) {
  if (canv.requestFullscreen) {
    canv.requestFullscreen();
  } else if (canv.webkitRequestFullscreen) {
    canv.webkitRequestFullscreen();
  } else if (canv.msRequestFullscreen) {
    canv.msRequestFullscreen();
  }
}
function generateUUID() {
  const hex = [];
  for (let i = 0; i < 256; i++) {
    hex[i] = (i < 16 ? "0" : "") + i.toString(16);
  }
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  buffer[6] = buffer[6] & 15 | 64;
  buffer[8] = buffer[8] & 63 | 128;
  return hex[buffer[0]] + hex[buffer[1]] + hex[buffer[2]] + hex[buffer[3]] + "-" + hex[buffer[4]] + hex[buffer[5]] + "-" + hex[buffer[6]] + hex[buffer[7]] + "-" + hex[buffer[8]] + hex[buffer[9]] + "-" + hex[buffer[10]] + hex[buffer[11]] + hex[buffer[12]] + hex[buffer[13]] + hex[buffer[14]] + hex[buffer[15]];
}

// src/dependencies/Code/Matrix/Matrix.js
var ObjList2 = class _ObjList {
  constructor(...coords) {
    this.clase = this;
    let vals = [];
    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      if (Array.isArray(coord)) {
        for (let j = 0; j < coord.length; j++) {
          const c = coord[j];
          vals.push(c);
        }
      } else {
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
    return new _ObjList(vals);
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
    } else {
      for (let i = 0; i < this.values.length; i++) {
        newValues[i] = operator(this.values[i], comps[i]);
      }
    }
    return new _ObjList(newValues);
  }
  val() {
    if (!!this.lastReturnValues) {
      this.values = this.lastReturnValues;
    }
    return this;
  }
  set(...vals) {
    if ((vals === null || vals === void 0 ? void 0 : vals[0]) instanceof _ObjList)
      vals = vals === null || vals === void 0 ? void 0 : vals[0].values;
    for (let i = 0; i < vals.length; i++)
      if (typeof vals[i] == "number")
        this.values[i] = vals[i];
    if (this.updated && typeof this.updated == "function")
      this.updated(-1);
  }
  setVal(i, val) {
    this.values[i] = val;
    this.lastReturnValues = void 0;
    return this;
  }
  get(i) {
    return this.values[i];
  }
  clone(vec = this) {
    return new _ObjList(...vec.values);
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
};
var Vector2 = class _Vector extends ObjList2 {
  constructor(...coords) {
    super(...coords);
  }
  static Fill(dim, val) {
    let vals = [];
    for (let i = 0; i < dim; i++) {
      vals.push(val);
    }
    return new _Vector(vals);
  }
  static Zeros(n) {
    return _Vector.Fill(n, 0);
  }
  dim() {
    return this.values.length;
  }
  get vals() {
    return this.values;
  }
  equals(v, forced = false) {
    var _a2;
    if (forced && v.values.length !== (v === null || v === void 0 ? void 0 : v.values.length))
      return false;
    for (let i = 0; i < Math.min(this.values.length, (_a2 = v === null || v === void 0 ? void 0 : v.values) === null || _a2 === void 0 ? void 0 : _a2.length); i++) {
      if (this.values[i] !== (v === null || v === void 0 ? void 0 : v.values[i]))
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
    return new this.getConstructor(...this.values.map((a) => a > 0.5 ? Math.sign(a) : 0));
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
};
var Vector2D2 = class _Vector2D extends Vector2 {
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
      return new _Vector2D(-this.y * vect.x, this.x * vect.y);
    } else {
      if (!vy && vy !== 0)
        return this;
      return new _Vector2D(-this.y * vx, this.x * vy);
    }
  }
  normalizedDot(vx, vy) {
    if (typeof vx === "object") {
      let vect = vx;
      return (-this.y * vect.x + this.x * vect.y) / (vx.dot(vx) * this.dot(this));
    } else {
      if (!vy && vy !== 0)
        return 0;
      return (-this.y * vx + this.x * vy) / (vx * vx + vy * vy + this.dot(this));
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
      v2arr.push(new _Vector2D(vs[i], vs[i + 1]));
    }
    return v2arr;
  }
  static fromRadiusAndAngle(r, ang) {
    return new _Vector2D(r * Math.cos(ang), r * Math.sin(ang));
  }
  getRadiusAndAngle() {
    return [Math.hypot(this.x, this.y), Math.atan2(this.y, this.x)];
  }
  [Symbol.hasInstance]() {
    return true;
  }
};
Vector2D2.Identity = new Vector2D2(1, 1);
Vector2D2.Zero = new Vector2D2(0, 0);
Vector2D2.XAxis = new Vector2D2(1, 0);
Vector2D2.YAxis = new Vector2D2(0, 1);
var Vector3D2 = class _Vector3D extends Vector2 {
  constructor(x, y, z) {
    if (Array.isArray(x) && (y !== 0 && !y || z !== 0 && !z)) {
      z = x[2];
      y = x[1];
      x = x[0];
    }
    super(x, y, z);
  }
  static From(arr) {
    return new _Vector3D(arr[0], arr[1], arr[2]);
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
      return new _Vector3D(resultX, resultY, resultZ);
    } else if (typeof vx === "number" && typeof vy === "number" && typeof vz === "number") {
      const resultX = this.y * vz - this.z * vy;
      const resultY = this.z * vx - this.x * vz;
      const resultZ = this.x * vy - this.y * vx;
      return new _Vector3D(resultX, resultY, resultZ);
    } else {
      return this;
    }
  }
  toQuaternion(w = 0) {
    return new Quaternion2(this.x, this.y, this.z, w);
  }
  clone() {
    return super.clone();
  }
};
Vector3D2.Identity = new Vector3D2(1, 1, 1);
Vector3D2.Zero = new Vector3D2(0, 0, 0);
Vector3D2.UP = new Vector3D2(0, 1, 0);
Vector3D2.DOWN = new Vector3D2(0, -1, 0);
Vector3D2.LEFT = new Vector3D2(-1, 0, 0);
Vector3D2.RIGHT = new Vector3D2(1, 0, 0);
Vector3D2.FRONT = new Vector3D2(0, 0, 1);
Vector3D2.BACK = new Vector3D2(0, 0, -1);
var Quaternion2 = class _Quaternion extends Vector2 {
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
    return new _Quaternion(x, y, z, w);
  }
  toVector3D() {
    return new Vector3D2(this.x, this.y, this.z);
  }
  toVector() {
    return new Vector3D2(this.x, this.y, this.z);
  }
  getScalar() {
    return this.w;
  }
  add(q) {
    return new _Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
  }
  substract(q) {
    return new _Quaternion(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w);
  }
  conjugate() {
    return new _Quaternion(-this.x, -this.y, -this.z, this.w);
  }
  dot(q) {
    return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
  }
  normalize() {
    return super.normalize();
  }
  static rotateVector(point, rot = this, angle) {
    let p = point.toQuaternion();
    let rotation = rot;
    let sin = Math.sin(angle / 2);
    let cos = Math.cos(angle / 2);
    var r = new _Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
    r = r.normalize();
    let rCon = r.conjugate();
    let resultP = r.multiply(p).multiply(rCon);
    return resultP.toVector3D();
  }
  static getRotQuaternion(rot = this, angle) {
    let rotation = rot;
    let sin = Math.sin(angle / 2);
    let cos = Math.cos(angle / 2);
    var r = new _Quaternion((rotation.x || 0) * sin, (rotation.y || 0) * sin, (rotation.z || 0) * sin, cos);
    r = r.normalize();
    return r;
  }
  getPositivePolarForm() {
    if (this.w < 0) {
      let unitQ = this.normalize();
      return new _Quaternion(-unitQ.x, -unitQ.y, -unitQ.z, -unitQ.w);
    } else {
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
    } else {
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
    return new _Quaternion(x, y, z, w);
  }
};
Quaternion2.Identity = new Quaternion2(1, 0, 0, 0);
var MatrixNM2 = class _MatrixNM {
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
      vecs.push(Vector2.Zeros(n));
    }
    return new _MatrixNM(vecs);
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
        subVectors.push(new Vector2(subValues));
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
    let maxSlice = new Array(minSize).fill(1).map((v, ti) => {
      return ti;
    });
    for (let i = 0; i < nMatrices; i++) {
      let nslice = new Array(minSize).fill(1).map((v, ti) => {
        return ti + i;
      });
      if (minSize == matrix.n) {
        rows = maxSlice;
        cols = nslice;
      } else {
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
    const L = _MatrixNM.Zeros(rows, cols);
    const U = _MatrixNM.Zeros(rows, cols);
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
    L.det = L.mulTrace;
    U.det = U.mulTrace;
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
      return this.vecs[0].values[0] * this.vecs[1].values[1] - this.vecs[0].values[1] * this.vecs[1].values[0];
    }
    const { L, U } = this.luDecomposition();
    return L.det() * U.det();
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
    var _a2, _b2, _c2, _d;
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
    for (let i = 0; i < ((_b2 = (_a2 = mat.vecs) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b2 === void 0 ? void 0 : _b2.values.length) || 0; i++) {
      for (let j = 0; j < mat.vecs.length; j++) {
        txt += mat.vecs[j].values[i] + "";
        if (j !== mat.vecs.length - 1) {
          txt += " & ";
        }
      }
      if (i !== ((_d = (_c2 = mat.vecs) === null || _c2 === void 0 ? void 0 : _c2[0]) === null || _d === void 0 ? void 0 : _d.values.length) - 1) {
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
      rows.push(new Vector2(...rowData));
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
      newCols.push(new Vector2(newColValues));
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
      vs[i] = new Vector2(...nnums);
    }
    return new _MatrixNM(vs);
  }
  scale(n) {
    n = Math.sqrt(n);
    for (let i = 0; i < this.vecs.length; i++) {
      this.vecs[i]._ = this.vecs[i].multiplyScalar(n);
    }
    return this;
  }
  toArray() {
    return this.vecs.map((v) => v.vals).flat();
  }
  toFloat32() {
    return new Float32Array(this.toArray());
  }
  [Symbol.iterator]() {
    return this.vecs.map((a) => a.toString())[Symbol.iterator]();
  }
};
var MatrixNN2 = class _MatrixNN extends MatrixNM2 {
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
      rowVecs.push(new Vector2(tRow));
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
      vs[i] = new Vector2(...nnums);
    }
    return new _MatrixNN(vs);
  }
  transpose() {
    let vecs = new Array(this.n);
    for (let i = 0; i < this.n; i++) {
      vecs[i] = new Vector2(new Array(this.n));
      for (let j = 0; j < this.n; j++) {
        vecs[i].vals[j] = this.get(j, i);
      }
    }
    return new this.getConstructor(...vecs);
  }
};
var Matrix2D2 = class _Matrix2D extends MatrixNN2 {
  constructor(v1 = new Vector2D2(1, 0), v2 = new Vector2D2(0, 1)) {
    super([v1, v2]);
    this.vecs = [];
    this.vecs = [v1, v2];
  }
  determinant() {
    return this.vecs[0].x * this.vecs[1].y - this.vecs[0].y * this.vecs[1].x;
  }
  det() {
    return this.determinant();
  }
  set(v1, v2 = Vector2D2.Zero) {
    if (v1 instanceof _Matrix2D) {
      this.vecs = [v1.vecs[0], v1.vecs[1]];
    } else {
      this.vecs = [v1.clone(), v2.clone()];
    }
    return this;
  }
  rows() {
    return [new Vector2D2(this.vecs[0].x, this.vecs[1].x), new Vector2D2(this.vecs[0].y, this.vecs[1].y)];
  }
  mult(mat) {
    let rows = mat.rows();
    let cols = this.vecs;
    return new _Matrix2D(new Vector2D2(cols[0].dot(rows[0]), cols[0].dot(rows[1])), new Vector2D2(cols[1].dot(rows[0]), cols[1].dot(rows[1])));
  }
  rotate(angle) {
    return this.set(this.mult(_Matrix2D.fromRotation(angle)));
  }
  inverse() {
    let det = this.det();
    if (det == 0)
      det = Number.EPSILON;
    return _Matrix2D.fromValues([this.vecs[1].y / det, -this.vecs[0].y / det, -this.vecs[1].x / det, this.vecs[0].x / det]);
  }
  transpose() {
    return _Matrix2D.fromValues([this.vecs[0].x, this.vecs[1].x, this.vecs[0].y, this.vecs[1].y]);
  }
  adjugate() {
    return _Matrix2D.fromValues([this.vecs[1].y, -this.vecs[1].x, -this.vecs[0].y, this.vecs[0].x]);
  }
  static fromRotation(angle, scale = 1) {
    return new _Matrix2D(new Vector2D2(Math.cos(angle) * scale, Math.sin(angle) * scale), new Vector2D2(-Math.sin(angle) * scale, Math.cos(angle)));
  }
  toString() {
    return `${this.vecs[0].x}, ${this.vecs[0].y} \\\\ ${this.vecs[1].x}, ${this.vecs[1].y}`;
  }
  toArrayString() {
    return `[${this.vecs[0].x}, ${this.vecs[0].y}, ${this.vecs[1].x}, ${this.vecs[1].y}]`;
  }
  equals(m) {
    var _a2, _b2;
    return this.vecs[0].equals((_a2 = m === null || m === void 0 ? void 0 : m.vecs) === null || _a2 === void 0 ? void 0 : _a2[0]) && this.vecs[1].equals((_b2 = m === null || m === void 0 ? void 0 : m.vecs) === null || _b2 === void 0 ? void 0 : _b2[1]);
  }
  static fromValues(nums) {
    nums = nums.flat();
    let vs = [];
    for (let i = 0; i < 2; i++) {
      let nnums = [];
      for (let j = 0; j < 2; j++) {
        nnums.push(nums[i * 2 + j]);
      }
      vs[i] = new Vector2D2(...nnums);
    }
    return new _Matrix2D(vs[0], vs[1]);
  }
  static rotMatrix(ang) {
    return _Matrix2D.fromValues([
      [Math.cos(ang), Math.sin(ang)],
      [Math.sin(-ang), Math.cos(ang)]
    ]);
  }
  static rotMatrixDeg(deg) {
    return _Matrix2D.rotMatrix(deg / 180 * Math.PI);
  }
  [Symbol.iterator]() {
    return this.vecs.map((a) => a.toString())[Symbol.iterator]();
  }
};
Matrix2D2.Identity = new Matrix2D2();
var Matrix3D2 = class _Matrix3D extends MatrixNN2 {
  constructor(v1 = new Vector3D2(1, 0, 0), v2 = new Vector3D2(0, 1, 0), v3 = new Vector3D2(0, 0, 1)) {
    super([v1, v2, v3]);
    this.vecs = [];
    this.vecs = [v1, v2, v3];
  }
  set(v1, v2 = Vector3D2.Zero, v3 = Vector3D2.Zero) {
    if (v1 instanceof _Matrix3D) {
      this.vecs = [v1.vecs[0], v1.vecs[1], v1.vecs[2]];
    } else {
      this.vecs = [v1.clone(), v2.clone(), v3.clone()];
    }
    return this;
  }
  mult(mat) {
    return super.mult(mat);
  }
  rotate(phi, theta, psi) {
    return this.mult(_Matrix3D.fromRotation(phi, theta, psi));
  }
  static fromRotation(phi, theta, psi, scale = 1) {
    const phiRad = phi * Math.PI / 180;
    const thetaRad = theta * Math.PI / 180;
    const psiRad = psi * Math.PI / 180;
    const cosPhi = Math.cos(phiRad);
    const sinPhi = Math.sin(phiRad);
    const cosTheta = Math.cos(thetaRad);
    const sinTheta = Math.sin(thetaRad);
    const cosPsi = Math.cos(psiRad);
    const sinPsi = Math.sin(psiRad);
    const rotationMatrix = [
      new Vector3D2(cosTheta * cosPsi * scale, cosPhi * sinPsi + sinPhi * sinTheta * cosPsi * scale, sinPhi * sinPsi - cosPhi * sinTheta * cosPsi),
      new Vector3D2(-cosTheta * sinPsi * scale, cosPhi * cosPsi - sinPhi * sinTheta * sinPsi * scale, sinPhi * cosPsi + cosPhi * sinTheta * sinPsi),
      new Vector3D2(sinTheta * scale, -sinPhi * cosTheta * scale, cosPhi * cosTheta)
    ];
    if (scale !== 1) {
      for (let i = 0; i < 9; i++) {
        rotationMatrix[i];
      }
    }
    return new _Matrix3D(...rotationMatrix);
  }
  static fromValues(nums) {
    nums = nums.flat();
    let vs = [];
    for (let i = 0; i < 3; i++) {
      let nnums = [];
      for (let j = 0; j < 3; j++) {
        nnums.push(nums[i * 3 + j]);
      }
      vs[i] = new Vector3D2(...nnums);
    }
    return new _Matrix3D(vs[0], vs[1], vs[2]);
  }
};
Matrix3D2.Identity = new Matrix3D2();
var Matrix4D2 = class _Matrix4D extends MatrixNN2 {
  constructor(v1 = new Quaternion2(1, 0, 0, 0), v2 = new Quaternion2(0, 1, 0, 0), v3 = new Quaternion2(0, 0, 1, 0), v4 = new Quaternion2(0, 0, 0, 1)) {
    super([v1, v2, v3, v4]);
    this.vecs = [];
    this.vecs = [v1, v2, v3, v4];
  }
  static createViewMatrix(cameraX, cameraY, cameraZ) {
    return new _Matrix4D(new Quaternion2(1, 0, 0, 0), new Quaternion2(0, 1, 0, 0), new Quaternion2(0, 0, 1, 0), new Quaternion2(-cameraX, -cameraY, -cameraZ, 1));
  }
  static createProjectionMatrix(fov, aspectRatio, near, far) {
    const f = 1 / Math.tan(fov / 2 * Math.PI / 360);
    const rangeInv = 1 / (near - far);
    return new _Matrix4D(new Quaternion2(f / aspectRatio, 0, 0, 0), new Quaternion2(0, f, 0, 0), new Quaternion2(0, 0, (far + near) * rangeInv, -1), new Quaternion2(0, 0, 2 * far * near * rangeInv, 0));
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
    return new _Matrix4D(new Quaternion2(t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0), new Quaternion2(t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0), new Quaternion2(t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0), new Quaternion2(0, 0, 0, 1));
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
    return new _Matrix4D(new Quaternion2(rx, ry, rz, 0), new Quaternion2(uxAdjusted, uyAdjusted, uzAdjusted, 0), new Quaternion2(-fx, -fy, -fz, 0), new Quaternion2(-cx, -cy, -cz, 1));
  }
  static createRotationMatrixFromDirection(cameraDir, upDirection = new Vector3D2(0, 1, 0)) {
    const cameraDirNormalized = cameraDir;
    const upDirNormalized = upDirection;
    const right = cameraDirNormalized.cross(upDirNormalized);
    const up = right.cross(cameraDirNormalized);
    return new _Matrix4D(new Quaternion2(right.x, right.y, right.z, 0), new Quaternion2(up.x, up.y, up.z, 0), new Quaternion2(-cameraDirNormalized.x, -cameraDirNormalized.y, -cameraDirNormalized.z, 0), new Quaternion2(0, 0, 0, 1));
  }
  static createCameraViewMatrix(cameraPosition, cameraDir, upDirection = new Vector3D2(0, 1, 0)) {
    const [cx, cy, cz] = cameraPosition;
    let rotMatrix = _Matrix4D.createRotationMatrixFromDirection(cameraDir, upDirection);
    let translationMatrix = new _Matrix4D(new Quaternion2(1, 0, 0, 0), new Quaternion2(0, 1, 0, 0), new Quaternion2(0, 0, 1, 0), new Quaternion2(cx, cy, cz, 0));
    let inverseTranslationMatrix = new _Matrix4D(new Quaternion2(1, 0, 0, 0), new Quaternion2(0, 1, 0, 0), new Quaternion2(0, 0, 1, 0), new Quaternion2(-cx, -cy, -cz, 0));
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
    return new _Matrix4D(new Quaternion2(rx, uxAdj, -fx, 0), new Quaternion2(ry, uyAdj, -fy, 0), new Quaternion2(rz, uzAdj, -fz, 0), new Quaternion2(-(rx * cx + ry * cy + rz * cz), -(uxAdj * cx + uyAdj * cy + uzAdj * cz), fx * cx + fy * cy + fz * cz, 1));
  }
  static createSnapLookAtMatrixFromDirection(cameraPosition, cameraDir, upDirection = [0, 1, 0]) {
    const EPS = 1e-6;
    const pos = Vector3D2.From([...cameraPosition]);
    const dirToCenter = Vector3D2.Zero.substract(pos).normalize();
    let camF = Vector3D2.From([...cameraDir]).normalize();
    if (isNaN(camF.x) || Math.abs(camF.x) < EPS && Math.abs(camF.y) < EPS && Math.abs(camF.z) < EPS) {
      camF = dirToCenter.clone();
    }
    const camUpOrig = Vector3D2.From([...upDirection]).normalize();
    const worldUp = new Vector3D2(0, 1, 0);
    let projWorldUp = worldUp.substract(camF.multiplyScalar(worldUp.dot(camF)));
    if (projWorldUp.length() < EPS) {
      projWorldUp = new Vector3D2(0, 0, 1).substract(camF.multiplyScalar(new Vector3D2(0, 0, 1).dot(camF)));
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
      new Vector3D2(1, 0, 0),
      new Vector3D2(-1, 0, 0),
      new Vector3D2(0, 1, 0),
      new Vector3D2(0, -1, 0),
      new Vector3D2(0, 0, 1),
      new Vector3D2(0, 0, -1)
    ];
    function snapToAxis(v) {
      const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
      if (ax >= ay && ax >= az)
        return new Vector3D2(Math.sign(v.x), 0, 0);
      if (ay >= ax && ay >= az)
        return new Vector3D2(0, Math.sign(v.y), 0);
      return new Vector3D2(0, 0, Math.sign(v.z));
    }
    const snappedForward = snapToAxis(dirToCenter);
    let projectedUp = adjustedUp.substract(snappedForward.multiplyScalar(adjustedUp.dot(snappedForward)));
    if (projectedUp.length() < EPS) {
      if (Math.abs(snappedForward.x) === 1)
        projectedUp = new Vector3D2(0, 1, 0);
      else if (Math.abs(snappedForward.y) === 1)
        projectedUp = new Vector3D2(0, 0, 1);
      else
        projectedUp = new Vector3D2(0, 1, 0);
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
    const lookAt = _Matrix4D.From([
      m00,
      m10,
      m20,
      0,
      m01,
      m11,
      m21,
      0,
      m02,
      m12,
      m22,
      0,
      0,
      0,
      0,
      1
    ]);
    return lookAt;
  }
  static createLookAt(eye, center, up) {
    const f = center.add(eye.multiplyScalar(-1)).normalize();
    const s = f.cross(up).normalize();
    const u = s.cross(f);
    return new _Matrix4D(new Quaternion2(s.x, u.x, -f.x, 0), new Quaternion2(s.y, u.y, -f.y, 0), new Quaternion2(s.z, u.z, -f.z, 0), new Quaternion2(-s.dot(eye), -u.dot(eye), f.dot(eye), 1));
  }
  multVector3d(v) {
    return Vector3D2.From(super.multVector(new Quaternion2(v.x, v.y, v.z, 1)).vals);
  }
  static From(arr) {
    return new _Matrix4D(new Quaternion2(arr[0], arr[1], arr[2], arr[3]), new Quaternion2(arr[4], arr[5], arr[6], arr[7]), new Quaternion2(arr[8], arr[9], arr[10], arr[11]), new Quaternion2(arr[12], arr[13], arr[14], arr[15]));
  }
};
Matrix4D2.Identity = new Matrix4D2();

// src/dependencies/Code/Start/start.js
var __awaiter2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var man;
var stopped = true;
var generators = [];
var lastTick = performance.now();
var funs = [];
var start = (fun) => {
  if (fun)
    funs.push(fun);
  if (!stopped)
    return;
  stopped = false;
  man = () => {
    var now = performance.now();
    var dt = (now - lastTick) / 1e3;
    dt = Math.min(dt, 1.5);
    lastTick = now;
    for (let i = 0; i < generators.length; i++) {
      generators[i].tick(dt);
    }
    if (!stopped) {
      for (let i = 0; i < funs.length; i++) {
        funs[i](dt);
      }
      requestAnimationFrame(man);
    }
  };
  man();
};
var startAsync = (fun) => __awaiter2(void 0, void 0, void 0, function* () {
  if (fun)
    funs.push(fun);
  if (!stopped)
    return;
  stopped = false;
  man = () => __awaiter2(void 0, void 0, void 0, function* () {
    var now = performance.now();
    var dt = (now - lastTick) / 1e3;
    dt = Math.min(dt, 1.5);
    lastTick = now;
    for (let i = 0; i < generators.length; i++) {
      yield generators[i].tick(dt);
    }
    if (!stopped) {
      for (let i = 0; i < funs.length; i++) {
        yield funs[i](dt);
      }
      requestAnimationFrame(man);
    }
  });
  yield man();
});
var addFunc = (fun) => {
  funs.push(fun);
};

// src/dependencies/Code/opengl/opengl.js
var __awaiter3 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function loadShaderSource(url) {
  return __awaiter3(this, void 0, void 0, function* () {
    const response = yield fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader file: ${url}`);
    }
    return response.text();
  });
}
function loadShaders(gl, vertexPath, fragmentPath, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
  return __awaiter3(this, void 0, void 0, function* () {
    const [vertexSource, fragmentSource] = yield Promise.all([
      loadShaderSource(vertexPath),
      loadShaderSource(fragmentPath)
    ]);
    return loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter, fragmentFilter);
  });
}
function loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
  return __awaiter3(this, void 0, void 0, function* () {
    const filteredVertexSource = vertexFilter(vertexSource);
    const filteredFragmentSource = fragmentFilter(fragmentSource);
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, filteredVertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, filteredFragmentSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    return [program, vertexShader, fragmentShader];
  });
}
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Error linking program: ${gl.getProgramInfoLog(program)}`);
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// src/dependencies/Code/Utils/utils.js
function HSLtoRGB(h, s, l, trs = 1) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `rgba(${255 * f(0)},${255 * f(8)},${255 * f(4)},${trs})`;
}

// src/dependencies/Code/WebGL/webglMan.js
var __awaiter4 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var WebGLMan = class _WebGLMan {
  constructor(gl = _WebGLMan === null || _WebGLMan === void 0 ? void 0 : _WebGLMan.gl, dirPath) {
    var _a2;
    this.gl = gl;
    this.dirPath = dirPath;
    this.programs = [];
    if (!this.dirPath) {
      this.dirPath = "/glsl";
      let stdir = window.dntiDir || window.blogDirName;
      if (!!window && !!stdir) {
        this.dirPath = stdir + this.dirPath;
      }
      console.log("webgl main path:", this.dirPath);
    }
    if (_WebGLMan.stWebGLMan)
      (_a2 = _WebGLMan.stWebGLMan).gl || (_a2.gl = gl);
  }
  static setGL(gl, path = _WebGLMan.stWebGLMan.dirPath) {
    var _a2;
    _WebGLMan.stWebGLMan.dirPath = path;
    (_a2 = _WebGLMan.stWebGLMan).gl || (_a2.gl = gl);
    return this;
  }
  static get gl() {
    var _a2;
    return (_a2 = _WebGLMan === null || _WebGLMan === void 0 ? void 0 : _WebGLMan.stWebGLMan) === null || _a2 === void 0 ? void 0 : _a2.gl;
  }
  static get programs() {
    return this.stWebGLMan.programs;
  }
  static get dirPath() {
    return this.stWebGLMan.dirPath;
  }
  static set gl(gl) {
    this.stWebGLMan.gl = gl;
  }
  static set programs(programs) {
    this.stWebGLMan.programs = programs;
  }
  static set dirPath(dirPath) {
    this.stWebGLMan.dirPath = dirPath;
  }
  static program(ID = _WebGLMan.stWebGLMan.programs.length, vertPath = "", fragPath = "") {
    return _WebGLMan.stWebGLMan.program(ID, vertPath, fragPath);
  }
  program(ID = this.programs.length, vertPath = "", fragPath = "") {
    if (ID < 0)
      ID = this.programs.length;
    if (!!vertPath.trim() && !fragPath.trim()) {
      fragPath = vertPath + ".frag";
      vertPath = vertPath + ".vert";
    }
    let p = new WebProgram(this.gl, this.dirPath + "/" + vertPath, this.dirPath + "/" + fragPath);
    this.programs[ID] = p;
    p.ID = ID;
    return p;
  }
  static includeExternalProgram(p) {
    var _a2;
    let ID = (_a2 = p.ID) !== null && _a2 !== void 0 ? _a2 : -1;
    if (ID < 0 || this.programs[ID] != p)
      ID = _WebGLMan.stWebGLMan.programs.length;
    _WebGLMan.programs[ID] = p;
    p.ID = ID;
    return p;
  }
  static getProgramByID(ID) {
    return _WebGLMan.stWebGLMan.programs[ID];
  }
  getProgramByID(ID) {
    return this.programs[ID];
  }
};
WebGLMan.stWebGLMan = new WebGLMan();
var WebProgram = class _WebProgram {
  constructor(gl, vertPath = "", fragPath = "") {
    this.gl = gl;
    this.vertPath = vertPath;
    this.fragPath = fragPath;
    this.nUsedTextures = 0;
    this.standardTEXW = 1080;
    this.standardTEXH = 720;
    this.viewportW = 1080;
    this.viewportH = 720;
    this.uniforms = /* @__PURE__ */ new Map();
    this.textures = [];
    this.VAOs = [];
    this.currentVAO = -1;
    this.isDepthTest = true;
    this.depthFunction = "LESS";
  }
  loadProgram(vp = this.vertPath, fp = this.fragPath, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
    return __awaiter4(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShaders(this.gl, vp, fp, vertexFilter, fragmentFilter);
      return this;
    });
  }
  use() {
    this.gl.useProgram(this.program);
    return this;
  }
  isWebProgram() {
    return true;
  }
  includeInWebManList() {
    WebGLMan.includeExternalProgram(this);
    return this;
  }
  get VAO() {
    return this.VAOs[this.currentVAO];
  }
  createVAO() {
    let vao = new VAO(this.gl, this.program);
    this.VAOs.push(vao);
    if (this.currentVAO < 0)
      this.currentVAO = 0;
    return vao;
  }
  bindVAO(number = this.currentVAO) {
    this.currentVAO = number;
    this.VAO.bind();
    return this;
  }
  unbindVAO() {
    this.gl.bindVertexArray(null);
    return this;
  }
  createTexture2D(name, size = [this.standardTEXW, this.standardTEXH], format = TexExamples.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
    let tex = this.gl.createTexture();
    texUnit = parseTexUnitType(texUnit);
    let nTexture = texUnit || this.nUsedTextures;
    if ((FILTER_WRAP[0] == "LINEAR" || FILTER_WRAP[1] == "LINEAR") && format[2] == this.gl.FLOAT)
      console.error("%cTexture error: Float textures dont accept LINEAR LOD FILTERING", "color:red;font-weight:bold;");
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    FILTER_WRAP = FILTER_WRAP.map((a) => {
      if (a == "NEAREST")
        return WebGL2RenderingContext.NEAREST;
      if (a == "LINEAR")
        return WebGL2RenderingContext.LINEAR;
      if (a == "CLAMP")
        return WebGL2RenderingContext.CLAMP_TO_EDGE;
      if (a == "REPEAT")
        return WebGL2RenderingContext.REPEAT;
      if (a == "MIRROR")
        return WebGL2RenderingContext.MIRRORED_REPEAT;
      return a;
    });
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
    this.gl.texImage2D(this.gl.TEXTURE_2D, LODlevel, format[1] || this.gl.RGBA32F, size[0], size[1], 0, format[0] || this.gl.RGBA, format[2] || this.gl.FLOAT, data || null);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    this.nUsedTextures++;
    tex.fill = (arr, x = 0, y = 0, w = size[0], h = size[1], LOD = LODlevel) => {
      if (tex.unit !== void 0)
        this.gl.activeTexture(this.gl.TEXTURE0 + tex.unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, LOD, x, y, w, h, format[0], format[2], arr);
      return tex;
    };
    tex.unit = nTexture;
    tex.bind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType(textureUnit);
      if (textureUnit != -1) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      }
      tex.unit = textureUnit;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      return tex;
    };
    tex.unbind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType(textureUnit);
      if (textureUnit != -1) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      return tex;
    };
    tex.w = size[0];
    tex.h = size[1];
    tex.xoff = 0;
    tex.yoff = 0;
    tex.format = format;
    _WebProgram.Textures[parseTexUnitType(tex.unit)] = tex;
    this.textures[parseTexUnitType(tex.unit)] = tex;
    return tex;
  }
  texture2D(params = {
    size: [this.standardTEXW, this.standardTEXH],
    format: TexExamples.RGBAFloat,
    data: null,
    FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
    LODlevel: 0
  }) {
    return this.createTexture2D(params.name, params.size, params.format, params.data, params.FILTER_WRAP, params.texUnit, params.LODlevel);
  }
  loadLongArray2GPUTextures(array, basename, startTextureUnit, format = TexExamples.RFloat, FILTER_WRAP) {
    startTextureUnit = parseTexUnitType(startTextureUnit);
    let arrLength = array.length;
    let maxLength = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
    let lastTexureUnit = Math.floor(arrLength / maxLength) + startTextureUnit;
    let remainder = arrLength % maxLength;
    if (lastTexureUnit > 31) {
      console.error("loadLongArray2GPUTextures couldnt load into textureUnits, array too big ( last textureUnit used" + lastTexureUnit + ", max is 31 ), using 31 maximum");
      lastTexureUnit = 31;
    }
    for (let i = startTextureUnit; i <= lastTexureUnit; i++) {
      let diffi = i - startTextureUnit;
      this.texture2D({
        name: basename + (!diffi ? "" : diffi),
        texUnit: i,
        data: array.subarray(diffi * maxLength, (diffi + 1) * maxLength),
        size: [i == lastTexureUnit ? remainder : maxLength, 1],
        format,
        FILTER_WRAP
      });
    }
    let returnObj = {
      startTextureUnit,
      lastTexureUnit,
      maxLength,
      nextTexureUnit: lastTexureUnit + 1,
      setLengthUniforms: () => {
        this.uInt(basename + "Length").set(maxLength);
        return returnObj;
      }
    };
    return returnObj;
  }
  texture2DFromImage(img, name, format = TexExamples.RGBAFloat, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
    return this.createTexture2D(name, [img.width, img.height], format, img, FILTER_WRAP, texUnit, LODlevel);
  }
  bindTextureUnit2Uniform(texUnit = this.nUsedTextures, name) {
    if (texUnit == this.nUsedTextures) {
      this.nUsedTextures++;
    }
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), texUnit);
    }
    return this;
  }
  getTextureFromUnit(texUnit) {
    this.gl.activeTexture(this.gl.TEXTURE0 + parseTexUnitType(texUnit));
    const texture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D) || this.gl.getParameter(this.gl.TEXTURE_BINDING_2D_ARRAY) || this.gl.getParameter(this.gl.TEXTURE_BINDING_3D);
    return texture;
  }
  uTexUnit(texUnit = this.nUsedTextures, name) {
    this.bindTextureUnit2Uniform(texUnit, name);
    return this;
  }
  bindNewTexture(tex, name) {
    var _a2, _b2;
    let nTexture = this.nUsedTextures;
    this.nUsedTextures++;
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    _WebProgram.Textures[(_a2 = parseTexUnitType(nTexture)) !== null && _a2 !== void 0 ? _a2 : tex.unit] = tex;
    this.textures[(_b2 = parseTexUnitType(nTexture)) !== null && _b2 !== void 0 ? _b2 : tex.unit] = tex;
    return nTexture;
  }
  bindTexture(tex, name, nTexture = 0) {
    var _a2, _b2, _c2;
    nTexture = (_a2 = parseTexUnitType(nTexture)) !== null && _a2 !== void 0 ? _a2 : tex.unit;
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    _WebProgram.Textures[(_b2 = parseTexUnitType(nTexture)) !== null && _b2 !== void 0 ? _b2 : tex.unit] = tex;
    this.textures[(_c2 = parseTexUnitType(nTexture)) !== null && _c2 !== void 0 ? _c2 : tex.unit] = tex;
    return nTexture;
  }
  getTextureByUnit(texUnit) {
    const n = parseTexUnitType(texUnit);
    return this.textures[n] || _WebProgram.Textures[n];
  }
  bindTexName2TexUnit(name, nTexture = 0) {
    nTexture = parseTexUnitType(nTexture);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    return this;
  }
  createTexture2DArray(name, size = [this.standardTEXW, this.standardTEXH, 1], format = TexExamples.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, MIPlevel = 0) {
    const gl = this.gl;
    const tex = gl.createTexture();
    texUnit = parseTexUnitType(texUnit);
    const nTexture = texUnit !== null && texUnit !== void 0 ? texUnit : this.nUsedTextures;
    if ((FILTER_WRAP[0] === "LINEAR" || FILTER_WRAP[1] === "LINEAR") && format[2] === gl.FLOAT)
      console.error("%cTexture error: Float textures don\u2019t accept LINEAR filtering", "color:red;font-weight:bold;");
    gl.activeTexture(gl.TEXTURE0 + nTexture);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    FILTER_WRAP = FILTER_WRAP.map((a) => {
      if (a === "NEAREST")
        return gl.NEAREST;
      if (a === "LINEAR")
        return gl.LINEAR;
      if (a === "CLAMP")
        return gl.CLAMP_TO_EDGE;
      if (a === "REPEAT")
        return gl.REPEAT;
      if (a === "MIRROR")
        return gl.MIRRORED_REPEAT;
      return a;
    });
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
    if (!size[2] || size[2] <= 0) {
      if (!!data && data.length) {
        size[2] = ~~(data.length / size[1] / size[0]);
      } else {
        size[2] = 1;
      }
    }
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, MIPlevel, format[1], size[0], size[1], size[2], 0, format[0], format[2], data);
    if (name === null || name === void 0 ? void 0 : name.trim()) {
      gl.uniform1i(gl.getUniformLocation(this.program, name), nTexture);
    }
    this.nUsedTextures++;
    tex.fill = (arr, x = 0, y = 0, z = 0, w = size[0], h = size[1], d = size[2], LOD = MIPlevel) => {
      if (tex.unit !== void 0)
        gl.activeTexture(gl.TEXTURE0 + tex.unit);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, LOD, x, y, z, w, h, d, format[0], format[2], arr);
      return tex;
    };
    tex.unit = nTexture;
    tex.bind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType(textureUnit);
      if (textureUnit !== -1)
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
      tex.unit = textureUnit;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      return tex;
    };
    tex.unbind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType(textureUnit);
      if (textureUnit !== -1)
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
      return tex;
    };
    tex.w = size[0];
    tex.h = size[1];
    tex.nLayers = size[2];
    tex.format = format;
    tex.setLengthUniforms = () => {
      this.uInt(name + "Length").set(tex.w * tex.h);
      return tex;
    };
    return tex;
  }
  texture2DArray(params = {
    size: [this.standardTEXW, this.standardTEXH, 1],
    format: TexExamples.RGBAFloat,
    data: null,
    FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
    MIPlevel: 0
  }) {
    var _a2, _b2, _c2, _d, _e;
    return this.createTexture2DArray(params.name, (_a2 = params.size) !== null && _a2 !== void 0 ? _a2 : [this.standardTEXW, this.standardTEXH, void 0], (_b2 = params.format) !== null && _b2 !== void 0 ? _b2 : TexExamples.RGBAFloat, (_c2 = params.data) !== null && _c2 !== void 0 ? _c2 : null, (_d = params.FILTER_WRAP) !== null && _d !== void 0 ? _d : ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], params.texUnit, (_e = params.MIPlevel) !== null && _e !== void 0 ? _e : 0);
  }
  uMat4(name) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    uniform.set = (mat, transpose = false, offset, len) => {
      if (mat instanceof Matrix4D2 || typeof mat.toFloat32 == "function") {
        this.gl.uniformMatrix4fv(uniform, transpose, mat.toFloat32(), offset, len);
      } else if (mat instanceof Float32Array) {
        this.gl.uniformMatrix4fv(uniform, transpose, mat, offset, len);
      } else {
        this.gl.uniformMatrix4fv(uniform, transpose, new Float32Array(mat), offset, len);
      }
      return uniform;
    };
    this.uniforms[name] = uniform;
    return uniform;
  }
  uMat3(name) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    uniform.set = (mat, transpose = false, offset, len) => {
      if (mat instanceof Matrix3D2 || typeof mat.toFloat32 == "function") {
        this.gl.uniformMatrix3fv(uniform, transpose, mat.toFloat32(), offset, len);
      } else if (mat instanceof Float32Array) {
        this.gl.uniformMatrix3fv(uniform, transpose, mat, offset, len);
      } else {
        this.gl.uniformMatrix3fv(uniform, transpose, new Float32Array(mat), offset, len);
      }
      return uniform;
    };
    this.uniforms[name] = uniform;
    return uniform;
  }
  uMat2(name) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    uniform.set = (mat, transpose = false, offset, len) => {
      if (mat instanceof Matrix2D2 || typeof mat.toFloat32 == "function") {
        this.gl.uniformMatrix2fv(uniform, transpose, mat.toFloat32(), offset, len);
      } else if (mat instanceof Float32Array) {
        this.gl.uniformMatrix2fv(uniform, transpose, mat, offset, len);
      } else {
        this.gl.uniformMatrix2fv(uniform, transpose, new Float32Array(mat), offset, len);
      }
      return uniform;
    };
    this.uniforms[name] = uniform;
    return uniform;
  }
  uVec(name, dimension = 3, isFloat = true, isUnsignedInt = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    let func = this.gl[`uniform${Math.min(~~dimension, 4)}${isFloat ? "f" : isUnsignedInt ? "ui" : "i"}v`];
    uniform.set = (vec, offset, len) => {
      let vcoords;
      let length = 0;
      if (vec === null || vec === void 0 ? void 0 : vec.coords) {
        vcoords = vec.coords;
      } else {
        vcoords = vec;
      }
      if (vcoords.length != dimension) {
        let xs = [];
        for (let i = 0; i < dimension; i++) {
          if (i == 3) {
            xs = vcoords[i] || 1;
          } else
            xs = vcoords[i] || 0;
        }
        func.call(this.gl, uniform, xs, offset, len);
        return uniform;
      }
      func.call(this.gl, uniform, vcoords, offset, len);
      return uniform;
    };
    this.uniforms[name] = uniform;
    return uniform;
  }
  uNum(name, isFloat = true, isUnsignedInt = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    let func = this.gl[`uniform1${isFloat ? "f" : isUnsignedInt ? "ui" : "i"}`];
    uniform.set = (num) => {
      func.call(this.gl, uniform, num);
      return uniform;
    };
    this.uniforms[name] = uniform;
    return uniform;
  }
  uFloat(name) {
    return this.uNum(name, true, false);
  }
  uInt(name) {
    return this.uNum(name, false, false);
  }
  cFrameBuffer() {
    return new FrameBuffer(this.gl, this);
  }
  unbindFrameBuffer() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return this;
  }
  unbindFBO() {
    this.unbindFrameBuffer();
    return this;
  }
  setViewport(xoff = 0, yoff = 0, w = this.viewportW, h = this.viewportH) {
    this.viewportW = w;
    this.viewportH = h;
    this.gl.viewport(xoff, yoff, w, h);
    return this;
  }
  clearBuffer(type) {
    this.gl.clear(this.gl[type + "_BUFFER_BIT"]);
    return this;
  }
  clear(type) {
    this.clearBuffer(type);
    return this;
  }
  clearMask(type) {
    this.clearBuffer(type);
    return this;
  }
  clearColor(color = [0.2, 0.2, 0.2, 1]) {
    if (typeof color == "string") {
      let [r, g, b, a] = [0, 0, 0, 1];
      if (color.startsWith("hsl")) {
        color = HSLtoRGB(...color.replaceAll(/hsl\(?/gm, "").replaceAll(")", "").split(",").map((a2) => parseFloat(a2)));
      }
      if (color.startsWith("rgba")) {
        [r, g, b, a] = color.replaceAll(/rgba\(?/gm, "").replaceAll(")", "").split(",").map((a2) => parseFloat(a2));
      } else if (color.startsWith("rgb")) {
        [r, g, b] = color.replaceAll(/rgba?\(?/gm, "").replaceAll(")", "").split(",").map((a2) => parseFloat(a2));
      }
      if (r > 1 || g > 1 || b > 1 || a > 1) {
        r /= 255;
        g /= 255;
        b /= 255;
        a /= 255;
      }
      this.gl.clearColor(r || 0, g || 0, b || 0, a || 0);
    } else {
      this.gl.clearColor(color[0] || 0, color[1] || 0, color[2] || 0, color[3] || 0);
    }
    return this;
  }
  clearDepth(depthValue = 1) {
    this.gl.clearDepth(depthValue);
    return this;
  }
  clearStencil(stencilValue = 1) {
    this.gl.clearStencil(stencilValue);
    return this;
  }
  initDepthBefDraw() {
    if (this.isDepthTest)
      this.gl.enable(this.gl.DEPTH_TEST);
    else
      this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl[this.depthFunction]);
  }
  drawArrays(mode, vaoOff = 0, vertexCount, instanceCount = 1) {
    var _a2;
    if (vertexCount == void 0)
      vertexCount = ((_a2 = this.VAO) === null || _a2 === void 0 ? void 0 : _a2.vaoLength) || 0;
    this.initDepthBefDraw();
    if (instanceCount <= 1)
      this.gl.drawArrays(this.gl[mode], vaoOff, vertexCount);
    else
      this.gl.drawArraysInstanced(this.gl[mode], vaoOff, vertexCount, instanceCount);
    return this;
  }
  drawElements(mode, elementCount = this.VAO.eboLength, type = "UNSIGNED_SHORT", eboOff = 0, instanceCount = 0) {
    this.initDepthBefDraw();
    if (instanceCount <= 0)
      this.gl.drawElements(this.gl[mode], elementCount, this.gl[type], eboOff);
    else
      this.gl.drawElementsInstanced(this.gl[mode], elementCount, this.gl[type], eboOff, instanceCount);
    return this;
  }
  blendEquation(mode = "ADD") {
    if (mode == "MIN" || mode == "MAX")
      this.gl.blendEquation(this.gl[mode]);
    else
      this.gl.blendEquation(this.gl["FUNC_" + mode]);
  }
  blendFunc(sfactor = "ONE", dfactor = "ZERO") {
    this.gl.blendFunc(this.gl[sfactor], this.gl[dfactor]);
  }
  blendColor(r, g, b, a) {
    this.gl.blendColor(r, g, b, a);
  }
  finish() {
    this.gl.finish();
    return this;
  }
};
WebProgram.Textures = [];
function parseTexUnitType(texUnit) {
  if (!texUnit)
    return texUnit;
  if (typeof texUnit == "number")
    return texUnit;
  return parseInt(texUnit.substring(7));
}
function parseColAtchType(colAttachment) {
  if (!colAttachment)
    return colAttachment;
  if (typeof colAttachment == "number")
    return colAttachment;
  return parseInt(colAttachment.substring(7));
}
var FrameBuffer = class {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.colorBuffersUsed = new Array(15).fill(false);
    this.fbo = this.gl.createFramebuffer();
  }
  bind(colorATTACHMENTS) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    if (colorATTACHMENTS)
      this.drawBuffers(colorATTACHMENTS);
    return this;
  }
  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return this;
  }
  drawBuffers(unitArr = this.colorBuffersUsed.map((a, i) => [a, i]).filter((a) => a[0]).map((a) => a[1])) {
    this.gl.drawBuffers(unitArr.map((unit) => this.gl.COLOR_ATTACHMENT0 + parseColAtchType(unit)));
    return this;
  }
  bindColorBuffer(texture, colorUnit, LODlevel = 0) {
    colorUnit = parseColAtchType(colorUnit);
    if (colorUnit === void 0) {
      if (texture.unit !== void 0)
        colorUnit = texture.unit;
      else
        colorUnit = 0;
    }
    texture.colorUnit = colorUnit;
    this.colorBuffersUsed[colorUnit] = true;
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + colorUnit, this.gl.TEXTURE_2D, texture, LODlevel);
    return this;
  }
  unbindBuffer(colorUnit) {
    colorUnit = parseColAtchType(colorUnit);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + colorUnit, this.gl.TEXTURE_2D, null, 0);
  }
  readColorAttachment(n, x = 0, y = 0, w = this.program.standardTEXW, h = this.program.standardTEXH, format, dimension = 4) {
    let buffer = new Float32Array(w * h * dimension);
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
    this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType(n));
    this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
    return buffer;
  }
  readColAttchTexture(tex, dimension = 4, x, y, w, h, format, colUnit) {
    var _a2;
    let n = (_a2 = colUnit !== null && colUnit !== void 0 ? colUnit : tex.colorUnit) !== null && _a2 !== void 0 ? _a2 : tex.unit;
    x !== null && x !== void 0 ? x : x = tex.offx;
    y !== null && y !== void 0 ? y : y = tex.offy;
    w !== null && w !== void 0 ? w : w = tex.w || this.program.standardTEXW;
    h !== null && h !== void 0 ? h : h = tex.h || this.program.standardTEXH;
    format !== null && format !== void 0 ? format : format = tex.format || TexExamples.RGBA;
    let buffer = new Float32Array(w * h * dimension);
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
    this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType(n));
    this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
    return buffer;
  }
  colorMask(r = true, g = true, b = true, a = true) {
    this.gl.colorMask(r, g, b, a);
    return this;
  }
  bindTextureDepthBuffer(texture, LODlevel = 0) {
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, LODlevel);
    return this;
  }
  depthMask(depth) {
    this.gl.depthMask(depth);
    return this;
  }
  cRenderBuffer(type = "DEPTH", quality = "low", w = 256, h = 256, colorUnit = 0) {
    colorUnit = parseColAtchType(colorUnit);
    let attachment = this.gl.COLOR_ATTACHMENT0;
    let ifs = [];
    switch (type) {
      case "STENCIL_INDEX8":
        attachment = this.gl.STENCIL_INDEX8;
        break;
      case "DEPTH_STENCIL":
        ifs = [this.gl.DEPTH_STENCIL, this.gl.DEPTH24_STENCIL8, this.gl.DEPTH32F_STENCIL8];
        attachment = this.gl.DEPTH_STENCIL_ATTACHMENT;
        break;
      case "DEPTH":
        ifs = [this.gl.DEPTH_COMPONENT16, this.gl.DEPTH_COMPONENT24, this.gl.DEPTH_COMPONENT32F];
        attachment = this.gl.DEPTH_ATTACHMENT;
        break;
      case "COLOR":
      default:
        ifs = [this.gl.RGBA4, this.gl.RGB565, this.gl.RGBA8];
        attachment = this.gl.COLOR_ATTACHMENT0 + colorUnit;
        this.colorBuffersUsed[colorUnit] = true;
        break;
    }
    let qidx = quality == "low" ? 0 : quality == "medium" ? 1 : 2;
    let internalFormat = ifs[qidx] || ifs[0];
    const rbo = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rbo);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, internalFormat, w, h);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, rbo);
    return rbo;
  }
  stencilMask(maskNum) {
    this.gl.stencilMask(maskNum);
    return this;
  }
  get _() {
    return this.fbo;
  }
};
var TexExamples = {
  "RFloat": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R32F, WebGL2RenderingContext.FLOAT],
  "RGFloat": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG32F, WebGL2RenderingContext.FLOAT],
  "RGBFloat": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB32F, WebGL2RenderingContext.FLOAT],
  "RGBAFloat": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA32F, WebGL2RenderingContext.FLOAT],
  "RFloat16": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R16F, WebGL2RenderingContext.FLOAT],
  "RGFloat16": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG16F, WebGL2RenderingContext.FLOAT],
  "RGBFloat16": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB16F, WebGL2RenderingContext.FLOAT],
  "RGBAFloat16": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA16F, WebGL2RenderingContext.FLOAT],
  "R": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RG": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGB": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBA": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32I, WebGL2RenderingContext.INT],
  "RGInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32I, WebGL2RenderingContext.INT],
  "RGBInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32I, WebGL2RenderingContext.INT],
  "RGBAInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32I, WebGL2RenderingContext.INT],
  "RInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16I, WebGL2RenderingContext.INT],
  "RGInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16I, WebGL2RenderingContext.INT],
  "RGBInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16I, WebGL2RenderingContext.INT],
  "RGBAInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16I, WebGL2RenderingContext.INT],
  "RInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8I, WebGL2RenderingContext.INT],
  "RGInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8I, WebGL2RenderingContext.INT],
  "RGBInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8I, WebGL2RenderingContext.INT],
  "RGBAInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8I, WebGL2RenderingContext.INT],
  "RUInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RUInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RUInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RUBYTE8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGUBYTE8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBUBYTE8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBAUBYTE8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_BYTE]
};
var VAO = class {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.vaoLength = 0;
    this.eboLength = 0;
    this.vao = gl.createVertexArray();
  }
  bind() {
    this.gl.bindVertexArray(this._);
    return this;
  }
  cVBO(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false) {
    const posBuf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    if (data instanceof Float32Array || data.length) {
      this.vaoLength = ~~(data.length / dimension);
    }
    const posLoc = this.gl.getAttribLocation(this.program, name);
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, dimension, this.gl[type], normalized, stride, offset);
    return posBuf;
  }
  attribute(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false) {
    if (!(data instanceof Float32Array))
      data = new Float32Array(data);
    return this.cVBO(name, data, dimension, type, stride, offset, normalized);
  }
  cEBO(indices) {
    const ibo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    this.eboLength = indices.length;
    return [ibo, () => {
    }];
  }
  copyBufferFromGPU(src, dst = this.gl.createBuffer(), nBytes, rdOff = 0, wrOff = 0) {
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, src);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, dst);
    this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, nBytes, this.gl.STATIC_DRAW);
    this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, rdOff, wrOff, nBytes);
    return dst;
  }
  get _() {
    return this.vao;
  }
};

// src/dependencies/Code/WebGL/webglCapsules.js
var __awaiter5 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var MeshRenderingProgram = class extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, dx = 0.015, dy = 0.015) {
    super(gl, "", "");
    this.valsTexUnit = valsTexUnit;
    this.w = w;
    this.h = h;
    this.dx = dx;
    this.dy = dy;
  }
  loadProgram(vs, fs) {
    return __awaiter5(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShadersFromString(this.gl, `#version 300 es
            precision highp float;

            uniform sampler2D values;
            uniform int msdLength;   
            uniform int msdCount;    
            uniform float dx;
            uniform float dy;
            uniform float xPer;
            uniform float yPer;
            uniform float yScale;
            uniform vec3 offPos;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;

            flat out vec3 outPos;

            vec4 getPoint(int x, int yTexel) {
                // Ahora la textura tiene un \xFAnico canal (RED)
                float val = texelFetch(values, ivec2(x, yTexel), 0).r;

                float px = dx * float(x) - dx * float(msdLength) * (1.0 - xPer);
                float py = val * yScale;
                float pz = dy * float(yTexel) - dy * float(msdCount) * (1.0 - yPer);

                return vec4(px, py, -pz, 1.0) + vec4(offPos, 0.0);
            }

            void main() {
                int horizCount = (msdLength - 1) * msdCount;
                int segment = gl_VertexID / 2;
                bool first = (gl_VertexID % 2) == 0;

                int x, y;
                vec4 pos;

                if (segment < horizCount) {
                    // Segmento horizontal
                    int base = segment;
                    y = base / (msdLength - 1);
                    x = base % (msdLength - 1);
                    pos = getPoint(first ? x : x + 1, y);
                } else {
                    // Segmento vertical
                    int base = segment - horizCount;
                    x = base / (msdCount - 1);
                    y = base % (msdCount - 1);
                    pos = getPoint(x, first ? y : y + 1);
                }

                outPos = pos.xyz;
                gl_Position = u_projectionMatrix * (u_viewMatrix * pos);
            }`, `#version 300 es
            precision highp float;

            flat in vec3 outPos;
            out vec4 outColor;
            uniform float colorHueScale;

            float hue2rgb(float p, float q, float t){
                if(t < 0.0) t += 1.0;
                if(t > 1.0) t -= 1.0;
                if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                if(t < 1.0/2.0) return q;
                if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                return p;
            }

            vec3 hsl2rgb(float h, float s, float l){
                float q = l < 0.5 ? l * (1.0 + s) : (l + s - l*s);
                float p = 2.0 * l - q;
                return vec3(
                    hue2rgb(p, q, h + 1.0/3.0),
                    hue2rgb(p, q, h),
                    hue2rgb(p, q, h - 1.0/3.0)
                );
            }

            void main(){
                // Normalizamos la altura a hue (suponiendo alturas entre -1.5 y +1.5)
                float h = (outPos.y * colorHueScale / 1.5); // ahora est\xE1 entre -1 y 1
                h = (mod(-h,1.5) * 0.5) + 0.5;        // lo llevamos a 0..1

                float s = 0.6;
                float l = 0.5;

                vec3 rgb = hsl2rgb(h, s, l);

                outColor = vec4(rgb, 1.0);
            }
            `);
      return this;
    });
  }
  setSize(w = this.w, h = this.h) {
    this.w = w;
    this.h = h;
    let totalY = h;
    let horizSegments = (w - 1) * totalY;
    let vertSegments = w * (totalY - 1);
    this.totalSegments = horizSegments + vertSegments;
    this.uInt("msdLength").set(this.w);
    this.uInt("msdCount").set(this.h);
    return this;
  }
  setOffset(x, y, z) {
    this.uVec("offPos", 3).set([x, y, z]);
    return this;
  }
  setDXDY(dx, dy) {
    this.uFloat("dx").set(dx);
    this.uFloat("dy").set(dy);
    return this;
  }
  setPerXPerY(px = 0.5, py = 0.5) {
    this.uFloat("xPer").set(px);
    this.uFloat("yPer").set(py);
    return this;
  }
  setColorHueScale(scale = 1) {
    this.uFloat("colorHueScale").set(scale);
    return this;
  }
  setYScale(scale = 0.5) {
    this.uFloat("yScale").set(scale);
    return this;
  }
  initUniforms() {
    this.setSize(this.w, this.h).setOffset(0, 0, 0).setDXDY(this.dx, this.dy).setPerXPerY().setColorHueScale().setYScale();
    return this;
  }
  draw(x = 0, y = 0, w = 1080, h = 720, camera, mode = "LINES") {
    this.initDepthBefDraw();
    this.bindTexName2TexUnit("values", this.valsTexUnit);
    if (camera) {
      camera.calculateMatrices().setUniformsProgram(this);
    }
    this.setViewport(x, y, w, h);
    this.clearColor();
    this.drawArrays(mode, 0, this.totalSegments * 2);
  }
  createIdealTexture(texUnit = this.valsTexUnit, data, w = this.w, h = this.h) {
    let arrdata;
    if (typeof data == "function" && typeof data(0, 0) == "number") {
      arrdata = new Float32Array(w * h);
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          arrdata[i * w + j] = data(i, j) || 0;
        }
      }
    }
    return this.texture2D({
      format: TexExamples.RFloat,
      size: [w, h],
      texUnit,
      data: arrdata || data
    });
  }
  fillMeshTexture(texture2D, data, w = this.w, h = this.h) {
    let arrdata;
    if (typeof data == "function" && typeof data(0, 0) == "number") {
      arrdata = new Float32Array(w * h);
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          arrdata[i * w + j] = data(i, j) || 0;
        }
      }
    }
    texture2D.fill(arrdata, 0, 0, w, h);
  }
};
var AxisLinesProgram = class extends WebProgram {
  constructor(gl, axisLengths = new Vector3D2(1, 1, 1)) {
    super(gl, "", "");
    this.axisLengths = axisLengths;
  }
  loadProgram() {
    return __awaiter5(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShadersFromString(this.gl, `#version 300 es
            precision highp float;

            const vec3 AXIS_COLORS[3] = vec3[3](
                vec3(1.0, 0.0, 0.0),  // X
                vec3(0.0, 1.0, 0.0),  // Y
                vec3(0.0, 0.0, 1.0)   // Z
            );

            uniform vec3 axisLengths;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main() {
                int axis = gl_VertexID / 2;
                bool start = (gl_VertexID % 2) == 0;

                vec3 pos = vec3(0.0);
                if (!start) {
                    if (axis == 0) pos.x = axisLengths.x;
                    else if (axis == 1) pos.y = axisLengths.y;
                    else pos.z = axisLengths.z;
                }

                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(pos, 1.0);
                vColor = AXIS_COLORS[axis];
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main() { outColor = vec4(vColor, 1.0); }`);
      return this;
    });
  }
  initUniforms() {
    this.uVec("axisLengths", 3).set(this.axisLengths);
  }
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D2(x, y, z);
    this.uVec("axisLengths", 3).set(this.axisLengths);
    return this;
  }
  draw(camera) {
    if (camera)
      camera.calculateMatrices().setUniformsProgram(this);
    this.drawArrays("LINES", 0, 6);
  }
};
var AxisConesProgram = class extends WebProgram {
  constructor(gl, arrowHeights = new Vector3D2(0.1, 0.1, 0.1), arrowRadii = new Vector3D2(0.03, 0.03, 0.03), axisLengths = new Vector3D2(1, 1, 1)) {
    super(gl, "", "");
    this.arrowHeights = arrowHeights;
    this.arrowRadii = arrowRadii;
    this.axisLengths = axisLengths;
  }
  loadProgram() {
    return __awaiter5(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShadersFromString(this.gl, `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            layout(location=1) in vec3 aColor;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = aColor;
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor, 1.0); }`);
      return this;
    });
  }
  initVAO() {
    const steps = 16;
    const vertices = [];
    const colors = [];
    const addCone = (dir, length, height, radius, color) => {
      for (let i = 0; i < steps; i++) {
        const a1 = i / steps * Math.PI * 2;
        const a2 = (i + 1) / steps * Math.PI * 2;
        const base1 = new Vector3D2(dir.x * length + radius * Math.cos(a1), dir.y * length + radius * Math.sin(a1), dir.z * length);
        const base2 = new Vector3D2(dir.x * length + radius * Math.cos(a2), dir.y * length + radius * Math.sin(a2), dir.z * length);
        const tip = new Vector3D2(dir.x * (length + height), dir.y * (length + height), dir.z * (length + height));
        vertices.push(base1.x, base1.y, base1.z, base2.x, base2.y, base2.z, tip.x, tip.y, tip.z);
        colors.push(...color, ...color, ...color);
      }
    };
    addCone(new Vector3D2(1, 0, 0), this.axisLengths.x, this.arrowHeights.x, this.arrowRadii.x, [1, 0, 0]);
    addCone(new Vector3D2(0, 1, 0), this.axisLengths.y, this.arrowHeights.y, this.arrowRadii.y, [0, 1, 0]);
    addCone(new Vector3D2(0, 0, 1), this.axisLengths.z, this.arrowHeights.z, this.arrowRadii.z, [0, 0, 1]);
    let vao = this.createVAO().bind();
    vao.attribute("aPos", vertices, 3);
    vao.attribute("aColor", colors, 3);
    return vao;
  }
  initUniforms() {
    this.uVec("axisLengths", 3).set(this.axisLengths);
    this.uVec("arrowHeights", 3).set(this.arrowHeights);
    this.uVec("arrowRadii", 3).set(this.arrowRadii);
  }
  draw(camera) {
    if (camera)
      camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    this.drawArrays("TRIANGLES", 0, 3 * 16 * 3);
  }
};
var AxisGridProgram = class extends WebProgram {
  constructor(gl, planes = ["XY"], axisLengths = new Vector3D2(1, 1, 1), divisions = 10) {
    super(gl, "", "");
    this.planes = planes;
    this.axisLengths = axisLengths;
    this.vertexCount = 0;
    this.divisions = 10;
    this.cellSize = 0.1;
    this.setDivisions(divisions);
  }
  loadProgram() {
    return __awaiter5(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShadersFromString(this.gl, `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;
            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = vec3(0.3);
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor,1.0); }`);
      return this;
    });
  }
  initUniforms(axisLengths) {
    if (axisLengths)
      this.axisLengths = axisLengths;
    else if (!this.axisLengths)
      this.axisLengths = new Vector3D2(1, 1, 1);
  }
  initVAO() {
    const vertices = [];
    for (const plane of this.planes)
      this.addGrid(plane, vertices);
    this.vertexCount = vertices.length / 3;
    if (!this.VAO)
      this.createVAO();
    this.VAO.bind().attribute("aPos", vertices, 3);
    return this;
  }
  addGrid(plane, vertices) {
    var _a2, _b2, _c2, _d, _e, _f;
    const sizeX = (_b2 = (_a2 = this.axisLengths) === null || _a2 === void 0 ? void 0 : _a2.x) !== null && _b2 !== void 0 ? _b2 : 1;
    const sizeY = (_d = (_c2 = this.axisLengths) === null || _c2 === void 0 ? void 0 : _c2.y) !== null && _d !== void 0 ? _d : 1;
    const sizeZ = (_f = (_e = this.axisLengths) === null || _e === void 0 ? void 0 : _e.z) !== null && _f !== void 0 ? _f : 1;
    const stepX = sizeX / this.divisions;
    const stepY = sizeY / this.divisions;
    const stepZ = sizeZ / this.divisions;
    if (plane === "XY") {
      for (let i = 0; i <= this.divisions; i++) {
        const x = i * stepX;
        vertices.push(x, 0, 0, x, sizeY, 0);
      }
      for (let i = 0; i <= this.divisions; i++) {
        const y = i * stepY;
        vertices.push(0, y, 0, sizeX, y, 0);
      }
    } else if (plane === "XZ") {
      for (let i = 0; i <= this.divisions; i++) {
        const x = i * stepX;
        vertices.push(x, 0, 0, x, 0, sizeZ);
      }
      for (let i = 0; i <= this.divisions; i++) {
        const z = i * stepZ;
        vertices.push(0, 0, z, sizeX, 0, z);
      }
    } else if (plane === "YZ") {
      for (let i = 0; i <= this.divisions; i++) {
        const y = i * stepY;
        vertices.push(0, y, 0, 0, y, sizeZ);
      }
      for (let i = 0; i <= this.divisions; i++) {
        const z = i * stepZ;
        vertices.push(0, 0, z, 0, sizeY, z);
      }
    }
  }
  draw(camera) {
    if (camera)
      camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    if (this.vertexCount)
      this.drawArrays("LINES", 0, this.vertexCount);
  }
  setDivisions(divisions) {
    this.divisions = Math.max(1, divisions);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.cellSize = avgAxis / this.divisions;
    return this;
  }
  setCellSize(size) {
    this.cellSize = Math.max(1e-3, size);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.divisions = Math.floor(avgAxis / this.cellSize);
    return this;
  }
};
var Axis3DGroup = class {
  constructor(gl, axisLengths = new Vector3D2(1, 1, 1), drawArrows = false, arrowHeights = new Vector3D2(0.1, 0.1, 0.1), arrowRadii = new Vector3D2(0.03, 0.03, 0.03), planes = []) {
    this.gl = gl;
    this.axisLengths = axisLengths;
    this.drawArrows = drawArrows;
    this.arrowHeights = arrowHeights;
    this.arrowRadii = arrowRadii;
    this.planes = planes;
    this.gridDivisions = 10;
    this.lines = new AxisLinesProgram(gl, axisLengths);
    if (drawArrows)
      this.cones = new AxisConesProgram(gl, this.arrowHeights, this.arrowRadii, axisLengths);
    if (planes && planes.length > 0)
      this.grid = new AxisGridProgram(gl, planes, this.axisLengths);
  }
  initUniforms() {
    var _a2, _b2;
    this.lines.use();
    (_b2 = (_a2 = this.lines).initUniforms) === null || _b2 === void 0 ? void 0 : _b2.call(_a2);
    this.lines.setAxisLengths(this.axisLengths.x, this.axisLengths.y, this.axisLengths.z);
    if (this.cones) {
      this.cones.axisLengths = this.axisLengths;
      this.cones.arrowHeights = this.arrowHeights;
      this.cones.arrowRadii = this.arrowRadii;
      this.cones.use();
      this.cones.initUniforms();
      this.cones.initVAO();
    }
    if (this.grid) {
      this.grid.use();
      this.grid.planes = this.planes;
      this.grid.axisLengths = this.axisLengths;
      this.grid.setDivisions(this.gridDivisions);
      this.grid.initVAO();
      this.grid.initUniforms();
    }
    return this;
  }
  draw(camera) {
    if (this.lines) {
      this.lines.use();
      this.lines.uVec("axisLengths", 3).set([this.axisLengths.x, this.axisLengths.y, this.axisLengths.z]);
      this.lines.draw(camera);
    }
    if (this.grid) {
      this.grid.use();
      if (!this.grid.VAO)
        this.grid.initVAO();
      this.grid.draw(camera);
    }
    if (this.cones) {
      this.cones.use();
      this.cones.axisLengths = this.axisLengths;
      this.cones.arrowHeights = this.arrowHeights;
      this.cones.arrowRadii = this.arrowRadii;
      if (!this.cones.VAO)
        this.cones.initVAO();
      this.cones.draw(camera);
    }
  }
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D2(x, y, z);
    this.lines.setAxisLengths(x, y, z);
    if (this.cones)
      this.cones.axisLengths = this.axisLengths;
    if (this.grid)
      this.grid.axisLengths = this.axisLengths;
    return this;
  }
  setArrowParams(heights, radii) {
    this.arrowHeights = heights;
    this.arrowRadii = radii;
    if (this.cones) {
      this.cones.arrowHeights = heights;
      this.cones.arrowRadii = radii;
      this.cones.initVAO();
    }
    return this;
  }
  setPlanes(planes) {
    this.planes = planes;
    if (this.grid) {
      this.grid.planes = planes;
      this.grid.initVAO();
    } else {
      this.grid = new AxisGridProgram(this.gl, planes, this.axisLengths);
    }
    return this;
  }
  setDivisions(divisions) {
    this.gridDivisions = divisions;
    if (this.grid)
      return this.grid.setDivisions(divisions);
    return this;
  }
  setCellSize(size) {
    if (this.grid)
      return this.grid.setCellSize(size);
    return this;
  }
  includeInWebManList() {
    if (this.lines)
      this.lines.includeInWebManList();
    if (this.grid)
      this.grid.includeInWebManList();
    if (this.cones)
      this.cones.includeInWebManList();
    return this;
  }
  loadProgram() {
    return __awaiter5(this, void 0, void 0, function* () {
      if (this.lines)
        yield this.lines.loadProgram();
      if (this.grid)
        yield this.grid.loadProgram();
      if (this.cones)
        yield this.cones.loadProgram();
      return this;
    });
  }
  use() {
    return this;
  }
};
var MeshFillerProgram = class extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, callBackString, varsContext = {}) {
    super(gl, "", "");
    this.valsTexUnit = valsTexUnit;
    this.w = w;
    this.h = h;
    this.uniformsToUpdate = [];
    if (callBackString)
      this.generateProgram(callBackString, varsContext);
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.error("Este navegador/GPU no permite renderizar en RFloat.");
    }
  }
  loadProgram(vs = this.vertPath, fs = this.fragPath) {
    return __awaiter5(this, void 0, void 0, function* () {
      [this.program, this.vert, this.frag] = yield loadShadersFromString(this.gl, vs, fs);
      this.use();
      this.uniformsToUpdate.forEach((u) => {
        u.setterObj = this.uFloat(u.name);
      });
      return this;
    });
  }
  tick() {
    if (!this.program)
      return;
    this.use();
    this.uniformsToUpdate.forEach((u) => {
      const currentVal = u.getter();
      if (u.setterObj && typeof u.setterObj.set === "function") {
        u.setterObj.set(currentVal);
      }
    });
    return this;
  }
  generateProgram(callbackString, ...varsContexts) {
    this.uniformsToUpdate = [];
    let uniformDecls = "";
    const arrowMatch = callbackString.match(/=>\s*([\s\S]*)$/);
    let body = arrowMatch ? arrowMatch[1].trim() : callbackString;
    if (body.startsWith("{") && body.endsWith("}")) {
      body = body.substring(1, body.length - 1).trim();
    }
    let glslBody = body.replace(/{([^}]+)}/g, (_, content) => {
      let path = content;
      let glslType = "float";
      const lastComma = content.lastIndexOf(",");
      if (lastComma !== -1) {
        const possibleType = content.substring(lastComma + 1).trim();
        if (/^(float|int|vec[2-4]|mat[2-4]|uint)$/.test(possibleType)) {
          path = content.substring(0, lastComma).trim();
          glslType = possibleType;
        }
      }
      const safeName = "u_ctx_" + path.replace(/[^a-zA-Z0-9]/g, "_").replace(/__/g, "_").replace(/^_|_$/g, "");
      if (!uniformDecls.includes(safeName)) {
        uniformDecls += `uniform ${glslType} ${safeName};
`;
        this.uniformsToUpdate.push({
          name: safeName,
          setterObj: null,
          getter: () => {
            try {
              const scope = new Proxy({}, {
                has(target, prop) {
                  if (typeof prop === "symbol")
                    return false;
                  return varsContexts.some((ctx) => ctx instanceof Map ? ctx.has(prop) : prop in ctx);
                },
                get(target, prop) {
                  if (prop === Symbol.unscopables)
                    return void 0;
                  for (let i = varsContexts.length - 1; i >= 0; i--) {
                    const ctx = varsContexts[i];
                    if (ctx instanceof Map) {
                      if (ctx.has(prop))
                        return ctx.get(prop);
                    } else {
                      if (prop in ctx)
                        return ctx[prop];
                    }
                  }
                  return void 0;
                }
              });
              const evalFunc = new Function("scope", `with(scope) { return ${path}; }`);
              let res = evalFunc(scope);
              return res;
            } catch (e) {
              return 0;
            }
          }
        });
      }
      return safeName;
    });
    const transpileMath = (str) => {
      str = str.replace(/Math\./g, "");
      str = str.replace(/(?<![\w\.])(\d+)(?![\w\.])/g, "$1.0");
      while (str.includes("**")) {
        let opIdx = str.indexOf("**");
        let left = opIdx - 1, base = "";
        if (str[left] === ")") {
          let count = 0, i = left;
          for (; i >= 0; i--) {
            if (str[i] === ")")
              count++;
            if (str[i] === "(")
              count--;
            if (count === 0) {
              i--;
              break;
            }
          }
          base = str.substring(i + 1, left + 1);
        } else {
          let match = str.substring(0, opIdx).match(/([\w\.\$]+)$/);
          base = match ? match[1] : "";
        }
        let right = opIdx + 2, exponent = "";
        if (str[right] === "(") {
          let count = 0, i = right;
          for (; i < str.length; i++) {
            if (str[i] === "(")
              count++;
            if (str[i] === ")")
              count--;
            if (count === 0)
              break;
          }
          exponent = str.substring(right, i + 1);
        } else {
          let match = str.substring(right).match(/^([\w\.\$]+)/);
          exponent = match ? match[1] : "";
        }
        str = str.replace(base + "**" + exponent, `pow(${base}, ${exponent})`);
      }
      return str;
    };
    glslBody = transpileMath(glslBody);
    if (glslBody.includes("return")) {
      glslBody = glslBody.replace(/return\s+([^;]+);?/, "float res = $1;");
    } else {
      glslBody = `float res = ${glslBody.replace(/;$/, "")};`;
    }
    this.vertPath = `#version 300 es
            const vec2 quad[6] = vec2[](
                vec2(-1,-1), vec2(1,-1), vec2(-1,1),
                vec2(-1,1), vec2(1,-1), vec2(1,1)
            );
            void main() { gl_Position = vec4(quad[gl_VertexID], 0.0, 1.0); }`;
    this.fragPath = `#version 300 es
            precision highp float;
            ${uniformDecls}
            layout(location = 0) out float outRed; 
            void main() {
                float x = gl_FragCoord.x;
                float y = gl_FragCoord.y;
                ${glslBody}
                outRed = res;
            }`;
    console.log("Shader generado con uniforms complejos:", this.fragPath);
  }
  draw() {
    var _a2, _b2;
    if (!this.program)
      return;
    const gl = this.gl;
    this.use();
    const tex = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit));
    if (!tex)
      return;
    const tw = (_a2 = tex.w) !== null && _a2 !== void 0 ? _a2 : this.w;
    const th = (_b2 = tex.h) !== null && _b2 !== void 0 ? _b2 : this.h;
    let fbo = this.cFrameBuffer().bind([0]);
    fbo.bindColorBuffer(tex, "ColAtch0");
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("FBO status:", status, "tex:", tex, "texWH:", tw, th, "progWH:", this.w, this.h);
      this.unbindFBO();
      return this;
    }
    gl.viewport(0, 0, this.w, this.h);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.unbindFBO();
    return this;
  }
};

// src/dependencies/Code/Game3D/Game3D.js
var Camera3D = class {
  constructor(position = new Vector3D(0, 0, 10), fov = 90, aspectRatio = 1080 / 720, near = 1e-3, far = 1e4, walkspeed = 10) {
    this.position = position;
    this.fov = fov;
    this.aspectRatio = aspectRatio;
    this.near = near;
    this.far = far;
    this.walkspeed = walkspeed;
    this.viewMatrix = Matrix4D.Identity;
    this.projectionMatrix = Matrix4D.Identity;
    this.direction = new Vector3D(0, 0, -1);
    this.UP = new Vector3D(0, 1, 0);
    this.followPosition = new Vector3D(0, 0, 1);
    this.following = false;
    this.getFollowPos = () => Vector3D.Zero;
    this.lastMousePos = { x: 0, y: 0 };
    this.invertX = false;
    this.invertY = false;
    this.invertXwhenFollowing = false;
    this.invertYwhenFollowing = true;
    this.keys = {
      "a": "a",
      "w": "w",
      "s": "s",
      "d": "d",
      "q": "q",
      "e": "e",
      "left": "left",
      "right": "right",
      "up": "up",
      "down": "down",
      "shift": "shift",
      "r": "r",
      rotMouse: true
    };
    this.uniforms = [];
  }
  setPos(pos) {
    this.position._ = pos;
    return this;
  }
  setFollowPos(pos) {
    this.followPosition._ = pos;
    return this;
  }
  calculateMatrices() {
    this.viewMatrix = Matrix4D.createLookAtMatrixFromDirection(this.position, this.direction, this.UP);
    this.projectionMatrix = Matrix4D.createProjectionMatrix(this.fov, this.aspectRatio, this.near, this.far);
    return this;
  }
  tick(dt, keypress2, mousepos2, mouseclick2) {
    let dmousex = mousepos2.x - this.lastMousePos.x;
    let dmousey = mousepos2.y - this.lastMousePos.y;
    let dmov = 6.5;
    let noMouse = false;
    if (this.right(keypress2))
      noMouse = true, dmousex = dmov;
    if (this.left(keypress2))
      noMouse = true, dmousex = -dmov;
    if (this.up(keypress2))
      noMouse = true, dmousey = -dmov;
    if (this.down(keypress2))
      noMouse = true, dmousey = dmov;
    if (this.r(keypress2))
      noMouse = true;
    dmousex *= this.fov / 60;
    dmousey *= this.fov / 60;
    if (!this.keys.rotMouse) {
      dmousex = 0;
      dmousey = 0;
    }
    if ((mouseclick2[0] || noMouse) && Math.abs(dmousex) < 100 && Math.abs(dmousey) < 100) {
      let invertY = !!this.invertX ? -1 : 1;
      let invertX = !!this.invertY ? -1 : 1;
      if (this.following) {
        if (this.invertXwhenFollowing !== void 0)
          invertX = !!this.invertXwhenFollowing ? -1 : 1;
        if (this.invertYwhenFollowing !== void 0)
          invertY = !!this.invertYwhenFollowing ? -1 : 1;
      }
      this.direction = Quaternion.rotateVector(this.direction, this.UP, -dmousex / 1e3 * Math.PI * 1.2 * invertX);
      this.direction = Quaternion.rotateVector(this.direction, this.UP.cross(this.direction), dmousey / 1e3 * Math.PI * 1.2 * invertY);
      this.UP = Quaternion.rotateVector(this.UP, this.UP.cross(this.direction), dmousey / 1e3 * Math.PI * 1.2 * invertY);
      if (this.r(keypress2)) {
        let rotdir = Math.PI * 0.7 * (this.shift(keypress2) ? -1 : 1) / 100;
        this.UP = Quaternion.rotateVector(this.UP, this.direction, rotdir);
      }
      if (this.following) {
        this.followPosition = Quaternion.rotateVector(this.followPosition, this.UP, -dmousex / 1e3 * Math.PI * 1.2 * invertX);
        this.followPosition = Quaternion.rotateVector(this.followPosition, this.UP.cross(this.direction), dmousey / 1e3 * Math.PI * 1.2 * invertY);
      }
    }
    if (this.following) {
      let centerVector = this.getFollowPos();
      this.followPosition = this.followPosition.add(this.direction.cross(this.UP).scalar(this.Hor(keypress2) * this.walkspeed * dt)).add(this.UP.scalar(this.Depth(keypress2) * this.walkspeed * dt)).add(this.direction.scalar(-this.Ver(keypress2) * this.walkspeed * dt));
      this.position = centerVector.add(this.followPosition);
    } else {
      this.position = this.position.add(this.direction.cross(this.UP).scalar(this.Hor(keypress2) * this.walkspeed * dt)).add(this.UP.scalar(this.Depth(keypress2) * this.walkspeed * dt)).add(this.direction.scalar(-this.Ver(keypress2) * this.walkspeed * dt));
    }
    this.lastMousePos = Object.assign({}, mousepos2);
  }
  Hor(keypress2) {
    return keypress2[this.keys["a"]] ? -1 : keypress2[this.keys["d"]] ? 1 : 0;
  }
  Ver(keypress2) {
    return keypress2[this.keys["w"]] ? -1 : keypress2[this.keys["s"]] ? 1 : 0;
  }
  Depth(keypress2) {
    return keypress2[this.keys["q"]] ? -1 : keypress2[this.keys["e"]] ? 1 : 0;
  }
  right(keypress2) {
    return keypress2[this.keys["right"]];
  }
  left(keypress2) {
    return keypress2[this.keys["left"]];
  }
  down(keypress2) {
    return keypress2[this.keys["down"]];
  }
  up(keypress2) {
    return keypress2[this.keys["up"]];
  }
  shift(keypress2) {
    return keypress2[this.keys["shift"]];
  }
  r(keypress2) {
    return keypress2[this.keys["r"]];
  }
  setMoveControlsAt(key = "unbind") {
    if (key == "s") {
      this.keys["a"] = "a";
      this.keys["w"] = "w";
      this.keys["s"] = "s";
      this.keys["d"] = "d";
      this.keys["r"] = "r";
      this.keys["q"] = "q";
      this.keys["e"] = "e";
    }
    if (key == "g") {
      this.keys["a"] = "f";
      this.keys["w"] = "t";
      this.keys["s"] = "g";
      this.keys["d"] = "h";
      this.keys["r"] = "u";
      this.keys["q"] = "r";
      this.keys["e"] = "y";
    }
    if (key == "k") {
      this.keys["a"] = "j";
      this.keys["w"] = "i";
      this.keys["s"] = "k";
      this.keys["d"] = "l";
      this.keys["r"] = "p";
      this.keys["q"] = "u";
      this.keys["e"] = "o";
    }
    if (key == "unbind") {
      this.keys["a"] = "none";
      this.keys["w"] = "none";
      this.keys["s"] = "none";
      this.keys["d"] = "none";
      this.keys["r"] = "none";
      this.keys["q"] = "none";
      this.keys["e"] = "none";
    }
    return this;
  }
  bindRKey(key = "none") {
    this.keys["r"] = key;
    return this;
  }
  setCamControlsAt(key = "unbind") {
    if (key == "down") {
      this.keys["right"] = "right";
      this.keys["left"] = "left";
      this.keys["down"] = "down";
      this.keys["up"] = "up";
    }
    if (key == "g") {
      this.keys["right"] = "f";
      this.keys["left"] = "t";
      this.keys["down"] = "g";
      this.keys["up"] = "h";
    }
    if (key == "k") {
      this.keys["right"] = "j";
      this.keys["left"] = "i";
      this.keys["down"] = "k";
      this.keys["up"] = "l";
    }
    if (key == "unbind") {
      this.keys["right"] = "none";
      this.keys["left"] = "none";
      this.keys["down"] = "none";
      this.keys["up"] = "none";
    }
    return this;
  }
  setMouseControls(key = "unbind") {
    if (key == "mouse") {
      this.keys.rotMouse = true;
    }
    if (key == "unbind") {
      this.keys.rotMouse = false;
    }
  }
  setUniforms(u_viewMatrix, u_projectionMatrix, u_cameraPosition) {
    var _a2, _b2, _c2;
    (_a2 = u_viewMatrix === null || u_viewMatrix === void 0 ? void 0 : u_viewMatrix.set) === null || _a2 === void 0 ? void 0 : _a2.call(u_viewMatrix, this.viewMatrix);
    (_b2 = u_projectionMatrix === null || u_projectionMatrix === void 0 ? void 0 : u_projectionMatrix.set) === null || _b2 === void 0 ? void 0 : _b2.call(u_projectionMatrix, this.projectionMatrix);
    (_c2 = u_cameraPosition === null || u_cameraPosition === void 0 ? void 0 : u_cameraPosition.set) === null || _c2 === void 0 ? void 0 : _c2.call(u_cameraPosition, this.position);
  }
  setUniformsProgram(program) {
    if (!this.uniforms[program.ID]) {
      this.uniforms[program.ID] = [program.uMat4("u_viewMatrix"), program.uMat4("u_projectionMatrix"), program.uVec("cameraPos", 3)];
    }
    this.setUniforms(...this.uniforms[program.ID]);
  }
};

// src/dependencies/Code/WebGL/webglParser.ts
var DetailedParser = class _DetailedParser {
  static {
    this.DRAW_BLOCK_MODES = {
      drawPoints: "POINTS",
      drawLineStrip: "LINE_STRIP",
      drawLineLoop: "LINE_LOOP",
      drawLines: "LINES",
      drawTriangleStrip: "TRIANGLE_STRIP",
      drawTriangleFan: "TRIANGLE_FAN",
      drawTriangles: "TRIANGLES"
    };
  }
  static {
    this.GLSL_TYPE_HINTS = /* @__PURE__ */ new Set([
      "float",
      "int",
      "uint",
      "vec2",
      "vec3",
      "vec4",
      "mat2",
      "mat3",
      "mat4"
    ]);
  }
  static {
    this.RESERVED_CONTEXT_NAMES = /* @__PURE__ */ new Set([
      "Math",
      "sin",
      "cos",
      "tan",
      "exp",
      "floor",
      "ceil",
      "min",
      "max",
      "round",
      "random",
      "abs",
      "pow",
      "sqrt",
      "atan2",
      "log",
      "PI",
      "true",
      "false",
      "null",
      "undefined",
      "float",
      "int",
      "uint",
      "vec2",
      "vec3",
      "vec4",
      "mat2",
      "mat3",
      "mat4"
    ]);
  }
  static {
    this.shaderFilters = [];
  }
  static {
    this.transpileShaderFilters = [];
  }
  static {
    this.transpileTexAliasToUniform = /* @__PURE__ */ new Map();
  }
  static {
    this.transpileTexAliasToTextureVar = /* @__PURE__ */ new Map();
  }
  static {
    this.transpileTexDeclaredNames = /* @__PURE__ */ new Set();
  }
  static {
    this.transpileProgramOutAliases = /* @__PURE__ */ new Map();
  }
  static {
    this.transpileTemplateBlocks = /* @__PURE__ */ new Map();
  }
  static {
    this.transpileFunctionBlocks = /* @__PURE__ */ new Map();
  }
  static {
    this.transpileLastUsedProgramExpr = "lastUsedProgram";
  }
  static extractRootIdentifiersFromExpr(expr) {
    const out = [];
    const re = /(?<![\w$.])([A-Za-z_$]\w*)/g;
    let m;
    while ((m = re.exec(expr)) !== null) out.push(m[1]);
    return [...new Set(out)];
  }
  static extractContextNamesFromCallback(callbackString) {
    const names = /* @__PURE__ */ new Set();
    (callbackString || "").replace(/{([^{}]+)}/g, (_, raw) => {
      let expr = (raw || "").trim();
      const lastComma = expr.lastIndexOf(",");
      if (lastComma !== -1) {
        const maybeType = expr.substring(lastComma + 1).trim();
        if (_DetailedParser.GLSL_TYPE_HINTS.has(maybeType)) {
          expr = expr.substring(0, lastComma).trim();
        }
      }
      for (const id of _DetailedParser.extractRootIdentifiersFromExpr(expr)) {
        if (!_DetailedParser.RESERVED_CONTEXT_NAMES.has(id)) names.add(id);
      }
      return "";
    });
    return [...names];
  }
  static {
    // 1. Definimos el contexto estático global de forma limpia
    this.GlobalContext = {
      // Clases del usuario (de tus imports)
      MeshRenderingProgram,
      MeshFillerProgram,
      Axis3DGroup,
      Camera3D,
      Vector3D: Vector3D2,
      KeyManager,
      openFullscreen,
      addFunc,
      W,
      H,
      gl: null,
      keypress,
      mousepos,
      mouseclick,
      cam: void 0,
      WebProgram,
      WebGLMan,
      TexExamples
    };
  }
  static {
    // 2. Usamos el nombre completo de la clase para acceder a GlobalContext
    this.ObjectRegistry = {
      "Program": (params, gl) => {
        if (!WebGLMan.stWebGLMan.gl)
          WebGLMan.setGL(gl);
        let program = _DetailedParser.gctx.WebGLMan.program(-1, params.get(0) || params.get("firstAlias"));
        _DetailedParser.lastUsedProgram = program;
        return program;
      },
      "MeshProgram": (params, gl) => {
        let program = new _DetailedParser.gctx.MeshRenderingProgram(
          gl,
          params.get("input"),
          params.get(0)[0],
          params.get(0)[1]
        ).includeInWebManList();
        _DetailedParser.lastUsedProgram = program;
        return program;
      },
      "MeshFillerProgram": async (params, gl) => {
        let program = new _DetailedParser.gctx.MeshFillerProgram(
          gl,
          params.get(0)
        ).includeInWebManList();
        if (params.get(1)) {
          program.generateProgram(params.get(1), _DetailedParser.ctx.vars, _DetailedParser.GlobalContext);
          await program.loadProgram();
        }
        if (!_DetailedParser.lastFillerProgram) {
          _DetailedParser.lastFillerProgram = program;
        }
        return program;
      },
      "Axis3DGroup": (params, gl) => new _DetailedParser.gctx.Axis3DGroup(
        gl,
        params.get("axisLength"),
        params.get("drawArrows"),
        params.get("heights"),
        params.get("radii"),
        params.get("planes")
      ).includeInWebManList(),
      "Camera3D": (params, gl) => {
        let cam = new _DetailedParser.gctx.Camera3D(
          params.get("pos"),
          params.get("fov"),
          params.get("aspectRatio") || params.get("ratio"),
          params.get("near"),
          params.get("far"),
          params.get("walkspeed") || params.get("speed")
        );
        if (!_DetailedParser.gctx.cam) {
          _DetailedParser.gctx.cam = cam;
        }
        return cam;
      }
    };
  }
  static {
    // --- Utilidad interna para procesar el cuerpo de las funciones matemáticas ---
    this.prepareMathFunction = (callbackString) => {
      const contextVarSet = /* @__PURE__ */ new Set();
      let bodyPrepared = (callbackString || "").replace(/{([^{}]+)}/g, (_, rawContent) => {
        let expr = (rawContent || "").trim();
        const lastComma = expr.lastIndexOf(",");
        if (lastComma !== -1) {
          const maybeType = expr.substring(lastComma + 1).trim();
          if (_DetailedParser.GLSL_TYPE_HINTS.has(maybeType)) {
            expr = expr.substring(0, lastComma).trim();
          }
        }
        for (const id of _DetailedParser.extractRootIdentifiersFromExpr(expr)) {
          if (!_DetailedParser.RESERVED_CONTEXT_NAMES.has(id)) contextVarSet.add(id);
        }
        return `(${expr})`;
      });
      const arrowMatch = bodyPrepared.match(/^(?:\(([^)]*)\)|([^=\s]+))\s*=>\s*([\s\S]*)$/);
      let userArgs = ["x", "y"], body = bodyPrepared;
      if (arrowMatch) {
        const argsStr = arrowMatch[1] || arrowMatch[2] || "";
        userArgs = argsStr ? argsStr.split(",").map((a) => a.trim()) : [];
        body = arrowMatch[3].trim();
        if (body.startsWith("{") && body.endsWith("}")) {
          body = body.substring(1, body.length - 1).trim();
        }
      }
      function replacePowers(str) {
        while (str.indexOf("**") !== -1) {
          let index = str.indexOf("**");
          let left = index - 1, base = "", pCount = 0;
          if (str[left] === ")") {
            let j = left;
            for (; j >= 0; j--) {
              if (str[j] === ")") pCount++;
              if (str[j] === "(") pCount--;
              if (pCount === 0) break;
            }
            base = str.substring(j, left + 1);
          } else {
            let match = str.substring(0, index).match(/([\w\.\$\?]+)$/);
            base = match ? match[0] : "";
          }
          let right = index + 2, exponent = "", epCount = 0;
          if (str[right] === "(") {
            let j = right;
            for (; j < str.length; j++) {
              if (str[j] === "(") epCount++;
              if (str[j] === ")") epCount--;
              if (epCount === 0) break;
            }
            exponent = str.substring(right, j + 1);
          } else {
            let match = str.substring(right).match(/^([\w\.\$\?]+)/);
            exponent = match ? match[0] : "";
          }
          str = str.replace(base + "**" + exponent, `Math.pow(${base},${exponent})`);
        }
        return str;
      }
      let cleanBody = replacePowers(body);
      cleanBody = cleanBody.replace(/(?<!\.)\b(sin|cos|tan|exp|floor|ceil|min|max|round|random|abs|pow|sqrt|atan2|log|PI)\b/g, "Math.$1");
      try {
        const contextVars = [...contextVarSet].filter((v) => !userArgs.includes(v));
        const finalArgs = [...userArgs, ...contextVars];
        const hasLogic = cleanBody.includes("return") || cleanBody.includes("if") || cleanBody.includes(";");
        const finalBody = hasLogic ? cleanBody : `return ${cleanBody}`;
        const compiledFunc = new Function(...finalArgs, finalBody);
        return (...callArgs) => {
          const currentContextValues = contextVars.map(
            (varName) => _DetailedParser.getVar(varName) ?? _DetailedParser.gctx[varName] ?? _DetailedParser.ctx.thiscontext?.[varName]
          );
          return compiledFunc(...callArgs, ...currentContextValues);
        };
      } catch (e) {
        throw new Error(`Error sint\xE1ctico en funci\xF3n matem\xE1tica: ${e.message} -> ${cleanBody}`);
      }
    };
  }
  static {
    this.FunctionRegistry = {
      "createIdealMesh": (params, gl) => {
        let allParts = [];
        let k = 1;
        while (params.has(k)) {
          allParts.push(params.get(k));
          k++;
        }
        let callbackString = allParts.join(" ").trim().replace(/;$/, "");
        try {
          const func = _DetailedParser.prepareMathFunction(callbackString);
          if (!_DetailedParser.lastUsedProgram) return;
          let texture = _DetailedParser.lastUsedProgram.createIdealTexture(params.get(0), func);
          const texID = params.get(0).toString().match(/\d+/);
          texture.lastPreparedFunc = callbackString;
          _DetailedParser.ctx.vars.set("texture" + (texID ? texID : ""), texture);
          _DetailedParser.ctx.vars.get("texture" + (texID ? texID : "")).func = func;
          return texture;
        } catch (e) {
          console.error(e.message);
        }
      },
      "fillMeshTexture": (params, gl) => {
        const targetTexture = _DetailedParser.getVar(params.get(0));
        if (!targetTexture) {
          console.error(`fillMeshTexture: No se encontr\xF3 la variable ${params.get(0)}`);
          return;
        }
        const texID = targetTexture.unit;
        let allParts = [];
        let k = 1;
        while (params.has(k)) {
          allParts.push(params.get(k));
          k++;
        }
        let callbackString = allParts.join(" ").trim().replace(/;$/, "");
        if (targetTexture.lastPreparedFunc != callbackString) {
          const func = _DetailedParser.prepareMathFunction(callbackString);
          targetTexture.func = func;
          targetTexture.lastPreparedFunc = callbackString;
        }
        try {
          let func = _DetailedParser.ctx.vars.get("texture" + (texID ? texID : "")).func;
          if (!func)
            func = _DetailedParser.prepareMathFunction(callbackString);
          if (!_DetailedParser.lastUsedProgram) return;
          _DetailedParser.lastUsedProgram.fillMeshTexture(targetTexture, func);
        } catch (e) {
          console.error(e.message);
        }
      },
      "draw": (params, gl) => {
        const obj = _DetailedParser.getVar(params.get(0));
        if (obj && _DetailedParser.getVar("camera3D")) {
          _DetailedParser.lastUsedProgram.use();
          _DetailedParser.getVar("camera3D").calculateMatrices();
          _DetailedParser.lastUsedProgram.draw(0, 0, params.get(1), params.get(2), params.get(3));
        }
      },
      "viewport": (params, gl) => {
        let program = _DetailedParser.lastUsedProgram;
        let viewPort;
        let p0txt = params.get(0);
        if (!p0txt.startsWith("{")) {
          p0txt = "{" + p0txt + "}";
        }
        let p0 = _DetailedParser.parseValue(p0txt);
        let p1 = params.get(1);
        if (p0?.isWebProgram?.()) {
          program = p0;
          Array.isArray(p1);
          viewPort = p1;
        } else if (Array.isArray(p0)) {
          viewPort = params.get(0);
        }
        if (!viewPort) return;
        program.use();
        program.setViewport(...viewPort);
      },
      "depthTest": (params, gl) => {
        if (_DetailedParser.lastUsedProgram) {
          _DetailedParser.lastUsedProgram.isDepthTest = params.get(0);
        }
      },
      "start": (params, gl) => {
        start();
      },
      "startAsync": async (params, gl) => {
        await startAsync();
      },
      "log": (params, gl) => {
      },
      "let": (params, gl) => {
        let a = params.get("match0");
        let b = params.get(params.get("match0"));
        if (b === void 0) {
          _DetailedParser.ctx.vars.set(a, null);
          return;
        }
        _DetailedParser.ctx.vars.set(a.trim(), b);
        return;
      },
      "lduse": async (params, gl) => {
        const obj = _DetailedParser.getVar(params.get(0));
        if (obj && typeof obj.use === "function" && typeof obj.loadProgram === "function") {
          await _DetailedParser.loadProgramWithShaderFilters(obj, gl);
          obj.use();
          _DetailedParser.lastUsedProgram = obj;
          return obj;
        }
      },
      "use": async (params, gl) => {
        const obj = _DetailedParser.getVar(params.get(0));
        if (obj && typeof obj.use === "function") {
          obj.use();
          _DetailedParser.lastUsedProgram = obj;
          return obj;
        }
      },
      ...["uMat4", "uMat3", "uMat2", "uVec", "uNum", "uFloat", "uInt"].reduce((acc, fnName) => {
        acc[fnName] = (params, gl) => {
          const program = _DetailedParser.lastUsedProgram;
          if (!program) return;
          const name = params.get(0);
          let args = [name];
          if (fnName === "uVec") {
            args = [
              name,
              params.get("dim") ?? params.get("dimension"),
              params.get("isFloat") ?? true,
              params.get("isUnsignedInt") ?? false
            ];
          } else if (fnName === "uNum") {
            args = [
              name,
              params.get("isFloat") ?? true,
              params.get("isUnsignedInt") ?? false
            ];
          }
          const uniformObj = program[fnName](...args);
          _DetailedParser.ctx.vars.set(`u_${name}`, uniformObj);
          const potentialValueIdx = args.length;
          if (params.has(2)) {
            uniformObj.set(params.get(potentialValueIdx));
          }
          return uniformObj;
        };
        return acc;
      }, {}),
      // --- Operaciones de Buffer ---
      "cFrameBuffer": (params, gl) => {
        return _DetailedParser.lastUsedProgram?.cFrameBuffer();
      },
      "unbindFrameBuffer": (params, gl) => {
        return _DetailedParser.lastUsedProgram?.unbindFrameBuffer();
      },
      "unbindFBO": (params, gl) => {
        return _DetailedParser.lastUsedProgram?.unbindFBO();
      },
      // --- Dibujo Avanzado ---
      "drawArrays": (params, gl) => {
        const program = _DetailedParser.lastUsedProgram;
        if (!program) return;
        const modeStr = params.get(0) || "TRIANGLES";
        const mode = gl[modeStr.toUpperCase()] || gl.TRIANGLES;
        const vaoOff = params.get("off") ?? params.get(1) ?? 0;
        const vertexCount = params.get("vCount") ?? params.get("length") ?? params.get("vertexCount") ?? params.get(2);
        const instanceCount = params.get("instances") ?? params.get("instanceCount") ?? params.get(3) ?? 1;
        return program.drawArrays(mode, vaoOff, vertexCount, instanceCount);
      },
      "drawElements": (params, gl) => {
        const program = _DetailedParser.lastUsedProgram;
        if (!program) return;
        const modeStr = params.get(0) || "TRIANGLES";
        const mode = gl[modeStr.toUpperCase()] || gl.TRIANGLES;
        const elementCount = params.get("elCount") ?? params.get("elementCount") ?? params.get(1) ?? program.VAO?.eboLength;
        const rawType = params.get("type") ?? params.get(2) ?? "US";
        const typeMap = { "UB": "UNSIGNED_BYTE", "US": "UNSIGNED_SHORT", "UI": "UNSIGNED_INT" };
        const type = typeMap[rawType] || rawType || "UNSIGNED_SHORT";
        const eboOff = params.get("off") ?? params.get("eboOff") ?? params.get(3) ?? 0;
        const instanceCount = params.get("instances") ?? params.get("instanceCount") ?? params.get(4) ?? 0;
        return program.drawElements(mode, elementCount, type, eboOff, instanceCount);
      },
      "texture2DArray": (params, gl) => {
        let sx = 0, sy = 0, sz = 0;
        let sizeParam = params.get(4);
        if (Array.isArray(sizeParam)) {
          if (sizeParam[0] !== void 0) sx = sizeParam[0];
          if (sizeParam[1] !== void 0) sy = sizeParam[1];
          if (sizeParam[2] !== void 0) sz = sizeParam[2];
        }
        let datatxt = params.get(1);
        if (!datatxt.startsWith("{")) {
          datatxt = "{" + datatxt + "}";
        }
        return _DetailedParser.lastUsedProgram?.texture2DArray?.({
          format: _DetailedParser.gctx.TexExamples[params.get(0)],
          data: _DetailedParser.parseValue(datatxt),
          name: params.get(2),
          texUnit: params.get(3),
          size: [sx, sy, sz]
        });
      }
    };
  }
  static get lastUsedProgram() {
    return _DetailedParser.context.lastUsedProgram;
  }
  static set lastUsedProgram(p) {
    _DetailedParser.context.lastUsedProgram = p;
  }
  static get lastFillerProgram() {
    return _DetailedParser.context.lastFillerProgram;
  }
  static set lastFillerProgram(p) {
    _DetailedParser.context.lastFillerProgram = p;
  }
  static getVar(name) {
    return _DetailedParser.context.vars.get(name);
  }
  /**
   * Une las líneas si la sangría aumenta Y la línea actual no parece un comando independiente.
   * @param lines Array de líneas ya limpias (sin comentarios/tabs expandidos).
   * @returns Array de líneas donde las continuaciones están unidas por un espacio.
   */
  static joinIndentedLines(lines) {
    if (lines.length <= 1) return lines;
    const result = [];
    let previousLine = lines[0];
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const previousIndentMatch = previousLine.match(/^(\s*)/);
      const currentIndentMatch = currentLine.match(/^(\s*)/);
      const previousIndent = previousIndentMatch ? previousIndentMatch[1].length : 0;
      const currentIndent = currentIndentMatch ? currentIndentMatch[1].length : 0;
      const currentTrim = currentLine.trim();
      const looksLikeOwnCommand = /^(?:let|var|use|lduse|uniforms|rebind|framebuffer|viewport|drawTriangles|draw|log|if|else|while|resource|program|depthTest|start|startAsync)\b/.test(currentTrim);
      if (currentIndent > previousIndent && currentLine.trim().length > 0 && !(previousLine.trim().endsWith("{") || previousLine.trim().endsWith("}")) && !looksLikeOwnCommand) {
        previousLine += " " + currentLine;
      } else {
        result.push(previousLine);
        previousLine = currentLine;
      }
    }
    result.push(previousLine);
    return result;
  }
  static parseBlockParams(raw) {
    if (!raw) return null;
    return raw.split(",").map((p) => p.trim()).map((p) => {
      const rangeMatch = p.match(/^(\w+)\s*=\s*(.+?):(.+)$/);
      if (rangeMatch) {
        return {
          name: rangeMatch[1],
          start: rangeMatch[2],
          end: rangeMatch[3],
          type: "range"
        };
      }
      const simpleMatch = p.match(/^(\w+)\s*=\s*(.+)$/);
      if (simpleMatch) {
        return {
          name: simpleMatch[1],
          value: simpleMatch[2],
          type: "list"
        };
      }
      return null;
    }).filter(Boolean);
  }
  static {
    this.currentBlockContent = [];
  }
  // Acumulador de líneas del bloque actual
  static parseBlockHeader(line) {
    const m = line.match(/^(?:(async)\s+)?(\w+)\s*(.*?)\s*\{$/);
    if (!m) return null;
    const isAsync = m[1] === "async";
    const name = m[2];
    if (["use", "lduse", "uniforms", "rebind", "framebuffer", "viewport"].includes(name) || Object.prototype.hasOwnProperty.call(_DetailedParser.DRAW_BLOCK_MODES, name)) {
      return null;
    }
    let tail = (m[3] || "").trim();
    let priority;
    const prioMatch = tail.match(/\(([-+]?\d+(?:\.\d+)?)\)\s*$/);
    if (prioMatch) {
      const p = Number(prioMatch[1]);
      if (Number.isFinite(p)) priority = p;
      tail = tail.slice(0, prioMatch.index).trim();
    }
    let rawParams;
    if (tail) {
      if (tail.startsWith("(") && tail.endsWith(")")) {
        rawParams = tail.slice(1, -1).trim();
      } else {
        rawParams = tail;
      }
    }
    return { isAsync, name, rawParams, priority };
  }
  static stripInlineComment(line) {
    if (/^\s*(vert|frag|both)\s+/.test(line)) {
      return line;
    }
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length - 1; i++) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      if (ch === '"' && !inSingle) inDouble = !inDouble;
      if (!inSingle && !inDouble && ch === "/" && next === "/") {
        return line.slice(0, i);
      }
    }
    return line;
  }
  /**
   *"texA, texB->ColAtch1, texC" se divide en ["texA", "texB->ColAtch1", "texC"]
   */
  static splitTopLevelByChar(input, separator = ",") {
    const out = [];
    let current = "";
    let depthRound = 0;
    let depthSquare = 0;
    let depthCurly = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        current += ch;
        continue;
      }
      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        current += ch;
        continue;
      }
      if (!inSingle && !inDouble) {
        if (ch === "(") depthRound++;
        if (ch === ")") depthRound--;
        if (ch === "[") depthSquare++;
        if (ch === "]") depthSquare--;
        if (ch === "{") depthCurly++;
        if (ch === "}") depthCurly--;
        if (ch === separator && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
          out.push(current.trim());
          current = "";
          continue;
        }
      }
      current += ch;
    }
    if (current.trim().length > 0) out.push(current.trim());
    return out;
  }
  static splitTopLevelArrow(input) {
    let depthRound = 0;
    let depthSquare = 0;
    let depthCurly = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < input.length - 1; i++) {
      const ch = input[i];
      const next = input[i + 1];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }
      if (inSingle || inDouble) continue;
      if (ch === "(") depthRound++;
      else if (ch === ")") depthRound--;
      else if (ch === "[") depthSquare++;
      else if (ch === "]") depthSquare--;
      else if (ch === "{") depthCurly++;
      else if (ch === "}") depthCurly--;
      else if (ch === "-" && next === ">" && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
        return [input.slice(0, i).trim(), input.slice(i + 2).trim()];
      }
    }
    return null;
  }
  static stripInlineDslTags(line) {
    if (!line) return line;
    let out = line;
    out = out.replace(/^\s*-\s*(?:opti-)?[A-Za-z0-9_][A-Za-z0-9_-]*\s*-\s*[\s\S]*?-\s*(?=[A-Za-z_]|if\b|while\b|for\b|use\b|draw\b|program\b|uniforms\b|rebind\b|framebuffer\b)/i, "");
    out = out.replace(/\s+-\s*(?:opti-)?[A-Za-z0-9_][A-Za-z0-9_-]*\s*-\s*[\s\S]*?-\s*(?=\{)/ig, " ");
    return out.trimEnd();
  }
  static splitTopLevelAssignLE(input) {
    let depthRound = 0;
    let depthSquare = 0;
    let depthCurly = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < input.length - 1; i++) {
      const ch = input[i];
      const next = input[i + 1];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }
      if (inSingle || inDouble) continue;
      if (ch === "(") depthRound++;
      else if (ch === ")") depthRound--;
      else if (ch === "[") depthSquare++;
      else if (ch === "]") depthSquare--;
      else if (ch === "{") depthCurly++;
      else if (ch === "}") depthCurly--;
      if (depthRound === 0 && depthSquare === 0 && depthCurly === 0 && ch === "<" && next === "=") {
        const left = input.slice(0, i).trim();
        const right = input.slice(i + 2).trim();
        if (left && right) return [left, right];
      }
    }
    return null;
  }
  static parseShaderFilterTokenValue(token) {
    const trimmed = (token || "").trim();
    if (!trimmed) return "";
    if (trimmed === "*") return "*";
    if (/^\/(?:\\.|[^\/])+\/[gimsuy]*$/.test(trimmed)) {
      const lastSlash = trimmed.lastIndexOf("/");
      return new RegExp(trimmed.slice(1, lastSlash), trimmed.slice(lastSlash + 1));
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'") || trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return _DetailedParser.parseValue(trimmed);
    }
    return trimmed;
  }
  static transpileShaderFilterToken(token) {
    const trimmed = (token || "").trim();
    if (!trimmed) return '""';
    if (trimmed === "*") return '"*"';
    if (/^\/(?:\\.|[^\/])+\/[gimsuy]*$/.test(trimmed)) {
      const lastSlash = trimmed.lastIndexOf("/");
      const source = trimmed.slice(1, lastSlash);
      const flags = trimmed.slice(lastSlash + 1);
      return `new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)})`;
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed;
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return _DetailedParser.transpileExpr(trimmed);
    return JSON.stringify(trimmed);
  }
  static parseShaderFilterSpec(line) {
    const arrow = _DetailedParser.splitTopLevelArrow(line);
    if (!arrow) return null;
    const [left, rawReplacement] = arrow;
    const tokens = _DetailedParser.splitByWhitespaceTopLevel(left);
    if (tokens.length < 3) return null;
    const stage = (tokens[0] || "both").trim();
    if (!["vert", "frag", "both"].includes(stage)) return null;
    return {
      stage,
      filePattern: _DetailedParser.parseShaderFilterTokenValue(tokens[1]),
      searchPattern: _DetailedParser.parseShaderFilterTokenValue(tokens[2]),
      replacement: _DetailedParser.parseShaderFilterTokenValue(rawReplacement)
    };
  }
  static loadShaderFiltersFromLines(lines) {
    _DetailedParser.shaderFilters = [];
    for (const line of lines || []) {
      const rule = _DetailedParser.parseShaderFilterSpec(line);
      if (rule) _DetailedParser.shaderFilters.push(rule);
    }
  }
  static loadTranspileShaderFiltersFromLines(lines) {
    _DetailedParser.transpileShaderFilters = [];
    for (const line of lines || []) {
      const arrow = _DetailedParser.splitTopLevelArrow(line);
      if (!arrow) continue;
      const [left, rawReplacement] = arrow;
      const tokens = _DetailedParser.splitByWhitespaceTopLevel(left);
      if (tokens.length < 3) continue;
      const stage = (tokens[0] || "both").trim();
      if (!["vert", "frag", "both"].includes(stage)) continue;
      _DetailedParser.transpileShaderFilters.push({
        stage,
        filePatternExpr: _DetailedParser.transpileShaderFilterToken(tokens[1]),
        searchPatternExpr: _DetailedParser.transpileShaderFilterToken(tokens[2]),
        replacementExpr: _DetailedParser.transpileShaderFilterToken(rawReplacement)
      });
    }
  }
  static shaderFilePatternMatches(filePattern, filePath) {
    const pathText = String(filePath || "");
    if (filePattern === void 0 || filePattern === null || filePattern === "*") return true;
    if (filePattern instanceof RegExp) {
      filePattern.lastIndex = 0;
      return filePattern.test(pathText);
    }
    return pathText.includes(String(filePattern));
  }
  static applyShaderFilterMatch(source, searchPattern, replacement) {
    const search = searchPattern instanceof RegExp ? new RegExp(searchPattern.source, searchPattern.flags) : searchPattern;
    const repl = String(replacement ?? "");
    if (search instanceof RegExp) return source.replace(search, repl);
    return source.split(String(search ?? "")).join(repl);
  }
  static buildShaderFilter(stage, filePath) {
    return (source) => {
      let out = source;
      for (const rule of _DetailedParser.shaderFilters || []) {
        if (!rule) continue;
        if (rule.stage !== "both" && rule.stage !== stage) continue;
        if (!_DetailedParser.shaderFilePatternMatches(rule.filePattern, filePath)) continue;
        out = _DetailedParser.applyShaderFilterMatch(out, rule.searchPattern, rule.replacement);
      }
      return out;
    };
  }
  static extractShaderFilterLines(lines) {
    const kept = [];
    const filterLines = [];
    let inShaderFilters = false;
    for (const rawLine of lines || []) {
      const trimmed = (rawLine || "").trim();
      if (!inShaderFilters && /^glslFilters\s*\{$/.test(trimmed)) {
        inShaderFilters = true;
        continue;
      }
      if (inShaderFilters) {
        if (trimmed === "}") {
          inShaderFilters = false;
          continue;
        }
        if (trimmed) filterLines.push(trimmed);
        continue;
      }
      kept.push(rawLine);
    }
    return { lines: kept, filterLines };
  }
  static createShaderFromSource(gl, type, source, label = "") {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error(`Error compiling shader${label ? ` (${label})` : ""}: ${info}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  static createProgramFromSources(gl, vertexSource, fragmentSource, vertexLabel = "", fragmentLabel = "") {
    const vert = _DetailedParser.createShaderFromSource(gl, gl.VERTEX_SHADER, vertexSource, vertexLabel);
    const frag = _DetailedParser.createShaderFromSource(gl, gl.FRAGMENT_SHADER, fragmentSource, fragmentLabel);
    if (!vert || !frag) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error(`Error linking program${vertexLabel || fragmentLabel ? ` (${vertexLabel || fragmentLabel})` : ""}: ${info}`);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      return null;
    }
    return { program, vert, frag };
  }
  static async loadProgramWithShaderFilters(obj, gl) {
    const vertexPath = obj?.vertPath;
    const fragmentPath = obj?.fragPath;
    if (!obj || typeof obj.loadProgram !== "function") return obj;
    if (!vertexPath || !fragmentPath) {
      await obj.loadProgram();
      return obj;
    }
    const vertexFilter = _DetailedParser.buildShaderFilter("vert", vertexPath);
    const fragmentFilter = _DetailedParser.buildShaderFilter("frag", fragmentPath);
    await obj.loadProgram(vertexPath, fragmentPath, vertexFilter, fragmentFilter);
    return obj;
  }
  static transpileShaderFilterFactory(stage, filePathExpr) {
    if (!(_DetailedParser.transpileShaderFilters || []).length) return `(source => source)`;
    return `__makeTranspiledShaderFilter(${JSON.stringify(stage)}, ${filePathExpr})`;
  }
  static buildTranspiledShaderFilterRulesSource() {
    return (_DetailedParser.transpileShaderFilters || []).map((rule) => `{ stage: ${JSON.stringify(rule.stage)}, filePattern: () => (${rule.filePatternExpr}), searchPattern: () => (${rule.searchPatternExpr}), replacement: () => (${rule.replacementExpr}) }`).join(", ");
  }
  static buildTranspiledShaderFilterHelperLines() {
    const rules = _DetailedParser.buildTranspiledShaderFilterRulesSource();
    if (!rules.length) return [];
    return [
      `var __transpiledShaderFilterRules = [${rules}];`,
      ``,
      `// Aplica reglas de sustitucion sobre en el texto del shader.`,
      `// La lista de reglas se construye una sola vez al generar el parser; aqui solo`,
      `// resolvemos si una regla afecta a este archivo y hacemos el replace correspondiente.`,
      `var __makeTranspiledShaderFilter = (stage:any, filePathRaw:any) => {`,
      `    return (source:any) => {`,
      `        // 1) Normalizacion basica. Evita fallos si el cargador entrega null,`,
      `        // undefined o cualquier valor no string durante una recompilacion parcial.`,
      `        let out = String(source ?? "");`,
      `        const filePath = String(filePathRaw ?? "");`,
      ``,
      `        // 2) Filtro por etapa y por ruta. Las reglas de otros shaders no deben`,
      `        // tocar este fichero aunque compartan el mismo placeholder.`,
      `        for (const rule of __transpiledShaderFilterRules) {`,
      `            if (!rule) continue;`,
      `            if (rule.stage !== "both" && rule.stage !== stage) continue;`,
      ``,
      `            const filePattern:any = typeof rule.filePattern === "function" ? rule.filePattern() : rule.filePattern;`,
      `            if (filePattern !== undefined && filePattern !== null && filePattern !== "*") {`,
      `                const matchesFile = (filePattern instanceof RegExp)`,
      `                    ? ((filePattern.lastIndex = 0), filePattern.test(filePath))`,
      `                    : filePath.includes(String(filePattern));`,
      `                if (!matchesFile) continue;`,
      `            }`,
      ``,
      `            // 3) Sustitucion. Si el patron es regex lo clonamos para no arrastrar`,
      `            // estado interno entre llamadas consecutivas. Si es texto plano usamos`,
      `            // split/join porque mantiene el codigo generado corto y predecible.`,
      `            const searchPattern:any = typeof rule.searchPattern === "function" ? rule.searchPattern() : rule.searchPattern;`,
      `            const search = (searchPattern instanceof RegExp)`,
      `                ? new RegExp(searchPattern.source, searchPattern.flags)`,
      `                : searchPattern;`,
      `            const replacementValue = typeof rule.replacement === "function" ? rule.replacement() : rule.replacement;`,
      `            const replacement = String(replacementValue ?? "");`,
      ``,
      `            out = (search instanceof RegExp)`,
      `                ? out.replace(search, replacement)`,
      `                : out.split(String(search ?? "")).join(replacement);`,
      `        }`,
      ``,
      `        return out;`,
      `    };`,
      `};`
    ];
  }
  static splitByWhitespaceTopLevel(input) {
    const out = [];
    let current = "";
    let depthRound = 0;
    let depthSquare = 0;
    let depthCurly = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        current += ch;
        continue;
      }
      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        current += ch;
        continue;
      }
      if (!inSingle && !inDouble) {
        if (ch === "(") depthRound++;
        if (ch === ")") depthRound--;
        if (ch === "[") depthSquare++;
        if (ch === "]") depthSquare--;
        if (ch === "{") depthCurly++;
        if (ch === "}") depthCurly--;
        if (/\s/.test(ch) && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
          if (current.trim()) out.push(current.trim());
          current = "";
          continue;
        }
      }
      current += ch;
    }
    if (current.trim()) out.push(current.trim());
    return out;
  }
  static splitParamsAndChainTokens(input) {
    const params = [];
    const chains = [];
    for (const token of _DetailedParser.splitByWhitespaceTopLevel(input || "")) {
      if (token.trim().startsWith(".")) {
        chains.push(token.trim());
      } else {
        params.push(token.trim());
      }
    }
    return { params, chains };
  }
  static transpileExpr(rawExpr) {
    let expr = (rawExpr ?? "").trim();
    if (!expr) return expr;
    let prev = "";
    while (prev !== expr) {
      prev = expr;
      expr = expr.replace(/\{([^{}]+)\}/g, "($1)");
    }
    expr = expr.replace(/\bvec3\s*\(/g, "new Vector3D(");
    expr = expr.replace(/new Vector3D\(\s*([^,()]+)\s*\)/g, "new Vector3D($1,$1,$1)");
    expr = expr.replace(/(?<!["'])\b[Tt]exUnit(\d+)\b(?!["'])/g, '"TexUnit$1"');
    expr = expr.replace(/(?<!["'])\b[Cc]olAtch(\d+)\b(?!["'])/g, '"ColAtch$1"');
    return expr.trim();
  }
  static normalizeTexUnitToken(token) {
    const m = token?.trim()?.match(/^texunit(\d+)$/i);
    if (m) return `"TexUnit${m[1]}"`;
    const m2 = token?.trim()?.match(/^TexUnit(\d+)$/);
    if (m2) return `"TexUnit${m2[1]}"`;
    return _DetailedParser.transpileExpr(token);
  }
  static transpileSizeToken(sizeToken) {
    const sizeParts = _DetailedParser.splitTopLevelByChar(sizeToken, "x").map((p) => _DetailedParser.transpileExpr(p));
    if (!sizeParts.length) return "[]";
    return `[${sizeParts.join(", ")}]`;
  }
  static transpileTextureFormatToken(rawToken) {
    const token = (rawToken || "").trim().replace(/,$/, "");
    if (!token) return "(TexExamples as any).RGBAFloat";
    if (token.startsWith("[") || token.startsWith("{") || token.startsWith("(")) {
      return _DetailedParser.transpileExpr(token);
    }
    if (/^TexExamples\./.test(token)) {
      return _DetailedParser.transpileExpr(token);
    }
    const lower = token.toLowerCase();
    const aliases = {
      "r32": "RFloat",
      "rg32": "RGFloat",
      "rgb32": "RGBFloat",
      "rgba32": "RGBAFloat",
      "r32f": "RFloat",
      "rg32f": "RGFloat",
      "rgb32f": "RGBFloat",
      "rgba32f": "RGBAFloat",
      "r16": "RFloat16",
      "rg16": "RGFloat16",
      "rgb16": "RGBFloat16",
      "rgba16": "RGBAFloat16",
      "r16f": "RFloat16",
      "rg16f": "RGFloat16",
      "rgb16f": "RGBFloat16",
      "rgba16f": "RGBAFloat16",
      "rfloat": "RFloat",
      "rgfloat": "RGFloat",
      "rgbfloat": "RGBFloat",
      "rgbafloat": "RGBAFloat",
      "rfloat16": "RFloat16",
      "rgfloat16": "RGFloat16",
      "rgbfloat16": "RGBFloat16",
      "rgbafloat16": "RGBAFloat16"
    };
    const resolved = aliases[lower] || token;
    if (/^[A-Za-z_]\w*$/.test(resolved)) {
      return `(TexExamples as any).${resolved}`;
    }
    return _DetailedParser.transpileExpr(token);
  }
  static normalizeTextureEnumToken(rawToken, kind) {
    const token = (rawToken || "").trim().replace(/,$/, "").replace(/^["']|["']$/g, "");
    if (!token) return kind === "filter" ? "NEAREST" : "CLAMP";
    const upper = token.toUpperCase();
    if (kind === "filter") {
      if (upper === "NEAREST" || upper === "LINEAR") return upper;
    } else {
      if (upper === "CLAMP" || upper === "REPEAT" || upper === "MIRROR") return upper;
    }
    return token;
  }
  static collectCommaSeparatedEntries(lines) {
    const out = [];
    for (const rawLine of lines) {
      const trimmed = rawLine.trim().replace(/,$/, "");
      if (!trimmed) continue;
      const parts = _DetailedParser.splitTopLevelByChar(trimmed, ",").map((part) => part.trim()).filter(Boolean);
      out.push(...parts);
    }
    return out;
  }
  static parseUniformSnapshotEntry(line) {
    const shortMatch = line.match(/^\{([a-zA-Z_]\w*)\}([iuf])\s*$/);
    if (shortMatch) {
      const [, shortName] = shortMatch;
      return { name: shortName, expr: _DetailedParser.transpileExpr(`{${shortName}}`) };
    }
    const m = line.match(/^(\w+)\s*=\s*(.+?)([iuf])?\s*$/);
    if (!m) return null;
    const [, name, rawValue2] = m;
    return { name, expr: _DetailedParser.transpileExpr(rawValue2) };
  }
  static buildRuntimeLetHelperLines() {
    return [
      `const __runtimeLetCache = new Map<string, any>();`,
      `const __coerceRuntimeLetValue = (raw:any)=>{`,
      `    const text = String(raw ?? "").trim();`,
      `    if(!text) return undefined;`,
      `    if(/^(true|false)$/i.test(text)) return text.toLowerCase()==="true";`,
      `    if(/^null$/i.test(text)) return null;`,
      `    if(/^[+-]?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?$/i.test(text)) return Number(text);`,
      `    if((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))){`,
      `        try{ return JSON.parse(text); }catch{}`,
      `    }`,
      `    if((text.startsWith("\\"") && text.endsWith("\\"")) || (text.startsWith("'") && text.endsWith("'"))){`,
      `        return text.slice(1,-1);`,
      `    }`,
      `    return text;`,
      `};`,
      ``,
      `const __mergeRuntimeLetArray = (arr:any[])=>{`,
      `    const out:any = { __array: arr };`,
      `    if(arr.every(item => item && typeof item === "object" && !Array.isArray(item))){`,
      `        for (const item of arr) Object.assign(out, item);`,
      `    }`,
      `    return out;`,
      `};`,
      ``,
      `const __parseRuntimeLetText = (text:string)=>{`,
      `    const out:any = {};`,
      `    const chunks = String(text ?? "").split(/[\\r\\n]+/).flatMap(line => line.split(","));`,
      `    for (const chunk of chunks) {`,
      `        const entry = chunk.trim();`,
      `        if(!entry) continue;`,
      `        const eq = entry.indexOf("=");`,
      `        if(eq<0){`,
      `            out[entry] = true;`,
      `            continue;`,
      `        }`,
      `        const key = entry.slice(0, eq).trim();`,
      `        const value = entry.slice(eq + 1).trim();`,
      `        if(key) out[key] = __coerceRuntimeLetValue(value);`,
      `    }`,
      `    return out;`,
      `};`,
      ``,
      `const __loadRuntimeLetSource = async (sourcePath:any)=>{`,
      `    const rawPath = String(sourcePath ?? "").trim();`,
      `    if(!rawPath) return {};`,
      `    const resolvedPath = new URL(rawPath, import.meta.url).toString();`,
      `    if(__runtimeLetCache.has(resolvedPath)) return __runtimeLetCache.get(resolvedPath);`,
      `    const response = await fetch(resolvedPath);`,
      `    if(!response.ok) throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");`,
      `    let parsed:any = {};`,
      `    if(/\\.json(?:$|\\?)/i.test(rawPath)){`,
      `        const json = await response.json();`,
      `        if(Array.isArray(json)) parsed = __mergeRuntimeLetArray(json);`,
      `        else if(json && typeof json === "object") parsed = json;`,
      `        else parsed = { __array: json };`,
      `    }else{`,
      `        parsed = __parseRuntimeLetText(await response.text());`,
      `    }`,
      `    __runtimeLetCache.set(resolvedPath, parsed);`,
      `    return parsed;`,
      `};`
    ];
  }
  static buildBackupRuntimeHelperLines(defaultScope) {
    return [
      `const __backupBaseUrl = "/api/backups";`,
      `const __backupDefaultScope = ${JSON.stringify(defaultScope)};`,
      `const __backupPad2 = (n:any)=>String(n).padStart(2, "0");`,
      `const __backupStamp = ()=>{`,
      `    const d = new Date();`,
      `    return String(d.getFullYear()) + __backupPad2(d.getMonth()+1) + __backupPad2(d.getDate()) + __backupPad2(d.getHours()) + __backupPad2(d.getMinutes());`,
      `};`,
      `const __backupSafeName = (name:any)=>String(name ?? "backup").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "") || "backup";`,
      `const __backupDefaultPath = (value:any, varName:any)=>{`,
      `    const isTex = value && typeof value === "object" && ("w" in value || "h" in value || "unit" in value || value instanceof WebGLTexture);`,
      `    const parts = [__backupSafeName(varName)];`,
      `    if(isTex){`,
      `        parts.push(String(value.w ?? value.width ?? "x"));`,
      `        parts.push(String(value.h ?? value.height ?? "y"));`,
      `        parts.push("TexUnit" + String(value.unit ?? "NA").replace(/^TexUnit/i, ""));`,
      `        parts.push(__backupSafeName(value.__backupProgram ?? value.programName ?? value.program ?? "programNA"));`,
      `    }`,
      `    parts.push(__backupStamp());`,
      `    return parts.join("_") + ".txt";`,
      `};`,
      `const __backupTexturePreview = (tex:any, varName:any)=>{`,
      `    if(!tex || tex.__backupType !== "texture2D") return "";`,
      `    const w = Number(tex.w ?? 0) || 0;`,
      `    const h = Number(tex.h ?? 0) || 0;`,
      `    const dim = Number(tex.dim ?? 1) || 1;`,
      `    const name = String(varName ?? "texture");`,
      `    const program = String(tex.program ?? "programNA");`,
      `    const values = Array.isArray(tex.data) ? tex.data : [];`,
      `    const formatScalar = (value:any)=>{`,
      `        const num = Number(value);`,
      `        if(!Number.isFinite(num)) return String(value ?? "").padStart(10, " ");`,
      `        return num.toFixed(4).padStart(10, " ");`,
      `    };`,
      `    const lines = [name + " [" + w + " x " + h + "] " + program];`,
      `    for(let y = 0; y < h; y++){`,
      `        const row:string[] = [];`,
      `        for(let x = 0; x < w; x++){`,
      `            const base = (y * w + x) * dim;`,
      `            for(let c = 0; c < dim; c++){`,
      `                row.push(formatScalar(values[base + c]));`,
      `            }`,
      `        }`,
      `        lines.push(row.join(" "));`,
      `    }`,
      `    return lines.join("\\n");`,
      `};`,
      `const __backupNormalizeScopePath = (pathHint:any)=>{`,
      `    const raw = String(pathHint ?? "").trim().replace(/\\\\/g, "/");`,
      `    const scope = String(__backupDefaultScope || "").replace(/^\\/+|\\/+$/g, "");`,
      `    const withScope = (value:string)=>{`,
      `        const clean = String(value || "").replace(/^\\/+/, "");`,
      `        if(!scope) return clean;`,
      `        if(!clean) return scope;`,
      `        if(clean === scope || clean.startsWith(scope + "/")) return clean;`,
      `        return scope + "/" + clean;`,
      `    };`,
      `    if(!raw || raw === "/" || raw === ".") return { path: withScope(""), directoryMode: true };`,
      `    if(raw.startsWith("./")){`,
      `        const rest = raw.slice(2);`,
      `        return { path: withScope(rest), directoryMode: !rest || /\\/$/.test(rest) };`,
      `    }`,
      `    if(raw.startsWith("/")) return { path: withScope(raw.slice(1)), directoryMode: true };`,
      `    return { path: withScope(raw), directoryMode: true };`,
      `};`,
      `const __backupReadTexture2D = (tex:any)=>{`,
      `    if(!tex || typeof tex !== "object" || !(tex instanceof WebGLTexture)) return null;`,
      `    const w = Number(tex.w ?? tex.width ?? 1) || 1;`,
      `    const h = Number(tex.h ?? tex.height ?? 1) || 1;`,
      `    const format = tex.format || (TexExamples as any).RGBAFloat;`,
      `    const dim = format?.[0] === gl.RED ? 1 : format?.[0] === gl.RG ? 2 : format?.[0] === gl.RGB ? 3 : 4;`,
      `    const fbo = gl.createFramebuffer();`,
      `    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);`,
      `    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);`,
      `    gl.readBuffer(gl.COLOR_ATTACHMENT0);`,
      `    const data = new Float32Array(w * h * dim);`,
      `    gl.readPixels(0, 0, w, h, format[0], format[2], data);`,
      `    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);`,
      `    gl.deleteFramebuffer(fbo);`,
      `    return { __backupType: "texture2D", w, h, dim, format: Array.from(format || []), unit: tex.unit, program: tex.__backupProgram, data: Array.from(data) };`,
      `};`,
      `const __backupSerializeValue = (value:any, varName:any)=>{`,
      `    const tex = __backupReadTexture2D(value);`,
      `    if(tex){`,
      `        const jsonLine = JSON.stringify({ varName, savedAt: new Date().toISOString(), value: tex });`,
      `        return __backupTexturePreview(tex, varName) + "\\n" + jsonLine;`,
      `    }`,
      `    if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){`,
      `        return JSON.stringify({ varName, savedAt: new Date().toISOString(), value: { __backupType: value.constructor.name, data: Array.from(value) } });`,
      `    }`,
      `    try { return JSON.stringify({ varName, savedAt: new Date().toISOString(), value }); }`,
      `    catch { return String(value); }`,
      `};`,
      `const __backupNormalizeValue = (value:any, varName:any)=>{`,
      `    const tex = __backupReadTexture2D(value);`,
      `    if(tex) return { varName, value: tex };`,
      `    if(value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array){`,
      `        return { varName, value: { __backupType: value.constructor.name, data: Array.from(value) } };`,
      `    }`,
      `    return { varName, value };`,
      `};`,
      `const __backupPut = async (route:string, path:any, content:any, extra:any={})=>{`,
      `    const response = await fetch(__backupBaseUrl + route, {`,
      `        method: "PUT",`,
      `        headers: { "Content-Type": "application/json" },`,
      `        body: JSON.stringify({ path, content, ...extra })`,
      `    });`,
      `    const raw = await response.text();`,
      `    if(!response.ok) throw new Error("Backup request failed: " + response.status + " " + raw);`,
      `    try { return raw ? JSON.parse(raw) : { ok: true, path: String(path ?? "") }; }`,
      `    catch { return { ok: true, path: String(path ?? ""), raw }; }`,
      `};`,
      `const __backupStore = async (value:any, varName:any, pathHint?:any)=>{`,
      `    try {`,
      `        const target = __backupNormalizeScopePath(pathHint);`,
      `        const result = await __backupPut("/file", target.path, __backupSerializeValue(value, varName), target.directoryMode ? { directoryMode: true, suggestedName: __backupDefaultPath(value, varName) } : {});`,
      `        console.log("[backUp store]", result.path);`,
      `        return result;`,
      `    } catch (err) {`,
      `        console.error("[backUp store] failed", err);`,
      `        return { ok: false, error: String(err) };`,
      `    }`,
      `};`,
      `const __backupFetchText = async (pathHint:any)=>{`,
      `    const target = __backupNormalizeScopePath(pathHint);`,
      `    const response = await fetch(__backupBaseUrl + "/file?path=" + encodeURIComponent(target.path));`,
      `    if(!response.ok) throw new Error("Backup restore failed: " + response.status + " " + await response.text());`,
      `    return await response.text();`,
      `};`,
      `const __backupDecodeValue = (text:string)=>{`,
      `    try {`,
      `        const lines = String(text ?? "").split(/\\r?\\n/).map(line=>line.trim()).filter(Boolean);`,
      `        const jsonLine = lines.length ? lines[lines.length - 1] : "";`,
      `        const parsed = JSON.parse(jsonLine);`,
      `        return parsed && Object.prototype.hasOwnProperty.call(parsed, "value") ? parsed.value : parsed;`,
      `    } catch {`,
      `        const nums = text.trim().split(/[\\s,;]+/).map(Number).filter(Number.isFinite);`,
      `        return nums.length ? new Float32Array(nums) : text;`,
      `    }`,
      `};`,
      `const __backupRestoreInto = async (target:any, pathHint:any)=>{`,
      `    const value = __backupDecodeValue(await __backupFetchText(pathHint));`,
      `    if(target && typeof target.fill === "function" && value?.__backupType === "texture2D"){`,
      `        target.fill(new Float32Array(value.data || []), 0, 0, value.w, value.h);`,
      `        return target;`,
      `    }`,
      `    if(value?.__backupType && Array.isArray(value.data)) return new Float32Array(value.data);`,
      `    return value;`,
      `};`,
      `const __backupLog = async (pathHint:any)=>{`,
      `    const target = __backupNormalizeScopePath(pathHint);`,
      `    const p = target.path;`,
      `    const prevLog = console.log.bind(console);`,
      `    const prevWarn = console.warn.bind(console);`,
      `    const prevError = console.error.bind(console);`,
      `    const append = (level:string, args:any[])=>{`,
      `        const line = "[" + new Date().toISOString() + "] " + level + " " + args.map(a=>{ try{return typeof a === "string" ? a : JSON.stringify(a);}catch{return String(a);} }).join(" ") + "\\n";`,
      `        __backupPut("/append", p, line, target.directoryMode ? { directoryMode: true, suggestedName: "log_" + __backupStamp() + ".txt" } : {}).catch(prevError);`,
      `    };`,
      `    console.log = (...args:any[])=>{ prevLog(...args); append("log", args); };`,
      `    console.warn = (...args:any[])=>{ prevWarn(...args); append("warn", args); };`,
      `    console.error = (...args:any[])=>{ prevError(...args); append("error", args); };`,
      `    console.log("[backUp log]", p);`,
      `};`,
      `const __backupDrawGenerationState = { stamp: Symbol("init"), counts: new Map<string, number>(), clearedScopes: new Set<string>() };`,
      `const __backupRefreshGenerationState = ()=>{`,
      `    try {`,
      `        if(typeof recomputeTau === "undefined" || !recomputeTau) return;`,
      `        const stamp = (typeof tauModelStamp !== "undefined") ? tauModelStamp : "__recompute__";`,
      `        if(__backupDrawGenerationState.stamp !== stamp){`,
      `            __backupDrawGenerationState.stamp = stamp;`,
      `            __backupDrawGenerationState.counts = new Map<string, number>();`,
      `            __backupDrawGenerationState.clearedScopes = new Set<string>();`,
      `        }`,
      `    } catch {}`,
      `};`,
      `const __backupClearDrawScopeGenerationsIfNeeded = async (pathHint:any)=>{`,
      `    __backupRefreshGenerationState();`,
      `    try {`,
      `        if(typeof recomputeTau === "undefined" || !recomputeTau) return;`,
      `        const target = __backupNormalizeScopePath(pathHint);`,
      `        const key = String(target.path || "");`,
      `        if(__backupDrawGenerationState.clearedScopes.has(key)) return;`,
      `        __backupDrawGenerationState.clearedScopes.add(key);`,
      `        await __backupPut("/clear-generations", target.path, "");`,
      `    } catch (err) {`,
      `        console.warn("[backUp clear-generations] failed", pathHint, err);`,
      `    }`,
      `};`,
      `const __backupNextDrawGeneration = (drawKind:any, pathHint:any, program:any)=>{`,
      `    __backupRefreshGenerationState();`,
      `    try {`,
      `        if(typeof recomputeTau === "undefined" || !recomputeTau) return 1;`,
      `        const target = __backupNormalizeScopePath(pathHint);`,
      `        const drawName = __backupSafeName(drawKind || "draw");`,
      `        const programName = __backupSafeName(program?.ID ?? program?.fragPath ?? program?.name ?? "program");`,
      `        const key = target.path + "::" + programName + "::" + drawName;`,
      `        const next = (__backupDrawGenerationState.counts.get(key) || 0) + 1;`,
      `        __backupDrawGenerationState.counts.set(key, next);`,
      `        return next;`,
      `    } catch {`,
      `        return 1;`,
      `    }`,
      `};`,
      `const __backupResolveMultiTarget = (pathHint:any, defaultStem:any, suffix:any, generation:any=1)=>{`,
      `    const target = __backupNormalizeScopePath(pathHint);`,
      `    const stem = __backupSafeName(defaultStem);`,
      `    const cleanSuffix = String(suffix ?? "").replace(/^_+/, "");`,
      `    const fileName = stem + "_" + cleanSuffix + "_" + __backupStamp() + ".txt";`,
      `    const gen = Math.max(1, Number(generation) || 1);`,
      `    if(target.directoryMode){`,
      `        const dirPath = gen > 1 ? (target.path ? String(target.path).replace(/\\/+$/g, "") + "/" + String(gen) : String(gen)) : target.path;`,
      `        return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };`,
      `    }`,
      `    const p = target.path;`,
      `    if(/\\.txt$/i.test(p)){`,
      `        const slash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\\\"));`,
      `        const dir = slash >= 0 ? p.slice(0, slash + 1) : "";`,
      `        const base = slash >= 0 ? p.slice(slash + 1) : p;`,
      `        const dot = base.toLowerCase().endsWith(".txt") ? base.slice(0, -4) : base;`,
      `        const genDir = gen > 1 ? (dir ? dir.replace(/\\/+$/g, "") + "/" + String(gen) + "/" : String(gen) + "/") : dir;`,
      `        return { path: genDir + dot + "_" + cleanSuffix + ".txt", directoryMode: false, generation: gen };`,
      `    }`,
      `    const dirPath = gen > 1 ? (p ? String(p).replace(/\\/+$/g, "") + "/" + String(gen) : String(gen)) : p;`,
      `    return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };`,
      `};`,
      `const __backupStoreDrawBlock = async (drawKind:any, pathHint:any, outputTextures:any[], uniformEntries:any[], program:any)=>{`,
      `    try {`,
      `        const drawName = __backupSafeName(drawKind || "draw");`,
      `        const generation = __backupNextDrawGeneration(drawKind, pathHint, program);`,
      `        const outputs = Array.isArray(outputTextures) ? outputTextures.filter(Boolean) : [];`,
      `        const outputSet = new Set(outputs.map(item => item?.tex).filter(Boolean));`,
      `        const programTextures = Array.isArray(program?.textures) ? program.textures.filter((tex:any)=>tex && !outputSet.has(tex)) : [];`,
      `        const prependedInputs = programTextures.map((tex:any, idx:number)=>__backupNormalizeValue(tex, tex.__backupVarName || tex.__backupUniformName || ("inputTex" + idx)));`,
      `        const normalizedUniforms = (Array.isArray(uniformEntries) ? uniformEntries : []).map((entry:any)=>({`,
      `            kind: entry?.kind || "uniform",`,
      `            name: entry?.name || "uniform",`,
      `            ...__backupNormalizeValue(entry?.value, entry?.name || "uniform")`,
      `        }));`,
      `        const serializedOutputs = outputs.map((output:any)=>{`,
      `            const outputName = output?.name || "output";`,
      `            try {`,
      `                return { outputName, ok: true, payload: __backupSerializeValue(output?.tex, outputName) };`,
      `            } catch (err) {`,
      `                return {`,
      `                    outputName,`,
      `                    ok: false,`,
      `                    payload: JSON.stringify({`,
      `                        varName: outputName,`,
      `                        savedAt: new Date().toISOString(),`,
      `                        error: String(err)`,
      `                    })`,
      `                };`,
      `            }`,
      `        });`,
      `        const uniformPayload = JSON.stringify({`,
      `            source: drawKind,`,
      `            savedAt: new Date().toISOString(),`,
      `            entries: [`,
      `                ...prependedInputs.map((entry:any)=>({ kind: "programTexture", name: entry.varName, value: entry.value })),`,
      `                ...normalizedUniforms`,
      `            ]`,
      `        });`,
      `        await __backupClearDrawScopeGenerationsIfNeeded(pathHint);`,
      `        const uniformTarget = __backupResolveMultiTarget(pathHint, drawName, "uniforms", generation);`,
      `        await __backupPut("/file", uniformTarget.path, uniformPayload, uniformTarget.directoryMode ? { directoryMode: true, suggestedName: uniformTarget.suggestedName } : {});`,
      `        for (const snapshot of serializedOutputs) {`,
      `            try {`,
      `                const outputTarget = __backupResolveMultiTarget(pathHint, drawName, __backupSafeName(snapshot.outputName), generation);`,
      `                await __backupPut("/file", outputTarget.path, snapshot.payload, outputTarget.directoryMode ? { directoryMode: true, suggestedName: outputTarget.suggestedName } : {});`,
      `                if(!snapshot.ok){`,
      `                    console.warn("[backUp draw] stored output fallback payload", snapshot.outputName, pathHint);`,
      `                }`,
      `            } catch (err) {`,
      `                console.error("[backUp draw] output store failed", snapshot.outputName, pathHint, err);`,
      `            }`,
      `        }`,
      `        return { ok: true };`,
      `    } catch (err) {`,
      `        console.error("[backUp draw] failed", drawKind, pathHint, err);`,
      `        return { ok: false, error: String(err) };`,
      `    }`,
      `};`
    ];
  }
  static transpileGroupedLetBlock(sourceToken, lines, declaredVars, declKeyword = "let") {
    const entries = _DetailedParser.collectCommaSeparatedEntries(lines);
    const parsedEntries = entries.map((entry) => {
      const m = entry.match(/^([A-Za-z_]\w*)(?:\s*=\s*([\s\S]+))?$/);
      if (!m) return null;
      return { name: m[1], defaultExpr: m[2]?.trim() };
    }).filter(Boolean);
    if (!sourceToken) {
      const out2 = [];
      for (const entry of parsedEntries) {
        if (declaredVars.has(entry.name)) {
          out2.push(entry.defaultExpr === void 0 ? `${entry.name} = undefined;` : `${entry.name} = ${_DetailedParser.transpileExpr(entry.defaultExpr)};`);
          continue;
        }
        declaredVars.add(entry.name);
        out2.push(entry.defaultExpr === void 0 ? `${declKeyword} ${entry.name};` : `${declKeyword} ${entry.name} = ${_DetailedParser.transpileExpr(entry.defaultExpr)};`);
      }
      return out2;
    }
    const out = [];
    const sourceExpr = /^[./]|^[A-Za-z]:[\\/]|\.json(?:$|\?)/i.test(sourceToken.trim()) ? JSON.stringify(sourceToken.trim()) : _DetailedParser.transpileExpr(sourceToken.trim());
    const tempName = `__letSource_${Math.random().toString(36).slice(2, 10)}`;
    out.push(`const ${tempName} = await __loadRuntimeLetSource(${sourceExpr});`);
    out.push(`Object.assign(globalThis as any, ${tempName} || {});`);
    const allowArrayFallback = parsedEntries.length === 1;
    for (const entry of parsedEntries) {
      const baseExpr = `${tempName}[${JSON.stringify(entry.name)}]${allowArrayFallback ? ` ?? ${tempName}.__array` : ""}`;
      const fullExpr = entry.defaultExpr ? `(${baseExpr} ?? ${_DetailedParser.transpileExpr(entry.defaultExpr)})` : baseExpr;
      if (declaredVars.has(entry.name)) out.push(`${entry.name} = ${fullExpr};`);
      else {
        declaredVars.add(entry.name);
        out.push(`${declKeyword} ${entry.name} = ${fullExpr};`);
      }
    }
    return out;
  }
  static transpileResourceBlock(name, lines, declaredVars) {
    const entries = _DetailedParser.collectCommaSeparatedEntries(lines);
    let formatExpr = "(TexExamples as any).RGBAFloat";
    let filterMin = "NEAREST";
    let filterMag = "NEAREST";
    let wrapS = "CLAMP";
    let wrapT = "CLAMP";
    const extras = [];
    for (const entry of entries) {
      const m = entry.match(/^([A-Za-z_]\w*)\s*[:=]\s*([\s\S]+)$/);
      if (!m) continue;
      const key = m[1].trim();
      const lowerKey = key.toLowerCase();
      const rawValue2 = m[2].trim();
      if (lowerKey === "format") {
        formatExpr = _DetailedParser.transpileTextureFormatToken(rawValue2);
        continue;
      }
      if (lowerKey === "filter") {
        filterMin = _DetailedParser.normalizeTextureEnumToken(rawValue2, "filter");
        filterMag = filterMin;
        continue;
      }
      if (lowerKey === "filter_min" || lowerKey === "minfilter") {
        filterMin = _DetailedParser.normalizeTextureEnumToken(rawValue2, "filter");
        continue;
      }
      if (lowerKey === "filter_max" || lowerKey === "filter_mag" || lowerKey === "magfilter") {
        filterMag = _DetailedParser.normalizeTextureEnumToken(rawValue2, "filter");
        continue;
      }
      if (lowerKey === "wrap") {
        wrapS = _DetailedParser.normalizeTextureEnumToken(rawValue2, "wrap");
        wrapT = wrapS;
        continue;
      }
      if (lowerKey === "wrap_s" || lowerKey === "wraps") {
        wrapS = _DetailedParser.normalizeTextureEnumToken(rawValue2, "wrap");
        continue;
      }
      if (lowerKey === "wrap_t" || lowerKey === "wrapt") {
        wrapT = _DetailedParser.normalizeTextureEnumToken(rawValue2, "wrap");
        continue;
      }
      extras.push(`    ${key}: ${_DetailedParser.transpileExpr(rawValue2)}`);
    }
    const out = [
      `${declaredVars.has(name) ? name : `var ${name}`} = {`,
      `    format: ${formatExpr},`,
      `    filter_min: "${filterMin}",`,
      `    filter_mag: "${filterMag}",`,
      `    wrap_S: "${wrapS}",`,
      `    wrap_T: "${wrapT}"${extras.length ? "," : ""}`,
      ...extras,
      `};`
    ];
    declaredVars.add(name);
    return out;
  }
  static transpileTex2DResourceLine(programRef, line, declaredVars) {
    const initSplit = _DetailedParser.splitTopLevelAssignLE(line);
    const lineNoInit = initSplit ? initSplit[0] : line;
    const initExpr = initSplit ? _DetailedParser.transpileExpr(initSplit[1]) : "null";
    const normalizedLineNoInit = lineNoInit.replace(/^\s*(?:new-|in-)?tex2D\b/, "tex2D");
    let namesPart = "";
    let sizeBody = "";
    let resourceToken = "";
    let maybeFilterToken;
    let texUnitToken;
    const modern = normalizedLineNoInit.match(/^tex2D\s+(.+?)\s+RES\s*\[([\s\S]+?)\]\s+TYPE\s+([^\s]+)(?:\s+FILTER\s+(\[[\s\S]+\]))?\s*->\s*([^\s]+)\s*$/);
    if (modern) {
      namesPart = modern[1].trim();
      sizeBody = modern[2].trim();
      resourceToken = modern[3].trim();
      maybeFilterToken = modern[4]?.trim();
      texUnitToken = modern[5]?.trim();
    } else {
      const modernNoType = normalizedLineNoInit.match(/^tex2D\s+(.+?)\s+RES\s*\[([\s\S]+?)\]\s+([\s\S]+)$/);
      if (modernNoType) {
        namesPart = modernNoType[1].trim();
        sizeBody = modernNoType[2].trim();
        const tailTokens = _DetailedParser.splitByWhitespaceTopLevel(modernNoType[3]).map((x) => x.trim()).filter(Boolean);
        if (!tailTokens.length) return null;
        let k = 0;
        if (tailTokens[k]?.toUpperCase() === "TYPE") k++;
        resourceToken = tailTokens[k] || "";
        k++;
        if (!resourceToken) return null;
        if (tailTokens[k]?.toUpperCase() === "FILTER") {
          maybeFilterToken = tailTokens[k + 1];
          texUnitToken = tailTokens[k + 2];
        } else if (tailTokens[k]?.startsWith("[")) {
          maybeFilterToken = tailTokens[k];
          texUnitToken = tailTokens[k + 1];
        } else {
          texUnitToken = tailTokens[k];
        }
      } else {
        const legacy = normalizedLineNoInit.match(/^tex2D\s+([A-Za-z_]\w*(?:[\|~][A-Za-z_]\w*)*)\s*\[([\s\S]+)\]\s+([\s\S]+)$/);
        if (!legacy) return null;
        namesPart = legacy[1].trim();
        sizeBody = legacy[2].trim();
        const tokens = _DetailedParser.splitByWhitespaceTopLevel(legacy[3]);
        if (!tokens.length) return null;
        resourceToken = tokens[0];
        maybeFilterToken = tokens[1]?.trim().startsWith("[") ? tokens[1] : void 0;
        texUnitToken = maybeFilterToken ? tokens[2] : tokens[1];
      }
    }
    const names = namesPart.split(/[|~]/).map((x) => x.trim()).filter(Boolean);
    if (!names.length) return null;
    const uniformName = names[0];
    const firstAlias = names[1] || names[0];
    const extraAliases = names.slice(2);
    const allAliases = [uniformName, firstAlias, ...extraAliases];
    for (const alias of allAliases) {
      if (_DetailedParser.transpileTexAliasToUniform.has(alias)) {
        throw new Error(`tex2D duplicada: '${alias}' ya fue definida.`);
      }
    }
    for (const alias of allAliases) {
      _DetailedParser.transpileTexAliasToUniform.set(alias, uniformName);
      _DetailedParser.transpileTexAliasToTextureVar.set(alias, firstAlias);
      _DetailedParser.transpileTexDeclaredNames.add(alias);
    }
    _DetailedParser.transpileTexDeclaredNames.add(uniformName);
    let sizeParts = _DetailedParser.splitTopLevelByChar(sizeBody, ",").map((x) => x.trim()).filter(Boolean);
    if (sizeParts.length <= 1) {
      sizeParts = sizeBody.split(/\s+x\s+/i).map((x) => x.trim()).filter(Boolean);
    }
    if (sizeParts.length < 2) return null;
    const sizeExpr = `[${sizeParts.map((x) => _DetailedParser.transpileExpr(x)).join(", ")}]`;
    const texUnitExpr = texUnitToken ? _DetailedParser.normalizeTexUnitToken(texUnitToken) : "undefined";
    let formatExpr = _DetailedParser.transpileTextureFormatToken(resourceToken);
    let filterMinExpr = `"NEAREST"`;
    let filterMagExpr = `"NEAREST"`;
    let wrapSExpr = `"CLAMP"`;
    let wrapTExpr = `"CLAMP"`;
    if (/^[A-Za-z_]\w*$/.test(resourceToken) && declaredVars.has(resourceToken)) {
      formatExpr = `(${resourceToken}?.format ?? (TexExamples as any).RGBAFloat)`;
      filterMinExpr = `(${resourceToken}?.filter_min ?? ${resourceToken}?.filter ?? ${resourceToken}?.minFilter ?? "NEAREST")`;
      filterMagExpr = `(${resourceToken}?.filter_mag ?? ${resourceToken}?.filter ?? ${resourceToken}?.magFilter ?? "NEAREST")`;
      wrapSExpr = `(${resourceToken}?.wrap_S ?? ${resourceToken}?.wrap ?? ${resourceToken}?.wrapS ?? "CLAMP")`;
      wrapTExpr = `(${resourceToken}?.wrap_T ?? ${resourceToken}?.wrap ?? ${resourceToken}?.wrapT ?? "CLAMP")`;
    }
    if (maybeFilterToken) {
      const fw = _DetailedParser.splitTopLevelByChar(maybeFilterToken.slice(1, -1), ",").map((x, idx) => _DetailedParser.normalizeTextureEnumToken(x, idx < 2 ? "filter" : "wrap"));
      filterMinExpr = JSON.stringify(fw[0] || "NEAREST");
      filterMagExpr = JSON.stringify(fw[1] || fw[0] || "NEAREST");
      wrapSExpr = JSON.stringify(fw[2] || "CLAMP");
      wrapTExpr = JSON.stringify(fw[3] || fw[2] || "CLAMP");
    }
    const out = [];
    const decl = declaredVars.has(firstAlias) ? firstAlias : `var ${firstAlias}`;
    declaredVars.add(firstAlias);
    out.push(`${decl} = ${programRef}.createTexture2D(${JSON.stringify(uniformName)}, ${sizeExpr}, ${formatExpr}, ${initExpr}, [${filterMinExpr}, ${filterMagExpr}, ${wrapSExpr}, ${wrapTExpr}], ${texUnitExpr});`);
    out.push(`(${firstAlias} as any).__backupVarName = ${JSON.stringify(firstAlias)};`);
    out.push(`(${firstAlias} as any).__backupUniformName = ${JSON.stringify(uniformName)};`);
    out.push(`(${firstAlias} as any).__backupProgram = (${programRef} as any)?.ID ?? (${programRef} as any)?.fragPath ?? ${JSON.stringify(programRef)};`);
    for (const alias of extraAliases) {
      if (!declaredVars.has(alias)) {
        declaredVars.add(alias);
        out.push(`var ${alias} = ${firstAlias};`);
      } else out.push(`${alias} = ${firstAlias};`);
    }
    return out;
  }
  static transpileProgramBlock(header, lines, declaredVars) {
    const m = header.match(/^([A-Za-z_]\w*(?:\s*(?:\|=|\|)\s*[A-Za-z_]\w*)*)\s+([\s\S]+)$/);
    if (!m) return [`// TODO(program): ${header}`];
    const aliases = m[1].split(/(?:\|=|\|)/).map((x) => x.trim()).filter(Boolean);
    const firstAlias = aliases[0];
    const pathToken = m[2].trim();
    const pathExpr = /^["']/.test(pathToken) ? pathToken : JSON.stringify(pathToken);
    const vertFilter = _DetailedParser.transpileShaderFilterFactory("vert", `${firstAlias}.vertPath`);
    const fragFilter = _DetailedParser.transpileShaderFilterFactory("frag", `${firstAlias}.fragPath`);
    const out = [
      `if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);`,
      `${declaredVars.has(firstAlias) ? firstAlias : `var ${firstAlias}`} = WebGLMan.program(-1, ${pathExpr});`
    ];
    declaredVars.add(firstAlias);
    for (const alias of aliases.slice(1)) {
      if (!declaredVars.has(alias)) {
        declaredVars.add(alias);
        out.push(`var ${alias} = ${firstAlias};`);
      } else out.push(`${alias} = ${firstAlias};`);
    }
    out.push(`await ${firstAlias}.loadProgram(${firstAlias}.vertPath, ${firstAlias}.fragPath, ${vertFilter}, ${fragFilter});`);
    out.push(`await ${firstAlias}.use?.();`);
    out.push(`lastUsedProgram = ${firstAlias};`);
    _DetailedParser.transpileLastUsedProgramExpr = firstAlias;
    out.push(`${firstAlias}.createVAO().bind();`);
    _DetailedParser.transpileProgramOutAliases.set(firstAlias, /* @__PURE__ */ new Map());
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const rawLine = lines[lineIndex];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const outAliasesMatch = trimmed.match(/^out-aliases\s+([A-Za-z_]\w*)\s*:\s*\[(.*)$/);
      if (outAliasesMatch) {
        const aliasName = outAliasesMatch[1];
        const values = [];
        const initialTail = (outAliasesMatch[2] || "").trim();
        if (initialTail && initialTail !== "]") {
          values.push(..._DetailedParser.splitByWhitespaceTopLevel(initialTail.replace(/\]$/, "")).filter(Boolean));
        }
        while (!/\]\s*$/.test(lines[lineIndex] || "")) {
          lineIndex++;
          if (lineIndex >= lines.length) break;
          const aliasLine = lines[lineIndex].trim();
          if (!aliasLine || aliasLine === "]") continue;
          values.push(..._DetailedParser.splitByWhitespaceTopLevel(aliasLine.replace(/\]$/, "")).filter(Boolean));
        }
        _DetailedParser.transpileProgramOutAliases.get(firstAlias)?.set(aliasName, values);
        continue;
      }
      const texLines = _DetailedParser.transpileTex2DResourceLine(firstAlias, trimmed, declaredVars);
      if (texLines) {
        out.push(...texLines);
        continue;
      }
      out.push(..._DetailedParser.transpileSimpleStatement(trimmed, declaredVars));
    }
    return out;
  }
  static transpileRebindBlock(targetExprRaw, lines) {
    const targetRaw = (targetExprRaw || "").trim();
    const targetExpr = !targetRaw || /^-\w[\w-]*-$/.test(targetRaw) ? "lastUsedProgram" : _DetailedParser.transpileExpr(targetRaw);
    const out = [];
    if (targetRaw && targetExpr !== "lastUsedProgram" && !/^-\w[\w-]*-$/.test(targetRaw)) {
      out.push(`${targetExpr}.use?.();`);
    }
    const clauses = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const parts = _DetailedParser.splitTopLevelByChar(line, ";").map((x) => x.trim()).filter(Boolean);
      clauses.push(...parts);
    }
    for (const clause of clauses) {
      const m = clause.match(/^([\s\S]+?)\s*->\s*([\s\S]+)$/);
      if (!m) continue;
      const leftItems = _DetailedParser.splitTopLevelByChar(m[1], ",").map((x) => x.trim()).filter(Boolean);
      const rightItems = _DetailedParser.splitTopLevelByChar(m[2], ",").map((x) => x.trim()).filter(Boolean);
      if (leftItems.length === 0 || rightItems.length === 0) continue;
      if (leftItems.length !== rightItems.length) {
        out.push(`// TODO(rebind-mismatch): ${clause}`);
        continue;
      }
      for (let i = 0; i < leftItems.length; i++) {
        const refName = leftItems[i];
        const uniformName = _DetailedParser.transpileTexAliasToUniform.get(refName) || refName;
        const texVarName = _DetailedParser.transpileTexAliasToTextureVar.get(refName) || _DetailedParser.transpileTexAliasToTextureVar.get(uniformName);
        const texUnitExpr = _DetailedParser.normalizeTexUnitToken(rightItems[i]);
        if (texVarName && /^[A-Za-z_]\w*$/.test(texVarName)) {
          out.push(`if(typeof ${texVarName} !== "undefined" && ${texVarName}?.bind) ${texVarName}.bind(${texUnitExpr});`);
        }
        out.push(`${targetExpr}.bindTexName2TexUnit(${JSON.stringify(uniformName)}, ${texUnitExpr});`);
      }
    }
    return out;
  }
  static transpileFramebufferBlock(name, lines, declaredVars) {
    const entries = _DetailedParser.collectCommaSeparatedEntries(lines);
    const bindings = [];
    let autoIndex = 0;
    for (const entry of entries) {
      const m = entry.match(/^([\s\S]+?)\s*->\s*([\s\S]+)$/);
      if (m) {
        bindings.push({
          texExpr: _DetailedParser.transpileExpr(m[1].trim()),
          attachmentExpr: _DetailedParser.transpileExpr(m[2].trim())
        });
        continue;
      }
      bindings.push({
        texExpr: _DetailedParser.transpileExpr(entry),
        attachmentExpr: JSON.stringify(`ColAtch${autoIndex++}`)
      });
    }
    const attachments = bindings.map((b) => b.attachmentExpr);
    const decl = declaredVars.has(name) ? name : `var ${name}`;
    declaredVars.add(name);
    const out = [`${decl} = lastUsedProgram.cFrameBuffer().bind([${attachments.join(", ")}]);`];
    bindings.forEach((b) => out.push(`${name}.bindColorBuffer(${b.texExpr}, ${b.attachmentExpr});`));
    return out;
  }
  static transpileFramebufferInline(line, declaredVars) {
    const m = line.match(/^framebuffer\s+([A-Za-z_]\w*)\s*\[([\s\S]*)\]$/);
    if (!m) return null;
    const items = _DetailedParser.splitTopLevelByChar(m[2], ",").map((x) => x.trim()).filter(Boolean);
    return _DetailedParser.transpileFramebufferBlock(m[1], items, declaredVars);
  }
  static transpileAttributeLines(lines, active = /* @__PURE__ */ new Set()) {
    const out = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      const template = _DetailedParser.transpileTemplateBlocks.get(line);
      if (template?.kind === "attributes") {
        if (active.has(line)) throw new Error(`Plantilla attributes circular: ${line}`);
        active.add(line);
        out.push(..._DetailedParser.transpileAttributeLines(template.lines, active));
        active.delete(line);
        continue;
      }
      const match = line.match(/^(?:(["'])([A-Za-z_]\w*)\1\s*->\s*)?\{([^{}]+)\}\s*(f|float|i|int|ui|uint|vec[234]|ivec[234]|uvec[234]|mat[234])$/);
      if (!match) throw new Error(`Declaracion de attribute invalida: ${line}`);
      const name = match[2] || match[3].trim();
      if (!/^[A-Za-z_]\w*$/.test(name)) throw new Error(`Nombre de attribute invalido: ${name}`);
      const hint = match[4];
      const type = /^(?:i|int|ivec)/.test(hint) ? "INT" : /^(?:ui|uint|uvec)/.test(hint) ? "UNSIGNED_INT" : "FLOAT";
      const dimension = Number(/[234]$/.exec(hint)?.[0] || "1");
      const columns = hint.startsWith("mat") ? dimension : 1;
      out.push(`lastUsedProgram.VAO.attribute(${JSON.stringify(name)}, ${_DetailedParser.transpileExpr(match[3])}, ${dimension}, ${JSON.stringify(type)}, 0, 0, false, ${columns});`);
    }
    return out;
  }
  static transpileDrawCallBlock(headerRaw, lines, declaredVars) {
    const header = headerRaw.trim();
    const m = header.match(/^((?:drawPoints|drawLineStrip|drawLineLoop|drawLines|drawTriangleStrip|drawTriangleFan|drawTriangles))\s*([\s\S]*?)\s*(?:->\s*\[([\s\S]*?)\])?(?:\s+size\s+(\[[\s\S]*\]))?\s*$/i);
    if (!m) return [`// TODO(draw-block): ${header}`];
    const drawFn = m[1];
    const canonicalDrawFn = Object.keys(_DetailedParser.DRAW_BLOCK_MODES).find((key) => key.toLowerCase() === drawFn.toLowerCase());
    const drawMode = canonicalDrawFn && _DetailedParser.DRAW_BLOCK_MODES[canonicalDrawFn];
    if (!drawMode) return [`// TODO(draw-block-unsupported): ${header}`];
    const argsRaw = (m[2] || "").trim();
    const outTexRaw = (m[3] || "").trim();
    const sizeRaw = (m[4] || "").trim();
    const headerTokens = _DetailedParser.splitByWhitespaceTopLevel(argsRaw);
    let headerAttribute;
    let explicitCount;
    let firstVertex = "0";
    const headerAttributeToken = /^\{([^{}]+)\}(f|float|i|int|ui|uint|vec[234]|ivec[234]|uvec[234]|mat[234])?$/;
    if (headerTokens.some((token) => headerAttributeToken.test(token))) {
      const name = /^(["'])([A-Za-z_]\w*)\1$/.exec(headerTokens[0]);
      const valueIndex = name ? 1 : 0;
      const attribute = headerAttributeToken.exec(headerTokens[valueIndex] || "");
      if (!attribute) throw new Error(`Atributo de draw invalido: ${header}`);
      headerAttribute = { name: name ? name[2] : "aPos", value: _DetailedParser.transpileExpr(attribute[1]), hint: attribute[2] };
      if (headerTokens[valueIndex + 1]) explicitCount = _DetailedParser.transpileExpr(headerTokens[valueIndex + 1]);
      if (headerTokens.length > valueIndex + 2) throw new Error(`Demasiados argumentos de draw: ${header}`);
    } else if (headerTokens.length) {
      firstVertex = _DetailedParser.transpileExpr(headerTokens[0]);
      explicitCount = headerTokens[1] ? _DetailedParser.transpileExpr(headerTokens[1]) : void 0;
    }
    const runtimeLines = [];
    let framebufferAliases = [];
    let backupPathExpr = "undefined";
    const outputRefs = outTexRaw ? _DetailedParser.splitTopLevelByChar(outTexRaw, ",").map((x) => x.trim()).filter(Boolean) : [];
    const uniformSnapshotEntries = [];
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        runtimeLines.push(rawLine);
        continue;
      }
      const fbMeta = trimmed.match(/^framebuffer\s*:\s*(.+)$/);
      if (fbMeta) {
        framebufferAliases = fbMeta[1].split(/\|=/).map((x) => x.trim()).filter(Boolean);
        continue;
      }
      const backupMeta = trimmed.match(/^backUp\s*:\s*(.+)$/i);
      if (backupMeta) {
        backupPathExpr = JSON.stringify(backupMeta[1].trim());
        continue;
      }
      runtimeLines.push(rawLine);
    }
    const out = [];
    out.push(`lastUsedProgram?.use?.();`);
    let hasAttributes = false;
    if (headerAttribute) {
      hasAttributes = true;
      out.push(`lastUsedProgram.bindVAO();`);
      if (headerAttribute.hint) {
        const hint = headerAttribute.hint;
        const type = /^(?:i|int|ivec)/.test(hint) ? "INT" : /^(?:ui|uint|uvec)/.test(hint) ? "UNSIGNED_INT" : "FLOAT";
        const dimension = Number(/[234]$/.exec(hint)?.[0] || "1");
        const columns = hint.startsWith("mat") ? dimension : 1;
        out.push(`lastUsedProgram.VAO.attribute(${JSON.stringify(headerAttribute.name)}, ${headerAttribute.value}, ${dimension}, ${JSON.stringify(type)}, 0, 0, false, ${columns});`);
      } else {
        out.push(`(()=>{ const __data = ${headerAttribute.value}; const __dim = Array.isArray(__data?.[0]) ? __data[0].length : 2; lastUsedProgram.VAO.attribute(${JSON.stringify(headerAttribute.name)}, __data, __dim); })();`);
      }
    }
    if (sizeRaw) {
      const sizeExpr = _DetailedParser.transpileExpr(sizeRaw);
      out.push(`(()=>{ const __sz:any = ${sizeExpr}; lastUsedProgram?.setViewport(0,0,__sz[0],__sz[1]); })();`);
    }
    if (outTexRaw) {
      const texRefs = _DetailedParser.splitTopLevelByChar(outTexRaw, ",").map((x) => x.trim()).filter(Boolean);
      const bindings = texRefs.map((ref, i2) => {
        const u = _DetailedParser.transpileTexAliasToUniform.get(ref) || ref;
        if (!_DetailedParser.transpileTexDeclaredNames.has(ref) && !_DetailedParser.transpileTexDeclaredNames.has(u)) {
          throw new Error(`draw-block salida no declarada: '${ref}'`);
        }
        return { texExpr: _DetailedParser.transpileExpr(ref), attachmentExpr: JSON.stringify(`ColAtch${i2}`) };
      });
      const defaultBase = _DetailedParser.transpileLastUsedProgramExpr || "lastUsedProgram";
      const defaultFbo = /^[A-Za-z_]\w*$/.test(defaultBase) ? `${defaultBase}FBO` : `__drawFBO_${Math.random().toString(36).slice(2, 8)}`;
      const aliases = framebufferAliases.length ? framebufferAliases : [defaultFbo];
      const primaryFbo = aliases[0];
      const declareFbo = !declaredVars.has(primaryFbo);
      if (declareFbo) declaredVars.add(primaryFbo);
      const drawBuffersExpr = `[${bindings.map((b) => b.attachmentExpr).join(", ")}]`;
      out.push(`${declareFbo ? "var " : ""}${primaryFbo} = (typeof ${primaryFbo} !== "undefined" && ${primaryFbo}) ? ${primaryFbo}.bind(${drawBuffersExpr}) : lastUsedProgram.cFrameBuffer().bind(${drawBuffersExpr});`);
      bindings.forEach((b) => out.push(`${primaryFbo}.bindColorBuffer(${b.texExpr}, ${b.attachmentExpr});`));
      for (const alias of aliases.slice(1)) {
        if (!/^[A-Za-z_]\w*$/.test(alias)) continue;
        if (!declaredVars.has(alias)) {
          declaredVars.add(alias);
          out.push(`var ${alias} = ${primaryFbo};`);
        } else {
          out.push(`${alias} = ${primaryFbo};`);
        }
      }
    }
    let i = 0;
    while (i < runtimeLines.length) {
      const ln = runtimeLines[i].trim();
      if (!ln) {
        i++;
        continue;
      }
      if (ln === "uniforms {" || /^uniforms\s*\{$/.test(ln)) {
        i++;
        while (i < runtimeLines.length && runtimeLines[i].trim() !== "}") {
          const uniLn = runtimeLines[i].trim();
          const tpl2 = _DetailedParser.transpileTemplateBlocks.get(uniLn.split(/\s+/)[0]);
          if (tpl2?.kind === "uniforms") {
            for (const tplLine of tpl2.lines) {
              out.push(..._DetailedParser.transpileUniformLine("lastUsedProgram", tplLine));
              const snap = _DetailedParser.parseUniformSnapshotEntry(tplLine);
              if (snap) uniformSnapshotEntries.push(`{ kind: "uniform", name: ${JSON.stringify(snap.name)}, value: ${snap.expr} }`);
            }
          } else {
            out.push(..._DetailedParser.transpileUniformLine("lastUsedProgram", uniLn));
            const snap = _DetailedParser.parseUniformSnapshotEntry(uniLn);
            if (snap) uniformSnapshotEntries.push(`{ kind: "uniform", name: ${JSON.stringify(snap.name)}, value: ${snap.expr} }`);
          }
          i++;
        }
        i++;
        continue;
      }
      if (ln === "rebind {" || /^rebind(?:\s+-\w[\w-]*-)?\s*\{$/.test(ln)) {
        const rb = [];
        i++;
        while (i < runtimeLines.length && runtimeLines[i].trim() !== "}") {
          rb.push(runtimeLines[i]);
          i++;
        }
        out.push(..._DetailedParser.transpileRebindBlock("lastUsedProgram", rb));
        i++;
        continue;
      }
      if (/^attributes\s*\{$/.test(ln)) {
        const attrs = [];
        i++;
        while (i < runtimeLines.length && runtimeLines[i].trim() !== "}") {
          attrs.push(runtimeLines[i]);
          i++;
        }
        if (!hasAttributes) out.push(`lastUsedProgram.bindVAO();`);
        hasAttributes = true;
        out.push(..._DetailedParser.transpileAttributeLines(attrs));
        i++;
        continue;
      }
      const tpl = _DetailedParser.transpileTemplateBlocks.get(ln.split(/\s+/)[0]);
      if (tpl) {
        if (tpl.kind === "uniforms") {
          for (const tplLine of tpl.lines) {
            out.push(..._DetailedParser.transpileUniformLine("lastUsedProgram", tplLine));
            const snap = _DetailedParser.parseUniformSnapshotEntry(tplLine);
            if (snap) uniformSnapshotEntries.push(`{ kind: "uniform", name: ${JSON.stringify(snap.name)}, value: ${snap.expr} }`);
          }
        } else if (tpl.kind === "rebind") {
          out.push(..._DetailedParser.transpileRebindBlock("lastUsedProgram", tpl.lines));
        } else if (tpl.kind === "framebuffer") {
          out.push(..._DetailedParser.transpileFramebufferBlock(`__fbo_${Math.random().toString(36).slice(2, 8)}`, tpl.lines, declaredVars));
        } else if (tpl.kind === "attributes") {
          if (!hasAttributes) out.push(`lastUsedProgram.bindVAO();`);
          hasAttributes = true;
          out.push(..._DetailedParser.transpileAttributeLines(tpl.lines));
        }
        i++;
        continue;
      }
      out.push(..._DetailedParser.transpileSimpleStatement(ln, declaredVars));
      i++;
    }
    if (hasAttributes) out.push(`lastUsedProgram.bindVAO();`);
    out.push(`lastUsedProgram?.drawArrays(${JSON.stringify(drawMode)}, ${firstVertex}, ${explicitCount ?? (hasAttributes ? "lastUsedProgram.VAO.vaoLength" : "6")});`);
    if (backupPathExpr !== "undefined") {
      const outputEntriesExpr = outputRefs.length ? `[${outputRefs.map((ref) => `{ name: ${JSON.stringify(ref)}, tex: ${_DetailedParser.transpileExpr(ref)} }`).join(", ")}]` : `[]`;
      const uniformEntriesExpr = `[${uniformSnapshotEntries.join(", ")}]`;
      out.push(`void __backupStoreDrawBlock(${JSON.stringify(drawFn)}, ${backupPathExpr}, ${outputEntriesExpr}, ${uniformEntriesExpr}, lastUsedProgram);`);
    }
    return out;
  }
  static transpileUnbindFBOBlock(lines) {
    return _DetailedParser.collectCommaSeparatedEntries(lines).map((entry) => `${_DetailedParser.transpileExpr(entry)}.unbindFBO();`);
  }
  static appendSemicolon(line) {
    const t = line.trim();
    if (!t) return t;
    if (t.endsWith(";") || t.endsWith("{") || t.endsWith("}") || t.endsWith(");")) return t;
    return t + ";";
  }
  static isBackupPathReplaceDirective(line) {
    return /^\s*backUpPathReplace\s+\/((?:\\.|[^/])+)\/([dgimsuvy]*)\s*->\s*(.+?)\s*$/.test(line);
  }
  static inferBackupDefaultScope(str, outPath, backupScopeHint) {
    const hinted = String(backupScopeHint || "").trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (hinted) return hinted;
    if (/parseTextC23\.shaderdsl\.ts/i.test(str || "")) return "parseTextC23";
    const m = String(outPath || "").match(/generatedParser([^\\/]+)\.ts$/i);
    if (!m) return "backups";
    const suffix = m[1] || "";
    return `parseText${suffix || ""}`;
  }
  static getNodeRequire() {
    try {
      const g = globalThis;
      if (typeof g.require === "function") return g.require;
      return (0, eval)("require");
    } catch {
      return null;
    }
  }
  static async readFileSafe(filePath) {
    try {
      const req = _DetailedParser.getNodeRequire();
      if (req) {
        const fs2 = req("fs");
        return await fs2.promises.readFile(filePath, "utf8");
      }
      const fs = await import("node:fs/promises");
      return await fs.readFile(filePath, "utf8");
    } catch {
      return null;
    }
  }
  static async writeFileSafe(filePath, content) {
    const req = _DetailedParser.getNodeRequire();
    if (req) {
      const fs2 = req("fs");
      const path2 = req("path");
      await fs2.promises.mkdir(path2.dirname(filePath), { recursive: true });
      await fs2.promises.writeFile(filePath, content, "utf8");
      return;
    }
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
  }
  static async resolveParseTextImports(source, baseDir, seen = /* @__PURE__ */ new Set()) {
    const req = _DetailedParser.getNodeRequire();
    const pathMod = req ? req("path") : await import("node:path");
    const cwd = (() => {
      try {
        return req ? req("process").cwd() : process.cwd();
      } catch {
        return ".";
      }
    })();
    const rootDir = baseDir || cwd;
    const lines = source.split(/\r?\n/);
    const out = [];
    for (const line of lines) {
      const m = line.match(/^\s*import\s+<([A-Za-z_][\w-]*)>\s+from\s+["']?(.+?\.txt)["']?\s*$/);
      if (!m) {
        out.push(line);
        continue;
      }
      const markerName = m[1];
      const rawPath = m[2].trim();
      const resolved = pathMod.resolve(rootDir, rawPath);
      if (seen.has(resolved)) {
        throw new Error(`Cyclic parseText import detected for <${markerName}> from ${resolved}`);
      }
      const imported = await _DetailedParser.readFileSafe(resolved);
      if (imported == null) {
        throw new Error(`Could not read parseText import <${markerName}> from ${resolved}`);
      }
      seen.add(resolved);
      const nested = await _DetailedParser.resolveParseTextImports(imported, pathMod.dirname(resolved), seen);
      seen.delete(resolved);
      out.push(`//<import:${markerName}:${rawPath}>`);
      out.push(nested);
      out.push(`//</import:${markerName}:${rawPath}>`);
    }
    return out.join("\n");
  }
  static extractPreservedSections(source) {
    const map = /* @__PURE__ */ new Map();
    const lines = source.split(/\r?\n/);
    let current = null;
    let bucket = [];
    for (const line of lines) {
      const open = line.trim().match(/^\/\/<([A-Za-z_][\w-]*)>\s*$/);
      if (open) {
        current = open[1];
        bucket = [];
        continue;
      }
      const close = line.trim().match(/^\/\/<\/([A-Za-z_][\w-]*)>\s*$/);
      if (close && current === close[1]) {
        map.set(current, [...bucket]);
        current = null;
        bucket = [];
        continue;
      }
      if (current) bucket.push(line);
    }
    return map;
  }
  static async extractImportsFromMain(mainTsPath) {
    if (!mainTsPath) return [];
    const source = await _DetailedParser.readFileSafe(mainTsPath);
    if (!source) return [];
    const lines = source.split(/\r?\n/);
    const imports = [];
    let current = [];
    let readingImport = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!readingImport && trimmed.startsWith("import ")) {
        readingImport = true;
        current = [line];
        if (trimmed.endsWith(";")) {
          imports.push(current.join("\n"));
          current = [];
          readingImport = false;
        }
        continue;
      }
      if (readingImport) {
        current.push(line);
        if (trimmed.endsWith(";")) {
          imports.push(current.join("\n"));
          current = [];
          readingImport = false;
        }
        continue;
      }
      if (imports.length && trimmed.length && !trimmed.startsWith("import ")) {
        break;
      }
    }
    return _DetailedParser.ensureOpenGLHelpersImport(_DetailedParser.ensureWebglCapsulesImport(imports));
  }
  static ensureWebglCapsulesImport(imports) {
    const idx = imports.findIndex((i) => /from\s+["'][^"']*webglCapsules\.js["']/.test(i));
    if (idx < 0) return imports;
    const imp = imports[idx];
    const m = imp.match(/import\s*{([\s\S]*?)}\s*from\s*["']([^"']*webglCapsules\.js)["'];?/);
    if (!m) return imports;
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.includes("MeshFillerProgram")) names.push("MeshFillerProgram");
    imports[idx] = `import { ${[...new Set(names)].join(", ")} } from "${m[2]}";`;
    return imports;
  }
  static ensureOpenGLHelpersImport(imports) {
    const helperNames = ["__prepareMathFunction", "__mountGlobalBlocks"];
    const idx = imports.findIndex((i) => /from\s+["'][^"']*opengl\.js["']/.test(i));
    if (idx < 0) {
      imports.push(`import { ${helperNames.join(", ")} } from "/Code/opengl/opengl.js";`);
      return imports;
    }
    const imp = imports[idx];
    const m = imp.match(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/);
    if (!m) return imports;
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    helperNames.forEach((h) => {
      if (!names.includes(h)) names.push(h);
    });
    imports[idx] = `import { ${[...new Set(names)].join(", ")} } from "${m[2]}";`;
    return imports;
  }
  static extractAliasesAndCore(rawLine) {
    let aliases = [];
    let core = rawLine.trim();
    const leftMatch = core.match(/^\s*([a-zA-Z_]\w*(?:\s*\|=\s*[a-zA-Z_]\w*)*)\s*=/);
    if (leftMatch) {
      const leftAliases = leftMatch[1].split(/\|=/).map((s) => s.trim()).filter(Boolean);
      aliases.push(...leftAliases);
      core = core.slice(leftMatch[0].length).trim();
    }
    const rightMatch = core.match(/\|=\s*([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*$/);
    if (rightMatch) {
      const rightAliases = rightMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      aliases.push(...rightAliases);
      core = core.slice(0, rightMatch.index).trim();
    }
    aliases = [...new Set(aliases)];
    return { aliases, core };
  }
  static transpileUniformLine(programRef, line) {
    const shortMatch = line.match(/^\{([a-zA-Z_]\w*)\}([iuf])\s*$/);
    if (shortMatch) {
      const [, shortName, shortSuffix] = shortMatch;
      const expr2 = _DetailedParser.transpileExpr(`{${shortName}}`);
      return [`${programRef}.uNum("${shortName}", ${shortSuffix === "f"}, ${shortSuffix === "u"}).set(${expr2});`];
    }
    const vectorMatch = line.match(/^(\w+)\s*=\s*(.+?)(?:(i|u|f)?v([2-4]))\s*$/);
    if (vectorMatch) {
      const [, name2, rawValue3, rawScalarSuffix, rawDim] = vectorMatch;
      const dim = Number.parseInt(rawDim, 10);
      const scalarSuffix = rawScalarSuffix || "f";
      return [
        `${programRef}.uVec("${name2}", ${dim}, ${scalarSuffix === "f"}, ${scalarSuffix === "u"}).set(${_DetailedParser.transpileUniformVectorExpr(rawValue3, dim)});`
      ];
    }
    const m = line.match(/^(\w+)\s*=\s*(.+?)([iuf])?\s*$/);
    if (!m) return [`// TODO(uniform): ${line}`];
    const [, name, rawValue2, rawSuffix] = m;
    const suffix = rawSuffix || "f";
    const isFloat = suffix === "f";
    const isUnsigned = suffix === "u";
    const value = rawValue2.trim();
    if (value.startsWith("vec3(") && value.endsWith(")")) {
      const inside = value.slice(5, -1);
      const comps = _DetailedParser.splitTopLevelByChar(inside, ",").map((x) => _DetailedParser.transpileExpr(x));
      return [
        `${programRef}.uVec("${name}", 3, ${isFloat}, ${isUnsigned}).set([${comps.join(", ")}]);`
      ];
    }
    const expr = _DetailedParser.transpileExpr(rawValue2);
    return [`${programRef}.uNum("${name}", ${isFloat}, ${isUnsigned}).set(${expr});`];
  }
  static transpileUniformVectorExpr(rawValue2, dimension) {
    const expr = _DetailedParser.transpileExpr(rawValue2);
    const dim = Math.max(2, Math.min(4, ~~dimension));
    return `(()=>{ const __src:any = ${expr}; const __arr:any[] = Array.isArray(__src) ? [...__src] : [__src]; if(__arr.length === 1){ return Array(${dim}).fill(__arr[0]); } const __out:any[] = []; for(let __i = 0; __i < ${dim}; __i++){ __out.push(__i < __arr.length ? __arr[__i] : 0); } return __out; })()`;
  }
  static transpileProgramObject(aliases, core) {
    const m = core.match(/^Program(?:\s+(.+))?$/);
    if (!m || aliases.length === 0) return null;
    const firstAlias = aliases[0];
    let argRaw = (m[1] || "").trim();
    if (!argRaw) argRaw = firstAlias;
    let argJs = "";
    if (/^["']/.test(argRaw)) argJs = argRaw;
    else if (argRaw.startsWith("{") && argRaw.endsWith("}")) argJs = _DetailedParser.transpileExpr(argRaw);
    else argJs = JSON.stringify(argRaw);
    const out = [
      `if(!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);`,
      `var ${firstAlias} = WebGLMan.program(-1, ${argJs});`,
      `lastUsedProgram = ${firstAlias};`
    ];
    for (const alias of aliases.slice(1)) {
      out.push(`var ${alias} = ${firstAlias};`);
    }
    return out;
  }
  static ensureAliasesForClass(aliases, className, declaredVars) {
    const out = aliases.filter(Boolean);
    if (out.length === 0) {
      const base = className.charAt(0).toLowerCase() + className.slice(1);
      let candidate = base;
      let counter = 1;
      while (declaredVars.has(candidate)) {
        candidate = `${base}${counter++}`;
      }
      out.push(candidate);
    }
    out.forEach((a) => declaredVars.add(a));
    return out;
  }
  static transpileCamera3DObject(aliases, core) {
    const m = core.match(/^Camera3D(?:\s+(.+))?$/);
    if (!m || aliases.length === 0) return null;
    const firstAlias = aliases[0];
    const paramsStr = (m[1] || "").trim();
    const split = _DetailedParser.splitParamsAndChainTokens(paramsStr);
    const params = /* @__PURE__ */ new Map();
    if (split.params.length) {
      for (const token of split.params) {
        const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
        if (!pm) continue;
        params.set(pm[1], _DetailedParser.transpileExpr(pm[2]));
      }
    }
    const ordered = [
      params.get("pos"),
      params.get("fov"),
      params.get("aspectRatio") ?? params.get("ratio"),
      params.get("near"),
      params.get("far"),
      params.get("walkspeed") ?? params.get("speed")
    ];
    while (ordered.length && ordered[ordered.length - 1] === void 0) ordered.pop();
    const ctorArgs = ordered.map((v) => v === void 0 ? "undefined" : v).join(", ");
    const out = [`var ${firstAlias} = new Camera3D(${ctorArgs});`];
    for (const chain of split.chains) out.push(`${firstAlias}${chain};`);
    for (const alias of aliases.slice(1)) {
      out.push(`var ${alias} = ${firstAlias};`);
    }
    return out;
  }
  static transpileTexture2DArrayObject(aliases, core) {
    const m = core.match(/^texture2DArray\s+([\s\S]+)$/);
    if (!m || aliases.length === 0) return null;
    const tokens = _DetailedParser.splitByWhitespaceTopLevel(m[1]);
    if (tokens.length < 5) return null;
    const firstAlias = aliases[0];
    const format = tokens[0];
    const dataExpr = _DetailedParser.transpileExpr(tokens[1]);
    const nameArg = tokens[2].startsWith('"') || tokens[2].startsWith("'") ? tokens[2] : JSON.stringify(tokens[2]);
    const texUnit = _DetailedParser.normalizeTexUnitToken(tokens[3]);
    const sizeToken = tokens.slice(4).join(" ");
    const sizeExpr = _DetailedParser.transpileSizeToken(sizeToken);
    const out = [
      `var ${firstAlias} = lastUsedProgram?.texture2DArray?.({`,
      `    format: (TexExamples as any).${format},`,
      `    data: ${dataExpr},`,
      `    name: ${nameArg},`,
      `    texUnit: ${texUnit},`,
      `    size: ${sizeExpr}`,
      `});`
    ];
    for (const alias of aliases.slice(1)) {
      out.push(`var ${alias} = ${firstAlias};`);
    }
    return out;
  }
  static transpileMeshProgramObject(aliases, core) {
    const m = core.match(/^MeshProgram(?:\s+(.+))?$/);
    if (!m || aliases.length === 0) return null;
    const firstAlias = aliases[0];
    const paramsStr = (m[1] || "").trim();
    const split = _DetailedParser.splitParamsAndChainTokens(paramsStr);
    const params = /* @__PURE__ */ new Map();
    const positional = [];
    if (split.params.length) {
      for (const token of split.params) {
        const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
        if (pm) {
          params.set(pm[1], _DetailedParser.transpileExpr(pm[2]));
        } else {
          positional.push(_DetailedParser.transpileExpr(token));
        }
      }
    }
    const inputExpr = params.get("input") ?? positional[0] ?? "undefined";
    const sizeExpr = positional[0] && params.has("input") ? positional[0] : positional[1] ?? "undefined";
    const sizeArg = sizeExpr.includes("x") ? _DetailedParser.transpileSizeToken(sizeExpr) : sizeExpr.startsWith("[") ? sizeExpr : _DetailedParser.transpileExpr(sizeExpr);
    const out = [
      `var ${firstAlias} = new MeshRenderingProgram(gl, ${inputExpr}, (${sizeArg})[0], (${sizeArg})[1]).includeInWebManList();`,
      `lastUsedProgram = ${firstAlias};`
    ];
    for (const chain of split.chains) out.push(`${firstAlias}${chain};`);
    for (const alias of aliases.slice(1)) out.push(`var ${alias} = ${firstAlias};`);
    return out;
  }
  static transpileAxis3DGroupObject(aliases, core) {
    const m = core.match(/^Axis3DGroup(?:\s+(.+))?$/);
    if (!m || aliases.length === 0) return null;
    const firstAlias = aliases[0];
    const paramsStr = (m[1] || "").trim();
    const split = _DetailedParser.splitParamsAndChainTokens(paramsStr);
    const params = /* @__PURE__ */ new Map();
    if (split.params.length) {
      for (const token of split.params) {
        const pm = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
        if (!pm) continue;
        params.set(pm[1], _DetailedParser.transpileExpr(pm[2]));
      }
    }
    const out = [
      `var ${firstAlias} = new Axis3DGroup(gl, ${params.get("axisLength") ?? "undefined"}, ${params.get("drawArrows") ?? "undefined"}, ${params.get("heights") ?? "undefined"}, ${params.get("radii") ?? "undefined"}, ${params.get("planes") ?? "undefined"}).includeInWebManList();`
    ];
    for (const chain of split.chains) out.push(`${firstAlias}${chain};`);
    for (const alias of aliases.slice(1)) out.push(`var ${alias} = ${firstAlias};`);
    return out;
  }
  static transpileMeshFillerProgramObject(aliases, core) {
    const m = core.match(/^MeshFillerProgram(?:\s+(.+))?$/);
    if (!m || aliases.length === 0) return null;
    const firstAlias = aliases[0];
    const paramsStr = (m[1] || "").trim();
    const split = _DetailedParser.splitParamsAndChainTokens(paramsStr);
    const tokens = split.params;
    const texUnit = tokens[0] ? _DetailedParser.normalizeTexUnitToken(tokens[0]) : "undefined";
    const programBody = tokens[1] ?? void 0;
    const callbackToken = tokens[1] || "";
    let callbackSource = callbackToken;
    if (callbackSource.startsWith('"') && callbackSource.endsWith('"') || callbackSource.startsWith("'") && callbackSource.endsWith("'")) {
      callbackSource = callbackSource.slice(1, -1);
    }
    callbackSource = callbackSource.replace(/\\(["'\\])/g, "$1");
    const contextNames = _DetailedParser.extractContextNamesFromCallback(callbackSource).filter((n) => n !== "x" && n !== "y");
    const out = [
      `var ${firstAlias} = new MeshFillerProgram(gl, ${texUnit}).includeInWebManList();`
    ];
    if (programBody !== void 0) {
      if (contextNames.length) {
        const ctxName = `__ctx_${firstAlias}`;
        out.push(`var ${ctxName} = {`);
        contextNames.forEach((n) => {
          out.push(`    get ${n}(){ return (typeof ${n} !== "undefined") ? ${n} : (globalThis as any).${n}; },`);
        });
        out.push(`};`);
        out.push(`${firstAlias}.generateProgram(${programBody}, ${ctxName}, globalThis as any);`);
      } else {
        out.push(`${firstAlias}.generateProgram(${programBody}, globalThis as any);`);
      }
      out.push(`await ${firstAlias}.loadProgram?.();`);
    }
    for (const chain of split.chains) out.push(`${firstAlias}${chain};`);
    out.push(`lastFillerProgram = ${firstAlias};`);
    for (const alias of aliases.slice(1)) out.push(`var ${alias} = ${firstAlias};`);
    return out;
  }
  static transpileEscapedDestructuring(line, declaredVars) {
    const m = line.match(/^\[\s*([^\]]+)\s*\]\s*=\s*\$(\w+)\$\(([\s\S]*)\)$/);
    if (!m) return null;
    const vars = m[1].split(",").map((v) => v.trim()).filter(Boolean);
    const funcName = m[2].trim();
    const argsRaw = m[3].trim();
    const out = [];
    const undeclared = vars.filter((v) => !declaredVars.has(v));
    if (undeclared.length > 0) {
      out.push(`var ${undeclared.join(", ")};`);
      undeclared.forEach((v) => declaredVars.add(v));
    }
    const args = argsRaw ? _DetailedParser.splitTopLevelByChar(argsRaw, ",").map((a) => _DetailedParser.transpileExpr(a)).join(", ") : "";
    const tuple = `[${vars.join(", ")}]`;
    out.push(`${tuple} = ${funcName}(${args});`);
    return out;
  }
  static transpileCreateIdealMesh(line, declaredVars) {
    const m = line.match(/^(?:([a-zA-Z_]\w*)\s*=\s*)?createIdealMesh\s+([\s\S]+)$/);
    if (!m) return null;
    const alias = m[1]?.trim();
    let rest = (m[2] || "").trim().replace(/;$/, "");
    const tokens = _DetailedParser.splitByWhitespaceTopLevel(rest);
    if (!tokens.length) return null;
    const texToken = tokens[0];
    rest = rest.slice(rest.indexOf(texToken) + texToken.length).trim();
    let callbackRaw = rest;
    let chainRaw = "";
    const chainMatch = rest.match(/^(.*?)(\s*(?:\.[A-Za-z_]\w*\([^)]*\)\s*)+)$/);
    if (chainMatch) {
      callbackRaw = chainMatch[1].trim();
      chainRaw = chainMatch[2].trim();
    }
    const texExpr = _DetailedParser.normalizeTexUnitToken(texToken);
    const callbackStr = JSON.stringify(callbackRaw);
    const targetName = alias ? alias : "__meshTexTmp";
    const out = [];
    if (alias && !declaredVars.has(alias)) {
      declaredVars.add(alias);
      out.push(`var ${alias};`);
    }
    out.push(`(()=>{`);
    out.push(`    // createIdealMesh${alias ? ` ${alias}` : ""}`);
    out.push(`    let compiledCreateIdealMeshFn = __prepareMathFunction(${callbackStr});`);
    const createExpr = `lastUsedProgram?.createIdealTexture?.(${texExpr}, compiledCreateIdealMeshFn)`;
    if (alias) out.push(`    ${alias} = ${createExpr};`);
    else out.push(`    let ${targetName} = ${createExpr};`);
    if (chainRaw) {
      const chainCalls = chainRaw.match(/\.[A-Za-z_]\w*\([^)]*\)/g) || [];
      for (const call of chainCalls) {
        const cm = call.match(/^\.([A-Za-z_]\w*)\(([\s\S]*)\)$/);
        if (!cm) continue;
        const method = cm[1];
        const args = cm[2].trim();
        const transpiledArgs = args ? _DetailedParser.transpileExpr(args) : "";
        out.push(`    ${targetName}?.${method}?.(${transpiledArgs});`);
      }
    }
    out.push(`})();`);
    return out;
  }
  static transpileSimpleStatement(line, declaredVars) {
    const out = [];
    const escaped = _DetailedParser.transpileEscapedDestructuring(line, declaredVars);
    if (escaped) return escaped;
    const createIdeal = _DetailedParser.transpileCreateIdealMesh(line, declaredVars);
    if (createIdeal) return createIdeal;
    const singleLineIfMatch = line.match(/^if\s*\(([\s\S]+)\)\s+(.+)$/);
    if (singleLineIfMatch && !singleLineIfMatch[2].trim().startsWith("{")) {
      const [, condRaw, stmtRaw] = singleLineIfMatch;
      const inner = _DetailedParser.transpileSimpleStatement(stmtRaw.trim(), declaredVars);
      if (!inner.length) return [];
      if (inner.length === 1) return [`if(${_DetailedParser.transpileExpr(condRaw)}) ${inner[0]}`];
      return [
        `if(${_DetailedParser.transpileExpr(condRaw)}){`,
        ...inner.map((x) => `    ${x}`),
        `}`
      ];
    }
    const letMatch = line.match(/^(?:[A-Za-z_]\w*-\s*)?(let|var)\s+(?:derived\s+)?([a-zA-Z_]\w*)(?:\s*=\s*([\s\S]+))?$/);
    if (letMatch) {
      const [, declKw, name, valueRaw] = letMatch;
      if (declaredVars.has(name)) {
        if (valueRaw === void 0) return [`${name} = undefined;`];
        return [`${name} = ${_DetailedParser.transpileExpr(valueRaw)};`];
      }
      declaredVars.add(name);
      if (valueRaw === void 0) return [`${declKw} ${name};`];
      return [`${declKw} ${name} = ${_DetailedParser.transpileExpr(valueRaw)};`];
    }
    const framebufferInline = _DetailedParser.transpileFramebufferInline(line, declaredVars);
    if (framebufferInline) return framebufferInline;
    const useMatch = line.match(/^(lduse|use)\s+(.+)$/);
    if (useMatch) {
      const kind = useMatch[1];
      const obj = _DetailedParser.transpileExpr(useMatch[2]);
      if (kind === "lduse") {
        _DetailedParser.transpileLastUsedProgramExpr = obj;
        const vertFilter = _DetailedParser.transpileShaderFilterFactory("vert", `${obj}.vertPath`);
        const fragFilter = _DetailedParser.transpileShaderFilterFactory("frag", `${obj}.fragPath`);
        return [
          `await ${obj}.loadProgram(${obj}.vertPath, ${obj}.fragPath, ${vertFilter}, ${fragFilter});`,
          `await ${obj}.use?.();`,
          `lastUsedProgram = ${obj};`
        ];
      }
      _DetailedParser.transpileLastUsedProgramExpr = obj;
      return [
        `await ${obj}.use?.();`,
        `lastUsedProgram = ${obj};`
      ];
    }
    const viewportSimpleMatch = line.match(/^viewport\s+(\[[\s\S]+\])$/);
    if (viewportSimpleMatch) {
      const viewExpr = _DetailedParser.transpileExpr(viewportSimpleMatch[1]);
      return [
        `lastUsedProgram?.use?.();`,
        `lastUsedProgram?.setViewport(...${viewExpr});`
      ];
    }
    const viewportMatch = line.match(/^viewport\s+([^\s]+)\s+(.+)$/);
    if (viewportMatch) {
      if (viewportMatch[1].startsWith("[")) {
        const viewExpr2 = _DetailedParser.transpileExpr(`${viewportMatch[1]} ${viewportMatch[2]}`.trim());
        return [
          `lastUsedProgram?.use?.();`,
          `lastUsedProgram?.setViewport(...${viewExpr2});`
        ];
      }
      const prog = _DetailedParser.transpileExpr(viewportMatch[1]);
      const viewExpr = _DetailedParser.transpileExpr(viewportMatch[2]);
      return [
        `${prog}.use?.();`,
        `${prog}.setViewport(...${viewExpr});`
      ];
    }
    const drawTrianglesSimpleMatch = line.match(/^drawTriangles\s*$/);
    if (drawTrianglesSimpleMatch) {
      return [`lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);`];
    }
    const drawTrianglesMatch = line.match(/^drawTriangles\s+([\s\S]+?)\s+([\s\S]+)$/);
    if (drawTrianglesMatch) {
      return [`lastUsedProgram?.drawArrays("TRIANGLES", ${_DetailedParser.transpileExpr(drawTrianglesMatch[1])}, ${_DetailedParser.transpileExpr(drawTrianglesMatch[2])});`];
    }
    const logFBOMatch = line.match(/^logFBO\s+([A-Za-z_]\w*)\s+([^\s]+)\s+(\[[^\]]+\])\s+([^\s]+)(?:\s+dim\s*=\s*([^\s]+))?(?:\s+(.+))?$/);
    if (logFBOMatch) {
      const [, fboRef, attachmentRaw, rectRaw, formatRaw, dimRaw, labelRaw] = logFBOMatch;
      const rectItems = _DetailedParser.splitTopLevelByChar(rectRaw.slice(1, -1), ",").map((x2) => _DetailedParser.transpileExpr(x2.trim()));
      const [x = "0", y = "0", w = "1", h = "1"] = rectItems;
      const dimExpr = dimRaw ? _DetailedParser.transpileExpr(dimRaw) : "4";
      const formatExpr = _DetailedParser.transpileTextureFormatToken(formatRaw);
      const labelExpr = labelRaw ? _DetailedParser.transpileExpr(labelRaw) : JSON.stringify(`${fboRef} ${attachmentRaw} ${rectRaw}`);
      return [
        `console.log(Array.from(${fboRef}.readColorAttachment(${_DetailedParser.transpileExpr(attachmentRaw)}, ${x}, ${y}, ${w}, ${h}, ${formatExpr}, ${dimExpr})), ${labelExpr});`
      ];
    }
    const backupStoreMatch = line.match(/^backUp\s+store\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*(?:\/([\s\S]*))?$/i);
    if (backupStoreMatch) {
      const [, valueRaw, pathRaw] = backupStoreMatch;
      const pathExpr = pathRaw !== void 0 ? JSON.stringify(pathRaw.trim()) : "undefined";
      return [`void __backupStore(${_DetailedParser.transpileExpr(valueRaw)}, ${JSON.stringify(valueRaw)}, ${pathExpr});`];
    }
    const backupRestoreMatch = line.match(/^backUp\s+restore\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s+\/([\s\S]+)$/i);
    if (backupRestoreMatch) {
      const [, targetRaw, pathRaw] = backupRestoreMatch;
      const targetExpr = _DetailedParser.transpileExpr(targetRaw);
      return [`${targetExpr} = await __backupRestoreInto(${targetExpr}, ${JSON.stringify(pathRaw.trim())});`];
    }
    const backupLogMatch = line.match(/^backUp\s+log\s+\/?([\s\S]+)$/i);
    if (backupLogMatch) {
      return [`await __backupLog(${JSON.stringify(backupLogMatch[1].trim())});`];
    }
    const depthTestMatch = line.match(/^depthTest\s+(.+)$/);
    if (depthTestMatch) {
      return [`if(lastUsedProgram) lastUsedProgram.isDepthTest = ${_DetailedParser.transpileExpr(depthTestMatch[1])};`];
    }
    if (line.trim() === "start") return ['if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);', "start();"];
    if (line.trim() === "startAsync") return ['if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);', "await startAsync();"];
    const logMatch = line.match(/^log\s+(.+)$/);
    if (logMatch) {
      const args = _DetailedParser.splitByWhitespaceTopLevel(logMatch[1]).map((t) => _DetailedParser.transpileExpr(t));
      return [`console.log(${args.join(", ")});`];
    }
    const { aliases, core } = _DetailedParser.extractAliasesAndCore(line);
    const inferredClass = core.match(/^([A-Z][A-Za-z0-9_]*)\b/)?.[1];
    const objectAliases = inferredClass ? _DetailedParser.ensureAliasesForClass(aliases, inferredClass, declaredVars) : aliases;
    if (objectAliases.length > 0) {
      const asProgram = _DetailedParser.transpileProgramObject(objectAliases, core);
      if (asProgram) return asProgram;
      const asMeshProgram = _DetailedParser.transpileMeshProgramObject(objectAliases, core);
      if (asMeshProgram) return asMeshProgram;
      const asMeshFillerProgram = _DetailedParser.transpileMeshFillerProgramObject(objectAliases, core);
      if (asMeshFillerProgram) return asMeshFillerProgram;
      const asAxis = _DetailedParser.transpileAxis3DGroupObject(objectAliases, core);
      if (asAxis) return asAxis;
      const asCamera = _DetailedParser.transpileCamera3DObject(objectAliases, core);
      if (asCamera) return asCamera;
      const asTexArray = _DetailedParser.transpileTexture2DArrayObject(objectAliases, core);
      if (asTexArray) return asTexArray;
    }
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*([+\-*/]?=)\s*([\s\S]+)$/);
    if (assignMatch && !line.includes("==")) {
      const [, name, op, value] = assignMatch;
      return [`${name} ${op} ${_DetailedParser.transpileExpr(value)};`];
    }
    out.push(_DetailedParser.appendSemicolon(_DetailedParser.transpileExpr(line)));
    return out;
  }
  static async transpileToFile(str, outPath, mainImportsPath, backupScopeHint) {
    const req = _DetailedParser.getNodeRequire();
    const pathMod = req ? req("path") : await import("node:path");
    const parseBaseDir = outPath ? pathMod.dirname(outPath) : void 0;
    str = await _DetailedParser.resolveParseTextImports(str, parseBaseDir);
    let resolvedMainPath = mainImportsPath;
    if (!resolvedMainPath) {
      try {
        const path = req?.("path");
        resolvedMainPath = path ? path.join(path.dirname(outPath), "main.ts") : void 0;
      } catch {
        resolvedMainPath = void 0;
      }
    }
    const imports = await _DetailedParser.extractImportsFromMain(resolvedMainPath);
    const previousSource = await _DetailedParser.readFileSafe(outPath);
    const preserved = previousSource ? _DetailedParser.extractPreservedSections(previousSource) : /* @__PURE__ */ new Map();
    const processed = str.replaceAll("	", "    ");
    let lines = processed.split("\n").map((l) => _DetailedParser.stripInlineComment(l).replace(/\r/g, ""));
    const extractedShaderFilters = _DetailedParser.extractShaderFilterLines(lines);
    _DetailedParser.loadTranspileShaderFiltersFromLines(extractedShaderFilters.filterLines);
    lines = extractedShaderFilters.lines;
    lines = _DetailedParser.joinIndentedLines(lines);
    const body = [];
    const declaredVars = /* @__PURE__ */ new Set();
    _DetailedParser.transpileTexAliasToUniform = /* @__PURE__ */ new Map();
    _DetailedParser.transpileTexAliasToTextureVar = /* @__PURE__ */ new Map();
    _DetailedParser.transpileTexDeclaredNames = /* @__PURE__ */ new Set();
    _DetailedParser.transpileProgramOutAliases = /* @__PURE__ */ new Map();
    _DetailedParser.transpileTemplateBlocks = /* @__PURE__ */ new Map();
    _DetailedParser.transpileFunctionBlocks = /* @__PURE__ */ new Map();
    let indent = 0;
    const ind = () => "    ".repeat(indent);
    let scaffoldInserted = false;
    const blockStack = [];
    const usedMarkers = /* @__PURE__ */ new Set();
    let globalBlockSerial = 0;
    const insertScaffold = () => {
      if (scaffoldInserted) return;
      body.push(`var lastUsedProgram: any = null;`);
      body.push(`var lastFillerProgram: any = null;`);
      body.push(`void lastFillerProgram;`);
      body.push(`var __globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}> = [];`);
      const shaderFilterHelper = _DetailedParser.buildTranspiledShaderFilterHelperLines();
      if (shaderFilterHelper.length) {
        body.push(...shaderFilterHelper);
      }
      body.push(..._DetailedParser.buildRuntimeLetHelperLines());
      body.push(..._DetailedParser.buildBackupRuntimeHelperLines(_DetailedParser.inferBackupDefaultScope(str, outPath, backupScopeHint)));
      scaffoldInserted = true;
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = _DetailedParser.stripInlineDslTags(raw.trim());
      if (!line) continue;
      if (_DetailedParser.isBackupPathReplaceDirective(line)) continue;
      const marker = line.match(/^<(?:\/)?([A-Za-z_][\w-]*)(?:\/)?>$/);
      if (marker) {
        const name = marker[1];
        usedMarkers.add(name);
        body.push(`${ind()}//<${name}>`);
        const kept = preserved.get(name) || [];
        kept.forEach((k) => body.push(k));
        body.push(`${ind()}//</${name}>`);
        continue;
      }
      insertScaffold();
      const currentBlock = blockStack[blockStack.length - 1];
      if (currentBlock?.kind === "uniforms") {
        if (line === "}") {
          blockStack.pop();
          continue;
        }
        const tplCall = line.match(/^([A-Za-z_]\w*)(?:\s+(.+))?$/);
        if (tplCall) {
          const tpl = _DetailedParser.transpileTemplateBlocks.get(tplCall[1]);
          if (tpl?.kind === "uniforms") {
            const programsForTpl = tplCall[2] ? tplCall[2].split(",").map((s) => _DetailedParser.transpileExpr(s.trim())).filter(Boolean) : currentBlock.uniformPrograms && currentBlock.uniformPrograms.length ? currentBlock.uniformPrograms : ["lastUsedProgram"];
            const tplHasExplicitProgram = !!tplCall[2]?.trim();
            for (const p of programsForTpl) {
              if (tplHasExplicitProgram) body.push(`${ind()}${p}.use?.();`);
              for (const uniLine of tpl.lines) {
                const uniLines = _DetailedParser.transpileUniformLine(p, uniLine);
                uniLines.forEach((l) => body.push(`${ind()}${l}`));
              }
            }
            continue;
          }
        }
        const programs = currentBlock.uniformPrograms && currentBlock.uniformPrograms.length ? currentBlock.uniformPrograms : ["lastUsedProgram"];
        for (const p of programs) {
          const uniLines = _DetailedParser.transpileUniformLine(p, line);
          uniLines.forEach((l) => body.push(`${ind()}${l}`));
        }
        continue;
      }
      if (currentBlock && ["groupedLet", "resource", "programBlock", "rebind", "framebufferBlock", "unbindFBOBlock", "templateBlock", "functionBlock", "drawCallBlock"].includes(currentBlock.kind)) {
        if (currentBlock.kind === "drawCallBlock") {
          if (line === "}") {
            if ((currentBlock.nestedDepth || 0) > 0) {
              currentBlock.nestedDepth = (currentBlock.nestedDepth || 0) - 1;
              (currentBlock.buffer ||= []).push(line);
              continue;
            }
          } else {
            if (/\{\s*$/.test(line)) currentBlock.nestedDepth = (currentBlock.nestedDepth || 0) + 1;
            (currentBlock.buffer ||= []).push(line);
            continue;
          }
        }
        if (line === "}") {
          const closing = blockStack.pop();
          const buffered = closing.buffer || [];
          let emitted = [];
          if (closing.kind === "groupedLet") {
            emitted = _DetailedParser.transpileGroupedLetBlock(closing.sourceToken, buffered, declaredVars, closing.groupedDecl || "let");
          } else if (closing.kind === "resource") {
            emitted = _DetailedParser.transpileResourceBlock(closing.name, buffered, declaredVars);
          } else if (closing.kind === "programBlock") {
            emitted = _DetailedParser.transpileProgramBlock(closing.name, buffered, declaredVars);
          } else if (closing.kind === "rebind") {
            emitted = _DetailedParser.transpileRebindBlock(closing.name, buffered);
          } else if (closing.kind === "framebufferBlock") {
            emitted = _DetailedParser.transpileFramebufferBlock(closing.name, buffered, declaredVars);
          } else if (closing.kind === "unbindFBOBlock") {
            emitted = _DetailedParser.transpileUnbindFBOBlock(buffered);
          } else if (closing.kind === "templateBlock") {
            _DetailedParser.transpileTemplateBlocks.set(closing.name, {
              kind: closing.templateKind || "uniforms",
              lines: buffered.slice()
            });
          } else if (closing.kind === "functionBlock") {
            _DetailedParser.transpileFunctionBlocks.set(closing.name, {
              params: (closing.functionParams || []).slice(),
              lines: buffered.slice()
            });
          } else if (closing.kind === "drawCallBlock") {
            emitted = _DetailedParser.transpileDrawCallBlock(closing.name, buffered, declaredVars);
          }
          emitted.forEach((l) => body.push(`${ind()}${l}`));
          continue;
        }
        (currentBlock.buffer ||= []).push(line);
        continue;
      }
      const groupedLetStart = line.match(/^(let|var)(?:\s+([^={][^{}]*?))?\s*\{$/);
      if (groupedLetStart) {
        blockStack.push({
          kind: "groupedLet",
          name: groupedLetStart[1],
          ifDepth: 0,
          loopCount: 0,
          sourceToken: groupedLetStart[2]?.trim(),
          groupedDecl: groupedLetStart[1],
          buffer: []
        });
        continue;
      }
      const templateStart = line.match(/^([A-Za-z_]\w*)\s*=\s*(uniforms|rebind|framebuffer|attributes)\s*\{$/);
      if (templateStart) {
        blockStack.push({
          kind: "templateBlock",
          name: templateStart[1],
          templateKind: templateStart[2],
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const functionStart = line.match(/^([A-Za-z_]\w*)\s*\(([^{}]*)\)\s*\{$/);
      if (functionStart && !/^(if|for|while|switch)$/.test(functionStart[1])) {
        const paramsRaw = functionStart[2].trim();
        const paramTokens = paramsRaw ? _DetailedParser.splitTopLevelByChar(paramsRaw, ",").map((x) => x.trim()).filter(Boolean) : [];
        const params = paramTokens.map((x) => x.split(":")[0].trim());
        const looksLikeParamizedFunction = params.length > 0 && paramTokens.every((tok) => /^[A-Za-z_]\w*(?:\s*:\s*.+)?$/.test(tok));
        if (looksLikeParamizedFunction) {
          blockStack.push({
            kind: "functionBlock",
            name: functionStart[1],
            functionParams: params,
            ifDepth: 0,
            loopCount: 0,
            buffer: []
          });
          continue;
        }
      }
      const drawCallStart = line.match(/^((?:drawPoints|drawLineStrip|drawLineLoop|drawLines|drawTriangleStrip|drawTriangleFan|drawTriangles)(?:[\s\S]*?))\{$/i);
      if (drawCallStart) {
        blockStack.push({
          kind: "drawCallBlock",
          name: drawCallStart[1].trim(),
          ifDepth: 0,
          loopCount: 0,
          nestedDepth: 0,
          buffer: []
        });
        continue;
      }
      const resourceStart = line.match(/^resource\s+([A-Za-z_]\w*)\s*\{$/);
      if (resourceStart) {
        blockStack.push({
          kind: "resource",
          name: resourceStart[1],
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const programStart = line.match(/^program\s+(.+?)\s*\{$/);
      if (programStart) {
        blockStack.push({
          kind: "programBlock",
          name: programStart[1].trim(),
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const rebindStart = line.match(/^rebind(?:\s+(.+?))?\s*\{$/);
      if (rebindStart) {
        const rebindTarget = (rebindStart[1] || "").trim() || "lastUsedProgram";
        blockStack.push({
          kind: "rebind",
          name: rebindTarget,
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const framebufferStart = line.match(/^framebuffer\s+([A-Za-z_]\w*)\s*\{$/);
      if (framebufferStart) {
        blockStack.push({
          kind: "framebufferBlock",
          name: framebufferStart[1],
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const unbindFBOStart = line.match(/^unbindFBO\s*\{$/);
      if (unbindFBOStart) {
        blockStack.push({
          kind: "unbindFBOBlock",
          name: "unbindFBO",
          ifDepth: 0,
          loopCount: 0,
          buffer: []
        });
        continue;
      }
      const ifMatch = line.match(/^if\s*\(([\s\S]+)\)\s*\{$/);
      if (ifMatch) {
        body.push(`${ind()}if(${_DetailedParser.transpileExpr(ifMatch[1])}){`);
        if (currentBlock) currentBlock.ifDepth++;
        continue;
      }
      const elseIfMatch = line.match(/^else\s+if\s*\(([\s\S]+)\)\s*\{$/);
      if (elseIfMatch) {
        body.push(`${ind()}else if(${_DetailedParser.transpileExpr(elseIfMatch[1])}){`);
        continue;
      }
      const elseMatch = line.match(/^(?:\}\s*)?else\s*\{$/);
      if (elseMatch) {
        if (/^\}/.test(line)) {
          body.push(`${ind()}} else {`);
        } else {
          body.push(`${ind()}else{`);
        }
        continue;
      }
      const whileMatch = line.match(/^while\s*\(([\s\S]+)\)\s*\{$/);
      if (whileMatch) {
        body.push(`${ind()}while(${_DetailedParser.transpileExpr(whileMatch[1])}){`);
        blockStack.push({
          kind: "while",
          name: "while",
          ifDepth: 0,
          loopCount: 0
        });
        indent++;
        continue;
      }
      const uniformsStart = line.match(/^uniforms(?:\s+(.+?))?\s*\{$/);
      if (uniformsStart) {
        const explicitPrograms = !!uniformsStart[1]?.trim();
        const programs = uniformsStart[1] ? uniformsStart[1].split(",").map((s) => s.trim()).filter(Boolean).map((s) => _DetailedParser.transpileExpr(s)) : ["lastUsedProgram"];
        if (explicitPrograms) {
          programs.forEach((p) => body.push(`${ind()}${p}.use?.();`));
        }
        blockStack.push({
          kind: "uniforms",
          name: "uniforms",
          ifDepth: 0,
          loopCount: 0,
          uniformPrograms: programs,
          uniformProgramsExplicit: explicitPrograms
        });
        continue;
      }
      const templateCall = line.match(/^([A-Za-z_]\w*)(?:\s+(.+))?$/);
      if (templateCall) {
        const tpl = _DetailedParser.transpileTemplateBlocks.get(templateCall[1]);
        if (tpl) {
          if (tpl.kind === "uniforms") {
            const programs = templateCall[2] ? templateCall[2].split(",").map((s) => _DetailedParser.transpileExpr(s.trim())).filter(Boolean) : ["lastUsedProgram"];
            const hasExplicitProgram = !!templateCall[2]?.trim();
            for (const p of programs) {
              if (hasExplicitProgram) body.push(`${ind()}${p}.use?.();`);
              for (const uniLine of tpl.lines) {
                const uniLines = _DetailedParser.transpileUniformLine(p, uniLine);
                uniLines.forEach((l) => body.push(`${ind()}${l}`));
              }
            }
          } else if (tpl.kind === "rebind") {
            const target = templateCall[2] ? _DetailedParser.transpileExpr(templateCall[2].trim()) : "lastUsedProgram";
            const rbLines = _DetailedParser.transpileRebindBlock(target, tpl.lines);
            rbLines.forEach((l) => body.push(`${ind()}${l}`));
          } else if (tpl.kind === "framebuffer") {
            const fboName = templateCall[2]?.trim() || `__tplFBO_${Math.random().toString(36).slice(2, 8)}`;
            const fbLines = _DetailedParser.transpileFramebufferBlock(fboName, tpl.lines, declaredVars);
            fbLines.forEach((l) => body.push(`${ind()}${l}`));
          }
          continue;
        }
      }
      const functionCall = line.match(/^([A-Za-z_]\w*)\s*\(([\s\S]*)\)\s*$/);
      if (functionCall) {
        const def = _DetailedParser.transpileFunctionBlocks.get(functionCall[1]);
        if (def) {
          const args = functionCall[2].trim() ? _DetailedParser.splitTopLevelByChar(functionCall[2], ",").map((x) => x.trim()) : [];
          const argMap = /* @__PURE__ */ new Map();
          def.params.forEach((p, idx) => argMap.set(p, args[idx] ?? "undefined"));
          for (const rawFnLine of def.lines) {
            let expanded = rawFnLine;
            for (const [p, a] of argMap.entries()) {
              const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "g");
              expanded = expanded.replace(re, a);
            }
            const emitted = _DetailedParser.transpileSimpleStatement(expanded.trim(), declaredVars);
            emitted.forEach((l) => body.push(`${ind()}${l}`));
          }
          continue;
        }
      }
      const blockHeader = _DetailedParser.parseBlockHeader(line);
      if (blockHeader) {
        const isAsync = blockHeader.isAsync;
        const blockName = blockHeader.name;
        const rawParams = blockHeader.rawParams;
        const blockPriority = blockHeader.priority;
        const isKeyBlock = blockName === "OnKey" || blockName === "OnKeyPress" || blockName === "OnKeyRelease";
        if (isKeyBlock) {
          const keyExpr = rawParams ? _DetailedParser.transpileExpr(rawParams.trim()) : '""';
          if (blockName === "OnKeyRelease") {
            body.push(`${ind()}window.addEventListener("keyup", async (e)=>{ // ${blockName}`);
            indent++;
            body.push(`${ind()}if(((e as any)?.key||"").toLowerCase()===String(${keyExpr}).toLowerCase()){`);
            indent++;
            blockStack.push({
              kind: "keyRelease",
              name: blockName,
              ifDepth: 0,
              loopCount: 0
            });
          } else {
            const method = blockName === "OnKeyPress" ? "OnPress" : "OnKey";
            body.push(`${ind()}KeyManager.${method}(${keyExpr}, async (e)=>{ // ${blockName}`);
            body.push(`${ind()}if((e as any)?.repeat) return;`);
            indent++;
            blockStack.push({
              kind: "key",
              name: blockName,
              ifDepth: 0,
              loopCount: 0
            });
          }
          continue;
        }
        const isSpecial = blockName === "tick" || blockName === "draw";
        const isGlobalBlock = blockStack.length === 0;
        const priority = blockPriority ?? 10;
        if (isGlobalBlock) {
          const fnVarName = `__globalBlockFn_${globalBlockSerial}`;
          const globalOrder = globalBlockSerial;
          globalBlockSerial++;
          body.push(`${ind()}var ${fnVarName} = async (dt)=>{ // ${blockName}`);
          blockStack.push({
            kind: isSpecial ? "special" : "named",
            name: blockName,
            ifDepth: 0,
            loopCount: 0,
            priority,
            isGlobal: true,
            fnVarName,
            globalOrder
          });
        } else {
          body.push(`${ind()}addFunc(async (dt)=>{ // ${blockName}`);
          blockStack.push({
            kind: isSpecial ? "special" : "named",
            name: blockName,
            ifDepth: 0,
            loopCount: 0,
            priority,
            isGlobal: false
          });
        }
        indent++;
        let loopCount = 0;
        if (!isSpecial && rawParams) {
          const parsed = _DetailedParser.parseBlockParams(rawParams) || [];
          body.push(`${ind()}// <block ${blockName}>`);
          for (const p of parsed) {
            if (p.type === "range") {
              declaredVars.add(p.name);
              body.push(
                `${ind()}for (let ${p.name} = ${_DetailedParser.transpileExpr(p.start)}; ${p.name} <= ${_DetailedParser.transpileExpr(p.end)}; ${p.name}++) {`
              );
              indent++;
              loopCount++;
              continue;
            }
            if (p.type === "list") {
              declaredVars.add(p.name);
              body.push(
                `${ind()}for (const ${p.name} of ${_DetailedParser.transpileExpr(p.value)}) {`
              );
              indent++;
              loopCount++;
              continue;
            }
          }
        }
        const lastBlock = blockStack[blockStack.length - 1];
        lastBlock.loopCount = loopCount;
        continue;
      }
      if (line === "}" && currentBlock) {
        if (currentBlock.ifDepth > 0) {
          currentBlock.ifDepth--;
          body.push(`${ind()}}`);
          continue;
        }
        const closing = blockStack.pop();
        if (closing.kind === "key") {
          indent--;
          body.push(`${ind()}});`);
          continue;
        }
        if (closing.kind === "keyRelease") {
          indent--;
          body.push(`${ind()}}`);
          indent--;
          body.push(`${ind()});`);
          continue;
        }
        if (closing.kind === "while") {
          indent--;
          body.push(`${ind()}}`);
          continue;
        }
        if (closing.kind === "special" || closing.kind === "named") {
          for (let j = 0; j < closing.loopCount; j++) {
            indent--;
            body.push(`${ind()}}`);
          }
          if (closing.kind === "named") {
            body.push(`${ind()}// </block ${closing.name}>`);
          }
          indent--;
          if (closing.isGlobal) {
            body.push(`${ind()}};`);
            body.push(`${ind()}__globalBlocks.push({ priority: ${closing.priority ?? 10}, order: ${closing.globalOrder ?? 0}, fn: ${closing.fnVarName} });`);
          } else {
            body.push(`${ind()}});`);
          }
          continue;
        }
      }
      const transpiled = _DetailedParser.transpileSimpleStatement(line, declaredVars);
      transpiled.forEach((l) => body.push(`${ind()}${l}`));
    }
    if (!scaffoldInserted) {
      insertScaffold();
    }
    for (const [name, kept] of preserved.entries()) {
      if (usedMarkers.has(name)) continue;
      body.push(`${ind()}//<${name}>`);
      kept.forEach((k) => body.push(k));
      body.push(`${ind()}//</${name}>`);
    }
    const fileLines = [
      "// @ts-nocheck",
      ""
    ];
    if (imports.length) {
      fileLines.push(...imports, "");
    }
    fileLines.push(...body);
    fileLines.push("");
    const result = fileLines.join("\n");
    await _DetailedParser.writeFileSafe(outPath, result);
    return result;
  }
  /**
   * Método principal para parsear y ejecutar la configuración del script.
   */
  static async parse(str, gl, thiscontext, outPath, mainImportsPath, backupScopeHint) {
    if (outPath) {
      return await _DetailedParser.transpileToFile(str, outPath, mainImportsPath, backupScopeHint);
    }
    str = await _DetailedParser.resolveParseTextImports(str);
    _DetailedParser.gctx.gl = gl;
    _DetailedParser.context = {
      vars: /* @__PURE__ */ new Map(),
      lookUpNames: [],
      blockName: [],
      isBlockAsync: false,
      blockParams: [],
      lastUsedProgram: null,
      thiscontext
    };
    let processedStr = str.replaceAll("	", "    ");
    let lines = processedStr.split("\n").map((l) => _DetailedParser.stripInlineComment(l).replace(/\r/g, ""));
    const extractedShaderFilters = _DetailedParser.extractShaderFilterLines(lines);
    _DetailedParser.loadShaderFiltersFromLines(extractedShaderFilters.filterLines);
    lines = extractedShaderFilters.lines;
    lines = _DetailedParser.joinIndentedLines(lines);
    let inEvalBlock = false;
    let evalBlockContent = "";
    let tickActions = [];
    let blockRawParamsStack = [];
    let ifStack = [];
    const currentIfConditions = () => ifStack.map(
      (f) => f.negate ? `!(${f.condition})` : `(${f.condition})`
    );
    let inUniforms = false;
    let uniformsPrograms = [];
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;
      const currentBlock = _DetailedParser.ctx.blockName.at(-1);
      if (line.startsWith("<<")) {
        inEvalBlock = true;
        evalBlockContent = "";
        continue;
      }
      if (line.endsWith(">>") && inEvalBlock) {
        inEvalBlock = false;
        const content = evalBlockContent.trim();
        _DetailedParser.executeEvalBlock(content);
        continue;
      }
      if (inEvalBlock) {
        evalBlockContent += rawLine + "\n";
        continue;
      }
      const uniMatch = line.match(/^uniforms(?:\s+(.+?))?\s*\{$/);
      if (uniMatch) {
        inUniforms = true;
        const programNames = uniMatch[1] ? uniMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
        uniformsPrograms = programNames.length ? programNames.map((n) => _DetailedParser.ctx.vars.get(n)).filter(Boolean) : [_DetailedParser.ctx.lastUsedProgram];
        continue;
      }
      if (line === "}" && inUniforms) {
        inUniforms = false;
        uniformsPrograms = [];
        continue;
      }
      if (inUniforms) {
        const vectorMatch = line.match(/^(\w+)\s*=\s*(.+?)(?:(i|u|f)?v([2-4]))\s*$/);
        const scalarMatch = line.match(/^(\w+)\s*=\s*(.+?)([iuf]?)$/);
        if (!vectorMatch && !scalarMatch) continue;
        let name = "";
        let value = void 0;
        let suffix = "f";
        let vectorDim = 0;
        if (vectorMatch) {
          name = vectorMatch[1];
          value = _DetailedParser.parseValue(vectorMatch[2]);
          suffix = vectorMatch[3] || "f";
          vectorDim = Number.parseInt(vectorMatch[4], 10);
          const arr = Array.isArray(value) ? [...value] : [value];
          if (arr.length === 1) {
            value = Array(Math.max(2, Math.min(4, vectorDim))).fill(arr[0]);
          } else {
            value = Array.from({ length: Math.max(2, Math.min(4, vectorDim)) }, (_, i2) => i2 < arr.length ? arr[i2] : 0);
          }
        } else {
          [, name, rawValue, suffix] = scalarMatch;
          value = _DetailedParser.parseValue(rawValue);
          suffix ||= "f";
        }
        for (const uniformsProgram of uniformsPrograms) {
          if (!uniformsProgram) continue;
          uniformsProgram.use?.();
          if (Array.isArray(value)) {
            uniformsProgram.uVec(name, vectorDim || value.length, suffix === "f", suffix === "u").set(value);
          } else {
            uniformsProgram.uNum(
              name,
              suffix === "f",
              suffix === "u"
            ).set(value);
          }
        }
        continue;
      }
      const ifMatch = line.match(/^if\s*\((.+)\)\s*\{$/);
      if (ifMatch) {
        ifStack.push({ condition: ifMatch[1] });
        continue;
      }
      const elseIfMatch = line.match(/^else\s+if\s*\((.+)\)\s*\{$/);
      if (elseIfMatch) {
        ifStack.pop();
        ifStack.push({ condition: elseIfMatch[1] });
        continue;
      }
      const elseMatch = line.match(/^(?:\}\s*)?else\s*\{$/);
      if (elseMatch) {
        const last = ifStack.pop();
        if (last) {
          ifStack.push({ condition: last.condition, negate: true });
        }
        continue;
      }
      const blockHeader = _DetailedParser.parseBlockHeader(line);
      if (blockHeader) {
        const isAsync = blockHeader.isAsync;
        const blockName = blockHeader.name;
        const rawParams = blockHeader.rawParams;
        _DetailedParser.ctx.blockName.push(blockName);
        blockRawParamsStack.push(rawParams);
        _DetailedParser.ctx.isBlockAsync = isAsync;
        if (blockName === "OnKey" || blockName === "OnKeyPress" || blockName === "OnKeyRelease") {
          _DetailedParser.ctx.blockParams = null;
        } else {
          _DetailedParser.ctx.blockParams = _DetailedParser.parseBlockParams(rawParams);
        }
        ifStack = [];
        tickActions = [];
        continue;
      }
      if (line === "}" && currentBlock) {
        if (ifStack.length > 0) {
          ifStack.pop();
          continue;
        }
        const closed = _DetailedParser.ctx.blockName.pop();
        const closedRawParams = blockRawParamsStack.pop();
        if (closed === "tick" || closed === "draw") {
          const captured = [...tickActions];
          let time = 0;
          const executeActions = async (dt) => {
            if (closed === "tick") {
              time += dt;
              _DetailedParser.ctx.vars.set("u_time", time);
            }
            _DetailedParser.ctx.vars.set("dt", dt);
            if (_DetailedParser.ctx.isBlockAsync) {
              for (const a of captured) await a();
            } else {
              for (const a of captured) a();
            }
          };
          _DetailedParser.gctx.addFunc(async (dt) => {
            await executeActions(dt);
          });
        }
        if (closed === "OnKey" || closed === "OnKeyPress" || closed === "OnKeyRelease") {
          const actions = [...tickActions];
          const key = closedRawParams ? _DetailedParser.parseValue(closedRawParams.trim()) : "";
          const runActions = async () => {
            if (_DetailedParser.ctx.isBlockAsync) {
              for (const a of actions) await a();
            } else {
              actions.forEach((a) => a());
            }
          };
          if (closed === "OnKeyRelease") {
            window?.addEventListener?.("keyup", (e) => {
              if (((e?.key || "") + "").toLowerCase() === ((key || "") + "").toLowerCase()) {
                void runActions();
              }
            });
          } else if (closed === "OnKeyPress") {
            _DetailedParser.gctx.KeyManager?.OnPress?.(key, (e) => {
              if (e?.repeat) return;
              void runActions();
            });
          } else {
            _DetailedParser.gctx.KeyManager?.OnKey?.(key, (e) => {
              if (e?.repeat) return;
              void runActions();
            });
          }
          _DetailedParser.ctx.isBlockAsync = false;
          _DetailedParser.ctx.blockParams = null;
          continue;
        }
        if (closed !== "tick" && closed !== "draw") {
          const actions = [...tickActions];
          const params = _DetailedParser.ctx.blockParams;
          _DetailedParser.gctx.addFunc(async (dt) => {
            if (!params) {
              if (_DetailedParser.ctx.isBlockAsync) {
                for (const a of actions) await a();
              } else {
                actions.forEach((a) => a());
              }
              return;
            }
            const recurse = async (idx) => {
              if (idx === params.length) {
                if (_DetailedParser.ctx.isBlockAsync) {
                  for (const a of actions) await a();
                } else {
                  actions.forEach((a) => a());
                }
                return;
              }
              const p = params[idx];
              if (p.type === "range") {
                const start2 = _DetailedParser.parseValue(p.start);
                const end = _DetailedParser.parseValue(p.end);
                for (let v = start2; v <= end; v++) {
                  _DetailedParser.ctx.vars.set(p.name, v);
                  _DetailedParser.ctx.isBlockAsync ? await recurse(idx + 1) : recurse(idx + 1);
                }
              }
              if (p.type === "list") {
                const list = _DetailedParser.parseValue(p.value);
                if (!Array.isArray(list)) return;
                for (const v of list) {
                  _DetailedParser.ctx.vars.set(p.name, v);
                  _DetailedParser.ctx.isBlockAsync ? await recurse(idx + 1) : recurse(idx + 1);
                }
              }
            };
            await recurse(0);
          });
          _DetailedParser.ctx.isBlockAsync = false;
          _DetailedParser.ctx.blockParams = null;
        }
        continue;
      }
      if (currentBlock) {
        const action = await _DetailedParser.compileJsBlock(
          rawLine.trimStart(),
          currentIfConditions()
        );
        if (action) tickActions.push(action);
        continue;
      }
      if (await _DetailedParser.parseObjectDef(line)) continue;
      if (_DetailedParser.parseFncCall(line)) continue;
    }
  }
  static prepareAction(line) {
    if (line.includes(".") && /^([a-z_]\w*)\./.test(line)) {
      return _DetailedParser.prepareChainAction(line);
    }
    const simpleMatch = line.match(/^([a-z_]\w*)\s+(.*)$/);
    if (simpleMatch) {
      const cmdName = simpleMatch[1];
      const paramsString = simpleMatch[2];
      const reg = _DetailedParser.ObjectRegistry[cmdName] || _DetailedParser.FunctionRegistry[cmdName];
      if (reg) {
        return async () => {
          const params = /* @__PURE__ */ new Map();
          const tokenRegex = /"([^"]*)"|'([^']*)'|([^\s'"]+)/g;
          let tokenMatch;
          let index = 0;
          let matchIndex = 0;
          while ((tokenMatch = tokenRegex.exec(paramsString)) !== null) {
            const token = tokenMatch[1] ?? tokenMatch[2] ?? tokenMatch[3];
            const raw = tokenMatch[0];
            const paramMatch = raw.match(/^([a-zA-Z_]\w*)=([\s\S]+)$/);
            if (paramMatch) {
              const key = paramMatch[1];
              const valRaw = paramMatch[2].replace(/^["']|["']$/g, "");
              const val = _DetailedParser.parseValue(valRaw);
              params.set(key, val);
              params.set("match" + matchIndex++, key);
            } else {
              const val = _DetailedParser.parseValue(token);
              params.set(index++, val);
            }
          }
          await reg(params, _DetailedParser.gctx.gl);
        };
      }
    }
    return null;
  }
  static createSimpleAction(cmd, args) {
    return async () => {
      const params = /* @__PURE__ */ new Map();
      args.forEach((arg, idx) => params.set(idx, _DetailedParser.parseValue(arg)));
      if (_DetailedParser.ObjectRegistry[cmd]) {
        await _DetailedParser.ObjectRegistry[cmd](params, _DetailedParser.gctx.gl);
      } else if (_DetailedParser.FunctionRegistry[cmd]) {
        await _DetailedParser.FunctionRegistry[cmd](params, _DetailedParser.gctx.gl);
      }
    };
  }
  static createCallAction(line) {
    const frozenLine = line;
    return async () => {
      _DetailedParser.parseFncCall(frozenLine);
    };
  }
  static async chooseActionForLine(code) {
    const line = code.trim().replace(/;$/, "");
    if (await _DetailedParser.parseObjectDef(line)) {
      return null;
    }
    const firstWordMatch = line.match(/^([a-zA-Z_]\w*)/);
    const firstWord = firstWordMatch?.[1];
    if (firstWord && // !line.includes("(") &&
    (_DetailedParser.ObjectRegistry[firstWord] || _DetailedParser.FunctionRegistry[firstWord])) {
      return _DetailedParser.prepareAction(line);
    }
    if (/^[a-zA-Z_]\w*\./.test(line)) {
      const chain = _DetailedParser.prepareChainAction(line);
      if (chain) return chain;
    }
    return _DetailedParser.createCallAction(line);
  }
  static async compileJsBlock(code, ifConditions = []) {
    const action = await _DetailedParser.chooseActionForLine(code);
    const conditionFn = new Function(
      "gctx",
      "vars",
      "thiscontext",
      `
            with(thiscontext) {
                with(gctx){
                    with(vars) {
                        return ${ifConditions.length ? ifConditions.map((c) => `(${c})`).join("&&") : "true"};
                    }
                }
            }
            `
    );
    return async () => {
      let ok = false;
      try {
        ok = conditionFn(
          _DetailedParser.gctx,
          Object.fromEntries(_DetailedParser.ctx.vars),
          _DetailedParser.ctx.thiscontext || {}
        );
      } catch (e) {
        console.error("[CompileJS] condici\xF3n inv\xE1lida", ifConditions, e);
        return;
      }
      if (!ok) return;
      if (action) await action();
    };
  }
  static executeEvalBlock(code) {
    const scope = {
      ..._DetailedParser.ctx.thiscontext,
      ..._DetailedParser.gctx,
      ...Object.fromEntries(_DetailedParser.ctx.vars),
      Math
    };
    try {
      new Function(
        "gctx",
        "scope",
        "thiscontext",
        `with(gctx){ with(scope){ with(thiscontext){ ${code} } } }`
      )(
        _DetailedParser.gctx,
        scope,
        _DetailedParser.ctx.thiscontext || {}
      );
    } catch (e) {
      console.error("Error en eval inmediato:", e);
    }
  }
  static get ctx() {
    return _DetailedParser.context;
  }
  static get gctx() {
    return _DetailedParser.GlobalContext;
  }
  /**
  * Función auxiliar para parsear valores (vec3(), {W}, [], "string", 1024x1024)
  * Convierte la representación en cadena del DSL a un valor de JavaScript real.
  */
  static parseValue(valueString) {
    valueString = (valueString + "").trimStart();
    if (valueString.startsWith("[") && valueString.endsWith("]")) {
      valueString = "{" + valueString + "}";
    }
    const parts = [];
    let current = "";
    let depthBraces = 0;
    for (let i = 0; i < valueString.length; i++) {
      const ch = valueString[i];
      const prev = valueString[i - 1];
      if (ch === "{") depthBraces++;
      if (ch === "}") depthBraces--;
      const isSplitX = ch === "x" && depthBraces === 0 && (/[0-9]/.test(prev) || prev === "}");
      if (isSplitX) {
        parts.push(current.trim());
        current = "";
        continue;
      }
      current += ch;
    }
    if (current.trim() !== "") {
      parts.push(current.trim());
    }
    if (parts.length >= 2) {
      const allValid = parts.every(
        (p) => !isNaN(Number(p)) || p.startsWith("{") && p.endsWith("}")
      );
      if (allValid) {
        const res = parts.map((p) => _DetailedParser.parseValue(p));
        return res;
      }
    }
    if (valueString.startsWith("{") && valueString.endsWith("}")) {
      const expression = valueString.slice(1, -1);
      try {
        let scope = {
          ..._DetailedParser.ctx.thiscontext,
          ..._DetailedParser.gctx,
          ...Object.fromEntries(_DetailedParser.ctx.vars),
          Math
        };
        const fn = new Function(
          "scope",
          `
                    with(scope) {
                        return ${expression};
                    }
                `
        );
        const res = fn(scope);
        return res;
      } catch (e) {
        return void 0;
      }
    }
    if (valueString.startsWith("vec3(") && valueString.endsWith(")")) {
      const inner = valueString.slice(5, -1).trim();
      const components = inner.split(",").map((c) => c.trim()).filter(Boolean).map((c) => _DetailedParser.parseValue(c));
      let x, y, z;
      if (components.length === 1) {
        x = y = z = Number(components[0]);
      } else if (components.length === 2) {
        x = Number(components[0]);
        y = z = Number(components[1]);
      } else {
        x = Number(components[0]);
        y = Number(components[1]);
        z = Number(components[2]);
      }
      const v = new _DetailedParser.gctx.Vector3D(x, y, z);
      return v;
    }
    if (valueString.startsWith('"') && valueString.endsWith('"')) {
      return valueString.slice(1, -1);
    }
    if (!isNaN(Number(valueString)) && valueString !== "") {
      return Number(valueString);
    }
    if (valueString === "true") return true;
    if (valueString === "false") return false;
    return valueString;
  }
  /**
   * Parsea líneas de definición de objetos o variables:
   * MeshProgram input=TexUnit20 1024x1024
   * a=createIdealMesh ...
   */
  static async parseObjectDef(line) {
    const IDENT = /^[a-zA-Z_]\w*$/;
    let isEscapedFunction = false;
    const extractAliasesAndCore = (rawLine) => {
      let aliases2 = [];
      let core2 = rawLine.trim();
      const leftMatch = core2.match(
        /^\s*([a-zA-Z_]\w*(?:\s*\|=\s*[a-zA-Z_]\w*)*)\s*=/
      );
      if (leftMatch) {
        const leftAliases = leftMatch[1].split(/\|=/).map((s) => s.trim());
        aliases2.push(...leftAliases);
        core2 = core2.slice(leftMatch[0].length).trim();
      }
      const rightMatch = core2.match(/\|=\s*([^=]+)$/);
      if (rightMatch) {
        const rightAliases = rightMatch[1].split(",").map((s) => s.trim());
        aliases2.push(...rightAliases);
        core2 = core2.slice(0, rightMatch.index).trim();
      }
      aliases2 = [...new Set(aliases2)];
      return { aliases: aliases2, core: core2 };
    };
    const { aliases, core } = extractAliasesAndCore(line);
    if (!core) {
      return false;
    }
    let destructuredVars = null;
    const destructMatch = core.match(/^\[\s*([^\]]+)\s*\]\s*=/);
    let workingCore = core;
    if (destructMatch) {
      destructuredVars = destructMatch[1].split(",").map((v) => v.trim()).filter((v) => IDENT.test(v));
      workingCore = core.slice(destructMatch[0].length).trim();
    }
    const trimmed = workingCore.trim();
    if (!trimmed) {
      return false;
    }
    let identifier = "";
    let paramsString = "";
    let hasEqualsSign = false;
    if (trimmed.startsWith("$")) {
      const secondDollar = trimmed.indexOf("$", 1);
      isEscapedFunction = true;
      if (secondDollar > 1 && trimmed[secondDollar + 1] === "(") {
        identifier = trimmed.slice(1, secondDollar);
        paramsString = trimmed.slice(secondDollar + 1).trim();
      } else {
        return false;
      }
    } else {
      let i = 0;
      while (i < trimmed.length && trimmed[i] !== " " && trimmed[i] !== "=") {
        i++;
      }
      identifier = trimmed.slice(0, i);
      let rest = trimmed.slice(i).trim();
      if (rest.startsWith("=")) {
        hasEqualsSign = true;
        rest = rest.slice(1).trim();
      }
      paramsString = rest;
    }
    if (isEscapedFunction) {
      const funcName = identifier;
      const globalFunc = _DetailedParser.gctx[funcName] || _DetailedParser.ctx.thiscontext[funcName];
      if (typeof globalFunc !== "function") {
        return false;
      }
      let argsRaw = paramsString.trim();
      if (argsRaw.startsWith("(") && argsRaw.endsWith(")")) {
        argsRaw = argsRaw.slice(1, -1).trim();
      }
      const rawArgs = argsRaw.length === 0 ? [] : argsRaw.split(/,(?![^{]*})(?![^(]*\))/);
      const args = rawArgs.map((arg) => {
        const cleaned = arg.trim();
        return this.parseValue(cleaned);
      });
      const result2 = await globalFunc(...args);
      if (destructuredVars && Array.isArray(result2)) {
        destructuredVars.forEach((v, i) => {
          this.ctx.vars.set(v, result2[i]);
        });
      } else {
        for (const name of aliases) {
          this.ctx.vars.set(name, result2);
        }
      }
      return true;
    }
    let classNameOrFunc = identifier;
    const params = /* @__PURE__ */ new Map();
    let funcsToCallInObj = [];
    if (hasEqualsSign) {
      const funcNameMatch = paramsString.match(/^([A-Z_a-z]\w*)/);
      if (funcNameMatch) {
        classNameOrFunc = funcNameMatch[1];
        paramsString = paramsString.slice(classNameOrFunc.length).trim();
      }
    }
    params.set("aliases", aliases);
    params.set("firstAlias", aliases[0]);
    const tokenRegex = /"([^"]*)"|'([^']*)'|([^\s'"]+)/g;
    let tokenMatch;
    let index = 0;
    let matchindex = 0;
    while ((tokenMatch = tokenRegex.exec(paramsString)) !== null) {
      const token = tokenMatch[1] ?? tokenMatch[2] ?? tokenMatch[3];
      const raw = tokenMatch[0];
      if (raw.startsWith(".")) {
        funcsToCallInObj.push(raw);
        continue;
      }
      const paramMatch = raw.match(/^([a-zA-Z_]\w*)=(.+)$/);
      if (paramMatch) {
        const val = this.parseValue(
          paramMatch[2].replace(/^["']|["']$/g, "")
        );
        params.set(paramMatch[1], val);
        params.set("match" + matchindex++, paramMatch[1]);
      } else {
        const val = this.parseValue(token);
        params.set(index++, val);
      }
    }
    const objReg = _DetailedParser.ObjectRegistry[classNameOrFunc];
    const objFunc = _DetailedParser.FunctionRegistry[classNameOrFunc];
    if (!objReg && !objFunc) {
      return false;
    }
    let result = await (objReg ? objReg(params, _DetailedParser.gctx.gl) : objFunc(params, _DetailedParser.gctx.gl));
    const isClassInstanciation = /^[A-Z]/.test(identifier);
    let varName;
    if (hasEqualsSign) {
      varName = identifier;
      const funcNameMatch = paramsString.match(/^([A-Z_a-z]\w*)/);
      if (funcNameMatch) {
        classNameOrFunc = funcNameMatch[1];
        paramsString = paramsString.substring(classNameOrFunc.length).trim();
        params.set("altName", varName);
      }
    } else if (isClassInstanciation) {
      varName = identifier.charAt(0).toLowerCase() + identifier.slice(1);
      if (this.ctx.vars.has(varName)) {
        let counter = 1;
        while (this.ctx.vars.has(varName + counter)) {
          counter++;
        }
        varName = varName + counter;
      }
    }
    aliases.push(varName);
    for (const call of funcsToCallInObj) {
      const m = call.match(/^\.(\w+)\((.*)\)$/);
      if (m && typeof result?.[m[1]] === "function") {
        const args = m[2].split(/,(?![^{]*})/).map((a) => this.parseValue(a.trim()));
        result[m[1]](...args);
      }
    }
    if (destructuredVars && Array.isArray(result)) {
      destructuredVars.forEach((v, i) => {
        this.ctx.vars.set(v, result[i]);
      });
    } else {
      for (const name of aliases) {
        if (name === void 0) return;
        this.ctx.vars.set(name, result);
      }
    }
    return true;
  }
  static async executeChain(baseObj, chainParts) {
    let currentObj = baseObj;
    for (let part of chainParts) {
      if (currentObj == null) return void 0;
      part = part.trim();
      const callMatch = part.match(/^(\w+)\s*\(([\s\S]*)\)$/);
      if (callMatch) {
        const [, name, argsRaw] = callMatch;
        const target = currentObj[name];
        if (typeof target !== "function") {
          console.error(`[Chain] ${name} no es funci\xF3n`, currentObj);
          return void 0;
        }
        const args = [];
        if (argsRaw.trim()) {
          let currentArg = "";
          let depth = 0;
          for (let i = 0; i < argsRaw.length; i++) {
            const char = argsRaw[i];
            if (char === "(" || char === "[" || char === "{") depth++;
            if (char === ")" || char === "]" || char === "}") depth--;
            if (char === "," && depth === 0) {
              args.push(_DetailedParser.parseValue(currentArg.trim()));
              currentArg = "";
            } else {
              currentArg += char;
            }
          }
          if (currentArg.trim()) {
            args.push(_DetailedParser.parseValue(currentArg.trim()));
          }
        }
        const result = target.apply(currentObj, args);
        currentObj = result && typeof result.then === "function" ? await result : result;
      } else {
        if (!(part in currentObj)) {
          return void 0;
        }
        currentObj = currentObj[part];
      }
    }
    return currentObj;
  }
  static splitChain(methodsString) {
    return methodsString.split(/\.(?![^\[\(\{]*[\]\)\}])/).map((p) => p.trim()).filter(Boolean);
  }
  /**
   * Parsea llamadas a funciones o métodos encadenados:
   * meshProgram.initUniforms().setPerXPerY(1,0)
   */
  static parseFncCall(line) {
    const cleanLine = line.trim().replace(/;$/, "").replace("\n", "");
    const callRegex = /^([a-z_]\w*)(?:\.[a-zA-Z_]\w*(?:\s*\([\s\S]*?\))?)+$/i;
    const match = cleanLine.match(callRegex);
    if (!match) return false;
    const objectName = match[1];
    const baseObj = this.getVar(objectName);
    if (!baseObj) return false;
    const chainString = cleanLine.slice(objectName.length + 1);
    const chainParts = this.splitChain(chainString);
    void this.executeChain(baseObj, chainParts);
    return true;
  }
  static prepareChainAction(line) {
    const cleanLine = line.trim().replace(/;$/, "");
    const match = cleanLine.match(/^([a-z_]\w*)\.(.+)$/);
    if (!match) return null;
    const [, objectName, chainString] = match;
    const chainParts = this.splitChain(chainString);
    return async () => {
      const baseObj = _DetailedParser.getVar(objectName) ?? _DetailedParser.gctx[objectName] ?? _DetailedParser.ctx.thiscontext[objectName];
      if (!baseObj) {
        console.warn(`[Chain] Objeto base no encontrado: ${objectName}`);
        return;
      }
      await _DetailedParser.executeChain(baseObj, chainParts);
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DetailedParser
});
