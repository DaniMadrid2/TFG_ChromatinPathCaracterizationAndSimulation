import type { RegistryFactory } from "../registryModules/types.js";

export const register: RegistryFactory = parser => ({
    id: "camera",
    namedParamsOnly: ["Camera3D"],
    objects: {
        //@dnti-namedParamsOnly
        Camera3D: (params) => {
            const camera = new parser.gctx.Camera3D(
                params.get("pos"), params.get("fov"),
                params.get("aspectRatio") || params.get("ratio"),
                params.get("near"), params.get("far"),
                params.get("walkspeed") || params.get("speed")
            );
            if (!parser.gctx.cam) parser.gctx.cam = camera;
            return camera;
        },
    },
});
