// El bloque draw simplifica framebuffer, viewport y drawArrays.
// Las ordenes separadas permiten controlar cada paso de GPU manualmente.
<Pre>

resource Pixels {
    format: RGBA16
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    tex2D target RES [64 x 64] Pixels TexUnit12
}



use demo
drawTriangles -> [target] size [64,64] {
    framebuffer: targetFBO
}



use demo
framebuffer targetFBO [target]
viewport [0,0,64,64]
drawTriangles
unbindFBO targetFBO



use demo
viewport [0,0,640,480]
demo.drawArrays("TRIANGLES",0,3)

<Pos>
