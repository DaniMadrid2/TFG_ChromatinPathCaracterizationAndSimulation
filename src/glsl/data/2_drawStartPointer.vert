#version 300 es
precision highp float;
precision mediump int;

uniform highp sampler2DArray datosX;
uniform int datosXLength;
uniform highp sampler2DArray datosY;
uniform int datosYLength;
uniform int lCromatin;

uniform highp sampler2D startPosTex;
uniform int useStartPosTex;
uniform int selectedChromatin;

uniform vec3 offset;
uniform float scale;
uniform float markerSize;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform int is3D;

void main(){
    float x = 0.0;
    float y = 0.0;
    int c = max(selectedChromatin, 0);
    if(useStartPosTex != 0){
        vec4 p = texelFetch(startPosTex, ivec2(c, 0), 0);
        x = p.x;
        y = p.y;
    }else{
        int idx = c * lCromatin;
        int tx = idx / datosXLength;
        int xx = idx % datosXLength;
        int ty = idx / datosYLength;
        int yx = idx % datosYLength;
        x = texelFetch(datosX, ivec3(xx, 0, tx), 0).r;
        y = texelFetch(datosY, ivec3(yx, 0, ty), 0).r;
    }

    vec4 position = vec4((x-180.0-offset.x)*0.025*scale, (y-350.0+offset.y)*0.025*scale, 0.0, 1.0);
    gl_PointSize = markerSize;
    if(is3D != 0){
        vec4 worldPosition = u_viewMatrix * position;
        gl_Position = u_projectionMatrix * worldPosition;
    }else{
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
}

