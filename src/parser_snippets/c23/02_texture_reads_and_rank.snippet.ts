/**
Archivo:
- Agrupa las lecturas GPU -> CPU usadas por el HUD y por la seleccion manual de candidatos.
- Centraliza el acceso a filas, pixeles y rectangulos de texturas WebGL.

Objetivos:
- Estado del lector y rangos del HUD:
  - __tauHudReadFbo
  - __tauHudStatsFrame
  - __tauHudRanges
- Lecturas de texturas:
  - __readTexRange
  - __readTexRow
  - __readTexPixel
  - __readTexRect
- Resumen y ranking:
  - __updateHudRanges
  - __getRankedCandidates
*/
//@ts-nocheck

    //? - Estado del lector de texturas
    const __tauHudReadFbo=gl.createFramebuffer();
    let __tauHudStatsFrame=0;
    let __tauHudRanges={
        f:{min:-1,max:1},
        s:{min:-1,max:1},
        a:{min:0,max:1},
        p:{min:0,max:1}
    };

    //? - Lecturas auxiliares desde texturas GPU

    // Lee un rango min/max de una fila de textura usando los canales indicados.
    const __readTexRange=(tex:any, nx:number, chs:number[])=>{
        if(!tex || !__tauHudReadFbo || !Number.isFinite(nx) || nx<=0) return null;
        let prev:any=null;
        try{
            prev=gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if(st!==gl.FRAMEBUFFER_COMPLETE){
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const arr=new Float32Array(nx*4);
            gl.readPixels(0,0,nx,1,gl.RGBA,gl.FLOAT,arr);
            let mn=1e30, mx=-1e30;
            for(let i=0;i<nx;i++){
                const b=i*4;
                for(let k=0;k<chs.length;k++){
                    const v=arr[b+chs[k]];
                    if(!Number.isFinite(v)) continue;
                    if(v<mn) mn=v;
                    if(v>mx) mx=v;
                }
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            if(mx<mn) return null;
            return {min:mn,max:mx};
        }catch{
            try{ gl.bindFramebuffer(gl.FRAMEBUFFER, prev); }catch{}
            return null;
        }
    };

    // Sincroniza los rangos min/max del HUD a partir de los campos SINDy y de la estacionaria.
    const __updateHudRanges=()=>{
        const bins=Math.max(1, ((typeof nBins!=="undefined"?nBins:64)|0));
        const rf=__readTexRange((typeof tauSindyTex!=="undefined"?tauSindyTex:null), bins, [1]);
        const rs=__readTexRange((typeof tauSindyTex!=="undefined"?tauSindyTex:null), bins, [2]);
        const ra=__readTexRange((typeof tauSindyTex!=="undefined"?tauSindyTex:null), bins, [3]);
        const rp=__readTexRange((typeof tauFPStatTex!=="undefined"?tauFPStatTex:null), bins, [0,1,2]);
        if(rf) __tauHudRanges.f=rf;
        if(rs) __tauHudRanges.s=rs;
        if(ra) __tauHudRanges.a=ra;
        if(rp) __tauHudRanges.p=rp;
    };

    // Lee una fila RGBA completa de una textura 2D.
    const __readTexRow=(tex:any, nx:number, y:number=0)=>{
        if(!tex || !__tauHudReadFbo || !Number.isFinite(nx) || nx<=0) return null;
        let prev:any=null;
        try{
            prev=gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if(st!==gl.FRAMEBUFFER_COMPLETE){
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const arr=new Float32Array(nx*4);
            gl.readPixels(0,Math.max(0,y|0),nx,1,gl.RGBA,gl.FLOAT,arr);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return arr;
        }catch{
            try{ gl.bindFramebuffer(gl.FRAMEBUFFER, prev); }catch{}
            return null;
        }
    };

    // Lee un pixel RGBA concreto de una textura 2D.
    const __readTexPixel=(tex:any, x:number, y:number)=>{
        if(!tex || !__tauHudReadFbo) return null;
        let prev:any=null;
        try{
            prev=gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if(st!==gl.FRAMEBUFFER_COMPLETE){
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const out=new Float32Array(4);
            gl.readPixels(Math.max(0,x|0),Math.max(0,y|0),1,1,gl.RGBA,gl.FLOAT,out);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return out;
        }catch{
            try{ gl.bindFramebuffer(gl.FRAMEBUFFER, prev); }catch{}
            return null;
        }
    };

    // Lee un rectangulo RGBA completo, usado para mapas score/KL/coste y overlays.
    const __readTexRect=(tex:any, nx:number, ny:number)=>{
        if(!tex || !__tauHudReadFbo || !Number.isFinite(nx) || !Number.isFinite(ny) || nx<=0 || ny<=0) return null;
        let prev:any=null;
        try{
            prev=gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if(st!==gl.FRAMEBUFFER_COMPLETE){
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const out=new Float32Array(nx*ny*4);
            gl.readPixels(0,0,nx,ny,gl.RGBA,gl.FLOAT,out);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return out;
        }catch{
            try{ gl.bindFramebuffer(gl.FRAMEBUFFER, prev); }catch{}
            return null;
        }
    };

    //? - Ranking y seleccion manual

    // Devuelve la lista de candidatos ordenada segun el modo activo del panel.
    const __getRankedCandidates=()=>{
        const tauMaxN=Math.max(1,((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100)|0));
        const tMin=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
        const mode=__getRankMode();
        const scoreArr=__readTexRect((typeof tauScoreTex!=="undefined"?tauScoreTex:null),tauMaxN,tauMaxN);
        const klArr=__readTexRect((typeof tauKLTex!=="undefined"?tauKLTex:null),tauMaxN,tauMaxN);
        const metaArr=__readTexRect((typeof tauXiMetaFinal!=="undefined"?tauXiMetaFinal:null),tauMaxN,tauMaxN);
        const msdArr=__tauMSDDisplayPack;
        if(!scoreArr && mode==="score") return [] as Array<{tau:number,subseq:number,score:number,cost:number,selected:number}>;
        const selected:Array<{tau:number,subseq:number,score:number,cost:number,selected:number}>=[] as any;
        const validOnly:Array<{tau:number,subseq:number,score:number,cost:number,selected:number}>=[] as any;
        for(let s=0;s<tauMaxN;s++){
            for(let t=tMin;t<=tauMaxN;t++){
                if(s>=t) break;
                const off=(s*tauMaxN + (t-1))*4;
                const sel=scoreArr?scoreArr[off+0]:0;
                const score=scoreArr?scoreArr[off+1]:0;
                const scoreValid=scoreArr?scoreArr[off+2]:0;
                const cost=metaArr?metaArr[off+0]:(scoreArr?scoreArr[off+3]:0);
                const kl=klArr?klArr[off+0]:0;
                const klValid=klArr?klArr[off+1]:0;
                const msd=msdArr?msdArr[off+0]:0;
                const msdValid=msdArr?msdArr[off+2]:0;
                let metric=score;
                let valid=scoreValid;
                if(mode==="kl"){ metric=kl; valid=klValid; }
                else if(mode==="cost"){ metric=cost; valid=(metaArr?metaArr[off+1]:scoreValid); }
                else if(mode==="costMSD"){ metric=msd; valid=msdValid; }
                if(!(valid>0.5) || !Number.isFinite(metric)) continue;
                const item={tau:t,subseq:s,score:metric,cost,selected:sel};
                if(sel>0.5) selected.push(item);
                else validOnly.push(item);
            }
        }
        const sorter=(a:any,b:any)=>(a.score-b.score) || (a.cost-b.cost) || (a.tau-b.tau) || (a.subseq-b.subseq);
        selected.sort(sorter);
        validOnly.sort(sorter);
        return selected.length>0?selected:validOnly;
    };
