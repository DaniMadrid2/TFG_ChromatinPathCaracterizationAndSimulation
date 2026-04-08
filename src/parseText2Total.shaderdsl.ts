camera = Camera3D pos=(0,1,0) fov=63


let [datosX, datosY] = $getDataArrays$(datos_reales)

drawData = Program  |= d
datosXtex|=dX = texture2DArray RFloat datosX "datosX" texUnit0 
{MAX_TEXTURE_SIZE}x{1}x{(~~(datosY.length/MAX_TEXTURE_SIZE/MAX_TEXTURE_SIZE))}

datosYtex|=dY = texture2DArray RFloat datosY "datosY" texUnit1 
{MAX_TEXTURE_SIZE}x{1}x{(~~(datosY.length/MAX_TEXTURE_SIZE/MAX_TEXTURE_SIZE))}

dX.setLengthUniforms()
dY.setLengthUniforms()

//Declarar Uniforms forma 1:
// d -> uVec offset = (0,0,0)
// d -> uFloat scale = 1
// d -> uInt lCromatin = {drawDataCount/nCromatins}
// d -> uInt is3D = {!!is3D?1:0}
// camera.setUniformsProgram(d)

// o
//Declarar Uniforms forma 2:
uniforms d {
   offset = vec3(0,0,0)
   scale = 1f
   lCromatin = {drawDataCount/nCromatins}
   is3D = {!!is3D?1:0}
}

tick {
    d.use()
    if(is3D){
        camera.tick(dt,keypress,mousepos,mouseclick);
        camera.calculateMatrices().setUniformsProgram(drawData as any);
    }else{
        let camzoom=camera.position.y;
        let dp=keypress.Depth();
        if(dp<0){
            camzoom*=1.05;
            if(camzoom==0) camzoom=1;
        }
        
        if(dp>0){
            camzoom/=1.05;
            if(camzoom==0) camzoom=1;
        }
        camera.tick(dt/(camzoom)*4.5,keypress,mousepos,mouseclick);
        camera.position.y=camzoom;
        u[offset].set([camera.position.x,camera.position.z, camera.position.y]);
        u[scale].set((camzoom))
        if(percentageShown<1){
            percentageShown+=dt*ShownSpeed*0.2;
            if(percentageShown>1)
                percentageShown=1;
            }
        }
}

draw {
   viewport d [0,0,W,H]
   d.VAO.bind();
   
   n_cromatin=n_cromatin%nCromatins   
   let lCromatin=drawDataCount/nCromatin   
   let templCromatin=lCromatin;
   percentageShown
}

start

