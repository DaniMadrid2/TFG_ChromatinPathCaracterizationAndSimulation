import { Vector, Vector2D, Vector3D, MatrixStack, Matrix2D, Matrix3D, Matrix4D, Quaternion } from "../Matrix/Matrix.mjs";
import {keypress, mousepos, mouseclick} from "../Game/Game.mjs";
import {WebProgram} from "../WebGL/webglMan.mjs";




export class Camera3D{
    public viewMatrix: Matrix4D= Matrix4D.Identity;
    public projectionMatrix: Matrix4D= Matrix4D.Identity;
    public direction: Vector3D= new Vector3D(0,0,-1);
    public UP: Vector3D= new Vector3D(0,1,0);
    /**
     * Optional position for orbital cameras (when this.following=true)
    */
    public followPosition: Vector3D=new Vector3D(0,0,1);
    public following:boolean=false;
    /**
     * Replace this to set the focus object when this.following
    */
    public getFollowPos:()=>Vector3D=()=>Vector3D.Zero;
    protected lastMousePos={x:0,y:0};
    //Movement variables
    public invertX:boolean=false;
    public invertY:boolean=false;
    public invertXwhenFollowing:boolean|undefined=false;
    public invertYwhenFollowing:boolean|undefined=true;
    constructor(public position: Vector3D= new Vector3D(0,0,10),
        public fov = 90,
        public  aspectRatio = 1080 / 720,
        public near = 0.001, public far = 10000,
        public walkspeed=10
    ){

    }
    setPos(pos:Vector3D){
        this.position._=pos;
        return this;
    }
    setFollowPos(pos:Vector3D){
        this.followPosition._=pos;
        return this;
    }


    public calculateMatrices(){
        this.viewMatrix = Matrix4D.createLookAtMatrixFromDirection(this.position, this.direction,this.UP);
    
        this.projectionMatrix = Matrix4D.createProjectionMatrix(this.fov, this.aspectRatio, this.near, this.far);
        
        return this;
    }
    public tick(dt:number, keypress:any, mousepos:any, mouseclick:any){
        //* Calculate mouse displacement
        let dmousex=mousepos.x-this.lastMousePos.x;
        let dmousey=mousepos.y-this.lastMousePos.y;


        let dmov=6.5;
        let noMouse=false; //noMouse = move with Arrows
        
        if(this.right(keypress)) (noMouse=true,dmousex=dmov);
        if(this.left(keypress)) (noMouse=true,dmousex=-dmov);
        if(this.up(keypress)) (noMouse=true,dmousey=-dmov);
        if(this.down(keypress)) (noMouse=true,dmousey=dmov);
        if(this.r(keypress)) noMouse=true;
        
        dmousex*=this.fov/60;
        dmousey*=this.fov/60;
        if(!this.keys.rotMouse){
            dmousex=0;
            dmousey=0;
        }

        // angle+=dmousex*0.001*Math.PI/2;
        
        if((mouseclick[0]||noMouse)&&Math.abs(dmousex)<100&&Math.abs(dmousey)<100){
            
            let invertY=!!this.invertX?-1:1;
            let invertX=!!this.invertY?-1:1;
            if(this.following){
                if(this.invertXwhenFollowing!==undefined)
                    invertX=!!this.invertXwhenFollowing?-1:1;
                if(this.invertYwhenFollowing!==undefined)
                    invertY=!!this.invertYwhenFollowing?-1:1;
            } 

            this.direction=Quaternion.rotateVector(this.direction,this.UP,-dmousex/1000*Math.PI*1.2*invertX);
            this.direction=Quaternion.rotateVector(this.direction,this.UP.cross(this.direction),dmousey/1000*Math.PI*1.2*invertY);
            // this.UP=Quaternion.rotateVector(this.UP,this.UP,-dmousex/1000*Math.PI*1.2);
            this.UP=Quaternion.rotateVector(this.UP,this.UP.cross(this.direction),dmousey/1000*Math.PI*1.2*invertY);

            if(this.r(keypress)){
                let rotdir=Math.PI*0.7*(this.shift(keypress)?-1:1)/100;
                this.UP=Quaternion.rotateVector(this.UP,this.direction,rotdir);
            }

            if(this.following){
                this.followPosition=Quaternion.rotateVector(this.followPosition as any,this.UP,-dmousex/1000*Math.PI*1.2*invertX) as any;
                this.followPosition=Quaternion.rotateVector(this.followPosition as any,this.UP.cross(this.direction),dmousey/1000*Math.PI*1.2*invertY) as any;
            }
        }

        if(this.following){
            let centerVector=this.getFollowPos();
            this.followPosition=this.followPosition
            .add(this.direction.cross(this.UP).scalar(this.Hor(keypress)*this.walkspeed*dt))//x
            .add(this.UP.scalar(this.Depth(keypress)*this.walkspeed*dt))//y
            .add(this.direction.scalar(-this.Ver(keypress)*this.walkspeed*dt)) as any;//z
            this.position=centerVector.add(this.followPosition) as any;
        }else{
            this.position=this.position
            .add(this.direction.cross(this.UP).scalar(this.Hor(keypress)*this.walkspeed*dt))//x
            .add(this.UP.scalar(this.Depth(keypress)*this.walkspeed*dt))//y
            .add(this.direction.scalar(-this.Ver(keypress)*this.walkspeed*dt)) as any;//z
        }
        
        this.lastMousePos={...mousepos};
    }

    public keys={
        "a":"a",
        "w":"w",
        "s":"s",
        "d":"d",
        "q":"q",
        "e":"e",
        "left":"left",
        "right":"right",
        "up":"up",
        "down":"down",
        "shift":"shift",
        "r":"r",
        rotMouse:true,
    }

    public Hor(keypress){
        return keypress[this.keys["a"]]?-1:keypress[this.keys["d"]]?1:0;
    }
    public Ver(keypress){
        return keypress[this.keys["w"]]?-1:keypress[this.keys["s"]]?1:0;
    }
    public Depth(keypress){
        return keypress[this.keys["q"]]?-1:keypress[this.keys["e"]]?1:0;
    }
    public right(keypress){
        return keypress[this.keys["right"]];
    }
    public left(keypress){
        return keypress[this.keys["left"]];
    }
    public down(keypress){
        return keypress[this.keys["down"]];
    }
    public up(keypress){
        return keypress[this.keys["up"]];
    }
    public shift(keypress){
        return keypress[this.keys["shift"]];
    }
    public r(keypress){
        return keypress[this.keys["r"]];
    }

    public setMoveControlsAt(key:"s"|"g"|"k"|"unbind"="unbind"){
        if(key=="s"){
            this.keys["a"]="a";
            this.keys["w"]="w";
            this.keys["s"]="s";
            this.keys["d"]="d";
            this.keys["r"]="r";
            this.keys["q"]="q";
            this.keys["e"]="e";
        }
        if(key=="g"){
            this.keys["a"]="f";
            this.keys["w"]="t";
            this.keys["s"]="g";
            this.keys["d"]="h";
            this.keys["r"]="u";
            this.keys["q"]="r";
            this.keys["e"]="y";
        }
        if(key=="k"){
            this.keys["a"]="j";
            this.keys["w"]="i";
            this.keys["s"]="k";
            this.keys["d"]="l";
            this.keys["r"]="p";
            this.keys["q"]="u";
            this.keys["e"]="o";
        }
        if(key=="unbind"){
            this.keys["a"]="none";
            this.keys["w"]="none";
            this.keys["s"]="none";
            this.keys["d"]="none";
            this.keys["r"]="none";
            this.keys["q"]="none";
            this.keys["e"]="none";
        }
        return this;
    }
    public bindRKey(key="none"){
        this.keys["r"]=key;
        return this;
    }
    
    public setCamControlsAt(key:"down"|"g"|"k"|"unbind"="unbind"){
        if(key=="down"){
            this.keys["right"]="right";
            this.keys["left"]="left";
            this.keys["down"]="down";
            this.keys["up"]="up";
        }
        if(key=="g"){
            this.keys["right"]="f";
            this.keys["left"]="t";
            this.keys["down"]="g";
            this.keys["up"]="h";
        }
        if(key=="k"){
            this.keys["right"]="j";
            this.keys["left"]="i";
            this.keys["down"]="k";
            this.keys["up"]="l";
        }
        if(key=="unbind"){
            this.keys["right"]="none";
            this.keys["left"]="none";
            this.keys["down"]="none";
            this.keys["up"]="none";
        }
        return this;
    }
    public setMouseControls(key:"mouse"|"unbind"="unbind"){
        if(key=="mouse"){
            this.keys.rotMouse=true;
        }
        if(key=="unbind"){
            this.keys.rotMouse=false;
        }
    }

    public setUniforms(u_viewMatrix:UMAT4, u_projectionMatrix:UMAT4, u_cameraPosition: UVEC){
        u_viewMatrix?.set?.(this.viewMatrix);
        u_projectionMatrix?.set?.(this.projectionMatrix);
        u_cameraPosition?.set?.(this.position);
    }
    public uniforms:[UMAT4, UMAT4, UVEC][]=[];
    public setUniformsProgram(program: WebProgram | any){
        if(!this.uniforms[program.ID]){
            this.uniforms[program.ID]=[program.uMat4("u_viewMatrix"), program.uMat4("u_projectionMatrix"), program.uVec("cameraPos",3)];
        }
        this.setUniforms(...this.uniforms[program.ID]);
    }
}


export class SunLight{
    /**
     * Index of the SunLight (for multiple lights handling)
     */
    public lightIndex=0;
    constructor(
        public color: Vector3D= new Vector3D(0.0, 1.0, 1.0),
        public direction: Vector3D= new Vector3D(1, -1, -1),
        lightNumber=0
    ){
        this.lightIndex=lightNumber;
    }
}

export class AmbienLight{
    constructor(
        public color: Vector3D= new Vector3D(0.0, 1.0, 1.0)
    ){
    }
}

export class LightManager{
    public sunLigths:SunLight[]=[];
    public ambientLight:AmbienLight=new AmbienLight(Vector3D.Zero.clone());

    public programs:WebProgram[]=[];
    public uniforms:{
        sunLights:[UVEC, UVEC][], //color & direction
        ambientLight:UVEC, //color
    }[]=[]; //Each program has its own uniforms, each are from each different light type

    public cSunLight(color:Vector3D, direction:Vector3D){
        let light=new SunLight(color, direction, this.sunLigths.length+1);
        this.sunLigths.push(light);
        return light;
    }
    public cAmbientLight(color:Vector3D){
        this.ambientLight=new AmbienLight(color);
        return this.ambientLight;
    }
    createUniforms(program?: WebProgram, check=0){
        if(!program&&!this.programs.length) return this;
        if(!program){ //if didnt set a program DO ALL
            if(!check)
                for (let i = 0; i < this.programs.length; i++) {
                    this.createUniforms(this.programs[i], 1); //check boolean is to make sure we dont infine loop
                }
            return this;
        }
        let index=this.programs.indexOf(program);
        if(index<0){
            index=this.programs.length;
            this.programs.push(program);
        }
        if(!this.uniforms[index]) this.uniforms[index]={sunLights:[],
            ambientLight:program.uVec("ambientColor", 3)
        };

        for (let i = 0; i < this.sunLigths.length; i++) {
            this.uniforms[index].sunLights[i]=[program.uVec("lightColor"+(i+1),3),program.uVec("lightDir"+(i+1),3)] //light{Prop=Dir|Color}[1..]
        }
        return this;
    }
    updateValues(program?: WebProgram|number, check=0){
        let index=typeof program=="number"?program:this.programs.indexOf(program as any);
        if(index < 0 && !check){//if didnt set a program DO ALL
            for (let i = 0; i < this.programs.length; i++) {
                this.updateValues(this.programs[i], 1); //check boolean is to make sure we dont infine loop
            }
            return this;
        }

        this.uniforms[index].ambientLight.set(this.ambientLight.color);
        for (let i = 0; i < this.sunLigths.length; i++) {
            this.uniforms[index].sunLights[i][0].set(this.sunLigths[i].color);
            this.uniforms[index].sunLights[i][1].set(this.sunLigths[i].direction);
        }
        return this;
    }

    addProgram(program:WebProgram){
        let index=this.programs.indexOf(program as any);
        if(index<0)
            this.programs.push(program);
    }
}

type UNUM=(WebGLUniformLocation&{set:(num:number)=>UNUM});
type UVEC=(WebGLUniformLocation&{set:(vec:Vector|number[], offset?, len?)=>UVEC});
type UMAT2=(WebGLUniformLocation&{set:(mat:Matrix2D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT2});
type UMAT3=(WebGLUniformLocation&{set:(mat:Matrix3D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT3});
type UMAT4=(WebGLUniformLocation&{set:(mat:Matrix4D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT4});

