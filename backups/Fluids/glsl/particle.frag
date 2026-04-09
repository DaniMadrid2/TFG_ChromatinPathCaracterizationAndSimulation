#version 300 es
precision highp float;

// Inputs from the vertex shader
in vec3 v_fragPosition;   // Position in world space
in vec3 v_viewDirection;  // Direction to the camera

// Uniforms
uniform vec3 u_lightDirection; // Direction of the sunlight
uniform vec3 u_lightColor;     // Color of the sunlight
uniform vec3 u_ambientColor;   // Ambient light color
uniform vec3 u_cameraPosition;    // Camera position in world space

// Output color
out vec4 outColor;

void main() {
    // Convert gl_PointCoord (0 to 1 range) to a sphere's coordinates
    vec2 coord = gl_PointCoord * 2.0 - 1.0;  // Map to range [-1, 1]
    float distSquared = dot(coord, coord);

    // Discard fragments outside the sphere's radius
    if (distSquared >= 1.05) discard;

    // Calculate normal for the sphere at this point
    vec3 normal = normalize(vec3(coord, sqrt(1.0 - distSquared)));

    // Lighting calculations
    float diffuse = max(dot(normal, -u_lightDirection), 0.0);
    float lengthFactor=min(pow(4.0/(max(length(u_cameraPosition-v_fragPosition)-0.0,0.001)),2.),1.0);
    vec3 color = diffuse * u_lightColor * max(lengthFactor,0.1) + u_ambientColor;

    // Output color
    outColor = vec4(color, 1.0);
}
