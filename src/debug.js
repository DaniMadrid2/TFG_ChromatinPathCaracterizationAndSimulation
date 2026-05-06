import { start } from "/Code/Start/start.js";
import { TexExamples, WebGLMan } from "/Code/WebGL/webglMan.js";

let backupApi = "/api/backups";
const backupSelect = document.getElementById("backupSelect");
const localFile = document.getElementById("localFile");
const backupFilter = document.getElementById("backupFilter");
const refreshBtn = document.getElementById("refreshBtn");
const copyLogBtn = document.getElementById("copyLogBtn");
const loadBtn = document.getElementById("loadBtn");
const debugLog = document.getElementById("debugLog");

const viewers = [];
let backupFiles = [];
let activePayload = null;

const status = (idx, text) => {
  document.getElementById(`status${idx}`).textContent = text;
};

const logDebug = (text) => {
  const line = `[${new Date().toLocaleTimeString()}] ${text}`;
  debugLog.textContent = `${line}\n${debugLog.textContent || ""}`.trim();
};

const parseJsonResponse = async (response, label) => {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  logDebug(`${label}: status=${response.status}, content-type=${contentType || "sin content-type"}, bytes=${raw.length}`);
  if (!response.ok) throw new Error(raw.slice(0, 500) || response.statusText);
  try {
    return JSON.parse(raw);
  } catch (err) {
    logDebug(`${label}: respuesta no JSON: ${raw.slice(0, 300).replace(/\s+/g, " ")}`);
    throw err;
  }
};

const backupApiCandidates = () => {
  const out = ["/api/backups"];
  const protocol = window.location.protocol || "http:";
  const host = window.location.hostname || "localhost";
  for (const port of [3036, 3035, 3034, 3033, 3032, 3031, 3030]) {
    out.push(`http://${host}:${port}/api/backups`);
    if (protocol === "https:") out.push(`https://${host}:${port}/api/backups`);
  }
  return [...new Set(out)];
};

const fetchBackupListFrom = async (apiBase) => {
  const response = await fetch(`${apiBase}/list`, { cache: "no-store" });
  return await parseJsonResponse(response, `lista ${apiBase}`);
};

const resolveBackupApi = async () => {
  const errors = [];
  for (const candidate of backupApiCandidates()) {
    try {
      logDebug(`probando API ${candidate}/list`);
      const json = await fetchBackupListFrom(candidate);
      backupApi = candidate;
      logDebug(`API activa: ${backupApi}`);
      return json;
    } catch (err) {
      errors.push(`${candidate}: ${err?.message || err}`);
    }
  }
  throw new Error(errors.join(" || "));
};

const parseNumbers = (text) =>
  text.trim().split(/[\s,;]+/).map(Number).filter(Number.isFinite);

const shortPathLabel = (path) => {
  const parts = String(path || "").split("/");
  const file = parts.pop() || "";
  const dir = parts.slice(-2).join("/");
  return dir ? `${file} - ${dir}` : file;
};

const visibleBackupFiles = () => {
  const query = String(backupFilter.value || "").trim().toLowerCase();
  return backupFiles
    .filter((file) => /\.(txt|json|csv)$/i.test(file.path || ""))
    .filter((file) => !query || String(file.path || "").toLowerCase().includes(query))
    .sort((a, b) => (b.mtimeMs || 0) - (a.mtimeMs || 0) || String(a.path).localeCompare(String(b.path), undefined, { numeric: true }));
};

const lastJsonLine = (text) => {
  const lines = String(text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("{") || lines[i].startsWith("[")) return lines[i];
  }
  return String(text ?? "");
};

const nextPowishTextureWidth = (count, dim) => {
  const pixels = Math.max(1, Math.ceil(count / Math.max(1, dim)));
  return Math.max(1, Math.ceil(Math.sqrt(pixels)));
};

const decodeBackupText = (text, fallbackName = "local", sourcePath = "") => {
  try {
    const parsed = JSON.parse(lastJsonLine(text));
    const value = parsed && Object.prototype.hasOwnProperty.call(parsed, "value") ? parsed.value : parsed;
    if (value?.__backupType === "texture2D") {
      return {
        name: parsed.varName || fallbackName,
        path: sourcePath || fallbackName,
        program: value.program || "programNA",
        w: Number(value.w) || 1,
        h: Number(value.h) || 1,
        dim: Number(value.dim) || 4,
        data: new Float32Array(value.data || []),
        sourceType: "texture2D",
      };
    }
    if (value?.__backupType && Array.isArray(value.data)) {
      const data = new Float32Array(value.data);
      const w = nextPowishTextureWidth(data.length, 1);
      const h = Math.max(1, Math.ceil(data.length / w));
      return { name: parsed.varName || fallbackName, path: sourcePath || fallbackName, w, h, dim: 1, data, sourceType: value.__backupType };
    }
    if (Array.isArray(value)) {
      const data = new Float32Array(value.map(Number).filter(Number.isFinite));
      const w = nextPowishTextureWidth(data.length, 1);
      const h = Math.max(1, Math.ceil(data.length / w));
      return { name: parsed.varName || fallbackName, path: sourcePath || fallbackName, w, h, dim: 1, data, sourceType: "array" };
    }
  } catch {}

  const nums = parseNumbers(text);
  const data = new Float32Array(nums.length ? nums : [0]);
  const w = nextPowishTextureWidth(data.length, 1);
  const h = Math.max(1, Math.ceil(data.length / w));
  return { name: fallbackName, path: sourcePath || fallbackName, w, h, dim: 1, data, sourceType: "text" };
};

const formatForDim = (dim) => {
  if (dim === 1) return TexExamples.RFloat;
  if (dim === 2) return TexExamples.RGFloat;
  if (dim === 3) return TexExamples.RGBFloat;
  return TexExamples.RGBAFloat;
};

const paddedData = (payload) => {
  const dim = Math.max(1, Math.min(4, payload.dim || 1));
  const need = payload.w * payload.h * dim;
  if (payload.data.length === need) return payload.data;
  const out = new Float32Array(need);
  out.set(payload.data.subarray(0, need));
  return out;
};

const hexToHsl = (hex) => {
  const raw = String(hex || "#000000").replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
};

const normalizeChannelInput = (value) => {
  const raw = String(value || "").replace(/[^rgbaRGBAxyzwXYZW]/g, "");
  if (/[xyzwXYZW]/.test(raw) && !/[rgbaRGBA]/.test(raw)) {
    return raw.toLowerCase();
  }
  return raw.replace(/[xyzwXYZW]/g, "").toUpperCase();
};

const channelPresetFromText = (value) => {
  const normalized = normalizeChannelInput(value) || "R";
  const map = { r: 0, g: 1, b: 2, a: 3, x: 0, y: 1, z: 2, w: 3 };
  const mask = [0, 0, 0, 0];
  for (const char of normalized.toLowerCase()) {
    const idx = map[char];
    if (idx !== undefined) mask[idx] = 1;
  }
  return { mask, count: mask.reduce((sum, item) => sum + item, 0), scalar: 0 };
};

const selectedChannelIndices = (value, dim) => {
  const preset = effectivePreset(channelPresetFromText(value), dim);
  const out = [];
  for (let i = 0; i < Math.max(1, Math.min(4, dim || 1)); i++) {
    if (preset.mask[i]) out.push(i);
  }
  return out.length ? out : [0];
};

const firstAvailableChannel = (preset, dim) => {
  const limit = Math.max(1, Math.min(4, dim || 1));
  for (let i = 0; i < limit; i++) {
    if (preset.mask[i]) return i;
  }
  return 0;
};

const effectivePreset = (preset, dim) => {
  const limit = Math.max(1, Math.min(4, dim || 1));
  const mask = preset.mask.map((value, idx) => idx < limit ? value : 0);
  const count = Math.max(1, mask.reduce((sum, value) => sum + value, 0));
  return { ...preset, mask, count, scalar: firstAvailableChannel({ ...preset, mask }, dim) };
};

const valueRangeFor = (payload, preset) => {
  const dim = Math.max(1, Math.min(4, payload?.dim || 1));
  const channel = dim === 1 ? 0 : preset.scalar;
  const displayW = Math.max(1, Math.min(payload?.w || 1, payload?.displayW || payload?.w || 1));
  const displayH = Math.max(1, Math.min(payload?.h || 1, payload?.displayH || payload?.h || 1));
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < displayH; y++) {
    for (let x = 0; x < displayW; x++) {
      const value = payload.data[(y * payload.w + x) * dim + channel];
      if (!Number.isFinite(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min, min + 1];
  return [min, max];
};

const hslToRgb01 = (h, s = 0.9, l = 0.55) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
};

const setSelectOptions = (select, files, preferred = "") => {
  if (!select) return;
  select.innerHTML = "";
  for (const file of files) {
    const option = document.createElement("option");
    option.value = file.path;
    option.textContent = `${shortPathLabel(file.path)} (${Math.round(file.size / 1024)} KB)`;
    option.title = file.path;
    select.appendChild(option);
  }
  if (!select.options.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = backupFiles.length ? "Sin resultados" : "No hay backups todavia";
    select.appendChild(option);
    return;
  }
  if (preferred && [...select.options].some((option) => option.value === preferred)) {
    select.value = preferred;
  }
};

class DebugViewer {
  constructor(index) {
    this.index = index;
    this.canvas = document.getElementById(`debugCanvas${index}`);
    this.fileLabel = document.getElementById(`viewerFile${index}`);
    this.backupSelect = document.querySelector(`[data-viewer-backup="${index}"]`);
    this.widthInput = document.querySelector(`[data-viewer-width="${index}"]`);
    this.heightInput = document.querySelector(`[data-viewer-height="${index}"]`);
    this.offsetXInput = document.querySelector(`[data-viewer-offset-x="${index}"]`);
    this.offsetYInput = document.querySelector(`[data-viewer-offset-y="${index}"]`);
    this.channelSelect = document.querySelector(`[data-viewer-channels="${index}"]`);
    this.renderModeSelect = document.querySelector(`[data-viewer-render-mode="${index}"]`);
    this.startColor = document.querySelector(`[data-viewer-start="${index}"]`);
    this.endColor = document.querySelector(`[data-viewer-end="${index}"]`);
    this.gl = null;
    this.webglMan = null;
    this.textureProgram = null;
    this.textureBuffer = null;
    this.textureVao = null;
    this.lineProgram = null;
    this.lineBuffer = null;
    this.lineVao = null;
    this.texture = null;
    this.payload = null;
    this.dirty = true;
    this.lineView = { zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0 };
    this.channelSelect.addEventListener("input", () => {
      const normalized = normalizeChannelInput(this.channelSelect.value);
      if (this.channelSelect.value !== normalized) this.channelSelect.value = normalized;
      this.markDirty();
    });
    this.channelSelect.value = normalizeChannelInput(this.channelSelect.value);
    this.widthInput.addEventListener("input", () => this.capDisplaySizeInput(this.widthInput, "w"));
    this.heightInput.addEventListener("input", () => this.capDisplaySizeInput(this.heightInput, "h"));
    this.offsetXInput.addEventListener("input", () => this.capOffsetInput(this.offsetXInput, "x"));
    this.offsetYInput.addEventListener("input", () => this.capOffsetInput(this.offsetYInput, "y"));
    this.renderModeSelect.addEventListener("change", () => this.markDirty());
    this.startColor.addEventListener("input", () => this.markDirty());
    this.endColor.addEventListener("input", () => this.markDirty());
    this.canvas.addEventListener("pointerdown", (event) => this.startLineDrag(event));
    this.canvas.addEventListener("pointermove", (event) => this.moveLineDrag(event));
    this.canvas.addEventListener("pointerup", () => this.endLineDrag());
    this.canvas.addEventListener("pointerleave", () => this.endLineDrag());
    this.canvas.addEventListener("wheel", (event) => this.zoomLine(event), { passive: false });
  }

  async init() {
    this.gl = this.canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (!this.gl) throw new Error("WebGL2 no disponible");
    this.webglMan = new WebGLMan(this.gl);
    this.initTextureProgram();
    this.initLineProgram();
    this.gl.clearColor(0.02, 0.025, 0.03, 1);
    this.gl.clearDepth(1);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.markDirty();
  }

  compileShader(type, source, label) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`${label}: ${gl.getShaderInfoLog(shader) || "shader compile failed"}`);
    }
    return shader;
  }

  linkProgram(vertexSource, fragmentSource, label) {
    const gl = this.gl;
    const vertex = this.compileShader(gl.VERTEX_SHADER, vertexSource, `${label} vertex`);
    const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`${label}: ${gl.getProgramInfoLog(program) || "program link failed"}`);
    }
    return program;
  }

  initTextureProgram() {
    const gl = this.gl;
    const program = this.linkProgram(`#version 300 es
      precision highp float;
      in vec2 aPos;
      out vec2 vUv;
      void main() {
        vUv = aPos * 0.5 + 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }`, `#version 300 es
      precision highp float;
      uniform sampler2D u_data;
      uniform int u_dim;
      uniform vec2 u_size;
      uniform vec2 u_displaySize;
      uniform vec2 u_offset;
      uniform vec2 u_uvScale;
      uniform int u_showGrid;
      uniform vec4 u_channelMask;
      uniform int u_channelCount;
      uniform int u_scalarChannel;
      uniform vec2 u_valueRange;
      uniform vec3 u_colorStartHsl;
      uniform vec3 u_colorEndHsl;
      in vec2 vUv;
      out vec4 outColor;
      vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
      }
      float pickChannel(vec4 c, int idx) {
        if (idx == 1) return c.g;
        if (idx == 2) return c.b;
        if (idx == 3) return c.a;
        return c.r;
      }
      vec3 packChannels(vec4 c) {
        vec4 values = vec4(c.r, c.g, c.b, c.a) * u_channelMask;
        vec3 outv = vec3(0.0);
        int outIdx = 0;
        for (int i = 0; i < 4; i++) {
          if (u_channelMask[i] > 0.5) {
            if (outIdx == 0) outv.r = values[i];
            if (outIdx == 1) outv.g = values[i];
            if (outIdx == 2) outv.b = values[i];
            outIdx++;
          }
        }
        return outv;
      }
      void main() {
        vec2 fittedUv = (vUv - 0.5) * u_uvScale + 0.5;
        if (fittedUv.x < 0.0 || fittedUv.x > 1.0 || fittedUv.y < 0.0 || fittedUv.y > 1.0) {
          outColor = vec4(0.02, 0.025, 0.03, 1.0);
          return;
        }
        vec2 pixel = floor(fittedUv * u_displaySize) + u_offset;
        vec2 cellUv = (pixel + 0.5) / u_size;
        vec4 c = texture(u_data, cellUv);
        if (u_channelCount == 1 || u_dim == 1) {
          float raw = pickChannel(c, u_dim == 1 ? 0 : u_scalarChannel);
          float denom = max(abs(u_valueRange.y - u_valueRange.x), 0.0000001);
          float t = clamp((raw - u_valueRange.x) / denom, 0.0, 1.0);
          outColor = vec4(hsl2rgb(mix(u_colorStartHsl, u_colorEndHsl, t)), 1.0);
        } else {
          outColor = vec4(packChannels(c), 1.0);
        }
        if (u_showGrid == 1) {
          vec2 grid = abs(fract(fittedUv * u_displaySize) - 0.5);
          float line = step(0.47, max(grid.x, grid.y));
          outColor.rgb = mix(outColor.rgb, vec3(0.0), line * 0.55);
        }
      }`, "texture debug");
    this.textureProgram = {
      program,
      aPos: gl.getAttribLocation(program, "aPos"),
      uData: gl.getUniformLocation(program, "u_data"),
      uDim: gl.getUniformLocation(program, "u_dim"),
      uSize: gl.getUniformLocation(program, "u_size"),
      uDisplaySize: gl.getUniformLocation(program, "u_displaySize"),
      uOffset: gl.getUniformLocation(program, "u_offset"),
      uUvScale: gl.getUniformLocation(program, "u_uvScale"),
      uShowGrid: gl.getUniformLocation(program, "u_showGrid"),
      uChannelMask: gl.getUniformLocation(program, "u_channelMask"),
      uChannelCount: gl.getUniformLocation(program, "u_channelCount"),
      uScalarChannel: gl.getUniformLocation(program, "u_scalarChannel"),
      uValueRange: gl.getUniformLocation(program, "u_valueRange"),
      uColorStartHsl: gl.getUniformLocation(program, "u_colorStartHsl"),
      uColorEndHsl: gl.getUniformLocation(program, "u_colorEndHsl"),
    };
    this.textureVao = gl.createVertexArray();
    this.textureBuffer = gl.createBuffer();
    gl.bindVertexArray(this.textureVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.textureProgram.aPos);
    gl.vertexAttribPointer(this.textureProgram.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  initLineProgram() {
    const gl = this.gl;
    const program = this.linkProgram(`#version 300 es
      in vec2 a_pos;
      uniform vec2 u_pan;
      uniform float u_zoom;
      void main(){
        gl_Position = vec4(a_pos * u_zoom + u_pan, 0.0, 1.0);
      }`, `#version 300 es
      precision highp float;
      uniform vec3 u_color;
      out vec4 outColor;
      void main(){ outColor = vec4(u_color, 1.0); }`, "line debug");
    this.lineProgram = {
      program,
      aPos: gl.getAttribLocation(program, "a_pos"),
      uPan: gl.getUniformLocation(program, "u_pan"),
      uZoom: gl.getUniformLocation(program, "u_zoom"),
      uColor: gl.getUniformLocation(program, "u_color"),
    };
    this.lineVao = gl.createVertexArray();
    this.lineBuffer = gl.createBuffer();
  }

  markDirty() {
    this.dirty = true;
  }

  updateBackupOptions(files) {
    setSelectOptions(this.backupSelect, files, this.backupSelect.value);
  }

  resizeCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.markDirty();
    }
  }

  capDisplaySizeInput(input, axis) {
    if (!this.payload) return;
    const offset = axis === "w" ? this.offsetX() : this.offsetY();
    const max = Math.max(1, (axis === "w" ? this.payload.w : this.payload.h) - offset);
    const raw = Math.floor(Number(input.value));
    const next = Math.max(1, Math.min(max, Number.isFinite(raw) ? raw : 1));
    input.max = String(max);
    if (String(next) !== input.value) input.value = String(next);
    if (axis === "w") this.payload.displayW = next;
    else this.payload.displayH = next;
    this.markDirty();
  }

  capOffsetInput(input, axis) {
    if (!this.payload) return;
    const sizeInput = axis === "x" ? this.widthInput : this.heightInput;
    const textureSize = axis === "x" ? this.payload.w : this.payload.h;
    const displaySize = Math.max(1, Math.floor(Number(sizeInput.value)) || 1);
    const max = Math.max(0, textureSize - displaySize);
    const raw = Math.floor(Number(input.value));
    const next = Math.max(0, Math.min(max, Number.isFinite(raw) ? raw : 0));
    input.max = String(max);
    if (String(next) !== input.value) input.value = String(next);
    this.markDirty();
  }

  setDisplaySizeInputs(width, height) {
    this.widthInput.max = String(width);
    this.heightInput.max = String(height);
    this.widthInput.value = String(width);
    this.heightInput.value = String(height);
    this.offsetXInput.max = "0";
    this.offsetYInput.max = "0";
    this.offsetXInput.value = "0";
    this.offsetYInput.value = "0";
  }

  offsetX() {
    return Math.max(0, Math.min(Math.max(0, (this.payload?.w || 1) - 1), Math.floor(Number(this.offsetXInput.value)) || 0));
  }

  offsetY() {
    return Math.max(0, Math.min(Math.max(0, (this.payload?.h || 1) - 1), Math.floor(Number(this.offsetYInput.value)) || 0));
  }

  displaySize() {
    const offX = this.offsetX();
    const offY = this.offsetY();
    const w = Math.max(1, Math.min((this.payload?.w || 1) - offX, Math.floor(Number(this.widthInput.value)) || 1));
    const h = Math.max(1, Math.min((this.payload?.h || 1) - offY, Math.floor(Number(this.heightInput.value)) || 1));
    if (String(w) !== this.widthInput.value) this.widthInput.value = String(w);
    if (String(h) !== this.heightInput.value) this.heightInput.value = String(h);
    if (String(offX) !== this.offsetXInput.value) this.offsetXInput.value = String(offX);
    if (String(offY) !== this.offsetYInput.value) this.offsetYInput.value = String(offY);
    this.offsetXInput.max = String(Math.max(0, (this.payload?.w || 1) - w));
    this.offsetYInput.max = String(Math.max(0, (this.payload?.h || 1) - h));
    this.payload.displayW = w;
    this.payload.displayH = h;
    return [w, h, offX, offY];
  }

  loadPayload(payload) {
    if (!payload) return;
    if (!this.textureProgram) {
      status(this.index, "WebGL aun no esta inicializado");
      return;
    }
    this.payload = payload;
    const gl = this.gl;
    const dim = Math.max(1, Math.min(4, payload.dim || 1));
    const format = formatForDim(dim);
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format[1], payload.w, payload.h, 0, format[0], format[2], paddedData(payload));
    payload.displayW = payload.w;
    payload.displayH = payload.h;
    this.setDisplaySizeInputs(payload.w, payload.h);
    this.lineView = { zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0 };
    this.fileLabel.textContent = payload.path || payload.name;
    this.fileLabel.title = payload.path || payload.name;
    status(this.index, `${payload.name} | ${payload.sourceType} | ${payload.w}x${payload.h} dim ${dim} | ${payload.program || ""}`);
    logDebug(`canvas ${this.index + 1}: cargado ${payload.path || payload.name}, ${payload.w}x${payload.h}, dim=${dim}`);
    this.markDirty();
  }

  applyTextureUniforms() {
    const gl = this.gl;
    const tp = this.textureProgram;
    const dim = Math.max(1, Math.min(4, this.payload?.dim || 1));
    const preset = effectivePreset(channelPresetFromText(this.channelSelect.value), dim);
    const [displayW, displayH, offsetX, offsetY] = this.displaySize();
    const imageAspect = Math.max(0.0001, displayW / displayH);
    const canvasAspect = Math.max(0.0001, this.canvas.width / this.canvas.height);
    const uvScale = canvasAspect > imageAspect
      ? [canvasAspect / imageAspect, 1]
      : [1, imageAspect / canvasAspect];
    gl.useProgram(tp.program);
    gl.uniform1i(tp.uData, 0);
    gl.uniform1i(tp.uDim, dim);
    gl.uniform2f(tp.uSize, this.payload.w, this.payload.h);
    gl.uniform2f(tp.uUvScale, uvScale[0], uvScale[1]);
    gl.uniform2f(tp.uDisplaySize, displayW, displayH);
    gl.uniform2f(tp.uOffset, offsetX, offsetY);
    gl.uniform1i(tp.uShowGrid, this.renderModeSelect.value === "textureGrid" ? 1 : 0);
    gl.uniform4fv(tp.uChannelMask, preset.mask);
    gl.uniform1i(tp.uChannelCount, preset.count);
    gl.uniform1i(tp.uScalarChannel, preset.scalar);
    gl.uniform2fv(tp.uValueRange, valueRangeFor(this.payload, preset));
    gl.uniform3fv(tp.uColorStartHsl, hexToHsl(this.startColor.value));
    gl.uniform3fv(tp.uColorEndHsl, hexToHsl(this.endColor.value));
  }

  sampleValue(x, y, channel) {
    const dim = Math.max(1, Math.min(4, this.payload?.dim || 1));
    return this.payload.data[(y * this.payload.w + x) * dim + Math.min(channel, dim - 1)] || 0;
  }

  lineSeries() {
    const dim = Math.max(1, Math.min(4, this.payload?.dim || 1));
    const channels = selectedChannelIndices(this.channelSelect.value, dim);
    const [displayW, displayH, offsetX, offsetY] = this.displaySize();
    const series = [];
    const usePairs = channels.length >= 2 && dim >= 2;

    if (usePairs) {
      for (let row = 0; row < displayH; row++) {
        const points = [];
        for (let col = 0; col < displayW; col++) {
          const x = offsetX + col;
          const y = offsetY + row;
          points.push([this.sampleValue(x, y, channels[0]), this.sampleValue(x, y, channels[1])]);
        }
        if (points.length > 1) series.push(points);
      }
      return series;
    }

    const scalars = [];
    const scalarChannel = channels[0] || 0;
    for (let row = 0; row < displayH; row++) {
      for (let col = 0; col < displayW; col++) {
        scalars.push(this.sampleValue(offsetX + col, offsetY + row, scalarChannel));
      }
    }
    const points = [];
    for (let i = 0; i + 1 < scalars.length; i += 2) points.push([scalars[i], scalars[i + 1]]);
    if (points.length > 1) series.push(points);
    return series;
  }

  drawLineMode() {
    const gl = this.gl;
    const lp = this.lineProgram;
    const series = this.lineSeries();
    const flat = series.flat();
    if (!flat.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of flat) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;
    const dx = Math.max(0.000001, maxX - minX);
    const dy = Math.max(0.000001, maxY - minY);
    const aspect = Math.max(0.0001, this.canvas.width / this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(lp.program);
    gl.bindVertexArray(this.lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.enableVertexAttribArray(lp.aPos);
    gl.vertexAttribPointer(lp.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(lp.uPan, this.lineView.panX, this.lineView.panY);
    gl.uniform1f(lp.uZoom, this.lineView.zoom);
    series.forEach((points, idx) => {
      const vertices = new Float32Array(points.length * 2);
      for (let i = 0; i < points.length; i++) {
        vertices[i * 2] = ((points[i][0] - minX) / dx * 2 - 1) / Math.max(1, aspect);
        vertices[i * 2 + 1] = (points[i][1] - minY) / dy * 2 - 1;
      }
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      const color = hslToRgb01(series.length <= 1 ? 0 : idx / Math.max(1, series.length - 1), 0.95, 0.55);
      gl.uniform3fv(lp.uColor, color);
      gl.drawArrays(gl.LINE_STRIP, 0, points.length);
    });
    gl.disableVertexAttribArray(lp.aPos);
    gl.bindVertexArray(null);
  }

  startLineDrag(event) {
    if (this.renderModeSelect.value !== "line") return;
    this.lineView.dragging = true;
    this.lineView.lastX = event.clientX;
    this.lineView.lastY = event.clientY;
    this.canvas.setPointerCapture?.(event.pointerId);
  }

  moveLineDrag(event) {
    if (!this.lineView.dragging) return;
    const dx = event.clientX - this.lineView.lastX;
    const dy = event.clientY - this.lineView.lastY;
    this.lineView.lastX = event.clientX;
    this.lineView.lastY = event.clientY;
    this.lineView.panX += dx / Math.max(1, this.canvas.clientWidth) * 2;
    this.lineView.panY -= dy / Math.max(1, this.canvas.clientHeight) * 2;
    this.markDirty();
  }

  endLineDrag() {
    this.lineView.dragging = false;
  }

  zoomLine(event) {
    if (this.renderModeSelect.value !== "line") return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.lineView.zoom = Math.max(0.05, Math.min(80, this.lineView.zoom * factor));
    this.markDirty();
  }

  draw() {
    if (!this.gl || !this.textureProgram) return;
    try {
      const gl = this.gl;
      this.resizeCanvas();
      if (!this.dirty) return;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.disable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!this.texture || !this.payload) {
        this.dirty = false;
        return;
      }
      if (this.renderModeSelect.value === "line") {
        this.drawLineMode();
      } else {
        gl.useProgram(this.textureProgram.program);
        gl.bindVertexArray(this.textureVao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.applyTextureUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
      }
      this.dirty = false;
    } catch (err) {
      logDebug(`canvas ${this.index + 1}: error dibujando: ${err?.message || err}`);
      status(this.index, `Error dibujando: ${err?.message || err}`);
      this.dirty = false;
    }
  }
}

const refreshList = async () => {
  const previousGlobal = backupSelect.value;
  backupSelect.innerHTML = "";
  logDebug(`GET backups/list`);
  try {
    let json;
    try {
      json = await fetchBackupListFrom(backupApi);
    } catch (err) {
      logDebug(`API actual fallo: ${err?.message || err}`);
      json = await resolveBackupApi();
    }
    backupFiles = Array.isArray(json.files) ? json.files : [];
    applyBackupFilter(previousGlobal);
    const visible = visibleBackupFiles();
    logDebug(`lista recibida: total=${backupFiles.length}, visibles=${visible.length}, filtro="${backupFilter.value || ""}"`);
    logDebug(`primeros: ${visible.slice(0, 5).map((file) => file.path).join(" | ") || "ninguno"}`);
    viewers.forEach((_, idx) => status(idx, `${visible.length} backups disponibles`));
  } catch (err) {
    backupFiles = [];
    setSelectOptions(backupSelect, [], "");
    viewers.forEach((viewer) => viewer.updateBackupOptions([]));
    viewers.forEach((_, idx) => status(idx, `Error cargando backups: ${err?.message || err}`));
    logDebug(`error lista: ${err?.message || err}`);
  }
};

const applyBackupFilter = (preferredGlobal = backupSelect.value) => {
  const files = visibleBackupFiles();
  setSelectOptions(backupSelect, files, preferredGlobal);
  viewers.forEach((viewer) => viewer.updateBackupOptions(files));
  logDebug(`aplicar filtro: visibles=${files.length}, filtro="${backupFilter.value || ""}"`);
};

const readBackupPath = async (path) => {
  if (!path) return null;
  logDebug(`GET ${backupApi}/file path=${path}`);
  let response = await fetch(`${backupApi}/file?path=${encodeURIComponent(path)}`, { cache: "no-store" });
  let text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || /text\/html/i.test(contentType)) {
    logDebug(`file fallo en ${backupApi}: status=${response.status}, content-type=${contentType}, muestra=${text.slice(0, 180).replace(/\s+/g, " ")}`);
    await resolveBackupApi();
    logDebug(`GET ${backupApi}/file path=${path}`);
    response = await fetch(`${backupApi}/file?path=${encodeURIComponent(path)}`, { cache: "no-store" });
    text = await response.text();
    if (!response.ok) throw new Error(text);
  }
  logDebug(`backup recibido: ${path} (${Math.round(text.length / 1024)} KB)`);
  return decodeBackupText(text, path.split("/").pop() || path, path);
};

const readSelectedBackup = async () => readBackupPath(backupSelect.value);

const readViewerBackup = async (index) => readBackupPath(viewers[index].backupSelect.value);

const readLocalFile = async () => {
  const file = localFile.files?.[0];
  if (!file) return null;
  logDebug(`archivo local: ${file.name} (${Math.round(file.size / 1024)} KB)`);
  return decodeBackupText(await file.text(), file.name, file.name);
};

const loadIntoViewer = async (index) => {
  activePayload = await readLocalFile() || await readViewerBackup(index) || await readSelectedBackup();
  if (!activePayload) return;
  viewers[index].loadPayload(activePayload);
};

refreshBtn.addEventListener("click", refreshList);
copyLogBtn.addEventListener("click", async () => {
  const text = debugLog.textContent || "";
  try {
    await navigator.clipboard.writeText(text);
    logDebug("log copiado al portapapeles");
  } catch (err) {
    logDebug(`no se pudo copiar el log: ${err?.message || err}`);
  }
});
backupFilter.addEventListener("input", () => applyBackupFilter());
loadBtn.addEventListener("click", async () => {
  activePayload = await readLocalFile() || await readSelectedBackup();
  viewers.forEach((viewer) => viewer.loadPayload(activePayload));
});

for (const button of document.querySelectorAll("[data-viewer-load]")) {
  button.addEventListener("click", () => loadIntoViewer(Number(button.dataset.viewerLoad)));
}

for (let i = 0; i < 3; i++) viewers.push(new DebugViewer(i));
await refreshList();
await Promise.all(viewers.map(async (viewer) => {
  try {
    await viewer.init();
  } catch (err) {
    status(viewer.index, `Error WebGL: ${err?.message || err}`);
  }
}));
start(() => viewers.forEach((viewer) => viewer.draw()));
