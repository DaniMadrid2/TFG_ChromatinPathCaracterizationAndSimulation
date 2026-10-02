import { Vector3D, Matrix4D, Quaternion } from "../Matrix/Matrix.mjs";
export class Camera3D {
    position;
    fov;
    aspectRatio;
    near;
    far;
    walkspeed;
    viewMatrix = Matrix4D.Identity;
    projectionMatrix = Matrix4D.Identity;
    direction = new Vector3D(0, 0, -1);
    UP = new Vector3D(0, 1, 0);
    followPosition = new Vector3D(0, 0, 1);
    following = false;
    getFollowPos = () => Vector3D.Zero;
    lastMousePos = { x: 0, y: 0 };
    invertX = false;
    invertY = false;
    invertXwhenFollowing = false;
    invertYwhenFollowing = true;
    constructor(position = new Vector3D(0, 0, 10), fov = 90, aspectRatio = 1080 / 720, near = 0.001, far = 10000, walkspeed = 10) {
        this.position = position;
        this.fov = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;
        this.walkspeed = walkspeed;
    }
    setPos(pos) {
        this.position._ = pos;
        return this;
    }
    setFollowPos(pos) {
        this.followPosition._ = pos;
        return this;
    }
    calculateMatrices() {
        this.viewMatrix = Matrix4D.createLookAtMatrixFromDirection(this.position, this.direction, this.UP);
        this.projectionMatrix = Matrix4D.createProjectionMatrix(this.fov, this.aspectRatio, this.near, this.far);
        return this;
    }
    tick(dt, keypress, mousepos, mouseclick) {
        let dmousex = mousepos.x - this.lastMousePos.x;
        let dmousey = mousepos.y - this.lastMousePos.y;
        let dmov = 6.5;
        let noMouse = false;
        if (this.right(keypress))
            (noMouse = true, dmousex = dmov);
        if (this.left(keypress))
            (noMouse = true, dmousex = -dmov);
        if (this.up(keypress))
            (noMouse = true, dmousey = -dmov);
        if (this.down(keypress))
            (noMouse = true, dmousey = dmov);
        if (this.r(keypress))
            noMouse = true;
        dmousex *= this.fov / 60;
        dmousey *= this.fov / 60;
        if (!this.keys.rotMouse) {
            dmousex = 0;
            dmousey = 0;
        }
        if ((mouseclick[0] || noMouse) && Math.abs(dmousex) < 100 && Math.abs(dmousey) < 100) {
            let invertY = !!this.invertX ? -1 : 1;
            let invertX = !!this.invertY ? -1 : 1;
            if (this.following) {
                if (this.invertXwhenFollowing !== undefined)
                    invertX = !!this.invertXwhenFollowing ? -1 : 1;
                if (this.invertYwhenFollowing !== undefined)
                    invertY = !!this.invertYwhenFollowing ? -1 : 1;
            }
            this.direction = Quaternion.rotateVector(this.direction, this.UP, -dmousex / 1000 * Math.PI * 1.2 * invertX);
            this.direction = Quaternion.rotateVector(this.direction, this.UP.cross(this.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
            this.UP = Quaternion.rotateVector(this.UP, this.UP.cross(this.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
            if (this.r(keypress)) {
                let rotdir = Math.PI * 0.7 * (this.shift(keypress) ? -1 : 1) / 100;
                this.UP = Quaternion.rotateVector(this.UP, this.direction, rotdir);
            }
            if (this.following) {
                this.followPosition = Quaternion.rotateVector(this.followPosition, this.UP, -dmousex / 1000 * Math.PI * 1.2 * invertX);
                this.followPosition = Quaternion.rotateVector(this.followPosition, this.UP.cross(this.direction), dmousey / 1000 * Math.PI * 1.2 * invertY);
            }
        }
        if (this.following) {
            let centerVector = this.getFollowPos();
            this.followPosition = this.followPosition
                .add(this.direction.cross(this.UP).scalar(this.Hor(keypress) * this.walkspeed * dt))
                .add(this.UP.scalar(this.Depth(keypress) * this.walkspeed * dt))
                .add(this.direction.scalar(-this.Ver(keypress) * this.walkspeed * dt));
            this.position = centerVector.add(this.followPosition);
        }
        else {
            this.position = this.position
                .add(this.direction.cross(this.UP).scalar(this.Hor(keypress) * this.walkspeed * dt))
                .add(this.UP.scalar(this.Depth(keypress) * this.walkspeed * dt))
                .add(this.direction.scalar(-this.Ver(keypress) * this.walkspeed * dt));
        }
        this.lastMousePos = { ...mousepos };
    }
    keys = {
        "a": "a",
        "w": "w",
        "s": "s",
        "d": "d",
        "q": "q",
        "e": "e",
        "left": "left",
        "right": "right",
        "up": "up",
        "down": "down",
        "shift": "shift",
        "r": "r",
        rotMouse: true,
    };
    Hor(keypress) {
        return keypress[this.keys["a"]] ? -1 : keypress[this.keys["d"]] ? 1 : 0;
    }
    Ver(keypress) {
        return keypress[this.keys["w"]] ? -1 : keypress[this.keys["s"]] ? 1 : 0;
    }
    Depth(keypress) {
        return keypress[this.keys["q"]] ? -1 : keypress[this.keys["e"]] ? 1 : 0;
    }
    right(keypress) {
        return keypress[this.keys["right"]];
    }
    left(keypress) {
        return keypress[this.keys["left"]];
    }
    down(keypress) {
        return keypress[this.keys["down"]];
    }
    up(keypress) {
        return keypress[this.keys["up"]];
    }
    shift(keypress) {
        return keypress[this.keys["shift"]];
    }
    r(keypress) {
        return keypress[this.keys["r"]];
    }
    setMoveControlsAt(key = "unbind") {
        if (key == "s") {
            this.keys["a"] = "a";
            this.keys["w"] = "w";
            this.keys["s"] = "s";
            this.keys["d"] = "d";
            this.keys["r"] = "r";
            this.keys["q"] = "q";
            this.keys["e"] = "e";
        }
        if (key == "g") {
            this.keys["a"] = "f";
            this.keys["w"] = "t";
            this.keys["s"] = "g";
            this.keys["d"] = "h";
            this.keys["r"] = "u";
            this.keys["q"] = "r";
            this.keys["e"] = "y";
        }
        if (key == "k") {
            this.keys["a"] = "j";
            this.keys["w"] = "i";
            this.keys["s"] = "k";
            this.keys["d"] = "l";
            this.keys["r"] = "p";
            this.keys["q"] = "u";
            this.keys["e"] = "o";
        }
        if (key == "unbind") {
            this.keys["a"] = "none";
            this.keys["w"] = "none";
            this.keys["s"] = "none";
            this.keys["d"] = "none";
            this.keys["r"] = "none";
            this.keys["q"] = "none";
            this.keys["e"] = "none";
        }
        return this;
    }
    bindRKey(key = "none") {
        this.keys["r"] = key;
        return this;
    }
    setCamControlsAt(key = "unbind") {
        if (key == "down") {
            this.keys["right"] = "right";
            this.keys["left"] = "left";
            this.keys["down"] = "down";
            this.keys["up"] = "up";
        }
        if (key == "g") {
            this.keys["right"] = "f";
            this.keys["left"] = "t";
            this.keys["down"] = "g";
            this.keys["up"] = "h";
        }
        if (key == "k") {
            this.keys["right"] = "j";
            this.keys["left"] = "i";
            this.keys["down"] = "k";
            this.keys["up"] = "l";
        }
        if (key == "unbind") {
            this.keys["right"] = "none";
            this.keys["left"] = "none";
            this.keys["down"] = "none";
            this.keys["up"] = "none";
        }
        return this;
    }
    setMouseControls(key = "unbind") {
        if (key == "mouse") {
            this.keys.rotMouse = true;
        }
        if (key == "unbind") {
            this.keys.rotMouse = false;
        }
    }
    setUniforms(u_viewMatrix, u_projectionMatrix, u_cameraPosition) {
        u_viewMatrix?.set?.(this.viewMatrix);
        u_projectionMatrix?.set?.(this.projectionMatrix);
        u_cameraPosition?.set?.(this.position);
    }
    uniforms = [];
    setUniformsProgram(program) {
        if (!this.uniforms[program.ID]) {
            this.uniforms[program.ID] = [program.uMat4("u_viewMatrix"), program.uMat4("u_projectionMatrix"), program.uVec("cameraPos", 3)];
        }
        this.setUniforms(...this.uniforms[program.ID]);
    }
}
export class SunLight {
    color;
    direction;
    lightIndex = 0;
    constructor(color = new Vector3D(0.0, 1.0, 1.0), direction = new Vector3D(1, -1, -1), lightNumber = 0) {
        this.color = color;
        this.direction = direction;
        this.lightIndex = lightNumber;
    }
}
export class AmbienLight {
    color;
    constructor(color = new Vector3D(0.0, 1.0, 1.0)) {
        this.color = color;
    }
}
export class LightManager {
    sunLigths = [];
    ambientLight = new AmbienLight(Vector3D.Zero.clone());
    programs = [];
    uniforms = [];
    cSunLight(color, direction) {
        let light = new SunLight(color, direction, this.sunLigths.length + 1);
        this.sunLigths.push(light);
        return light;
    }
    cAmbientLight(color) {
        this.ambientLight = new AmbienLight(color);
        return this.ambientLight;
    }
    createUniforms(program, check = 0) {
        if (!program && !this.programs.length)
            return this;
        if (!program) {
            if (!check)
                for (let i = 0; i < this.programs.length; i++) {
                    this.createUniforms(this.programs[i], 1);
                }
            return this;
        }
        let index = this.programs.indexOf(program);
        if (index < 0) {
            index = this.programs.length;
            this.programs.push(program);
        }
        if (!this.uniforms[index])
            this.uniforms[index] = { sunLights: [],
                ambientLight: program.uVec("ambientColor", 3)
            };
        for (let i = 0; i < this.sunLigths.length; i++) {
            this.uniforms[index].sunLights[i] = [program.uVec("lightColor" + (i + 1), 3), program.uVec("lightDir" + (i + 1), 3)];
        }
        return this;
    }
    updateValues(program, check = 0) {
        let index = typeof program == "number" ? program : this.programs.indexOf(program);
        if (index < 0 && !check) {
            for (let i = 0; i < this.programs.length; i++) {
                this.updateValues(this.programs[i], 1);
            }
            return this;
        }
        this.uniforms[index].ambientLight.set(this.ambientLight.color);
        for (let i = 0; i < this.sunLigths.length; i++) {
            this.uniforms[index].sunLights[i][0].set(this.sunLigths[i].color);
            this.uniforms[index].sunLights[i][1].set(this.sunLigths[i].direction);
        }
        return this;
    }
    addProgram(program) {
        let index = this.programs.indexOf(program);
        if (index < 0)
            this.programs.push(program);
    }
}
