var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require("node:path");
const fs = require("node:fs/promises");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const g = globalThis;
        if (!g.window)
            g.window = {};
        if (!g.document) {
            g.document = {
                createElement: () => ({}),
                getElementById: () => null,
                querySelector: () => null,
            };
        }
        if (!g.WebGL2RenderingContext) {
            g.WebGL2RenderingContext = new Proxy({}, {
                get: () => 0
            });
        }
        const dynamicImport = new Function("p", "return import(p)");
        let DetailedParser;
        try {
            ({ DetailedParser } = yield dynamicImport("../../../../../../Plantillas/Codigo/WebGL/webglParser.mts"));
        }
        catch (_a) {
            ({ DetailedParser } = yield dynamicImport("../../../../../../Plantillas/Codigo/WebGL/webglParser.mjs"));
        }
        const repoStyleDir = path.resolve("public/development/blog/02_Fisica/Fluidos/Reologia_01_Intro_a_la_reologia");
        const localStyleDir = process.cwd();
        const probePath = path.join(repoStyleDir, "parseTextC3.shaderdsl.ts");
        let baseDir = repoStyleDir;
        try {
            yield fs.access(probePath);
        }
        catch (_b) {
            baseDir = localStyleDir;
        }
        const parseTextPath = path.join(baseDir, "parseTextC3.shaderdsl.ts");
        const outPath = path.join(baseDir, "generatedParserC3.ts");
        const mainImportsPath = path.join(baseDir, "main.ts");
        const seedTsPath = path.join(baseDir, "generatedParserC2.ts");
        const seedJsPath = path.join(baseDir, "generatedParserC2.js");
        try {
            yield fs.access(outPath);
        }
        catch (_c) {
            const applyC3Seed = (code) => code
                .replace(/generatedParserC2/g, "generatedParserC3")
                .replace(/tauHudOverlayC2/g, "tauHudOverlayC3")
                .replace(/tauControlsC2/g, "tauControlsC3")
                .replace(/__c2Host/g, "__c3Host")
                .replace(/__applyCanvasFullscreenC2/g, "__applyCanvasFullscreenC3")
                .replace(/__fsTargetC2/g, "__fsTargetC3")
                .replace(/#F2/g, "#F3")
                .replace(/"c2"/g, "\"c3\"")
                .replace(/data-id="c2"/g, "data-id=\"c3\"")
                .replace(/\[DetailedParser-C2\]/g, "[DetailedParser-C3]")
                .replace(/\bC2\b/g, "C3");
            const seedTs = yield fs.readFile(seedTsPath, "utf8");
            yield fs.writeFile(outPath, applyC3Seed(seedTs), "utf8");
            try {
                const seedJs = yield fs.readFile(seedJsPath, "utf8");
                yield fs.writeFile(outPath.replace(/\.ts$/i, ".js"), applyC3Seed(seedJs), "utf8");
            }
            catch (_d) { }
        }
        const text = yield fs.readFile(parseTextPath, "utf8");
        yield DetailedParser.parse(text, null, {}, outPath, mainImportsPath);
        let outCode = yield fs.readFile(outPath, "utf8");
        if (outCode.includes("WebGLMan.program(") || outCode.includes("WebGLMan.setGL(gl)")) {
            outCode = outCode.replace(/if\(!WebGLMan\.stWebGLMan\.gl\)\s*WebGLMan\.setGL\(gl\);\r?\n/g, "");
            if (!outCode.includes("const webglMan=new WebGLMan(gl);")) {
                outCode = outCode.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;)/, "$1\n    const webglMan=new WebGLMan(gl);");
            }
            outCode = outCode.replace(/WebGLMan\.program\(/g, "webglMan.program(");
            yield fs.writeFile(outPath, outCode, "utf8");
        }
        const fsSnippet = `
    let tauHudCanvas:any=null;
    let tauHudCtx:any=null;
    const __c3Host=((canvas.parentElement as HTMLElement)||canvas as any) as HTMLElement;
    const __ensureTauHud=()=>{
        if(tauHudCanvas && tauHudCtx) return;
        tauHudCanvas=document.createElement("canvas");
        tauHudCanvas.id="tauHudOverlayC3";
        tauHudCanvas.style.pointerEvents="none";
        tauHudCanvas.style.zIndex="1000000";
        tauHudCanvas.style.display="block";
        tauHudCtx=tauHudCanvas.getContext("2d");
        const p=(__c3Host||document.body) as any;
        if(p && p!==document.body){
            const cs=window.getComputedStyle(p);
            if(cs.position==="static" || !cs.position) p.style.position="relative";
        }
        (p||document.body).appendChild(tauHudCanvas);
    };
    const __syncTauHud=()=>{
        if(!tauHudCanvas) return;
        const isFs=(document.fullscreenElement===canvas);
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
    let __tauMSDLocalRaw:Float32Array|null=null;
    let __tauMSDLocalValid:Uint8Array|null=null;
    let __tauMSDDisplayPack:Float32Array|null=null;
    let __tauMSDDisplayMin=0;
    let __tauMSDDisplayMax=1;
    let __tauMSDJob:any=null;
    let __tauMSDProgressKey="";
    let __aOverrideEnabled=false;
    let __aOverrideA:number|null=null;
    let __aOverrideKey="";
    const __clearAOverride=()=>{
        __aOverrideEnabled=false;
        __aOverrideA=null;
        __aOverrideKey="";
    };
    const __projectChromatinSeries=(serie:any)=>{
        const n=serie?.length||0;
        const axis0=new Float32Array(n);
        const axis1=new Float32Array(n);
        const basisMode=(typeof tauBasisMode!=="undefined" && tauBasisMode)?String(tauBasisMode):"xy";
        const secondaryMode=(typeof tauPcaSecondaryMode!=="undefined" && tauPcaSecondaryMode)?String(tauPcaSecondaryMode):"perp90";
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
    const __isEditingBestInputs=()=>{
        const ae=(document.activeElement as any)||null;
        return !!(ae && (ae===__tauCtlBestTau || ae===__tauCtlBestSub || ae===__tauCtlRank));
    };
    const __publishPanelBest=()=>{
        (window as any).__tauPanelBestC3={
            tau:Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0)),
            subseq:Math.max(0,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0))
        };
    };
    const __syncBestInputs=(force:boolean=false)=>{
        if(!force && __isEditingBestInputs()) return;
        if(__tauCtlBestTau) __tauCtlBestTau.value=String(Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0)));
        if(__tauCtlBestSub){
            const tauNow=Math.max(1,((typeof bestTau!=="undefined"?bestTau:1)|0));
            __tauCtlBestSub.max=String(Math.max(0,tauNow-1));
            __tauCtlBestSub.value=String(Math.max(0,Math.min(tauNow-1,((typeof bestSubseq!=="undefined"?bestSubseq:0)|0))));
        }
    };
    const __copyCandidateFromOtherPanel=()=>{
        const src=(window as any).__tauPanelBestC2;
        if(!src) return false;
        const t=Math.max(1,Math.min((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100), (src.tau|0)||1));
        const s=Math.max(0,Math.min(t-1, (src.subseq|0)||0));
        autoPickBest=false;
        bestTau=t;
        bestSubseq=s;
        __publishPanelBest();
        __syncBestInputs(true);
        __lastSimKey="";
        recomputeTau=true;
        return true;
    };
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
        datosX1=nx;
        datosY1=ny;
        (window as any).__tauProjectionMeta={
            mode:(typeof tauBasisMode!=="undefined"?tauBasisMode:"xy"),
            secondary:(typeof tauPcaSecondaryMode!=="undefined"?tauPcaSecondaryMode:"perp90"),
            simCoordsMode:((typeof tauBasisMode!=="undefined"?tauBasisMode:"xy")==="pca"?"pca-relative":"xy-absolute"),
            ...proj
        };
        const tauSeries=ny;
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
        __lastSimKey="";
        recomputeTau=true;
        __publishPanelBest();
        __syncBestInputs(true);
        return true;
    };
    const __gotoRankedCandidate=(rank:number)=>{
        const candidates=__getRankedCandidates();
        if(candidates.length<=0) return false;
        const idx=Math.max(0,Math.min(candidates.length-1,(rank|0)-1));
        const cand=candidates[idx];
        autoPickBest=false;
        bestTau=cand.tau;
        bestSubseq=cand.subseq;
        __publishPanelBest();
        __syncBestInputs(true);
        __lastSimKey="";
        recomputeTau=true;
        return true;
    };
    const __getRankMode=()=>String(__tauCtlRankMode?.value||"score");
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
            console.log("C3 click override a(t)", {tau:tSel,subseq:sSel,aOverride:__aOverrideA,ratioY:ry});
        }catch{}
    });
    const __applyChromTau=()=>{
        return true;
    };
    const __applyBestTauSubseq=()=>{
        let t=parseInt((__tauCtlBestTau?.value||"1"),10); if(!Number.isFinite(t)) t=1;
        let s=parseInt((__tauCtlBestSub?.value||"0"),10); if(!Number.isFinite(s)) s=0;
        t=Math.max(1,Math.min((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100),t));
        s=Math.max(0,Math.min(t-1,s));
        autoPickBest=false;
        bestTau=t;
        bestSubseq=s;
        __publishPanelBest();
        __syncBestInputs(true);
        __lastSimKey="";
        recomputeTau=true;
        return true;
    };
    const __initTauControls=()=>{
        if(__tauCtlRoot) return true;
        __tauCtlRoot=document.createElement("p");
        __tauCtlRoot.id="tauControlsC3";
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
        const lbT=document.createElement("span"); lbT.textContent="tau";
        __tauCtlBestTau=mkNum("58px", String(typeof bestTau!=="undefined"?bestTau:1), "1", "100");
        const lbS=document.createElement("span"); lbS.textContent="subseq";
        __tauCtlBestSub=mkNum("58px", String(typeof bestSubseq!=="undefined"?bestSubseq:0), "0", "99");
        __tauCtlBestSub.max=String(Math.max(0,(typeof bestTau!=="undefined"?bestTau:1)-1));
        __tauCtlBestTau.onchange=()=>{ __applyBestTauSubseq(); };
        __tauCtlBestSub.onchange=()=>{ __applyBestTauSubseq(); };
        __tauCtlBestBtn=document.createElement("button");
        __tauCtlBestBtn.textContent="Moverse C3";
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
        const lbRank=document.createElement("span"); lbRank.textContent="mejor #";
        const lbRankMode=document.createElement("span"); lbRankMode.textContent="segÃºn";
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
        __tauCtlRankBtn.textContent="Ir candidato C3";
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
        __tauCtlCopyBtn.textContent="Moverse al candidato de C2";
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
        __tauCtlRoot.append(lbT,__tauCtlBestTau,lbS,__tauCtlBestSub,__tauCtlBestBtn,lbRank,__tauCtlRank,lbRankMode,__tauCtlRankMode,__tauCtlRankBtn,__tauCtlCopyBtn);
        let inserted=false;
        const h2=document.querySelector("#F3") as HTMLElement|null;
        const leftSec=(h2?.closest(".left-dnti-section") as HTMLElement|null) || null;
        if(leftSec){
            const ps=Array.from(leftSec.querySelectorAll("p"));
            if(ps.length>0) ps[ps.length-1].insertAdjacentElement("afterend", __tauCtlRoot);
            else leftSec.appendChild(__tauCtlRoot);
            inserted=true;
        }
        if(!inserted){
            (__c3Host||document.body).appendChild(__tauCtlRoot);
        }
        __publishPanelBest();
        __syncBestInputs(false);
        return true;
    };
    const __tauCtlTimer=setInterval(()=>{
        if(__initTauControls()){
            clearInterval(__tauCtlTimer);
            setTimeout(()=>{ __syncBestInputs(); }, 0);
        }
    },200);
    const __tauHudReadFbo=gl.createFramebuffer();
    let __tauHudStatsFrame=0;
    let __tauHudRanges={
        f:{min:-1,max:1},
        s:{min:-1,max:1},
        a:{min:0,max:1},
        p:{min:0,max:1}
    };
    const __fmtHud=(v:number)=>{
        if(!Number.isFinite(v)) return "na";
        const av=Math.abs(v);
        if(av>=1000 || (av>0 && av<0.001)) return v.toExponential(1);
        if(av>=10) return v.toFixed(1);
        return v.toFixed(3);
    };
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
    const __safeNum=(v:number, fb:number=0)=>Number.isFinite(v)?v:fb;
    const __simulateAxisFromCoeffs=(
        src:Float32Array, n:number,
        minX:number, rangeX:number, dt:number, gain:number,
        coeffF:[number,number,number,number], coeffS:number,
        seedOff:number, useNoise:boolean, aOverride:number|null=null
    )=>{
        const out=new Float32Array(n);
        out[0]=__safeNum(src[0],0);
        const g=__safeNum(gain,1);
        const dtt=__safeNum(dt,1e-3);
        for(let i=1;i<n;i++){
            const u=(out[i-1]-minX)/rangeX;
            const uu=Math.max(0,Math.min(1,u));
            const f=__safeNum(coeffF[0],0) + __safeNum(coeffF[1],0)*uu + __safeNum(coeffF[2],0)*uu*uu + __safeNum(coeffF[3],0)*uu*uu*uu;
            let s=2.0*__safeNum(coeffS,0);
            if(aOverride!==null && Number.isFinite(aOverride)){
                s=Math.sqrt(Math.max(0,2.0*__safeNum(aOverride,0)));
            }
            let noise=0;
            if(useNoise){
                const h=Math.sin((i+1+seedOff)*12.9898 + seedOff*17.133)*43758.5453;
                noise=__safeNum((h-Math.floor(h))*2.0-1.0,0);
            }
            const stepDet=__safeNum(f*rangeX*dtt*g,0);
            const stepSto=__safeNum(s*rangeX*Math.sqrt(dtt)*noise*0.45*g,0);
            out[i]=__safeNum(out[i-1]+stepDet+stepSto,out[i-1]);
        }
        return out;
    };
    const __publishSimTrajectoryFromTau=(force:boolean=false)=>{
        if(typeof tauSindyTex==="undefined" || !tauSindyTex) return false;
        if(typeof datosY1==="undefined" || !datosY1) return false;
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
        const simKey=[tauSel,subSel,chromSel,bins,nSeries,tauLo,tauHi,useMeanMode?1:0,__aOverrideEnabled?1:0,__safeNum(__aOverrideA??-1,-1).toFixed(4)].join("|");
        if(!force && simKey===__lastSimKey) return false;

        const row=__readTexRow(tauSindyTex,bins,0);
        if(!row) return false;

        let meanXiF=[0,0,0,0];
        let meanXiS=0;
        let meanCnt=0;
        if(useMeanMode && tauSel>1){
            const texF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:((typeof tauXiF!=="undefined")?tauXiF:null));
            const texS=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:((typeof tauXiS!=="undefined")?tauXiS:null));
            if(texF && texS){
                for(let ss=0;ss<tauSel;ss++){
                    const pf=__readTexPixel(texF,tauSel-1,ss);
                    const ps=__readTexPixel(texS,tauSel-1,ss);
                    if(!pf || !ps) continue;
                    const valid=(Number.isFinite(ps[2])?ps[2]:1);
                    if(valid<=0.5) continue;
                    meanXiF[0]+=Number.isFinite(pf[0])?pf[0]:0;
                    meanXiF[1]+=Number.isFinite(pf[1])?pf[1]:0;
                    meanXiF[2]+=Number.isFinite(pf[2])?pf[2]:0;
                    meanXiF[3]+=Number.isFinite(pf[3])?pf[3]:0;
                    meanXiS+=Number.isFinite(ps[0])?ps[0]:0;
                    meanCnt++;
                }
                if(meanCnt>0){
                    meanXiF=meanXiF.map(v=>v/meanCnt);
                    meanXiS/=meanCnt;
                }
            }
        }

        const src=(datosY1 instanceof Float32Array)?datosY1:new Float32Array(datosY1);
        const n=Math.max(2,Math.min(nSeries,src.length));
        if(n<2) return false;

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
        const rangeX=Math.max(1e-6,maxX-minX);
        const simY=new Float32Array(n);
        simY[0]=src[0];

        const dt=Math.max(1e-4,1.0/Math.max(1,tauSel));
        let realStepMean=0;
        for(let i=1;i<n;i++){
            realStepMean+=Math.abs(src[i]-src[i-1]);
        }
        realStepMean/=Math.max(1,n-1);
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
        const gainRaw=realStepMean/Math.max(1e-6,modelStepMean);
        const gain=Math.max(0.1,Math.min(250.0,__safeNum(gainRaw,1)));
        const meanAmpBoost=tauSel*0.5;
        if(useMeanMode && tauSel>1){
            // Revisor: en promedio sobre subsecuencias hay que acumular solo trayectorias simuladas.
            // Si dejamos src[0] preinyectado antes de dividir por cntPerPt, la media queda sesgada.
            simY.fill(0);
            const texF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:((typeof tauXiF!=="undefined")?tauXiF:null));
            const texS=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:((typeof tauXiS!=="undefined")?tauXiS:null));
            let nUsed=0;
            const cntPerPt=new Uint16Array(n);
            for(let ss=0; ss<tauSel; ss++){
                const pf=texF?__readTexPixel(texF,tauSel-1,ss):null;
                const ps=texS?__readTexPixel(texS,tauSel-1,ss):null;
                if(!pf || !ps) continue;
                const valid=(Number.isFinite(ps[2])?ps[2]:1);
                if(valid<=0.5) continue;
                const cf:[number,number,number,number]=[
                    Number.isFinite(pf[0])?pf[0]:0,
                    Number.isFinite(pf[1])?pf[1]:0,
                    Number.isFinite(pf[2])?pf[2]:0,
                    Number.isFinite(pf[3])?pf[3]:0
                ];
                const cs=(Number.isFinite(ps[0])?ps[0]:0);
                const useAO=(__aOverrideEnabled && __aOverrideA!==null && ss===subSel)?__aOverrideA:null;
                const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain*meanAmpBoost,cf,cs,ss,false,useAO);
                for(let i=0;i<n;i++){
                    const vy=tr[i];
                    if(Number.isFinite(vy)){
                        simY[i]+=vy;
                        cntPerPt[i]+=1;
                    }
                }
                nUsed++;
            }
            if(nUsed>0){
                for(let i=0;i<n;i++){
                    const c=cntPerPt[i];
                    simY[i]=(c>0)?(simY[i]/c):src[i];
                }
                meanCnt=nUsed;
            }else{
                const useAO=(__aOverrideEnabled && __aOverrideA!==null)?__aOverrideA:null;
                const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain*meanAmpBoost,[meanXiF[0],meanXiF[1],meanXiF[2],meanXiF[3]],meanXiS,subSel,false,useAO);
                simY.set(tr);
            }
        }else{
            const cf:[number,number,number,number]=(meanCnt>0)
                ? [meanXiF[0],meanXiF[1],meanXiF[2],meanXiF[3]]
                : [0,0,0,0];
            const cs=(meanCnt>0)?meanXiS:0;
            if(meanCnt>0){
                const useAO=(__aOverrideEnabled && __aOverrideA!==null)?__aOverrideA:null;
                const tr=__simulateAxisFromCoeffs(src,n,minX,rangeX,dt,gain,cf,cs,subSel,true,useAO);
                simY.set(tr);
            }else{
                for(let i=1;i<n;i++){
                    const u=(simY[i-1]-minX)/rangeX;
                    const f=__sampleSindy(row,bins,u,1);
                    let s=__sampleSindy(row,bins,u,2);
                    if(__aOverrideEnabled && __aOverrideA!==null){
                        s=Math.sqrt(Math.max(0,2.0*__safeNum(__aOverrideA,0)));
                    }
                    const h=Math.sin((i+1)*12.9898 + tauSel*78.233 + subSel*37.719 + chromSel*11.131)*43758.5453;
                    const noise=((h-Math.floor(h))*2.0)-1.0;
                    const stepDet=__safeNum(f*rangeX*dt*gain,0);
                    const stepSto=__safeNum(s*rangeX*Math.sqrt(dt)*noise*0.45*gain,0);
                    simY[i]=__safeNum(simY[i-1]+stepDet+stepSto,simY[i-1]);
                }
            }
        }

        for(let i=0;i<n;i++){
            if(!Number.isFinite(simY[i])) simY[i]=__safeNum(src[i],0);
        }

        (window as any).simDataY=simY;
        (window as any).simSamplesY=n;
        (window as any).chromatinIndex=chromSel;
        (window as any).simUseMeanSubseq=useMeanMode;
        (window as any).simMetaY={tau:tauSel,subseq:subSel,chromatin:chromSel,n,meanAllSubseq:useMeanMode,meanCnt,axis:"y"};
        (window as any).simStampY=((((window as any).simStampY)|0)+1);
        __lastSimKey=simKey;

        if(__lastSimLogFrame>0){
            console.log("C3 simY->C1", {tau:tauSel,subseq:subSel,chromatin:chromSel,mode:(useMeanMode?"mean-subseq":"single-subseq"),meanCnt,aOverride:(__aOverrideEnabled?__aOverrideA:null),samples:n,gain,realStepMean,modelStepMean,stampY:(window as any).simStampY});
            __lastSimLogFrame-=1;
        }
        return true;
    };
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
    const __msdNow=()=>((typeof performance!=="undefined" && performance.now)?performance.now():Date.now());
    const __publishMSDProgress=()=>{
        const prog=(window as any).__tauMSDProgressY;
        const fill=document.getElementById("c3-msd-progress-fill") as HTMLElement|null;
        const label=document.getElementById("c3-msd-progress-label") as HTMLElement|null;
        if(fill) fill.style.width=String(Math.max(0,Math.min(100,Number(prog?.percent)||0)))+"%";
        if(label){
            const pct=Math.max(0,Math.min(100,Number(prog?.percent)||0));
            const tauTxt=(prog && Number.isFinite(prog.tau))?String(prog.tau):"-";
            const subTxt=(prog && Number.isFinite(prog.subseq))?String(prog.subseq):"-";
            const phase=(prog && prog.phase)?String(prog.phase):"en espera";
            label.textContent="MSD SSE C3: "+phase+" ("+pct.toFixed(1)+"%) tau="+tauTxt+" subseq="+subTxt;
        }
    };
    const __setMSDProgress=(patch:any)=>{
        const prev=(window as any).__tauMSDProgressY||{axis:"y",phase:"en espera",percent:0,tau:null,subseq:null,done:0,total:0,complete:false};
        const next=Object.assign({},prev,patch||{});
        (window as any).__tauMSDProgressY=next;
        __tauMSDProgressKey=[next.phase,next.percent,next.tau,next.subseq,next.done,next.total,next.complete].join("|");
        __publishMSDProgress();
    };
    const __updateMSDProgressTick=()=>{
        if((window as any).__tauMSDProgressY) __publishMSDProgress();
    };
    const __buildMSDScoreAxisJob=()=>{
        const texF=((typeof tauXiFFinal!=="undefined" && tauXiFFinal)?tauXiFFinal:((typeof tauXiF!=="undefined")?tauXiF:null));
        const texS=((typeof tauXiSFinal!=="undefined" && tauXiSFinal)?tauXiSFinal:((typeof tauXiS!=="undefined")?tauXiS:null));
        const texM=((typeof tauXiMetaFinal!=="undefined" && tauXiMetaFinal)?tauXiMetaFinal:((typeof tauXiMeta!=="undefined")?tauXiMeta:null));
        const srcBase=(typeof datosY1!=="undefined" && datosY1)?(datosY1 instanceof Float32Array?datosY1:new Float32Array(datosY1)):null;
        const tauMaxN=Math.max(1,((typeof tauMaxVeces!=="undefined"?tauMaxVeces:100)|0));
        const tauMinN=Math.max(1,((typeof tauMinVeces!=="undefined"?tauMinVeces:1)|0));
        const chromSel=Math.max(1,((typeof chromatinIndex!=="undefined"?chromatinIndex:1)|0));
        const modelStamp=((typeof tauModelStamp!=="undefined"?tauModelStamp:0)|0);
        const key=["y",modelStamp,tauMinN,tauMaxN,chromSel,srcBase?.length||0,((typeof tauMSDMaxLag!=="undefined"?tauMSDMaxLag:64)|0)].join("|");
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
        (window as any).__tauMSDScoreAxisY={raw,valid,width:tauMaxN,height:tauMaxN,stamp:modelStamp,complete:false,cursor:0,total:candidates.length};
        __setMSDProgress({phase:(candidates.length>0?"calculando":"sin candidatos"),percent:(candidates.length>0?0:100),complete:(candidates.length===0),done:0,total:candidates.length,tau:(candidates[0]?.tau??null),subseq:(candidates[0]?.ss??null)});
        if(candidates.length===0){
            __tauMSDLocalRaw=raw;
            __tauMSDLocalValid=valid;
            __lastMSDScoreKey=key;
        }
        return __tauMSDJob;
    };
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
        (window as any).__tauMSDScoreAxisY={raw:job.raw,valid:job.valid,width:job.tauMaxN,height:job.tauMaxN,stamp:job.modelStamp,complete,cursor:job.cursor,total:job.total};
        __setMSDProgress({phase:(complete?"listo":"calculando"),percent:(job.total>0?(100*job.cursor/job.total):100),complete,done:job.cursor,total:job.total,tau:(current?.tau??null),subseq:(current?.ss??null)});
        if(complete){
            job.done=true;
            __tauMSDLocalRaw=job.raw;
            __tauMSDLocalValid=job.valid;
            __lastMSDScoreKey=job.key;
        }
        return complete;
    };
    const __getMSDAxisPack=()=>{
        if(__tauMSDJob) return (window as any).__tauMSDScoreAxisY||null;
        if(__tauMSDLocalRaw && __tauMSDLocalValid) return (window as any).__tauMSDScoreAxisY||null;
        return null;
    };
    const __computeMSDScoreAxisRaw=()=>{
        __stepMSDScoreAxisJob();
        return !!(__tauMSDLocalRaw && __tauMSDLocalValid);
    };
    const __refreshMSDScoreDisplay=()=>{
        __stepMSDScoreAxisJob();
        const local=__getMSDAxisPack();
        if(!local || !local.raw || !local.valid) return false;
        const other=(window as any).__tauMSDScoreAxisX;
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
    const __drawTauHud=()=>{
        if(!tauHudCtx || !tauHudCanvas) return;
        __syncTauHud();
        const hud=tauHudCtx;
        const W2=tauHudCanvas.width|0;
        const H2=tauHudCanvas.height|0;
        hud.clearRect(0,0,W2,H2);
        __syncBestInputs();
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
        const isFsNow=(document.fullscreenElement===__fsTargetC3);
        const notFsDelta=isFsNow?0:3;

        hud.save();
        hud.strokeStyle="rgba(235,235,235,0.92)";
        hud.fillStyle="rgba(245,245,245,0.95)";
        hud.lineWidth=1;
        hud.font=Math.max(7,Math.round(H2*0.0093)+1-notFsDelta)+"px monospace";

        const __legendColor=(r:number,g:number,b:number)=>"rgb("+Math.round(255*r)+","+Math.round(255*g)+","+Math.round(255*b)+")";
        const __mix3=(a:number[],b:number[],t:number)=>[
            a[0]*(1-t)+b[0]*t,
            a[1]*(1-t)+b[1]*t,
            a[2]*(1-t)+b[2]*t
        ];
        const __scoreColor=(score:number)=>{
            const cN=Math.max(0,Math.min(1,1.0/(1.0+1.8*Math.max(0,score))));
            return __legendColor(...__mix3([0.25,0.05,0.05],[0.1,0.95,0.3],cN));
        };
        const __klColor=(kl:number)=>{
            const v=Math.max(0,Math.min(1,1.0/(1.0+0.4*Math.max(0,kl))));
            return __legendColor(...__mix3([0.25,0.05,0.08],[0.15,0.95,0.95],v));
        };
        const __costColor=(cost:number)=>{
            const v=Math.max(0,Math.min(1,1.0/(1.0+0.03*Math.max(0,cost))));
            return __legendColor(...__mix3([0.2,0.08,0.08],[0.95,0.75,0.2],v));
        };
        const __msdScoreColor=(scoreGood:number)=>{
            return __legendColor(...__mix3([0.2,0.08,0.08],[0.95,0.75,0.2],Math.max(0,Math.min(1,scoreGood))));
        };
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

        drawAxes(xL,yTop0,xR,yTop1,"f(t): init/final",mkLabels(__tauHudRanges.f));
        drawAxes(xBL0,yBot0,xBL1,yBot1,"s(t): init/final",mkLabelsFixed(0,sRef));
        drawAxes(xBR0,yBot0,xBR1,yBot1,"a(t): init/final",mkLabelsFixed(0,aRef));
        drawAxes(xL,yPdf0,xR,yPdf1,"pdf: hist/init/final",mkLabels(__tauHudRanges.p));
        const __dashMode=((typeof showMSDOverlay!=="undefined") && !!showMSDOverlay);

        // Overlay opcional MSD: original del eje y (blanco) vs simulada 1D (verde)
        if(__dashMode){
            const srcY=(typeof datosY1!=="undefined" && datosY1)?(datosY1 instanceof Float32Array?datosY1:new Float32Array(datosY1)):null;
            const simY=((window as any).simDataY)?(((window as any).simDataY instanceof Float32Array)?(window as any).simDataY:new Float32Array((window as any).simDataY)):null;
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
            if(srcY && simY){
                const maxTau=Math.max(8,Math.min(220,Math.min(srcY.length,simY.length)-1));
                const msdO=calcMSD1D(srcY,maxTau);
                const msdS=calcMSD1D(simY,maxTau);
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
                hud.fillText("MSD eje y: orig blanca, sim 1D verde", xL+10, yTop0+38);
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
            const drawLines=(x:number,y:number,lines:string[])=>{
                for(let i=0;i<lines.length;i++){
                    hud.fillText(lines[i], x, y + i*lineH);
                }
            };

            const dTopY=Math.min(H2-8, yTop1 + Math.max(17,Math.round(H2*0.021)) + 3);
            const dBotY=Math.min(H2-8, yBot1 + Math.max(17,Math.round(H2*0.021)) + 3);
            const dPdfY=Math.min(H2-6, yPdf1 + Math.max(20,Math.round(H2*0.023)) + 3); // +3..5px extra para no chocar con idx

            const dTop1="f(t): drift reconstruido con SINDy+AFP; si final difiere de init, corrige sesgo numerico y explica mejor la tendencia neta de movimiento.";
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
    __ensureTauHud();
    __syncTauHud();

    const __fsTargetC3=__c3Host as any;
    const __fsHostIsCanvas=(__fsTargetC3===canvas);
    const __baseHostStyle=__fsHostIsCanvas?null:{
        position: (__c3Host.style.position || ""),
        top: (__c3Host.style.top || ""),
        left: (__c3Host.style.left || ""),
        width: (__c3Host.style.width || ""),
        height: (__c3Host.style.height || ""),
        maxWidth: (__c3Host.style.maxWidth || ""),
        maxHeight: (__c3Host.style.maxHeight || ""),
        zIndex: (__c3Host.style.zIndex || ""),
        display: (__c3Host.style.display || ""),
        margin: (__c3Host.style.margin || ""),
        padding: (__c3Host.style.padding || "")
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
    const __applyCanvasFullscreenC3=()=>{
        const isFs=(document.fullscreenElement===__fsTargetC3);
        if(isFs){
            document.body.style.overflow="hidden";
            document.documentElement.style.overflow="hidden";
            if(!__fsHostIsCanvas){
                __c3Host.style.position="fixed";
                __c3Host.style.left="0";
                __c3Host.style.top="0";
                __c3Host.style.width="100vw";
                __c3Host.style.height="100vh";
                __c3Host.style.maxWidth="100vw";
                __c3Host.style.maxHeight="100vh";
                __c3Host.style.zIndex="999998";
                __c3Host.style.display="block";
                __c3Host.style.margin="0";
                __c3Host.style.padding="0";
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
                __c3Host.style.position=__baseHostStyle.position;
                __c3Host.style.top=__baseHostStyle.top;
                __c3Host.style.left=__baseHostStyle.left;
                __c3Host.style.width=__baseHostStyle.width;
                __c3Host.style.height=__baseHostStyle.height;
                __c3Host.style.maxWidth=__baseHostStyle.maxWidth;
                __c3Host.style.maxHeight=__baseHostStyle.maxHeight;
                __c3Host.style.zIndex=__baseHostStyle.zIndex;
                __c3Host.style.display=__baseHostStyle.display;
                __c3Host.style.margin=__baseHostStyle.margin;
                __c3Host.style.padding=__baseHostStyle.padding;
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
    canvas.addEventListener("dblclick", ()=>{
        if(document.fullscreenElement) document.exitFullscreen?.();
        else openFullscreen(__fsTargetC3);
        setTimeout(__applyCanvasFullscreenC3, 0);
    });
    document.addEventListener("fullscreenchange", ()=>{ __applyCanvasFullscreenC3(); __syncTauHud(); });
    window.addEventListener("resize", ()=>{ __applyCanvasFullscreenC3(); __syncTauHud(); });
`;
        if (outCode.includes("__applyCanvasFullscreenC3")) {
            outCode = outCode.replace(/let tauHudCanvas[\s\S]*?window\.addEventListener\("resize",[^\n]*\);\r?\n/, fsSnippet + "\n");
        }
        else {
            outCode = outCode.replace(/(const gl=ctx as any as WebGL2RenderingContext;\r?\n\s*const canvas=ctx\.canvas;[^\n]*\r?\n)/, `$1${fsSnippet}`);
        }
        outCode = outCode
            .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
            .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas");
        yield fs.writeFile(outPath, outCode, "utf8");
        const outJsPath = outPath.replace(/\.ts$/i, ".js");
        try {
            let outJs = yield fs.readFile(outJsPath, "utf8");
            const fsSnippetJs = fsSnippet
                .replace(/ as any/g, "")
                .replace(/const __fsTargetC3=canvas;/, "const __fsTargetC3=canvas;");
            if (outJs.includes("__applyCanvasFullscreenC3")) {
                outJs = outJs.replace(/let tauHudCanvas[\s\S]*?window\.addEventListener\("resize",[^\n]*\);\r?\n/, fsSnippetJs + "\n");
            }
            else {
                outJs = outJs.replace(/(const gl = ctx;\r?\n\s*const canvas = ctx\.canvas;\r?\n)/, `$1${fsSnippetJs}`);
            }
            outJs = outJs
                .replace(/\(ctx\.canvas\.parentElement\|\|canvas\)/g, "canvas")
                .replace(/\(canvas\.parentElement\|\|canvas\)/g, "canvas");
            yield fs.writeFile(outJsPath, outJs, "utf8");
        }
        catch (_e) { }
        console.log("[DetailedParser-C3] generado:", outPath);
    });
}
main().catch((err) => {
    console.error("[DetailedParser-C3] error al transpilar:", err);
    process.exit(1);
});
export {};


