/**
Archivo:
- Inicializa estado compartido entre C2 y C3 para controles, seleccion de cromatina, ranking y cache de trayectorias/MSD.
- Prepara la carga de datos y el cambio de eje para que ambos canvases se comporten igual.

Objetivos:
- Estado base y caches:
  - __lastSimKey
  - __lastSimLogFrame
  - __lastMeanFlag
  - __lastReqRebuild
  - __lastMSDScoreKey
  - __lastMSDDisplayKey
  - __tauMSDLocalRaw
  - __tauMSDLocalValid
  - __tauMSDDisplayPack
  - __tauMSDDisplayMin
  - __tauMSDDisplayMax
  - __tauMSDJob
  - __aOverrideEnabled
  - __aOverrideA
  - __aOverrideKey
- Carga y proyeccion de datos:
  - __ensureTauDataLoaded
  - __projectChromatinSeries
  - __initTauAxisDefaults
  - __applyChromTauState
  - __applyChromTau
- Sincronizacion entre paneles y formularios:
  - __isEditingBestInputs
  - __publishPanelBest
  - __syncBestInputs
  - __requestTauRecompute
  - __copyCandidateFromOtherPanel
  - __gotoRankedCandidate
  - __getRankMode
  - __applyBestTauSubseq
- Construccion de UI:
  - __initTauControls
  - __tauCtlTimer
*/
//@ts-nocheck

    //? - Estado base compartido
    let tauHudCanvas:any=null;
    let tauHudCtx:any=null;
    const __c$[2,3]$Host=((canvas.parentElement as HTMLElement)||canvas as any) as HTMLElement;

    let __tauCtlRoot:any=null;
    let __tauCtlChrom:any=null;
    let __tauCtlTauMin:any=null;
    let __tauCtlTauMax:any=null;
    let __tauCtlBestTau:any=null;
    let __tauCtlBestSub:any=null;
    let __tauCtlBestBtn:any=null;
    let __tauCtlRank:any=null;
    let __tauCtlRankMode:any=null;
    let __tauCtlRankBtn:any=null;
    let __tauCtlCopyBtn:any=null;
    let __lastSimKey="";
    let __lastSimLogFrame=4;
    let __lastMeanFlag=false;
    let __lastReqRebuild=0;
    let __lastMSDScoreKey="";
    let __lastMSDDisplayKey="";
    let __tauMSDProgressKey="";
    let __tauMSDLocalRaw:Float32Array|null=null;
    let __tauMSDLocalValid:Uint8Array|null=null;
    let __tauMSDDisplayPack:Float32Array|null=null;
    let __tauMSDDisplayMin=0;
    let __tauMSDDisplayMax=1;
    let __tauMSDJob:any=null;
    let __aOverrideEnabled=false;
    let __aOverrideA:number|null=null;
    let __aOverrideKey="";
    let datos_reales:any=(window as any).datos_reales||null;
    let datosX1:any=null;
    let datosY1:any=null;
    let NMuestras1=0;
    let chromatinIndex=Math.max(1, Number((window as any).chromatinIndex ?? 1) || 1);
    (window as any).chromatinIndex=chromatinIndex;
    const __safeCfg=(getter:()=>any, fallback:any)=>{
        try{
            const v=getter();
            return (typeof v!=="undefined" && v!==null)?v:fallback;
        }catch{
            return fallback;
        }
    };

    //? - Carga y proyeccion de la serie activa

    // Carga la matriz de cromatinas una sola vez y la deja disponible para ambos paneles.
    const __ensureTauDataLoaded=async()=>{
        if(datos_reales && datos_reales.length) return datos_reales;
        if((window as any).datos_reales && (window as any).datos_reales.length){
            datos_reales=(window as any).datos_reales;
            return datos_reales;
        }
        const response = await fetch("/data/alive_2.mat", { method: "GET", cache: "no-store"});
        const buf = await response.arrayBuffer();
        const result = await readMat(buf);
        datos_reales=result?.data?.Expression1||null;
        (window as any).datos_reales=datos_reales;
        return datos_reales;
    };

    // Elimina la sobrescritura manual de a(t) cuando cambia el modelo seleccionado.
    const __clearAOverride=()=>{
        __aOverrideEnabled=false;
        __aOverrideA=null;
        __aOverrideKey="";
    };

    // Proyecta una serie 2D al par de ejes que usa el pipeline, ya sea XY directo o base PCA.
    const __projectChromatinSeries=(serie:any)=>{
        const n=serie?.length||0;
        const axis0=new Float32Array(n);
        const axis1=new Float32Array(n);
        const basisMode=String(__safeCfg(()=>tauBasisMode,"xy"));
        const secondaryMode=String(__safeCfg(()=>tauPcaSecondaryMode,"perp90"));
        if(n<=0) return {axis0,axis1};
        if(basisMode!=="pca"){
            for(let i=0;i<n;i++){
                const p=serie[i]||[0,0];
                axis0[i]=Number.isFinite(p[0])?p[0]:0;
                axis1[i]=Number.isFinite(p[1])?p[1]:0;
            }
            return {axis0,axis1};
        }
        let mx=0, my=0, cnt=0;
        for(let i=0;i<n;i++){
            const p=serie[i]||[0,0];
            const x=Number.isFinite(p[0])?p[0]:0;
            const y=Number.isFinite(p[1])?p[1]:0;
            mx+=x; my+=y; cnt++;
        }
        mx/=Math.max(1,cnt); my/=Math.max(1,cnt);
        let sxx=0, sxy=0, syy=0;
        for(let i=0;i<n;i++){
            const p=serie[i]||[0,0];
            const dx=(Number.isFinite(p[0])?p[0]:0)-mx;
            const dy=(Number.isFinite(p[1])?p[1]:0)-my;
            sxx+=dx*dx; sxy+=dx*dy; syy+=dy*dy;
        }
        const norm=Math.max(1,n-1);
        sxx/=norm; sxy/=norm; syy/=norm;
        const tr=sxx+syy;
        const disc=Math.max(0,tr*tr-4*(sxx*syy-sxy*sxy));
        const lMax=0.5*(tr+Math.sqrt(disc));
        const lMin=0.5*(tr-Math.sqrt(disc));
        let vx=Math.abs(sxy)>1e-12? sxy : 1.0;
        let vy=Math.abs(sxy)>1e-12? (lMax-sxx) : (sxx>=syy?0.0:1.0);
        let vn=Math.hypot(vx,vy);
        if(!(vn>1e-12)){ vx=1.0; vy=0.0; vn=1.0; }
        vx/=vn; vy/=vn;
        let wx=-vy, wy=vx;
        if(secondaryMode==="pcaMin"){
            wx=Math.abs(sxy)>1e-12? sxy : -vy;
            wy=Math.abs(sxy)>1e-12? (lMin-sxx) : vx;
            let wn=Math.hypot(wx,wy);
            if(!(wn>1e-12)){ wx=-vy; wy=vx; wn=1.0; }
            wx/=wn; wy/=wn;
        }
        if(vx*wx+vy*wy<0){ wx=-wx; wy=-wy; }
        for(let i=0;i<n;i++){
            const p=serie[i]||[0,0];
            const dx=(Number.isFinite(p[0])?p[0]:0)-mx;
            const dy=(Number.isFinite(p[1])?p[1]:0)-my;
            axis0[i]=dx*vx + dy*vy;
            axis1[i]=dx*wx + dy*wy;
        }
        return {axis0,axis1,centerX:mx,centerY:my,vx,vy,wx,wy};
    };

    // Crea el eje inicial del panel a partir de la primera cromatina disponible.
    const __initTauAxisDefaults=()=>{
        if(typeof datos_reales==="undefined" || !datos_reales) return false;
        const serie=datos_reales[0];
        const n=serie?.length||0;
        if(n<=0) return false;
        NMuestras1=n;
        const proj=__projectChromatinSeries(serie);
        const nx=proj.axis0;
        const ny=proj.axis1;
        datosX1=$[nx,ny]$;
        datosY1=ny;
        return true;
    };

    await __ensureTauDataLoaded();
    __initTauAxisDefaults();

    // Recalcula la serie activa, recrea texturas si hace falta y deja el panel listo para recomputar.
    const __applyChromTauState=(ci:number,tmin:number,tmax:number)=>{
        if(typeof datos_reales==="undefined" || !datos_reales) return false;
        const chromMax=Math.max(1,(datos_reales.length||1));
        ci=Math.max(1,Math.min(chromMax,ci|0));
        tmax=Math.max(1,Math.min(100,tmax|0));
        tmin=Math.max(1,Math.min(tmax,tmin|0));
        chromatinIndex=ci;
        (window as any).chromatinIndex=ci;
        tauMinVeces=tmin;
        tauMaxVeces=tmax;

        const serie=datos_reales[ci-1]||datos_reales[0];
        const n=serie?.length||0;
        if(n<=0) return false;
        NMuestras1=n;
        const proj=__projectChromatinSeries(serie);
        const nx=proj.axis0;
        const ny=proj.axis1;
        datosX1=$[nx,ny]$;
        datosY1=ny;
        (window as any).__tauProjectionMeta={
            mode:__safeCfg(()=>tauBasisMode,"xy"),
            secondary:__safeCfg(()=>tauPcaSecondaryMode,"perp90"),
            simCoordsMode:(__safeCfg(()=>tauBasisMode,"xy")==="pca"?"pca-relative":"xy-absolute"),
            ...proj
        };
        const tauSeries=$[nx,ny]$;
        if(typeof xTex!=="undefined" && xTex && typeof yTex!=="undefined" && yTex){
            const sameSize=((xTex as any).w===n && (yTex as any).w===n);
            if(sameSize && typeof (xTex as any).fill==="function" && typeof (yTex as any).fill==="function"){
                (xTex as any).fill(tauSeries);
                (yTex as any).fill(ny);
            }else if(typeof tauMom!=="undefined" && tauMom && typeof tauMom.createTexture2D==="function"){
                xTex=tauMom.createTexture2D("datosX1",[n,1],TexExamples.RFloat,tauSeries,["NEAREST","NEAREST","CLAMP","CLAMP"],"TexUnit10");
                yTex=tauMom.createTexture2D("datosY1",[n,1],TexExamples.RFloat,ny,["NEAREST","NEAREST","CLAMP","CLAMP"],"TexUnit11");
            }
        }
        if(bestTau<tauMinVeces) bestTau=tauMinVeces;
        if(bestTau>tauMaxVeces) bestTau=tauMaxVeces;
        if(bestSubseq>=bestTau) bestSubseq=Math.max(0,bestTau-1);
        return __requestTauRecompute(true);
    };

    // Lee los campos del formulario global y aplica el cambio de cromatina/rango tau.
    const __applyChromTau=()=>{
        if(typeof datos_reales==="undefined" || !datos_reales) return false;
        const chromMax=Math.max(1, (datos_reales.length||1));
        let ci=parseInt((__tauCtlChrom?.value||"1"),10); if(!Number.isFinite(ci)) ci=1;
        ci=Math.max(1,Math.min(chromMax,ci));
        let tmin=parseInt((__tauCtlTauMin?.value||"1"),10); if(!Number.isFinite(tmin)) tmin=1;
        let tmax=parseInt((__tauCtlTauMax?.value||"100"),10); if(!Number.isFinite(tmax)) tmax=100;
        return __applyChromTauState(ci,tmin,tmax);
    };

    //? - Sincronizacion de candidatos y formularios

    // Evita pisar el formulario cuando el usuario esta editando un valor manualmente.
    const __isEditingBestInputs=()=>{
        const ae=(document.activeElement as any)||null;
        return !!(ae && (ae===__tauCtlBestTau || ae===__tauCtlBestSub || ae===__tauCtlRank));
    };

    // Publica el candidato actual para que el otro panel pueda copiarlo.
    const __publishPanelBest=()=>{
        (window as any).__tauPanelBestC$[2,3]$={
            tau:Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0)),
            subseq:Math.max(0,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0))
        };
    };

    // Refresca los inputs del candidato elegido sin molestar al usuario si esta escribiendo.
    const __syncBestInputs=(force:boolean=false)=>{
        if(!force && __isEditingBestInputs()) return;
        if(__tauCtlBestTau) __tauCtlBestTau.value=String(Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0)));
        if(__tauCtlBestSub){
            const tauNow=Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0));
            __tauCtlBestSub.max=String(Math.max(0,tauNow-1));
            __tauCtlBestSub.value=String(Math.max(0,Math.min(tauNow-1,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0))));
        }
    };

    // Fuerza la republicacion del candidato activo y la reconstruccion de la trayectoria simulada.
    const __requestTauRecompute=(syncInputs:boolean=true)=>{
        __publishPanelBest();
        if(syncInputs) __syncBestInputs(true);
        __lastSimKey="";
        (window as any).simReqRebuild=(((window as any).simReqRebuild|0)+1);
        recomputeTau=true;
        return true;
    };

    // Trae al panel actual el mejor candidato ya publicado por el panel hermano.
    const __copyCandidateFromOtherPanel=()=>{
        const src=(window as any).__tauPanelBestC$[3,2]$;
        if(!src) return false;
        const t=Math.max(1,Math.min((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100), (src.tau|0)||1));
        const s=Math.max(0,Math.min(t-1, (src.subseq|0)||0));
        autoPickBest=false;
        bestTau=t;
        bestSubseq=s;
        return __requestTauRecompute(true);
    };

    // Devuelve el criterio de ordenacion activo para el selector de ranking.
    const __getRankMode=()=>String(__tauCtlRankMode?.value||"score");

    // Mueve el panel al candidato ranked N segun score, KL, coste o MSD.
    const __gotoRankedCandidate=(rank:number)=>{
        const candidates=__getRankedCandidates();
        if(candidates.length>0){
            const idx=Math.max(0,Math.min(candidates.length-1,(rank|0)-1));
            const cand=candidates[idx];
            autoPickBest=false;
            bestTau=cand.tau;
            bestSubseq=cand.subseq;
            return __requestTauRecompute(true);
        }
        const bestTex=((typeof tauBestTex!=="undefined" && tauBestTex)?tauBestTex:null);
        const bestPix=bestTex?__readTexPixel(bestTex,0,0):null;
        const tauFallback=Math.max(1,((bestPix && Number.isFinite(bestPix[0]))?Math.round(bestPix[0]):((typeof bestTau!=="undefined"?bestTau:1)|0)));
        const subseqFallback=Math.max(0,Math.min(tauFallback-1,((bestPix && Number.isFinite(bestPix[1]))?Math.round(bestPix[1]):((typeof bestSubseq!=="undefined"?bestSubseq:0)|0))));
        autoPickBest=false;
        bestTau=tauFallback;
        bestSubseq=subseqFallback;
        console.log("C$[2,3]$ rank fallback -> bestTex", {rank,tau:bestTau,subseq:bestSubseq,mode:__getRankMode()});
        return __requestTauRecompute(true);
    };

    // Lee tau/subseq del formulario de candidato y fuerza ese modelo como actual.
    const __applyBestTauSubseq=()=>{
        let t=parseInt((__tauCtlBestTau?.value||"1"),10); if(!Number.isFinite(t)) t=1;
        let s=parseInt((__tauCtlBestSub?.value||"0"),10); if(!Number.isFinite(s)) s=0;
        t=Math.max(1,Math.min((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100),t));
        s=Math.max(0,Math.min(t-1,s));
        autoPickBest=false;
        bestTau=t;
        bestSubseq=s;
        return __requestTauRecompute(true);
    };

    // Permite fijar manualmente a(t) con un click vertical sobre el canvas.
    canvas.addEventListener("click",(ev:any)=>{
        try{
            const r=canvas.getBoundingClientRect();
            const ry=Math.max(0,Math.min(1,(ev.clientY-r.top)/Math.max(1,r.height)));
            const aSel=2.7*(1.0-ry);
            const tSel=Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0));
            const sSel=Math.max(0,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0));
            __aOverrideEnabled=true;
            __aOverrideA=Math.max(0,__safeNum(aSel,0));
            __aOverrideKey=tSel+"|"+sSel;
            __lastSimKey="";
            (window as any).simReqRebuild=(((window as any).simReqRebuild|0)+1);
            console.log("C$[2,3]$ click override a(t)", {tau:tSel,subseq:sSel,aOverride:__aOverrideA,ratioY:ry});
        }catch{}
    });

    //? - Construccion de controles HTML

    // Monta una UI unica para ambos canvases con cromatina, rango tau, candidato y ranking.
    const __initTauControls=()=>{
        if(__tauCtlRoot) return true;
        if(typeof datos_reales==="undefined" || !datos_reales) return false;

        __tauCtlRoot=document.createElement("p");
        __tauCtlRoot.id="tauControlsC$[2,3]$";
        __tauCtlRoot.style.margin="6px 0 0 0";
        __tauCtlRoot.style.padding="4px 0";
        __tauCtlRoot.style.font="12px monospace";
        __tauCtlRoot.style.display="flex";
        __tauCtlRoot.style.gap="6px";
        __tauCtlRoot.style.alignItems="center";
        __tauCtlRoot.style.flexWrap="wrap";
        __tauCtlRoot.style.color="#ddd";
        __tauCtlRoot.style.pointerEvents="auto";
        __tauCtlRoot.style.position="relative";
        __tauCtlRoot.style.zIndex="5";

        const mkNum=(w:string,val:string,min:string,max:string)=>{
            const i=document.createElement("input");
            i.type="number"; i.value=val; i.min=min; i.max=max; i.step="1";
            i.style.width=w; i.style.font="12px monospace";
            i.style.background="#111"; i.style.color="#fff"; i.style.border="1px solid #444";
            i.style.pointerEvents="auto";
            return i;
        };

        const mkChromSel=(maxN:number)=>{
            const s=document.createElement("select");
            s.style.width="72px";
            s.style.font="12px monospace";
            s.style.background="#111";
            s.style.color="#fff";
            s.style.border="1px solid #444";
            s.style.pointerEvents="auto";
            for(let k=1;k<=maxN;k++){
                const op=document.createElement("option");
                op.value=String(k);
                op.textContent=String(k);
                s.appendChild(op);
            }
            s.value=String(Math.max(1,Math.min(maxN,chromatinIndex||1)));
            return s;
        };

        const lbC=document.createElement("span"); lbC.textContent="Chrom";
        __tauCtlChrom=mkChromSel(Math.max(1,datos_reales.length||1));
        const lbMin=document.createElement("span"); lbMin.textContent="tauMin";
        __tauCtlTauMin=mkNum("58px", String(Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0))), "1", "100");
        const lbMax=document.createElement("span"); lbMax.textContent="tauMax";
        __tauCtlTauMax=mkNum("58px", String(Math.max(1,((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100)|0))), "1", "100");
        const bt=document.createElement("button");
        bt.textContent="Cambiar";
        bt.style.font="12px monospace";
        bt.style.cursor="pointer";
        bt.style.pointerEvents="auto";
        bt.style.padding="4px 10px";
        bt.style.borderRadius="6px";
        bt.style.border="1px solid #4a9fdb";
        bt.style.color="#eaf7ff";
        bt.style.background="linear-gradient(135deg,#1c4f72 0%, #2f7aa8 55%, #4a9fdb 100%)";
        bt.style.boxShadow="0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 6px rgba(0,0,0,0.25)";
        bt.onmouseenter=()=>{ bt.style.filter="brightness(1.08)"; };
        bt.onmouseleave=()=>{ bt.style.filter="none"; };
        bt.onclick=()=>{ __applyChromTau(); };

        const sep=document.createElement("span");
        sep.style.flexBasis="100%";
        sep.style.height="0";
        const line=document.createElement("span");
        line.style.flexBasis="100%";
        line.style.height="1px";
        line.style.background="#2a2a2a";
        line.style.margin="2px 0 4px 0";

        const lbT=document.createElement("span"); lbT.textContent="tau";
        __tauCtlBestTau=mkNum("58px", String(typeof bestTau!=="undefined"?bestTau:1), "1", "100");
        const lbS=document.createElement("span"); lbS.textContent="subseq";
        __tauCtlBestSub=mkNum("58px", String(typeof bestSubseq!=="undefined"?bestSubseq:0), "0", "99");
        __tauCtlBestSub.max=String(Math.max(0,(typeof bestTau!=="undefined"?bestTau:1)-1));
        __tauCtlBestTau.onchange=()=>{ __applyBestTauSubseq(); };
        __tauCtlBestSub.onchange=()=>{ __applyBestTauSubseq(); };
        __tauCtlBestBtn=document.createElement("button");
        __tauCtlBestBtn.textContent="Moverse C$[2,3]$";
        __tauCtlBestBtn.style.font="12px monospace";
        __tauCtlBestBtn.style.cursor="pointer";
        __tauCtlBestBtn.style.pointerEvents="auto";
        __tauCtlBestBtn.style.padding="4px 10px";
        __tauCtlBestBtn.style.borderRadius="6px";
        __tauCtlBestBtn.style.border="1px solid #8c6b2a";
        __tauCtlBestBtn.style.color="#fff6e4";
        __tauCtlBestBtn.style.background="linear-gradient(135deg,#5b3b14 0%, #8a5a1f 55%, #b0722a 100%)";
        __tauCtlBestBtn.style.boxShadow="0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlBestBtn.onmouseenter=()=>{ __tauCtlBestBtn!.style.filter="brightness(1.08)"; };
        __tauCtlBestBtn.onmouseleave=()=>{ __tauCtlBestBtn!.style.filter="none"; };
        __tauCtlBestBtn.onclick=()=>{ __applyBestTauSubseq(); };

        const sep2=document.createElement("span");
        sep2.style.flexBasis="100%";
        sep2.style.height="0";

        const lbRank=document.createElement("span"); lbRank.textContent="mejor #";
        const lbRankMode=document.createElement("span"); lbRankMode.textContent="según";
        __tauCtlRank=mkNum("58px","1","1","999");
        __tauCtlRankMode=document.createElement("select");
        __tauCtlRankMode.style.width="92px";
        __tauCtlRankMode.style.font="12px monospace";
        __tauCtlRankMode.style.background="#111";
        __tauCtlRankMode.style.color="#fff";
        __tauCtlRankMode.style.border="1px solid #444";
        __tauCtlRankMode.style.pointerEvents="auto";
        [["score","score"],["kl","KL"],["cost","coste"],["costMSD","costMSD"]].forEach(([v,txt])=>{
            const op=document.createElement("option");
            op.value=v;
            op.textContent=txt;
            __tauCtlRankMode.appendChild(op);
        });
        __tauCtlRankMode.value="score";
        __tauCtlRankBtn=document.createElement("button");
        __tauCtlRankBtn.textContent="Ir candidato C$[2,3]$";
        __tauCtlRankBtn.style.font="12px monospace";
        __tauCtlRankBtn.style.cursor="pointer";
        __tauCtlRankBtn.style.pointerEvents="auto";
        __tauCtlRankBtn.style.padding="4px 10px";
        __tauCtlRankBtn.style.borderRadius="6px";
        __tauCtlRankBtn.style.border="1px solid #2f7a4a";
        __tauCtlRankBtn.style.color="#e8fff1";
        __tauCtlRankBtn.style.background="linear-gradient(135deg,#19472a 0%, #246a3c 55%, #2f9a57 100%)";
        __tauCtlRankBtn.style.boxShadow="0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlRankBtn.onmouseenter=()=>{ __tauCtlRankBtn!.style.filter="brightness(1.08)"; };
        __tauCtlRankBtn.onmouseleave=()=>{ __tauCtlRankBtn!.style.filter="none"; };
        __tauCtlRankBtn.onclick=()=>{ __gotoRankedCandidate(parseInt((__tauCtlRank?.value||"1"),10)||1); };
        __tauCtlCopyBtn=document.createElement("button");
        __tauCtlCopyBtn.textContent="Moverse al candidato de C$[3,2]$";
        __tauCtlCopyBtn.style.font="12px monospace";
        __tauCtlCopyBtn.style.cursor="pointer";
        __tauCtlCopyBtn.style.pointerEvents="auto";
        __tauCtlCopyBtn.style.padding="4px 10px";
        __tauCtlCopyBtn.style.borderRadius="6px";
        __tauCtlCopyBtn.style.border="1px solid #6a4cb8";
        __tauCtlCopyBtn.style.color="#f3edff";
        __tauCtlCopyBtn.style.background="linear-gradient(135deg,#3f2a72 0%, #5b3ea6 55%, #7b58d6 100%)";
        __tauCtlCopyBtn.style.boxShadow="0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlCopyBtn.onmouseenter=()=>{ __tauCtlCopyBtn!.style.filter="brightness(1.08)"; };
        __tauCtlCopyBtn.onmouseleave=()=>{ __tauCtlCopyBtn!.style.filter="none"; };
        __tauCtlCopyBtn.onclick=()=>{ __copyCandidateFromOtherPanel(); };

        __tauCtlRoot.append(
            lbC,__tauCtlChrom,
            lbMin,__tauCtlTauMin,
            lbMax,__tauCtlTauMax,
            bt,
            sep,line,
            lbT,__tauCtlBestTau,
            lbS,__tauCtlBestSub,
            __tauCtlBestBtn,
            sep2,
            lbRank,__tauCtlRank,
            lbRankMode,__tauCtlRankMode,
            __tauCtlRankBtn,
            __tauCtlCopyBtn
        );

        let inserted=false;
        const h2=document.querySelector("#F$[2,3]$") as HTMLElement|null;
        const leftSec=(h2?.closest(".left-dnti-section") as HTMLElement|null) || null;
        if(leftSec){
            const ps=Array.from(leftSec.querySelectorAll("p"));
            if(ps.length>0){
                ps[ps.length-1].insertAdjacentElement("afterend", __tauCtlRoot);
            }else{
                leftSec.appendChild(__tauCtlRoot);
            }
            inserted=true;
        }
        if(!inserted){
            (__c$[2,3]$Host||document.body).appendChild(__tauCtlRoot);
        }

        __publishPanelBest();
        __syncBestInputs(false);
        return true;
    };

    // Reintenta montar los controles hasta que el DOM de la columna lateral este disponible.
    const __tauCtlTimer=setInterval(()=>{
        if(__initTauControls()){
            clearInterval(__tauCtlTimer);
            setTimeout(()=>{ __applyChromTau(); }, 0);
        }
    },200);
