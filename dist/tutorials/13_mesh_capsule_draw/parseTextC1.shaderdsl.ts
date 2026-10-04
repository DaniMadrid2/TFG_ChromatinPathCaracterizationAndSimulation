// MeshCapsule tambien registra funciones DSL como MeshFillerProgram y Axis3DGroup.
// El tick actualiza y dibuja la superficie con su camara.
<Pre>

MeshProgram input=TexUnit20 32x32
lduse meshProgram
meshProgram.initUniforms().setPerXPerY(0.5,0.5).setDXDY(0.16,0.16).setColorHueScale(1)
surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)} .bind()



camera = Camera3D pos=vec3(0,4,12)
camera.direction = new Vector3D(0,-0.3,-1)
camera.calculateMatrices()



Axis3DGroup axisLength=vec3(4) drawArrows=true
lduse axis3DGroup
axis3DGroup.setDivisions(4).initUniforms()



MeshFillerProgram TexUnit20 "(x,y)=>{ sin(x/4)*cos(y/4) }"



tick {
    use meshProgram
    meshProgram.draw(0,0,640,480,{camera},"LINES")

    use axis3DGroup
    axis3DGroup.draw({camera})
}
start

<Pos>
