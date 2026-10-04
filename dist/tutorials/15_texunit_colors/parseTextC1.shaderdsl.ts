// La extension colorea texturas por TexUnit y distingue unidades compartidas.
// Rebind permite ver como cambia la asociacion en cada draw.
<Pre>

resource Pixels {
    format: RGBA16
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    // TexUnit12 se comparte; TexUnit13 solo tiene una textura.
    tex2D first RES [4 x 4] Pixels TexUnit12
    new-tex2D second RES [4 x 4] Pixels TexUnit13
    new-tex2D shared RES [4 x 4] Pixels TexUnit12
}



use demo
drawTriangles -> [] size [640,480] {
    rebind {
        first -> TexUnit12
        second -> TexUnit13
    }
}



drawTriangles -> [] size [640,480] {
    rebind-temp {
        shared -> TexUnit12
    }
}

<Pos>
