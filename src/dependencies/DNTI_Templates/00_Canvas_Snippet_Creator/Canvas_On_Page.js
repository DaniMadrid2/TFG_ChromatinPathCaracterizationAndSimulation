import { createCanvas, ImgLoader, Scene, MouseManager, ListenerManager, openFullscreen } from "/Code/Game/Game.js";
import { Easer } from "/Code/MathRender/MathRender.js";
function isResizedC(data_id) {
    const lateralDivs = document.querySelectorAll('.dnti-outside [data-id]');
    for (let i = 0; i < lateralDivs.length; i++) {
        let latDiv = lateralDivs[i];
        if (latDiv.getAttribute("data-id") == data_id) {
            if (latDiv.children.length != 0) {
                return false;
            }
        }
    }
    return true;
}
function getElementBySelector(selector, i = 0) {
    let objs = document.querySelectorAll(selector);
    if (objs.length == 0)
        return;
    if (i > objs.length - 1)
        i = objs.length - 1;
    return objs[i];
}
function getPositionOf(targetElement) {
    if (!targetElement)
        return {
            top: 0, left: 0, y: 0, x: 0, width: 0, height: 0, bottom: 0, right: 0
        };
    let rect = targetElement.getBoundingClientRect();
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        x: rect.left + window.scrollX,
        height: rect.height,
        width: rect.width,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
    };
}
export const createCanvasNextTo = function (isResized = ((cid) => isResizedC(cid)), cid, nextToid = undefined, nextFcs = {
    dx: (() => 0),
    dy: (() => 0),
    dw: (() => 0),
    dh: (() => 0),
}, canvasCenterOptions = {
    absolute: false,
    maxRes: true,
    father: null,
    autoResize: true,
    boundingBox: undefined,
    contexttype: "2d",
}, W = 1080, H = 720, setDoubleClick = true) {
    var _a, _b;
    if (typeof isResized == "boolean") {
        const was_resized = isResized;
        isResized = (() => was_resized);
    }
    const nextToElement = getElementBySelector(nextToid);
    const getoffx = (c) => {
        var _a, _b, _c;
        let isResizedCanvas = isResized(cid);
        if (!nextToElement)
            return 0;
        return isResizedCanvas ? 0 : (((_a = getPositionOf(nextToElement)) === null || _a === void 0 ? void 0 : _a.right) + (-(((_c = getPositionOf((_b = c === null || c === void 0 ? void 0 : c.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement)) === null || _c === void 0 ? void 0 : _c.left) || 0)));
    };
    let initialBoxCanvas = {
        x: (c) => {
            var _a, _b, _c;
            let isResizedCanvas = isResized(cid);
            let offx = getoffx(c);
            return offx + ((_c = (_b = (_a = nextFcs.dx) === null || _a === void 0 ? void 0 : _a.call(nextFcs, isResizedCanvas, offx, c)) !== null && _b !== void 0 ? _b : nextFcs.dx) !== null && _c !== void 0 ? _c : 0);
        },
        y: (c) => {
            var _a, _b, _c;
            let isResizedCanvas = isResized(cid);
            let offx = getoffx(c);
            return ((_c = (_b = (_a = nextFcs.dy) === null || _a === void 0 ? void 0 : _a.call(nextFcs, isResizedCanvas, offx, c)) !== null && _b !== void 0 ? _b : nextFcs.dy) !== null && _c !== void 0 ? _c : 0);
        },
        w: (c) => {
            var _a, _b;
            let isResizedCanvas = isResized(cid);
            let offx = getoffx(c);
            let value = (_b = (_a = nextFcs.dw) === null || _a === void 0 ? void 0 : _a.call(nextFcs, isResizedCanvas, offx, c)) !== null && _b !== void 0 ? _b : nextFcs.dw;
            if (!!value && typeof value != "number")
                return value;
            return Math.min((value !== null && value !== void 0 ? value : 0), window.innerWidth);
        },
        h: (c) => {
            var _a, _b;
            let isResizedCanvas = isResized(cid);
            let offx = getoffx(c);
            let value = (_b = (_a = nextFcs.dh) === null || _a === void 0 ? void 0 : _a.call(nextFcs, isResizedCanvas, offx, c)) !== null && _b !== void 0 ? _b : nextFcs.dh;
            if (!!value && typeof value != "number")
                return value;
            return Math.min((value !== null && value !== void 0 ? value : 0), window.innerHeight);
        },
    };
    let scene = new Scene();
    canvasCenterOptions.boundingBox = initialBoxCanvas;
    let { canvas, ctx } = createCanvas(cid, W, H, scene, canvasCenterOptions.contexttype).center(canvasCenterOptions).modern();
    (_b = (_a = canvas).recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a);
    MouseManager.EnableCanvas(canvas);
    ListenerManager.onClick(scene, scene.funcLayers, "onClick");
    if (setDoubleClick) {
        let dbClickList = MouseManager.createDoubleClickListenerGameObject(canvas.id);
        scene.add(dbClickList);
        dbClickList.add(() => {
            openFullscreen(canvas);
        });
    }
    if (ctx.canvas.pausedt === undefined) {
        ctx.canvas.pausedt = 0;
    }
    ctx.canvas.addEventListener("click", () => {
        ctx.canvas.running = !ctx.canvas.running;
    });
    var pausedImage = ImgLoader.load("/Imgs/Site/Icons/simple_pause.png");
    ImgLoader.applyFilter(pausedImage, 46, 205, 181);
    const tickPausedButton = (dt) => {
        var _a, _b, _c;
        if (((_a = ctx.canvas) === null || _a === void 0 ? void 0 : _a.visible) === false || ((_b = (ctx.canvas)) === null || _b === void 0 ? void 0 : _b.cantPause) === true)
            return;
        if (ctx.canvas.pausedt !== undefined) {
            if (((_c = ctx.canvas) === null || _c === void 0 ? void 0 : _c.running) === false) {
                if (ctx.canvas.pausedt < 1) {
                    ctx.canvas.pausedt += dt * 1.218;
                    if (ctx.canvas.pausedt > 1)
                        ctx.canvas.pausedt = 1;
                }
            }
            else {
                if (ctx.canvas.pausedt > 0) {
                    ctx.canvas.pausedt -= dt * 1.218;
                    if (ctx.canvas.pausedt < 0)
                        ctx.canvas.pausedt = 0;
                }
            }
            if (ctx.canvas.pausedt > 0) {
                let dy = Easer.EaseInOut.ease(ctx.canvas.pausedt) * 100;
                scene.getLastLayer().canvas.ctx.tmpoptions.noApplyStack = true;
                scene.getLastLayer().canvas.ctx.image(pausedImage, W - 97, H - dy, 95, 95, 1);
                scene.getLastLayer().canvas.ctx.tmpoptions = {};
            }
        }
        return ctx.canvas.running === false;
    };
    document.addEventListener("scroll", () => {
        var _a, _b;
        (_b = (_a = ctx.canvas) === null || _a === void 0 ? void 0 : _a.recheckVisible) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    return {
        screen: {
            W,
            H,
            scene,
            ctx,
        },
        tickPausedButton
    };
};
