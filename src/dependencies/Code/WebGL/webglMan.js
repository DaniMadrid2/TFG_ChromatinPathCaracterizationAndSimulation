var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Matrix2D, Matrix3D, Matrix4D } from "../Matrix/Matrix.js";
import { loadShaders } from "../opengl/opengl.js";
import { HSLtoRGB } from "../Utils/utils.js";
export class WebGLMan {
    constructor(gl = WebGLMan === null || WebGLMan === void 0 ? void 0 : WebGLMan.gl, dirPath) {
        var _a;
        this.gl = gl;
        this.dirPath = dirPath;
        this.programs = [];
        if (!this.dirPath) {
            this.dirPath = "/glsl";
            let stdir = window.dntiDir || window.blogDirName;
            if (!!window && !!stdir) {
                this.dirPath = stdir + this.dirPath;
            }
            console.log("webgl main path:", this.dirPath);
        }
        if (WebGLMan.stWebGLMan)
            (_a = WebGLMan.stWebGLMan).gl || (_a.gl = gl);
    }
    static setGL(gl, path = WebGLMan.stWebGLMan.dirPath) {
        var _a;
        WebGLMan.stWebGLMan.dirPath = path;
        (_a = WebGLMan.stWebGLMan).gl || (_a.gl = gl);
        return this;
    }
    static get gl() {
        var _a;
        return (_a = WebGLMan === null || WebGLMan === void 0 ? void 0 : WebGLMan.stWebGLMan) === null || _a === void 0 ? void 0 : _a.gl;
    }
    static get programs() {
        return this.stWebGLMan.programs;
    }
    static get dirPath() {
        return this.stWebGLMan.dirPath;
    }
    static set gl(gl) {
        this.stWebGLMan.gl = gl;
    }
    static set programs(programs) {
        this.stWebGLMan.programs = programs;
    }
    static set dirPath(dirPath) {
        this.stWebGLMan.dirPath = dirPath;
    }
    static program(ID = WebGLMan.stWebGLMan.programs.length, vertPath = "", fragPath = "") {
        return WebGLMan.stWebGLMan.program(ID, vertPath, fragPath);
    }
    program(ID = this.programs.length, vertPath = "", fragPath = "") {
        if (ID < 0)
            ID = this.programs.length;
        if (!!vertPath.trim() && !fragPath.trim()) {
            fragPath = vertPath + ".frag";
            vertPath = vertPath + ".vert";
        }
        let p = new WebProgram(this.gl, this.dirPath + "/" + vertPath, this.dirPath + "/" + fragPath);
        this.programs[ID] = p;
        p.ID = ID;
        return p;
    }
    static includeExternalProgram(p) {
        var _a;
        let ID = (_a = p.ID) !== null && _a !== void 0 ? _a : -1;
        if (ID < 0 || this.programs[ID] != p)
            ID = WebGLMan.stWebGLMan.programs.length;
        WebGLMan.programs[ID] = p;
        p.ID = ID;
        return p;
    }
    static getProgramByID(ID) {
        return WebGLMan.stWebGLMan.programs[ID];
    }
    getProgramByID(ID) {
        return this.programs[ID];
    }
}
WebGLMan.stWebGLMan = new WebGLMan();
export class WebProgram {
    constructor(gl, vertPath = "", fragPath = "") {
        this.gl = gl;
        this.vertPath = vertPath;
        this.fragPath = fragPath;
        this.nUsedTextures = 0;
        this.standardTEXW = 1080;
        this.standardTEXH = 720;
        this.viewportW = 1080;
        this.viewportH = 720;
        this.uniforms = new Map();
        this.textures = [];
        this.VAOs = [];
        this.currentVAO = -1;
        this.isDepthTest = true;
        this.depthFunction = "LESS";
    }
    loadProgram(vp = this.vertPath, fp = this.fragPath, vertexFilter = (a) => a, fragmentFilter = (a) => a) {
        return __awaiter(this, void 0, void 0, function* () {
            [this.program, this.vert, this.frag] = yield loadShaders(this.gl, vp, fp, vertexFilter, fragmentFilter);
            return this;
        });
    }
    use() {
        this.gl.useProgram(this.program);
        return this;
    }
    isWebProgram() {
        return true;
    }
    includeInWebManList() {
        WebGLMan.includeExternalProgram(this);
        return this;
    }
    get VAO() {
        return this.VAOs[this.currentVAO];
    }
    createVAO() {
        let vao = new VAO(this.gl, this.program);
        this.VAOs.push(vao);
        if (this.currentVAO < 0)
            this.currentVAO = 0;
        return vao;
    }
    bindVAO(number = this.currentVAO) {
        this.currentVAO = number;
        this.VAO.bind();
        return this;
    }
    unbindVAO() {
        this.gl.bindVertexArray(null);
        return this;
    }
    createTexture2D(name, size = [this.standardTEXW, this.standardTEXH], format = TexExamples.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
        let tex = this.gl.createTexture();
        texUnit = parseTexUnitType(texUnit);
        let nTexture = texUnit || this.nUsedTextures;
        if ((FILTER_WRAP[0] == "LINEAR" || FILTER_WRAP[1] == "LINEAR") &&
            (format[2] == this.gl.FLOAT))
            console.error("%cTexture error: Float textures dont accept LINEAR LOD FILTERING", "color:red;font-weight:bold;");
        this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        FILTER_WRAP = FILTER_WRAP.map(a => {
            if (a == "NEAREST")
                return WebGL2RenderingContext.NEAREST;
            if (a == "LINEAR")
                return WebGL2RenderingContext.LINEAR;
            if (a == "CLAMP")
                return WebGL2RenderingContext.CLAMP_TO_EDGE;
            if (a == "REPEAT")
                return WebGL2RenderingContext.REPEAT;
            if (a == "MIRROR")
                return WebGL2RenderingContext.MIRRORED_REPEAT;
            return a;
        });
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, LODlevel, format[1] || this.gl.RGBA32F, size[0], size[1], 0, format[0] || this.gl.RGBA, format[2] || this.gl.FLOAT, data || null);
        if (!!name && !!name.trim()) {
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        this.nUsedTextures++;
        tex.fill = (arr, x = 0, y = 0, w = size[0], h = size[1], LOD = LODlevel) => {
            if (tex.unit !== undefined)
                this.gl.activeTexture(this.gl.TEXTURE0 + tex.unit);
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.texSubImage2D(this.gl.TEXTURE_2D, LOD, x, y, w, h, format[0], format[2], arr);
            return tex;
        };
        tex.unit = nTexture;
        tex.bind = (textureUnit = tex.unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit != -1) {
                this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
            }
            tex.unit = textureUnit;
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            return tex;
        };
        tex.unbind = (textureUnit = tex.unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit != -1) {
                this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
            }
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            return tex;
        };
        tex.w = size[0];
        tex.h = size[1];
        tex.xoff = 0;
        tex.yoff = 0;
        tex.format = format;
        WebProgram.Textures[parseTexUnitType(tex.unit)] = tex;
        this.textures[parseTexUnitType(tex.unit)] = tex;
        return tex;
    }
    texture2D(params = {
        size: [this.standardTEXW, this.standardTEXH],
        format: TexExamples.RGBAFloat,
        data: null,
        FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
        LODlevel: 0
    }) {
        return this.createTexture2D(params.name, params.size, params.format, params.data, params.FILTER_WRAP, params.texUnit, params.LODlevel);
    }
    loadLongArray2GPUTextures(array, basename, startTextureUnit, format = TexExamples.RFloat, FILTER_WRAP) {
        startTextureUnit = parseTexUnitType(startTextureUnit);
        let arrLength = array.length;
        let maxLength = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        let lastTexureUnit = Math.floor(arrLength / maxLength) + startTextureUnit;
        let remainder = arrLength % maxLength;
        if (lastTexureUnit > 31) {
            console.error("loadLongArray2GPUTextures couldnt load into textureUnits, array too big" +
                " ( last textureUnit used" + lastTexureUnit + ", max is 31 ), using 31 maximum");
            lastTexureUnit = 31;
        }
        for (let i = startTextureUnit; i <= lastTexureUnit; i++) {
            let diffi = i - startTextureUnit;
            this.texture2D({
                name: basename + (!diffi ? "" : diffi),
                texUnit: i,
                data: array.subarray(diffi * maxLength, (diffi + 1) * maxLength),
                size: [i == lastTexureUnit ? remainder : maxLength, 1],
                format, FILTER_WRAP
            });
        }
        let returnObj = { startTextureUnit, lastTexureUnit, maxLength,
            nextTexureUnit: lastTexureUnit + 1,
            setLengthUniforms: () => {
                this.uInt(basename + "Length").set(maxLength);
                return returnObj;
            }
        };
        return returnObj;
    }
    texture2DFromImage(img, name, format = TexExamples.RGBAFloat, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, LODlevel = 0) {
        return this.createTexture2D(name, [img.width, img.height], format, img, FILTER_WRAP, texUnit, LODlevel);
    }
    bindTextureUnit2Uniform(texUnit = this.nUsedTextures, name) {
        if (texUnit == this.nUsedTextures) {
            this.nUsedTextures++;
        }
        if (!!name && !!name.trim()) {
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), texUnit);
        }
        return this;
    }
    getTextureFromUnit(texUnit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + parseTexUnitType(texUnit));
        const texture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D)
            || this.gl.getParameter(this.gl.TEXTURE_BINDING_2D_ARRAY)
            || this.gl.getParameter(this.gl.TEXTURE_BINDING_3D);
        return texture;
    }
    uTexUnit(texUnit = this.nUsedTextures, name) {
        this.bindTextureUnit2Uniform(texUnit, name);
        return this;
    }
    bindNewTexture(tex, name) {
        var _a, _b;
        let nTexture = this.nUsedTextures;
        this.nUsedTextures++;
        this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        if (!!name && !!name.trim()) {
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        WebProgram.Textures[(_a = parseTexUnitType(nTexture)) !== null && _a !== void 0 ? _a : tex.unit] = tex;
        this.textures[(_b = parseTexUnitType(nTexture)) !== null && _b !== void 0 ? _b : tex.unit] = tex;
        return nTexture;
    }
    bindTexture(tex, name, nTexture = 0) {
        var _a, _b, _c;
        nTexture = (_a = parseTexUnitType(nTexture)) !== null && _a !== void 0 ? _a : tex.unit;
        this.gl.activeTexture(this.gl.TEXTURE0 + nTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        if (!!name && !!name.trim()) {
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        WebProgram.Textures[(_b = parseTexUnitType(nTexture)) !== null && _b !== void 0 ? _b : tex.unit] = tex;
        this.textures[(_c = parseTexUnitType(nTexture)) !== null && _c !== void 0 ? _c : tex.unit] = tex;
        return nTexture;
    }
    getTextureByUnit(texUnit) {
        const n = parseTexUnitType(texUnit);
        return this.textures[n] || WebProgram.Textures[n];
    }
    bindTexName2TexUnit(name, nTexture = 0) {
        nTexture = parseTexUnitType(nTexture);
        if (!!name && !!name.trim()) {
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), nTexture);
        }
        return this;
    }
    createTexture2DArray(name, size = [this.standardTEXW, this.standardTEXH, 1], format = TexExamples.RGBAFloat, data = null, FILTER_WRAP = ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], texUnit, MIPlevel = 0) {
        const gl = this.gl;
        const tex = gl.createTexture();
        texUnit = parseTexUnitType(texUnit);
        const nTexture = texUnit !== null && texUnit !== void 0 ? texUnit : this.nUsedTextures;
        if ((FILTER_WRAP[0] === "LINEAR" || FILTER_WRAP[1] === "LINEAR") && format[2] === gl.FLOAT)
            console.error("%cTexture error: Float textures don’t accept LINEAR filtering", "color:red;font-weight:bold;");
        gl.activeTexture(gl.TEXTURE0 + nTexture);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
        FILTER_WRAP = FILTER_WRAP.map(a => {
            if (a === "NEAREST")
                return gl.NEAREST;
            if (a === "LINEAR")
                return gl.LINEAR;
            if (a === "CLAMP")
                return gl.CLAMP_TO_EDGE;
            if (a === "REPEAT")
                return gl.REPEAT;
            if (a === "MIRROR")
                return gl.MIRRORED_REPEAT;
            return a;
        });
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, FILTER_WRAP[0]);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, FILTER_WRAP[1]);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, FILTER_WRAP[2]);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, FILTER_WRAP[3]);
        if (!size[2] || size[2] <= 0) {
            if (!!data && data.length) {
                size[2] = ~~(data.length / size[1] / size[0]);
            }
            else {
                size[2] = 1;
            }
        }
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, MIPlevel, format[1], size[0], size[1], size[2], 0, format[0], format[2], data);
        if (name === null || name === void 0 ? void 0 : name.trim()) {
            gl.uniform1i(gl.getUniformLocation(this.program, name), nTexture);
        }
        this.nUsedTextures++;
        tex.fill = (arr, x = 0, y = 0, z = 0, w = size[0], h = size[1], d = size[2], LOD = MIPlevel) => {
            if (tex.unit !== undefined)
                gl.activeTexture(gl.TEXTURE0 + tex.unit);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
            gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, LOD, x, y, z, w, h, d, format[0], format[2], arr);
            return tex;
        };
        tex.unit = nTexture;
        tex.bind = (textureUnit = tex.unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit !== -1)
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
            tex.unit = textureUnit;
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
            return tex;
        };
        tex.unbind = (textureUnit = tex.unit) => {
            textureUnit = parseTexUnitType(textureUnit);
            if (textureUnit !== -1)
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
            return tex;
        };
        tex.w = size[0];
        tex.h = size[1];
        tex.nLayers = size[2];
        tex.format = format;
        tex.setLengthUniforms = () => {
            this.uInt(name + "Length").set(tex.w * tex.h);
            return tex;
        };
        return tex;
    }
    texture2DArray(params = {
        size: [this.standardTEXW, this.standardTEXH, 1],
        format: TexExamples.RGBAFloat,
        data: null,
        FILTER_WRAP: ["NEAREST", "NEAREST", "CLAMP", "CLAMP"],
        MIPlevel: 0
    }) {
        var _a, _b, _c, _d, _e;
        return this.createTexture2DArray(params.name, (_a = params.size) !== null && _a !== void 0 ? _a : [this.standardTEXW, this.standardTEXH, undefined], (_b = params.format) !== null && _b !== void 0 ? _b : TexExamples.RGBAFloat, (_c = params.data) !== null && _c !== void 0 ? _c : null, (_d = params.FILTER_WRAP) !== null && _d !== void 0 ? _d : ["NEAREST", "NEAREST", "CLAMP", "CLAMP"], params.texUnit, (_e = params.MIPlevel) !== null && _e !== void 0 ? _e : 0);
    }
    uMat4(name) {
        const uniform = this.gl.getUniformLocation(this.program, name);
        if (!uniform) {
            console.error("uniform", name, "was undefined");
            let undef = { set: () => undef };
            return undef;
        }
        uniform.set = (mat, transpose = false, offset, len) => {
            if (mat instanceof Matrix4D || typeof (mat.toFloat32) == "function") {
                this.gl.uniformMatrix4fv(uniform, transpose, mat.toFloat32(), offset, len);
            }
            else if (mat instanceof Float32Array) {
                this.gl.uniformMatrix4fv(uniform, transpose, mat, offset, len);
            }
            else {
                this.gl.uniformMatrix4fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name] = uniform;
        return uniform;
    }
    uMat3(name) {
        const uniform = this.gl.getUniformLocation(this.program, name);
        if (!uniform) {
            console.error("uniform", name, "was undefined");
            let undef = { set: () => undef };
            return undef;
        }
        uniform.set = (mat, transpose = false, offset, len) => {
            if (mat instanceof Matrix3D || typeof (mat.toFloat32) == "function") {
                this.gl.uniformMatrix3fv(uniform, transpose, mat.toFloat32(), offset, len);
            }
            else if (mat instanceof Float32Array) {
                this.gl.uniformMatrix3fv(uniform, transpose, mat, offset, len);
            }
            else {
                this.gl.uniformMatrix3fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name] = uniform;
        return uniform;
    }
    uMat2(name) {
        const uniform = this.gl.getUniformLocation(this.program, name);
        if (!uniform) {
            console.error("uniform", name, "was undefined");
            let undef = { set: () => undef };
            return undef;
        }
        uniform.set = (mat, transpose = false, offset, len) => {
            if (mat instanceof Matrix2D || typeof (mat.toFloat32) == "function") {
                this.gl.uniformMatrix2fv(uniform, transpose, mat.toFloat32(), offset, len);
            }
            else if (mat instanceof Float32Array) {
                this.gl.uniformMatrix2fv(uniform, transpose, mat, offset, len);
            }
            else {
                this.gl.uniformMatrix2fv(uniform, transpose, new Float32Array(mat), offset, len);
            }
            return uniform;
        };
        this.uniforms[name] = uniform;
        return uniform;
    }
    uVec(name, dimension = 3, isFloat = true, isUnsignedInt = false) {
        const uniform = this.gl.getUniformLocation(this.program, name);
        if (!uniform) {
            console.error("uniform", name, "was undefined");
            let undef = { set: () => undef };
            return undef;
        }
        let func = this.gl[`uniform${Math.min(~~dimension, 4)}${isFloat ? "f" : (isUnsignedInt ? "ui" : "i")}v`];
        uniform.set = (vec, offset, len) => {
            let vcoords;
            let length = 0;
            if (vec === null || vec === void 0 ? void 0 : vec.coords) {
                vcoords = vec.coords;
            }
            else {
                vcoords = vec;
            }
            if (vcoords.length != dimension) {
                let xs = [];
                for (let i = 0; i < dimension; i++) {
                    if (i == 3) {
                        xs = vcoords[i] || 1;
                    }
                    else
                        xs = vcoords[i] || 0;
                }
                func.call(this.gl, uniform, xs, offset, len);
                return uniform;
            }
            func.call(this.gl, uniform, vcoords, offset, len);
            return uniform;
        };
        this.uniforms[name] = uniform;
        return uniform;
    }
    uNum(name, isFloat = true, isUnsignedInt = false) {
        const uniform = this.gl.getUniformLocation(this.program, name);
        if (!uniform) {
            console.error("uniform", name, "was undefined");
            let undef = { set: () => undef };
            return undef;
        }
        let func = this.gl[`uniform1${isFloat ? "f" : (isUnsignedInt ? "ui" : "i")}`];
        uniform.set = (num) => {
            func.call(this.gl, uniform, num);
            return uniform;
        };
        this.uniforms[name] = uniform;
        return uniform;
    }
    uFloat(name) {
        return this.uNum(name, true, false);
    }
    uInt(name) {
        return this.uNum(name, false, false);
    }
    cFrameBuffer() {
        return new FrameBuffer(this.gl, this);
    }
    unbindFrameBuffer() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    }
    unbindFBO() {
        this.unbindFrameBuffer();
        return this;
    }
    setViewport(xoff = 0, yoff = 0, w = this.viewportW, h = this.viewportH) {
        this.viewportW = w;
        this.viewportH = h;
        this.gl.viewport(xoff, yoff, w, h);
        return this;
    }
    clearBuffer(type) {
        this.gl.clear(this.gl[type + "_BUFFER_BIT"]);
        return this;
    }
    clear(type) {
        this.clearBuffer(type);
        return this;
    }
    clearMask(type) {
        this.clearBuffer(type);
        return this;
    }
    clearColor(color = [0.2, 0.2, 0.2, 1.0]) {
        if (typeof color == "string") {
            let [r, g, b, a] = [0, 0, 0, 1];
            if (color.startsWith("hsl")) {
                color = HSLtoRGB(...color.replaceAll(/hsl\(?/gm, "").replaceAll(")", "")
                    .split(",").map(a => parseFloat(a)));
            }
            if (color.startsWith("rgba")) {
                [r, g, b, a] = color.replaceAll(/rgba\(?/gm, "").replaceAll(")", "")
                    .split(",").map(a => parseFloat(a));
            }
            else if (color.startsWith("rgb")) {
                [r, g, b] = color.replaceAll(/rgba?\(?/gm, "").replaceAll(")", "")
                    .split(",").map(a => parseFloat(a));
            }
            if (r > 1 || g > 1 || b > 1 || a > 1) {
                r /= 255;
                g /= 255;
                b /= 255;
                a /= 255;
            }
            this.gl.clearColor(r || 0, g || 0, b || 0, a || 0);
        }
        else {
            this.gl.clearColor(color[0] || 0, color[1] || 0, color[2] || 0, color[3] || 0);
        }
        return this;
    }
    clearDepth(depthValue = 1) {
        this.gl.clearDepth(depthValue);
        return this;
    }
    clearStencil(stencilValue = 1) {
        this.gl.clearStencil(stencilValue);
        return this;
    }
    initDepthBefDraw() {
        if (this.isDepthTest)
            this.gl.enable(this.gl.DEPTH_TEST);
        else
            this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl[this.depthFunction]);
    }
    drawArrays(mode, vaoOff = 0, vertexCount, instanceCount = 1) {
        var _a;
        if (vertexCount == undefined)
            vertexCount = ((_a = this.VAO) === null || _a === void 0 ? void 0 : _a.vaoLength) || 0;
        this.initDepthBefDraw();
        if (instanceCount <= 1)
            this.gl.drawArrays(this.gl[mode], vaoOff, vertexCount);
        else
            this.gl.drawArraysInstanced(this.gl[mode], vaoOff, vertexCount, instanceCount);
        return this;
    }
    drawElements(mode, elementCount = this.VAO.eboLength, type = "UNSIGNED_SHORT", eboOff = 0, instanceCount = 0) {
        this.initDepthBefDraw();
        if (instanceCount <= 0)
            this.gl.drawElements(this.gl[mode], elementCount, this.gl[type], eboOff);
        else
            this.gl.drawElementsInstanced(this.gl[mode], elementCount, this.gl[type], eboOff, instanceCount);
        return this;
    }
    blendEquation(mode = "ADD") {
        if (mode == "MIN" || mode == "MAX")
            this.gl.blendEquation(this.gl[mode]);
        else
            this.gl.blendEquation(this.gl["FUNC_" + mode]);
    }
    blendFunc(sfactor = "ONE", dfactor = "ZERO") {
        this.gl.blendFunc(this.gl[sfactor], this.gl[dfactor]);
    }
    blendColor(r, g, b, a) {
        this.gl.blendColor(r, g, b, a);
    }
    finish() {
        this.gl.finish();
        return this;
    }
}
WebProgram.Textures = [];
export function parseTexUnitType(texUnit) {
    if (!texUnit)
        return texUnit;
    if (typeof texUnit == "number")
        return texUnit;
    return parseInt(texUnit.substring(7));
}
export function parseColAtchType(colAttachment) {
    if (!colAttachment)
        return colAttachment;
    if (typeof colAttachment == "number")
        return colAttachment;
    return parseInt(colAttachment.substring(7));
}
export class FrameBuffer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.colorBuffersUsed = new Array(15).fill(false);
        this.fbo = this.gl.createFramebuffer();
    }
    bind(colorATTACHMENTS) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        if (colorATTACHMENTS)
            this.drawBuffers(colorATTACHMENTS);
        return this;
    }
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    }
    drawBuffers(unitArr = this.colorBuffersUsed.map((a, i) => [a, i]).filter(a => a[0]).map(a => a[1])) {
        this.gl.drawBuffers(unitArr.map(unit => this.gl.COLOR_ATTACHMENT0 + parseColAtchType(unit)));
        return this;
    }
    bindColorBuffer(texture, colorUnit, LODlevel = 0) {
        colorUnit = parseColAtchType(colorUnit);
        if (colorUnit === undefined) {
            if (texture.unit !== undefined)
                colorUnit = texture.unit;
            else
                colorUnit = 0;
        }
        texture.colorUnit = colorUnit;
        this.colorBuffersUsed[colorUnit] = true;
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + colorUnit, this.gl.TEXTURE_2D, texture, LODlevel);
        return this;
    }
    unbindBuffer(colorUnit) {
        colorUnit = parseColAtchType(colorUnit);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + colorUnit, this.gl.TEXTURE_2D, null, 0);
    }
    readColorAttachment(n, x = 0, y = 0, w = this.program.standardTEXW, h = this.program.standardTEXH, format, dimension = 4) {
        let buffer = new Float32Array(w * h * dimension);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType(n));
        this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
        return buffer;
    }
    readColAttchTexture(tex, dimension = 4, x, y, w, h, format, colUnit) {
        var _a;
        let n = (_a = colUnit !== null && colUnit !== void 0 ? colUnit : tex.colorUnit) !== null && _a !== void 0 ? _a : tex.unit;
        x !== null && x !== void 0 ? x : (x = tex.offx);
        y !== null && y !== void 0 ? y : (y = tex.offy);
        w !== null && w !== void 0 ? w : (w = tex.w || this.program.standardTEXW);
        h !== null && h !== void 0 ? h : (h = tex.h || this.program.standardTEXH);
        format !== null && format !== void 0 ? format : (format = tex.format || TexExamples.RGBA);
        let buffer = new Float32Array(w * h * dimension);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + parseColAtchType(n));
        this.gl.readPixels(x, y, w, h, format[0], format[2], buffer);
        return buffer;
    }
    colorMask(r = true, g = true, b = true, a = true) {
        this.gl.colorMask(r, g, b, a);
        return this;
    }
    bindTextureDepthBuffer(texture, LODlevel = 0) {
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, LODlevel);
        return this;
    }
    depthMask(depth) {
        this.gl.depthMask(depth);
        return this;
    }
    cRenderBuffer(type = "DEPTH", quality = "low", w = 256, h = 256, colorUnit = 0) {
        colorUnit = parseColAtchType(colorUnit);
        let attachment = this.gl.COLOR_ATTACHMENT0;
        let ifs = [];
        switch (type) {
            case "STENCIL_INDEX8":
                attachment = this.gl.STENCIL_INDEX8;
                break;
            case "DEPTH_STENCIL":
                ifs = [this.gl.DEPTH_STENCIL, this.gl.DEPTH24_STENCIL8, this.gl.DEPTH32F_STENCIL8];
                attachment = this.gl.DEPTH_STENCIL_ATTACHMENT;
                break;
            case "DEPTH":
                ifs = [this.gl.DEPTH_COMPONENT16, this.gl.DEPTH_COMPONENT24, this.gl.DEPTH_COMPONENT32F];
                attachment = this.gl.DEPTH_ATTACHMENT;
                break;
            case "COLOR":
            default:
                ifs = [this.gl.RGBA4, this.gl.RGB565, this.gl.RGBA8];
                attachment = this.gl.COLOR_ATTACHMENT0 + colorUnit;
                this.colorBuffersUsed[colorUnit] = true;
                break;
        }
        let qidx = quality == "low" ? 0 : quality == "medium" ? 1 : 2;
        let internalFormat = ifs[qidx] || ifs[0];
        const rbo = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rbo);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, internalFormat, w, h);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, rbo);
        return rbo;
    }
    stencilMask(maskNum) {
        this.gl.stencilMask(maskNum);
        return this;
    }
    get _() {
        return this.fbo;
    }
}
export var TexExamples = {
    "RFloat": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R32F, WebGL2RenderingContext.FLOAT],
    "RGFloat": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG32F, WebGL2RenderingContext.FLOAT],
    "RGBFloat": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB32F, WebGL2RenderingContext.FLOAT],
    "RGBAFloat": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA32F, WebGL2RenderingContext.FLOAT],
    "RFloat16": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R16F, WebGL2RenderingContext.FLOAT],
    "RGFloat16": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG16F, WebGL2RenderingContext.FLOAT],
    "RGBFloat16": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB16F, WebGL2RenderingContext.FLOAT],
    "RGBAFloat16": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA16F, WebGL2RenderingContext.FLOAT],
    "R": [WebGL2RenderingContext.RED, WebGL2RenderingContext.R8, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RG": [WebGL2RenderingContext.RG, WebGL2RenderingContext.RG8, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGB": [WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGB8, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBA": [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32I, WebGL2RenderingContext.INT],
    "RGInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32I, WebGL2RenderingContext.INT],
    "RGBInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32I, WebGL2RenderingContext.INT],
    "RGBAInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32I, WebGL2RenderingContext.INT],
    "RInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16I, WebGL2RenderingContext.INT],
    "RGInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16I, WebGL2RenderingContext.INT],
    "RGBInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16I, WebGL2RenderingContext.INT],
    "RGBAInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16I, WebGL2RenderingContext.INT],
    "RInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8I, WebGL2RenderingContext.INT],
    "RGInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8I, WebGL2RenderingContext.INT],
    "RGBInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8I, WebGL2RenderingContext.INT],
    "RGBAInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8I, WebGL2RenderingContext.INT],
    "RUInt": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R32UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG32UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB32UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA32UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RUInt16": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R16UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt16": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG16UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt16": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB16UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt16": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA16UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RUInt8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGUInt8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBUInt8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RGBAUInt8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_INT],
    "RUBYTE8": [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGUBYTE8": [WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBUBYTE8": [WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
    "RGBAUBYTE8": [WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.RGBA8UI, WebGL2RenderingContext.UNSIGNED_BYTE],
};
export class VAO {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.vaoLength = 0;
        this.eboLength = 0;
        this.vao = gl.createVertexArray();
    }
    bind() {
        this.gl.bindVertexArray(this._);
        return this;
    }
    cVBO(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false) {
        const posBuf = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        if (data instanceof Float32Array || data.length) {
            this.vaoLength = ~~(data.length / dimension);
        }
        const posLoc = this.gl.getAttribLocation(this.program, name);
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, dimension, this.gl[type], normalized, stride, offset);
        return posBuf;
    }
    attribute(name, data, dimension = 3, type = "FLOAT", stride = 0, offset = 0, normalized = false) {
        if (!(data instanceof Float32Array))
            data = new Float32Array(data);
        return this.cVBO(name, data, dimension, type, stride, offset, normalized);
    }
    cEBO(indices) {
        const ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
        this.eboLength = indices.length;
        return [ibo, () => {
            }];
    }
    copyBufferFromGPU(src, dst = this.gl.createBuffer(), nBytes, rdOff = 0, wrOff = 0) {
        this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, src);
        this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, dst);
        this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, nBytes, this.gl.STATIC_DRAW);
        this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, rdOff, wrOff, nBytes);
        return dst;
    }
    get _() {
        return this.vao;
    }
}
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
                return function (...args) {
                    var _a;
                    const result = (_a = orig === null || orig === void 0 ? void 0 : orig.apply) === null || _a === void 0 ? void 0 : _a.call(orig, target, args);
                    const err = target.getError();
                    if (err !== target.NO_ERROR) {
                        console.error(`%c[WebGL Error]%c ${prop}(${args.map(a => { var _a; return (_a = a === null || a === void 0 ? void 0 : a.toString) === null || _a === void 0 ? void 0 : _a.call(a); }).join(", ")}) → ${glErrorName(target, err)} (${err})`, "color:red;font-weight:bold", "color:inherit");
                    }
                    if (prop.startsWith("draw")) {
                        const fb = args[1] || target.getParameter(target.FRAMEBUFFER_BINDING);
                        if (fb) {
                            const status = target.checkFramebufferStatus(target.FRAMEBUFFER);
                            if (status !== target.FRAMEBUFFER_COMPLETE) {
                                console.warn(`%c[Framebuffer]%c ${prop}: ${framebufferStatusName(target, status)} (${status})`, "color:orange;font-weight:bold", "color:inherit");
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
