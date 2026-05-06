#version 300 es
precision highp float;

uniform sampler2D u_data;
uniform int u_dim;
uniform vec2 u_size;
uniform vec2 u_displaySize;
uniform vec2 u_offset;
uniform vec2 u_uvScale;
uniform int u_showGrid;
uniform vec4 u_channelMask;
uniform int u_channelCount;
uniform int u_scalarChannel;
uniform vec2 u_valueRange;
uniform vec3 u_colorStartHsl;
uniform vec3 u_colorEndHsl;

in vec2 vUv;
out vec4 outColor;

vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
}

float pickChannel(vec4 c, int idx) {
    if (idx == 1) return c.g;
    if (idx == 2) return c.b;
    if (idx == 3) return c.a;
    return c.r;
}

vec3 packChannels(vec4 c) {
    vec4 values = vec4(c.r, c.g, c.b, c.a) * u_channelMask;
    vec3 outv = vec3(0.0);
    int outIdx = 0;
    for (int i = 0; i < 4; i++) {
        if (u_channelMask[i] > 0.5) {
            if (outIdx == 0) outv.r = values[i];
            if (outIdx == 1) outv.g = values[i];
            if (outIdx == 2) outv.b = values[i];
            outIdx++;
        }
    }
    return outv;
}

void main() {
    vec2 fittedUv = (vUv - 0.5) * u_uvScale + 0.5;
    if (fittedUv.x < 0.0 || fittedUv.x > 1.0 || fittedUv.y < 0.0 || fittedUv.y > 1.0) {
        outColor = vec4(0.02, 0.025, 0.03, 1.0);
        return;
    }

    vec2 pixel = floor(fittedUv * u_displaySize) + u_offset;
    vec2 cellUv = (pixel + 0.5) / u_size;
    vec4 c = texture(u_data, cellUv);

    if (u_channelCount == 1 || u_dim == 1) {
        float raw = pickChannel(c, u_dim == 1 ? 0 : u_scalarChannel);
        float denom = max(abs(u_valueRange.y - u_valueRange.x), 0.0000001);
        float t = clamp((raw - u_valueRange.x) / denom, 0.0, 1.0);
        vec3 hsl = mix(u_colorStartHsl, u_colorEndHsl, t);
        outColor = vec4(hsl2rgb(hsl), 1.0);
    } else {
        outColor = vec4(packChannels(c), 1.0);
    }

    if (u_showGrid == 1) {
        vec2 grid = abs(fract(fittedUv * u_displaySize) - 0.5);
        float line = step(0.47, max(grid.x, grid.y));
        outColor.rgb = mix(outColor.rgb, vec3(0.0), line * 0.55);
    }
}
