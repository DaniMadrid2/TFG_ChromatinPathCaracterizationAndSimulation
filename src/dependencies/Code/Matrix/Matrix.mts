
export type BinaryNumberOperator = (a: number, b: number) => number;

export class ObjList<T>{
    public values:T[];
    public lastReturnValues:T[]|undefined;
    public clase=this;
    constructor(...coords:T[]|T[][]){
        let vals:T[]=[];
        for (let i = 0; i < coords.length; i++) {
            const coord:T|T[] = coords[i];
            if(Array.isArray(coord)){
                for (let j = 0; j < coord.length; j++) {
                    const c:T = coord[j];
                    vals.push(c);
                }
            }else{
                vals.push(coord as T);
            }
        }
        this.values=vals;
    }
    Fill(dim:number,val:T){
        let vals:T[]=[];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        this.values=vals;
    }
    static Fill(dim:number,val){
        let vals:any[]=[];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        return new ObjList(vals)
    }
    dim():number{
        return this.values.length;
    }
    get coords():T[]{
        return this.values;
    }
    get vals():T[]{
        return this.values;
    }
    toString(){
        let str="";
        for (let i = 0; i < this.values.length; i++) {
            const val = this.values[i];
            str+=val;
            if(i!==this.values.length){
                str+=", ";
            }
        }
        return str;
    }
    
    opp(operator:(a:T,b:T)=>T,...comps:ObjList<T>[]|number[]):ObjList<T>{
        let newValues:T[]=[];
        if (typeof comps[0]==="object"){
            let vect = comps[0];
            for (let i = 0; i < this.values.length; i++) {
                newValues[i]=operator(this.values[i],vect.values[i]);
            }
        }else{
            for (let i = 0; i < this.values.length; i++) {
                newValues[i]=operator(this.values[i],comps[i] as T);
            }
        }    
        return new ObjList<T>(newValues)
    }
    
    /**
     * Sets its value to the last operation result if avaiable
     * !Warning this wont work if multiple operations are made
     * ?Note this will only work with operations that return a Vector
     */
    val():ObjList<T>{
        if(!!this.lastReturnValues){
            this.values=this.lastReturnValues;
        }
        return this;
    }
    set(...vals){
        if(vals?.[0] instanceof ObjList)
            vals=vals?.[0].values;
        for (let i = 0; i < vals.length; i++) 
            if(typeof vals[i]=="number")
            this.values[i]=vals[i];
        if((this as any).updated&&typeof (this as any).updated=="function")
            (this as any).updated(-1);
    }
    setVal(i:number,val:T):ObjList<T>{
        this.values[i]=val;
        this.lastReturnValues=undefined;
        return this;
    }
    get(i:number):T{
        return this.values[i];
    }
    clone(vec:ObjList<T>=this):ObjList<T>{
        return new ObjList<T>(...vec.values);
    }
    static clone(vec:ObjList<any>):ObjList<any>{
        return vec.clone();
    }
    set _(v:ObjList<T>){
        this.set(v);
    }
    get _():((v:ObjList<T>)=>void){
        return (v:ObjList<T>)=>{
            this._=v;
        }
    }
}

export class Vector extends ObjList<number>{
    constructor(...coords:number[]|number[][]){
        super(...coords)
    }
    static Fill<T extends any>(dim:number,val:T){
        let vals:any[]=[];
        for (let i = 0; i < dim; i++) {
            vals.push(val);
        }
        return new Vector(vals)
    }
    static Zeros(n:number){
        return Vector.Fill(n,0);
    }
    dim():number{
        return this.values.length;
    }
    get vals():number[]{
        return this.values;
    }
    equals(v:Vector,forced=false){
        if(forced&&v.values.length!==v?.values.length) return false;
        for (let i = 0; i < Math.min(this.values.length,v?.values?.length); i++) {
            if(this.values[i]!==v?.values[i]) return false;
            
        }
    }
    toString(){
        let str="";
        for (let i = 0; i < this.values.length; i++) {
            const val = this.values[i];
            str+=val;
            if(i!==this.values.length){
                str+=", ";
            }
        }
        return str;
    }
    get getConstructor(){
        return Object.getPrototypeOf(this).constructor;
    }
    opp(operator:BinaryNumberOperator,...comps:Vector[]|number[]):Vector{
        return new this.getConstructor(super.opp(operator,...comps).values) as Vector;
    }
    add(...comps:Vector[]|number[]):Vector{

        let last= this.opp((a,b)=>a+b,...comps);
        this.lastReturnValues=last.values;
        return last;
    }
    substract(...comps:Vector[]|number[]):Vector{

        let last= this.opp((a,b)=>a-b,...comps);
        this.lastReturnValues=last.values;
        return last;
    }
    dot(...comps:Vector[]|number[]):number{
        return this.opp((a,b)=>a*b,...comps).values.reduce((a,b)=>a+b,0);
    }
    mult(...comps:Vector[]|number[]):Vector{

        let last= this.opp((a,b)=>a*b);
        this.lastReturnValues=last.values;
        return last;
    }
    multiplyScalar(scalar:number):Vector{
        let last= new this.getConstructor(this.values.map((a)=>a*scalar));
        this.lastReturnValues=last.values;
        return last;
    }
    scalar(scalar:number):Vector{
        return this.multiplyScalar(scalar);
    }
    length():number{
        return Math.sqrt(this.dot(this));
    }
    norm():number{
        return this.dot(this);
    }
    normalize():Vector{
        let len = this.length();
        if(len===0) return this;
        return this.multiplyScalar(1/len);
    }
    snap():Vector{
        return new this.getConstructor(...this.values.map(a=>(a>0.5?Math.sign(a):0)));
    }
    /**
     * Sets its value to the last operation result if avaiable
     * !Warning this wont work if multiple operations are made
     * ?Note this will only work with operations that return a Vector
     */
    val():Vector{
        if(!!this.lastReturnValues){
            this.values=this.lastReturnValues;
        }
        return this;
    }
    // set(...vals){
    //     if(vals?.[0] instanceof Vector)
    //         vals=vals?.[0].values;
    //     for (let i = 0; i < vals.length; i++) 
    //         if(typeof vals[i]=="number")
    //         this.setVal(i,vals[i]);
    // }
    // setVal(i:number,val:number=0):Vector{
    //     this.values[i]=val;
    //     this.lastReturnValues=undefined;
    //     return this;
    // }
    get(i:number):number{
        return this.values[i];
    }
    clone(vec:Vector=this):Vector{
        return new this.getConstructor(...vec.values);
    }
    static clone(vec:Vector):Vector{
        return vec.clone();
    }
    updated(){

    }
    get x():number{
        return this.values[0];
    }
    get y():number{
        return this.values[1];
    }
    get z():number{
        return this.values[2];
    }
    get w():number{
        return this.values[3];
    }
    set x(x:number){
        this.updated()
        this.values[0]=x;
    }
    set y(y:number){
        this.updated()
        this.values[1]=y;
    }
    set z(z:number){
        this.updated()
        this.values[2]=z;
    }
    set w(w:number){
        this.updated()
        this.values[3]=w;
    }
    [Symbol.iterator](){
        return this.values[Symbol.iterator]()
    }
}
export class Vector2D extends Vector{
    static Identity=new Vector2D(1,1);
    static Zero=new Vector2D(0,0);
    static XAxis=new Vector2D(1,0);
    static YAxis=new Vector2D(0,1);
    constructor(x:number,y:number){
        if(Array.isArray(x)&&y!==0&&!y){
            y=x[1];
            x=x[0];
        }
        super(x,y);
    }
    cross(vx:number|Vector2D,vy?:number):Vector2D{
        if (typeof vx==="object"){
            let vect = vx as Vector2D;
            return new Vector2D(-this.y*vect.x,this.x*vect.y)
        }else{
            if(!vy&&vy!==0) return this;
            return new Vector2D(-this.y*vx,this.x*vy);
        }
    }
    normalizedDot(vx:number|Vector2D,vy?:number):number{
        if (typeof vx==="object"){
            let vect = vx as Vector2D;
            return (-this.y*vect.x+this.x*vect.y)/(vx.dot(vx)*this.dot(this));
        }else{
            if(!vy&&vy!==0) return 0;
            return (-this.y*vx+this.x*vy)/((vx*vx+vy*vy)+this.dot(this));
        }
    }
    /** @override */
    override clone():Vector2D{
        return super.clone() as Vector2D;
    }
    get arguments(){
        return []
    }
    // set(vx:number,vy:number=0):Vector{
    //     if(typeof vx!=="number"||typeof vy!=="number") return this;
    //     this.values=[vx,vy]
    //     return this;
    // }
    static createArray(...vs){
        let v2arr:Vector2D[]=[];
        for (let i = 0; i < vs.length-1; i+=2) {
            v2arr.push(new Vector2D(vs[i],vs[i+1]));
        }
        return v2arr;
    }
    // call(){
    //     return [this.x,this.y]
    // }
    // apply(){
    //     return [this.x,this.y]
    // }
    // bind(){
    //     return [this.x,this.y]
    // }
    static fromRadiusAndAngle(r:number,ang:number){
        return new Vector2D(r*Math.cos(ang),r*Math.sin(ang));
    }
    getRadiusAndAngle():[number,number]{
        return [Math.hypot(this.x,this.y),Math.atan2(this.y,this.x)]
    }
    [Symbol.hasInstance](){
        return true
    }
}
export class Vector3D extends Vector{
    static Identity=new Vector3D(1,1,1);
    static Zero=new Vector3D(0,0,0);
    static UP=new Vector3D(0,1,0);
    static DOWN=new Vector3D(0,-1,0);
    static LEFT=new Vector3D(-1,0,0);
    static RIGHT=new Vector3D(1,0,0);
    static FRONT=new Vector3D(0,0,1);
    static BACK=new Vector3D(0,0,-1);
    constructor(x:number,y:number, z:number){
        if(Array.isArray(x)&&((y!==0&&!y)||(z!==0&&!z))){
            z=x[2];
            y=x[1];
            x=x[0];
        }
        super(x,y,z);
    }
    static From(arr:number[]){
        return new Vector3D(arr[0],arr[1],arr[2]);
    }
    isZero(){
        return this.x==0&&this.y==0&&this.z==0;
    }
    cross(vx: number | Vector3D, vy?: number, vz?: number): Vector3D {
        if (typeof vx === "object") {
            let vect = vx as Vector3D;
            const resultX = this.y * vect.z - this.z * vect.y;
            const resultY = this.z * vect.x - this.x * vect.z;
            const resultZ = this.x * vect.y - this.y * vect.x;
            return new Vector3D(resultX, resultY, resultZ);
        } else if (typeof vx === "number" && typeof vy === "number" && typeof vz === "number") {
            const resultX = this.y * vz - this.z * vy;
            const resultY = this.z * vx - this.x * vz;
            const resultZ = this.x * vy - this.y * vx;
            return new Vector3D(resultX, resultY, resultZ);
        } else {
            return this;
        }
    }
    toQuaternion(w:number=0):Quaternion{
        return new Quaternion(this.x,this.y,this.z,w);
    }
    /** @override */
    override clone():Vector3D{
        return super.clone() as Vector3D;
    }
}
export class Quaternion extends Vector{
    static Identity:Quaternion=new Quaternion(1,0,0,0);
    constructor(x:number, y:number, z:number, w:number){
        super(x,y,z,w);
    }
	multiply(q:Quaternion):Quaternion {
		// Components of the first quaternion.
		let w1 = this.w;
		let x1 = this.x;
		let y1 = this.y;
		let z1 = this.z;

		// Components of the second quaternion.
		let w2 = q.w;
		let x2 = q.x;
		let y2 = q.y;
		let z2 = q.z;
		// Components of the product.
		let w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
		let x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
		let y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
		let z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;

		return new Quaternion(x, y, z, w);
	}
	toVector3D():Vector3D {
		return new Vector3D(this.x, this.y, this.z);
	}
    toVector():Vector {
		return new Vector3D(this.x, this.y, this.z);
	}
	getScalar():number {
		return this.w;
	}
    add(q):Quaternion {
		return new Quaternion(this.x+q.x,this.y+q.y,this.z+q.z,this.w+q.w);
	}
	substract(q):Quaternion {
		return new Quaternion(this.x-q.x,this.y-q.y,this.z-q.z,this.w-q.w);
	}
	conjugate():Quaternion {
		return new Quaternion(-this.x,-this.y,-this.z,this.w);
	}
    
	dot(q:Vector):number {
		return this.w * q.w +
		this.x * q.x +
		this.y * q.y +
		this.z * q.z;
	}
    normalize(): Quaternion {
        return super.normalize() as Quaternion;
    }
    /**
     * Gira un vector3d en el espacio
     * @param point Punto a rotar
     * @param rot Eje de rotación
     * @param angle ángulo de giro
     * @returns 
     */
	static rotateVector(point:Vector3D, rot:Vector=(this as unknown as Vector), angle:number):Vector3D {
		//primero lo pasamos a cuaterniones
		let p=point.toQuaternion();
		let rotation = rot as Quaternion;
		let sin=Math.sin(angle/2);
		let cos=Math.cos(angle/2);
		
		//es: w: cos  x:x*sin   y:y*sin   z:z*sin
		var r=new Quaternion((rotation.x||0)*sin,(rotation.y||0)*sin,(rotation.z||0)*sin,cos);
		
		r=r.normalize();
		
		let rCon=r.conjugate();
		
		//la fórmula es r x P x r*
		//siendo la x el producto Hamiltoniano
        //por eso es que el ángulo se divide entre dos
		let resultP=r.multiply(p).multiply(rCon);
		return resultP.toVector3D();
	}
    static getRotQuaternion(rot:Vector=(this as unknown as Vector), angle:number){
		let rotation = rot as Quaternion;
		let sin=Math.sin(angle/2);
		let cos=Math.cos(angle/2);
		//es: w: cos  x:x*sin   y:y*sin   z:z*sin
		var r=new Quaternion((rotation.x||0)*sin,(rotation.y||0)*sin,(rotation.z||0)*sin,cos);
		r=r.normalize();
        return r;
    }
    getPositivePolarForm():Quaternion {
		if (this.w < 0) {
			let unitQ = this.normalize();
			// The quaternion of rotation (normalized quaternion) q and -q
			// are equivalent (i.e. represent the same rotation).
			return new Quaternion(-unitQ.x,
				-unitQ.y,
				-unitQ.z,
				-unitQ.w);
		} else {
			return this.normalize();
		}
	}
    toEuler() {
        const [x, y, z, w] = [this.x,this.y,this.z,this.w];
    
        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);
    
        // Pitch (y-axis rotation)
        const sinp = 2 * (w * y - z * x);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            // Use 90 degrees if out of range
            pitch = Math.sign(sinp) * (Math.PI / 2);
        } else {
            pitch = Math.asin(sinp);
        }
    
        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
        return [roll, pitch, yaw];
    }
    static fromEuler(euler:[number,number,number]){
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



type BinaryMatrixOperator = (a:MatrixNM, b: MatrixNM) => MatrixNM;
export class MatrixNM{
    /**
     * n rows
     */
    public n:number;
    /**
     * m cols, i.e. m vectos
     */
    public m:number;
    public vecs:Vector[];
    // static Identity(n,m):MatrixNM{
    //     let vecs:Vector[]=[];
    //     for (let col = 0; col < m; col++) {
    //         vecs.push(Vector.Zeros(n).set(col,1))
    //     }
    //     return new MatrixNM(vecs);
    // };
    constructor(vs:Vector[]){
        let maxn=0;
        this.m=vs.length;
        this.vecs=vs||[];
        for (let i = 0; i < vs.length; i++) {
            const v = vs[i];
            if(v.dim()>maxn){
                maxn=v.dim();
            }
        }
        this.n=maxn;
    }
    /**
     * n=3, m=2:
     * 0 0 \\\\
     * 0 0 \\\\
     * 0 0 \\\\
     */
    static Zeros(n:number,m:number):MatrixNM{
        let vecs:Vector[]=[];
        for (let col = 0; col < m; col++) {
            vecs.push(Vector.Zeros(n))
        }
        return new MatrixNM(vecs);
    }
    dim():number[]|number{
        return [this.n,this.m]
    }
    submatrix(matrix: MatrixNM, rows: number[], cols: number[]): MatrixNM {
        const subVectors: Vector[] = [];
        for (let i = 0; i < matrix.m; i++) {
            const tmpCol = matrix.vecs[i];
            if (cols.indexOf(i)!=-1) {
                let subValues:number[]=[];
                for (let j = 0; j < matrix.n; j++) {
                    if(rows.indexOf(j)!=-1){
                        subValues.push(tmpCol.values[j]||0);
                    }
                    
                }
                subVectors.push(new Vector(subValues));
            }
        }
        return new this.getConstructor(subVectors);
    }

    getInnerSquareMatrices(matrix: MatrixNM): MatrixNM[] {
        const innerMatrices: MatrixNM[] = [];
        const maxSize = Math.max(matrix.n, matrix.m);
        const minSize = Math.min(matrix.n, matrix.m);
        const nMatrices=maxSize-minSize+1;


        let rows:number[],cols:number[];
        let maxSlice=new Array(minSize).fill(1).map((v,ti)=>{return ti});
        for (let i = 0; i < nMatrices; i++) {
            let nslice=new Array(minSize).fill(1).map((v,ti)=>{return ti+i});
            if(minSize==matrix.n){//i.e. rows are smaller ==
                rows=maxSlice;
                cols=nslice;
            }else{//i.e. columns are smaller ||
                cols=maxSlice;
                rows=nslice;
            }
            const innerMatrix=this.submatrix(this,rows,cols);
            innerMatrices.push(innerMatrix)
        }
        return innerMatrices;
    }
    set(i,j,val):MatrixNM{
        this.vecs[j].values[i]=val;
        return this;
    }
    trace():number{
        let minN=Math.min(this.n,this.m);
        let sum=0;
        for (let i = 0; i < minN; i++) {
            sum+=this.get(i,i);
        }
        return sum;
    }
    /**
     * returns the multiplication of all the diagonal elements
     */
    mulTrace():number{
        let minN=Math.min(this.n,this.m);
        let mul=1;
        for (let i = 0; i < minN; i++) {
            mul*=this.get(i,i);
        }
        return mul;
    }
    get(i,j):number{
        return this.vecs[j].values[i];
    }

    public luDecomposition(): { L: MatrixNM, U: MatrixNM } {
        const rows = this.n;
        const cols = this.m;
        const L = MatrixNM.Zeros(rows,cols);
        const U = MatrixNM.Zeros(rows,cols);
    
        for (let i = 0; i < rows; i++) {
          L.set(i, i, 1); // Diagonal of L is filled with 1
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
        (L as any).det=(L.mulTrace);
        (U as any).det=(U.mulTrace);
    
        return { L, U };
      }
    /**
     * returns a number[] if the matrix its not a square matrix
     */
    determinant(): number | number[] {
        if (this.n != this.m) {
            console.log("rect")
            // Matrix is not square, calculate determinants of inner square submatrices
            const innerMatrices = this.getInnerSquareMatrices(this);
            const determinants: number[] = [];
            for (const innerMatrix of innerMatrices) {
                determinants.push(innerMatrix.determinant() as number);
            }
            return determinants;
        }
        // console.log("square")
        // Matrix is square, calculate the determinant
        if (this.n === 1) {
            // For a 1x1 matrix, the determinant is the single element
            return this.vecs[0].values[0];
        }
        
        if (this.n === 2) {
            // For a 2x2 matrix, use the simple formula
            return this.vecs[0].values[0] * this.vecs[1].values[1] -
                this.vecs[0].values[1] * this.vecs[1].values[0];
        }
        
        const {L,U}=this.luDecomposition();
        return ((L.det() as number)*(U.det() as number));
    }

    

    /**
     * returns a number[] if the matrix its not a square matrix
     */
    det(): number|number[] {
        return this.determinant();
    }

    /**
     * This differs from other libraries, it will return it row by row, instead of column by column
     */
    toString():String{
        let str="";
        for (let i = 0; i < this.vecs.length; i++) {
            str+=this.vecs[i]+"";
            if(i!==this.vecs.length-1){
                str+="\\\\ "
            }
            
        }
        return str;
    }

    static toLaTex(mat:MatrixNM,pre="",end="",brtype=0){
        
        let wtxt=pre;
        for (let i = 0; i < mat.vecs.length; i++) {
            wtxt+="c";
            
        }
        let brs=["(",")"];
        switch(brtype){
            case 1:
                brs=["[","]"];
            break;
            case 0: default:
                brs=["(",")"];
            break;
        }
        let txt="\\left"+brs[0]+" \\begin{array}{"+wtxt+"} ";
        for (let i = 0; i < (mat.vecs?.[0]?.values.length)||0; i++) {
            for (let j = 0; j < mat.vecs.length; j++) {
                txt+=mat.vecs[j].values[i]+"";
                if(j!==mat.vecs.length-1){
                    txt+=" & ";
                }
            }
            if(i!==mat.vecs?.[0]?.values.length-1){
                txt+=" \\\\ ";
            }
        }
        txt+=" \\end{array} \\right"+brs[1]+" "+end;
        return txt;
    }
    rows():Vector[]{
        const rows: Vector[] = [];
        for (let row = 0; row < this.n; row++) {
            const rowData: number[] = [];
            for (let col = 0; col < this.m; col++) {
                const vector = this.vecs[col];
                rowData.push(vector.values[row]);
            }
            rows.push(new Vector(...rowData));
        }
        return rows;
    }
    get getConstructor(){
        return Object.getPrototypeOf(this).constructor;
    }
    /**
     * It is assumed mat is applyed on the left of this matrix
     * resultN=min(n,mat.m)
     * resultM=min(m,mat.n)
     */
    mult(mat:MatrixNM):MatrixNM{
        let rows=mat.rows();
        let cols=this.vecs;
        let newCols:Vector[]=[];
        let minN=Math.min(this.n,mat.m);
        let minM=Math.min(this.m,mat.n);
        for (let nCol = 0; nCol < minM; nCol++) {
            let newColValues:number[]=[];
            for (let nRow = 0; nRow < minN; nRow++) {
                newColValues[nRow]=rows[nRow].dot(cols[nCol]);    
            }
            newCols.push(new Vector(newColValues));
        }
        return new this.getConstructor(...newCols);
    }
    multVector(vec:Vector):Vector{
        let rows=this.rows();
        let newColValues:number[]=[];
        let minN=Math.min(vec.dim(),this.n);
        for (let nRow = 0; nRow < minN; nRow++) {
            newColValues[nRow]=rows[nRow].dot(vec);    
        }
        return new vec.getConstructor(...newColValues);
    }
    static fromValues(nums: number[][]|number[], n?: number, m?:number): MatrixNM {
        if(nums&&nums[0]&&Array.isArray(nums[0])){
            m=nums.length;
            n=nums[0].length;
            nums=nums.flat() as number[];
        }
        if(!m&&n){
            let l=nums.length
            m=Math.floor(l/n);
        }
        if(!n&&m){
            let l=nums.length
            n=Math.floor(l/m);
        }
        if(!m&&!n){
            let l=nums.length
            n=m=Math.floor(Math.sqrt(l));
        }

        return this.fromValuesFlat(nums,n as any,m as any);
    }
    static fromValuesFlat(nums: number[][] | number[], n: number, m:number): MatrixNM {
        nums=nums.flat();
        let vs:Vector[]=[]
        for (let i = 0; i < m; i++) {
            let nnums:number[]=[];
            for (let j = 0; j < n; j++) {
                nnums.push(nums[i*m+j])
            }
            vs[i]=new Vector(...(nnums))
        }
        return new MatrixNM(vs);   
    }

    scale(n:number){
        n=Math.sqrt(n)
        for (let i = 0; i < this.vecs.length; i++) {
            this.vecs[i]._=this.vecs[i].multiplyScalar(n)
        }
        return this;
    }

    toArray():number[]{
        return this.vecs.map(v=>v.vals).flat();
    }
    toFloat32():Float32Array{
        return new Float32Array(this.toArray());
    }
    
    [Symbol.iterator](){
        return this.vecs.map((a:Vector)=>(a.toString()))[Symbol.iterator]();
    }
}

export class MatrixNN extends MatrixNM{
    constructor(vs:Vector[]){
        super(vs);
        let minN=Math.min(this.n,this.m);
        this.n=this.m = minN;
    }
    public static Zeros(n:number):MatrixNN{
        return super.Zeros(n,n) as MatrixNN;
    }
    getRows(){
        let rowVecs:Vector[]=[];
        for (let i = 0; i < this.n; i++) {
            let tRow=[]
            for (let j = 0; j < this.m; j++) {
                const element = this.m[j];
                
            }
            rowVecs.push(new Vector(tRow))
            
        }
        return rowVecs;
    }
    override dim():number{
        return this.n;
    }
    static fromValues(nums: number[][] | number[], n: number): MatrixNN {
        nums=nums.flat();
        let vs:Vector[]=[]
        for (let i = 0; i < n; i++) {
            let nnums:number[]=[];
            for (let j = 0; j < n; j++) {
                nnums.push(nums[i*n+j])
            }
            vs[i]=new Vector(...(nnums))
        }
        return new MatrixNN(vs);   
    }
    transpose(){
        let vecs=new Array(this.n);

        for (let i = 0; i < this.n; i++) {
            vecs[i]=new Vector(new Array(this.n));
            for (let j = 0; j < this.n; j++) {
                vecs[i].vals[j] = this.get(j,i);
            }
        }
        return new this.getConstructor(...vecs);
    }
    
}

export class Matrix2D extends MatrixNN{
    /**
     * the column vector array
     */
    public override vecs:Vector2D[]=[];
    static Identity:Matrix2D=new Matrix2D();
    constructor(v1:Vector2D=new Vector2D(1,0),v2:Vector2D=new Vector2D(0,1)){
        super([v1,v2]);
        this.vecs=[v1,v2];
    }
    determinant():number{
        return this.vecs[0].x*this.vecs[1].y-this.vecs[0].y*this.vecs[1].x;
    }
    det():number{
        return this.determinant();
    }
    set(v1:Matrix2D|Vector2D,v2:Vector2D=Vector2D.Zero):Matrix2D{
        if(v1 instanceof Matrix2D){
            this.vecs=[v1.vecs[0],v1.vecs[1]];
        }else{
            this.vecs=[v1.clone(),v2.clone()];
        }
        return this;
    }
    rows():Vector2D[]{
        return [new Vector2D(this.vecs[0].x,this.vecs[1].x),new Vector2D(this.vecs[0].y,this.vecs[1].y)];
    }
    /**
     * It wont change this matrix
     */
    mult(mat:Matrix2D):Matrix2D{
        let rows=mat.rows();
        let cols=this.vecs;
        return new Matrix2D(
            new Vector2D(cols[0].dot(rows[0]),cols[0].dot(rows[1])),
            new Vector2D(cols[1].dot(rows[0]),cols[1].dot(rows[1]))
        )
    }
    rotate(angle:number):Matrix2D{
        return this.set(this.mult(Matrix2D.fromRotation(angle)));
    }

    inverse():Matrix2D{
        let det=this.det();
        if(det==0) det=Number.EPSILON;
        return Matrix2D.fromValues([this.vecs[1].y/det,-this.vecs[0].y/det,-this.vecs[1].x/det,this.vecs[0].x/det]);
    }
    transpose():Matrix2D{
        return Matrix2D.fromValues([this.vecs[0].x,this.vecs[1].x,this.vecs[0].y,this.vecs[1].y]);
    }
    adjugate():Matrix2D{
        return Matrix2D.fromValues([this.vecs[1].y,-this.vecs[1].x,-this.vecs[0].y,this.vecs[0].x]);
    }

    static fromRotation(angle:number,scale:number=1):Matrix2D{
        return new Matrix2D(
            new Vector2D(Math.cos(angle)*scale,Math.sin(angle)*scale),
            new Vector2D(-Math.sin(angle)*scale,Math.cos(angle))
        )
    }
    /**
     * This differs from other libraries, it will return it row by row, instead of column by column
     */
    toString():String{
        return `${this.vecs[0].x}, ${this.vecs[0].y} \\\\ ${this.vecs[1].x}, ${this.vecs[1].y}`;
    }
    toArrayString():String{
        return `[${this.vecs[0].x}, ${this.vecs[0].y}, ${this.vecs[1].x}, ${this.vecs[1].y}]`;
    }
    equals(m:Matrix2D){
        return this.vecs[0].equals(m?.vecs?.[0])&&this.vecs[1].equals(m?.vecs?.[1]);
    }
    static fromValues(nums: number[][] | number[]): Matrix2D {
        nums=nums.flat();
        let vs:Vector2D[]=[]
        for (let i = 0; i < 2; i++) {
            let nnums:number[]=[];
            for (let j = 0; j < 2; j++) {
                nnums.push(nums[i*2+j])
            }
            vs[i]=new Vector2D(...(nnums as [number,number]))
        }
        return new Matrix2D(vs[0],vs[1]);   
    }

    static rotMatrix(ang:number){
        return Matrix2D.fromValues([
            [Math.cos(ang),Math.sin(ang)],
            [Math.sin(-ang),Math.cos(ang)]
        ])
    }
    static rotMatrixDeg(deg:number){
        return Matrix2D.rotMatrix(deg/180*Math.PI)
    }
    [Symbol.iterator](){
        return this.vecs.map((a:Vector)=>(a.toString()))[Symbol.iterator]();
    }
}


export class Matrix3D extends MatrixNN{
    /**
     * the column vector array
     */
    public override vecs:Vector3D[]=[];
    static Identity:Matrix3D=new Matrix3D();
    constructor(v1:Vector3D=new Vector3D(1,0,0),v2:Vector3D=new Vector3D(0,1,0),v3:Vector3D=new Vector3D(0,0,1)){
        super([v1,v2,v3]);
        this.vecs=[v1,v2,v3];
    }
    set(v1:Matrix3D|Vector3D,v2:Vector3D=Vector3D.Zero,v3:Vector3D=Vector3D.Zero):Matrix3D{
        if(v1 instanceof Matrix3D){
            this.vecs=[v1.vecs[0],v1.vecs[1],v1.vecs[2]];
        }else{
            this.vecs=[v1.clone(),v2.clone(),v3.clone()];
        }
        return this;
    }
    override mult(mat:Matrix3D):Matrix3D{
        return super.mult(mat) as Matrix3D;
    }
    rotate(phi:number, theta: number, psi:number):Matrix3D{
        return this.mult(Matrix3D.fromRotation(phi,theta,psi));
    } 
    static fromRotation(phi: number, theta: number, psi: number, scale: number = 1): Matrix3D {
        const phiRad = (phi * Math.PI) / 180;
        const thetaRad = (theta * Math.PI) / 180;
        const psiRad = (psi * Math.PI) / 180;

        const cosPhi = Math.cos(phiRad);
        const sinPhi = Math.sin(phiRad);
        const cosTheta = Math.cos(thetaRad);
        const sinTheta = Math.sin(thetaRad);
        const cosPsi = Math.cos(psiRad);
        const sinPsi = Math.sin(psiRad);

        const rotationMatrix: Vector3D[] = [
            new Vector3D(cosTheta * cosPsi*scale, cosPhi * sinPsi + sinPhi * sinTheta * cosPsi*scale, sinPhi * sinPsi - cosPhi * sinTheta * cosPsi),
            new Vector3D(-cosTheta * sinPsi*scale, cosPhi * cosPsi - sinPhi * sinTheta * sinPsi*scale, sinPhi * cosPsi + cosPhi * sinTheta * sinPsi),
            new Vector3D(sinTheta*scale, -sinPhi * cosTheta*scale, cosPhi * cosTheta),
        ];

        // Apply the scale factor if provided
        if (scale !== 1) {
            for (let i = 0; i < 9; i++) {
                rotationMatrix[i]
            }
        }

        return new Matrix3D(...rotationMatrix);
    }
    static fromValues(nums: number[][] | number[]): Matrix3D {
        nums=nums.flat();
        let vs:Vector3D[]=[]
        for (let i = 0; i < 3; i++) {
            let nnums:number[]=[];
            for (let j = 0; j < 3; j++) {
                nnums.push(nums[i*3+j])
            }
            vs[i]=new Vector3D(...(nnums as [number,number,number]))
        }
        return new Matrix3D(vs[0],vs[1],vs[2]);   
    }
}

export class Matrix4D extends MatrixNN{
    public override vecs:Quaternion[]=[];
    static Identity:Matrix4D=new Matrix4D();
    constructor(v1:Quaternion=new Quaternion(1,0,0,0),v2:Quaternion=new Quaternion(0,1,0,0),v3:Quaternion=new Quaternion(0,0,1,0),v4:Quaternion=new Quaternion(0,0,0,1)){
        super([v1,v2,v3,v4]);
        this.vecs=[v1,v2,v3,v4];
    }
    static createViewMatrix(cameraX: number, cameraY: number, cameraZ: number): Matrix4D {
        return new Matrix4D(
            new Quaternion(1, 0, 0, 0), // Row 1
            new Quaternion(0, 1, 0, 0), // Row 2
            new Quaternion(0, 0, 1, 0), // Row 3
            new Quaternion(-cameraX, -cameraY, -cameraZ, 1)         // Row 4
        );
    }
    static createProjectionMatrix(fov: number, aspectRatio: number, near: number, far: number): Matrix4D {
        const f = 1 / Math.tan((fov / 2 * Math.PI) / 360);
        const rangeInv = 1 / (near - far);
    
        return new Matrix4D(
            new Quaternion(f / aspectRatio, 0, 0, 0),               // Row 1
            new Quaternion(0, f, 0, 0),                             // Row 2
            new Quaternion(0, 0, (far + near) * rangeInv, -1), // Row 3
            new Quaternion(0, 0, 2 * far * near * rangeInv, 0)                             // Row 4
        );
    }
    static createRotationMatrix(direction: [number, number, number]|Vector3D, angle: number): Matrix4D {
        const [dx, dy, dz] = direction;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) throw new Error("Direction vector cannot be zero.");
    
        // Normalize the direction vector
        const x = dx / length, y = dy / length, z = dz / length;
    
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
    
        return new Matrix4D(
            new Quaternion(t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0), // Row 1
            new Quaternion(t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0), // Row 2
            new Quaternion(t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0), // Row 3
            new Quaternion(0, 0, 0, 1)                                              // Row 4
        );
    }
    static createLookAtMatrix(cameraPosition: [number, number, number] | Vector3D, target: [number, number, number] | Vector3D, upDirection: [number, number, number] | Vector3D=[0,1,0]): Matrix4D {
        const [cx, cy, cz] = cameraPosition;
        const [tx, ty, tz] = target;
        const [ux, uy, uz] = upDirection;
    
        // Compute the forward vector (normalized target - position)
        let fx = tx - cx, fy = ty - cy, fz = tz - cz;
        const fLength = Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx /= fLength; fy /= fLength; fz /= fLength;
    
        // Compute the right vector (normalized cross product of forward and up)
        let rx = fy * uz - fz * uy, ry = fz * ux - fx * uz, rz = fx * uy - fy * ux;
        const rLength = Math.sqrt(rx * rx + ry * ry + rz * rz);
        rx /= rLength; ry /= rLength; rz /= rLength;
    
        // Compute the true up vector (cross product of right and forward)
        const uxAdjusted = ry * fz - rz * fy;
        const uyAdjusted = rz * fx - rx * fz;
        const uzAdjusted = rx * fy - ry * fx;
    
        // Construct the look-at matrix
        return new Matrix4D(
            new Quaternion(rx, ry, rz, 0),          // Right vector
            new Quaternion(uxAdjusted, uyAdjusted, uzAdjusted, 0), // Up vector
            new Quaternion(-fx, -fy, -fz, 0),      // Forward vector (negated for camera convention)
            new Quaternion(-cx, -cy, -cz, 1)          // Camera position
        );
    }
    
    static createRotationMatrixFromDirection(cameraDir: Vector3D, upDirection: Vector3D = new Vector3D(0, 1, 0)): Matrix4D {
        // Normalize the camera direction
        const cameraDirNormalized = cameraDir;
    
        // Normalize the up direction
        const upDirNormalized = upDirection;
    
        // Compute the right vector (cross product of cameraDir and up)
        const right = cameraDirNormalized.cross(upDirNormalized);
    
        // Recompute the up vector (cross product of right and cameraDirNormalized)
        const up = right.cross(cameraDirNormalized);
    
        // Create the 4D rotation matrix
        return new Matrix4D(
            new Quaternion(right.x, right.y, right.z, 0),   // Row 1
            new Quaternion(up.x, up.y, up.z, 0),           // Row 2
            new Quaternion(-cameraDirNormalized.x, -cameraDirNormalized.y, -cameraDirNormalized.z, 0),  // Row 3
            new Quaternion(0, 0, 0, 1)                       // Row 4
        );
    }
    
    static createCameraViewMatrix(cameraPosition: Vector3D, cameraDir: Vector3D, upDirection: Vector3D = new Vector3D(0, 1, 0)): Matrix4D {
        const [cx, cy, cz] = cameraPosition;
    
        // Step 1: Create the rotation matrix from the camera direction and up direction
        let rotMatrix = Matrix4D.createRotationMatrixFromDirection(cameraDir, upDirection);
    
        // Step 2: Construct translation matrices
        let translationMatrix = new Matrix4D(
            new Quaternion(1, 0, 0, 0),       // Row 1
            new Quaternion(0, 1, 0, 0),       // Row 2
            new Quaternion(0, 0, 1, 0),       // Row 3
            new Quaternion(cx, cy, cz, 0)     // Row 4
        );
    
        let inverseTranslationMatrix = new Matrix4D(
            new Quaternion(1, 0, 0, 0),       // Row 1
            new Quaternion(0, 1, 0, 0),       // Row 2
            new Quaternion(0, 0, 1, 0),       // Row 3
            new Quaternion(-cx, -cy, -cz, 0)  // Row 4
        );
    
        // Step 3: Combine rotation with translation
        let viewMatrix = translationMatrix.mult(rotMatrix).mult(inverseTranslationMatrix) as any;
    
        return viewMatrix.transpose();
    }
    // static createLookAtMatrixFromDirection(cameraPosition: [number, number, number] | Vector3D, cameraDir: [number, number, number] | Vector3D, upDirection: [number, number, number] | Vector3D=[0,1,0]): Matrix4D {
    //     const [cx, cy, cz] = cameraPosition;
    //     const [dx, dy, dz] = cameraDir;
    //     const [ux, uy, uz] = upDirection;
    
    //     // Normalize the forward (cameraDir) vector
    //     let fx = dx, fy = dy, fz = dz;
    //     const fLength = Math.sqrt(fx * fx + fy * fy + fz * fz);
    //     fx /= fLength; fy /= fLength; fz /= fLength;
    
    //     // Compute the right vector (normalized cross product of forward and up)
    //     let rx = fy * uz - fz * uy, ry = fz * ux - fx * uz, rz = fx * uy - fy * ux;
    //     const rLength = Math.sqrt(rx * rx + ry * ry + rz * rz);
    //     rx /= rLength; ry /= rLength; rz /= rLength;
    
    //     // // Compute the true up vector (cross product of right and forward)
    //     const uxAdjusted = ry * fz - rz * fy;
    //     const uyAdjusted = rz * fx - rx * fz;
    //     const uzAdjusted = rx * fy - ry * fx;

    //     // const uxAdjusted = ux;
    //     // const uyAdjusted = ux;
    //     // const uzAdjusted = ux;
    
    //     // Construct the look-at matrix
    //     return new Matrix4D(
    //         new Quaternion(1,0,0,0),
    //         new Quaternion(0,1,0,0),
    //         new Quaternion(0,0,1,0),
    //         new Quaternion(-cx+dx/2,-cy+dx/2,-cz+dx/2,1),
    //     ).mult(
    //     new Matrix4D(
    //         new Quaternion(rx, ry, rz, 0),          // Right vector
    //         new Quaternion(uxAdjusted, uyAdjusted, uzAdjusted, 0), // Up vector
    //         new Quaternion(-fx, -fy, -fz, 0),      // Forward vector (negated for camera convention)
    //         new Quaternion(0, 0, 0, 1)          // Camera position
    //     // );
    //     )) as any;
    // }
    static createLookAtMatrixFromDirection(
        cameraPosition: [number, number, number] | Vector3D,
        cameraDir: [number, number, number] | Vector3D,
        upDirection: [number, number, number] | Vector3D = [0, 1, 0]
    ): Matrix4D {
        const [cx, cy, cz] = cameraPosition;
        let [fx, fy, fz] = cameraDir;
        let [ux, uy, uz] = upDirection;

        // Normalize forward
        const fLen = Math.hypot(fx, fy, fz);
        fx /= fLen; fy /= fLen; fz /= fLen;

        // Right = normalize(cross(forward, up))
        let rx = fy * uz - fz * uy;
        let ry = fz * ux - fx * uz;
        let rz = fx * uy - fy * ux;
        const rLen = Math.hypot(rx, ry, rz);
        rx /= rLen; ry /= rLen; rz /= rLen;

        // Recompute orthonormal up = cross(right, forward)
        const uxAdj = ry * fz - rz * fy;
        const uyAdj = rz * fx - rx * fz;
        const uzAdj = rx * fy - ry * fx;

        // Build view matrix rows
        return new Matrix4D(
            new Quaternion(rx,   uxAdj, -fx, 0),
            new Quaternion(ry,   uyAdj, -fy, 0),
            new Quaternion(rz,   uzAdj, -fz, 0),
            new Quaternion(
                -(rx * cx + ry * cy + rz * cz),
                -(uxAdj * cx + uyAdj * cy + uzAdj * cz),
                fx * cx + fy * cy + fz * cz,
                1
            )
        );
    }
    static createSnapLookAtMatrixFromDirection(
        cameraPosition: [number, number, number] | Vector3D,
        cameraDir: [number, number, number] | Vector3D,
        upDirection: [number, number, number] | Vector3D = [0, 1, 0]
    ): Matrix4D {
        const EPS = 1e-6;
        const pos = Vector3D.From([...cameraPosition]);

        // --- forward to center (what we will snap to axes) ---
        const dirToCenter = Vector3D.Zero.substract(pos).normalize() as Vector3D;

        // --- compute current camera forward and up (for roll calc) ---
        // use cameraDir param if valid, otherwise fallback to dirToCenter
        let camF = Vector3D.From([...cameraDir]).normalize() as Vector3D;
        if (isNaN(camF.x) || (Math.abs(camF.x) < EPS && Math.abs(camF.y) < EPS && Math.abs(camF.z) < EPS)) {
            camF = dirToCenter.clone();
        }
        const camUpOrig = Vector3D.From([...upDirection]).normalize() as Vector3D;

        // --- project worldUp and cameraUp onto plane perpendicular to camF ---
        const worldUp = new Vector3D(0, 1, 0);
        let projWorldUp = worldUp.substract(camF.multiplyScalar(worldUp.dot(camF))) as Vector3D;
        if (projWorldUp.length() < EPS) {
            // forward is parallel to worldUp — use Z as reference
            projWorldUp = new Vector3D(0, 0, 1).substract(camF.multiplyScalar(new Vector3D(0, 0, 1).dot(camF))) as Vector3D;
        }
        projWorldUp = projWorldUp.normalize() as Vector3D;

        let projCamUp = camUpOrig.substract(camF.multiplyScalar(camUpOrig.dot(camF))) as Vector3D;
        if (projCamUp.length() < EPS) {
            projCamUp = projWorldUp.clone(); // fallback
        }
        projCamUp = projCamUp.normalize() as Vector3D;

        // --- signed roll between projWorldUp -> projCamUp around camF ---
        const sinRoll = camF.dot(projWorldUp.cross(projCamUp));
        const cosRoll = Math.max(-1, Math.min(1, projWorldUp.dot(projCamUp)));
        const rollCurrent = Math.atan2(sinRoll, cosRoll);

        // --- snap roll to nearest 90 degrees (PI/2) ---
        const quarter = Math.PI / 2;
        const rollSnapped = Math.round(rollCurrent / quarter) * quarter;
        const deltaRoll = rollSnapped - rollCurrent;

        // --- rotate a vector around axis (Rodrigues) ---
        function rotateAroundAxis(v: Vector3D, axis: Vector3D, angle: number): Vector3D {
            const k = axis.normalize() as Vector3D;
            const cosA = Math.cos(angle), sinA = Math.sin(angle);
            // v*cosA + (k x v)*sinA + k*(k·v)*(1-cosA)
            const term1 = v.multiplyScalar(cosA);
            const term2 = k.cross(v).multiplyScalar(sinA);
            const term3 = k.multiplyScalar(k.dot(v) * (1 - cosA));
            return term1.add(term2).add(term3) as Vector3D;
        }

        // --- pre-rotate camera up by deltaRoll around camF (this snaps the roll) ---
        const adjustedUp = rotateAroundAxis(camUpOrig, camF, deltaRoll).normalize() as Vector3D;

        // --- now snap forward to nearest axis (same as before) ---
        const candidates = [
            new Vector3D( 1, 0, 0),
            new Vector3D(-1, 0, 0),
            new Vector3D( 0, 1, 0),
            new Vector3D( 0,-1, 0),
            new Vector3D( 0, 0, 1),
            new Vector3D( 0, 0,-1)
        ];
        
        // 2. Snap forward to nearest axis (by largest component, not dot)
        function snapToAxis(v: Vector3D): Vector3D {
            const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
            if (ax >= ay && ax >= az) return new Vector3D(Math.sign(v.x), 0, 0);
            if (ay >= ax && ay >= az) return new Vector3D(0, Math.sign(v.y), 0);
            return new Vector3D(0, 0, Math.sign(v.z));
        }
        const snappedForward = snapToAxis(dirToCenter);


        // --- build basis using adjustedUp but projected onto plane perpendicular to snappedForward ---
        let projectedUp = adjustedUp.substract(snappedForward.multiplyScalar(adjustedUp.dot(snappedForward))) as Vector3D;
        if (projectedUp.length() < EPS) {
            // If adjustedUp is parallel to snappedForward, pick a canonical up perpendicular to forward
            if (Math.abs(snappedForward.x) === 1) projectedUp = new Vector3D(0, 1, 0);
            else if (Math.abs(snappedForward.y) === 1) projectedUp = new Vector3D(0, 0, 1);
            else projectedUp = new Vector3D(0, 1, 0);
        }
        projectedUp = projectedUp.normalize() as Vector3D;

        const snappedRight = projectedUp.cross(snappedForward).normalize() as Vector3D;
        const snappedUp = snappedForward.cross(snappedRight).normalize() as Vector3D;

        // --- Build lookAt matrix (same layout you use) ---
        const m00 = snappedRight.x,   m01 = snappedRight.y,   m02 = snappedRight.z;
        const m10 = snappedUp.x,      m11 = snappedUp.y,      m12 = snappedUp.z;
        const m20 = snappedForward.x, m21 = snappedForward.y, m22 = snappedForward.z;

        // translation part (if you need the full view matrix; adapt if your Matrix4D expects other layout)
        const tx = -snappedRight.dot(pos);
        const ty = -snappedUp.dot(pos);
        const tz = -snappedForward.dot(pos);

        const lookAt = Matrix4D.From([
            m00, m10, m20, 0,
            m01, m11, m21, 0,
            m02, m12, m22, 0,
            0,   0,   0,   1
        ]);

        return lookAt as Matrix4D;
    }



    static createLookAt(eye: Vector3D, center: Vector3D, up: Vector3D): Matrix4D {
        const f:Vector3D = center.add(eye.multiplyScalar(-1)).normalize() as Vector3D; // forward
        const s = f.cross(up).normalize() as Vector3D;          // right
        const u = s.cross(f);                        // true up

        return new Matrix4D(
            new Quaternion(s.x, u.x, -f.x, 0),
            new Quaternion(s.y, u.y, -f.y, 0),
            new Quaternion(s.z, u.z, -f.z, 0),
            new Quaternion(-s.dot(eye), -u.dot(eye), f.dot(eye), 1)
        );
    }

    multVector3d(v:Vector3D|Vector){
        return Vector3D.From(super.multVector(new Quaternion(v.x,v.y,v.z,1)).vals);
    }

    static From(arr:number[]){
        return new Matrix4D(
            new Quaternion(arr[0],arr[1],arr[2],arr[3]),
            new Quaternion(arr[4],arr[5],arr[6],arr[7]),
            new Quaternion(arr[8],arr[9],arr[10],arr[11]),
            new Quaternion(arr[12],arr[13],arr[14],arr[15]),
        )
    }
}

export abstract class MatrixStack<T extends MatrixNM>{
    public stack:T[];
    constructor(start:T){
        this.stack = [start]; // Initialize the stack with an identity matrix
    }
    abstract push(matrix: T): T;
    last():T{
        if(this.stack.length==0) return undefined as any
        return this.stack[this.stack.length-1];
    }
    apply(v:Vector):Vector{
        return this.last().multVector(v);
    }
    /**
     * It will pop the second last
     */
    propagateBack(){
        if(this.stack.length<2) return this.last() 
        this.stack[this.stack.length-2]=this.last();
        this.stack.pop()
    }
}

export class MatrixStack2D extends MatrixStack<Matrix3D>{
    public total_rotation:number=0;
    public total_scale:Vector2D=new Vector2D(1,1);
    public total_shear:Vector2D=new Vector2D(0,0);
    public total_translation:Vector2D=new Vector2D(0,0);
    /**
     * @param {number} rotation
     * @param {Vector2D} scale
     * @param {Vector2D} shear
     */
    public total_stack:[number,Vector2D,Vector2D][]&{
        last:()=>[number,Vector2D,Vector2D],
        first:()=>[number,Vector2D,Vector2D],
        total:()=>[number,Vector2D,Vector2D]
    }=[] as any;
    constructor() {
        super(Matrix3D.Identity);
        this.total_stack.last=()=>{return this.total_stack[this.total_stack.length-1]}
        this.total_stack.first=()=>{return this.total_stack[0]}
        this.total_stack.total=()=>{return [this.total_rotation,this.total_scale,this.total_shear]}
    }
    // Push a new transformation onto the stack
    override push(matrix: Matrix3D): Matrix3D {
        const topMatrix = this.stack[this.stack.length - 1];
        const newMatrix = topMatrix.mult(matrix);
        this.stack.push(newMatrix);
        this.total_translation=newMatrix.multVector(new Vector(0,0,1)) as Vector2D;

        let new_transform:any=[0,new Vector2D(1,1),new Vector2D(0,0)]
        this.total_stack.push(new_transform);
        return newMatrix;
    }

    // Pop the top transformation from the stack
    pop(): Matrix3D {
        if (this.stack.length > 1) {
            this.total_stack.pop();
            return this.stack.pop() as Matrix3D;
        }
        return Matrix3D.Identity;
    }
    resetStack(){
        this.stack=[Matrix3D.Identity];
    }

    // Get the current transformation matrix
    getCurrentMatrix(): Matrix3D {
        return this.stack[this.stack.length - 1];
    }

    static translation(x:number,y:number):Matrix3D{
        return new Matrix3D(
            new Vector3D(1,0,0),
            new Vector3D(0,1,0),
            new Vector3D(x,y,1)
        )
    }

    translate(x: number, y: number): MatrixStack2D {
        const translationMatrix = MatrixStack2D.translation(x, y);
        this.push(translationMatrix);
        return this;
    }

    static rotation(angle:number):Matrix3D{
        return new Matrix3D(
            new Vector3D(Math.cos(angle),Math.sin(angle),0),
            new Vector3D(-Math.sin(angle),Math.cos(angle),0),
            new Vector3D(0,0,1)
        )
    }
    rotate(angle: number): MatrixStack2D {
        const rotationMatrix = MatrixStack2D.rotation(angle);
        this.push(rotationMatrix);
        this.total_rotation+=angle;
        this.total_stack.last()[0]+=angle;
        return this;
    }
    static rotationAround(angle:number,cx:number=0,cy:number=0):Matrix3D{
        const translationMatrixInv=MatrixStack2D.translation(-cx,-cy)
        const rotationMatrix = MatrixStack2D.rotation(angle);
        const translationMatrix=MatrixStack2D.translation(cx,cy)
        return translationMatrixInv.mult(rotationMatrix).mult(translationMatrix);
    }
    rotateAround(angle: number,cx:number=0,cy:number=0): MatrixStack2D {
        this.push(MatrixStack2D.rotationAround(angle,cx,cy));
        this.total_rotation+=angle;
        this.total_stack.last()[0]+=angle;
        return this;
    }

    static scaling(sx: number, sy: number):Matrix3D{
        return new Matrix3D(
            new Vector3D(sx,0,0),
            new Vector3D(0,sy,0),
            new Vector3D(0,0,1)
        )
    }
    scale(sx: number, sy: number): MatrixStack2D {
        const scalingMatrix = MatrixStack2D.scaling(sx, sy);
        this.push(scalingMatrix);
        this.total_scale.mult(sx,sy)
        this.total_stack.last()[1].mult(sx,sy)
        return this;
    }
    static shearing(sx:number=0,sy:number=0):Matrix3D{
        return new Matrix3D(
            new Vector3D(1+sx*sy,sx,0),
            new Vector3D(sy,1,0),
            new Vector3D(0,0,1)
        )
    }
    shear(sx: number, sy: number): MatrixStack2D {
        const scalingMatrix = MatrixStack2D.shearing(sx, sy);
        this.push(scalingMatrix);
        this.total_shear.add(sx,sy)
        this.total_stack.last()[2].add(sx,sy)
        return this;
    }

    
    override apply(v:Vector):Vector{
        if(v.dim()<3){
            return this.last().multVector(new Vector3D(v.x??0,v.y??0,1));
        }
        return this.last().multVector(v);
    }
}

export class MatrixStack3D extends MatrixStack<Matrix4D>{
    constructor() {
        super(Matrix4D.Identity);
        
    }

    // Push a new transformation onto the stack
    override push(matrix: Matrix4D): Matrix4D {
        const topMatrix = this.stack[this.stack.length - 1];
        const newMatrix = topMatrix.mult(matrix) as Matrix4D;
        this.stack.push(newMatrix);
        return newMatrix;
    }
}