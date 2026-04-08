#version 300 es
//? Compute per-chromatin 2D PCA directions and centers from trajectory points.
//* Purpose: extract principal axes for visualization and alignment of trajectories.
//! Outputs are 1-row textures size [nCromatins, 1].
precision highp float;
precision mediump int;

uniform highp sampler2DArray datosX; //* size: [datosXLength, 1, nLayers]
uniform int datosXLength;
uniform highp sampler2DArray datosY; //* size: [datosYLength, 1, nLayers]
uniform int datosYLength;
uniform int lCromatin;

//!Salida
//? PCA directions packed as (v1, v2) for each chromatin.
layout(location = 0) out vec4 outData; //! size: [nCromatins, 1] = [v1.x, v1.y, v2.x, v2.y]
layout(location = 1) out vec4 outCenters; //! size: [nCromatins, 1] = [meanX, meanY, 0, 0]

float getX(int idx){
    int texIdx=idx/datosXLength;
    int texX = idx % datosXLength;
    return texelFetch(datosX, ivec3(texX, 0, texIdx), 0).r;
}

float getY(int idx){
    int texIdx=idx/datosYLength;
    int texX = idx % datosYLength;
    return texelFetch(datosY, ivec3(texX, 0, texIdx), 0).r;
}


void main(){
    ivec2 pos=ivec2(gl_FragCoord.xy-vec2(0.5));
    float sumX=0.;
    float sumY=0.;
    for(int i = 0; i < lCromatin; i++) {
        sumX+=getX(i+lCromatin*pos.x);
        sumY+=getY(i+lCromatin*pos.x);
    }
    float meanX=sumX/float(lCromatin);
    float meanY=sumY/float(lCromatin);
    float corrx=0.;//sum(cx*cx)
    float corrxy=0.;//sum(cx*cy)=sum(cy*cx)
    float corry=0.;//sum(cy*cy)
    for(int i = 0; i < lCromatin; i++) {
        float cx=getX(i+lCromatin*pos.x)-meanX;
        float cy=getY(i+lCromatin*pos.x)-meanY;

        corrx+=cx*cx;
        corrxy+=cx*cy;
        corry+=cy*cy;
    }



    // Matriz de correlación
    float a = corrx;
    float b = corrxy;
    float d = corry;

    // --- Eigenvalues ---
    float tr = a + d;
    float detTerm = (a - d) * (a - d) * 0.25 + b * b;
    float root = sqrt(detTerm);
    float lambda1 = tr * 0.5 + root;   // mayor
    float lambda2 = tr * 0.5 - root;   // menor

    // --- Eigenvector principal (v1) ---
    vec2 v1;
    if (abs(b) > 1e-6) {
        v1 = normalize(vec2(b, lambda1 - a));
    } else {
        v1 = (a >= d) ? vec2(1., 0.) : vec2(0., 1.);
    }

    // --- Segundo eigenvector ortogonal ---
    vec2 v2 = vec2(-v1.y, v1.x);

    // Ejemplo de salida
    outData = vec4(v1, v2);

    outCenters = vec4(meanX, meanY, 0., 0.);

}

// GLSL (versión moderna) - SVD económica para una matriz N×2 almacenada como array vec2 data[]
// Nota: adapta la forma de pasar arrays si tu entorno GLSL exige tamaños constantes.

const float EPS = 1e-8;

vec2 meanVec2(int n) {
    vec2 s = vec2(0.0);
    for (int i = 0; i < n; ++i) {
        s += vec2(getX(i),getY(i));
    }
    return s / float(max(n, 1));
}

// Build 2x2 Gram matrix M = (centered^T * centered)
// Returns M where M[0][0] = sum(cx*cx), M[0][1] = sum(cx*cy), M[1][0] = sum(cx*cy), M[1][1] = sum(cy*cy)
mat2 gramMatrix(const in vec2 centered[2532], int n) {
    float sxx = 0.0;
    float sxy = 0.0;
    float syy = 0.0;
    for (int i = 0; i < n; ++i) {
        vec2 c = centered[i];
        sxx += c.x * c.x;
        sxy += c.x * c.y;
        syy += c.y * c.y;
    }
    // Note: we do NOT normalize by n here so eigenvalues are sigma^2 directly (of centered^T * centered)
    return mat2(sxx, sxy,
                sxy, syy);
}

// Analytic symmetric 2x2 eigendecomposition
// Returns eigenvalues (lam1 >= lam2) and eigenvectors as columns of V (normalized)
void eigSym2(mat2 M, out vec2 evals, out mat2 V) {
    // M = [ a  b
    //       b  d ]
    float a = M[0][0];
    float b = M[0][1];
    float d = M[1][1];

    float trace = a + d;
    float det = a * d - b * b;
    float disc = trace * trace - 4.0 * det;
    disc = max(disc, 0.0);
    float sqrt_disc = sqrt(disc);

    float l1 = 0.5 * (trace + sqrt_disc);
    float l2 = 0.5 * (trace - sqrt_disc);

    // Build eigenvector for l1
    vec2 v1;
    if (abs(b) > EPS) {
        v1 = normalize(vec2(l1 - d, b)); // (a - l1, b) also works; chosen to avoid cancellation
    } else {
        // matrix nearly diagonal; pick canonical axis
        if (a >= d) v1 = vec2(1.0, 0.0);
        else v1 = vec2(0.0, 1.0);
    }

    // second eigenvector orthogonal to v1 (for symmetric real matrix we can take perpendicular)
    vec2 v2 = vec2(-v1.y, v1.x); // guaranteed orthogonal and normalized

    // Ensure eigenvalues sorted descending (l1 >= l2). If not, swap
    if (l1 >= l2) {
        evals = vec2(l1, l2);
        V = mat2(v1, v2); // columns are eigenvectors
    } else {
        evals = vec2(l2, l1);
        V = mat2(v2, v1);
    }
}

// Main routine: given data[], n -> outputs meanxy, centered[], U[], S (vec2), V (mat2), new_traj[]
// Note: arrays passed in must have at least size n.
void svd2d_economic(const in vec2 data[2532], int n,
                    out vec2 meanxy,
                    out vec2 centered[2532],   // length n
                    out vec2 U[2532],          // length n (each row is the corresponding U row but still stored as vec2)
                    out vec2 S,            // singular values [s1, s2]
                    out mat2 V,            // V matrix (columns are principal directions)
                    out vec2 new_traj[2532]    // length n
                    )
{
    // 1) mean and center
    meanxy = meanVec2(n);
    // centerData(n, meanxy, centered);

    // 2) Gram matrix M = centered^T * centered (2x2)
    mat2 M = gramMatrix(centered, n);

    // 3) eigendecompose M -> eigenvalues = sigma^2, eigenvectors -> V
    vec2 evals;
    eigSym2(M, evals, V);

    // 4) singular values
    float s1 = sqrt(max(evals.x, 0.0));
    float s2 = sqrt(max(evals.y, 0.0));
    S = vec2(s1, s2);

    // 5) new_traj = centered * V  (project centered points onto V columns)
    for (int i = 0; i < n; ++i) {
        // centered[i] is a row vector; multiply by V(2x2) => result vec2
        // column access: V[0] is first column, V[1] is second column in this mat2 arrangement
        vec2 v1 = V[0]; // first column
        vec2 v2 = V[1]; // second column
        new_traj[i] = vec2(dot(centered[i], v1), dot(centered[i], v2));
    }

    // 6) U (if needed) = centered * V * inv(S)  -> divide each column of new_traj by corresponding singular value
    for (int i = 0; i < n; ++i) {
        vec2 proj = new_traj[i];
        float u0 = (s1 > EPS) ? (proj.x / s1) : 0.0;
        float u1 = (s2 > EPS) ? (proj.y / s2) : 0.0;
        U[i] = vec2(u0, u1);
    }

    // Now we have meanxy, centered[], U[], S, V, new_traj[]
}

