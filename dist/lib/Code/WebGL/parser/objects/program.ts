import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = (parser, { WebGLMan }) => ({
    id: "program",
    objects: {
        Program: (params, gl) => {
            if (!WebGLMan.stWebGLMan.gl) WebGLMan.setGL(gl);
            const program = parser.gctx.WebGLMan.program(-1, params.get(0) || params.get("firstAlias"));
            parser.lastUsedProgram = program;
            return program;
        },
    },
});
