import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = (parser, { start, startAsync }) => ({
    id: "lifecycle",
    functions: {
        start: () => start(),
        startAsync: async () => startAsync(),
        log: () => {},
        let: (params) => {
            const name = params.get("match0");
            const value = params.get(name);
            parser.ctx.vars.set(value === undefined ? name : name.trim(), value === undefined ? null : value);
        },
        lduse: async (params, gl) => {
            const program = parser.getVar(params.get(0));
            if (program && typeof program.use === "function" && typeof program.loadProgram === "function") {
                await parser.loadProgramWithShaderFilters(program, gl);
                program.use();
                parser.lastUsedProgram = program;
                return program;
            }
        },
        use: async (params) => {
            const program = parser.getVar(params.get(0));
            if (program && typeof program.use === "function") {
                program.use();
                parser.lastUsedProgram = program;
                return program;
            }
        },
    },
});
