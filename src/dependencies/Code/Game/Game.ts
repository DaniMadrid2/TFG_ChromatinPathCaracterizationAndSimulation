/**
 * Developer: danielti.com
 * Copyright 2024
*/
//**! Start of the file */
// class Class1 {
//     // Your class definition
//   }
  
//   class Class2 {
//     // Your class definition
//   }
  
//   // For ES6 modules (client-side or Node.js with ES modules)
//   export { Class1, Class2 };
  
  // For CommonJS modules (server-side with Node.js)
import { Vector2D, Vector3D, MatrixStack, MatrixStack2D, MatrixStack3D, Matrix3D, Matrix4D, Vector } from "../Matrix/Matrix.mjs";


//**! Canvas Tag */
export var H:number=720;
export var W:number=1080;

export var resizeBounds=(w,h)=>{W=w;H=h};



function ensureCanvasElement(element: HTMLElement|null|undefined): HTMLCanvasElement {
    if(!element){
        return document.createElement("canvas") as HTMLCanvasElement
    }
    if (element instanceof HTMLCanvasElement) {
        // It's already an HTMLCanvasElement, no need to convert
        return element;
    } else {
        element.id="";
        // It's not an HTMLCanvasElement, so create a new canvas element
        const canvas = document.createElement("canvas");
        
        // Copy attributes from the original element (e.g., id, width, height)
        for (const attr of element.attributes) {
            canvas.setAttribute(attr.name, attr.value);
        }
        element.parentNode?.replaceChild(canvas, element);
        
        return canvas;
    }
}

interface CanvasCtxTuple { //here in code is usually named collec
    canvas: HTMLCanvasElement&ModernCanvas;
    ctx: CanvasRenderingContext2D;
    append: () => CanvasCtxTuple;
    center: (ops?:ModernCanvasOptions) => CanvasCtxTuple;
    modern: () => ModernCanvasCtxTuple;
}
interface ModernCanvasCtxTuple {
    canvas: HTMLCanvasElement&ModernCanvas;
    ctx: ModernCtx&CanvasRenderingContext2D;
    append: () => ModernCanvasCtxTuple;
    center: (ops?:ModernCanvasOptions) => ModernCanvasCtxTuple;
}
export function createCanvas(id="c1",w=1080,h=720,sc?:Scene,contexttype="2d"):CanvasCtxTuple{
    let canvas=ensureCanvasElement(document.getElementById(id) as HTMLCanvasElement);
    if(!!id)
        canvas.id=id;
    canvas.width=w;canvas.height=h;
    let ctx=(canvas).getContext(contexttype,{willReadFrequently:true});
    let collec: CanvasCtxTuple = {
        canvas,
        ctx,
        append: ():CanvasCtxTuple => {
            document.body.appendChild(canvas);
            return collec;
        },
        center: (ops?:ModernCanvasOptions):CanvasCtxTuple =>{
            if(!ops||typeof ops !== "object") ops={};
            ops.contexttype=contexttype;
            ModernCanvas(canvas,{maxRes:true,...ops});
            return collec;
        },
        /**
         * Notice: If autoadd is set, it will add the layer automatically to the scene specified in createCanvas
         * @param {boolean} autoadd - By default true, this will automatically add the layer to its parent scene
         */
        modern: (layer=new Layer(canvas.id,collec.canvas,sc??new Scene()),autoadd=true):ModernCanvasCtxTuple =>{
            layer?.scene?.addLayer?.(layer)
            let newcollect:ModernCanvasCtxTuple={
                canvas:collec.canvas,
                ctx:(new ModernCtx(collec.ctx,layer) as ModernCtx&CanvasRenderingContext2D),
                append: ():ModernCanvasCtxTuple => {
                    document.body.appendChild(canvas);
                    return newcollect;
                },
                center: (ops?:ModernCanvasOptions):ModernCanvasCtxTuple =>{
                    if(!ops||typeof ops !== "object") ops={};
                    ModernCanvas(canvas,{maxRes:true,...ops});
                    return newcollect;
                },
            }
            
            return newcollect;
        },
    } as CanvasCtxTuple;
    return collec;
}

if (typeof window === 'undefined') {
    (globalThis as any).window = {};
  }
  
  if (typeof document === 'undefined') {
    (globalThis as any).document = {
      createElement: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      // Add other methods or properties as needed
    };
  }

export interface ModernCanvasOptions {
    absolute?: boolean;
    boundingBox?: { x?: number|(()=>number); y?: number|(()=>number); w?: any|(()=>number); h?: any|(()=>number) };
    slidePercentage?: number;
    autoResize?: boolean;
    maxRes?: boolean;
    preserveAspectRatio?: boolean;
    father?: HTMLElement|Window|null;
    contexttype?: string;
}
function posY(elm:HTMLElement) {var test = elm, top = 0;while(!!test && test.tagName.toLowerCase() !== "body") {top += test.offsetTop; test = test.offsetParent as HTMLElement;}return top;}
function viewPortHeight() {var de = document.documentElement;if(!!window?.innerWidth){ return window?.innerHeight; }else if( de && !isNaN(de.clientHeight) ){ return de.clientHeight; }return 0;}
function scrollY() {if( window?.scrollY!==undefined ) { return window?.scrollY; }return Math.max(document.documentElement.scrollTop, document.body.scrollTop);}
// function checkvisible( elm:HTMLElement ) {var vpH = viewPortHeight(), st = scrollY(), y = posY(elm);return (y > (vpH + st));}
function checkvisible( elm:HTMLElement ) {
    const bbox = elm.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    return (
        bbox.bottom >= 0 &&
        bbox.right >= 0 &&
        bbox.top <= windowHeight &&
        bbox.left <= windowWidth
    );
}

function ensureSlideContainer(canvas: HTMLCanvasElement, boundingBox: any, absolute=false,father?, resizeWithFather=false,boundOptions?) {
    boundOptions??=boundingBox;
    let container = canvas.parentElement;
    (canvas as any).isVisible=(canvas as any).setVisible=(canvas as any).Visi=(canvas as any).visi=(canvas as any).visible=(canvas as any).Visible=checkvisible(canvas);
    // Check if parent is already the canvasSlideContainer
    if (!container || !container.classList.contains("canvasSlideContainer")) {
        container = document.createElement("div");
        container.classList.add("canvasSlideContainer");
        const clases = canvas.classList;

        // Transfiriendo las clases al elemento de destino
        clases.forEach(clase => {
            (!!container)&&container.classList.add(clase);
        });
        canvas.before(container);
        container.appendChild(canvas);
    }
    
    // Set the dimensions for the container
    
    if(typeof ((typeof boundingBox?.w=="function"&&boundingBox?.w?.())??boundingBox.w??0)=="number")
        container.style.width = `${(typeof boundingBox?.w=="function"&&(((boundingBox?.w?.()))))||boundingBox.w||0}px`;
    if(typeof ((typeof boundingBox?.h=="function"&&boundingBox?.h?.())??boundingBox.h??0)=="number")
        container.style.height = `${(typeof boundingBox?.h=="function"&&(((boundingBox?.h?.()))))||boundingBox.h||0}px`;
    
    if(resizeWithFather&&father instanceof HTMLElement){
        if(typeof (((typeof boundOptions.w =="function"&&boundOptions.w?.())??boundOptions.w))=="string"){
            container.style.width = "100%";
        }
        if(typeof (((typeof boundOptions.h =="function"&&boundOptions.h?.()))??boundOptions.h) == "string")
            container.style.height = father.style.height;
    }

    container.style.boxSizing = "border-box";
    let isXFunc=(typeof boundingBox?.x=="function");
    let xval=(isXFunc&&boundingBox?.x?.(canvas))??boundingBox.x??0;
    if(typeof xval =="string"&&/\d$/.test(xval)||typeof xval!="string"){
        xval=(xval||0)+"px";
    }

    let isYFunc=(typeof boundingBox?.y=="function");
    let yval=(isYFunc&&boundingBox?.y?.(canvas))??boundingBox.y??0;
    if(typeof yval =="string"&&/\d$/.test(yval)||typeof yval!="string"){
        yval=(yval||0)+"px";
    }
    if(absolute){
        container.style.position="absolute";
        container.style.left=xval;
        container.style.top=yval;
    }else{
        container.style.marginLeft=xval;
        container.style.marginTop=yval;
        container.style.position = "relative";
    }

    return container;
}

export interface ModernCanvas{
    resize:()=>void
    slidePercentage:number
    setSlide:(slide:number)=>void,
    ctx:ModernCtx&CanvasRenderingContext2D,
    openFullScreen:()=>void,
    visible:boolean,
    recheckVisible:()=>void,
    cantPause:boolean,
    running:boolean,
    boundingBox:{x:number|(()=>number),y:number|(()=>number),w:number|(()=>number),h:number|(()=>number)}
}

export function ModernCanvas(
    canvas: HTMLCanvasElement,
    options: ModernCanvasOptions = {}
): HTMLCanvasElement&ModernCanvas {
    let {
        absolute = true,
        slidePercentage = 0,
        autoResize = true,
        maxRes = absolute,
        preserveAspectRatio=true,
        father
    }:ModernCanvasOptions = options;
    ((canvas as any).boundingBox)={...options}?.boundingBox||{
        x: 0,
        y: 0,
        w: window?.innerWidth,
        h: window?.innerHeight,
    }
    if((typeof options?.boundingBox?.w=="function"&&options?.boundingBox?.w?.())||options?.boundingBox?.w) ((canvas as any).boundingBox).w=options.boundingBox.w;
    if((typeof options?.boundingBox?.h=="function"&&options?.boundingBox?.h?.())||options?.boundingBox?.h) ((canvas as any).boundingBox).h=options.boundingBox.h;
    (canvas as any).running=true;
    (canvas as any).isVisible=(canvas as any).setVisible=(canvas as any).Visi=(canvas as any).visi=(canvas as any).visible=(canvas as any).Visible=checkvisible(canvas);
    (canvas as any).recheckVisible=()=>{
        let is=checkvisible(canvas);
        (canvas as any).isVisible=(canvas as any).setVisible=(canvas as any).Visi=(canvas as any).visi=(canvas as any).visible=(canvas as any).Visible=is;
        return is;
    }
    
    const originalBounding=options.boundingBox;
    if(father===undefined) father=window;
    if(father===null) father=canvas.parentElement;

    function resizeCanvas(again=false) {
        if((canvas as any).slidePercentage){
            slidePercentage=(canvas as any).slidePercentage as number;
            slidePercentage=Math.min(1,Math.max(-1,slidePercentage))
        }
        const canvasAspectRatio = canvas.width / canvas.height;
        // ((canvas as any).boundingBox).x??=0;((canvas as any).boundingBox).y??=0;
        ensureSlideContainer(canvas, ((canvas as any).boundingBox),absolute,father,maxRes&&!!father,originalBounding);
        // if(maxRes){
        //     if(father==window){
        //         ((canvas as any).boundingBox).w=window?.innerWidth;
        //         ((canvas as any).boundingBox).h=window?.innerHeight;
        //     }else if(father instanceof HTMLElement){
        //         let boundingRect=(father as HTMLElement).getBoundingClientRect()
        //         if(((typeof ((canvas as any).boundingBox).w=="function")&&(typeof ((canvas as any).boundingBox).w?.() == "string"))||(typeof ((canvas as any).boundingBox).w == "string"))
        //             ((canvas as any).boundingBox).w=boundingRect.width;
        //         if(((typeof ((canvas as any).boundingBox).h=="function")&&(typeof ((canvas as any).boundingBox).h?.() == "string"))||(typeof ((canvas as any).boundingBox).h == "string"))
        //             ((canvas as any).boundingBox).h=boundingRect.height;
        //     }
        // }
        const bbox = ((canvas as any).boundingBox);
        const bboxw = (typeof bbox.w === "function" && bbox?.w?.()) || bbox?.w || 0;
        const bboxh = (typeof bbox.h === "function" && bbox?.h?.()) || bbox?.h || 1;

        // Function to normalize dimensions
        function normalizeDimension(value) {
            if (typeof value === "number") {
                return value + "px"; // Append "px" for number values
            } else if (typeof value === "string") {
                if(/\d$/.test(value)) value=value+"px";
                return value; // Return the string as is (handles percentages and px)
            }
            return "0px"; // Default fallback
        }

        // Normalize bboxw and bboxh
        const normalizedBboxw = normalizeDimension(bboxw);
        const normalizedBboxh = normalizeDimension(bboxh);

        const boundingBoxAspectRatio = parseFloat(normalizedBboxw) / parseFloat(normalizedBboxh); // Calculate the aspect ratio

        // Adjust canvas size
        if (preserveAspectRatio) {
            // Adjust canvas size while preserving aspect ratio
            if (canvasAspectRatio > boundingBoxAspectRatio) {
                canvas.style.width = normalizedBboxw; // Set width directly
                // Use calc for height calculation, keeping the percentage or pixel mix intact
                canvas.style.height = `calc(${normalizedBboxw} / ${canvasAspectRatio})`;
            } else {
                canvas.style.height = normalizedBboxh; // Set height directly
                // Use calc for width calculation
                canvas.style.width = `calc(${normalizedBboxh} * ${canvasAspectRatio})`;
            }
        } else {
            // Set the width and height independently without preserving aspect ratio
            canvas.style.width = normalizedBboxw;
            canvas.style.height = normalizedBboxh;
        }

        // Calculate the maximum slide amount using calc and preserve percentage/pixel mix
        const maxSlideX = `calc((100% - ${normalizedBboxw}) / 2)`;
        const maxSlideY = `calc((100% - ${normalizedBboxh}) / 2)`;

        // Calculate offsets using calc
        const leftOffset = `calc((${normalizedBboxw} - (${normalizedBboxh} * ${canvasAspectRatio})) / 2 - ${maxSlideX} * ${slidePercentage})`;
        const topOffset = `calc((${normalizedBboxh} - (${normalizedBboxw} / ${canvasAspectRatio})) / 2 - ${maxSlideY} * ${slidePercentage})`;

        // Update canvas positioning using calc() and dynamic values
        if (canvasAspectRatio < boundingBoxAspectRatio) {
            canvas.style.left = preserveAspectRatio ? leftOffset : "0px";
            canvas.style.top = "0px";
        } else {
            canvas.style.top = preserveAspectRatio ? topOffset : "0px";
            canvas.style.left = "0px";
        }




        if (!again) {
            canvas.style.position = "relative";
        }
    }

    // Initial resize
    resizeCanvas();
    (canvas as any).resize=resizeCanvas;
    (canvas as any).setSlide=(p=(canvas as any).slidePercentage)=>{(canvas as any).slidePercentage=p};

    if (autoResize) {
        // Add event listener for window resize
        window?.addEventListener?.("resize", ()=>{resizeCanvas(true)});
    }
    (canvas as any).ctx=canvas.getContext(options.contexttype||"2d");
    (canvas as any).openFullScreen=(canvas)=>{openFullscreen(canvas)}
    return (canvas as any);
}

//**! Ctx Tab */
type ModernCtxOptions={
    noApplyStack?:boolean,
    stroking?:boolean,
    /**@note If true drawn shapes will be drawn by center, else by top left corner */
    posStyle?:boolean
}
export interface ModernCtx{
    canvas:HTMLCanvasElement&ModernCanvas
}
export class ModernCtx {
    public options:ModernCtxOptions={
        noApplyStack:false,
        stroking:false,
        /**@note If true drawn shapes will be drawn by center, else by top left corner */
        posStyle:false
    }
    public tmpoptions:ModernCtxOptions={}
    private innerRotation=0;
    public lastDrawnLayer;
    public lastDrawnScene;
    constructor(private ctx: CanvasRenderingContext2D,public layer:Layer) {
         // Attach the layer property to ctx
         (ctx as any).layer = layer;
         this.lastDrawnLayer=layer;
        
         for (let key of Object.getOwnPropertyNames(ModernCtx.prototype)) {
            if (key !== "constructor" && typeof this[key] === "function") {
                // if(!!ctx[key])
                ctx[key] = this[key].bind(this);
            }
        }
         // Assign methods from ModernCtx to ctx
         Object.assign(ctx, this);


         return ctx as ModernCtx & CanvasRenderingContext2D;
    }
    setLastScene(sc:Scene){
        this.lastDrawnScene=sc;
    }
    openFullScreen(ctx:ModernCtx=this){
        openFullscreen(ctx.ctx.canvas);
    }
    setTmpOption(name,val=true){
        this.tmpoptions[name]=val;
        return this;
    }
    getOption(name):any|boolean{
        if(this.tmpoptions[name]!==undefined) return this.tmpoptions[name]
        return this.options[name]
    }
    applyStack(...coords: number[]):number[]{
        if(coords.length<2) return coords
        let x,y,w,h;
        if(coords.length<4){
            w=0,h=0
        }else{
            w=coords[2]
            h=coords[3]
        }
        x=coords[0]
        y=coords[1]
        if(this.getOption('posStyle')){
            [x,y] = [x-w/2,y-h/2]
        }

        if(this.getOption('noApplyStack')) return [x,y];

        if ((this?.lastDrawnScene)?.stack?.apply)
            [x,y] = (this.lastDrawnScene).stack.apply(new Vector(x,y)).values;
        // console.log(this?.lastDrawnScene?.cam);
        if((this?.lastDrawnScene||this?.lastDrawnLayer?.scene)?.cam?.transformMatrix){
            [x,y] = (this.lastDrawnScene||this.lastDrawnLayer.scene).cam.transformMatrix.multVector(new Vector(x,y,1)).values
        }

        
        return [x,y]
    }
    applyRotation(angle,cx=0,cy=0){

    }
    rect(x: number=0, y: number=0, w?: number, h?: number, color: string|CanvasGradient|CanvasPattern = "black") {
        h??=this.layer.getHeight();
        w??=this.layer.getWidth();
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        [x,y]=this.applyStack(x,y,w,h);
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        if (this.getOption('stroking')) {
            this.ctx.beginPath()
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.closePath()
        } else {
            this.ctx.beginPath()
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, w, h);
            this.ctx.closePath()
        }
    }
    rRect=(x: number=0, y: number=0, w?: number, h?: number, color: string|CanvasGradient|CanvasPattern = "black", rot:number=0)=>{
        h??=this.layer.getHeight();
        w??=this.layer.getWidth();
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        [x,y]=this.applyStack(x,y,w,h);
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        
        // offx??=this.ctx?.lastStyle?.offx??0;
        // offy??=this.ctx?.lastStyle?.offy??0;
        this.ctx.save();
        this.ctx.fillStyle=color;
        this.ctx.translate( x+w/2, y+h/2 );
        this.ctx.rotate(rot);
        if (this.getOption('stroking')) {
            this.ctx.beginPath()
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(-w/2, -h/2, w,h);
            this.ctx.closePath()
        } else {
            this.ctx.beginPath()
            this.ctx.fillStyle = color;
            this.ctx.fillRect(-w/2, -h/2, w,h);
            this.ctx.closePath()
        }
        this.ctx.restore();
    }

    rectTopLeft(x: number=0, y: number=0, w?: number, h?: number, color: string|CanvasGradient|CanvasPattern = "black") {
        h??=this.layer.getHeight();
        w??=this.layer.getWidth();
        this.rect(x+w/2,y+h/2,w,h,color);
    }

    /**
     * circles will always be drawn from the center
     */
    circle(x: number=0, y: number=0, w?: number, h?: number, color: string|CanvasGradient|CanvasPattern = "black",rot=0,st=0,et=Math.PI*2,way=true) {
        w??=100;
        h??=w;
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        w/=2;//w being the diameter not the radius
        h/=2;//h being the diameter not the radius
        [x,y]=this.applyStack(x,y)
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        if (this.getOption("stroking")) {
            this.ctx.beginPath()
            this.ctx.strokeStyle = color;
            this.ctx.ellipse(x,y,w,h,rot,st,et,way)
            this.ctx.closePath()
            this.ctx.stroke()
        } else {
            this.ctx.beginPath()
            this.ctx.fillStyle = color;
            this.ctx.ellipse(x,y,w,h,rot,st,et,way)
            this.ctx.closePath()
            this.ctx.fill()
        }
    }

    line(x:number,y:number,x2:number,y2:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        [x,y]=this.applyStack(x,y);
        [x2,y2]=this.applyStack(x2,y2);
        // if((x2 < 0 || x2 > W || y2 < 0 || y2 > H)&&(x < 0 || x > W || y < 0 || y > H)) {
        //     return;
        // }
        this.ctx.strokeStyle=color;
        this.ctx.lineWidth = ~~(lw);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.stroke(); 
    }

    lineVer(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x,y-len/2,x,y+len/2,lw,color);
    }
    lineVerBot(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x,y-len,x,y,lw,color);
    }
    lineVerTop(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x,y,x,y+len,lw,color);
    }
    
    lineHor(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x-len/2,y,x+len/2,y,lw,color);
    }
    lineHorLeft(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x,y,x+len,y,lw,color);
    }
    lineHorRight(x:number,y:number,len:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x,y,x-len,y,lw,color);
    }
    lineAngled(x:number,y:number,len:number,angle:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown"){
        this.line(x-Math.cos(angle)*len/2,y-Math.sin(angle)*len/2,x+Math.cos(angle)*len/2,y+Math.sin(angle)*len/2,lw,color);
    }

    arrow(x1:number,y1:number,x2:number,y2:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown",sepAngCoeff=1,sepSizeCoeff=3){
        let x=x2-x1, y=y2-y1;
        let CENTER=new Vector2D(x1,y1);
        let drawW=Math.hypot(x,y);
        let ang1=Math.atan2(y,x);
        let c1=Math.cos(ang1);
        let s1=Math.sin(ang1);


        let sepang=Math.PI/24*2*sepAngCoeff;//15*sepCoeffº
        let csep2=Math.sin(ang1+sepang-Math.PI/4);
        let ssep2=Math.cos(ang1+sepang-Math.PI/4);
        let csep=Math.sin(-sepang+ang1-Math.PI/4);
        let ssep=Math.cos(-sepang+ang1-Math.PI/4);

        let pc=CENTER;
        let pv=new Vector2D(CENTER.x+c1*drawW,CENTER.y+s1*drawW);
        let dx=pv.x-pc.x;
        let dy=pv.y-pc.y;
        let l=Math.hypot(dx,dy);
        this.line(pc.x,pc.y,pv.x-dx/l*lw*sepSizeCoeff,pv.y-dy/l*lw*sepSizeCoeff,lw,color);
        let pizq=new Vector2D(pv.x-ssep2*lw*sepSizeCoeff+csep2*lw*sepSizeCoeff,
            pv.y-csep2*lw*sepSizeCoeff-ssep2*lw*sepSizeCoeff);
        let pder=new Vector2D(pv.x-ssep*lw*sepSizeCoeff+csep*lw*sepSizeCoeff,
            pv.y-csep*lw*sepSizeCoeff-ssep*lw*sepSizeCoeff)

        let [pvx,pvy]=this.applyStack(...pv.vals)
        let [pizqx,pizqy]=this.applyStack(...pizq.vals)
        let [pderx,pdery]=this.applyStack(...pder.vals)
        this.ctx.moveTo(pizqx,pizqy);
        this.ctx.lineTo(pvx,pvy)
        this.ctx.lineTo(pderx,pdery)


        this.ctx.fillStyle=color;
        this.ctx.strokeStyle=color;
        if(this.getOption('stroking'))
            this.ctx.stroke();
        else 
            this.ctx.fill();
    }
    doubleArrow(x1:number,y1:number,x2:number,y2:number,lw:number=5,color:string|CanvasGradient|CanvasPattern|undefined="brown",sepAngCoeff=1,sepSizeCoeff=3){
        let dx=x2-x1, dy=y2-y1;
        this.arrow(x1+dx/2,y1+dy/2,x2,y2,lw,color,sepAngCoeff,sepSizeCoeff);
        this.arrow(x1+dx/2,y1+dy/2,x1,y1,lw,color,sepAngCoeff,sepSizeCoeff);
    }

    polygon(x: number=0, y: number=0, polygon:Polygon, color: string|CanvasGradient|CanvasPattern = "black") {
        const W = this.ctx.canvas.width;
        const H = this.ctx.canvas.height;
        let w=polygon.w, h=polygon.h;
        [x,y]=this.applyStack(x,y);
        // if (x + w < 0 || x-w > W || y + h < 0 || y-h > H) {
        //     return;
        // }
        this.ctx.beginPath()
        let isStroking=this.getOption('stroking');
        if (isStroking) {
            this.ctx.strokeStyle = color;
        } else {
            this.ctx.fillStyle = color;
        }
        this.ctx.moveTo(polygon.vecs[0][0]+x,polygon.vecs[0][1]+y)
        for (let i = 1; i < polygon.vecs.length; i++) {
            const v = polygon.vecs[i];
            this.ctx.lineTo(v[0]+x,v[1]+y)
        }
        this.ctx.closePath()
        if (isStroking) {
            this.ctx.stroke()
        } else {
            this.ctx.fill()
        }
    }

    img(img,x:number,y:number,w:number=img.width,h:number=img.height,imgsc=1){
        if(!img||!img.loaded) return;
        w??=img.width??100;
        h??=img.height??100;
        w*=imgsc;
        h*=imgsc;
        
        [x,y]=this.applyStack(x,y,w,h)

        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        this.ctx.drawImage(img,x,y,w,h);
    }
    
    imgSlice(img, x, y, w = img.width, h = img.height, imgsc = 1) {
        if (!img || !img.loaded) return;
    
        // Scale width and height based on the zoom level
        w *= imgsc;
        h *= imgsc;
    
        // Apply the transformations to the destination coordinates (scaled image on screen)
        [x, y] = this.applyStack(x, y, w, h);
    
        // Calculate the source rectangle (sx, sy, sw, sh) based on the zoom and position
        // We assume that the image is centered at x, y and we want to slice a portion of it
        // Calculate the visible portion (after applying zoom)
        let sx = x - w / 2; // The x offset in the source image
        let sy = y - h / 2; // The y offset in the source image
        let sw = w;          // The width of the source to display
        let sh = h;          // The height of the source to display
    
        // Apply the zoom factor to the source width and height
        sx *= imgsc;
        sy *= imgsc;
        sw *= imgsc;
        sh *= imgsc;
    
        // Ensure that sx, sy, sw, and sh do not go out of bounds
        sx = Math.max(0, Math.min(sx, img.width - sw));  // Make sure source slice doesn't go out of image width
        sy = Math.max(0, Math.min(sy, img.height - sh)); // Make sure source slice doesn't go out of image height
        sw = Math.min(sw, img.width - sx);  // Ensure source slice width doesn't exceed image bounds
        sh = Math.min(sh, img.height - sy); // Ensure source slice height doesn't exceed image bounds
    
        // Finally, draw the image slice
        this.ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
    
    image(img,x:number,y:number,w:number=img.width,h:number=img.height,imgsc:number=1){
        return this.img(img,x,y,w,h,imgsc)
    }
    rImg=(img,x:number,y:number,w:number=img.width,h:number=img.height,imgsc:number=1,deg:number=0, flipX:boolean=false, flipY:boolean=false)=>{
        if(!img||!img.loaded) return;

        w??=img.width??100;
        h??=img.height??100;
        w*=imgsc;
        h*=imgsc;

        [x,y]=this.applyStack(x,y,w,h)

        
        if (x + w < 0 || x > W || y + h < 0 || y > H) {
            return;
        }
        this.ctx.save();
        this.ctx.beginPath();
        if(flipX){
            this.ctx.scale(-1, 1);
            w*=-1;
            x*=-1;
        }
        if(flipY){
            this.ctx.scale(1, -1);
            h*=-1;
            y*=-1;
        }
        this.ctx.translate( x+w/2, y+h/2 );
        this.ctx.rotate(deg);
        this.ctx.drawImage(img, -w/2, -h/2, w,h);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * Fills a rect onto the whole canvas
     * @param color 
     */
    cls(color: string = "rgba(0,0,0,0)"){
        this.tmpoptions.noApplyStack=true
        this.tmpoptions.posStyle=false
        let [x,y]=this.applyStack(0,0);
        if((color==="transparent")||(color==="rgba(0,0,0,0)"))
            this.ctx.clearRect(-x,-y,W,H);
        else
            this.rect(-x,-y,W,H,color);
        this.tmpoptions={}
    }

    // get stroking() {
    //     return this.ctx['stroking'];
    // }
    // set stroking(value: boolean) {
    //     this.ctx['stroking'] = value;
    // }
}
export type MCTX=ModernCtx & CanvasRenderingContext2D;


//**! Vector Math Tab */

//**! GameObject Tab */

export class GameObject{
    public pos:Vector2D;
    public size:Vector2D;
    public layer=0;
    /** From its center */
    public rotation:number=0;
    public dead=false;//falta hacer que se quite solo cuando se use tick en layer o en scene
    public vel:Vector2D;
    public polygon:Polygon;
    public m:number=1;
    public inertia=1;
    private added=false;
    public shown=true;
    public info={
        changed:{
            position:false,
            size:false,
            velocity:false,
            any:false
        },
        is_static:false
    }
    constructor(x:number=0,y:number=0,public w:number=1,public h:number=1,public color:string|CanvasGradient|CanvasPattern="black"){
        this.pos = new Vector2D(x, y);
        this.size = new Vector2D(w, h);
        this.vel=new Vector2D(0,0);
        this.polygon=new Polygon(0,0,0+w,0,0+w,0+h,0,0+h);
    }
    selfAdd(layer=0,sc:Scene=Scene.sc){
        if(this.added) return;
        sc.getLayer(layer).add(this);
        this.added=true;
        return this;
    }
    getPosition(sc?:Scene|MatrixStack2D):[number,number,number,number]{
        if(!sc) return this.position
        let applyPos= (sc instanceof Scene ? sc.stack : sc).apply(this.pos)
        let zoom=1;
        if(sc instanceof Scene&&sc?.cam?.zoom!==undefined){
            zoom=sc?.cam?.zoom;
        }
        return [applyPos.x,applyPos.y,this.size.x*zoom,this.size.y*zoom]
    }
    get position() : [number,number,number,number]&{pos:[number,number],bounds:[number,number]}{
        let vals:any=[this.pos.x,this.pos.y,this.size.x,this.size.y];
        vals.pos=[vals[0],vals[1]];
        vals.bounds=[vals[2],vals[3]];
        return vals 
    }
    get poscolor() : [number,number,number,number,string|CanvasGradient|CanvasPattern]{
        return [this.pos.x,this.pos.y,this.size.x,this.size.y,this.color]
    }
    draw(ctx:ModernCtx){

    }
    public extratick(dt){
        
    }
    tick(dt){
        this?.extratick?.(dt);
    }
    get x():number{
        return this.pos.x;
    }
    get y():number{
        return this.pos.y;
    }
    set x(x:number){
        this.pos.x=x;
    }
    set y(y:number){
        this.pos.y=y;
    }
    get vx():number{
        return this.vel.x;
    }
    get vy():number{
        return this.vel.y;
    }
    set vx(x:number){
        this.vel.x=x;
    }
    set vy(y:number){
        this.vel.y=y;
    }
    getPol(){
        return this.polygon;
    }
    get pol(){
        return this.getPol();
    }
    set pol(pol){
        this.polygon=pol;
    }
    get rot(){
        return this.rotation;
    }
    get mass(){
        return this.m;
    }
    set rot(rot){
        this.rotation=rot;
    }
    set mass(mass){
        this.m=mass;
    }


    get bounds(){
        return {x:this.w,y:this.h}
    }
    set bounds({x,y}){
        this.w=x;this.h=y;
    }
    
    findNearObjects(x:number,y:number,radius:number,conditions?:Object,sc:Scene=Scene.sc):GameObject[]{
        return sc.findObjects((o)=>{
            if(!o) return false;
            if(o instanceof GameObject){
                let pos=o.getPosition(sc);
                let r=Math.hypot(x-pos[0],y-pos[1])
                return r<radius;
            }else{
                return false;
            }
            
        },undefined);
    }
    distanceTo(obj:GameObject|{x:number,y:number}){
        if(!obj) return Infinity;
        return Math.hypot(this.x-obj.x,this.y-obj.y);
    }
}

export class GameImage extends GameObject{
    constructor(x,y,w,h,public img:HTMLImageElement){
        super(x,y,(w??img?.width),(h??img?.height));
    }
    draw(ctx:MCTX){
        ctx.tmpoptions.noApplyStack=false;
        ctx.tmpoptions.posStyle=false;
        let [x,y]=ctx.applyStack(this.x,this.y);
        // if (x + this.w < 0 || x > W || y + this.h < 0 || y > H) {
        //     return;
        // }
        let zoom=(ctx?.lastDrawnScene||ctx?.lastDrawnLayer?.scene)?.cam?.zoom??1;
        ctx.img(this.img,x,y,this.w/zoom,this.h/zoom);
    }
}

export class GameIOStats{
    static getProps(stats:Object|Function):string[]{
        if(typeof(stats)=="object"){
            return GameIOStats.getPropsFromObject(stats);
        }
        if(typeof(stats)=="function"&&!!stats.prototype){
            return GameIOStats.getPropsFromObject((stats as any)?.IOstats as any)
        }
        return undefined as any;
    }
    private static getPropsFromObject(stats:Object):string[]{
        let props:string[]=[]
        let keys=Object.keys(stats);
        for (let i = 0; i < keys.length; i++) {
            let val=stats[keys[i]];
            if(typeof(val)=="number"){
                props.push(keys[i]+"");
            }
        }
        return props;
    }

    // static getIOSendObjectFactory(stats:object|Function):(obj)=>object{
    //     if(typeof(stats)=="object"){
    //         return GameIOStats.getIOSendObjectFactoryFromObject(stats);
    //     }
    //     if(typeof(stats)=="function"&&!!stats.prototype){
    //         return GameIOStats.getIOSendObjectFactoryFromObject((stats as any)?.IOstats as any)
    //     }
    //     return undefined as any;
    // }
    // private static getIOSendObjectFactoryFromObject(stats:object):(obj)=>object{
    //     let keys=Object.keys(stats);
    //     let sti=keys.length-1;
    //     let decimals:number[]=[]
    //     let specialKeys:{key:string,evalKeys:string[],decimals:number[]}[]=[]
    //     for (let i = keys.length-1; i >=0; i--) {
    //         if(typeof(stats[keys[i]])=="number"){
    //             decimals[sti]=stats[keys[i]]
    //         }else
    //         if(typeof(stats[keys[i]])=="object"&&typeof((stats[keys[i]] as any)?.dim?.())=="number"){
    //             let dim=stats[keys[i]].dim();
    //             let evalKeys=["x","y","z","w"].reverse().splice(dim,4-dim).reverse();
    //             specialKeys.push({key:keys[i],evalKeys,decimals:stats[keys[i]].values})
    //             keys.splice(i,1);
    //             decimals.splice(i,1);
    //         }else{
    //             decimals[sti]=-1; 
    //         }
    //         sti--;
            
    //     }
    //     decimals.reverse();
    //     return (obj)=>{
    //         let sendObject={}
    //         let sti=0;
    //         for (let i = 0; i < keys.length; i++) {
    //             if(typeof(stats[keys[i]])=="number")
    //                 sti++;
    //             if(typeof(stats[keys[i]])=="number"&&decimals[sti]!=-1){
    //                 let pow=Math.pow(10,decimals[i]);
    //                 sendObject[keys[i]]=parseInt(stats[keys[i]]*pow as any)/pow;
    //             }else
    //                 sendObject[keys[i]]=stats[keys[i]]
    //             console.log(decimals[sti],keys[i],stats[keys[i]])
    //         }
    //         for (let i = 0; i < specialKeys.length; i++) {
    //             for (let j = 0; j < specialKeys[i].evalKeys.length; j++) {
    //                 let keyName=specialKeys[i].key+specialKeys[i].evalKeys[j];
    //                 if(specialKeys[i].key=="pos"||specialKeys[i].key=="position"){
    //                     keyName=specialKeys[i].evalKeys[j];
    //                 }else
    //                 if(specialKeys[i].key=="vel"||specialKeys[i].key=="velocity"){
    //                     keyName="v"+specialKeys[i].evalKeys[j];
    //                 }
    //                 let val=obj[specialKeys[i].key][specialKeys[i].evalKeys[j]];
    //                 if(specialKeys[i].decimals[i]!=-1&&!Number.isNaN(specialKeys[i].decimals[i])){
    //                     let pow=Math.pow(10,specialKeys[i].decimals[i]);
    //                     val=parseInt(obj[keys[i]]*pow as any)/pow;
    //                 }
    //                 sendObject[keyName]=val;
    //             }
    //         }
    //         return sendObject;
    //     }
    // }
}

type PType=({0:number,1:number})|[number,number];
type LType=({0:PType,1:PType})|[PType,PType];
export class Polygon{
    public vecs:([number,number]&PType)[]
    public lines:LType[]=[];
    static CircleType="Circle";
    static EllipseType="Ellipse";
    static PolygonType="Polygon";
    public type=Polygon.PolygonType;
    public pos:PType=undefined as any;
    public r:number=undefined as any;
    constructor(...vs:number[]|Vector[]|[number,number][]|number[][]){
        let vecs:number[]=[];
        if(Array.isArray(vs)&&!(vs[0] instanceof Vector))
            vecs=vs.flat() as number[];
        else if(Array.isArray(vs)){
            let numarr=((vs as Vector[]).flat().map((v:Vector)=>[v.x,v.y]))
            for (let i = 0; i < numarr.length; i++) {
                vecs.push(...numarr[i])
            }
        }
        let vecarr:([number,number]&PType)[]=[];
        for (let i = 0; i < vecs.length-1; i+=2) {
            let obj=[vecs[i],vecs[i+1]] as (PType&[number,number]);
            vecarr[i/2]=obj;
        }
        this.vecs=vecarr;
        for (let i = 0, j=this.vecs.length-1; i < this.vecs.length; j=i++) {
            this.lines.push([this.vecs[i],this.vecs[j]])
        }
    }
    get w(){
        return 100;
    }
    get h(){
        return 100;
    }
    static createCirclePolygon(x,y,r){
        let circlePol= new Polygon([x,y,r,r])
        circlePol.type=Polygon.CircleType;
        circlePol.pos=[x,y];
        circlePol.r=r;
    }
}

//TODO - Create Collision detection globally for all objects with collides set to true of a scene
export class GameCircleCollisionHandler{
    tick(dt,objs){
        for (let i = 0; i < objs.length; i++) {
            let obj1=objs[i];
    
            for (let j = i+1; j < objs.length; j++) {
                let obj2=objs[j];
                if(!this.nearPhase(obj1,obj2)) continue;
                this.handleCollision(obj1,obj2);
            }
        }
    }
    nearPhase(obj1:GameObject, obj2: GameObject){
        const width1 = obj1.w;
        const height1 = obj1.h;
        const width2 = obj2.w;
        const height2 = obj2.h;


        // Calculate the distance between the centers of the two objects (doubled)
        const dx = Math.abs(obj2.x - obj1.x);
        const dy = Math.abs(obj2.y - obj1.y);

        // Calculate the combined full-widths and full-heights (doubled)
        const combinedWidths = width1 + width2;
        const combinedHeights = height1 + height2;
        // Check if the bounding boxes are overlapping
        return (dx+dx <= combinedWidths) && (dy+dy <= combinedHeights);
    }
    handleCollision(obj1:GameObject, obj2: GameObject){
        // Calculate the difference in positions
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;

        // Calculate the distance squared between the objects
        const distanceSquared = dx * dx + dy * dy;

        // Calculate the sum of the radii squared (using `obj.w` as the radius)
        const combinedRadius = obj1.w/2 + obj2.w/2;
        const combinedRadiusSquared = combinedRadius * combinedRadius;

        // Check if the objects are overlapping
        if (distanceSquared > combinedRadiusSquared) {
            return; // No collision if they are not overlapping
        }

        // Calculate the distance between the objects
        const distance = Math.sqrt(distanceSquared);

        // Calculate the overlap distance
        // const overlap = combinedRadius - distance;
        // Calculate the difference in velocities
        const dvx = obj2.vel.x - obj1.vel.x;
        const dvy = obj2.vel.y - obj1.vel.y;
        // Calculate the dot product of the velocity difference and position difference
        const dotProduct = dvx * dx/distance*combinedRadius + dvy * dy/distance*combinedRadius;
        // Assume a density of 1 for simplicity
        const density = 1;
        let obj1m = density * Math.PI * obj1.w * obj1.w / 4;
        let obj2m = density * Math.PI * obj2.w * obj2.w / 4;
        // let p_inicial=obj1m*Math.hypot(obj1.vel.x,obj1.vel.y)+obj2m*Math.hypot(obj2.vel.x,obj2.vel.y);
        // let k_inicial=0.5*obj1m*Math.hypot(obj1.vel.x,obj1.vel.y)**2+0.5*obj2m*Math.hypot(obj2.vel.x,obj2.vel.y)**2;
        
        // If the dot product is greater than 0, the objects are moving away from each other, so no collision occurs
        if (dotProduct > 0) {
        
            return;
        }


        // Calculate the collision scale factor
        const collisionScale1 = 2 * ((obj1.vel.x - obj2.vel.x) * -dx/distance*combinedRadius + (obj1.vel.y - obj2.vel.y) * -dy/distance*combinedRadius) / ((obj1m + obj2m) * combinedRadius*combinedRadius);
        const collisionScale2 = 2 *( (obj2.vel.x - obj1.vel.x) * dx/distance*combinedRadius + (obj2.vel.y - obj1.vel.y) * dy/distance*combinedRadius) / ((obj1m + obj2m) * combinedRadius*combinedRadius);

        // Update velocities for obj1
        obj1.vel.x += collisionScale1 * obj2m * dx/distance*combinedRadius;
        obj1.vel.y += collisionScale1 * obj2m * dy/distance*combinedRadius;

        // Update velocities for obj2
        obj2.vel.x -= collisionScale2 * obj1m * dx/distance*combinedRadius;
        obj2.vel.y -= collisionScale2 * obj1m * dy/distance*combinedRadius;

        // let p_final=obj1m*Math.hypot(obj1.vel.x,obj1.vel.y)+obj2m*Math.hypot(obj2.vel.x,obj2.vel.y);
        // let k_final=0.5*obj1m*Math.hypot(obj1.vel.x,obj1.vel.y)**2+0.5*obj2m*Math.hypot(obj2.vel.x,obj2.vel.y)**2;
        // console.log(p_inicial-p_final,"p|k",k_inicial-k_final)

    }
}
function length(p:PType):number{
    return Math.sqrt(p[0]*p[0]+p[1]*p[1])
}
/**
 * THis will only work for Close Collisions, meaning in the near phase after the distance phase
 */
export class CollisionManager{
    protected offset:PType=[0,0]
    protected offsetState:number=1
    public modifyVel=true;
    public callObjects=true;
    dot(p1:PType,p2:PType):number{
        return p1[0]*p2[0]+p1[1]*p2[1]
    }
    
    closestToLine(p:PType,{0:a,1:b}:LType):PType{
        let ba:PType=[b[0]-a[0],b[1]-a[1]];
        let pa:PType=[p[0]-this.offset[0]*this.offsetState-a[0],p[1]-this.offset[1]*this.offsetState-a[1]];
        let interv=this.dot(pa,ba)/length(a);
        let cos=interv/length(ba)
        if(cos<0) return a;
        if(cos>1) return b;
        return [a[0]+(b[0]-a[0])*cos,a[1]+(b[1]-a[1])*cos]
    }
    collideLineToLine(l1:LType,l2:LType):boolean|PType{
        let [[x1,y1],[x2,y2]]=l1 as [[number,number],[number,number]];
        let [[x3,y3],[x4,y4]]=l2 as [[number,number],[number,number]];
        x3-=this.offset[0]*this.offsetState;
        x4-=this.offset[0]*this.offsetState;
        y3-=this.offset[1]*this.offsetState;
        y4-=this.offset[1]*this.offsetState;
        var a_dx = x2 - x1;
        var a_dy = y2 - y1;
        var b_dx = x4 - x3;
        var b_dy = y4 - y3;
        let denominator=(-b_dx * a_dy + a_dx * b_dy)
        if(denominator==0) denominator=0.001;
        var s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / denominator;
        var t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / denominator;
        // const a_normal = [-a_dx, a_dy];
        // const b_normal = [-b_dx, b_dy];
        // const normal=[-a_dx-b_dx,a_dy+b_dy]
        return (s > 0 && s < 1 && t > 0 && t < 1) ? [x1 + t * a_dx, y1 + t * a_dy,  (-a_dy-b_dy)/2,(a_dx+b_dx)/2] : false;
    }
    polygonToLine(pol:Polygon,l2:LType){
        for (let i = 0; i < pol.lines.length; i++) {
            let pol2line=this.collideLineToLine(pol.lines[i],l2)
            if(!!pol2line) return pol2line
        }
        return 0;
    }
    polygonToPolygon(pol:Polygon,pol2:Polygon):PType|boolean{
        for (let i = 0; i < pol.lines.length; i++) {
            let pol2line=(this.polygonToLine(pol2,pol.lines[i]));
            if(pol2line)
                return pol2line as PType;//this.collideLineToLine(pol.lines[i],pol2.lines[pol2line-1])
        }
        return false;
    }
    public pointToPolygon(point: PType, polygon: Polygon): boolean {
        let intersections = 0;
    
        // Extract polygon vertices from its lines
        const vertices = polygon.vecs;
    
        for (let i = 0; i < vertices.length - 1; i++) {
            const [x1, y1] = vertices[i];
            const [x2, y2] = vertices[(i + 1)%(vertices.length-1)];
    
            // Check if the ray intersects the edge
            if (
                (y1 > point[1]) !== (y2 > point[1]) && 
                point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1
            ) {
                intersections++;
            }
        }
    
        // Odd number of intersections means the point is inside the polygon
        return intersections % 2 === 1;
    }
    circleToPoint(circle:Polygon,p:PType){
        return length([p[0]-circle.pos[0],p[1]-circle.pos[1]])**2<circle.r*circle.r;
    }
    circleToLine(circle:Polygon,l2:LType){
        let closestP=this.closestToLine(circle.pos,l2);
        return this.circleToPoint(circle,closestP)?closestP:false;
    }
    circleToPolygon(circle:Polygon,pol2:Polygon){
        // if(circle inside polygon) return true
        let mindis=Infinity;
        let closestp:PType=false as any;
        for (let i = 0; i < pol2.lines.length; i++) {
            let pol2line=(this.circleToLine(circle,pol2.lines[i]));
            if(pol2line){
                let dis=length([pol2line[0]-circle.pos[0],pol2line[1]-circle.pos[1]])
                if(dis<mindis){
                    mindis=dis;
                    closestp=pol2line
                }
            }

        }
        
        return closestp;
    }
    circleToCircle(cir1:Polygon,cir2:Polygon):PType|boolean{
        let dx=cir1.pos[0]-cir2.pos[0]+this.offset[0]*this.offsetState
        let dy=cir1.pos[1]-cir2.pos[1]+this.offset[1]*this.offsetState
        let l2=dx*dx+dy*dy;
        if(l2<(cir1.r+cir2.r)*(cir1.r+cir2.r)){
            let dis=Math.sqrt(l2);
            return [cir1.pos[0]+dx/dis*cir1.r,cir1.pos[1]+dy/dis*cir1.r];
            // return [[cir1.pos[0]+dx/dis*cir1.r,cir1.pos[1]+dy/dis*cir1.r],
            // [cir2.pos[0]+this.offset[0]*this.offsetState-dx/dis*cir2.r,cir2.pos[1]+this.offset[1]*this.offsetState-dy/dis*cir2.r]]
        }
        return false;
    }
    tick(dt,objs){
        for (let i = 0; i < objs.length; i++) {
            let obj1=objs[i];
    
            for (let j = i+1; j < objs.length; j++) {
                let obj2=objs[j];
                // if(!this.nearPhase(obj1,obj2)) continue;
                this.handleCollision(obj1,obj2,dt);
            }
        }
    }
    nearPhase(obj1:GameObject, obj2: GameObject){
        const width1 = obj1.w;
        const height1 = obj1.h;
        const width2 = obj2.w;
        const height2 = obj2.h;


        // Calculate the distance between the centers of the two objects (doubled)
        const dx = Math.abs(obj2.x - obj1.x);
        const dy = Math.abs(obj2.y - obj1.y);

        // Calculate the combined full-widths and full-heights (doubled)
        const combinedWidths = width1 + width2;
        const combinedHeights = height1 + height2;

        // Check if the bounding boxes are overlapping
        return (dx+dx <= combinedWidths) && (dy+dy <= combinedHeights);
    }
    handleCollision(obj1:GameObject, obj2: GameObject,dt:number){
        let pol1=obj1.getPol();
        let pol2=obj2.getPol();
        let closestPto:PType=false as any;
        let closestPt:PType=false as any;
        let closestPt2:PType=false as any;
        let n:Vector2D=undefined as any;
        let n2:Vector2D=undefined as any;
        let ntries=0;
        let dx=obj2.x-obj1.x;
        let dy=obj2.y-obj1.y;
        do{
            dx=obj2.x-obj1.x;
            dy=obj2.y-obj1.y;
            this.offset=[dx,dy];
            this.offsetState=1;
            
            closestPt=closestPto;
            closestPto=false as any;
        if(pol1.type==Polygon.PolygonType&&pol2.type==Polygon.PolygonType){
            this.offsetState=1;
            closestPto=this.polygonToPolygon(pol1,pol2) as PType;
            this.offsetState=-1;
            closestPt2=this.polygonToPolygon(pol2,pol1) as PType;
            this.offsetState=1;
        }else
        if(pol1.type==Polygon.CircleType&&pol2.type==Polygon.PolygonType){
            closestPto=this.circleToPolygon(pol1,pol2) as PType;
        }else
        if(pol1.type==Polygon.PolygonType&&pol2.type==Polygon.CircleType){
            this.offsetState=-1;
            closestPto=this.circleToPolygon(pol2,pol1) as PType;
        }else
        if(pol1.type==Polygon.CircleType&&pol2.type==Polygon.CircleType){
            closestPto=this.circleToCircle(pol1,pol2) as any;
        }
        if(closestPto){
            n=new Vector2D((closestPto as any)[2],(closestPto as any)[3])//new Vector2D(...(new Vector2D(closestPt[0],closestPt[1]).substract(obj2.pos).normalize().values as [number,number]))
            n.normalize()
            n.val()
            
        }
        ntries++;
        }while(!!closestPto&&ntries<2);

        let overlap:Vector2D=new Vector2D(1/Math.SQRT2,1/Math.SQRT2);
        if(Array.isArray(closestPt2)){
            let c1=new Vector2D((closestPt as any)[0],(closestPt as any)[1])
            let c2=new Vector2D((closestPt2 as any)[0],(closestPt2 as any)[1])
            overlap=new Vector2D(...(c1.substract(c2).values as [number,number]));
            overlap=new Vector2D(overlap.x+dx,overlap.y+dy)
            n2=new Vector2D((closestPt2 as any)[2],(closestPt2 as any)[3])//new Vector2D(...(new Vector2D(closestPt[0],closestPt[1]).substract(obj2.pos).normalize().values as [number,number]))
            n2.normalize()
            n2.val()
            let d2=Math.abs(n2.dot(c2.substract(obj1.pos))/(c2.substract(obj1.pos).length()))
            let d1=Math.abs(n.dot(c1.substract(obj2.pos))/(c1.substract(obj2.pos).length()))
            if(d2>d1){
                n=n2;
            }
            obj1.x+=-(overlap.x+-dx);
            obj1.y+=-(overlap.y+-dy);
            obj2.x-=-(overlap.x+-dx);
            obj2.y-=-(overlap.y+-dy);


        }

        obj1.color=!Array.isArray(closestPt)?"red":"green"

        // if(closestPt&&Array.isArray(closestPt)) closestPt=closestPt[0] as any;
        if(!Array.isArray(closestPt)) return;
        //handle impulse
        //va_=va_ +wa cross ra

        (this as any).lastCollision=closestPt;

        if(this.modifyVel){
                
            // dx=obj2.x-obj1.x;
            // dy=obj2.y-obj1.y;

            let m1=obj1.m, m2=obj2.m;
            let dv=obj1.vel.substract(obj2.vel);

            // if(obj1.vel.dot(obj2.vel)>0) return;


            let cr=1;//coefficiet of restitution
            let summass=m1+m2;//+[(ra cross n)z**2 * Ia + (rb cross n)z**2 * Ib]  //that is [(ra cross n)^T Ia^-1 (ra cross n) + etc]
            let j=-(1+cr)*(dv.dot(n))*m1*m2/(summass)

            //wa+=wa_ + (ra corss jn)/Ia
            //wb+=wb_ + (rb corss jn)/Ib

            obj1.vel.add(n.multiplyScalar(j/m1))
            obj2.vel.add(n.multiplyScalar(-j/m2)) 
            obj1.vel.val()
            obj2.vel.val()
            let {x:px,y:py}=obj1.pos;
            let {x:vpx,y:vpy}=obj1.vel;
            obj1.pos.x=obj2.pos.x;
            obj1.vel.x=obj2.vel.x;
            obj1.pos.y=obj2.pos.y;
            obj1.vel.y=obj2.vel.y;
            obj2.pos.x=px;obj2.pos.y=py;
            obj2.vel.x=vpx;obj2.vel.y=vpy;
            
        }
        if(this.callObjects){
            (obj1 as any)?.onCollision(obj2,closestPt);
            (obj2 as any)?.onCollision(obj1,closestPt);
        }

    }
}

//**! Loaders Tab */
export class ImgLoader{
    static enableCors=false;
    static load(url,w?,h?):HTMLImageElement&{loaded:boolean}{
        return ImgLoader.loadImage(url,w,h);
    }
    static async loadSync(url,w?,h?):Promise<HTMLImageElement&{loaded:boolean}>{
        let img=this.loadImage(url,w,h);
        
        return new Promise((res,rej)=>{
            (img as any).next=()=>{
                res(img);
            }
        });
    }
    static loadImage(url,w?,h?):HTMLImageElement&{loaded:boolean}{
        let img=new Image(w,h);
        img.src=url;
        (img as any).loaded=false;
        if(ImgLoader.enableCors){
            img.crossOrigin = "anonymous";
        }
        img.onload= ()=>{
            (img as any).loaded=true;
            if(typeof (img as any).next=="function"){
                (img as any).next?.();
            }
        }
        
        return img as any;
    }
    static loadImages(...url):(HTMLImageElement&{loaded:boolean}[]){
        let imgs:any[]=[];
        url.forEach((u)=>{
            if(Array.isArray(u)){
                u.forEach((ur)=>{
                    let timg=this.loadImage(ur);
                    if(timg) imgs.push(timg);
                    if(ImgLoader.enableCors){
                        timg.crossOrigin = "anonymous";
                    }
                });
            }else{
                let timg=this.loadImage(u);
                if(ImgLoader.enableCors){
                    timg.crossOrigin = "anonymous";
                }
                if(timg) imgs.push(timg);
            }
        })
        return imgs as any;
    }
    static loadDirImages(dir,...url):(HTMLImageElement&{loaded:boolean})[]{
        let imgs:any[]=[];
        url.forEach((u)=>{
            if(Array.isArray(u)){
                u.forEach((ur)=>{
                    let timg=this.loadImage(dir+ur);
                    if(ImgLoader.enableCors){
                        timg.crossOrigin = "anonymous";
                    }
                    if(timg) imgs.push(timg);
                });
            }else{
                let timg=this.loadImage(dir+u);
                if(ImgLoader.enableCors){
                    timg.crossOrigin = "anonymous";
                }
                if(timg) imgs.push(timg);
            }
        })
        return imgs;
    }
    static getPathArray(preffix:string="",values:string[]|string|number|number[]|any|any[]="",suffix:string=""){
        if(!Array.isArray(values)){
            return [preffix+values+suffix]
        }
        return values.map(val=>preffix+val+suffix);
    }
    static join(...imgs):HTMLImageElement&{loaded:boolean}{
        let allloaded=true;
        let wtot=0;
        let maxh=10;
        let maxoffy=0;
        imgs.forEach((ec)=>{
            let offx=0,offy=0;
            if(Array.isArray(ec)) {
                offx=ec[1]??0;
                offy=ec[2]??0;
                ec=ec[0];
            };
            if(!ec?.loaded) allloaded=false; wtot+=ec?.w+offx; if(ec?.h>maxh) {maxh=ec.h;} if(offy<0&&offy<maxoffy){maxoffy=offy;};
        });
        maxh+=Math.abs(maxoffy)*2;
        if(!allloaded) return undefined as any;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d") as any;

        const canvasWidth = wtot;
        const canvasHeight = maxh;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let tx=0;
        for (let i = 0; i < imgs.length; i++) {
            var ec = imgs[i];
            let offx=0,offy=0;
            if(Array.isArray(ec)) {
                offx=ec[1];
                offy=ec[2];
                ec=ec[0];
            };
            if(!ec) continue;
            context.drawImage(ec.img, tx+offx, (maxh-ec.h)/2+offy-maxoffy, ec.w, ec.h);
            tx+=ec.w+offx;
        }
        
        let newimg=new Image(canvasWidth,canvasHeight) as (HTMLImageElement&{loaded:boolean});
        newimg.loaded=false;
        newimg.src=canvas.toDataURL();
        newimg.onload=()=>{
            newimg.loaded=true;
            if(typeof (newimg as any).next=="function"){
                (newimg as any).next?.();
            }
        }
        return newimg;
    }

    static applyFilter(img,r:number,g:number,b:number,w?:number,h?:number){
        let apply= function(){
            img.loaded=false;
                
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d") as CanvasRenderingContext2D;

            const canvasWidth = w||img.width;
            const canvasHeight = h||img.height;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            context.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            const sourceImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
            const src = sourceImageData.data;
            
            for (let i = 0; i < src.length; i += 4) {
                src[i]=~~(Math.min((r*src[i])/255,255)); //r
                src[i+1]=~~(Math.min((g*src[i+1])/255,255)); //g
                src[i+2]=~~(Math.min((b*src[i+2])/255,255)); //b
            }
            // console.log(r,g,b)
            context.putImageData(sourceImageData, 0, 0);

            img.src=canvas.toDataURL();
            img.onload=()=>{
                img.loaded=true;
                if(typeof (img as any).next=="function"&&(img as any).next!==apply){
                    (img as any).next?.();
                }
            }
        }
        if(!img.loaded){
            img.next=apply;
        }else{
            apply()
        }
    }

    static async fromCanvasOrBitmap(source: HTMLCanvasElement | ImageBitmap, w?: number, h?: number): Promise<HTMLImageElement & { loaded: boolean }> {
        let blob: Blob;

        if (source instanceof HTMLCanvasElement) {
            blob = await new Promise<Blob>((res) => source.toBlob(res));
        } else if (source instanceof ImageBitmap) {
            // Crear canvas temporal para convertir ImageBitmap a Blob
            const tmp = document.createElement("canvas");
            tmp.width = source.width;
            tmp.height = source.height;
            const ctx = tmp.getContext("2d");
            if (!ctx) throw new Error("No se pudo crear contexto 2D");
            ctx.drawImage(source, 0, 0);
            blob = await new Promise<Blob>((res) => tmp.toBlob(res));
        } else {
            throw new Error("Tipo no soportado");
        }

        const url = URL.createObjectURL(blob);
        const img = this.loadImage(url, w, h);

        return new Promise((res) => {
            (img as any).next = () => {
                // Liberar URL después de cargar
                URL.revokeObjectURL(url);
                res(img);
            };
        });
    }
}

(ImgLoader as any).subimg=(ImgLoader as any).subimage=(ImgLoader as any).cut=(ImgLoader as any).cutimg=(ImgLoader as any).cutImage=(img,x,y,w,h)=>{
    if(!img) return;
    let canvas2 = document.createElement('canvas');
    canvas2.className="canvas2";
    if((ImgLoader as any).enableCors){
        img.crossOrigin = "anonymous";
    }
    canvas2.width = w;
    canvas2.height = h;
    if(w>img.width) w=img.width; if(h>img.height) h=img.height;
    let context = canvas2.getContext("2d") as CanvasRenderingContext2D;
    document.body.appendChild(canvas2);
    context.drawImage(img, x, y , w, h, 0, 0, canvas2.width, canvas2.height);
    let imgurl=canvas2.toDataURL();
    canvas2.remove();
    return (ImgLoader as any).loadImage(imgurl,w,h);
}
(ImgLoader as any).subimgs=(ImgLoader as any).subimages=(ImgLoader as any).cuts=(ImgLoader as any).cutimgs=(ImgLoader as any).cutImages=(img,imgs)=>{
    let timgs:any[]=[];
    imgs.forEach((u)=>{
        if(Array.isArray(u)&&isNaN(u[0])){
            if(!u) return;
            u.forEach((ur)=>{
                if(!ur) return;
                let timg=(ImgLoader as any).cut(img,ur.x??ur[0],ur.y??ur[1],ur.w??ur[2],ur.h??ur[3]);
                if(timg) timgs.push(timg);
            });
        }else{
            let timg=(ImgLoader as any).cut(img,u.x??u[0],u.y??u[1],u.w??u[2],u.h??u[3]);
            if(timg) timgs.push(timg);
        }
    })
    return timgs;
}

//**! Scene Tab */

export class Camera2D extends GameObject{
    public obj;
    public zoomCenter:GameObject;
    constructor(x,y,w?,h?,public zoom=1){
        super(x,y,w,h);
        this.obj=this;
        this.calculateTransformMatrix()
    }
    private lastTransformMatrix;
    private calculateTransformMatrix(){
        let z=this.zoom>0?this.zoom:(-1/this.zoom);
        let px=this.obj.pos.x;
        let py=this.obj.pos.y;
        let offzx=(this.zoomCenter?.pos?.x??0)-W/2;
        let offzy=(this.zoomCenter?.pos?.y??0)-H/2;
        if(this.obj!==this){
            px+=this.x;
            py+=this.y;
        }
        let transformMatrix=MatrixStack2D.translation(-px-offzx,-py-offzy)
        .mult(MatrixStack2D.translation(-W/2,-H/2))
            .mult(MatrixStack2D.rotation(this.rotation))
            .mult(MatrixStack2D.scaling(z,z))
            .mult(MatrixStack2D.translation(W/2+offzx,H/2+offzy));
        this.lastTransformMatrix=transformMatrix;   
        return transformMatrix
    }
    get transformMatrix():Matrix3D{
        if(this.info.changed.any){
            this.calculateTransformMatrix()
        }
        return this.lastTransformMatrix;
    }
    public follow(obj:GameObject){
        if(!obj) this.obj=this;
        this.obj=obj;
        return this;
    }
    
    public setZoomCenter(obj:GameObject){
        if(!obj) this.zoomCenter=undefined as any;
        this.zoomCenter=obj;
        return this;
    }
}

export class /**
 * @abstract
 */ ObjectManager<T>{
    public objs:Array<T>;
    constructor(objs:Array<T>=[]){
        this.objs=objs;
    }
    add(...objs:any){
        for (let i = 0; i < objs.length; i++) {
            this.objs.push(objs[i]);
        }
    }
    func(name:string,...args:any){
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            (obj as any)?.[name]?.(...args);
            // if(name in obj&&typeof obj.name == "function"){
            //     obj[name]?.(...args)
            // }
        }
    }
    protected ManagerFilter:((o,i,arr)=>Boolean)|undefined=undefined;
    filterObjects(filter:(o)=>Boolean){
        let retObjs= this.objs.filter(filter);
        if(!!this.ManagerFilter){
            return retObjs.filter(this.ManagerFilter)
        }
        return retObjs;
    }

}


export class Layer extends ObjectManager<any|GameObject>{
    public stack:MatrixStack2D=new MatrixStack2D();
    public uuid=generateUUID();
    constructor(public id:string, public canvas:ModernCanvas&HTMLCanvasElement,public scene:Scene=Scene.sc){
        super([]);
    }
    public preExtraTick:undefined|((...args)=>void);
    public posExtraTick:undefined|((...args)=>void);

    public preExtraDraw:undefined|((ctx:MCTX,...args)=>void);
    public posExtraDraw:undefined|((ctx:MCTX,...args)=>void);
    getWidth():number{
        return this.canvas.width;
    }
    getHeight():number{
        return this.canvas.height;
    }
    draw(...args){
        this.canvas.ctx.lastDrawnLayer=this;
        this?.preExtraDraw?.(this.canvas.ctx as MCTX,...args);
        this.func("draw",this.canvas.ctx,...args);
        this?.posExtraDraw?.(this.canvas.ctx as MCTX,...args);
    }
    
    tick(...args){
        this.canvas.ctx;
        this?.preExtraTick?.(...args);
        this.func("tick",...args);
        this?.posExtraTick?.(...args);
    }
    //NOTE - Wont remove a GroupObject From memory
    killObjs(filterfc:(obj:any)=>boolean=(o)=>!!o&&o?.dead!==true){
        this.objs=this.objs.filter(filterfc);
    }
    findObjects(filter:(o)=>Boolean,conditions?:Object):GameObject[]{
        let retObjs:GameObject[]= [];
        for (let i = 0; i < this.objs.length; i++) {
            let obj=this.objs[i];
            if(obj instanceof GameObject && filter(obj)){
                retObjs.push(obj)
            }else if(obj instanceof ObjectGroup){
                retObjs.push(...obj.findObjects(filter,conditions));
            }
        }
        return retObjs;
    }
}
class ObjectGroup extends ObjectManager<GameObject>{
    constructor(public name:string,public layer:Layer, objs:GameObject[]=[]){
        super(objs);
    }
    // getWidth():number{
    //     return this.canvas.width;
    // }
    // getHeight():number{
    //     return this.canvas.height;
    // }
    draw(...args){
        this.func("draw",...args);
    }
    
    tick(...args){
        this.func("tick",...args);
    }
    //FIXME - May have memory issues if killing a group, need to detect when and kill those objects too or other fixes
    killObjs(filterfc:(obj:any)=>boolean=()=>true){
        this.objs=this.objs.filter(filterfc);
    }
    findObjects(filter:(o)=>Boolean,conditions?:Object):GameObject[]{
        return this.filterObjects(filter);
    }
    static create(layer:Layer,...objs){
        let length=objs.length;
        let group= new ObjectGroup(`(${length}) ObjGroup`,layer)
    }
}

class StaticDrawBoxObjectGroup extends ObjectGroup{
    constructor(public name:string,public layer:Layer, objs:GameObject[]=[],
                    public x:number=0,public y:number=0,public w:number=1080,public h:number=720){
        super(name,layer,objs);
    }
    // static filterObjects(x:number=0, y:number=0, w:number=1080, h:number=720,objs:GameObject[]){
    //     return objs.filter
    // }
    override draw(ctx:MCTX,...args){
        let [x,y]=ctx.applyStack(this.x,this.y,this.w,this.h);
        if (x + this.w < 0 || x > W || y + this.h < 0 || y > H) {
            return;
        }
        this.func("draw",ctx,...args);
    }
    setBounds(x,y,w,h){
        this.x=x;this.y=y;this.w=w;this.h=h;
    }
    override findObjects(filter:(o)=>Boolean,conditions?:any):GameObject[]{

        if(conditions?.obj){
            //Detect RequestObject isnt far away unless request conditions says other
        }
        return super.findObjects(filter,conditions);
    }
}

/**
 * Scene contains multiple layers, each with a ctx
 * GameScene is the Layer, you should code game functions in Layer class
 */
export class Scene extends ObjectManager<Layer>{
    static sc=new Scene();
    public stack:MatrixStack2D=new MatrixStack2D();
    public uuid=generateUUID();
    constructor(objs=[],public cam:Camera2D=new Camera2D(0,0,1)){
        super(objs);
        // (<MatrixStack2D>this.stack).translate(cam.x,cam.y);
    }
    public preExtraTick:undefined|((...args)=>void);
    public posExtraTick:undefined|((...args)=>void);

    public preExtraDraw:undefined|((...args)=>void);
    public posExtraDraw:undefined|((...args)=>void);
    /**
     * Change the matrixStack thats being used,
     * this cam be useful for creating a Scene in 2D
     */
    setMatrixStack(stack:MatrixStack2D):Scene{
        this.stack=stack;
        return this;
    }
    addLayer(lay:Layer){
        super.add(lay)
    }
    getLayer(n:number){
        return this?.objs?.[n]||undefined;
    }
    getLastLayer(){
        return this?.objs?.[(this?.objs?.length||1)-1]||undefined;
    }
    getFirstLayer(){
        return this?.objs?.[0]||undefined;
    }
    add(layer:number|Layer|any=0,...objs:any){
        let lay=layer;
        if(!objs) objs=[];
        if(layer instanceof Layer) lay=this.objs.indexOf(layer);
        else if(typeof layer !== "number"){
            objs?.push?.(layer);
            lay=0;
        }
        this.objs[lay].add(...objs);
        return this;
    }
    draw(...args){
        this?.preExtraDraw?.(...args);
        this.func("draw",...args);
        this?.posExtraDraw?.(...args);
    }
    tick(...args){
        this.func("tick",...args);
    }
    setCamera2D(cam:Camera2D=this.cam||new Camera2D(0,0,10,10)):Scene{
        this.cam=cam;
        // if(this.stack instanceof MatrixStack2D){
        //     this.stack.resetStack();
        //     this.stack.translate(cam.pos.x,cam.pos.y);
        //     this.stack.scale(cam.zoom,cam.zoom);
        // }
        return this;
    }
    /**
     * Similar to func, this will call func function on every layer of the scene
     * as if Scene only had a flat array of objects.
     */
    funcLayers(name:string,...args:any){
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            (obj as any)?.func?.(name,...args);
        }
    }
    killObjs(filterfc?:(obj:any)=>boolean){
        this.func("killObjs",filterfc);
    }
    override ManagerFilter=undefined;
    findObjects(filter:(o)=>boolean,conditions?:Object):GameObject[]{
        let retObjs:GameObject[]= [];
        for (let i = 0; i < this.objs.length; i++) {
            retObjs.push(...this.objs[i].findObjects(filter,conditions))
        }
        return retObjs;
    }
}   


export function createLayer(c?:ModernCtx & CanvasRenderingContext2D,sc?:Scene){
    if(!c&&!sc) return;
    if(!c) c=sc?.objs?.[0]?.canvas.ctx as ModernCtx & CanvasRenderingContext2D;
    let cnvs=(c as any as CanvasRenderingContext2D).canvas
    let cid=cnvs.id;
    let canvs=cnvs as ModernCanvas & HTMLCanvasElement;
    let layer=new Layer(cid,canvs,sc??(c.layer.scene)??new Scene());
    layer?.scene?.addLayer?.(layer);
    
    let collec:ModernCanvasCtxTuple={canvas:canvs,ctx:c,append() {
        return collec;
    },center(ops) {
        return collec;
    },}
    return collec;
}

export class Scene3D extends Scene{
    // override stack:MatrixStack3D=new MatrixStack3D();
}

//**! Audio */

var pendantAudio:[HTMLAudioElement,boolean?][]=[];
var volume=1;
export function setVolume(vol){
    volume=vol;
}
export class AudioLoader{
    constructor(public folder:string){
        if(this.folder){
            this.load=(filename,vol=1)=>{
                var audio = new Audio(this.folder+filename);
                audio.src=this.folder+filename;
                audio.volume=vol;
                (audio as any).vol=vol;
                return audio;
            }
        }
    }
    load(filename,vol=volume):HTMLAudioElement{
        var audio = new Audio(this.folder+filename);
        audio.src=this.folder+filename;
        audio.volume=vol;
        (audio as any).vol=vol;
        return audio;
    }
    static load(filename,vol=1){
        var audio = new Audio(filename);
        audio.src=filename;
        audio.volume=vol;
        (audio as any).vol=vol;
        return audio;
    }
    static loadAudios(...url){
        let auds:HTMLAudioElement[]=[];
        url.forEach((u)=>{
            if(Array.isArray(u)){
                u.forEach((ur)=>{
                    let taud=this.load(ur);
                    if(taud) auds.push(taud);
                });
            }else{
                let taud=this.load(u);
                if(taud) auds.push(taud);
            }
        })
        return auds;
    }
    playAudio(audio, multi=true){
        try {
            audio.volume=Math.min(Math.max(volume*audio.vol,0),1);
            let promise;
            if(audio.paused)
                promise=audio.play();
            else if(multi){
                promise=(audio.cloneNode(false)as HTMLMediaElement).play()
                promise.catch(()=>{ 
                    pendantAudio.push([audio,multi]);
                });
            }
        } catch (error) {
            console.log(error);
        }
    
    }
    /**
     *
     *
     * @static
     * @param {HTMLAudioElement} audio
     * @param {boolean} [multi=true] if true will create multiple instances if clicked twice, else this will wait
     * @memberof AudioLoader
     */
    static playAudio(audio, multi=true){
        try {
            audio.volume=Math.min(Math.max(volume*audio.vol,0),1);
            let promise;
            if(audio.paused)
                promise=audio.play();
            else if(multi){
                    promise=(audio.cloneNode(false)as HTMLMediaElement).play()
                    promise.catch(()=>{ 
                    pendantAudio.push([audio,multi]);
                });
            }
        } catch (error) {
            console.log(error);
        }
    
    }
    static setVolume(vol){
        volume=vol;
    }
    setVolume(vol){
        volume=vol;
    }
}
export function playAudio(audio,multi=true){
    if(!audio||!audio.loaded) return;
    if(!audioPermitted){
        pendantAudio.push([audio,multi]);
        return;
    }
    try {
        audio.volume=Math.min(Math.max(volume*audio.vol,0),1);
        let promise;
        if(audio.paused)
            promise=audio.play();
        else if(multi){
            promise=(audio.cloneNode(false)as HTMLMediaElement).play()
            promise.catch(()=>{ 
                pendantAudio.push([audio,multi]);
            });
        }
    } catch (error) {
        audioPermitted=false;
        console.log(error);
    }

}
var audioPermitted=true;
export var isAudioPermitted=()=>{
    return audioPermitted;
}
export var setAudioPermitted=(is=true)=>{
    audioPermitted=is;
}
export function queryAudioPermission(nav=navigator){
    (nav as any)?.getUserMedia?.(
        // constraints
        {
           audio: true
        },
        function(localMediaStream) {
            audioPermitted=true;
         },
        function(err) {
            // if(err === PERMISSION_DENIED) {
            // }
        audioPermitted=false;
        }
     );
    
}

export function usePendantAudio(){
    if(pendantAudio.length==0) return;
    //fa 9 -> DO 8 | -62,000 | from 5512,500 to 2094,750
    if(!pendantAudio[pendantAudio.length-1][0].paused&&pendantAudio[pendantAudio.length-1][1]){
        console.log((pendantAudio[pendantAudio.length-1][0].cloneNode(false)));
        (pendantAudio[pendantAudio.length-1][0].cloneNode(false) as HTMLMediaElement).play();
    }else
        pendantAudio[pendantAudio.length-1][0].play();
    pendantAudio.pop();

}
export function addPendantAudio(audio,multi=true){
    pendantAudio.push([audio,multi]);
}

//**! Inputs */

type KeypressTP={
    a:boolean,
    w:boolean,
    s:boolean,
    d:boolean,
    up:boolean,
    down:boolean,
    right:boolean,
    left:boolean,
    ctrl:boolean,
    shift:boolean,
    space:boolean,
    q:boolean,
    e:boolean,
    t:boolean,
    g:boolean,
    r:boolean,
    f:boolean,
    i:boolean,
    o:boolean,
    h:boolean,
    y:boolean,
    p:boolean,
    m:boolean,
    n:boolean,
    b:boolean,
    v:boolean,
    c:boolean,
    x:boolean,
    z:boolean,
    u:boolean,
    l:boolean,
    j:boolean,
    Enter:boolean,
    Backspace:boolean,
    listen:()=>void,
    Hor:()=>number,
    Ver:()=>number,
    Horizontal:()=>number,
    Vertical:()=>number,
    Depth:()=>number,
    mv2D:(vel?:number)=>Vector2D,
    mv3D:(vel?:number)=>Vector3D,
    createSwitch:(k1:string,k2:string)=>()=>number,
}
export let keypress:KeypressTP={
    a:false,
    w:false,
    s:false,
    d:false,
    up:false,
    down:false,
    right:false,
    left:false,
    ctrl:false,
    shift:false,
    q:false,
    e:false,
    t:false,
    g:false,
    r:false,
    f:false,
    i:false,
    o:false,
    h:false,
    y:false,
    p:false,
    m:false,
    n:false,
    b:false,
    v:false,
    c:false,
    x:false,
    z:false,
    u:false,
    l:false,
    j:false,
    Enter:false,
    Backspace:false,
    none:false,
} as any

keypress.createSwitch=(k1:string,k2:string)=>{
    return ()=>{
        return keypress[k1]?-1:keypress[k2]?1:0;
    }
}

keypress.Hor=keypress.Horizontal=()=>{
    return keypress.a?-1:keypress.d?1:0;
}
keypress.Ver=keypress.Vertical=()=>{
    return keypress.w?-1:keypress.s?1:0;
}
keypress.Depth=()=>{
    return keypress.q?-1:keypress.e?1:0;
}
keypress.mv2D=(vel=1)=>{
    return new Vector2D(keypress.Hor()*vel,keypress.Ver()*vel);
}
keypress.mv3D=(vel=1)=>{
    return new Vector3D(keypress.Hor()*vel,keypress.Ver()*vel, keypress.Depth()*vel);
}
Object.defineProperty(keypress, 'space', {
    get: function() {
      // Your getter logic here
      return keypress[" "]
    }
  });
  Object.defineProperty(keypress, 'Backspace', {
    get: function() {
      // Your getter logic here
      return keypress["backspace"]
    }
  });
  Object.defineProperty(keypress, 'Enter', {
    get: function() {
      // Your getter logic here
      return keypress["enter"]
    }
  });

export class KeyManager{
    static keypress=keypress
    static detectKeys=(keys=keypress)=>{
        let space;
        if(!keys||(keys as any).detected===true) return
        (keys as any).detected=true;
        let pressfun=(e)=>{
            keys[e.key.toLowerCase()]=true;
            if(this.presscb)
                (this.presscb as any)?.(e);
        }
        window?.addEventListener?.("keydown",pressfun)
        // window?.addEventListener?.("keypress",(e)=>{
        //     if(e.keyCode===fullScreenKey||e.code===fullScreenKey||e.key.toLowerCase()===fullScreenKey){
        //         openFullscreen();
        //     }
        // })
        // window?.addEventListener?.("keypress",pressfun)
        window?.addEventListener?.("keyup",(e)=>{
            keys[e.key.toLowerCase()]=false;
        });
        window?.addEventListener?.("keydown",(e)=>{
            if(e.key==="ArrowLeft"){
                keypress.left=true;
            }
            if(e.key==="ArrowRight"){
                keypress.right=true;
            }
            if(e.key==="ArrowUp"){
                keypress.up=true;
            }
            if(e.key==="ArrowDown"){
                keypress.down=true;
            }
            
            if (e.code === 'ShiftRight') {
                keypress["ShiftRight"]=true;
            } else if (e.code === 'ShiftLeft') {
                keypress["ShiftLeft"]=true;
            }
        })
        window?.addEventListener?.("keyup",(e)=>{
            if(e.key==="ArrowLeft"){
                keypress.left=false;
            }
            if(e.key==="ArrowRight"){
                keypress.right=false;
            }
            if(e.key==="ArrowUp"){
                keypress.up=false;
            }
            if(e.key==="ArrowDown"){
                keypress.down=false;
            }

            if (e.code === 'ShiftRight') {
                keypress["ShiftRight"]=false;
            } else if (e.code === 'ShiftLeft') {
                keypress["ShiftLeft"]=false;
            }
        })
    }    
    static presscbs:any[]=[];
    static presscb(e){
        for (let i = 0; i < this.presscbs.length; i++) {
            const cb = this.presscbs[i];
            if(!!cb&&cb.key!==undefined&&cb.key.toLowerCase()==e.key.toLowerCase()
              &&cb.cb!==undefined&&typeof cb.cb=="function"){
                cb.cb?.(e);
            }
        }
    }
    static addEventOnPress(key,cb){
        this.presscbs.push({key,cb})
    }
    static OnKey(key,cb){
        this.addEventOnPress(key,cb);
    }
    static OnPress(key,cb){
        this.addEventOnPress(key,cb);
    }
}
keypress.listen=()=>{
    KeyManager.detectKeys(keypress);
}

//**? Mouse */
const clicklisteners:({who:Object,lis:Function,pars:any[]})[]=[];
const wheellisteners:({who:Object,lis:Function,pars:any[]})[]=[];
export class ListenerManager{
    static onClick(scene,sc,...pars){
        if(!sc) return;
        clicklisteners.push({who:scene,lis:sc,pars:pars});
    }
    static onWheel(scene,sc_funcLayers,...pars){
        if(!sc_funcLayers) return;
        wheellisteners.push({who:scene,lis:sc_funcLayers,pars:pars});
    }
}
export var mousepos={x:0,y:0,lastid:""}
export var mouseposes=[];
export var mouseclick=[false,false,false];
(mouseclick as any).isAny=()=>{
    for (let i = 0; i < mouseclick.length; i++) {
        if(mouseclick[i]) return true;
    }
    return false;
}
(mouseclick as any).isAnyFalse=()=>{
    for (let i = 0; i < mouseclick.length; i++) {
        if(!mouseclick[i]) return true;
    }
    return false;
}
(mouseclick as any).count=()=>{
    let count=0;
    for (let i = 0; i < mouseclick.length; i++) {
        if(mouseclick[i]) count++;
    }
    return count;
}

const getElementFromIdOrElement=(id:any|string|HTMLElement)=>{
    let element;
    if(typeof(id)=="string") element=document.getElementById(id)
    if(!(element instanceof HTMLElement)) return 
    return element
}

const mousemove=(e,ic,id)=>{
    if(!ic) return;
    let canvas=id;
    if(typeof(id)=="string") canvas=document.getElementById(id)
    if(!(canvas instanceof HTMLElement)) return
    const pos = e?.currentTarget?.getBoundingClientRect?.()??{left:parseInt(canvas.style.marginLeft.substring(0,canvas.style.marginLeft.length-2)),top:0};
    let x,y;
    let x2m,y2m;
    
    if(e.touches&&e.touches.length>0){
        // @ts-ignore
        x=(e.touches[0].clientX - pos.left)??e.touches[0].screenX;
        // @ts-ignore
        y=(e.touches[0].clientY - pos.top)??e.touches[0].screenY;
        for (let i = 0; i < e.touches.length; i++) {
            
            // @ts-ignore
            x2m=(e.touches[i].clientX - pos.left)??e.touches[i].screenX;
            // @ts-ignore
            y2m=(e.touches[i].clientY - pos.top)??e.touches[i].screenY;
            if(!mouseposes[e.touches[i].identifier]){
                mouseposes[e.touches[i].identifier]={x:0,y:0,lastid:""}
            }
            mouseposes[e.touches[i].identifier].x=x2m;
            mouseposes[e.touches[i].identifier].y=y2m;
            calculatemousepos(x2m,y2m,id,mouseposes[e.touches[i].identifier]);
            mouseclick[e.touches[i].identifier]=true;
            
        }
    }else{
        // @ts-ignore
        x=(e.clientX - pos.left)??e.offsetX;
        // @ts-ignore
        y=(e.clientY - pos.top)??e.offsetY;
    }
    calculatemousepos(x,y,id);
}
function addCanvasListeners(ccanvas:HTMLCanvasElement){
    ccanvas.addEventListener("mousemove",(e)=>(mousemove(e,true,ccanvas.id)))
    ccanvas.addEventListener("touchmove",(e)=>(mousemove(e,true,ccanvas.id)));
    ccanvas.addEventListener("mousedown",(e)=>(mousedown(e,true,ccanvas.id)))
    ccanvas.addEventListener("touchstart",(e)=>(mousedown(e,true,ccanvas.id)));
    ccanvas.addEventListener("mouseup",(e)=>(mouseup(e,true,ccanvas.id)))
    ccanvas.addEventListener("mouseleave",(e)=>(mouseup(e,true,ccanvas.id)))
    ccanvas.addEventListener("touchend",(e)=>(mouseup(e,true,ccanvas.id)));
    ccanvas.addEventListener("touchcancel",(e)=>(mouseup(e,true,ccanvas.id)));
}
export function isFullScreen() {
    return ((window as any).fullScreen) || (window?.innerWidth == screen.width && window?.innerHeight == screen.height);
}
export class ScreenManager{
    static isFullScreen(){
        return isFullScreen()
    }
    static setFullScreen(canvas){
        openFullscreen(canvas)
    }
}
window?.addEventListener?.("mousemove",(e)=>{
    if(isFullScreen()){  mousemove(e,true,e.target);}
})
window?.addEventListener?.("touchmove",(e)=>{
    if(isFullScreen()) mousemove(e,true,e.target);
})
function calculatemousepos(x,y,canvasid,mpos=mousepos){
    let can=getElementFromIdOrElement(canvasid);
    if(!can||!window) return;
    let stylew;//parseInt(canvas.style.width.substr(0,canvas.style.width.length-2));
    let styleh;//parseInt(canvas.style.height.substr(0,canvas.style.height.length-2));
    let boundingBox=can?.getBoundingClientRect?.()??{left:parseInt(can.style.marginLeft.substring(0,can.style.marginLeft.length-2)),top:0};
    stylew=can.getBoundingClientRect().width;
    styleh=can.getBoundingClientRect().height;
    
    if(!isFullScreen()){
        // y+=-can.offsetTop;
        // x+=window?.scrollX;
    }else{
        x+=boundingBox.left-can.getBoundingClientRect().x;
    }
    let cw=stylew, ch=styleh;
    if(can instanceof HTMLCanvasElement){
        cw=can.width;
        ch=can.height;
    }
    mpos.x=cw*x/stylew;
    mpos.y=ch*y/styleh;
    mpos.lastid=canvasid;
    return mpos;
}
const mousedown=(e,ic,id)=>{
    mouseclick[e.button]=true;
    if(!ic) return;
    usePendantAudio();
    var pos = e?.currentTarget?.getBoundingClientRect?.()??{left:0,top:0};
    let x,y;
    let x2m,y2m;
    if(e.touches&&e.touches.length>0){
        // @ts-ignore
        x=(e.touches[0].clientX - pos.left)??e.touches[0].screenX;
        // @ts-ignore
        y=(e.touches[0].clientY - pos.top)??e.touches[0].screenY;
        for (let i = 0; i < e.touches.length; i++) {
            
            // @ts-ignore
            x2m=(e.touches[i].clientX - pos.left)??e.touches[i].screenX;
            // @ts-ignore
            y2m=(e.touches[i].clientY - pos.top)??e.touches[i].screenY;
            if(!mouseposes[e.touches[i].identifier]){
                mouseposes[e.touches[i].identifier]={x:0,y:0,lastid:""}
            }
            mouseposes[e.touches[i].identifier].x=x2m;
            mouseposes[e.touches[i].identifier].y=y2m;
            calculatemousepos(x2m,y2m,id,mouseposes[e.touches[i].identifier]);
            mouseclick[e.touches[i].identifier]=true;
            
        }
    }else{
        // @ts-ignore
        x=(e.clientX - pos.left)??e.offsetX;
        // @ts-ignore
        y=(e.clientY - pos.top)??e.offsetY;
    }
    calculatemousepos(x,y,id);
    const x1=mousepos.x, y1=mousepos.y;
    for (let i = 0; i < clicklisteners.length; i++) {
        const lis = clicklisteners[i];
        lis.lis.apply(lis.who,[...lis.pars,x1,y1,true,e.button||0,ic,id,x2m,y2m]);
    }
};

const mouseup=(e,ic,id)=>{
    mouseclick[e.button]=false;
    if(!ic) return;
    const pos = e?.currentTarget?.getBoundingClientRect?.()??{left:0,top:0};
    let x,y;
    let x2m,y2m;
    if(e.touches||e.changedTouches){
        if(e.changedTouches.length>0){
            for (const touch of e.changedTouches) {
                mouseclick[touch.identifier]=false;
            }
        }
        if(e.touches.length>0){
            // @ts-ignore
            x=(e.touches[0].clientX - pos.left)??e.touches[0].screenX;
            // @ts-ignore
            y=(e.touches[0].clientY - pos.top)??e.touches[0].screenY;
            
            for (let i = 0; i < e.touches.length; i++) {
                
                // @ts-ignore
                y2m=(e.touches[i].clientX - pos.left)??e.touches[i].screenX;
                // @ts-ignore
                x2m=(e.touches[i].clientY - pos.top)??e.touches[i].screenY;
                if(!mouseposes[e.touches[i].identifier]){
                    mouseposes[e.touches[i].identifier]={x:0,y:0,lastid:""};
                }
                mouseposes[e.touches[i].identifier].x=x2m;
                mouseposes[e.touches[i].identifier].y=y2m;
                calculatemousepos(x2m,y2m,id,mouseposes[e.touches[i].identifier]);
                
            }
        }else{
            //When on mobile we now know each touch must be false
            for (let i = 1; i < mouseposes.length; i++) {
                mouseclick[i]=false;
            }

        }
    }else{
        // @ts-ignore
        x=(e.clientX-pos.left)??e.offsetX;
        // @ts-ignore
        y=(e.clientY-pos.top)??e.offsetY;
    }
    calculatemousepos(x,y,id);
    const x1=mousepos.x, y1=mousepos.y;
    for (let i = 0; i < clicklisteners.length; i++) {
        const lis = clicklisteners[i];
        lis.lis.apply(lis.who,[...lis.pars,x1,y1,false,e.button||0,ic,id,x2m,y2m]);
    }
}

export class MouseManager{
    static EnableCanvas(canvas:HTMLCanvasElement){
        addCanvasListeners(canvas)
    }
    static createDoubleClickListenerGameObject(cid?:any):GameObject&{add:((lis:Function)=>void)}{
        let dbclickList=new GameObject() as any;
        dbclickList.listeners=[];
        dbclickList.add=(lis)=>{
            if(typeof lis=="function"){
                dbclickList.listeners.push(lis);
            }
        }
        dbclickList.time=0;
        dbclickList.wasLast=false;
        dbclickList.onClick=(x1,y1,is,button,ic,id,x2m,y2m)=>{
            if(cid&&cid!==id) return;
            if(button!==0) return;
            if(is){
                if(!dbclickList.wasLast){//first time
                    if(x1>W-100&&y1>H-100){//Bottom right corner
                        dbclickList.time=0;
                        dbclickList.wasLast=true;
                    }
                }else if(dbclickList.time>0.05){//Has to be because of Double Click
                    dbclickList.wasLast=false;
                    dbclickList.listeners.forEach(lis => {
                        lis&&lis(dbclickList.time);
                    });
                    dbclickList.time=0;
                }
            }
        }
        dbclickList.tick=(dt)=>{
            if(dbclickList.time===undefined||(!dbclickList.wasLast)) return;
            dbclickList.time+=dt;
            if(dbclickList.time>0.4){
                dbclickList.wasLast=false;
                dbclickList.time=0;
                dbclickList.wasLastRelease=false;
            }
        }
        return dbclickList;
    }
}
export function openFullscreen(canv) {
    if (canv.requestFullscreen) {
      canv.requestFullscreen();
    } else if (canv.webkitRequestFullscreen) { /* Safari */
      canv.webkitRequestFullscreen();
    } else if (canv.msRequestFullscreen) { /* IE11 */
      canv.msRequestFullscreen();
    }
}
//used for scene, layer and object's dynamic ids
function generateUUID(): string {
    const hex: string[] = [];
    for (let i = 0; i < 256; i++) {
        hex[i] = (i < 16 ? '0' : '') + i.toString(16);
    }

    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);

    // Set specific bits for UUID version and variant
    buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 1

    return (
        hex[buffer[0]] + hex[buffer[1]] +
        hex[buffer[2]] + hex[buffer[3]] + '-' +
        hex[buffer[4]] + hex[buffer[5]] + '-' +
        hex[buffer[6]] + hex[buffer[7]] + '-' +
        hex[buffer[8]] + hex[buffer[9]] + '-' +
        hex[buffer[10]] + hex[buffer[11]] +
        hex[buffer[12]] + hex[buffer[13]] +
        hex[buffer[14]] + hex[buffer[15]]
    );
}


//**! end of the file */


// var sc=new Scene();
// sc.add(new GameObject(0,10,200,200));
// sc.func("draw",ctx);