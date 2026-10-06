// ../dist/lib/Code/opengl/opengl.js
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
function loadShaderSource(url) {
  return __awaiter(this, void 0, void 0, function* () {
    const response = yield fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader file: ${url}`);
    }
    return response.text();
  });
}
function __mountGlobalBlocks(globalBlocks, addFunc2) {
  if (!(globalBlocks === null || globalBlocks === void 0 ? void 0 : globalBlocks.length))
    return;
  globalBlocks.sort((a, b) => a.priority - b.priority || a.order - b.order);
  let running = false;
  addFunc2((dt) => __awaiter(this, void 0, void 0, function* () {
    if (running)
      return;
    running = true;
    try {
      for (const item of globalBlocks) {
        yield item.fn(dt);
      }
    } finally {
      running = false;
    }
  }));
}
function loadShaders(gl, vertexPath, fragmentPath, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
  return __awaiter(this, void 0, void 0, function* () {
    const [vertexSource, fragmentSource] = yield Promise.all([
      loadShaderSource(vertexPath),
      loadShaderSource(fragmentPath)
    ]);
    return loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter, fragmentFilter);
  });
}
function loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
  return __awaiter(this, void 0, void 0, function* () {
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

// ../dist/lib/Code/Matrix/Matrix.mjs
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

// ../dist/lib/Code/Game/Game.js
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
    return __awaiter2(this, void 0, void 0, function* () {
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
    return __awaiter2(this, void 0, void 0, function* () {
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
var pendantAudio = [];
function usePendantAudio() {
  if (pendantAudio.length == 0)
    return;
  if (!pendantAudio[pendantAudio.length - 1][0].paused && pendantAudio[pendantAudio.length - 1][1]) {
    console.log(pendantAudio[pendantAudio.length - 1][0].cloneNode(false));
    pendantAudio[pendantAudio.length - 1][0].cloneNode(false).play();
  } else
    pendantAudio[pendantAudio.length - 1][0].play();
  pendantAudio.pop();
}
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
var clicklisteners = [];
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
function addCanvasListeners(ccanvas) {
  ccanvas.addEventListener("mousemove", (e) => mousemove(e, true, ccanvas.id));
  ccanvas.addEventListener("touchmove", (e) => mousemove(e, true, ccanvas.id));
  ccanvas.addEventListener("mousedown", (e) => mousedown(e, true, ccanvas.id));
  ccanvas.addEventListener("touchstart", (e) => mousedown(e, true, ccanvas.id));
  ccanvas.addEventListener("mouseup", (e) => mouseup(e, true, ccanvas.id));
  ccanvas.addEventListener("mouseleave", (e) => mouseup(e, true, ccanvas.id));
  ccanvas.addEventListener("touchend", (e) => mouseup(e, true, ccanvas.id));
  ccanvas.addEventListener("touchcancel", (e) => mouseup(e, true, ccanvas.id));
}
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
var mousedown = (e, ic, id) => {
  var _a2, _b2, _d, _e, _f, _g, _h, _j, _k;
  mouseclick[e.button] = true;
  if (!ic)
    return;
  usePendantAudio();
  var pos = (_d = (_b2 = (_a2 = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a2 === void 0 ? void 0 : _a2.getBoundingClientRect) === null || _b2 === void 0 ? void 0 : _b2.call(_a2)) !== null && _d !== void 0 ? _d : { left: 0, top: 0 };
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
  const x1 = mousepos.x, y1 = mousepos.y;
  for (let i = 0; i < clicklisteners.length; i++) {
    const lis = clicklisteners[i];
    lis.lis.apply(lis.who, [...lis.pars, x1, y1, true, e.button || 0, ic, id, x2m, y2m]);
  }
};
var mouseup = (e, ic, id) => {
  var _a2, _b2, _d, _e, _f, _g, _h, _j, _k;
  mouseclick[e.button] = false;
  if (!ic)
    return;
  const pos = (_d = (_b2 = (_a2 = e === null || e === void 0 ? void 0 : e.currentTarget) === null || _a2 === void 0 ? void 0 : _a2.getBoundingClientRect) === null || _b2 === void 0 ? void 0 : _b2.call(_a2)) !== null && _d !== void 0 ? _d : { left: 0, top: 0 };
  let x, y;
  let x2m, y2m;
  if (e.touches || e.changedTouches) {
    if (e.changedTouches.length > 0) {
      for (const touch of e.changedTouches) {
        mouseclick[touch.identifier] = false;
      }
    }
    if (e.touches.length > 0) {
      x = (_e = e.touches[0].clientX - pos.left) !== null && _e !== void 0 ? _e : e.touches[0].screenX;
      y = (_f = e.touches[0].clientY - pos.top) !== null && _f !== void 0 ? _f : e.touches[0].screenY;
      for (let i = 0; i < e.touches.length; i++) {
        y2m = (_g = e.touches[i].clientX - pos.left) !== null && _g !== void 0 ? _g : e.touches[i].screenX;
        x2m = (_h = e.touches[i].clientY - pos.top) !== null && _h !== void 0 ? _h : e.touches[i].screenY;
        if (!mouseposes[e.touches[i].identifier]) {
          mouseposes[e.touches[i].identifier] = { x: 0, y: 0, lastid: "" };
        }
        mouseposes[e.touches[i].identifier].x = x2m;
        mouseposes[e.touches[i].identifier].y = y2m;
        calculatemousepos(x2m, y2m, id, mouseposes[e.touches[i].identifier]);
      }
    } else {
      for (let i = 1; i < mouseposes.length; i++) {
        mouseclick[i] = false;
      }
    }
  } else {
    x = (_j = e.clientX - pos.left) !== null && _j !== void 0 ? _j : e.offsetX;
    y = (_k = e.clientY - pos.top) !== null && _k !== void 0 ? _k : e.offsetY;
  }
  calculatemousepos(x, y, id);
  const x1 = mousepos.x, y1 = mousepos.y;
  for (let i = 0; i < clicklisteners.length; i++) {
    const lis = clicklisteners[i];
    lis.lis.apply(lis.who, [...lis.pars, x1, y1, false, e.button || 0, ic, id, x2m, y2m]);
  }
};
var MouseManager = class {
  static EnableCanvas(canvas) {
    addCanvasListeners(canvas);
  }
  static createDoubleClickListenerGameObject(cid) {
    let dbclickList = new GameObject();
    dbclickList.listeners = [];
    dbclickList.add = (lis) => {
      if (typeof lis == "function") {
        dbclickList.listeners.push(lis);
      }
    };
    dbclickList.time = 0;
    dbclickList.wasLast = false;
    dbclickList.onClick = (x1, y1, is, button, ic, id, x2m, y2m) => {
      if (cid && cid !== id)
        return;
      if (button !== 0)
        return;
      if (is) {
        if (!dbclickList.wasLast) {
          if (x1 > W - 100 && y1 > H - 100) {
            dbclickList.time = 0;
            dbclickList.wasLast = true;
          }
        } else if (dbclickList.time > 0.05) {
          dbclickList.wasLast = false;
          dbclickList.listeners.forEach((lis) => {
            lis && lis(dbclickList.time);
          });
          dbclickList.time = 0;
        }
      }
    };
    dbclickList.tick = (dt) => {
      if (dbclickList.time === void 0 || !dbclickList.wasLast)
        return;
      dbclickList.time += dt;
      if (dbclickList.time > 0.4) {
        dbclickList.wasLast = false;
        dbclickList.time = 0;
        dbclickList.wasLastRelease = false;
      }
    };
    return dbclickList;
  }
};
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

// ../dist/lib/Code/Matrix/Matrix.js
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

// ../dist/lib/Code/Start/start.js
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
var addFunc = (fun) => {
  funs.push(fun);
};

// ../dist/lib/Code/Utils/utils.js
function HSLtoRGB(h, s, l, trs = 1) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `rgba(${255 * f(0)},${255 * f(8)},${255 * f(4)},${trs})`;
}

// ../dist/lib/Code/WebGL/webglMan.js
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
    return __awaiter3(this, void 0, void 0, function* () {
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

// ../dist/lib/Code/WebGL/parser/registryModules/capsules.js
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var MeshRenderingProgram = class extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, dx = 0.015, dy = 0.015) {
    super(gl, "", "");
    __publicField(this, "valsTexUnit", valsTexUnit);
    __publicField(this, "w", w);
    __publicField(this, "h", h);
    __publicField(this, "dx", dx);
    __publicField(this, "dy", dy);
    __publicField(this, "totalSegments");
    __publicField(this, "smoothColorEnabled", true);
    __publicField(this, "repeatEnabled", false);
    __publicField(this, "repeatTexture", null);
    __publicField(this, "repeatTextureState", null);
  }
  async loadProgram(vs, fs) {
    [this.program, this.vert, this.frag] = await loadShadersFromString(
      this.gl,
      //? vertex shader
      `#version 300 es
            precision highp float;

            uniform sampler2D values;
            uniform int msdLength;   
            uniform int msdCount;    
            uniform float dx;
            uniform float dy;
            uniform float xPer;
            uniform float yPer;
            uniform float yScale;
            uniform bool repeatMesh;
            uniform vec3 offPos;
            ${this.vertexExtraUniforms()}

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;

            out vec3 outPos;
            flat out vec3 outFlatPos;

            vec4 getPoint(int x, int yTexel) {
                // Ahora la textura tiene un \xFAnico canal (RED)
                float val = repeatMesh
                    ? texture(values, (vec2(float(x), float(yTexel)) + 0.5) / vec2(textureSize(values, 0))).r
                    : texelFetch(values, ivec2(x, yTexel), 0).r;

                float px = dx * float(x) - dx * float(msdLength) * (1.0 - xPer);
                float py = val * yScale;
                float pz = dy * float(yTexel) - dy * float(msdCount) * (1.0 - yPer);

                return vec4(px, py, -pz, 1.0) + vec4(offPos, 0.0);
            }

            void main() {
                ${this.vertexPositionCode()}

                outPos = pos.xyz;
                outFlatPos = pos.xyz;
                gl_Position = u_projectionMatrix * (u_viewMatrix * pos);
            }`,
      //? fragment shader
      `#version 300 es
            precision highp float;

            in vec3 outPos;
            flat in vec3 outFlatPos;
            out vec4 outColor;
            uniform float colorHueScale;
            uniform bool smoothColor;

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
                h = (smoothColor ? outPos.y : outFlatPos.y) * colorHueScale / 1.5;
                h = (mod(-h,1.5) * 0.5) + 0.5;        // lo llevamos a 0..1

                float s = 0.6;
                float l = 0.5;

                vec3 rgb = hsl2rgb(h, s, l);

                outColor = vec4(rgb, 1.0);
            }
            `
    );
    return this;
  }
  vertexPositionCode() {
    return `int horizCount = (msdLength - 1) * msdCount;
                int segment = gl_VertexID / 2;
                bool first = (gl_VertexID % 2) == 0;
                int x, y;
                vec4 pos;
                if (segment < horizCount) {
                    int base = segment;
                    y = base / (msdLength - 1);
                    x = base % (msdLength - 1);
                    pos = getPoint(first ? x : x + 1, y);
                } else {
                    int base = segment - horizCount;
                    x = base / (msdCount - 1);
                    y = base % (msdCount - 1);
                    pos = getPoint(x, first ? y : y + 1);
                }`;
  }
  vertexExtraUniforms() {
    return "";
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
  /**
   * Offsets depending on the total mesh size
   * 0.5,0.5 = centered on 0,0
   */
  setPerXPerY(px = 0.5, py = 0.5) {
    this.uFloat("xPer").set(px);
    this.uFloat("yPer").set(py);
    return this;
  }
  setColorHueScale(scale = 1) {
    this.uFloat("colorHueScale").set(scale);
    return this;
  }
  smoothColor(is = true) {
    this.smoothColorEnabled = is;
    this.uInt("smoothColor").set(is ? 1 : 0);
    return this;
  }
  setRepeat(repeat = true) {
    this.repeatEnabled = repeat;
    if (this.program) {
      this.use();
      this.uInt("repeatMesh").set(repeat ? 1 : 0);
    }
    const texture = this.getTextureByUnit(this.valsTexUnit);
    if (!texture || this.repeatTexture === texture && this.repeatTextureState === repeat) return this;
    const gl = this.gl;
    const previousUnit = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE0 + parseTexUnitType(this.valsTexUnit));
    const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.bindTexture(gl.TEXTURE_2D, previousTexture);
    gl.activeTexture(previousUnit);
    this.repeatTexture = texture;
    this.repeatTextureState = repeat;
    return this;
  }
  setYScale(scale = 0.5) {
    this.uFloat("yScale").set(scale);
    return this;
  }
  initUniforms() {
    this.setSize(this.w, this.h).setOffset(0, 0, 0).setDXDY(this.dx, this.dy).setPerXPerY().setColorHueScale().setYScale();
    this.smoothColor(this.smoothColorEnabled);
    this.setRepeat(this.repeatEnabled);
    return this;
  }
  /**
   * Remember to check the texUnit texture must be active (use texture.bind(texUnit?))
   */
  draw(x = 0, y = 0, w = 1080, h = 720, camera, mode = "LINES") {
    this.initDepthBefDraw();
    if (this.repeatTexture !== this.getTextureByUnit(this.valsTexUnit)) this.setRepeat(this.repeatEnabled);
    this.bindTexName2TexUnit("values", this.valsTexUnit);
    if (camera) {
      camera.calculateMatrices().setUniformsProgram(this);
    }
    this.setViewport(x, y, w, h);
    this.clearColor();
    this.drawArrays(mode, 0, this.totalSegments * 2);
    return this;
  }
  /** Allocates the height texture; MeshFillerProgram evaluates its function on the GPU. */
  createIdealTexture(texUnit = this.valsTexUnit, w = this.w, h = this.h) {
    const texture = this.texture2D({
      format: TexExamples.RFloat,
      size: [w, h],
      texUnit
    });
    if (parseTexUnitType(texUnit) === parseTexUnitType(this.valsTexUnit)) this.setRepeat(this.repeatEnabled);
    return texture;
  }
  fillMeshTexture(texture2D, data, w = this.w, h = this.h) {
    let arrdata;
    if (typeof data == "function" && typeof data(0, 0) == "number") {
      arrdata = new Float32Array(w * h);
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          arrdata[j * w + i] = data(i, j) || 0;
        }
      }
    }
    texture2D.fill(arrdata, 0, 0, w, h);
    return this;
  }
};
var SolidMeshRenderingProgram = class extends MeshRenderingProgram {
  constructor() {
    super(...arguments);
    __publicField(this, "smoothColorEnabled", true);
  }
  vertexPositionCode() {
    return `int rowStride = msdLength * 2 + 2;
                int row = gl_VertexID / rowStride;
                int inRow = gl_VertexID % rowStride;
                int x = min(inRow / 2, msdLength - 1);
                int y = row + (inRow % 2);
                if (inRow == msdLength * 2) {
                    y = row + 1;
                } else if (inRow == msdLength * 2 + 1) {
                    x = 0;
                    y = row + 1;
                }
                vec4 pos = getPoint(x, y);`;
  }
  setSize(w = this.w, h = this.h) {
    super.setSize(w, h);
    this.totalSegments = w > 1 && h > 1 ? w * (h - 1) + (h - 2) : 0;
    return this;
  }
  draw(x = 0, y = 0, w = 1080, h = 720, camera, _mode = "TRIANGLE_STRIP") {
    super.draw(x, y, w, h, camera, "TRIANGLE_STRIP");
    return this;
  }
};
var DynamicSolidMeshRenderingProgram = class extends SolidMeshRenderingProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024) {
    super(gl, valsTexUnit, w, h);
    __publicField(this, "gridRadius", 128);
    __publicField(this, "repeatRadius", 100);
    __publicField(this, "fullResolutionCells", 48);
    __publicField(this, "falloff", 2);
    __publicField(this, "maxLOD", 0);
    __publicField(this, "lodOriginXZ", [0, 0]);
    __publicField(this, "priorityWorldPoints", []);
    __publicField(this, "priorityTexels", []);
    __publicField(this, "originPerX", 0.5);
    __publicField(this, "originPerY", 0.5);
    this.repeatEnabled = true;
  }
  vertexExtraUniforms() {
    return `uniform int lodGridRadius;
                uniform float lodRepeatRadius;
                uniform int lodFullResolutionCells;
                uniform float lodFalloff;
                uniform float lodMaxLOD;
                uniform vec2 lodOriginXZ;
                uniform int lodPriorityCount;
                uniform vec4 lodPriorityPoints[16];
                uniform int lodPeriodicXCount;
                uniform int lodPeriodicZCount;
                uniform float lodPeriodicXPositive[16];
                uniform float lodPeriodicXNegative[16];
                uniform float lodPeriodicZPositive[16];
                uniform float lodPeriodicZNegative[16];

                float lodPhase(int axis, bool negative, int slot) {
                    if (axis == 0) return negative ? lodPeriodicXNegative[slot] : lodPeriodicXPositive[slot];
                    return negative ? lodPeriodicZNegative[slot] : lodPeriodicZPositive[slot];
                }

                int lodAnchorIndex(int anchor, int total, int outerCells, int minimumSteps) {
                    if (anchor == 0) return 0;
                    if (anchor == total) return outerCells;
                    float t = float(anchor) / float(total);
                    float density = lodFalloff < 0.0001 ? t :
                        (1.0 - exp(-lodFalloff * t)) / (1.0 - exp(-lodFalloff));
                    return anchor * minimumSteps +
                        int(floor(float(outerCells - total * minimumSteps) * density));
                }

                float lodAnchorDistance(int anchor, int axis, bool negative, int count,
                                        int nearCount, float tileSize, float flatDistance) {
                    if (anchor == 0) return flatDistance;
                    if (anchor <= nearCount) {
                        return lodPhase(axis, negative, count - nearCount + anchor - 1);
                    }
                    int beyond = anchor - nearCount - 1;
                    int tile = 1 + beyond / count;
                    int slot = beyond % count;
                    return float(tile) * tileSize + lodPhase(axis, negative, slot);
                }

                float lodAxisPosition(int signedIndex, int axis, float cell, float tileSize,
                                      float origin, float repeatRadius) {
                    float center = floor(origin / cell) * cell;
                    int magnitude = abs(signedIndex);
                    if (magnitude <= lodFullResolutionCells) return center + float(signedIndex) * cell;
                    bool negative = signedIndex < 0;
                    int count = axis == 0 ? lodPeriodicXCount : lodPeriodicZCount;
                    if (count == 0) {
                        float fullResolutionDistance = float(lodFullResolutionCells) * cell;
                        float t = float(magnitude - lodFullResolutionCells) /
                                  float(lodGridRadius - lodFullResolutionCells);
                        float curve = lodMaxLOD > 0.0 || lodFalloff < 0.0001 ? t :
                            (exp(lodFalloff * t) - 1.0) / (exp(lodFalloff) - 1.0);
                        float distance = fullResolutionDistance + curve *
                            max(tileSize * repeatRadius - fullResolutionDistance, 0.0);
                        return center + (negative ? -distance : distance);
                    }
                    float fullResolutionDistance = float(lodFullResolutionCells) * cell;
                    int nearCount = 0;
                    for (int i = 0; i < 16; i++) {
                        if (i >= count) break;
                        if (lodPhase(axis, negative, i) > fullResolutionDistance) nearCount++;
                    }
                    int tiles = max(1, int(floor(repeatRadius)));
                    int zeroCount = lodPhase(axis, negative, 0) < 0.0001 * cell ? 1 : 0;
                    int total = (tiles - 1) * count + nearCount + zeroCount;
                    int outerCells = lodGridRadius - lodFullResolutionCells;
                    int minimumSteps = lodMaxLOD > 0.0 ?
                        max(1, int(ceil(float(axis == 0 ? msdLength : msdCount) / lodMaxLOD))) : 1;
                    int outer = magnitude - lodFullResolutionCells;
                    int low = 0;
                    int high = total;
                    for (int step = 0; step < 12; step++) {
                        if (low >= high) break;
                        int mid = (low + high + 1) / 2;
                        if (lodAnchorIndex(mid, total, outerCells, minimumSteps) <= outer) low = mid;
                        else high = mid - 1;
                    }
                    float distance = lodAnchorDistance(low, axis, negative, count, nearCount,
                                                       tileSize, fullResolutionDistance);
                    if (low < total) {
                        int firstIndex = lodAnchorIndex(low, total, outerCells, minimumSteps);
                        int nextIndex = lodAnchorIndex(low + 1, total, outerCells, minimumSteps);
                        float nextDistance = lodAnchorDistance(low + 1, axis, negative,
                                                                 count, nearCount, tileSize,
                                                                 fullResolutionDistance);
                        distance = mix(distance, nextDistance,
                                       float(outer - firstIndex) / float(nextIndex - firstIndex));
                    }
                    return center + (negative ? -distance : distance);
                }`;
  }
  vertexPositionCode() {
    return `int side = lodGridRadius * 2 + 1;
                int rowStride = side * 2 + 2;
                int row = gl_VertexID / rowStride;
                int inRow = gl_VertexID % rowStride;
                int ix = min(inRow / 2, side - 1) - lodGridRadius;
                int iz = row + (inRow % 2) - lodGridRadius;
                if (inRow == side * 2) {
                    iz = row + 1 - lodGridRadius;
                } else if (inRow == side * 2 + 1) {
                    ix = -lodGridRadius;
                    iz = row + 1 - lodGridRadius;
                }
                vec2 cell = max(abs(vec2(dx, dy)), vec2(0.000001));
                vec2 worldXZ = vec2(
                    lodAxisPosition(ix, 0, cell.x, float(msdLength) * cell.x,
                                    lodOriginXZ.x, lodRepeatRadius),
                    lodAxisPosition(iz, 1, cell.y, float(msdCount) * cell.y,
                                    lodOriginXZ.y, lodRepeatRadius));
                for (int i = 0; i < 16; i++) {
                    if (i >= lodPriorityCount) break;
                    vec4 reserved = lodPriorityPoints[i];
                    if (ix == int(reserved.z)) worldXZ.x = reserved.x;
                    if (iz == int(reserved.w)) worldXZ.y = reserved.y;
                }
                ivec2 texel = ivec2(round(vec2(
                    worldXZ.x / cell.x + float(msdLength) * (1.0 - xPer),
                    -worldXZ.y / cell.y + float(msdCount) * (1.0 - yPer))));
                ivec2 textureSizeXY = ivec2(msdLength, msdCount);
                ivec2 wrapped = (texel % textureSizeXY + textureSizeXY) % textureSizeXY;
                float height = texelFetch(values, wrapped, 0).r;
                vec4 pos = vec4(worldXZ.x, height * yScale, worldXZ.y, 1.0) + vec4(offPos, 0.0);`;
  }
  setSize(w = this.w, h = this.h) {
    super.setSize(w, h);
    return this.setGridRadius(this.gridRadius);
  }
  setGridRadius(radius) {
    if (radius > 512) console.warn(`DynamicSolidMeshProgram grid radius ${radius} is limited to 512`);
    this.gridRadius = Math.max(8, Math.min(512, Math.floor(radius)));
    const side = this.gridRadius * 2 + 1;
    this.totalSegments = (side + 1) * (side - 1);
    if (this.program) {
      this.use();
      this.uInt("lodGridRadius").set(this.gridRadius);
    }
    this.setFullResolutionCells(this.fullResolutionCells);
    return this.updatePriorityPoints();
  }
  setRepeatRadius(radius) {
    this.repeatRadius = Math.max(1, Math.min(1e4, radius));
    if (this.program) {
      this.use();
      this.uFloat("lodRepeatRadius").set(this.repeatRadius);
    }
    return this.updatePriorityPoints();
  }
  /** Keep this many grid cells at native spacing around the current LOD center. */
  setFullResolutionCells(cells) {
    this.fullResolutionCells = Math.max(0, Math.min(this.gridRadius - 1, Math.floor(cells)));
    if (this.program) {
      this.use();
      this.uInt("lodFullResolutionCells").set(this.fullResolutionCells);
    }
    return this.updatePriorityPoints();
  }
  /** 0 is linear spacing outside the center; larger values retain detail longer. */
  setFalloff(amount) {
    if (amount > 64) console.warn(`DynamicSolidMeshProgram falloff ${amount} is limited to 64`);
    this.falloff = Math.max(0, Math.min(64, amount));
    if (this.program) {
      this.use();
      this.uFloat("lodFalloff").set(this.falloff);
    }
    return this.updatePriorityPoints();
  }
  /** Cap the distance between outer vertices, in texture texels; 0 disables the cap. */
  setMaxLOD(texelsPerCell) {
    if (!Number.isFinite(texelsPerCell) || texelsPerCell < 0) {
      throw new Error("Maximum LOD must be a non-negative number of texels per cell");
    }
    const previous = this.maxLOD;
    this.maxLOD = texelsPerCell;
    try {
      this.updatePriorityPoints();
    } catch (error) {
      this.maxLOD = previous;
      throw error;
    }
    if (this.program) {
      this.use();
      this.uFloat("lodMaxLOD").set(this.maxLOD);
    }
    return this;
  }
  /** Set the LOD center explicitly; texture-priority anchors remain fixed in world space. */
  setLODOrigin(x, z) {
    this.lodOriginXZ = [x, z];
    if (this.program) {
      this.use();
      this.uVec("lodOriginXZ", 2).set(this.lodOriginXZ);
    }
    return this.updatePriorityPoints();
  }
  /** Follow the camera with high-resolution geometry without moving priority samples. */
  setCameraPosition(position) {
    const cellX = Math.max(Math.abs(this.dx), 1e-6);
    const cellZ = Math.max(Math.abs(this.dy), 1e-6);
    if (Math.floor(position.x / cellX) === Math.floor(this.lodOriginXZ[0] / cellX) && Math.floor(position.z / cellZ) === Math.floor(this.lodOriginXZ[1] / cellZ)) return this;
    return this.setLODOrigin(position.x, position.z);
  }
  setDXDY(dx, dy) {
    this.dx = dx;
    this.dy = dy;
    super.setDXDY(dx, dy);
    return this.updatePriorityPoints();
  }
  setPerXPerY(px = 0.5, py = 0.5) {
    this.originPerX = px;
    this.originPerY = py;
    super.setPerXPerY(px, py);
    return this.updatePriorityPoints();
  }
  /** Reserve exact world-space X/Z coordinates as vertices (up to 16 points). */
  setPriorityPoints(points) {
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    this.priorityWorldPoints = points.map(([x, z]) => [x, z]);
    this.priorityTexels = [];
    return this.updatePriorityPoints();
  }
  /** Reserve texture texels; [w/2,h/2] maps to world origin at xPer=yPer=0.5. */
  setPriorityTexels(points) {
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    if (points.some(([u, v]) => !Number.isFinite(u) || !Number.isFinite(v) || u < 0 || u >= this.w || v < 0 || v >= this.h)) {
      throw new Error("Priority texels must lie inside the height texture");
    }
    this.priorityTexels = points.map(([x, y]) => [x, y]);
    this.priorityWorldPoints = [];
    return this.updatePriorityPoints();
  }
  axisPosition(index, cell, size, origin) {
    const count = Math.abs(index);
    const flat = Math.min(count, this.fullResolutionCells) * cell;
    const outside = Math.max(0, count - this.fullResolutionCells);
    const span = Math.max(1, this.gridRadius - this.fullResolutionCells);
    const t = outside / span;
    const curve = this.falloff < 1e-4 ? t : Math.expm1(this.falloff * t) / Math.expm1(this.falloff);
    const reach = Math.max(0, size * cell * this.repeatRadius - this.fullResolutionCells * cell);
    return Math.floor(origin / cell) * cell + Math.sign(index) * (flat + curve * reach);
  }
  nearestAxisIndex(value, cell, size, origin) {
    let low = -this.gridRadius;
    let high = this.gridRadius;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.axisPosition(mid, cell, size, origin) < value) low = mid + 1;
      else high = mid;
    }
    if (low > -this.gridRadius && Math.abs(this.axisPosition(low - 1, cell, size, origin) - value) < Math.abs(this.axisPosition(low, cell, size, origin) - value)) low--;
    return low;
  }
  updatePriorityPoints() {
    const cellX = Math.max(Math.abs(this.dx), 1e-6);
    const cellZ = Math.max(Math.abs(this.dy), 1e-6);
    if (this.maxLOD > 0 && !this.priorityTexels.length) {
      for (const size of [this.w, this.h]) {
        const outerCells = this.gridRadius - this.fullResolutionCells;
        if ((size * this.repeatRadius - this.fullResolutionCells) / outerCells > this.maxLOD) {
          throw new Error("Maximum LOD needs more vertices; increase grid radius, reduce full-resolution cells or repeat radius, or raise max LOD");
        }
      }
    }
    if (this.priorityTexels.length) {
      const phaseArrays = [];
      const counts = [];
      for (const [axis, cell, size, origin] of [
        [0, cellX, this.w, this.lodOriginXZ[0]],
        [1, cellZ, this.h, this.lodOriginXZ[1]]
      ]) {
        const tileSize = cell * size;
        const center = Math.floor(origin / cell) * cell;
        const coords = this.priorityTexels.map(([u, v]) => axis === 0 ? (u - this.w * (1 - this.originPerX)) * cellX : -(v - this.h * (1 - this.originPerY)) * cellZ);
        for (const negative of [false, true]) {
          const phases = coords.map((coordinate) => {
            const distance = negative ? center - coordinate : coordinate - center;
            const remainder = (distance % tileSize + tileSize) % tileSize;
            return remainder < cell * 1e-4 || tileSize - remainder < cell * 1e-4 ? 0 : remainder;
          }).sort((a, b) => a - b).filter((phase, i, values2) => i === 0 || Math.abs(phase - values2[i - 1]) > cell * 1e-4);
          const nearCount = phases.filter((phase) => phase > this.fullResolutionCells * cell).length;
          const tiles = Math.max(1, Math.floor(this.repeatRadius));
          const total = (tiles - 1) * phases.length + nearCount + (phases[0] === 0 ? 1 : 0);
          const minimumSteps = this.maxLOD > 0 ? Math.max(1, Math.ceil(size / this.maxLOD)) : 1;
          if (total * minimumSteps > this.gridRadius - this.fullResolutionCells) {
            throw new Error("Maximum LOD needs more vertices for repeated priority texels; increase grid radius, reduce full-resolution cells or repeat radius, or raise max LOD");
          }
          const values = new Float32Array(16);
          values.set(phases);
          phaseArrays.push(values);
          counts.push(phases.length);
        }
      }
      if (this.program) {
        this.use();
        this.uInt("lodPriorityCount").set(0);
        this.uInt("lodPeriodicXCount").set(counts[0]);
        this.uInt("lodPeriodicZCount").set(counts[2]);
        for (const [i, name] of [
          "lodPeriodicXPositive",
          "lodPeriodicXNegative",
          "lodPeriodicZPositive",
          "lodPeriodicZNegative"
        ].entries()) {
          this.gl.uniform1fv(this.gl.getUniformLocation(this.program, `${name}[0]`), phaseArrays[i]);
        }
      }
      return this;
    }
    const points = this.priorityWorldPoints;
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    const xSlots = /* @__PURE__ */ new Map();
    const zSlots = /* @__PURE__ */ new Map();
    const reserved = new Float32Array(16 * 4);
    points.forEach(([x, z], i) => {
      if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error("Priority coordinates must be finite");
      const ix = this.nearestAxisIndex(x, cellX, this.w, this.lodOriginXZ[0]);
      const iz = this.nearestAxisIndex(z, cellZ, this.h, this.lodOriginXZ[1]);
      const edgeX = Math.abs(this.axisPosition(ix, cellX, this.w, this.lodOriginXZ[0]) - x);
      const edgeZ = Math.abs(this.axisPosition(iz, cellZ, this.h, this.lodOriginXZ[1]) - z);
      if (Math.abs(ix) === this.gridRadius && edgeX > cellX || Math.abs(iz) === this.gridRadius && edgeZ > cellZ) {
        throw new Error("Priority point lies outside the LOD mesh; increase repeat radius or move its origin");
      }
      if (xSlots.has(ix) && xSlots.get(ix) !== x || zSlots.has(iz) && zSlots.get(iz) !== z) {
        throw new Error("Priority points need distinct grid slots at this resolution; increase grid radius");
      }
      xSlots.set(ix, x);
      zSlots.set(iz, z);
      reserved.set([x, z, ix, iz], i * 4);
    });
    if (this.program) {
      this.use();
      this.uInt("lodPeriodicXCount").set(0);
      this.uInt("lodPeriodicZCount").set(0);
      this.uInt("lodPriorityCount").set(points.length);
      if (points.length) this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "lodPriorityPoints[0]"), reserved);
    }
    return this;
  }
  initUniforms() {
    super.initUniforms();
    return this.setGridRadius(this.gridRadius).setRepeatRadius(this.repeatRadius).setFullResolutionCells(this.fullResolutionCells).setFalloff(this.falloff).setMaxLOD(this.maxLOD).setLODOrigin(this.lodOriginXZ[0], this.lodOriginXZ[1]);
  }
  draw(x = 0, y = 0, w = 1080, h = 720, camera) {
    this.use();
    return super.draw(x, y, w, h, camera);
  }
};
var AxisLinesProgram = class extends WebProgram {
  constructor(gl, axisLengths = new Vector3D2(1, 1, 1)) {
    super(gl, "", "");
    __publicField(this, "axisLengths", axisLengths);
  }
  async loadProgram() {
    [this.program, this.vert, this.frag] = await loadShadersFromString(
      this.gl,
      `#version 300 es
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
            }`,
      `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main() { outColor = vec4(vColor, 1.0); }`
    );
    return this;
  }
  initUniforms() {
    this.uVec("axisLengths", 3).set(this.axisLengths);
    return this;
  }
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D2(x, y, z);
    this.uVec("axisLengths", 3).set(this.axisLengths);
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.drawArrays("LINES", 0, 6);
    return this;
  }
};
var AxisConesProgram = class extends WebProgram {
  constructor(gl, arrowHeights = new Vector3D2(0.1, 0.1, 0.1), arrowRadii = new Vector3D2(0.03, 0.03, 0.03), axisLengths = new Vector3D2(1, 1, 1)) {
    super(gl, "", "");
    __publicField(this, "arrowHeights", arrowHeights);
    __publicField(this, "arrowRadii", arrowRadii);
    __publicField(this, "axisLengths", axisLengths);
  }
  async loadProgram() {
    [this.program, this.vert, this.frag] = await loadShadersFromString(
      this.gl,
      // VS
      `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            layout(location=1) in vec3 aColor;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = aColor;
            }`,
      // FS
      `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor, 1.0); }`
    );
    return this;
  }
  /** Crea un simple VAO de conos para las puntas */
  initVAO() {
    const steps = 16;
    const vertices = [];
    const colors = [];
    const addCone = (dir, length, height, radius, color) => {
      for (let i = 0; i < steps; i++) {
        const a1 = i / steps * Math.PI * 2;
        const a2 = (i + 1) / steps * Math.PI * 2;
        const base1 = new Vector3D2(
          dir.x * length + radius * Math.cos(a1),
          dir.y * length + radius * Math.sin(a1),
          dir.z * length
        );
        const base2 = new Vector3D2(
          dir.x * length + radius * Math.cos(a2),
          dir.y * length + radius * Math.sin(a2),
          dir.z * length
        );
        const tip = new Vector3D2(dir.x * (length + height), dir.y * (length + height), dir.z * (length + height));
        vertices.push(
          base1.x,
          base1.y,
          base1.z,
          base2.x,
          base2.y,
          base2.z,
          tip.x,
          tip.y,
          tip.z
        );
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
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    this.drawArrays("TRIANGLES", 0, 3 * 16 * 3);
    return this;
  }
};
var AxisGridProgram = class extends WebProgram {
  // tamaño del lado del cuadrado (calculado automáticamente)
  constructor(gl, planes = ["XY"], axisLengths = new Vector3D2(1, 1, 1), divisions = 10) {
    super(gl, "", "");
    __publicField(this, "planes", planes);
    __publicField(this, "axisLengths", axisLengths);
    __publicField(this, "vertexCount", 0);
    __publicField(this, "divisions", 10);
    __publicField(this, "cellSize", 0.1);
    this.setDivisions(divisions);
  }
  async loadProgram() {
    [this.program, this.vert, this.frag] = await loadShadersFromString(
      this.gl,
      `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;
            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = vec3(0.3);
            }`,
      `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor,1.0); }`
    );
    return this;
  }
  /** Inicializa uniforms comunes (axis lengths, matrices, etc.) */
  initUniforms(axisLengths) {
    if (axisLengths) this.axisLengths = axisLengths;
    else if (!this.axisLengths) this.axisLengths = new Vector3D2(1, 1, 1);
    return this;
  }
  /** Genera el VAO de la cuadrícula en función de cellSize o divisions */
  initVAO() {
    const vertices = [];
    for (const plane of this.planes) this.addGrid(plane, vertices);
    this.vertexCount = vertices.length / 3;
    if (!this.VAO) this.createVAO();
    this.VAO.bind().attribute("aPos", vertices, 3);
    return this;
  }
  addGrid(plane, vertices) {
    const sizeX = this.axisLengths?.x ?? 1;
    const sizeY = this.axisLengths?.y ?? 1;
    const sizeZ = this.axisLengths?.z ?? 1;
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
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    if (this.vertexCount)
      this.drawArrays("LINES", 0, this.vertexCount);
    return this;
  }
  // ----------------------------
  // 🔧 Nuevas funciones añadidas
  // ----------------------------
  /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
  setDivisions(divisions) {
    this.divisions = Math.max(1, divisions);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.cellSize = avgAxis / this.divisions;
    return this;
  }
  /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
  setCellSize(size) {
    this.cellSize = Math.max(1e-3, size);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.divisions = Math.floor(avgAxis / this.cellSize);
    return this;
  }
};
var Axis3DGroup = class {
  constructor(gl, axisLengths = new Vector3D2(1, 1, 1), drawArrows = false, arrowHeights = new Vector3D2(0.1, 0.1, 0.1), arrowRadii = new Vector3D2(0.03, 0.03, 0.03), planes = []) {
    __publicField(this, "gl", gl);
    __publicField(this, "axisLengths", axisLengths);
    __publicField(this, "drawArrows", drawArrows);
    __publicField(this, "arrowHeights", arrowHeights);
    __publicField(this, "arrowRadii", arrowRadii);
    __publicField(this, "planes", planes);
    __publicField(this, "lines");
    __publicField(this, "cones");
    __publicField(this, "grid");
    __publicField(this, "gridDivisions", 10);
    this.lines = new AxisLinesProgram(gl, axisLengths);
    if (drawArrows) this.cones = new AxisConesProgram(gl, this.arrowHeights, this.arrowRadii, axisLengths);
    if (planes && planes.length > 0) this.grid = new AxisGridProgram(gl, planes, this.axisLengths);
  }
  /**
   * Inicializa uniforms y crea VAOs necesarios para cada subprograma.
   * Llamar a esta función después de loadAll() y antes del primer draw().
   */
  initUniforms() {
    this.lines.use();
    this.lines.initUniforms?.();
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
  /** Dibuja los tres elementos (usa VAOs creados en initUniforms) */
  draw(camera) {
    if (this.lines) {
      this.lines.use();
      this.lines.uVec("axisLengths", 3).set([this.axisLengths.x, this.axisLengths.y, this.axisLengths.z]);
      this.lines.draw(camera);
    }
    if (this.grid) {
      this.grid.use();
      if (!this.grid.VAO) this.grid.initVAO();
      this.grid.draw(camera);
    }
    if (this.cones) {
      this.cones.use();
      this.cones.axisLengths = this.axisLengths;
      this.cones.arrowHeights = this.arrowHeights;
      this.cones.arrowRadii = this.arrowRadii;
      if (!this.cones.VAO) this.cones.initVAO();
      this.cones.draw(camera);
    }
    return this;
  }
  /** helpers para actualizar parámetros en caliente */
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D2(x, y, z);
    this.lines.setAxisLengths(x, y, z);
    if (this.cones) this.cones.axisLengths = this.axisLengths;
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
  /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
  setDivisions(divisions) {
    this.gridDivisions = divisions;
    if (this.grid)
      this.grid.setDivisions(divisions);
    return this;
  }
  /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
  setCellSize(size) {
    if (this.grid)
      this.grid.setCellSize(size);
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
  async loadProgram() {
    if (this.lines)
      await this.lines.loadProgram();
    if (this.grid)
      await this.grid.loadProgram();
    if (this.cones)
      await this.cones.loadProgram();
    return this;
  }
  use() {
    return this;
  }
};
var MeshFillerProgram = class extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, callBackString, varsContext = {}) {
    super(gl, "", "");
    __publicField(this, "valsTexUnit", valsTexUnit);
    __publicField(this, "w", w);
    __publicField(this, "h", h);
    __publicField(this, "uniformsToUpdate", []);
    if (callBackString)
      this.generateProgram(callBackString, varsContext);
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.error("Este navegador/GPU no permite renderizar en RFloat.");
    }
  }
  /** Reuses the function attached by createIdealMesh to the texture on this unit. */
  async loadFromTexture(...varsContexts) {
    const texture = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit));
    if (!texture?.lastPreparedFunc) {
      throw new Error(`MeshFillerProgram ${this.valsTexUnit} needs a function or a preceding createIdealMesh on the same TexUnit`);
    }
    if (/\b(?:switch|try|catch|throw|class|function|new)\b/.test(texture.lastPreparedFunc)) {
      throw new Error("MeshFillerProgram cannot translate this callback to GLSL; use numeric expressions, if, for, or while");
    }
    this.generateProgram(texture.lastPreparedFunc, globalThis, ...varsContexts, texture.meshContext ?? {});
    await this.loadProgram();
    return this;
  }
  async loadProgram(vs = this.vertPath, fs = this.fragPath) {
    [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, vs, fs);
    this.use();
    this.uniformsToUpdate.forEach((u) => {
      u.setterObj = this.uFloat(u.name);
    });
    return this;
  }
  /**
   * Se ejecuta en cada frame del loop de renderizado (tick).
   * Obtiene los valores actuales del contexto y los sube a la GPU.
   */
  tick() {
    if (!this.program) return this;
    this.use();
    this.uniformsToUpdate.forEach((u) => {
      const currentVal = u.getter();
      if (u.setterObj && typeof u.setterObj.set === "function") {
        u.setterObj.set(currentVal);
      }
    });
    return this;
  }
  /**
   * 
   * @param callbackString (x,y) => { cos(-(y/100-({u_time||0, float}*3))) }
   * @param varsContext DetailedParser.ctx.vars, DetailedParser.GlobalContext
   */
  generateProgram(callbackString, ...varsContexts) {
    this.uniformsToUpdate = [];
    let uniformDecls = "";
    const arrowMatch = callbackString.match(/=>\s*([\s\S]*)$/);
    let body = arrowMatch ? arrowMatch[1].trim() : callbackString;
    if (body.startsWith("{") && body.endsWith("}")) {
      body = body.substring(1, body.length - 1).trim();
    }
    let glslBody = body.replace(/{([^{}]+)}/g, (whole, content) => {
      if (/[;{}]/.test(content) || /\b(?:return|let|const|var|if|else|for|while|switch|throw)\b/.test(content)) return whole;
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
                  if (typeof prop === "symbol") return false;
                  return varsContexts.some(
                    (ctx) => ctx instanceof Map ? ctx.has(prop) : prop in ctx
                  );
                },
                get(target, prop) {
                  if (prop === Symbol.unscopables) return void 0;
                  for (let i = varsContexts.length - 1; i >= 0; i--) {
                    const ctx = varsContexts[i];
                    if (ctx instanceof Map) {
                      if (ctx.has(prop)) return ctx.get(prop);
                    } else {
                      if (prop in ctx) return ctx[prop];
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
            if (str[i] === ")") count++;
            if (str[i] === "(") count--;
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
            if (str[i] === "(") count++;
            if (str[i] === ")") count--;
            if (count === 0) break;
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
    glslBody = glslBody.replace(/\b(?:let|const|var)\s+([A-Za-z_]\w*)\s*=/g, "float $1 =").replace(/===/g, "==").replace(/!==/g, "!=");
    if (/\b(?:return|if|for|while|float)\b/.test(glslBody)) {
      glslBody = glslBody.replace(/\breturn\s+([^;]+);?/g, "{ outRed = $1; return; }");
    } else {
      glslBody = `outRed = ${glslBody.replace(/;$/, "")};`;
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
                outRed = 0.0;
                ${glslBody}
            }`;
    return this;
  }
  draw() {
    if (!this.program) return this;
    const gl = this.gl;
    this.use();
    const tex = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit));
    if (!tex) return this;
    const tw = tex.w ?? this.w;
    const th = tex.h ?? this.h;
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

// ../dist/lib/Code/Game3D/Game3D.js
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

// ../dist/lib/Code/WebGL/webglMan.ts
var WebGLMan2 = class _WebGLMan {
  constructor(gl = _WebGLMan?.gl, dirPath) {
    this.gl = gl;
    this.dirPath = dirPath;
    if (!this.dirPath) {
      this.dirPath = "/glsl";
      let stdir = window.dntiDir || window.blogDirName;
      if (!!window && !!stdir) {
        this.dirPath = stdir + this.dirPath;
      }
      console.log("webgl main path:", this.dirPath);
    }
    if (_WebGLMan.stWebGLMan)
      _WebGLMan.stWebGLMan.gl ||= gl;
  }
  gl;
  dirPath;
  static stWebGLMan = new _WebGLMan();
  programs = [];
  static setGL(gl, path = _WebGLMan.stWebGLMan.dirPath) {
    _WebGLMan.stWebGLMan.dirPath = path;
    _WebGLMan.stWebGLMan.gl ||= gl;
    return this;
  }
  static get gl() {
    return _WebGLMan?.stWebGLMan?.gl;
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
    if (ID < 0) ID = this.programs.length;
    if (!!vertPath.trim() && !fragPath.trim()) {
      fragPath = vertPath + ".frag";
      vertPath = vertPath + ".vert";
    }
    let p = new WebProgram2(this.gl, this.dirPath + "/" + vertPath, this.dirPath + "/" + fragPath);
    this.programs[ID] = p;
    p.ID = ID;
    return p;
  }
  static includeExternalProgram(p) {
    let ID = p.ID ?? -1;
    if (ID < 0 || this.programs[ID] != p) ID = _WebGLMan.stWebGLMan.programs.length;
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
var WebProgram2 = class _WebProgram {
  constructor(gl, vertPath = "", fragPath = "") {
    this.gl = gl;
    this.vertPath = vertPath;
    this.fragPath = fragPath;
  }
  gl;
  vertPath;
  fragPath;
  program;
  /** set when created from WebGLMan */
  ID;
  vert;
  frag;
  nUsedTextures = 0;
  standardTEXW = 1080;
  standardTEXH = 720;
  viewportW = 1080;
  viewportH = 720;
  uniforms = /* @__PURE__ */ new Map();
  textures = [];
  /**
   * Creates the program but it ___doesnt use the program___
   */
  async loadProgram(vp = this.vertPath, fp = this.fragPath, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
    [this.program, this.vert, this.frag] = await loadShaders(
      this.gl,
      vp,
      fp,
      vertexFilter,
      fragmentFilter
    );
    return this;
  }
  use() {
    this.gl.useProgram(this.program);
    return this;
  }
  isWebProgram() {
    return true;
  }
  /**
   * Basically calls WebGLMan:includeExternalProgram to be set a program ID
   * Needed for simplifying code with Camer3D for example
   */
  includeInWebManList() {
    WebGLMan2.includeExternalProgram(this);
    return this;
  }
  //?<<---- Program specific control variables ---->>//
  //* Contains all the vertex dependent buffers (enabled/disabled, size/type/normalized/stride/offset, divisor for instancing)
  //* Basically a geoset
  //* It's handy for passing geometry around between functions or methods without having to create your own structs or objects
  //* An object that stores vertex array bindings (attributes)
  /**
   * Each VAO remembers:
   * 
   * which vertex attributes exist (and whether each is enabled),
   * 
   * the buffer bound for each attribute,
   * 
   * the data format (size, type, stride, offset),
   * 
   * and (optionally) the bound index buffer (EBO).
   * 
   * So a VAO = a complete recipe for __“how to feed this mesh’s vertices into this program.”__
   */
  VAOs = [];
  currentVAO = -1;
  get VAO() {
    return this.VAOs[this.currentVAO];
  }
  createVAO() {
    let vao = new VAO2(this.gl, this.program);
    this.VAOs.push(vao);
    if (this.currentVAO < 0) this.currentVAO = 0;
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
  static Textures = [];
  /**
   * Creates and/or binds a texture2d creating a new textureUnit and activating it.
   * @param {string} [name] __u_texture__
   * @param {([number,number]|number[])} [size=[this.standardTEXW,this.standardTEXH]] [W,H]
   * @param {([number,number]|number[])} [formats=WebGL2RenderingContext.RGBA,WebGL2RenderingContextRGBA32F] [format & internalformat] 
   * @param {([number|string,number|string]|(number|string)[])} [FILTER_WRAP] arguments can be NEAREST, LINEAR or CLAMP, REPEAT or MIRROR
   * [min, mag, Wrap_S, Wrap_T] = Shrinking, Enlarging, Clamp X, Clamp Y
   * 
   * Take into account *gl.RGBA32F, gl.R32F, gl.RGBA16F* **won't** accept **LINEAR LOD FILTERING**
   * 
   * << __TextureMagFilter__ >>
   * NEAREST                        = 0x2600;
   * LINEAR                         = 0x2601;
   * 
   * << __TextureMinFilter__ >>
   *      NEAREST
   *      LINEAR
   * NEAREST_MIPMAP_NEAREST         = 0x2700;
   * LINEAR_MIPMAP_NEAREST          = 0x2701;
   * NEAREST_MIPMAP_LINEAR          = 0x2702;
   * LINEAR_MIPMAP_LINEAR           = 0x2703;
   * 
   * << __TextureParameterName__ >>
   * TEXTURE_MAG_FILTER             = 0x2800;
   * TEXTURE_MIN_FILTER             = 0x2801;
   * TEXTURE_WRAP_S                 = 0x2802;
   * TEXTURE_WRAP_T                 = 0x2803;
   * 
   * << __TextureTarget__ >>
   * TEXTURE_2D                     = 0x0DE1;
   * TEXTURE                        = 0x1702;
   * 
   * TEXTURE_CUBE_MAP               = 0x8513;
   * TEXTURE_BINDING_CUBE_MAP       = 0x8514;
   * TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
   * TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
   * TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
   * TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
   * TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
   * TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
   * MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;
   * 
   * << __TextureWrapMode__ >>
   * 
   * REPEAT                         = 0x2901;
   * CLAMP_TO_EDGE                  = 0x812F;
   * MIRRORED_REPEAT                = 0x8370;
   * 
   * @returns [texture, nTexture, fill:(arr,x=0,y=0,w=size[0],h=size[1],LOD=LODlevel)=>{<<binds and fills the texture>>}]
   * @memberof VAO
   */
  createTexture2D(name, size = [this.standardTEXW, this.standardTEXH], format = TexExamples2.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
    let tex = this.gl.createTexture();
    texUnit = parseTexUnitType2(texUnit);
    let nTexture = texUnit || this.nUsedTextures;
    if ((FILTER_WRAP[0] == "LINEAR" || FILTER_WRAP[1] == "LINEAR") && format[2] == this.gl.FLOAT)
      console.error("%cTexture error: Float textures dont accept LINEAR LOD FILTERING", "color:red;font-weight:bold;");
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    FILTER_WRAP = FILTER_WRAP.map((a) => {
      if (a == "NEAREST") return WebGL2RenderingContext.NEAREST;
      if (a == "LINEAR") return WebGL2RenderingContext.LINEAR;
      if (a == "CLAMP") return WebGL2RenderingContext.CLAMP_TO_EDGE;
      if (a == "REPEAT") return WebGL2RenderingContext.REPEAT;
      if (a == "MIRROR") return WebGL2RenderingContext.MIRRORED_REPEAT;
      return a;
    });
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
    const arrayData = Array.isArray(data) || ArrayBuffer.isView(data);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      // Target
      LODlevel,
      // Level
      format[1] || this.gl.RGBA32F,
      // Internal format
      size[0],
      // Width
      size[1],
      // Height
      0,
      // Border
      format[0] || this.gl.RGBA,
      // Format
      format[2] || this.gl.FLOAT,
      // Type
      arrayData ? null : data || null
      // Array data is uploaded by fill below.
    );
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    this.nUsedTextures++;
    tex.fill = (arr, x = 0, y = 0, w = size[0], h = size[1], LOD = LODlevel) => {
      const channels = [this.gl.RED, this.gl.RED_INTEGER].includes(format[0]) ? 1 : [this.gl.RG, this.gl.RG_INTEGER].includes(format[0]) ? 2 : [this.gl.RGB, this.gl.RGB_INTEGER].includes(format[0]) ? 3 : 4;
      const values = Array.isArray(arr) ? arr.flat(Infinity) : ArrayBuffer.isView(arr) ? Array.from(arr) : null;
      if (values) {
        if (values.length > w * h * channels) throw new Error(`Texture fill accepts at most ${w * h * channels} values, got ${values.length}`);
        while (values.length < w * h * channels) values.push(0);
        arr = format[2] === this.gl.FLOAT ? new Float32Array(values) : format[2] === this.gl.INT ? new Int32Array(values) : format[2] === this.gl.UNSIGNED_INT ? new Uint32Array(values) : format[2] === this.gl.UNSIGNED_BYTE ? new Uint8Array(values) : format[2] === this.gl.BYTE ? new Int8Array(values) : format[2] === this.gl.SHORT ? new Int16Array(values) : format[2] === this.gl.UNSIGNED_SHORT ? new Uint16Array(values) : values;
      }
      if (tex.unit !== void 0)
        this.gl.activeTexture(this.gl.TEXTURE0 + tex.unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, LOD, x, y, w, h, format[0], format[2], arr);
      return tex;
    };
    tex.read = (x = 0, y = 0, w = size[0], h = size[1]) => {
      const gl = this.gl;
      const channels = [gl.RED, gl.RED_INTEGER].includes(format[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(format[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(format[0]) ? 3 : 4;
      const integerFormat = [gl.RED_INTEGER, gl.RG_INTEGER, gl.RGB_INTEGER, gl.RGBA_INTEGER].includes(format[0]);
      const readFormat = integerFormat ? gl.RGBA_INTEGER : gl.RGBA;
      const length = w * h * 4;
      const pixels = format[2] === gl.FLOAT ? new Float32Array(length) : format[2] === gl.INT ? new Int32Array(length) : format[2] === gl.UNSIGNED_INT ? new Uint32Array(length) : format[2] === gl.UNSIGNED_BYTE ? new Uint8Array(length) : format[2] === gl.BYTE ? new Int8Array(length) : format[2] === gl.SHORT ? new Int16Array(length) : format[2] === gl.UNSIGNED_SHORT ? new Uint16Array(length) : null;
      if (!pixels) throw new Error(`Unsupported texture read type: ${format[2]}`);
      const previous = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      const previousReadBuffer = gl.getParameter(gl.READ_BUFFER);
      const previousPackAlignment = gl.getParameter(gl.PACK_ALIGNMENT);
      const readFBO = gl.createFramebuffer();
      if (!readFBO) throw new Error("Could not create texture read framebuffer");
      try {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFBO);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error("Texture read framebuffer is incomplete");
        }
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        gl.readPixels(x, y, w, h, readFormat, format[2], pixels);
        const error = gl.getError();
        if (error !== gl.NO_ERROR) throw new Error(`Texture read failed: WebGL error ${error}`);
        if (channels === 4) return pixels;
        const compact = new pixels.constructor(w * h * channels);
        for (let i = 0; i < w * h; i++) {
          for (let c = 0; c < channels; c++) compact[i * channels + c] = pixels[i * 4 + c];
        }
        return compact;
      } finally {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, previous);
        gl.readBuffer(previousReadBuffer);
        gl.pixelStorei(gl.PACK_ALIGNMENT, previousPackAlignment);
        gl.deleteFramebuffer(readFBO);
      }
    };
    tex.unit = nTexture;
    tex.bind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType2(textureUnit);
      if (textureUnit != -1) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      }
      tex.unit = textureUnit;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      return tex;
    };
    tex.unbind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType2(textureUnit);
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
    _WebProgram.Textures[parseTexUnitType2(tex.unit)] = tex;
    this.textures[parseTexUnitType2(tex.unit)] = tex;
    if (arrayData) tex.fill(data);
    return tex;
  }
  /**
   * Creates and/or binds a texture2d creating a new textureUnit and activating it.
   * @param {string} [name] __u_texture__
   * @param {([number,number]|number[])} [size=[this.standardTEXW,this.standardTEXH]] [W,H]
   * @param {([number,number]|number[])} [formats=WebGL2RenderingContext.RGBA,WebGL2RenderingContextRGBA32F] [format & internalformat] 
   * @param {([number|string,number|string]|(number|string)[])} [FILTER_WRAP] arguments can be NEAREST, LINEAR or CLAMP, REPEAT or MIRROR
   * [min, mag, Wrap_S, Wrap_T] = Shrinking, Enlarging, Clamp X, Clamp Y
   * 
   * Take into account *gl.RGBA32F, gl.R32F, gl.RGBA16F* **won't** accept **LINEAR LOD FILTERING**
   * 
   * << __TextureMagFilter__ >>
   * NEAREST                        = 0x2600;
   * LINEAR                         = 0x2601;
   * 
   * << __TextureMinFilter__ >>
   *      NEAREST
   *      LINEAR
   * NEAREST_MIPMAP_NEAREST         = 0x2700;
   * LINEAR_MIPMAP_NEAREST          = 0x2701;
   * NEAREST_MIPMAP_LINEAR          = 0x2702;
   * LINEAR_MIPMAP_LINEAR           = 0x2703;
   * 
   * << __TextureParameterName__ >>
   * TEXTURE_MAG_FILTER             = 0x2800;
   * TEXTURE_MIN_FILTER             = 0x2801;
   * TEXTURE_WRAP_S                 = 0x2802;
   * TEXTURE_WRAP_T                 = 0x2803;
   * 
   * << __TextureTarget__ >>
   * TEXTURE_2D                     = 0x0DE1;
   * TEXTURE                        = 0x1702;
   * 
   * TEXTURE_CUBE_MAP               = 0x8513;
   * TEXTURE_BINDING_CUBE_MAP       = 0x8514;
   * TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
   * TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
   * TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
   * TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
   * TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
   * TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
   * MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;
   * 
   * << __TextureWrapMode__ >>
   * 
   * REPEAT                         = 0x2901;
   * CLAMP_TO_EDGE                  = 0x812F;
   * MIRRORED_REPEAT                = 0x8370;
   * 
   * @returns [texture, nTexture, fill:(arr,x=0,y=0,w=size[0],h=size[1],LOD=LODlevel)=>{<<binds and fills the texture>>}]
   * @memberof VAO
   */
  texture2D(params = {
    size: [this.standardTEXW, this.standardTEXH],
    format: TexExamples2.RGBAFloat,
    data: null,
    FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
    LODlevel: 0
  }) {
    return this.createTexture2D(
      params.name,
      params.size,
      params.format,
      params.data,
      params.FILTER_WRAP,
      params.texUnit,
      params.LODlevel
    );
  }
  loadLongArray2GPUTextures(array, basename, startTextureUnit, format = TexExamples2.RFloat, FILTER_WRAP) {
    startTextureUnit = parseTexUnitType2(startTextureUnit);
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
  /**
   * This uses {@link createTexture2D} to create the texture, thus binding a new textureUnit with activateTexture
   */
  texture2DFromImage(img, name, format = TexExamples2.RGBAFloat, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
    return this.createTexture2D(
      name,
      [img.width, img.height],
      format,
      img,
      FILTER_WRAP,
      texUnit,
      LODlevel
    );
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
    this.gl.activeTexture(this.gl.TEXTURE0 + parseTexUnitType2(texUnit));
    const texture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D) || this.gl.getParameter(this.gl.TEXTURE_BINDING_2D_ARRAY) || this.gl.getParameter(this.gl.TEXTURE_BINDING_3D);
    return texture;
  }
  /**
   * Bind TextureUnit to uniform. Same as {@link bindTextureUnit2Uniform}
   */
  uTexUnit(texUnit = this.nUsedTextures, name) {
    this.bindTextureUnit2Uniform(texUnit, name);
    return this;
  }
  /**
   * You dont need to use this if you created the texture with {@link createTexture2D} or {@link texture2DFromImage},
   * instead use this when you already have created the texture for example in another program and didnt bind it here.
   * 
   * This will increase the inner texture unit number (there are 32 possible textures in webgl2)
   */
  bindNewTexture(tex, name) {
    let nTexture = this.nUsedTextures;
    this.nUsedTextures++;
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    _WebProgram.Textures[parseTexUnitType2(nTexture) ?? tex.unit] = tex;
    this.textures[parseTexUnitType2(nTexture) ?? tex.unit] = tex;
    return nTexture;
  }
  bindTexture(tex, name, nTexture = 0) {
    nTexture = parseTexUnitType2(nTexture) ?? tex.unit;
    this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    _WebProgram.Textures[parseTexUnitType2(nTexture) ?? tex.unit] = tex;
    this.textures[parseTexUnitType2(nTexture) ?? tex.unit] = tex;
    return nTexture;
  }
  getTextureByUnit(texUnit) {
    const n = parseTexUnitType2(texUnit);
    return this.textures[n] || _WebProgram.Textures[n];
  }
  bindTexName2TexUnit(name, nTexture = 0) {
    nTexture = parseTexUnitType2(nTexture);
    if (!!name && !!name.trim()) {
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
    }
    return this;
  }
  createTexture2DArray(name, size = [this.standardTEXW, this.standardTEXH, 1], format = TexExamples2.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, MIPlevel = 0, target = this.gl.TEXTURE_2D_ARRAY) {
    const gl = this.gl;
    const tex = gl.createTexture();
    texUnit = parseTexUnitType2(texUnit);
    const nTexture = texUnit ?? this.nUsedTextures;
    if ((FILTER_WRAP[0] === "LINEAR" || FILTER_WRAP[1] === "LINEAR") && format[2] === gl.FLOAT)
      console.error("%cTexture error: Float textures don\u2019t accept LINEAR filtering", "color:red;font-weight:bold;");
    gl.activeTexture(gl.TEXTURE0 + nTexture);
    gl.bindTexture(target, tex);
    FILTER_WRAP = FILTER_WRAP.map((a) => {
      if (a === "NEAREST") return gl.NEAREST;
      if (a === "LINEAR") return gl.LINEAR;
      if (a === "CLAMP") return gl.CLAMP_TO_EDGE;
      if (a === "REPEAT") return gl.REPEAT;
      if (a === "MIRROR") return gl.MIRRORED_REPEAT;
      return a;
    });
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
    if (target === gl.TEXTURE_3D) gl.texParameteri(target, gl.TEXTURE_WRAP_R, FILTER_WRAP[3]);
    if (!size[2] || size[2] <= 0) {
      if (!!data && data.length) {
        const channels = format[0] === gl.RED || format[0] === gl.RED_INTEGER ? 1 : format[0] === gl.RG || format[0] === gl.RG_INTEGER ? 2 : format[0] === gl.RGB || format[0] === gl.RGB_INTEGER ? 3 : 4;
        size[2] = Math.max(1, Math.ceil(data.length / (size[1] * size[0] * channels)));
      } else {
        size[2] = 1;
      }
    }
    gl.texImage3D(
      target,
      MIPlevel,
      format[1],
      // internalFormat (e.g. gl.RGBA32F)
      size[0],
      // width
      size[1],
      // height
      size[2],
      // layers
      0,
      format[0],
      // format (e.g. gl.RGBA)
      format[2],
      // type (e.g. gl.FLOAT)
      data
      // optional data
    );
    if (name?.trim()) {
      gl.uniform1i(gl.getUniformLocation(this.program, name), nTexture);
    }
    this.nUsedTextures++;
    tex.fill = (arr, x = 0, y = 0, z = 0, w = size[0], h = size[1], d = size[2], LOD = MIPlevel) => {
      if (tex.unit !== void 0)
        gl.activeTexture(gl.TEXTURE0 + tex.unit);
      gl.bindTexture(target, tex);
      gl.texSubImage3D(target, LOD, x, y, z, w, h, d, format[0], format[2], arr);
      return tex;
    };
    tex.unit = nTexture;
    tex.bind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType2(textureUnit);
      if (textureUnit !== -1) gl.activeTexture(gl.TEXTURE0 + textureUnit);
      tex.unit = textureUnit;
      gl.bindTexture(target, tex);
      return tex;
    };
    tex.unbind = (textureUnit = tex.unit) => {
      textureUnit = parseTexUnitType2(textureUnit);
      if (textureUnit !== -1) gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(target, null);
      return tex;
    };
    tex.w = size[0];
    tex.h = size[1];
    tex.nLayers = size[2];
    tex.format = format;
    tex.target = target;
    _WebProgram.Textures[nTexture] = tex;
    this.textures[nTexture] = tex;
    tex.setLengthUniforms = () => {
      this.uInt(name + "Length", true).set(tex.w * tex.h);
      return tex;
    };
    return tex;
  }
  texture2DArray(params = {
    size: [this.standardTEXW, this.standardTEXH, 1],
    format: TexExamples2.RGBAFloat,
    data: null,
    FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
    MIPlevel: 0
  }) {
    return this.createTexture2DArray(
      params.name,
      params.size ?? [this.standardTEXW, this.standardTEXH, void 0],
      params.format ?? TexExamples2.RGBAFloat,
      params.data ?? null,
      params.FILTER_WRAP ?? ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
      params.texUnit,
      params.MIPlevel ?? 0
    );
  }
  createTexture3D(name, size = [this.standardTEXW, this.standardTEXH, 1], format = TexExamples2.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, MIPlevel = 0) {
    return this.createTexture2DArray(name, size, format, data, FILTER_WRAP, texUnit, MIPlevel, this.gl.TEXTURE_3D);
  }
  texture3DArray(params) {
    return this.createTexture3D(
      params.name,
      params.size ?? [this.standardTEXW, this.standardTEXH, 1],
      params.format ?? TexExamples2.RGBAFloat,
      params.data ?? null,
      params.FILTER_WRAP ?? ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
      params.texUnit,
      params.MIPlevel ?? 0
    );
  }
  texture3D(params) {
    return this.texture3DArray(params);
  }
  uMat4(name, hide = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      if (!hide)
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
  uMat3(name, hide = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      if (!hide)
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
  uMat2(name, hide = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      if (!hide)
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
  uVec(name, dimension = 3, isFloat = true, isUnsignedInt = false, hide = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      if (!hide)
        console.error("uniform", name, "was undefined");
      let undef = { set: () => undef };
      return undef;
    }
    let func = this.gl[`uniform${Math.min(~~dimension, 4)}${isFloat ? "f" : isUnsignedInt ? "ui" : "i"}v`];
    uniform.set = (vec, offset, len) => {
      let vcoords;
      let length = 0;
      if (vec?.coords) {
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
  uNum(name, isFloat = true, isUnsignedInt = false, hide = false) {
    const uniform = this.gl.getUniformLocation(this.program, name);
    if (!uniform) {
      if (!hide)
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
  uFloat(name, hide = false) {
    return this.uNum(name, true, false, hide);
  }
  uInt(name, hide = false) {
    return this.uNum(name, false, false, hide);
  }
  cFrameBuffer() {
    return new FrameBuffer2(this.gl, this);
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
  /**
   * gl.clear
   * Same as {@link clear} 
   */
  clearBuffer(type) {
    this.gl.clear(this.gl[type + "_BUFFER_BIT"]);
    return this;
  }
  clear(type) {
    this.clearBuffer(type);
    return this;
  }
  /**
   * gl.clear
   * Same as {@link clear} 
   */
  clearMask(type) {
    this.clearBuffer(type);
    return this;
  }
  clearColor(color = [0.2, 0.2, 0.2, 1]) {
    if (typeof color == "string") {
      let [r, g, b, a] = [0, 0, 0, 1];
      if (color.startsWith("hsl")) {
        color = HSLtoRGB(
          ...color.replaceAll(/hsl\(?/gm, "").replaceAll(")", "").split(",").map((a2) => parseFloat(a2))
        );
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
  //gl.getParameter(gl.MAX_COLOR_ATTACHMENTS);
  isDepthTest = true;
  depthFunction = "LESS";
  initDepthBefDraw() {
    if (this.isDepthTest)
      this.gl.enable(this.gl.DEPTH_TEST);
    else
      this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl[this.depthFunction]);
  }
  /**
   * Draw directly from my vertex buffer in order
   */
  drawArrays(mode, vaoOff = 0, vertexCount, instanceCount = 1) {
    if (vertexCount == void 0) vertexCount = this.VAO?.vaoLength || 0;
    this.initDepthBefDraw();
    if (instanceCount <= 1)
      this.gl.drawArrays(this.gl[mode], vaoOff, vertexCount);
    else
      this.gl.drawArraysInstanced(this.gl[mode], vaoOff, vertexCount, instanceCount);
    return this;
  }
  /**
       * Draw using an index list (EBO) that tells which vertices to use
       * 
       * .
       * 
       * If __mode__ is not one of the accepted values, a __gl.INVALID_ENUM__ error is thrown.
       * 
       * If __offset__ is not a valid multiple of the size of the given type, a __gl.INVALID_OPERATION__ error is thrown.
       * 
       * If __count__ is negative, a __gl.INVALID_VALUE__ error is thrown.
  
       */
  drawElements(mode, elementCount = this.VAO.eboLength, type = "UNSIGNED_SHORT", eboOff = 0, instanceCount = 0) {
    this.initDepthBefDraw();
    if (instanceCount <= 0)
      this.gl.drawElements(this.gl[mode], elementCount, this.gl[type], eboOff);
    else
      this.gl.drawElementsInstanced(this.gl[mode], elementCount, this.gl[type], eboOff, instanceCount);
    return this;
  }
  /**
   * Used to set both the RGB blend equation and alpha blend equation to a single equation.
   * 
   * The blend equation determines how a new pixel is combined with a pixel already in the WebGLFramebuffer.
   */
  blendEquation(mode = "ADD") {
    if (mode == "MIN" || mode == "MAX")
      this.gl.blendEquation(this.gl[mode]);
    else
      this.gl.blendEquation(this.gl["FUNC_" + mode]);
  }
  /**
   * defines which function is used for blending pixel arithmetic
   * 
   * __color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor)__. 
   * @param sfactor multiplier for the source blending factors 
   * @param dfactor multiplier for the destination blending factors
   * 
   * Constant | Factor | Description
   * 
   * gl.ZERO 	0,0,0,0 	Multiplies all colors by 0.
   * 
   * gl.ONE 	1,1,1,1 	Multiplies all colors by 1.
   * 
   * gl.SRC_COLOR 	RS, GS, BS, AS 	Multiplies all colors by the source colors.
   * 
   * gl.ONE_MINUS_SRC_COLOR 	1-RS, 1-GS, 1-BS, 1-AS 	Multiplies all colors by 1 minus each source color.
   * 
   * gl.DST_COLOR 	RD, GD, BD, AD 	Multiplies all colors by the destination color.
   * 
   * gl.ONE_MINUS_DST_COLOR 	1-RD, 1-GD, 1-BD, 1-AD 	Multiplies all colors by 1 minus each destination color.
   * 
   * gl.SRC_ALPHA 	AS, AS, AS, AS 	Multiplies all colors by the source alpha value.
   * 
   * gl.ONE_MINUS_SRC_ALPHA 	1-AS, 1-AS, 1-AS, 1-AS 	Multiplies all colors by 1 minus the source alpha value.
   * 
   * gl.DST_ALPHA 	AD, AD, AD, AD 	Multiplies all colors by the destination alpha value.
   * 
   * gl.ONE_MINUS_DST_ALPHA 	1-AD, 1-AD, 1-AD, 1-AD 	Multiplies all colors by 1 minus the destination alpha value.
   * 
   * gl.CONSTANT_COLOR 	RC, GC, BC, AC 	Multiplies all colors by a constant color.
   * 
   * gl.ONE_MINUS_CONSTANT_COLOR 	1-RC, 1-GC, 1-BC, 1-AC 	Multiplies all colors by 1 minus a constant color.
   * 
   * gl.CONSTANT_ALPHA 	AC, AC, AC, AC 	Multiplies all colors by a constant alpha value.
   * 
   * gl.ONE_MINUS_CONSTANT_ALPHA 	1-AC, 1-AC, 1-AC, 1-AC 	Multiplies all colors by 1 minus a constant alpha value.
   * 
   * gl.SRC_ALPHA_SATURATE 	min(AS, 1 - AD), min(AS, 1 - AD), min(AS, 1 - AD), 1 	
   * Multiplies the RGB colors by the smaller of either the source alpha value or the value of
   *  1 minus the destination alpha value. The alpha value is multiplied by 1. 
   * 
   */
  blendFunc(sfactor = "ONE", dfactor = "ZERO") {
    this.gl.blendFunc(this.gl[sfactor], this.gl[dfactor]);
  }
  /**
   * Sets source and destination blending factors
   * @param {0 to 1} r 
   * @param {0 to 1} g 
   * @param {0 to 1} b 
   * @param {0 to 1} a 
   */
  blendColor(r, g, b, a) {
    this.gl.blendColor(r, g, b, a);
  }
  finish() {
    this.gl.finish();
    return this;
  }
};
function parseTexUnitType2(texUnit) {
  if (!texUnit) return texUnit;
  if (typeof texUnit == "number") return texUnit;
  return parseInt(texUnit.substring(7));
}
function parseColAtchType2(colAttachment) {
  if (!colAttachment) return colAttachment;
  if (typeof colAttachment == "number") return colAttachment;
  return parseInt(colAttachment.substring(7));
}
var FrameBuffer2 = class {
  /**
   * Creates a framebuffer, which is basically a replacement canvas to draw into
   * After this function you can call {@link bindColorBuffer},{@link bindTextureDepthBuffer} or {@link cRenderBuffer}
   * 
   * To render we have to tell which color units to render to: 
   * gl.drawBuffers([
   *    gl.COLOR_ATTACHMENT0,
   *    gl.COLOR_ATTACHMENT1, ..etc
   * ]);
   * @returns [fbo, ()=>{binds the fbo}]
   */
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.fbo = this.gl.createFramebuffer();
  }
  gl;
  program;
  fbo;
  colorBuffersUsed = new Array(15).fill(false);
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
  /**
   * Tells the FrameBuffer what color attachments to output (i.e. this is for multiple outputs, each requiring 
   * you have set a color Buffer {@link bindColorBuffer} )
   */
  drawBuffers(unitArr = this.colorBuffersUsed.map((a, i) => [a, i]).filter((a) => a[0]).map((a) => a[1])) {
    this.gl.drawBuffers(
      unitArr.map((unit) => this.gl.COLOR_ATTACHMENT0 + parseColAtchType2(unit))
    );
    return this;
  }
  /**
   * After binded FrameBuffer we can use a texture as color.
   * If you dont want to read it later you dont need a texture then use {@link cRenderBuffer} with Color 
   * 
   * Renderable buffer internal types:
   * 
   * Unsigned byte **|**	RGBA8, RGB8, RGB5_A1, RGB10_A2, RGBA4 **|**	Normal 8-bit formats
   * 
   * Float (requires extension) **|**	RGBA16F, RGB16F **|**	Half-float (16-bit) requires EXT_color_buffer_half_float
   * 
   * Integer **|**	R32I, R32UI, etc. **|**	Only for integer render targets
   * 
   * @param {ColorAttachmentType} colorUnit - The location of the output texture (`layout(location=0) out vec4 solidColor;`)
   * @param {number} LODlevel - for WebGL **this must always be 0** (base mipmap level)
   */
  bindColorBuffer(texture, colorUnit, LODlevel = 0) {
    colorUnit = parseColAtchType2(colorUnit);
    if (colorUnit === void 0) {
      if (texture.unit !== void 0)
        colorUnit = texture.unit;
      else
        colorUnit = 0;
    }
    texture.colorUnit = colorUnit;
    this.colorBuffersUsed[colorUnit] = true;
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0 + colorUnit,
      this.gl.TEXTURE_2D,
      texture,
      LODlevel
    );
    return this;
  }
  unbindBuffer(colorUnit) {
    colorUnit = parseColAtchType2(colorUnit);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0 + colorUnit,
      this.gl.TEXTURE_2D,
      null,
      0
    );
  }
  readColorAttachment(n, x = 0, y = 0, w = this.program.standardTEXW, h = this.program.standardTEXH, format, dimension = 4) {
    let buffer = new Float32Array(w * h * dimension);
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
    this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType2(n));
    this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
    return buffer;
  }
  readColAttchTexture(tex, dimension = 4, x, y, w, h, format, colUnit) {
    let n = colUnit ?? tex.colorUnit ?? tex.unit;
    x ??= tex.offx;
    y ??= tex.offy;
    w ??= tex.w || this.program.standardTEXW;
    h ??= tex.h || this.program.standardTEXH;
    format ??= tex.format || TexExamples2.RGBA;
    let buffer = new Float32Array(w * h * dimension);
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
    this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType2(n));
    this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
    return buffer;
  }
  /**
   * RBGA booleans specifying whether that component can be rendered into the framebuffer
   * 
   * (gl.getParameter(gl.COLOR_WRITEMASK))
   */
  colorMask(r = true, g = true, b = true, a = true) {
    this.gl.colorMask(r, g, b, a);
    return this;
  }
  bindTextureDepthBuffer(texture, LODlevel = 0) {
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      texture,
      LODlevel
    );
    return this;
  }
  /**
   * 
   * @param depth Specifies whether depth buffer can be written into
   */
  depthMask(depth) {
    this.gl.depthMask(depth);
    return this;
  }
  /**
   * possible __types__ are:
   *   - Depth{16,24,32F} = Depth Buffer (only 1 per program)
   *   - Color{4,5,8} = ColorBuffer (up to 15)
   *   - STENCIL_INDEX8
   *   - DEPTH_STENCIL
   *   - DEPTH24_STENCIL8
   * 
   * 
   * __Internal__ |                        __Format__	|    __Meaning	Used for__  
   * 
   * gl.RGBA4	                4 bits per channel color (low quality)	           Color	 
   * 
   *                          
   * 
   * gl.RGB565                5/6/5 bits per color (common, fast)	      Color
   * 
   * gl.RGBA8	                8-bit color	         Color	
   * 
   * gl.DEPTH_COMPONENT16	    16-bit depth	     Depth testing	
   * 
   * gl.DEPTH_COMPONENT24	    24-bit depth	     Depth testing	
   * 
   * gl.DEPTH_COMPONENT32F	32-bit float depth	 High-precision depth	
   * 
   * gl.STENCIL_INDEX8	    8-bit stencil	     Stencil testing
   * 	
   * gl.DEPTH_STENCIL or gl.DEPTH24_STENCIL8 or gl.DEPTH32F_STENCIL8
   * 
   * @param [quality="low"|"medium"|"high"] 
   */
  cRenderBuffer(type = "DEPTH", quality = "low", w = 256, h = 256, colorUnit = 0) {
    colorUnit = parseColAtchType2(colorUnit);
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
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      attachment,
      this.gl.RENDERBUFFER,
      rbo
    );
    return rbo;
  }
  /**
   * 
   * @param maskNum A GLuint specifying a bit mask to enable or disable writing of individual
   *  bits in the stencil planes. By default, the mask is all 1.
   * 
   * (
   * 
   * gl.getParameter(gl.STENCIL_WRITEMASK);
   * 
   * // 110101
   * 
   * gl.getParameter(gl.STENCIL_BACK_WRITEMASK);
   * 
   * // 110101
   * 
   * gl.getParameter(gl.STENCIL_BITS);
   * // 0
   * 
   * )
   */
  stencilMask(maskNum) {
    this.gl.stencilMask(maskNum);
    return this;
  }
  get _() {
    return this.fbo;
  }
};
var TexExamples2 = {
  //*sampler2D -> use the same floats in shader
  // FLOAT textures 32B
  "RFloat": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R32F, WebGL2RenderingContext.FLOAT],
  "RGFloat": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG32F, WebGL2RenderingContext.FLOAT],
  "RGBFloat": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB32F, WebGL2RenderingContext.FLOAT],
  "RGBAFloat": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA32F, WebGL2RenderingContext.FLOAT],
  // FLOAT textures 16B
  "RFloat16": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R16F, WebGL2RenderingContext.FLOAT],
  "RGFloat16": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG16F, WebGL2RenderingContext.FLOAT],
  "RGBFloat16": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB16F, WebGL2RenderingContext.FLOAT],
  "RGBAFloat16": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA16F, WebGL2RenderingContext.FLOAT],
  //*sampler2D -> use 0-1 floats in shader (normal RGB colors)
  // UNSIGNED_BYTE textures 32B
  "R": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RG": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGB": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB8, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBA": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.UNSIGNED_BYTE],
  //*isampler2D -> use integers in shader
  // SIGNED INTEGER textures 32
  "RInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32I, WebGL2RenderingContext.INT],
  "RGInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32I, WebGL2RenderingContext.INT],
  "RGBInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32I, WebGL2RenderingContext.INT],
  "RGBAInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32I, WebGL2RenderingContext.INT],
  // SIGNED INTEGER textures 16
  "RInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16I, WebGL2RenderingContext.INT],
  "RGInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16I, WebGL2RenderingContext.INT],
  "RGBInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16I, WebGL2RenderingContext.INT],
  "RGBAInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16I, WebGL2RenderingContext.INT],
  // SIGNED INTEGER textures 8
  "RInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8I, WebGL2RenderingContext.INT],
  "RGInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8I, WebGL2RenderingContext.INT],
  "RGBInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8I, WebGL2RenderingContext.INT],
  "RGBAInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8I, WebGL2RenderingContext.INT],
  //*usampler2D -> use integers in shader
  // UNSIGNED INTEGER textures 32
  "RUInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32UI, WebGL2RenderingContext.UNSIGNED_INT],
  // UNSIGNED INTEGER textures 16
  "RUInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16UI, WebGL2RenderingContext.UNSIGNED_INT],
  // UNSIGNED INTEGER textures 8
  "RUInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGUInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBUInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_INT],
  "RGBAUInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_INT],
  // UNSIGNED INTEGER textures 8
  "RUBYTE8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGUBYTE8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBUBYTE8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
  "RGBAUBYTE8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_BYTE]
};
var VAO2 = class {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.vao = gl.createVertexArray();
  }
  gl;
  program;
  vao;
  attributeBuffers = /* @__PURE__ */ new Map();
  /** Length of the last set buffer divided by dimension */
  vaoLength = 0;
  eboLength = 0;
  bind() {
    this.gl.bindVertexArray(this._);
    return this;
  }
  /**
   * Creates a VBO (meaning a buffer storing numbers splitted for each vertex, i.e. an attribute)
   */
  cVBO(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false, columns = 1) {
    this.bind();
    let posBuf = this.attributeBuffers.get(name);
    if (!posBuf) {
      posBuf = this.gl.createBuffer();
      if (!posBuf) throw new Error(`Cannot create vertex buffer for ${name}`);
      this.attributeBuffers.set(name, posBuf);
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    this.vaoLength = Math.floor(data.length / (dimension * columns));
    const posLoc = this.gl.getAttribLocation(this.program, name);
    if (posLoc < 0) return posBuf;
    const columnStride = columns > 1 ? stride || dimension * columns * data.BYTES_PER_ELEMENT : stride;
    for (let column = 0; column < columns; column++) {
      const location = posLoc + column;
      this.gl.enableVertexAttribArray(location);
      const columnOffset = offset + column * dimension * data.BYTES_PER_ELEMENT;
      if (type === "INT" || type === "UNSIGNED_INT")
        this.gl.vertexAttribIPointer(location, dimension, this.gl[type], columnStride, columnOffset);
      else
        this.gl.vertexAttribPointer(location, dimension, this.gl[type], normalized, columnStride, columnOffset);
    }
    return posBuf;
  }
  /**
   * Creates a VBO (meaning a buffer storing numbers splitted for each vertex, i.e. an attribute)
   */
  attribute(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false, columns = 1) {
    const values = Array.isArray(data) ? data.flat(Infinity) : Array.from(data);
    const typed = type === "INT" ? new Int32Array(values) : type === "UNSIGNED_INT" ? new Uint32Array(values) : type === "UNSIGNED_BYTE" ? new Uint8Array(values) : new Float32Array(values);
    return this.cVBO(name, typed, dimension, type, stride, offset, normalized, columns);
  }
  /**
   * Sets an EBO, meaning a index buffer, which is an array of integers telling the GPU to repeat the connection of 
   * what vectors following these indices.
   */
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

// ../dist/lib/Code/WebGL/runtime/BackupRuntime.ts
var BackupPaths = class {
  /** Captures the project-relative backup root. */
  constructor(defaultScope) {
    this.defaultScope = defaultScope;
  }
  defaultScope;
  /** Formats one date component for a stable timestamp. */
  pad2 = (n) => String(n).padStart(2, "0");
  /** Produces the timestamp used by saved filenames. */
  stamp = () => {
    const d = /* @__PURE__ */ new Date();
    return String(d.getFullYear()) + this.pad2(d.getMonth() + 1) + this.pad2(d.getDate()) + this.pad2(d.getHours()) + this.pad2(d.getMinutes());
  };
  /** Prevents path separators and control characters in generated names. */
  safeName = (name) => String(name ?? "backup").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "") || "backup";
  /** Names a standalone backup from its variable and texture metadata. */
  defaultPath = (value, varName) => {
    const isTex = value && typeof value === "object" && ("w" in value || "h" in value || "unit" in value || value instanceof WebGLTexture);
    const parts = [this.safeName(varName)];
    if (isTex) {
      parts.push(String(value.w ?? value.width ?? "x"));
      parts.push(String(value.h ?? value.height ?? "y"));
      parts.push("TexUnit" + String(value.unit ?? "NA").replace(/^TexUnit/i, ""));
      parts.push(this.safeName(value.__backupProgram ?? value.programName ?? value.program ?? "programNA"));
    }
    parts.push(this.stamp());
    return parts.join("_") + ".txt";
  };
  /** Anchors a DSL path hint under the active backup scope. */
  normalizeScopePath = (pathHint) => {
    const raw = String(pathHint ?? "").trim().replace(/\\/g, "/");
    const scope = String(this.defaultScope || "").replace(/^\/+|\/+$/g, "");
    const withScope = (value) => {
      const clean = String(value || "").replace(/^\/+/, "");
      if (!scope) return clean;
      if (!clean) return scope;
      if (clean === scope || clean.startsWith(scope + "/")) return clean;
      return scope + "/" + clean;
    };
    if (!raw || raw === "/" || raw === ".") return { path: withScope(""), directoryMode: true };
    if (raw.startsWith("./")) {
      const rest = raw.slice(2);
      return { path: withScope(rest), directoryMode: !rest || /\/$/.test(rest) };
    }
    if (raw.startsWith("/")) return { path: withScope(raw.slice(1)), directoryMode: true };
    return { path: withScope(raw), directoryMode: true };
  };
  /** Chooses the base folder or a numbered draw-iteration folder. */
  resolveMultiTarget = (pathHint, defaultStem, suffix, generation = 1) => {
    const target = this.normalizeScopePath(pathHint);
    const stem = this.safeName(defaultStem);
    const cleanSuffix = String(suffix ?? "").replace(/^_+/, "");
    const fileName = stem + "_" + cleanSuffix + "_" + this.stamp() + ".txt";
    const gen = Math.max(1, Number(generation) || 1);
    if (target.directoryMode) {
      const dirPath2 = gen > 1 ? target.path ? String(target.path).replace(/\/+$/g, "") + "/" + String(gen) : String(gen) : target.path;
      return { path: dirPath2, directoryMode: true, suggestedName: fileName, generation: gen };
    }
    const p = target.path;
    if (/\.txt$/i.test(p)) {
      const slash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
      const dir = slash >= 0 ? p.slice(0, slash + 1) : "";
      const base = slash >= 0 ? p.slice(slash + 1) : p;
      const dot = base.toLowerCase().endsWith(".txt") ? base.slice(0, -4) : base;
      const genDir = gen > 1 ? dir ? dir.replace(/\/+$/g, "") + "/" + String(gen) + "/" : String(gen) + "/" : dir;
      return { path: genDir + dot + "_" + cleanSuffix + ".txt", directoryMode: false, generation: gen };
    }
    const dirPath = gen > 1 ? p ? String(p).replace(/\/+$/g, "") + "/" + String(gen) : String(gen) : p;
    return { path: dirPath, directoryMode: true, suggestedName: fileName, generation: gen };
  };
};
var BackupServer = class {
  /** Binds path resolution to the API endpoint. */
  constructor(paths, baseUrl = "/api/backups") {
    this.paths = paths;
    this.baseUrl = baseUrl;
  }
  paths;
  baseUrl;
  /** Writes a file, appends a log, or requests generation cleanup. */
  put = async (route, path, content, extra = {}) => {
    const response = await fetch(this.baseUrl + route, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content, ...extra })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error("Backup request failed: " + response.status + " " + raw);
    try {
      return raw ? JSON.parse(raw) : { ok: true, path: String(path ?? "") };
    } catch {
      return { ok: true, path: String(path ?? ""), raw };
    }
  };
  /** Reads a saved backup file as text from the server. */
  fetchText = async (pathHint) => {
    const target = this.paths.normalizeScopePath(pathHint);
    const response = await fetch(this.baseUrl + "/file?path=" + encodeURIComponent(target.path));
    if (!response.ok) throw new Error("Backup restore failed: " + response.status + " " + await response.text());
    return await response.text();
  };
};
var BackupValues = class {
  /** Uses the active WebGL context for GPU readback. */
  constructor(gl, TexExamples3) {
    this.gl = gl;
    this.TexExamples = TexExamples3;
  }
  gl;
  TexExamples;
  /** Formats the texture grid as aligned, readable rows. */
  texturePreview = (tex, varName) => {
    if (!tex || tex.__backupType !== "texture2D") return "";
    const w = Number(tex.w ?? 0) || 0;
    const h = Number(tex.h ?? 0) || 0;
    const dim = Number(tex.dim ?? 1) || 1;
    const name = String(varName ?? "texture");
    const program = String(tex.program ?? "programNA");
    const values = Array.isArray(tex.data) ? tex.data : [];
    const formatScalar = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return String(value ?? "").padStart(10, " ");
      return num.toFixed(4).padStart(10, " ");
    };
    const lines = [name + " [" + w + " x " + h + "] " + program];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const base = (y * w + x) * dim;
        for (let c = 0; c < dim; c++) {
          row.push(formatScalar(values[base + c]));
        }
      }
      lines.push(row.join(" "));
    }
    return lines.join("\n");
  };
  /** Reads GPU pixels into a serializable texture snapshot. */
  readTexture2D = (tex) => {
    if (!tex || typeof tex !== "object" || !(tex instanceof WebGLTexture)) return null;
    const w = Number(tex.w ?? tex.width ?? 1) || 1;
    const h = Number(tex.h ?? tex.height ?? 1) || 1;
    const format = tex.format || this.TexExamples.RGBAFloat;
    const dim = format?.[0] === this.gl.RED ? 1 : format?.[0] === this.gl.RG ? 2 : format?.[0] === this.gl.RGB ? 3 : 4;
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(this.gl.READ_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex, 0);
    this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0);
    const data = new Float32Array(w * h * dim);
    this.gl.readPixels(0, 0, w, h, format[0], format[2], data);
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, null);
    this.gl.deleteFramebuffer(fbo);
    return { __backupType: "texture2D", w, h, dim, format: Array.from(format || []), unit: tex.unit, program: tex.__backupProgram, data: Array.from(data) };
  };
  /** Serializes a value, including a readable texture preview. */
  serializeValue = (value, varName) => {
    const tex = this.readTexture2D(value);
    if (tex) {
      const jsonLine = JSON.stringify({ varName, savedAt: (/* @__PURE__ */ new Date()).toISOString(), value: tex });
      return this.texturePreview(tex, varName) + "\n" + jsonLine;
    }
    if (value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array) {
      return JSON.stringify({ varName, savedAt: (/* @__PURE__ */ new Date()).toISOString(), value: { __backupType: value.constructor.name, data: Array.from(value) } });
    }
    try {
      return JSON.stringify({ varName, savedAt: (/* @__PURE__ */ new Date()).toISOString(), value });
    } catch {
      return String(value);
    }
  };
  /** Converts textures and typed arrays to JSON-safe values. */
  normalizeValue = (value, varName) => {
    const tex = this.readTexture2D(value);
    if (tex) return { varName, value: tex };
    if (value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array) {
      return { varName, value: { __backupType: value.constructor.name, data: Array.from(value) } };
    }
    return { varName, value };
  };
  /** Decodes the final JSON line or a plain numeric backup. */
  decodeValue = (text) => {
    try {
      const lines = String(text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const jsonLine = lines.length ? lines[lines.length - 1] : "";
      const parsed = JSON.parse(jsonLine);
      return parsed && Object.prototype.hasOwnProperty.call(parsed, "value") ? parsed.value : parsed;
    } catch {
      const nums = text.trim().split(/[\s,;]+/).map(Number).filter(Number.isFinite);
      return nums.length ? new Float32Array(nums) : text;
    }
  };
};
var BackupGenerations = class {
  /** Starts with no counters or cleared scopes. */
  constructor(paths, server, generationContext) {
    this.paths = paths;
    this.server = server;
    this.generationContext = generationContext;
  }
  paths;
  server;
  generationContext;
  /** Holds counters and cleanup state for the current model stamp. */
  drawGenerationState = { stamp: /* @__PURE__ */ Symbol("init"), counts: /* @__PURE__ */ new Map(), clearedScopes: /* @__PURE__ */ new Set() };
  /** Resets counters when the model stamp changes. */
  refreshGenerationState = () => {
    try {
      if (!this.generationContext().recomputeTau) return;
      const stamp = this.generationContext().tauModelStamp ?? "__recompute__";
      if (this.drawGenerationState.stamp !== stamp) {
        this.drawGenerationState.stamp = stamp;
        this.drawGenerationState.counts = /* @__PURE__ */ new Map();
        this.drawGenerationState.clearedScopes = /* @__PURE__ */ new Set();
      }
    } catch {
    }
  };
  /** Requests one cleanup per draw scope on recomputation. */
  clearDrawScopeGenerationsIfNeeded = async (pathHint) => {
    this.refreshGenerationState();
    try {
      if (!this.generationContext().recomputeTau) return;
      const target = this.paths.normalizeScopePath(pathHint);
      const key = String(target.path || "");
      if (this.drawGenerationState.clearedScopes.has(key)) return;
      this.drawGenerationState.clearedScopes.add(key);
      await this.server.put("/clear-generations", target.path, "");
    } catch (err) {
      console.warn("[backUp clear-generations] failed", pathHint, err);
    }
  };
  /** Returns the next numbered pass for one draw and shader. */
  nextDrawGeneration = (drawKind, pathHint, program, trackWithoutRecompute = false) => {
    this.refreshGenerationState();
    try {
      if (!trackWithoutRecompute && !this.generationContext().recomputeTau) return 1;
      const target = this.paths.normalizeScopePath(pathHint);
      const drawName = this.paths.safeName(drawKind || "draw");
      const programName = this.paths.safeName(program?.ID ?? program?.fragPath ?? program?.name ?? "program");
      const key = target.path + "::" + programName + "::" + drawName;
      const next = (this.drawGenerationState.counts.get(key) || 0) + 1;
      this.drawGenerationState.counts.set(key, next);
      return next;
    } catch {
      return 1;
    }
  };
};
var BackupDrawWriter = class {
  /** Shares path, server, codec, and iteration state with the public runtime. */
  constructor(paths, server, values, generations) {
    this.paths = paths;
    this.server = server;
    this.values = values;
    this.generations = generations;
  }
  paths;
  server;
  values;
  generations;
  writes = /* @__PURE__ */ new Map();
  /** Captures uniforms and outputs, then uploads their snapshots. */
  storeDrawBlock = async (drawKind, pathHint, outputTextures, uniformEntries, program, options = {}) => {
    try {
      const drawName = this.paths.safeName(drawKind || "draw");
      const generation = this.generations.nextDrawGeneration(
        drawKind,
        pathHint,
        program,
        options?.maxBackUpIterations !== void 0 || options?.priority !== void 0
      );
      const maximum = Number(options?.maxBackUpIterations);
      const limit = Number.isInteger(maximum) && maximum > 0 ? maximum : Infinity;
      const priority = String(options?.priority || "first").toLowerCase();
      const every = /^each-(\d+)$/.exec(priority);
      if (priority !== "first" && priority !== "last" && (!every || Number(every[1]) < 1)) {
        throw new Error(`Prioridad de backup invalida: ${priority}`);
      }
      if (priority === "first" && generation > limit) return { ok: true, skipped: true };
      if (every && ((generation - 1) % Number(every[1]) !== 0 || Math.ceil(generation / Number(every[1])) > limit)) {
        return { ok: true, skipped: true };
      }
      const outputs = Array.isArray(outputTextures) ? outputTextures.filter(Boolean) : [];
      const outputSet = new Set(outputs.map((item) => item?.tex).filter(Boolean));
      const programTextures = Array.isArray(program?.textures) ? program.textures.filter((tex) => tex && !outputSet.has(tex)) : [];
      const prependedInputs = programTextures.map((tex, idx) => this.values.normalizeValue(tex, tex.__backupVarName || tex.__backupUniformName || "inputTex" + idx));
      const normalizedUniforms = (Array.isArray(uniformEntries) ? uniformEntries : []).map((entry) => ({
        kind: entry?.kind || "uniform",
        name: entry?.name || "uniform",
        ...this.values.normalizeValue(entry?.value, entry?.name || "uniform")
      }));
      const serializedOutputs = outputs.map((output) => {
        const outputName = output?.name || "output";
        try {
          return { outputName, ok: true, payload: this.values.serializeValue(output?.tex, outputName) };
        } catch (err) {
          return {
            outputName,
            ok: false,
            payload: JSON.stringify({
              varName: outputName,
              savedAt: (/* @__PURE__ */ new Date()).toISOString(),
              error: String(err)
            })
          };
        }
      });
      const uniformPayload = JSON.stringify({
        source: drawKind,
        savedAt: (/* @__PURE__ */ new Date()).toISOString(),
        entries: [
          ...prependedInputs.map((entry) => ({ kind: "programTexture", name: entry.varName, value: entry.value })),
          ...normalizedUniforms
        ]
      });
      const scope = this.paths.normalizeScopePath(pathHint).path;
      const prior = this.writes.get(scope) || Promise.resolve();
      const work = prior.catch(() => void 0).then(async () => {
        await this.generations.clearDrawScopeGenerationsIfNeeded(pathHint);
        const uniformTarget = this.paths.resolveMultiTarget(pathHint, drawName, "uniforms", generation);
        await this.server.put("/file", uniformTarget.path, uniformPayload, uniformTarget.directoryMode ? { directoryMode: true, suggestedName: uniformTarget.suggestedName } : {});
        for (const snapshot of serializedOutputs) {
          try {
            const outputTarget = this.paths.resolveMultiTarget(pathHint, drawName, this.paths.safeName(snapshot.outputName), generation);
            await this.server.put("/file", outputTarget.path, snapshot.payload, outputTarget.directoryMode ? { directoryMode: true, suggestedName: outputTarget.suggestedName } : {});
            if (!snapshot.ok) {
              console.warn("[backUp draw] stored output fallback payload", snapshot.outputName, pathHint);
            }
          } catch (err) {
            console.error("[backUp draw] output store failed", snapshot.outputName, pathHint, err);
          }
        }
        if (priority === "last" && Number.isFinite(limit) && generation > limit) {
          const old = this.paths.resolveMultiTarget(pathHint, drawName, "uniforms", generation - limit);
          if (old.directoryMode) {
            await this.server.put("/clear-generation", old.path, "", { prefix: drawName + "_" });
          } else {
            const previous = [old, ...serializedOutputs.map((snapshot) => this.paths.resolveMultiTarget(pathHint, drawName, this.paths.safeName(snapshot.outputName), generation - limit))];
            const folder = old.path.replace(/\/[^/]*$/, "");
            await this.server.put("/clear-generation", folder, "", {
              filenames: previous.map((item) => item.path.slice(folder.length + 1))
            });
          }
        }
        return { ok: true };
      });
      this.writes.set(scope, work);
      void work.then(
        () => {
          if (this.writes.get(scope) === work) this.writes.delete(scope);
        },
        () => {
          if (this.writes.get(scope) === work) this.writes.delete(scope);
        }
      );
      return await work;
    } catch (err) {
      console.error("[backUp draw] failed", drawKind, pathHint, err);
      return { ok: false, error: String(err) };
    }
  };
};
var BackupReader = class {
  /** Connects API text retrieval with value decoding. */
  constructor(server, values) {
    this.server = server;
    this.values = values;
  }
  server;
  values;
  /** Reads one backup without changing a target object. */
  async readBackup(pathHint) {
    return this.values.decodeValue(await this.server.fetchText(pathHint));
  }
  /** Fills a texture or returns an array/scalar from a backup. */
  restoreInto = async (target, pathHint) => {
    const value = await this.readBackup(pathHint);
    if (target && typeof target.fill === "function" && value?.__backupType === "texture2D") {
      target.fill(new Float32Array(value.data || []), 0, 0, value.w, value.h);
      return target;
    }
    if (value?.__backupType && Array.isArray(value.data)) return new Float32Array(value.data);
    return value;
  };
};
var BackupConsoleLogger = class {
  /** Uses the same scoped path and HTTP server as other backup operations. */
  constructor(paths, server) {
    this.paths = paths;
    this.server = server;
  }
  paths;
  server;
  /** Installs console mirrors for one DSL log destination. */
  log = async (pathHint) => {
    const target = this.paths.normalizeScopePath(pathHint);
    const p = target.path;
    const prevLog = console.log.bind(console);
    const prevWarn = console.warn.bind(console);
    const prevError = console.error.bind(console);
    const append = (level, args) => {
      const line = "[" + (/* @__PURE__ */ new Date()).toISOString() + "] " + level + " " + args.map((a) => {
        try {
          return typeof a === "string" ? a : JSON.stringify(a);
        } catch {
          return String(a);
        }
      }).join(" ") + "\n";
      this.server.put("/append", p, line, target.directoryMode ? { directoryMode: true, suggestedName: "log_" + this.paths.stamp() + ".txt" } : {}).catch(prevError);
    };
    console.log = (...args) => {
      prevLog(...args);
      append("log", args);
    };
    console.warn = (...args) => {
      prevWarn(...args);
      append("warn", args);
    };
    console.error = (...args) => {
      prevError(...args);
      append("error", args);
    };
    console.log("[backUp log]", p);
  };
};
var BackupRuntime = class {
  paths;
  server;
  values;
  generations;
  draws;
  reader;
  logger;
  taggedValues = /* @__PURE__ */ new Map();
  /** Connects the browser WebGL context and recomputation state to the backup API. */
  constructor(gl, TexExamples3, defaultScope, generationContext = () => ({})) {
    this.paths = new BackupPaths(defaultScope);
    this.server = new BackupServer(this.paths);
    this.values = new BackupValues(gl, TexExamples3);
    this.generations = new BackupGenerations(this.paths, this.server, generationContext);
    this.draws = new BackupDrawWriter(this.paths, this.server, this.values, this.generations);
    this.reader = new BackupReader(this.server, this.values);
    this.logger = new BackupConsoleLogger(this.paths, this.server);
  }
  /** Stores one named value at a DSL path hint. */
  store = async (value, varName, pathHint) => {
    try {
      const target = this.paths.normalizeScopePath(pathHint);
      const result = await this.server.put("/file", target.path, this.values.serializeValue(value, varName), target.directoryMode ? { directoryMode: true, suggestedName: this.paths.defaultPath(value, varName) } : {});
      console.log("[backUp store]", result.path);
      return result;
    } catch (err) {
      console.error("[backUp store] failed", err);
      return { ok: false, error: String(err) };
    }
  };
  /** Restores a texture in place or returns decoded scalar/array data. */
  restoreInto = (target, pathHint) => this.reader.restoreInto(target, pathHint);
  /** Mirrors console messages to a backup log file. */
  log = (pathHint) => this.logger.log(pathHint);
  /** Captures all outputs of one draw block. */
  storeDrawBlock = (drawKind, pathHint, outputTextures, uniformEntries, program, options = {}) => this.draws.storeDrawBlock(drawKind, pathHint, outputTextures, uniformEntries, program, options);
  /** Reads one backup value without mutating an existing target. */
  async readBackup(pathHint) {
    return this.reader.readBackup(pathHint);
  }
  /** Saves the latest value observed at a tagged DSL block, at most once per second. */
  captureTaggedValue(block, tag, name, value) {
    const key = [block, tag, name].map(this.paths.safeName).join("_");
    const previous = this.taggedValues.get(key);
    const now = Date.now();
    if (previous?.pending || previous && now - previous.time < 1e3) return;
    let formatted;
    try {
      formatted = JSON.stringify(value) ?? String(value);
    } catch {
      formatted = String(value);
    }
    if (formatted.length > 4096) formatted = formatted.slice(0, 4096) + "...";
    if (previous && previous.value === formatted) {
      previous.time = now;
      return;
    }
    const state = { time: now, pending: true, value: formatted };
    this.taggedValues.set(key, state);
    const scope = this.paths.normalizeScopePath("./.dnti-tags/").path.replace(/\/+$/, "");
    void this.server.put("/file", `${scope}/${key}.json`, JSON.stringify({ block, tag, name, value: formatted, at: new Date(now).toISOString() })).catch(() => {
      state.time = Date.now() + 3e4;
      state.value = "";
    }).finally(() => {
      state.pending = false;
    });
  }
};

// generated/generatedParserC1.ts
(async () => {
  const canvas = document.getElementById("trajectory-c1");
  if (!canvas) throw new Error("Missing trajectory canvas for c1");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 is required");
  if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("RG32F render targets are not supported");
  const ctx = gl;
  const webglMan = new WebGLMan2(gl);
  KeyManager.detectKeys(keypress);
  MouseManager.EnableCanvas(canvas);
  let trajectory = [
    [0.06, 0.74],
    [0.15, 0.57],
    [0.24, 0.62],
    [0.33, 0.35],
    [0.44, 0.43],
    [0.53, 0.28],
    [0.64, 0.39],
    [0.73, 0.17],
    [0.84, 0.26],
    [0.94, 0.11]
  ].flat();
  const lastPoint = trajectory.slice(-2);
  const firstPoint = trajectory.slice(0, 2);
  for (let i = 1; i <= 300; i++) {
    const t = i / 300;
    const x = lastPoint[0] * (1 - t) + firstPoint[0] * t;
    const y = lastPoint[1] * (1 - t) + firstPoint[1] * t;
    trajectory.push(x, y);
  }
  var lastUsedProgram = null;
  var lastFillerProgram = null;
  void lastFillerProgram;
  var __globalBlocks = [];
  const backupRuntime = new BackupRuntime(gl, TexExamples2, "parseTextC1", () => ({
    recomputeTau: typeof recomputeTau !== "undefined" && !!recomputeTau,
    tauModelStamp: typeof tauModelStamp !== "undefined" ? tauModelStamp : void 0
  }));
  const readBackup = (path) => backupRuntime.readBackup(path);
  var meshProgram = new DynamicSolidMeshRenderingProgram(gl, "TexUnit20", [1024, 1024][0], [1024, 1024][1]).includeInWebManList();
  lastUsedProgram = meshProgram;
  await meshProgram.loadProgram(meshProgram.vertPath, meshProgram.fragPath, ((source) => source), ((source) => source));
  await meshProgram.use?.();
  lastUsedProgram = meshProgram;
  let scaleFactor = 1;
  ;
  var time = 0;
  ;
  meshProgram.initUniforms().setDXDY(0.16 * scaleFactor, 0.16 * scaleFactor).setYScale(scaleFactor).setPerXPerY(0.5, 0.5).setColorHueScale(0.223).smoothColor(true).setRepeat(true);
  meshProgram.setGridRadius(512).setFullResolutionCells(120).setFalloff(1640 * 4 * 16 * 16).setRepeatRadius(30);
  meshProgram.setLODOrigin(0, 0).setPriorityTexels([[512, 512]]).setMaxLOD(128);
  var surface;
  (() => {
    surface = lastUsedProgram?.createIdealTexture?.("TexUnit20");
    if (surface) {
      surface.lastPreparedFunc = "(x, y) => { let dx1 = (x - 300) * 0.05; let dy1 = (y - 300) * 0.05; let r1 = Math.sqrt(dx1*dx1 + dy1*dy1); let dx2 = (x - 700) * 0.04; let dy2 = (y - 600) * 0.04; let r2 = Math.sqrt(dx2*dx2 + dy2*dy2); return (sin(r1 - {time} * 3) / (1 + r1 * 0.1) + cos(r2 - {time} * 4) / (1 + r2 * 0.08)) * 8; }";
      surface.meshContext = {
        get time() {
          return typeof time !== "undefined" ? time : globalThis.time;
        }
      };
    }
    surface?.bind?.();
  })();
  var camera3D = new Camera3D(new Vector3D2(0, 4, 12));
  camera3D.direction = new Vector3D2(0, -0.3, -1);
  camera3D.calculateMatrices();
  var axis3DGroup = new Axis3DGroup(gl, new Vector3D2(4, 4, 4), true, void 0, void 0, void 0).includeInWebManList();
  await axis3DGroup.loadProgram(axis3DGroup.vertPath, axis3DGroup.fragPath, ((source) => source), ((source) => source));
  await axis3DGroup.use?.();
  lastUsedProgram = axis3DGroup;
  axis3DGroup.setDivisions(4).initUniforms();
  camera3D.bindRKey("z");
  var meshFillerProgram = new MeshFillerProgram(gl, "TexUnit20").includeInWebManList();
  await meshFillerProgram.loadFromTexture();
  lastFillerProgram = meshFillerProgram;
  let offset = new Vector2D2(0, 0);
  var demo = webglMan.program(-1, "demo");
  await demo.loadProgram(demo.vertPath, demo.fragPath, ((source) => source), ((source) => source));
  await demo.use?.();
  lastUsedProgram = demo;
  demo.createVAO().bind();
  var TauFloatTex = {
    format: TexExamples2.RGFloat,
    filter_min: "NEAREST",
    filter_mag: "NEAREST",
    wrap_S: "CLAMP",
    wrap_T: "CLAMP"
  };
  var movePoints = webglMan.program(-1, "movePoints");
  await movePoints.loadProgram(movePoints.vertPath, movePoints.fragPath, ((source) => source), ((source) => source));
  await movePoints.use?.();
  lastUsedProgram = movePoints;
  movePoints.createVAO().bind();
  var positionTexture = movePoints.createTexture2D("positionTexture", [1, Math.ceil(trajectory.length / ((__fmt) => [gl.RED, gl.RED_INTEGER].includes(__fmt[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(__fmt[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(__fmt[0]) ? 3 : 4)(TauFloatTex?.format ?? TexExamples2.RGBAFloat))], TauFloatTex?.format ?? TexExamples2.RGBAFloat, trajectory, [TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST", TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST", TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP", TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP"], "TexUnit12");
  positionTexture.__backupVarName = "positionTexture";
  positionTexture.__backupUniformName = "positionTexture";
  positionTexture.__backupProgram = movePoints?.ID ?? movePoints?.fragPath ?? "movePoints";
  var positionTextureNext = movePoints.createTexture2D("positionTextureNext", [1, Math.ceil(trajectory.length / ((__fmt) => [gl.RED, gl.RED_INTEGER].includes(__fmt[0]) ? 1 : [gl.RG, gl.RG_INTEGER].includes(__fmt[0]) ? 2 : [gl.RGB, gl.RGB_INTEGER].includes(__fmt[0]) ? 3 : 4)(TauFloatTex?.format ?? TexExamples2.RGBAFloat))], TauFloatTex?.format ?? TexExamples2.RGBAFloat, null, [TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST", TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST", TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP", TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP"], "TexUnit13");
  positionTextureNext.__backupVarName = "positionTextureNext";
  positionTextureNext.__backupUniformName = "positionTextureNext";
  positionTextureNext.__backupProgram = movePoints?.ID ?? movePoints?.fragPath ?? "movePoints";
  let movePointsFBO = null;
  var __globalBlockFn_0 = async (dt) => {
    void backupRuntime.captureTaggedValue("tick", "2", "offset", offset);
    time += dt * 3;
    ;
    camera3D.tick(dt, keypress, mousepos, mouseclick);
    await meshFillerProgram.use?.();
    lastUsedProgram = meshFillerProgram;
    meshFillerProgram.tick().draw();
    await meshProgram.use?.();
    lastUsedProgram = meshProgram;
    meshProgram.setCameraPosition(camera3D.position);
    meshProgram.draw(0, 0, 640, 480, camera3D, "TRIANGLE_STRIP");
  };
  __globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
  KeyManager.OnKey("f", async (e) => {
    if (e?.repeat) return;
    openFullscreen(canvas);
  });
  KeyManager.OnKey("a", async (e) => {
    if (e?.repeat) return;
    offset.x += 0.1;
  });
  KeyManager.OnKey("d", async (e) => {
    if (e?.repeat) return;
    offset.x -= 0.1;
  });
  KeyManager.OnKey("w", async (e) => {
    if (e?.repeat) return;
    offset.y -= 0.1;
  });
  KeyManager.OnKey("s", async (e) => {
    if (e?.repeat) return;
    offset.y += 0.1;
  });
  keypress.listen();
  if (typeof __mountGlobalBlocks === "function") __mountGlobalBlocks(__globalBlocks, addFunc);
  start();
})();
//! Program Capsules (templates)
