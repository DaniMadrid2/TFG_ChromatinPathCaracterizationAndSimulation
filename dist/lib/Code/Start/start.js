var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var man;
var stopped = true;
var generators = [];
var lastTick = performance.now();
var funs = [];
export const start = (fun) => {
    if (fun)
        funs.push(fun);
    if (!stopped)
        return;
    stopped = false;
    man =
        () => {
            var now = performance.now();
            var dt = (now - lastTick) / 1000;
            dt = Math.min(dt, 1.5);
            lastTick = now;
            for (let i = 0; i < generators.length; i++) {
                generators[i].tick(dt);
            }
            if (!stopped) {
                for (let i = 0; i < funs.length; i++) {
                    funs[i](dt);
                }
                requestAnimationFrame(man);
            }
        };
    man();
};
export const startAsync = (fun) => __awaiter(void 0, void 0, void 0, function* () {
    if (fun)
        funs.push(fun);
    if (!stopped)
        return;
    stopped = false;
    man =
        () => __awaiter(void 0, void 0, void 0, function* () {
            var now = performance.now();
            var dt = (now - lastTick) / 1000;
            dt = Math.min(dt, 1.5);
            lastTick = now;
            for (let i = 0; i < generators.length; i++) {
                yield generators[i].tick(dt);
            }
            if (!stopped) {
                for (let i = 0; i < funs.length; i++) {
                    yield funs[i](dt);
                }
                requestAnimationFrame(man);
            }
        });
    yield man();
});
export const addFunc = (fun) => {
    funs.push(fun);
};
export const stop = () => {
    stopped = true;
};
class WhoLisObj {
    constructor() {
        this.who = {};
        this.lis = () => { };
    }
}
export class Timer {
    constructor(start = 0, maxtime) {
        this.time = start;
        this.maxtime = maxtime;
        this.lis = [];
    }
    addListener(who, lis) {
        this.lis.push({ who, lis });
        return this;
    }
    setMax(maxtime) {
        this.maxtime = maxtime;
    }
    tick(dt) {
        this.time += dt;
        if (this.maxtime && this.time >= this.maxtime) {
            this.time = 0;
            try {
                for (let i = 0; i < this.lis.length; i++) {
                    let li = this.lis[i];
                    if (li && li.lis && li.who)
                        li.lis.apply(li.who, [dt]);
                    if (li && li.lis && !li.who)
                        li.lis([dt]);
                }
            }
            catch (err) { }
            ;
        }
    }
    set(time) {
        this.time = time;
    }
    listen() {
        generators.push(this);
        return this;
    }
    stop() {
        for (let i = 0; i < generators.length; i++) {
            if (generators[i] === this)
                generators.splice(i, 1);
        }
    }
    delay(delay) {
        this.maxtime = delay;
    }
    setTime(delay) {
        this.maxtime = delay;
    }
}
