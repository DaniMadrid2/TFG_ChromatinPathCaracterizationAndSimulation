import {Camera2D, createCanvas, createLayer, ModernCanvasOptions, GameObject, ImgLoader, ModernCtx, Scene,MouseManager, ListenerManager, openFullscreen} from "/Code/Game/Game.js";
import {Easer} from "/Code/MathRender/MathRender.js"



function isResizedC(data_id) {
    const lateralDivs = document.querySelectorAll('.dnti-outside [data-id]');
    for (let i = 0; i < lateralDivs.length; i++) {
        let latDiv=lateralDivs[i];
        if(latDiv.getAttribute("data-id")==data_id){
            if(latDiv.children.length!=0){
                return false;
            }
        }
        
    }
    return true;
    
}


function getElementBySelector(selector,i=0){
    let objs=document.querySelectorAll(selector);
    if(objs.length==0) return
    if(i>objs.length-1) i=objs.length-1;
    return objs[i];
}
function getPositionOf(targetElement:HTMLElement) {
    if(!targetElement) return{
        top:0,left:0,y:0,x:0,width:0,height:0,bottom:0,right:0
    }
    
    // Calculate position relative to the document's top left corner
    
    let rect = targetElement.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        x: rect.left + window.scrollX,
        height: rect.height,
        width: rect.width,
        bottom:rect.bottom + window.scrollY,
        right:rect.right + window.scrollX,
    };
}

export const createCanvasNextTo=function(isResized:((string)=>boolean)|boolean=((cid)=>isResizedC(cid)),
        cid:string,nextToid:string=undefined,
        nextFcs:{
            dx?:((isResizedCanvas:boolean,offx:number,c?)=>(number|string)),
            dy?:((isResizedCanvas:boolean,offx:number,c?)=>(number|string)),
            dw?:((isResizedCanvas:boolean,offx:number,c?)=>(number|string)),
            dh?:((isResizedCanvas:boolean,offx:number,c?)=>(number|string))
        }={
            dx:(()=>0),
            dy:(()=>0),
            dw:(()=>0),
            dh:(()=>0),
        },
        canvasCenterOptions:ModernCanvasOptions={
            absolute:false,
            maxRes:true,
            father:null,
            autoResize:true,
            boundingBox:undefined,
            contexttype:"2d",
        },
        W:number=1080,H:number=720,setDoubleClick=true
    ){
    
    if(typeof isResized=="boolean"){
        const was_resized=isResized;
        isResized=(()=>was_resized) as any;
    } 


    const nextToElement=getElementBySelector(nextToid)
    const getoffx=(c?)=>{
        let isResizedCanvas=(isResized as any)(cid);
        if(!nextToElement) return 0;
        return isResizedCanvas?0:(getPositionOf(nextToElement)?.right+(-(getPositionOf((c as any)?.parentElement?.parentElement)?.left||0)));
    }
    let initialBoxCanvas={
        x:(c?)=>{
            let isResizedCanvas=(isResized as any)(cid);
            let offx=getoffx(c);
            return offx+(nextFcs.dx?.(isResizedCanvas,offx,c)??(nextFcs.dx as any)??0);
        },
        y:(c?)=>{
            let isResizedCanvas=(isResized as any)(cid);
            let offx=getoffx(c);
            return (nextFcs.dy?.(isResizedCanvas,offx,c)??(nextFcs.dy as any)??0);
        },
        w:(c?)=>{
            let isResizedCanvas=(isResized as any)(cid);
            let offx=getoffx(c);
            let value=nextFcs.dw?.(isResizedCanvas,offx,c)??(nextFcs.dw as any);
            if(!!value&&typeof value!="number")
                return value;
            return Math.min((value??0),window.innerWidth);
        },
        h:(c?)=>{
            let isResizedCanvas=(isResized as any)(cid);
            let offx=getoffx(c);
            let value=nextFcs.dh?.(isResizedCanvas,offx,c)??(nextFcs.dh as any);
            if(!!value&&typeof value!="number")
                return value;
            return Math.min((value??0),window.innerHeight);
        },
    }

    let scene=new Scene();
    canvasCenterOptions.boundingBox=initialBoxCanvas;
    let {canvas,ctx}=createCanvas(cid,W,H,scene,canvasCenterOptions.contexttype).center(
        canvasCenterOptions
    ).modern(); //"createCanvas('#C1')"
    (canvas as any).recheckVisible?.();
    MouseManager.EnableCanvas(canvas);
    ListenerManager.onClick(scene,scene.funcLayers,"onClick");
    if(setDoubleClick){
        let dbClickList=MouseManager.createDoubleClickListenerGameObject(canvas.id);
        scene.add(dbClickList)
        dbClickList.add(()=>{
            openFullscreen(canvas)
        });
    }
    
    //* < Set Slide Percentage Example > 
    // ctx.fillStyle="blue";

    // (canvas2 as any).slidePercentage=0;
    // let vel=0;
    // setInterval(()=>{
    //     canvas2.slidePercentage+=vel;
    //     if(Math.abs(canvas2.slidePercentage)>1){
    //         vel*=-1;
    //     }
    //     canvas2.resize()
    // },5)
    //* < Set Slide Percentage Example /> 




    // createLayer(ctx,scene);//Second layer

    if((ctx.canvas as any).pausedt===undefined){
        (ctx.canvas as any).pausedt=0;
    }
    ctx.canvas.addEventListener("click",()=>{   
        ctx.canvas.running=!ctx.canvas.running;
    })

    var pausedImage=ImgLoader.load("/Imgs/Site/Icons/simple_pause.png")
    ImgLoader.applyFilter(pausedImage,46, 205, 181)

    /**
     * 
     * @returns If the canvas is paused
     */
    const tickPausedButton=(dt)=>{
        if(ctx.canvas?.visible===false||(ctx.canvas)?.cantPause===true) return;
        // scene.draw(ctx);
        if((ctx.canvas as any).pausedt!==undefined){
            if(ctx.canvas?.running===false){
                if((ctx.canvas as any).pausedt<1){
                    (ctx.canvas as any).pausedt+=dt*1.218;
                    if((ctx.canvas as any).pausedt>1)
                        (ctx.canvas as any).pausedt=1;
                }

            }else{
                if((ctx.canvas as any).pausedt>0){
                    (ctx.canvas as any).pausedt-=dt*1.218;
                    if((ctx.canvas as any).pausedt<0)
                        (ctx.canvas as any).pausedt=0;
                }
            }
            if((ctx.canvas as any).pausedt>0){
                let dy=Easer.EaseInOut.ease((ctx.canvas as any).pausedt)*100;
                scene.getLastLayer().canvas.ctx.tmpoptions.noApplyStack=true;
                scene.getLastLayer().canvas.ctx.image(pausedImage,W-97,H-dy,95,95,1);//if right x=W-97 else its 3
                scene.getLastLayer().canvas.ctx.tmpoptions={};
            }
            //TODO ADD Fullscreen button (depending on canvas settings)
            
            // if(ctx.canvas.running===false){
            //     return;
            // }
            
        }
        // isDark=document.documentElement.classList.contains('dark');

        // scene.tick(dt);
        return ctx.canvas.running===false;
    }


    document.addEventListener("scroll",()=>{
        (ctx.canvas as any)?.recheckVisible?.();
    })
    
    return {
        screen:{
            W,
            H,
            scene,
            ctx,
        },
        tickPausedButton
    }
}