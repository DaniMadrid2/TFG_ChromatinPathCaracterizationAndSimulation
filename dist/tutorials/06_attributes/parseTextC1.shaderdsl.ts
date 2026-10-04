// attributes define datos de vertices y acepta plantillas reutilizables.
// El nombre omitido se infiere de la expresion entre llaves.
<Pre>

let aPos = [-0.8,-0.8, 0.8,-0.8, 0.0,0.8]
let aColor = [1,0,0, 0,1,0, 0,0,1]



program demo "attributes" {
}



positions_a = attributes {
    {aPos}vec2
}



use demo
drawTriangles -> [] size [640,480] {
    attributes {
        positions_a
        "aColor" -> {aColor}vec3
    }
}

<Pos>
