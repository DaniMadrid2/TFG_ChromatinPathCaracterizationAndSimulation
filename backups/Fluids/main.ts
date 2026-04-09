import {Camera2D, createCanvas, GameObject, ModernCtx, Scene,
    ImgLoader, KeyManager, keypress, mousepos, MouseManager, ScreenManager,
    createLayer} from "/Code/Game/Game.js";
type MCTX=ModernCtx & CanvasRenderingContext2D;
import { Matrix3D, MatrixStack2D, Vector2D } from "/Code/Matrix/Matrix.js";
import {addFunc, start, stop, Timer} from "/Code/Start/start.js"
import {Funcion, Arrow, Field} from "/Code/MathRender/MathRender.js"
import { Triangle3D, Triangle2D, GPUFunction, GPUStatic, GPUKernel, GPUSettings, GPUThis, GPU } from "/Code/Render3D/render3d.js";
import type {Kernel} from "/ExternalCode/gpu-browser";
const W=1080, H=720;

let sc=new Scene();
let {ctx} = createCanvas("c1",W,H,sc).append().center().modern(); //"createCanvas('#C1')"
let {ctx:ctx2} = createCanvas("c2",W,H,sc).append().center().modern(); //Layer 2
ctx.fillStyle="blue";

ctx2.imageSmoothingEnabled=false;

let gpu = new (window as any).GPU({graphical:true,dynamicOutput:true, mode: "gpu"}) as GPU;


interface ExtendedGPUThis extends GPUThis {
    bitsToFloat(bits: number): number;
    floatToBits(float: number): number;
    decodeFloats(encoded:number): [number,number,number];
    encodeFloats(f1:number,f2:number,f3:number): number;
}

ctx.options.posStyle=true;
ctx2.options.posStyle=true;

KeyManager.detectKeys()


MouseManager.EnableCanvas(ctx.canvas)
MouseManager.EnableCanvas(ctx2.canvas)

let time=0;

function numDot(x:number[],y:number[]){
    return x[0]*y[0]+x[1]*y[1]+x[2]*y[2];
}
gpu.addFunction(numDot);
function subs(x:number[],y:number[]){
    return [x[0]-y[0],x[1]-y[1],x[2]-y[2]];
}
gpu.addFunction(subs);
function add(x:number[],y:number[]){
    return [x[0]+y[0],x[1]+y[1],x[2]+y[2]];
}
gpu.addFunction(add);
function scMult(x:number[],sc){
    return [x[0]*sc,x[1]*sc,x[2]*sc];
}
gpu.addFunction(scMult);
function capColor(x:number){
    if(x<0) return 0;
    if(x>1) return 1;
    return x;
}
gpu.addFunction(capColor);
type Pos=[number,number,number];
function positionToCell(position:Pos,US:number) {
    return 23197*Math.floor(position[0]/US)+23345*Math.floor(position[1]/US)+10091*Math.floor(position[2]/US);
}
gpu.addFunction(positionToCell);
function offsetToCell(offset:Pos) {
    return 23197*offset[0]+23345*offset[1]+10091*offset[2];
}
gpu.addFunction(offsetToCell);

function calculateCellIndices(particles:Pos[],US:number) {
    const spatialIndices:[number,number][]=[];
    for (let i = 0; i < particles.length; i++) {
        spatialIndices[i]=[positionToCell(particles[i],US),i];
    }
    spatialIndices.sort((a,b)=>{return a[0]>b[0]?1:0});
    return spatialIndices;
}
// gpu.addFunction(calculateCellIndices);


const US=300;//10 cells size screen

let particleRadius=40;
function calculateStartCellIndices(spatialIndices:[number,number][]) {
    let lastCellI=-1;
    // const startSpatialIndexArr:number[]=[]//cell -> spatialIndex
    const startSpatialIndexArr:[number,number][]=[]//[cell, spatialIndex]
    for (let i = 0; i < spatialIndices.length; i++) {
        if(lastCellI!=spatialIndices[i][0]){
            // startSpatialIndexArr[spatialIndices[i][0]]=i;
            startSpatialIndexArr.push([spatialIndices[i][0],i]);
            lastCellI=spatialIndices[i][0];
        }
    }
    return startSpatialIndexArr;
}
// gpu.addFunction(calculateStartCellIndices);

function getForce(distance:number) {
    if(distance>35000) return 0;
    let value=distance/10;
    return value*value*value;
}
gpu.addFunction(getForce);

function parsePosVel(val1:number,val2:number) {
    // Clamp values to their respective bit ranges
    val1=Math.floor(val1*100)
    val2=Math.floor(val2*100)
    
    // Clamp val1 and val2 to their respective bit ranges
    val1 = val1 & 0x1FFFF; // Ensure val1 is only 17 bits (0 to 131071)
    const magnitude = Math.abs(val2) & 0x3FFF; // Clamp val2 magnitude to 14 bits
    const sign = val2 < 0 ? 1 : 0; // Determine the sign of val2 (1 bit)

    // Combine val1 (17 bits) and val2's magnitude and sign into a single 32-bit integer
    const resultBits = (val1 << 15) | (sign << 14) | magnitude;

    return resultBits;
}
gpu.addFunction(parsePosVel);

const nParts=10;
const tickParticles = gpu.createKernel((function(this: ExtendedGPUThis,particles:number[],velocities:number[],spatialIndxs:number[],spatialIndxslength:number,startSpatialIndxs:number[],startSpatialIndxslength:number,US:number,dt:number,cellCountRadius:number){
    const idx = this.thread.x*3+0.0;
    
    const pos:Pos=[particles[idx+0],particles[idx+1],particles[idx+2]];
    const cell=positionToCell(pos,US);
    let vx=velocities[idx+0];
    let vy=velocities[idx+1];
    let vz=velocities[idx+2];
    for (let i = -cellCountRadius; i < cellCountRadius+1; i++) {
    for (let j = -cellCountRadius; j < cellCountRadius+1; j++) {
    for (let k = -cellCountRadius; k < cellCountRadius+1; k++) {
        const ncell=cell+offsetToCell([i,j,k+1]);
        let startLookUp=-1;
        // if(i==-1&&j==-1&&k+1==-1)
        //     vx+=0.2
        for(let na=0; na<startSpatialIndxslength; na++){
            if(startSpatialIndxs[2*na+0]==ncell){
                startLookUp=startSpatialIndxs[2*na+1];
                break;
            }
        }
        if(startLookUp<0) continue;
        for (let n = spatialIndxs[startLookUp*2+1]; n < spatialIndxslength; n++) {
            const neighPos:Pos=[particles[spatialIndxs[2*n+1]*3+0]
                ,particles[spatialIndxs[2*n+1]*3+1],particles[spatialIndxs[2*n+1]*3+2]];
            const tmpcellIndx=spatialIndxs[2*n+0];
            if(ncell!==tmpcellIndx) continue;
            let dx=neighPos[0]-pos[0];
            let dy=neighPos[1]-pos[1];
            let dz=neighPos[2]-pos[2];
            if(dz<1) dz=0;
            if(dx==0&&dy==0&&dz==0) continue;
            let distance=Math.sqrt(dx*dx+dy*dy+dz*dz);
            let force=-getForce(distance);
            vx+=force*dx/distance/10;
            vy+=force*dy/distance/10;
            vz+=force*dz/distance/10;
            
        }


    }
    }
    }
    if(Math.sqrt(vx*vx+vy*vy+vz*vz)>1){
        vx/=Math.sqrt(vx*vx+vy*vy+vz*vz);
        vy/=Math.sqrt(vx*vx+vy*vy+vz*vz);
        vz/=Math.sqrt(vx*vx+vy*vy+vz*vz);
    }
    if(particles[idx+0]>1080){
        vx=-0.2;
    }
    if(particles[idx+0]<0){
        vx=0.2;
    }
    if(particles[idx+1]>720){
        vy=-0.2;
    }
    if(particles[idx+1]<0){
        vy=0.2;
    }
    if(particles[idx+2]>1080){
        vz=-0.2;
    }
    if(particles[idx+2]<0){
        vz=0.2;
    }
    // vx=0;
    // vy=1;
    // vz=0;
    
    let px=particles[idx+0]+vx*10;
    let py=particles[idx+1]+vy*10;
    let pz=particles[idx+2]+vz*10;
    return [parsePosVel(px,vx),parsePosVel(py,vy),parsePosVel(pz,vz),1]
    
})).setOutput([nParts]);

// const renderParticles=gpu.createKernel((function(this:ExtendedGPUThis,particles:Pos[],US:number,particleRadius:number){
//     let [zr,zg,zb,za]=[1,1,1,1];
//     [zr,zg,zb,za]=renderParticles(particles,particleRadius,x,y);
    

//     this.color(capColor(zr),capColor(zg),capColor(zb),capColor(za))
// })).setOutput([W,H]).setGraphical(true);

let particles:Pos[]=[];
let velocities:Pos[]=[];
for (let i = 0; i < nParts; i++) {
    particles.push([W/2,Math.random()*H,0]);
    velocities.push([0,0,0]);
}
// console.log(extractPosVel(new Float32Array([parsePosVel(353.5,2.5)])[0]),extractPosVel(parsePosVel(1080,2.5)))
function extractPosVel(float32Value:number) {
    const bits = float32Value; // Extract the bits as a 32-bit integer

    // Decode val1 (17 bits) from the top 17 bits
    const val1 = (bits >> 15) & 0x1FFFF; // Extract the 17 bits for val1
    const sign = (bits >> 14) & 0x1; // Extract the sign bit
    const magnitude = bits & 0x3FFF; // Extract the 14 bits for magnitude
    const val2 = sign === 0 ? magnitude : -magnitude; // Adjust magnitude based on the sign


    return [ val1/100, val2/100 ];
}

let spatialIndxs=calculateCellIndices(particles,US);
let startSpatialIndxs=calculateStartCellIndices(spatialIndxs);
addFunc((dt)=>{
    try{
    ctx.cls("black")
    sc.draw()
    time+=dt;
    // if(dt>1.5){
    //     stop();
    // }
    if(!particles||!velocities||!tickParticles) return;
    spatialIndxs=calculateCellIndices(particles,US);
    startSpatialIndxs=calculateStartCellIndices(spatialIndxs);
    if(particles.length!==nParts) return;
    if(velocities.length!==nParts) return;
    if(spatialIndxs.length!==nParts) return;
    // if(Math.random()<0.001)
    //     console.log(spatialIndxs,startSpatialIndxs);
    let parcVels=tickParticles(particles.flat(),velocities.flat(),spatialIndxs.flat(),spatialIndxs.length,startSpatialIndxs.flat(),startSpatialIndxs.length,
    US,dt, 1) as any as number[][];
    for (let i = 0; i < parcVels.length; i++) {
        let [x,y,z]=parcVels[i];
        let [px,vx]=extractPosVel(x)
        let [py,vy]=extractPosVel(y)
        let [pz,vz]=extractPosVel(z)
        if(Math.random()<0.01)
            console.log(px,py,pz,vx,vy,vz)
        particles[i]=[px,py,pz];
        velocities[i]=[vx,vy,vz];
        let zfactor=Math.abs((((pz||0.001)+300)/300));
        if(pz<-10||zfactor>100) continue;
        ctx.circle((px-W/2)/zfactor+W/2,(py-H/2)/zfactor+H/2,40/zfactor,40/zfactor,"blue");   
    }
    // ctx.drawImage(tickParticles.canvas,0,0,W,H);

    if(keypress.f&&!ScreenManager.isFullScreen()){
        ctx.openFullScreen()
    }
    ctx.font="50px Arial"
    ctx.fillText((~~(1/dt))+"",30,70)
    }catch(err){
        // console.error(err);
        if(!(err+"").includes("source array is too long"))
            stop();
        else{
            if(Math.random()<0.01){

                console.log(particles.flat(),velocities.flat(),startSpatialIndxs.flat())
            }
        }
    }
})

// setTimeout(()=>{

    start();
// },4000)



