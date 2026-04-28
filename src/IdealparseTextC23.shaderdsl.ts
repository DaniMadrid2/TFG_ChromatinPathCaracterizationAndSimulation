/*
TODO sobre sintaxis

El color de un textureUnit debe tener un color gris si no se usa, otro color si se ha usado en todo el documento 
junto a una sola textura, y otro si se está cambiando de textura. 

Lo mismo para las texturas: color gris si no se usan, sin embargo ahora estarán en bold si se usan en solo un programa, si no
según su última asignación detectada se instará un color diferente para cada una de las 32 TexUnits.

Posiblemente implemente una forma de definir colores en los programas a mano (con alguna estructura del tipo rgb()/rgba()/hsl()/hsla().
Y alguna forma de definir variables asociadas a estos de los cuales se herede el color.
Y finalmente unos colores predefinidos y un bloque de definición de colores junto a nombre/identificador (puede ser el mismo que una variable ya 
que los colores se implementan junto a la definicion del programa).

Al principio del documento justo después del let si se detecta bloque de definicion de colores, texturas u otros 
la propia extension se encargaría de contraerlos si es la primera vez que se abre el documento.

*/

let {
  tauMaxVeces=10, tauMinVeces=1
  nBins=64
  tauEStar=1.0, dtSample=1.0
  recomputeTau=false, tauDebugFrames=4, c2DrawLogFrames=3
  bestTau=1, bestSubseq=0
  autoPickBest=true, useLSView=false
  afpLrF=0.04, afpLrS=0.06
  afpL1F=0.0004, afpL1S=0.0002, afpIters=5
  afpOptL2F=0.0008, afpOptL2S=0.0008
  nelderShift=0.02, nelderAlpha=1.0, nelderGamma=2.0, 
  nelderRho=0.5, nelderSigma=0.5, 
  nelderIters=12, //nº máximo de iteraciones totales de Nelder-Mead (en bloques)
  nelderChunkIters=5, //nº de iteraciones internas de Nelder-Mead antes de volver a CPU a comprobar flags
  nelderStopEps=1e-4, // Recomendado para nuestra escala: 1e-5..1e-4
  tauAdjTauBatch=1, tauExpTerms=4, tauArnoldiReorth=3, tauArnoldiResidTol=0.2,
  tauKLReg=0.05,
  steadyFPSolverMode="peak_anchor_mass_norm", // "peak_anchor_mass_norm" | "fourier_zero_mode_like"
  useAdjointAFP=true // true: coste con AdjFP truncado; false: coste directo antiguo
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

var {
  tauRuntimeLabel="adjoint-afp"
}
let tauPolyExpr=(deg)=>deg<0?"0.0":deg===0?"1.0":deg===1?"x":Array(deg).fill("x").join("*")
let derived tauFTerms=tauFDegrees.length
let derived tauSTerms=tauSDegrees.length
let derived tauTotalTerms=tauFTerms+tauSTerms
//Convierte [a,b,c,d] -> x**a+x**b+x**c+x**d
let tauBasisBody=(degrees)=>degrees.map((d,i)=>"if(termIdx=="+i+") return "+tauPolyExpr(d)+";").join(" ")
if(tauTotalTerms>8) throw new Error("tauTotalTerms debe ser <= 8 con el empaquetado actual (dos RGBA).")

setTauBounds_u = uniforms {
  tauMax = {tauMaxVeces}i
  tauMin = {tauMinVeces}i
}

glslFilters {
   both "tau/" "const int TAU_F_TERMS = 4; //Var@TAU_F_TERM_COUNT" -> {"const int TAU_F_TERMS = " + String(tauFTerms) + ";"}
   both "tau/" "const int TAU_S_TERMS = 1; //Var@TAU_S_TERM_COUNT" -> {"const int TAU_S_TERMS = " + String(tauSTerms) + ";"}
   both "tau/" "const int TAU_TOTAL_TERMS = 5; //Var@TAU_TOTAL_TERM_COUNT" -> {"const int TAU_TOTAL_TERMS = " + String(tauTotalTerms) + ";"}
   both "tau/" "return 0.0; //Var@TAU_F_BASIS_BODY" -> {tauBasisBody(tauFDegrees) + " return 0.0;"}
   both "tau/" "return 0.0; //Var@TAU_S_BASIS_BODY" -> {tauBasisBody(tauSDegrees) + " return 0.0;"}
}

//resource TauFloatTex {
texturePreset TauFloatTex {
   format: RGBA16
   filter: NEAREST
   wrap: CLAMP
}


let extC2 = gl.getExtension("EXT_color_buffer_float")
if(!extC2){
   log "EXT_color_buffer_float no soportado en C2"
}

// file://./glsl/tau/01_moments/1_tauMaxVeces.frag
program tauMom|progTauMom "tau/01_moments/1_tauMaxVeces" {
   tex2D datosX1|xTex[NMuestras1,1] RFloat TexUnit10 <= tauSignalData //<= indica que empieza con los datos de la variable/textura/array/TextureArray
   tex2D datosY1|yTex[NMuestras1,1] RFloat TexUnit11 <= datosY1
   tex2D tauMom1 RES [nBins x tauMaxVeces*tauMaxVeces] TauFloatTex TexUnit14
   tex2D tauMom2 RES [nBins x tauMaxVeces*tauMaxVeces] TauFloatTex TexUnit15
}

// file://./glsl/tau/02_ls/1_tauXiLS.frag
program tauXi "tau/02_ls/1_tauXiLS" {
   tex2D tauXiF RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit12
   tex2D tauXiS RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit13
   tex2D tauXiMeta RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit16
}


// file://./glsl/tau/03_afp/1_tauAFP0.frag
program tauAFP "tau/03_afp/1_tauAFP0" {
   tex2D tauXiFOpt RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit18
   tex2D tauXiSOpt RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit19
   tex2D tauXiMetaOpt RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit20
}


// file://./glsl/tau/03_afp/2_tauAFPOpt.frag
program tauAFPOpt "tau/03_afp/2_tauAFPOpt" {
   tex2D tauXiFFinal RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit25
   tex2D tauXiSFinal RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit26
   tex2D tauXiMetaFinal RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit27
}


// file://./glsl/tau/03_afp/3_tauAdjointCost.frag
program tauAdjCost "tau/03_afp/3_tauAdjointCost" {
}


// file://./glsl/tau/03_afp/4_tauNMSimplexInit.frag
program tauNMSimplexInit "tau/03_afp/4_tauNMSimplexInit" {
   tex2D tauNMXiF0 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit4
   tex2D tauNMXiS0 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit5
   tex2D tauNMMeta0 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit6
   tex2D tauNMXiF1 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit7
   tex2D tauNMXiS1 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit8
   tex2D tauNMMeta1 RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit9
   tex2D tauNMCost RES [tauMaxVeces x tauMaxVeces*9] TauFloatTex TexUnit11
}


// file://./glsl/tau/03_afp/5_tauNMStep.frag
program tauNMStep "tau/03_afp/5_tauNMStep" {
}


// file://./glsl/tau/03_afp/6_tauNMFinalize.frag
program tauNMFinalize "tau/03_afp/6_tauNMFinalize" {
}


// file://./glsl/tau/03_afp/7_tauAdjointFields.frag
program tauAdjFields "tau/03_afp/7_tauAdjointFields" {
   // por qué llamamos tauAdjFields| tauAdjFieldsTex a la textura? ¿No es redundante?
   // El nombre antes de | es el nombre de la variable/textura que se usará dentro del shader,
   // mientras que el nombre después de | es el nombre de la textura que se va a crear en la GPU y que se va a asociar a esa variable. 
   tex2D tauAdjFields ~ tauAdjFieldsTex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit28
}


// file://./glsl/tau/03_afp/8_tauAdjointDiffOps.frag
program tauAdjDiffOps "tau/03_afp/8_tauAdjointDiffOps" {
   tex2D tauAdjDiffOps ~ tauAdjDiffOpsTex RES [nBins*nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit29
}


// file://./glsl/tau/03_afp/9_tauAdjointOperator.frag
program tauAdjOperator "tau/03_afp/9_tauAdjointOperator" {
   tex2D tauAdjOperator ~ tauAdjOperatorTex RES [nBins*nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit30
}


// file://./glsl/tau/03_afp/10_tauAdjointExp.frag
program tauAdjExp "tau/03_afp/10_tauAdjointExp" {
   tex2D tauAdjExp ~ tauAdjExpTex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit31
}


// file://./glsl/tau/03_afp/11_tauSteadyFP.frag
program tauSteadyFP "tau/03_afp/11_tauSteadyFP" {
   tex2D tauSteadyFP ~ tauSteadyFPTex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit27
}


// file://./glsl/tau/03_afp/12_tauKrylovInit.frag
program tauKrylovInit "tau/03_afp/12_tauKrylovInit" {
   tex2D tauKrylov0 ~ tauKrylov0Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit23
}


// file://./glsl/tau/03_afp/13_tauKrylovStep.frag
program tauKrylovStep "tau/03_afp/13_tauKrylovStep" {
   tex2D tauKrylov1 ~ tauKrylov1Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit24
   tex2D tauKrylov2 ~ tauKrylov2Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit25
   tex2D tauKrylov3 ~ tauKrylov3Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit26
   tex2D tauKrylov4 ~ tauKrylov4Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit2
   tex2D tauKrylov5 ~ tauKrylov5Tex RES [nBins x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit3
}


// file://./glsl/tau/03_afp/14_tauArnoldiCoeff.frag
program tauArnoldiCoeff "tau/03_afp/14_tauArnoldiCoeff" {
   tex2D tauArnoldiCoeff ~ tauArnoldiCoeffTex RES [14 x tauAdjTauBatch*tauMaxVeces*9] TauFloatTex TexUnit22
}


// file://./glsl/tau/04_stats_mask/1_tauModelStats.frag
program tauStats "tau/04_stats_mask/1_tauModelStats" {
   tex2D tauStats ~ tauStatsTex RES [1 x 1] TauFloatTex TexUnit21
}


// file://./glsl/tau/04_stats_mask/2_tauModelMask.frag
program tauMask "tau/04_stats_mask/2_tauModelMask" {
   tex2D tauMask ~ tauMaskTex RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit22
}


// file://./glsl/tau/05_filters/1_tauFPProxy.frag
program tauFP "tau/05_filters/1_tauFPProxy" {
   tex2D tauFP ~ tauFPTex RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit23
}


// file://./glsl/tau/05_filters/2_tauModelKL.frag
program tauKL "tau/05_filters/2_tauModelKL" {
   tex2D tauKL ~ tauKLTex RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit4
}


// file://./glsl/tau/05_filters/3_tauModelScore.frag
program tauScore "tau/05_filters/3_tauModelScore" {
   tex2D tauScore ~ tauScoreTex RES [tauMaxVeces x tauMaxVeces] TauFloatTex TexUnit5
}


// file://./glsl/tau/06_select/1_tauBestModel.frag
program tauBest "tau/06_select/1_tauBestModel" {
   tex2D tauBest ~ tauBestTex RES [1 x 1] TauFloatTex TexUnit17
}


// file://./glsl/tau/07_fields/1_tauSindyFields.frag
program tauSindy "tau/07_fields/1_tauSindyFields" {
   tex2D tauSindy ~ tauSindyTex RES [nBins x 1] TauFloatTex TexUnit6
   tex2D tauSindyInit ~ tauSindyInitTex RES [nBins x 1] TauFloatTex TexUnit7
   tex2D tauSindyTau1Ref ~ tauSindyTau1RefTex RES [nBins x 1] TauFloatTex TexUnit8
}


// file://./glsl/tau/07_fields/2_tauFPStationary.frag
program tauFPStat "tau/07_fields/2_tauFPStationary" {
   tex2D tauFPStat ~ tauFPStatTex RES [nBins x 1] TauFloatTex TexUnit24
}


// file://./glsl/tau/08_draw/1_drawTauMaxVeces.frag
program drawTau "tau/08_draw/1_drawTauMaxVeces" {
}

rebind drawTau {
  tauXiMetaFinal -> TexUnit27
  tauBest -> TexUnit17
  tauSindy -> TexUnit6
  tauSindyInit -> TexUnit7
  tauSindyTau1Ref -> TexUnit8
  tauModelMask -> TexUnit22
  tauFPProxy -> TexUnit23
  tauFPStationary -> TexUnit24
  tauModelKL -> TexUnit4
  tauModelScore -> TexUnit5
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
      // Entrada: datosX1 con la señal 1D original del eje actual.
      // Salida: tauMom1 = [count,sumD,sumD2,maxAbs] y tauMom2 = [fKM,aKM,fErr,aErr].
      // Llamadas: 1 por cada recomputeTau. La malla depende de tauMaxVeces, tauMinVeces y nBins.
      // Efecto de variables: dtSample y tauEStar reescalan los momentos; tauMaxVeces cambia cuántos modelos
      // (tau,subseq) se generan y nBins cambia la resolución espacial de cada modelo.
      use tauMom
      uniforms tauMom {
         nSamples = {NMuestras1}i
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         nBins = {nBins}i
         dtSample = {dtSample}f
         tauEStar = {tauEStar}f
      }
      

      //tauMom.bindTexName2TexUnit("datosX1", TexUnit10)
      rebind tauMom datosX1 -> TexUnit10
      framebuffer tauMomFBO [tauMom1, tauMom2]
      viewport [0,0,nBins,tauMaxVeces*tauMaxVeces]
      drawTriangles
      // let tauMomFBO=tauMom.cFrameBuffer().bind([ColAtch0,ColAtch1])
      // tauMomFBO.bindColorBuffer(tauMom1, ColAtch0)
      // tauMomFBO.bindColorBuffer(tauMom2, ColAtch1)
      // tauMom.setViewport(0,0,nBins,tauMaxVeces*tauMaxVeces)
      // tauMom.drawArrays("TRIANGLES",0,6)


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
      drawTriangles


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
      drawTriangles


      //? phase 03_afp - tauAFPOpt multipass - file://./glsl/tau/03_afp/2_tauAFPOpt.frag
      // Entrada: momentos y semilla AFP0 (tauXiFOpt,tauXiSOpt,tauXiMetaOpt).
      // Salida: tauXiFFinal, tauXiSFinal, tauXiMetaFinal.
      // Llamadas: multipaso dentro del while. Cada iteraci?n hace coste real por v?rtice + paso Nelder-Mead.
      // Efecto de variables: Nelder-Mead ya se propaga con el coste del shader adjoint, no con uno simplificado fuera del bucle.
      use tauNMSimplexInit
      uniforms tauNMSimplexInit {
         tauMax = {tauMaxVeces}i
         tauMin = {tauMinVeces}i
         // nelderShift = {nelderShift}f
         nelderShift f
      }
      rebind tauNMSimplexInit {
         tauXiFOpt -> TexUnit18
         tauXiSOpt -> TexUnit19
         tauXiMetaOpt -> TexUnit20
      }
      framebuffer tauNMInitFBO [tauNMXiF0, tauNMXiS0, tauNMMeta0]
      viewport [0,0,tauMaxVeces,tauMaxVeces*9]
      drawTriangles

      let local { //local indica que estas variables son de este pequeño contexto, por lo tanto estarán de otro color
         tauNMReadF=tauNMXiF0 //¿Por qué renombrar texturas? yo lo quitaría, lo que queremos aquí es crear una función, pero como el uso es especifico no hace falta
         tauNMReadS=tauNMXiS0
         tauNMReadM=tauNMMeta0
         tauNMWriteF=tauNMXiF1
         tauNMWriteS=tauNMXiS1
         tauNMWriteM=tauNMMeta1

         tauAFPOptDone=false
         tauAFPOptPass=0
         tauAFPOptMaxPasses={Math.max(1,~~nelderIters)}
         tauAFPOptCheckEvery={Math.max(1,~~nelderChunkIters)}
      }
      //Mientras no termine ni se alcance el máximo de iteraciones
      while(tauAFPOptPass<tauAFPOptMaxPasses && !tauAFPOptDone) - Nelder-Mead - { 
         //Estructuras -- dentro de definición bucles o bloques/Funciones que indican procesos ya conocidos por expertos (indicar en negrita y algo como blanco)
         //Si hay otras estructuras con -- dentro de este bloque al hacer hover aparecerán ordenadas.

         //En el futuro soportar creación de bloques/funciones definidos por el usuario, dejando siempre estructuras/bloques/espacios/subfunciones 
         //nombradas para añadir código específico
         let tauAFPOptChunk={Math.min(tauAFPOptCheckEvery, tauAFPOptMaxPasses-tauAFPOptPass)}
         opti-let tauNMInner=0 // contador interno del chunk de optimización
         //de optimización, la llamamos opti de optimización, o la llamamos preventiva, es decir no relativa (color rojo o algo naranja para parecer desapercibido)
         while(tauNMInner<tauAFPOptChunk) -opti- {tauAFPOptChunk} steps to check end in CPU  - { //opti indica medida de optimización, no relevante con el proceso
         //{} indica que no es texto sino una variable, por lo que se mostrará su valor predefinido junto a este, y se esconderán los {} si no se está editando
            let tauAdjX0=0 //Estamos dentro de while, se sobreentiende que es local, si no se pondría var tauAdjX0=0
            while(tauAdjX0<tauMaxVeces){ //mientaras que el offset de tau sea menor que el máximo de tau, es decir, mientras no hayamos procesado todos los batches de tau
            //Este offset indica desde qué tauBatch estamos procesando, ya que cada batch procesa tauAdjTauBatch taus, por lo tanto el offset se +=tauAdjTauBatch
            //Esto es básicamente un bucle for
               let tauAdjCount={Math.min(Math.max(1,~~tauAdjTauBatch), tauMaxVeces-tauAdjX0)}

               use tauAdjFields
               uniforms tauAdjFields {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
               }
               rebind tauAdjFields {
                  tauMom1 -> TexUnit14
                  tauNMXiFRead -> TexUnit4
                  tauNMXiSRead -> TexUnit5
                  tauNMMetaRead -> TexUnit6
               }
               // ¿Por qué se repite tauNMXiFRead y tauNMReadF y otras que parecen ser la misma textura? 
               //porque en cada iteración de Nelder-Mead se van a ir leyendo y
               // escribiendo texturas diferentes, por lo tanto estas variables/tauNMXiFRead 
               //actúan como punteros que se van a ir actualizando para apuntar a la textura
               // correcta en cada iteración, mientras que tauNMXiF0 y tauNMXiF1 son las texturas
               // físicas reales que se van a ir usando para lectura y escritura alternadamente.
               // tauNMReadF.bind("TexUnit4")
               // tauNMReadS.bind("TexUnit5")
               // tauNMReadM.bind("TexUnit6")

               // framebuffer tauAdjFieldsFBO [tauAdjFieldsTex]
               // viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               // drawTriangles
               //En vez de usar framebuffer, definir su viewpoer y dibujar en triangulos con 6 vertices, podemos simplificar esta estructura a
               //una forma más legible así:
               drawTriangles with tauAdjFieldsTex viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               //o
               drawTriangles with tauAdjFieldsTex size [nBins,tauAdjCount*tauMaxVeces*9]
               //así se crea la variable de framebuffer temporalmente y no se mantiene en las variables, de todos modos creo que se mantiene en
               //la tauAdjFieldsTex.fbo

               use tauAdjDiffOps
               uniforms tauAdjDiffOps {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
               }
               rebind tauAdjDiffOps {
                  tauMom1 -> TexUnit14
               }
               framebuffer tauAdjDiffOpsFBO [tauAdjDiffOpsTex]
               viewport [0,0,nBins*nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauAdjOperator
               uniforms tauAdjOperator {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
               }
               rebind tauAdjOperator {
                  tauAdjFields -> TexUnit28
                  tauAdjDiffOps -> TexUnit29
               }
               framebuffer tauAdjOperatorFBO [tauAdjOperatorTex]
               viewport [0,0,nBins*nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               // separador para evitar que el parser anide el siguiente bloque dentro del draw anterior
               use tauKrylovInit
               uniforms tauKrylovInit {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
               }
               rebind tauKrylovInit {
                  tauAdjFields -> TexUnit28
               }
               framebuffer tauKrylov0FBO [tauKrylov0Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauKrylovStep
               uniforms tauKrylovStep {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
               }
               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit23
               }
               framebuffer tauKrylov1FBO [tauKrylov1Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit24
               }
               framebuffer tauKrylov2FBO [tauKrylov2Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit25
               }
               framebuffer tauKrylov3FBO [tauKrylov3Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit26
               }
               framebuffer tauKrylov4FBO [tauKrylov4Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit2
               }
               framebuffer tauKrylov5FBO [tauKrylov5Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauArnoldiCoeff
               uniforms tauArnoldiCoeff {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
                  tauArnoldiReorth = {Math.max(1, Math.min(4, ~~tauArnoldiReorth))}i
                  tauArnoldiResidTol = {Math.max(1e-4, Math.min(0.9, tauArnoldiResidTol))}f
               }
               rebind tauArnoldiCoeff {
                  tauKrylov0 -> TexUnit23
                  tauKrylov1 -> TexUnit24
                  tauKrylov2 -> TexUnit25
                  tauKrylov3 -> TexUnit26
                  tauKrylov4 -> TexUnit2
                  tauKrylov5 -> TexUnit3
               }
               // tauKrylov0Tex.bind("TexUnit23") //Esto no debería de hacer falta ya que tauKrylovX ya son las texturas
               // tauKrylov1Tex.bind("TexUnit24")
               // tauKrylov2Tex.bind("TexUnit25")
               // tauKrylov3Tex.bind("TexUnit26")
               // tauKrylov4Tex.bind("TexUnit2")
               // tauKrylov5Tex.bind("TexUnit3")
               framebuffer tauArnoldiCoeffFBO [tauArnoldiCoeffTex]
               viewport [0,0,14,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauAdjExp
               uniforms tauAdjExp {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
                  adjointTauScale = {tauEStar * dtSample}f
                  tauExpTerms = {Math.max(1, Math.min(4, ~~tauExpTerms))}i
               }
               rebind tauAdjExp {
                  tauKrylov0 -> TexUnit23
                  tauKrylov1 -> TexUnit24
                  tauKrylov2 -> TexUnit25
                  tauKrylov3 -> TexUnit26
                  tauKrylov4 -> TexUnit2
                  tauKrylov5 -> TexUnit3
                  tauArnoldiCoeff -> TexUnit22
               }
               // tauKrylov0Tex.bind("TexUnit23")
               // tauKrylov1Tex.bind("TexUnit24")
               // tauKrylov2Tex.bind("TexUnit25")
               // tauKrylov3Tex.bind("TexUnit26")
               // tauKrylov4Tex.bind("TexUnit2")
               // tauKrylov5Tex.bind("TexUnit3")
               framebuffer tauAdjExpFBO [tauAdjExpTex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauSteadyFP
               uniforms tauSteadyFP {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
                  fpLogSpanMax = {fpLogSpanMax}f
                  steadyFPGaugeMode = {(steadyFPSolverMode==="fourier_zero_mode_like")?1:0}i
               }
               rebind tauSteadyFP {
                  tauMom1 -> TexUnit14
                  tauAdjFields -> TexUnit28
               }
               framebuffer tauSteadyFPFBO [tauSteadyFPTex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauAdjCost
               uniforms tauAdjCost {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX0}i
                  tauBatchCount = {tauAdjCount}i
                  l2F = {afpOptL2F}f
                  l2S = {afpOptL2S}f
                  adjointTauScale = {tauEStar * dtSample}f
                  useAdjointAFP = {!!useAdjointAFP?1:0}i
                  klReg = {tauKLReg}f
               }
               rebind tauAdjCost {
                  tauMom1 -> TexUnit14
                  tauMom2 -> TexUnit15
                  tauNMXiFRead -> TexUnit4
                  tauNMXiSRead -> TexUnit5
                  tauNMMetaRead -> TexUnit6
                  tauAdjFields -> TexUnit28
                  tauSteadyFP -> TexUnit27
                  tauAdjExp -> TexUnit31
               }
               framebuffer tauNMCostFBO [tauNMCost]
               viewport [tauAdjX0,0,tauAdjCount,tauMaxVeces*9]
               drawTriangles

               tauAdjX0+={tauAdjCount}
            }

            use tauNMStep
            uniforms tauNMStep {
               tauMax = {tauMaxVeces}i
               tauMin = {tauMinVeces}i
               nelderAlpha = {nelderAlpha}f
               nelderGamma = {nelderGamma}f
               nelderRho = {nelderRho}f
               nelderSigma = {nelderSigma}f
               nelderStopEps = {nelderStopEps}f
            }
            rebind tauNMStep {
               tauNMXiFRead -> TexUnit4
               tauNMXiSRead -> TexUnit5
               tauNMCost -> TexUnit11
            }
            framebuffer tauNMStepFBO [tauNMWriteF, tauNMWriteS, tauNMWriteM]
            viewport [0,0,tauMaxVeces,tauMaxVeces*9]
            drawTriangles

            let tauNMSwapF=tauNMReadF
            tauNMReadF=tauNMWriteF
            tauNMWriteF=tauNMSwapF
            let tauNMSwapS=tauNMReadS
            tauNMReadS=tauNMWriteS
            tauNMWriteS=tauNMSwapS
            let tauNMSwapM=tauNMReadM
            tauNMReadM=tauNMWriteM
            tauNMWriteM=tauNMSwapM
            tauNMInner+=1
         }

         let tauAdjX1=0
         while(tauAdjX1<tauMaxVeces){
            let tauAdjCount1={Math.min(Math.max(1,~~tauAdjTauBatch), tauMaxVeces-tauAdjX1)}

            use tauAdjFields
            uniforms tauAdjFields {
               tauMax = {tauMaxVeces}i
               tauMin = {tauMinVeces}i
               nBins = {nBins}i
               tauBatchOffset = {tauAdjX1}i
               tauBatchCount = {tauAdjCount1}i
            }
            rebind tauAdjFields {
               tauMom1 -> TexUnit14
               tauNMXiFRead -> TexUnit4
               tauNMXiSRead -> TexUnit5
               tauNMMetaRead -> TexUnit6
            }
            framebuffer tauAdjFieldsFBO [tauAdjFieldsTex]
            viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
            drawTriangles

            use tauAdjDiffOps
            uniforms tauAdjDiffOps {
               tauMax = {tauMaxVeces}i
               tauMin = {tauMinVeces}i
               nBins = {nBins}i
               tauBatchOffset = {tauAdjX1}i
               tauBatchCount = {tauAdjCount1}i
            }
            rebind tauAdjDiffOps {
               tauMom1 -> TexUnit14
            }
            framebuffer tauAdjDiffOpsFBO [tauAdjDiffOpsTex]
            viewport [0,0,nBins*nBins,tauAdjCount1*tauMaxVeces*9]
            drawTriangles

            use tauAdjOperator
            uniforms tauAdjOperator {
               tauMax = {tauMaxVeces}i
               tauMin = {tauMinVeces}i
               nBins = {nBins}i
               tauBatchOffset = {tauAdjX1}i
               tauBatchCount = {tauAdjCount1}i
            }
            rebind tauAdjOperator {
               tauAdjFields -> TexUnit28
               tauAdjDiffOps -> TexUnit29
            }
            framebuffer tauAdjOperatorFBO [tauAdjOperatorTex]
            viewport [0,0,nBins*nBins,tauAdjCount1*tauMaxVeces*9]
            lastUsedProgram?.drawArrays("TRIANGLES", 0, 6)

            use tauKrylovInit
               uniforms tauKrylovInit {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
               }
               rebind tauKrylovInit {
                  tauAdjFields -> TexUnit28
               }
               framebuffer tauKrylov0FBO [tauKrylov0Tex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               use tauKrylovStep
               uniforms tauKrylovStep {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
               }
               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit23
               }
               framebuffer tauKrylov1FBO [tauKrylov1Tex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit24
               }
               framebuffer tauKrylov2FBO [tauKrylov2Tex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit25
               }
               framebuffer tauKrylov3FBO [tauKrylov3Tex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit26
               }
               framebuffer tauKrylov4FBO [tauKrylov4Tex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               rebind tauKrylovStep {
                  tauAdjOperator -> TexUnit30
                  tauKrylovPrev -> TexUnit2
               }
               framebuffer tauKrylov5FBO [tauKrylov5Tex]
               viewport [0,0,nBins,tauAdjCount*tauMaxVeces*9]
               drawTriangles

               use tauArnoldiCoeff
               uniforms tauArnoldiCoeff {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
                  tauArnoldiReorth = {Math.max(1, Math.min(4, ~~tauArnoldiReorth))}i
                  tauArnoldiResidTol = {Math.max(1e-4, Math.min(0.9, tauArnoldiResidTol))}f
               }
               rebind tauArnoldiCoeff {
                  tauKrylov0 -> TexUnit23
                  tauKrylov1 -> TexUnit24
                  tauKrylov2 -> TexUnit25
                  tauKrylov3 -> TexUnit26
                  tauKrylov4 -> TexUnit2
                  tauKrylov5 -> TexUnit3
               }
               // tauKrylov0Tex.bind("TexUnit23")
               // tauKrylov1Tex.bind("TexUnit24")
               // tauKrylov2Tex.bind("TexUnit25")
               // tauKrylov3Tex.bind("TexUnit26")
               // tauKrylov4Tex.bind("TexUnit2")
               // tauKrylov5Tex.bind("TexUnit3")
               framebuffer tauArnoldiCoeffFBO [tauArnoldiCoeffTex]
               viewport [0,0,14,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               use tauAdjExp
               uniforms tauAdjExp {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
                  adjointTauScale = {tauEStar * dtSample}f
                  tauExpTerms = {Math.max(1, Math.min(4, ~~tauExpTerms))}i
               }
               rebind tauAdjExp {
                  tauKrylov0 -> TexUnit23
                  tauKrylov1 -> TexUnit24
                  tauKrylov2 -> TexUnit25
                  tauKrylov3 -> TexUnit26
                  tauKrylov4 -> TexUnit2
                  tauKrylov5 -> TexUnit3
                  tauArnoldiCoeff -> TexUnit22
               }
               // tauKrylov0Tex.bind("TexUnit23")
               // tauKrylov1Tex.bind("TexUnit24")
               // tauKrylov2Tex.bind("TexUnit25")
               // tauKrylov3Tex.bind("TexUnit26")
               // tauKrylov4Tex.bind("TexUnit2")
               // tauKrylov5Tex.bind("TexUnit3")
               framebuffer tauAdjExpFBO [tauAdjExpTex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               use tauSteadyFP
               uniforms tauSteadyFP {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
                  fpLogSpanMax = {fpLogSpanMax}f
                  steadyFPGaugeMode = {(steadyFPSolverMode==="fourier_zero_mode_like")?1:0}i
               }
               rebind tauSteadyFP {
                  tauMom1 -> TexUnit14
                  tauAdjFields -> TexUnit28
               }
               framebuffer tauSteadyFPFBO [tauSteadyFPTex]
               viewport [0,0,nBins,tauAdjCount1*tauMaxVeces*9]
               drawTriangles

               use tauAdjCost
               uniforms tauAdjCost {
                  tauMax = {tauMaxVeces}i
                  tauMin = {tauMinVeces}i
                  nBins = {nBins}i
                  tauBatchOffset = {tauAdjX1}i
                  tauBatchCount = {tauAdjCount1}i
                  l2F = {afpOptL2F}f
                  l2S = {afpOptL2S}f
                  adjointTauScale = {tauEStar * dtSample}f
                  useAdjointAFP = {!!useAdjointAFP?1:0}i
                  klReg = {tauKLReg}f
               }
               rebind tauAdjCost {
                  tauMom1 -> TexUnit14
                  tauMom2 -> TexUnit15
                  tauNMXiFRead -> TexUnit4
                  tauNMXiSRead -> TexUnit5
                  tauNMMetaRead -> TexUnit6
                  tauAdjFields -> TexUnit28
                  tauSteadyFP -> TexUnit27
                  tauAdjExp -> TexUnit31
               }
               framebuffer tauNMCostFBO [tauNMCost]
               viewport [tauAdjX1,0,tauAdjCount1,tauMaxVeces*9]
               drawTriangles

            tauAdjX1+={tauAdjCount1}
         }

         use tauNMFinalize
         uniforms tauNMFinalize {
            tauMax = {tauMaxVeces}i
            tauMin = {tauMinVeces}i
         }
         rebind tauNMFinalize {
            tauNMXiFRead -> TexUnit4
            tauNMXiSRead -> TexUnit5
            tauNMCost -> TexUnit11
            tauXiFOpt -> TexUnit18
            tauXiSOpt -> TexUnit19
            tauXiMetaOpt -> TexUnit20
         }
         framebuffer tauAFPOptFBO [tauXiFFinal, tauXiSFinal, tauXiMetaFinal]
         viewport [0,0,tauMaxVeces,tauMaxVeces]
         drawTriangles

         gl.finish()
         let tauAFPOptFlags={Array.from(tauAFPOptFBO.readColorAttachment(2,0,0,tauMaxVeces,tauMaxVeces,TexExamples.RGBAFloat16,4))}
         tauAFPOptDone={tauAFPOptFlags.every((v,idx,arr)=>((idx%4)!==0) || (arr[idx+1] < 0.5 || arr[idx+3] > 0.5))}
         tauAFPOptPass+={tauAFPOptChunk}
      }

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
      drawTriangles


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
      drawTriangles


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
      drawTriangles


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
      drawTriangles


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
         tauModelKL -> TexUnit4
         tauStats -> TexUnit21
      }
      framebuffer tauScoreFBO [tauScoreTex]
      viewport [0,0,tauMaxVeces,tauMaxVeces]
      drawTriangles


      //? phase 06_select - tauBest - file://./glsl/tau/06_select/1_tauBestModel.frag
      // Entrada: tauXiMetaFinal, tauModelMask, tauFPProxy, tauModelScore.
      // Salida: tauBest = [bestTau,bestSubseq,bestCost,found].
      // Llamadas: 1 por cada recomputeTau.
      // Efecto de variables: useFPFilter y useScoreSelection hacen mÃ¡s o menos estricta la bÃºsqueda
      // del mejor candidato; tauMinVeces y tauMaxVeces siguen acotando la rejilla.
      use tauBest
      drawTriangles -> [tauBestTex] size [1,1] {
         uniforms {
            setTauBounds_u
            useMask = 1i
            useFP = {!!useFPFilter?1:0}i
            useScore = {!!useScoreSelection?1:0}i
         }
         rebind {
            tauXiMetaFinal -> TexUnit27
            tauModelMask -> TexUnit22
            tauFPProxy -> TexUnit23
            tauModelScore -> TexUnit5
         }
      }


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
      drawTriangles


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
      drawTriangles


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
      drawTriangles


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
      drawTriangles


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

   // Mantiene en sincronía las curvas/pdfs seleccionadas al moverse con z/x/c/v,
   // sin volver a lanzar todo el pipeline de tau.
   use tauSindy
   tauSindy.VAO.bind()
   viewport tauSindy {[0,0,nBins,1]}
   uniforms tauSindy {
      tauMax = {tauMaxVeces}i
      nBins = {nBins}i
      selectedTau = {bestTau}i
      selectedSubseq = {bestSubseq}i
      useSelected = 1i
   }
   rebind tauSindy {
      tauMom1 -> TexUnit14
      tauXiF -> TexUnit25
      tauXiS -> TexUnit26
      tauBest -> TexUnit17
   }
   framebuffer tauSindyPreviewFBO [tauSindyTex]
   drawTriangles

   use tauFPStat
   tauFPStat.VAO.bind()
   viewport tauFPStat {[0,0,nBins,1]}
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
   framebuffer tauFPStatPreviewFBO [tauFPStatTex]
   drawTriangles

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
      tauSindy -> TexUnit6
      tauSindyInit -> TexUnit7
      tauSindyTau1Ref -> TexUnit8
      tauModelMask -> TexUnit22
      tauFPProxy -> TexUnit23
      tauModelKL -> TexUnit4
      tauModelScore -> TexUnit5
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

OnKeyPress "q" {
   useLSView={!useLSView}
}

OnKeyPress "e" {
   autoPickBest={!autoPickBest}
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

// OnKeyPress "f" {
//    useFPFilter={!useFPFilter}
//    recomputeTau=true
// }

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
   // recomputeTau=true
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
   }else{
      log "C2 c: tau actual no tiene subsecuencias" {bestTau}
   }
}

start

<Pos>
