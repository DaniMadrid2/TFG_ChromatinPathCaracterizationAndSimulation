// Los bloques globales se ejecutan por prioridad numerica al llamar start.
// Un parametro name=inicio:fin recorre ambos extremos, inclusive.
<Pre>

let brightness = 0.5



program demo "events" {
}



drawScene (20) {
    use demo
    drawTriangles -> [] size [640,480] {
        uniforms {
            brightness = {brightness}f
        }
    }
}



// 19 se ejecuta antes de 20, incluso si se define despues.
drawTiles (tile=0:{3}) (19) {
    log "tile" {tile}
}



OnKeyPress "w" {
    brightness={Math.min(1,brightness+0.1)}
    log "brightness" {brightness}
}



OnKeyPress "s" {
    brightness={Math.max(0,brightness-0.1)}
}



start

<Pos>
