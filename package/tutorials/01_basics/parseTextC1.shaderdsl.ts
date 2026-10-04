// Un programa GLSL dibuja en el canvas; <Pre> prepara y <Pos> cierra el codigo.
// Abre index.html con dnti_shaderdsl parse . --serve.
<Pre>

let {
    width = 640
    height = 480
}



program demo "demo" {
}



// draw sin tick: una sola pasada.
use demo
drawTriangles -> [] size [width,height] {
}



// tick vuelve a ejecutar su cuerpo cuando se llama start.
tick {
    use demo
    drawTriangles -> [] size [width,height] {
    }
}
start

<Pos>
