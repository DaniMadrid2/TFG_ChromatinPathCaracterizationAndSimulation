var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createCanvas, Scene, KeyManager, keypress, mousepos, MouseManager, openFullscreen, mouseclick } from "/Code/Game/Game.js";
import { Vector3D, Matrix4D, Quaternion } from "/Code/Matrix/Matrix.js";
import { start } from "/Code/Start/start.js";
import { Funcion, Axis } from "/Code/MathRender/MathRender.js";
import { createTexture, createFramebuffer, loadShaders } from "./opengl.js";
const W = 1080, H = 720;
const isDrawWater = false;
const WidthFactor = isDrawWater ? 1 / 4 : 1;
let sc = new Scene();
let { ctx: ctx1, canvas } = createCanvas("c1", W * WidthFactor, H * WidthFactor, sc, "webgl2").append().center();
let { ctx: ctx2, canvas: canvas2 } = createCanvas("c2", W * WidthFactor, H * WidthFactor, sc, "webgl2").append();
let { ctx: ctx3, canvas: canvas3 } = createCanvas("c3", W * WidthFactor, H * WidthFactor, sc, "2d").append().modern().center();
let dntiDir = window.dntiDir;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const ctx = ctx3;
    const gl = ctx1;
    const gl2 = ctx2;
    let following = false;
    let ifollow = 300;
    let tracking = false;
    let showGraph = false;
    let trackingArray = new Float32Array(3 * Math.pow(2, 13));
    let ntrack = 0;
    var concentrations = [
        [1, 50],
        [2, 50],
    ];
    const particleCount = Math.max(Math.pow(2, 9), 264);
    const US = 1;
    const nCells = 2;
    const textureSize = Math.ceil(Math.sqrt(particleCount));
    canvas2.width = textureSize;
    canvas2.height = textureSize;
    let particles = new Float32Array(textureSize * textureSize * 4);
    let velocities = new Float32Array(textureSize * textureSize * 4);
    let sizes = new Float32Array(particleCount);
    let sizesCbrt = new Float32Array(particleCount);
    let spatialLookUp = new Int32Array(particleCount * 2);
    let startsSpatialLookUp = new Int32Array(particleCount * 2);
    for (let i = 0; i < particleCount * 4; i++) {
        const idx = i * 4;
        particles[idx] = Math.random() * 6 - 3;
        particles[idx + 1] = Math.random() * 6 - 3;
        particles[idx + 2] = Math.random() * 6 - 3;
    }
    for (let i = 0; i < particleCount * 4; i += 4) {
        let nx = Math.random();
        let ny = Math.random();
        let nz = Math.random();
        nx = 0;
        ny = 0;
        nz = 0;
        velocities[i + 0] = nx * 10;
        velocities[i + 1] = ny * 10;
        velocities[i + 2] = nz * 10;
    }
    (() => {
        sizes = new Float32Array(particleCount).fill(1);
        const particleGroups = concentrations.map(([size, percent]) => {
            const count = Math.floor((percent / 100) * particleCount);
            return { size, count };
        });
        const indices = Array.from({ length: particleCount }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        let offset = 0;
        for (const { size, count } of particleGroups) {
            for (let i = 0; i < count && offset + i < indices.length; i++) {
                const index = indices[offset + i];
                sizes[index] = size;
            }
            offset += count;
            for (let i = 0; i < sizes.length; i++) {
                sizesCbrt[i] = Math.cbrt(sizes[i]);
            }
        }
    })();
    let renderProgram, particleBuffer, sizeBuffer, waterProgram, positionTexture, sizeTexture, traceProgram, trackingBuffer, traceVao, depthBuffer, p_framebuffer, t_framebuffer, particlesVAO;
    if (!isDrawWater) {
        [renderProgram, particleBuffer, sizeBuffer, depthBuffer, p_framebuffer, particlesVAO] = yield initParticleRendering(gl, particles, sizesCbrt);
        [traceProgram, trackingBuffer, traceVao, t_framebuffer] = yield initTraceRendering(gl, trackingArray, depthBuffer);
    }
    else
        [waterProgram, positionTexture, sizeTexture] = yield initWaterRendering(gl, particles, sizes, particleCount, textureSize);
    let camera = {
        viewMatrix: Matrix4D.Identity,
        projectionMatrix: Matrix4D.Identity,
        position: new Vector3D(0, 0, 10),
        followPosition: new Vector3D(0, 0, 1.3),
        direction: new Vector3D(0, 0, -1),
        UP: new Vector3D(0, 1, 0),
    };
    KeyManager.detectKeys();
    MouseManager.EnableCanvas(canvas2);
    MouseManager.EnableCanvas(canvas3);
    MouseManager.EnableCanvas(canvas);
    let pressDTime = 0;
    KeyManager.OnKey("t", () => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        tracking = !tracking;
    });
    KeyManager.OnKey("r", () => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        ntrack = 0;
        trackingArray = new Float32Array(trackingArray.length);
    });
    KeyManager.OnKey("f", (e) => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        following = !following;
    });
    KeyManager.OnKey("v", () => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        showGraph = !showGraph;
    });
    KeyManager.OnKey("g", () => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        ifollow--;
    });
    KeyManager.OnKey("h", () => {
        if (pressDTime > 0)
            return;
        pressDTime = 0.2;
        ifollow++;
    });
    let fov = 130;
    let aspectRatio = 16 / 9;
    let near = 0.001, far = 10000;
    function calculateProjectionViewMatrix() {
        let viewMatrix = Matrix4D.createLookAtMatrixFromDirection(camera.position, camera.direction, camera.UP);
        let projectionMatrix = Matrix4D.createProjectionMatrix(fov, aspectRatio, near, far);
        return [viewMatrix, projectionMatrix];
    }
    [camera.viewMatrix, camera.projectionMatrix] = calculateProjectionViewMatrix();
    const light = {
        direction: [1, -1, -1],
        color: [0.0, 1.0, 1.0],
        ambient: [0.2, 0.2, 0.2],
    };
    const [simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture] = yield initParticleSimulation(gl2, particles, sizes, particleCount, spatialLookUp, startsSpatialLookUp, US, nCells);
    function createUniformBuffer(gl, data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }
    for (let i = 0; i < particles.length; i += 4) {
        spatialLookUp[i / 2] = positionToCell([particles[i + 0], particles[i + 2], particles[i + 3]], US);
        spatialLookUp[i / 2 + 1] = i / 4;
    }
    spatialLookUp.set(sortOddsOnly(spatialLookUp));
    let lastCellIndex = 0;
    let startIdx = 0;
    for (let i = 0; i < spatialLookUp.length; i += 2) {
        const cellid = spatialLookUp[i];
        const particle_index = spatialLookUp[i + 1];
        if (lastCellIndex !== cellid) {
            startsSpatialLookUp[startIdx] = cellid;
            startsSpatialLookUp[startIdx + 1] = i / 2;
            lastCellIndex = cellid;
            startIdx += 2;
        }
    }
    if (startIdx < startsSpatialLookUp.length - 1) {
        startsSpatialLookUp[startIdx] = -1;
        startsSpatialLookUp[startIdx + 1] = -1;
    }
    function sortOddsOnly(arr) {
        let arr2 = [];
        for (let i = 0; i < arr.length / 2; i++) {
            arr2[i] = [arr[i * 2 + 0], arr[i * 2 + 1]];
        }
        arr2.sort((a, b) => {
            return a[0] - b[0];
        });
        return new Int32Array(arr2.flat());
    }
    var lastTick = performance.now();
    var now = performance.now();
    var dt = 0;
    let tau = 1;
    let axis1 = new Axis(0, H / 4 * 3 + 150);
    let r = new Funcion(0, 0, (i) => Math.pow((Math.hypot(trackingArray[i * 3 + 0], trackingArray[i * 3 + 1], trackingArray[i * 3 + 2]) -
        Math.hypot(trackingArray[(i - tau) * 3 + 0], trackingArray[(i - tau) * 3 + 1], trackingArray[(i - tau) * 3 + 2])), 2) * 10000 / (r.ex - r.sx), 1, 1, trackingArray.length / 3).setOnAxis(axis1).setWidth(2).setColor("red").drawEveryTime(true)
        .setBounds(1, ntrack);
    sc.add(r);
    function draw(dtime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isDrawWater) {
                gl.useProgram(renderProgram);
                gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW, 0);
                yield drawParticles(gl, renderProgram, particleBuffer, sizeBuffer, camera, light, particleCount, p_framebuffer, particlesVAO);
                gl.useProgram(traceProgram);
                yield drawTrace(gl, traceProgram, trackingBuffer, camera, light, ntrack, trackingArray, traceVao, t_framebuffer, tracking);
            }
            else {
                gl.useProgram(waterProgram);
                yield drawWater(gl, waterProgram, positionTexture, sizeTexture, camera, light, particleCount, textureSize, particles, sizes);
            }
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                console.error("WebGL draw Error: ", error);
            }
            ctx.cls();
            ctx.font = "20px Arial";
            ctx.fillStyle = "white";
            ctx.fillText((~~(1 / dt)) + "", 30, 30);
            ctx.fillStyle = "orange";
            ctx.fillText((~~(1 / dtime)) + "", 30, 60);
            if (ntrack > W) {
                let n = ~~(ntrack / W);
                r.setOff(-(Math.max(ntrack - 3, 0) - W), r.offy);
            }
            if (showGraph) {
                let nGraphs = 20;
                let sums = new Array(nGraphs - 1).fill(0);
                for (let j = 1; j < nGraphs; j++) {
                    tau = j * 5;
                    r.setBounds(Math.max(ntrack - 3, 0) - W, Math.max(ntrack - 3, 0) - tau).setEqMaxBounds();
                    r.setColor(HSLtoRGB(j * 8, 80, 50, 0.5));
                    sc.draw();
                    sums[j - 1] = 0;
                    for (let i = r.sx; i < r.ex; i++) {
                        sums[j - 1] += (-r.eval(i) - r.y) || 0;
                    }
                    sums[j - 1] /= r.ex - r.sx;
                    sums[j - 1] *= 10;
                }
                Funcion.fromSet(sums).setOff(axis1.x, H / 2)
                    .drawEveryTime(true).setColor("orange").setWidth(2).draw(ctx);
            }
        });
    }
    function HSLtoRGB(h, s, l, trs = 1) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return `rgba(${255 * f(0)},${255 * f(8)},${255 * f(4)},${trs})`;
    }
    ;
    let RotSW = keypress.createSwitch("e", "q");
    let DepthSW = keypress.createSwitch("r", "f");
    let lastMousePos = Object.assign({}, mousepos);
    const walkspeed = 10;
    function tick() {
        return __awaiter(this, void 0, void 0, function* () {
            now = performance.now();
            dt = (now - lastTick) / 1000;
            if (dt > 0.1)
                dt = 0.1;
            if (pressDTime > 0)
                pressDTime -= dt;
            let dmousex = mousepos.x - lastMousePos.x;
            let dmousey = mousepos.y - lastMousePos.y;
            let dmov = 6.5;
            let noMouse = false;
            if (keypress.right)
                (noMouse = true, dmousex = dmov);
            if (keypress.left)
                (noMouse = true, dmousex = -dmov);
            if (keypress.up)
                (noMouse = true, dmousey = -dmov);
            if (keypress.down)
                (noMouse = true, dmousey = dmov);
            dmousex *= fov / 60;
            dmousey *= fov / 60;
            if ((mouseclick[0] || noMouse) && Math.abs(dmousex) < 100 && Math.abs(dmousey) < 100) {
                let invertY = 1;
                let invertX = 1;
                if (following)
                    invertY = -1;
                camera.direction = Quaternion.rotateVector(camera.direction, camera.UP, -dmousex / 1000 * Math.PI * 1.2 * invertX);
                camera.direction = Quaternion.rotateVector(camera.direction, camera.UP.cross(camera.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
                camera.UP = Quaternion.rotateVector(camera.UP, camera.UP.cross(camera.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
                if (following) {
                    camera.followPosition = Quaternion.rotateVector(camera.followPosition, camera.UP, -dmousex / 1000 * Math.PI * 1.2 * invertX);
                    camera.followPosition = Quaternion.rotateVector(camera.followPosition, camera.UP.cross(camera.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
                }
            }
            if (following) {
                let centerVector = new Vector3D(particles[ifollow * 4], particles[ifollow * 4 + 1], particles[ifollow * 4 + 2]);
                camera.followPosition = camera.followPosition
                    .add(camera.direction.cross(camera.UP).scalar(keypress.Hor() * walkspeed * dt))
                    .add(camera.UP.scalar(keypress.Depth() * walkspeed * dt))
                    .add(camera.direction.scalar(-keypress.Ver() * walkspeed * dt));
                camera.position = centerVector.add(camera.followPosition);
            }
            else {
                camera.position = camera.position
                    .add(camera.direction.cross(camera.UP).scalar(keypress.Hor() * walkspeed * dt))
                    .add(camera.UP.scalar(keypress.Depth() * walkspeed * dt))
                    .add(camera.direction.scalar(-keypress.Ver() * walkspeed * dt));
            }
            if (following) {
            }
            if (tracking) {
                trackingArray[ntrack * 3 + 0] = particles[ifollow * 4];
                trackingArray[ntrack * 3 + 1] = particles[ifollow * 4 + 1];
                trackingArray[ntrack * 3 + 2] = particles[ifollow * 4 + 2];
                if (trackingArray[ntrack * 3 + 0] || trackingArray[ntrack * 3 + 1] || trackingArray[ntrack * 3 + 2])
                    ntrack++;
                if (Math.random() < 0.01) {
                    console.log(ntrack, trackingArray.length / 3);
                }
                if (ntrack >= trackingArray.length / 3) {
                    tracking = false;
                    console.log("trackingArray", trackingArray);
                }
            }
            lastMousePos = Object.assign({}, mousepos);
            if (keypress.p) {
                openFullscreen(canvas);
            }
            [camera.viewMatrix, camera.projectionMatrix] = calculateProjectionViewMatrix();
            [particles, velocities] = yield tickParticleVelocitiesSimulation(gl2, { simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture, textureSize }, particles, velocities, spatialLookUp, startsSpatialLookUp, 1, dt, particleCount);
            for (let i = 0; i < particles.length; i += 4) {
                spatialLookUp[i / 2] = particles[i + 3];
                spatialLookUp[i / 2 + 1] = i / 4;
            }
            spatialLookUp.set(sortOddsOnly(spatialLookUp));
            let lastCellIndex = 0;
            let startIdx = 0;
            for (let i = 0; i < spatialLookUp.length; i += 2) {
                const cellid = spatialLookUp[i];
                const particle_index = spatialLookUp[i + 1];
                if (lastCellIndex !== cellid) {
                    startsSpatialLookUp[startIdx] = cellid;
                    startsSpatialLookUp[startIdx + 1] = i / 2;
                    lastCellIndex = cellid;
                    startIdx += 2;
                }
            }
            if (startIdx < startsSpatialLookUp.length - 1) {
                startsSpatialLookUp[startIdx] = -1;
                startsSpatialLookUp[startIdx + 1] = -1;
            }
            lastTick = now;
            setTimeout(tick, 1);
        });
    }
    start((dtime) => __awaiter(void 0, void 0, void 0, function* () {
        draw(dtime);
    }));
    tick();
}))();
function initParticleSimulation(gl, particles, sizes, particleCount, spatialLookUp, startsSpatialLookUp, US, nCells) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!gl.getExtension('EXT_color_buffer_float')) {
            console.error('EXT_color_buffer_float not supported by your GPU or browser.');
        }
        const textureSize = Math.ceil(Math.sqrt(particleCount));
        const inputTexture = createTexture(gl, particles, textureSize, textureSize, gl.RGBA);
        const secondTexture = createTexture(gl, particles, textureSize, textureSize, gl.RGBA);
        const outputTexture = createTexture(gl, null, textureSize, textureSize, gl.RGBA);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        const framebuffer = createFramebuffer(gl, inputTexture);
        const framebuffer2 = createFramebuffer(gl, secondTexture);
        const sizesTexture = createTexture(gl, null, particleCount, 1, gl.RED, gl.R32F, gl.FLOAT);
        const spatialLookupTexture = createTexture(gl, null, particleCount, 1, gl.RG_INTEGER, gl.RG32I, gl.INT);
        const startSpatialLookupTexture = createTexture(gl, null, particleCount, 1, gl.RG_INTEGER, gl.RG32I, gl.INT);
        const [program] = yield loadShaders(gl, dntiDir + "/glsl/vert1.vert", dntiDir + "/glsl/frag1.frag");
        gl.useProgram(program);
        gl.uniform1i(gl.getUniformLocation(program, 'u_inputTexture'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'u_secondTexture'), 1);
        gl.uniform1i(gl.getUniformLocation(program, 'spatialLookupTexture'), 3);
        gl.uniform1i(gl.getUniformLocation(program, 'startSpatialLookupTexture'), 4);
        gl.uniform1i(gl.getUniformLocation(program, 'u_sizeTexture'), 5);
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), textureSize, textureSize);
        gl.uniform1f(gl.getUniformLocation(program, 'u_deltaTime'), 0.1);
        gl.uniform1i(gl.getUniformLocation(program, 'u_isPos'), 0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_US'), US);
        gl.uniform1i(gl.getUniformLocation(program, 'u_nCells'), nCells);
        gl.uniform1i(gl.getUniformLocation(program, 'u_particleCount'), particleCount);
        const quadVertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, -1,
            1, 1,
            -1, 1
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        const sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
        const sizeLoc = gl.getAttribLocation(program, "a_size");
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RED, gl.FLOAT, sizes);
        return [program, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture, textureSize];
    });
}
function tickParticleVelocitiesSimulation(gl, { simulationProgram, framebuffer, framebuffer2, inputTexture, secondTexture, outputTexture, spatialLookupTexture, startSpatialLookupTexture, textureSize }, particles, velocities, spatialLookUp, startsSpatialLookUp, stepsPerCall, deltaTime, particleCount) {
    return __awaiter(this, void 0, void 0, function* () {
        gl.useProgram(simulationProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, particles);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, secondTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, velocities);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, outputTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, velocities);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, spatialLookupTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RG_INTEGER, gl.INT, spatialLookUp);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, startSpatialLookupTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RG_INTEGER, gl.INT, startsSpatialLookUp);
        gl.uniform1f(gl.getUniformLocation(simulationProgram, "u_deltaTime"), deltaTime);
        gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_stepsPerCall"), 1);
        gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_inputTexture"), 0);
        gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_secondTexture"), 1);
        gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_isPos"), 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
        gl.viewport(0, 0, textureSize, textureSize);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const updatedVelocities = new Float32Array(textureSize * textureSize * 4);
        gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, updatedVelocities);
        gl.finish();
        gl.uniform1i(gl.getUniformLocation(simulationProgram, "u_isPos"), 1);
        gl.viewport(0, 0, textureSize, textureSize);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const updatedPositions = new Float32Array(textureSize * textureSize * 4);
        gl.readPixels(0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, updatedPositions);
        gl.finish();
        return [updatedPositions, updatedVelocities];
    });
}
function positionToCell(position, US) {
    return 23197.0 * Math.floor(position[0] / US) + 23345.0 * Math.floor(position[1] / US) + 10091.0 * Math.floor(position[2] / US);
}
function offsetToCell(offset) {
    return 23197 * offset[0] + 23345 * offset[1] + 10091 * offset[2];
}
function renderToTexture(gl, simulationProgram, framebuffer, velocityTexture, positionTexture, outputTexture, textureSize) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, 'u_inputTexture'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.uniform1i(gl.getUniformLocation(simulationProgram, 'u_secondTexture'), 1);
    gl.viewport(0, 0, textureSize, textureSize);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
function initParticleRendering(gl, particles, sizes) {
    return __awaiter(this, void 0, void 0, function* () {
        const [program, vertexShader, fragmentShader] = yield loadShaders(gl, dntiDir + "/glsl/particle.vert", dntiDir + "/glsl/particle.frag");
        gl.useProgram(program);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const particleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW, 0);
        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(positionLocation);
        const sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
        const sizeLoc = gl.getAttribLocation(program, "a_size");
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sizeLoc);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return [program, particleBuffer, sizeBuffer, depthBuffer, framebuffer, vao];
    });
}
function drawParticles(gl, program, particleBuffer, sizeBuffer, camera, light, nParticles, framebuffer, particlesVAO) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.bindVertexArray(particlesVAO);
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());
    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);
    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);
    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());
    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);
    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);
    gl.drawArrays(gl.POINTS, 0, nParticles);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
}
function initTraceRendering(gl, trackingArray, sharedDepthBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const [program, vertexShader, fragmentShader] = yield loadShaders(gl, dntiDir + "/glsl/particle.vert", dntiDir + "/glsl/particle.frag");
        gl.useProgram(program);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sharedDepthBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const trackingBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, trackingBuffer);
        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        const initialCount = trackingArray.length / 3;
        const initialCapacity = Math.max(128, 1 << Math.ceil(Math.log2(initialCount + 1)));
        gl.bufferData(gl.ARRAY_BUFFER, initialCount * 3 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 1, trackingArray);
        return [program, trackingBuffer, vao, framebuffer];
    });
}
function drawTrace(gl, program, trackingBuffer, camera, light, nTraces, trackingArray, traceVao, framebuffer, tracking) {
    gl.bindVertexArray(traceVao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());
    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);
    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);
    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());
    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);
    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);
    if (tracking) {
        gl.bindBuffer(gl.ARRAY_BUFFER, trackingBuffer);
        const offsetBytes = (nTraces) * 3 * Float32Array.BYTES_PER_ELEMENT;
        gl.bufferSubData(gl.ARRAY_BUFFER, offsetBytes, new Float32Array([trackingArray[(nTraces - 1) * 3 + 0], trackingArray[(nTraces - 1) * 3 + 1], trackingArray[(nTraces - 1) * 3 + 2]]));
    }
    gl.drawArrays(gl.LINE_STRIP, 0, nTraces);
    gl.bindVertexArray(null);
}
function initWaterRendering(gl, particles, sizes, particleCount, textureSize) {
    return __awaiter(this, void 0, void 0, function* () {
        const [program, vertexShader, fragmentShader] = yield loadShaders(gl, dntiDir + "/glsl/water.vert", dntiDir + "/glsl/water.frag");
        gl.useProgram(program);
        const quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
        gl.useProgram(program);
        const posLoc = 0;
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        const positionTexture = createTexture(gl, null, textureSize, textureSize, gl.RGBA, gl.RGBA32F, gl.FLOAT);
        gl.uniform1i(gl.getUniformLocation(program, 'u_positions'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, particles);
        const sizesTexture = createTexture(gl, null, particleCount, 1, gl.RED, gl.R32F, gl.FLOAT);
        gl.uniform1i(gl.getUniformLocation(program, 'u_sizeTexture'), 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RED, gl.FLOAT, sizes);
        return [program, positionTexture, sizesTexture];
    });
}
function drawWater(gl, program, positionTexture, sizesTexture, camera, light, nParticles, textureSize, particles, sizes) {
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureSize, textureSize, gl.RGBA, gl.FLOAT, particles);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sizesTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, nParticles, 1, gl.RED, gl.FLOAT, sizes);
    const u_viewProjection = gl.getUniformLocation(program, "u_viewProjection");
    gl.uniformMatrix4fv(u_viewProjection, false, camera.projectionMatrix.toFloat32());
    const u_cameraPosition = gl.getUniformLocation(program, "u_cameraPosition");
    gl.uniform3fv(u_cameraPosition, camera.position.values);
    const u_lightDirection = gl.getUniformLocation(program, "u_lightDirection");
    gl.uniform3fv(u_lightDirection, light.direction);
    const u_modelMatrix = gl.getUniformLocation(program, "u_modelMatrix");
    gl.uniformMatrix4fv(u_modelMatrix, false, camera.viewMatrix.toFloat32());
    const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
    gl.uniform3fv(u_lightColor, light.color);
    const u_ambientColor = gl.getUniformLocation(program, "u_ambientColor");
    gl.uniform3fv(u_ambientColor, light.ambient);
    const u_nParticles = gl.getUniformLocation(program, "u_nParticles");
    gl.uniform1i(u_nParticles, nParticles);
    const u_textureSize = gl.getUniformLocation(program, "u_textureSize");
    gl.uniform1i(u_textureSize, textureSize);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.finish();
}
