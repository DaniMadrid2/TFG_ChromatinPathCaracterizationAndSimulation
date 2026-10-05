

<Pre>


meshProgram = DynamicSolidMeshProgram input=TexUnit20 1024x1024
lduse meshProgram
let scaleFactor=1;
var time=0;

//TODO añadir LOD mínimo/máximo, es decir que no se haga infinitamente con menos resolución
meshProgram.initUniforms().setDXDY(0.16*scaleFactor,0.16*scaleFactor).setYScale(scaleFactor).setPerXPerY(0.5,0.5).setColorHueScale(0.223).smoothColor(true).setRepeat(true)
meshProgram.setGridRadius(512).setFullResolutionCells(120).setFalloff(1640).setRepeatRadius(120)
meshProgram.setLODOrigin(0,0).setPriorityTexels([[512,512]])
// surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)+-exp(0.00001*((x-512)*(x-512)+(y-512)*(y-512)))*12} .bind()
// surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)+(x+y/2)/100-10} .bind()
surface=createIdealMesh TexUnit20 (x, y) => {let dx = (x - 512) * 0.05;let dy = (y - 512) * 0.05;let r = Math.sqrt(dx * dx + dy * dy);if (r === 0) return 10; return (cos(r + {time}) / r) * 15;}

// surface=createIdealMesh TexUnit20 (x, y) => { return (sin(x / 16+ {time}) + sin(y / 16+ {time}) * cos((x / 16+ {time}) / 2)) * 8; } .bind()
// surface=createIdealMesh TexUnit20 (x, y) => { return sin(x / 10 + {time}) * cos(y / 10) * 2 - 30 / (1 + (Math.pow((x-512)*0.03, 2) + Math.pow((y-512)*0.03, 2)) * 0.1); }.bind()


// ==========================================
// 🌊 EFECTOS AGUA Y MAREAS AVANZADAS
// ==========================================

// 1. Mar Picado (Ondas Gerstner aproximadas: interacciones cruzadas con frecuencias variables)
// surface=createIdealMesh TexUnit20 (x, y) => { return (sin(x / 8 + {time} * 2) * cos(y / 12 - {time}) + sin(y / 6 + {time} * 1.5) * cos(x / 14 + {time})) * 4; }.bind()

// 2. Ondas Concéntricas de Múltiples Impactos (Interferencia de dos gotas cayendo en puntos distintos)
// surface=createIdealMesh TexUnit20 (x, y) => { let dx1 = (x - 300) * 0.05; let dy1 = (y - 300) * 0.05; let r1 = Math.sqrt(dx1*dx1 + dy1*dy1); let dx2 = (x - 700) * 0.04; let dy2 = (y - 600) * 0.04; let r2 = Math.sqrt(dx2*dx2 + dy2*dy2); return (sin(r1 - {time} * 3) / (1 + r1 * 0.1) + cos(r2 - {time} * 4) / (1 + r2 * 0.08)) * 8; }.bind()


// ==========================================
// ⛰️ PAISAJES NATURALES Y GEOGRAFÍA
// ==========================================

// 3. Cadena de Montañas Estilo Ruido Fractal (Crestas afiladas superpuestas a diferentes escalas)
// surface=createIdealMesh TexUnit20 (x, y) => { let h1 = sin(x / 40) * cos(y / 40) * 20; let h2 = Math.abs(sin(x / 15)) * Math.abs(cos(y / 15)) * 8; let h3 = sin(x / 5 + {time}) * 1.5; return h1 + h2 + h3 - 10; }.bind()

// 4. Cañón o Valle Profundo (Un gran abismo en el centro flanqueado por mesetas accidentadas)
// surface=createIdealMesh TexUnit20 (x, y) => { let distAlCentro = Math.abs(x - 512) * 0.02; let valle = -25 / (1 + distAlCentro * distAlCentro); let ruidoRoca = sin(x / 10 + {time}) * cos(y / 10) * 3; return valle + ruidoRoca; }.bind()

// 5. Dunas del Desierto (Ondas asimétricas de viento que avanzan lentamente)
// surface=createIdealMesh TexUnit20 (x, y) => { let viento = x / 25 + y / 50 + {time} * 0.2; return (Math.pow(sin(viento), 3) + cos(x / 12) * 0.3) * 6 - 5; }.bind()


// ==========================================
// 🌀 CIENCIA FICCIÓN Y GEOMETRÍA ABSTRACTA
// ==========================================

// 6. Agujero de Gusano / Vórtice de Gravedad (Un embudo masivo central que gira con el tiempo)
// surface=createIdealMesh TexUnit20 (x, y) => { let dx = (x - 512) * 0.04; let dy = (y - 512) * 0.04; let r = sqrt(dx * dx + dy * dy); let angulo = atan2(dy, dx); if (r === 0) return -50; return -40 / (1 + r * 0.2) + sin(r - {time} * 2 + angulo * 3) * 3; }.bind()

// 7. Terreno Modular / Ciudad Ciberpunk (Estructuras cúbicas pixeladas simulando bloques o edificios)
// surface=createIdealMesh TexUnit20 (x, y) => { let blockX = Math.floor(x / 32) * 32; let blockY = Math.floor(y / 32) * 32; return (sin(blockX / 50 + {time}) * cos(blockY / 50 + {time}) * 15) + (sin(x / 4) * 0.5); }.bind()

// 8. Tela de Araña / Matriz de Cuerdas (Patrón de malla tensada con pulsos oscilantes)
// surface=createIdealMesh TexUnit20 (x, y) => { return (Math.sin(x / 10) * Math.sin(y / 10) >= 0 ? 4 : -4) * sin({time} * 2); }.bind()


// ==========================================
// 🧬 PSICODELIA Y MATEMÁTICA AVANZADA
// ==========================================

// 9. Interferencia Moiree (Ondas que se cruzan generando patrones geométricos complejos y cambiantes)
// surface=createIdealMesh TexUnit20 (x, y) => { return sin(Math.sqrt(x*x + y*y) / 5 - {time} * 2) * cos((x * y) / 5000 + {time}) * 10; }.bind()

// 10. Terreno de Huevo de Pascua (Patrón fractal repetitivo alternado en rejilla)
// surface=createIdealMesh TexUnit20 (x, y) => { return (sin(x / 8) + cos(y / 8) + sin((x + y) / 16 + {time})) * 5; }.bind()

// 11. Volcán en Erupción (Un cono invertido central con magma ondulante en su cráter)
// surface=createIdealMesh TexUnit20 (x, y) => { let dx = (x - 512) * 0.05; let dy = (y - 512) * 0.05; let r = Math.sqrt(dx * dx + dy * dy); let baseCono = 30 / (1 + r * 0.1); let lava = r < 5 ? (sin({time} * 5) * 3 + 25) : 0; return r < 5 ? lava : baseCono; }.bind()

// 12. Pista de Baño de Ondas Moduladas (La superficie se retuerce sobre su propio eje)
// surface=createIdealMesh TexUnit20 (x, y) => { return sin(x / 20 + sin(y / 20 + {time})) * cos(y / 20 + cos(x / 20 + {time})) * 12; }.bind()


camera3D = Camera3D pos=vec3(0,4,12);
camera3D.direction = new Vector3D(0,-0.3,-1)
camera3D.calculateMatrices()


Axis3DGroup axisLength=vec3(4) drawArrows=true
lduse axis3DGroup
axis3DGroup.setDivisions(4).initUniforms()


camera3D.bindRKey("z")
MeshFillerProgram TexUnit20

let offset = new Vector2D(0, 0)

program demo "demo" {
}


// Shared texture presets
resource TauFloatTex {
   format: RG32F
   filter: NEAREST
   wrap: CLAMP
}

program movePoints "movePoints" {
    in-tex2D positionTexture RES [1 x trajectory.length]b TauFloatTex TexUnit12 <= trajectory
    new-tex2D positionTextureNext RES [1 x trajectory.length]b TauFloatTex TexUnit13

    //Recuerda que in-tex2D indica que la textura es de entrada
    //Recuerda que new-tex2D indica que la textura es de reemplazo o es temporal
    //Y que tex2D se suele referir a texturas de salida del documento
}


setCoords_u = uniforms{
    offsetX = {offset.x}f
    offsetY = {offset.y}f
}

let movePointsFBO = null

//TODO {variable}nºdecimalesf o {}i para tomar solo un nº de decimales o ninguno, para evitar errores de redondeo extendiendose (notiene que mostrarse el nf o el i) en la representación del a extensión
tick -2-README {offset}10f- {
    time+=dt*3;
    // pingpong (positionTexture, positionTextureNext) {
    //     use movePoints
    //     drawTriangles -> [positionTextureNext] size [1,trajectory.length]b {
    //         uniforms{
    //             {dt}f
    //         }
    //         rebind {
    //             positionTexture -> TexUnit12
    //         }
    //     }

    //     unbindFBO movePoints

    //     use demo
    //     drawPoints {positionTextureNext}vec2 -> [] size [640,480] {
    //         uniforms{
    //             setCoords_u
    //         }
    //         backUp: /parseTextC12/lines, maxBackUpIterations: 20, priority: first
    //     }
    // }
    
    camera3D.tick( {dt} , {keypress} , {mousepos} , {mouseclick} )

    use meshFillerProgram
    meshFillerProgram.tick().draw()

    use meshProgram
    meshProgram.setCameraPosition(camera3D.position)
    meshProgram.draw(0,0,640,480,{camera3D},"TRIANGLE_STRIP")

    

    // use axis3DGroup
    // axis3DGroup.draw({camera3D})

    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "f" {
    openFullscreen(canvas)
}

OnKey "a" {
   offset.x += 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "d" {
   offset.x -= 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "w" {
   offset.y -= 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

OnKey "s" {
   offset.y += 0.1
    // log "-> offset:" {offset.x} {offset.y}
}

keypress.listen()

start

<Pos>
