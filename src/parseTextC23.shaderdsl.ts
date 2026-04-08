let {
  tauMaxVeces=100, tauMinVeces=1
  chromatinIndex=1, nBins=64
  tauEStar=1.0, dtSample=1.0
  recomputeTau=true, tauDebugFrames=4, c2DrawLogFrames=3
  bestTau=1, bestSubseq=0
  autoPickBest=true, useLSView=false
  afpLrF=0.04, afpLrS=0.06
  afpL1F=0.0004, afpL1S=0.0002, afpIters=5
  afpOptLrF=0.02, afpOptLrS=0.03
  afpOptL1F=0.0002, afpOptL1S=0.0001
  afpOptL2F=0.0008, afpOptL2S=0.0008, afpOptIters=7
  keepTopPercent=20, useFPFilter=true
  fpLogSpanMax=42, modelKLSpanMax=42
  showFPStationary=true, showTauCurves=false
  showRawKMOverlay=false, showLSFOverlay=false
  showMSDOverlay=false, showMSDScoreMap=false
  scoreWCost=0.55, scoreWKL=0.35, scoreWSpan=0.10
  scoreKLMax=3.0, scoreMaxCut=0.75
  useScoreSelection=true, logTopModels=false
  tauModelStamp=0
  tauMSDMaxLag=64, tauMSDChunkBudgetMs=8
  tauBasisMode="pca", tauPcaSecondaryMode="perp90"
  tauFDegrees=[0,1,2,3], tauSDegrees=[0]
}
let tauPolyExpr=(deg)=>deg<0?"0.0":deg===0?"1.0":deg===1?"x":Array(deg).fill("x").join("*")
let tauFTerms=tauFDegrees.length
let tauSTerms=tauSDegrees.length
let tauTotalTerms=tauFTerms+tauSTerms
let tauBasisBody=(degrees)=>degrees.map((d,i)=>"if(termIdx=="+i+") return "+tauPolyExpr(d)+";").join(" ")
if(tauTotalTerms>8) throw new Error("tauTotalTerms debe ser <= 8 con el empaquetado actual (dos RGBA).")

// GLSL shared substitutions
glslFilters {
   both "tau/" "const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT" -> {"const int TAU_F_TERMS = " + String(tauFTerms) + ";"}
   both "tau/" "const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT" -> {"const int TAU_S_TERMS = " + String(tauSTerms) + ";"}
   both "tau/" "const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT" -> {"const int TAU_TOTAL_TERMS = " + String(tauTotalTerms) + ";"}
   both "tau/" "return 0.0; //Var@TAU_F_BASIS_BODY" -> {tauBasisBody(tauFDegrees) + " return 0.0;"}
   both "tau/" "return 0.0; //Var@TAU_S_BASIS_BODY" -> {tauBasisBody(tauSDegrees) + " return 0.0;"}
}

// Shared texture presets
resource TauFloatTex {
   format: RGBA16
   filter: NEAREST
   wrap: CLAMP
}


// file://./glsl/tau/01_moments/1_tauMaxVeces.frag
progTauMom = Program tau/01_moments/1_tauMaxVeces |= tauMom
lduse tauMom
tauMom.createVAO().bind()

let extC2 = gl.getExtension("EXT_color_buffer_float")
if(!extC2){
   log "EXT_color_buffer_float no soportado en C2"
}

let xTex = tauMom.createTexture2D("datosX1", [NMuestras1,1], TexExamples.RFloat, tauSignalData, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit10)
let yTex = tauMom.createTexture2D("datosY1", [NMuestras1,1], TexExamples.RFloat, datosY1, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit11)

let tauMom1 = tauMom.createTexture2D("tauMom1", [nBins,tauMaxVeces*tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit14)
let tauMom2 = tauMom.createTexture2D("tauMom2", [nBins,tauMaxVeces*tauMaxVeces], TexExamples.RGBAFloat16, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit15)


// file://./glsl/tau/02_ls/1_tauXiLS.frag
program tauXi "tau/02_ls/1_tauXiLS" {
   tex2D tauXiF[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit12
   tex2D tauXiS[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit13
   tex2D tauXiMeta[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit16
}


// file://./glsl/tau/03_afp/1_tauAFP0.frag
program tauAFP "tau/03_afp/1_tauAFP0" {
   tex2D tauXiFOpt[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit18
   tex2D tauXiSOpt[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit19
   tex2D tauXiMetaOpt[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit20
}


// file://./glsl/tau/03_afp/2_tauAFPOpt.frag
program tauAFPOpt "tau/03_afp/2_tauAFPOpt" {
   tex2D tauXiFFinal[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit25
   tex2D tauXiSFinal[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit26
   tex2D tauXiMetaFinal[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit27
}


// file://./glsl/tau/04_stats_mask/1_tauModelStats.frag
program tauStats "tau/04_stats_mask/1_tauModelStats" {
   tex2D tauStats|tauStatsTex[1,1] TauFloatTex TexUnit21
}


// file://./glsl/tau/04_stats_mask/2_tauModelMask.frag
program tauMask "tau/04_stats_mask/2_tauModelMask" {
   tex2D tauMask|tauMaskTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit22
}


// file://./glsl/tau/05_filters/1_tauFPProxy.frag
program tauFP "tau/05_filters/1_tauFPProxy" {
   tex2D tauFP|tauFPTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit23
}


// file://./glsl/tau/05_filters/2_tauModelKL.frag
program tauKL "tau/05_filters/2_tauModelKL" {
   tex2D tauKL|tauKLTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit28
}


// file://./glsl/tau/05_filters/3_tauModelScore.frag
program tauScore "tau/05_filters/3_tauModelScore" {
   tex2D tauScore|tauScoreTex[tauMaxVeces,tauMaxVeces] TauFloatTex TexUnit29
}


// file://./glsl/tau/06_select/1_tauBestModel.frag
program tauBest "tau/06_select/1_tauBestModel" {
   tex2D tauBest|tauBestTex[1,1] TauFloatTex TexUnit17
}


// file://./glsl/tau/07_fields/1_tauSindyFields.frag
program tauSindy "tau/07_fields/1_tauSindyFields" {
   tex2D tauSindy|tauSindyTex[nBins,1] TauFloatTex TexUnit30
   tex2D tauSindyInit|tauSindyInitTex[nBins,1] TauFloatTex TexUnit31
   tex2D tauSindyTau1Ref|tauSindyTau1RefTex[nBins,1] TauFloatTex TexUnit9
}


// file://./glsl/tau/07_fields/2_tauFPStationary.frag
program tauFPStat "tau/07_fields/2_tauFPStationary" {
   tex2D tauFPStat|tauFPStatTex[nBins,1] TauFloatTex TexUnit24
}


// file://./glsl/tau/08_draw/1_drawTauMaxVeces.frag
program drawTau "tau/08_draw/1_drawTauMaxVeces" {
}

rebind drawTau {
  tauXiMetaFinal -> TexUnit27
  tauBest -> TexUnit17
  tauSindy -> TexUnit30
  tauSindyInit -> TexUnit31
  tauSindyTau1Ref -> TexUnit9
  tauModelMask -> TexUnit22
  tauFPProxy -> TexUnit23
  tauFPStationary -> TexUnit24
  tauModelKL -> TexUnit28
  tauModelScore -> TexUnit29
  tauStats -> TexUnit21
}
uniforms drawTau {
   tauMax = {tauMaxVeces}i
   tauMin = {tauMinVeces}i
   nBins = {nBins}i
   bestTau = {bestTau}i
   bestSubseq = {bestSubseq}i
   showTauCurves = {!!showTauCurves?1:0}i
   showFPStationary = {!!showFPStationary?1:0}i
   showLSOverlay = {!!showLSFOverlay?1:0}i
}
drawTau.isDepthTest=false

tick {
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(bestSubseq>=bestTau){
      bestSubseq={Math.max(0,bestTau-1)}
   }
   if(recomputeTau){
      log "C2 recomputeTau=true -> s1 tauMaxVeces + s2 tauXiLS + s2.5 tauAFP0 + s2.6 tauAFPOpt + s2.7 stats/mask + s2.8 fpProxy + s2.9 modelKL/score + s3 bestModel + s4 sindy + s4.5 fpStationary"

      //? phase 01_moments - tauMom - file://./glsl/tau/01_moments/1_tauMaxVeces.frag
      // Entrada: datosX1 con la seÃ±al 1D original del eje actual.
      // Salida: tauMom1 = [count,sumD,sumD2,maxAbs] y tauMom2 = [fKM,aKM,fErr,aErr].
      // Llamadas: 1 por cada recomputeTau. La malla depende de tauMaxVeces, tauMinVeces y nBins.
      // Efecto de variables: dtSample y tauEStar reescalan los momentos; tauMaxVeces cambia cuÃ¡ntos modelos
      // (tau,subseq) se generan y nBins cambia la resoluciÃ³n espacial de cada modelo.
      use tauMom
      uniforms tauMom {
         nSamples = {NMuestras1}i
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         dtSample = {dtSample}f
         tauEStar = {tauEStar}f
      }
      
      tauMom.bindTexName2TexUnit("datosX1", TexUnit10)
      let tauMomFBO=tauMom.cFrameBuffer().bind([ColAtch0,ColAtch1])
      tauMomFBO.bindColorBuffer(tauMom1, ColAtch0)
      tauMomFBO.bindColorBuffer(tauMom2, ColAtch1)
      tauMom.setViewport(0,0,nBins,tauMaxVeces*tauMaxVeces)
      tauMom.drawArrays("TRIANGLES",0,6)


      //? phase 02_ls - tauXi - file://./glsl/tau/02_ls/1_tauXiLS.frag
      // Entrada: tauMom1 y tauMom2.
      // Salida: tauXiF y tauXiS con los coeficientes empaquetados, tauXiMeta = [cost,valid,nUsed,reserved].
      // Llamadas: 1 por cada recomputeTau. Recorre toda la rejilla (tau,subseq).
      // Efecto de variables: tauFDegrees y tauSDegrees cambian la librerÃ­a polinÃ³mica; tauMaxVeces,
      // tauMinVeces y nBins cambian el tamaÃ±o del ajuste y cuÃ¡ntos bins usa el LS.
      use tauXi
      uniforms tauXi {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
      }
      rebind tauXi {
         tauMom1 -> TexUnit14
         tauMom2 -> TexUnit15
      }
      framebuffer tauXiFBO [tauXiF, tauXiS, tauXiMeta]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 03_afp - tauAFP - file://./glsl/tau/03_afp/1_tauAFP0.frag
      // Entrada: momentos (tauMom1,tauMom2) y semilla LS (tauXiF,tauXiS,tauXiMeta).
      // Salida: tauXiFOpt, tauXiSOpt, tauXiMetaOpt.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: afpLrF, afpLrS, afpL1F, afpL1S y afpIters controlan el descenso inicial
      // con regularizaciÃ³n L1; subir iteraciones o learning rates cambia cuÃ¡nto se aparta de la soluciÃ³n LS.
      use tauAFP
      uniforms tauAFP {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         lrF = {afpLrF}f
         lrS = {afpLrS}f
         l1F = {afpL1F}f
         l1S = {afpL1S}f
         nIter = {afpIters}i
      }
      rebind tauAFP {
         tauMom1 -> TexUnit14
         tauMom2 -> TexUnit15
         tauXiF -> TexUnit12
         tauXiS -> TexUnit13
         tauXiMeta -> TexUnit16
      }
      framebuffer tauAFPFBO [tauXiFOpt, tauXiSOpt, tauXiMetaOpt]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 03_afp - tauAFP - file://./glsl/tau/03_afp/1_tauAFP0.frag
      // Entrada: momentos y soluciÃ³n refinada anterior (tauXiFOpt,tauXiSOpt,tauXiMetaOpt).
      // Salida: tauXiFFinal, tauXiSFinal, tauXiMetaFinal.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: afpOptLr, afpOptL1, afpOptL2 y afpOptIters aÃ±aden la segunda pasada
      // de refinamiento, ahora con penalizaciÃ³n L2 para estabilizar coeficientes.
      use tauAFPOpt
      uniforms tauAFPOpt {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         lrF = {afpOptLrF}f
         lrS = {afpOptLrS}f
         l1F = {afpOptL1F}f
         l1S = {afpOptL1S}f
         l2F = {afpOptL2F}f
         l2S = {afpOptL2S}f
         nIter = {afpOptIters}i
      }
      rebind tauAFPOpt {
         tauMom1 -> TexUnit14
         tauMom2 -> TexUnit15
         tauXiFOpt -> TexUnit18
         tauXiSOpt -> TexUnit19
         tauXiMetaOpt -> TexUnit20
      }
      framebuffer tauAFPOptFBO {
         tauXiFFinal -> ColAtch0
         tauXiSFinal -> ColAtch1
         tauXiMetaFinal -> 2
      }
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 04_stats_mask - tauStats - file://./glsl/tau/04_stats_mask/1_tauModelStats.frag
      // Entrada: tauXiMetaFinal.
      // Salida: tauStats = [bestCost,threshold,maxValidCost,targetK].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: keepTopPercent fija el top-K global que luego usa la mÃ¡scara.
      use tauStats
      uniforms tauStats {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         keepPercent = {keepTopPercent}f
      }
      rebind tauStats {
         tauXiMetaFinal -> TexUnit27
      }
      framebuffer tauStatsFBO [tauStatsTex]
      viewport [0,0,1,1]
      drawTriangles 0 6


      //? phase 04_stats_mask - tauMask - file://./glsl/tau/04_stats_mask/2_tauModelMask.frag
      // Entrada: tauXiMetaFinal y tauStats.
      // Salida: tauModelMask = [selected,cost,valid,scoreN].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: tauMinVeces / tauMaxVeces recortan modelos vÃ¡lidos; el umbral real viene de tauStats.
      use tauMask
      uniforms tauMask {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
      }
      rebind tauMask {
         tauXiMetaFinal -> TexUnit27
         tauStats -> TexUnit21
      }
      framebuffer tauMaskFBO [tauMaskTex]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 05_filters - tauFP - file://./glsl/tau/05_filters/1_tauFPProxy.frag
      // Entrada: tauMom1, tauXiFFinal, tauXiSFinal, tauXiMetaFinal, tauModelMask.
      // Salida: tauFPProxy = [selectedFP,cost,validFP,spanN].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: fpLogSpanMax fija el span mÃ¡ximo admisible del proxy estacionario.
      use tauFP
      uniforms tauFP {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         logSpanMax = {fpLogSpanMax}f
      }
      rebind tauFP {
         tauMom1 -> TexUnit14
         tauXiFFinal -> TexUnit25
         tauXiSFinal -> TexUnit26
         tauXiMetaFinal -> TexUnit27
         tauModelMask -> TexUnit22
      }
      framebuffer tauFPFBO [tauFPTex]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 05_filters - tauKL - file://./glsl/tau/05_filters/2_tauModelKL.frag
      // Entrada: histograma/momentos (tauMom1) y modelo final (tauXiFFinal,tauXiSFinal,tauXiMetaFinal).
      // Salida: tauModelKL = [kl,valid,spanN,sumH].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: modelKLSpanMax limita el rango logarÃ­tmico aceptado en la pdf estacionaria.
      use tauKL
      uniforms tauKL {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         spanMax = {modelKLSpanMax}f
      }
      rebind tauKL {
         tauMom1 -> TexUnit14
         tauXiFFinal -> TexUnit25
         tauXiSFinal -> TexUnit26
         tauXiMetaFinal -> TexUnit27
      }
      framebuffer tauKLFBO [tauKLTex]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 05_filters - tauScore - file://./glsl/tau/05_filters/3_tauModelScore.frag
      // Entrada: tauXiMetaFinal, tauModelMask, tauFPProxy, tauModelKL, tauStats.
      // Salida: tauModelScore = [selected,score,valid,costRaw].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: scoreWCost, scoreWKL, scoreWSpan, scoreKLMax y scoreMaxCut
      // cambian la mezcla final con la que se ordenan y recortan los modelos.
      use tauScore
      uniforms tauScore {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         wCost = {scoreWCost}f
         wKL = {scoreWKL}f
         wSpan = {scoreWSpan}f
         klMax = {scoreKLMax}f
         scoreMax = {scoreMaxCut}f
      }
      rebind tauScore {
         tauXiMetaFinal -> TexUnit27
         tauModelMask -> TexUnit22
         tauFPProxy -> TexUnit23
         tauModelKL -> TexUnit28
         tauStats -> TexUnit21
      }
      framebuffer tauScoreFBO [tauScoreTex]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles 0 6


      //? phase 06_select - tauBest - file://./glsl/tau/06_select/1_tauBestModel.frag
      // Entrada: tauXiMetaFinal, tauModelMask, tauFPProxy, tauModelScore.
      // Salida: tauBest = [bestTau,bestSubseq,bestCost,found].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: useFPFilter y useScoreSelection hacen mÃ¡s o menos estricta la bÃºsqueda
      // del mejor candidato; tauMinVeces y tauMaxVeces siguen acotando la rejilla.
      use tauBest
      uniforms tauBest {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         useMask = 1i
         useFP = {!!useFPFilter?1:0}i
         useScore = {!!useScoreSelection?1:0}i
      }
      rebind tauBest {
         tauXiMetaFinal -> TexUnit27
         tauModelMask -> TexUnit22
         tauFPProxy -> TexUnit23
         tauModelScore -> TexUnit29
      }
      framebuffer tauBestFBO [tauBestTex]
      viewport [0,0,1,1]
      drawTriangles 0 6


      //? phase 07_fields - tauSindy (init) - file://./glsl/tau/07_fields/1_tauSindyFields.frag
      // Entrada: tauMom1, tauXiF, tauXiS, tauBest.
      // Salida: tauSindyInit = [x,f,s,a] evaluado sobre la soluciÃ³n inicial.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: bestTau y bestSubseq seleccionan el modelo a proyectar; nBins cambia la
      // resoluciÃ³n de las curvas en x.
      use tauSindy
      tauMinVeces={Math.max(1,~~tauMinVeces)}
      tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
      bestTau={Math.max(tauMinVeces,~~bestTau)}
      bestTau={Math.min(bestTau,tauMaxVeces)}
      bestSubseq={Math.max(0,~~bestSubseq)}
      if(bestSubseq>=bestTau){
         bestSubseq={Math.max(0,bestTau-1)}
      }
      uniforms tauSindy {
         tauMax = {tauMaxVeces}i
         nBins = {nBins}i
         selectedTau = {bestTau}i
         selectedSubseq = {bestSubseq}i
         useSelected = 1i
      }
      rebind tauSindy {
         tauMom1 -> TexUnit14
         tauXiF -> TexUnit18
         tauXiS -> TexUnit19
         tauBest -> TexUnit17
      }
      framebuffer tauSindyInitFBO [tauSindyInitTex]
      viewport [0,0,nBins,1]
      drawTriangles 0 6


      //? phase 07_fields - tauSindy (tau=1 ref) - file://./glsl/tau/07_fields/1_tauSindyFields.frag
      // Entrada: mismo shader tauSindy, pero forzando selectedTau=1 y selectedSubseq=0.
      // Salida: tauSindyTau1Ref = [x,f,s,a] para usarlo como referencia LS fija en overlays.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: sÃ³lo nBins; el modelo queda fijado manualmente a tau=1,sub=0.
      uniforms tauSindy {
         tauMax = {tauMaxVeces}i
         nBins = {nBins}i
         selectedTau = 1i
         selectedSubseq = 0i
         useSelected = 1i
      }
      framebuffer tauSindyTau1RefFBO [tauSindyTau1RefTex]
      viewport [0,0,nBins,1]
      drawTriangles 0 6


      //? phase 07_fields - tauSindy (final) - file://./glsl/tau/07_fields/1_tauSindyFields.frag
      // Entrada: tauMom1, tauXiFFinal, tauXiSFinal, tauBest.
      // Salida: tauSindy = [x,f,s,a] con el modelo final seleccionado.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: bestTau, bestSubseq y nBins.
      uniforms tauSindy {
         tauMax = {tauMaxVeces}i
         nBins = {nBins}i
         selectedTau = {bestTau}i
         selectedSubseq = {bestSubseq}i
         useSelected = 1i
      }
      rebind tauSindy {
         tauXiF -> TexUnit25
         tauXiS -> TexUnit26
      }
      framebuffer tauSindyFBO [tauSindyTex]
      viewport [0,0,nBins,1]
      drawTriangles 0 6


      //? phase 07_fields - tauFPStat - file://./glsl/tau/07_fields/2_tauFPStationary.frag
      // Entrada: tauMom1, coeficientes init/final y tauBest.
      // Salida: tauFPStationary = [pHist,pInit,pFinal,valid].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: bestTau, bestSubseq, tauMinVeces, tauMaxVeces y nBins.
      // AquÃ­ se comparan directamente las distribuciones estacionarias inicial y final frente al histograma real.
      use tauFPStat
      tauMinVeces={Math.max(1,~~tauMinVeces)}
      tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
      bestTau={Math.max(tauMinVeces,~~bestTau)}
      bestTau={Math.min(bestTau,tauMaxVeces)}
      bestSubseq={Math.max(0,~~bestSubseq)}
      if(bestSubseq>=bestTau){
         bestSubseq={Math.max(0,bestTau-1)}
      }
      uniforms tauFPStat {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         selectedTau = {bestTau}i
         selectedSubseq = {bestSubseq}i
         useSelected = 1i
      }
      rebind tauFPStat {
         tauMom1 -> TexUnit14
         tauXiFOpt -> TexUnit18
         tauXiSOpt -> TexUnit19
         tauXiMetaOpt -> TexUnit20
         tauXiFFinal -> TexUnit25
         tauXiSFinal -> TexUnit26
         tauXiMetaFinal -> TexUnit27
         tauBest -> TexUnit17
      }
      framebuffer tauFPStatFBO [tauFPStatTex]
      viewport [0,0,nBins,1]
      drawTriangles 0 6


      //? phase 09_debug - reads / logs
      // Entrada: varias FBOs ya calculadas en esta misma pasada.
      // Salida: sÃ³lo consola; no escribe texturas nuevas.
      // Llamadas: hasta tauDebugFrames veces tras un recomputeTau.
      // Efecto de variables: tauDebugFrames limita cuÃ¡ntas veces se imprime; autoPickBest puede actualizar
      // bestTau y bestSubseq a partir de tauBest mientras el debug estÃ¡ activo.
      if(tauDebugFrames>0){
         let statsSample={tauStatsFBO.readColorAttachment(0,0,0,1,1,TexExamples.RGBAFloat16,4)}
         let bestSample={tauBestFBO.readColorAttachment(0,0,0,1,1,TexExamples.RGBAFloat16,4)}
         let bestArr={Array.from(bestSample)}
         let stArr={Array.from(statsSample)}
         log "C2 muestras: y=0 => tau=1,subseq=0 ; y=tauMax => tau=2,subseq=0"
         logFBO tauMomFBO ColAtch1 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 mom2 tau1-sub0 [fKM,aKM,fErr,aErr] bins 0..3"
         logFBO tauMomFBO ColAtch1 [0,tauMaxVeces,4,1] TexExamples.RGBAFloat16 dim=4 "C2 mom2 tau2-sub0 [fKM,aKM,fErr,aErr] bins 0..3"
         logFBO tauXiFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack0 LS sample"
         logFBO tauXiFBO ColAtch1 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack1 LS sample"
         logFBO tauXiFBO ColAtch2 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi meta LS sample [cost,valid,nUsed,reserved]"
         logFBO tauAFPFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack0 AFP0 sample"
         logFBO tauAFPFBO ColAtch1 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack1 AFP0 sample"
         logFBO tauAFPFBO ColAtch2 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi meta AFP0 sample [cost,valid,nUsed,reserved]"
         logFBO tauAFPOptFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack0 FINAL sample"
         logFBO tauAFPOptFBO ColAtch1 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi pack1 FINAL sample"
         logFBO tauAFPOptFBO ColAtch2 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 tauXi meta FINAL sample [cost,valid,nUsed,reserved]"
         log {stArr} "C2 stats [bestCost,threshold,maxValidCost,targetK]"
         logFBO tauMaskFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 mask sample [selected,cost,valid,scoreN]"
         logFBO tauFPFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 fpProxy sample [selectedFP,cost,validFP,spanN]"
         logFBO tauKLFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 modelKL sample [kl,valid,spanN,sumH]"
         logFBO tauScoreFBO ColAtch0 [0,0,4,1] TexExamples.RGBAFloat16 dim=4 "C2 modelScore sample [selected,score,valid,costRaw]"
         log {bestArr} "C2 bestModel [tau,subseq,cost,found]"
         logFBO tauSindyInitFBO ColAtch0 [0,0,8,1] TexExamples.RGBAFloat16 dim=4 "C2 sindy INIT sample [x,f,s,a] bins 0..7"
         logFBO tauSindyFBO ColAtch0 [0,0,8,1] TexExamples.RGBAFloat16 dim=4 "C2 sindy sample [x,f,s,a] bins 0..7"
         logFBO tauFPStatFBO ColAtch0 [0,0,8,1] TexExamples.RGBAFloat16 dim=4 "C2 fpStationary sample [pHist,pInit,pFinal,valid] bins 0..7"
         if(autoPickBest){
            bestTau={Math.max(tauMinVeces,~~(bestArr[0]||1))}
            bestTau={Math.min(bestTau,tauMaxVeces)}
            bestSubseq={Math.max(0,~~(bestArr[1]||0))}
         }
         if(logTopModels){
            let bestX={Math.max(0,bestTau-1)}
            let bestY={Math.max(0,bestSubseq)}
            let bestXiF={tauAFPOptFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4)}
            let bestXiS={tauAFPOptFBO.readColorAttachment(1,bestX,bestY,1,1,TexExamples.RGBAFloat16,4)}
            let bestXiMeta={tauAFPOptFBO.readColorAttachment(2,bestX,bestY,1,1,TexExamples.RGBAFloat16,4)}
            let bestKL={tauKLFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4)}
            let bestScore={tauScoreFBO.readColorAttachment(0,bestX,bestY,1,1,TexExamples.RGBAFloat16,4)}
            log {Array.from(bestXiF)} "C2 BEST Xi pack0 [c0..c3]"
            log {Array.from(bestXiS)} "C2 BEST Xi pack1 [c4..c7]"
            log {Array.from(bestXiMeta)} "C2 BEST Xi meta [cost,valid,nUsed,reserved]"
            log {Array.from(bestKL)} "C2 BEST KL [kl,valid,spanN,sumH]"
            log {Array.from(bestScore)} "C2 BEST SCORE [selected,score,valid,costRaw]"
         }
         tauDebugFrames-=1
      }


      //? phase 10_cleanup - unbind / stamps
      // Entrada: todos los programas que han dejado FBO activo en este recomputeTau.
      // Salida: limpia estados de framebuffer y marca tauModelStamp.
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: tauModelStamp sirve de invalidaciÃ³n para HUD, simulaciÃ³n y mapas derivados.
      unbindFBO {
         tauFPStat, tauSindy, tauBest
         tauScore
         tauKL
         tauFP
         tauMask
         tauStats
         tauAFPOpt
         tauAFP
         tauXi
         tauMom
      }
      tauModelStamp+=1
      __publishSimTrajectoryFromTau(true)
      recomputeTau=false
   }
}

drawTauPanel (20) {
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(bestSubseq>=bestTau){
      bestSubseq={Math.max(0,bestTau-1)}
   }
   gl.bindFramebuffer(gl.FRAMEBUFFER, null)
   gl.disable(gl.DEPTH_TEST)
   use drawTau
   drawTau.VAO.bind()
   viewport drawTau {[0,0,canvas.width,canvas.height]}
   if(useLSView){
      rebind drawTau {
         tauXiMetaFinal -> TexUnit16
      }
   }else{
      rebind drawTau {
         tauXiMetaFinal -> TexUnit27
      }
   }
   rebind drawTau {
      tauBest -> TexUnit17
      tauSindy -> TexUnit30
      tauSindyInit -> TexUnit31
      tauSindyTau1Ref -> TexUnit9
      tauModelMask -> TexUnit22
      tauFPProxy -> TexUnit23
      tauModelKL -> TexUnit28
      tauModelScore -> TexUnit29
      tauFPStationary -> TexUnit24
      tauStats -> TexUnit21
   }
   drawTau.uniforms.tauMax.set({tauMaxVeces})
   drawTau.uniforms.tauMin.set({tauMinVeces})
   drawTau.uniforms.bestTau.set({bestTau})
   drawTau.uniforms.bestSubseq.set({bestSubseq})
   drawTau.uniforms.showTauCurves.set({!!showTauCurves?1:0})
   drawTau.uniforms.showFPStationary.set({!!showFPStationary?1:0})
   drawTau.uniforms.showLSOverlay.set({!!showLSFOverlay?1:0})
   if(c2DrawLogFrames>0){
      log "C2 drawTauPanel" {bestTau} {bestSubseq} {gl.getParameter(gl.FRAMEBUFFER_BINDING)}
      c2DrawLogFrames-=1
   }
   drawTau.drawArrays("TRIANGLES",0,6)
   if(typeof __drawTauHud==="function"){
      __drawTauHud()
   }
}

// Input / toggles
OnKeyPress "u" {
   recomputeTau=true
}

OnKeyPress "q" {
   useLSView={!useLSView}
}

OnKeyPress "e" {
   autoPickBest={!autoPickBest}
   recomputeTau=true
}

OnKeyPress "n" {
   keepTopPercent={Math.min(80,keepTopPercent+5)}
   recomputeTau=true
}

OnKeyPress "i" {
   keepTopPercent={Math.max(5,keepTopPercent-5)}
   recomputeTau=true
}

OnKeyPress "j" {
   showMSDOverlay={!showMSDOverlay}
   if(showMSDOverlay){
      showTauCurves=true
   }
}

OnKeyPress "f" {
   useFPFilter={!useFPFilter}
   recomputeTau=true
}

OnKeyPress "t" {
   showTauCurves={!showTauCurves}
}

OnKeyPress "b" {
   showRawKMOverlay={!showRawKMOverlay}
   if(showRawKMOverlay){
      showTauCurves=true
   }
}

OnKeyPress "m" {
   showLSFOverlay={!showLSFOverlay}
   if(showLSFOverlay){
      showTauCurves=true
   }
}

OnKeyPress "r" {
   showFPStationary={!showFPStationary}
   if(showFPStationary){
      showTauCurves=true
   }
}

OnKeyPress "o" {
   useScoreSelection={!useScoreSelection}
   recomputeTau=true
}

OnKeyPress "l" {
   showMSDScoreMap={!showMSDScoreMap}
}

OnKeyPress "x" {
   autoPickBest=false
   let prevTauX={bestTau}
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   let wasOutX={bestTau<tauMinVeces || bestTau>tauMaxVeces}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(!wasOutX){
      bestTau={Math.min(bestTau+1,tauMaxVeces)}
   }
   if(bestTau==prevTauX){
      log "C2 x: limite superior tau" {bestTau} "[" {tauMinVeces} "," {tauMaxVeces} "]"
   }
   if(bestSubseq>=bestTau){
      bestSubseq={bestTau-1}
   }
   bestSubseq={Math.max(0,~~bestSubseq)}
   __requestTauRecompute()
}

OnKeyPress "z" {
   autoPickBest=false
   let prevTauZ={bestTau}
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   let wasOutZ={bestTau<tauMinVeces || bestTau>tauMaxVeces}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(!wasOutZ){
      bestTau={Math.max(bestTau-1,tauMinVeces)}
   }
   if(bestTau==prevTauZ){
      log "C2 z: limite inferior tau" {bestTau} "[" {tauMinVeces} "," {tauMaxVeces} "]"
   }
   if(bestSubseq>=bestTau){
      bestSubseq={bestTau-1}
   }
   bestSubseq={Math.max(0,~~bestSubseq)}
   __requestTauRecompute()
}

OnKeyPress "v" {
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(bestTau>1){
      autoPickBest=false
      bestSubseq={(bestSubseq+1)%bestTau}
      bestSubseq={Math.max(0,~~bestSubseq)}
      __requestTauRecompute()
   }
}

OnKeyPress "c" {
   tauMinVeces={Math.max(1,~~tauMinVeces)}
   tauMaxVeces={Math.max(tauMinVeces,~~tauMaxVeces)}
   bestTau={Math.max(tauMinVeces,~~bestTau)}
   bestTau={Math.min(bestTau,tauMaxVeces)}
   bestSubseq={Math.max(0,~~bestSubseq)}
   if(bestTau>1){
      autoPickBest=false
      bestSubseq={(bestSubseq-1+bestTau)%bestTau}
      bestSubseq={Math.max(0,~~bestSubseq)}
      __requestTauRecompute()
   }else{
      log "C2 c: tau actual no tiene subsecuencias" {bestTau}
   }
}

start

<Pos>



