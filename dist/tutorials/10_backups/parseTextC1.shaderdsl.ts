// backUp guarda uniforms y salidas; la politica limita iteraciones por draw.
// Ejecuta parse . --serve para tener la API de backups disponible.
<Pre>

resource Pixels {
    format: RGBA16
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    tex2D result RES [8 x 8] Pixels TexUnit12
}



use demo
drawTriangles -> [result] size [8,8] {
    backUp: /tutorial/results/, maxBackUpIterations: 3, priority: first
}



use demo
drawTriangles -> [result] size [8,8] {
    backUp: /tutorial/latest/, maxBackUpIterations: 2, priority: last
}



use demo
drawTriangles -> [result] size [8,8] {
    backUp: /tutorial/periodic/, maxBackUpIterations: 4, priority: each-2
}

<Pos>
