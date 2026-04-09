#version 300 es
precision highp float;

uniform sampler2D u_inputTexture;
uniform vec2 u_resolution; // Texture dimensions
uniform float u_deltaTime; // Time step

out vec4 fragColor;

void main() {
    vec2 coord = gl_FragCoord.xy*2.0 / u_resolution;
    vec4 velocity = texture(u_inputTexture, coord);

    // Update position using the velocity
    vec3 position = velocity.rgb * u_deltaTime;

    // Output updated position and velocity
    fragColor = vec4(position, 1.0);  // Position and constant value of 1.0
}
