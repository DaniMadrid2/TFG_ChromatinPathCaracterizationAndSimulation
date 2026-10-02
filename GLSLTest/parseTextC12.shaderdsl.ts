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
    tex2D positionTexture RES [1 x trajectory.length/2] TauFloatTex TexUnit12 <= trajectory
}

setCoords_u = uniforms{
    offsetX = {offset.x}f
    offsetY = {offset.y}f
}

tick {
    use movePoints
    drawTriangles -> [positionTexture] size [1,trajectory.length]b {
        uniforms{
            {dt}f
        }
    }

    //Need to load positionTexture into trajectory for next frame
    trajectory <= positionTexture

    use demo
    drawLineStrip {trajectory}vec2 -> [] size [640,480] {
        uniforms{
            setCoords_u
        }
        // backUp: /parseTextC12/lines
    }

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
