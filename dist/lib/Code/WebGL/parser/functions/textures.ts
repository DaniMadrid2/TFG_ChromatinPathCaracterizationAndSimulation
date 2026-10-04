import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = parser => ({
    id: "textures",
    functions: {
        texture2DArray: (params) => {
            let sx = 0, sy = 0, sz = 0;
            const size = params.get(4);
            if (Array.isArray(size)) {
                if (size[0] !== undefined) sx = size[0];
                if (size[1] !== undefined) sy = size[1];
                if (size[2] !== undefined) sz = size[2];
            }
            let data = params.get(1);
            if (!data.startsWith("{")) data = "{" + data + "}";
            return parser.lastUsedProgram?.texture2DArray?.({
                format: parser.gctx.TexExamples[params.get(0)],
                data: parser.parseValue(data),
                name: params.get(2),
                texUnit: params.get(3),
                size: [sx, sy, sz],
            });
        },
    },
});
