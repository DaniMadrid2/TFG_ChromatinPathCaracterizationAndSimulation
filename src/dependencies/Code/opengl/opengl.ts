// @ts-nocheck


export async function loadShaderSource(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader file: ${url}`);
    }
    return response.text();
}

// Parser helper (compatibilidad): transforma callbacks tipo string a funcion JS.
// Se mantiene separado aqui para que los generatedParser no redefinan este helper.
export function __prepareMathFunction(callbackString: string) {
    let prepared = (callbackString || "").trim().replace(/;$/, "");
    prepared = prepared.replace(/\{(\w+)\}/g, "($1)");
    prepared = prepared.replace(/(?<!\.)\b(sin|cos|tan|exp|floor|ceil|min|max|round|random|abs|pow|sqrt|atan2|log|PI)\b/g, "Math.$1");
    return eval(prepared);
}

// Parser helper (compatibilidad): monta bloques globales por prioridad/orden.
// Nota: recibimos addFunc por parametro para no acoplar opengl.ts al modulo Start.
export function __mountGlobalBlocks(
    globalBlocks: Array<{priority:number, order:number, fn:(dt:any)=>any}>,
    addFunc: (fn:(dt:any)=>any)=>any
) {
    if (!globalBlocks?.length) return;
    globalBlocks.sort((a,b)=> (a.priority-b.priority) || (a.order-b.order));
    let running = false;
    addFunc(async (dt:any)=>{
        if (running) return;
        running = true;
        try {
            for (const item of globalBlocks) {
                await item.fn(dt);
            }
        } finally {
            running = false;
        }
    });
}

// Parser helper (compatibilidad): misma logica que antes generaba webglParser para filtros.
export async function __loadProgramWithShaderFilters(
    gl: any,
    obj: any,
    vertexPath: any,
    fragmentPath: any,
    vertexFilter: (src:string)=>string,
    fragmentFilter: (src:string)=>string
) {
    // Wrapper de compatibilidad: la logica real de carga/compilacion vive en loadShaders(...).
    const [program, vert, frag] = await loadShaders(
        gl,
        vertexPath,
        fragmentPath,
        vertexFilter,
        fragmentFilter
    );
    if (!program || !vert || !frag) {
        throw new Error(`Could not compile/link program ${vertexPath} / ${fragmentPath}`);
    }
    obj.program = program;
    obj.vert = vert;
    obj.frag = frag;
    obj.uniforms = new Map();
    obj.nUsedTextures = 0;
    return obj;
}
  
export async function loadShaders(gl, vertexPath, fragmentPath, vertexFilter=(a:string)=>a, fragmentFilter=(a)=>a) {
    const [vertexSource, fragmentSource] = await Promise.all([
        loadShaderSource(vertexPath),
        loadShaderSource(fragmentPath),
    ]);

    return loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter, fragmentFilter);
}
export async function loadShadersFromString(gl, vertexSource, fragmentSource, vertexFilter=(a:string)=>a, fragmentFilter=(a)=>a) {
    const filteredVertexSource = vertexFilter(vertexSource);
    const filteredFragmentSource = fragmentFilter(fragmentSource);
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, filteredVertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, filteredFragmentSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    return [program,vertexShader,fragmentShader];
}
  
export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
}
  
export function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Error linking program: ${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }
    return program;
}

export function createTexture(gl:WebGL2RenderingContext, data, width, height,format?,internalformat?, type?) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set up texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Initialize texture with data
    gl.texImage2D(
        gl.TEXTURE_2D,      // Target
        0,                  // Level
        internalformat||gl.RGBA32F,         // Internal format
        Math.max(width,16),              // Width
        Math.max(height,16),             // Height
        0,                  // Border
        format||gl.RGBA,            // Format
        type||gl.FLOAT,           // Type
        data||null          // Data
    );

    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
    return texture;
}

export function createFramebuffer(gl:WebGL2RenderingContext, texture) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // const renderbuffer = gl.createRenderbuffer();
    // gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 32,32);
    // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);


    gl.bindTexture(gl.TEXTURE_2D, texture); // Unbind texture
    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // Target
        gl.COLOR_ATTACHMENT0, // Attachment point
        gl.TEXTURE_2D,        // Texture target
        texture,              // Texture
        0                     // Level
    );

    //Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log("FramebufferIncompleteAttachment",gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT.toString(16));
        console.log("FramebufferIncompleteDimensions",gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS.toString(16));
        console.log("FramebufferUnsupported",gl.FRAMEBUFFER_UNSUPPORTED.toString(16));
        console.error(`Framebuffer not complete: 0x${status.toString(16)}`);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Unbind framebuffer
    return framebuffer;
  }
  
export function fillFramebuffer(gl, framebuffer, texture, data) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, texture.width, texture.height, gl.RGBA, gl.FLOAT, data);
}
  
