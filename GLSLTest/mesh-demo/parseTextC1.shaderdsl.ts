// MeshProgram dibuja una textura de alturas como malla con una Camera3D.
// Los nombres meshProgram, camera3D y axis3DGroup se generan automaticamente.
<Pre>

MeshProgram input=TexUnit20 32x32
lduse meshProgram
meshProgram.initUniforms().setPerXPerY(0.5,0.5).setDXDY(0.16,0.16).setColorHueScale(1)



surface=createIdealMesh TexUnit20 (x,y)=>{return sin(x/4)*cos(y/4)} .bind()



Camera3D pos=vec3(0,3,8);
camera3D.direction = new Vector3D(0,-0.3,-1)
camera3D.calculateMatrices()



Axis3DGroup axisLength=vec3(4) drawArrows=true
lduse axis3DGroup
axis3DGroup.setDivisions(4).initUniforms()



tick {
    camera3D.tick({dt},{keypress},{mousepos},{mouseclick})
    depthTest true

    use meshProgram
    meshProgram.draw(0,0,640,480,{camera3D},"LINES")

    use axis3DGroup
    axis3DGroup.draw({camera3D})
}
start

<Pos>
