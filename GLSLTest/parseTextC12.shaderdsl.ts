

<Pre>


meshProgram = SolidMeshProgram input=TexUnit20 1024x1024
lduse meshProgram
let scaleFactor=1;
//TODO que la extensión pueda saber cuándo estamos trabajando con un objeto de tal clase y autocomplete al usar sus funciones o variables
//TODO el renderizado de solidMeshProgram no deduce el color en el fragment shader sino que lo pilla del pixel de creacion, debe de ser en el fragment si es posible?
meshProgram.initUniforms().setPerXPerY(0.5,0.5).setDXDY(0.16*scaleFactor,0.16*scaleFactor).setYScale(scaleFactor).setColorHueScale(1)
// surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)+-exp(0.00001*((x-512)*(x-512)+(y-512)*(y-512)))*12} .bind()
surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)} .bind()


camera3D = Camera3D pos=vec3(0,4,12);
camera3D.direction = new Vector3D(0,-0.3,-1)
camera3D.calculateMatrices()



Axis3DGroup axisLength=vec3(4) drawArrows=true
lduse axis3DGroup
axis3DGroup.setDivisions(4).initUniforms()


camera3D.bindRKey("z")
MeshFillerProgram TexUnit20 "(x,y)=>{ sin(x/4)*cos(y/4) }"

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

tick {
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

    use meshProgram
    meshProgram.draw(0,0,640,480,{camera3D},"TRIANGLE_STRIP")

    // use axis3DGroup
    // axis3DGroup.draw({camera3D})

    // log "-> offset:" {offset.x} {offset.y}
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
