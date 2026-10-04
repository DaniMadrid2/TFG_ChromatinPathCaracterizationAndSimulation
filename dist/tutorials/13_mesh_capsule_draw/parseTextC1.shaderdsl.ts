// MeshCapsule tambien registra funciones DSL como MeshFillerProgram y Axis3DGroup.
// El tick actualiza y dibuja la superficie con su camara.
<Pre>

MeshProgram input=TexUnit20 32x32
surface=createIdealMesh TexUnit20 (x,y)=>{sin(x/4)*cos(y/4)} .bind()



camera = Camera3D pos=vec3(0,4,12)
camera.calculateMatrices()



Axis3DGroup axisLength=vec3(4) drawArrows=true



MeshFillerProgram TexUnit20 "(x,y)=>{ sin(x/4)*cos(y/4) }"



tick {
    lduse meshProgram
    meshProgram.draw(0,0,640,480,{camera},"LINES")

    use axis3DGroup
    axis3DGroup.draw({camera})
}
start

<Pos>
