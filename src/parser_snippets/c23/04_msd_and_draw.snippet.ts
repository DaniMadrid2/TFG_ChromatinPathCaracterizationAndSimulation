/**
Archivo:
- Calcula el mapa local de error MSD, mantiene su progreso y dibuja el HUD del panel tau.
- Tambien gestiona fullscreen y la superposicion de curvas/heatmaps del canvas.

Objetivos:
- MSD y progreso:
  - __calcMSD1DSeries
  - __msdNow
  - __fmtHud
  - __publishMSDProgress
  - __setMSDProgress
  - __updateMSDProgressTick
  - __buildMSDScoreAxisJob
  - __stepMSDScoreAxisJob
  - __getMSDAxisPack
  - __refreshMSDScoreDisplay
- HUD y overlays:
  - __ensureTauHud
  - __syncTauHud
  - __drawTauHud
  - __legendColor
  - __mix3
  - __scoreColor
  - __klColor
  - __costColor
  - __msdScoreColor
  - __drawLegend
- Fullscreen y resize:
  - __applyCanvasFullscreenC$[2,3]$
*/
//@ts-nocheck
    //? - HUD base y sincronizacion con el canvas

    // Crea el canvas overlay del HUD una sola vez y lo inserta sobre el host del panel tau.
    const __ensureTauHud=()=>{
        if(tauHudCanvas && tauHudCtx) return;
        tauHudCanvas=document.createElement("canvas");
        tauHudCanvas.id="tauHudOverlayC$[2,3]$";
        tauHudCanvas.style.pointerEvents="none";
        tauHudCanvas.style.zIndex="1000000";
        tauHudCanvas.style.display="block";
        tauHudCtx=tauHudCanvas.getContext("2d");
        const p=(__c$[2,3]$Host||document.body) as any;
        if(p && p!==document.body){
            const cs=window.getComputedStyle(p);
            if(cs.position==="static" || !cs.position) p.style.position="relative";
        }
        (p||document.body).appendChild(tauHudCanvas);
    };

    // Ajusta el overlay del HUD para que siga al canvas en tamano, posicion y fullscreen.
    const __syncTauHud=()=>{
        if(!tauHudCanvas) return;
        const isFs=(document.fullscreenElement===canvas || document.fullscreenElement===__fsTargetC$[2,3]$);
        if(isFs){
            tauHudCanvas.style.position="fixed";
            tauHudCanvas.style.left="0px";
            tauHudCanvas.style.top="0px";
            tauHudCanvas.style.width="100vw";
            tauHudCanvas.style.height="100vh";
            tauHudCanvas.width=window.innerWidth;
            tauHudCanvas.height=window.innerHeight;
        }else{
            const r=canvas.getBoundingClientRect();
            tauHudCanvas.style.position="absolute";
            tauHudCanvas.style.left=(canvas.offsetLeft||0)+"px";
            tauHudCanvas.style.top=(canvas.offsetTop||0)+"px";
            tauHudCanvas.style.width=(r.width||canvas.clientWidth||canvas.width)+"px";
            tauHudCanvas.style.height=(r.height||canvas.clientHeight||canvas.height)+"px";
            tauHudCanvas.width=Math.max(1,Math.round(r.width||canvas.clientWidth||canvas.width));
            tauHudCanvas.height=Math.max(1,Math.round(r.height||canvas.clientHeight||canvas.height));
        }
    };

    //? - Calculo incremental de MSD y progreso

    // Calcula la MSD 1D para una serie y un maximo retraso.
    const __calcMSD1DSeries=(x:Float32Array,maxTau:number)=>{
        const n=(x.length|0);
        const tMax=Math.max(1,Math.min(maxTau,n-1));
        const out=new Float32Array(tMax+1);
        out[0]=0;
        for(let tau=1;tau<=tMax;tau++){
            let acc=0, cnt=0;
            for(let i=0;i<n-tau;i++){
                const dx=(x[i+tau]-x[i]);
                if(!Number.isFinite(dx)) continue;
                acc+=dx*dx;
                cnt++;
            }
            out[tau]=(cnt>0)?(acc/cnt):NaN;
        }
        return out;
    };
    // Devuelve el reloj apropiado para repartir trabajo incremental por frame.
    const __msdNow=()=>((typeof performance!=="undefined" && performance.now)?performance.now():Date.now());

    // Formatea valores del HUD con una precision compacta y estable.
    const __fmtHud=(v:number)=>{
        if(!Number.isFinite(v)) return "na";
        const av=Math.abs(v);
        if(av>=1000 || (av>0 && av<0.001)) return v.toExponential(1);
        if(av>=10) return v.toFixed(1);
        return v.toFixed(3);
    };

    // Sincroniza el widget DOM de progreso MSD del panel actual.
    const __publishMSDProgress=()=>{
        const prog=(window as any).__tauMSDProgress$[X,Y]$;
        const fill=document.getElementById("c$[2,3]$-msd-progress-fill") as HTMLElement|null;
        const label=document.getElementById("c$[2,3]$-msd-progress-label") as HTMLElement|null;
        if(fill) fill.style.width=String(Math.max(0,Math.min(100,Number(prog?.percent)||0)))+"%";
        if(label){
            const pct=Math.max(0,Math.min(100,Number(prog?.percent)||0));
            const tauTxt=(prog && Number.isFinite(prog.tau))?String(prog.tau):"-";
            const subTxt=(prog && Number.isFinite(prog.subseq))?String(prog.subseq):"-";
            const phase=(prog && prog.phase)?String(prog.phase):"en espera";
            label.textContent="MSD SSE C$[2,3]$: "+phase+" ("+pct.toFixed(1)+"%) tau="+tauTxt+" subseq="+subTxt;
        }
    };
    // Mezcla una actualizacion parcial del progreso con el estado previo publicado.
    const __setMSDProgress=(patch:any)=>{
        const prev=(window as any).__tauMSDProgress$[X,Y]$||{axis:"$[x,y]$",phase:"en espera",percent:0,tau:null,subseq:null,done:0,total:0,complete:false};
        const next=Object.assign({},prev,patch||{});
        (window as any).__tauMSDProgress$[X,Y]$=next;
        __tauMSDProgressKey=[next.phase,next.percent,next.tau,next.subseq,next.done,next.total,next.complete].join("|");
        __publishMSDProgress();
    };
    // Refresca el progreso visible en cada tick cuando ya existe un estado publicado.
    const __updateMSDProgressTick=()=>{
        if((window as any).__tauMSDProgress$[X,Y]$) __publishMSDProgress();
    };
    // Prepara el trabajo incremental que compara la MSD real con todas las candidatas.
    const __buildMSDScoreAxisJob=()=>{
        const texF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:((typeof tauXiF!=="undefined")?tauXiF:null));
        const texS=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:((typeof tauXiS!=="undefined")?tauXiS:null));
        const texM=((typeof tauXiMetaFinal!=="undefined" && tauXiMetaFinal)?tauXiMetaFinal:((typeof tauXiMeta!=="undefined")?tauXiMeta:null));
        const srcBase=(typeof datos$[X,Y]$1!=="undefined" && datos$[X,Y]$1)?(datos$[X,Y]$1 instanceof Float32Array?datos$[X,Y]$1:new Float32Array(datos$[X,Y]$1)):null;
        const tauMaxN=Math.max(1,((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100)|0));
        const tauMinN=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
        const chromSel=Math.max(1,((typeof chromatinIndex!=="undefined"?chromatinIndex:1)|0));
        const modelStamp=((typeof tauModelStamp!=="undefined"?tauModelStamp:0)|0);
        const key=["$[x,y]$",modelStamp,tauMinN,tauMaxN,chromSel,srcBase?.length||0,((typeof tauMSDMaxLag!=="undefined"?tauMSDMaxLag:64)|0)].join("|");
        if(__lastMSDScoreKey===key && __tauMSDLocalRaw && __tauMSDLocalValid){
            __setMSDProgress({phase:"listo",percent:100,complete:true,done:__tauMSDLocalValid.length,total:__tauMSDLocalValid.length,tau:null,subseq:null});
            return null;
        }
        if(__tauMSDJob && __tauMSDJob.key===key) return __tauMSDJob;
        if(!texF || !texS || !texM || !srcBase || srcBase.length<8){
            __tauMSDJob=null;
            __tauMSDLocalRaw=null;
            __tauMSDLocalValid=null;
            __setMSDProgress({phase:"sin datos",percent:0,complete:false,done:0,total:0,tau:null,subseq:null});
            return null;
        }
        const src=(srcBase instanceof Float32Array)?srcBase:new Float32Array(srcBase);
        const nScore=src.length|0;
        let minX=1e30, maxX=-1e30;
        for(let i=0;i<nScore;i++){
            const x=src[i];
            if(!Number.isFinite(x)) continue;
            if(x<minX) minX=x;
            if(x>maxX) maxX=x;
        }
        if(!(maxX>minX)){ minX=(src[0]||0)-1; maxX=(src[0]||0)+1; }
        const rangeX=Math.max(1e-6,maxX-minX);
        let realStepMean=0;
        for(let i=1;i<nScore;i++) realStepMean+=Math.abs(src[i]-src[i-1]);
        realStepMean/=Math.max(1,nScore-1);
        const maxLagCfg=((typeof tauMSDMaxLag!=="undefined"?tauMSDMaxLag:64)|0);
        const maxLag=(maxLagCfg>0)?Math.max(1,Math.min(maxLagCfg,nScore-1)):Math.max(1,nScore-1);
        const msdO=__calcMSD1DSeries(src,maxLag);
        const raw=new Float32Array(tauMaxN*tauMaxN);
        const valid=new Uint8Array(tauMaxN*tauMaxN);
        const candidates:any[]=[];
        for(let tau=tauMinN;tau<=tauMaxN;tau++){
            const dt=Math.max(1e-4,1.0/Math.max(1,tau));
            for(let ss=0;ss<tau;ss++){
                const idx2=ss*tauMaxN + (tau-1);
                const pf=__readTexPixel(texF,tau-1,ss);
                const ps=__readTexPixel(texS,tau-1,ss);
                const pm=__readTexPixel(texM,tau-1,ss);
                const isValid=((pm && Number.isFinite(pm[1])?pm[1]:((ps && Number.isFinite(ps[2]))?ps[2]:0))>0.5);
                if(!pf || !ps || !isValid) continue;
                const cf:[number,number,number,number]=[
                    Number.isFinite(pf[0])?pf[0]:0,
                    Number.isFinite(pf[1])?pf[1]:0,
                    Number.isFinite(pf[2])?pf[2]:0,
                    Number.isFinite(pf[3])?pf[3]:0
                ];
                const cs=(Number.isFinite(ps[0])?ps[0]:0);
                let modelStepMean=0;
                for(let i=1;i<nScore;i++){
                    const u=(src[i-1]-minX)/rangeX;
                    const uu=Math.max(0,Math.min(1,u));
                    const f=(cf[0] + cf[1]*uu + cf[2]*uu*uu + cf[3]*uu*uu*uu);
                    const s=(2.0*cs);
                    modelStepMean+=Math.abs(f)*rangeX*dt + Math.abs(s)*rangeX*Math.sqrt(dt);
                }
                modelStepMean/=Math.max(1,nScore-1);
                const gain=Math.max(0.1,Math.min(250.0,__safeNum(realStepMean/Math.max(1e-6,modelStepMean),1)));
                candidates.push({tau,ss,idx:idx2,dt,gain,cf,cs});
            }
        }
        __tauMSDDisplayPack=null;
        __lastMSDDisplayKey="";
        __tauMSDJob={key,raw,valid,src,nScore,minX,rangeX,maxLag,msdO,tauMaxN,tauMinN,modelStamp,candidates,cursor:0,total:candidates.length,done:false};
        (window as any).__tauMSDScoreAxis$[X,Y]$={raw,valid,width:tauMaxN,height:tauMaxN,stamp:modelStamp,complete:false,cursor:0,total:candidates.length};
        __setMSDProgress({phase:(candidates.length>0?"calculando":"sin candidatos"),percent:(candidates.length>0?0:100),complete:(candidates.length===0),done:0,total:candidates.length,tau:(candidates[0]?.tau??null),subseq:(candidates[0]?.ss??null)});
        if(candidates.length===0){
            __tauMSDLocalRaw=raw;
            __tauMSDLocalValid=valid;
            __lastMSDScoreKey=key;
        }
        return __tauMSDJob;
    };
    // Ejecuta un trozo del trabajo de MSD respetando el presupuesto temporal por frame.
    const __stepMSDScoreAxisJob=()=>{
        const job=__tauMSDJob||__buildMSDScoreAxisJob();
        if(!job) return !!(__tauMSDLocalRaw && __tauMSDLocalValid);
        if(job.done) return true;
        const budget=Math.max(2,Number((typeof tauMSDChunkBudgetMs!=="undefined"?tauMSDChunkBudgetMs:8))||8);
        const deadline=__msdNow()+budget;
        while(job.cursor<job.total && __msdNow()<=deadline){
            const cand=job.candidates[job.cursor];
            const sim=__simulateAxisFromCoeffs(job.src,job.nScore,job.minX,job.rangeX,cand.dt,cand.gain,cand.cf,cand.cs,cand.ss,true,null);
            const msdS=__calcMSD1DSeries(sim,job.maxLag);
            let score=0;
            for(let t=1;t<job.msdO.length;t++){
                const d=(Number.isFinite(msdS[t])?msdS[t]:0)-(Number.isFinite(job.msdO[t])?job.msdO[t]:0);
                score+=d*d;
            }
            job.raw[cand.idx]=score;
            job.valid[cand.idx]=1;
            job.cursor++;
        }
        const current=(job.cursor<job.total)?job.candidates[job.cursor]:null;
        const complete=(job.cursor>=job.total);
        (window as any).__tauMSDScoreAxis$[X,Y]$={raw:job.raw,valid:job.valid,width:job.tauMaxN,height:job.tauMaxN,stamp:job.modelStamp,complete,cursor:job.cursor,total:job.total};
        __setMSDProgress({phase:(complete?"listo":"calculando"),percent:(job.total>0?(100*job.cursor/job.total):100),complete,done:job.cursor,total:job.total,tau:(current?.tau??null),subseq:(current?.ss??null)});
        if(complete){
            job.done=true;
            __tauMSDLocalRaw=job.raw;
            __tauMSDLocalValid=job.valid;
            __lastMSDScoreKey=job.key;
        }
        return complete;
    };
    // Devuelve el estado mas reciente del mapa MSD local, ya venga del job o de cache final.
    const __getMSDAxisPack=()=>{
        if(__tauMSDJob) return (window as any).__tauMSDScoreAxis$[X,Y]$||null;
        if(__tauMSDLocalRaw && __tauMSDLocalValid) return (window as any).__tauMSDScoreAxis$[X,Y]$||null;
        return null;
    };
    // Fusiona el mapa local con el del otro eje y produce el heatmap visible en el HUD.
    const __refreshMSDScoreDisplay=()=>{
        __stepMSDScoreAxisJob();
        const local=__getMSDAxisPack();
        if(!local || !local.raw || !local.valid) return false;
        const other=(window as any).__tauMSDScoreAxis$[Y,X]$;
        const tauMaxN=local.width|0;
        const tauMinN=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
        const localToken=local.complete?("L"+String(local.stamp||0)):("L"+String(local.stamp||0)+":"+String(local.cursor||0)+"/"+String(local.total||0));
        const otherToken=other?(other.complete?("O"+String(other.stamp||0)):("O"+String(other.stamp||0)+":"+String(other.cursor||0)+"/"+String(other.total||0))):"O:none";
        const key=["disp",localToken,otherToken,tauMinN,tauMaxN].join("|");
        if(__lastMSDDisplayKey===key && __tauMSDDisplayPack) return true;
        const pack=new Float32Array(tauMaxN*tauMaxN*4);
        let minScore=1e30, maxScore=-1e30;
        const canCombine=!!(other && other.complete && other.width===local.width && other.height===local.height && other.raw && other.valid);
        for(let ss=0;ss<tauMaxN;ss++){
            for(let tau=tauMinN;tau<=tauMaxN;tau++){
                if(ss>=tau) break;
                const idx=ss*tauMaxN + (tau-1);
                const off=idx*4;
                const validLocal=local.valid[idx]>0;
                const validOther=canCombine ? (other.valid[idx]>0) : true;
                const ok=validLocal && validOther;
                if(!ok) continue;
                const score=(local.raw[idx]||0) + (canCombine ? (other.raw[idx]||0) : 0);
                pack[off]=score;
                pack[off+2]=1;
                if(score<minScore) minScore=score;
                if(score>maxScore) maxScore=score;
            }
        }
        if(!(maxScore>minScore)){ minScore=0; maxScore=Math.max(1,maxScore+1); }
        const lo=Math.log(1+Math.max(0,minScore));
        const hi=Math.log(1+Math.max(minScore+1e-6,maxScore));
        for(let i=0;i<tauMaxN*tauMaxN;i++){
            const off=i*4;
            if(pack[off+2]<0.5) continue;
            const norm=(Math.log(1+Math.max(0,pack[off]))-lo)/Math.max(1e-6,hi-lo);
            pack[off+1]=1-Math.max(0,Math.min(1,norm));
        }
        __tauMSDDisplayPack=pack;
        __tauMSDDisplayMin=minScore;
        __tauMSDDisplayMax=maxScore;
        __lastMSDDisplayKey=key;
        return true;
    };
    //? - Dibujo del HUD y de sus overlays

    // Dibuja paneles, curvas, heatmaps, leyendas y ayudas del HUD del canvas tau.
    const __drawTauHud=()=>{
        if(!tauHudCtx || !tauHudCanvas) return;
        __syncTauHud();
        const hud=tauHudCtx;
        const W2=tauHudCanvas.width|0;
        const H2=tauHudCanvas.height|0;
        hud.clearRect(0,0,W2,H2);
        __publishPanelBest();
        __syncBestInputs(false);
        __publishSimTrajectoryFromTau(false);
        __refreshMSDScoreDisplay();
        __updateMSDProgressTick();
        const left=Math.round(W2*0.04), right=Math.round(W2*0.03);
        const top=Math.round(H2*0.03), bottom=Math.round(H2*0.04);
        const gapX=Math.round(W2*0.03), gapY=Math.round(H2*0.035);
        const pdfH=Math.round(H2*0.08), topH=Math.round(H2*0.44), botH=Math.round(H2*0.29);
        const xL=left, xR=W2-right, fullW=xR-xL, halfW=Math.round((fullW-gapX)*0.5);
        const yTop0=top, yTop1=yTop0+topH;
        const yBot0=yTop1+gapY, yBot1=yBot0+botH;
        const yPdf1=H2-bottom, yPdf0=yPdf1-pdfH;
        const xBL0=xL, xBL1=xBL0+halfW, xBR0=xBL1+gapX, xBR1=xR;
        const isFsNow=(document.fullscreenElement===__fsTargetC$[2,3]$);
        const notFsDelta=isFsNow?0:3;

        hud.save();
        hud.strokeStyle="rgba(235,235,235,0.92)";
        hud.fillStyle="rgba(245,245,245,0.95)";
        hud.lineWidth=1;
        hud.font=Math.max(7,Math.round(H2*0.0093)+1-notFsDelta)+"px monospace";

        // Convierte componentes normalizadas a un color CSS entero.
        const __legendColor=(r:number,g:number,b:number)=>"rgb("+Math.round(255*r)+","+Math.round(255*g)+","+Math.round(255*b)+")";

        // Interpola dos colores RGB para generar la paleta de leyendas.
        const __mix3=(a:number[],b:number[],t:number)=>[
            a[0]*(1-t)+b[0]*t,
            a[1]*(1-t)+b[1]*t,
            a[2]*(1-t)+b[2]*t
        ];

        // Mapea score global a una escala verde-rojo para la leyenda superior.
        const __scoreColor=(score:number)=>{
            const cN=Math.max(0,Math.min(1,1.0/(1.0+1.8*Math.max(0,score))));
            return __legendColor(...__mix3([0.25,0.05,0.05],[0.1,0.95,0.3],cN));
        };

        // Mapea KL a una escala cian-rojo para distinguir parecido distribucional.
        const __klColor=(kl:number)=>{
            const v=Math.max(0,Math.min(1,1.0/(1.0+0.4*Math.max(0,kl))));
            return __legendColor(...__mix3([0.25,0.05,0.08],[0.15,0.95,0.95],v));
        };

        // Mapea coste de ajuste a una escala amarillo-rojo para el panel inferior.
        const __costColor=(cost:number)=>{
            const v=Math.max(0,Math.min(1,1.0/(1.0+0.03*Math.max(0,cost))));
            return __legendColor(...__mix3([0.2,0.08,0.08],[0.95,0.75,0.2],v));
        };

        // Mapea la bondad del error MSD ya normalizado al color del heatmap.
        const __msdScoreColor=(scoreGood:number)=>{
            return __legendColor(...__mix3([0.2,0.08,0.08],[0.95,0.75,0.2],Math.max(0,Math.min(1,scoreGood))));
        };

        // Dibuja una leyenda horizontal con escalones y etiquetas numericas.
        const __drawLegend=(x:number,y:number,title:string,vals:number[],colorFn:(v:number)=>string)=>{
            const sw=Math.max(16,Math.round(W2*0.02));
            const sh=Math.max(8,Math.round(H2*0.014));
            const step=Math.max(2,Math.round(W2*0.004));
            hud.save();
            hud.font=Math.max(6,Math.round(H2*0.0076)+1-notFsDelta)+"px monospace";
            hud.fillStyle="rgba(245,245,245,0.95)";
            hud.fillText(title, x, y-4);
            for(let i=0;i<vals.length;i++){
                const xx=x+i*(sw+step);
                hud.fillStyle=colorFn(vals[i]);
                hud.fillRect(xx,y,sw,sh);
                hud.strokeStyle="rgba(255,255,255,0.55)";
                hud.strokeRect(xx,y,sw,sh);
                hud.fillStyle="rgba(245,245,245,0.95)";
                hud.fillText(__fmtHud(vals[i]), xx, y+sh+10);
            }
            hud.restore();
        };
        if(typeof showTauCurves==="undefined" || !showTauCurves){
            const tauMaxN=Math.max(1,((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100)|0));
            const scoreArr=__readTexRect((typeof tauScoreTex!=="undefined"?tauScoreTex:null),tauMaxN,tauMaxN);
            const klArr=__readTexRect((typeof tauKLTex!=="undefined"?tauKLTex:null),tauMaxN,tauMaxN);
            const metaArr=__readTexRect((typeof tauXiMetaFinal!=="undefined"?tauXiMetaFinal:null),tauMaxN,tauMaxN);
            let minScore=1e30, maxScore=0;
            let minKL=1e30, maxKL=0;
            let minCost=1e30, maxCost=0;
            for(let s=0;s<tauMaxN;s++){
                for(let t=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));t<=tauMaxN;t++){
                    if(s>=t) break;
                    const off=(s*tauMaxN+(t-1))*4;
                    if(scoreArr){
                        const valid=scoreArr[off+2], score=scoreArr[off+1];
                        if(valid>0.5 && Number.isFinite(score)){ minScore=Math.min(minScore,score); maxScore=Math.max(maxScore,score); }
                    }
                    if(klArr){
                        const valid=klArr[off+1], kl=klArr[off+0];
                        if(valid>0.5 && Number.isFinite(kl)){ minKL=Math.min(minKL,kl); maxKL=Math.max(maxKL,kl); }
                    }
                    if(metaArr){
                        const valid=metaArr[off+1], cost=metaArr[off+0];
                        if(valid>0.5 && Number.isFinite(cost)){ minCost=Math.min(minCost,cost); maxCost=Math.max(maxCost,cost); }
                    }
                }
            }
            if(!(maxScore>minScore)){ minScore=0; maxScore=Math.max(1,minScore+1); }
            if(!(maxKL>minKL)){ minKL=0; maxKL=Math.max(1,minKL+1); }
            if(!(maxCost>minCost)){ minCost=0; maxCost=Math.max(1,minCost+1); }
            const mkVals=(a:number,b:number)=>Array.from({length:5},(_,i)=>a+(b-a)*(i/4));
            __drawLegend(Math.round(W2*0.58), Math.round(H2*0.06), "score", mkVals(minScore,maxScore), __scoreColor);
            __drawLegend(Math.round(W2*0.06), Math.round(H2*0.70), "KL", mkVals(minKL,maxKL), __klColor);
            const useMSDScore=((typeof showMSDScoreMap!=="undefined") && !!showMSDScoreMap);
            if(useMSDScore && __refreshMSDScoreDisplay() && __tauMSDDisplayPack){
                const x0=Math.round(W2*0.51), y0=Math.round(H2*0.54);
                const ww=Math.max(1,Math.round(W2*0.49));
                const hh=Math.max(1,Math.round(H2*0.46));
                const tauMinNow=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
                const tauCount=Math.max(1,tauMaxN-tauMinNow+1);
                hud.save();
                hud.fillStyle="rgba(10,10,14,0.985)";
                hud.fillRect(x0,y0,ww,hh);
                const localAxis=__getMSDAxisPack();
                for(let ss=0;ss<tauMaxN;ss++){
                    for(let tau=tauMinNow;tau<=tauMaxN;tau++){
                        if(ss>=tau) break;
                        const idx=ss*tauMaxN + (tau-1);
                        const off=idx*4;
                        const ok=(__tauMSDDisplayPack[off+2] > 0.5);
                        const good=__tauMSDDisplayPack[off+1];
                        const tx=tau-tauMinNow;
                        const xx0=x0+Math.floor(tx*ww/tauCount);
                        const xx1=x0+Math.floor((tx+1)*ww/tauCount);
                        const yy0=y0+Math.floor((tauMaxN-1-ss)*hh/tauMaxN);
                        const yy1=y0+Math.floor((tauMaxN-ss)*hh/tauMaxN);
                        if(ok){
                            hud.fillStyle=__msdScoreColor(good);
                            hud.fillRect(xx0,yy0,Math.max(1,xx1-xx0),Math.max(1,yy1-yy0));
                        }else if(localAxis && localAxis.valid && localAxis.valid[idx]>0){
                            let localMin=__tauMSDDisplayMin, localMax=__tauMSDDisplayMax;
                            const localScore=(localAxis.raw && Number.isFinite(localAxis.raw[idx]))?localAxis.raw[idx]:0;
                            const lo=Math.log(1+Math.max(0,localMin));
                            const hi=Math.log(1+Math.max(localMin+1e-6,localMax));
                            const norm=(Math.log(1+Math.max(0,localScore))-lo)/Math.max(1e-6,hi-lo);
                            hud.fillStyle=__msdScoreColor(1-Math.max(0,Math.min(1,norm)));
                            hud.fillRect(xx0,yy0,Math.max(1,xx1-xx0),Math.max(1,yy1-yy0));
                        }
                    }
                }
                const selTau=Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0));
                const selSub=Math.max(0,Math.min(selTau-1,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0)));
                if(selTau>=tauMinNow && selTau<=tauMaxN){
                    const tx=selTau-tauMinNow;
                    const xx0=x0+Math.floor(tx*ww/tauCount);
                    const xx1=x0+Math.floor((tx+1)*ww/tauCount);
                    const yy0=y0+Math.floor((tauMaxN-1-selSub)*hh/tauMaxN);
                    const yy1=y0+Math.floor((tauMaxN-selSub)*hh/tauMaxN);
                    hud.fillStyle="rgba(255,235,40,0.82)";
                    hud.fillRect(xx0,yy0,Math.max(1,xx1-xx0),Math.max(1,yy1-yy0));
                }
                hud.restore();
                __drawLegend(Math.round(W2*0.56), Math.round(H2*0.70), "MSD SSE", mkVals(__tauMSDDisplayMin,__tauMSDDisplayMax), (v:number)=>{
                    const lo=Math.log(1+Math.max(0,__tauMSDDisplayMin));
                    const hi=Math.log(1+Math.max(__tauMSDDisplayMin+1e-6,__tauMSDDisplayMax));
                    const norm=(Math.log(1+Math.max(0,v))-lo)/Math.max(1e-6,hi-lo);
                    return __msdScoreColor(1-Math.max(0,Math.min(1,norm)));
                });
            }else{
                __drawLegend(Math.round(W2*0.56), Math.round(H2*0.70), "coste", mkVals(minCost,maxCost), __costColor);
            }
            const selTau=Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0));
            const selSub=Math.max(0,Math.min(selTau-1,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0)));
            if(selTau>=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0)) && selTau<=tauMaxN){
                const t0=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0))-1;
                const tCount=Math.max(1,tauMaxN-t0);
                const fillSelCell=(x:number,y:number,w:number,h:number)=>{
                    const tx=selTau-1-t0;
                    const xx0=x+Math.floor(tx*w/tCount);
                    const xx1=x+Math.floor((tx+1)*w/tCount);
                    const yy0=y+Math.floor((tauMaxN-1-selSub)*h/tauMaxN);
                    const yy1=y+Math.floor((tauMaxN-selSub)*h/tauMaxN);
                    hud.save();
                    hud.fillStyle="rgba(255,235,40,0.82)";
                    hud.fillRect(xx0,yy0,Math.max(1,xx1-xx0),Math.max(1,yy1-yy0));
                    hud.restore();
                };
                fillSelCell(0,0,W2,Math.round(H2*0.46));
                fillSelCell(0,Math.round(H2*0.54),Math.round(W2*0.49),Math.round(H2*0.46));
                fillSelCell(Math.round(W2*0.51),Math.round(H2*0.54),Math.round(W2*0.49),Math.round(H2*0.46));
            }
            return;
        }

        if((__tauHudStatsFrame++%10)===0){
            __updateHudRanges();
        }
        const aRef=2.7;
        const sRef=Math.sqrt(2*aRef);
        const mkLabels=(r:{min:number,max:number})=>{
            const mid=0.5*(r.min+r.max);
            return [__fmtHud(r.max), __fmtHud(mid), __fmtHud(r.min)];
        };
        const mkLabelsFixed=(minV:number,maxV:number)=>{
            const mid=0.5*(minV+maxV);
            return [__fmtHud(maxV), __fmtHud(mid), __fmtHud(minV)];
        };

        const drawAxes=(x0:number,y0:number,x1:number,y1:number, title:string, yLabels:string[])=>{
            const axisFont=Math.max(6,Math.round(H2*0.0078)+1-notFsDelta);
            const titleFont=Math.max(7,Math.round(H2*0.0085)+1-notFsDelta);
            const idxFont=Math.max(6,Math.round(H2*0.0075)+1-notFsDelta);
            hud.font=titleFont+"px monospace";
            hud.strokeRect(x0,y0,x1-x0,y1-y0);
            hud.fillText(title, x0+6, y0+12);
            const xm=Math.round((x0+x1)*0.5);
            const yTopTick=y0+3, yMidTick=Math.round((y0+y1)*0.5), yBotTick=y1-3;
            const idxY=y1+Math.max(10,Math.round(H2*0.012))-2;

            // Eje X: etiquetas compactas y pegadas al borde inferior del panel
            hud.font=idxFont+"px monospace";
            hud.textBaseline="top";
            hud.textAlign="left";
            hud.fillText("idx 0 [bin]", x0+2, idxY);
            hud.textAlign="center";
            hud.fillText("idx "+Math.round((nBins||64)/2)+" [bin]", xm, idxY);
            hud.textAlign="right";
            hud.fillText("idx "+Math.max(0,(nBins||64)-1)+" [bin]", x1-2, idxY);

            // Eje Y: anclado a la derecha del borde izquierdo, para que el texto crezca hacia la izquierda
            hud.font=axisFont+"px monospace";
            hud.textBaseline="middle";
            hud.textAlign="right";
            hud.fillText(yLabels[0], x0-3, yTopTick);
            hud.fillText(yLabels[1], x0-3, yMidTick);
            hud.fillText(yLabels[2], x0-3, yBotTick);

            hud.beginPath();
            hud.moveTo(x0,yMidTick); hud.lineTo(x1,yMidTick);
            hud.globalAlpha=0.25; hud.stroke(); hud.globalAlpha=1.0;
            hud.textAlign="left";
            hud.textBaseline="alphabetic";
        };

        drawAxes(xL,yTop0,xR,yTop1,"f(t): final",mkLabels(__tauHudRanges.f));
        drawAxes(xBL0,yBot0,xBL1,yBot1,"s(t): init/final",mkLabelsFixed(0,sRef));
        drawAxes(xBR0,yBot0,xBR1,yBot1,"a(t): init/final",mkLabelsFixed(0,aRef));
        drawAxes(xL,yPdf0,xR,yPdf1,"pdf: hist/init/final",mkLabels(__tauHudRanges.p));
        const __dashMode=((typeof showMSDOverlay!=="undefined") && !!showMSDOverlay);

        // Overlay opcional MSD: original del eje x (blanco) vs simulada 1D (verde)
        if(__dashMode){
            const srcX=(typeof datos$[X,Y]$1!=="undefined" && datos$[X,Y]$1)?(datos$[X,Y]$1 instanceof Float32Array?datos$[X,Y]$1:new Float32Array(datos$[X,Y]$1)):null;
            const sim$[X,Y]$=((window as any).simData$[X,Y]$)?(((window as any).simData$[X,Y]$ instanceof Float32Array)?(window as any).simData$[X,Y]$:new Float32Array((window as any).simData$[X,Y]$)):null;
            const calcMSD1D=(x:Float32Array,maxTau:number)=>{
                const n=(x.length|0);
                const tMax=Math.max(1,Math.min(maxTau,n-1));
                const out=new Float32Array(tMax+1);
                out[0]=0;
                for(let tau=1;tau<=tMax;tau++){
                    let acc=0, cnt=0;
                    for(let i=0;i<n-tau;i++){
                        const dx=(x[i+tau]-x[i]);
                        if(!Number.isFinite(dx)) continue;
                        acc+=dx*dx;
                        cnt++;
                    }
                    out[tau]=(cnt>0)?(acc/cnt):NaN;
                }
                return out;
            };
            if(srcX && sim$[X,Y]$){
                const maxTau=Math.max(8,Math.min(220,Math.min(srcX.length,sim$[X,Y]$.length)-1));
                const msdO=calcMSD1D(srcX,maxTau);
                const msdS=calcMSD1D(sim$[X,Y]$,maxTau);
                // Escala fija respecto a la MSD original:
                // el ajuste por click (a(t), s(t)) no debe modificar esta referencia visual.
                let mx=0;
                for(let t=1;t<msdO.length;t++){
                    const vo=msdO[t];
                    if(Number.isFinite(vo) && vo>mx) mx=vo;
                }
                mx=Math.max(mx,1e-6);
                let mxSim=0;
                for(let t=1;t<msdS.length;t++){
                    const vs=msdS[t];
                    if(Number.isFinite(vs) && vs>mxSim) mxSim=vs;
                }
                const simScale=(mxSim>1e-9)?(mx/mxSim):1.0; // solo visual: ajusta verde al rango de la original
                const rw=Math.max(1,(xR-xL));
                const rh=Math.max(1,(yTop1-yTop0));
                const xOf=(tau:number)=>xL + (tau/maxTau)*rw;
                const yOf=(v:number)=>yTop1 - (Math.max(0,v)/mx)*rh;
                hud.save();
                hud.setLineDash([7,4]);
                hud.lineWidth=1.8;
                hud.globalAlpha=0.85;
                hud.strokeStyle="rgba(255,255,255,0.95)";
                hud.beginPath();
                let p0=true;
                for(let t=0;t<msdO.length;t++){
                    const v=msdO[t]; if(!Number.isFinite(v)) continue;
                    const xx=xOf(t), yy=yOf(v);
                    if(p0){ hud.moveTo(xx,yy); p0=false; } else hud.lineTo(xx,yy);
                }
                hud.stroke();
                hud.strokeStyle="rgba(90,255,110,0.95)";
                hud.beginPath();
                p0=true;
                for(let t=0;t<msdS.length;t++){
                    const v=msdS[t]; if(!Number.isFinite(v)) continue;
                    const xx=xOf(t), yy=yOf(v*simScale);
                    if(p0){ hud.moveTo(xx,yy); p0=false; } else hud.lineTo(xx,yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha=1;
                hud.fillStyle="rgba(255,255,255,0.95)";
                hud.font=Math.max(6,Math.round(H2*0.0076)+1-notFsDelta)+"px monospace";
                hud.fillText("MSD eje $[x,y]$: orig blanca, sim 1D verde", xL+10, yTop0+38);
                hud.restore();
            }
        }

        // Overlay opcional: f_km / a_km crudos (directos de tauMom2), sin postprocesado.
        if((typeof showRawKMOverlay!=="undefined") && !!showRawKMOverlay){
            const bins=Math.max(2,((typeof nBins!=="undefined"?nBins:64)|0));
            // Referencia fija "real": tau=1, subseq=0 (independiente del selector actual).
            const rowY=0;
            const rawRow=__readTexRow((typeof tauMom2!=="undefined"?tauMom2:null),bins,rowY);
            if(rawRow){
                const fkm=new Float32Array(bins);
                const akm=new Float32Array(bins);
                let mn=1e30, mx=-1e30;
                for(let i=0;i<bins;i++){
                    const b=i*4;
                    const fv=rawRow[b+0];
                    const av=rawRow[b+1];
                    const ff=Number.isFinite(fv)?fv:NaN;
                    const aa=Number.isFinite(av)?av:NaN;
                    fkm[i]=Number.isFinite(ff)?ff:NaN;
                    akm[i]=Number.isFinite(aa)?aa:NaN;
                    if(Number.isFinite(ff)){ if(ff<mn) mn=ff; if(ff>mx) mx=ff; }
                    if(Number.isFinite(aa)){ if(aa<mn) mn=aa; if(aa>mx) mx=aa; }
                }
                if(Number.isFinite(__tauHudRanges.f.min)){ mn=Math.min(mn,__tauHudRanges.f.min); }
                if(Number.isFinite(__tauHudRanges.f.max)){ mx=Math.max(mx,__tauHudRanges.f.max); }
                if(!(mx>mn)){ mn=-1; mx=1; }
                const rw=Math.max(1,(xR-xL));
                const rh=Math.max(1,(yTop1-yTop0));
                const xOf=(i:number)=>xL + (i/(bins-1))*rw;
                const yOf=(v:number)=>yTop1 - ((v-mn)/(mx-mn))*rh;

                hud.save();
                hud.globalAlpha=0.8;
                hud.lineWidth=1.6;
                hud.strokeStyle="rgba(255,255,255,0.85)";
                if(__dashMode) hud.setLineDash([6,4]);
                hud.beginPath();
                let p0=true;
                for(let i=0;i<bins;i++){
                    const v=fkm[i];
                    if(!Number.isFinite(v)) continue;
                    const xx=xOf(i), yy=yOf(v);
                    if(p0){ hud.moveTo(xx,yy); p0=false; } else hud.lineTo(xx,yy);
                }
                hud.stroke();

                hud.setLineDash([5,3]);
                hud.strokeStyle="rgba(255,255,255,0.85)";
                hud.beginPath();
                p0=true;
                for(let i=0;i<bins;i++){
                    const v=akm[i];
                    if(!Number.isFinite(v)) continue;
                    const xx=xOf(i), yy=yOf(v);
                    if(p0){ hud.moveTo(xx,yy); p0=false; } else hud.lineTo(xx,yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha=1.0;
                hud.fillStyle="rgba(255,255,255,0.90)";
                hud.font=Math.max(6,Math.round(H2*0.0076)+1-notFsDelta)+"px monospace";
                hud.fillText("raw f_km/a_km (tau=1)", xL+10, yTop0+24);
                hud.restore();
            }
        }

        // Overlay opcional: f(t) de Least Squares de referencia (tau=1,subseq=0), toggle con 'g'.
        if((typeof showLSFOverlay!=="undefined") && !!showLSFOverlay){
            const bins=Math.max(2,((typeof nBins!=="undefined"?nBins:64)|0));
            const xiLS=__readTexPixel((typeof tauXiF!=="undefined"?tauXiF:null),0,0); // x=tau-1=0, y=subseq=0
            if(xiLS){
                const c0=Number.isFinite(xiLS[0])?xiLS[0]:0;
                const c1=Number.isFinite(xiLS[1])?xiLS[1]:0;
                const c2=Number.isFinite(xiLS[2])?xiLS[2]:0;
                const c3=Number.isFinite(xiLS[3])?xiLS[3]:0;
                const rw=Math.max(1,(xR-xL));
                const rh=Math.max(1,(yTop1-yTop0));
                let mn=1e30, mx=-1e30;
                for(let i=0;i<bins;i++){
                    const x=(i+0.5)/bins;
                    const v=c0 + c1*x + c2*x*x + c3*x*x*x;
                    if(!Number.isFinite(v)) continue;
                    if(v<mn) mn=v;
                    if(v>mx) mx=v;
                }
                if(!(mx>mn)){
                    mn=-1;
                    mx=1;
                }else{
                    const pad=(mx-mn)*0.08;
                    mn-=pad; mx+=pad;
                }
                const xOf=(i:number)=>xL + (i/(bins-1))*rw;
                const yOf=(v:number)=>yTop1 - ((v-mn)/(mx-mn))*rh;
                hud.save();
                hud.globalAlpha=0.8;
                hud.lineWidth=1.9;
                hud.strokeStyle="rgba(255,255,255,0.92)";
                if(__dashMode) hud.setLineDash([6,4]);
                hud.beginPath();
                let p0=true;
                for(let i=0;i<bins;i++){
                    const x=(i+0.5)/bins;
                    const fLS=c0 + c1*x + c2*x*x + c3*x*x*x;
                    if(!Number.isFinite(fLS)) continue;
                    const xx=xOf(i), yy=yOf(fLS);
                    if(p0){ hud.moveTo(xx,yy); p0=false; } else hud.lineTo(xx,yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha=1.0;
                hud.fillStyle="rgba(255,255,255,0.95)";
                hud.font=Math.max(6,Math.round(H2*0.0076)+1-notFsDelta)+"px monospace";
                hud.fillText("LS f(t) (tau=1)", xL+160, yTop0+24);
                hud.restore();
            }
        }

        // Descripciones: una linea por grafica, solo en fullscreen.
        if(isFsNow){
            hud.font=Math.max(7,Math.round(H2*0.0089)+2-notFsDelta)+"px monospace";
            const lineH=Math.max(8,Math.round(H2*0.0102)+2-notFsDelta);
            // Pinta bloques de texto multilinea para las descripciones de fullscreen.
            const drawLines=(x:number,y:number,lines:string[])=>{
                for(let i=0;i<lines.length;i++){
                    hud.fillText(lines[i], x, y + i*lineH);
                }
            };

            const dTopY=Math.min(H2-8, yTop1 + Math.max(17,Math.round(H2*0.021)) + 3);
            const dBotY=Math.min(H2-8, yBot1 + Math.max(17,Math.round(H2*0.021)) + 3);
            const dPdfY=Math.min(H2-6, yPdf1 + Math.max(20,Math.round(H2*0.023)) + 3); // +3..5px extra para no chocar con idx

            const dTop1="f(t): drift final reconstruido con SINDy+AFP para el modelo seleccionado; resume la tendencia neta de movimiento a lo largo del eje.";
            const dBL=[
                "s(t): amplitud previa de difusion dependiente de posicion.",
                "Interpretacion practica: cuanto crece el ruido local del proceso.",
                "Si init/final cambian mucho, ese tau-subseq no es estable.",
                "Si son parecidas, la identificacion es robusta."
            ];
            const dBR=[
                "a(t)=0.5*s(t)^2: difusion efectiva fisica, siempre no negativa.",
                "Valores altos: mayor dispersion de trayectorias en esa zona.",
                "Valores bajos: movimiento mas confinado o menos aleatorio.",
                "Comparar init/final indica correccion del modelo."
            ];
            const dPDF="pdf: cian=histograma observado, magenta/naranja=estacionaria init/final. Si la final se pega al cian, este (tau,subseq) describe mejor la cromatina. tau="+(bestTau||1)+" subseq="+(bestSubseq||0)+" (t:curvas r:fp)";
            const dUnits="Unidades: f [u_x/dt]   s [u_x/sqrt(dt)]   a [u_x^2/dt]   pdf [1/u_x]";

            hud.fillText(dTop1, xL+34, dTopY);   // mas a la derecha para no chocar con labels
            drawLines(xBL0+8, dBotY, dBL);
            drawLines(xBR0+8, dBotY, dBR);
            hud.fillText(dPDF, xL+10, dPdfY);
            hud.fillText(dUnits, xL+10, dPdfY + lineH);
        }
        hud.restore();
    };

    //? - Fullscreen y ajuste del overlay

    const __fsTargetC$[2,3]$=__c$[2,3]$Host as any;
    const __fsHostIsCanvas=(__fsTargetC$[2,3]$===canvas);
    const __baseHostStyle=__fsHostIsCanvas?null:{
        position: (__c$[2,3]$Host.style.position || ""),
        top: (__c$[2,3]$Host.style.top || ""),
        left: (__c$[2,3]$Host.style.left || ""),
        width: (__c$[2,3]$Host.style.width || ""),
        height: (__c$[2,3]$Host.style.height || ""),
        maxWidth: (__c$[2,3]$Host.style.maxWidth || ""),
        maxHeight: (__c$[2,3]$Host.style.maxHeight || ""),
        zIndex: (__c$[2,3]$Host.style.zIndex || ""),
        display: (__c$[2,3]$Host.style.display || ""),
        margin: (__c$[2,3]$Host.style.margin || ""),
        padding: (__c$[2,3]$Host.style.padding || "")
    };
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
    // Ajusta estilos de host y canvas al entrar o salir de fullscreen.
    const __applyCanvasFullscreenC$[2,3]$=()=>{
        const isFs=(document.fullscreenElement===__fsTargetC$[2,3]$);
        if(isFs){
            document.body.style.overflow="hidden";
            document.documentElement.style.overflow="hidden";
            if(!__fsHostIsCanvas){
                __c$[2,3]$Host.style.position="fixed";
                __c$[2,3]$Host.style.left="0";
                __c$[2,3]$Host.style.top="0";
                __c$[2,3]$Host.style.width="100vw";
                __c$[2,3]$Host.style.height="100vh";
                __c$[2,3]$Host.style.maxWidth="100vw";
                __c$[2,3]$Host.style.maxHeight="100vh";
                __c$[2,3]$Host.style.zIndex="999998";
                __c$[2,3]$Host.style.display="block";
                __c$[2,3]$Host.style.margin="0";
                __c$[2,3]$Host.style.padding="0";
            }
            canvas.style.position=__fsHostIsCanvas?"fixed":"absolute";
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
            if(!__fsHostIsCanvas && __baseHostStyle){
                __c$[2,3]$Host.style.position=__baseHostStyle.position;
                __c$[2,3]$Host.style.top=__baseHostStyle.top;
                __c$[2,3]$Host.style.left=__baseHostStyle.left;
                __c$[2,3]$Host.style.width=__baseHostStyle.width;
                __c$[2,3]$Host.style.height=__baseHostStyle.height;
                __c$[2,3]$Host.style.maxWidth=__baseHostStyle.maxWidth;
                __c$[2,3]$Host.style.maxHeight=__baseHostStyle.maxHeight;
                __c$[2,3]$Host.style.zIndex=__baseHostStyle.zIndex;
                __c$[2,3]$Host.style.display=__baseHostStyle.display;
                __c$[2,3]$Host.style.margin=__baseHostStyle.margin;
                __c$[2,3]$Host.style.padding=__baseHostStyle.padding;
            }
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
        __syncTauHud();
    };
    __ensureTauHud();
    __syncTauHud();

    canvas.addEventListener("dblclick", ()=>{
        if(document.fullscreenElement) document.exitFullscreen?.();
        else openFullscreen(__fsTargetC$[2,3]$);
        setTimeout(__applyCanvasFullscreenC$[2,3]$, 0);
    });
    document.addEventListener("fullscreenchange", ()=>{ __applyCanvasFullscreenC$[2,3]$(); __syncTauHud(); });
    window.addEventListener("resize", ()=>{ __applyCanvasFullscreenC$[2,3]$(); __syncTauHud(); });
