export declare const start: Function;
export declare const startAsync: Function;
export declare const addFunc: (fun: any) => void;
export declare const stop: () => void;
declare class WhoLisObj {
    who: object;
    lis: Function;
}
export declare class Timer {
    time: number;
    maxtime: number;
    lis: WhoLisObj[];
    constructor(start: number, maxtime: any);
    addListener(who: any, lis: any): this;
    setMax(maxtime: any): void;
    tick(dt: any): void;
    set(time: any): void;
    listen(): this;
    stop(): void;
    delay(delay: any): void;
    setTime(delay: any): void;
}
export {};
