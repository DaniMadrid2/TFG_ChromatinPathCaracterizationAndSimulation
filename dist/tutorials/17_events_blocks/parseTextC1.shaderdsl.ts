// OnKeyPress ejecuta codigo al pulsar una tecla; log muestra valores.
// Un bloque con prioridad, como drawScene (20), se monta con start.
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



OnKeyPress "w" {
    brightness={Math.min(1,brightness+0.1)}
    log "brightness" {brightness}
}



OnKeyPress "s" {
    brightness={Math.max(0,brightness-0.1)}
}



start

<Pos>
