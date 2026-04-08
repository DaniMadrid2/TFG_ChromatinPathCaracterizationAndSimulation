import { TexExamples, WebProgram, parseTexUnitType } from "./webglMan.mjs";
import { loadShadersFromString } from "../opengl/opengl.mjs";
import { Vector3D } from "../Matrix/Matrix.mjs";
export class MeshRenderingProgram extends WebProgram {
    valsTexUnit;
    w;
    h;
    dx;
    dy;
    totalSegments;
    constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, dx = 0.015, dy = 0.015) {
        super(gl, "", "");
        this.valsTexUnit = valsTexUnit;
        this.w = w;
        this.h = h;
        this.dx = dx;
        this.dy = dy;
    }
    async loadProgram(vs, fs) {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, `#version 300 es
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
            }`, `#version 300 es
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
            `);
        return this;
    }
    setSize(w = this.w, h = this.h) {
        this.w = w;
        this.h = h;
        let totalY = h;
        let horizSegments = (w - 1) * totalY;
        let vertSegments = w * (totalY - 1);
        this.totalSegments = horizSegments + vertSegments;
        this.uInt("msdLength").set(this.w);
        this.uInt("msdCount").set(this.h);
        return this;
    }
    setOffset(x, y, z) {
        this.uVec("offPos", 3).set([x, y, z]);
        return this;
    }
    setDXDY(dx, dy) {
        this.uFloat("dx").set(dx);
        this.uFloat("dy").set(dy);
        return this;
    }
    setPerXPerY(px = 0.5, py = 0.5) {
        this.uFloat("xPer").set(px);
        this.uFloat("yPer").set(py);
        return this;
    }
    setColorHueScale(scale = 1) {
        this.uFloat("colorHueScale").set(scale);
        return this;
    }
    setYScale(scale = 0.5) {
        this.uFloat("yScale").set(scale);
        return this;
    }
    initUniforms() {
        this.setSize(this.w, this.h).setOffset(0, 0, 0).setDXDY(this.dx, this.dy)
            .setPerXPerY().setColorHueScale().setYScale();
        return this;
    }
    draw(x = 0, y = 0, w = 1080, h = 720, camera, mode = "LINES") {
        this.initDepthBefDraw();
        this.bindTexName2TexUnit("values", this.valsTexUnit);
        if (camera) {
            camera.calculateMatrices().setUniformsProgram(this);
        }
        this.setViewport(x, y, w, h);
        this.clearColor();
        this.drawArrays(mode, 0, this.totalSegments * 2);
    }
    createIdealTexture(texUnit = this.valsTexUnit, data, w = this.w, h = this.h) {
        let arrdata;
        if (typeof data == "function" && typeof data(0, 0) == "number") {
            arrdata = new Float32Array(w * h);
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    arrdata[i * w + j] = data(i, j) || 0;
                }
            }
        }
        return this.texture2D({
            format: TexExamples.RFloat,
            size: [w, h],
            texUnit: texUnit,
            data: arrdata || data
        });
    }
    fillMeshTexture(texture2D, data, w = this.w, h = this.h) {
        let arrdata;
        if (typeof data == "function" && typeof data(0, 0) == "number") {
            arrdata = new Float32Array(w * h);
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    arrdata[i * w + j] = data(i, j) || 0;
                }
            }
        }
        texture2D.fill(arrdata, 0, 0, w, h);
    }
}
export class AxisLinesProgram extends WebProgram {
    axisLengths;
    constructor(gl, axisLengths = new Vector3D(1, 1, 1)) {
        super(gl, "", "");
        this.axisLengths = axisLengths;
    }
    async loadProgram() {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, `#version 300 es
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
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main() { outColor = vec4(vColor, 1.0); }`);
        return this;
    }
    initUniforms() {
        this.uVec("axisLengths", 3).set(this.axisLengths);
    }
    setAxisLengths(x, y, z) {
        this.axisLengths = new Vector3D(x, y, z);
        this.uVec("axisLengths", 3).set(this.axisLengths);
        return this;
    }
    draw(camera) {
        if (camera)
            camera.calculateMatrices().setUniformsProgram(this);
        this.drawArrays("LINES", 0, 6);
    }
}
export class AxisConesProgram extends WebProgram {
    arrowHeights;
    arrowRadii;
    axisLengths;
    constructor(gl, arrowHeights = new Vector3D(0.1, 0.1, 0.1), arrowRadii = new Vector3D(0.03, 0.03, 0.03), axisLengths = new Vector3D(1, 1, 1)) {
        super(gl, "", "");
        this.arrowHeights = arrowHeights;
        this.arrowRadii = arrowRadii;
        this.axisLengths = axisLengths;
    }
    async loadProgram() {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            layout(location=1) in vec3 aColor;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;

            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = aColor;
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor, 1.0); }`);
        return this;
    }
    initVAO() {
        const steps = 16;
        const vertices = [];
        const colors = [];
        const addCone = (dir, length, height, radius, color) => {
            for (let i = 0; i < steps; i++) {
                const a1 = (i / steps) * Math.PI * 2;
                const a2 = ((i + 1) / steps) * Math.PI * 2;
                const base1 = new Vector3D(dir.x * length + radius * Math.cos(a1), dir.y * length + radius * Math.sin(a1), dir.z * length);
                const base2 = new Vector3D(dir.x * length + radius * Math.cos(a2), dir.y * length + radius * Math.sin(a2), dir.z * length);
                const tip = new Vector3D(dir.x * (length + height), dir.y * (length + height), dir.z * (length + height));
                vertices.push(base1.x, base1.y, base1.z, base2.x, base2.y, base2.z, tip.x, tip.y, tip.z);
                colors.push(...color, ...color, ...color);
            }
        };
        addCone(new Vector3D(1, 0, 0), this.axisLengths.x, this.arrowHeights.x, this.arrowRadii.x, [1, 0, 0]);
        addCone(new Vector3D(0, 1, 0), this.axisLengths.y, this.arrowHeights.y, this.arrowRadii.y, [0, 1, 0]);
        addCone(new Vector3D(0, 0, 1), this.axisLengths.z, this.arrowHeights.z, this.arrowRadii.z, [0, 0, 1]);
        let vao = this.createVAO().bind();
        vao.attribute("aPos", vertices, 3);
        vao.attribute("aColor", colors, 3);
        return vao;
    }
    initUniforms() {
        this.uVec("axisLengths", 3).set(this.axisLengths);
        this.uVec("arrowHeights", 3).set(this.arrowHeights);
        this.uVec("arrowRadii", 3).set(this.arrowRadii);
    }
    draw(camera) {
        if (camera)
            camera.calculateMatrices().setUniformsProgram(this);
        this.bindVAO();
        this.drawArrays("TRIANGLES", 0, 3 * 16 * 3);
    }
}
export class AxisGridProgram extends WebProgram {
    planes;
    axisLengths;
    vertexCount = 0;
    divisions = 10;
    cellSize = 0.1;
    constructor(gl, planes = ["XY"], axisLengths = new Vector3D(1, 1, 1), divisions = 10) {
        super(gl, "", "");
        this.planes = planes;
        this.axisLengths = axisLengths;
        this.setDivisions(divisions);
    }
    async loadProgram() {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, `#version 300 es
            precision highp float;
            layout(location=0) in vec3 aPos;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 vColor;
            void main(){
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(aPos,1.0);
                vColor = vec3(0.3);
            }`, `#version 300 es
            precision highp float;
            in vec3 vColor;
            out vec4 outColor;
            void main(){ outColor = vec4(vColor,1.0); }`);
        return this;
    }
    initUniforms(axisLengths) {
        if (axisLengths)
            this.axisLengths = axisLengths;
        else if (!this.axisLengths)
            this.axisLengths = new Vector3D(1, 1, 1);
    }
    initVAO() {
        const vertices = [];
        for (const plane of this.planes)
            this.addGrid(plane, vertices);
        this.vertexCount = vertices.length / 3;
        if (!this.VAO)
            this.createVAO();
        this.VAO.bind().attribute("aPos", vertices, 3);
        return this;
    }
    addGrid(plane, vertices) {
        const sizeX = this.axisLengths?.x ?? 1.0;
        const sizeY = this.axisLengths?.y ?? 1.0;
        const sizeZ = this.axisLengths?.z ?? 1.0;
        const stepX = sizeX / this.divisions;
        const stepY = sizeY / this.divisions;
        const stepZ = sizeZ / this.divisions;
        if (plane === "XY") {
            for (let i = 0; i <= this.divisions; i++) {
                const x = i * stepX;
                vertices.push(x, 0, 0, x, sizeY, 0);
            }
            for (let i = 0; i <= this.divisions; i++) {
                const y = i * stepY;
                vertices.push(0, y, 0, sizeX, y, 0);
            }
        }
        else if (plane === "XZ") {
            for (let i = 0; i <= this.divisions; i++) {
                const x = i * stepX;
                vertices.push(x, 0, 0, x, 0, sizeZ);
            }
            for (let i = 0; i <= this.divisions; i++) {
                const z = i * stepZ;
                vertices.push(0, 0, z, sizeX, 0, z);
            }
        }
        else if (plane === "YZ") {
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
    draw(camera) {
        if (camera)
            camera.calculateMatrices().setUniformsProgram(this);
        this.bindVAO();
        if (this.vertexCount)
            this.drawArrays("LINES", 0, this.vertexCount);
    }
    setDivisions(divisions) {
        this.divisions = Math.max(1, divisions);
        const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
        this.cellSize = avgAxis / this.divisions;
        return this;
    }
    setCellSize(size) {
        this.cellSize = Math.max(0.001, size);
        const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
        this.divisions = Math.floor(avgAxis / this.cellSize);
        return this;
    }
}
export class Axis3DGroup {
    gl;
    axisLengths;
    drawArrows;
    arrowHeights;
    arrowRadii;
    planes;
    lines;
    cones;
    grid;
    constructor(gl, axisLengths = new Vector3D(1, 1, 1), drawArrows = false, arrowHeights = new Vector3D(0.1, 0.1, 0.1), arrowRadii = new Vector3D(0.03, 0.03, 0.03), planes = []) {
        this.gl = gl;
        this.axisLengths = axisLengths;
        this.drawArrows = drawArrows;
        this.arrowHeights = arrowHeights;
        this.arrowRadii = arrowRadii;
        this.planes = planes;
        this.lines = new AxisLinesProgram(gl, axisLengths);
        if (drawArrows)
            this.cones = new AxisConesProgram(gl, this.arrowHeights, this.arrowRadii, axisLengths);
        if (planes && planes.length > 0)
            this.grid = new AxisGridProgram(gl, planes, this.axisLengths);
    }
    gridDivisions = 10;
    initUniforms() {
        this.lines.use();
        this.lines.initUniforms?.();
        this.lines.setAxisLengths(this.axisLengths.x, this.axisLengths.y, this.axisLengths.z);
        if (this.cones) {
            this.cones.axisLengths = this.axisLengths;
            this.cones.arrowHeights = this.arrowHeights;
            this.cones.arrowRadii = this.arrowRadii;
            this.cones.use();
            this.cones.initUniforms();
            this.cones.initVAO();
        }
        if (this.grid) {
            this.grid.use();
            this.grid.planes = this.planes;
            this.grid.axisLengths = this.axisLengths;
            this.grid.setDivisions(this.gridDivisions);
            this.grid.initVAO();
            this.grid.initUniforms();
        }
        return this;
    }
    draw(camera) {
        if (this.lines) {
            this.lines.use();
            this.lines.uVec("axisLengths", 3).set([this.axisLengths.x, this.axisLengths.y, this.axisLengths.z]);
            this.lines.draw(camera);
        }
        if (this.grid) {
            this.grid.use();
            if (!this.grid.VAO)
                this.grid.initVAO();
            this.grid.draw(camera);
        }
        if (this.cones) {
            this.cones.use();
            this.cones.axisLengths = this.axisLengths;
            this.cones.arrowHeights = this.arrowHeights;
            this.cones.arrowRadii = this.arrowRadii;
            if (!this.cones.VAO)
                this.cones.initVAO();
            this.cones.draw(camera);
        }
    }
    setAxisLengths(x, y, z) {
        this.axisLengths = new Vector3D(x, y, z);
        this.lines.setAxisLengths(x, y, z);
        if (this.cones)
            this.cones.axisLengths = this.axisLengths;
        if (this.grid)
            this.grid.axisLengths = this.axisLengths;
        return this;
    }
    setArrowParams(heights, radii) {
        this.arrowHeights = heights;
        this.arrowRadii = radii;
        if (this.cones) {
            this.cones.arrowHeights = heights;
            this.cones.arrowRadii = radii;
            this.cones.initVAO();
        }
        return this;
    }
    setPlanes(planes) {
        this.planes = planes;
        if (this.grid) {
            this.grid.planes = planes;
            this.grid.initVAO();
        }
        else {
            this.grid = new AxisGridProgram(this.gl, planes, this.axisLengths);
        }
        return this;
    }
    setDivisions(divisions) {
        this.gridDivisions = divisions;
        if (this.grid)
            return this.grid.setDivisions(divisions);
        return this;
    }
    setCellSize(size) {
        if (this.grid)
            return this.grid.setCellSize(size);
        return this;
    }
    includeInWebManList() {
        if (this.lines)
            this.lines.includeInWebManList();
        if (this.grid)
            this.grid.includeInWebManList();
        if (this.cones)
            this.cones.includeInWebManList();
        return this;
    }
    async loadProgram() {
        if (this.lines)
            await this.lines.loadProgram();
        if (this.grid)
            await this.grid.loadProgram();
        if (this.cones)
            await this.cones.loadProgram();
        return this;
    }
    use() {
        return this;
    }
}
export class MeshFillerProgram extends WebProgram {
    valsTexUnit;
    w;
    h;
    uniformsToUpdate = [];
    constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, callBackString, varsContext = {}) {
        super(gl, "", "");
        this.valsTexUnit = valsTexUnit;
        this.w = w;
        this.h = h;
        if (callBackString)
            this.generateProgram(callBackString, varsContext);
        const ext = gl.getExtension('EXT_color_buffer_float');
        if (!ext) {
            console.error("Este navegador/GPU no permite renderizar en RFloat.");
        }
    }
    async loadProgram(vs = this.vertPath, fs = this.fragPath) {
        [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, vs, fs);
        this.use();
        this.uniformsToUpdate.forEach(u => {
            u.setterObj = this.uFloat(u.name);
        });
        return this;
    }
    tick() {
        if (!this.program)
            return;
        this.use();
        this.uniformsToUpdate.forEach(u => {
            const currentVal = u.getter();
            if (u.setterObj && typeof u.setterObj.set === 'function') {
                u.setterObj.set(currentVal);
            }
        });
        return this;
    }
    generateProgram(callbackString, ...varsContexts) {
        this.uniformsToUpdate = [];
        let uniformDecls = "";
        const arrowMatch = callbackString.match(/=>\s*([\s\S]*)$/);
        let body = arrowMatch ? arrowMatch[1].trim() : callbackString;
        if (body.startsWith('{') && body.endsWith('}')) {
            body = body.substring(1, body.length - 1).trim();
        }
        let glslBody = body.replace(/{([^}]+)}/g, (_, content) => {
            let path = content;
            let glslType = "float";
            const lastComma = content.lastIndexOf(',');
            if (lastComma !== -1) {
                const possibleType = content.substring(lastComma + 1).trim();
                if (/^(float|int|vec[2-4]|mat[2-4]|uint)$/.test(possibleType)) {
                    path = content.substring(0, lastComma).trim();
                    glslType = possibleType;
                }
            }
            const safeName = "u_ctx_" + path.replace(/[^a-zA-Z0-9]/g, "_").replace(/__/g, "_").replace(/^_|_$/g, "");
            if (!uniformDecls.includes(safeName)) {
                uniformDecls += `uniform ${glslType} ${safeName};\n`;
                this.uniformsToUpdate.push({
                    name: safeName,
                    setterObj: null,
                    getter: () => {
                        try {
                            const scope = new Proxy({}, {
                                has(target, prop) {
                                    if (typeof prop === 'symbol')
                                        return false;
                                    return varsContexts.some(ctx => ctx instanceof Map ? ctx.has(prop) : prop in ctx);
                                },
                                get(target, prop) {
                                    if (prop === Symbol.unscopables)
                                        return undefined;
                                    for (let i = varsContexts.length - 1; i >= 0; i--) {
                                        const ctx = varsContexts[i];
                                        if (ctx instanceof Map) {
                                            if (ctx.has(prop))
                                                return ctx.get(prop);
                                        }
                                        else {
                                            if (prop in ctx)
                                                return ctx[prop];
                                        }
                                    }
                                    return undefined;
                                }
                            });
                            const evalFunc = new Function('scope', `with(scope) { return ${path}; }`);
                            let res = evalFunc(scope);
                            return res;
                        }
                        catch (e) {
                            return 0;
                        }
                    }
                });
            }
            return safeName;
        });
        const transpileMath = (str) => {
            str = str.replace(/Math\./g, "");
            str = str.replace(/(?<![\w\.])(\d+)(?![\w\.])/g, "$1.0");
            while (str.includes('**')) {
                let opIdx = str.indexOf('**');
                let left = opIdx - 1, base = "";
                if (str[left] === ')') {
                    let count = 0, i = left;
                    for (; i >= 0; i--) {
                        if (str[i] === ')')
                            count++;
                        if (str[i] === '(')
                            count--;
                        if (count === 0) {
                            i--;
                            break;
                        }
                    }
                    base = str.substring(i + 1, left + 1);
                }
                else {
                    let match = str.substring(0, opIdx).match(/([\w\.\$]+)$/);
                    base = match ? match[1] : "";
                }
                let right = opIdx + 2, exponent = "";
                if (str[right] === '(') {
                    let count = 0, i = right;
                    for (; i < str.length; i++) {
                        if (str[i] === '(')
                            count++;
                        if (str[i] === ')')
                            count--;
                        if (count === 0)
                            break;
                    }
                    exponent = str.substring(right, i + 1);
                }
                else {
                    let match = str.substring(right).match(/^([\w\.\$]+)/);
                    exponent = match ? match[1] : "";
                }
                str = str.replace(base + "**" + exponent, `pow(${base}, ${exponent})`);
            }
            return str;
        };
        glslBody = transpileMath(glslBody);
        if (glslBody.includes('return')) {
            glslBody = glslBody.replace(/return\s+([^;]+);?/, "float res = $1;");
        }
        else {
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
        if (!this.program)
            return;
        const gl = this.gl;
        this.use();
        const tex = WebProgram.Textures[parseTexUnitType(this.valsTexUnit)];
        if (!tex)
            return;
        let fbo = this.cFrameBuffer().bind([0]);
        fbo.bindColorBuffer(tex, "ColAtch0");
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer Incompleto. Status:", status.toString(16));
            this.unbindFBO();
            return this;
        }
        gl.viewport(0, 0, this.w, this.h);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        this.unbindFBO();
        return this;
    }
}
