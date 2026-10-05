import { GameObject, MCTX } from "../Game/Game.mjs";
import { Matrix2D, Vector2D } from "../Matrix/Matrix.mjs";

type ColorObj={r?:number,g?:number,b?:number};
type WidthObj={w?:number,h?:number}
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function parseColor(color:string):ColorObj{
    let rgba=color;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(rgba)){
        return {...hexToRgb(rgba)};
    }
    let [r,g,b] = rgba.match(/\d+/g)  as any as [number,number,number];
    return {r:~~r,g:~~g,b:~~b};
}
export class MathJaxLoader{
    static loadEq(eq:string,color?:ColorObj|string, width?:WidthObj,
        filterColor?:(img:HTMLImageElement,color:ColorObj, width:WidthObj)=>string):HTMLImageElement&{loaded:boolean}
    {
        return this.loadEquation(eq,color,width,filterColor);
    }
    static loadEquation(eq:string,color?:ColorObj|string, width:WidthObj={w:100,h:100},
                    filterColor?:(img:HTMLImageElement,color:ColorObj, width:WidthObj)=>string):HTMLImageElement&{loaded:boolean}
    {
        if(typeof color=="string"){
            color=parseColor(color);
        }
        let svg = (MathJax as any).tex2svg(eq).firstElementChild;
        svg.style="fill:#060";
        let img = document.createElement('img') as HTMLImageElement&{loaded:boolean};
        img.loaded=false;
        let once=(!!filterColor)||(typeof filterColor==="function");
        width?.w&&(img.width=width?.w);
        width?.h&&(img.height=width?.h);
        color??={r:0,g:0,b:0};
        color.r??=0;color.g??=0;color.b??=0;width.w??=200;width.h??=200;
        img.onload= ()=>{
            if(once){
                once=false;
                if(filterColor){
                    img.src=filterColor(img,color as ColorObj, width as WidthObj);
                }else{
                    img.loaded=true;
                }
            }
            img.loaded=true;
        }
        img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + svg.outerHTML);
        return img;
    }
    static filterColorExample(img,color:ColorObj,width:WidthObj) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;

        const canvasWidth = width?.w||img.width;
        const canvasHeight = width?.h||img.height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let {r=0,g=0,b=0}=color;

        context.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        const sourceImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        const src = sourceImageData.data;
        
        for (let i = 0; i < src.length; i += 4) {
          src[i]=~~(Math.min(r+src[i],256)); //r
          src[i+1]=~~(Math.min(g+src[i+1],256)); //g
          src[i+2]=~~(Math.min(b+src[i+2],256)); //b
        }
        // console.log(r,g,b)
        context.putImageData(sourceImageData, 0, 0);

        return canvas.toDataURL();
    };
    static logHTMLElement(element: HTMLElement, level: number = 0): void {
        // Crear la tabulación según el nivel
        const tab = ' '.repeat(level * 2); // Dos espacios por nivel
    
        // Obtener atributos del elemento
        const attributes = Array.from(element.attributes)
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(' ');
    
        // Loguear el nombre del elemento y sus atributos
        if (attributes) {
            // console.log(`${tab}<${element.tagName.toLowerCase()} ${attributes}>`);
        } else {
            // console.log(`${tab}<${element.tagName.toLowerCase()}>`);
        }
    
        // Recorrer los hijos del elemento
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i] as HTMLElement;
            MathJaxLoader.logHTMLElement(child, level + 1); // Llamar recursivamente con el siguiente nivel
        }
    
        // Loguear el cierre de la etiqueta, si es necesario
        // console.log(`${tab}</${element.tagName.toLowerCase()}>`);
    }
    // Function to get LaTeX paths along with their position and transform data
    static getLatexPaths(eq: string|String): { d: string, x:number, y:number,sx:number,sy:number}[] {
        let svg = (MathJax as any).tex2svg(eq).firstElementChild;
        MathJaxLoader.logHTMLElement(svg)
        return MathJaxLoader.extractPathsFromSVG(svg);
    }
    private static getTranslateValues(string){
        let [x,y,sx,sy]=[0,0,1,1]
        const translateMatches = string.match(/translate\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (translateMatches) {
            translateMatches.forEach(translate => {
                const [, tx, ty] = translate.match(/translate\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                x=parseFloat(tx);y=parseFloat(ty);
            });
        }
        let scaleMatches = string.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (scaleMatches) {
            scaleMatches.forEach(scale => {
                let [, tx, ty] = scale.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                if (tx && ty) {
                    sx=parseFloat(tx);sy=parseFloat(ty);
                }
            });
        }
        
        scaleMatches = !scaleMatches&&string.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*\)/g);
        if (scaleMatches) {
            scaleMatches.forEach(scale => {
                let [, t] = scale.match(/scale\s*\(\s*([-+]?\d*\.?\d+)\s*\)/) || [];
                if (t||t===0) {
                    sx*=parseFloat(t);sy*=parseFloat(t);
                }
            });
        }
        return {x,y,sx,sy}
    }
    static extractPathsFromSVG(svgElement: SVGSVGElement): { d: string, x: number, y: number, sx: number, sy: number }[] {
        const pathsData: { d: string, x: number, y: number, sx: number, sy: number }[] = [];
        
        // Función recursiva para procesar grupos <g>
        const processGroup = (group: SVGGElement|Element, accumulatedTransform: { x: number, y: number, sx: number, sy: number }) => {
            const transformString = group.getAttribute("transform") || "";
    
            
            

            if(group.tagName=="svg"){
                // accumulatedTransform.sx=1;
                // accumulatedTransform.sy=1;
                accumulatedTransform.x+=parseFloat(group.getAttribute("x") as any)*accumulatedTransform.sx;
                accumulatedTransform.y+=parseFloat(group.getAttribute("y") as any)*accumulatedTransform.sy;
            }else{
                // Sumar las transformaciones de translate
                let translateValues=this.getTranslateValues(transformString);
                accumulatedTransform.x+=translateValues.x*accumulatedTransform.sx;
                accumulatedTransform.y+=translateValues.y*accumulatedTransform.sy;
                accumulatedTransform.sx*=translateValues.sx;
                accumulatedTransform.sy*=translateValues.sy;
            }
    
            // Extraer solo los elementos <use> que son hijos directos del grupo
            const uses = group.querySelectorAll(":scope > use, :scope > svg"); // Selecciona todos los <use> en el grupo
            uses.forEach(use => {
                // Verifica si el elemento <use> es un hijo directo del grupo
                if (use.parentElement as any === group || 
                        ( (use.parentElement as any as HTMLElement).tagName=="svg"&&(use.parentElement as any as HTMLElement).parentElement as any === group)
                    ) {
                    const href = use.getAttribute("xlink:href")?.substring(1); // quitar el '#'
                    const pathElement = svgElement.querySelector(`#${href}`); // buscar el path en defs
                    let {x:tx,y:ty,sx:tsx,sy:tsy}=this.getTranslateValues(use.getAttribute("transform")||"");
                    if (pathElement) {
                        const d = pathElement.getAttribute("d") || "";
                        
                        let tempx=accumulatedTransform.x+tx*accumulatedTransform.sx;
                        let tempy= accumulatedTransform.y+ty*accumulatedTransform.sy;
                        let tempsy=accumulatedTransform.sy*tsy;
                        let tempsx=accumulatedTransform.sx*tsx;
                        if(href.includes("TEX-S4")){
                            if(use.parentElement.tagName!=="svg"){
                                // tempsy=Math.abs(tempsy);
                                // tempy=accumulatedTransform.y-ty;
                                // tempsy/=0.7;
                            }else{
                                // tempy-=parseFloat(use.parentElement.getAttribute("height"))/10;
                                // tempy=accumulatedTransform.y-ty;
                                // let globalHeight=parseFloat(svgElement.getAttribute("viewBox").split(" ")[3]);
                                // let svgParentHeight=parseFloat(use.parentElement.getAttribute("viewBox").split(" ")[3]);
                                // tempsy*=1-(svgParentHeight/globalHeight);
                                tempsy*=0.7;

                            }
                        }
                        

                        // Añadir a pathsData el valor de d, x e y acumulados
                        pathsData.push({ d, x: tempx, y:tempy,
                             sx:tempsx,sy:tempsy, href } as any);
                    }
                }
            });
    
            const rects = group.querySelectorAll(":scope > rect"); // Selecciona todos los <rect> en el grupo
            rects.forEach((rect)=>{
                // Verifica si el elemento <rect> es un hijo directo del grupo
                if (rect.parentElement as any === group) {
                    let tx=parseFloat(rect.getAttribute("x") as any);
                    let ty=parseFloat(rect.getAttribute("y") as any);
                    let tw=parseFloat(rect.getAttribute("width") as any);
                    let th=parseFloat(rect.getAttribute("height") as any);

                    let tempx=accumulatedTransform.x;
                    let tempy= accumulatedTransform.y;
                    const d= `M ${tx} ${ty} h ${tw} v ${th} h -${tw} Z`;
                    pathsData.push({ d, x: tempx, y:tempy,
                        sx:accumulatedTransform.sx,sy:accumulatedTransform.sy } as any);
                }
            })


            // Procesar los grupos <g> hijos
            const childGroups = group.children;
            Array.from(childGroups).forEach(childGroup => {
                if(childGroup.tagName=="use") return;
                processGroup(childGroup, { ...accumulatedTransform }); // Llamada recursiva
            });
        };
    
        // Extraer todos los grupos <g> en el SVG
        const groups = svgElement.querySelectorAll(":scope > g");
        Array.from(groups).forEach(group => {
            processGroup(group, { x: 0, y: 0, sx:1, sy:1 }); // Iniciar acumulación desde 0
        });
    
        // console.log(pathsData)

        return pathsData;
    }
    
    
    
    // Obtiene la matriz de transformación acumulada desde los nodos padres
    static getTransformMatrix(el: SVGElement): DOMMatrix {
        let matrix = new DOMMatrix();
        while (el && el.nodeName !== 'svg') {
            const transform = (el as SVGGraphicsElement).transform.baseVal;
            if (transform.length > 0) {
                matrix = transform.consolidate()?.matrix.multiply(matrix) ?? matrix;
            }
            el = (el as any).parentElement as SVGElement;
        }
        return matrix;
    }


    static drawPathsOnCanvas(
        paths: { d: string, x:number, y:number,sx:number,sy:number,color?:string | CanvasGradient | CanvasPattern}[], 
        canvas: HTMLCanvasElement, 
        color: ColorObj = { r: 0, g: 0, b: 0 }, 
        size: number = 1, 
        offset:{x?:number,y?:number,sx?:number,sy?:number}={x:0,y:0,sx:1,sy:1},
        time:number=0
    ) {
        const context = canvas.getContext("2d");
        if (!context) return;

        context.fillStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
        context.strokeStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
        context.lineWidth = 2;
        let scale=1/15*size;
        let dx=50;
        let dy=200;
        paths=paths.sort((a,b)=>{return a.x>b.x?1:-1});
        paths.forEach((pathData, index) => {
            context.beginPath()
            let d=pathData.d;
            if(pathData.color){
                context.fillStyle = pathData.color;
            }else{
                context.fillStyle = `rgb(${color.r ?? 0}, ${color.g ?? 0}, ${color.b ?? 0})`;
            }
            let dl=d.split(" ").length;
            let d2=d.split(" ").reverse().splice(((dl-Math.floor(1-Math.abs(Math.cos(Math.max(Math.min((time/5+(paths.length-index)/paths.length*0.2-0.2)*Math.PI*1.5,Math.PI/2),0)))*dl))%dl)).reverse().join(" ");
            if(!(d2 as any as string).endsWith("Z")) d2+="Z";
            const path = new Path2D(d2);
    
            context.save();
            
            const transformMatrix = new DOMMatrix();
            transformMatrix.translateSelf((pathData.x*scale)*(offset.sx||1)+dx+(offset.x||0)*(offset.sx||1),
                (pathData.y*scale)*(offset.sy||1)+dy+(offset.y||0)*(offset.sy||1)); 
            transformMatrix.scaleSelf(pathData.sx*scale*(offset.sx||1),pathData.sy*scale*(offset.sy||1))
            context.setTransform(transformMatrix);
    
            context.fill(path);
            context.restore();
            context.closePath()
        });
    }

}

export class MathJaxObject extends GameObject{
    public paths=[];
    public is_static=false;
    constructor(public latex:string,x=0,y=0,sx=1,sy=1, public r=255,public g=255, public b=255, public anim_time=5){
        super(x,y,sx,sy);
        this.reload();
    }
    setLatex(latex:string){
        this.latex=latex;
        this.reload();
    }
    reload(){
        this.paths = MathJaxLoader.getLatexPaths(this.latex+"");
    }
    setRGB(r:number,g:number,b:number){
        this.r=r;this.g=g;this.b=b;
    }
    get anim(){
        return this.anim_time;
    }
    set anim(anim:number){
        this.anim_time=anim;
    }
    get sx(){
        return this.w;
    }
    get sy(){
        return this.h;
    }
    set sx(w:number){
        this.w=w;
    }
    set sy(h:number){
        this.h=h;
    }
    draw(ctx:MCTX){
        if(!this.paths) return;
        let [x,y]=ctx.applyStack(this.x,this.y);
        if(this.is_static){
            x=this.x;y=this.y;
        }
        MathJaxLoader.drawPathsOnCanvas(this.paths, ctx.canvas, { r: this.r, g: this.g, b: this.b }, 1,{x,y,sx:this.sx,sy:this.sy},this.anim);
    }
}
export class MathJaxMatrix extends MathJaxObject{
    private last_latex:string="";
    constructor(public v1=new Vector2D(1,0), public v2:Vector2D=new Vector2D(0,1),x=0,y=0,sx=1,sy=1, r=255, g=255, b=255, anim_time=5){
        super(Matrix2D.toLaTex(Matrix2D.fromValues([...(v1 as any),...(v2 as any)])),x,y,sx,sy,r,g,b,anim_time);
        this.last_latex=this.latex;
    }
    getLatex(decimals=2){
        let dec=Math.pow(10,~~(decimals));
        return Matrix2D.toLaTex(Matrix2D.fromValues([...(this.v1 as any),...(this.v2 as any)].map(v=>Math.round(v*(dec))/(dec))));
    }
    tick(dt:number){
        this.latex=this.getLatex();
        if(this.latex!==this.last_latex){
            this.last_latex=this.latex;
            this.reload();
        }
    }
}