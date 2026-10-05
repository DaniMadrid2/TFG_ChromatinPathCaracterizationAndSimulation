import type { RegistryFactory, RegistryHandler } from "../registryModules/types.js";

export const register: RegistryFactory = parser => ({
    id: "uniforms",
    functions: Object.fromEntries(
        ["uMat4", "uMat3", "uMat2", "uVec", "uNum", "uFloat", "uInt"].map(name => [name, ((params) => {
            const program = parser.lastUsedProgram;
            if (!program) return;
            const uniformName = params.get(0);
            let args: any[] = [uniformName];
            if (name === "uVec") {
                args = [uniformName, params.get("dim") ?? params.get("dimension"),
                    params.get("isFloat") ?? true, params.get("isUnsignedInt") ?? false];
            } else if (name === "uNum") {
                args = [uniformName, params.get("isFloat") ?? true, params.get("isUnsignedInt") ?? false];
            }
            const uniform = program[name](...args);
            parser.ctx.vars.set(`u_${uniformName}`, uniform);
            if (params.has(2)) uniform.set(params.get(args.length));
            return uniform;
        }) as RegistryHandler])
    ),
});
