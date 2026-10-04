// La cabecera de draw admite atributo, tipo y cantidad; cada verbo cambia el modo GL.
// Esta leccion compara las formas sin reexplicar program ni el canvas.
<Pre>

let trajectory = [-0.8,-0.5, 0.0,0.7, 0.8,-0.5]



program demo "lines" {
}
use demo



drawPoints {trajectory}vec2 -> [] size [640,480] {
}



drawLines "aPos" {trajectory}vec2 -> [] size [640,480] {
}



drawLineStrip {trajectory}vec2 -> [] size [640,480] {
}



drawLineLoop {trajectory}vec2 -> [] size [640,480] {
}



drawTriangles {trajectory}vec2 3 -> [] size [640,480] {
}



drawTriangleStrip {trajectory}vec2 -> [] size [640,480] {
}



drawTriangleFan {trajectory}vec2 -> [] size [640,480] {
}

<Pos>
