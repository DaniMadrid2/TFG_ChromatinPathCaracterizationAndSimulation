/**
Archivo:
- Convierte el modelo estimado en una trayectoria simulada publicable para C1.
- Une lecturas de texturas, coeficientes medios, escalado de amplitud y escritura en window.simDataX/Y.

Objetivos:
- Muestreo y simulacion base:
  - __sampleSindy
  - __safeNum
  - __simulateAxisPath
  - __simulateAxisFromCoeffs
  - __simulateAxisFromSindyRow
- Estadistica previa y ganancia:
  - __collectMeanAxisCoeffs
  - __measureAxisSeries
  - __estimateAxisGain
- Publicacion entre canvases:
  - __publishSimTrajectoryFromTau
*/
//@ts-nocheck
    //? - Muestreo y simulacion base
    //<BridgeSimulationHelpers>

    // Interpola un canal del campo Sindy en coordenada normalizada u.
    const __sampleSindy=(arr:Float32Array, bins:number, u:number, ch:number)=>{
        if(!arr || bins<=0) return 0;
        const uu=Math.max(0,Math.min(1,u));
        const fx=uu*(bins-1);
        const i0=Math.max(0,Math.min(bins-1,Math.floor(fx)));
        const i1=Math.max(0,Math.min(bins-1,i0+1));
        const t=fx-i0;
        const v0=arr[i0*4+ch];
        const v1=arr[i1*4+ch];
        const a=Number.isFinite(v0)?v0:0;
        const b=Number.isFinite(v1)?v1:0;
        return a*(1-t)+b*t;
    };
    // Sustituye NaN o infinitos por un valor de respaldo estable.
    const __safeNum=(v:number, fb:number=0)=>Number.isFinite(v)?v:fb;

    // Integra una trayectoria 1D a partir de evaluadores genericos de drift y difusion.
    const __simulateAxisPath=(
        src:Float32Array, n:number,
        minX:number, rangeX:number, dt:number, gain:number,
        evalDrift:(uu:number)=>number,
        evalDiff:(uu:number)=>number,
        useNoise:boolean,
        evalNoise:(i:number)=>number,
        aOverride:number|null=null
    )=>{
        const out=new Float32Array(n);
        out[0]=__safeNum(src[0],0);
        const g=__safeNum(gain,1);
        const dtt=__safeNum(dt,1e-3);
        for(let i=1;i<n;i++){
            const u=(out[i-1]-minX)/rangeX;
            const uu=Math.max(0,Math.min(1,u));
            const f=__safeNum(evalDrift(uu),0);
            let s=__safeNum(evalDiff(uu),0);
            if(aOverride!==null && Number.isFinite(aOverride)){
                s=Math.sqrt(Math.max(0,2.0*__safeNum(aOverride,0)));
            }
            let noise=0;
            if(useNoise) noise=__safeNum(evalNoise(i),0);
            const stepDet=__safeNum(f*rangeX*dtt*g,0);
            const stepSto=__safeNum(s*rangeX*Math.sqrt(dtt)*noise*0.45*g,0);
            out[i]=__safeNum(out[i-1]+stepDet+stepSto,out[i-1]);
        }
        return out;
    };
    // Simula una trayectoria usando coeficientes polinomicos ya ajustados.
    const __simulateAxisFromCoeffs=(
        src:Float32Array, n:number,
        minX:number, rangeX:number, dt:number, gain:number,
        coeffF:[number,number,number,number], coeffS:number,
        subseqSeed:number, useNoise:boolean, aOverride:number|null=null
    )=>__simulateAxisPath(
        src,n,minX,rangeX,dt,gain,
        (uu)=>__safeNum(coeffF[0],0) + __safeNum(coeffF[1],0)*uu + __safeNum(coeffF[2],0)*uu*uu + __safeNum(coeffF[3],0)*uu*uu*uu,
        ()=>2.0*__safeNum(coeffS,0),
        useNoise,
        (i)=>{
            const h=Math.sin((i+1+subseqSeed)*12.9898 + subseqSeed*17.133)*43758.5453;
            return (h-Math.floor(h))*2.0-1.0;
        },
        aOverride
    );
    // Simula una trayectoria directamente desde la fila de campos Sindy ya renderizada.
    const __simulateAxisFromSindyRow=(
        src:Float32Array, n:number,
        minX:number, rangeX:number, dt:number, gain:number,
        row:Float32Array, bins:number,
        tauSel:number, subSel:number, chromSel:number,
        useNoise:boolean, aOverride:number|null=null
    )=>__simulateAxisPath(
        src,n,minX,rangeX,dt,gain,
        (uu)=>__sampleSindy(row,bins,uu,1),
        (uu)=>__sampleSindy(row,bins,uu,2),
        useNoise,
        (i)=>{
            const h=Math.sin((i+1)*12.9898 + tauSel*78.233 + subSel*37.719 + chromSel*11.131)*43758.5453;
            return (h-Math.floor(h))*2.0-1.0;
        },
        aOverride
    );
    // Promedia coeficientes validos de todas las subsecuencias de un tau dado.
    const __collectMeanAxisCoeffs=(tauSel:number)=>{
        let meanXiF:[number,number,number,number]=[0,0,0,0];
        let meanXiS=0;
        let meanCnt=0;
        if(!(tauSel>1)) return {meanXiF,meanXiS,meanCnt};
        const texFF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:null);
        const texSF=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:null);
        const texMF=((typeof tauXiMetaFinal!=="undefined" && tauXiMetaFinal)?tauXiMetaFinal:null);
        const texFI=((typeof tauXiF!=="undefined")?tauXiF:null);
        const texSI=((typeof tauXiS!=="undefined")?tauXiS:null);
        const texMI=((typeof tauXiMeta!=="undefined")?tauXiMeta:null);
        if((!texFF || !texSF || !texMF) && (!texFI || !texSI || !texMI)) return {meanXiF,meanXiS,meanCnt};
        for(let subseqIdx=0; subseqIdx<tauSel; subseqIdx++){
            let pf=texFF?__readTexPixel(texFF,tauSel-1,subseqIdx):null;
            let ps=texSF?__readTexPixel(texSF,tauSel-1,subseqIdx):null;
            let pm=texMF?__readTexPixel(texMF,tauSel-1,subseqIdx):null;
            let valid=(pm && Number.isFinite(pm[1]))?pm[1]:0;
            if(valid<=0.5 && texFI && texSI && texMI){
                pf=__readTexPixel(texFI,tauSel-1,subseqIdx);
                ps=__readTexPixel(texSI,tauSel-1,subseqIdx);
                pm=__readTexPixel(texMI,tauSel-1,subseqIdx);
                valid=(pm && Number.isFinite(pm[1]))?pm[1]:0;
            }
            if(!pf || !ps || !pm) continue;
            if(valid<=0.5) continue;
            meanXiF[0]+=Number.isFinite(pf[0])?pf[0]:0;
            meanXiF[1]+=Number.isFinite(pf[1])?pf[1]:0;
            meanXiF[2]+=Number.isFinite(pf[2])?pf[2]:0;
            meanXiF[3]+=Number.isFinite(pf[3])?pf[3]:0;
            meanXiS+=Number.isFinite(ps[0])?ps[0]:0;
            meanCnt++;
        }
        if(meanCnt>0){
            meanXiF=[meanXiF[0]/meanCnt, meanXiF[1]/meanCnt, meanXiF[2]/meanCnt, meanXiF[3]/meanCnt];
            meanXiS/=meanCnt;
        }
        return {meanXiF,meanXiS,meanCnt};
    };
    // Mide rango y paso medio de la serie observada para normalizar la simulacion.
    const __measureAxisSeries=(src:Float32Array, n:number)=>{
        let minX=1e30, maxX=-1e30;
        for(let i=0;i<n;i++){
            const x=src[i];
            if(Number.isFinite(x)){
                if(x<minX) minX=x;
                if(x>maxX) maxX=x;
            }
        }
        if(!(maxX>minX)){
            minX=(src[0]||0)-1;
            maxX=(src[0]||0)+1;
        }
        let realStepMean=0;
        for(let i=1;i<n;i++) realStepMean+=Math.abs(src[i]-src[i-1]);
        realStepMean/=Math.max(1,n-1);
        return {minX,maxX,rangeX:Math.max(1e-6,maxX-minX),realStepMean};
    };
    const __rowHasSignal=(row:Float32Array|null, bins:number)=>{
        if(!row || row.length < 4) return false;
        for(let i=0;i<bins;i++){
            const k=i*4;
            const f=row[k+1], s=row[k+2], a=row[k+3];
            if((Number.isFinite(f) && Math.abs(f)>1e-8) || (Number.isFinite(s) && Math.abs(s)>1e-8) || (Number.isFinite(a) && Math.abs(a)>1e-10)) return true;
        }
        return false;
    };
    // Ajusta una ganancia para que el paso simulado tenga una escala comparable a la observada.
    const __estimateAxisGain=(
        src:Float32Array, n:number,
        minX:number, rangeX:number, dt:number,
        bins:number, row:Float32Array,
        meanXiF:[number,number,number,number], meanXiS:number, meanCnt:number,
        realStepMean:number
    )=>{
        let modelStepMean=0;
        for(let i=1;i<n;i++){
            const u=(src[i-1]-minX)/rangeX;
            const f=(meanCnt>0)
                ? (meanXiF[0] + meanXiF[1]*u + meanXiF[2]*u*u + meanXiF[3]*u*u*u)
                : __sampleSindy(row,bins,u,1);
            const s=(meanCnt>0)
                ? (2.0*meanXiS)
                : __sampleSindy(row,bins,u,2);
            const det=Math.abs(f)*rangeX*dt;
            const sto=Math.abs(s)*rangeX*Math.sqrt(dt);
            modelStepMean+=det+sto;
        }
        modelStepMean/=Math.max(1,n-1);
        return {
            modelStepMean,
            // La ganancia ya compensa el paso medio; limitarla evita que la simulacion explote de escala.
            gain:Math.max(0.1,Math.min(10.0,__safeNum(realStepMean/Math.max(1e-6,modelStepMean),1)))
        };
    };
    //</BridgeSimulationHelpers>

    //? - Publicacion de la trayectoria entre canvases
    //<BridgeSimulationPublish>

    // Genera la trayectoria del eje actual y la publica en window para que C1 la consuma.
    const __publishSimTrajectoryFromTau=(force:boolean=false)=>{
        if(typeof tauSindyTex==="undefined" || !tauSindyTex) return false;
        if(typeof datos$[X,Y]$1==="undefined" || !datos$[X,Y]$1) return false;

        const bins=Math.max(2, ((typeof nBins!=="undefined"?nBins:64)|0));
        const nSeries=Math.max(2, ((typeof NMuestras1!=="undefined"?NMuestras1:0)|0));
        if(nSeries<2) return false;

        const tauLo=Math.max(1, ((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
        const tauHi=Math.max(tauLo, ((typeof tauMaxVeces!=="undefined"?tauMaxVeces:1)|0));
        const tauSel=Math.max(tauLo, Math.min(tauHi, ((typeof bestTau!=="undefined"?bestTau:1)|0)));
        const subSel=Math.max(0, Math.min(tauSel-1, ((typeof bestSubseq!=="undefined"?bestSubseq:0)|0)));
        const chromSel=Math.max(1, ((typeof chromatinIndex!=="undefined"?chromatinIndex:1)|0));
        const useMeanMode=!!((window as any).simUseMeanSubseq||false);
        const reqRebuild=((window as any).simReqRebuild|0);
        const keyNow=tauSel+"|"+subSel;

        if(__aOverrideEnabled && __aOverrideKey!==keyNow){
            __clearAOverride();
        }
        if(useMeanMode!==__lastMeanFlag || reqRebuild!==__lastReqRebuild){
            force=true;
            __lastSimKey="";
        }
        __lastMeanFlag=useMeanMode;
        __lastReqRebuild=reqRebuild;

        const simKey=[
            tauSel,subSel,chromSel,bins,nSeries,tauLo,tauHi,
            useMeanMode?1:0,
            __aOverrideEnabled?1:0,
            __safeNum(__aOverrideA??-1,-1).toFixed(4)
        ].join("|");
        if(!force && simKey===__lastSimKey) return false;

        let row=__readTexRow(tauSindyTex,bins,0);
        if(!__rowHasSignal(row,bins) && (typeof tauSindyInitTex!=="undefined") && tauSindyInitTex){
            const rowInit=__readTexRow(tauSindyInitTex,bins,0);
            if(__rowHasSignal(rowInit,bins)) row=rowInit;
        }
        if(!row) return false;

        const src=(datos$[X,Y]$1 instanceof Float32Array)?datos$[X,Y]$1:new Float32Array(datos$[X,Y]$1);
        const n=Math.max(2,Math.min(nSeries,src.length));
        if(n<2) return false;

        // 1) Leemos el estado seleccionado y calculamos la escala de la serie real.
        const {meanXiF,meanXiS,meanCnt:meanCoeffCount} = useMeanMode ? __collectMeanAxisCoeffs(tauSel) : {meanXiF:[0,0,0,0] as [number,number,number,number], meanXiS:0, meanCnt:0};
        const {minX,rangeX,realStepMean}=__measureAxisSeries(src,n);
        const dt=Math.max(1e-4,1.0/Math.max(1,tauSel));

        // 2) Igualamos el tama?o medio del paso simulado con el de la serie observada.
        const gainInfo=__estimateAxisGain(src,n,minX,rangeX,dt,bins,row,meanXiF,meanXiS,meanCoeffCount,realStepMean);
        const modelStepMean=gainInfo.modelStepMean;
        const gain=gainInfo.gain;
        const meanAmpBoost=1.0;
        const useAO=(__aOverrideEnabled && __aOverrideA!==null)?__aOverrideA:null;

        const sim$[X,Y]$=new Float32Array(n);
        sim$[X,Y]$[0]=src[0];
        let meanCnt=meanCoeffCount;

        // 3) Generamos la trayectoria: promedio por subsecuencias, media de coeficientes o campo Sindy.
        if(useMeanMode && tauSel>1){
            // En promedio sobre subsecuencias acumulamos trayectorias simuladas completas
            // y solo dividimos al final en cada punto para no sesgar la media.
            sim$[X,Y]$.fill(0);
            const texFF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:null);
            const texSF=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:null);
            const texMF=((typeof tauXiMetaFinal!=="undefined" && tauXiMetaFinal)?tauXiMetaFinal:null);
            const texFI=((typeof tauXiF!=="undefined")?tauXiF:null);
            const texSI=((typeof tauXiS!=="undefined")?tauXiS:null);
            const texMI=((typeof tauXiMeta!=="undefined")?tauXiMeta:null);
            let nUsed=0;
            const cntPerPt=new Uint16Array(n);
            for(let subseqIdx=0; subseqIdx<tauSel; subseqIdx++){
                let pf=texFF?__readTexPixel(texFF,tauSel-1,subseqIdx):null;
                let ps=texSF?__readTexPixel(texSF,tauSel-1,subseqIdx):null;
                let pm=texMF?__readTexPixel(texMF,tauSel-1,subseqIdx):null;
                let valid=(pm && Number.isFinite(pm[1]))?pm[1]:0;
                if(valid<=0.5 && texFI && texSI && texMI){
                    pf=__readTexPixel(texFI,tauSel-1,subseqIdx);
                    ps=__readTexPixel(texSI,tauSel-1,subseqIdx);
                    pm=__readTexPixel(texMI,tauSel-1,subseqIdx);
                    valid=(pm && Number.isFinite(pm[1]))?pm[1]:0;
                }
                if(!pf || !ps || !pm) continue;
                if(valid<=0.5) continue;
                const coeffF:[number,number,number,number]=[
                    Number.isFinite(pf[0])?pf[0]:0,
                    Number.isFinite(pf[1])?pf[1]:0,
                    Number.isFinite(pf[2])?pf[2]:0,
                    Number.isFinite(pf[3])?pf[3]:0
                ];
                const coeffS=(Number.isFinite(ps[0])?ps[0]:0);
                const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain*meanAmpBoost,coeffF,coeffS,subseqIdx,false,(__aOverrideEnabled && __aOverrideA!==null && subseqIdx===subSel)?__aOverrideA:null);
                for(let i=0;i<n;i++){
                    const value=tr[i];
                    if(Number.isFinite(value)){
                        sim$[X,Y]$[i]+=value;
                        cntPerPt[i]+=1;
                    }
                }
                nUsed++;
            }
            if(nUsed>0){
                for(let i=0;i<n;i++){
                    const c=cntPerPt[i];
                    sim$[X,Y]$[i]=(c>0)?(sim$[X,Y]$[i]/c):src[i];
                }
                meanCnt=nUsed;
            }else{
                const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain*meanAmpBoost,meanXiF,meanXiS,subSel,false,useAO);
                sim$[X,Y]$.set(tr);
            }
        }else if(meanCoeffCount>0){
            const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain,meanXiF,meanXiS,subSel,true,useAO);
            sim$[X,Y]$.set(tr);
        }else{
            const tr=__simulateAxisFromSindyRow(src,n,minX,rangeX,dt,gain,row,bins,tauSel,subSel,chromSel,true,useAO);
            sim$[X,Y]$.set(tr);
        }

        // 4) Saneamos la salida y la publicamos para C1.
        for(let i=0;i<n;i++){
            if(!Number.isFinite(sim$[X,Y]$[i])) sim$[X,Y]$[i]=__safeNum(src[i],0);
        }

        (window as any).simData$[X,Y]$=sim$[X,Y]$;
        (window as any).simSamples$[X,Y]$=n;
        (window as any).chromatinIndex=chromSel;
        (window as any).simUseMeanSubseq=useMeanMode;
        (window as any).simMeta$[X,Y]$={tau:tauSel,subseq:subSel,chromatin:chromSel,n,meanAllSubseq:useMeanMode,meanCnt,axis:"$[x,y]$"};
        (window as any).simStamp$[X,Y]$=((((window as any).simStamp$[X,Y]$)|0)+1);
        __lastSimKey=simKey;

        if(__lastSimLogFrame>0){
            console.log("C$[2,3]$ sim$[X,Y]$->C1", {tau:tauSel,subseq:subSel,chromatin:chromSel,mode:(useMeanMode?"mean-subseq":"single-subseq"),meanCnt,aOverride:(__aOverrideEnabled?__aOverrideA:null),samples:n,gain,realStepMean,modelStepMean,stamp$[X,Y]$:(window as any).simStamp$[X,Y]$});
            __lastSimLogFrame-=1;
        }
        return true;
    };
    //</BridgeSimulationPublish>
