import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = parser => ({
    id: "rendering",
    functions: {
        draw: (params) => {
            const obj = parser.getVar(params.get(0));
            if (obj && parser.getVar("camera3D")) {
                parser.lastUsedProgram.use();
                parser.getVar("camera3D").calculateMatrices();
                parser.lastUsedProgram.draw(0, 0, params.get(1), params.get(2), params.get(3));
            }
        },
        viewport: (params) => {
            let program = parser.lastUsedProgram;
            let viewport;
            let raw = params.get(0);
            if (!raw.startsWith("{")) raw = "{" + raw + "}";
            const value = parser.parseValue(raw);
            const next = params.get(1);
            if (value?.isWebProgram?.()) {
                program = value;
                if (Array.isArray(next)) viewport = next;
            } else if (Array.isArray(value)) {
                viewport = params.get(0);
            }
            if (!viewport) return;
            program.use();
            program.setViewport(...viewport);
        },
        depthTest: (params) => {
            if (parser.lastUsedProgram) parser.lastUsedProgram.isDepthTest = params.get(0);
        },
        drawArrays: (params, gl) => {
            const program = parser.lastUsedProgram;
            if (!program) return;
            const mode = gl[String(params.get(0) || "TRIANGLES").toUpperCase()] || gl.TRIANGLES;
            const offset = params.get("off") ?? params.get(1) ?? 0;
            const count = params.get("vCount") ?? params.get("length") ?? params.get("vertexCount") ?? params.get(2);
            const instances = params.get("instances") ?? params.get("instanceCount") ?? params.get(3) ?? 1;
            return program.drawArrays(mode, offset, count, instances);
        },
        drawElements: (params, gl) => {
            const program = parser.lastUsedProgram;
            if (!program) return;
            const mode = gl[String(params.get(0) || "TRIANGLES").toUpperCase()] || gl.TRIANGLES;
            const count = params.get("elCount") ?? params.get("elementCount") ?? params.get(1) ?? program.VAO?.eboLength;
            const rawType = params.get("type") ?? params.get(2) ?? "US";
            const type = ({ UB: "UNSIGNED_BYTE", US: "UNSIGNED_SHORT", UI: "UNSIGNED_INT" } as Record<string, string>)[rawType] || rawType;
            const offset = params.get("off") ?? params.get("eboOff") ?? params.get(3) ?? 0;
            const instances = params.get("instances") ?? params.get("instanceCount") ?? params.get(4) ?? 0;
            return program.drawElements(mode, count, type, offset, instances);
        },
    },
});
