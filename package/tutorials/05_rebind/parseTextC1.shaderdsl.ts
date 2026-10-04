// rebind cambia el TexUnit; temp y rebind-temp restauran el enlace al terminar.
// Una plantilla puede incluirse en el draw por nombre.
<Pre>

resource Pixels {
    format: RGBA16
    filter: NEAREST
    wrap: CLAMP
}



program demo "rebind" {
    tex2D source RES [4 x 4] Pixels TexUnit12
    new-tex2D alternate RES [4 x 4] Pixels TexUnit13
}



sourceBinding = rebind {
    source -> TexUnit12
}



use demo
rebind demo {
    sourceBinding
}



use demo
drawTriangles -> [] size [640,480] {
    rebind {
        sourceBinding
        temp {
            alternate -> TexUnit12
        }
    }
}



drawTriangles -> [] size [640,480] {
    rebind-temp {
        alternate -> TexUnit12
    }
}

<Pos>
