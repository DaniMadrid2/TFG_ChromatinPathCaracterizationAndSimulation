// swap y <=> permutan referencias; pingpong lo hace al salir del bloque.
// Usalo con dos texturas para leer una mientras escribes la otra.
<Pre>

resource Pairs {
    format: RG32F
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    tex2D position RES [8 x 8] Pairs TexUnit12
    new-tex2D nextPosition RES [8 x 8] Pairs TexUnit13
}



position <=> nextPosition



swap {position, nextPosition}



pingpong (position, nextPosition) {
    use demo
    drawTriangles -> [nextPosition] size [8,8] {
        rebind {
            position -> TexUnit12
        }
    }
}

<Pos>
