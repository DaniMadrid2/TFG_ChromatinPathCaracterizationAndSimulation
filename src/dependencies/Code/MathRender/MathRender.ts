import {GameObject, ModernCtx, W, H, MCTX, keypress} from "../Game/Game.js"
import { Vector2D, MatrixStack, MatrixStack2D, MatrixStack3D, Matrix2D, Matrix3D, Matrix4D, Vector, ObjList, Vector3D } from "../Matrix/Matrix.mjs";
import {MathJaxLoader} from "../MathJax/MathJax.js"


export class Funcion extends GameObject{
    //offx offy eval_func step/dx startx & endx
    public offx:number=0;
    public offy:number=0;
    public scalex:number=1;
    public scaley:number=1;
    public minPX:number=0;
    public maxPX:number=W;
    public dx:number; public sx:number; public ex:number; 
    public drawtime:number=0;
    public drawingtime:number=0;
    public todraw:boolean=true;
    public drawEvrytime:boolean=false;
    public txtW:number=5;
    public maxdis:number=-1;
    public lasty:{x:number,y:number}={x:0,y:0};
    constructor(x=0,y=0,public fx:(x:number,scalex:number,scaley:number)=>number=(x)=>{return x^2},dx=2,sx=0,ex=W){
        super(x,y,W,H);
        this.dx=dx;
        this.sx=sx;this.ex=ex;
    }
    setBounds(sx=this.sx,ex=this.ex){
        this.sx=sx;this.ex=ex;
        return this;
    }
    drawEveryTime(det=true){
        this.drawEvrytime=det;
        return this;
    }
    setMaxDis(md){
        this.maxdis=md;
        return this;
    }
    setOff(x=this.offx,y=this.offy){
        this.offx=x;this.offy=y;
        return this;
    }
    setMaxDrawBounds(minpx,maxpx=this.maxPX){
        this.minPX=minpx;this.maxPX=maxpx;
        return this;
    }
    /**
     * this.bounds = this.maxdrawbounds
     */
    setEqMaxBounds(){
        this.minPX=this.sx;this.maxPX=this.ex;
        return this;
    }
    setOnAxis(axis:Axis|Vector2D){
        return this.setOff(axis.x,axis.y);
    }
    setScale(x=this.scalex,y=this.scaley){
        this.scalex=x;this.scaley=y;
        return this;
    }
    setWidth(txtW){
        this.txtW=txtW;
        return this;
    }
    setColor(color){
        this.color=color;
        return this;
    }
    setDrawTime(drawt){
        this.drawtime=drawt;
        return this;
    }
    tick(dt){
        if(this.todraw) return;
        this.drawingtime+=dt??0;
        if(this.drawingtime>=this.drawtime){
            this.todraw=true;
        }
        this?.extratick?.(dt);
    }
    extraDetect(){
        return true;
    }
    draw(ctx){
        if(!this.drawEvrytime&&!this.todraw&&this.drawtime<=0) return;
        this.todraw=false;
        let lasty={x:this.sx,y:this.eval(this.sx)};
        (this.onStart as any)?.(lasty,ctx);

        let w=this.txtW??5;
        ctx.lineWidth = w;
        ctx.strokeStyle=this.color??"black";
        let offx=0,offy=0;
        ctx.beginPath();
        let p={x:(this.sx),y:this.eval(this.sx)};
        let laspp=p;
        let toMove=false;
        ctx.moveTo((p?.x??0)*this.scalex+this.offx, (p?.y??0)*this.scaley+this.offy);
        for (let index = this.sx/this.scalex; index <= (this.ex)/this.scalex+this.dx; index+=this.dx) {
            p={x:(index),y:this.eval(index)};

            let px=p?.x??0+offx,py=p?.y??0+offy;
            if(px<-w*2+this.minPX) px=0-w*2;if(px>W+this.maxPX) px=W+w*2;
            // if(py<-w*2) py=0-w*2;if(py>H) py=H+w*2;
            if(ctx.isParseInt){
                px=parseInt(px as any);py=parseInt(py as any);
            }
            let dx=px-laspp.x,dy=py-laspp.y;
            if((Math.hypot(dx,dy)>this.maxdis&&this.maxdis>0)||!(this?.extraDetect as any)?.(dx,dy)) {
                if(!toMove){
                    ctx.lineTo(px*this.scalex+this.offx, py*this.scaley+this.offy);
                    ctx.stroke();
                    ctx.closePath();
                }
                if(index+this.dx<=this.ex){
                    toMove=true;
                }
            }else{
                if(toMove){
                    toMove=false;
                    ctx.beginPath();
                    ctx.moveTo(px*this.scalex+this.offx, py*this.scaley+this.offy);
                    
                }else{
                    ctx.lineTo(px*this.scalex+this.offx, py*this.scaley+this.offy);
                }
            }
            laspp=p;
            
        }
        if(!toMove)
        ctx.stroke();
        this.lasty=lasty;
        // ctx.lineArr(ps,this.txtW??5,this.color);
        this.onEnd?.(lasty,ctx);
    }
    eval(x){
        return -this.fx((x-this.x)*this.scalex,this.scalex,this.scaley)-this.y;
    }
    onEnd(lasty:{x:number,y:number},ctx:ModernCtx|HTMLCanvasElement){

    }
    onStart(lasty:{x:number,y:number},ctx:ModernCtx|HTMLCanvasElement){

    }

    static fromSet(arr:number[]=(new Array(100).fill(0)).map(a=>Math.random()*100)){
        return new Funcion(0,0,(x)=>{
            return arr[x]||1;
        },1,0,arr.length);
    }
}

/**
 * Storages the values up to saveEX 
 */
export class ArrayFuncion extends Funcion{
    public saveSX=0;
    public saveEX=-1;
    public storage=new Float32Array(0);
    override eval(x){
        if(this.saveSX<x&&x<this.saveEX&&this.storage[x-this.saveSX]!==undefined)
            return this.storage[x-this.saveSX];
        let val=-this.fx((x-this.x)*this.scalex,this.scalex,this.scaley)-this.y;
        if(this.saveSX<x&&x<this.saveEX&&this.storage[x-this.saveSX]===undefined){
            this.storage[x-this.saveSX]=val;
        }
        return val;
    }
    setStorage(sx=this.sx,ex=this.ex){
        let lastStorage=this.saveEX-this.saveSX;
        this.saveSX=sx;
        this.saveEX=ex;
        if(ex-sx>lastStorage){
            let newSt=new Float32Array(ex-sx);
            newSt.set(this.storage,0);
            this.storage=newSt;
        }
        return this;
    }
}

export class Funcion2D extends Funcion{
    /**
     * Left to user to describe multiple lines, just set this to true when you want a line break;
     */
    public nextToMove=false;
    lineBreak(is=true){
        this.nextToMove=is;
    }
    constructor(x=0,y=0,fx:((x:number,scalex?:number,scaley?:number)=>Vector2D|{x:number,y:number})=(x)=>{return new Vector2D(Math.cos(x),Math.sin(x)).scalar(20)},dx=2,sx=0,ex=W){
        super(x,y,fx as any,dx,sx,ex);
    }
    draw(ctx){
        if(!this.drawEvrytime&&!this.todraw&&this.drawtime>0) return;
        this.todraw=false;
        let w=this.txtW??5;
        ctx.lineWidth = ~~(w);
        ctx.strokeStyle=this.color??"black";
        let offx=0,offy=0;
        ctx.beginPath();
        let p=this.eval(this.sx) as any as Vector2D;
        let lasty={lambda:this.sx,y:p.y,x:p.x};
        let laspp:{x:number,y:number}=p;
        let laspp2=laspp;
        let tp=this.#ensure_on_View(p.x,p.y,laspp.x,laspp.y);
        p.x=tp.x;p.y=tp.y;
        let toMove=false;
        ctx.moveTo((p?.x??p?.[0]??0)+this.offx, (p?.y??p?.[1]??0)+this.offy);
        for (let index = this.sx; index <= this.ex; index+=this.dx) {
            p=this.eval(index) as any as Vector2D;
            let px=p?.x??p?.[0]??0+offx,py=p?.y??p?.[1]??0+offy;
            laspp2={x:px,y:py};
            tp=this.#ensure_on_View(px,py,laspp.x+offx,laspp.y+offy);
            p.x=tp.x-offx;p.y=tp.y-offy;
            px=tp.x;py=tp.y;
            // if(px<-w*2) px=0-w*2;if(px>W) px=W+w*2;
            // if(py<-w*2) py=0-w*2;if(py>H) py=H+w*2;
            if(ctx.isParseInt){
                px=parseInt(px as any);py=parseInt(py as any);
            }
            let dx=px-laspp.x,dy=py-laspp.y;

            if(this.nextToMove||(p as any).lineBreak){
                this.nextToMove=false;
                toMove=true;
                ctx.stroke();
            }
            // if(!!(p as any).color){
            //     colors.push((p as any).color);
            //     pointcoords.push(p.x+this.offx,p.y+this.offy)
            // }else{
            //     colors.push(this.color);
            //     pointcoords.push(p.x+this.offx,p.y+this.offy)
            // }
            
            let are_p_lastp_outside=(
                ((laspp.x+this.offx<0)||(laspp.x+this.offx>W)||(laspp.y+this.offy<0)||(laspp.y+this.offy)>H)&&
                ((p.x+this.offx<0)||(p.x+this.offx>W)||(p.y+this.offy<0)||(p.y+this.offy)>H)
            )

            if((Math.hypot(dx,dy)>this.maxdis&&this.maxdis>0)||!(this?.extraDetect as any)?.(dx,dy)) {
                if(!toMove /*&& !(Math.hypot(dx,dy)>this.maxdis&&this.maxdis>0)*/){
                    if(!are_p_lastp_outside){
                        // ctx.lineTo(px+this.offx, py+this.offy);
                        // ctx.stroke();
                    }
                }
                if(are_p_lastp_outside){
                    ctx.stroke();
                    ctx.beginPath()
                    ctx.moveTo(px+this.offx, py+this.offy);
                    // toMove=true;

                }

                if(index+this.dx<=this.ex){
                    toMove=true;
                }
            }else{
                if(toMove){
                    toMove=false;
                    ctx.beginPath();
                    ctx.moveTo(px+this.offx, py+this.offy);

                }else{
                    if(!are_p_lastp_outside)
                        ctx.lineTo(px+this.offx, py+this.offy);
                    else{
                        // ctx.closePath();
                        // ctx.stroke();
                        // ctx.beginPath();
                        ctx.moveTo(px+this.offx, py+this.offy);
                    }
                }
            }
            
            laspp=laspp2;
        }

        if(!toMove){
            ctx.stroke();
        }
        this.lasty=lasty;
    }
    public noPos=false;
    fx2d(x:number):Vector2D{
        return this.fx(x-this.x+(this.noPos?this.x:0),this.scalex,this.scaley) as any;
    }
    eval(x:number):number{
        let res=this.fx2d(x);
        res.x+=this.x;
        res.y=-res.y+this.y;
        return res as any;
    }
    #ensure_on_View(px,py,lpx,lpy):Vector2D{
        let p={x:px,y:py};
        let lastp={x:lpx,y:lpy};
        if(p==lastp) return p as any;
        // if(!(p.x+this.offx<0||p.x+this.offx>W||p.y+this.offy<0||p.y+this.offy>H)) return p as any;

        // Calculate the direction vector
        let dx = p.x - lastp.x;
        let dy = p.y - lastp.y;

        // Initialize the intersection point as p
        let intersectX = p.x;
        let intersectY = p.y;

        // Boundary check and find the intersection point
        if (p.x + this.offx < 0) {
            // Left boundary
            intersectX = 0 - this.offx;
            intersectY = lastp.y + dy * ((intersectX - lastp.x) / dx);
        } else if (p.x + this.offx > W) {
            // Right boundary
            intersectX = W - this.offx;
            intersectY = lastp.y + dy * ((intersectX - lastp.x) / dx);
        } 
        
        if (p.y + this.offy < 0) {
            // Top boundary
            intersectY = 0 - this.offy;
            intersectX = lastp.x + dx * ((intersectY - lastp.y) / dy);
        } else if (p.y + this.offy > H) {
            // Bottom boundary
            intersectY = H - this.offy;
            intersectX = lastp.x + dx * ((intersectY - lastp.y) / dy);
        }

        // Calculate the vector for pushing the point 2 pixels beyond the boundary
        let dirLength = Math.sqrt(dx * dx + dy * dy);
        let pushFactor = 2 / dirLength;

        // Move the point 2 pixels beyond the intersection
        p.x = Math.floor(intersectX + -dx * pushFactor);
        p.y = Math.floor(intersectY + -dy * pushFactor);

        return p as any;
    }
}

export class Axis extends GameObject{
    type: string;
    txtW: number;
    hideV: boolean=false;
    hideH: boolean=false;
    static globalAxis=new Axis(W/2,H/2);
    static get globalCenter(){
        return new Vector2D(this.globalAxis.x,this.globalAxis.y)
    }
    constructor(x,y){
        super(x,y,W,H,"black");
        this.type="axis";
        this.txtW=5;
    }
    set(x=this.x,y=this.y){
        this.x=x;this.y=y;
    }
    setColor(col){
        this.color=col;
        return this;
    }
    hideVertical(hide=true){
        this.hideV=hide;
        return this;
    }
    hideHorizontal(hide=true){
        this.hideH=hide;
        return this;
    }
    setWidth(txtW){
        this.txtW=txtW;
        return this;
    }
    draw(ctx){
        if(!this.hideH)
        ctx.line(0,this.y,W*2,this.y,this.txtW,this.color);
        if(!this.hideV)
        ctx.line(this.x,0,this.x,H*2,this.txtW,this.color);
    }
}




//nomap (0 1s 2s 4s)  map (0 1s 2s 4s)
var axisCols={
    map:["black","#954F00","transparent","transparent","transparent"],
    nomap:["white","#239FC3","#535353","#1E1E1E","#494949"]
};
export var addAxisCol=(name,arr:string[])=>{
    if(!name||!Array.isArray(arr)) return;
    if(arr.length<5){
        arr.concat(new Array(5-arr.length).fill("transparent"));
    }
    axisCols[name]=arr;
}

export var addMapStyle=addAxisCol;
export var mapstyle="nomap";
export var axisprops={
    four:false,
    two:false,
    one:false,
    onebasis:true,
    basis:2,
    set:(ax)=>{
        let axkeys=Object.keys(ax);
        for (let i = 0; i < axkeys.length; i++) {
            let key=axkeys[i];
            if(key=="set") continue;
            axisprops[key]=ax[key]
        } 
    }
}
export var setMapStyle=(ms:string)=>mapstyle=ms;

export class Axis2D extends GameObject{
    public unitSize=30;
    public mat=Matrix2D.fromValues([[1,0],[0,1]]) 
    public arrow1:Arrow; public arrow2:Arrow;
    public listeners:[(Arrow|Vector2D),Object&{x:number,y:number}][]=[];
    public axisprops=axisprops;
    public sx:number=20; public sy:number=20;
    constructor(center:Vector2D,mat:Matrix2D|Vector2D,v2?:Vector2D){
        super(center.x,center.y,W,H);
        if(mat instanceof Matrix2D)
            this.mat=mat;
        else if(mat instanceof Vector2D){
            if(!v2) v2=new Vector2D(0,1);
            this.mat=new Matrix2D(mat,v2);
        }
        this.arrow1=new Arrow(center.x,center.y,this.mat.vecs[0].x,this.mat.vecs[0].y,this.getColor(0)).setUS(this.US).setLineW(5)
        this.arrow2=new Arrow(center.x,center.y,this.mat.vecs[1].x,this.mat.vecs[1].y,this.getColor(1)).setUS(this.US).setLineW(5)
        this.v1.updated=()=>{this.updatedV1()};
        this.v2.updated=()=>{this.updatedV2()};
    }
    setUS(unitsize:number){
        this.unitSize=unitsize;
        this.arrow1.setUS(unitsize);
        this.arrow2.setUS(unitsize);
        return this
    }
    setAxisProps(axisprops){
        this.axisprops={...axisprops};
        return this;
    }
    get center(){
        return new Vector2D(this.x,this.y);
    }
    set center(v:Vector2D){
        this.x=v.x;
        this.y=v.y;
        this.arrow1.x=this.x;
        this.arrow1.y=this.y;
        this.arrow2.x=this.x;
        this.arrow2.y=this.y;
    }
    get v1(){
        return this.mat.vecs[0]
    }
    get v2(){
        return this.mat.vecs[1]
    }
    set v1(v1){
        this.mat.vecs[0]=v1;
        this.arrow1.vx=v1.x;
        this.arrow1.vy=v1.y;
    }
    set v2(v2){
        this.mat.vecs[1]=v2;
        this.arrow2.vx=v2.x;
        this.arrow2.vy=v2.y;
    }
    get a1(){
        return this.arrow1;
    }
    get a2(){
        return this.arrow2;
    }
    set a1(a1){
        this.arrow1=a1;
        this.v1.x=this.arrow1.vx;
        this.v1.y=this.arrow1.vy;
    }
    set a2(a2){
        this.arrow2=a2;
        this.v2.x=this.arrow2.vx;
        this.v2.y=this.arrow2.vy;
    }
    protected updatedV1(){
        if(!!this.v1){
            this.arrow1.vx=this.v1.x;
            this.arrow1.vy=this.v1.y;
        };
        this.updateListeners?.();
    }
    protected updatedV2(){
        if(!!this.v2){
            this.arrow2.vx=this.v2.x;
            this.arrow2.vy=this.v2.y;
        }
        this.updateListeners?.();
    }
    add(...arr){
        this.listeners.push(...arr.filter(v=>{
            //Handle Offseted Arrows
            if(v instanceof Arrow && (v.x!==this.x||v.y!==this.y)){
                this.add(v.getpoint(this),v.getCenterFromAxis(this));
                return false;
            }
            return !!v;
        }).map(v=>{
            if((v as any).originalAxisX===undefined&&(v as any).originalAxisY===undefined){
                // This makes it possible to change the vector/Arrow position at any moment 
                // using originalAxisX & originalAxisY
                let originalcoords=this.getCoords(v);
                (v as any).originalAxisX=originalcoords.x;
                (v as any).originalAxisY=originalcoords.y;
                return [v,()=>({x:(v as any).originalAxisX,y:(v as any).originalAxisY})];
            } else{
                return [v, this.getCoords(v)];
            }
        }) as any);
    }
    protected getCoords(v:Vector2D|Arrow){
        if(v instanceof Arrow) return {x:v.vx,y:v.vy};
        return {x:v.x,y:v.y};
    }
    protected setCoords(v:Vector2D|Arrow,{x,y}){
        if(v instanceof Arrow) {
            v.vx=x;v.vy=y;
            v.setUS(this.US);
            return
        }
        v.x=x;v.y=y;
    }
    remove(v:Vector2D|Arrow){
        let i=this.listeners.map(v=>v?.[0]).indexOf(v as any);
        if(i!==-1){
            this.listeners.splice(i,1);
        }
    }
    updateListeners(){
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i][0];
            const originalPosFunc:{x:number,y:number}|(()=>{x:number,y:number}) = this.listeners[i][1];
            let originalPos:{x:number,y:number};
            if(typeof originalPosFunc == "function"){
                originalPos=(originalPosFunc as any)();
            }else
                originalPos=originalPosFunc
            let newCoords=this.applyVector(new Vector2D(originalPos.x,originalPos.y));
            this.setCoords(listener,newCoords);
        }
    }
    // get a1(){
    //     return new Arrow(this.x,this.y,this.mat.vecs[0].x,this.mat.vecs[0].y,this.getColor(0)).setUS(this.US)
    // }
    // get a2(){
    //     return new Arrow(this.x,this.y,this.mat.vecs[1].x,this.mat.vecs[1].y,this.getColor(1)).setUS(this.US)
    // }
    getColor(i:number){
        return i<0.5?"green":"red"
    }
    draw(ctx:MCTX){
        let c1=this.v1.x;
        let c2=this.v2.x;
        let s1=-this.v1.y;
        let s2=-this.v2.y;

        let l1=this.sx;
        let l2=this.sy;
        //4s
        if(this.axisprops.four&&axisCols[mapstyle][3]!=="transparent"){
            if(this.axisprops.basis<=4){
                c1=1;
                c2=0;
                s1=-0;
                s2=-1;
            }
            //4s
            for (let i = -l1*4; i < l1*4+1; i++) {
                ctx.line(this.center.x +i/4*(c2*this.US) -c1*this.US*20,this.center.y+i/4*(s2*this.US)-s1*this.US*20,this.center.x +i/4*(c2*this.US) +c1*this.US*20,this.center.y+i/4*(s2*this.US) +s1*this.US*20,1,axisCols[mapstyle][3]);
            }
            for (let i = -l2*4; i < l2*4+1; i++) {
                ctx.line(this.center.x +i/4*(c1*this.US) -c2*this.US*20,this.center.y+i/4*(s1*this.US)-s2*this.US*20,this.center.x +i/4*(c1*this.US) +c2*this.US*20,this.center.y+i/4*(s1*this.US)+s2*this.US*20,1,axisCols[mapstyle][3]);
            }
        }
        //2s
        if(this.axisprops.two&&axisCols[mapstyle][2]!=="transparent"){
            if(this.axisprops.basis<=2){
                c1=1;
                c2=0;
                s1=-0;
                s2=-1;
            }
            //2s
            for (let i = -l1*2; i < l1*2+1; i++) {
                ctx.line(this.center.x +i/2*(c2*this.US) -c1*this.US*20,this.center.y+i/2*(s2*this.US)-s1*this.US*20,this.center.x +i/2*(c2*this.US) +c1*this.US*20,this.center.y+i/2*(s2*this.US) +s1*this.US*20,1,axisCols[mapstyle][2]);
            }
            for (let i = -l2*2; i < l2*2+1; i++) {
                ctx.line(this.center.x +i/2*(c1*this.US) -c2*this.US*20,this.center.y+i/2*(s1*this.US)-s2*this.US*20,this.center.x +i/2*(c1*this.US) +c2*this.US*20,this.center.y+i/2*(s1*this.US)+s2*this.US*20,1,axisCols[mapstyle][2]);
            }
        }
        //1s
        if(this.axisprops.one&&axisCols[mapstyle][4]!=="transparent"){
            c1=1;
            c2=0;
            s1=-0;
            s2=-1;
            //1s
            for (let i = -l1; i < l1+1; i++) {
                ctx.line(this.center.x +i*(c2*this.US) -c1*this.US*20,this.center.y+i*(s2*this.US)-s1*this.US*20,this.center.x +i*(c2*this.US) +c1*this.US*20,this.center.y+i*(s2*this.US) +s1*this.US*20,2,axisCols[mapstyle][4]);
            }
            for (let i = -l2; i < l2+1; i++) {
                ctx.line(this.center.x +i*(c1*this.US) -c2*this.US*20,this.center.y+i*(s1*this.US)-s2*this.US*20,this.center.x +i*(c1*this.US) +c2*this.US*20,this.center.y+i*(s1*this.US)+s2*this.US*20,2,axisCols[mapstyle][4]);
            }
        }
        //Basis
        if(this.axisprops.onebasis&&axisCols[mapstyle][1]!=="transparent"){
            c1=this.v1.x;
            c2=this.v2.x;
            s1=-this.v1.y;
            s2=-this.v2.y;
            //1s
            for (let i = -l1; i < l1+1; i++) {
                ctx.line(this.center.x +i*(c2*this.US) -c1*this.US*20,this.center.y+i*(s2*this.US)-s1*this.US*20,this.center.x +i*(c2*this.US) +c1*this.US*20,this.center.y+i*(s2*this.US) +s1*this.US*20,!i?2:2,(i===0)?(axisCols[mapstyle][0]):(axisCols[mapstyle][1]));
            }
            for (let i = -l2; i < l2+1; i++) {
                ctx.line(this.center.x +i*(c1*this.US) -c2*this.US*20,this.center.y+i*(s1*this.US)-s2*this.US*20,this.center.x +i*(c1*this.US) +c2*this.US*20,this.center.y+i*(s1*this.US)+s2*this.US*20,!i?2:2,(i===0)?(axisCols[mapstyle][0]):(axisCols[mapstyle][1]));
            }
        }

    }
    get US(){
        return this.unitSize;
    }
    applyMatrix(mat:Matrix2D){
        this.mat=this.mat.mult(mat);
    }
    applyVector(vec:Vector2D){
        return this.mat.multVector(vec);
    }

}
var defcols=["#7EB663","#FF7051","blue","magenta","yellow"]
export class MatrixObject extends GameObject{
    arr: any;
    colors: boolean;
    linew: number;
    defcols: string[];
    brtype: number;
    constructor(arr,x=W/4*3,y=H/4,w=50,h=50){
        super(x,y,w,h);
        this.arr=arr;
        this.colors=true;
        this.linew=4;
        this.color="white";
        this.defcols=defcols;
        this.brtype=0;
    }
    draw(ctx){
        ctx.lineWidth=this.linew;
        let wSc=1,offy=0;
        if(this.arr.length===1) {wSc=0.5;offy=this.h*1.85}
        ctx.circle(this.x-this.w*0.8,this.y,this.w/4,this.h*wSc,this.color,0,-Math.PI/2*1.22,Math.PI/2*1.22,true,false);
        ctx.circle(this.x+this.w*0.8,this.y,this.w/4,this.h*wSc,this.color,0,Math.PI/2*0.78,-Math.PI/2*0.78,true,false);

        let ws=this.arr.length;
        for (let i = 0; i < this.arr.length; i++) {
            let hs=(this.arr?.[i]?.length)||0;
            for (let j = 0; j < this.arr[i].length; j++) {
                ctx.txt(((this.arr?.[i]?.[j])||"0"),this.x+this.w/7-this.w*(1.6/hs)*Math.floor(-j+1.5),this.y-this.h*(1.6/ws)*Math.floor(-i+1.5)+offy,this.getColor(i,j,ws,hs),"40px Arial");
            }
        }
    }
    getColor(i,j,ws,hs){
        return (this.colors?(this.defcols[hs-j-1]):"white")
    }
    setDefCols(dfcs=["white","black"]){
        this.defcols=dfcs;
        return this;
    }
    setColor(col,col2=col){
        this.color=col;
        if(!!col2)
        this.getColor=()=>{
            return col2;
        }
        return this;
    }
    NoCols(cols=false){
        this.colors=cols;
        return this;
    }
    dim(){
        return Math.min(this.arr.length,(this.arr?.[0]?.length??10000));
    }
    multiply(mat){
        if(mat.dim()===this.dim()){
            let dim=mat.dim();
            let marr=mat.arr;
            let resultarr=new Array(mat.dim()).fill([]);
            //right matrix's (this) columns
            for (let i = 0; i < dim; i++) {
                for (let j = 0; j < dim; j++) {
                    resultarr[i][j] = this.arr[i].reduce((pre,curr,k)=>{return pre+curr*marr[k][j]},0);
                }
            }
            return new Matrix2D(resultarr as any);
        }
        return this;
    }
    multiplyVec2D(vec){
        return new Vector2D(this.arr[0][0]*vec.x+this.arr[1][0]*vec.y,this.arr[0][1]*vec.x+this.arr[1][1]*vec.y);
    }
    toVecs2D(){
        return [new Vector2D(this.arr[0][0],this.arr[0][1]),new Vector2D(this.arr[1][0],this.arr[1][1])];
    }
    static fromVecs2D(v1,v2){
        return new Matrix2D(new Vector2D(v1.x,v1.y),new Vector2D(v2.x,v2.y));
    }
    toText(pre="",end=""){
        
        let wtxt=pre;
        for (let i = 0; i < this.arr.length; i++) {
            wtxt+="c";
            
        }
        let brs=["(",")"];
        switch(this.brtype){
            case 1:
                brs=["[","]"];
            break;
            case 0: default:
                brs=["(",")"];
            break;
        }
        let txt="\\left"+brs[0]+" \\begin{array}{"+wtxt+"} ";
        for (let i = 0; i < (this.arr?.[0]?.length)||0; i++) {
            for (let j = 0; j < this.arr.length; j++) {
                txt+=this.arr[j][i]+"";
                if(j!==this.arr.length-1){
                    txt+=" & ";
                }
            }
            if(i!==this.arr?.[0].length-1){
                txt+=" \\\\ ";
            }
        }
        txt+=" \\end{array} \\right"+brs[1]+" "+end;
        return txt;
    }
    setBackets(brtype=0){
        this.brtype=brtype;
        return this;
    }
    toImage(w=100,h=100,r,g,b){
        return MathJaxLoader.loadEq(this.toText(),{r,g,b},{w,h});
    }
}


export class Arrow extends GameObject{
    public pinned: any;
    public drawW: number=0;
    public linew:number=2;
    public unitSize:number=30;
    public stroke=false;
    public isPoint=false;
    public isLine=false;
    constructor(x=Axis.globalCenter.x,y=Axis.globalCenter.y,vx,vy,color:string|CanvasGradient|CanvasPattern="white"){
        super(x,y,vx,vy,color)
    }
    getUnitSize():number{
        return this.unitSize;
    }
    
    setUS(unitsize:number){
        this.unitSize=unitsize;
        return this
    }
    get US():number{
        return this.unitSize;
    }
    setLineW(lw){
        this.linew=lw;
        return this;
    }
    fill(isFill=true){
        this.stroke=!isFill;
    }
    drawAsPoint(isPoint=true,w=this.linew){
        this.isPoint=isPoint;
        this.linew=w;
        return this;
    }
    drawAsLine(isLine=true,w=this.linew){
        this.isLine=isLine;
        this.linew=w;
        return this;
    }
    draw(ctx:ModernCtx&CanvasRenderingContext2D){
        if(this.dead) return;
        let x=this.vx, y=this.vy;
        let CENTER=new Vector2D(this.x,this.y);
        this.drawW=this.US*Math.hypot(x,y);
        let ang1=Math.atan2(-y,x);
        let c1=Math.cos(ang1);
        let s1=Math.sin(ang1);


        let sepang=Math.PI/24*2;//15º
        let csep2=Math.sin(-sepang+ang1+Math.PI/2);
        let ssep2=Math.cos(-sepang+ang1+Math.PI/2);
        let csep=Math.sin(sepang+ang1);
        let ssep=Math.cos(sepang+ang1);

        let pc=CENTER;
        let pv=new Vector2D(CENTER.x+c1*this.drawW,CENTER.y+s1*this.drawW);

        if(this.isPoint){//draw a circle instead of line;
            ctx.circle(pv.x,pv.y,this.linew,this.linew,this.color);
            return;
        }
        let dx=pv.x-pc.x;
        let dy=pv.y-pc.y;
        let l=Math.hypot(dx,dy);
        ctx.line(pc.x,pc.y,pv.x-dx/l*this.linew,pv.y-dy/l*this.linew,this.linew,this.color);
        if(this.isLine) return;//Dont draw arrow if its a line
        let pizq=new Vector2D(CENTER.x+c1*this.drawW-ssep2*this.US*0.1*this.linew/3-csep2*this.US*0.1*this.linew/3,
            CENTER.y+s1*this.drawW-csep2*this.US*0.1*this.linew/3+ssep2*this.US*0.1*this.linew/3);
        let pder=new Vector2D(CENTER.x+c1*this.drawW-ssep*this.US*0.1*this.linew/3-csep*this.US*0.1*this.linew/3,
            CENTER.y+s1*this.drawW-csep*this.US*0.1*this.linew/3+ssep*this.US*0.1*this.linew/3)

        let [pvx,pvy]=ctx.applyStack(...pv.vals)
        let [pizqx,pizqy]=ctx.applyStack(...pizq.vals)
        let [pderx,pdery]=ctx.applyStack(...pder.vals)
        ctx.moveTo(pizqx,pizqy);
        ctx.lineTo(pvx,pvy)
        ctx.lineTo(pderx,pdery)
        ctx.fillStyle=this.color;
        ctx.strokeStyle=this.color;
        if(this.stroke)
            ctx.stroke();
        else 
            ctx.fill();
    }
    asVector(){
        return new Vector2D(this.vx,this.vy);
    }
    get vector(){
        return this.asVector()
    }
    get vx(){
        return this.w
    }
    get vy(){
        return this.h
    }
    set vx(vx){
        this.w=vx;
    }
    set vy(vy){
        this.h=vy
    }
    get center(){
        let c=new Vector2D(this.x,this.y)
        c.updated=()=>{
            this.x=c.x;
            this.y=c.y;
        };
        return c;
    }
    getCenterFromAxis(axis:Axis2D|Vector2D){
        let [x,y]=[axis.x,axis.y];
        let c=new Vector2D((this.x-x),-(this.y-y))
        c.updated=()=>{
            this.x=c.x+x;
            this.y=-c.y+y;
        };
        return c;
    }
    getpoint(axis:Axis2D|Vector2D){
        let [x,y]=[axis.x,axis.y];
        let p=new Vector2D(this.vx+(this.x-x)/this.US,this.vy+-(this.y-y)/this.US)
        p.updated=()=>{
            this.vx=p.x+(-this.x+x)/this.US;
            this.vy=p.y+-(-this.y+y)/this.US;
        };
        return p;
    }
    get cx(){
        return this.x;
    }
    get cy(){
        return this.y;
    }
    set cx(cx){
        this.x=cx;
    }
    set cy(cy){
        this.y=cy
    }
    setVector(v:Vector2D|Vector){
        this.vx=v.x;
        this.vy=v.y;
        return this;
    }
    /**
     * Moves its center (returns itself)
    */
    translateCenter(x:Vector2D|number,y:number){
        if(x instanceof Vector2D){
            y=x.y;
            x=x.x;
        }
        this.cx+=x;
        this.cy+=y;
        return this;
    }
    /**
     * returns a new Arrow on top of itself
     */
    add(x:Arrow|Vector2D|number,y:number=0,color=this.color){
        //we're simulating our vx and vy is the difference of centers, 
        //Could we add our vx now? (not yet done)
        if(x instanceof Arrow){
            //his x in us units - our x in us units + vx in us units
            y=x.cy/x.US-this.cy/this.US+x.vy;
            x=x.cx/x.US-this.cx/this.US+x.vx;
        }else if(x instanceof Vector2D){
            y=this.cy/this.US+x.y;
            x=this.cx/this.US+x.x;
        }
        //the position in US units to global untis + our center
        return new Arrow(x*this.US+this.cx,y*this.US+this.cy,this.vx,this.vy,color).setUS(this.US);
    }
    /**
     * returns a new Arrow on top of itself, equal to this minus the other's position
     */
    substract(x:Arrow|Vector2D|number,y:number=0,color=this.color){
        if(x instanceof Arrow){
            y=-x.cy/x.US-x.vy+this.vy+this.cy/this.US;
            x=-x.cx/x.US-x.vx+this.vx+this.cx/this.US;
        }else if(x instanceof Vector2D){
            y=x.y-this.vy;
            x=x.x-this.vx;
        }
        return new Arrow(this.cx+this.vx*this.US,this.cy+this.vy*this.US,x,y,color).setUS(this.US);
    }

    /**
     * Copies arr's properties;
     * or sets its center in (arr, y) if typeof arr === "number"
     */
    set(arr:Arrow|number,y:number=0){
        if(typeof arr =="number"){
            this.x=arr;
            this.y=y;
            return;
        }
        this.x=arr.x;
        this.y=arr.y;
        this.vx=arr.vx;
        this.vy=arr.vy;
        this.stroke=arr.stroke;
        this.pinned=arr.pinned;
        this.color=arr.color;
        this.drawW=arr.drawW;
        this.linew=arr.linew;
        this.unitSize=arr.US;
    }
    length(){
        return Math.sqrt(this.vx*this.vx+this.vy*this.vy)
    }
    set _(v:Arrow){
        this.set(v);
    }
    get _():((v:Arrow)=>void){
        return (v:Arrow)=>{
            this._=v;
        }
    }
    
}

export class Ellipse extends Arrow{
    public v1:Arrow;
    public v2:Arrow;
    constructor(public axisx, public axisy, x,y,w, h,color="orange",rot=0){
        super(x,y,w,h,color);
        this.rotation=rot;
        this.v1=new Arrow(x,y,1,0,"transparent");
        this.v2=new Arrow(x,y,0,1,"transparent");
    }
    setUS(unitsize: number): this {
        super.setUS(unitsize);
        this.v1.setUS(unitsize);
        this.v2.setUS(unitsize);
        return this;
    }
    draw(ctx:MCTX){
        // const lengthX = this.v1.length();
        // const lengthY = this.v2.length();
        // const rotation = Math.atan2(-this.v1.y, this.v1.x);
        // ctx.tmpoptions.stroking=true;
        // // console.log(adjustedLengthX,adjustedLengthY,skewMagnitude)
        // ctx.circle(this.x, this.y, lengthX*this.w*this.US, lengthY*this.h*this.US,this.color, +rotation+this.rot, 0, 2 * Math.PI);
        
        ctx.save();
        ctx.translate(this.axisx,this.axisy)
        ctx.transform(this.v1.vx,-this.v1.vy,this.v2.vx,-this.v2.vy,0,0)
        ctx.tmpoptions.stroking=true;
        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.lineWidth=this.linew;
        ctx.ellipse(this.x*this.US,this.y*this.US,this.w*this.US/2,this.h*this.US/2,this.rotation,0,Math.PI*2);
        ctx.stroke()
        ctx.restore();
    }
    asVectors(){
        return [this.v1,this.v2];
    }
    get vectors(){
        return [this.v1,this.v2];
    }
}

export class Field extends ObjList<ObjList<Vector2D>>{
    /**
     * n rows
     * m cols
     */
    constructor(public n:number, public m:number){
        super();
        
    }
}



//!3D Geometry




export class Funcion3D extends Funcion2D{
    public z:number=0;
    public lastz:number=0;
    protected appply:boolean=true;
    public FOV:number=600;
    constructor(x=0,y=0,z=0,fx:((t)=>Vector3D)=(x)=>{return new Vector3D(x,0,0.1)},dx=2,sx=0,ex=W){
        super(x,y,fx as any,dx,sx,ex);
        this.z=z;
        this.appply=true;
    }
    extraDetect(){
        if(this.lastz<=0) {return false;}
        return true;
    }
    setFov(fov=this.FOV){
        this.FOV=fov;
        return this;
    }
    applyRots3d(pos,x,y,z){
        // pos.x-=this.offx;
        // pos.y-=this.offy;
        return pos;
    }
    //TODO apply 3d rotations
    setApply(aprots3d,apoffrot){
        if(aprots3d) this.applyRots3d=aprots3d;
        if(apoffrot) this.applyOffRot=apoffrot;
        return this;
    }
    applyOffRot(pos,x,y,z){
        // pos.x+=this.offx;
        // pos.y+=this.offy;

        // pos.x+=x;
        // pos.y+=y;
        return pos;
    }
    eval(x){
        let res=this.fx(x,this.scalex,this.scaley) as any as Vector3D;
        res.z??=1;
        if(this.appply)
            res=this.applyRots3d?.(res,this.x,this.y,this.z)??res;
        res.y+=this.y;
        res.x+=this.x;
        // res.z/=50;
        res.z+=(this.z??0)+this.FOV;
        if(res.z===0) res.z=0.001;
        this.lastz=res.z;
        res.x*= this.FOV/Math.abs(res.z);
        res.y*=-this.FOV/Math.abs(res.z);
        // res=this.applyOffRot?.(res,this.x,this.y,this.z)??res;
        // if(!res.x||!res.y||!res.z) {console.log(res); alert(res.x);}
        return res as any;
    }
    noApply(){
        this.appply=false;
        return this;
    }
    setPos(x:Vector3D|number,y:number=0,z:number=0){
        if (x!==undefined)
        if(typeof x =="number"){
            this.x=x;
            this.y=y;
            this.z=z;
        }else if(x.x!==undefined&&x.y!==undefined&&x.z!==undefined){
            this.x=x.x;
            this.y=x.y;
            this.z=x.z;
        }
        return this;
    }
    static fromFunc(fx?:((t)=>Vector3D),dx?:number,sx?:number,ex?:number,pos:Vector3D=Vector3D.Zero){
        let fc3d=new Funcion3D(0,0,0,fx,dx,sx,ex).setPos(pos);
        return fc3d;
    }
}
export type GeometryFuncionParamsList=[
    ((t?:number,scalex?:number,scaley?:number)=>Vector3D),
    dx?:number,
    sx?:number,
    ex?:number,
]
export type GeometryFuncionParams={
    list:GeometryFuncionParamsList
}&{create:(pos:Vector3D,axis?:Axis)=>Funcion3D};

const createGeometryGenerator=(list:GeometryFuncionParamsList,extra:((f3d:Funcion3D)=>void)=(a)=>a)=>{
    return (pos:Vector3D,axis?:Axis)=>{
        let fc3d=Funcion3D.fromFunc(...list,pos);
        pos.updated=()=>{fc3d.setPos(pos)}
        if(axis) fc3d.setOnAxis(axis);
        if(extra&&typeof extra=="function"){
            extra(fc3d);
        }
        return fc3d;
    }
}
export class GeometryLibrary3D{
    static axis3D(axisSize):GeometryFuncionParams{
        let arr:GeometryFuncionParams={
            list:[(t)=>{
                if(!t) t=0;
                let axis="x";
                if(t>axisSize){
                    axis="y"
                }
                if(t>axisSize*2){
                    axis="z";
                }
                t=t%axisSize;
            
                switch (axis) {
                    case "x":
                        return new Vector3D(t,0,0);
                    case "y":
                        return new Vector3D(0,t,0);
                    case "z":
                        return new Vector3D(0,0,0-t);
                }
                return new Vector3D(0,0,0);
            },1,0,axisSize*3],
            create:()=>(undefined as unknown as Funcion3D)
        };
        arr.create=createGeometryGenerator(arr.list,(fc3d)=>{
            fc3d.setColor("white").setWidth(2);
        })
        return arr;
    }

    static fxMesh3D(axisSize,fx:((x,y)=>number)|{func:((x,y)=>number)}=((x,y)=>0),resolution=10,color?):GeometryFuncionParams{
        // const halfWay=axisSize*(resolution+1);
        const zScale=1/10;
        const intervalLength=axisSize/resolution;
        let arr:GeometryFuncionParams={
            //let axisSize be the size length of the mesh
            //axisSize/resolution be the interval btw jumps
            
            //Well need to go vertically resolution+1 times, and horizontally resolution+1 times 
            //(+1) because of the last side

            //(resolution+1)*2
            list:[(t=0)=>{
                let nInterval = Math.floor(t);
                
                const isVertical = nInterval >= (resolution + 1)*(resolution + 1);
                nInterval %= (resolution + 1)*(resolution + 1);
                
                let y = Math.floor(nInterval / (resolution + 1));
                let x = (nInterval%(resolution+1));
                
                if(isVertical){
                    y = (nInterval%(resolution+1));
                    x = Math.floor(nInterval / (resolution + 1));
                }
                x/=(resolution+1)
                y/=(resolution+1)

                let z = 0;
                if(typeof fx=="function"){
                    z=fx(x, y);
                }else if(typeof fx.func=="function"){
                    z=fx.func(x, y);
                }
                
                let retVec= new Vector3D(
                    (x*(resolution+1) * intervalLength ) / 100/2,
                    (z ) * zScale,
                    -(y*(resolution+1) * intervalLength) / 100/2
                ).scalar(axisSize) as any;
                if((y==0&&isVertical)||(x==0&&!isVertical))
                    retVec.lineBreak=true;
                if(color&&typeof color=="function"){
                    retVec.color=color(retVec);
                }
                return retVec;
            },1,0,(resolution+1)*(resolution+1)*2-1], //where:
            //axisSize/resolution is a line divider Length
            //(resolution+1) is the number of vertical and horizontal lines well draw
            create:()=>(undefined as any as Funcion3D)
        };
        arr.create=createGeometryGenerator(arr.list,(fc3d)=>{
            fc3d.setColor("white").setWidth(2);
        })
        return arr;
    }
}














//!Waiters


//Will listen to Changers
type toWait=Changer|Function|((...args:any)=>any|void)|Object;
export class Waiter{
    public changers:toWait[]=[];
    public current:toWait=undefined as any;
    public currenti:number=0;
    public totali:number=0;
    public running:boolean=false;
    public binderrunning:boolean=false;
    public labels=new Map<string,number>()
    public handlers:Handler<any,number>[]=[];
    public binder:WaiterBinder;
    private time:number=0;
    add(...changers:toWait[]){
        //add the changer
        for (let i = 0; i < changers.length; i++) {
            if(Array.isArray(changers[i]))
                for (let j = 0; j < (changers[i] as any).length; j++) {
                    this.addSingle(changers[i][j]);
                    //OR change it to add same timers
                    
                }
            this.addSingle(changers[i])
        }
        return this;
    }
    protected addSingle(changer:toWait){
        this.changers.push(changer);
        if((changer as any)?.added) (changer as any)?.added?.(this.changers.length-1,this)
    }
    addHandler(...handlers:Handler<any,any>[]){
        //add the changer
        for (let i = 0; i < handlers.length; i++) {
            if(Array.isArray(handlers[i]))
                for (let j = 0; j < (handlers[i] as any).length; j++) {
                    this.addSingleHandler(handlers[i][j]);
                    //OR change it to add same timers
                    
                }
            this.addSingleHandler(handlers[i])
        }
        return this;
    }
    protected addSingleHandler(handler:Handler<any,any>){
        this.handlers.push(handler);
        if((handler as any)?.added) (handler as any)?.added?.(this.handlers.length-1,this)
    }
    next(dt){
        if(!!this.current&&(this.current as any).done!==undefined) (this.current as any).done=false;
        this.current=this.changers[++this.currenti];
        this.totali++;
        if(this.current===undefined){ 
            this.currenti--;
            this.totali--;
        }
        this.time=0;
        (this.current as any)?.change?.(dt,this.time,this.handlers);
        if(this.current!==undefined&&this.binder){
            this.binder.next(this);
        }
    }
    tick(dt){
        if(this.running){
            if(!this.current||this.currenti<0){
                this.next(dt)
            }
            if((!this.binder)||this.binderrunning){
                this.callChanger(this.current,dt);
                if(this.isDone(this.current)) this.next(dt)
            }
        }
        if(this.binderrunning)
            this.time+=dt;
    }
    start(){
        this.running=true;
        this.binderrunning=true;
        this.current=undefined as any;
        this.currenti=-1;
    }
    stop(){
        this.running=false;
        this.binderrunning=true;
        this.current=undefined as any;
        this.currenti=-1;
    }
    logChain(split=5){//to have a view of the chain, also add a slider to a ctx canvas, //TODO add a slider of objects to a scene
        let txts:string[]=[];
        for (let i = 0; i < this.changers.length; i++) {
            if((this.changers[i] as any)?.name)
            txts.push(
                (this.changers[i] as any).name+
                (this.isDone(this.changers[i])?" d":"")+
                ((i%split===0)?"\n":"")
            );
        }
        console.log(txts.join(","));
    }
    isDone(changer:toWait){
        // if(typeof changer=="function"){
        //     return true
        // }
        if(!!changer&&(changer as any).done!==undefined) return (changer as any).done;
        return true;
    }
    callChanger(changer:toWait,dt):void{
        if((changer as any)?.tick) return ((changer as any).tick?.(dt,this.time,this.handlers), undefined);
        if(typeof changer == "function") return changer?.(dt,this);
    }


    label(label=""){
        this.addSingle({
            added:(i)=>{
                this.labels.set(label,i)
            }
        })
    }
    static label(label=""){
        return {
            added:(i,waiter)=>{
                waiter.labels.set(label,i)
            }
        }
    }
    
    /**
     * Beware this only adds a go label, use setGoLabel to do it without the waiter flow
     */
    goLabel(label){
        this.add((dt,waiter)=>{
            waiter.currenti=waiter.labels.get(label) as any;
        })
    }
    setGoLabel(label){
        this.currenti=this.labels.get(label) as any;
    }
    /**
     * Does not go inmedietely, just returns a function that adds a goLabel function
     * when passed the waiter as second parameter
     * @returns 
     */
    static goLabel(label="",w?){
        return (dt,waiter:Waiter)=>{
            ((w??waiter) as any).currenti=(w??waiter).labels.get(label) as any;
        }
    }

    addEventListener(name,cb){
        if(!Waiter.eventListeners[name]) Waiter.eventListeners[name]=[];
        Waiter.eventListeners[name].push(cb)
    }
    waitEvent(name,cb?,anytime=false){
        if(!name) return;
        let received=false;
        let i=this.changers.length;
        this.addEventListener(name,(val?)=>{
            if(!anytime&&this.currenti!==i){
                return;
            }
            if(received&&!anytime) return;
            received=true;
            cb?.(val);
        });
        let fx={
            name:("wait Event "+name),
            done:false,
            change:()=>{
                fx.done=false;
                received=false;
            },
            tick:(dt,time)=>{
                (fx as any).done=received;
            }
        };
        this.add(fx)
    }
    static waitEvent(name,cb?,anytime=false){
        return {
            added:(i,waiter)=>{
                waiter.waitEvent(name,cb,anytime);
            }
        }
    }
    emitEvent(name,val=""){
        this.add({
            name:("emit event "+name),
            change:()=>{
                Waiter.emitEvent(name,val)
            }
        });
    }
    static getEmitEvent(name,val?){
        return {
            added:(i,waiter)=>{
                waiter.emitEvent(name,val);
            }
        }
    }
    protected static eventListeners:any=[];
    static emitEvent=(name,val="")=>{
        
        let listeners=Waiter.eventListeners[name];
        if(listeners)
            for (let i = 0; i < listeners.length; i++) {
                listeners[i]?.(val);
            }
    
    }
}

/**
 * Makes 2 waiters wait for each other to finish each step
 */
export class WaiterBinder{
    public waiter_runnings:boolean[]=[];
    public static Normal=0;
    public static Index=1;
    public static Class=2;
    public static Name=3;
    public static TotalIndex=4;
    private last;
    constructor(public type:number=4,public waiters:Waiter[]=[]){
        if(!waiters) this.waiters=[];
        for (let i = 0; i < this.waiters.length; i++) {
            this.waiter_runnings[i]=false;
            
        }
    }
    bind(...waiters:Waiter[]){
        for (let i = 0; i < waiters.length; i++) {
            this.bindWaiter(waiters[i]);
        }
    }
    bindWaiter(waiter:Waiter){
        if(!(waiter instanceof Waiter)) return;
        let i=this.waiters.indexOf(waiter);
        if(i===-1){
            this.waiters.push(waiter);
            this.waiter_runnings[this.waiters.length-1]=false;
            waiter.binder=this;
        }
    }
    unbind(waiter:Waiter){
        if(!waiter) return;
        let i=this.waiters.indexOf(waiter);
        waiter.binder=undefined as any;
        this.waiter_runnings[i]=true;
        this.waiters[i]=undefined as any;
    }
    calculateLast(i:number){
        let waiter=this.waiters[i];
        switch (this.type) {
            case WaiterBinder.Index:
                this.last=waiter.currenti;
            case WaiterBinder.TotalIndex:
                this.last=waiter.totali;
            break;
            case WaiterBinder.Class:
                this.last=waiter.current;
            break;
            case WaiterBinder.Name:
                this.last=(waiter.current as any)?.name||"func";
            break;
            case WaiterBinder.Normal: default:
                this.last=true;
            break;
        }
        return this.last;
    }
    isAsLast(i:number):boolean{
        let waiter=this.waiters[i];
        switch (this.type) {
            case WaiterBinder.Index:
                return waiter.currenti==this.last;
            case WaiterBinder.TotalIndex:
                // console.log("p",waiter.totali,this.last,this.waiters.map(w=>w.totali),this.waiter_runnings,this.waiters.map(w=>w.binderrunning))
                if(waiter.totali>=this.last){
                    this.last=waiter.totali;
                    for (let j = 0; j < this.waiters.length; j++) {
                        if(!this.waiters[j]||this.waiters[j].binder!==this){
                            this.waiter_runnings[j]=true;
                            continue;
                        }
                        this.waiter_runnings[j]=this.waiters[j].totali>=this.last;
                        this.waiters[j].binderrunning=!this.waiter_runnings[j];
                    }
                }
                // console.log("n",waiter.totali,this.last,this.waiters.map(w=>w.totali),this.waiter_runnings,this.waiters.map(w=>w.binderrunning))
                return waiter.totali>=this.last;
            case WaiterBinder.Class:
                return waiter.current.isPrototypeOf(this.last);
            case WaiterBinder.Name:
                return ((waiter.current as any)?.name||"func")==this.last;
            case WaiterBinder.Normal: default:
                return true;
        }
    }
    next(waiter:Waiter){
        //sets the waiter to stop, if every waiter that exist is stopped, set all to running
        let i=this.waiters.indexOf(waiter);
        if(i===-1) return;
        if(this.last===undefined){
            this.calculateLast(i);
        }
        if(this.isAsLast(i)){
            waiter.binderrunning=false;
            this.waiter_runnings[i]=true;
        }
        if(!this.waiter_runnings.includes(false)){
            for (let j = 0; j < this.waiter_runnings.length; j++) {
                if(this.waiters[j]&&this.waiters[j].binder==this){
                    this.waiter_runnings[j]=false;
                    this.waiters[j].binderrunning=true;
                    this.last=undefined;
                }
            }
        }
    }
}

export abstract class Changer{
    public name="Change this name to describe action";
    public done:boolean=false;
    protected startDone:boolean=false;
    constructor(public object:any=null,public cb:any=null){}
    change(...args:any){this.done=this.startDone}
    public get=()=>this.object
    public then=()=>{this?.cb?.()}
    tick(dt,time){}
    addToWaiter(waiter:Waiter){
        waiter.add(this)
        return this;
    }
}
export class KeyWaiter extends Changer{
    public name="Wait key";
    public key:string;
    constructor(key:string=" ",cb?){
        super({},cb);
        this.key=key.toLowerCase()
    }
    change(...args: any): void {
        this.done=false;
    }
    tick(dt,time){
        if(keypress[this.key])
            this.done=true;
    }
}
export class TimeWaiter extends Changer{
    public name="Wait time";
    public maxtime:number;
    public time:number=0;
    constructor(time:number=0,cb?){
        super({},cb);
        this.maxtime=time;
    }
    change(...args: any): void {
        this.done=false;
        this.time=0;
    }
    tick(dt,time){
        this.time+=dt;
        if(this.time>this.maxtime) this.done=true;   
    }
}
export class LogerW extends Changer{
    public name="Wait time";
    constructor(public txt:string|Function|any="",cb?){
        super({},cb);
        this.done=true;
    }
    tick(...args){
        this.done=true;
        if(typeof this.txt == "function")
            console.log((this.txt as any)?.(...args))
        else
            console.log(this.txt);
    }
}
export abstract class Easer{
    ease(t:number):number{return t}
    static Linear:EaserLinear;
    static EaseIn:EaserIn;
    static EaseOut:EaserOut;
    static EaseInOut:EaserInOut;
}

export class EaserConstant extends Easer{
    constructor(public constant:number=0){
        super();
    }
    ease=(t:number)=>this.constant;
}
export class EaserLinear extends Easer{
    ease=(t:number)=>t;
    static {Easer.Linear=new EaserLinear()}
}

export class EaserIn extends Easer{
    constructor(public a:number=3){
        super();
    }
    ease(t:number){
        return Math.pow(t,this.a);
    }
    static {Easer.EaseIn=new EaserIn()}
}
export class EaserOut extends Easer{
    constructor(public a:number=3){
        super();
    }
    ease(t:number){
        return 1-Math.pow(1-t,this.a);
    }
    static {Easer.EaseOut=new EaserOut()}
}

export class EaserInOut extends Easer{
    constructor(public a:number=3,public b:number=3){
        super();
    }
    ease(t:number){
        if(t<0.5){
            return Math.pow(2*t,this.a)/2
        }
        return 1-Math.pow(2*(1-t),this.b)/2;
    }
    static {Easer.EaseInOut=new EaserInOut()}
}
//Add animator so that you can have states, linearly... etc
export class PosChanger extends Changer{
    public name="Pos Set";
    public firstPos:Vector2D;
    public minTime=0; public maxTime=1;
    public easer:Easer|Function=Easer.Linear;
    constructor(obj:Object&{x:number,y:number},public toPos:Object&{x:number,y:number}=obj,public speed=1,cb?:any){
        super(obj,cb)
        if(!this.object?._){
            this.object._=({x,y})=>{this.object.x=x;this.object.y=y;}
        }
        this.firstPos=new Vector2D(obj.x,obj.y);
    }
    setEaser(ezer:Easer){
        this.easer=ezer;
        return this;
    }
    change(){
        this.done=false;
        this.firstPos=new Vector2D(this.object.x,this.object.y);
    }
    ease(t){
        if(!(this.easer instanceof Easer)&&typeof this.easer =="function") return this.easer?.(t)
        return this.easer?.ease?.(t)
    }
    tick(dt,time){
        if(this.done) return;
        let t=MathFs.clamp(time*this.speed,this.minTime,this.maxTime,0,1);
        t=this.ease(t);
        let opos=this.getObjPos(dt,time,this.firstPos,this.toPos,t);
        this.object.x=opos.x;
        this.object.y=opos.y;
        this.done=this.isDone(t);
    }
    getObjPos(dt,time,firstPos:Object&{x:number,y:number},toPos:Object&{x:number,y:number},t:number){
        return MathFs.lerp2D(this.firstPos,this.toPos,t);
    }
    isDone(t:number,...args){
        return t>=1;
    }
    setTimes(minTime=0,maxTime=1){
        this.minTime=minTime;this.maxTime=maxTime;
        return this;
    }
}

export class PosChangerByRotation extends PosChanger{
    static Closest=0;
    static ClockWise=-1;
    static CounterClockWise=1;
    static CW=-1;
    static CCW=1;
    public direction=PosChangerByRotation.Closest;
    override getObjPos(dt,time,firstPos:Object&{x:number,y:number},toPos:Object&{x:number,y:number},t:number){
        let sr=Math.hypot(firstPos.x,firstPos.y);
        let fr=Math.hypot(toPos.x,toPos.y);
        let sangle=(Math.atan2(firstPos.y,firstPos.x)+Math.PI*2)%(Math.PI*2);
        let fangle=(Math.atan2(toPos.y,toPos.x)+Math.PI*2)%(Math.PI*2);
        let angleDiff = fangle - sangle;
        // Ajustar para la dirección según el valor de this.direction
        if(this.direction===0){
            if (Math.abs(angleDiff) > Math.PI) {
                angleDiff -= Math.sign(angleDiff) * Math.PI * 2;
            }
        }else if(this.direction<0){
            if (angleDiff > 0) angleDiff -= Math.PI * 2;
        }else{
            if (angleDiff < 0) angleDiff += Math.PI * 2;
        }

        // Lerp entre radios
        let r = MathFs.lerp(sr, fr, t);

        // Lerp entre ángulos
        let angle = sangle + MathFs.lerp(0, angleDiff, t);
        return Vector2D.fromRadiusAndAngle(r,angle)
    }
    setDirection(dir:number){
        this.direction=dir;
        return this;
    }
}

/**
 * Easier will control the speed
 */
export class NearPosChanger extends PosChanger{
    public name="Near Pos Set";
    public getDirection:(x,y,fx,fy)=>{x:number,y:number}=(x,y,fx,fy)=>{
        return {x:fx-x,y:fy-y};
    };
    constructor(obj:Object&{x:number,y:number},public toPos:Object&{x:number,y:number}=obj, public speed=100,cb?:any){
        super(obj,cb)
        this.easer=(distance)=>this.speed;
    }
    tick(dt,time){
        if(this.done) return;
        let distance=Math.hypot(this.toPos.x-this.object.x,this.toPos.y-this.object.y);
        let speed=this.ease(distance);
        let direction=this.getDirection(this.firstPos.x,this.firstPos.y,this.toPos.x,this.toPos.y);
        let l=Math.hypot(direction.x,direction.y);
        if(l){
            this.object.x+=direction.x/l*speed*dt;
            this.object.y+=direction.y/l*speed*dt;
        }
        this.done=this.isDone(distance,dt,speed);
        if(this.done&&distance!==0){
            this.object.x=this.toPos.x;
            this.object.y=this.toPos.y;
        }
    }
    isDone(distance:number,dt:number,speed:number=this.speed){
        return distance<Math.abs(1.5*speed*dt);
    }
}

type Grow<T, A extends Array<T>> = 
  ((x: T, ...xs: A) => void) extends ((...a: infer X) => void) ? X : never;
type GrowToSize<T, A extends Array<T>, N extends number> = 
  { 0: A, 1: GrowToSize<T, Grow<T, A>, N> }[A['length'] extends N ? 0 : 1];

export type FixedArray<T, N extends number> = GrowToSize<T, [], N>;
export class Handler<T,L extends number> {
    constructor(public objs:T[]){
        
    }
    get(dt?,time?):FixedArray<T,L>{
        return this.objs as any;
    }
    set(obj:T|T[],i:number=0){
        if(Array.isArray(obj)) this.objs=obj;
        else this.objs[i]=obj;
    }
}

export class ChangerArr extends Changer{
    protected important:number=-1;
    protected repeat:boolean=false;
    protected handlers:Handler<any,any>[]=[];
    protected times:number[]=[];
    constructor(public changers:Changer[]=[],public handle?:any,cb?){
        super({},cb)
    }
    change(dt,time,handlers:Handler<any,any>[]=[],...args){
        this.done=false;
        if(handlers.filter)
        handlers=handlers.filter(h=>!!h&&h?.get!==undefined)
        this.handlers=handlers;
        this.callChange(dt,time,handlers,...args);
    }
    callChange(dt,time,handlers,...args){
        if(handlers){
            for (let i = 0; i < handlers.length; i++) {
                const handler = handlers[i];
                args.unshift(...handler.get(dt,time))
            }
        }
        if(typeof this.handle == "function") this.handle?.(dt,time,handlers,this.changers);
        for (let i = 0; i < this.changers.length; i++) {
            if(typeof this.changers[i]==="function"){
                (this.changers[i] as any)?.(true,dt,this.getTime(i,time),handlers,...args);
            }
            this.changers[i]?.change?.(dt,this.getTime(i,time),handlers,...args);
        }
    }
    getTime(i:number,time?){
        return this.times[i]??time;
    }
    tick(dt,time,...args){
        
        for (let i = 0; i < this.changers.length; i++) {
            if(this.repeat){
                this.times[i]??=0;
                this.times[i]+=dt;
            }
            if(typeof this.changers[i]==="function"){
                (this.changers[i] as any)?.(false,dt,this.getTime(i,time));
            }else
            if(this.changers[i].done===false) this.changers[i]?.tick?.(dt,this.getTime(i,time))
            else if(this.repeat&&!this.changers[this.important].done){
                if(this.handlers){
                    for (let i = 0; i < this.handlers.length; i++) {
                        const handler = this.handlers[i];
                        args.unshift(...handler.get(dt,this.getTime(i,time)))
                    }
                }
                this.changers[i].done=false;
                this.times[i]=0;
                if(typeof this.handle == "function") this.handle?.(dt,this.getTime(i,time),this.handlers,this.changers);
                this.changers[i]?.change?.(dt,this.getTime(i,time),this.handlers,...args);
            }
        }
        this.done=this.isDone();
    }
    isDone(){
        for (let i = 0; i < this.changers.length; i++) {
            if(this.changers[i]&&(typeof this.changers[i]!=="function")&&
                this.changers[i].done===false&&!(this.changers[i] instanceof TickMeCB)) 
                return false;
        }
        return true
    }
    untill(i:Changer|number,repeat:boolean=true){
        if(i instanceof Changer) i=this.changers.indexOf(i);
        this.important=i;
        this.repeat=repeat;
        return this;
    }
}

export class TickMeCB extends Changer{
    constructor(public fx:Function=()=>{}){
        super(undefined);
        this.done=false;
    }
    change(){
        this.done=false;
    }
    tick(...args){
        this.fx(...args);
    }
}

export class MathFs{
    static clamp(v:number,a=0,b=1,a2?,b2?){
        let val=Math.min(Math.max(v,a),b);
        if((!a2&&a2!==0)||(!b2&&b2!==0)) return val;
        return MathFs.lerp(a2,b2,val/(b-a));//a2+(b2-a2)*(val/(b-a));
    }
    static lerp(a,b,t) {
        return a+(b-a)*t;
    }
    
    static lerp2D(a:Object&{x:number,y:number},b:Object&{x:number,y:number},t) {
        return new Vector2D(MathFs.lerp(a.x,b.x,t),MathFs.lerp(a.y,b.y,t),)
    }
}



export class Selector{
    public sel=0;
    constructor(public values:any[]){

    }
    draw(ctx:MCTX){
        for (let i = 0; i < this.values.length; i++) {
            ctx.fillText(this.values[i],0,10*i);
        }
    }
    set(i=this.sel){
        this.sel=i;
        return this;
    }
    get(){
        return this.values[this.sel];
    }
}