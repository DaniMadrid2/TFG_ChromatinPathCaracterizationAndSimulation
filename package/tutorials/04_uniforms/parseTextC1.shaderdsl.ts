// uniforms puede ser una plantilla reutilizable o un bloque local al draw.
// Cada sufijo especifica el tipo enviado al shader.
<Pre>

let gain = 0.7
let phase = 1



program demo "uniforms" {
}



shade_u = uniforms {
    gain = {gain}f
    phase = {phase}i
}



use demo
uniforms demo {
    shade_u
}



use demo
drawTriangles -> [] size [640,480] {
    uniforms {
        shade_u
        gain = {gain * 0.8}f
    }
}

<Pos>
