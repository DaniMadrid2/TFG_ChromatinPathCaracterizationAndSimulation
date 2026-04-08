    const __fsTargetC1=canvas as any;
    const __baseCanvasW=canvas.width;
    const __baseCanvasH=canvas.height;
    const __baseCanvasStyle={
        position: canvas.style.position || "",
        top: canvas.style.top || "",
        left: canvas.style.left || "",
        width: canvas.style.width || "",
        height: canvas.style.height || "",
        maxWidth: canvas.style.maxWidth || "",
        maxHeight: canvas.style.maxHeight || "",
        zIndex: canvas.style.zIndex || "",
        display: canvas.style.display || ""
    };
    const __baseBodyOverflow=document.body.style.overflow || "";
    const __baseDocOverflow=document.documentElement.style.overflow || "";
    const __applyCanvasFullscreenC1=()=>{
        const isFs=(document.fullscreenElement===__fsTargetC1);
        if(isFs){
            document.body.style.overflow="hidden";
            document.documentElement.style.overflow="hidden";
            canvas.style.position="fixed";
            canvas.style.top="0";
            canvas.style.left="0";
            canvas.style.width="100%";
            canvas.style.height="100%";
            canvas.style.maxWidth="100vw";
            canvas.style.maxHeight="100vh";
            canvas.style.zIndex="999999";
            canvas.style.display="block";
            canvas.width=window.innerWidth;
            canvas.height=window.innerHeight;
        }else{
            document.body.style.overflow=__baseBodyOverflow;
            document.documentElement.style.overflow=__baseDocOverflow;
            canvas.style.position=__baseCanvasStyle.position;
            canvas.style.top=__baseCanvasStyle.top;
            canvas.style.left=__baseCanvasStyle.left;
            canvas.style.width=__baseCanvasStyle.width;
            canvas.style.height=__baseCanvasStyle.height;
            canvas.style.maxWidth=__baseCanvasStyle.maxWidth;
            canvas.style.maxHeight=__baseCanvasStyle.maxHeight;
            canvas.style.zIndex=__baseCanvasStyle.zIndex;
            canvas.style.display=__baseCanvasStyle.display;
            canvas.width=__baseCanvasW;
            canvas.height=__baseCanvasH;
        }
    };
    canvas.addEventListener("dblclick", ()=>{
        if(document.fullscreenElement) document.exitFullscreen?.();
        else openFullscreen(__fsTargetC1);
        setTimeout(__applyCanvasFullscreenC1, 0);
    });
    document.addEventListener("fullscreenchange", __applyCanvasFullscreenC1);
    window.addEventListener("resize", __applyCanvasFullscreenC1);
