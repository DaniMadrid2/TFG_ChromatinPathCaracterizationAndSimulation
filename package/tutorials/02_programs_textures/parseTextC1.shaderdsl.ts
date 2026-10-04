// program carga glsl/<ruta>.vert y .frag; resource fija el formato de textura.
// Las texturas de entrada, salida y trabajo tienen prefijos distintos.
<Pre>

let samples = [1, 0, 0, 1, 0, 1, 1, 0]



resource FloatPairs {
    format: RG32F
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    // in-tex2D: sampler de entrada; tex2D: salida; new-tex2D: trabajo.
    in-tex2D source RES [1 x samples.length]b FloatPairs TexUnit12 <= samples
    tex2D result RES [1 x samples.length]b FloatPairs TexUnit13
    new-tex2D scratch RES [1 x samples.length]b FloatPairs TexUnit14

    tex2D compact|compactTex[4,2] RFloat TexUnit15 <= samples
    tex2D named ~ namedTex RES [4 x 2] FloatPairs TexUnit16
}



use demo
drawTriangles -> [result] size [1,samples.length]b {
}

<Pos>
