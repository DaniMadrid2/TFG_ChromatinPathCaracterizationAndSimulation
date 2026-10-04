<Pre>

let offset = new Vector2D(0, 0)

program demo "demo" {
}


// Shared texture presets
resource TauFloatTex {
   format: RG32F
   filter: NEAREST
   wrap: CLAMP
}

program movePoints "movePoints" {
    tex2D positionTexture RES [1 x trajectory.length]b TauFloatTex TexUnit12 <= trajectory
    new-tex2D positionTextureNext RES [1 x trajectory.length]b TauFloatTex TexUnit13
}


setCoords_u = uniforms{
    offsetX = {offset.x}f
    offsetY = {offset.y}f
}

let movePointsFBO = null

tick {
    use movePoints
    drawTriangles -> [positionTextureNext] size [1,trajectory.length]b {
        uniforms{
            {dt}f
        }
        rebind {
            positionTexture -> TexUnit12
        }
    }

    unbindFBO movePoints

    use demo
    drawPoints {positionTextureNext}vec2 -> [] size [640,480] {
        uniforms{
            setCoords_u
        }
        // backUp: /parseTextC12/lines
    }

    let previousTexture = positionTexture
    positionTexture = positionTextureNext
    positionTextureNext = previousTexture

    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "a" {
   offset.x += 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "d" {
   offset.x -= 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "w" {
   offset.y -= 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "s" {
   offset.y += 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

keypress.listen()

start

<Pos>
