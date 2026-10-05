import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = parser => ({
    id: "framebuffer",
    functions: {
        cFrameBuffer: () => parser.lastUsedProgram?.cFrameBuffer(),
        unbindFrameBuffer: () => parser.lastUsedProgram?.unbindFrameBuffer(),
        unbindFBO: () => parser.lastUsedProgram?.unbindFBO(),
    },
});
