// derived marca visualmente las variables calculadas; la extension las pone en cursiva.
// No cambia el valor ni el tipo JavaScript de la variable.
<Pre>

let width = 640
let height = 480



let derived area = width * height
let derived aspect = width / height



program demo "demo" {
}
use demo
drawTriangles -> [] size [width,height] {
    uniforms {
        area = {area}f
        aspect = {aspect}f
    }
}

<Pos>
