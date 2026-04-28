import { Matrix2D, Matrix3D, Matrix4D, Vector, Vector2D } from "../Matrix/Matrix.js";
import {loadShaders} 
    from "../opengl/opengl.js"
import { HSLtoRGB } from "../Utils/utils.js";

/**
 * For now just a holder and Fabricator for WebPrograms
 */
export class WebGLMan{
    public static stWebGLMan=new WebGLMan();
    public programs=[] as WebProgram[];
    constructor(public gl:WebGL2RenderingContext=WebGLMan?.gl, public dirPath?:string){
        if(!this.dirPath){
            this.dirPath="/glsl";
            let stdir=(window as any).dntiDir||(window as any).blogDirName;
            if(!!(window as any)&&!!stdir){
                this.dirPath=stdir+this.dirPath;
            }
            console.log("webgl main path:",this.dirPath)
        }
        if(WebGLMan.stWebGLMan)
            WebGLMan.stWebGLMan.gl||=gl;
    }
    static setGL(gl:WebGL2RenderingContext, path=WebGLMan.stWebGLMan.dirPath){
        WebGLMan.stWebGLMan.dirPath=path;
        WebGLMan.stWebGLMan.gl||=gl;
        return this;
    }
    static get gl(){
        return WebGLMan?.stWebGLMan?.gl;
    }
    static get programs(){
        return this.stWebGLMan.programs;
    }
    static get dirPath(){
        return this.stWebGLMan.dirPath!;
    }
    
    static set gl(gl:WebGL2RenderingContext){
        this.stWebGLMan.gl=gl;
    }
    static set programs(programs:WebProgram[]){
        this.stWebGLMan.programs=programs!;
    }
    static set dirPath(dirPath:string){
        this.stWebGLMan.dirPath=dirPath;
    }
    static program(ID=WebGLMan.stWebGLMan.programs.length, vertPath:string="", fragPath:string=""){
        return WebGLMan.stWebGLMan.program(ID,vertPath, fragPath);
    }
    public program(ID=this.programs.length, vertPath:string="", fragPath:string=""):WebProgram{
        if(ID<0) ID=this.programs.length;
        if(!!vertPath.trim()&&!fragPath.trim()){
            fragPath=vertPath+".frag";
            vertPath=vertPath+".vert";
        }
        let p=new WebProgram(this.gl, this.dirPath+"/"+vertPath, this.dirPath+"/"+fragPath);
        this.programs[ID]=p;
        p.ID=ID;
        return p;
    }
    static includeExternalProgram(p:WebProgram){
        let ID=p.ID??-1;
        if(ID<0||this.programs[ID]!=p) ID=WebGLMan.stWebGLMan.programs.length;
        WebGLMan.programs[ID]=p;
        p.ID=ID;
        return p;
    }
    static getProgramByID(ID:number):WebProgram{
        return WebGLMan.stWebGLMan.programs[ID];
    }
    public getProgramByID(ID:number):WebProgram{
        return this.programs[ID];
    }
}

export type UNUM=(WebGLUniformLocation&{set:(num:number)=>UNUM});
export type UVEC=(WebGLUniformLocation&{set:(vec:Vector|number[], offset?, len?)=>UVEC});
export type UMAT2=(WebGLUniformLocation&{set:(mat:Matrix2D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT2});
export type UMAT3=(WebGLUniformLocation&{set:(mat:Matrix3D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT3});
export type UMAT4=(WebGLUniformLocation&{set:(mat:Matrix4D|number[]|Float32Array, transpose?:boolean, offset?, len?)=>UMAT4});
export class WebProgram{
    public program:WebGLProgram;
    /** set when created from WebGLMan */
    public ID:number; 
    public vert:WebGLShader; public frag:WebGLShader;
    public nUsedTextures=0;
    public standardTEXW=1080;
    public standardTEXH=720;
    public viewportW=1080;
    public viewportH=720;
    public uniforms=new Map<string,UVEC|UMAT2|UMAT3|UMAT4|UNUM>();
    public textures:BindableTexture[]=[];
    constructor(public gl:WebGL2RenderingContext, public vertPath:string="", public fragPath:string=""){

    }
    /**
     * Creates the program but it ___doesnt use the program___
     */
    async loadProgram(vp=this.vertPath,fp=this.fragPath, vertexFilter=(a:string)=>a, fragmentFilter=(a)=>a){
        [this.program, this.vert, this.frag] = await loadShaders(
            this.gl, vp, fp, vertexFilter, fragmentFilter
        );
        return this;
    }
    public use(){
        this.gl.useProgram(this.program);
        return this;
    }
    public isWebProgram(){
        return true;
    }
    /**
     * Basically calls WebGLMan:includeExternalProgram to be set a program ID
     * Needed for simplifying code with Camer3D for example
     */
    public includeInWebManList(){
        WebGLMan.includeExternalProgram(this);
        return this;
    }
    //?<<---- Program specific control variables ---->>//
    //* Contains all the vertex dependent buffers (enabled/disabled, size/type/normalized/stride/offset, divisor for instancing)
    //* Basically a geoset
    //* It's handy for passing geometry around between functions or methods without having to create your own structs or objects
    //* An object that stores vertex array bindings (attributes)
    /**
     * Each VAO remembers:
     * 
     * which vertex attributes exist (and whether each is enabled),
     * 
     * the buffer bound for each attribute,
     * 
     * the data format (size, type, stride, offset),
     * 
     * and (optionally) the bound index buffer (EBO).
     * 
     * So a VAO = a complete recipe for __“how to feed this mesh’s vertices into this program.”__
     */
    public VAOs:VAO[]=[];
    public currentVAO=-1;
    get VAO(){
        return this.VAOs[this.currentVAO];
    }
    createVAO(){
        let vao=new VAO(this.gl, this.program);
        this.VAOs.push(vao);
        if(this.currentVAO<0) this.currentVAO=0;
        return vao;
    }
    bindVAO(number=this.currentVAO){
        this.currentVAO=number;
        this.VAO.bind();
        return this;
    }
    unbindVAO(){
        // this.currentVAO=-1;
        this.gl.bindVertexArray(null);
        return this;
    }
    
    static Textures:BindableTexture[]=[];
    /**
     * Creates and/or binds a texture2d creating a new textureUnit and activating it.
     * @param {string} [name] __u_texture__
     * @param {([number,number]|number[])} [size=[this.standardTEXW,this.standardTEXH]] [W,H]
     * @param {([number,number]|number[])} [formats=WebGL2RenderingContext.RGBA,WebGL2RenderingContextRGBA32F] [format & internalformat] 
     * @param {([number|string,number|string]|(number|string)[])} [FILTER_WRAP] arguments can be NEAREST, LINEAR or CLAMP, REPEAT or MIRROR
     * [min, mag, Wrap_S, Wrap_T] = Shrinking, Enlarging, Clamp X, Clamp Y
     * 
     * Take into account *gl.RGBA32F, gl.R32F, gl.RGBA16F* **won't** accept **LINEAR LOD FILTERING**
     * 
     * << __TextureMagFilter__ >>
     * NEAREST                        = 0x2600;
     * LINEAR                         = 0x2601;
     * 
     * << __TextureMinFilter__ >>
     *      NEAREST
     *      LINEAR
     * NEAREST_MIPMAP_NEAREST         = 0x2700;
     * LINEAR_MIPMAP_NEAREST          = 0x2701;
     * NEAREST_MIPMAP_LINEAR          = 0x2702;
     * LINEAR_MIPMAP_LINEAR           = 0x2703;
     * 
     * << __TextureParameterName__ >>
     * TEXTURE_MAG_FILTER             = 0x2800;
     * TEXTURE_MIN_FILTER             = 0x2801;
     * TEXTURE_WRAP_S                 = 0x2802;
     * TEXTURE_WRAP_T                 = 0x2803;
     * 
     * << __TextureTarget__ >>
     * TEXTURE_2D                     = 0x0DE1;
     * TEXTURE                        = 0x1702;
     * 
     * TEXTURE_CUBE_MAP               = 0x8513;
     * TEXTURE_BINDING_CUBE_MAP       = 0x8514;
     * TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
     * TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
     * TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
     * TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
     * TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
     * TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
     * MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;
     * 
     * << __TextureWrapMode__ >>
     * 
     * REPEAT                         = 0x2901;
     * CLAMP_TO_EDGE                  = 0x812F;
     * MIRRORED_REPEAT                = 0x8370;
     * 
     * @returns [texture, nTexture, fill:(arr,x=0,y=0,w=size[0],h=size[1],LOD=LODlevel)=>{<<binds and fills the texture>>}]
     * @memberof VAO
     */
    createTexture2D(name?:string, size:[number,number]|number[]=[this.standardTEXW,this.standardTEXH],
        format:[number,number]|number[]|TexExamples=TexExamples.RGBAFloat,
        data=null,
        FILTER_WRAP:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number]=["NEAREST","NEAREST","CLAMP","CLAMP"],
        texUnit?:TextureUnitType, LODlevel=0
    ):BindableTexture{
        let tex=this.gl.createTexture();
        texUnit=parseTexUnitType(texUnit);
        let nTexture=texUnit||this.nUsedTextures; //up to 31 textures

        if((FILTER_WRAP[0]=="LINEAR"||FILTER_WRAP[1]=="LINEAR")&&
            (format[2]==this.gl.FLOAT))
            console.error("%cTexture error: Float textures dont accept LINEAR LOD FILTERING","color:red;font-weight:bold;");

        this.gl.activeTexture(this.gl.TEXTURE0+nTexture); //use this texture unit
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        FILTER_WRAP=FILTER_WRAP.map(a=>{
            if(a=="NEAREST") return WebGL2RenderingContext.NEAREST;
            if(a=="LINEAR") return WebGL2RenderingContext.LINEAR;
            if(a=="CLAMP") return WebGL2RenderingContext.CLAMP_TO_EDGE;
            if(a=="REPEAT") return WebGL2RenderingContext.REPEAT;
            if(a=="MIRROR") return WebGL2RenderingContext.MIRRORED_REPEAT;
            return a;
        }) as any;
        // Set up texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, (FILTER_WRAP as any)[0]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, (FILTER_WRAP as any)[1]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, (FILTER_WRAP as any)[2]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, (FILTER_WRAP as any)[3]);
        // Initialize texture with data
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,      // Target
            LODlevel,                  // Level
            format[1]||this.gl.RGBA32F,         // Internal format
            size[0],              // Width
            size[1],             // Height
            0,                  // Border
            format[0]||this.gl.RGBA,            // Format
            format[2]||this.gl.FLOAT,           // Type
            data||null          // Data
        );

        if(!!name&&!!name.trim()){
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        this.nUsedTextures++;

        (tex as any).fill=(arr,x=0,y=0,w=size[0],h=size[1],LOD=LODlevel)=>{
            if((tex as any).unit!==undefined)
                this.gl.activeTexture(this.gl.TEXTURE0+(tex as any).unit);
            this.gl.bindTexture(this.gl.TEXTURE_2D,tex);
            this.gl.texSubImage2D(this.gl.TEXTURE_2D, LOD, x, y, w, h,format[0], format[2], arr);
            // this.gl.bindTexture(this.gl.TEXTURE_2D,null);
            return tex;
        };
        
        //Removed because this doesnt actually read the texture, only the screen
        // (tex as any).read=(arr?,x=0,y=0,w=size[0],h=size[1],dimension=4)=>{
        //     if(!arr) arr=new Float32Array(w*h*dimension);
        //     if((tex as any).unit!==undefined){
        //         this.gl.activeTexture(this.gl.TEXTURE0+(tex as any).unit);
        //     }
        //     this.gl.bindTexture(this.gl.TEXTURE_2D,tex);
        //     this.gl.readPixels(x, y, w, h, format[0], format[2], arr);
        //     this.gl.bindTexture(this.gl.TEXTURE_2D,null);
        //     return arr;
        // };
        
    
        (tex as any).unit=nTexture;
        (tex as any).bind=(textureUnit=(tex as any).unit)=>{
            textureUnit=parseTexUnitType(textureUnit);
            if(textureUnit!=-1){
                this.gl.activeTexture(this.gl.TEXTURE0+textureUnit)
            }
            (tex as any).unit=textureUnit;
            this.gl.bindTexture(this.gl.TEXTURE_2D,tex);
            return tex;
        };
        (tex as any).unbind=(textureUnit=(tex as any).unit)=>{ //This completely disables the texture from being used
            textureUnit=parseTexUnitType(textureUnit);
            if(textureUnit!=-1){
                this.gl.activeTexture(this.gl.TEXTURE0+textureUnit)
            }
            this.gl.bindTexture(this.gl.TEXTURE_2D,null);
            return tex;
        };
        (tex as any).w=size[0];
        (tex as any).h=size[1];
        (tex as any).xoff=0;
        (tex as any).yoff=0;
        (tex as any).format=format

        WebProgram.Textures[parseTexUnitType((tex as any).unit)]=tex as any;
        this.textures[parseTexUnitType((tex as any).unit)]=tex as any;


        return tex as any;
    }
    /**
     * Creates and/or binds a texture2d creating a new textureUnit and activating it.
     * @param {string} [name] __u_texture__
     * @param {([number,number]|number[])} [size=[this.standardTEXW,this.standardTEXH]] [W,H]
     * @param {([number,number]|number[])} [formats=WebGL2RenderingContext.RGBA,WebGL2RenderingContextRGBA32F] [format & internalformat] 
     * @param {([number|string,number|string]|(number|string)[])} [FILTER_WRAP] arguments can be NEAREST, LINEAR or CLAMP, REPEAT or MIRROR
     * [min, mag, Wrap_S, Wrap_T] = Shrinking, Enlarging, Clamp X, Clamp Y
     * 
     * Take into account *gl.RGBA32F, gl.R32F, gl.RGBA16F* **won't** accept **LINEAR LOD FILTERING**
     * 
     * << __TextureMagFilter__ >>
     * NEAREST                        = 0x2600;
     * LINEAR                         = 0x2601;
     * 
     * << __TextureMinFilter__ >>
     *      NEAREST
     *      LINEAR
     * NEAREST_MIPMAP_NEAREST         = 0x2700;
     * LINEAR_MIPMAP_NEAREST          = 0x2701;
     * NEAREST_MIPMAP_LINEAR          = 0x2702;
     * LINEAR_MIPMAP_LINEAR           = 0x2703;
     * 
     * << __TextureParameterName__ >>
     * TEXTURE_MAG_FILTER             = 0x2800;
     * TEXTURE_MIN_FILTER             = 0x2801;
     * TEXTURE_WRAP_S                 = 0x2802;
     * TEXTURE_WRAP_T                 = 0x2803;
     * 
     * << __TextureTarget__ >>
     * TEXTURE_2D                     = 0x0DE1;
     * TEXTURE                        = 0x1702;
     * 
     * TEXTURE_CUBE_MAP               = 0x8513;
     * TEXTURE_BINDING_CUBE_MAP       = 0x8514;
     * TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
     * TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
     * TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
     * TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
     * TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
     * TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
     * MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;
     * 
     * << __TextureWrapMode__ >>
     * 
     * REPEAT                         = 0x2901;
     * CLAMP_TO_EDGE                  = 0x812F;
     * MIRRORED_REPEAT                = 0x8370;
     * 
     * @returns [texture, nTexture, fill:(arr,x=0,y=0,w=size[0],h=size[1],LOD=LODlevel)=>{<<binds and fills the texture>>}]
     * @memberof VAO
     */
    texture2D(params:{
        name?:string, size?:[number,number]|number[],
        format?:[number,number]|number[]|TexExamples,
        data?,
        FILTER_WRAP?:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number],
        texUnit?:TextureUnitType, LODlevel?
    }={
        size:[this.standardTEXW,this.standardTEXH],
        format:TexExamples.RGBAFloat,
        data:null,
        FILTER_WRAP:["NEAREST","NEAREST","CLAMP","CLAMP"],
        LODlevel:0
    }){
        return this.createTexture2D(params.name, params.size, params.format, params.data, 
            params.FILTER_WRAP, params.texUnit, params.LODlevel
        )
    }
    loadLongArray2GPUTextures(array:Float32Array, basename:string, startTextureUnit:TextureUnitType, 
        format:[number,number]|number[]|TexExamples=TexExamples.RFloat, 
        FILTER_WRAP?:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number]){
        startTextureUnit=parseTexUnitType(startTextureUnit);
        let arrLength=array.length;
        let maxLength=this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        let lastTexureUnit=Math.floor(arrLength/maxLength)+startTextureUnit;
        let remainder=arrLength%maxLength;
        if(lastTexureUnit>31){
            console.error("loadLongArray2GPUTextures couldnt load into textureUnits, array too big"+
                " ( last textureUnit used"+lastTexureUnit+", max is 31 ), using 31 maximum");
            lastTexureUnit=31;
        }
        for (let i = startTextureUnit; i <= lastTexureUnit; i++) {
            let diffi=i-startTextureUnit;
            // console.log("size",i==lastTexureUnit?remainder:maxLength)
            // console.log("binding",basename+(!diffi?"":diffi),"to texUnit"+i)
            this.texture2D({
                name:basename+(!diffi?"":diffi),
                texUnit:i,
                data:array.subarray(diffi*maxLength,(diffi+1)*maxLength),
                size:[i==lastTexureUnit?remainder:maxLength,1],
                format, FILTER_WRAP
            });
        }
        let returnObj={startTextureUnit, lastTexureUnit, maxLength,
            nextTexureUnit:lastTexureUnit+1,
            setLengthUniforms:()=>{
                this.uInt(basename+"Length").set(maxLength);
                // this.uInt(basename+"Count").set(lastTexureUnit-startTextureUnit);
                return returnObj;
            }
        }
        return returnObj;
    }
    /**
     * This uses {@link createTexture2D} to create the texture, thus binding a new textureUnit with activateTexture
     */
    texture2DFromImage(img:HTMLImageElement, name:string, 
        format:[number,number]|number[]|TexExamples=TexExamples.RGBAFloat,
        FILTER_WRAP:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number]=["NEAREST","NEAREST","CLAMP","CLAMP"],
        texUnit?:TextureUnitType, LODlevel=0){
        return this.createTexture2D(name, [img.width,img.height], format, img, 
            FILTER_WRAP, texUnit, LODlevel)
    }
    bindTextureUnit2Uniform(texUnit:number=this.nUsedTextures, name:string){
        if(texUnit==this.nUsedTextures){
            this.nUsedTextures++;
        }
        if(!!name&&!!name.trim()){
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), texUnit);
        }
        return this;
    }
    getTextureFromUnit(texUnit:TextureUnitType|number){
        // 1. Choose and activate the texture unit
        this.gl.activeTexture(this.gl.TEXTURE0 + parseTexUnitType(texUnit));

        const texture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D)
        ||this.gl.getParameter(this.gl.TEXTURE_BINDING_2D_ARRAY)
        ||this.gl.getParameter(this.gl.TEXTURE_BINDING_3D); // Get currently bound tex
        
        return texture as any;
    }
    /**
     * Bind TextureUnit to uniform. Same as {@link bindTextureUnit2Uniform}
     */
    uTexUnit(texUnit:number=this.nUsedTextures, name:string){
        this.bindTextureUnit2Uniform(texUnit,name);
        return this;
    }
    /**
     * You dont need to use this if you created the texture with {@link createTexture2D} or {@link texture2DFromImage},
     * instead use this when you already have created the texture for example in another program and didnt bind it here.
     * 
     * This will increase the inner texture unit number (there are 32 possible textures in webgl2)
     */
    bindNewTexture(tex:WebGLTexture, name:string){
        let nTexture=this.nUsedTextures; //up to 31 textures
        this.nUsedTextures++;
        // Activate texture unit 0
        this.gl.activeTexture(this.gl.TEXTURE0+nTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        if(!!name&&!!name.trim()){
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        WebProgram.Textures[parseTexUnitType(nTexture)??(tex as any).unit as number]=tex as any;
        this.textures[parseTexUnitType(nTexture)??(tex as any).unit as number]=tex as any;
        return nTexture;
    }
    bindTexture(tex:WebGLTexture, name:string, nTexture:TextureUnitType=0){
        nTexture=parseTexUnitType(nTexture)??(tex as any).unit as number;
        // Activate texture unit
        this.gl.activeTexture(this.gl.TEXTURE0+nTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        if(!!name&&!!name.trim()){
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        WebProgram.Textures[parseTexUnitType(nTexture)??(tex as any).unit as number]=tex as any;
        this.textures[parseTexUnitType(nTexture)??(tex as any).unit as number]=tex as any;
        return nTexture;
    }
    getTextureByUnit(texUnit:TextureUnitType|number){
        const n = parseTexUnitType(texUnit as any);
        return this.textures[n] || WebProgram.Textures[n];
    }
    bindTexName2TexUnit(name: string, nTexture:TextureUnitType=0){
        nTexture=parseTexUnitType(nTexture);
        if(!!name&&!!name.trim()){
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        return this;
    }
    createTexture2DArray(
        name?: string,
        size: [number, number, number]|number[] = [this.standardTEXW, this.standardTEXH, 1],
        format:[number,number]|number[]|TexExamples=TexExamples.RGBAFloat,
        data=null,
        FILTER_WRAP:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number]=["NEAREST","NEAREST","CLAMP","CLAMP"],
        texUnit?: TextureUnitType,
        MIPlevel = 0
    ): BindableTexture3D {
        const gl = this.gl;
        const tex = gl.createTexture();
        texUnit = parseTexUnitType(texUnit);
        const nTexture = texUnit ?? this.nUsedTextures;

        // Sanity check for float filtering
        if ((FILTER_WRAP[0] === "LINEAR" || FILTER_WRAP[1] === "LINEAR") && format[2] === gl.FLOAT)
            console.error("%cTexture error: Float textures don’t accept LINEAR filtering","color:red;font-weight:bold;");

        gl.activeTexture(gl.TEXTURE0 + nTexture);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);

        // Convert filter/wrap enums
        FILTER_WRAP = FILTER_WRAP.map(a => {
            if (a === "NEAREST") return gl.NEAREST;
            if (a === "LINEAR") return gl.LINEAR;
            if (a === "CLAMP") return gl.CLAMP_TO_EDGE;
            if (a === "REPEAT") return gl.REPEAT;
            if (a === "MIRROR") return gl.MIRRORED_REPEAT;
            return a;
        }) as any;

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0] as number);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1] as number);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, FILTER_WRAP[2] as number);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, FILTER_WRAP[3] as number);

        if(!size[2]||size[2]<=0){
            if(!!data&&data.length){
                size[2]=~~(data.length/size[1]/size[0])
            }else{
                size[2]=1;
            }
        }
        // console.log(name,...size)

        // Allocate storage
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,
            MIPlevel,
            format[1], // internalFormat (e.g. gl.RGBA32F)
            size[0],   // width
            size[1],   // height
            size[2],   // layers
            0,
            format[0], // format (e.g. gl.RGBA)
            format[2], // type (e.g. gl.FLOAT)
            data       // optional data
        );

        // Assign uniform if name provided
        if (name?.trim()) {
            gl.uniform1i(gl.getUniformLocation(this.program, name), nTexture);
        }

        this.nUsedTextures++;

        // Add helper methods
        (tex as any).fill = (arr, x = 0, y = 0, z = 0, w = size[0], h = size[1], d=size[2], LOD = MIPlevel) => {
            if ((tex as any).unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + (tex as any).unit);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
            gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, LOD, x, y, z, w, h, d, format[0], format[2], arr);
            // gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
            return tex;
        };

        (tex as any).unit = nTexture;
        (tex as any).bind = (textureUnit = (tex as any).unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit !== -1) gl.activeTexture(gl.TEXTURE0 + textureUnit);
            (tex as any).unit = textureUnit;
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
            return tex;
        };
        (tex as any).unbind = (textureUnit = (tex as any).unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit !== -1) gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
            return tex;
        };

        (tex as any).w = size[0];
        (tex as any).h = size[1];
        (tex as any).nLayers = size[2];
        (tex as any).format = format;
        
        (tex as any).setLengthUniforms=()=>{
            this.uInt(name+"Length",true).set((tex as any).w*(tex as any).h);
            return tex as any;
        }

        return tex as any;
    }
    texture2DArray(params: {
        name?: string,
        size?: [number, number, number] | number[], // width, height, layers
        format:[number,number]|number[]|TexExamples,
        data?,
        FILTER_WRAP?:["NEAREST"|"LINEAR"|number,"NEAREST"|"LINEAR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number,"CLAMP"|"REPEAT"|"MIRROR"|number],
        texUnit?: TextureUnitType,
        MIPlevel?: number
    } = {
        size: [this.standardTEXW, this.standardTEXH, 1],
        format: TexExamples.RGBAFloat,
        data: null,
        FILTER_WRAP: ["NEAREST","NEAREST","CLAMP","CLAMP"],
        MIPlevel: 0
    }){
        return this.createTexture2DArray(
            params.name,
            params.size! ?? [this.standardTEXW, this.standardTEXH, undefined],
            params.format ?? TexExamples.RGBAFloat,
            params.data ?? null,
            params.FILTER_WRAP ?? ["NEAREST","NEAREST","CLAMP","CLAMP"],
            params.texUnit,
            params.MIPlevel ?? 0
        );
    }


    uMat4(name:string, hide:boolean=false):UMAT4{
        const uniform = this.gl.getUniformLocation(this.program, name);
        if(!uniform){
            if(!hide)
                console.error("uniform",name,"was undefined"); 
            let undef={set:()=>undef} as any;
            return undef;
        }
        (uniform as any).set=(mat:Matrix4D|number[]|Float32Array, transpose=false, offset?:number, len?:number)=>{
            if(mat instanceof Matrix4D || typeof ((mat as any).toFloat32) == "function"){
                this.gl.uniformMatrix4fv(uniform, transpose, (mat as any).toFloat32(), offset, len);
            }else if(mat instanceof Float32Array){
                this.gl.uniformMatrix4fv(uniform, transpose, mat, offset, len);
            }else{
                this.gl.uniformMatrix4fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name]=uniform as any;
        return uniform as any;
    }
    uMat3(name:string, hide:boolean=false):UMAT3{
        const uniform = this.gl.getUniformLocation(this.program, name);
        if(!uniform){
            if(!hide)
                console.error("uniform",name,"was undefined"); 
            let undef={set:()=>undef} as any;
            return undef;
        }
        (uniform as any).set=(mat:Matrix3D|number[]|Float32Array|Float64Array, transpose=false, offset?, len?)=>{
            if(mat instanceof Matrix3D || typeof ((mat as any).toFloat32) == "function"){
                this.gl.uniformMatrix3fv(uniform, transpose, (mat as any).toFloat32(), offset, len);
            }else if(mat instanceof Float32Array){
                this.gl.uniformMatrix3fv(uniform, transpose, mat, offset, len);
            }else{
                this.gl.uniformMatrix3fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name]=uniform as any;
        return uniform as any;
    }
    uMat2(name:string, hide:boolean=false):UMAT2{
        const uniform = this.gl.getUniformLocation(this.program, name);
        if(!uniform){
            if(!hide)
                console.error("uniform",name,"was undefined"); 
            let undef={set:()=>undef} as any;
            return undef;
        }
        (uniform as any).set=(mat:Matrix2D|number[]|Float32Array, transpose=false, offset?, len?)=>{
            if(mat instanceof Matrix2D || typeof ((mat as any).toFloat32) == "function"){
                this.gl.uniformMatrix2fv(uniform, transpose, (mat as any).toFloat32(), offset, len);
            }else if(mat instanceof Float32Array){
                this.gl.uniformMatrix2fv(uniform, transpose, mat, offset, len);
            }else{
                this.gl.uniformMatrix2fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name]=uniform as any;
        return uniform as any;
    }
    uVec(name:string, dimension=3, isFloat=true, isUnsignedInt=false, hide:boolean=false):UVEC{
        const uniform = this.gl.getUniformLocation(this.program, name);
        if(!uniform){
            if(!hide)
                console.error("uniform",name,"was undefined"); 
            let undef={set:()=>undef} as any;
            return undef;
        }
        let func=this.gl[`uniform${Math.min(~~dimension,4)}${isFloat?"f":(isUnsignedInt?"ui":"i")}v`];
        (uniform as any).set=(vec:Vector|number[], offset?, len?)=>{
            let vcoords;
            let length=0;
            if((vec as any)?.coords){
                vcoords=(vec as any).coords;
            }else{
                vcoords=vec;
            }
            if(vcoords.length!=dimension){
                //Create new default coord array
                let xs=[];
                for (let i = 0; i < dimension; i++) {
                    if(i==3){
                        xs=vcoords[i]||1;
                    }else
                        xs=vcoords[i]||0;
                }
                func.call(this.gl, uniform, xs, offset, len);
                return uniform;
            }
            func.call(this.gl, uniform, vcoords, offset, len);
            return uniform;
        };
        this.uniforms[name]=uniform as any;
        return uniform as any;
    }
    uNum(name:string, isFloat=true, isUnsignedInt=false, hide:boolean=false):UNUM{
        const uniform = this.gl.getUniformLocation(this.program, name);
        if(!uniform){
            if(!hide)
                console.error("uniform",name,"was undefined"); 
            let undef={set:()=>undef} as any;
            return undef;
        }
        let func=this.gl[`uniform1${isFloat?"f":(isUnsignedInt?"ui":"i")}`];
        (uniform as any).set=(num)=>{
           func.call(this.gl, uniform, num);
           return uniform;
        };
        this.uniforms[name]=uniform as any;
        return uniform as any;
    }
    uFloat(name:string,hide:boolean=false):UNUM{
        return this.uNum(name, true, false, hide);
    }
    uInt(name:string,hide:boolean=false):UNUM{
        return this.uNum(name, false, false, hide);
    }
    cFrameBuffer(){
        return new FrameBuffer(this.gl, this);
    }
    unbindFrameBuffer(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    }
    unbindFBO(){
        this.unbindFrameBuffer();
        return this;
    }

    public setViewport(xoff=0,yoff=0, w=this.viewportW,h=this.viewportH){
        this.viewportW=w;this.viewportH=h;
        this.gl.viewport(xoff,yoff,w,h);
        return this;
    }
    /**
     * gl.clear
     * Same as {@link clear} 
     */
    public clearBuffer(type:"COLOR"|"DEPTH"|"STENCIL"){
        this.gl.clear(this.gl[type+"_BUFFER_BIT"]);
        return this;
    }
    public clear(type:"COLOR"|"DEPTH"|"STENCIL"){
        this.clearBuffer(type);
        return this;
    }
    /**
     * gl.clear
     * Same as {@link clear} 
     */
    public clearMask(type:"COLOR"|"DEPTH"|"STENCIL"){
        this.clearBuffer(type);
        return this;
    }
    public clearColor(color:string|number[]=[0.2, 0.2, 0.2, 1.0]){
        if(typeof color == "string"){
            let [r,g,b,a]=[0,0,0,1];
            if(color.startsWith("hsl")){
                color=HSLtoRGB(...((color as any).replaceAll(/hsl\(?/gm,"").replaceAll(")","")
                        .split(",").map(a=>parseFloat(a)) as [number,number,number])
                    );
            }
            if(color.startsWith("rgba")){
                [r,g,b,a]=(color as any).replaceAll(/rgba\(?/gm,"").replaceAll(")","")
                        .split(",").map(a=>parseFloat(a)) as [number,number,number,number];
            }else if(color.startsWith("rgb")){
                [r,g,b]=(color as any).replaceAll(/rgba?\(?/gm,"").replaceAll(")","")
                        .split(",").map(a=>parseFloat(a)) as [number,number,number];
            }
            if(r>1||g>1||b>1||a>1){
                r/=255;
                g/=255;
                b/=255;
                a/=255;
            }
            this.gl.clearColor(r||0,g||0,b||0,a||0);
        }else{
            this.gl.clearColor(color[0]||0,color[1]||0,color[2]||0,color[3]||0);
        }
        return this;
    }
    public clearDepth(depthValue=1){
        this.gl.clearDepth(depthValue);
        return this;
    }
    public clearStencil(stencilValue=1){
        this.gl.clearStencil(stencilValue);
        return this;
    }
    //gl.getParameter(gl.MAX_COLOR_ATTACHMENTS);
    public isDepthTest:boolean=true;
    public depthFunction:"NEVER"|"LESS"|"EQUAL"|"LEQUAL"|"GREATER"|"NOTEQUAL"|"GEQUAL"|"ALWAYS"="LESS";
    protected initDepthBefDraw(){
        if(this.isDepthTest)
            this.gl.enable(this.gl.DEPTH_TEST);
        else
            this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl[this.depthFunction]);
    }
    /**
     * Draw directly from my vertex buffer in order
     */
    drawArrays(mode:GLMode, vaoOff=0,vertexCount?, instanceCount=1){
        if(vertexCount==undefined) vertexCount=this.VAO?.vaoLength||0;

        this.initDepthBefDraw();
        if(instanceCount<=1)
            this.gl.drawArrays(this.gl[mode],vaoOff,vertexCount);
        else
            this.gl.drawArraysInstanced(this.gl[mode],vaoOff,vertexCount, instanceCount);
        return this;
    }
    /**
     * Draw using an index list (EBO) that tells which vertices to use
     * 
     * .
     * 
     * If __mode__ is not one of the accepted values, a __gl.INVALID_ENUM__ error is thrown.
     * 
     * If __offset__ is not a valid multiple of the size of the given type, a __gl.INVALID_OPERATION__ error is thrown.
     * 
     * If __count__ is negative, a __gl.INVALID_VALUE__ error is thrown.

     */
    drawElements(mode:GLMode,elementCount=this.VAO.eboLength, type:"UNSIGNED_BYTE"|"UNSIGNED_SHORT"|"UNSIGNED_INT"="UNSIGNED_SHORT", eboOff=0, instanceCount=0){
        this.initDepthBefDraw();
        if(instanceCount<=0)
            this.gl.drawElements(this.gl[mode], elementCount, this.gl[type], eboOff);
        else
            this.gl.drawElementsInstanced(this.gl[mode], elementCount, this.gl[type], eboOff, instanceCount);
        return this;
    }

    /**
     * Used to set both the RGB blend equation and alpha blend equation to a single equation.
     * 
     * The blend equation determines how a new pixel is combined with a pixel already in the WebGLFramebuffer.
     */
    blendEquation(mode:"ADD"|"SUBSTRACT"|"REVERSE_SUBSTRACT"|"MIN"|"MAX"="ADD"){
        if(mode=="MIN"||mode=="MAX")
            this.gl.blendEquation(this.gl[mode])
        else
            this.gl.blendEquation(this.gl["FUNC_"+mode])
    }
    /**
     * defines which function is used for blending pixel arithmetic
     * 
     * __color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor)__. 
     * @param sfactor multiplier for the source blending factors 
     * @param dfactor multiplier for the destination blending factors
     * 
     * Constant | Factor | Description
     * 
     * gl.ZERO 	0,0,0,0 	Multiplies all colors by 0.
     * 
     * gl.ONE 	1,1,1,1 	Multiplies all colors by 1.
     * 
     * gl.SRC_COLOR 	RS, GS, BS, AS 	Multiplies all colors by the source colors.
     * 
     * gl.ONE_MINUS_SRC_COLOR 	1-RS, 1-GS, 1-BS, 1-AS 	Multiplies all colors by 1 minus each source color.
     * 
     * gl.DST_COLOR 	RD, GD, BD, AD 	Multiplies all colors by the destination color.
     * 
     * gl.ONE_MINUS_DST_COLOR 	1-RD, 1-GD, 1-BD, 1-AD 	Multiplies all colors by 1 minus each destination color.
     * 
     * gl.SRC_ALPHA 	AS, AS, AS, AS 	Multiplies all colors by the source alpha value.
     * 
     * gl.ONE_MINUS_SRC_ALPHA 	1-AS, 1-AS, 1-AS, 1-AS 	Multiplies all colors by 1 minus the source alpha value.
     * 
     * gl.DST_ALPHA 	AD, AD, AD, AD 	Multiplies all colors by the destination alpha value.
     * 
     * gl.ONE_MINUS_DST_ALPHA 	1-AD, 1-AD, 1-AD, 1-AD 	Multiplies all colors by 1 minus the destination alpha value.
     * 
     * gl.CONSTANT_COLOR 	RC, GC, BC, AC 	Multiplies all colors by a constant color.
     * 
     * gl.ONE_MINUS_CONSTANT_COLOR 	1-RC, 1-GC, 1-BC, 1-AC 	Multiplies all colors by 1 minus a constant color.
     * 
     * gl.CONSTANT_ALPHA 	AC, AC, AC, AC 	Multiplies all colors by a constant alpha value.
     * 
     * gl.ONE_MINUS_CONSTANT_ALPHA 	1-AC, 1-AC, 1-AC, 1-AC 	Multiplies all colors by 1 minus a constant alpha value.
     * 
     * gl.SRC_ALPHA_SATURATE 	min(AS, 1 - AD), min(AS, 1 - AD), min(AS, 1 - AD), 1 	
     * Multiplies the RGB colors by the smaller of either the source alpha value or the value of
     *  1 minus the destination alpha value. The alpha value is multiplied by 1. 
     * 
     */
    blendFunc(sfactor:BlendConstantType="ONE", dfactor:BlendConstantType="ZERO"){
        this.gl.blendFunc(this.gl[sfactor],this.gl[dfactor]);
    }

    /**
     * Sets source and destination blending factors
     * @param {0 to 1} r 
     * @param {0 to 1} g 
     * @param {0 to 1} b 
     * @param {0 to 1} a 
     */
    blendColor(r:number,g:number,b:number,a:number){
        this.gl.blendColor(r,g,b,a);
    }

    finish(){
        this.gl.finish();
        return this;
    }
}
export type BlendConstantType="ZERO"|"ONE"|"SRC_COLOR"|"ONE_MINUS_SRC_COLOR"|"DST_COLOR"|"ONE_MINUS_DST_COLOR"|
    "SRC_ALPHA"|"ONE_MINUS_SRC_ALPHA"|"DST_ALPHA"|"ONE_MINUS_DST_ALPHA"|"CONSTANT_COLOR"|"ONE_MINUS_CONSTANT_COLOR"|
    "CONSTANT_ALPHA"|"ONE_MINUS_CONSTANT_ALPHA"|"ONE_MINUS_CONSTANT_ALPHA";
export type TextureUnitType=number|"TexUnit0"|"TexUnit1"|"TexUnit2"|"TexUnit3"
  |"TexUnit4"|"TexUnit5"|"TexUnit6"|"TexUnit7"|"TexUnit8"|"TexUnit9"|"TexUnit10"
  |"TexUnit11"|"TexUnit12"|"TexUnit13"|"TexUnit14"|"TexUnit15"|"TexUnit16"|"TexUnit17"
  |"TexUnit18"|"TexUnit19"|"TexUnit20"|"TexUnit21"|"TexUnit22"|"TexUnit23"|"TexUnit24"
  |"TexUnit25"|"TexUnit26"|"TexUnit27"|"TexUnit28"|"TexUnit29"|"TexUnit30"|"TexUnit31";
export function parseTexUnitType(texUnit:TextureUnitType):number {
    if(!texUnit) return texUnit as any;
    if(typeof texUnit=="number") return texUnit;
    return parseInt(texUnit.substring(7))
}
export type ColorAttachmentType=Range<16>|"ColAtch0"|"ColAtch1"|"ColAtch2"|"ColAtch3"
  |"ColAtch4"|"ColAtch5"|"ColAtch6"|"ColAtch7"|"ColAtch8"|"ColAtch9"|"ColAtch10"
  |"ColAtch11"|"ColAtch12"|"ColAtch13"|"ColAtch14"|"ColAtch15";
export function parseColAtchType(colAttachment:ColorAttachmentType):Range<16> {
    if(!colAttachment) return colAttachment as any;
    if(typeof colAttachment=="number") return colAttachment as any;
    return parseInt(colAttachment.substring(7)) as any;
}

/**
 * For a framebuffer to be complete, it must satisfy these requirements (from the WebGL 2.0 spec):
 * 
 * 1. At least one attachment -	You must attach something — usually a color texture (via gl.framebufferTexture2D) or renderbuffer.
 *  Otherwise → FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT.
 * 
 * 2. All attached images must have the same width, height, and sample count -	If sizes differ → FRAMEBUFFER_INCOMPLETE_DIMENSIONS.
 * 
 * 3. Each attachment must be “renderable” -	(e.g. RGBA8, RGBA16F, DEPTH_COMPONENT24, etc.) or → FRAMEBUFFER_INCOMPLETE_ATTACHMENT.
 * 
 * 4. The combination of attachments must be supported
 * 
 * **Tip**:`Wrap gl object with gl=wrapGL(gl) to get error names instead of error codes`
 */
export class FrameBuffer{
    protected fbo:WebGLFramebuffer;
    public colorBuffersUsed:boolean[]=new Array(15).fill(false);
    /**
     * Creates a framebuffer, which is basically a replacement canvas to draw into
     * After this function you can call {@link bindColorBuffer},{@link bindTextureDepthBuffer} or {@link cRenderBuffer}
     * 
     * To render we have to tell which color units to render to: 
     * gl.drawBuffers([
     *    gl.COLOR_ATTACHMENT0,
     *    gl.COLOR_ATTACHMENT1, ..etc
     * ]);
     * @returns [fbo, ()=>{binds the fbo}]
     */
    constructor(public gl:WebGL2RenderingContext, public program?:WebProgram){
        // 2️⃣ Create a framebuffer (the “canvas”)
        this.fbo = this.gl.createFramebuffer();
    }
    bind(colorATTACHMENTS?:ColorAttachmentType[]){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        if(colorATTACHMENTS)
            this.drawBuffers(colorATTACHMENTS);
        return this;
    }
    unbind(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    }
    /**
     * Tells the FrameBuffer what color attachments to output (i.e. this is for multiple outputs, each requiring 
     * you have set a color Buffer {@link bindColorBuffer} )
     */
    drawBuffers(unitArr:ColorAttachmentType[]=this.colorBuffersUsed.map((a,i)=>[a,i]).filter(a=>a[0]).map(a=>a[1]) as any){
        this.gl.drawBuffers(
            unitArr.map(unit=>this.gl.COLOR_ATTACHMENT0+parseColAtchType(unit))
        );
        return this;
    }
    /**
     * After binded FrameBuffer we can use a texture as color.
     * If you dont want to read it later you dont need a texture then use {@link cRenderBuffer} with Color 
     * 
     * Renderable buffer internal types:
     * 
     * Unsigned byte **|**	RGBA8, RGB8, RGB5_A1, RGB10_A2, RGBA4 **|**	Normal 8-bit formats
     * 
     * Float (requires extension) **|**	RGBA16F, RGB16F **|**	Half-float (16-bit) requires EXT_color_buffer_half_float
     * 
     * Integer **|**	R32I, R32UI, etc. **|**	Only for integer render targets
     * 
     * @param {ColorAttachmentType} colorUnit - The location of the output texture (`layout(location=0) out vec4 solidColor;`)
     * @param {number} LODlevel - for WebGL **this must always be 0** (base mipmap level)
     */
    bindColorBuffer(texture:WebGLTexture, 
        colorUnit?:ColorAttachmentType, LODlevel=0
    ){
        colorUnit=parseColAtchType(colorUnit);
        if(colorUnit===undefined){
            if((texture as any).unit!==undefined)
                colorUnit=(texture as any).unit;
            else
                colorUnit=0;
        }
        (texture as any).colorUnit=colorUnit;
        this.colorBuffersUsed[colorUnit]=true;
        // Attach the texture to it as color buffer
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0+(colorUnit as any),
                                this.gl.TEXTURE_2D, texture, LODlevel);
        return this;
    }
    unbindBuffer(colorUnit: ColorAttachmentType){
        colorUnit=parseColAtchType(colorUnit);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0+(colorUnit as any),
                                this.gl.TEXTURE_2D, null, 0);
    }
    readColorAttachment(n:ColorAttachmentType, x=0, y=0, w=this.program.standardTEXW, h=this.program.standardTEXH,
        format:TexExamples|[number,number,number], dimension=4
    ){
        let buffer=new Float32Array(w*h*dimension);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0+parseColAtchType(n)); 
        this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
        return buffer;
    }
    
    readColAttchTexture(tex:WebGLTexture, dimension=4, x?, y?, w?, h?,
        format?:TexExamples|[number,number,number], colUnit?:ColorAttachmentType
    ){
        let n=colUnit??(tex as any).colorUnit??(tex as any).unit;
        x??=(tex as any).offx;
        y??=(tex as any).offy;
        w??=(tex as any).w||this.program.standardTEXW;
        h??=(tex as any).h||this.program.standardTEXH;
        format??=(tex as any).format||TexExamples.RGBA;

        let buffer=new Float32Array(w*h*dimension);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0+parseColAtchType(n)); 
        this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
        return buffer;
    }
    /**
     * RBGA booleans specifying whether that component can be rendered into the framebuffer
     * 
     * (gl.getParameter(gl.COLOR_WRITEMASK))
     */
    colorMask(r:boolean=true,g:boolean=true,b:boolean=true,a:boolean=true){
        this.gl.colorMask(r,g,b,a);
        return this;
    }
    bindTextureDepthBuffer(texture:WebGLTexture, LODlevel=0){
        // Attach the texture to it as the depth buffer
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
                                this.gl.TEXTURE_2D, texture, LODlevel);
        return this;
    }
    /**
     * 
     * @param depth Specifies whether depth buffer can be written into
     */
    depthMask(depth:boolean){
        this.gl.depthMask(depth);
        return this;
    }
    /**
     * possible __types__ are:
     *   - Depth{16,24,32F} = Depth Buffer (only 1 per program)
     *   - Color{4,5,8} = ColorBuffer (up to 15)
     *   - STENCIL_INDEX8
     *   - DEPTH_STENCIL
     *   - DEPTH24_STENCIL8
     * 
     * 
     * __Internal__ |                        __Format__	|    __Meaning	Used for__  
     * 
     * gl.RGBA4	                4 bits per channel color (low quality)	           Color	 
     * 
     *                          
     * 
     * gl.RGB565                5/6/5 bits per color (common, fast)	      Color
     * 
     * gl.RGBA8	                8-bit color	         Color	
     * 
     * gl.DEPTH_COMPONENT16	    16-bit depth	     Depth testing	
     * 
     * gl.DEPTH_COMPONENT24	    24-bit depth	     Depth testing	
     * 
     * gl.DEPTH_COMPONENT32F	32-bit float depth	 High-precision depth	
     * 
     * gl.STENCIL_INDEX8	    8-bit stencil	     Stencil testing
     * 	
     * gl.DEPTH_STENCIL or gl.DEPTH24_STENCIL8 or gl.DEPTH32F_STENCIL8
     * 
     * @param [quality="low"|"medium"|"high"] 
     */
    cRenderBuffer(type:"DEPTH"|"COLOR"|"STENCIL_INDEX8"|"DEPTH_STENCIL"="DEPTH",
        quality:"low"|"medium"|"high"="low",w=256,h=256, colorUnit:ColorAttachmentType=0){
        colorUnit=parseColAtchType(colorUnit);
        let attachment:number=this.gl.COLOR_ATTACHMENT0;
        let ifs=[];
        switch (type) {
            case "STENCIL_INDEX8":
                attachment=this.gl.STENCIL_INDEX8;
            break;
            case "DEPTH_STENCIL":
                ifs=[this.gl.DEPTH_STENCIL, this.gl.DEPTH24_STENCIL8, this.gl.DEPTH32F_STENCIL8];
                attachment=this.gl.DEPTH_STENCIL_ATTACHMENT;
            break;
            case "DEPTH":
                ifs=[this.gl.DEPTH_COMPONENT16,this.gl.DEPTH_COMPONENT24,this.gl.DEPTH_COMPONENT32F]
                attachment=this.gl.DEPTH_ATTACHMENT;
            break;
            case "COLOR": default:
                ifs=[this.gl.RGBA4,this.gl.RGB565,this.gl.RGBA8]
                attachment=this.gl.COLOR_ATTACHMENT0+colorUnit;
                this.colorBuffersUsed[colorUnit]=true;
            break;
        }
        //set the internal format depending on quality settings
        let qidx=quality=="low"?0:quality=="medium"?1:2;
        let internalFormat=ifs[qidx]||ifs[0];
        
        // 4️⃣ (Optional) Attach a depth buffer
        const rbo = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rbo);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, internalFormat, w, h);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment,
                                this.gl.RENDERBUFFER, rbo);
        return rbo;
    }
    /**
     * 
     * @param maskNum A GLuint specifying a bit mask to enable or disable writing of individual
     *  bits in the stencil planes. By default, the mask is all 1.
     * 
     * (
     * 
     * gl.getParameter(gl.STENCIL_WRITEMASK);
     * 
     * // 110101
     * 
     * gl.getParameter(gl.STENCIL_BACK_WRITEMASK);
     * 
     * // 110101
     * 
     * gl.getParameter(gl.STENCIL_BITS);
     * // 0
     * 
     * )
     */
    stencilMask(maskNum:number){
        this.gl.stencilMask(maskNum);
        return this;
    }

    get _(){
        return this.fbo;
    }
}


export type GLMode="TRIANGLES"|"TRIANGLE_STRIP"|"TRIANGLE_FAN"|"POINTS"|"LINES"|"LINE_STRIP"|"LINE_LOOP";
export type BindableTexture=WebGLTexture&{
    unit:number,w:number,h:number,
    fill:(arr: any, x?: number, y?: number, w?: number, h?: number, LOD?: number) => BindableTexture,
    // read:(arr?: any, x?: number, y?: number, w?: number, h?: number, dimension?: number) => ArrayBufferView<ArrayBufferLike>,
    bind:(textureUnit?:TextureUnitType)=>BindableTexture,
    unbind:(textureUnit?:TextureUnitType)=>BindableTexture,
}
export type BindableTexture3D=WebGLTexture&{
    unit:number,w:number,h:number,
    fill:(arr: any, x?: number, y?: number, z?: number, w?: number, h?: number, d?: number, LOD?: number) => BindableTexture3D,
    // read:(arr?: any, x?: number, y?: number, w?: number, h?: number, dimension?: number) => ArrayBufferView<ArrayBufferLike>,
    bind:(textureUnit?:TextureUnitType)=>BindableTexture3D,
    unbind:(textureUnit?:TextureUnitType)=>BindableTexture3D,
    setLengthUniforms:()=>BindableTexture3D,
}

/*
| You want                            | Use internalFormat / type       | Shader sampler | Values         |
| ----------------------------------- | ------------------------------- | -------------- | -------------- |
| Normalized 0–1 colors               | `RGBA8`, `UNSIGNED_BYTE`        | `sampler2D`    | 0→0.0, 255→1.0 |
| Integer 0–255 values                | `RGBA8UI`, `UNSIGNED_BYTE`      | `usampler2D`   | 0→0, 255→255   |
| Raw float values (no normalization) | `RGBA16F` or `RGBA32F`, `FLOAT` | `sampler2D`    | stored == read |

---------------------------------------------------------------------------------------------------------------
| internalFormat                         | Normalized?            | Shader type  | Notes                   |
| -------------------------------------- | ---------------------- | ------------ | ----------------------- |
| `R8`, `RG8`, `RGBA8`                   | ✅ normalized → `0..1`  | `sampler2D`  | Standard color textures |
| `R8_SNORM`, `RG8_SNORM`, `RGBA8_SNORM` | ✅ normalized → `-1..1` | `sampler2D`  | Signed normalized       |
| `R8UI`, `RG8UI`, `RGBA8UI`             | ❌ raw unsigned ints    | `usampler2D` | No normalization        |
| `R8I`, `RG8I`, `RGBA8I`                | ❌ raw signed ints      | `isampler2D` | No normalization        |
| `R16F`, `RG16F`, `RGBA16F`             | ❌ floats               | `sampler2D`  | Real float values       |
| `R32F`, `RG32F`, `RGBA32F`             | ❌ floats               | `sampler2D`  | Real float values       |

*/
export type TexExamples={
    "RFloat":[number,number,number],
    "RGFloat":[number,number,number],
    "RGBFloat":[number,number,number],
    "RGBAFloat":[number,number,number],
    "RFloat16":[number,number,number],
    "RGFloat16":[number,number,number],
    "RGBFloat16":[number,number,number],
    "RGBAFloat16":[number,number,number],
    "R":[number,number,number],
    "RG":[number,number,number],
    "RGB":[number,number,number],
    "RGBA":[number,number,number],
    "RInt":[number,number,number],
    "RGInt":[number,number,number],
    "RGBInt":[number,number,number],
    "RGBAInt":[number,number,number],
    "RInt16":[number,number,number],
    "RGInt16":[number,number,number],
    "RGBInt16":[number,number,number],
    "RGBAInt16":[number,number,number],
    "RInt8":[number,number,number],
    "RGInt8":[number,number,number],
    "RGBInt8":[number,number,number],
    "RGBAInt8":[number,number,number],
    "RUInt":[number,number,number],
    "RGUInt":[number,number,number],
    "RGBUInt":[number,number,number],
    "RGBAUInt":[number,number,number],
    "RUInt16":[number,number,number],
    "RGUInt16":[number,number,number],
    "RGBUInt16":[number,number,number],
    "RGBAUInt16":[number,number,number],
    "RUInt8":[number,number,number],
    "RGUInt8":[number,number,number],
    "RGBUInt8":[number,number,number],
    "RGBAUInt8":[number,number,number],
    "RUBYTE8":[number,number,number],
    "RGUBYTE8":[number,number,number],
    "RGBUBYTE8":[number,number,number],
    "RGBAUBYTE8":[number,number,number],
}
export var TexExamples:TexExamples={
    //*sampler2D -> use the same floats in shader
    // FLOAT textures 32B
    "RFloat":[WebGL2RenderingContext.RED,WebGL2RenderingContext.R32F,WebGL2RenderingContext.FLOAT],
    "RGFloat":[WebGL2RenderingContext.RG,WebGL2RenderingContext.RG32F,WebGL2RenderingContext.FLOAT],
    "RGBFloat":[WebGL2RenderingContext.RGB,WebGL2RenderingContext.RGB32F,WebGL2RenderingContext.FLOAT],
    "RGBAFloat":[WebGL2RenderingContext.RGBA,WebGL2RenderingContext.RGBA32F,WebGL2RenderingContext.FLOAT],
    // FLOAT textures 16B
    "RFloat16":[WebGL2RenderingContext.RED,WebGL2RenderingContext.R16F,WebGL2RenderingContext.FLOAT],
    "RGFloat16":[WebGL2RenderingContext.RG,WebGL2RenderingContext.RG16F,WebGL2RenderingContext.FLOAT],
    "RGBFloat16":[WebGL2RenderingContext.RGB,WebGL2RenderingContext.RGB16F,WebGL2RenderingContext.FLOAT],
    "RGBAFloat16":[WebGL2RenderingContext.RGBA,WebGL2RenderingContext.RGBA16F,WebGL2RenderingContext.FLOAT],

    //*sampler2D -> use 0-1 floats in shader (normal RGB colors)
    // UNSIGNED_BYTE textures 32B
    "R":[WebGL2RenderingContext.RED,WebGL2RenderingContext.R8,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RG":[WebGL2RenderingContext.RG,WebGL2RenderingContext.RG8,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGB":[WebGL2RenderingContext.RGB,WebGL2RenderingContext.RGB8,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBA":[WebGL2RenderingContext.RGBA,WebGL2RenderingContext.RGBA8,WebGL2RenderingContext.UNSIGNED_BYTE],

    //*isampler2D -> use integers in shader
    // SIGNED INTEGER textures 32
    "RInt":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R32I,WebGL2RenderingContext.INT],
    "RGInt":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG32I,WebGL2RenderingContext.INT],
    "RGBInt":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB32I,WebGL2RenderingContext.INT],
    "RGBAInt":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA32I,WebGL2RenderingContext.INT],
    // SIGNED INTEGER textures 16
    "RInt16":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R16I,WebGL2RenderingContext.INT],
    "RGInt16":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG16I,WebGL2RenderingContext.INT],
    "RGBInt16":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB16I,WebGL2RenderingContext.INT],
    "RGBAInt16":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA16I,WebGL2RenderingContext.INT],
    // SIGNED INTEGER textures 8
    "RInt8":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R8I,WebGL2RenderingContext.INT],
    "RGInt8":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG8I,WebGL2RenderingContext.INT],
    "RGBInt8":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB8I,WebGL2RenderingContext.INT],
    "RGBAInt8":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA8I,WebGL2RenderingContext.INT],

    //*usampler2D -> use integers in shader
    // UNSIGNED INTEGER textures 32
    "RUInt":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R32UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG32UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB32UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA32UI,WebGL2RenderingContext.UNSIGNED_INT],
    // UNSIGNED INTEGER textures 16
    "RUInt16":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R16UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt16":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG16UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt16":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB16UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt16":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA16UI,WebGL2RenderingContext.UNSIGNED_INT],
    // UNSIGNED INTEGER textures 8
    "RUInt8":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R8UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt8":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG8UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt8":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB8UI,WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt8":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA8UI,WebGL2RenderingContext.UNSIGNED_INT],
    
    // UNSIGNED INTEGER textures 8
    "RUBYTE8":[WebGL2RenderingContext.RED_INTEGER,WebGL2RenderingContext.R8UI,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGUBYTE8":[WebGL2RenderingContext.RG_INTEGER,WebGL2RenderingContext.RG8UI,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBUBYTE8":[WebGL2RenderingContext.RGB_INTEGER,WebGL2RenderingContext.RGB8UI,WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBAUBYTE8":[WebGL2RenderingContext.RGBA_INTEGER,WebGL2RenderingContext.RGBA8UI,WebGL2RenderingContext.UNSIGNED_BYTE],
}

/**
 * Basically an object that is handled inside webgl2 that stores textures and any array(buffers) except framebuffers
 */
export class VAO{
    protected vao:WebGLVertexArrayObject; 
    /** Length of the last set buffer divided by dimension */
    public vaoLength=0;
    public eboLength=0;
    constructor(public gl:WebGL2RenderingContext, public program:WebGLProgram){
        this.vao=gl.createVertexArray();
    }
    bind(){
        this.gl.bindVertexArray(this._);
        return this;
    }
    /**
     * Creates a VBO (meaning a buffer storing numbers splitted for each vertex, i.e. an attribute)
     */
    cVBO(name:string, data:Float32Array, dimension=3, type:"FLOAT"|"UNSIGNED_BYTE"="FLOAT", stride=0, offset=0, normalized=false){
        // create VBO for positions
        const posBuf = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        if(data instanceof Float32Array||(data as any).length){
            this.vaoLength=~~(data.length/dimension);
        }

        const posLoc = this.gl.getAttribLocation(this.program, name); // attribute location
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, dimension, this.gl[type], normalized, stride, offset);
        return posBuf;
    }
    /**
     * Creates a VBO (meaning a buffer storing numbers splitted for each vertex, i.e. an attribute)
     */
    attribute(name:string, data:Float32Array|number[], dimension=3, type:"FLOAT"|"UNSIGNED_BYTE"="FLOAT", stride=0, offset=0, normalized=false){
        if(!(data instanceof Float32Array)) data=new Float32Array(data);
        return this.cVBO(name,data,dimension,type,stride,offset,normalized);
    }
    /**
     * Sets an EBO, meaning a index buffer, which is an array of integers telling the GPU to repeat the connection of 
     * what vectors following these indices.
     */
    cEBO(indices:Float32Array){
        // create index buffer (EBO)
        const ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
        this.eboLength=indices.length;
        return [ibo,()=>{
            //update ibo at render stage
        }];
    }
    copyBufferFromGPU(src:WebGLBuffer, dst:WebGLBuffer=this.gl.createBuffer(), nBytes, rdOff=0, wrOff=0){
        // Bind them to COPY_READ and COPY_WRITE
        this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, src);
        this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, dst);

        // Allocate destination
        this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, nBytes, this.gl.STATIC_DRAW); // 4 floats = 16 bytes

        // Copy GPU→GPU
        this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, rdOff, wrOff, nBytes);

        return dst;
    }
    get _(){
        return this.vao;
    }
}


/*
!Skybox code (using a cube to render)
?vertexShader
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
out vec3 vDirection;

uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    // Remove translation from view matrix (so skybox stays fixed)
    mat4 viewNoTranslate = mat4(mat3(uView));
    vec4 pos = viewNoTranslate * vec4(aPosition, 1.0);

    vDirection = aPosition; // direction to sample cube map
    gl_Position = uProjection * pos;
    
    // Trick: move skybox depth slightly behind everything
    gl_Position.z = gl_Position.w * 0.9999;
}
?FragmentShader
#version 300 es
precision highp float;

in vec3 vDirection;
out vec4 fragColor;

uniform samplerCube uSkybox;

void main() {
    fragColor = texture(uSkybox, normalize(vDirection));
}
?Texture Creation
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

const faces = [
  [gl.TEXTURE_CUBE_MAP_POSITIVE_X, 'right.jpg'],
  [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 'left.jpg'],
  [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 'top.jpg'],
  [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 'bottom.jpg'],
  [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 'front.jpg'],
  [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 'back.jpg'],
];

faces.forEach(([target, url]) => {
  const img = new Image();
  img.src = url;
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  };
});

gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);


?Drawing
gl.depthFunc(gl.LEQUAL);        //! draw behind everything else
gl.useProgram(programSkybox);
gl.bindVertexArray(vaoSkybox);

* // Send view and projection matrices
gl.uniformMatrix4fv(uView, false, viewMatrix);
gl.uniformMatrix4fv(uProjection, false, projectionMatrix);

* // Bind cubemap texture
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
gl.uniform1i(uSkybox, 0);

gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
gl.depthFunc(gl.LESS);          // restore default depth function

!Other techniques
?Equirectangular texture (basically 1 image)
vec2 uv = vec2(
    atan(vDirection.z, vDirection.x) / (2.0 * 3.1415926) + 0.5,
    asin(vDirection.y) / 3.1415926 + 0.5
);
fragColor = texture(uEquirectangular, uv);


!Remember we can also use sampler2DArray's to send multiple images to the GPU
*/
export type Range<N extends number, Result extends unknown[] = []> =
  Result['length'] extends N ? Result[number] : Range<N, [...Result, Result['length']]>



// ======= WebGL2 Debug Wrapper =======

function glErrorName(gl, errorCode) {
  switch (errorCode) {
    case gl.NO_ERROR: return "NO_ERROR";
    case gl.INVALID_ENUM: return "INVALID_ENUM";
    case gl.INVALID_VALUE: return "INVALID_VALUE";
    case gl.INVALID_OPERATION: return "INVALID_OPERATION";
    case gl.INVALID_FRAMEBUFFER_OPERATION: return "INVALID_FRAMEBUFFER_OPERATION";
    case gl.OUT_OF_MEMORY: return "OUT_OF_MEMORY";
    case gl.CONTEXT_LOST_WEBGL: return "CONTEXT_LOST_WEBGL";
    default: return `UNKNOWN_ERROR (${errorCode})`;
  }
}

function framebufferStatusName(gl, status) {
  switch (status) {
    case gl.FRAMEBUFFER_COMPLETE: return "FRAMEBUFFER_COMPLETE";
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
    case gl.FRAMEBUFFER_UNSUPPORTED: return "FRAMEBUFFER_UNSUPPORTED";
    case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";
    default: return `UNKNOWN_FRAMEBUFFER_STATUS (${status})`;
  }
}

export function wrapGL(gl) {
  const handler = {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig === "function") {
        return function(...args) {
          const result = orig?.apply?.(target, args);

          // Check API-level error
          const err = target.getError();
          if (err !== target.NO_ERROR) {
            console.error(
              `%c[WebGL Error]%c ${prop}(${args.map(a => a?.toString?.()).join(", ")}) → ${glErrorName(target, err)} (${err})`,
              "color:red;font-weight:bold", "color:inherit"
            );
          }

          // ✅ Only check framebuffer completeness at key moments
          if (
            prop.startsWith("draw")
          ) {
            const fb = args[1] || target.getParameter(target.FRAMEBUFFER_BINDING);
            if (fb) {
              const status = target.checkFramebufferStatus(target.FRAMEBUFFER);
              if (status !== target.FRAMEBUFFER_COMPLETE) {
                console.warn(
                  `%c[Framebuffer]%c ${prop}: ${framebufferStatusName(target, status)} (${status})`,
                  "color:orange;font-weight:bold", "color:inherit"
                );
              }
            }
          }

          return result;
        };
      }
      return orig;
    }
  };
  return new Proxy(gl, handler);
}
