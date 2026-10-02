export class Triangle3D {
    constructor(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }
}
export class Triangle2D {
    constructor(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }
    barycentricCoords(p) {
        const v0 = this.v1.substract(this.v0);
        const v1 = this.v2.substract(this.v0);
        const v2 = p.substract(this.v0);
        const d00 = v0.dot(v0);
        const d01 = v0.dot(v1);
        const d11 = v1.dot(v1);
        const d20 = v2.dot(v0);
        const d21 = v2.dot(v1);
        const denom = d00 * d11 - d01 * d01;
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1.0 - v - w;
        return [u, v, w];
    }
    isPointInTriangle(p) {
        const [u, v, w] = this.barycentricCoords(p);
        return u >= 0 && v >= 0 && w >= 0 && (u + v + w) <= 1;
    }
}
;
