/*

Las moléculas forman conexiones (bonds), hacen que se atraigan en algunas partes, esta atracción 
es lo que causa el empuje de las vecinas y la deceleración de la molécula (transpasa momento en más de una
a la vez), hasta que se rompe (se va muy rápido que la conexión no es lo suficientemente fuerte).
Esto causa la viscosidad (cambio de momento lateralmente). Si fuese sólo una atracción
simétrica en cualquier dirección (iso-nosequé) esto no funcionaría igual al estar constantemente 
en acción, sólo cambiaría el coeficiente de interacción, sin embargo así se generan cambios de flujo
entre capas de moléculas (dicho otra vez, lateralmente).

Lo que causa que el vapor que se genera dentro del agua al hervir es la densidad del vapor 
(que es menor siempre) (moléculas más separadas, no importa su velocidad). Para repetir 
por qué suben vemos que es porque es más difícil atravesar moléculas juntas que separadas (más espacio).
Es decir que estas moléculas que están más separadas entre sí, si no lo están de otras causa que se separan.
No llegan a atravesar lateralmente las otras partículas más juntas, ni a las de abajo, pero las de arriba 
encuentran más huecos por lo que se mete y penetran hacia abajo, causando más capas de partículas
más densas (menos separadas) abajo, haciendo que estas tengan que subir para separarse más. 
Si la presión del aire es superada seguirá subiendo. 
Básicamente la energía causa más separación (y romperse más conexiones de moléculas).

La presión es básicamente una medida de densidad y energía en un espacio, si las moléculas
tienen mucha energía (Temp es una media (cada una)), para gases en un gran espacio no habrá mucha densidad
de partículas, por lo tanto tampoco de conexiones, ni de empujes a la superficie del volumen de esta. 
Para fluidos (como el agua, incompresibles), estas moléculas ya están juntas, no hay forma de que floten
y cambie su densidad como los gases, por lo que por decirlo es un muelle muy prieto a cualquier presión
no muy baja.

Al bajar la presión exterior, su velocidad/energía/temperatura no cambiará, habrá más espacio para estas
moléculas, por lo que podrán estar lo suficientemente separadas. Antes de eso, las moléculas
que tenían suficiente energía escaparán como gases, bajando la temperatura de las restantes (menos interacciones
/ presiones interiores). Esto puede causar que el agua se congele

Moléculas con energía: Maxwell–Boltzmann distribution (la cola)

El punto al que decimos que las moléculas son un gas es en el que la energía cinética media es
igual a la energía necesaria para que no haya conexiones (bonds) entre moléculas.
GAS=moléculas libres de conexiones (atracciones)

Ser un sólido es cuando las velocidades de las moléculas internas no son lo suficientemente
fuertes para romper una conexión. Al empujar nosotros estas moléculas la energía se transfiere
entre todas las moléculas, manteniendo estas conexiones firmes. Al calentar estas moléculas
estamos enviando moléculas que empujan a distintas velocidades. Cuando en conjunto se es suficente
para romper varias conexiones a la vez, estas empezarán a vibrar e ir rompiéndose a cada rato como en un 
fluido.

Materiales que no tienen conexiones (bonds) y por lo tanto nunca pueden comportarse como un
sólido (depende de la presión, es decir energía media y volumen): Helio (>25atm cerca de 0K),
Hidrógeno (debajo de 14K), neon (debajo de 25K).

La gravedad hace posible presionar las moléculas desde sólo una dirección (hace falta un suelo que presione).

Conexiones (bonds):

Intramoleculares (covalentes = compartir electrón):
    U(r)≈D_e​( 1 − exp(−a(r−r0​)) )2
    Strength: Very strong, ~100–1000 kJ/mol (≈ 1–10 eV per bond).
    Potential energy curve: Deep well; energy rises steeply when
     atoms are compressed (Pauli repulsion) or stretched beyond bond length

Iónicas (atracción electroestática entre iones)
    U(r)=−k_e​q_1​q_2/r​​+B/r^12
    Strength: ~400–4000 kJ/mol (depends on ions and lattice).
    Potential energy: Combination of Coulomb attraction and Pauli repulsion at short distances.
    Deep well at equilibrium ionic distance, rises sharply if ions approach too closely (NaCL, MgO)

Hydrogen Bonds (Special dipole–dipole)

    Nature: Partial electrostatic attraction between H covalently bonded to N, O, or F and lone pair on another electronegative atom.
    Strength: ~10–40 kJ/mol.
    Potential energy: Shallow well, longer equilibrium distance than covalent bond.
    Shape: Well is shallower and wider than covalent bond; energy minimum at ~0.17–0.20 nm.
    Example: H₂O, NH₃, HF.

Fuerzas entre dipolos permanentes
    U(r)∼−μ1​μ2​​f(θ1​,θ2​) / 4πε_0​r^3
    Strength: ~1–10 kJ/mol.
    Shallow well; vanishes at long distance; much weaker than H-bonds.    ​(HCl)

London Dispersion Forces (Induced dipoles, van der Waals = electrones causan un potencial = dipolo)
    U(r)∼−C_6 / r^6 ​​+ B / r^12
    Strength: ~0.05–5 kJ/mol (very weak)​
    Very shallow, short-range well; steep repulsion at very short distance (Pauli exclusion). (He, Ne, Ar, CH₄, C₆H₆)

Metallic Bonds (mar de electrones)
    Strength: ~100–800 kJ/mol depending on metal.
    Potential energy: Collective potential; minimum at lattice distance.
    Shape: Similar to ionic + covalent but spread out over lattice.
    Example: Fe, Cu, Al.

Energy
  ↑
  |        Covalent / Ionic
  |          ____
  |         /    \
  |        /      \
  |   H-bond       \
  |     __          \
  |    /  \          \   Dipole-dipole
  |   /    \          \
  |  /      \          \  London
  | /        \          \
  +------------------------------> Distance r
  Steeper → stronger bonds (hard to break)

Shallow → weak, easily broken (liquid or gas)

Observation: The “shallowness” of the potential explains why substances
like helium or noble gases can’t solidify easily: the minimum is extremely small,
so thermal or quantum motion easily overcomes it.
*/

import {Camera2D, createCanvas, GameObject, ModernCtx, Scene,
    ImgLoader, KeyManager, keypress, mousepos, MouseManager, ScreenManager,
    createLayer,
    openFullscreen,
    mouseclick} from "/Code/Game/Game.js";
type MCTX=ModernCtx & CanvasRenderingContext2D;
import { Matrix3D, MatrixNM, MatrixNN, MatrixStack2D, Vector2D, Vector3D, Matrix4D, Quaternion, Vector } from "/Code/Matrix/Matrix.js";
import {addFunc, start, stop, Timer} from "/Code/Start/start.js"
import {Funcion, Funcion2D, Funcion3D, Arrow, Field, Axis} from "/Code/MathRender/MathRender.js"
import {createProgram, createShader, createTexture, createFramebuffer, loadShaderSource, loadShaders, fillFramebuffer} from "./opengl.js"
const W=1080, H=720;

const isDrawWater=false;
const WidthFactor=isDrawWater?1/4:1;

let sc=new Scene();
let {ctx:ctx1,canvas} = createCanvas("c1",W*WidthFactor,H*WidthFactor,sc,"webgl2").append().center(); //"createCanvas('#C1')"
let {ctx:ctx2,canvas:canvas2} = createCanvas("c2",W*WidthFactor,H*WidthFactor,sc,"webgl2").append(); //Layer 2
let {ctx:ctx3,canvas:canvas3} = createCanvas("c3",W*WidthFactor,H*WidthFactor,sc,"2d").append().modern().center(); //Layer 3
let dntiDir=(window as any).dntiDir;
(async ()=>{
const ctx:MCTX = ctx3 as any;
const gl:WebGL2RenderingContext = ctx1 as any;
const gl2:WebGL2RenderingContext = ctx2 as any;


let following=false;
let ifollow=300;

let tracking=false;
let showGraph=false;
let trackingArray=new Float32Array(3 * 2**13);
let ntrack=0;

var concentrations=[
    [1,50],
    [2,50],
    //[Size, percentage]
    // [0.3,40],
    // [1.25,15],
    // [5.5,20],
    // [9,15],
    // [16,6],
    // [40,3],
    // [90,1],
    // [0.1,10],
    // [40,10],
    // [4000,3],
]

// console.log(gl,gl)
// Example particle data (positions and normals)
const particleCount=Math.max( Math.pow(2,9),  264);
const US=1;
const nCells=2;
const textureSize = Math.ceil(Math.sqrt(particleCount));
canvas2.width=textureSize;
canvas2.height=textureSize;
// gl2.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
let particles = new Float32Array(textureSize * textureSize * 4);
let velocities = new Float32Array(textureSize * textureSize * 4);
let sizes = new Float32Array(particleCount);
let sizesCbrt = new Float32Array(particleCount);
let spatialLookUp = new Int32Array(particleCount*2);
let startsSpatialLookUp = new Int32Array(particleCount*2);


// Initialize particle positions and normals
for (let i = 0; i < particleCount*4; i++) {
    const idx = i * 4;
    
    // Position (x, y, z)
    particles[idx] = Math.random() * 6 - 3; // posX
    particles[idx + 1] = Math.random() * 6 - 3; // posY
    particles[idx + 2] = Math.random() * 6 - 3; // posZ
    // particles[idx + 2] = -2; // posZ
    // if(i==0){
    //     particles[idx] = 0.5; // posX
    //     particles[idx + 1] = 0; // posY
    //     particles[idx + 2] = 0; // posZ
    // }
    // if(i==1){
    //     particles[idx] = -0.5; // posX
    //     particles[idx + 1] = 0; // posY
    //     particles[idx + 2] = 0; // posZ
    // }

    // if(i>1)
    //         particles[idx]=10000;
    
}

for (let i = 0; i < particleCount*4; i += 4) {
    let nx = Math.random(); // normalX
    let ny = Math.random(); // normalY
    let nz = Math.random(); // normalZ

    // const magnitude = Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx=0;
    ny=0;
    nz=0;
    velocities[i + 0] = nx*10;
    velocities[i + 1] = ny*10;
    velocities[i + 2] = nz*10;
    // velocities[i + 0] = nx * 10 / magnitude; // normalized normalX
    // velocities[i + 1] = ny * 10 / magnitude; // normalized normalY
    // velocities[i + 2] = nz * 10 / magnitude; // normalized normalZ
}
(
()=>{
    //!Fill sizes as wanted

    sizes = new Float32Array(particleCount).fill(1);

    // First, compute how many particles each concentration affects
    const particleGroups = concentrations.map(([size, percent]) => {
    const count = Math.floor((percent / 100) * particleCount);
    return { size, count };
    });

    // Build a list of all indices [0..particleCount-1]
    const indices = Array.from({ length: particleCount }, (_, i) => i);

    // Shuffle indices once for homogeneity
    for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Assign sizes by taking chunks from the shuffled indices
    let offset = 0;
    for (const { size, count } of particleGroups) {
    for (let i = 0; i < count && offset + i < indices.length; i++) {
        const index = indices[offset + i];
        sizes[index] = size;
    }
    offset += count;

    for (let i = 0; i < sizes.length; i++) {
        sizesCbrt[i] = Math.cbrt(sizes[i]);
        
    }

    }
}
)();

// Initialize WebGL and set up rendering
let renderProgram,particleBuffer, sizeBuffer, waterProgram, positionTexture, sizeTexture,
 traceProgram, trackingBuffer, traceVao, depthBuffer, p_framebuffer, t_framebuffer, particlesVAO;
if(!isDrawWater){
    [renderProgram,particleBuffer, sizeBuffer, depthBuffer, p_framebuffer, particlesVAO] = await initParticleRendering(gl, particles, sizesCbrt);
    [traceProgram, trackingBuffer, traceVao, t_framebuffer] = await initTraceRendering(gl, trackingArray, depthBuffer);
}else
    [waterProgram, positionTexture, sizeTexture] = await initWaterRendering(gl, particles, sizes, particleCount, textureSize);


// Example Camera and Light setup
let camera = {
    viewMatrix: Matrix4D.Identity as any as MatrixNM,
    projectionMatrix: Matrix4D.Identity as any as MatrixNM,
    position: new Vector3D(0,0,10),
    followPosition: new Vector3D(0,0,1.3),
    direction: new Vector3D(0, 0, -1),
    UP: new Vector3D(0, 1, 0),
};

KeyManager.detectKeys();
MouseManager.EnableCanvas(canvas2);
MouseManager.EnableCanvas(canvas3);
MouseManager.EnableCanvas(canvas);


let pressDTime=0;
KeyManager.OnKey("t",()=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    tracking=!tracking;
})
KeyManager.OnKey("r",()=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    ntrack=0;
    trackingArray=new Float32Array(trackingArray.length);
})
KeyManager.OnKey("f",(e)=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    following=!following;
})
KeyManager.OnKey("v",()=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    showGraph=!showGraph;
})
KeyManager.OnKey("g",()=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    ifollow--;
})
KeyManager.OnKey("h",()=>{
    if(pressDTime>0) return;
    pressDTime=0.2;
    ifollow++;
})

let fov = 130; // Field of View in degrees
let aspectRatio = 16 / 9; // Assuming a 16:9 screen
let near = 0.001, far = 10000;

// Combine transformations
function calculateProjectionViewMatrix() {
    let viewMatrix = Matrix4D.createLookAtMatrixFromDirection(camera.position, camera.direction,camera.UP);
    // let posMatrix = Matrix4D.createViewMatrix(camera.position.x, camera.position.y, camera.position.z);

    let projectionMatrix = Matrix4D.createProjectionMatrix(fov, aspectRatio, near, far);

    
    return [viewMatrix,projectionMatrix];
}
[camera.viewMatrix,camera.projectionMatrix]=calculateProjectionViewMatrix();

const light = {
    direction: [1, -1, -1],
    color: [0.0, 1.0, 1.0],
    ambient: [0.2, 0.2, 0.2],
};


// console.log(particles.subarray(0,100),velocities.subarray(0,100))
const [ simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture ] = await initParticleSimulation(gl2, particles, sizes, particleCount, spatialLookUp, startsSpatialLookUp, US, nCells);
function createUniformBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

for (let i = 0; i < particles.length; i+=4) {
    spatialLookUp[i/2] = positionToCell([particles[i+0],particles[i+2],particles[i+3]],US);//cid from tick
    spatialLookUp[i/2+1] = i/4;//index
}
spatialLookUp.set(sortOddsOnly(spatialLookUp));
let lastCellIndex=0;
let startIdx=0;
for (let i = 0; i < spatialLookUp.length; i+=2) {
    const cellid = spatialLookUp[i];
    const particle_index = spatialLookUp[i+1];
    if(lastCellIndex!==cellid){
        startsSpatialLookUp[startIdx]=cellid;
        startsSpatialLookUp[startIdx+1]=i/2;
        lastCellIndex=cellid;
        startIdx+=2;
    }
}
if(startIdx<startsSpatialLookUp.length-1){
    startsSpatialLookUp[startIdx]=-1;
    startsSpatialLookUp[startIdx+1]=-1;
}
function sortOddsOnly(arr: Int32Array): Int32Array {
    let arr2=[];
    for (let i = 0; i < arr.length/2; i++) {
        arr2[i]=[arr[i*2+0],arr[i*2+1]];
    }
    arr2.sort((a,b)=>{
        return a[0]-b[0];
    })
    return new Int32Array(arr2.flat());
}

var lastTick = performance.now()
var now = performance.now()
var dt=0;

let tau=1;
let axis1=new Axis(0,H/4*3+150)
let r = new Funcion(0,0,(i)=>
    (Math.hypot(trackingArray[i*3+0],trackingArray[i*3+1],trackingArray[i*3+2])-
Math.hypot(trackingArray[(i-tau)*3+0],trackingArray[(i-tau)*3+1],trackingArray[(i-tau)*3+2])
)**2*10000/(r.ex-r.sx)
,1,1,trackingArray.length/3).setOnAxis(axis1).setWidth(2).setColor("red").drawEveryTime(true)
.setBounds(1,ntrack);

sc.add(r);

async function draw(dtime) {
    
    if(!isDrawWater){
        gl.useProgram(renderProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW,0);
        await drawParticles(gl, renderProgram, particleBuffer, sizeBuffer, camera, light, particleCount, p_framebuffer, particlesVAO);
        gl.useProgram(traceProgram);
        
        await drawTrace(gl, traceProgram, trackingBuffer, camera, light, ntrack, trackingArray, traceVao, t_framebuffer, tracking);
    }else{   
        gl.useProgram(waterProgram);
        await drawWater(gl, waterProgram, positionTexture, sizeTexture, camera, light, particleCount, textureSize, particles, sizes);
    }

    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error("WebGL draw Error: ", error);
    }
    ctx.cls();
    ctx.font="20px Arial"
    ctx.fillStyle="white";
    ctx.fillText((~~(1/dt))+"",30,30)
    ctx.fillStyle="orange";
    ctx.fillText((~~(1/dtime))+"",30,60)

    if(ntrack>W){
        let n=~~(ntrack/W);
        r.setOff(-(Math.max(ntrack-3,0)-W),r.offy);
    }
    if(showGraph){
        let nGraphs=20;
        let sums=new Array(nGraphs-1).fill(0);
        for (let j = 1; j < nGraphs; j++) {
            tau=j*5;
            r.setBounds(Math.max(ntrack-3,0)-W,Math.max(ntrack-3,0)-tau).setEqMaxBounds();
            r.setColor(HSLtoRGB(j*8,80,50,0.5));
            sc.draw();
            sums[j-1]=0;
            for (let i = r.sx; i < r.ex; i++) {
             
                sums[j-1]+=(-r.eval(i)-r.y)||0;   
                
            }
            sums[j-1]/=r.ex-r.sx;
            // sums[j-1]/=tau;
            sums[j-1]*=10;
        }
        Funcion.fromSet(sums).setOff(axis1.x,H/2)
        .drawEveryTime(true).setColor("orange").setWidth(2).draw(ctx);
    }
    

}

function HSLtoRGB(h, s, l,trs=1){
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    //return [255 * f(0), 255 * f(8), 255 * f(4)];
    return `rgba(${255*f(0)},${255*f(8)},${255*f(4)},${trs})`
  };


let RotSW=keypress.createSwitch("e","q");
let DepthSW=keypress.createSwitch("r","f");

let lastMousePos={...mousepos};
const walkspeed=10;
async function tick() {
    
    now = performance.now()
    dt = (now - lastTick)/1000;
        if(dt>0.1)
            dt=0.1;

    if(pressDTime>0) pressDTime-=dt;

        let dmousex=mousepos.x-lastMousePos.x;
        let dmousey=mousepos.y-lastMousePos.y;


        let dmov=6.5;
        let noMouse=false;
        
        if(keypress.right) (noMouse=true,dmousex=dmov);
        if(keypress.left) (noMouse=true,dmousex=-dmov);
        if(keypress.up) (noMouse=true,dmousey=-dmov);
        if(keypress.down) (noMouse=true,dmousey=dmov);
        
        dmousex*=fov/60;
        dmousey*=fov/60;

        // angle+=dmousex*0.001*Math.PI/2;
        
        if((mouseclick[0]||noMouse)&&Math.abs(dmousex)<100&&Math.abs(dmousey)<100){
            
            let invertY=1;
            let invertX=1;
            if(following) invertY=-1;
            // if(following) invertX=-1;

            camera.direction=Quaternion.rotateVector(camera.direction,camera.UP,-dmousex/1000*Math.PI*1.2*invertX);
            camera.direction=Quaternion.rotateVector(camera.direction,camera.UP.cross(camera.direction),dmousey/1000*Math.PI*1.2*invertY);
            // camera.UP=Quaternion.rotateVector(camera.UP,camera.UP,-dmousex/1000*Math.PI*1.2);
            camera.UP=Quaternion.rotateVector(camera.UP,camera.UP.cross(camera.direction),dmousey/1000*Math.PI*1.2*invertY);

            if(following){
                camera.followPosition=Quaternion.rotateVector(camera.followPosition as any,camera.UP,-dmousex/1000*Math.PI*1.2*invertX) as any;
                camera.followPosition=Quaternion.rotateVector(camera.followPosition as any,camera.UP.cross(camera.direction),dmousey/1000*Math.PI*1.2*invertY) as any;
            }
        }

        if(following){
            let centerVector=new Vector3D(particles[ifollow*4],particles[ifollow*4+1],particles[ifollow*4+2]);
            camera.followPosition=camera.followPosition
            .add(camera.direction.cross(camera.UP).scalar(keypress.Hor()*walkspeed*dt))//x
            .add(camera.UP.scalar(keypress.Depth()*walkspeed*dt))//y
            .add(camera.direction.scalar(-keypress.Ver()*walkspeed*dt)) as any;//z
            camera.position=centerVector.add(camera.followPosition) as any;
        }else{
            camera.position=camera.position
            .add(camera.direction.cross(camera.UP).scalar(keypress.Hor()*walkspeed*dt))//x
            .add(camera.UP.scalar(keypress.Depth()*walkspeed*dt))//y
            .add(camera.direction.scalar(-keypress.Ver()*walkspeed*dt)) as any;//z
        }
        

        
        
        if(following){
            // camera.position.x=particles[ifollow*4];
            // camera.position.y=particles[ifollow*4+1];
            // camera.position.z=particles[ifollow*4+2];
        }
        if(tracking){
            trackingArray[ntrack*3+0]=particles[ifollow*4];
            trackingArray[ntrack*3+1]=particles[ifollow*4+1];
            trackingArray[ntrack*3+2]=particles[ifollow*4+2];
            // trackingArray[ntrack*3+0]=2;
            // trackingArray[ntrack*3+1]=-2;
            // trackingArray[ntrack*3+2]=0;
            if(trackingArray[ntrack*3+0]||trackingArray[ntrack*3+1]||trackingArray[ntrack*3+2])
            ntrack++;
            if(Math.random()<0.01){
                console.log(ntrack,trackingArray.length/3);
            }
            if(ntrack>=trackingArray.length/3){
                tracking=false;
                console.log("trackingArray",trackingArray);
            }

        }

        // console.log(...camera.direction)
        lastMousePos={...mousepos};

        if(keypress.p){
            openFullscreen(canvas);
        }

    [camera.viewMatrix,camera.projectionMatrix]=calculateProjectionViewMatrix();

    // if(Math.random()<0.01){
    //     console.log(camera.viewProjection.toArray())
    // }

    // let dt=0.013;
    [particles,velocities]=await tickParticleVelocitiesSimulation(gl2, { simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture,spatialLookupTexture, startSpatialLookupTexture, textureSize }, particles, velocities, spatialLookUp, startsSpatialLookUp, 1, dt, particleCount);

    
    for (let i = 0; i < particles.length; i+=4) {
        spatialLookUp[i/2] = particles[i+3];//cid from tick
        spatialLookUp[i/2+1] = i/4;//index
    }
    spatialLookUp.set(sortOddsOnly(spatialLookUp));
    let lastCellIndex=0;
    let startIdx=0;
    for (let i = 0; i < spatialLookUp.length; i+=2) {
        const cellid = spatialLookUp[i];
        const particle_index = spatialLookUp[i+1];
        if(lastCellIndex!==cellid){
            startsSpatialLookUp[startIdx]=cellid;
            startsSpatialLookUp[startIdx+1]=i/2;
            lastCellIndex=cellid;
            startIdx+=2;
        }
    }
    if(startIdx<startsSpatialLookUp.length-1){
        startsSpatialLookUp[startIdx]=-1;
        startsSpatialLookUp[startIdx+1]=-1;
    }
    // if(Math.random()<0.01){
    //     console.log(particles.subarray(0,100),velocities.filter((v,i)=>i%4===3&&i<=100).subarray(0,100))
    //     console.log(spatialLookUp,startsSpatialLookUp);
    // }
    lastTick=now;
    setTimeout(tick,1);
}
start(async (dtime)=>{
    draw(dtime);
})
tick();
})();
async function initParticleSimulation(gl:WebGL2RenderingContext, particles, sizes, particleCount, spatialLookUp, startsSpatialLookUp,US,nCells) {
    if (!gl.getExtension('EXT_color_buffer_float')) {
        console.error('EXT_color_buffer_float not supported by your GPU or browser.');
    }
//Particle Textures
    const textureSize = Math.ceil(Math.sqrt(particleCount));

    const inputTexture = createTexture(gl, particles, textureSize, textureSize, gl.RGBA);
    const secondTexture = createTexture(gl, particles, textureSize, textureSize, gl.RGBA);
    const outputTexture = createTexture(gl, null, textureSize, textureSize, gl.RGBA);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    const framebuffer = createFramebuffer(gl, inputTexture);
    const framebuffer2 = createFramebuffer(gl, secondTexture);
    // fillFramebuffer(gl,framebuffer, inputTexture);
    // fillFramebuffer(gl,framebuffer2, secondTexture);


    const sizesTexture = createTexture(gl, null, particleCount, 1, gl.RED,gl.R32F, gl.FLOAT);
    const spatialLookupTexture = createTexture(gl, null, particleCount, 1, gl.RG_INTEGER,gl.RG32I, gl.INT);
    const startSpatialLookupTexture = createTexture(gl, null, particleCount, 1, gl.RG_INTEGER,gl.RG32I, gl.INT);
    


    // Set up shaders and program
    const [program] = await loadShaders(gl, dntiDir + "/glsl/vert1.vert", dntiDir + "/glsl/frag1.frag");

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'u_inputTexture'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_secondTexture'), 1);
    gl.uniform1i(gl.getUniformLocation(program, 'spatialLookupTexture'), 3);
    gl.uniform1i(gl.getUniformLocation(program, 'startSpatialLookupTexture'), 4);
    gl.uniform1i(gl.getUniformLocation(program, 'u_sizeTexture'), 5);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), textureSize, textureSize);
    gl.uniform1f(gl.getUniformLocation(program, 'u_deltaTime'), 0.1);  // Default deltaTime
    gl.uniform1i(gl.getUniformLocation(program, 'u_isPos'), 0);  // Default is false
    gl.uniform1f(gl.getUniformLocation(program, 'u_US'), US);  // Default is 0.2
    gl.uniform1i(gl.getUniformLocation(program, 'u_nCells'), nCells);  // Default is 2
    gl.uniform1i(gl.getUniformLocation(program, 'u_particleCount'), particleCount);
    // Define a full-screen quad (two triangles)
    const quadVertices = new Float32Array([
        -1, -1,  // Bottom-left
        1, -1,  // Bottom-right
        -1,  1,  // Top-left

        1, -1,  // Bottom-right
        1,  1,  // Top-right
        -1,  1   // Top-left
    ]);

    // Create and bind the buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Enable vertex attribute
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Enable size attribute
    const sizeBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    
    const sizeLoc = gl.getAttribLocation(program, "a_size");
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);


    
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RED, gl.FLOAT, sizes);

    return [ program, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture,spatialLookupTexture,startSpatialLookupTexture, textureSize ];
}
async function tickParticleVelocitiesSimulation(
    gl:WebGL2RenderingContext, 
    { simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture, textureSize }, 
    particles, velocities, spatialLookUp, startsSpatialLookUp, stepsPerCall, deltaTime, particleCount
) {

    gl.useProgram(simulationProgram);

    // Upload initial particle and velocity data to textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, particles);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, secondTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, velocities);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, velocities);

    //HereSpatialSubTextures
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, spatialLookupTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RG_INTEGER, gl.INT, spatialLookUp);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, startSpatialLookupTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RG_INTEGER, gl.INT, startsSpatialLookUp);


    // Setup uniforms
    gl.uniform1f(gl.getUniformLocation(simulationProgram, "u_deltaTime"), deltaTime);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_stepsPerCall"), 1);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_inputTexture"), 0); // Input positions
    gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_secondTexture"), 1); // Input velocities
    gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_isPos"), 0); // Update velocities

    // Render to the output texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

    gl.viewport(0, 0, textureSize, textureSize);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    

    // Read back the updated velocities
    const updatedVelocities = new Float32Array(textureSize * textureSize * 4);
    gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, updatedVelocities);

    gl.finish();
    // console.log("Updated velocities:", updatedVelocities);
    
    gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_isPos"), 1); // Update positions

    gl.viewport(0, 0, textureSize, textureSize);
    gl.drawArrays(gl.TRIANGLES, 0, 6);


    // Read back the updated velocities
    const updatedPositions = new Float32Array(textureSize * textureSize * 4);
    gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, updatedPositions);

    gl.finish();
    // console.log("Updated Positions:", updatedPositions);
    return [updatedPositions, updatedVelocities];
}

function positionToCell(position:[number,number,number],US:number) {
    return 23197.0*Math.floor(position[0]/US)+23345.0*Math.floor(position[1]/US)+10091.0*Math.floor(position[2]/US);
    // return 1.0*Math.floor(position[0]/US)+100.0*Math.floor(position[1]/US)+10000.0*Math.floor(position[2]/US);
}
function offsetToCell(offset:[number,number,number]) {
    return 23197*offset[0]+23345*offset[1]+10091*offset[2];
}

function renderToTexture(gl, simulationProgram, framebuffer, velocityTexture, positionTexture, outputTexture, textureSize) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

    // Bind input textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, 'u_inputTexture'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, 'u_secondTexture'), 1);

    // Render
    gl.viewport(0, 0, textureSize, textureSize);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}







// Initialize WebGL context and set up shaders
async function initParticleRendering(gl:WebGL2RenderingContext, particles, sizes) {

    // Compile shaders and create program
    const [program, vertexShader, fragmentShader] = await loadShaders(
        gl,
        dntiDir+"/glsl/particle.vert",
        dntiDir+"/glsl/particle.frag"
    );
    gl.useProgram(program);

    
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create buffers and set up particle attributes
    const particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW,0);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(positionLocation);

    
    // Enable size attribute
    const sizeBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    const sizeLoc = gl.getAttribLocation(program, "a_size");
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(sizeLoc);



    
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Create depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    // Match canvas size (or viewport)
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    // Attach to framebuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // Optionally attach a color target (or use the default framebuffer later)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return [ program, particleBuffer, sizeBuffer, depthBuffer, framebuffer, vao ];
}

// Function to draw particles
function drawParticles(gl:WebGL2RenderingContext, program, particleBuffer, sizeBuffer, camera, light,nParticles, framebuffer, particlesVAO) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // gl.useProgram(program);

    
    gl.bindVertexArray(particlesVAO);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update the camera view and projection matrices
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());

    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);

    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);

    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());

    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);

    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);

    // Draw particles
    gl.drawArrays(gl.POINTS, 0, nParticles );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);

}





// Initialize WebGL context and set up shaders
async function initTraceRendering(gl:WebGL2RenderingContext, trackingArray, sharedDepthBuffer) {

    // Compile shaders and create program
    const [program, vertexShader, fragmentShader] = await loadShaders(
        gl,
        dntiDir+"/glsl/particle.vert",
        dntiDir+"/glsl/particle.frag"
    );
    gl.useProgram(program);

    const vao=gl.createVertexArray();
    gl.bindVertexArray(vao);


    // Create framebuffer for trace rendering
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Attach the shared depth buffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sharedDepthBuffer);

    // (Optionally attach a color buffer if you render to texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Create buffers and set up particle attributes
    const trackingBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trackingBuffer);

    
    // Set up vertex attribute pointers
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // Determine initial capacity (rounded up to next power of two for easier growth)
    const initialCount = trackingArray.length / 3; // assuming vec3 positions
    const initialCapacity = Math.max(128, 1 << Math.ceil(Math.log2(initialCount + 1)));

    gl.bufferData(
        gl.ARRAY_BUFFER,
        initialCount * 3 * Float32Array.BYTES_PER_ELEMENT,
        gl.DYNAMIC_DRAW
    );
    gl.bufferSubData(gl.ARRAY_BUFFER, 1, trackingArray);


    

    return [ program, trackingBuffer, vao, framebuffer ];
}


// Function to draw particles
function drawTrace(gl:WebGL2RenderingContext, program, trackingBuffer, camera, light,nTraces, trackingArray, traceVao, framebuffer, tracking) {
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.clearColor(0.2, 0.2, 0.2, 1.0);
    // gl.enable(gl.DEPTH_TEST);

    gl.bindVertexArray(traceVao);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // now depth test uses the same depth buffer contents
    gl.enable(gl.DEPTH_TEST);
    // gl.drawArrays(gl.LINES, 0, nTraces);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // gl.useProgram(program);

    // Update the camera view and projection matrices
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());

    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);

    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);

    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());

    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);

    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);

    
    if(tracking){
        gl.bindBuffer(gl.ARRAY_BUFFER, trackingBuffer);
        const offsetBytes = (nTraces) * 3 * Float32Array.BYTES_PER_ELEMENT;
        gl.bufferSubData(gl.ARRAY_BUFFER, offsetBytes, 
            new Float32Array([trackingArray[(nTraces-1)*3+0],trackingArray[(nTraces-1)*3+1],trackingArray[(nTraces-1)*3+2]])
        );
    }

    // Draw particles
    gl.drawArrays(gl.LINE_STRIP, 0, nTraces );

    gl.bindVertexArray(null);
}




// Initialize WebGL context and set up shaders
async function initWaterRendering(gl:WebGL2RenderingContext, particles, sizes, particleCount, textureSize) {

    // Compile shaders and create program
    const [program, vertexShader, fragmentShader] = await loadShaders(
        gl,
        dntiDir+"/glsl/water.vert",
        dntiDir+"/glsl/water.frag"
    );
    gl.useProgram(program);


        
    // Fullscreen quad
    const quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1, 1,   1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    gl.useProgram(program);
    const posLoc = 0;
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);


    const positionTexture = createTexture(gl, null, textureSize, textureSize, gl.RGBA,gl.RGBA32F, gl.FLOAT);
    gl.uniform1i(gl.getUniformLocation(program, 'u_positions'), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, particles);

    
    const sizesTexture = createTexture(gl, null, particleCount, 1, gl.RED,gl.R32F, gl.FLOAT);
    gl.uniform1i(gl.getUniformLocation(program, 'u_sizeTexture'), 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RED, gl.FLOAT, sizes);




    return [ program, positionTexture, sizesTexture ];
}

// Function to draw particles
function drawWater(gl:WebGL2RenderingContext, program, positionTexture, sizesTexture, camera, light,nParticles, textureSize, particles, sizes) {
    
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    

    // Upload new data to GPU
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.texSubImage2D(
    gl.TEXTURE_2D,
    0, 0, 0,
    textureSize, textureSize,
    gl.RGBA,
    gl.FLOAT,
    particles
    );

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
    gl.texSubImage2D(
    gl.TEXTURE_2D,
    0, 0, 0,
    nParticles, 1,
    gl.RED,
    gl.FLOAT,
    sizes
    );
    // gl.useProgram(program);

    // Update the camera view and projection matrices
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());

    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);

    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);

    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());

    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);

    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);

    const u_nParticles = gl.getUniformLocation(program, "u_nParticles");
    gl.uniform1i(u_nParticles, nParticles);

    const u_textureSize = gl.getUniformLocation(program, "u_textureSize");
    gl.uniform1i(u_textureSize, textureSize);
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.viewport(canvas.width/4*1.5, canvas.height/4*1.5, canvas.width/4, canvas.height/4);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    gl.finish();

}
