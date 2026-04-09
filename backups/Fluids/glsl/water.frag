#version 300 es
precision highp float;
out vec4 outColor;
in vec2 v_uv;
uniform vec2 u_resolution;
uniform int u_nParticles;
uniform mediump int u_textureSize;
uniform mat4 u_modelMatrix;       // Model transformation matrix
uniform mat4 u_viewProjection;    // Combined view and projection matrix
uniform vec3 u_cameraPosition;    // Camera position in world space

// The single point we want to "raymarch" toward
uniform highp sampler2D u_positions;
uniform highp sampler2D u_sizeTexture;


vec3 getPos(int idx) {

    // return vec3(idx%10);
    return texelFetch(u_positions, 
    ivec2(idx % u_textureSize, idx / u_textureSize),
     0).rgb;
}

float getSize(int idx) {

    return texelFetch(u_sizeTexture, 
    ivec2(idx, 0),
     0).x;
}

vec3 project(vec3 p){
  return (u_viewProjection*u_modelMatrix*vec4(p,1.)).xyz;
}

float calcLength(vec3 p, int idx){
    return length(p-(u_viewProjection*u_modelMatrix*vec4(getPos(idx),1.0)).xyz);
}

vec2 mapScene(vec3 p) {
    float minDist=100.; //Distance to the closest point
    float maxPower=0.1; //power of the closest point
    for(int i = 0; i < u_nParticles; i++) {
        float dist=calcLength(p,i);
        float power=getSize(i);
        if(dist<minDist){
          minDist=dist;
          maxPower=power;
        }   
    }
    return vec2(minDist,maxPower);
}

void main() {
  vec2 uv = (v_uv - 0.5) * vec2(u_resolution.x/u_resolution.y, 1.0);
  vec3 ro = vec3(0.0, 0.0, -3.0); // Ray origin
  vec3 rd = normalize(vec3(uv, 1.5)); // Ray direction

  float t = 0.0;
  float d = 0.0;
  float minDist = 10.;
  float power= 0.;
  vec3 closestP;

  // Simple raymarch loop
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    vec2 da = mapScene(p);
    d=da.x;
    if(d<minDist){
      minDist=d;
      power=da.y;
      closestP=p;
    }
    t += d * 0.5; // step proportional to distance
    if(t>35.) break;
    if (d < 0.01) break;
  }

  if(minDist>1.){
    outColor=vec4(0.,0.,0.1,1.);
    return;
  }

  float totalPower=0.;
  for(int i = 0; i < u_nParticles; i++) {
      vec3 projectedP=project(getPos(i));
      if(length(closestP.xy-projectedP.xy)>1.5||projectedP.z<0.) continue;
      float dist=max(0.35,calcLength(closestP,i));
      totalPower+=1./sqrt(dist)*getSize(i);

         
  }


  // power=min(power,0.1);
  // Blue intensity increases as distance decreases
  minDist=max(0.05,minDist);
  // float intensity = 1. - clamp(pow(minDist,2.)*power/2., 0.0, 1.0);
  float intensity =   clamp(totalPower/float(u_nParticles)*12., 0.0, 1.0);
  vec3 color = mix(vec3(0.0, 0.0, 0.1), vec3(0.2, 0.5, 1.0), intensity);
  
  outColor = vec4(color, 1.0);
}