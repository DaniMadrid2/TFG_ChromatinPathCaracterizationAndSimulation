// @ts-nocheck
import { __mountGlobalBlocks } from "/Code/opengl/opengl.js";
import { MouseManager, openFullscreen, keypress, KeyManager } from "/Code/Game/Game.js";
import { addFunc, start } from "/Code/Start/start.js";
import { createCanvasNextTo } from "/DNTI_Templates/00_Canvas_Snippet_Creator/Canvas_On_Page.js";
import { TexExamples, WebGLMan } from "/Code/WebGL/webglMan.js";
//<Pre>
/**
Archivo:
- Envuelve los snippets compartidos de C2 y C3 con el preambulo comun de imports, canvas y contexto WebGL.

Objetivos:
- Import comun:
  - readMat
- Bootstrap comun:
  - createCanvasNextTo
  - KeyManager.detectKeys
  - MouseManager.EnableCanvas
  - webglMan
*/
import { read as readMat } from "/ExternalCode/mat4js/mat4js.read.js";
(async () => {
    //? - Bootstrap comun del canvas y del contexto WebGL
    let { screen: screen_props } = createCanvasNextTo(undefined, "c3", "#F3", { dx: (isResizedCanvas, offx, c) => { return isResizedCanvas ? 0 : (100 - offx); }, dy: (isrc) => isrc ? 0 : 132, dw: () => 420, dh: () => 280 }, { preserveAspectRatio: true, absolute: false, contexttype: "webgl2" });
    const { ctx, W, H } = screen_props;
    KeyManager.detectKeys(keypress);
    MouseManager.EnableCanvas(ctx.canvas);
    const gl = ctx;
    const canvas = ctx.canvas;
    const webglMan = new WebGLMan(gl);
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
    //? - Estado base compartido
    let tauHudCanvas = null;
    let tauHudCtx = null;
    const __c3Host = (canvas.parentElement || canvas);
    let __tauCtlRoot = null;
    let __tauCtlChrom = null;
    let __tauCtlTauMin = null;
    let __tauCtlTauMax = null;
    let __tauCtlBestTau = null;
    let __tauCtlBestSub = null;
    let __tauCtlBestBtn = null;
    let __tauCtlRank = null;
    let __tauCtlRankMode = null;
    let __tauCtlRankBtn = null;
    let __tauCtlCopyBtn = null;
    let __lastSimKey = "";
    let __lastSimLogFrame = 4;
    let __lastMeanFlag = false;
    let __lastReqRebuild = 0;
    let __lastMSDScoreKey = "";
    let __lastMSDDisplayKey = "";
    let __tauMSDProgressKey = "";
    let __tauMSDLocalRaw = null;
    let __tauMSDLocalValid = null;
    let __tauMSDDisplayPack = null;
    let __tauMSDDisplayMin = 0;
    let __tauMSDDisplayMax = 1;
    let __tauMSDJob = null;
    let __aOverrideEnabled = false;
    let __aOverrideA = null;
    let __aOverrideKey = "";
    let datos_reales = window.datos_reales || null;
    let datosX1 = null;
    let datosY1 = null;
    let NMuestras1 = 0;
    //? - Carga y proyeccion de la serie activa
    // Carga la matriz de cromatinas una sola vez y la deja disponible para ambos paneles.
    const __ensureTauDataLoaded = async () => {
        if (datos_reales && datos_reales.length)
            return datos_reales;
        if (window.datos_reales && window.datos_reales.length) {
            datos_reales = window.datos_reales;
            return datos_reales;
        }
        const response = await fetch("/data/alive_2.mat", { method: "GET", cache: "no-store" });
        const buf = await response.arrayBuffer();
        const result = await readMat(buf);
        datos_reales = result?.data?.Expression1 || null;
        window.datos_reales = datos_reales;
        return datos_reales;
    };
    // Elimina la sobrescritura manual de a(t) cuando cambia el modelo seleccionado.
    const __clearAOverride = () => {
        __aOverrideEnabled = false;
        __aOverrideA = null;
        __aOverrideKey = "";
    };
    // Proyecta una serie 2D al par de ejes que usa el pipeline, ya sea XY directo o base PCA.
    const __projectChromatinSeries = (serie) => {
        const n = serie?.length || 0;
        const axis0 = new Float32Array(n);
        const axis1 = new Float32Array(n);
        const basisMode = (typeof tauBasisMode !== "undefined" && tauBasisMode) ? String(tauBasisMode) : "xy";
        const secondaryMode = (typeof tauPcaSecondaryMode !== "undefined" && tauPcaSecondaryMode) ? String(tauPcaSecondaryMode) : "perp90";
        if (n <= 0)
            return { axis0, axis1 };
        if (basisMode !== "pca") {
            for (let i = 0; i < n; i++) {
                const p = serie[i] || [0, 0];
                axis0[i] = Number.isFinite(p[0]) ? p[0] : 0;
                axis1[i] = Number.isFinite(p[1]) ? p[1] : 0;
            }
            return { axis0, axis1 };
        }
        let mx = 0, my = 0, cnt = 0;
        for (let i = 0; i < n; i++) {
            const p = serie[i] || [0, 0];
            const x = Number.isFinite(p[0]) ? p[0] : 0;
            const y = Number.isFinite(p[1]) ? p[1] : 0;
            mx += x;
            my += y;
            cnt++;
        }
        mx /= Math.max(1, cnt);
        my /= Math.max(1, cnt);
        let sxx = 0, sxy = 0, syy = 0;
        for (let i = 0; i < n; i++) {
            const p = serie[i] || [0, 0];
            const dx = (Number.isFinite(p[0]) ? p[0] : 0) - mx;
            const dy = (Number.isFinite(p[1]) ? p[1] : 0) - my;
            sxx += dx * dx;
            sxy += dx * dy;
            syy += dy * dy;
        }
        const norm = Math.max(1, n - 1);
        sxx /= norm;
        sxy /= norm;
        syy /= norm;
        const tr = sxx + syy;
        const disc = Math.max(0, tr * tr - 4 * (sxx * syy - sxy * sxy));
        const lMax = 0.5 * (tr + Math.sqrt(disc));
        const lMin = 0.5 * (tr - Math.sqrt(disc));
        let vx = Math.abs(sxy) > 1e-12 ? sxy : 1.0;
        let vy = Math.abs(sxy) > 1e-12 ? (lMax - sxx) : (sxx >= syy ? 0.0 : 1.0);
        let vn = Math.hypot(vx, vy);
        if (!(vn > 1e-12)) {
            vx = 1.0;
            vy = 0.0;
            vn = 1.0;
        }
        vx /= vn;
        vy /= vn;
        let wx = -vy, wy = vx;
        if (secondaryMode === "pcaMin") {
            wx = Math.abs(sxy) > 1e-12 ? sxy : -vy;
            wy = Math.abs(sxy) > 1e-12 ? (lMin - sxx) : vx;
            let wn = Math.hypot(wx, wy);
            if (!(wn > 1e-12)) {
                wx = -vy;
                wy = vx;
                wn = 1.0;
            }
            wx /= wn;
            wy /= wn;
        }
        if (vx * wx + vy * wy < 0) {
            wx = -wx;
            wy = -wy;
        }
        for (let i = 0; i < n; i++) {
            const p = serie[i] || [0, 0];
            const dx = (Number.isFinite(p[0]) ? p[0] : 0) - mx;
            const dy = (Number.isFinite(p[1]) ? p[1] : 0) - my;
            axis0[i] = dx * vx + dy * vy;
            axis1[i] = dx * wx + dy * wy;
        }
        return { axis0, axis1, centerX: mx, centerY: my, vx, vy, wx, wy };
    };
    // Crea el eje inicial del panel a partir de la primera cromatina disponible.
    const __initTauAxisDefaults = () => {
        if (typeof datos_reales === "undefined" || !datos_reales)
            return false;
        const serie = datos_reales[0];
        const n = serie?.length || 0;
        if (n <= 0)
            return false;
        NMuestras1 = n;
        const proj = __projectChromatinSeries(serie);
        const nx = proj.axis0;
        const ny = proj.axis1;
        datosX1 = ny;
        datosY1 = ny;
        return true;
    };
    await __ensureTauDataLoaded();
    __initTauAxisDefaults();
    // Recalcula la serie activa, recrea texturas si hace falta y deja el panel listo para recomputar.
    const __applyChromTauState = (ci, tmin, tmax) => {
        if (typeof datos_reales === "undefined" || !datos_reales)
            return false;
        const chromMax = Math.max(1, (datos_reales.length || 1));
        ci = Math.max(1, Math.min(chromMax, ci | 0));
        tmax = Math.max(1, Math.min(100, tmax | 0));
        tmin = Math.max(1, Math.min(tmax, tmin | 0));
        chromatinIndex = ci;
        window.chromatinIndex = ci;
        tauMinVeces = tmin;
        tauMaxVeces = tmax;
        const serie = datos_reales[ci - 1] || datos_reales[0];
        const n = serie?.length || 0;
        if (n <= 0)
            return false;
        NMuestras1 = n;
        const proj = __projectChromatinSeries(serie);
        const nx = proj.axis0;
        const ny = proj.axis1;
        datosX1 = ny;
        datosY1 = ny;
        window.__tauProjectionMeta = {
            mode: (typeof tauBasisMode !== "undefined" ? tauBasisMode : "xy"),
            secondary: (typeof tauPcaSecondaryMode !== "undefined" ? tauPcaSecondaryMode : "perp90"),
            simCoordsMode: ((typeof tauBasisMode !== "undefined" ? tauBasisMode : "xy") === "pca" ? "pca-relative" : "xy-absolute"),
            ...proj
        };
        const tauSeries = ny;
        if (typeof xTex !== "undefined" && xTex && typeof yTex !== "undefined" && yTex) {
            const sameSize = (xTex.w === n && yTex.w === n);
            if (sameSize && typeof xTex.fill === "function" && typeof yTex.fill === "function") {
                xTex.fill(tauSeries);
                yTex.fill(ny);
            }
            else if (typeof tauMom !== "undefined" && tauMom && typeof tauMom.createTexture2D === "function") {
                xTex = tauMom.createTexture2D("datosX1", [n, 1], TexExamples.RFloat, tauSeries, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit10");
                yTex = tauMom.createTexture2D("datosY1", [n, 1], TexExamples.RFloat, ny, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit11");
            }
        }
        if (bestTau < tauMinVeces)
            bestTau = tauMinVeces;
        if (bestTau > tauMaxVeces)
            bestTau = tauMaxVeces;
        if (bestSubseq >= bestTau)
            bestSubseq = Math.max(0, bestTau - 1);
        return __requestTauRecompute(true);
    };
    // Lee los campos del formulario global y aplica el cambio de cromatina/rango tau.
    const __applyChromTau = () => {
        if (typeof datos_reales === "undefined" || !datos_reales)
            return false;
        const chromMax = Math.max(1, (datos_reales.length || 1));
        let ci = parseInt((__tauCtlChrom?.value || "1"), 10);
        if (!Number.isFinite(ci))
            ci = 1;
        ci = Math.max(1, Math.min(chromMax, ci));
        let tmin = parseInt((__tauCtlTauMin?.value || "1"), 10);
        if (!Number.isFinite(tmin))
            tmin = 1;
        let tmax = parseInt((__tauCtlTauMax?.value || "100"), 10);
        if (!Number.isFinite(tmax))
            tmax = 100;
        return __applyChromTauState(ci, tmin, tmax);
    };
    //? - Sincronizacion de candidatos y formularios
    // Evita pisar el formulario cuando el usuario esta editando un valor manualmente.
    const __isEditingBestInputs = () => {
        const ae = document.activeElement || null;
        return !!(ae && (ae === __tauCtlBestTau || ae === __tauCtlBestSub || ae === __tauCtlRank));
    };
    // Publica el candidato actual para que el otro panel pueda copiarlo.
    const __publishPanelBest = () => {
        window.__tauPanelBestC3 = {
            tau: Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0)),
            subseq: Math.max(0, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0))
        };
    };
    // Refresca los inputs del candidato elegido sin molestar al usuario si esta escribiendo.
    const __syncBestInputs = (force = false) => {
        if (!force && __isEditingBestInputs())
            return;
        if (__tauCtlBestTau)
            __tauCtlBestTau.value = String(Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0)));
        if (__tauCtlBestSub) {
            const tauNow = Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0));
            __tauCtlBestSub.max = String(Math.max(0, tauNow - 1));
            __tauCtlBestSub.value = String(Math.max(0, Math.min(tauNow - 1, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0))));
        }
    };
    // Fuerza la republicacion del candidato activo y la reconstruccion de la trayectoria simulada.
    const __requestTauRecompute = (syncInputs = true) => {
        __publishPanelBest();
        if (syncInputs)
            __syncBestInputs(true);
        __lastSimKey = "";
        window.simReqRebuild = ((window.simReqRebuild | 0) + 1);
        recomputeTau = true;
        return true;
    };
    // Trae al panel actual el mejor candidato ya publicado por el panel hermano.
    const __copyCandidateFromOtherPanel = () => {
        const src = window.__tauPanelBestC2;
        if (!src)
            return false;
        const t = Math.max(1, Math.min((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100), (src.tau | 0) || 1));
        const s = Math.max(0, Math.min(t - 1, (src.subseq | 0) || 0));
        autoPickBest = false;
        bestTau = t;
        bestSubseq = s;
        return __requestTauRecompute(true);
    };
    // Devuelve el criterio de ordenacion activo para el selector de ranking.
    const __getRankMode = () => String(__tauCtlRankMode?.value || "score");
    // Mueve el panel al candidato ranked N segun score, KL, coste o MSD.
    const __gotoRankedCandidate = (rank) => {
        const candidates = __getRankedCandidates();
        if (candidates.length <= 0)
            return false;
        const idx = Math.max(0, Math.min(candidates.length - 1, (rank | 0) - 1));
        const cand = candidates[idx];
        autoPickBest = false;
        bestTau = cand.tau;
        bestSubseq = cand.subseq;
        return __requestTauRecompute(true);
    };
    // Lee tau/subseq del formulario de candidato y fuerza ese modelo como actual.
    const __applyBestTauSubseq = () => {
        let t = parseInt((__tauCtlBestTau?.value || "1"), 10);
        if (!Number.isFinite(t))
            t = 1;
        let s = parseInt((__tauCtlBestSub?.value || "0"), 10);
        if (!Number.isFinite(s))
            s = 0;
        t = Math.max(1, Math.min((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100), t));
        s = Math.max(0, Math.min(t - 1, s));
        autoPickBest = false;
        bestTau = t;
        bestSubseq = s;
        return __requestTauRecompute(true);
    };
    // Permite fijar manualmente a(t) con un click vertical sobre el canvas.
    canvas.addEventListener("click", (ev) => {
        try {
            const r = canvas.getBoundingClientRect();
            const ry = Math.max(0, Math.min(1, (ev.clientY - r.top) / Math.max(1, r.height)));
            const aSel = 2.7 * (1.0 - ry);
            const tSel = Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0));
            const sSel = Math.max(0, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0));
            __aOverrideEnabled = true;
            __aOverrideA = Math.max(0, __safeNum(aSel, 0));
            __aOverrideKey = tSel + "|" + sSel;
            __lastSimKey = "";
            window.simReqRebuild = ((window.simReqRebuild | 0) + 1);
            console.log("C3 click override a(t)", { tau: tSel, subseq: sSel, aOverride: __aOverrideA, ratioY: ry });
        }
        catch { }
    });
    //? - Construccion de controles HTML
    // Monta una UI unica para ambos canvases con cromatina, rango tau, candidato y ranking.
    const __initTauControls = () => {
        if (__tauCtlRoot)
            return true;
        if (typeof datos_reales === "undefined" || !datos_reales)
            return false;
        __tauCtlRoot = document.createElement("p");
        __tauCtlRoot.id = "tauControlsC3";
        __tauCtlRoot.style.margin = "6px 0 0 0";
        __tauCtlRoot.style.padding = "4px 0";
        __tauCtlRoot.style.font = "12px monospace";
        __tauCtlRoot.style.display = "flex";
        __tauCtlRoot.style.gap = "6px";
        __tauCtlRoot.style.alignItems = "center";
        __tauCtlRoot.style.flexWrap = "wrap";
        __tauCtlRoot.style.color = "#ddd";
        __tauCtlRoot.style.pointerEvents = "auto";
        __tauCtlRoot.style.position = "relative";
        __tauCtlRoot.style.zIndex = "5";
        const mkNum = (w, val, min, max) => {
            const i = document.createElement("input");
            i.type = "number";
            i.value = val;
            i.min = min;
            i.max = max;
            i.step = "1";
            i.style.width = w;
            i.style.font = "12px monospace";
            i.style.background = "#111";
            i.style.color = "#fff";
            i.style.border = "1px solid #444";
            i.style.pointerEvents = "auto";
            return i;
        };
        const mkChromSel = (maxN) => {
            const s = document.createElement("select");
            s.style.width = "72px";
            s.style.font = "12px monospace";
            s.style.background = "#111";
            s.style.color = "#fff";
            s.style.border = "1px solid #444";
            s.style.pointerEvents = "auto";
            for (let k = 1; k <= maxN; k++) {
                const op = document.createElement("option");
                op.value = String(k);
                op.textContent = String(k);
                s.appendChild(op);
            }
            s.value = String(Math.max(1, Math.min(maxN, chromatinIndex || 1)));
            return s;
        };
        const lbC = document.createElement("span");
        lbC.textContent = "Chrom";
        __tauCtlChrom = mkChromSel(Math.max(1, datos_reales.length || 1));
        const lbMin = document.createElement("span");
        lbMin.textContent = "tauMin";
        __tauCtlTauMin = mkNum("58px", String(Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0))), "1", "100");
        const lbMax = document.createElement("span");
        lbMax.textContent = "tauMax";
        __tauCtlTauMax = mkNum("58px", String(Math.max(1, ((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100) | 0))), "1", "100");
        const bt = document.createElement("button");
        bt.textContent = "Cambiar";
        bt.style.font = "12px monospace";
        bt.style.cursor = "pointer";
        bt.style.pointerEvents = "auto";
        bt.style.padding = "4px 10px";
        bt.style.borderRadius = "6px";
        bt.style.border = "1px solid #4a9fdb";
        bt.style.color = "#eaf7ff";
        bt.style.background = "linear-gradient(135deg,#1c4f72 0%, #2f7aa8 55%, #4a9fdb 100%)";
        bt.style.boxShadow = "0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 6px rgba(0,0,0,0.25)";
        bt.onmouseenter = () => { bt.style.filter = "brightness(1.08)"; };
        bt.onmouseleave = () => { bt.style.filter = "none"; };
        bt.onclick = () => { __applyChromTau(); };
        const sep = document.createElement("span");
        sep.style.flexBasis = "100%";
        sep.style.height = "0";
        const line = document.createElement("span");
        line.style.flexBasis = "100%";
        line.style.height = "1px";
        line.style.background = "#2a2a2a";
        line.style.margin = "2px 0 4px 0";
        const lbT = document.createElement("span");
        lbT.textContent = "tau";
        __tauCtlBestTau = mkNum("58px", String(typeof bestTau !== "undefined" ? bestTau : 1), "1", "100");
        const lbS = document.createElement("span");
        lbS.textContent = "subseq";
        __tauCtlBestSub = mkNum("58px", String(typeof bestSubseq !== "undefined" ? bestSubseq : 0), "0", "99");
        __tauCtlBestSub.max = String(Math.max(0, (typeof bestTau !== "undefined" ? bestTau : 1) - 1));
        __tauCtlBestTau.onchange = () => { __applyBestTauSubseq(); };
        __tauCtlBestSub.onchange = () => { __applyBestTauSubseq(); };
        __tauCtlBestBtn = document.createElement("button");
        __tauCtlBestBtn.textContent = "Moverse C3";
        __tauCtlBestBtn.style.font = "12px monospace";
        __tauCtlBestBtn.style.cursor = "pointer";
        __tauCtlBestBtn.style.pointerEvents = "auto";
        __tauCtlBestBtn.style.padding = "4px 10px";
        __tauCtlBestBtn.style.borderRadius = "6px";
        __tauCtlBestBtn.style.border = "1px solid #8c6b2a";
        __tauCtlBestBtn.style.color = "#fff6e4";
        __tauCtlBestBtn.style.background = "linear-gradient(135deg,#5b3b14 0%, #8a5a1f 55%, #b0722a 100%)";
        __tauCtlBestBtn.style.boxShadow = "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlBestBtn.onmouseenter = () => { __tauCtlBestBtn.style.filter = "brightness(1.08)"; };
        __tauCtlBestBtn.onmouseleave = () => { __tauCtlBestBtn.style.filter = "none"; };
        __tauCtlBestBtn.onclick = () => { __applyBestTauSubseq(); };
        const sep2 = document.createElement("span");
        sep2.style.flexBasis = "100%";
        sep2.style.height = "0";
        const lbRank = document.createElement("span");
        lbRank.textContent = "mejor #";
        const lbRankMode = document.createElement("span");
        lbRankMode.textContent = "según";
        __tauCtlRank = mkNum("58px", "1", "1", "999");
        __tauCtlRankMode = document.createElement("select");
        __tauCtlRankMode.style.width = "92px";
        __tauCtlRankMode.style.font = "12px monospace";
        __tauCtlRankMode.style.background = "#111";
        __tauCtlRankMode.style.color = "#fff";
        __tauCtlRankMode.style.border = "1px solid #444";
        __tauCtlRankMode.style.pointerEvents = "auto";
        [["score", "score"], ["kl", "KL"], ["cost", "coste"], ["costMSD", "costMSD"]].forEach(([v, txt]) => {
            const op = document.createElement("option");
            op.value = v;
            op.textContent = txt;
            __tauCtlRankMode.appendChild(op);
        });
        __tauCtlRankMode.value = "score";
        __tauCtlRankBtn = document.createElement("button");
        __tauCtlRankBtn.textContent = "Ir candidato C3";
        __tauCtlRankBtn.style.font = "12px monospace";
        __tauCtlRankBtn.style.cursor = "pointer";
        __tauCtlRankBtn.style.pointerEvents = "auto";
        __tauCtlRankBtn.style.padding = "4px 10px";
        __tauCtlRankBtn.style.borderRadius = "6px";
        __tauCtlRankBtn.style.border = "1px solid #2f7a4a";
        __tauCtlRankBtn.style.color = "#e8fff1";
        __tauCtlRankBtn.style.background = "linear-gradient(135deg,#19472a 0%, #246a3c 55%, #2f9a57 100%)";
        __tauCtlRankBtn.style.boxShadow = "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlRankBtn.onmouseenter = () => { __tauCtlRankBtn.style.filter = "brightness(1.08)"; };
        __tauCtlRankBtn.onmouseleave = () => { __tauCtlRankBtn.style.filter = "none"; };
        __tauCtlRankBtn.onclick = () => { __gotoRankedCandidate(parseInt((__tauCtlRank?.value || "1"), 10) || 1); };
        __tauCtlCopyBtn = document.createElement("button");
        __tauCtlCopyBtn.textContent = "Moverse al candidato de C2";
        __tauCtlCopyBtn.style.font = "12px monospace";
        __tauCtlCopyBtn.style.cursor = "pointer";
        __tauCtlCopyBtn.style.pointerEvents = "auto";
        __tauCtlCopyBtn.style.padding = "4px 10px";
        __tauCtlCopyBtn.style.borderRadius = "6px";
        __tauCtlCopyBtn.style.border = "1px solid #6a4cb8";
        __tauCtlCopyBtn.style.color = "#f3edff";
        __tauCtlCopyBtn.style.background = "linear-gradient(135deg,#3f2a72 0%, #5b3ea6 55%, #7b58d6 100%)";
        __tauCtlCopyBtn.style.boxShadow = "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(0,0,0,0.25)";
        __tauCtlCopyBtn.onmouseenter = () => { __tauCtlCopyBtn.style.filter = "brightness(1.08)"; };
        __tauCtlCopyBtn.onmouseleave = () => { __tauCtlCopyBtn.style.filter = "none"; };
        __tauCtlCopyBtn.onclick = () => { __copyCandidateFromOtherPanel(); };
        __tauCtlRoot.append(lbC, __tauCtlChrom, lbMin, __tauCtlTauMin, lbMax, __tauCtlTauMax, bt, sep, line, lbT, __tauCtlBestTau, lbS, __tauCtlBestSub, __tauCtlBestBtn, sep2, lbRank, __tauCtlRank, lbRankMode, __tauCtlRankMode, __tauCtlRankBtn, __tauCtlCopyBtn);
        let inserted = false;
        const h2 = document.querySelector("#F3");
        const leftSec = h2?.closest(".left-dnti-section") || null;
        if (leftSec) {
            const ps = Array.from(leftSec.querySelectorAll("p"));
            if (ps.length > 0) {
                ps[ps.length - 1].insertAdjacentElement("afterend", __tauCtlRoot);
            }
            else {
                leftSec.appendChild(__tauCtlRoot);
            }
            inserted = true;
        }
        if (!inserted) {
            (__c3Host || document.body).appendChild(__tauCtlRoot);
        }
        __publishPanelBest();
        __syncBestInputs(false);
        return true;
    };
    // Reintenta montar los controles hasta que el DOM de la columna lateral este disponible.
    const __tauCtlTimer = setInterval(() => {
        if (__initTauControls()) {
            clearInterval(__tauCtlTimer);
            setTimeout(() => { __applyChromTau(); }, 0);
        }
    }, 200);
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
    //? - Estado del lector de texturas
    const __tauHudReadFbo = gl.createFramebuffer();
    let __tauHudStatsFrame = 0;
    let __tauHudRanges = {
        f: { min: -1, max: 1 },
        s: { min: -1, max: 1 },
        a: { min: 0, max: 1 },
        p: { min: 0, max: 1 }
    };
    //? - Lecturas auxiliares desde texturas GPU
    // Lee un rango min/max de una fila de textura usando los canales indicados.
    const __readTexRange = (tex, nx, chs) => {
        if (!tex || !__tauHudReadFbo || !Number.isFinite(nx) || nx <= 0)
            return null;
        let prev = null;
        try {
            prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (st !== gl.FRAMEBUFFER_COMPLETE) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const arr = new Float32Array(nx * 4);
            gl.readPixels(0, 0, nx, 1, gl.RGBA, gl.FLOAT, arr);
            let mn = 1e30, mx = -1e30;
            for (let i = 0; i < nx; i++) {
                const b = i * 4;
                for (let k = 0; k < chs.length; k++) {
                    const v = arr[b + chs[k]];
                    if (!Number.isFinite(v))
                        continue;
                    if (v < mn)
                        mn = v;
                    if (v > mx)
                        mx = v;
                }
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            if (mx < mn)
                return null;
            return { min: mn, max: mx };
        }
        catch {
            try {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            }
            catch { }
            return null;
        }
    };
    // Sincroniza los rangos min/max del HUD a partir de los campos SINDy y de la estacionaria.
    const __updateHudRanges = () => {
        const bins = Math.max(1, ((typeof nBins !== "undefined" ? nBins : 64) | 0));
        const rf = __readTexRange((typeof tauSindyTex !== "undefined" ? tauSindyTex : null), bins, [1]);
        const rs = __readTexRange((typeof tauSindyTex !== "undefined" ? tauSindyTex : null), bins, [2]);
        const ra = __readTexRange((typeof tauSindyTex !== "undefined" ? tauSindyTex : null), bins, [3]);
        const rp = __readTexRange((typeof tauFPStatTex !== "undefined" ? tauFPStatTex : null), bins, [0, 1, 2]);
        if (rf)
            __tauHudRanges.f = rf;
        if (rs)
            __tauHudRanges.s = rs;
        if (ra)
            __tauHudRanges.a = ra;
        if (rp)
            __tauHudRanges.p = rp;
    };
    // Lee una fila RGBA completa de una textura 2D.
    const __readTexRow = (tex, nx, y = 0) => {
        if (!tex || !__tauHudReadFbo || !Number.isFinite(nx) || nx <= 0)
            return null;
        let prev = null;
        try {
            prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (st !== gl.FRAMEBUFFER_COMPLETE) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const arr = new Float32Array(nx * 4);
            gl.readPixels(0, Math.max(0, y | 0), nx, 1, gl.RGBA, gl.FLOAT, arr);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return arr;
        }
        catch {
            try {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            }
            catch { }
            return null;
        }
    };
    // Lee un pixel RGBA concreto de una textura 2D.
    const __readTexPixel = (tex, x, y) => {
        if (!tex || !__tauHudReadFbo)
            return null;
        let prev = null;
        try {
            prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (st !== gl.FRAMEBUFFER_COMPLETE) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const out = new Float32Array(4);
            gl.readPixels(Math.max(0, x | 0), Math.max(0, y | 0), 1, 1, gl.RGBA, gl.FLOAT, out);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return out;
        }
        catch {
            try {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            }
            catch { }
            return null;
        }
    };
    // Lee un rectangulo RGBA completo, usado para mapas score/KL/coste y overlays.
    const __readTexRect = (tex, nx, ny) => {
        if (!tex || !__tauHudReadFbo || !Number.isFinite(nx) || !Number.isFinite(ny) || nx <= 0 || ny <= 0)
            return null;
        let prev = null;
        try {
            prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, __tauHudReadFbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (st !== gl.FRAMEBUFFER_COMPLETE) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
                return null;
            }
            const out = new Float32Array(nx * ny * 4);
            gl.readPixels(0, 0, nx, ny, gl.RGBA, gl.FLOAT, out);
            gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            return out;
        }
        catch {
            try {
                gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
            }
            catch { }
            return null;
        }
    };
    //? - Ranking y seleccion manual
    // Devuelve la lista de candidatos ordenada segun el modo activo del panel.
    const __getRankedCandidates = () => {
        const tauMaxN = Math.max(1, ((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100) | 0));
        const tMin = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0));
        const mode = __getRankMode();
        const scoreArr = __readTexRect((typeof tauScoreTex !== "undefined" ? tauScoreTex : null), tauMaxN, tauMaxN);
        const klArr = __readTexRect((typeof tauKLTex !== "undefined" ? tauKLTex : null), tauMaxN, tauMaxN);
        const metaArr = __readTexRect((typeof tauXiMetaFinal !== "undefined" ? tauXiMetaFinal : null), tauMaxN, tauMaxN);
        const msdArr = __tauMSDDisplayPack;
        if (!scoreArr && mode === "score")
            return [];
        const selected = [];
        const validOnly = [];
        for (let s = 0; s < tauMaxN; s++) {
            for (let t = tMin; t <= tauMaxN; t++) {
                if (s >= t)
                    break;
                const off = (s * tauMaxN + (t - 1)) * 4;
                const sel = scoreArr ? scoreArr[off + 0] : 0;
                const score = scoreArr ? scoreArr[off + 1] : 0;
                const scoreValid = scoreArr ? scoreArr[off + 2] : 0;
                const cost = metaArr ? metaArr[off + 0] : (scoreArr ? scoreArr[off + 3] : 0);
                const kl = klArr ? klArr[off + 0] : 0;
                const klValid = klArr ? klArr[off + 1] : 0;
                const msd = msdArr ? msdArr[off + 0] : 0;
                const msdValid = msdArr ? msdArr[off + 2] : 0;
                let metric = score;
                let valid = scoreValid;
                if (mode === "kl") {
                    metric = kl;
                    valid = klValid;
                }
                else if (mode === "cost") {
                    metric = cost;
                    valid = (metaArr ? metaArr[off + 1] : scoreValid);
                }
                else if (mode === "costMSD") {
                    metric = msd;
                    valid = msdValid;
                }
                if (!(valid > 0.5) || !Number.isFinite(metric))
                    continue;
                const item = { tau: t, subseq: s, score: metric, cost, selected: sel };
                if (sel > 0.5)
                    selected.push(item);
                else
                    validOnly.push(item);
            }
        }
        const sorter = (a, b) => (a.score - b.score) || (a.cost - b.cost) || (a.tau - b.tau) || (a.subseq - b.subseq);
        selected.sort(sorter);
        validOnly.sort(sorter);
        return selected.length > 0 ? selected : validOnly;
    };
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
    //? - Muestreo y simulacion base
    //<BridgeSimulationHelpers>
    // Interpola un canal del campo Sindy en coordenada normalizada u.
    const __sampleSindy = (arr, bins, u, ch) => {
        if (!arr || bins <= 0)
            return 0;
        const uu = Math.max(0, Math.min(1, u));
        const fx = uu * (bins - 1);
        const i0 = Math.max(0, Math.min(bins - 1, Math.floor(fx)));
        const i1 = Math.max(0, Math.min(bins - 1, i0 + 1));
        const t = fx - i0;
        const v0 = arr[i0 * 4 + ch];
        const v1 = arr[i1 * 4 + ch];
        const a = Number.isFinite(v0) ? v0 : 0;
        const b = Number.isFinite(v1) ? v1 : 0;
        return a * (1 - t) + b * t;
    };
    // Sustituye NaN o infinitos por un valor de respaldo estable.
    const __safeNum = (v, fb = 0) => Number.isFinite(v) ? v : fb;
    // Integra una trayectoria 1D a partir de evaluadores genericos de drift y difusion.
    const __simulateAxisPath = (src, n, minX, rangeX, dt, gain, evalDrift, evalDiff, useNoise, evalNoise, aOverride = null) => {
        const out = new Float32Array(n);
        out[0] = __safeNum(src[0], 0);
        const g = __safeNum(gain, 1);
        const dtt = __safeNum(dt, 1e-3);
        for (let i = 1; i < n; i++) {
            const u = (out[i - 1] - minX) / rangeX;
            const uu = Math.max(0, Math.min(1, u));
            const f = __safeNum(evalDrift(uu), 0);
            let s = __safeNum(evalDiff(uu), 0);
            if (aOverride !== null && Number.isFinite(aOverride)) {
                s = Math.sqrt(Math.max(0, 2.0 * __safeNum(aOverride, 0)));
            }
            let noise = 0;
            if (useNoise)
                noise = __safeNum(evalNoise(i), 0);
            const stepDet = __safeNum(f * rangeX * dtt * g, 0);
            const stepSto = __safeNum(s * rangeX * Math.sqrt(dtt) * noise * 0.45 * g, 0);
            out[i] = __safeNum(out[i - 1] + stepDet + stepSto, out[i - 1]);
        }
        return out;
    };
    // Simula una trayectoria usando coeficientes polinomicos ya ajustados.
    const __simulateAxisFromCoeffs = (src, n, minX, rangeX, dt, gain, coeffF, coeffS, subseqSeed, useNoise, aOverride = null) => __simulateAxisPath(src, n, minX, rangeX, dt, gain, (uu) => __safeNum(coeffF[0], 0) + __safeNum(coeffF[1], 0) * uu + __safeNum(coeffF[2], 0) * uu * uu + __safeNum(coeffF[3], 0) * uu * uu * uu, () => 2.0 * __safeNum(coeffS, 0), useNoise, (i) => {
        const h = Math.sin((i + 1 + subseqSeed) * 12.9898 + subseqSeed * 17.133) * 43758.5453;
        return (h - Math.floor(h)) * 2.0 - 1.0;
    }, aOverride);
    // Simula una trayectoria directamente desde la fila de campos Sindy ya renderizada.
    const __simulateAxisFromSindyRow = (src, n, minX, rangeX, dt, gain, row, bins, tauSel, subSel, chromSel, useNoise, aOverride = null) => __simulateAxisPath(src, n, minX, rangeX, dt, gain, (uu) => __sampleSindy(row, bins, uu, 1), (uu) => __sampleSindy(row, bins, uu, 2), useNoise, (i) => {
        const h = Math.sin((i + 1) * 12.9898 + tauSel * 78.233 + subSel * 37.719 + chromSel * 11.131) * 43758.5453;
        return (h - Math.floor(h)) * 2.0 - 1.0;
    }, aOverride);
    // Promedia coeficientes validos de todas las subsecuencias de un tau dado.
    const __collectMeanAxisCoeffs = (tauSel) => {
        let meanXiF = [0, 0, 0, 0];
        let meanXiS = 0;
        let meanCnt = 0;
        if (!(tauSel > 1))
            return { meanXiF, meanXiS, meanCnt };
        const texFF = ((typeof tauXiFFinal !== "undefined" && tauXiFFinal) ? tauXiFFinal : null);
        const texSF = ((typeof tauXiSFinal !== "undefined" && tauXiSFinal) ? tauXiSFinal : null);
        const texMF = ((typeof tauXiMetaFinal !== "undefined" && tauXiMetaFinal) ? tauXiMetaFinal : null);
        const texFI = ((typeof tauXiF !== "undefined") ? tauXiF : null);
        const texSI = ((typeof tauXiS !== "undefined") ? tauXiS : null);
        const texMI = ((typeof tauXiMeta !== "undefined") ? tauXiMeta : null);
        if ((!texFF || !texSF || !texMF) && (!texFI || !texSI || !texMI))
            return { meanXiF, meanXiS, meanCnt };
        for (let subseqIdx = 0; subseqIdx < tauSel; subseqIdx++) {
            let pf = texFF ? __readTexPixel(texFF, tauSel - 1, subseqIdx) : null;
            let ps = texSF ? __readTexPixel(texSF, tauSel - 1, subseqIdx) : null;
            let pm = texMF ? __readTexPixel(texMF, tauSel - 1, subseqIdx) : null;
            let valid = (pm && Number.isFinite(pm[1])) ? pm[1] : 0;
            if (valid <= 0.5 && texFI && texSI && texMI) {
                pf = __readTexPixel(texFI, tauSel - 1, subseqIdx);
                ps = __readTexPixel(texSI, tauSel - 1, subseqIdx);
                pm = __readTexPixel(texMI, tauSel - 1, subseqIdx);
                valid = (pm && Number.isFinite(pm[1])) ? pm[1] : 0;
            }
            if (!pf || !ps || !pm)
                continue;
            if (valid <= 0.5)
                continue;
            meanXiF[0] += Number.isFinite(pf[0]) ? pf[0] : 0;
            meanXiF[1] += Number.isFinite(pf[1]) ? pf[1] : 0;
            meanXiF[2] += Number.isFinite(pf[2]) ? pf[2] : 0;
            meanXiF[3] += Number.isFinite(pf[3]) ? pf[3] : 0;
            meanXiS += Number.isFinite(ps[0]) ? ps[0] : 0;
            meanCnt++;
        }
        if (meanCnt > 0) {
            meanXiF = [meanXiF[0] / meanCnt, meanXiF[1] / meanCnt, meanXiF[2] / meanCnt, meanXiF[3] / meanCnt];
            meanXiS /= meanCnt;
        }
        return { meanXiF, meanXiS, meanCnt };
    };
    // Mide rango y paso medio de la serie observada para normalizar la simulacion.
    const __measureAxisSeries = (src, n) => {
        let minX = 1e30, maxX = -1e30;
        for (let i = 0; i < n; i++) {
            const x = src[i];
            if (Number.isFinite(x)) {
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
            }
        }
        if (!(maxX > minX)) {
            minX = (src[0] || 0) - 1;
            maxX = (src[0] || 0) + 1;
        }
        let realStepMean = 0;
        for (let i = 1; i < n; i++)
            realStepMean += Math.abs(src[i] - src[i - 1]);
        realStepMean /= Math.max(1, n - 1);
        return { minX, maxX, rangeX: Math.max(1e-6, maxX - minX), realStepMean };
    };
    const __rowHasSignal = (row, bins) => {
        if (!row || row.length < 4)
            return false;
        for (let i = 0; i < bins; i++) {
            const k = i * 4;
            const f = row[k + 1], s = row[k + 2], a = row[k + 3];
            if ((Number.isFinite(f) && Math.abs(f) > 1e-8) || (Number.isFinite(s) && Math.abs(s) > 1e-8) || (Number.isFinite(a) && Math.abs(a) > 1e-10))
                return true;
        }
        return false;
    };
    // Ajusta una ganancia para que el paso simulado tenga una escala comparable a la observada.
    const __estimateAxisGain = (src, n, minX, rangeX, dt, bins, row, meanXiF, meanXiS, meanCnt, realStepMean) => {
        let modelStepMean = 0;
        for (let i = 1; i < n; i++) {
            const u = (src[i - 1] - minX) / rangeX;
            const f = (meanCnt > 0)
                ? (meanXiF[0] + meanXiF[1] * u + meanXiF[2] * u * u + meanXiF[3] * u * u * u)
                : __sampleSindy(row, bins, u, 1);
            const s = (meanCnt > 0)
                ? (2.0 * meanXiS)
                : __sampleSindy(row, bins, u, 2);
            const det = Math.abs(f) * rangeX * dt;
            const sto = Math.abs(s) * rangeX * Math.sqrt(dt);
            modelStepMean += det + sto;
        }
        modelStepMean /= Math.max(1, n - 1);
        return {
            modelStepMean,
            // La ganancia ya compensa el paso medio; limitarla evita que la simulacion explote de escala.
            gain: Math.max(0.1, Math.min(10.0, __safeNum(realStepMean / Math.max(1e-6, modelStepMean), 1)))
        };
    };
    //</BridgeSimulationHelpers>
    //? - Publicacion de la trayectoria entre canvases
    //<BridgeSimulationPublish>
    // Genera la trayectoria del eje actual y la publica en window para que C1 la consuma.
    const __publishSimTrajectoryFromTau = (force = false) => {
        if (typeof tauSindyTex === "undefined" || !tauSindyTex)
            return false;
        if (typeof datosY1 === "undefined" || !datosY1)
            return false;
        const bins = Math.max(2, ((typeof nBins !== "undefined" ? nBins : 64) | 0));
        const nSeries = Math.max(2, ((typeof NMuestras1 !== "undefined" ? NMuestras1 : 0) | 0));
        if (nSeries < 2)
            return false;
        const tauLo = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0));
        const tauHi = Math.max(tauLo, ((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 1) | 0));
        const tauSel = Math.max(tauLo, Math.min(tauHi, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0)));
        const subSel = Math.max(0, Math.min(tauSel - 1, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0)));
        const chromSel = Math.max(1, ((typeof chromatinIndex !== "undefined" ? chromatinIndex : 1) | 0));
        const useMeanMode = !!(window.simUseMeanSubseq || false);
        const reqRebuild = (window.simReqRebuild | 0);
        const keyNow = tauSel + "|" + subSel;
        if (__aOverrideEnabled && __aOverrideKey !== keyNow) {
            __clearAOverride();
        }
        if (useMeanMode !== __lastMeanFlag || reqRebuild !== __lastReqRebuild) {
            force = true;
            __lastSimKey = "";
        }
        __lastMeanFlag = useMeanMode;
        __lastReqRebuild = reqRebuild;
        const simKey = [
            tauSel, subSel, chromSel, bins, nSeries, tauLo, tauHi,
            useMeanMode ? 1 : 0,
            __aOverrideEnabled ? 1 : 0,
            __safeNum(__aOverrideA ?? -1, -1).toFixed(4)
        ].join("|");
        if (!force && simKey === __lastSimKey)
            return false;
        let row = __readTexRow(tauSindyTex, bins, 0);
        if (!__rowHasSignal(row, bins) && (typeof tauSindyInitTex !== "undefined") && tauSindyInitTex) {
            const rowInit = __readTexRow(tauSindyInitTex, bins, 0);
            if (__rowHasSignal(rowInit, bins))
                row = rowInit;
        }
        if (!row)
            return false;
        const src = (datosY1 instanceof Float32Array) ? datosY1 : new Float32Array(datosY1);
        const n = Math.max(2, Math.min(nSeries, src.length));
        if (n < 2)
            return false;
        // 1) Leemos el estado seleccionado y calculamos la escala de la serie real.
        const { meanXiF, meanXiS, meanCnt: meanCoeffCount } = useMeanMode ? __collectMeanAxisCoeffs(tauSel) : { meanXiF: [0, 0, 0, 0], meanXiS: 0, meanCnt: 0 };
        const { minX, rangeX, realStepMean } = __measureAxisSeries(src, n);
        const dt = Math.max(1e-4, 1.0 / Math.max(1, tauSel));
        // 2) Igualamos el tama?o medio del paso simulado con el de la serie observada.
        const gainInfo = __estimateAxisGain(src, n, minX, rangeX, dt, bins, row, meanXiF, meanXiS, meanCoeffCount, realStepMean);
        const modelStepMean = gainInfo.modelStepMean;
        const gain = gainInfo.gain;
        const meanAmpBoost = 1.0;
        const useAO = (__aOverrideEnabled && __aOverrideA !== null) ? __aOverrideA : null;
        const simY = new Float32Array(n);
        simY[0] = src[0];
        let meanCnt = meanCoeffCount;
        // 3) Generamos la trayectoria: promedio por subsecuencias, media de coeficientes o campo Sindy.
        if (useMeanMode && tauSel > 1) {
            // En promedio sobre subsecuencias acumulamos trayectorias simuladas completas
            // y solo dividimos al final en cada punto para no sesgar la media.
            simY.fill(0);
            const texFF = ((typeof tauXiFFinal !== "undefined" && tauXiFFinal) ? tauXiFFinal : null);
            const texSF = ((typeof tauXiSFinal !== "undefined" && tauXiSFinal) ? tauXiSFinal : null);
            const texMF = ((typeof tauXiMetaFinal !== "undefined" && tauXiMetaFinal) ? tauXiMetaFinal : null);
            const texFI = ((typeof tauXiF !== "undefined") ? tauXiF : null);
            const texSI = ((typeof tauXiS !== "undefined") ? tauXiS : null);
            const texMI = ((typeof tauXiMeta !== "undefined") ? tauXiMeta : null);
            let nUsed = 0;
            const cntPerPt = new Uint16Array(n);
            for (let subseqIdx = 0; subseqIdx < tauSel; subseqIdx++) {
                let pf = texFF ? __readTexPixel(texFF, tauSel - 1, subseqIdx) : null;
                let ps = texSF ? __readTexPixel(texSF, tauSel - 1, subseqIdx) : null;
                let pm = texMF ? __readTexPixel(texMF, tauSel - 1, subseqIdx) : null;
                let valid = (pm && Number.isFinite(pm[1])) ? pm[1] : 0;
                if (valid <= 0.5 && texFI && texSI && texMI) {
                    pf = __readTexPixel(texFI, tauSel - 1, subseqIdx);
                    ps = __readTexPixel(texSI, tauSel - 1, subseqIdx);
                    pm = __readTexPixel(texMI, tauSel - 1, subseqIdx);
                    valid = (pm && Number.isFinite(pm[1])) ? pm[1] : 0;
                }
                if (!pf || !ps || !pm)
                    continue;
                if (valid <= 0.5)
                    continue;
                const coeffF = [
                    Number.isFinite(pf[0]) ? pf[0] : 0,
                    Number.isFinite(pf[1]) ? pf[1] : 0,
                    Number.isFinite(pf[2]) ? pf[2] : 0,
                    Number.isFinite(pf[3]) ? pf[3] : 0
                ];
                const coeffS = (Number.isFinite(ps[0]) ? ps[0] : 0);
                const tr = __simulateAxisFromCoeffs(src, n, minX, rangeX, dt, gain * meanAmpBoost, coeffF, coeffS, subseqIdx, false, (__aOverrideEnabled && __aOverrideA !== null && subseqIdx === subSel) ? __aOverrideA : null);
                for (let i = 0; i < n; i++) {
                    const value = tr[i];
                    if (Number.isFinite(value)) {
                        simY[i] += value;
                        cntPerPt[i] += 1;
                    }
                }
                nUsed++;
            }
            if (nUsed > 0) {
                for (let i = 0; i < n; i++) {
                    const c = cntPerPt[i];
                    simY[i] = (c > 0) ? (simY[i] / c) : src[i];
                }
                meanCnt = nUsed;
            }
            else {
                const tr = __simulateAxisFromCoeffs(src, n, minX, rangeX, dt, gain * meanAmpBoost, meanXiF, meanXiS, subSel, false, useAO);
                simY.set(tr);
            }
        }
        else if (meanCoeffCount > 0) {
            const tr = __simulateAxisFromCoeffs(src, n, minX, rangeX, dt, gain, meanXiF, meanXiS, subSel, true, useAO);
            simY.set(tr);
        }
        else {
            const tr = __simulateAxisFromSindyRow(src, n, minX, rangeX, dt, gain, row, bins, tauSel, subSel, chromSel, true, useAO);
            simY.set(tr);
        }
        // 4) Saneamos la salida y la publicamos para C1.
        for (let i = 0; i < n; i++) {
            if (!Number.isFinite(simY[i]))
                simY[i] = __safeNum(src[i], 0);
        }
        window.simDataY = simY;
        window.simSamplesY = n;
        window.chromatinIndex = chromSel;
        window.simUseMeanSubseq = useMeanMode;
        window.simMetaY = { tau: tauSel, subseq: subSel, chromatin: chromSel, n, meanAllSubseq: useMeanMode, meanCnt, axis: "y" };
        window.simStampY = (((window.simStampY) | 0) + 1);
        __lastSimKey = simKey;
        if (__lastSimLogFrame > 0) {
            console.log("C3 simY->C1", { tau: tauSel, subseq: subSel, chromatin: chromSel, mode: (useMeanMode ? "mean-subseq" : "single-subseq"), meanCnt, aOverride: (__aOverrideEnabled ? __aOverrideA : null), samples: n, gain, realStepMean, modelStepMean, stampY: window.simStampY });
            __lastSimLogFrame -= 1;
        }
        return true;
    };
    //</BridgeSimulationPublish>
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
      - __applyCanvasFullscreenC3
    */
    //? - HUD base y sincronizacion con el canvas
    // Crea el canvas overlay del HUD una sola vez y lo inserta sobre el host del panel tau.
    const __ensureTauHud = () => {
        if (tauHudCanvas && tauHudCtx)
            return;
        tauHudCanvas = document.createElement("canvas");
        tauHudCanvas.id = "tauHudOverlayC3";
        tauHudCanvas.style.pointerEvents = "none";
        tauHudCanvas.style.zIndex = "1000000";
        tauHudCanvas.style.display = "block";
        tauHudCtx = tauHudCanvas.getContext("2d");
        const p = (__c3Host || document.body);
        if (p && p !== document.body) {
            const cs = window.getComputedStyle(p);
            if (cs.position === "static" || !cs.position)
                p.style.position = "relative";
        }
        (p || document.body).appendChild(tauHudCanvas);
    };
    // Ajusta el overlay del HUD para que siga al canvas en tamano, posicion y fullscreen.
    const __syncTauHud = () => {
        if (!tauHudCanvas)
            return;
        const isFs = (document.fullscreenElement === canvas || document.fullscreenElement === __fsTargetC3);
        if (isFs) {
            tauHudCanvas.style.position = "fixed";
            tauHudCanvas.style.left = "0px";
            tauHudCanvas.style.top = "0px";
            tauHudCanvas.style.width = "100vw";
            tauHudCanvas.style.height = "100vh";
            tauHudCanvas.width = window.innerWidth;
            tauHudCanvas.height = window.innerHeight;
        }
        else {
            const r = canvas.getBoundingClientRect();
            tauHudCanvas.style.position = "absolute";
            tauHudCanvas.style.left = (canvas.offsetLeft || 0) + "px";
            tauHudCanvas.style.top = (canvas.offsetTop || 0) + "px";
            tauHudCanvas.style.width = (r.width || canvas.clientWidth || canvas.width) + "px";
            tauHudCanvas.style.height = (r.height || canvas.clientHeight || canvas.height) + "px";
            tauHudCanvas.width = Math.max(1, Math.round(r.width || canvas.clientWidth || canvas.width));
            tauHudCanvas.height = Math.max(1, Math.round(r.height || canvas.clientHeight || canvas.height));
        }
    };
    //? - Calculo incremental de MSD y progreso
    // Calcula la MSD 1D para una serie y un maximo retraso.
    const __calcMSD1DSeries = (x, maxTau) => {
        const n = (x.length | 0);
        const tMax = Math.max(1, Math.min(maxTau, n - 1));
        const out = new Float32Array(tMax + 1);
        out[0] = 0;
        for (let tau = 1; tau <= tMax; tau++) {
            let acc = 0, cnt = 0;
            for (let i = 0; i < n - tau; i++) {
                const dx = (x[i + tau] - x[i]);
                if (!Number.isFinite(dx))
                    continue;
                acc += dx * dx;
                cnt++;
            }
            out[tau] = (cnt > 0) ? (acc / cnt) : NaN;
        }
        return out;
    };
    // Devuelve el reloj apropiado para repartir trabajo incremental por frame.
    const __msdNow = () => ((typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now());
    // Formatea valores del HUD con una precision compacta y estable.
    const __fmtHud = (v) => {
        if (!Number.isFinite(v))
            return "na";
        const av = Math.abs(v);
        if (av >= 1000 || (av > 0 && av < 0.001))
            return v.toExponential(1);
        if (av >= 10)
            return v.toFixed(1);
        return v.toFixed(3);
    };
    // Sincroniza el widget DOM de progreso MSD del panel actual.
    const __publishMSDProgress = () => {
        const prog = window.__tauMSDProgressY;
        const fill = document.getElementById("c3-msd-progress-fill");
        const label = document.getElementById("c3-msd-progress-label");
        if (fill)
            fill.style.width = String(Math.max(0, Math.min(100, Number(prog?.percent) || 0))) + "%";
        if (label) {
            const pct = Math.max(0, Math.min(100, Number(prog?.percent) || 0));
            const tauTxt = (prog && Number.isFinite(prog.tau)) ? String(prog.tau) : "-";
            const subTxt = (prog && Number.isFinite(prog.subseq)) ? String(prog.subseq) : "-";
            const phase = (prog && prog.phase) ? String(prog.phase) : "en espera";
            label.textContent = "MSD SSE C3: " + phase + " (" + pct.toFixed(1) + "%) tau=" + tauTxt + " subseq=" + subTxt;
        }
    };
    // Mezcla una actualizacion parcial del progreso con el estado previo publicado.
    const __setMSDProgress = (patch) => {
        const prev = window.__tauMSDProgressY || { axis: "y", phase: "en espera", percent: 0, tau: null, subseq: null, done: 0, total: 0, complete: false };
        const next = Object.assign({}, prev, patch || {});
        window.__tauMSDProgressY = next;
        __tauMSDProgressKey = [next.phase, next.percent, next.tau, next.subseq, next.done, next.total, next.complete].join("|");
        __publishMSDProgress();
    };
    // Refresca el progreso visible en cada tick cuando ya existe un estado publicado.
    const __updateMSDProgressTick = () => {
        if (window.__tauMSDProgressY)
            __publishMSDProgress();
    };
    // Prepara el trabajo incremental que compara la MSD real con todas las candidatas.
    const __buildMSDScoreAxisJob = () => {
        const texF = ((typeof tauXiFFinal !== "undefined" && tauXiFFinal) ? tauXiFFinal : ((typeof tauXiF !== "undefined") ? tauXiF : null));
        const texS = ((typeof tauXiSFinal !== "undefined" && tauXiSFinal) ? tauXiSFinal : ((typeof tauXiS !== "undefined") ? tauXiS : null));
        const texM = ((typeof tauXiMetaFinal !== "undefined" && tauXiMetaFinal) ? tauXiMetaFinal : ((typeof tauXiMeta !== "undefined") ? tauXiMeta : null));
        const srcBase = (typeof datosY1 !== "undefined" && datosY1) ? (datosY1 instanceof Float32Array ? datosY1 : new Float32Array(datosY1)) : null;
        const tauMaxN = Math.max(1, ((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100) | 0));
        const tauMinN = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0));
        const chromSel = Math.max(1, ((typeof chromatinIndex !== "undefined" ? chromatinIndex : 1) | 0));
        const modelStamp = ((typeof tauModelStamp !== "undefined" ? tauModelStamp : 0) | 0);
        const key = ["y", modelStamp, tauMinN, tauMaxN, chromSel, srcBase?.length || 0, ((typeof tauMSDMaxLag !== "undefined" ? tauMSDMaxLag : 64) | 0)].join("|");
        if (__lastMSDScoreKey === key && __tauMSDLocalRaw && __tauMSDLocalValid) {
            __setMSDProgress({ phase: "listo", percent: 100, complete: true, done: __tauMSDLocalValid.length, total: __tauMSDLocalValid.length, tau: null, subseq: null });
            return null;
        }
        if (__tauMSDJob && __tauMSDJob.key === key)
            return __tauMSDJob;
        if (!texF || !texS || !texM || !srcBase || srcBase.length < 8) {
            __tauMSDJob = null;
            __tauMSDLocalRaw = null;
            __tauMSDLocalValid = null;
            __setMSDProgress({ phase: "sin datos", percent: 0, complete: false, done: 0, total: 0, tau: null, subseq: null });
            return null;
        }
        const src = (srcBase instanceof Float32Array) ? srcBase : new Float32Array(srcBase);
        const nScore = src.length | 0;
        let minX = 1e30, maxX = -1e30;
        for (let i = 0; i < nScore; i++) {
            const x = src[i];
            if (!Number.isFinite(x))
                continue;
            if (x < minX)
                minX = x;
            if (x > maxX)
                maxX = x;
        }
        if (!(maxX > minX)) {
            minX = (src[0] || 0) - 1;
            maxX = (src[0] || 0) + 1;
        }
        const rangeX = Math.max(1e-6, maxX - minX);
        let realStepMean = 0;
        for (let i = 1; i < nScore; i++)
            realStepMean += Math.abs(src[i] - src[i - 1]);
        realStepMean /= Math.max(1, nScore - 1);
        const maxLagCfg = ((typeof tauMSDMaxLag !== "undefined" ? tauMSDMaxLag : 64) | 0);
        const maxLag = (maxLagCfg > 0) ? Math.max(1, Math.min(maxLagCfg, nScore - 1)) : Math.max(1, nScore - 1);
        const msdO = __calcMSD1DSeries(src, maxLag);
        const raw = new Float32Array(tauMaxN * tauMaxN);
        const valid = new Uint8Array(tauMaxN * tauMaxN);
        const candidates = [];
        for (let tau = tauMinN; tau <= tauMaxN; tau++) {
            const dt = Math.max(1e-4, 1.0 / Math.max(1, tau));
            for (let ss = 0; ss < tau; ss++) {
                const idx2 = ss * tauMaxN + (tau - 1);
                const pf = __readTexPixel(texF, tau - 1, ss);
                const ps = __readTexPixel(texS, tau - 1, ss);
                const pm = __readTexPixel(texM, tau - 1, ss);
                const isValid = ((pm && Number.isFinite(pm[1]) ? pm[1] : ((ps && Number.isFinite(ps[2])) ? ps[2] : 0)) > 0.5);
                if (!pf || !ps || !isValid)
                    continue;
                const cf = [
                    Number.isFinite(pf[0]) ? pf[0] : 0,
                    Number.isFinite(pf[1]) ? pf[1] : 0,
                    Number.isFinite(pf[2]) ? pf[2] : 0,
                    Number.isFinite(pf[3]) ? pf[3] : 0
                ];
                const cs = (Number.isFinite(ps[0]) ? ps[0] : 0);
                let modelStepMean = 0;
                for (let i = 1; i < nScore; i++) {
                    const u = (src[i - 1] - minX) / rangeX;
                    const uu = Math.max(0, Math.min(1, u));
                    const f = (cf[0] + cf[1] * uu + cf[2] * uu * uu + cf[3] * uu * uu * uu);
                    const s = (2.0 * cs);
                    modelStepMean += Math.abs(f) * rangeX * dt + Math.abs(s) * rangeX * Math.sqrt(dt);
                }
                modelStepMean /= Math.max(1, nScore - 1);
                const gain = Math.max(0.1, Math.min(250.0, __safeNum(realStepMean / Math.max(1e-6, modelStepMean), 1)));
                candidates.push({ tau, ss, idx: idx2, dt, gain, cf, cs });
            }
        }
        __tauMSDDisplayPack = null;
        __lastMSDDisplayKey = "";
        __tauMSDJob = { key, raw, valid, src, nScore, minX, rangeX, maxLag, msdO, tauMaxN, tauMinN, modelStamp, candidates, cursor: 0, total: candidates.length, done: false };
        window.__tauMSDScoreAxisY = { raw, valid, width: tauMaxN, height: tauMaxN, stamp: modelStamp, complete: false, cursor: 0, total: candidates.length };
        __setMSDProgress({ phase: (candidates.length > 0 ? "calculando" : "sin candidatos"), percent: (candidates.length > 0 ? 0 : 100), complete: (candidates.length === 0), done: 0, total: candidates.length, tau: (candidates[0]?.tau ?? null), subseq: (candidates[0]?.ss ?? null) });
        if (candidates.length === 0) {
            __tauMSDLocalRaw = raw;
            __tauMSDLocalValid = valid;
            __lastMSDScoreKey = key;
        }
        return __tauMSDJob;
    };
    // Ejecuta un trozo del trabajo de MSD respetando el presupuesto temporal por frame.
    const __stepMSDScoreAxisJob = () => {
        const job = __tauMSDJob || __buildMSDScoreAxisJob();
        if (!job)
            return !!(__tauMSDLocalRaw && __tauMSDLocalValid);
        if (job.done)
            return true;
        const budget = Math.max(2, Number((typeof tauMSDChunkBudgetMs !== "undefined" ? tauMSDChunkBudgetMs : 8)) || 8);
        const deadline = __msdNow() + budget;
        while (job.cursor < job.total && __msdNow() <= deadline) {
            const cand = job.candidates[job.cursor];
            const sim = __simulateAxisFromCoeffs(job.src, job.nScore, job.minX, job.rangeX, cand.dt, cand.gain, cand.cf, cand.cs, cand.ss, true, null);
            const msdS = __calcMSD1DSeries(sim, job.maxLag);
            let score = 0;
            for (let t = 1; t < job.msdO.length; t++) {
                const d = (Number.isFinite(msdS[t]) ? msdS[t] : 0) - (Number.isFinite(job.msdO[t]) ? job.msdO[t] : 0);
                score += d * d;
            }
            job.raw[cand.idx] = score;
            job.valid[cand.idx] = 1;
            job.cursor++;
        }
        const current = (job.cursor < job.total) ? job.candidates[job.cursor] : null;
        const complete = (job.cursor >= job.total);
        window.__tauMSDScoreAxisY = { raw: job.raw, valid: job.valid, width: job.tauMaxN, height: job.tauMaxN, stamp: job.modelStamp, complete, cursor: job.cursor, total: job.total };
        __setMSDProgress({ phase: (complete ? "listo" : "calculando"), percent: (job.total > 0 ? (100 * job.cursor / job.total) : 100), complete, done: job.cursor, total: job.total, tau: (current?.tau ?? null), subseq: (current?.ss ?? null) });
        if (complete) {
            job.done = true;
            __tauMSDLocalRaw = job.raw;
            __tauMSDLocalValid = job.valid;
            __lastMSDScoreKey = job.key;
        }
        return complete;
    };
    // Devuelve el estado mas reciente del mapa MSD local, ya venga del job o de cache final.
    const __getMSDAxisPack = () => {
        if (__tauMSDJob)
            return window.__tauMSDScoreAxisY || null;
        if (__tauMSDLocalRaw && __tauMSDLocalValid)
            return window.__tauMSDScoreAxisY || null;
        return null;
    };
    // Fusiona el mapa local con el del otro eje y produce el heatmap visible en el HUD.
    const __refreshMSDScoreDisplay = () => {
        __stepMSDScoreAxisJob();
        const local = __getMSDAxisPack();
        if (!local || !local.raw || !local.valid)
            return false;
        const other = window.__tauMSDScoreAxisX;
        const tauMaxN = local.width | 0;
        const tauMinN = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0));
        const localToken = local.complete ? ("L" + String(local.stamp || 0)) : ("L" + String(local.stamp || 0) + ":" + String(local.cursor || 0) + "/" + String(local.total || 0));
        const otherToken = other ? (other.complete ? ("O" + String(other.stamp || 0)) : ("O" + String(other.stamp || 0) + ":" + String(other.cursor || 0) + "/" + String(other.total || 0))) : "O:none";
        const key = ["disp", localToken, otherToken, tauMinN, tauMaxN].join("|");
        if (__lastMSDDisplayKey === key && __tauMSDDisplayPack)
            return true;
        const pack = new Float32Array(tauMaxN * tauMaxN * 4);
        let minScore = 1e30, maxScore = -1e30;
        const canCombine = !!(other && other.complete && other.width === local.width && other.height === local.height && other.raw && other.valid);
        for (let ss = 0; ss < tauMaxN; ss++) {
            for (let tau = tauMinN; tau <= tauMaxN; tau++) {
                if (ss >= tau)
                    break;
                const idx = ss * tauMaxN + (tau - 1);
                const off = idx * 4;
                const validLocal = local.valid[idx] > 0;
                const validOther = canCombine ? (other.valid[idx] > 0) : true;
                const ok = validLocal && validOther;
                if (!ok)
                    continue;
                const score = (local.raw[idx] || 0) + (canCombine ? (other.raw[idx] || 0) : 0);
                pack[off] = score;
                pack[off + 2] = 1;
                if (score < minScore)
                    minScore = score;
                if (score > maxScore)
                    maxScore = score;
            }
        }
        if (!(maxScore > minScore)) {
            minScore = 0;
            maxScore = Math.max(1, maxScore + 1);
        }
        const lo = Math.log(1 + Math.max(0, minScore));
        const hi = Math.log(1 + Math.max(minScore + 1e-6, maxScore));
        for (let i = 0; i < tauMaxN * tauMaxN; i++) {
            const off = i * 4;
            if (pack[off + 2] < 0.5)
                continue;
            const norm = (Math.log(1 + Math.max(0, pack[off])) - lo) / Math.max(1e-6, hi - lo);
            pack[off + 1] = 1 - Math.max(0, Math.min(1, norm));
        }
        __tauMSDDisplayPack = pack;
        __tauMSDDisplayMin = minScore;
        __tauMSDDisplayMax = maxScore;
        __lastMSDDisplayKey = key;
        return true;
    };
    //? - Dibujo del HUD y de sus overlays
    // Dibuja paneles, curvas, heatmaps, leyendas y ayudas del HUD del canvas tau.
    const __drawTauHud = () => {
        if (!tauHudCtx || !tauHudCanvas)
            return;
        __syncTauHud();
        const hud = tauHudCtx;
        const W2 = tauHudCanvas.width | 0;
        const H2 = tauHudCanvas.height | 0;
        hud.clearRect(0, 0, W2, H2);
        __publishPanelBest();
        __syncBestInputs(false);
        __publishSimTrajectoryFromTau(false);
        __refreshMSDScoreDisplay();
        __updateMSDProgressTick();
        const left = Math.round(W2 * 0.04), right = Math.round(W2 * 0.03);
        const top = Math.round(H2 * 0.03), bottom = Math.round(H2 * 0.04);
        const gapX = Math.round(W2 * 0.03), gapY = Math.round(H2 * 0.035);
        const pdfH = Math.round(H2 * 0.08), topH = Math.round(H2 * 0.44), botH = Math.round(H2 * 0.29);
        const xL = left, xR = W2 - right, fullW = xR - xL, halfW = Math.round((fullW - gapX) * 0.5);
        const yTop0 = top, yTop1 = yTop0 + topH;
        const yBot0 = yTop1 + gapY, yBot1 = yBot0 + botH;
        const yPdf1 = H2 - bottom, yPdf0 = yPdf1 - pdfH;
        const xBL0 = xL, xBL1 = xBL0 + halfW, xBR0 = xBL1 + gapX, xBR1 = xR;
        const isFsNow = (document.fullscreenElement === __fsTargetC3);
        const notFsDelta = isFsNow ? 0 : 3;
        hud.save();
        hud.strokeStyle = "rgba(235,235,235,0.92)";
        hud.fillStyle = "rgba(245,245,245,0.95)";
        hud.lineWidth = 1;
        hud.font = Math.max(7, Math.round(H2 * 0.0093) + 1 - notFsDelta) + "px monospace";
        // Convierte componentes normalizadas a un color CSS entero.
        const __legendColor = (r, g, b) => "rgb(" + Math.round(255 * r) + "," + Math.round(255 * g) + "," + Math.round(255 * b) + ")";
        // Interpola dos colores RGB para generar la paleta de leyendas.
        const __mix3 = (a, b, t) => [
            a[0] * (1 - t) + b[0] * t,
            a[1] * (1 - t) + b[1] * t,
            a[2] * (1 - t) + b[2] * t
        ];
        // Mapea score global a una escala verde-rojo para la leyenda superior.
        const __scoreColor = (score) => {
            const cN = Math.max(0, Math.min(1, 1.0 / (1.0 + 1.8 * Math.max(0, score))));
            return __legendColor(...__mix3([0.25, 0.05, 0.05], [0.1, 0.95, 0.3], cN));
        };
        // Mapea KL a una escala cian-rojo para distinguir parecido distribucional.
        const __klColor = (kl) => {
            const v = Math.max(0, Math.min(1, 1.0 / (1.0 + 0.4 * Math.max(0, kl))));
            return __legendColor(...__mix3([0.25, 0.05, 0.08], [0.15, 0.95, 0.95], v));
        };
        // Mapea coste de ajuste a una escala amarillo-rojo para el panel inferior.
        const __costColor = (cost) => {
            const v = Math.max(0, Math.min(1, 1.0 / (1.0 + 0.03 * Math.max(0, cost))));
            return __legendColor(...__mix3([0.2, 0.08, 0.08], [0.95, 0.75, 0.2], v));
        };
        // Mapea la bondad del error MSD ya normalizado al color del heatmap.
        const __msdScoreColor = (scoreGood) => {
            return __legendColor(...__mix3([0.2, 0.08, 0.08], [0.95, 0.75, 0.2], Math.max(0, Math.min(1, scoreGood))));
        };
        // Dibuja una leyenda horizontal con escalones y etiquetas numericas.
        const __drawLegend = (x, y, title, vals, colorFn) => {
            const sw = Math.max(16, Math.round(W2 * 0.02));
            const sh = Math.max(8, Math.round(H2 * 0.014));
            const step = Math.max(2, Math.round(W2 * 0.004));
            hud.save();
            hud.font = Math.max(6, Math.round(H2 * 0.0076) + 1 - notFsDelta) + "px monospace";
            hud.fillStyle = "rgba(245,245,245,0.95)";
            hud.fillText(title, x, y - 4);
            for (let i = 0; i < vals.length; i++) {
                const xx = x + i * (sw + step);
                hud.fillStyle = colorFn(vals[i]);
                hud.fillRect(xx, y, sw, sh);
                hud.strokeStyle = "rgba(255,255,255,0.55)";
                hud.strokeRect(xx, y, sw, sh);
                hud.fillStyle = "rgba(245,245,245,0.95)";
                hud.fillText(__fmtHud(vals[i]), xx, y + sh + 10);
            }
            hud.restore();
        };
        if (typeof showTauCurves === "undefined" || !showTauCurves) {
            const tauMaxN = Math.max(1, ((typeof tauMaxVeces !== "undefined" ? tauMaxVeces : 100) | 0));
            const scoreArr = __readTexRect((typeof tauScoreTex !== "undefined" ? tauScoreTex : null), tauMaxN, tauMaxN);
            const klArr = __readTexRect((typeof tauKLTex !== "undefined" ? tauKLTex : null), tauMaxN, tauMaxN);
            const metaArr = __readTexRect((typeof tauXiMetaFinal !== "undefined" ? tauXiMetaFinal : null), tauMaxN, tauMaxN);
            let minScore = 1e30, maxScore = 0;
            let minKL = 1e30, maxKL = 0;
            let minCost = 1e30, maxCost = 0;
            for (let s = 0; s < tauMaxN; s++) {
                for (let t = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0)); t <= tauMaxN; t++) {
                    if (s >= t)
                        break;
                    const off = (s * tauMaxN + (t - 1)) * 4;
                    if (scoreArr) {
                        const valid = scoreArr[off + 2], score = scoreArr[off + 1];
                        if (valid > 0.5 && Number.isFinite(score)) {
                            minScore = Math.min(minScore, score);
                            maxScore = Math.max(maxScore, score);
                        }
                    }
                    if (klArr) {
                        const valid = klArr[off + 1], kl = klArr[off + 0];
                        if (valid > 0.5 && Number.isFinite(kl)) {
                            minKL = Math.min(minKL, kl);
                            maxKL = Math.max(maxKL, kl);
                        }
                    }
                    if (metaArr) {
                        const valid = metaArr[off + 1], cost = metaArr[off + 0];
                        if (valid > 0.5 && Number.isFinite(cost)) {
                            minCost = Math.min(minCost, cost);
                            maxCost = Math.max(maxCost, cost);
                        }
                    }
                }
            }
            if (!(maxScore > minScore)) {
                minScore = 0;
                maxScore = Math.max(1, minScore + 1);
            }
            if (!(maxKL > minKL)) {
                minKL = 0;
                maxKL = Math.max(1, minKL + 1);
            }
            if (!(maxCost > minCost)) {
                minCost = 0;
                maxCost = Math.max(1, minCost + 1);
            }
            const mkVals = (a, b) => Array.from({ length: 5 }, (_, i) => a + (b - a) * (i / 4));
            __drawLegend(Math.round(W2 * 0.58), Math.round(H2 * 0.06), "score", mkVals(minScore, maxScore), __scoreColor);
            __drawLegend(Math.round(W2 * 0.06), Math.round(H2 * 0.70), "KL", mkVals(minKL, maxKL), __klColor);
            const useMSDScore = ((typeof showMSDScoreMap !== "undefined") && !!showMSDScoreMap);
            if (useMSDScore && __refreshMSDScoreDisplay() && __tauMSDDisplayPack) {
                const x0 = Math.round(W2 * 0.51), y0 = Math.round(H2 * 0.54);
                const ww = Math.max(1, Math.round(W2 * 0.49));
                const hh = Math.max(1, Math.round(H2 * 0.46));
                const tauMinNow = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0));
                const tauCount = Math.max(1, tauMaxN - tauMinNow + 1);
                hud.save();
                hud.fillStyle = "rgba(10,10,14,0.985)";
                hud.fillRect(x0, y0, ww, hh);
                const localAxis = __getMSDAxisPack();
                for (let ss = 0; ss < tauMaxN; ss++) {
                    for (let tau = tauMinNow; tau <= tauMaxN; tau++) {
                        if (ss >= tau)
                            break;
                        const idx = ss * tauMaxN + (tau - 1);
                        const off = idx * 4;
                        const ok = (__tauMSDDisplayPack[off + 2] > 0.5);
                        const good = __tauMSDDisplayPack[off + 1];
                        const tx = tau - tauMinNow;
                        const xx0 = x0 + Math.floor(tx * ww / tauCount);
                        const xx1 = x0 + Math.floor((tx + 1) * ww / tauCount);
                        const yy0 = y0 + Math.floor((tauMaxN - 1 - ss) * hh / tauMaxN);
                        const yy1 = y0 + Math.floor((tauMaxN - ss) * hh / tauMaxN);
                        if (ok) {
                            hud.fillStyle = __msdScoreColor(good);
                            hud.fillRect(xx0, yy0, Math.max(1, xx1 - xx0), Math.max(1, yy1 - yy0));
                        }
                        else if (localAxis && localAxis.valid && localAxis.valid[idx] > 0) {
                            let localMin = __tauMSDDisplayMin, localMax = __tauMSDDisplayMax;
                            const localScore = (localAxis.raw && Number.isFinite(localAxis.raw[idx])) ? localAxis.raw[idx] : 0;
                            const lo = Math.log(1 + Math.max(0, localMin));
                            const hi = Math.log(1 + Math.max(localMin + 1e-6, localMax));
                            const norm = (Math.log(1 + Math.max(0, localScore)) - lo) / Math.max(1e-6, hi - lo);
                            hud.fillStyle = __msdScoreColor(1 - Math.max(0, Math.min(1, norm)));
                            hud.fillRect(xx0, yy0, Math.max(1, xx1 - xx0), Math.max(1, yy1 - yy0));
                        }
                    }
                }
                const selTau = Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0));
                const selSub = Math.max(0, Math.min(selTau - 1, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0)));
                if (selTau >= tauMinNow && selTau <= tauMaxN) {
                    const tx = selTau - tauMinNow;
                    const xx0 = x0 + Math.floor(tx * ww / tauCount);
                    const xx1 = x0 + Math.floor((tx + 1) * ww / tauCount);
                    const yy0 = y0 + Math.floor((tauMaxN - 1 - selSub) * hh / tauMaxN);
                    const yy1 = y0 + Math.floor((tauMaxN - selSub) * hh / tauMaxN);
                    hud.fillStyle = "rgba(255,235,40,0.82)";
                    hud.fillRect(xx0, yy0, Math.max(1, xx1 - xx0), Math.max(1, yy1 - yy0));
                }
                hud.restore();
                __drawLegend(Math.round(W2 * 0.56), Math.round(H2 * 0.70), "MSD SSE", mkVals(__tauMSDDisplayMin, __tauMSDDisplayMax), (v) => {
                    const lo = Math.log(1 + Math.max(0, __tauMSDDisplayMin));
                    const hi = Math.log(1 + Math.max(__tauMSDDisplayMin + 1e-6, __tauMSDDisplayMax));
                    const norm = (Math.log(1 + Math.max(0, v)) - lo) / Math.max(1e-6, hi - lo);
                    return __msdScoreColor(1 - Math.max(0, Math.min(1, norm)));
                });
            }
            else {
                __drawLegend(Math.round(W2 * 0.56), Math.round(H2 * 0.70), "coste", mkVals(minCost, maxCost), __costColor);
            }
            const selTau = Math.max(1, ((typeof bestTau !== "undefined" ? bestTau : 1) | 0));
            const selSub = Math.max(0, Math.min(selTau - 1, ((typeof bestSubseq !== "undefined" ? bestSubseq : 0) | 0)));
            if (selTau >= Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0)) && selTau <= tauMaxN) {
                const t0 = Math.max(1, ((typeof tauMinVeces !== "undefined" ? tauMinVeces : 1) | 0)) - 1;
                const tCount = Math.max(1, tauMaxN - t0);
                const fillSelCell = (x, y, w, h) => {
                    const tx = selTau - 1 - t0;
                    const xx0 = x + Math.floor(tx * w / tCount);
                    const xx1 = x + Math.floor((tx + 1) * w / tCount);
                    const yy0 = y + Math.floor((tauMaxN - 1 - selSub) * h / tauMaxN);
                    const yy1 = y + Math.floor((tauMaxN - selSub) * h / tauMaxN);
                    hud.save();
                    hud.fillStyle = "rgba(255,235,40,0.82)";
                    hud.fillRect(xx0, yy0, Math.max(1, xx1 - xx0), Math.max(1, yy1 - yy0));
                    hud.restore();
                };
                fillSelCell(0, 0, W2, Math.round(H2 * 0.46));
                fillSelCell(0, Math.round(H2 * 0.54), Math.round(W2 * 0.49), Math.round(H2 * 0.46));
                fillSelCell(Math.round(W2 * 0.51), Math.round(H2 * 0.54), Math.round(W2 * 0.49), Math.round(H2 * 0.46));
            }
            return;
        }
        if ((__tauHudStatsFrame++ % 10) === 0) {
            __updateHudRanges();
        }
        const aRef = 2.7;
        const sRef = Math.sqrt(2 * aRef);
        const mkLabels = (r) => {
            const mid = 0.5 * (r.min + r.max);
            return [__fmtHud(r.max), __fmtHud(mid), __fmtHud(r.min)];
        };
        const mkLabelsFixed = (minV, maxV) => {
            const mid = 0.5 * (minV + maxV);
            return [__fmtHud(maxV), __fmtHud(mid), __fmtHud(minV)];
        };
        const drawAxes = (x0, y0, x1, y1, title, yLabels) => {
            const axisFont = Math.max(6, Math.round(H2 * 0.0078) + 1 - notFsDelta);
            const titleFont = Math.max(7, Math.round(H2 * 0.0085) + 1 - notFsDelta);
            const idxFont = Math.max(6, Math.round(H2 * 0.0075) + 1 - notFsDelta);
            hud.font = titleFont + "px monospace";
            hud.strokeRect(x0, y0, x1 - x0, y1 - y0);
            hud.fillText(title, x0 + 6, y0 + 12);
            const xm = Math.round((x0 + x1) * 0.5);
            const yTopTick = y0 + 3, yMidTick = Math.round((y0 + y1) * 0.5), yBotTick = y1 - 3;
            const idxY = y1 + Math.max(10, Math.round(H2 * 0.012)) - 2;
            // Eje X: etiquetas compactas y pegadas al borde inferior del panel
            hud.font = idxFont + "px monospace";
            hud.textBaseline = "top";
            hud.textAlign = "left";
            hud.fillText("idx 0 [bin]", x0 + 2, idxY);
            hud.textAlign = "center";
            hud.fillText("idx " + Math.round((nBins || 64) / 2) + " [bin]", xm, idxY);
            hud.textAlign = "right";
            hud.fillText("idx " + Math.max(0, (nBins || 64) - 1) + " [bin]", x1 - 2, idxY);
            // Eje Y: anclado a la derecha del borde izquierdo, para que el texto crezca hacia la izquierda
            hud.font = axisFont + "px monospace";
            hud.textBaseline = "middle";
            hud.textAlign = "right";
            hud.fillText(yLabels[0], x0 - 3, yTopTick);
            hud.fillText(yLabels[1], x0 - 3, yMidTick);
            hud.fillText(yLabels[2], x0 - 3, yBotTick);
            hud.beginPath();
            hud.moveTo(x0, yMidTick);
            hud.lineTo(x1, yMidTick);
            hud.globalAlpha = 0.25;
            hud.stroke();
            hud.globalAlpha = 1.0;
            hud.textAlign = "left";
            hud.textBaseline = "alphabetic";
        };
        drawAxes(xL, yTop0, xR, yTop1, "f(t): final", mkLabels(__tauHudRanges.f));
        drawAxes(xBL0, yBot0, xBL1, yBot1, "s(t): init/final", mkLabelsFixed(0, sRef));
        drawAxes(xBR0, yBot0, xBR1, yBot1, "a(t): init/final", mkLabelsFixed(0, aRef));
        drawAxes(xL, yPdf0, xR, yPdf1, "pdf: hist/init/final", mkLabels(__tauHudRanges.p));
        const __dashMode = ((typeof showMSDOverlay !== "undefined") && !!showMSDOverlay);
        // Overlay opcional MSD: original del eje x (blanco) vs simulada 1D (verde)
        if (__dashMode) {
            const srcX = (typeof datosY1 !== "undefined" && datosY1) ? (datosY1 instanceof Float32Array ? datosY1 : new Float32Array(datosY1)) : null;
            const simY = (window.simDataY) ? ((window.simDataY instanceof Float32Array) ? window.simDataY : new Float32Array(window.simDataY)) : null;
            const calcMSD1D = (x, maxTau) => {
                const n = (x.length | 0);
                const tMax = Math.max(1, Math.min(maxTau, n - 1));
                const out = new Float32Array(tMax + 1);
                out[0] = 0;
                for (let tau = 1; tau <= tMax; tau++) {
                    let acc = 0, cnt = 0;
                    for (let i = 0; i < n - tau; i++) {
                        const dx = (x[i + tau] - x[i]);
                        if (!Number.isFinite(dx))
                            continue;
                        acc += dx * dx;
                        cnt++;
                    }
                    out[tau] = (cnt > 0) ? (acc / cnt) : NaN;
                }
                return out;
            };
            if (srcX && simY) {
                const maxTau = Math.max(8, Math.min(220, Math.min(srcX.length, simY.length) - 1));
                const msdO = calcMSD1D(srcX, maxTau);
                const msdS = calcMSD1D(simY, maxTau);
                // Escala fija respecto a la MSD original:
                // el ajuste por click (a(t), s(t)) no debe modificar esta referencia visual.
                let mx = 0;
                for (let t = 1; t < msdO.length; t++) {
                    const vo = msdO[t];
                    if (Number.isFinite(vo) && vo > mx)
                        mx = vo;
                }
                mx = Math.max(mx, 1e-6);
                let mxSim = 0;
                for (let t = 1; t < msdS.length; t++) {
                    const vs = msdS[t];
                    if (Number.isFinite(vs) && vs > mxSim)
                        mxSim = vs;
                }
                const simScale = (mxSim > 1e-9) ? (mx / mxSim) : 1.0; // solo visual: ajusta verde al rango de la original
                const rw = Math.max(1, (xR - xL));
                const rh = Math.max(1, (yTop1 - yTop0));
                const xOf = (tau) => xL + (tau / maxTau) * rw;
                const yOf = (v) => yTop1 - (Math.max(0, v) / mx) * rh;
                hud.save();
                hud.setLineDash([7, 4]);
                hud.lineWidth = 1.8;
                hud.globalAlpha = 0.85;
                hud.strokeStyle = "rgba(255,255,255,0.95)";
                hud.beginPath();
                let p0 = true;
                for (let t = 0; t < msdO.length; t++) {
                    const v = msdO[t];
                    if (!Number.isFinite(v))
                        continue;
                    const xx = xOf(t), yy = yOf(v);
                    if (p0) {
                        hud.moveTo(xx, yy);
                        p0 = false;
                    }
                    else
                        hud.lineTo(xx, yy);
                }
                hud.stroke();
                hud.strokeStyle = "rgba(90,255,110,0.95)";
                hud.beginPath();
                p0 = true;
                for (let t = 0; t < msdS.length; t++) {
                    const v = msdS[t];
                    if (!Number.isFinite(v))
                        continue;
                    const xx = xOf(t), yy = yOf(v * simScale);
                    if (p0) {
                        hud.moveTo(xx, yy);
                        p0 = false;
                    }
                    else
                        hud.lineTo(xx, yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha = 1;
                hud.fillStyle = "rgba(255,255,255,0.95)";
                hud.font = Math.max(6, Math.round(H2 * 0.0076) + 1 - notFsDelta) + "px monospace";
                hud.fillText("MSD eje y: orig blanca, sim 1D verde", xL + 10, yTop0 + 38);
                hud.restore();
            }
        }
        // Overlay opcional: f_km / a_km crudos (directos de tauMom2), sin postprocesado.
        if ((typeof showRawKMOverlay !== "undefined") && !!showRawKMOverlay) {
            const bins = Math.max(2, ((typeof nBins !== "undefined" ? nBins : 64) | 0));
            // Referencia fija "real": tau=1, subseq=0 (independiente del selector actual).
            const rowY = 0;
            const rawRow = __readTexRow((typeof tauMom2 !== "undefined" ? tauMom2 : null), bins, rowY);
            if (rawRow) {
                const fkm = new Float32Array(bins);
                const akm = new Float32Array(bins);
                let mn = 1e30, mx = -1e30;
                for (let i = 0; i < bins; i++) {
                    const b = i * 4;
                    const fv = rawRow[b + 0];
                    const av = rawRow[b + 1];
                    const ff = Number.isFinite(fv) ? fv : NaN;
                    const aa = Number.isFinite(av) ? av : NaN;
                    fkm[i] = Number.isFinite(ff) ? ff : NaN;
                    akm[i] = Number.isFinite(aa) ? aa : NaN;
                    if (Number.isFinite(ff)) {
                        if (ff < mn)
                            mn = ff;
                        if (ff > mx)
                            mx = ff;
                    }
                    if (Number.isFinite(aa)) {
                        if (aa < mn)
                            mn = aa;
                        if (aa > mx)
                            mx = aa;
                    }
                }
                if (Number.isFinite(__tauHudRanges.f.min)) {
                    mn = Math.min(mn, __tauHudRanges.f.min);
                }
                if (Number.isFinite(__tauHudRanges.f.max)) {
                    mx = Math.max(mx, __tauHudRanges.f.max);
                }
                if (!(mx > mn)) {
                    mn = -1;
                    mx = 1;
                }
                const rw = Math.max(1, (xR - xL));
                const rh = Math.max(1, (yTop1 - yTop0));
                const xOf = (i) => xL + (i / (bins - 1)) * rw;
                const yOf = (v) => yTop1 - ((v - mn) / (mx - mn)) * rh;
                hud.save();
                hud.globalAlpha = 0.8;
                hud.lineWidth = 1.6;
                hud.strokeStyle = "rgba(255,255,255,0.85)";
                if (__dashMode)
                    hud.setLineDash([6, 4]);
                hud.beginPath();
                let p0 = true;
                for (let i = 0; i < bins; i++) {
                    const v = fkm[i];
                    if (!Number.isFinite(v))
                        continue;
                    const xx = xOf(i), yy = yOf(v);
                    if (p0) {
                        hud.moveTo(xx, yy);
                        p0 = false;
                    }
                    else
                        hud.lineTo(xx, yy);
                }
                hud.stroke();
                hud.setLineDash([5, 3]);
                hud.strokeStyle = "rgba(255,255,255,0.85)";
                hud.beginPath();
                p0 = true;
                for (let i = 0; i < bins; i++) {
                    const v = akm[i];
                    if (!Number.isFinite(v))
                        continue;
                    const xx = xOf(i), yy = yOf(v);
                    if (p0) {
                        hud.moveTo(xx, yy);
                        p0 = false;
                    }
                    else
                        hud.lineTo(xx, yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha = 1.0;
                hud.fillStyle = "rgba(255,255,255,0.90)";
                hud.font = Math.max(6, Math.round(H2 * 0.0076) + 1 - notFsDelta) + "px monospace";
                hud.fillText("raw f_km/a_km (tau=1)", xL + 10, yTop0 + 24);
                hud.restore();
            }
        }
        // Overlay opcional: f(t) de Least Squares de referencia (tau=1,subseq=0), toggle con 'g'.
        if ((typeof showLSFOverlay !== "undefined") && !!showLSFOverlay) {
            const bins = Math.max(2, ((typeof nBins !== "undefined" ? nBins : 64) | 0));
            const xiLS = __readTexPixel((typeof tauXiF !== "undefined" ? tauXiF : null), 0, 0); // x=tau-1=0, y=subseq=0
            if (xiLS) {
                const c0 = Number.isFinite(xiLS[0]) ? xiLS[0] : 0;
                const c1 = Number.isFinite(xiLS[1]) ? xiLS[1] : 0;
                const c2 = Number.isFinite(xiLS[2]) ? xiLS[2] : 0;
                const c3 = Number.isFinite(xiLS[3]) ? xiLS[3] : 0;
                const rw = Math.max(1, (xR - xL));
                const rh = Math.max(1, (yTop1 - yTop0));
                let mn = 1e30, mx = -1e30;
                for (let i = 0; i < bins; i++) {
                    const x = (i + 0.5) / bins;
                    const v = c0 + c1 * x + c2 * x * x + c3 * x * x * x;
                    if (!Number.isFinite(v))
                        continue;
                    if (v < mn)
                        mn = v;
                    if (v > mx)
                        mx = v;
                }
                if (!(mx > mn)) {
                    mn = -1;
                    mx = 1;
                }
                else {
                    const pad = (mx - mn) * 0.08;
                    mn -= pad;
                    mx += pad;
                }
                const xOf = (i) => xL + (i / (bins - 1)) * rw;
                const yOf = (v) => yTop1 - ((v - mn) / (mx - mn)) * rh;
                hud.save();
                hud.globalAlpha = 0.8;
                hud.lineWidth = 1.9;
                hud.strokeStyle = "rgba(255,255,255,0.92)";
                if (__dashMode)
                    hud.setLineDash([6, 4]);
                hud.beginPath();
                let p0 = true;
                for (let i = 0; i < bins; i++) {
                    const x = (i + 0.5) / bins;
                    const fLS = c0 + c1 * x + c2 * x * x + c3 * x * x * x;
                    if (!Number.isFinite(fLS))
                        continue;
                    const xx = xOf(i), yy = yOf(fLS);
                    if (p0) {
                        hud.moveTo(xx, yy);
                        p0 = false;
                    }
                    else
                        hud.lineTo(xx, yy);
                }
                hud.stroke();
                hud.setLineDash([]);
                hud.globalAlpha = 1.0;
                hud.fillStyle = "rgba(255,255,255,0.95)";
                hud.font = Math.max(6, Math.round(H2 * 0.0076) + 1 - notFsDelta) + "px monospace";
                hud.fillText("LS f(t) (tau=1)", xL + 160, yTop0 + 24);
                hud.restore();
            }
        }
        // Descripciones: una linea por grafica, solo en fullscreen.
        if (isFsNow) {
            hud.font = Math.max(7, Math.round(H2 * 0.0089) + 2 - notFsDelta) + "px monospace";
            const lineH = Math.max(8, Math.round(H2 * 0.0102) + 2 - notFsDelta);
            // Pinta bloques de texto multilinea para las descripciones de fullscreen.
            const drawLines = (x, y, lines) => {
                for (let i = 0; i < lines.length; i++) {
                    hud.fillText(lines[i], x, y + i * lineH);
                }
            };
            const dTopY = Math.min(H2 - 8, yTop1 + Math.max(17, Math.round(H2 * 0.021)) + 3);
            const dBotY = Math.min(H2 - 8, yBot1 + Math.max(17, Math.round(H2 * 0.021)) + 3);
            const dPdfY = Math.min(H2 - 6, yPdf1 + Math.max(20, Math.round(H2 * 0.023)) + 3); // +3..5px extra para no chocar con idx
            const dTop1 = "f(t): drift final reconstruido con SINDy+AFP para el modelo seleccionado; resume la tendencia neta de movimiento a lo largo del eje.";
            const dBL = [
                "s(t): amplitud previa de difusion dependiente de posicion.",
                "Interpretacion practica: cuanto crece el ruido local del proceso.",
                "Si init/final cambian mucho, ese tau-subseq no es estable.",
                "Si son parecidas, la identificacion es robusta."
            ];
            const dBR = [
                "a(t)=0.5*s(t)^2: difusion efectiva fisica, siempre no negativa.",
                "Valores altos: mayor dispersion de trayectorias en esa zona.",
                "Valores bajos: movimiento mas confinado o menos aleatorio.",
                "Comparar init/final indica correccion del modelo."
            ];
            const dPDF = "pdf: cian=histograma observado, magenta/naranja=estacionaria init/final. Si la final se pega al cian, este (tau,subseq) describe mejor la cromatina. tau=" + (bestTau || 1) + " subseq=" + (bestSubseq || 0) + " (t:curvas r:fp)";
            const dUnits = "Unidades: f [u_x/dt]   s [u_x/sqrt(dt)]   a [u_x^2/dt]   pdf [1/u_x]";
            hud.fillText(dTop1, xL + 34, dTopY); // mas a la derecha para no chocar con labels
            drawLines(xBL0 + 8, dBotY, dBL);
            drawLines(xBR0 + 8, dBotY, dBR);
            hud.fillText(dPDF, xL + 10, dPdfY);
            hud.fillText(dUnits, xL + 10, dPdfY + lineH);
        }
        hud.restore();
    };
    //? - Fullscreen y ajuste del overlay
    const __fsTargetC3 = __c3Host;
    const __fsHostIsCanvas = (__fsTargetC3 === canvas);
    const __baseHostStyle = __fsHostIsCanvas ? null : {
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
    const __baseCanvasW = canvas.width;
    const __baseCanvasH = canvas.height;
    const __baseCanvasStyle = {
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
    const __baseBodyOverflow = document.body.style.overflow || "";
    const __baseDocOverflow = document.documentElement.style.overflow || "";
    // Ajusta estilos de host y canvas al entrar o salir de fullscreen.
    const __applyCanvasFullscreenC3 = () => {
        const isFs = (document.fullscreenElement === __fsTargetC3);
        if (isFs) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            if (!__fsHostIsCanvas) {
                __c3Host.style.position = "fixed";
                __c3Host.style.left = "0";
                __c3Host.style.top = "0";
                __c3Host.style.width = "100vw";
                __c3Host.style.height = "100vh";
                __c3Host.style.maxWidth = "100vw";
                __c3Host.style.maxHeight = "100vh";
                __c3Host.style.zIndex = "999998";
                __c3Host.style.display = "block";
                __c3Host.style.margin = "0";
                __c3Host.style.padding = "0";
            }
            canvas.style.position = __fsHostIsCanvas ? "fixed" : "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.maxWidth = "100vw";
            canvas.style.maxHeight = "100vh";
            canvas.style.zIndex = "999999";
            canvas.style.display = "block";
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        else {
            document.body.style.overflow = __baseBodyOverflow;
            document.documentElement.style.overflow = __baseDocOverflow;
            if (!__fsHostIsCanvas && __baseHostStyle) {
                __c3Host.style.position = __baseHostStyle.position;
                __c3Host.style.top = __baseHostStyle.top;
                __c3Host.style.left = __baseHostStyle.left;
                __c3Host.style.width = __baseHostStyle.width;
                __c3Host.style.height = __baseHostStyle.height;
                __c3Host.style.maxWidth = __baseHostStyle.maxWidth;
                __c3Host.style.maxHeight = __baseHostStyle.maxHeight;
                __c3Host.style.zIndex = __baseHostStyle.zIndex;
                __c3Host.style.display = __baseHostStyle.display;
                __c3Host.style.margin = __baseHostStyle.margin;
                __c3Host.style.padding = __baseHostStyle.padding;
            }
            canvas.style.position = __baseCanvasStyle.position;
            canvas.style.top = __baseCanvasStyle.top;
            canvas.style.left = __baseCanvasStyle.left;
            canvas.style.width = __baseCanvasStyle.width;
            canvas.style.height = __baseCanvasStyle.height;
            canvas.style.maxWidth = __baseCanvasStyle.maxWidth;
            canvas.style.maxHeight = __baseCanvasStyle.maxHeight;
            canvas.style.zIndex = __baseCanvasStyle.zIndex;
            canvas.style.display = __baseCanvasStyle.display;
            canvas.width = __baseCanvasW;
            canvas.height = __baseCanvasH;
        }
        __syncTauHud();
    };
    __ensureTauHud();
    __syncTauHud();
    canvas.addEventListener("dblclick", () => {
        if (document.fullscreenElement)
            document.exitFullscreen?.();
        else
            openFullscreen(__fsTargetC3);
        setTimeout(__applyCanvasFullscreenC3, 0);
    });
    document.addEventListener("fullscreenchange", () => { __applyCanvasFullscreenC3(); __syncTauHud(); });
    window.addEventListener("resize", () => { __applyCanvasFullscreenC3(); __syncTauHud(); });
    //</Pre>
    var lastUsedProgram = null;
    var lastFillerProgram = null;
    void lastFillerProgram;
    var __globalBlocks = [];
    var __transpiledShaderFilterRules = [{ stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT"), replacement: () => (("const int TAU_F_TERMS = " + String(tauFTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT"), replacement: () => (("const int TAU_S_TERMS = " + String(tauSTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT"), replacement: () => (("const int TAU_TOTAL_TERMS = " + String(tauTotalTerms) + ";")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_F_BASIS_BODY"), replacement: () => ((tauBasisBody(tauFDegrees) + " return 0.0;")) }, { stage: "both", filePattern: () => ("tau/"), searchPattern: () => ("return 0.0; //Var@TAU_S_BASIS_BODY"), replacement: () => ((tauBasisBody(tauSDegrees) + " return 0.0;")) }];
    // Aplica reglas de sustitucion sobre en el texto del shader.
    // La lista de reglas se construye una sola vez al generar el parser; aqui solo
    // resolvemos si una regla afecta a este archivo y hacemos el replace correspondiente.
    var __makeTranspiledShaderFilter = (stage, filePathRaw) => {
        return (source) => {
            // 1) Normalizacion basica. Evita fallos si el cargador entrega null,
            // undefined o cualquier valor no string durante una recompilacion parcial.
            let out = String(source ?? "");
            const filePath = String(filePathRaw ?? "");
            // 2) Filtro por etapa y por ruta. Las reglas de otros shaders no deben
            // tocar este fichero aunque compartan el mismo placeholder.
            for (const rule of __transpiledShaderFilterRules) {
                if (!rule)
                    continue;
                if (rule.stage !== "both" && rule.stage !== stage)
                    continue;
                const filePattern = typeof rule.filePattern === "function" ? rule.filePattern() : rule.filePattern;
                if (filePattern !== undefined && filePattern !== null && filePattern !== "*") {
                    const matchesFile = (filePattern instanceof RegExp)
                        ? ((filePattern.lastIndex = 0), filePattern.test(filePath))
                        : filePath.includes(String(filePattern));
                    if (!matchesFile)
                        continue;
                }
                // 3) Sustitucion. Si el patron es regex lo clonamos para no arrastrar
                // estado interno entre llamadas consecutivas. Si es texto plano usamos
                // split/join porque mantiene el codigo generado corto y predecible.
                const searchPattern = typeof rule.searchPattern === "function" ? rule.searchPattern() : rule.searchPattern;
                const search = (searchPattern instanceof RegExp)
                    ? new RegExp(searchPattern.source, searchPattern.flags)
                    : searchPattern;
                const replacementValue = typeof rule.replacement === "function" ? rule.replacement() : rule.replacement;
                const replacement = String(replacementValue ?? "");
                out = (search instanceof RegExp)
                    ? out.replace(search, replacement)
                    : out.split(String(search ?? "")).join(replacement);
            }
            return out;
        };
    };
    const __runtimeLetCache = new Map();
    const __coerceRuntimeLetValue = (raw) => {
        const text = String(raw ?? "").trim();
        if (!text)
            return undefined;
        if (/^(true|false)$/i.test(text))
            return text.toLowerCase() === "true";
        if (/^null$/i.test(text))
            return null;
        if (/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text))
            return Number(text);
        if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
            try {
                return JSON.parse(text);
            }
            catch { }
        }
        if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
            return text.slice(1, -1);
        }
        return text;
    };
    const __mergeRuntimeLetArray = (arr) => {
        const out = { __array: arr };
        if (arr.every(item => item && typeof item === "object" && !Array.isArray(item))) {
            for (const item of arr)
                Object.assign(out, item);
        }
        return out;
    };
    const __parseRuntimeLetText = (text) => {
        const out = {};
        const chunks = String(text ?? "").split(/[\r\n]+/).flatMap(line => line.split(","));
        for (const chunk of chunks) {
            const entry = chunk.trim();
            if (!entry)
                continue;
            const eq = entry.indexOf("=");
            if (eq < 0) {
                out[entry] = true;
                continue;
            }
            const key = entry.slice(0, eq).trim();
            const value = entry.slice(eq + 1).trim();
            if (key)
                out[key] = __coerceRuntimeLetValue(value);
        }
        return out;
    };
    const __loadRuntimeLetSource = async (sourcePath) => {
        const rawPath = String(sourcePath ?? "").trim();
        if (!rawPath)
            return {};
        const resolvedPath = new URL(rawPath, import.meta.url).toString();
        if (__runtimeLetCache.has(resolvedPath))
            return __runtimeLetCache.get(resolvedPath);
        const response = await fetch(resolvedPath);
        if (!response.ok)
            throw new Error("Could not load let source: " + rawPath + " (" + response.status + ")");
        let parsed = {};
        if (/\.json(?:$|\?)/i.test(rawPath)) {
            const json = await response.json();
            if (Array.isArray(json))
                parsed = __mergeRuntimeLetArray(json);
            else if (json && typeof json === "object")
                parsed = json;
            else
                parsed = { __array: json };
        }
        else {
            parsed = __parseRuntimeLetText(await response.text());
        }
        __runtimeLetCache.set(resolvedPath, parsed);
        return parsed;
    };
    var tauSignalData = datosY1;
    var tauMaxVeces = 10;
    var tauMinVeces = 1;
    var chromatinIndex = 1;
    var nBins = 64;
    var tauEStar = 1.0;
    var dtSample = 1.0;
    var recomputeTau = false;
    var tauDebugFrames = 4;
    var c2DrawLogFrames = 3;
    var bestTau = 1;
    var bestSubseq = 0;
    var autoPickBest = true;
    var useLSView = false;
    var afpLrF = 0.04;
    var afpLrS = 0.06;
    var afpL1F = 0.0004;
    var afpL1S = 0.0002;
    var afpIters = 5;
    var afpOptL2F = 0.0008;
    var afpOptL2S = 0.0008;
    var nelderShift = 0.02;
    var nelderAlpha = 1.0;
    var nelderGamma = 2.0;
    var nelderRho = 0.5;
    var nelderSigma = 0.5;
    var nelderIters = 12;
    var nelderChunkIters = 5;
    var nelderStopEps = 1e-4;
    var tauAdjTauBatch = 1;
    var tauExpTerms = 4;
    var tauArnoldiReorth = 3;
    var tauArnoldiResidTol = 0.2;
    var tauKLReg = 0.05;
    var steadyFPSolverMode = "peak_anchor_mass_norm";
    var useAdjointAFP = true;
    var keepTopPercent = 20;
    var useFPFilter = true;
    var fpLogSpanMax = 42;
    var modelKLSpanMax = 42;
    var showFPStationary = true;
    var showTauCurves = false;
    var showRawKMOverlay = false;
    var showLSFOverlay = false;
    var showMSDOverlay = false;
    var showMSDScoreMap = false;
    var scoreWCost = 0.55;
    var scoreWKL = 0.35;
    var scoreWSpan = 0.10;
    var scoreKLMax = 3.0;
    var scoreMaxCut = 0.75;
    var useScoreSelection = true;
    var logTopModels = false;
    var tauModelStamp = 0;
    var tauMSDMaxLag = 64;
    var tauMSDChunkBudgetMs = 8;
    var tauBasisMode = "pca";
    var tauPcaSecondaryMode = "perp90";
    var tauFDegrees = [0, 1, 2, 3];
    var tauSDegrees = [0];
    var tauPolyExpr = (deg) => deg < 0 ? "0.0" : deg === 0 ? "1.0" : deg === 1 ? "x" : Array(deg).fill("x").join("*");
    var tauFTerms = tauFDegrees.length;
    var tauSTerms = tauSDegrees.length;
    var tauTotalTerms = tauFTerms + tauSTerms;
    var tauBasisBody = (degrees) => degrees.map((d, i) => "if(termIdx==" + i + ") return " + tauPolyExpr(d) + ";").join(" ");
    if (tauTotalTerms > 8)
        throw new Error("tauTotalTerms debe ser <= 8 con el empaquetado actual (dos RGBA).");
    var TauFloatTex = {
        format: TexExamples.RGBAFloat16,
        filter_min: "NEAREST",
        filter_mag: "NEAREST",
        wrap_S: "CLAMP",
        wrap_T: "CLAMP"
    };
    var progTauMom = webglMan.program(-1, "tau/01_moments/1_tauMaxVeces");
    lastUsedProgram = progTauMom;
    var tauMom = progTauMom;
    await tauMom.loadProgram(tauMom.vertPath, tauMom.fragPath, __makeTranspiledShaderFilter("vert", tauMom.vertPath), __makeTranspiledShaderFilter("frag", tauMom.fragPath));
    await tauMom.use?.();
    lastUsedProgram = tauMom;
    tauMom.createVAO().bind();
    var extC2 = gl.getExtension("EXT_color_buffer_float");
    if (!extC2) {
        console.log("EXT_color_buffer_float no soportado en C2");
    }
    var xTex = tauMom.createTexture2D("datosX1", [NMuestras1, 1], TexExamples.RFloat, tauSignalData, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit10");
    var yTex = tauMom.createTexture2D("datosY1", [NMuestras1, 1], TexExamples.RFloat, datosY1, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit11");
    var tauMom1 = tauMom.createTexture2D("tauMom1", [nBins, tauMaxVeces * tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit14");
    var tauMom2 = tauMom.createTexture2D("tauMom2", [nBins, tauMaxVeces * tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], "TexUnit15");
    var tauXi = webglMan.program(-1, "tau/02_ls/1_tauXiLS");
    await tauXi.loadProgram(tauXi.vertPath, tauXi.fragPath, __makeTranspiledShaderFilter("vert", tauXi.vertPath), __makeTranspiledShaderFilter("frag", tauXi.fragPath));
    await tauXi.use?.();
    lastUsedProgram = tauXi;
    tauXi.createVAO().bind();
    var tauXiF = tauXi.createTexture2D("tauXiF", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit12");
    var tauXiS = tauXi.createTexture2D("tauXiS", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit13");
    var tauXiMeta = tauXi.createTexture2D("tauXiMeta", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit16");
    var tauAFP = webglMan.program(-1, "tau/03_afp/1_tauAFP0");
    await tauAFP.loadProgram(tauAFP.vertPath, tauAFP.fragPath, __makeTranspiledShaderFilter("vert", tauAFP.vertPath), __makeTranspiledShaderFilter("frag", tauAFP.fragPath));
    await tauAFP.use?.();
    lastUsedProgram = tauAFP;
    tauAFP.createVAO().bind();
    var tauXiFOpt = tauAFP.createTexture2D("tauXiFOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit18");
    var tauXiSOpt = tauAFP.createTexture2D("tauXiSOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit19");
    var tauXiMetaOpt = tauAFP.createTexture2D("tauXiMetaOpt", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit20");
    var tauAFPOpt = webglMan.program(-1, "tau/03_afp/2_tauAFPOpt");
    await tauAFPOpt.loadProgram(tauAFPOpt.vertPath, tauAFPOpt.fragPath, __makeTranspiledShaderFilter("vert", tauAFPOpt.vertPath), __makeTranspiledShaderFilter("frag", tauAFPOpt.fragPath));
    await tauAFPOpt.use?.();
    lastUsedProgram = tauAFPOpt;
    tauAFPOpt.createVAO().bind();
    var tauXiFFinal = tauAFPOpt.createTexture2D("tauXiFFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit25");
    var tauXiSFinal = tauAFPOpt.createTexture2D("tauXiSFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit26");
    var tauXiMetaFinal = tauAFPOpt.createTexture2D("tauXiMetaFinal", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit27");
    var tauAdjCost = webglMan.program(-1, "tau/03_afp/3_tauAdjointCost");
    await tauAdjCost.loadProgram(tauAdjCost.vertPath, tauAdjCost.fragPath, __makeTranspiledShaderFilter("vert", tauAdjCost.vertPath), __makeTranspiledShaderFilter("frag", tauAdjCost.fragPath));
    await tauAdjCost.use?.();
    lastUsedProgram = tauAdjCost;
    tauAdjCost.createVAO().bind();
    var tauNMSimplexInit = webglMan.program(-1, "tau/03_afp/4_tauNMSimplexInit");
    await tauNMSimplexInit.loadProgram(tauNMSimplexInit.vertPath, tauNMSimplexInit.fragPath, __makeTranspiledShaderFilter("vert", tauNMSimplexInit.vertPath), __makeTranspiledShaderFilter("frag", tauNMSimplexInit.fragPath));
    await tauNMSimplexInit.use?.();
    lastUsedProgram = tauNMSimplexInit;
    tauNMSimplexInit.createVAO().bind();
    var tauNMXiF0 = tauNMSimplexInit.createTexture2D("tauNMXiF0", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit4");
    var tauNMXiS0 = tauNMSimplexInit.createTexture2D("tauNMXiS0", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit5");
    var tauNMMeta0 = tauNMSimplexInit.createTexture2D("tauNMMeta0", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit6");
    var tauNMXiF1 = tauNMSimplexInit.createTexture2D("tauNMXiF1", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit7");
    var tauNMXiS1 = tauNMSimplexInit.createTexture2D("tauNMXiS1", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit8");
    var tauNMMeta1 = tauNMSimplexInit.createTexture2D("tauNMMeta1", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit9");
    var tauNMCost = tauNMSimplexInit.createTexture2D("tauNMCost", [tauMaxVeces, tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit11");
    var tauNMStep = webglMan.program(-1, "tau/03_afp/5_tauNMStep");
    await tauNMStep.loadProgram(tauNMStep.vertPath, tauNMStep.fragPath, __makeTranspiledShaderFilter("vert", tauNMStep.vertPath), __makeTranspiledShaderFilter("frag", tauNMStep.fragPath));
    await tauNMStep.use?.();
    lastUsedProgram = tauNMStep;
    tauNMStep.createVAO().bind();
    var tauNMFinalize = webglMan.program(-1, "tau/03_afp/6_tauNMFinalize");
    await tauNMFinalize.loadProgram(tauNMFinalize.vertPath, tauNMFinalize.fragPath, __makeTranspiledShaderFilter("vert", tauNMFinalize.vertPath), __makeTranspiledShaderFilter("frag", tauNMFinalize.fragPath));
    await tauNMFinalize.use?.();
    lastUsedProgram = tauNMFinalize;
    tauNMFinalize.createVAO().bind();
    var tauAdjFields = webglMan.program(-1, "tau/03_afp/7_tauAdjointFields");
    await tauAdjFields.loadProgram(tauAdjFields.vertPath, tauAdjFields.fragPath, __makeTranspiledShaderFilter("vert", tauAdjFields.vertPath), __makeTranspiledShaderFilter("frag", tauAdjFields.fragPath));
    await tauAdjFields.use?.();
    lastUsedProgram = tauAdjFields;
    tauAdjFields.createVAO().bind();
    var tauAdjFieldsTex = tauAdjFields.createTexture2D("tauAdjFields", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit28");
    var tauAdjDiffOps = webglMan.program(-1, "tau/03_afp/8_tauAdjointDiffOps");
    await tauAdjDiffOps.loadProgram(tauAdjDiffOps.vertPath, tauAdjDiffOps.fragPath, __makeTranspiledShaderFilter("vert", tauAdjDiffOps.vertPath), __makeTranspiledShaderFilter("frag", tauAdjDiffOps.fragPath));
    await tauAdjDiffOps.use?.();
    lastUsedProgram = tauAdjDiffOps;
    tauAdjDiffOps.createVAO().bind();
    var tauAdjDiffOpsTex = tauAdjDiffOps.createTexture2D("tauAdjDiffOps", [nBins * nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit29");
    var tauAdjOperator = webglMan.program(-1, "tau/03_afp/9_tauAdjointOperator");
    await tauAdjOperator.loadProgram(tauAdjOperator.vertPath, tauAdjOperator.fragPath, __makeTranspiledShaderFilter("vert", tauAdjOperator.vertPath), __makeTranspiledShaderFilter("frag", tauAdjOperator.fragPath));
    await tauAdjOperator.use?.();
    lastUsedProgram = tauAdjOperator;
    tauAdjOperator.createVAO().bind();
    var tauAdjOperatorTex = tauAdjOperator.createTexture2D("tauAdjOperator", [nBins * nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit30");
    var tauAdjExp = webglMan.program(-1, "tau/03_afp/10_tauAdjointExp");
    await tauAdjExp.loadProgram(tauAdjExp.vertPath, tauAdjExp.fragPath, __makeTranspiledShaderFilter("vert", tauAdjExp.vertPath), __makeTranspiledShaderFilter("frag", tauAdjExp.fragPath));
    await tauAdjExp.use?.();
    lastUsedProgram = tauAdjExp;
    tauAdjExp.createVAO().bind();
    var tauAdjExpTex = tauAdjExp.createTexture2D("tauAdjExp", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit31");
    var tauSteadyFP = webglMan.program(-1, "tau/03_afp/11_tauSteadyFP");
    await tauSteadyFP.loadProgram(tauSteadyFP.vertPath, tauSteadyFP.fragPath, __makeTranspiledShaderFilter("vert", tauSteadyFP.vertPath), __makeTranspiledShaderFilter("frag", tauSteadyFP.fragPath));
    await tauSteadyFP.use?.();
    lastUsedProgram = tauSteadyFP;
    tauSteadyFP.createVAO().bind();
    var tauSteadyFPTex = tauSteadyFP.createTexture2D("tauSteadyFP", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit27");
    var tauKrylovInit = webglMan.program(-1, "tau/03_afp/12_tauKrylovInit");
    await tauKrylovInit.loadProgram(tauKrylovInit.vertPath, tauKrylovInit.fragPath, __makeTranspiledShaderFilter("vert", tauKrylovInit.vertPath), __makeTranspiledShaderFilter("frag", tauKrylovInit.fragPath));
    await tauKrylovInit.use?.();
    lastUsedProgram = tauKrylovInit;
    tauKrylovInit.createVAO().bind();
    var tauKrylov0Tex = tauKrylovInit.createTexture2D("tauKrylov0", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit23");
    var tauKrylovStep = webglMan.program(-1, "tau/03_afp/13_tauKrylovStep");
    await tauKrylovStep.loadProgram(tauKrylovStep.vertPath, tauKrylovStep.fragPath, __makeTranspiledShaderFilter("vert", tauKrylovStep.vertPath), __makeTranspiledShaderFilter("frag", tauKrylovStep.fragPath));
    await tauKrylovStep.use?.();
    lastUsedProgram = tauKrylovStep;
    tauKrylovStep.createVAO().bind();
    var tauKrylov1Tex = tauKrylovStep.createTexture2D("tauKrylov1", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit24");
    var tauKrylov2Tex = tauKrylovStep.createTexture2D("tauKrylov2", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit25");
    var tauKrylov3Tex = tauKrylovStep.createTexture2D("tauKrylov3", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit26");
    var tauKrylov4Tex = tauKrylovStep.createTexture2D("tauKrylov4", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit2");
    var tauKrylov5Tex = tauKrylovStep.createTexture2D("tauKrylov5", [nBins, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit3");
    var tauArnoldiCoeff = webglMan.program(-1, "tau/03_afp/14_tauArnoldiCoeff");
    await tauArnoldiCoeff.loadProgram(tauArnoldiCoeff.vertPath, tauArnoldiCoeff.fragPath, __makeTranspiledShaderFilter("vert", tauArnoldiCoeff.vertPath), __makeTranspiledShaderFilter("frag", tauArnoldiCoeff.fragPath));
    await tauArnoldiCoeff.use?.();
    lastUsedProgram = tauArnoldiCoeff;
    tauArnoldiCoeff.createVAO().bind();
    var tauArnoldiCoeffTex = tauArnoldiCoeff.createTexture2D("tauArnoldiCoeff", [14, tauAdjTauBatch * tauMaxVeces * 9], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit22");
    var tauStats = webglMan.program(-1, "tau/04_stats_mask/1_tauModelStats");
    await tauStats.loadProgram(tauStats.vertPath, tauStats.fragPath, __makeTranspiledShaderFilter("vert", tauStats.vertPath), __makeTranspiledShaderFilter("frag", tauStats.fragPath));
    await tauStats.use?.();
    lastUsedProgram = tauStats;
    tauStats.createVAO().bind();
    var tauStatsTex = tauStats.createTexture2D("tauStats", [1, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit21");
    var tauMask = webglMan.program(-1, "tau/04_stats_mask/2_tauModelMask");
    await tauMask.loadProgram(tauMask.vertPath, tauMask.fragPath, __makeTranspiledShaderFilter("vert", tauMask.vertPath), __makeTranspiledShaderFilter("frag", tauMask.fragPath));
    await tauMask.use?.();
    lastUsedProgram = tauMask;
    tauMask.createVAO().bind();
    var tauMaskTex = tauMask.createTexture2D("tauMask", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit22");
    var tauFP = webglMan.program(-1, "tau/05_filters/1_tauFPProxy");
    await tauFP.loadProgram(tauFP.vertPath, tauFP.fragPath, __makeTranspiledShaderFilter("vert", tauFP.vertPath), __makeTranspiledShaderFilter("frag", tauFP.fragPath));
    await tauFP.use?.();
    lastUsedProgram = tauFP;
    tauFP.createVAO().bind();
    var tauFPTex = tauFP.createTexture2D("tauFP", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit23");
    var tauKL = webglMan.program(-1, "tau/05_filters/2_tauModelKL");
    await tauKL.loadProgram(tauKL.vertPath, tauKL.fragPath, __makeTranspiledShaderFilter("vert", tauKL.vertPath), __makeTranspiledShaderFilter("frag", tauKL.fragPath));
    await tauKL.use?.();
    lastUsedProgram = tauKL;
    tauKL.createVAO().bind();
    var tauKLTex = tauKL.createTexture2D("tauKL", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit4");
    var tauScore = webglMan.program(-1, "tau/05_filters/3_tauModelScore");
    await tauScore.loadProgram(tauScore.vertPath, tauScore.fragPath, __makeTranspiledShaderFilter("vert", tauScore.vertPath), __makeTranspiledShaderFilter("frag", tauScore.fragPath));
    await tauScore.use?.();
    lastUsedProgram = tauScore;
    tauScore.createVAO().bind();
    var tauScoreTex = tauScore.createTexture2D("tauScore", [tauMaxVeces, tauMaxVeces], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit5");
    var tauBest = webglMan.program(-1, "tau/06_select/1_tauBestModel");
    await tauBest.loadProgram(tauBest.vertPath, tauBest.fragPath, __makeTranspiledShaderFilter("vert", tauBest.vertPath), __makeTranspiledShaderFilter("frag", tauBest.fragPath));
    await tauBest.use?.();
    lastUsedProgram = tauBest;
    tauBest.createVAO().bind();
    var tauBestTex = tauBest.createTexture2D("tauBest", [1, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit17");
    var tauSindy = webglMan.program(-1, "tau/07_fields/1_tauSindyFields");
    await tauSindy.loadProgram(tauSindy.vertPath, tauSindy.fragPath, __makeTranspiledShaderFilter("vert", tauSindy.vertPath), __makeTranspiledShaderFilter("frag", tauSindy.fragPath));
    await tauSindy.use?.();
    lastUsedProgram = tauSindy;
    tauSindy.createVAO().bind();
    var tauSindyTex = tauSindy.createTexture2D("tauSindy", [nBins, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit6");
    var tauSindyInitTex = tauSindy.createTexture2D("tauSindyInit", [nBins, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit7");
    var tauSindyTau1RefTex = tauSindy.createTexture2D("tauSindyTau1Ref", [nBins, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit8");
    var tauFPStat = webglMan.program(-1, "tau/07_fields/2_tauFPStationary");
    await tauFPStat.loadProgram(tauFPStat.vertPath, tauFPStat.fragPath, __makeTranspiledShaderFilter("vert", tauFPStat.vertPath), __makeTranspiledShaderFilter("frag", tauFPStat.fragPath));
    await tauFPStat.use?.();
    lastUsedProgram = tauFPStat;
    tauFPStat.createVAO().bind();
    var tauFPStatTex = tauFPStat.createTexture2D("tauFPStat", [nBins, 1], (TauFloatTex?.format ?? TexExamples.RGBAFloat), null, [(TauFloatTex?.filter_min ?? TauFloatTex?.filter ?? TauFloatTex?.minFilter ?? "NEAREST"), (TauFloatTex?.filter_mag ?? TauFloatTex?.filter ?? TauFloatTex?.magFilter ?? "NEAREST"), (TauFloatTex?.wrap_S ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapS ?? "CLAMP"), (TauFloatTex?.wrap_T ?? TauFloatTex?.wrap ?? TauFloatTex?.wrapT ?? "CLAMP")], "TexUnit24");
    var drawTau = webglMan.program(-1, "tau/08_draw/1_drawTauMaxVeces");
    await drawTau.loadProgram(drawTau.vertPath, drawTau.fragPath, __makeTranspiledShaderFilter("vert", drawTau.vertPath), __makeTranspiledShaderFilter("frag", drawTau.fragPath));
    await drawTau.use?.();
    lastUsedProgram = drawTau;
    drawTau.createVAO().bind();
    drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
    drawTau.bindTexName2TexUnit("tauBest", "TexUnit17");
    drawTau.bindTexName2TexUnit("tauSindy", "TexUnit6");
    drawTau.bindTexName2TexUnit("tauSindyInit", "TexUnit7");
    drawTau.bindTexName2TexUnit("tauSindyTau1Ref", "TexUnit8");
    drawTau.bindTexName2TexUnit("tauModelMask", "TexUnit22");
    drawTau.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
    drawTau.bindTexName2TexUnit("tauFPStationary", "TexUnit24");
    drawTau.bindTexName2TexUnit("tauModelKL", "TexUnit4");
    drawTau.bindTexName2TexUnit("tauModelScore", "TexUnit5");
    drawTau.bindTexName2TexUnit("tauStats", "TexUnit21");
    drawTau.use?.();
    drawTau.uNum("tauMax", false, false).set((tauMaxVeces));
    drawTau.use?.();
    drawTau.uNum("tauMin", false, false).set((tauMinVeces));
    drawTau.use?.();
    drawTau.uNum("nBins", false, false).set((nBins));
    drawTau.use?.();
    drawTau.uNum("bestTau", false, false).set((bestTau));
    drawTau.use?.();
    drawTau.uNum("bestSubseq", false, false).set((bestSubseq));
    drawTau.use?.();
    drawTau.uNum("showTauCurves", false, false).set((!!showTauCurves ? 1 : 0));
    drawTau.use?.();
    drawTau.uNum("showFPStationary", false, false).set((!!showFPStationary ? 1 : 0));
    drawTau.use?.();
    drawTau.uNum("showLSOverlay", false, false).set((!!showLSFOverlay ? 1 : 0));
    drawTau.isDepthTest = false;
    var __globalBlockFn_0 = async (dt) => {
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestSubseq >= bestTau) {
            bestSubseq = (Math.max(0, bestTau - 1));
        }
        if (recomputeTau) {
            console.log("C2 recomputeTau=true -> s1 tauMaxVeces + s2 tauXiLS + s2.5 tauAFP0 + s2.6 tauAFPOpt + s2.7 stats/mask + s2.8 fpProxy + s2.9 modelKL/score + s3 bestModel + s4 sindy + s4.5 fpStationary");
            await tauMom.use?.();
            lastUsedProgram = tauMom;
            tauMom.use?.();
            tauMom.uNum("nSamples", false, false).set((NMuestras1));
            tauMom.use?.();
            tauMom.uNum("tauMax", false, false).set((tauMaxVeces));
            tauMom.use?.();
            tauMom.uNum("tauMin", false, false).set((tauMinVeces));
            tauMom.use?.();
            tauMom.uNum("nBins", false, false).set((nBins));
            tauMom.use?.();
            tauMom.uNum("dtSample", true, false).set((dtSample));
            tauMom.use?.();
            tauMom.uNum("tauEStar", true, false).set((tauEStar));
            tauMom.bindTexName2TexUnit("datosX1", "TexUnit10");
            var tauMomFBO = tauMom.cFrameBuffer().bind(["ColAtch0", "ColAtch1"]);
            tauMomFBO.bindColorBuffer(tauMom1, "ColAtch0");
            tauMomFBO.bindColorBuffer(tauMom2, "ColAtch1");
            tauMom.setViewport(0, 0, nBins, tauMaxVeces * tauMaxVeces);
            tauMom.drawArrays("TRIANGLES", 0, 6);
            await tauXi.use?.();
            lastUsedProgram = tauXi;
            tauXi.use?.();
            tauXi.uNum("tauMax", false, false).set((tauMaxVeces));
            tauXi.use?.();
            tauXi.uNum("tauMin", false, false).set((tauMinVeces));
            tauXi.use?.();
            tauXi.uNum("nBins", false, false).set((nBins));
            tauXi.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauXi.bindTexName2TexUnit("tauMom2", "TexUnit15");
            var tauXiFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
            tauXiFBO.bindColorBuffer(tauXiF, "ColAtch0");
            tauXiFBO.bindColorBuffer(tauXiS, "ColAtch1");
            tauXiFBO.bindColorBuffer(tauXiMeta, "ColAtch2");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            await tauAFP.use?.();
            lastUsedProgram = tauAFP;
            tauAFP.use?.();
            tauAFP.uNum("tauMax", false, false).set((tauMaxVeces));
            tauAFP.use?.();
            tauAFP.uNum("tauMin", false, false).set((tauMinVeces));
            tauAFP.use?.();
            tauAFP.uNum("nBins", false, false).set((nBins));
            tauAFP.use?.();
            tauAFP.uNum("lrF", true, false).set((afpLrF));
            tauAFP.use?.();
            tauAFP.uNum("lrS", true, false).set((afpLrS));
            tauAFP.use?.();
            tauAFP.uNum("l1F", true, false).set((afpL1F));
            tauAFP.use?.();
            tauAFP.uNum("l1S", true, false).set((afpL1S));
            tauAFP.use?.();
            tauAFP.uNum("nIter", false, false).set((afpIters));
            tauAFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauAFP.bindTexName2TexUnit("tauMom2", "TexUnit15");
            tauAFP.bindTexName2TexUnit("tauXiF", "TexUnit12");
            tauAFP.bindTexName2TexUnit("tauXiS", "TexUnit13");
            tauAFP.bindTexName2TexUnit("tauXiMeta", "TexUnit16");
            var tauAFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
            tauAFPFBO.bindColorBuffer(tauXiFOpt, "ColAtch0");
            tauAFPFBO.bindColorBuffer(tauXiSOpt, "ColAtch1");
            tauAFPFBO.bindColorBuffer(tauXiMetaOpt, "ColAtch2");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            await tauNMSimplexInit.use?.();
            lastUsedProgram = tauNMSimplexInit;
            tauNMSimplexInit.use?.();
            tauNMSimplexInit.uNum("tauMax", false, false).set((tauMaxVeces));
            tauNMSimplexInit.use?.();
            tauNMSimplexInit.uNum("tauMin", false, false).set((tauMinVeces));
            tauNMSimplexInit.use?.();
            tauNMSimplexInit.uNum("nelderShift", true, false).set((nelderShift));
            tauNMSimplexInit.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
            tauNMSimplexInit.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
            tauNMSimplexInit.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
            var tauNMInitFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
            tauNMInitFBO.bindColorBuffer(tauNMXiF0, "ColAtch0");
            tauNMInitFBO.bindColorBuffer(tauNMXiS0, "ColAtch1");
            tauNMInitFBO.bindColorBuffer(tauNMMeta0, "ColAtch2");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces * 9]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            var tauNMReadF = tauNMXiF0;
            var tauNMReadS = tauNMXiS0;
            var tauNMReadM = tauNMMeta0;
            var tauNMWriteF = tauNMXiF1;
            var tauNMWriteS = tauNMXiS1;
            var tauNMWriteM = tauNMMeta1;
            var tauAFPOptDone = false;
            var tauAFPOptPass = 0;
            var tauAFPOptMaxPasses = (Math.max(1, ~~nelderIters));
            var tauAFPOptCheckEvery = (Math.max(1, ~~nelderChunkIters));
            while (tauAFPOptPass < tauAFPOptMaxPasses && !tauAFPOptDone) {
                var tauAFPOptChunk = (Math.min(tauAFPOptCheckEvery, tauAFPOptMaxPasses - tauAFPOptPass));
                var tauNMInner = 0;
                while (tauNMInner < tauAFPOptChunk) {
                    var tauAdjX0 = 0;
                    while (tauAdjX0 < tauMaxVeces) {
                        var tauAdjCount = (Math.min(Math.max(1, ~~tauAdjTauBatch), tauMaxVeces - tauAdjX0));
                        await tauAdjFields.use?.();
                        lastUsedProgram = tauAdjFields;
                        tauAdjFields.use?.();
                        tauAdjFields.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauAdjFields.use?.();
                        tauAdjFields.uNum("tauMin", false, false).set((tauMinVeces));
                        tauAdjFields.use?.();
                        tauAdjFields.uNum("nBins", false, false).set((nBins));
                        tauAdjFields.use?.();
                        tauAdjFields.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauAdjFields.use?.();
                        tauAdjFields.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauAdjFields.bindTexName2TexUnit("tauMom1", "TexUnit14");
                        tauAdjFields.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                        tauAdjFields.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                        tauAdjFields.bindTexName2TexUnit("tauNMMetaRead", "TexUnit6");
                        tauNMReadF.bind("TexUnit4");
                        tauNMReadS.bind("TexUnit5");
                        tauNMReadM.bind("TexUnit6");
                        var tauAdjFieldsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauAdjFieldsFBO.bindColorBuffer(tauAdjFieldsTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauAdjDiffOps.use?.();
                        lastUsedProgram = tauAdjDiffOps;
                        tauAdjDiffOps.use?.();
                        tauAdjDiffOps.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauAdjDiffOps.use?.();
                        tauAdjDiffOps.uNum("tauMin", false, false).set((tauMinVeces));
                        tauAdjDiffOps.use?.();
                        tauAdjDiffOps.uNum("nBins", false, false).set((nBins));
                        tauAdjDiffOps.use?.();
                        tauAdjDiffOps.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauAdjDiffOps.use?.();
                        tauAdjDiffOps.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauAdjDiffOps.bindTexName2TexUnit("tauMom1", "TexUnit14");
                        var tauAdjDiffOpsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauAdjDiffOpsFBO.bindColorBuffer(tauAdjDiffOpsTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins * nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauAdjOperator.use?.();
                        lastUsedProgram = tauAdjOperator;
                        tauAdjOperator.use?.();
                        tauAdjOperator.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauAdjOperator.use?.();
                        tauAdjOperator.uNum("tauMin", false, false).set((tauMinVeces));
                        tauAdjOperator.use?.();
                        tauAdjOperator.uNum("nBins", false, false).set((nBins));
                        tauAdjOperator.use?.();
                        tauAdjOperator.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauAdjOperator.use?.();
                        tauAdjOperator.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauAdjOperator.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                        tauAdjOperator.bindTexName2TexUnit("tauAdjDiffOps", "TexUnit29");
                        tauAdjFieldsTex.bind("TexUnit28");
                        tauAdjDiffOpsTex.bind("TexUnit29");
                        var tauAdjOperatorFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauAdjOperatorFBO.bindColorBuffer(tauAdjOperatorTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins * nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauKrylovInit.use?.();
                        lastUsedProgram = tauKrylovInit;
                        tauKrylovInit.use?.();
                        tauKrylovInit.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauKrylovInit.use?.();
                        tauKrylovInit.uNum("tauMin", false, false).set((tauMinVeces));
                        tauKrylovInit.use?.();
                        tauKrylovInit.uNum("nBins", false, false).set((nBins));
                        tauKrylovInit.use?.();
                        tauKrylovInit.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauKrylovInit.use?.();
                        tauKrylovInit.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauKrylovInit.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                        tauAdjFieldsTex.bind("TexUnit28");
                        var tauKrylov0FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov0FBO.bindColorBuffer(tauKrylov0Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauKrylovStep.use?.();
                        lastUsedProgram = tauKrylovStep;
                        tauKrylovStep.use?.();
                        tauKrylovStep.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauKrylovStep.use?.();
                        tauKrylovStep.uNum("tauMin", false, false).set((tauMinVeces));
                        tauKrylovStep.use?.();
                        tauKrylovStep.uNum("nBins", false, false).set((nBins));
                        tauKrylovStep.use?.();
                        tauKrylovStep.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauKrylovStep.use?.();
                        tauKrylovStep.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                        tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit23");
                        tauAdjOperatorTex.bind("TexUnit30");
                        tauKrylov0Tex.bind("TexUnit23");
                        var tauKrylov1FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov1FBO.bindColorBuffer(tauKrylov1Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                        tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit24");
                        tauAdjOperatorTex.bind("TexUnit30");
                        tauKrylov1Tex.bind("TexUnit24");
                        var tauKrylov2FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov2FBO.bindColorBuffer(tauKrylov2Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                        tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit25");
                        tauAdjOperatorTex.bind("TexUnit30");
                        tauKrylov2Tex.bind("TexUnit25");
                        var tauKrylov3FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov3FBO.bindColorBuffer(tauKrylov3Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                        tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit26");
                        tauAdjOperatorTex.bind("TexUnit30");
                        tauKrylov3Tex.bind("TexUnit26");
                        var tauKrylov4FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov4FBO.bindColorBuffer(tauKrylov4Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                        tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit2");
                        tauAdjOperatorTex.bind("TexUnit30");
                        tauKrylov4Tex.bind("TexUnit2");
                        var tauKrylov5FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauKrylov5FBO.bindColorBuffer(tauKrylov5Tex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauArnoldiCoeff.use?.();
                        lastUsedProgram = tauArnoldiCoeff;
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauMin", false, false).set((tauMinVeces));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("nBins", false, false).set((nBins));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauArnoldiReorth", false, false).set((Math.max(1, Math.min(4, ~~tauArnoldiReorth))));
                        tauArnoldiCoeff.use?.();
                        tauArnoldiCoeff.uNum("tauArnoldiResidTol", true, false).set((Math.max(1e-4, Math.min(0.9, tauArnoldiResidTol))));
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov0", "TexUnit23");
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov1", "TexUnit24");
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov2", "TexUnit25");
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov3", "TexUnit26");
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov4", "TexUnit2");
                        tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov5", "TexUnit3");
                        tauKrylov0Tex.bind("TexUnit23");
                        tauKrylov1Tex.bind("TexUnit24");
                        tauKrylov2Tex.bind("TexUnit25");
                        tauKrylov3Tex.bind("TexUnit26");
                        tauKrylov4Tex.bind("TexUnit2");
                        tauKrylov5Tex.bind("TexUnit3");
                        var tauArnoldiCoeffFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauArnoldiCoeffFBO.bindColorBuffer(tauArnoldiCoeffTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, 14, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauAdjExp.use?.();
                        lastUsedProgram = tauAdjExp;
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("tauMin", false, false).set((tauMinVeces));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("nBins", false, false).set((nBins));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("adjointTauScale", true, false).set((tauEStar * dtSample));
                        tauAdjExp.use?.();
                        tauAdjExp.uNum("tauExpTerms", false, false).set((Math.max(1, Math.min(4, ~~tauExpTerms))));
                        tauAdjExp.bindTexName2TexUnit("tauKrylov0", "TexUnit23");
                        tauAdjExp.bindTexName2TexUnit("tauKrylov1", "TexUnit24");
                        tauAdjExp.bindTexName2TexUnit("tauKrylov2", "TexUnit25");
                        tauAdjExp.bindTexName2TexUnit("tauKrylov3", "TexUnit26");
                        tauAdjExp.bindTexName2TexUnit("tauKrylov4", "TexUnit2");
                        tauAdjExp.bindTexName2TexUnit("tauKrylov5", "TexUnit3");
                        tauAdjExp.bindTexName2TexUnit("tauArnoldiCoeff", "TexUnit22");
                        tauKrylov0Tex.bind("TexUnit23");
                        tauKrylov1Tex.bind("TexUnit24");
                        tauKrylov2Tex.bind("TexUnit25");
                        tauKrylov3Tex.bind("TexUnit26");
                        tauKrylov4Tex.bind("TexUnit2");
                        tauKrylov5Tex.bind("TexUnit3");
                        tauArnoldiCoeffTex.bind("TexUnit22");
                        var tauAdjExpFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauAdjExpFBO.bindColorBuffer(tauAdjExpTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauSteadyFP.use?.();
                        lastUsedProgram = tauSteadyFP;
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("tauMin", false, false).set((tauMinVeces));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("nBins", false, false).set((nBins));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("fpLogSpanMax", true, false).set((fpLogSpanMax));
                        tauSteadyFP.use?.();
                        tauSteadyFP.uNum("steadyFPGaugeMode", false, false).set(((steadyFPSolverMode === "fourier_zero_mode_like") ? 1 : 0));
                        tauSteadyFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
                        tauSteadyFP.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                        tauAdjFieldsTex.bind("TexUnit28");
                        var tauSteadyFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauSteadyFPFBO.bindColorBuffer(tauSteadyFPTex, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        await tauAdjCost.use?.();
                        lastUsedProgram = tauAdjCost;
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("tauMax", false, false).set((tauMaxVeces));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("tauMin", false, false).set((tauMinVeces));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("nBins", false, false).set((nBins));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("tauBatchCount", false, false).set((tauAdjCount));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("l2F", true, false).set((afpOptL2F));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("l2S", true, false).set((afpOptL2S));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("adjointTauScale", true, false).set((tauEStar * dtSample));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("useAdjointAFP", false, false).set((!!useAdjointAFP ? 1 : 0));
                        tauAdjCost.use?.();
                        tauAdjCost.uNum("klReg", true, false).set((tauKLReg));
                        tauAdjCost.bindTexName2TexUnit("tauMom1", "TexUnit14");
                        tauAdjCost.bindTexName2TexUnit("tauMom2", "TexUnit15");
                        tauAdjCost.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                        tauAdjCost.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                        tauAdjCost.bindTexName2TexUnit("tauNMMetaRead", "TexUnit6");
                        tauAdjCost.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                        tauAdjCost.bindTexName2TexUnit("tauSteadyFP", "TexUnit27");
                        tauAdjCost.bindTexName2TexUnit("tauAdjExp", "TexUnit31");
                        tauNMReadF.bind("TexUnit4");
                        tauNMReadS.bind("TexUnit5");
                        tauNMReadM.bind("TexUnit6");
                        tauAdjFieldsTex.bind("TexUnit28");
                        tauSteadyFPTex.bind("TexUnit27");
                        tauAdjExpTex.bind("TexUnit31");
                        var tauNMCostFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                        tauNMCostFBO.bindColorBuffer(tauNMCost, "ColAtch0");
                        lastUsedProgram?.use?.();
                        lastUsedProgram?.setViewport(...[tauAdjX0, 0, tauAdjCount, tauMaxVeces * 9]);
                        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                        tauAdjX0 += (tauAdjCount);
                    }
                    await tauNMStep.use?.();
                    lastUsedProgram = tauNMStep;
                    tauNMStep.use?.();
                    tauNMStep.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauNMStep.use?.();
                    tauNMStep.uNum("tauMin", false, false).set((tauMinVeces));
                    tauNMStep.use?.();
                    tauNMStep.uNum("nelderAlpha", true, false).set((nelderAlpha));
                    tauNMStep.use?.();
                    tauNMStep.uNum("nelderGamma", true, false).set((nelderGamma));
                    tauNMStep.use?.();
                    tauNMStep.uNum("nelderRho", true, false).set((nelderRho));
                    tauNMStep.use?.();
                    tauNMStep.uNum("nelderSigma", true, false).set((nelderSigma));
                    tauNMStep.use?.();
                    tauNMStep.uNum("nelderStopEps", true, false).set((nelderStopEps));
                    tauNMStep.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                    tauNMStep.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                    tauNMStep.bindTexName2TexUnit("tauNMCost", "TexUnit11");
                    tauNMReadF.bind("TexUnit4");
                    tauNMReadS.bind("TexUnit5");
                    tauNMCost.bind("TexUnit11");
                    var tauNMStepFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
                    tauNMStepFBO.bindColorBuffer(tauNMWriteF, "ColAtch0");
                    tauNMStepFBO.bindColorBuffer(tauNMWriteS, "ColAtch1");
                    tauNMStepFBO.bindColorBuffer(tauNMWriteM, "ColAtch2");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    var tauNMSwapF = tauNMReadF;
                    tauNMReadF = tauNMWriteF;
                    tauNMWriteF = tauNMSwapF;
                    var tauNMSwapS = tauNMReadS;
                    tauNMReadS = tauNMWriteS;
                    tauNMWriteS = tauNMSwapS;
                    var tauNMSwapM = tauNMReadM;
                    tauNMReadM = tauNMWriteM;
                    tauNMWriteM = tauNMSwapM;
                    tauNMInner += 1;
                }
                tauAdjX0 = 0;
                while (tauAdjX0 < tauMaxVeces) {
                    tauAdjCount = (Math.min(Math.max(1, ~~tauAdjTauBatch), tauMaxVeces - tauAdjX0));
                    await tauAdjFields.use?.();
                    lastUsedProgram = tauAdjFields;
                    tauAdjFields.use?.();
                    tauAdjFields.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauAdjFields.use?.();
                    tauAdjFields.uNum("tauMin", false, false).set((tauMinVeces));
                    tauAdjFields.use?.();
                    tauAdjFields.uNum("nBins", false, false).set((nBins));
                    tauAdjFields.use?.();
                    tauAdjFields.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauAdjFields.use?.();
                    tauAdjFields.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauAdjFields.bindTexName2TexUnit("tauMom1", "TexUnit14");
                    tauAdjFields.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                    tauAdjFields.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                    tauAdjFields.bindTexName2TexUnit("tauNMMetaRead", "TexUnit6");
                    tauNMReadF.bind("TexUnit4");
                    tauNMReadS.bind("TexUnit5");
                    tauNMReadM.bind("TexUnit6");
                    tauAdjFieldsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauAdjFieldsFBO.bindColorBuffer(tauAdjFieldsTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauAdjDiffOps.use?.();
                    lastUsedProgram = tauAdjDiffOps;
                    tauAdjDiffOps.use?.();
                    tauAdjDiffOps.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauAdjDiffOps.use?.();
                    tauAdjDiffOps.uNum("tauMin", false, false).set((tauMinVeces));
                    tauAdjDiffOps.use?.();
                    tauAdjDiffOps.uNum("nBins", false, false).set((nBins));
                    tauAdjDiffOps.use?.();
                    tauAdjDiffOps.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauAdjDiffOps.use?.();
                    tauAdjDiffOps.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauAdjDiffOps.bindTexName2TexUnit("tauMom1", "TexUnit14");
                    tauAdjDiffOpsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauAdjDiffOpsFBO.bindColorBuffer(tauAdjDiffOpsTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins * nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauAdjOperator.use?.();
                    lastUsedProgram = tauAdjOperator;
                    tauAdjOperator.use?.();
                    tauAdjOperator.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauAdjOperator.use?.();
                    tauAdjOperator.uNum("tauMin", false, false).set((tauMinVeces));
                    tauAdjOperator.use?.();
                    tauAdjOperator.uNum("nBins", false, false).set((nBins));
                    tauAdjOperator.use?.();
                    tauAdjOperator.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauAdjOperator.use?.();
                    tauAdjOperator.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauAdjOperator.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                    tauAdjOperator.bindTexName2TexUnit("tauAdjDiffOps", "TexUnit29");
                    tauAdjFieldsTex.bind("TexUnit28");
                    tauAdjDiffOpsTex.bind("TexUnit29");
                    tauAdjOperatorFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauAdjOperatorFBO.bindColorBuffer(tauAdjOperatorTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins * nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauKrylovInit.use?.();
                    lastUsedProgram = tauKrylovInit;
                    tauKrylovInit.use?.();
                    tauKrylovInit.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauKrylovInit.use?.();
                    tauKrylovInit.uNum("tauMin", false, false).set((tauMinVeces));
                    tauKrylovInit.use?.();
                    tauKrylovInit.uNum("nBins", false, false).set((nBins));
                    tauKrylovInit.use?.();
                    tauKrylovInit.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauKrylovInit.use?.();
                    tauKrylovInit.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauKrylovInit.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                    tauAdjFieldsTex.bind("TexUnit28");
                    tauKrylov0FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov0FBO.bindColorBuffer(tauKrylov0Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauKrylovStep.use?.();
                    lastUsedProgram = tauKrylovStep;
                    tauKrylovStep.use?.();
                    tauKrylovStep.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauKrylovStep.use?.();
                    tauKrylovStep.uNum("tauMin", false, false).set((tauMinVeces));
                    tauKrylovStep.use?.();
                    tauKrylovStep.uNum("nBins", false, false).set((nBins));
                    tauKrylovStep.use?.();
                    tauKrylovStep.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauKrylovStep.use?.();
                    tauKrylovStep.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                    tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit23");
                    tauAdjOperatorTex.bind("TexUnit30");
                    tauKrylov0Tex.bind("TexUnit23");
                    tauKrylov1FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov1FBO.bindColorBuffer(tauKrylov1Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                    tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit24");
                    tauAdjOperatorTex.bind("TexUnit30");
                    tauKrylov1Tex.bind("TexUnit24");
                    tauKrylov2FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov2FBO.bindColorBuffer(tauKrylov2Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                    tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit25");
                    tauAdjOperatorTex.bind("TexUnit30");
                    tauKrylov2Tex.bind("TexUnit25");
                    tauKrylov3FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov3FBO.bindColorBuffer(tauKrylov3Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                    tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit26");
                    tauAdjOperatorTex.bind("TexUnit30");
                    tauKrylov3Tex.bind("TexUnit26");
                    tauKrylov4FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov4FBO.bindColorBuffer(tauKrylov4Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    tauKrylovStep.bindTexName2TexUnit("tauAdjOperator", "TexUnit30");
                    tauKrylovStep.bindTexName2TexUnit("tauKrylovPrev", "TexUnit2");
                    tauAdjOperatorTex.bind("TexUnit30");
                    tauKrylov4Tex.bind("TexUnit2");
                    tauKrylov5FBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauKrylov5FBO.bindColorBuffer(tauKrylov5Tex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauArnoldiCoeff.use?.();
                    lastUsedProgram = tauArnoldiCoeff;
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauMin", false, false).set((tauMinVeces));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("nBins", false, false).set((nBins));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauArnoldiReorth", false, false).set((Math.max(1, Math.min(4, ~~tauArnoldiReorth))));
                    tauArnoldiCoeff.use?.();
                    tauArnoldiCoeff.uNum("tauArnoldiResidTol", true, false).set((Math.max(1e-4, Math.min(0.9, tauArnoldiResidTol))));
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov0", "TexUnit23");
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov1", "TexUnit24");
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov2", "TexUnit25");
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov3", "TexUnit26");
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov4", "TexUnit2");
                    tauArnoldiCoeff.bindTexName2TexUnit("tauKrylov5", "TexUnit3");
                    tauKrylov0Tex.bind("TexUnit23");
                    tauKrylov1Tex.bind("TexUnit24");
                    tauKrylov2Tex.bind("TexUnit25");
                    tauKrylov3Tex.bind("TexUnit26");
                    tauKrylov4Tex.bind("TexUnit2");
                    tauKrylov5Tex.bind("TexUnit3");
                    tauArnoldiCoeffFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauArnoldiCoeffFBO.bindColorBuffer(tauArnoldiCoeffTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, 14, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauAdjExp.use?.();
                    lastUsedProgram = tauAdjExp;
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("tauMin", false, false).set((tauMinVeces));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("nBins", false, false).set((nBins));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("adjointTauScale", true, false).set((tauEStar * dtSample));
                    tauAdjExp.use?.();
                    tauAdjExp.uNum("tauExpTerms", false, false).set((Math.max(1, Math.min(4, ~~tauExpTerms))));
                    tauAdjExp.bindTexName2TexUnit("tauKrylov0", "TexUnit23");
                    tauAdjExp.bindTexName2TexUnit("tauKrylov1", "TexUnit24");
                    tauAdjExp.bindTexName2TexUnit("tauKrylov2", "TexUnit25");
                    tauAdjExp.bindTexName2TexUnit("tauKrylov3", "TexUnit26");
                    tauAdjExp.bindTexName2TexUnit("tauKrylov4", "TexUnit2");
                    tauAdjExp.bindTexName2TexUnit("tauKrylov5", "TexUnit3");
                    tauAdjExp.bindTexName2TexUnit("tauArnoldiCoeff", "TexUnit22");
                    tauKrylov0Tex.bind("TexUnit23");
                    tauKrylov1Tex.bind("TexUnit24");
                    tauKrylov2Tex.bind("TexUnit25");
                    tauKrylov3Tex.bind("TexUnit26");
                    tauKrylov4Tex.bind("TexUnit2");
                    tauKrylov5Tex.bind("TexUnit3");
                    tauArnoldiCoeffTex.bind("TexUnit22");
                    tauAdjExpFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauAdjExpFBO.bindColorBuffer(tauAdjExpTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauSteadyFP.use?.();
                    lastUsedProgram = tauSteadyFP;
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("tauMin", false, false).set((tauMinVeces));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("nBins", false, false).set((nBins));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("fpLogSpanMax", true, false).set((fpLogSpanMax));
                    tauSteadyFP.use?.();
                    tauSteadyFP.uNum("steadyFPGaugeMode", false, false).set(((steadyFPSolverMode === "fourier_zero_mode_like") ? 1 : 0));
                    tauSteadyFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
                    tauSteadyFP.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                    tauAdjFieldsTex.bind("TexUnit28");
                    tauSteadyFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauSteadyFPFBO.bindColorBuffer(tauSteadyFPTex, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[0, 0, nBins, tauAdjCount * tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    await tauAdjCost.use?.();
                    lastUsedProgram = tauAdjCost;
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("tauMax", false, false).set((tauMaxVeces));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("tauMin", false, false).set((tauMinVeces));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("nBins", false, false).set((nBins));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("tauBatchOffset", false, false).set((tauAdjX0));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("tauBatchCount", false, false).set((tauAdjCount));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("l2F", true, false).set((afpOptL2F));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("l2S", true, false).set((afpOptL2S));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("adjointTauScale", true, false).set((tauEStar * dtSample));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("useAdjointAFP", false, false).set((!!useAdjointAFP ? 1 : 0));
                    tauAdjCost.use?.();
                    tauAdjCost.uNum("klReg", true, false).set((tauKLReg));
                    tauAdjCost.bindTexName2TexUnit("tauMom1", "TexUnit14");
                    tauAdjCost.bindTexName2TexUnit("tauMom2", "TexUnit15");
                    tauAdjCost.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                    tauAdjCost.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                    tauAdjCost.bindTexName2TexUnit("tauNMMetaRead", "TexUnit6");
                    tauAdjCost.bindTexName2TexUnit("tauAdjFields", "TexUnit28");
                    tauAdjCost.bindTexName2TexUnit("tauSteadyFP", "TexUnit27");
                    tauAdjCost.bindTexName2TexUnit("tauAdjExp", "TexUnit31");
                    tauNMReadF.bind("TexUnit4");
                    tauNMReadS.bind("TexUnit5");
                    tauNMReadM.bind("TexUnit6");
                    tauAdjFieldsTex.bind("TexUnit28");
                    tauSteadyFPTex.bind("TexUnit27");
                    tauAdjExpTex.bind("TexUnit31");
                    tauNMCostFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
                    tauNMCostFBO.bindColorBuffer(tauNMCost, "ColAtch0");
                    lastUsedProgram?.use?.();
                    lastUsedProgram?.setViewport(...[tauAdjX0, 0, tauAdjCount, tauMaxVeces * 9]);
                    lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                    tauAdjX0 += (tauAdjCount);
                }
                await tauNMFinalize.use?.();
                lastUsedProgram = tauNMFinalize;
                tauNMFinalize.use?.();
                tauNMFinalize.uNum("tauMax", false, false).set((tauMaxVeces));
                tauNMFinalize.use?.();
                tauNMFinalize.uNum("tauMin", false, false).set((tauMinVeces));
                tauNMFinalize.bindTexName2TexUnit("tauNMXiFRead", "TexUnit4");
                tauNMFinalize.bindTexName2TexUnit("tauNMXiSRead", "TexUnit5");
                tauNMFinalize.bindTexName2TexUnit("tauNMCost", "TexUnit11");
                tauNMFinalize.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
                tauNMFinalize.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
                tauNMFinalize.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
                tauNMReadF.bind("TexUnit4");
                tauNMReadS.bind("TexUnit5");
                tauNMCost.bind("TexUnit11");
                var tauAFPOptFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0", "ColAtch1", "ColAtch2"]);
                tauAFPOptFBO.bindColorBuffer(tauXiFFinal, "ColAtch0");
                tauAFPOptFBO.bindColorBuffer(tauXiSFinal, "ColAtch1");
                tauAFPOptFBO.bindColorBuffer(tauXiMetaFinal, "ColAtch2");
                lastUsedProgram?.use?.();
                lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
                lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
                gl.finish();
                var tauAFPOptFlags = (Array.from(tauAFPOptFBO.readColorAttachment(2, 0, 0, tauMaxVeces, tauMaxVeces, TexExamples.RGBAFloat16, 4)));
                tauAFPOptDone = (tauAFPOptFlags.every((v, idx, arr) => ((idx % 4) !== 0) || (arr[idx + 1] < 0.5 || arr[idx + 3] > 0.5)));
                tauAFPOptPass += (tauAFPOptChunk);
            }
            tauXiFFinal.bind("TexUnit25");
            tauXiSFinal.bind("TexUnit26");
            tauXiMetaFinal.bind("TexUnit27");
            await tauStats.use?.();
            lastUsedProgram = tauStats;
            tauStats.use?.();
            tauStats.uNum("tauMax", false, false).set((tauMaxVeces));
            tauStats.use?.();
            tauStats.uNum("tauMin", false, false).set((tauMinVeces));
            tauStats.use?.();
            tauStats.uNum("keepPercent", true, false).set((keepTopPercent));
            tauStats.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            var tauStatsFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauStatsFBO.bindColorBuffer(tauStatsTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, 1, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            await tauMask.use?.();
            lastUsedProgram = tauMask;
            tauMask.use?.();
            tauMask.uNum("tauMax", false, false).set((tauMaxVeces));
            tauMask.use?.();
            tauMask.uNum("tauMin", false, false).set((tauMinVeces));
            tauMask.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            tauMask.bindTexName2TexUnit("tauStats", "TexUnit21");
            var tauMaskFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauMaskFBO.bindColorBuffer(tauMaskTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            await tauFP.use?.();
            lastUsedProgram = tauFP;
            tauFP.use?.();
            tauFP.uNum("tauMax", false, false).set((tauMaxVeces));
            tauFP.use?.();
            tauFP.uNum("tauMin", false, false).set((tauMinVeces));
            tauFP.use?.();
            tauFP.uNum("nBins", false, false).set((nBins));
            tauFP.use?.();
            tauFP.uNum("logSpanMax", true, false).set((fpLogSpanMax));
            tauFP.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauFP.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
            tauFP.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
            tauFP.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            tauFP.bindTexName2TexUnit("tauModelMask", "TexUnit22");
            var tauFPFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauFPFBO.bindColorBuffer(tauFPTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            await tauKL.use?.();
            lastUsedProgram = tauKL;
            tauKL.use?.();
            tauKL.uNum("tauMax", false, false).set((tauMaxVeces));
            tauKL.use?.();
            tauKL.uNum("tauMin", false, false).set((tauMinVeces));
            tauKL.use?.();
            tauKL.uNum("nBins", false, false).set((nBins));
            tauKL.use?.();
            tauKL.uNum("spanMax", true, false).set((modelKLSpanMax));
            tauKL.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauKL.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
            tauKL.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
            tauKL.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            var tauKLFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauKLFBO.bindColorBuffer(tauKLTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauKLTex.bind("TexUnit4");
            await tauScore.use?.();
            lastUsedProgram = tauScore;
            tauScore.use?.();
            tauScore.uNum("tauMax", false, false).set((tauMaxVeces));
            tauScore.use?.();
            tauScore.uNum("tauMin", false, false).set((tauMinVeces));
            tauScore.use?.();
            tauScore.uNum("wCost", true, false).set((scoreWCost));
            tauScore.use?.();
            tauScore.uNum("wKL", true, false).set((scoreWKL));
            tauScore.use?.();
            tauScore.uNum("wSpan", true, false).set((scoreWSpan));
            tauScore.use?.();
            tauScore.uNum("klMax", true, false).set((scoreKLMax));
            tauScore.use?.();
            tauScore.uNum("scoreMax", true, false).set((scoreMaxCut));
            tauScore.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            tauScore.bindTexName2TexUnit("tauModelMask", "TexUnit22");
            tauScore.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
            tauScore.bindTexName2TexUnit("tauModelKL", "TexUnit4");
            tauScore.bindTexName2TexUnit("tauStats", "TexUnit21");
            var tauScoreFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauScoreFBO.bindColorBuffer(tauScoreTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, tauMaxVeces, tauMaxVeces]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauScoreTex.bind("TexUnit5");
            await tauBest.use?.();
            lastUsedProgram = tauBest;
            tauBest.use?.();
            tauBest.uNum("tauMax", false, false).set((tauMaxVeces));
            tauBest.use?.();
            tauBest.uNum("tauMin", false, false).set((tauMinVeces));
            tauBest.use?.();
            tauBest.uNum("useMask", false, false).set(1);
            tauBest.use?.();
            tauBest.uNum("useFP", false, false).set((!!useFPFilter ? 1 : 0));
            tauBest.use?.();
            tauBest.uNum("useScore", false, false).set((!!useScoreSelection ? 1 : 0));
            tauBest.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            tauBest.bindTexName2TexUnit("tauModelMask", "TexUnit22");
            tauBest.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
            tauBest.bindTexName2TexUnit("tauModelScore", "TexUnit5");
            var tauBestFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauBestFBO.bindColorBuffer(tauBestTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, 1, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauBestTex.bind("TexUnit17");
            await tauSindy.use?.();
            lastUsedProgram = tauSindy;
            tauMinVeces = (Math.max(1, ~~tauMinVeces));
            tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
            bestTau = (Math.max(tauMinVeces, ~~bestTau));
            bestTau = (Math.min(bestTau, tauMaxVeces));
            bestSubseq = (Math.max(0, ~~bestSubseq));
            if (bestSubseq >= bestTau) {
                bestSubseq = (Math.max(0, bestTau - 1));
            }
            tauSindy.use?.();
            tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
            tauSindy.use?.();
            tauSindy.uNum("nBins", false, false).set((nBins));
            tauSindy.use?.();
            tauSindy.uNum("selectedTau", false, false).set((bestTau));
            tauSindy.use?.();
            tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
            tauSindy.use?.();
            tauSindy.uNum("useSelected", false, false).set(1);
            tauSindy.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit18");
            tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit19");
            tauSindy.bindTexName2TexUnit("tauBest", "TexUnit17");
            var tauSindyInitFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauSindyInitFBO.bindColorBuffer(tauSindyInitTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, nBins, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauSindyInitTex.bind("TexUnit7");
            tauSindy.use?.();
            tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
            tauSindy.use?.();
            tauSindy.uNum("nBins", false, false).set((nBins));
            tauSindy.use?.();
            tauSindy.uNum("selectedTau", false, false).set(1);
            tauSindy.use?.();
            tauSindy.uNum("selectedSubseq", false, false).set(0);
            tauSindy.use?.();
            tauSindy.uNum("useSelected", false, false).set(1);
            var tauSindyTau1RefFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauSindyTau1RefFBO.bindColorBuffer(tauSindyTau1RefTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, nBins, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauSindyTau1RefTex.bind("TexUnit8");
            tauSindy.use?.();
            tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
            tauSindy.use?.();
            tauSindy.uNum("nBins", false, false).set((nBins));
            tauSindy.use?.();
            tauSindy.uNum("selectedTau", false, false).set((bestTau));
            tauSindy.use?.();
            tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
            tauSindy.use?.();
            tauSindy.uNum("useSelected", false, false).set(1);
            tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit25");
            tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit26");
            var tauSindyFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauSindyFBO.bindColorBuffer(tauSindyTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, nBins, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauSindyTex.bind("TexUnit6");
            await tauFPStat.use?.();
            lastUsedProgram = tauFPStat;
            tauMinVeces = (Math.max(1, ~~tauMinVeces));
            tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
            bestTau = (Math.max(tauMinVeces, ~~bestTau));
            bestTau = (Math.min(bestTau, tauMaxVeces));
            bestSubseq = (Math.max(0, ~~bestSubseq));
            if (bestSubseq >= bestTau) {
                bestSubseq = (Math.max(0, bestTau - 1));
            }
            tauFPStat.use?.();
            tauFPStat.uNum("tauMax", false, false).set((tauMaxVeces));
            tauFPStat.use?.();
            tauFPStat.uNum("tauMin", false, false).set((tauMinVeces));
            tauFPStat.use?.();
            tauFPStat.uNum("nBins", false, false).set((nBins));
            tauFPStat.use?.();
            tauFPStat.uNum("selectedTau", false, false).set((bestTau));
            tauFPStat.use?.();
            tauFPStat.uNum("selectedSubseq", false, false).set((bestSubseq));
            tauFPStat.use?.();
            tauFPStat.uNum("useSelected", false, false).set(1);
            tauFPStat.bindTexName2TexUnit("tauMom1", "TexUnit14");
            tauFPStat.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
            tauFPStat.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
            tauFPStat.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
            tauFPStat.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
            tauFPStat.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
            tauFPStat.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
            tauFPStat.bindTexName2TexUnit("tauBest", "TexUnit17");
            var tauFPStatFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
            tauFPStatFBO.bindColorBuffer(tauFPStatTex, "ColAtch0");
            lastUsedProgram?.use?.();
            lastUsedProgram?.setViewport(...[0, 0, nBins, 1]);
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
            tauFPStatTex.bind("TexUnit24");
            if (tauDebugFrames > 0) {
                var statsSample = (tauStatsFBO.readColorAttachment(0, 0, 0, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestSample = (tauBestFBO.readColorAttachment(0, 0, 0, 1, 1, TexExamples.RGBAFloat16, 4));
                var bestArr = (Array.from(bestSample));
                var stArr = (Array.from(statsSample));
                console.log("C2 muestras: y=0 => tau=1,subseq=0 ; y=tauMax => tau=2,subseq=0");
                console.log(Array.from(tauMomFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mom2 tau1-sub0 [fKM,aKM,fErr,aErr] bins 0..3");
                console.log(Array.from(tauMomFBO.readColorAttachment("ColAtch1", 0, tauMaxVeces, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mom2 tau2-sub0 [fKM,aKM,fErr,aErr] bins 0..3");
                console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 LS sample");
                console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 LS sample");
                console.log(Array.from(tauXiFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta LS sample [cost,valid,nUsed,reserved]");
                console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 AFP0 sample");
                console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 AFP0 sample");
                console.log(Array.from(tauAFPFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta AFP0 sample [cost,valid,nUsed,reserved]");
                console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack0 FINAL sample");
                console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch1", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi pack1 FINAL sample");
                console.log(Array.from(tauAFPOptFBO.readColorAttachment("ColAtch2", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 tauXi meta FINAL sample [cost,valid,nUsed,reserved]");
                console.log((stArr), "C2 stats [bestCost,threshold,maxValidCost,targetK]");
                console.log(Array.from(tauMaskFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 mask sample [selected,cost,valid,scoreN]");
                console.log(Array.from(tauFPFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 fpProxy sample [selectedFP,cost,validFP,spanN]");
                console.log(Array.from(tauKLFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 modelKL sample [kl,valid,spanN,sumH]");
                console.log(Array.from(tauScoreFBO.readColorAttachment("ColAtch0", 0, 0, 4, 1, TexExamples.RGBAFloat16, 4)), "C2 modelScore sample [selected,score,valid,costRaw]");
                console.log((bestArr), "C2 bestModel [tau,subseq,cost,found]");
                console.log(Array.from(tauSindyInitFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 sindy INIT sample [x,f,s,a] bins 0..7");
                console.log(Array.from(tauSindyFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 sindy sample [x,f,s,a] bins 0..7");
                console.log(Array.from(tauFPStatFBO.readColorAttachment("ColAtch0", 0, 0, 8, 1, TexExamples.RGBAFloat16, 4)), "C2 fpStationary sample [pHist,pInit,pFinal,valid] bins 0..7");
                if (autoPickBest) {
                    bestTau = (Math.max(tauMinVeces, ~~(bestArr[0] || 1)));
                    bestTau = (Math.min(bestTau, tauMaxVeces));
                    bestSubseq = (Math.max(0, ~~(bestArr[1] || 0)));
                }
                if (logTopModels) {
                    var bestX = (Math.max(0, bestTau - 1));
                    var bestY = (Math.max(0, bestSubseq));
                    var bestXiF = (tauAFPOptFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                    var bestXiS = (tauAFPOptFBO.readColorAttachment(1, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                    var bestXiMeta = (tauAFPOptFBO.readColorAttachment(2, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                    var bestKL = (tauKLFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                    var bestScore = (tauScoreFBO.readColorAttachment(0, bestX, bestY, 1, 1, TexExamples.RGBAFloat16, 4));
                    console.log((Array.from(bestXiF)), "C2 BEST Xi pack0 [c0..c3]");
                    console.log((Array.from(bestXiS)), "C2 BEST Xi pack1 [c4..c7]");
                    console.log((Array.from(bestXiMeta)), "C2 BEST Xi meta [cost,valid,nUsed,reserved]");
                    console.log((Array.from(bestKL)), "C2 BEST KL [kl,valid,spanN,sumH]");
                    console.log((Array.from(bestScore)), "C2 BEST SCORE [selected,score,valid,costRaw]");
                }
                tauDebugFrames -= 1;
            }
            tauFPStat.unbindFBO();
            tauSindy.unbindFBO();
            tauBest.unbindFBO();
            tauScore.unbindFBO();
            tauKL.unbindFBO();
            tauFP.unbindFBO();
            tauMask.unbindFBO();
            tauStats.unbindFBO();
            tauAFPOpt.unbindFBO();
            tauAFP.unbindFBO();
            tauXi.unbindFBO();
            tauMom.unbindFBO();
            tauModelStamp += 1;
            __publishSimTrajectoryFromTau(true);
            recomputeTau = false;
        }
    };
    __globalBlocks.push({ priority: 10, order: 0, fn: __globalBlockFn_0 });
    var __globalBlockFn_1 = async (dt) => {
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestSubseq >= bestTau) {
            bestSubseq = (Math.max(0, bestTau - 1));
        }
        await tauSindy.use?.();
        lastUsedProgram = tauSindy;
        tauSindy.VAO.bind();
        tauSindy.use?.();
        tauSindy.setViewport(...([0, 0, nBins, 1]));
        tauSindy.use?.();
        tauSindy.uNum("tauMax", false, false).set((tauMaxVeces));
        tauSindy.use?.();
        tauSindy.uNum("nBins", false, false).set((nBins));
        tauSindy.use?.();
        tauSindy.uNum("selectedTau", false, false).set((bestTau));
        tauSindy.use?.();
        tauSindy.uNum("selectedSubseq", false, false).set((bestSubseq));
        tauSindy.use?.();
        tauSindy.uNum("useSelected", false, false).set(1);
        tauSindy.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauSindy.bindTexName2TexUnit("tauXiF", "TexUnit25");
        tauSindy.bindTexName2TexUnit("tauXiS", "TexUnit26");
        tauSindy.bindTexName2TexUnit("tauBest", "TexUnit17");
        var tauSindyPreviewFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauSindyPreviewFBO.bindColorBuffer(tauSindyTex, "ColAtch0");
        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
        tauSindyTex.bind("TexUnit6");
        await tauFPStat.use?.();
        lastUsedProgram = tauFPStat;
        tauFPStat.VAO.bind();
        tauFPStat.use?.();
        tauFPStat.setViewport(...([0, 0, nBins, 1]));
        tauFPStat.use?.();
        tauFPStat.uNum("tauMax", false, false).set((tauMaxVeces));
        tauFPStat.use?.();
        tauFPStat.uNum("tauMin", false, false).set((tauMinVeces));
        tauFPStat.use?.();
        tauFPStat.uNum("nBins", false, false).set((nBins));
        tauFPStat.use?.();
        tauFPStat.uNum("selectedTau", false, false).set((bestTau));
        tauFPStat.use?.();
        tauFPStat.uNum("selectedSubseq", false, false).set((bestSubseq));
        tauFPStat.use?.();
        tauFPStat.uNum("useSelected", false, false).set(1);
        tauFPStat.bindTexName2TexUnit("tauMom1", "TexUnit14");
        tauFPStat.bindTexName2TexUnit("tauXiFOpt", "TexUnit18");
        tauFPStat.bindTexName2TexUnit("tauXiSOpt", "TexUnit19");
        tauFPStat.bindTexName2TexUnit("tauXiMetaOpt", "TexUnit20");
        tauFPStat.bindTexName2TexUnit("tauXiFFinal", "TexUnit25");
        tauFPStat.bindTexName2TexUnit("tauXiSFinal", "TexUnit26");
        tauFPStat.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        tauFPStat.bindTexName2TexUnit("tauBest", "TexUnit17");
        var tauFPStatPreviewFBO = lastUsedProgram.cFrameBuffer().bind(["ColAtch0"]);
        tauFPStatPreviewFBO.bindColorBuffer(tauFPStatTex, "ColAtch0");
        lastUsedProgram?.drawArrays("TRIANGLES", 0, 6);
        tauFPStatTex.bind("TexUnit24");
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.DEPTH_TEST);
        tauXiMetaFinal.bind("TexUnit27");
        tauBestTex.bind("TexUnit17");
        tauSindyTex.bind("TexUnit6");
        tauSindyInitTex.bind("TexUnit7");
        tauSindyTau1RefTex.bind("TexUnit8");
        tauFPStatTex.bind("TexUnit24");
        tauKLTex.bind("TexUnit4");
        tauScoreTex.bind("TexUnit5");
        await drawTau.use?.();
        lastUsedProgram = drawTau;
        drawTau.VAO.bind();
        drawTau.use?.();
        drawTau.setViewport(...([0, 0, canvas.width, canvas.height]));
        if (useLSView) {
            drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit16");
        }
        else {
            drawTau.bindTexName2TexUnit("tauXiMetaFinal", "TexUnit27");
        }
        drawTau.bindTexName2TexUnit("tauBest", "TexUnit17");
        drawTau.bindTexName2TexUnit("tauSindy", "TexUnit6");
        drawTau.bindTexName2TexUnit("tauSindyInit", "TexUnit7");
        drawTau.bindTexName2TexUnit("tauSindyTau1Ref", "TexUnit8");
        drawTau.bindTexName2TexUnit("tauModelMask", "TexUnit22");
        drawTau.bindTexName2TexUnit("tauFPProxy", "TexUnit23");
        drawTau.bindTexName2TexUnit("tauModelKL", "TexUnit4");
        drawTau.bindTexName2TexUnit("tauModelScore", "TexUnit5");
        drawTau.bindTexName2TexUnit("tauFPStationary", "TexUnit24");
        drawTau.bindTexName2TexUnit("tauStats", "TexUnit21");
        drawTau.uniforms.tauMax.set((tauMaxVeces));
        drawTau.uniforms.tauMin.set((tauMinVeces));
        drawTau.uniforms.bestTau.set((bestTau));
        drawTau.uniforms.bestSubseq.set((bestSubseq));
        drawTau.uniforms.showTauCurves.set((!!showTauCurves ? 1 : 0));
        drawTau.uniforms.showFPStationary.set((!!showFPStationary ? 1 : 0));
        drawTau.uniforms.showLSOverlay.set((!!showLSFOverlay ? 1 : 0));
        if (c2DrawLogFrames > 0) {
            console.log("C2 drawTauPanel", (bestTau), (bestSubseq), (gl.getParameter(gl.FRAMEBUFFER_BINDING)));
            c2DrawLogFrames -= 1;
        }
        drawTau.drawArrays("TRIANGLES", 0, 6);
        if (typeof __drawTauHud === "function") {
            __drawTauHud();
        }
        // </block drawTauPanel>
    };
    __globalBlocks.push({ priority: 20, order: 1, fn: __globalBlockFn_1 });
    KeyManager.OnPress("q", async (e) => {
        if (e?.repeat)
            return;
        useLSView = (!useLSView);
    });
    KeyManager.OnPress("e", async (e) => {
        if (e?.repeat)
            return;
        autoPickBest = (!autoPickBest);
    });
    KeyManager.OnPress("n", async (e) => {
        if (e?.repeat)
            return;
        keepTopPercent = (Math.min(80, keepTopPercent + 5));
        recomputeTau = true;
    });
    KeyManager.OnPress("i", async (e) => {
        if (e?.repeat)
            return;
        keepTopPercent = (Math.max(5, keepTopPercent - 5));
        recomputeTau = true;
    });
    KeyManager.OnPress("j", async (e) => {
        if (e?.repeat)
            return;
        showMSDOverlay = (!showMSDOverlay);
        if (showMSDOverlay) {
            showTauCurves = true;
        }
    });
    KeyManager.OnPress("t", async (e) => {
        if (e?.repeat)
            return;
        showTauCurves = (!showTauCurves);
    });
    KeyManager.OnPress("b", async (e) => {
        if (e?.repeat)
            return;
        showRawKMOverlay = (!showRawKMOverlay);
        if (showRawKMOverlay) {
            showTauCurves = true;
        }
    });
    KeyManager.OnPress("m", async (e) => {
        if (e?.repeat)
            return;
        showLSFOverlay = (!showLSFOverlay);
        if (showLSFOverlay) {
            showTauCurves = true;
        }
    });
    KeyManager.OnPress("r", async (e) => {
        if (e?.repeat)
            return;
        showFPStationary = (!showFPStationary);
        if (showFPStationary) {
            showTauCurves = true;
        }
    });
    KeyManager.OnPress("o", async (e) => {
        if (e?.repeat)
            return;
        useScoreSelection = (!useScoreSelection);
    });
    KeyManager.OnPress("l", async (e) => {
        if (e?.repeat)
            return;
        showMSDScoreMap = (!showMSDScoreMap);
    });
    KeyManager.OnPress("x", async (e) => {
        if (e?.repeat)
            return;
        autoPickBest = false;
        var prevTauX = (bestTau);
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        var wasOutX = (bestTau < tauMinVeces || bestTau > tauMaxVeces);
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (!wasOutX) {
            bestTau = (Math.min(bestTau + 1, tauMaxVeces));
        }
        if (bestTau == prevTauX) {
            console.log("C2 x: limite superior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
        }
        if (bestSubseq >= bestTau) {
            bestSubseq = (bestTau - 1);
        }
        bestSubseq = (Math.max(0, ~~bestSubseq));
    });
    KeyManager.OnPress("z", async (e) => {
        if (e?.repeat)
            return;
        autoPickBest = false;
        var prevTauZ = (bestTau);
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        var wasOutZ = (bestTau < tauMinVeces || bestTau > tauMaxVeces);
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (!wasOutZ) {
            bestTau = (Math.max(bestTau - 1, tauMinVeces));
        }
        if (bestTau == prevTauZ) {
            console.log("C2 z: limite inferior tau", (bestTau), "[", (tauMinVeces), ",", (tauMaxVeces), "]");
        }
        if (bestSubseq >= bestTau) {
            bestSubseq = (bestTau - 1);
        }
        bestSubseq = (Math.max(0, ~~bestSubseq));
    });
    KeyManager.OnPress("v", async (e) => {
        if (e?.repeat)
            return;
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestTau > 1) {
            autoPickBest = false;
            bestSubseq = ((bestSubseq + 1) % bestTau);
            bestSubseq = (Math.max(0, ~~bestSubseq));
        }
    });
    KeyManager.OnPress("c", async (e) => {
        if (e?.repeat)
            return;
        tauMinVeces = (Math.max(1, ~~tauMinVeces));
        tauMaxVeces = (Math.max(tauMinVeces, ~~tauMaxVeces));
        bestTau = (Math.max(tauMinVeces, ~~bestTau));
        bestTau = (Math.min(bestTau, tauMaxVeces));
        bestSubseq = (Math.max(0, ~~bestSubseq));
        if (bestTau > 1) {
            autoPickBest = false;
            bestSubseq = ((bestSubseq - 1 + bestTau) % bestTau);
            bestSubseq = (Math.max(0, ~~bestSubseq));
        }
        else {
            console.log("C2 c: tau actual no tiene subsecuencias", (bestTau));
        }
    });
    if (typeof __mountGlobalBlocks === "function")
        __mountGlobalBlocks(__globalBlocks, addFunc);
    start();
    //<Pos>
})();
//</Pos>
