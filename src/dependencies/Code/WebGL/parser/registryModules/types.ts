export type RegistryHandler = (params: Map<string | number, any>, gl: WebGL2RenderingContext) => any;
export type RegistryTranspiler = (line: string, declaredVars: Set<string>) => string[] | null;

export type RegistryModule = {
    id: string;
    objects?: Record<string, RegistryHandler>;
    functions?: Record<string, RegistryHandler>;
    transpile?: RegistryTranspiler[];
    browserImports?: string[];
    browserSetup?: string[];
};

export type RegistryFactory = (parser: any, services: { WebGLMan: any; start: () => any; startAsync: () => Promise<any> }) => RegistryModule;

export type RegistryDefinition = {
    id: string;
    register: RegistryFactory;
    detectUse?: (source: string) => boolean | "Toggled";
};
