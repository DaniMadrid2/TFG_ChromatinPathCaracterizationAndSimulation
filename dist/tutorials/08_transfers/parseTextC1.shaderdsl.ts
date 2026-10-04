// <= sube un array a textura o lee textura hacia un array de CPU.
// El sufijo b convierte longitud en texeles segun los canales del formato.
<Pre>

let trajectory = [0,0, 1,0, 1,1, 0,1]
let cpuCopy = []



resource Pairs {
    format: RG32F
    filter: NEAREST
    wrap: CLAMP
}



program demo "demo" {
    tex2D positionTexture RES [1 x trajectory.length]b Pairs TexUnit12 <= trajectory
}



positionTexture <= trajectory



cpuCopy <= positionTexture



use demo
drawTriangles -> [] size [640,480] {
}

<Pos>
