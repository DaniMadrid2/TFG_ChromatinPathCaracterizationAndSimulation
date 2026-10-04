// MeshCapsule es el identificador actual del modulo, detectado al usar MeshProgram.
// Camera3D y createIdealMesh preparan la malla antes del primer dibujo.
<Pre>

MeshProgram input=TexUnit20 32x32



camera = Camera3D pos=vec3(0,4,12)
camera.calculateMatrices()



surface=createIdealMesh TexUnit20 (x,y)=>{sin(x/4)*cos(y/4)} .bind()



lduse meshProgram
meshProgram.initUniforms().setPerXPerY(1,0).setColorHueScale(1)

<Pos>
