#version 300 es
precision highp float;

// Attributes
in vec3 a_position; // Particle position in 3D space
in float a_size; 

// Uniforms
uniform mat4 u_modelMatrix;       // Model transformation matrix
uniform mat4 u_viewProjection;    // Combined view and projection matrix
uniform vec3 u_cameraPosition;    // Camera position in world space

// Outputs to the fragment shader
out vec3 v_fragPosition;          // Position in world space
out vec3 v_viewDirection;         // Direction from fragment to the camera

void main() {
    // Transform position into world space
    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);

    // Compute view direction for lighting
    v_viewDirection = normalize(u_cameraPosition - worldPosition.xyz);
    
    // Transform position into clip space
    gl_Position = u_viewProjection * worldPosition;
    // gl_Position = vec4(worldPosition.x,0.0,0.0,1.0);

    
    // Pass fragment position to the fragment shader
    v_fragPosition = a_position;

    // Adjust point size for perspective (optional)
    float scale=a_size;
    // if(gl_VertexID%4==0){
    //     scale=pow(4.,0.33);
    // }
    gl_PointSize = 40.0/(abs(gl_Position.z/2.0))*scale; // Adjust size as needed
}
