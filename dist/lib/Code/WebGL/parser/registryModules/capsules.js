var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { TexExamples, WebProgram, parseTexUnitType } from "../../webglMan.js";
import { loadShadersFromString } from "../../../opengl/opengl.js";
import { Vector3D } from "../../../Matrix/Matrix.js";
//! Program Capsules (templates)
class MeshRenderingProgram extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, dx = 0.015, dy = 0.015) {
    super(gl, "", "");
    __publicField(this, "valsTexUnit", valsTexUnit);
    __publicField(this, "w", w);
    __publicField(this, "h", h);
    __publicField(this, "dx", dx);
    __publicField(this, "dy", dy);
    __publicField(this, "totalSegments");
    __publicField(this, "smoothColorEnabled", true);
    __publicField(this, "repeatEnabled", false);
    __publicField(this, "repeatTexture", null);
    __publicField(this, "repeatTextureState", null);
  }
  async loadProgram(vs, fs) {
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
            uniform bool repeatMesh;
            uniform vec3 offPos;
            ${this.vertexExtraUniforms()}

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;

            out vec3 outPos;
            flat out vec3 outFlatPos;

            vec4 getPoint(int x, int yTexel) {
                // Ahora la textura tiene un \xFAnico canal (RED)
                float val = repeatMesh
                    ? texture(values, (vec2(float(x), float(yTexel)) + 0.5) / vec2(textureSize(values, 0))).r
                    : texelFetch(values, ivec2(x, yTexel), 0).r;

                float px = dx * float(x) - dx * float(msdLength) * (1.0 - xPer);
                float py = val * yScale;
                float pz = dy * float(yTexel) - dy * float(msdCount) * (1.0 - yPer);

                return vec4(px, py, -pz, 1.0) + vec4(offPos, 0.0);
            }

            void main() {
                ${this.vertexPositionCode()}

                outPos = pos.xyz;
                outFlatPos = pos.xyz;
                gl_Position = u_projectionMatrix * (u_viewMatrix * pos);
            }`,
      //? fragment shader
      `#version 300 es
            precision highp float;

            in vec3 outPos;
            flat in vec3 outFlatPos;
            out vec4 outColor;
            uniform float colorHueScale;
            uniform bool smoothColor;

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
                float h = (outPos.y * colorHueScale / 1.5); // ahora est\xE1 entre -1 y 1
                h = (smoothColor ? outPos.y : outFlatPos.y) * colorHueScale / 1.5;
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
  vertexPositionCode() {
    return `int horizCount = (msdLength - 1) * msdCount;
                int segment = gl_VertexID / 2;
                bool first = (gl_VertexID % 2) == 0;
                int x, y;
                vec4 pos;
                if (segment < horizCount) {
                    int base = segment;
                    y = base / (msdLength - 1);
                    x = base % (msdLength - 1);
                    pos = getPoint(first ? x : x + 1, y);
                } else {
                    int base = segment - horizCount;
                    x = base / (msdCount - 1);
                    y = base % (msdCount - 1);
                    pos = getPoint(x, first ? y : y + 1);
                }`;
  }
  vertexExtraUniforms() {
    return "";
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
  /**
   * Offsets depending on the total mesh size
   * 0.5,0.5 = centered on 0,0
   */
  setPerXPerY(px = 0.5, py = 0.5) {
    this.uFloat("xPer").set(px);
    this.uFloat("yPer").set(py);
    return this;
  }
  setColorHueScale(scale = 1) {
    this.uFloat("colorHueScale").set(scale);
    return this;
  }
  smoothColor(is = true) {
    this.smoothColorEnabled = is;
    this.uInt("smoothColor").set(is ? 1 : 0);
    return this;
  }
  setRepeat(repeat = true) {
    this.repeatEnabled = repeat;
    if (this.program) {
      this.use();
      this.uInt("repeatMesh").set(repeat ? 1 : 0);
    }
    const texture = this.getTextureByUnit(this.valsTexUnit);
    if (!texture || this.repeatTexture === texture && this.repeatTextureState === repeat) return this;
    const gl = this.gl;
    const previousUnit = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE0 + parseTexUnitType(this.valsTexUnit));
    const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.bindTexture(gl.TEXTURE_2D, previousTexture);
    gl.activeTexture(previousUnit);
    this.repeatTexture = texture;
    this.repeatTextureState = repeat;
    return this;
  }
  setYScale(scale = 0.5) {
    this.uFloat("yScale").set(scale);
    return this;
  }
  initUniforms() {
    this.setSize(this.w, this.h).setOffset(0, 0, 0).setDXDY(this.dx, this.dy).setPerXPerY().setColorHueScale().setYScale();
    this.smoothColor(this.smoothColorEnabled);
    this.setRepeat(this.repeatEnabled);
    return this;
  }
  /**
   * Remember to check the texUnit texture must be active (use texture.bind(texUnit?))
   */
  draw(x = 0, y = 0, w = 1080, h = 720, camera, mode = "LINES") {
    this.initDepthBefDraw();
    if (this.repeatTexture !== this.getTextureByUnit(this.valsTexUnit)) this.setRepeat(this.repeatEnabled);
    this.bindTexName2TexUnit("values", this.valsTexUnit);
    if (camera) {
      camera.calculateMatrices().setUniformsProgram(this);
    }
    this.setViewport(x, y, w, h);
    this.clearColor();
    this.drawArrays(mode, 0, this.totalSegments * 2);
    return this;
  }
  /** Allocates the height texture; MeshFillerProgram evaluates its function on the GPU. */
  createIdealTexture(texUnit = this.valsTexUnit, w = this.w, h = this.h) {
    const texture = this.texture2D({
      format: TexExamples.RFloat,
      size: [w, h],
      texUnit
    });
    if (parseTexUnitType(texUnit) === parseTexUnitType(this.valsTexUnit)) this.setRepeat(this.repeatEnabled);
    return texture;
  }
  fillMeshTexture(texture2D, data, w = this.w, h = this.h) {
    let arrdata;
    if (typeof data == "function" && typeof data(0, 0) == "number") {
      arrdata = new Float32Array(w * h);
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          arrdata[j * w + i] = data(i, j) || 0;
        }
      }
    }
    texture2D.fill(arrdata, 0, 0, w, h);
    return this;
  }
}
class SolidMeshRenderingProgram extends MeshRenderingProgram {
  constructor() {
    super(...arguments);
    __publicField(this, "smoothColorEnabled", true);
  }
  vertexPositionCode() {
    return `int rowStride = msdLength * 2 + 2;
                int row = gl_VertexID / rowStride;
                int inRow = gl_VertexID % rowStride;
                int x = min(inRow / 2, msdLength - 1);
                int y = row + (inRow % 2);
                if (inRow == msdLength * 2) {
                    y = row + 1;
                } else if (inRow == msdLength * 2 + 1) {
                    x = 0;
                    y = row + 1;
                }
                vec4 pos = getPoint(x, y);`;
  }
  setSize(w = this.w, h = this.h) {
    super.setSize(w, h);
    this.totalSegments = w > 1 && h > 1 ? w * (h - 1) + (h - 2) : 0;
    return this;
  }
  draw(x = 0, y = 0, w = 1080, h = 720, camera, _mode = "TRIANGLE_STRIP") {
    super.draw(x, y, w, h, camera, "TRIANGLE_STRIP");
    return this;
  }
}
class DynamicSolidMeshRenderingProgram extends SolidMeshRenderingProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024) {
    super(gl, valsTexUnit, w, h);
    __publicField(this, "gridRadius", 128);
    __publicField(this, "repeatRadius", 100);
    __publicField(this, "fullResolutionCells", 48);
    __publicField(this, "falloff", 2);
    __publicField(this, "lodOriginXZ", [0, 0]);
    __publicField(this, "priorityWorldPoints", []);
    __publicField(this, "priorityTexels", []);
    __publicField(this, "originPerX", 0.5);
    __publicField(this, "originPerY", 0.5);
    this.repeatEnabled = true;
  }
  vertexExtraUniforms() {
    return `uniform int lodGridRadius;
                uniform float lodRepeatRadius;
                uniform int lodFullResolutionCells;
                uniform float lodFalloff;
                uniform vec2 lodOriginXZ;
                uniform int lodPriorityCount;
                uniform vec4 lodPriorityPoints[16];
                uniform int lodPeriodicXCount;
                uniform int lodPeriodicZCount;
                uniform float lodPeriodicXPositive[16];
                uniform float lodPeriodicXNegative[16];
                uniform float lodPeriodicZPositive[16];
                uniform float lodPeriodicZNegative[16];

                float lodPhase(int axis, bool negative, int slot) {
                    if (axis == 0) return negative ? lodPeriodicXNegative[slot] : lodPeriodicXPositive[slot];
                    return negative ? lodPeriodicZNegative[slot] : lodPeriodicZPositive[slot];
                }

                int lodAnchorIndex(int anchor, int total, int outerCells) {
                    if (anchor == 0) return 0;
                    if (anchor == total) return outerCells;
                    float t = float(anchor) / float(total);
                    float density = lodFalloff < 0.0001 ? t :
                        (1.0 - exp(-lodFalloff * t)) / (1.0 - exp(-lodFalloff));
                    return anchor + int(floor(float(outerCells - total) * density));
                }

                float lodAnchorDistance(int anchor, int axis, bool negative, int count,
                                        int nearCount, float tileSize, float flatDistance) {
                    if (anchor == 0) return flatDistance;
                    if (anchor <= nearCount) {
                        return lodPhase(axis, negative, count - nearCount + anchor - 1);
                    }
                    int beyond = anchor - nearCount - 1;
                    int tile = 1 + beyond / count;
                    int slot = beyond % count;
                    return float(tile) * tileSize + lodPhase(axis, negative, slot);
                }

                float lodAxisPosition(int signedIndex, int axis, float cell, float tileSize,
                                      float origin, float repeatRadius) {
                    float center = floor(origin / cell) * cell;
                    int magnitude = abs(signedIndex);
                    if (magnitude <= lodFullResolutionCells) return center + float(signedIndex) * cell;
                    bool negative = signedIndex < 0;
                    int count = axis == 0 ? lodPeriodicXCount : lodPeriodicZCount;
                    if (count == 0) {
                        float fullResolutionDistance = float(lodFullResolutionCells) * cell;
                        float t = float(magnitude - lodFullResolutionCells) /
                                  float(lodGridRadius - lodFullResolutionCells);
                        float curve = lodFalloff < 0.0001 ? t :
                            (exp(lodFalloff * t) - 1.0) / (exp(lodFalloff) - 1.0);
                        float distance = fullResolutionDistance + curve *
                            max(tileSize * repeatRadius - fullResolutionDistance, 0.0);
                        return center + (negative ? -distance : distance);
                    }
                    float fullResolutionDistance = float(lodFullResolutionCells) * cell;
                    int nearCount = 0;
                    for (int i = 0; i < 16; i++) {
                        if (i >= count) break;
                        if (lodPhase(axis, negative, i) > fullResolutionDistance) nearCount++;
                    }
                    int tiles = max(1, int(floor(repeatRadius)));
                    int zeroCount = lodPhase(axis, negative, 0) < 0.0001 * cell ? 1 : 0;
                    int total = (tiles - 1) * count + nearCount + zeroCount;
                    int outerCells = lodGridRadius - lodFullResolutionCells;
                    int outer = magnitude - lodFullResolutionCells;
                    int low = 0;
                    int high = total;
                    for (int step = 0; step < 12; step++) {
                        if (low >= high) break;
                        int mid = (low + high + 1) / 2;
                        if (lodAnchorIndex(mid, total, outerCells) <= outer) low = mid;
                        else high = mid - 1;
                    }
                    float distance = lodAnchorDistance(low, axis, negative, count, nearCount,
                                                       tileSize, fullResolutionDistance);
                    if (low < total) {
                        int firstIndex = lodAnchorIndex(low, total, outerCells);
                        int nextIndex = lodAnchorIndex(low + 1, total, outerCells);
                        float nextDistance = lodAnchorDistance(low + 1, axis, negative,
                                                                 count, nearCount, tileSize,
                                                                 fullResolutionDistance);
                        distance = mix(distance, nextDistance,
                                       float(outer - firstIndex) / float(nextIndex - firstIndex));
                    }
                    return center + (negative ? -distance : distance);
                }`;
  }
  vertexPositionCode() {
    return `int side = lodGridRadius * 2 + 1;
                int rowStride = side * 2 + 2;
                int row = gl_VertexID / rowStride;
                int inRow = gl_VertexID % rowStride;
                int ix = min(inRow / 2, side - 1) - lodGridRadius;
                int iz = row + (inRow % 2) - lodGridRadius;
                if (inRow == side * 2) {
                    iz = row + 1 - lodGridRadius;
                } else if (inRow == side * 2 + 1) {
                    ix = -lodGridRadius;
                    iz = row + 1 - lodGridRadius;
                }
                vec2 cell = max(abs(vec2(dx, dy)), vec2(0.000001));
                vec2 worldXZ = vec2(
                    lodAxisPosition(ix, 0, cell.x, float(msdLength) * cell.x,
                                    lodOriginXZ.x, lodRepeatRadius),
                    lodAxisPosition(iz, 1, cell.y, float(msdCount) * cell.y,
                                    lodOriginXZ.y, lodRepeatRadius));
                for (int i = 0; i < 16; i++) {
                    if (i >= lodPriorityCount) break;
                    vec4 reserved = lodPriorityPoints[i];
                    if (ix == int(reserved.z)) worldXZ.x = reserved.x;
                    if (iz == int(reserved.w)) worldXZ.y = reserved.y;
                }
                ivec2 texel = ivec2(round(vec2(
                    worldXZ.x / cell.x + float(msdLength) * (1.0 - xPer),
                    -worldXZ.y / cell.y + float(msdCount) * (1.0 - yPer))));
                ivec2 textureSizeXY = ivec2(msdLength, msdCount);
                ivec2 wrapped = (texel % textureSizeXY + textureSizeXY) % textureSizeXY;
                float height = texelFetch(values, wrapped, 0).r;
                vec4 pos = vec4(worldXZ.x, height * yScale, worldXZ.y, 1.0) + vec4(offPos, 0.0);`;
  }
  setSize(w = this.w, h = this.h) {
    super.setSize(w, h);
    return this.setGridRadius(this.gridRadius);
  }
  setGridRadius(radius) {
    if (radius > 512) console.warn(`DynamicSolidMeshProgram grid radius ${radius} is limited to 512`);
    this.gridRadius = Math.max(8, Math.min(512, Math.floor(radius)));
    const side = this.gridRadius * 2 + 1;
    this.totalSegments = (side + 1) * (side - 1);
    if (this.program) {
      this.use();
      this.uInt("lodGridRadius").set(this.gridRadius);
    }
    this.setFullResolutionCells(this.fullResolutionCells);
    return this.updatePriorityPoints();
  }
  setRepeatRadius(radius) {
    this.repeatRadius = Math.max(1, Math.min(1e4, radius));
    if (this.program) {
      this.use();
      this.uFloat("lodRepeatRadius").set(this.repeatRadius);
    }
    return this.updatePriorityPoints();
  }
  /** Keep this many grid cells at native spacing around the current LOD center. */
  setFullResolutionCells(cells) {
    this.fullResolutionCells = Math.max(0, Math.min(this.gridRadius - 1, Math.floor(cells)));
    if (this.program) {
      this.use();
      this.uInt("lodFullResolutionCells").set(this.fullResolutionCells);
    }
    return this.updatePriorityPoints();
  }
  /** 0 is linear spacing outside the center; larger values retain detail longer. */
  setFalloff(amount) {
    if (amount > 64) console.warn(`DynamicSolidMeshProgram falloff ${amount} is limited to 64`);
    this.falloff = Math.max(0, Math.min(64, amount));
    if (this.program) {
      this.use();
      this.uFloat("lodFalloff").set(this.falloff);
    }
    return this.updatePriorityPoints();
  }
  /** Set the LOD center explicitly; texture-priority anchors remain fixed in world space. */
  setLODOrigin(x, z) {
    this.lodOriginXZ = [x, z];
    if (this.program) {
      this.use();
      this.uVec("lodOriginXZ", 2).set(this.lodOriginXZ);
    }
    return this.updatePriorityPoints();
  }
  /** Follow the camera with high-resolution geometry without moving priority samples. */
  setCameraPosition(position) {
    const cellX = Math.max(Math.abs(this.dx), 1e-6);
    const cellZ = Math.max(Math.abs(this.dy), 1e-6);
    if (Math.floor(position.x / cellX) === Math.floor(this.lodOriginXZ[0] / cellX) && Math.floor(position.z / cellZ) === Math.floor(this.lodOriginXZ[1] / cellZ)) return this;
    return this.setLODOrigin(position.x, position.z);
  }
  setDXDY(dx, dy) {
    this.dx = dx;
    this.dy = dy;
    super.setDXDY(dx, dy);
    return this.updatePriorityPoints();
  }
  setPerXPerY(px = 0.5, py = 0.5) {
    this.originPerX = px;
    this.originPerY = py;
    super.setPerXPerY(px, py);
    return this.updatePriorityPoints();
  }
  /** Reserve exact world-space X/Z coordinates as vertices (up to 16 points). */
  setPriorityPoints(points) {
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    this.priorityWorldPoints = points.map(([x, z]) => [x, z]);
    this.priorityTexels = [];
    return this.updatePriorityPoints();
  }
  /** Reserve texture texels; [w/2,h/2] maps to world origin at xPer=yPer=0.5. */
  setPriorityTexels(points) {
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    if (points.some(([u, v]) => !Number.isFinite(u) || !Number.isFinite(v) || u < 0 || u >= this.w || v < 0 || v >= this.h)) {
      throw new Error("Priority texels must lie inside the height texture");
    }
    this.priorityTexels = points.map(([x, y]) => [x, y]);
    this.priorityWorldPoints = [];
    return this.updatePriorityPoints();
  }
  axisPosition(index, cell, size, origin) {
    const count = Math.abs(index);
    const flat = Math.min(count, this.fullResolutionCells) * cell;
    const outside = Math.max(0, count - this.fullResolutionCells);
    const span = Math.max(1, this.gridRadius - this.fullResolutionCells);
    const t = outside / span;
    const curve = this.falloff < 1e-4 ? t : Math.expm1(this.falloff * t) / Math.expm1(this.falloff);
    const reach = Math.max(0, size * cell * this.repeatRadius - this.fullResolutionCells * cell);
    return Math.floor(origin / cell) * cell + Math.sign(index) * (flat + curve * reach);
  }
  nearestAxisIndex(value, cell, size, origin) {
    let low = -this.gridRadius;
    let high = this.gridRadius;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.axisPosition(mid, cell, size, origin) < value) low = mid + 1;
      else high = mid;
    }
    if (low > -this.gridRadius && Math.abs(this.axisPosition(low - 1, cell, size, origin) - value) < Math.abs(this.axisPosition(low, cell, size, origin) - value)) low--;
    return low;
  }
  updatePriorityPoints() {
    const cellX = Math.max(Math.abs(this.dx), 1e-6);
    const cellZ = Math.max(Math.abs(this.dy), 1e-6);
    if (this.priorityTexels.length) {
      const phaseArrays = [];
      const counts = [];
      for (const [axis, cell, size, origin] of [
        [0, cellX, this.w, this.lodOriginXZ[0]],
        [1, cellZ, this.h, this.lodOriginXZ[1]]
      ]) {
        const tileSize = cell * size;
        const center = Math.floor(origin / cell) * cell;
        const coords = this.priorityTexels.map(([u, v]) => axis === 0 ? (u - this.w * (1 - this.originPerX)) * cellX : -(v - this.h * (1 - this.originPerY)) * cellZ);
        for (const negative of [false, true]) {
          const phases = coords.map((coordinate) => {
            const distance = negative ? center - coordinate : coordinate - center;
            const remainder = (distance % tileSize + tileSize) % tileSize;
            return remainder < cell * 1e-4 || tileSize - remainder < cell * 1e-4 ? 0 : remainder;
          }).sort((a, b) => a - b).filter((phase, i, values2) => i === 0 || Math.abs(phase - values2[i - 1]) > cell * 1e-4);
          const nearCount = phases.filter((phase) => phase > this.fullResolutionCells * cell).length;
          const tiles = Math.max(1, Math.floor(this.repeatRadius));
          const total = (tiles - 1) * phases.length + nearCount + (phases[0] === 0 ? 1 : 0);
          if (total > this.gridRadius - this.fullResolutionCells) {
            throw new Error("Not enough LOD vertices for every repeated priority texel; increase grid radius or reduce repeat radius");
          }
          const values = new Float32Array(16);
          values.set(phases);
          phaseArrays.push(values);
          counts.push(phases.length);
        }
      }
      if (this.program) {
        this.use();
        this.uInt("lodPriorityCount").set(0);
        this.uInt("lodPeriodicXCount").set(counts[0]);
        this.uInt("lodPeriodicZCount").set(counts[2]);
        for (const [i, name] of [
          "lodPeriodicXPositive",
          "lodPeriodicXNegative",
          "lodPeriodicZPositive",
          "lodPeriodicZNegative"
        ].entries()) {
          this.gl.uniform1fv(this.gl.getUniformLocation(this.program, `${name}[0]`), phaseArrays[i]);
        }
      }
      return this;
    }
    const points = this.priorityWorldPoints;
    if (points.length > 16) throw new Error("DynamicSolidMeshProgram supports at most 16 priority points");
    const xSlots = /* @__PURE__ */ new Map();
    const zSlots = /* @__PURE__ */ new Map();
    const reserved = new Float32Array(16 * 4);
    points.forEach(([x, z], i) => {
      if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error("Priority coordinates must be finite");
      const ix = this.nearestAxisIndex(x, cellX, this.w, this.lodOriginXZ[0]);
      const iz = this.nearestAxisIndex(z, cellZ, this.h, this.lodOriginXZ[1]);
      const edgeX = Math.abs(this.axisPosition(ix, cellX, this.w, this.lodOriginXZ[0]) - x);
      const edgeZ = Math.abs(this.axisPosition(iz, cellZ, this.h, this.lodOriginXZ[1]) - z);
      if (Math.abs(ix) === this.gridRadius && edgeX > cellX || Math.abs(iz) === this.gridRadius && edgeZ > cellZ) {
        throw new Error("Priority point lies outside the LOD mesh; increase repeat radius or move its origin");
      }
      if (xSlots.has(ix) && xSlots.get(ix) !== x || zSlots.has(iz) && zSlots.get(iz) !== z) {
        throw new Error("Priority points need distinct grid slots at this resolution; increase grid radius");
      }
      xSlots.set(ix, x);
      zSlots.set(iz, z);
      reserved.set([x, z, ix, iz], i * 4);
    });
    if (this.program) {
      this.use();
      this.uInt("lodPeriodicXCount").set(0);
      this.uInt("lodPeriodicZCount").set(0);
      this.uInt("lodPriorityCount").set(points.length);
      if (points.length) this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "lodPriorityPoints[0]"), reserved);
    }
    return this;
  }
  initUniforms() {
    super.initUniforms();
    return this.setGridRadius(this.gridRadius).setRepeatRadius(this.repeatRadius).setFullResolutionCells(this.fullResolutionCells).setFalloff(this.falloff).setLODOrigin(this.lodOriginXZ[0], this.lodOriginXZ[1]);
  }
  draw(x = 0, y = 0, w = 1080, h = 720, camera) {
    this.use();
    return super.draw(x, y, w, h, camera);
  }
}
function transpileMeshCallback(callback, parser) {
  const names = /* @__PURE__ */ new Set();
  for (const match of callback.matchAll(/\{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(?:,\s*(?:float|int|uint|vec[2-4]|mat[2-4]))?\s*\}/g)) {
    names.add(match[1]);
  }
  const context = [...names].map((name) => `${JSON.stringify(name)}: ${parser.transpileExpr(name)}`).join(", ");
  return `__prepareMathFunction(${JSON.stringify(callback)}, {${context}})`;
}
function transpileCreateIdealMesh(line, declaredVars, parser) {
  const m = line.match(/^(?:([a-zA-Z_]\w*)\s*=\s*)?createIdealMesh\s+([\s\S]+)$/);
  if (!m) return null;
  const alias = m[1]?.trim();
  let rest = (m[2] || "").trim().replace(/;$/, "");
  const tokens = parser.splitByWhitespaceTopLevel(rest);
  if (!tokens.length) return null;
  const texToken = tokens[0];
  rest = rest.slice(rest.indexOf(texToken) + texToken.length).trim();
  let callbackRaw = rest;
  let chainRaw = "";
  const chainMatch = rest.match(/^(.*?)(\s*(?:\.[A-Za-z_]\w*\([^)]*\)\s*)+)$/);
  if (chainMatch) {
    callbackRaw = chainMatch[1].trim();
    chainRaw = chainMatch[2].trim();
  }
  const texExpr = parser.normalizeTexUnitToken(texToken);
  const targetName = alias ? alias : "__meshTexTmp";
  const out = [];
  if (alias && !declaredVars.has(alias)) {
    declaredVars.add(alias);
    out.push(`var ${alias};`);
  }
  out.push(`(()=>{`);
  out.push(`    // createIdealMesh${alias ? ` ${alias}` : ""}`);
  const createExpr = `lastUsedProgram?.createIdealTexture?.(${texExpr})`;
  if (alias) out.push(`    ${alias} = ${createExpr};`);
  else out.push(`    let ${targetName} = ${createExpr};`);
  out.push(`    if (${targetName}) {`);
  out.push(`        ${targetName}.lastPreparedFunc = ${JSON.stringify(callbackRaw)};`);
  const contextNames = parser.extractContextNamesFromCallback(callbackRaw).filter((name) => name !== "x" && name !== "y");
  if (contextNames.length) {
    out.push(`        ${targetName}.meshContext = {`);
    for (const name of contextNames) out.push(`            get ${name}(){ return (typeof ${name} !== "undefined") ? ${name} : (globalThis as any).${name}; },`);
    out.push(`        };`);
  }
  out.push(`    }`);
  if (chainRaw) {
    const chainCalls = chainRaw.match(/\.[A-Za-z_]\w*\([^)]*\)/g) || [];
    for (const call of chainCalls) {
      const cm = call.match(/^\.([A-Za-z_]\w*)\(([\s\S]*)\)$/);
      if (!cm) continue;
      const method = cm[1];
      const args = cm[2].trim();
      const transpiledArgs = args ? parser.transpileExpr(args) : "";
      out.push(`    ${targetName}?.${method}?.(${transpiledArgs});`);
    }
  }
  out.push(`})();`);
  return out;
}
function transpileCapsuleObject(line, declaredVars, parser) {
  const { leftAliases, rightAliases, core } = parser.extractAliasesAndCore(line);
  const kind = core.match(/^(MeshProgram|SolidMeshProgram|DynamicSolidMeshProgram|MeshFillerProgram|Axis3DGroup)(?:\s+|$)/)?.[1];
  if (!kind) return null;
  const names = [...parser.ensureAliasesForClass(leftAliases, kind, declaredVars), ...rightAliases];
  rightAliases.forEach((name) => declaredVars.add(name));
  if (!names.length) return null;
  const first = names[0];
  const paramsStr = core.slice(kind.length).trim();
  const split = parser.splitParamsAndChainTokens(paramsStr);
  const out = [];
  if (kind === "MeshProgram" || kind === "SolidMeshProgram" || kind === "DynamicSolidMeshProgram") {
    const params = /* @__PURE__ */ new Map();
    const positional = [];
    for (const token of split.params) {
      const match = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
      if (match) params.set(match[1], parser.transpileExpr(match[2]));
      else positional.push(parser.transpileExpr(token));
    }
    const input = params.get("input") ?? positional[0] ?? "undefined";
    const size = positional[0] && params.has("input") ? positional[0] : positional[1] ?? "undefined";
    const dimensions = size.includes("x") ? parser.transpileSizeToken(size) : size.startsWith("[") ? size : parser.transpileExpr(size);
    const programClass = kind === "DynamicSolidMeshProgram" ? "DynamicSolidMeshRenderingProgram" : kind === "SolidMeshProgram" ? "SolidMeshRenderingProgram" : "MeshRenderingProgram";
    out.push(`var ${first} = new ${programClass}(gl, ${input}, (${dimensions})[0], (${dimensions})[1]).includeInWebManList();`);
    out.push(`lastUsedProgram = ${first};`);
  } else if (kind === "Axis3DGroup") {
    const params = /* @__PURE__ */ new Map();
    for (const token of split.params) {
      const match = token.match(/^([a-zA-Z_]\w*)=(.+)$/);
      if (match) params.set(match[1], parser.transpileExpr(match[2]));
    }
    out.push(`var ${first} = new Axis3DGroup(gl, ${params.get("axisLength") ?? "undefined"}, ${params.get("drawArrows") ?? "undefined"}, ${params.get("heights") ?? "undefined"}, ${params.get("radii") ?? "undefined"}, ${params.get("planes") ?? "undefined"}).includeInWebManList();`);
  } else {
    const texUnit = split.params[0] ? parser.normalizeTexUnitToken(split.params[0]) : "undefined";
    const body = split.params[1];
    let callback = body || "";
    if (callback.startsWith('"') && callback.endsWith('"') || callback.startsWith("'") && callback.endsWith("'")) callback = callback.slice(1, -1);
    callback = callback.replace(/\\(["'\\])/g, "$1");
    const contextNames = parser.extractContextNamesFromCallback(callback).filter((name) => name !== "x" && name !== "y");
    out.push(`var ${first} = new MeshFillerProgram(gl, ${texUnit}).includeInWebManList();`);
    if (body !== void 0) {
      if (contextNames.length) {
        const context = `__ctx_${first}`;
        out.push(`var ${context} = {`);
        for (const name of contextNames) out.push(`    get ${name}(){ return (typeof ${name} !== "undefined") ? ${name} : (globalThis as any).${name}; },`);
        out.push(`};`);
        out.push(`${first}.generateProgram(${body}, ${context}, globalThis as any);`);
      } else {
        out.push(`${first}.generateProgram(${body}, globalThis as any);`);
      }
      out.push(`await ${first}.loadProgram?.();`);
    } else {
      out.push(`await ${first}.loadFromTexture();`);
    }
  }
  for (const chain of split.chains) out.push(`${first}${chain};`);
  if (kind === "MeshFillerProgram") out.push(`lastFillerProgram = ${first};`);
  for (const alias of names.slice(1)) out.push(`var ${alias} = ${first};`);
  return out;
}
function buildHandlers(parser) {
  return {
    objects: {
      //@dnti-createsInternalTexture
      MeshProgram: (params, gl) => {
        const [width, height] = params.get(0) || [1024, 1024];
        const program = new MeshRenderingProgram(gl, params.get("input"), width, height).includeInWebManList();
        parser.lastUsedProgram = program;
        return program;
      },
      //@dnti-createsInternalTexture
      SolidMeshProgram: (params, gl) => {
        const [width, height] = params.get(0) || [1024, 1024];
        const program = new SolidMeshRenderingProgram(gl, params.get("input"), width, height).includeInWebManList();
        parser.lastUsedProgram = program;
        return program;
      },
      //@dnti-createsInternalTexture
      DynamicSolidMeshProgram: (params, gl) => {
        const [width, height] = params.get(0) || [1024, 1024];
        const program = new DynamicSolidMeshRenderingProgram(gl, params.get("input"), width, height).includeInWebManList();
        parser.lastUsedProgram = program;
        return program;
      },
      MeshFillerProgram: async (params, gl) => {
        const program = new MeshFillerProgram(gl, params.get(0)).includeInWebManList();
        if (params.get(1)) {
          program.generateProgram(params.get(1), parser.ctx.vars, parser.GlobalContext);
          await program.loadProgram();
        } else {
          await program.loadFromTexture(parser.ctx.vars, parser.GlobalContext);
        }
        if (!parser.lastFillerProgram) parser.lastFillerProgram = program;
        return program;
      },
      Axis3DGroup: (params, gl) => new Axis3DGroup(
        gl,
        params.get("axisLength"),
        params.get("drawArrows"),
        params.get("heights"),
        params.get("radii"),
        params.get("planes")
      ).includeInWebManList()
    },
    functions: {
      createIdealMesh: (params) => {
        const callback = [...params.entries()].filter(([key]) => typeof key === "number" && key > 0).sort(([a], [b]) => Number(a) - Number(b)).map(([, value]) => value).join(" ").trim().replace(/;$/, "");
        const program = parser.lastUsedProgram;
        if (!program) return;
        const texture = program.createIdealTexture(params.get(0));
        const unit = String(params.get(0)).match(/\d+/)?.[0] || "";
        texture.lastPreparedFunc = callback;
        parser.ctx.vars.set(`texture${unit}`, texture);
        return texture;
      },
      fillMeshTexture: (params) => {
        const texture = parser.getVar(params.get(0));
        const program = parser.lastUsedProgram;
        if (!texture || !program) return;
        const callback = [...params.entries()].filter(([key]) => typeof key === "number" && key > 0).sort(([a], [b]) => Number(a) - Number(b)).map(([, value]) => value).join(" ").trim().replace(/;$/, "");
        if (texture.lastPreparedFunc !== callback) {
          texture.func = parser.prepareMathFunction(callback);
          texture.lastPreparedFunc = callback;
        }
        return program.fillMeshTexture(texture, texture.func);
      }
    },
    transpile: [(line, declaredVars) => {
      const object = transpileCapsuleObject(line, declaredVars, parser);
      if (object) return object;
      if (/^(?:[A-Za-z_]\w*\s*=\s*)?createIdealMesh\s+/.test(line)) {
        return transpileCreateIdealMesh(line, declaredVars, parser);
      }
      const match = /^fillMeshTexture\s+(\S+)\s+([\s\S]+)$/.exec(line);
      if (!match) return null;
      const texture = parser.transpileExpr(match[1]);
      const callback = match[2].trim().replace(/;$/, "");
      return [`lastUsedProgram?.fillMeshTexture?.(${texture}, ${transpileMeshCallback(callback, parser)});`];
    }]
  };
}
class AxisLinesProgram extends WebProgram {
  constructor(gl, axisLengths = new Vector3D(1, 1, 1)) {
    super(gl, "", "");
    __publicField(this, "axisLengths", axisLengths);
  }
  async loadProgram() {
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
    return this;
  }
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D(x, y, z);
    this.uVec("axisLengths", 3).set(this.axisLengths);
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.drawArrays("LINES", 0, 6);
    return this;
  }
}
class AxisConesProgram extends WebProgram {
  constructor(gl, arrowHeights = new Vector3D(0.1, 0.1, 0.1), arrowRadii = new Vector3D(0.03, 0.03, 0.03), axisLengths = new Vector3D(1, 1, 1)) {
    super(gl, "", "");
    __publicField(this, "arrowHeights", arrowHeights);
    __publicField(this, "arrowRadii", arrowRadii);
    __publicField(this, "axisLengths", axisLengths);
  }
  async loadProgram() {
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
    const vertices = [];
    const colors = [];
    const addCone = (dir, length, height, radius, color) => {
      for (let i = 0; i < steps; i++) {
        const a1 = i / steps * Math.PI * 2;
        const a2 = (i + 1) / steps * Math.PI * 2;
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
        vertices.push(
          base1.x,
          base1.y,
          base1.z,
          base2.x,
          base2.y,
          base2.z,
          tip.x,
          tip.y,
          tip.z
        );
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
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    this.drawArrays("TRIANGLES", 0, 3 * 16 * 3);
    return this;
  }
}
class AxisGridProgram extends WebProgram {
  // tamaño del lado del cuadrado (calculado automáticamente)
  constructor(gl, planes = ["XY"], axisLengths = new Vector3D(1, 1, 1), divisions = 10) {
    super(gl, "", "");
    __publicField(this, "planes", planes);
    __publicField(this, "axisLengths", axisLengths);
    __publicField(this, "vertexCount", 0);
    __publicField(this, "divisions", 10);
    // nº de divisiones por eje
    __publicField(this, "cellSize", 0.1);
    this.setDivisions(divisions);
  }
  async loadProgram() {
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
  initUniforms(axisLengths) {
    if (axisLengths) this.axisLengths = axisLengths;
    else if (!this.axisLengths) this.axisLengths = new Vector3D(1, 1, 1);
    return this;
  }
  /** Genera el VAO de la cuadrícula en función de cellSize o divisions */
  initVAO() {
    const vertices = [];
    for (const plane of this.planes) this.addGrid(plane, vertices);
    this.vertexCount = vertices.length / 3;
    if (!this.VAO) this.createVAO();
    this.VAO.bind().attribute("aPos", vertices, 3);
    return this;
  }
  addGrid(plane, vertices) {
    const sizeX = this.axisLengths?.x ?? 1;
    const sizeY = this.axisLengths?.y ?? 1;
    const sizeZ = this.axisLengths?.z ?? 1;
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
    return this;
  }
  draw(camera) {
    if (camera) camera.calculateMatrices().setUniformsProgram(this);
    this.bindVAO();
    if (this.vertexCount)
      this.drawArrays("LINES", 0, this.vertexCount);
    return this;
  }
  // ----------------------------
  // 🔧 Nuevas funciones añadidas
  // ----------------------------
  /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
  setDivisions(divisions) {
    this.divisions = Math.max(1, divisions);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.cellSize = avgAxis / this.divisions;
    return this;
  }
  /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
  setCellSize(size) {
    this.cellSize = Math.max(1e-3, size);
    const avgAxis = (this.axisLengths.x + this.axisLengths.y + this.axisLengths.z) / 3;
    this.divisions = Math.floor(avgAxis / this.cellSize);
    return this;
  }
}
class Axis3DGroup {
  constructor(gl, axisLengths = new Vector3D(1, 1, 1), drawArrows = false, arrowHeights = new Vector3D(0.1, 0.1, 0.1), arrowRadii = new Vector3D(0.03, 0.03, 0.03), planes = []) {
    __publicField(this, "gl", gl);
    __publicField(this, "axisLengths", axisLengths);
    __publicField(this, "drawArrows", drawArrows);
    __publicField(this, "arrowHeights", arrowHeights);
    __publicField(this, "arrowRadii", arrowRadii);
    __publicField(this, "planes", planes);
    __publicField(this, "lines");
    __publicField(this, "cones");
    __publicField(this, "grid");
    __publicField(this, "gridDivisions", 10);
    this.lines = new AxisLinesProgram(gl, axisLengths);
    if (drawArrows) this.cones = new AxisConesProgram(gl, this.arrowHeights, this.arrowRadii, axisLengths);
    if (planes && planes.length > 0) this.grid = new AxisGridProgram(gl, planes, this.axisLengths);
  }
  /**
   * Inicializa uniforms y crea VAOs necesarios para cada subprograma.
   * Llamar a esta función después de loadAll() y antes del primer draw().
   */
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
  /** Dibuja los tres elementos (usa VAOs creados en initUniforms) */
  draw(camera) {
    if (this.lines) {
      this.lines.use();
      this.lines.uVec("axisLengths", 3).set([this.axisLengths.x, this.axisLengths.y, this.axisLengths.z]);
      this.lines.draw(camera);
    }
    if (this.grid) {
      this.grid.use();
      if (!this.grid.VAO) this.grid.initVAO();
      this.grid.draw(camera);
    }
    if (this.cones) {
      this.cones.use();
      this.cones.axisLengths = this.axisLengths;
      this.cones.arrowHeights = this.arrowHeights;
      this.cones.arrowRadii = this.arrowRadii;
      if (!this.cones.VAO) this.cones.initVAO();
      this.cones.draw(camera);
    }
    return this;
  }
  /** helpers para actualizar parámetros en caliente */
  setAxisLengths(x, y, z) {
    this.axisLengths = new Vector3D(x, y, z);
    this.lines.setAxisLengths(x, y, z);
    if (this.cones) this.cones.axisLengths = this.axisLengths;
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
    } else {
      this.grid = new AxisGridProgram(this.gl, planes, this.axisLengths);
    }
    return this;
  }
  /** Fija el número de divisiones (por eje) y calcula automáticamente el tamaño de cada celda */
  setDivisions(divisions) {
    this.gridDivisions = divisions;
    if (this.grid)
      this.grid.setDivisions(divisions);
    return this;
  }
  /** Fija el tamaño del lado de las celdas y calcula el nº de divisiones */
  setCellSize(size) {
    if (this.grid)
      this.grid.setCellSize(size);
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
class MeshFillerProgram extends WebProgram {
  constructor(gl, valsTexUnit = "TexUnit20", w = 1024, h = 1024, callBackString, varsContext = {}) {
    super(gl, "", "");
    __publicField(this, "valsTexUnit", valsTexUnit);
    __publicField(this, "w", w);
    __publicField(this, "h", h);
    // Cambiamos la estructura para almacenar el objeto uniform devuelto por tus funciones
    __publicField(this, "uniformsToUpdate", []);
    if (callBackString)
      this.generateProgram(callBackString, varsContext);
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.error("Este navegador/GPU no permite renderizar en RFloat.");
    }
  }
  /** Reuses the function attached by createIdealMesh to the texture on this unit. */
  async loadFromTexture(...varsContexts) {
    const texture = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit));
    if (!texture?.lastPreparedFunc) {
      throw new Error(`MeshFillerProgram ${this.valsTexUnit} needs a function or a preceding createIdealMesh on the same TexUnit`);
    }
    if (/\b(?:switch|try|catch|throw|class|function|new)\b/.test(texture.lastPreparedFunc)) {
      throw new Error("MeshFillerProgram cannot translate this callback to GLSL; use numeric expressions, if, for, or while");
    }
    this.generateProgram(texture.lastPreparedFunc, globalThis, ...varsContexts, texture.meshContext ?? {});
    await this.loadProgram();
    return this;
  }
  async loadProgram(vs = this.vertPath, fs = this.fragPath) {
    [this.program, this.vert, this.frag] = await loadShadersFromString(this.gl, vs, fs);
    this.use();
    this.uniformsToUpdate.forEach((u) => {
      u.setterObj = this.uFloat(u.name);
    });
    return this;
  }
  /**
   * Se ejecuta en cada frame del loop de renderizado (tick).
   * Obtiene los valores actuales del contexto y los sube a la GPU.
   */
  tick() {
    if (!this.program) return this;
    this.use();
    this.uniformsToUpdate.forEach((u) => {
      const currentVal = u.getter();
      if (u.setterObj && typeof u.setterObj.set === "function") {
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
  generateProgram(callbackString, ...varsContexts) {
    this.uniformsToUpdate = [];
    let uniformDecls = "";
    const arrowMatch = callbackString.match(/=>\s*([\s\S]*)$/);
    let body = arrowMatch ? arrowMatch[1].trim() : callbackString;
    if (body.startsWith("{") && body.endsWith("}")) {
      body = body.substring(1, body.length - 1).trim();
    }
    let glslBody = body.replace(/{([^{}]+)}/g, (whole, content) => {
      if (/[;{}]/.test(content) || /\b(?:return|let|const|var|if|else|for|while|switch|throw)\b/.test(content)) return whole;
      let path = content;
      let glslType = "float";
      const lastComma = content.lastIndexOf(",");
      if (lastComma !== -1) {
        const possibleType = content.substring(lastComma + 1).trim();
        if (/^(float|int|vec[2-4]|mat[2-4]|uint)$/.test(possibleType)) {
          path = content.substring(0, lastComma).trim();
          glslType = possibleType;
        }
      }
      const safeName = "u_ctx_" + path.replace(/[^a-zA-Z0-9]/g, "_").replace(/__/g, "_").replace(/^_|_$/g, "");
      if (!uniformDecls.includes(safeName)) {
        uniformDecls += `uniform ${glslType} ${safeName};
`;
        this.uniformsToUpdate.push({
          name: safeName,
          setterObj: null,
          getter: () => {
            try {
              const scope = new Proxy({}, {
                has(target, prop) {
                  if (typeof prop === "symbol") return false;
                  return varsContexts.some(
                    (ctx) => ctx instanceof Map ? ctx.has(prop) : prop in ctx
                  );
                },
                get(target, prop) {
                  if (prop === Symbol.unscopables) return void 0;
                  for (let i = varsContexts.length - 1; i >= 0; i--) {
                    const ctx = varsContexts[i];
                    if (ctx instanceof Map) {
                      if (ctx.has(prop)) return ctx.get(prop);
                    } else {
                      if (prop in ctx) return ctx[prop];
                    }
                  }
                  return void 0;
                }
              });
              const evalFunc = new Function("scope", `with(scope) { return ${path}; }`);
              let res = evalFunc(scope);
              return res;
            } catch (e) {
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
      while (str.includes("**")) {
        let opIdx = str.indexOf("**");
        let left = opIdx - 1, base = "";
        if (str[left] === ")") {
          let count = 0, i = left;
          for (; i >= 0; i--) {
            if (str[i] === ")") count++;
            if (str[i] === "(") count--;
            if (count === 0) {
              i--;
              break;
            }
          }
          base = str.substring(i + 1, left + 1);
        } else {
          let match = str.substring(0, opIdx).match(/([\w\.\$]+)$/);
          base = match ? match[1] : "";
        }
        let right = opIdx + 2, exponent = "";
        if (str[right] === "(") {
          let count = 0, i = right;
          for (; i < str.length; i++) {
            if (str[i] === "(") count++;
            if (str[i] === ")") count--;
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
    glslBody = glslBody.replace(/\b(?:let|const|var)\s+([A-Za-z_]\w*)\s*=/g, "float $1 =").replace(/===/g, "==").replace(/!==/g, "!=");
    if (/\b(?:return|if|for|while|float)\b/.test(glslBody)) {
      glslBody = glslBody.replace(/\breturn\s+([^;]+);?/g, "{ outRed = $1; return; }");
    } else {
      glslBody = `outRed = ${glslBody.replace(/;$/, "")};`;
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
                outRed = 0.0;
                ${glslBody}
            }`;
    return this;
  }
  draw() {
    if (!this.program) return this;
    const gl = this.gl;
    this.use();
    const tex = this.getTextureByUnit(parseTexUnitType(this.valsTexUnit));
    if (!tex) return this;
    const tw = tex.w ?? this.w;
    const th = tex.h ?? this.h;
    let fbo = this.cFrameBuffer().bind([0]);
    fbo.bindColorBuffer(tex, "ColAtch0");
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("FBO status:", status, "tex:", tex, "texWH:", tw, th, "progWH:", this.w, this.h);
      this.unbindFBO();
      return this;
    }
    gl.viewport(0, 0, this.w, this.h);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.unbindFBO();
    return this;
  }
}
const id = "MeshCapsule";
function detectUse(source) {
  return /\b(?:MeshProgram|SolidMeshProgram|DynamicSolidMeshProgram|MeshFillerProgram|Axis3DGroup|createIdealMesh|fillMeshTexture)\b/.test(source) ? true : "Toggled";
}
function register(parser) {
  return { id, ...buildHandlers(parser) };
}
export {
  Axis3DGroup,
  AxisConesProgram,
  AxisGridProgram,
  AxisLinesProgram,
  DynamicSolidMeshRenderingProgram,
  MeshFillerProgram,
  MeshRenderingProgram,
  SolidMeshRenderingProgram,
  detectUse,
  id,
  register
};
