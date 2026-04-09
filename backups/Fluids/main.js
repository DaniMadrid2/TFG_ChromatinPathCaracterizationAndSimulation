import { createCanvas, Scene, KeyManager, keypress, MouseManager, ScreenManager } from "/Code/Game/Game.js";
import { addFunc, start, stop } from "/Code/Start/start.js";
const W = 1080, H = 720;
let sc = new Scene();
let { ctx } = createCanvas("c1", W, H, sc).append().center().modern();
let { ctx: ctx2 } = createCanvas("c2", W, H, sc).append().center().modern();
ctx.fillStyle = "blue";
ctx2.imageSmoothingEnabled = false;
let gpu = new window.GPU({ graphical: true, dynamicOutput: true, mode: "gpu" });
ctx.options.posStyle = true;
ctx2.options.posStyle = true;
KeyManager.detectKeys();
MouseManager.EnableCanvas(ctx.canvas);
MouseManager.EnableCanvas(ctx2.canvas);
let time = 0;
function numDot(x, y) {
    return x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
}
gpu.addFunction(numDot);
function subs(x, y) {
    return [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
}
gpu.addFunction(subs);
function add(x, y) {
    return [x[0] + y[0], x[1] + y[1], x[2] + y[2]];
}
gpu.addFunction(add);
function scMult(x, sc) {
    return [x[0] * sc, x[1] * sc, x[2] * sc];
}
gpu.addFunction(scMult);
function capColor(x) {
    if (x < 0)
        return 0;
    if (x > 1)
        return 1;
    return x;
}
gpu.addFunction(capColor);
function positionToCell(position, US) {
    return 23197 * Math.floor(position[0] / US) + 23345 * Math.floor(position[1] / US) + 10091 * Math.floor(position[2] / US);
}
gpu.addFunction(positionToCell);
function offsetToCell(offset) {
    return 23197 * offset[0] + 23345 * offset[1] + 10091 * offset[2];
}
gpu.addFunction(offsetToCell);
function calculateCellIndices(particles, US) {
    const spatialIndices = [];
    for (let i = 0; i < particles.length; i++) {
        spatialIndices[i] = [positionToCell(particles[i], US), i];
    }
    spatialIndices.sort((a, b) => { return a[0] > b[0] ? 1 : 0; });
    return spatialIndices;
}
const US = 300;
let particleRadius = 40;
function calculateStartCellIndices(spatialIndices) {
    let lastCellI = -1;
    const startSpatialIndexArr = [];
    for (let i = 0; i < spatialIndices.length; i++) {
        if (lastCellI != spatialIndices[i][0]) {
            startSpatialIndexArr.push([spatialIndices[i][0], i]);
            lastCellI = spatialIndices[i][0];
        }
    }
    return startSpatialIndexArr;
}
function getForce(distance) {
    if (distance > 35000)
        return 0;
    let value = distance / 10;
    return value * value * value;
}
gpu.addFunction(getForce);
function parsePosVel(val1, val2) {
    val1 = Math.floor(val1 * 100);
    val2 = Math.floor(val2 * 100);
    val1 = val1 & 0x1FFFF;
    const magnitude = Math.abs(val2) & 0x3FFF;
    const sign = val2 < 0 ? 1 : 0;
    const resultBits = (val1 << 15) | (sign << 14) | magnitude;
    return resultBits;
}
gpu.addFunction(parsePosVel);
const nParts = 10;
const tickParticles = gpu.createKernel((function (particles, velocities, spatialIndxs, spatialIndxslength, startSpatialIndxs, startSpatialIndxslength, US, dt, cellCountRadius) {
    const idx = this.thread.x * 3 + 0.0;
    const pos = [particles[idx + 0], particles[idx + 1], particles[idx + 2]];
    const cell = positionToCell(pos, US);
    let vx = velocities[idx + 0];
    let vy = velocities[idx + 1];
    let vz = velocities[idx + 2];
    for (let i = -cellCountRadius; i < cellCountRadius + 1; i++) {
        for (let j = -cellCountRadius; j < cellCountRadius + 1; j++) {
            for (let k = -cellCountRadius; k < cellCountRadius + 1; k++) {
                const ncell = cell + offsetToCell([i, j, k + 1]);
                let startLookUp = -1;
                for (let na = 0; na < startSpatialIndxslength; na++) {
                    if (startSpatialIndxs[2 * na + 0] == ncell) {
                        startLookUp = startSpatialIndxs[2 * na + 1];
                        break;
                    }
                }
                if (startLookUp < 0)
                    continue;
                for (let n = spatialIndxs[startLookUp * 2 + 1]; n < spatialIndxslength; n++) {
                    const neighPos = [particles[spatialIndxs[2 * n + 1] * 3 + 0],
                        particles[spatialIndxs[2 * n + 1] * 3 + 1], particles[spatialIndxs[2 * n + 1] * 3 + 2]];
                    const tmpcellIndx = spatialIndxs[2 * n + 0];
                    if (ncell !== tmpcellIndx)
                        continue;
                    let dx = neighPos[0] - pos[0];
                    let dy = neighPos[1] - pos[1];
                    let dz = neighPos[2] - pos[2];
                    if (dz < 1)
                        dz = 0;
                    if (dx == 0 && dy == 0 && dz == 0)
                        continue;
                    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    let force = -getForce(distance);
                    vx += force * dx / distance / 10;
                    vy += force * dy / distance / 10;
                    vz += force * dz / distance / 10;
                }
            }
        }
    }
    if (Math.sqrt(vx * vx + vy * vy + vz * vz) > 1) {
        vx /= Math.sqrt(vx * vx + vy * vy + vz * vz);
        vy /= Math.sqrt(vx * vx + vy * vy + vz * vz);
        vz /= Math.sqrt(vx * vx + vy * vy + vz * vz);
    }
    if (particles[idx + 0] > 1080) {
        vx = -0.2;
    }
    if (particles[idx + 0] < 0) {
        vx = 0.2;
    }
    if (particles[idx + 1] > 720) {
        vy = -0.2;
    }
    if (particles[idx + 1] < 0) {
        vy = 0.2;
    }
    if (particles[idx + 2] > 1080) {
        vz = -0.2;
    }
    if (particles[idx + 2] < 0) {
        vz = 0.2;
    }
    let px = particles[idx + 0] + vx * 10;
    let py = particles[idx + 1] + vy * 10;
    let pz = particles[idx + 2] + vz * 10;
    return [parsePosVel(px, vx), parsePosVel(py, vy), parsePosVel(pz, vz), 1];
})).setOutput([nParts]);
let particles = [];
let velocities = [];
for (let i = 0; i < nParts; i++) {
    particles.push([W / 2, Math.random() * H, 0]);
    velocities.push([0, 0, 0]);
}
function extractPosVel(float32Value) {
    const bits = float32Value;
    const val1 = (bits >> 15) & 0x1FFFF;
    const sign = (bits >> 14) & 0x1;
    const magnitude = bits & 0x3FFF;
    const val2 = sign === 0 ? magnitude : -magnitude;
    return [val1 / 100, val2 / 100];
}
let spatialIndxs = calculateCellIndices(particles, US);
let startSpatialIndxs = calculateStartCellIndices(spatialIndxs);
addFunc((dt) => {
    try {
        ctx.cls("black");
        sc.draw();
        time += dt;
        if (!particles || !velocities || !tickParticles)
            return;
        spatialIndxs = calculateCellIndices(particles, US);
        startSpatialIndxs = calculateStartCellIndices(spatialIndxs);
        if (particles.length !== nParts)
            return;
        if (velocities.length !== nParts)
            return;
        if (spatialIndxs.length !== nParts)
            return;
        let parcVels = tickParticles(particles.flat(), velocities.flat(), spatialIndxs.flat(), spatialIndxs.length, startSpatialIndxs.flat(), startSpatialIndxs.length, US, dt, 1);
        for (let i = 0; i < parcVels.length; i++) {
            let [x, y, z] = parcVels[i];
            let [px, vx] = extractPosVel(x);
            let [py, vy] = extractPosVel(y);
            let [pz, vz] = extractPosVel(z);
            if (Math.random() < 0.01)
                console.log(px, py, pz, vx, vy, vz);
            particles[i] = [px, py, pz];
            velocities[i] = [vx, vy, vz];
            let zfactor = Math.abs((((pz || 0.001) + 300) / 300));
            if (pz < -10 || zfactor > 100)
                continue;
            ctx.circle((px - W / 2) / zfactor + W / 2, (py - H / 2) / zfactor + H / 2, 40 / zfactor, 40 / zfactor, "blue");
        }
        if (keypress.f && !ScreenManager.isFullScreen()) {
            ctx.openFullScreen();
        }
        ctx.font = "50px Arial";
        ctx.fillText((~~(1 / dt)) + "", 30, 70);
    }
    catch (err) {
        if (!(err + "").includes("source array is too long"))
            stop();
        else {
            if (Math.random() < 0.01) {
                console.log(particles.flat(), velocities.flat(), startSpatialIndxs.flat());
            }
        }
    }
});
start();
