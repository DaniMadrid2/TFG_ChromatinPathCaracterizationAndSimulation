// glslFilters sustituye texto del shader antes de compilarlo.
// both aplica el filtro a .vert y .frag bajo la ruta indicada.
<Pre>

let level = 0.75



glslFilters {
    both "filtered" "const float LEVEL = 0.4;" -> {"const float LEVEL = " + String(level) + ";"}
}



program demo "filtered" {
}



use demo
drawTriangles -> [] size [640,480] {
}

<Pos>
