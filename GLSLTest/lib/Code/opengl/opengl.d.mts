export declare function loadShaderSource(url: any): Promise<string>;
export declare function loadShaders(gl: any, vertexPath: any, fragmentPath: any): Promise<any[]>;
export declare function loadShadersFromString(gl: any, vertexSource: any, fragmentSource: any): Promise<any[]>;
export declare function createShader(gl: any, type: any, source: any): any;
export declare function createProgram(gl: any, vertexShader: any, fragmentShader: any): any;
export declare function createTexture(gl: WebGL2RenderingContext, data: any, width: any, height: any, format?: any, internalformat?: any, type?: any): WebGLTexture;
export declare function createFramebuffer(gl: WebGL2RenderingContext, texture: any): WebGLFramebuffer;
export declare function fillFramebuffer(gl: any, framebuffer: any, texture: any, data: any): void;
