#version 300 es
//? Scan all model costs and compute top-K statistics (best, threshold, maxValid).
//* Purpose: define a **global cost cutoff** used to mask candidate models.
//! Output is a single-pixel stats texture size [1, 1].
precision highp float;
precision mediump int;

uniform sampler2D tauXiMetaFinal; //* size: [tauMax, tauMax] = [cost, valid, nUsed, reserved]
uniform int tauMax;
uniform int tauMin;
uniform float keepPercent; // 0..100 (ej. 20 => top 20%)

in vec2 vUV;
//!Salida
//? Single texel with best/threshold/maxValid/targetK for mask selection and visualization.
//* bestCost = el costo más bajo encontrado entre los modelos válidos, usado como referencia para normalizar los costos de los modelos.
//* threshold = el costo del modelo que marca el corte para el top-K, donde K = ceil(nValid * keepPercent / 100). Solo los modelos con costo <= threshold serán considerados en etapas posteriores.
//* maxValid = el costo máximo entre los modelos válidos. Se usa en visualización para estirar el mapa de coste y recuperar contraste.
//* targetK = el número real de modelos que caen dentro del top-K, que puede ser menor que KMAX si hay pocos modelos válidos.
layout(location = 0) out vec4 tauStats; //! size: [1, 1] = [bestCost, threshold, maxValid, targetK]

//KMAX es el número máximo de costos que almacenamos para calcular las estadísticas top-K.
//Cada costo empieza en un valor muy alto (1e30) para asegurar que cualquier costo real lo reemplazará.
const int KMAX = 128;

void main(){
    float top[KMAX]; //lista ordenada de mayores costes, esto lo queremos para calcular el umbral de corte y la media de los mejores modelos.
    for(int i=0; i<KMAX; i++) top[i] = 1e30;

    int nValid = 0;
    float bestCost = 1e30;
    float maxValidCost = 0.0;

    int tMin = max(tauMin, 1);
    for(int t=1; t<=256; t++){
        if(t > tauMax) break;
        if(t < tMin) continue;
        //s es el índice de subsecuencia, que no puede ser mayor que tau
        for(int s=0; s<256; s++){
            if(s >= t) break;

            vec4 xs = texelFetch(tauXiMetaFinal, ivec2(t-1, s), 0);
            float cost = xs.x;
            float valid = xs.y;
            float nUsed = xs.z;
            if(valid < 0.5 || nUsed < 4.0) continue;

            nValid++;
            if(cost < bestCost) bestCost = cost;
            if(cost > maxValidCost) maxValidCost = cost;

            //Si el costo de este modelo es menor que el peor costo en nuestro top-K, lo insertamos en la lista de top-K y la ordenamos.
            if(cost < top[KMAX-1]){
                top[KMAX-1] = cost;
                for(int j=KMAX-1; j>0; j--){
                    if(top[j] < top[j-1]){
                        float tmp = top[j-1];
                        top[j-1] = top[j];
                        top[j] = tmp;
                    }
                }
            }
        }
    }

    if(nValid <= 0){
        tauStats = vec4(1e9, 1e9, 1e9, 0.0);
        return;
    }

    int targetK = int(ceil(float(nValid) * clamp(keepPercent, 0.01, 100.0) / 100.0));
    if(targetK < 1) targetK = 1;
    if(targetK > KMAX) targetK = KMAX;

    float sumTop = 0.0;
    int cntTop = 0;
    for(int i=0; i<KMAX; i++){
        if(i >= targetK) break;
        if(top[i] >= 1e29) break;
        sumTop += top[i];
        cntTop++;
    }
    float threshold = (cntTop > 0) ? top[cntTop - 1] : bestCost;

    //Revisor: z ya no almacena la media del top-K, porque el mapa de coste necesitaba una cota superior real para no colapsar todo en el mismo color.
    tauStats = vec4(bestCost, threshold, maxValidCost, float(targetK));
}



