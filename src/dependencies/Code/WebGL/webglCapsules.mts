import {BindableTexture, GLMode, TexExamples, TextureUnitType, WebGLMan, WebProgram, parseTexUnitType} from "./webglMan.js"
import {loadShaders, loadShadersFromString} 
    from "../opengl/opengl.js"
import { HSLtoRGB } from "../Utils/utils.js";
import { Camera3D } from "../Game3D/Game3D.js";
import { Vector3D } from "../Matrix/Matrix.js";

//! Program Capsules (templates)


/**
 * Renders a texture 2D filled with Y values into a 3DMesh
 */
export class MeshRenderingProgram extends WebProgram{
    public totalSegments:number;
    constructor(gl:WebGL2RenderingContext, public valsTexUnit:TextureUnitType="TexUnit20", public w=1024, public h=1024, public dx=0.015, public dy=0.015){
        super(gl, "", "");
    }
    override async loadProgram(vs?: string, fs?: string): Promise<this> {
        [this.program, this.vert, this.frag] = await loadShadersFromString(
            this.gl,
            //? vertex shader
            `#version 300 es
            precision highp float;

            uniform sampler2D values;
            uniform int msdLength;   
            uniform int msdCount;    
            uniform float dx;
            uniform float dy;
            uniform float xPer;
            uniform float yPer;
            uniform float yScale;
            uniform vec3 offPos;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;

            flat out vec3 outPos;

            vec4 getPoint(int x, int yTexel) {
                // Ahora la textura tiene un único canal (RED)
                float val = texelFetch(values, ivec2(x, yTexel), 0).r;

                float px = dx * float(x) - dx * float(msdLength) * (1.0 - xPer);
                float py = val * yScale;
                float pz = dy * float(yTexel) - dy * float(msdCount) * (1.0 - yPer);

                return vec4(px, py, -pz, 1.0) + vec4(offPos, 0.0);
            }

            void main() {
                int horizCount = (msdLength - 1) * msdCount;
                int segment = gl_VertexID / 2;
                bool first = (gl_VertexID % 2) == 0;

                int x, y;
                vec4 pos;

                if (segment < horizCount) {
                    // Segmento horizontal
                    int base = segment;
                    y = base / (msdLength - 1);
                    x = base % (msdLength - 1);
                    pos = getPoint(first ? x : x + 1, y);
                } else {
                    // Segmento vertical
                    int base = segment - horizCount;
                    x = base / (msdCount - 1);
                    y = base % (msdCount - 1);
                    pos = getPoint(x, first ? y : y + 1);
                }

                outPos = pos.xyz;
                gl_Position = u_projectionMatrix * (u_viewMatrix * pos);
            }`,
            //? fragment shader
            `#version 300 es
            precision highp float;

            flat in vec3 outPos;
            out vec4 outColor;
            uniform float colorHueScale;

            float hue2rgb(float p, float q, float t){
                if(t < 0.0) t += 1.0;
                if(t > 1.0) t -= 1.0;
                if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                if(t < 1.0/2.0) return q;
                if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                return p;
            }

            vec3 hsl2rgb(float h, float s, float l){
                float q = l < 0.5 ? l * (1.0 + s) : (l + s - l*s);
                float p = 2.0 * l - q;
                return vec3(
                    hue2rgb(p, q, h + 1.0/3.0),
                    hue2rgb(p, q, h),
                    hue2rgb(p, q, h - 1.0/3.0)
                );
            }

            void main(){
                // Normalizamos la altura a hue (suponiendo alturas entre -1.5 y +1.5)
                float h = (outPos.y * colorHueScale / 1.5); // ahora está entre -1 y 1
                h = (mod(-h,1.5) * 0.5) + 0.5;        // lo llevamos a 0..1

                float s = 0.6;
                float l = 0.5;

                vec3 rgb = hsl2rgb(h, s, l);

                outColor = vec4(rgb, 1.0);
            }
            `
        );
        return this;
    }

    setSize(w=this.w,h=this.h){
        this.w=w; this.h=h;
        let totalY = h;
        let horizSegments = (w - 1) * totalY;
        let vertSegments  = w * (totalY - 1);
        this.totalSegments = horizSegments + vertSegments;
        this.uInt("msdLength").set(this.w);
        this.uInt("msdCount").set(this.h);
        return this;
    }
    setOffset(x,y,z){
        this.uVec("offPos",3).set([x,y,z]);
        return this;
    }
    
    setDXDY(dx,dy){
        this.uFloat("dx").set(dx);
        this.uFloat("dy").set(dy);
        return this;
    }
    
    /**
     * Offsets depending on the total mesh size
     * 0.5,0.5 = centered on 0,0
     */
    setPerXPerY(px=0.5,py=0.5){
        this.uFloat("xPer").set(px);
        this.uFloat("yPer").set(py);
        return this;
    }
    setColorHueScale(scale=1){
        this.uFloat("colorHueScale").set(scale);
        return this;
    }
    setYScale(scale=0.5){
        this.uFloat("yScale").set(scale);
        return this;
    }

    initUniforms(){
        this.setSize(this.w,this.h).setOffset(0,0,0).setDXDY(this.dx,this.dy)
        .setPerXPerY().setColorHueScale().setYScale();
        return this;
    }

    /**
     * Remember to check the texUnit texture must be active (use texture.bind(texUnit?))
     */
    draw(x=0,y=0,w=1080,h=720,camera?:Camera3D, mode:GLMode="LINES"){
        this.initDepthBefDraw();
        this.bindTexName2TexUnit("values", this.valsTexUnit);
        if(camera){
            camera.calculateMatrices().setUniformsProgram(this as any);
        }
        
        this.setViewport(x,y,w,h);
        this.clearColor();
        this.drawArrays(mode, 0, this.totalSegments*2);
    }
    /**
     * Creates and fills a texture for a 3d Mesh f(x,y)=>z
     */
    createIdealTexture(texUnit=this.valsTexUnit, data?:any|((x:number,y:number)=>number), w=this.w, h=this.h){
        let arrdata;
        if(typeof data =="function" && typeof data(0,0)=="number"){
            arrdata=new Float32Array(w*h);
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    arrdata[i*w+j]=data(i,j)||0;
                }
            }
        }
        return this.texture2D({
            format:TexExamples.RFloat,
            size:[w, h],
            texUnit: texUnit, 
            data:arrdata||data
        })
    }
    fillMeshTexture(texture2D:BindableTexture, data?:any|((x:number,y:number)=>number), w=this.w, h=this.h){
        let arrdata;
        if(typeof data =="function" && typeof data(0,0)=="number"){
            arrdata=new Float32Array(w*h);
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    arrdata[i*w+j]=data(i,j)||0;
                }
            }
        }
        texture2D.fill(arrdata,0,0,w,h);

    }
}

export type Plano = "XY" | "XZ" | "YZ";
export type ArrayPlano = Plano[];
export class AxisLinesProgram extends WebProgram {
    constructor(
        gl: WebGL2RenderingContext,
        public axisLengths: Vector3D = new Vector3D(1, 1, 1)
    ) {
        super(gl, "", "");
    }

    override async loadProgram(): Promise<this> {
        [this.program, this.vert, this.frag] = await loadShadersFromString(
            this.gl,
            `#version 300 es
            precision highp float;

            const vec3 AXIS_COLORS[3] = vec3[3](
                vec3(1.0, 0.0, 0.0),  // X
                vec3(0.0, 1.0, 0.0),  // Y
                vec3(0.0, 0.0, 1.0)   // Z
            );

            uniform vec3 axisLengths;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main() {
                int axis = gl_VertexID / 2;
                bool start = (gl_VertexID % 2) == 0;

                vec3 pos = vec3(0.0);
                if (!start) {
                    if (axis == 0) pos.x = axisLengths.x;
                    else if (axis == 1) pos.y = axisLengths.y;
                    else pos.z = axisLengths.z;
                }

                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(pos, 1.0);
                vColor = AXIS_COLORS[axis];
            }`,
            `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main() { outColor = vec4(vColor, 1.0); }`
        );
        return this;
    }

    initUniforms() {
        this.uVec("axisLengths", 3).set(this.axisLengths);
    }
    setAxisLengths(x,y,z){
        this.axisLengths=new Vector3D(x,y,z);
        this.uVec("axisLengths", 3).set(this.axisLengths);
        return this;
    }

    draw(camera?: Camera3D) {
        if (camera) camera.calculateMatrices().setUniformsProgram(this as any);
        this.drawArrays("LINES", 0, 6);
    }
}

export class AxisConesProgram extends WebProgram {
    constructor(
        gl: WebGL2RenderingContext,
        public arrowHeights: Vector3D = new Vector3D(0.1, 0.1, 0.1),
        public arrowRadii: Vector3D = new Vector3D(0.03, 0.03, 0.03),
        public axisLengths: Vector3D = new Vector3D(1, 1, 1)
    ) {
        super(gl, "", "");
    }

    override async loadProgram(): Promise<this> {
        [this.program, this.vert, this.frag] = await loadShadersFromString(
            this.gl,
            // VS
            `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            layout(location=1) in vec3 aColor;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = aColor;
            }`,
            // FS
            `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor, 1.0); }`
        );
        return this;
    }

    /** Crea un simple VAO de conos para las puntas */
    initVAO() {
        const steps = 16;
        const vertices: number[] = [];
        const colors: number[] = [];

        const addCone = (dir: Vector3D, length: number, height: number, radius: number, color: number[]) => {
            for (let i = 0; i < steps; i++) {
                const a1 = (i / steps) * Math.PI * 2;
                const a2 = ((i + 1) / steps) * Math.PI * 2;

                const base1 = new Vector3D(
                    dir.x * length + radius * Math.cos(a1),
                    dir.y * length + radius * Math.sin(a1),
                    dir.z * length
                );
                const base2 = new Vector3D(
                    dir.x * length + radius * Math.cos(a2),
                    dir.y * length + radius * Math.sin(a2),
                    dir.z * length
                );
                const tip = new Vector3D(dir.x * (length + height), dir.y * (length + height), dir.z * (length + height));

                // triángulo base1, base2, tip
                vertices.push(
                    base1.x, base1.y, base1.z,
                    base2.x, base2.y, base2.z,
                    tip.x, tip.y, tip.z
                );
                colors.push(...color, ...color, ...color);
            }
        };

        addCone(new Vector3D(1, 0, 0), this.axisLengths.x, this.arrowHeights.x, this.arrowRadii.x, [1, 0, 0]);
        addCone(new Vector3D(0, 1, 0), this.axisLengths.y, this.arrowHeights.y, this.arrowRadii.y, [0, 1, 0]);
        addCone(new Vector3D(0, 0, 1), this.axisLengths.z, this.arrowHeights.z, this.arrowRadii.z, [0, 0, 1]);

        let vao=this.createVAO().bind();
        vao.attribute("aPos",vertices,3);
        vao.attribute("aColor",colors,3);
        return vao;
    }
    initUniforms() {
        this.uVec("axisLengths",3).set(this.axisLengths);
        this.uVec("arrowHeights",3).set(this.arrowHeights);
        this.uVec("arrowRadii",3).set(this.arrowRadii);
    }


    draw(camera?: Camera3D) {
        if (camera) camera.calculateMatrices().setUniformsProgram(this as any);
        this.bindVAO();
        this.drawArrays("TRIANGLES", 0, 3 * 16 * 3);
    }
}


export class AxisGridProgram extends WebProgram {
    public vertexCount: number = 0;
    public divisions: number = 10;   // nº de divisiones por eje
    public cellSize: number = 0.1;   // tamaño del lado del cuadrado (calculado automáticamente)

    constructor(
        gl: WebGL2RenderingContext,
        public planes: ArrayPlano = ["XY"],
        public axisLengths: Vector3D = new Vector3D(1, 1, 1),
        divisions: number = 10
    ) {
        super(gl, "", "");
        this.setDivisions(divisions); 
    }

    override async loadProgram(): Promise<this> {
        [this.program, this.vert, this.frag] = await loadShadersFromString(
            this.gl,
            `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;
            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = vec3(0.3);
            }`,
            `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor,1.0); }`
        );
        return this;
    }

    /** Inicializa uniforms comunes (axis lengths, matrices, etc.) */
    initUniforms(axisLengths?: Vector3D) {
        if (axisLengths) this.axisLengths = axisLengths;
        else if (!this.axisLengths) this.axisLengths = new Vector3D(1, 1, 1);

        // this.uVec("u_axisLengths", 3).set(this.axisLengths);
    }

    /** Genera el VAO de la cuadrícula en función de cellSize o divisions */
    initVAO() {
        const vertices: number[] = [];


        for (const plane of this.planes) this.addGrid(plane, vertices);

        this.vertexCount = vertices.length / 3;

        if(!this.VAO) this.createVAO();
        this.VAO.bind().attribute("aPos", vertices, 3);

        return this;
    }
    addGrid(plane: Plano, vertices:number[]){
        const sizeX = this.axisLengths?.x ?? 1.0;
        const sizeY = this.axisLengths?.y ?? 1.0;
        const sizeZ = this.axisLengths?.z ?? 1.0;
        // paso exacto por eje (no promedio)
        const stepX = sizeX / this.divisions;
        const stepY = sizeY / this.divisions;
        const stepZ = sizeZ / this.divisions;
        if (plane === "XY") {
            // líneas verticales
            for (let i = 0; i <= this.divisions; i++) {
                const x = i * stepX;
                vertices.push(x, 0, 0, x, sizeY, 0);
            }
            // líneas horizontales
            for (let i = 0; i <= this.divisions; i++) {
                const y = i * stepY;
                vertices.push(0, y, 0, sizeX, y, 0);
            }
        } else if (plane === "XZ") {
            for (let i = 0; i <= this.divisions; i++) {
                const x = i * stepX;
                vertices.push(x, 0, 0, x, 0, sizeZ);
            }
            for (let i = 0; i <= this.divisions; i++) {
                const z = i * stepZ;
                vertices.push(0, 0, z, sizeX, 0, z);
            }
        } else if (plane === "YZ") {
            for (let i = 0; i <= this.divisions; i++) {
                const y = i * stepY;
                vertices.push(0, y, 0, 0, y, sizeZ);
            }
            for (let i = 0; i <= this.divisions; i++) {
                const z = i * stepZ;
                vertices.push(0, 0, z, 0, sizeY, z);
            }
        }
    }
        

    draw(camera?: Camera3D) {
        if (camera) camera.calculateMatrices().setUniformsProgram(this as any);
        this.bindVAO();
        if (this.vertexCount)
            this.drawArrays("LINES", 0, this.vertexCount);
    }

    // ----------------------------
    // 🔧 Nuevas funciones añadidas
    // ----------------------------

    /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
    setDivisions(divisions: number) {
        this.divisions = Math.max(1, divisions);
        // lado medio de los ejes -> tamaño de celda promedio
        const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
        this.cellSize = avgAxis / this.divisions
        return this;
    }

    /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
    setCellSize(size: number) {
        this.cellSize = Math.max(0.001, size);
        const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
        this.divisions = Math.floor(avgAxis / this.cellSize);
        return this;
    }
}



export class Axis3DGroup {
    public lines: AxisLinesProgram;
    public cones?: AxisConesProgram;
    public grid?: AxisGridProgram;

    constructor(
        private gl: WebGL2RenderingContext,
        public axisLengths: Vector3D = new Vector3D(1, 1, 1),
        public drawArrows: boolean = false,
        public arrowHeights: Vector3D = new Vector3D(0.1, 0.1, 0.1),
        public arrowRadii: Vector3D = new Vector3D(0.03, 0.03, 0.03),
        public planes: ArrayPlano = []
    ) {
        this.lines = new AxisLinesProgram(gl, axisLengths);
        if (drawArrows) this.cones = new AxisConesProgram(gl, this.arrowHeights, this.arrowRadii, axisLengths);
        if (planes && planes.length > 0) this.grid = new AxisGridProgram(gl, planes, this.axisLengths);
    }
    public gridDivisions:number=10;
    /**
     * Inicializa uniforms y crea VAOs necesarios para cada subprograma.
     * Llamar a esta función después de loadAll() y antes del primer draw().
     */
    initUniforms() {
        // Lines: set axis lengths uniform
        this.lines.use();
        this.lines.initUniforms?.();
        this.lines.setAxisLengths(this.axisLengths.x, this.axisLengths.y, this.axisLengths.z);

        // Cones: set params and create VAO if needed
        if (this.cones) {
            // pasar parámetros a cones
            this.cones.axisLengths = this.axisLengths;
            this.cones.arrowHeights = this.arrowHeights;
            this.cones.arrowRadii = this.arrowRadii;

            // Si el programa ya está compilado, actualizar uniforms internos
            // if (this.cones.initUniforms) this.cones.initUniforms();
            this.cones.use();
            this.cones.initUniforms();

            // crear VAO de conos y guardarlo
            this.cones.initVAO();
        }

        // Grid: set planes info and create VAO
        if (this.grid) {
            this.grid.use();
            this.grid.planes = this.planes;
            this.grid.axisLengths = this.axisLengths;
            this.grid.setDivisions(this.gridDivisions)

            // crear VAO de rejilla (podría depender de qué planos se pidan;
            // aquí asumimos una sola VAO que dibuja una rejilla en XZ por defecto).
            this.grid.initVAO();
            this.grid.initUniforms();
        }

        return this;
    }

    /** Dibuja los tres elementos (usa VAOs creados en initUniforms) */
    draw(camera?: Camera3D) {
        // Lines: dibuja siempre con su propio programa
        if (this.lines) {
            this.lines.use();
            this.lines.uVec("axisLengths", 3).set([this.axisLengths.x, this.axisLengths.y, this.axisLengths.z]);
            this.lines.draw(camera as any); // tu draw interno ignora parámetros y usa matrices ya puestas
        }

        // Grid: si existe, dibujar usando gridVAO creado
        if (this.grid) {
            this.grid.use();
            if(!this.grid.VAO) this.grid.initVAO();
            this.grid.draw(camera);
        }

        // Cones: si existen, dibujar usando conesVAO creado
        if (this.cones) {
            this.cones.use();
            // actualizar uniforms por si cambiaron
            this.cones.axisLengths = this.axisLengths;
            this.cones.arrowHeights = this.arrowHeights;
            this.cones.arrowRadii = this.arrowRadii;
            if(!this.cones.VAO) this.cones.initVAO();
            this.cones.draw(camera);
        }
    }

    /** helpers para actualizar parámetros en caliente */
    setAxisLengths(x: number, y: number, z: number) {
        this.axisLengths = new Vector3D(x, y, z);
        this.lines.setAxisLengths(x, y, z);
        if (this.cones) this.cones.axisLengths = this.axisLengths;
        if(this.grid)
            this.grid.axisLengths = this.axisLengths;
        return this;
    }

    setArrowParams(heights: Vector3D, radii: Vector3D) {
        this.arrowHeights = heights;
        this.arrowRadii = radii;
        if (this.cones) {
            this.cones.arrowHeights = heights;
            this.cones.arrowRadii = radii;
            // si ya había VAO y quieres regenerarlo:
            this.cones.initVAO();
        }
        return this;
    }

    setPlanes(planes: ArrayPlano) {
        this.planes = planes;
        if (this.grid) {
            this.grid.planes = planes;
            // recrear VAO si la implementación de grid depende de los planos
            this.grid.initVAO();
        } else {
            // crear el programa de grid si no existía
            this.grid = new AxisGridProgram(this.gl, planes, this.axisLengths);
            // deberías cargar y luego initUniforms y crear VAO
        }
        return this;
    }
    /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
    setDivisions(divisions: number) {
        this.gridDivisions=divisions;
        if(this.grid)
            return this.grid.setDivisions(divisions);
        return this;
    }

    /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
    setCellSize(size: number) {
        if(this.grid)
            return this.grid.setCellSize(size);
        return this;
    }
    includeInWebManList(){
        if(this.lines)
            this.lines.includeInWebManList();
        if(this.grid)
            this.grid.includeInWebManList();
        if(this.cones)
            this.cones.includeInWebManList();
        return this;
    }
    async loadProgram(){
        if(this.lines)
            await this.lines.loadProgram();
        if(this.grid)
            await this.grid.loadProgram();
        if(this.cones)
            await this.cones.loadProgram();
        return this;
    }
    use(){
        return this;
    }
}




export class MeshFillerProgram extends WebProgram {
    // Cambiamos la estructura para almacenar el objeto uniform devuelto por tus funciones
    private uniformsToUpdate: Array<{ setterObj: any, getter: () => any }> = [];

    constructor(gl: WebGL2RenderingContext, public valsTexUnit: string = "TexUnit20", public w = 1024, public h = 1024, callBackString?, varsContext={}) {
        super(gl, "", "");
        if(callBackString)
            this.generateProgram(callBackString, varsContext)
        
        // ESTO ES VITAL: Habilita el renderizado en buffers flotantes
        const ext = gl.getExtension('EXT_color_buffer_float');
        if (!ext) {
            console.error("Este navegador/GPU no permite renderizar en RFloat.");
        }
    }

    override async loadProgram(vs: string = this.vertPath, fs: string = this.fragPath): Promise<this> {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, vs, fs);
        
        // --- NUEVO: Inicializar los setters de los uniforms tras cargar el programa ---
        this.use(); // Importante: el programa debe estar activo
        this.uniformsToUpdate.forEach(u => {
            // Asumimos que los uniforms de contexto son floats por defecto
            // pero podrías extender la lógica según el 'glslType' parseado
            u.setterObj = this.uFloat((u as any).name); 
        });

        return this;
    }

    /**
     * Se ejecuta en cada frame del loop de renderizado (tick).
     * Obtiene los valores actuales del contexto y los sube a la GPU.
     */
    tick() {
        if (!this.program) return;
        
        this.use();
        this.uniformsToUpdate.forEach(u => {
            const currentVal = u.getter();
            // Usamos la función .set que tus funciones (uFloat, uInt...) inyectan en el objeto
            if (u.setterObj && typeof u.setterObj.set === 'function') {
                u.setterObj.set(currentVal);
            }
        });
        return this;
    }

    /**
     * 
     * @param callbackString (x,y) => { cos(-(y/100-({u_time||0, float}*3))) }
     * @param varsContext DetailedParser.ctx.vars, DetailedParser.GlobalContext
     */
    generateProgram(callbackString: string, ...varsContexts) {
        this.uniformsToUpdate = [];
        let uniformDecls = "";
        
        const arrowMatch = callbackString.match(/=>\s*([\s\S]*)$/);
        let body = arrowMatch ? arrowMatch[1].trim() : callbackString;
        if (body.startsWith('{') && body.endsWith('}')) {
            body = body.substring(1, body.length - 1).trim();
        }

        // Regex mejorado para capturar { expresión , tipo }
        // Buscamos el último bloque después de la última coma que parezca un tipo GLSL
        let glslBody = body.replace(/{([^}]+)}/g, (_, content) => {
            // Separar el tipo (float, vec3, etc) buscando la última coma
            let path = content;
            let glslType = "float";

            // Intentamos separar por la última coma que define el tipo
            const lastComma = content.lastIndexOf(',');
            if (lastComma !== -1) {
                const possibleType = content.substring(lastComma + 1).trim();
                // Si lo que sigue a la coma es un tipo GLSL conocido, lo extraemos
                if (/^(float|int|vec[2-4]|mat[2-4]|uint)$/.test(possibleType)) {
                    path = content.substring(0, lastComma).trim();
                    glslType = possibleType;
                }
            }

            // Crear un nombre de uniform válido para GLSL a partir de la expresión
            const safeName = "u_ctx_" + path.replace(/[^a-zA-Z0-9]/g, "_").replace(/__/g, "_").replace(/^_|_$/g, "");
            
            if (!uniformDecls.includes(safeName)) {
                uniformDecls += `uniform ${glslType} ${safeName};\n`;
                

                
                this.uniformsToUpdate.push({
                    name: safeName,
                    setterObj: null,
                    getter: () => {
                        try {
                            // Creamos un scope con las variables actuales
                            const scope = new Proxy({}, {
                                has(target, prop) {
                                    if (typeof prop === 'symbol') return false;

                                    // Comprobamos existencia según el tipo de contenedor
                                    return varsContexts.some(ctx => 
                                        ctx instanceof Map ? ctx.has(prop) : prop in ctx
                                    );
                                },

                                get(target, prop) {
                                    // Vital para evitar que 'with' ignore el proxy en entornos modernos
                                    if (prop === Symbol.unscopables) return undefined;

                                    // Buscamos de atrás hacia adelante (prioridad al último contexto añadido)
                                    for (let i = varsContexts.length - 1; i >= 0; i--) {
                                        const ctx = varsContexts[i];
                                        
                                        if (ctx instanceof Map) {
                                            if (ctx.has(prop as string)) return ctx.get(prop as string);
                                        } else {
                                            if (prop in ctx) return ctx[prop as string];
                                        }
                                    }
                                    return undefined;
                                }
                            });
                            
                            // Evaluamos la expresión completa (soporta ||, *, .propiedades, etc)
                            // Usamos 'with' para que u_time se resuelva desde el scope
                            const evalFunc = new Function('scope', `with(scope) { return ${path}; }`);
                            let res=evalFunc(scope);
                            return res;
                        } catch(e) { 
                            return 0; 
                        }
                    }
                } as any);
            }
            return safeName;
        });

        const transpileMath = (str: string): string => {
            str = str.replace(/Math\./g, "");
            // Asegurar que los números sean floats para GLSL (1 -> 1.0)
            str = str.replace(/(?<![\w\.])(\d+)(?![\w\.])/g, "$1.0");
            
            // Manejo de potencias **
            while (str.includes('**')) {
                let opIdx = str.indexOf('**');
                let left = opIdx - 1, base = "";
                if (str[left] === ')') {
                    let count = 0, i = left;
                    for (; i >= 0; i--) {
                        if (str[i] === ')') count++;
                        if (str[i] === '(') count--;
                        if (count === 0) { i--; break; }
                    }
                    base = str.substring(i + 1, left + 1);
                } else {
                    let match = str.substring(0, opIdx).match(/([\w\.\$]+)$/);
                    base = match ? match[1] : "";
                }
                let right = opIdx + 2, exponent = "";
                if (str[right] === '(') {
                    let count = 0, i = right;
                    for (; i < str.length; i++) {
                        if (str[i] === '(') count++;
                        if (str[i] === ')') count--;
                        if (count === 0) break;
                    }
                    exponent = str.substring(right, i + 1);
                } else {
                    let match = str.substring(right).match(/^([\w\.\$]+)/);
                    exponent = match ? match[1] : "";
                }
                str = str.replace(base + "**" + exponent, `pow(${base}, ${exponent})`);
            }
            return str;
        };

        glslBody = transpileMath(glslBody);

        // Reemplazo de operadores lógicos de JS (||) por funciones compatibles o lógica GLSL
        // Nota: GLSL no tiene || para floats. Si la expresión JS usaba ||, 
        // el valor ya viene resuelto por el getter. El glslBody solo necesita el nombre del uniform.

        if (glslBody.includes('return')) {
            glslBody = glslBody.replace(/return\s+([^;]+);?/, "float res = $1;");
        } else {
            glslBody = `float res = ${glslBody.replace(/;$/, "")};`;
        }

        this.vertPath = `#version 300 es
            const vec2 quad[6] = vec2[](
                vec2(-1,-1), vec2(1,-1), vec2(-1,1),
                vec2(-1,1), vec2(1,-1), vec2(1,1)
            );
            void main() { gl_Position = vec4(quad[gl_VertexID], 0.0, 1.0); }`;

        this.fragPath = `#version 300 es
            precision highp float;
            ${uniformDecls}
            layout(location = 0) out float outRed; 
            void main() {
                float x = gl_FragCoord.x;
                float y = gl_FragCoord.y;
                ${glslBody}
                outRed = res;
            }`;
        console.log("Shader generado con uniforms complejos:", this.fragPath);
    }


    draw() {
        if (!this.program) return;
        
        const gl = this.gl;
        this.use();
        // 1. Obtener la textura destino
        const tex = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit as any));
        // console.log("La textura es",tex,"vals",parseTexUnitType(this.valsTexUnit as any))

        if(!tex) return;

        const tw = (tex as any).w ?? this.w;
        const th = (tex as any).h ?? this.h;

        // 2. Usar FBO pero sin crear memoria extra
        // Tu función cFrameBuffer() ya debería devolver un objeto FBO
        let fbo = this.cFrameBuffer().bind([0]);

        // 3. Adjuntar la textura RFloat al punto 0
        // WebGL mapeará 'outRed' (location 0) a este adjunto
        fbo.bindColorBuffer(tex, "ColAtch0"); 

        
        // --- COMPROBACIÓN DE ESTADO ---
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            // Si entra aquí, el error es el formato de la textura o la falta de la extensión
            console.error("FBO status:", status, "tex:", tex, "texWH:", tw, th, "progWH:", this.w, this.h);
            this.unbindFBO();
            return this;
        }

        // 4. Limpiar y Dibujar
        gl.viewport(0, 0, this.w, this.h);
        // Opcional: gl.clear(gl.COLOR_BUFFER_BIT); 
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        this.unbindFBO();
        // No borres el FBO aquí si vas a usarlo en el tick, 
        // pero si lo creas nuevo cada vez, bórralo.
        return this;
    }

}
