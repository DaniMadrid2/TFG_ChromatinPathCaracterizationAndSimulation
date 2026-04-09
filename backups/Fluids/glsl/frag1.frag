#version 300 es
precision highp float;
//this fragment Calculates velocities

uniform highp sampler2D u_inputTexture;
uniform highp sampler2D u_secondTexture;
uniform vec2 u_resolution; // Texture dimensions
uniform float u_deltaTime; // Time step
uniform int u_stepsPerCall; // Simulation steps per call
uniform int u_isPos; // Simulation steps per call
uniform float u_US; // Simulation steps per call
uniform int u_nCells; // Simulation steps per call
uniform int u_particleCount; // Simulation steps per call



uniform highp isampler2D spatialLookupTexture;  // Integer sampler
uniform highp isampler2D startSpatialLookupTexture;
uniform highp sampler2D u_sizeTexture;

flat in int v_idx;   // index of vertex (i.e. particle)
in float v_size;   // index of vertex (i.e. particle)

out vec4 fragColor;


float positionToCell(vec3 position) {
    return floor(23197.0*floor(position.x/u_US)+23345.0*floor(position.y/u_US)+10091.0*floor(position.z/u_US));
    // return floor(1.0*floor(position.x/u_US)+100.0*floor(position.y/u_US)+10000.0*floor(position.z/u_US));
}


// Iterates through startSpatialLookupTexture to find cellID
int findCellStartIndex(int cellID) {
    for ( int i = 0; i < u_particleCount; i++) {
        ivec2 lookup = texelFetch(startSpatialLookupTexture, ivec2(i,0), 0).rg;
        if (lookup.r == -1&&lookup.g==-1) {
            // End of valid entries
            break;
        }

        if (lookup.r == cellID) {
            return lookup.g; // Found: return start index
        }
    }

    return -1; // Not found
}


float getSize(int idx) {
    int texWidth = textureSize(u_sizeTexture, 0).x;
    int x = idx % texWidth;
    int y = idx / texWidth;

    return texelFetch(u_sizeTexture, ivec2(x, y), 0).r;
}


float actionFunc(float l){
    return 0.03/l/l;
    // float rad=1.5;
    // if(l>rad) return 0.;
    // return 0.55*pow(rad-l,2.);
}
float SpringActionFunc(float l){

    return 1.*(l-0.04);
}

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy );
    if(u_isPos==1){//Position is output
        vec3 newpos=texelFetch(u_inputTexture, coord, 0).rgb
        +texelFetch(u_secondTexture, coord, 0).rgb*0.01*u_deltaTime;
        fragColor = vec4(
        newpos
        ,positionToCell(newpos));
    }else{//Velocity is output
            
        vec3 position = texelFetch(u_inputTexture, coord, 0).xyz;
        vec3 velocity = texelFetch(u_secondTexture, coord, 0).rgb;
        
        
        float density = 1.0;
        vec3 totalForce = vec3(0.0);
        float scale=v_size;

        // Calculate density
        ivec3 searchOffset;
        for (searchOffset.x = -u_nCells; searchOffset.x <= u_nCells; searchOffset.x++) {
            for (searchOffset.y = -u_nCells; searchOffset.y <= u_nCells; searchOffset.y++) {
                for (searchOffset.z = -u_nCells; searchOffset.z <= u_nCells; searchOffset.z++) {
                    int cellID = int(positionToCell(position + vec3(searchOffset) * u_US));
                    int startIndex = findCellStartIndex(cellID);
                    if (startIndex >= 0) {
                        for (int i = 0; i < u_particleCount - startIndex; i++) {
                            ivec4 particleData = texelFetch(spatialLookupTexture, ivec2(startIndex + i, 0), 0);
                            int t_pid = particleData.g;
                            int tx=t_pid % int(u_resolution.x);
                            int ty=t_pid / int(u_resolution.x);
                            vec4 neigh = texelFetch(u_inputTexture, ivec2(tx, ty), 0);
                            int t_cellID = int(neigh.w);
                            if (t_pid < 0 || t_cellID != cellID || (tx==coord.x&&ty==coord.y)) break;
                            vec3 neighPos = neigh.xyz;
                            vec3 diff = neighPos - position;
                            float l = length(diff);

                            float other_scale=getSize(t_pid);
                            // velocity.z+=other_scale*1200.;
                            // if (l != 0.0) {
                                // density += 1.0 / (l * l * l);
                                // diff.z=0.0;
                            // }
                            if(l<=1.){
                                // ---- Axis-limited bonding ----
                                // Find which axis has the largest absolute component
                                vec3 absDiff = abs(diff);
                                // vec3 dir = vec3(0.0);
                                // if (absDiff.x > absDiff.y && absDiff.x > absDiff.z)
                                //     dir.x = sign(diff.x);
                                // else if (absDiff.y > absDiff.z)
                                //     dir.y = sign(diff.y);
                                // else
                                //     dir.z = sign(diff.z);
                                vec3 dir = normalize(diff);

                                // Bond parameters
                                float r_bind  = 0.05;  // equilibrium distance (bond "rest" length)
                                float k_bond  = 10.0; // stiffness, tweak to taste

                                // Project only along chosen axis
                                float d_axis = abs(dot(diff, dir));  // same as abs(diff[axis])
                                float stretch = pow(d_axis,1.) - r_bind;

                                // if(d_axis<0.000005){
                                //     k_bond*=20000.;
                                // }

                                // Hooke-like spring force along that axis
                                vec3 Fbond = k_bond * stretch * dir ;

                                // Apply to velocity (time step scale omitted if integrated elsewhere)
                                velocity += Fbond*u_deltaTime*other_scale/scale;
                                // velocity*=0.95;
                            }
                            
                            //Repulsion force
                            velocity+=-5000.*normalize(diff)*min(actionFunc(l),250.0)*other_scale/scale*u_deltaTime;
                            
                        }
                    }
                }
            }
        }

        // Pressure force
        // float pressure = max(density - 1.0, 0.0) * 1.0;
        // vec3 pressureForce = -pressure * normalize(velocity);

        // // Viscosity force
        // vec3 viscosityForce = velocity * 0.3; // Example value, adjust based on requirements

        // Boundary handling
        // if (position.x < -4.0) velocity.x += 1.3 * 100.0;
        // if (position.x > 4.0) velocity.x -= 1.3 * 100.0;
        // if (position.y < -4.0) velocity.y += 1.3 * 100.0;
        // if (position.y > 4.0) velocity.y -= 1.3 * 100.0;
        // if (position.z < -3.3) velocity.z += 1.3 * 100.0;
        // if (position.z > -1.0) velocity.z -= 1.3 * 100.0;

        //BoundaryBounce
        
        // velocity.y+=-5.0*0.3;
        bool isBouncyWall=false;
        if(isBouncyWall==true){  
            if (position.x < -3.5){
                velocity.x = abs(velocity.x);
                position.x = -3.5;
            }
            if (position.x > 3.5){
                velocity.x = -abs(velocity.x);
                position.x = 3.5;
            }
            if (position.y < -3.5){
                velocity.y = abs(velocity.y);
                position.y = -3.5;
            }
            if (position.y > 3.5){
                velocity.y = -abs(velocity.y);
                position.y = 3.5;
            }
            if (position.z < -3.5){
                velocity.z = abs(velocity.z);
                position.z = -3.5;
            }
            if (position.z > 3.5){
                velocity.z = -abs(velocity.z);
                position.z = 3.5;
            }
        }else{
            vec3 minB = vec3(-5.5);
            vec3 maxB = vec3( 5.5);

            // Soft boundary repulsion
            vec3 repulsion = vec3(0.0);
            float boundaryThickness = 0.2;   // how "soft" the boundary is
            float boundaryStrength  = 20.0; // how strong the push is

            // For each axis, apply soft restoring force if outside box
            for (int i = 0; i < 3; i++) {
                float below = minB[i] - position[i];
                float above = position[i] - maxB[i];
                if (below > 0.0) {
                    // below min boundary
                    float t = clamp(below / boundaryThickness, 0.0, 1.0);
                    repulsion[i] += boundaryStrength * t * t;  // smooth quadratic push
                } else if (above > 0.0) {
                    // above max boundary
                    float t = clamp(above / boundaryThickness, 0.0, 1.0);
                    repulsion[i] -= boundaryStrength * t * t;
                }
            }

            // Add soft damping near boundaries (optional)
            float damping = 0.95;
            if (any(greaterThan(abs(position) - maxB, vec3(0.0))))
                velocity *= damping;

            // Apply gravity if not grounded
            // "Grounded" = position.y <= minB.y + small threshold
            float groundDist = position.y - minB.y;
            if (groundDist > 0.001) {
                velocity.y += -9.8 * 0.3; // gravity
            } else {
                // small lift to prevent sinking
                repulsion.y += 20.0;
            }

            // Apply repulsion
            velocity += repulsion;

            // Clamp position inside box
            position = clamp(position, minB, maxB);


            
        }

        // Damping forces
        // velocity=normalize(velocity)*min(length(velocity),2000.0);
        // velocity *= 0.995;
        // velocity.z=0.0;

        // Combine forces
        // totalForce += pressureForce + viscosityForce;
        // velocity += totalForce;

        fragColor = vec4(velocity, 0);
    }
}
