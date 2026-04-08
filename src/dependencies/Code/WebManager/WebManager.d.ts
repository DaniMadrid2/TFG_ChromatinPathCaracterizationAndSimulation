declare function lerp(a: any, b: any, t: any): any;
declare function log(msg: any, color: any, bgc: any): void;
declare class Sender {
    static getTimeStamp(): number;
    constructor(ws: any, name: any);
    ws: any;
    name: any;
    changeWS(ws: any): this;
    changeName(name: any): this;
    emit(obj: any, form: any): this;
    send(obj: any, form: any): this;
    call(obj: any, form: any): this;
    getReceiver(func: any): Receiver;
}
declare class Receiver {
    constructor(ws: any, name: any, func: any);
    ws: any;
    name: any;
    func: any;
    changeWS(ws: any): void;
    changeName(name: any): void;
}
declare class WebBridge {
    /**
     * sendonds:
     * [{
     * 	sender:{name:"canal",?rece:()=>{}},
     * 	receiver:{name:"canal",f:()=>{}}
     * }]
     * @param {String} channel
     * @param {Object} sendonds
     * @returns
     */
    static fromJSON(channel: string, sendonds: any): any[];
    /***
     * params = [name,()=>{}],{name:"",rece/f:()=>{}}
     */
    static fromParams(channel: any, ...params: any[]): any[]&{
        send:(channel:string,msg:any)=>void,
        emit:(channel:string,msg:any)=>void,
        rece:(channel:string,callback:Function)=>void
    };
    constructor(namespace: any, server?: any);
    server: any;
    id: any;
    namespace: any;
    webSocket: any;
    onReconnect(): void;
    joinRoom(roomid: any): void;
    getID(): any;
    getSocket(): any;
    closeConnection(): void;
    addGetter(name: any, func: any): void;
    addReceiver(receiver: any): void;
    addSender(sender: any): void;
}
declare class Players {
    static main: any;
    constructor(ismain?: boolean);
    ps: any[];
    /**
     * Tells the .create method to create a Player of this class
     * @param {Class} clase
     */
    setCreateClass(clase): void;
    create: (id: any, ...params: any[]) => any;
    getMainPlayer(): any;
    setMainPlayer(id: any): void;
    mainPlayer: any;
    get(id: any): any;
    add(id: any, obj: any): boolean;
    push(id: any, obj: any): boolean;
    remove(id: any): void;
    getAll(): any[];
    getArr(): any[];
    getIDS(): string[];
}
declare class GameObjectAdapter {
    static PositionProps: string[][];
    static VelocityProps: (string | string[])[][];
    /**
     * 
     * @param obj instance of object
     * @param delay game delay in milliseconds
     * @param funcNames names of call functions of setMsg,BotTick,setPos
     * @param props list of values to interpolate from the message
     * @param propsmsg same fucking thing as props, no difference
     */
    static apply(obj: any, delay?: number|(()=>number), funcNames?: string[], props?: string[]|[string,string][]|any, propsmsg?: string[]): void;
    static interpolate:boolean;
}
declare class NPCs {
    static main: any;
    npc: any[];
    typelist: any[];
    GOAdapterOptions: any[];
    /**
     *
     * @param {[Class][]} clase
     * @param {Class} defaultclase
     */
    setCreateClasses(clases: any, defaultclase): void;
    create: (id: any, type: any, ...params: any[]) => any;
    get(id: any): any;
    add(id: any, obj: any): boolean;
    push(id: any, obj: any): boolean;
    remove(id: any): void;
    getAll(): any[];
    getArr(): any[];
    getIDS(): string[];
    /**
     * Example:
     * 	setGroupGOAdapterOptions(200,["setMsg","BotTick","setPos"],["x","y",["vel","x"],["vel","y"]],["x","y","vx","vy"])
     *  setGroupGOAdapterOptions(200,["setMsg","BotTick","setPos"],["x","y"],["x","y"]) (default)
     *
     * @param {number} delay in miliseconds
     * @param {string[]} funcNames
     * @param {string[]|[string,string][]} props
     * @param {string[]} propsmsg
     * @param {string} groupName Group type name to be applyed, All types will be declared by default
     *
     */
    setGroupGOAdapterOptions(groupName: string,delay?: number|(()=>number), funcNames?: string[]|any[], props?: string[] | [string, string][]|any[], propsmsg?: string[]|any[]): void;
    /**
     * !Important For this to work you have to call BotTick every tick
     * @param {string} id
     */
    setPos(id: string): void;
}
