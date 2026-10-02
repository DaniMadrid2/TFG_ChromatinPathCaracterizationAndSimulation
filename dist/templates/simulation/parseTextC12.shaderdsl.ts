<Pre/>

let {
  simSize=192, R=12, C=0.95
  mu1=0.24, epsilon1=2.6
  elapsed=0
  addFBO=null, fieldAFBO=null, fieldBFBO=null
}

resource TauFloatTex {
  format: RGBA16
  filter: NEAREST
  wrap: CLAMP
}

program computeC2 "compute/c2" {
  tex2D fieldA RES [simSize x simSize] TauFloatTex TexUnit0
  tex2D fieldANext RES [simSize x simSize] TauFloatTex TexUnit2
}
program computeC3 "compute/c3" {
}
program computeWave "compute/wave" {
  tex2D fieldB RES [simSize x simSize] TauFloatTex TexUnit1
  tex2D fieldBNext RES [simSize x simSize] TauFloatTex TexUnit3
}
program computeAdd "compute/add" {
}
program drawA "draw/fieldA" {
}
program drawB "draw/fieldB" {
}

initializeFields(gl, [fieldA, fieldANext, fieldB, fieldBNext]);

tick {
  elapsed += dt
  if(pendingClick){
    use computeAdd
    if(fieldVariant===2){
      drawTriangles -> [fieldANext] size [simSize,simSize] {
        uniforms {
          uTarget = {1}i
          uClickX = {mousepos.x * simSize / canvas.width}f
          uClickY = {(canvas.height-mousepos.y) * simSize / canvas.height}f
          uRadius = {R}f
          uClickValue = {C}f
        }
        rebind {
          fieldA -> TexUnit0
          fieldB -> TexUnit1
        }
        framebuffer: addFBO
      }
      let swapClickA = fieldA
      fieldA = fieldANext
      fieldANext = swapClickA
    } else {
      drawTriangles -> [fieldBNext] size [simSize,simSize] {
        uniforms {
          uTarget = {2}i
          uClickX = {mousepos.x * simSize / canvas.width}f
          uClickY = {(canvas.height-mousepos.y) * simSize / canvas.height}f
          uRadius = {R}f
          uClickValue = {C}f
        }
        rebind {
          fieldA -> TexUnit0
          fieldB -> TexUnit1
        }
        framebuffer: addFBO
      }
      let swapClickB = fieldB
      fieldB = fieldBNext
      fieldBNext = swapClickB
    }
    pendingClick = false
  }

  if(fieldVariant===2){
    use computeC2
  } else {
    use computeC3
  }
  drawTriangles -> [fieldANext] size [simSize,simSize] {
    uniforms {
      uMu1 = {mu1}f
    }
    rebind {
      fieldA -> TexUnit0
      fieldB -> TexUnit1
    }
    framebuffer: fieldAFBO
  }

  use computeWave
  drawTriangles -> [fieldBNext] size [simSize,simSize] {
    uniforms {
      uTime = {elapsed}f
      uEpsilon1 = {epsilon1}f
    }
    rebind {
      fieldANext -> TexUnit0
      fieldB -> TexUnit1
    }
    framebuffer: fieldBFBO
  }

  let swapA = fieldA
  fieldA = fieldANext
  fieldANext = swapA
  let swapB = fieldB
  fieldB = fieldBNext
  fieldBNext = swapB

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if(fieldVariant===2){
    use drawA
    drawTriangles -> [] size [simSize,simSize] {
      rebind {
        fieldA -> TexUnit0
      }
    }
    presentField(canvas, renderCanvas, "Campo A");
  } else {
    use drawB
    drawTriangles -> [] size [simSize,simSize] {
      rebind {
        fieldB -> TexUnit1
      }
    }
    presentField(canvas, renderCanvas, "Campo B");
  }
}

start
<Pos>
