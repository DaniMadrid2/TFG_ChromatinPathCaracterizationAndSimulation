#version 300 es
//? Stream trajectory points from texture arrays into clip/world space.
//* Purpose: render raw chromatin tracks as line strips or points.
//! Each vertex corresponds to one sample index across all chromatins.
precision highp float;
precision mediump int;

uniform highp sampler2DArray datosX; //* size: [datosXLength, 1, nLayers]
uniform int datosXLength;
uniform highp sampler2DArray datosY; //* size: [datosYLength, 1, nLayers]
uniform int datosYLength;
uniform int lCromatin;

uniform vec3 offset;
uniform float scale;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 cameraPos;
uniform int is3D;

flat out int v_idx;

float getX(){
    int idx=gl_VertexID;
    int texIdx=idx/datosXLength;
    int texX = idx % datosXLength;
    return texelFetch(datosX, ivec3(texX, 0, texIdx), 0).r;
}

float getY(){
    int idx=gl_VertexID;
    int texIdx=idx/datosYLength;
    int texX = idx % datosYLength;
    return texelFetch(datosY, ivec3(texX, 0, texIdx), 0).r;
}

void main(){
    v_idx=gl_VertexID;

    vec4 position = vec4((getX()-180.-offset.x)*0.025*scale, (getY()-350.+offset.y)*0.025*scale,
        mod(float(gl_VertexID),float(lCromatin))/float(datosXLength)*-25.,1.);
    // position = vec4((getX()-140.)*0.25, (getY()-347.)*0.25,0.,1.);
    gl_PointSize = 20.0; 
    if(is3D!=0){
        vec4 worldPosition = u_viewMatrix * position;
        gl_Position = u_projectionMatrix * worldPosition;
    }else
        gl_Position=vec4(position.xy,0.,1.);
}

