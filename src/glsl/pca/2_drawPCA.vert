#version 300 es
//? Build a quad oriented along PCA axes for a selected chromatin.
//* Purpose: place principal directions in world/screen space for visual inspection.
//! Each draw call renders one chromatin's axis quad.
precision highp float;
precision mediump int;

layout(location = 0) in vec2 aPos;

uniform float uLength;
uniform vec2 uDirection;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform int nCromatin;
uniform int isPerp;

uniform vec3 offset;
uniform float scale;
uniform int lCromatin;
uniform int is3D;

uniform highp sampler2DArray datosX; //* size: [datosXLength, 1, nLayers]
uniform int datosXLength;
uniform highp sampler2DArray datosY; //* size: [datosYLength, 1, nLayers]
uniform int datosYLength;
uniform highp sampler2D datosPCA; //* size: [nCromatins, 1] = [v1, v2]
uniform highp sampler2D datosCenter; //* size: [nCromatins, 1] = [meanX, meanY, 0, 0]

float getFirstX(int n){
    int idx=n*lCromatin;
    int texIdx=idx / datosXLength;
    int texX = idx % datosXLength;
    return texelFetch(datosX, ivec3(texX, 0, texIdx), 0).r;
}
float getFirstY(int n){
    int idx=n*lCromatin;
    int texIdx=idx / datosYLength;
    int texX = idx % datosYLength;
    return texelFetch(datosY, ivec3(texX, 0, texIdx), 0).r;
}

vec2 getDirection(int n, int isPerp){
    if(isPerp!=0)
        return texelFetch(datosPCA, ivec2(n,0),0).zw;
    else
        return texelFetch(datosPCA, ivec2(n,0),0).xy;   
}

vec2 getCenter(int n){
    return texelFetch(datosCenter, ivec2(n,0),0).xy;
    
}

out vec2 vLocal;

void main() {

    // Base del plano según la dirección
    vec3 dir  = vec3(normalize(getDirection(nCromatin, isPerp)),0.);
    vec2 perp = vec2(-dir.y, dir.x);
    // vec3 basisX = vec3(dir, 0.0);
    // vec3 basisY = vec3(perp, 0.0);

    float halfL = 2.;

    /*
    aPos=
      -1, -1,
       1, -1,
       1,  1,
      -1,  1
    */

    // Posición en el plano
    vec3 localPos = dir * (aPos.x * halfL);

    // Ajuste al origen de la cromatina
    // vec2 origin = vec2(getFirstX(nCromatin), getFirstY(nCromatin));
    vec2 origin = getCenter(nCromatin);
    localPos.xy += origin;

    float sc=scale;
    if(is3D==0&&aPos.y>0.0){
        localPos.xy+=perp*halfL*0.1;
    }
    if(is3D!=0){
        sc=1.;
    }

    // Z del plano: primeros dos vértices z=0, otros dos z=-1
    float planeZ = (aPos.y > 0.0) ? ((float(lCromatin))/float(datosXLength)*-25.) : 0.0;

    // Transformación final
    vec4 pos = vec4(
        (localPos.x - 180.0 - offset.x) * sc * 0.025,
        (localPos.y - 350.0 + offset.y) * sc * 0.025,
        planeZ,
        1.0
    );


    if(is3D!=0){
        gl_Position = u_projectionMatrix * (u_viewMatrix * pos);
    }else
        gl_Position=vec4(pos.xy,0.,1.);
    vLocal = aPos;
}

