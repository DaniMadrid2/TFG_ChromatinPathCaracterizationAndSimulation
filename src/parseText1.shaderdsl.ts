    <Pre>
    
    MeshProgram input=TexUnit20 1024x1024 //por defecto=meshProgram
    lduse meshProgram
    meshProgram.initUniforms().setPerXPerY(1,0).setColorHueScale(1)

    a=createIdealMesh TexUnit20 (x,y)=>{cos(x*y/10000)*3} .bind()
    // a=createIdealMesh TexUnit20 (x,y)=>{(sin(x/50)+cos(y/50))*2.3} .bind()
    // a=createIdealMesh TexUnit20 (x,y)=>{ exp(-(y/100-5)**2-(x/100-5)**2)*5} .bind()
    // a=createIdealMesh TexUnit20 (x,y)=>{ exp(-(y/100-({camera3D}?.position?.x||0))**2-(x/100-5)**2)*5} .bind()

    // fillMeshTexture a (x,y)=>{ exp(-(y/100-3)**2-(x/100-5)**2)*5}
    
    Axis3DGroup axisLength=vec3(15.3) drawArrows=true heights=vec3(0.6,0.8,0.8) radii=vec3(0.125)
       planes=["XZ","XY","YZ"] //por defecto axisProgram
    
    lduse axis3DGroup
    axis3DGroup.setDivisions(4).initUniforms()
    
    Camera3D pos=vec3(0,4,20)
    camera3D.calculateMatrices()

    Camera3D pos=vec3(0,0,0)
    log {camera3D.position.values} "camera3D"
    log {camera3D1.position.values} "camera3D1"

    // MeshFillerProgram TexUnit20 "(x,y) => { cos(-(y/100-cos({(camera3D?.position?.x||0)/3, float}*3)))}"
    // MeshFillerProgram TexUnit20 "(x,y)=>{ exp(-(y/100-14.5+({camera3D?.position?.z||0, float}))**2-(x/100+1.5-({camera3D?.position?.x||0, float}))**2)*5}"
    // MeshFillerProgram TexUnit20 "(x,y)=>{ exp(-(y/100-({mousepos.y/H*10, float}))**2-(x/100-({mousepos.x/W*10, float}))**2)*5}"
    
    camera3D.bindRKey("z")
    camera3D1.setMoveControlsAt("g").setCamControlsAt().setMouseControls()

    // MeshFillerProgram TexUnit20 "(x,y)=>{ exp(-(y/100-14.5+({camera3D1?.position?.z||0, float}))**2-(x/100+1.5-({camera3D1?.position?.x||0, float}))**2)*5}"
    // MeshFillerProgram TexUnit20 "(x,y)=>{cos((x-500)*(y-500)/10000+ {u_time*3})*3}"
    MeshFillerProgram TexUnit20 "(x,y)=>{ sin((x-500-500)/1000)*1000/((x-500)) }"
    use meshProgram  
    
    

    tick{
        use meshProgram  
        camera3D.tick( {dt} , {keypress} , {mousepos} , {mouseclick} )
        camera3D1.tick( {dt} , {keypress} , {mousepos} , {mouseclick} )
        
        
        depthTest true
        meshProgram.draw( 0 , 0 , {W} , {H} , {camera3D} , "LINES" );
        // draw meshProgram {W} {H} {camera3D} 
        
        use axis3DGroup
        axis3DGroup.draw( {camera3D} );

        use meshFillerProgram
        meshFillerProgram.tick().draw()
        // log {camera3D.position.values} "camera3D"
        // log {camera3D1.position.values} "camera3D1"
    }

    start

    <Pos>
