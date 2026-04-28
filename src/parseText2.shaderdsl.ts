<Pre/>

camera = Camera3D pos=vec3(0,1,0) fov=63
camera.setMoveControlsAt("s").setCamControlsAt("down").setMouseControls("mouse")
camera.keys.a="a"
camera.keys.w="w"
camera.keys.s="s"
camera.keys.d="d"
camera.keys.q="q"
camera.keys.e="e"
camera.keys.r="r"
camera.keys.left="left"
camera.keys.right="right"
camera.keys.up="up"
camera.keys.down="down"
camera.keys.rotMouse=true

let data={datos_reales}
let nCromatins=0
let NMuestras=0
let drawDataCount=0

[datosX, datosY] = $getDataArrays$({data})

drawData = Program data/1_drawData |= d
lduse d
d.createVAO().bind()

datosXtex|=dX = texture2DArray RFloat datosX "datosX" texUnit0 
 {MAX_TEXTURE_SIZE}x{1}x{(~~(datosY.length/MAX_TEXTURE_SIZE/MAX_TEXTURE_SIZE))}

datosYtex|=dY = texture2DArray RFloat datosY "datosY" texUnit1 
 {MAX_TEXTURE_SIZE}x{1}x{(~~(datosY.length/MAX_TEXTURE_SIZE/MAX_TEXTURE_SIZE))}

dX.setLengthUniforms()
dY.setLengthUniforms()

let is3D=true
let showPCA=true
let showStartPointer=true
let showSimulatedChrom=false
let showOtherChromatins=true
let simMeanSubseq=false
let pcaStride=1
let percentageShown=1
let ShownSpeed=1
let saved3DCamX=0
let saved3DCamY=1
let saved3DCamZ=0
let saved2DOffsetX=0
let saved2DOffsetY=0
let saved2DZoom=1
let selectedChromatin=0
let c2StartTexUnit="TexUnit30"
let useExternalStartTex=false
let useExternalSimTex=false
let simSamples=2
let simTexX=null
let simTexY=null
let simStartTex=null
let simLastStamp=-1
let simLastChromatin=-1

nCromatins={data.length}
NMuestras={data[0].length}
drawDataCount={NMuestras*nCromatins}

calcPCAProgram = Program pca/1_calcPCA |= calcPCA
lduse calcPCA
calcPCA.createVAO().bind()
let pcaTex = calcPCA.createTexture2D("datosPCA", [nCromatins,1], TexExamples.RGBAFloat, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit2)
let centerTex = calcPCA.createTexture2D("datosCenter", [nCromatins,1], TexExamples.RGBAFloat, null, ["NEAREST","NEAREST","CLAMP","CLAMP"], TexUnit3)

drawPCAProgram = Program pca/2_drawPCA |= drawPCA
lduse drawPCA
drawPCA.createVAO().bind()
drawPCA.VAO.attribute("aPos", [-1,-1, 1,-1, 1,1, -1,1], 2)
uniforms drawPCA {
   nCromatin = 0i
   isPerp = 0i
   offset = vec3(0,0,0)f
   scale = 1f
   is3D = {!!is3D?1:0}i
}
drawPCA.bindTexName2TexUnit("datosX", TexUnit0)
drawPCA.bindTexName2TexUnit("datosY", TexUnit1)
drawPCA.bindTexName2TexUnit("datosPCA", TexUnit2)
drawPCA.bindTexName2TexUnit("datosCenter", TexUnit3)
drawPCA.uInt("datosXLength").set(MAX_TEXTURE_SIZE)
drawPCA.isDepthTest=false

drawStartProgram = Program data/2_drawStartPointer |= drawStart
lduse drawStart
drawStart.createVAO().bind()
drawStart.bindTexName2TexUnit("datosX", TexUnit0)
drawStart.bindTexName2TexUnit("datosY", TexUnit1)
drawStart.bindTexName2TexUnit("startPosTex", TexUnit30)
uniforms drawStart {
   selectedChromatin = 0i
   useStartPosTex = 0i
   useMeanColor = 0i
   markerSize = 42f
   offset = vec3(0,0,0)f
   scale = 1f
   is3D = {!!is3D?1:0}i
}
drawStart.isDepthTest=false

uniforms d {
   offset = vec3(0,0,0)f
   scale = 1f
   lCromatin = {drawDataCount/nCromatins}i
   is3D = {!!is3D?1:0}i
}

use d
camera.calculateMatrices().setUniforms(d.uMat4("u_viewMatrix"), d.uMat4("u_projectionMatrix"), undefined)

OnKeyPress "r" {
   percentageShown=0
   ShownSpeed={~~(Math.random()*4)+1}
}

OnKeyPress "p" {
   showStartPointer={!showStartPointer}
}

OnKeyPress "h" {
   showPCA={!showPCA}
}

OnKeyPress "u" {
   showSimulatedChrom={!showSimulatedChrom}
}

OnKeyPress "g" {
   showOtherChromatins={!showOtherChromatins}
}

OnKeyPress "y" {
   simMeanSubseq={!simMeanSubseq}
   (window as any).simUseMeanSubseq={!!simMeanSubseq}
   (window as any).simReqRebuild={~~((window as any).simReqRebuild||0)+1}
}

OnKeyPress "k" {
   is3D={!is3D}
   if(is3D){
      saved2DOffsetX={camera.position.x}
      saved2DOffsetY={camera.position.z}
      saved2DZoom={camera.position.y}
      camera.position.setVal(0,{saved3DCamX})
      camera.position.setVal(1,{saved3DCamY})
      camera.position.setVal(2,{saved3DCamZ})
      d.uniforms.offset.set([0,0,0])
      d.uniforms.scale.set(1)
      drawStart.uniforms.offset.set([0,0,0])
      drawStart.uniforms.scale.set(1)
    }else{
      saved3DCamX={camera.position.x}
      saved3DCamY={camera.position.y}
      saved3DCamZ={camera.position.z}
      camera.position.setVal(0,{saved2DOffsetX})
      camera.position.setVal(1,{saved2DZoom})
      camera.position.setVal(2,{saved2DOffsetY})
      d.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y])
      d.uniforms.scale.set({camera.position.y})
      drawStart.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y])
      drawStart.uniforms.scale.set({camera.position.y})
    }
    uniforms d {
      is3D = {!!is3D?1:0}i
    }
   uniforms drawStart {
      is3D = {!!is3D?1:0}i
   }
}

tick {
   simMeanSubseq={!!((window as any).simUseMeanSubseq||false)}
   use calcPCA
   uniforms calcPCA {
      lCromatin = {drawDataCount/nCromatins}i
      datosXLength = {MAX_TEXTURE_SIZE}i
      datosYLength = {MAX_TEXTURE_SIZE}i
   }
   calcPCA.bindTexName2TexUnit("datosX", TexUnit0)
   calcPCA.bindTexName2TexUnit("datosY", TexUnit1)
   let pcaFBO=calcPCA.cFrameBuffer().bind([ColAtch0,ColAtch1])
   pcaFBO.bindColorBuffer(pcaTex, ColAtch0)
   pcaFBO.bindColorBuffer(centerTex, ColAtch1)
   pcaFBO.drawBuffers([ColAtch0,ColAtch1])
   calcPCA.setViewport(0,0,nCromatins,1)
   calcPCA.drawArrays("TRIANGLES",0,6)
   calcPCA.unbindFBO()

   use d
   drawStart.uniforms.useMeanColor.set({!!simMeanSubseq?1:0})
   selectedChromatin={Math.max(0,Math.min(nCromatins-1,~~((window as any).chromatinIndex||1)-1))}
   let simStampX={~~((window as any).simStampX||0)}
   let simStampY={~~((window as any).simStampY||0)}
   let simStamp={simStampX*1000003 + simStampY}
   if(simStamp!=simLastStamp || selectedChromatin!=simLastChromatin){
      let sx={(window as any).simDataX}
      let sy={(window as any).simDataY}
      if(sx && sy){
         let simArrX={sx instanceof Float32Array ? sx : new Float32Array(sx)}
         let simArrY={sy instanceof Float32Array ? sy : new Float32Array(sy)}
         let projMeta={(window as any).__tauProjectionMeta||null}
         if(projMeta && projMeta.mode==="pca" && projMeta.simCoordsMode==="pca-relative"){
            let recN={Math.max(2,Math.min(simArrX.length,simArrY.length))}
            let backX=new Float32Array(recN)
            let backY=new Float32Array(recN)
            let cx={Number.isFinite(projMeta.centerX)?projMeta.centerX:0}
            let cy={Number.isFinite(projMeta.centerY)?projMeta.centerY:0}
            let vx={Number.isFinite(projMeta.vx)?projMeta.vx:1}
            let vy={Number.isFinite(projMeta.vy)?projMeta.vy:0}
            let wx={Number.isFinite(projMeta.wx)?projMeta.wx:0}
            let wy={Number.isFinite(projMeta.wy)?projMeta.wy:1}
            let i=0
            while(i<recN){
               let a0={Number.isFinite(simArrX[i])?simArrX[i]:0}
               let a1={Number.isFinite(simArrY[i])?simArrY[i]:0}
               backX[i]=cx + a0*vx + a1*wx
               backY[i]=cy + a0*vy + a1*wy
               i+=1
            }
            simArrX={backX}
            simArrY={backY}
         }
         let simN={Math.max(2,Math.min(simArrX.length,simArrY.length))}
         let chromBase={selectedChromatin*NMuestras}
         let targetStartX={Number.isFinite(datosX[chromBase])?datosX[chromBase]:0}
         let targetStartY={Number.isFinite(datosY[chromBase])?datosY[chromBase]:0}
         let shiftX={targetStartX-(Number.isFinite(simArrX[0])?simArrX[0]:0)}
         let shiftY={targetStartY-(Number.isFinite(simArrY[0])?simArrY[0]:0)}
         if(shiftX||shiftY){
            let shiftedX={Float32Array.from(simArrX,(v)=>v+shiftX)}
            let shiftedY={Float32Array.from(simArrY,(v)=>v+shiftY)}
            simArrX={shiftedX}
            simArrY={shiftedY}
         }
         simSamples={simN}
         simTexX = texture2DArray RFloat {simArrX} "simX" texUnit30 
         {simN}x{1}x{1}
         simTexY = texture2DArray RFloat {simArrY} "simY" texUnit31 
         {simN}x{1}x{1}
         if(simTexX?.setLengthUniforms) simTexX.setLengthUniforms()
         if(simTexY?.setLengthUniforms) simTexY.setLengthUniforms()
         let s0x={simArrX[0]||0}
         let s0y={simArrY[0]||0}
         simStartTex={drawStart.createTexture2D("simStartPos",[1,1],TexExamples.RGBAFloat,new Float32Array([s0x,s0y,0,1]),["NEAREST","NEAREST","CLAMP","CLAMP"],TexUnit29)}
         useExternalSimTex=true
         useExternalStartTex=true
         simLastStamp={simStamp}
         simLastChromatin={selectedChromatin}
      }else if(!sx || !sy){
         useExternalSimTex=false
         useExternalStartTex=false
         simLastStamp={simStamp}
         simLastChromatin={selectedChromatin}
      }
   }
   if(is3D){
       camera.tick({dt},{keypress},{mousepos},{mouseclick})
       saved3DCamX={camera.position.x}
       saved3DCamY={camera.position.y}
       saved3DCamZ={camera.position.z}
       camera.calculateMatrices()
       camera.setUniformsProgram(d)
       d.uniforms.offset.set([0,0,0])
       d.uniforms.scale.set(1)
       drawStart.uniforms.offset.set([0,0,0])
      drawStart.uniforms.scale.set(1)
   }else{
      let camzoom={camera.position.y}
      let mvdepth={keypress.Depth()}
      if(mvdepth<0){
         let camzoom={camzoom*1.05}
         if(camzoom==0) {
            let camzoom=1
         }
      }
      
      if(mvdepth>0){
         let camzoom={camzoom/1.05}
         if(camzoom==0){
            let camzoom=1
         }
      }

       camera.tick({dt/camzoom*4.5},{keypress},{mousepos},{mouseclick})
       camera.position.setVal(1,{camzoom})
       saved2DOffsetX={camera.position.x}
       saved2DOffsetY={camera.position.z}
       saved2DZoom={camera.position.y}
       d.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y])
       d.uniforms.scale.set({camzoom})
       drawStart.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y])
      drawStart.uniforms.scale.set({camzoom})
   }

   if(percentageShown<1){
      percentageShown+={dt*ShownSpeed*0.2}
      if(percentageShown>1) {
         percentageShown=1
      }
   }
}

drawPCASetup (19) {
   if(showPCA){
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      use drawPCA
      drawPCA.VAO.bind()
      viewport drawPCA {[0,0,canvas.width,canvas.height]}
      drawPCA.bindTexName2TexUnit("datosX", TexUnit0)
      drawPCA.bindTexName2TexUnit("datosY", TexUnit1)
      drawPCA.bindTexName2TexUnit("datosPCA", TexUnit2)
      drawPCA.bindTexName2TexUnit("datosCenter", TexUnit3)
      if(is3D){
         camera.calculateMatrices().setUniforms(drawPCA.uMat4("u_viewMatrix"), drawPCA.uMat4("u_projectionMatrix"), undefined)
         drawPCA.uniforms.offset.set([0,0,0])
         drawPCA.uniforms.scale.set(1)
      }else{
         drawPCA.uniforms.offset.set([camera.position.x, camera.position.z, camera.position.y])
         drawPCA.uniforms.scale.set({camera.position.y})
      }
      drawPCA.uniforms.is3D.set({!!is3D?1:0})
   }
}

drawPCAAxes (n_cromatin=0:{nCromatins-1}) (20) {
   if(showPCA){
      use drawPCA
      if(n_cromatin%pcaStride==0){
         drawPCA.uniforms.nCromatin.set({n_cromatin})
         drawPCA.uniforms.isPerp.set(0)
         drawPCA.drawArrays("TRIANGLE_FAN",0,4)
         drawPCA.uniforms.isPerp.set(1)
         drawPCA.drawArrays("TRIANGLE_FAN",0,4)
      }
   }
}

drawCromatin (n_cromatin=0:{nCromatins-1}) {
   gl.bindFramebuffer(gl.FRAMEBUFFER, null)
   use d
   viewport d {[0,0,canvas.width,canvas.height]}
   d.VAO.bind()
   
   let n_cromatin={n_cromatin%nCromatins}
   let lCromatin={drawDataCount/nCromatins}
   let templCromatin={lCromatin}
   let templSim={simSamples}
   d.uniforms.lCromatin.set({lCromatin})

   if(percentageShown!=1){
      templCromatin={Math.max(2,~~(lCromatin*percentageShown))}
      templSim={Math.max(2,~~(simSamples*percentageShown))}
   }

   if(showSimulatedChrom){
      if(n_cromatin==selectedChromatin && useExternalSimTex){
         d.bindTexName2TexUnit("datosX", "TexUnit30")
         d.bindTexName2TexUnit("datosY", "TexUnit31")
         d.uniforms.lCromatin.set({simSamples})
         d.drawArrays("LINE_STRIP",0,{templSim})
         d.bindTexName2TexUnit("datosX", TexUnit0)
         d.bindTexName2TexUnit("datosY", TexUnit1)
         d.uniforms.lCromatin.set({lCromatin})
      }
   }else{
      if(showOtherChromatins || n_cromatin==selectedChromatin){
         d.drawArrays("LINE_STRIP",{lCromatin*n_cromatin},{templCromatin})
      }
      if(n_cromatin==selectedChromatin && useExternalSimTex){
         d.bindTexName2TexUnit("datosX", "TexUnit30")
         d.bindTexName2TexUnit("datosY", "TexUnit31")
         d.uniforms.lCromatin.set({simSamples})
         d.drawArrays("LINE_STRIP",0,{templSim})
         d.bindTexName2TexUnit("datosX", TexUnit0)
         d.bindTexName2TexUnit("datosY", TexUnit1)
         d.uniforms.lCromatin.set({lCromatin})
      }
   }
}

drawStartMarker (25) {
   if(showStartPointer && useExternalStartTex){
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      use drawStart
      viewport drawStart {[0,0,canvas.width,canvas.height]}
      drawStart.VAO.bind()
      drawStart.bindTexName2TexUnit("datosX", TexUnit0)
      drawStart.bindTexName2TexUnit("datosY", TexUnit1)
      drawStart.bindTexName2TexUnit("startPosTex", "TexUnit29")
      drawStart.uniforms.selectedChromatin.set({!!useExternalStartTex?0:selectedChromatin})
      drawStart.uniforms.useStartPosTex.set({!!useExternalStartTex?1:0})
      if(is3D){
         camera.calculateMatrices().setUniforms(drawStart.uMat4("u_viewMatrix"), drawStart.uMat4("u_projectionMatrix"), undefined)
      }
      drawStart.drawArrays("POINTS",0,1)
   }
}

start

})();

<Pos>


