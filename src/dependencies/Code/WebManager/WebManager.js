//npx tsc --declaration -emitDeclarationOnly -allowJs Plantillas/Codigo/WebManager/WebManager.js 



class Sender{
	constructor(ws,name){
		this.ws=ws?.getSocket?.()??ws;this.name=name;
		return this;
	}
	changeWS(ws){
		this.ws=ws;
		return this;
	}
	changeName(name){
		this.name=name;
		return this;
	}
	emit(obj,form){
		if(obj && typeof(obj) ==="object" && form )
			obj.form=form;
		this.ws.emit(this.name,obj);
		return this;
	}
	send(obj,form){
		this.emit(obj,form);
		return this;
	}
	call(obj,form){
		this.emit(obj,form);
		return this;
	}
	getReceiver(func){
		return new Receiver(this.ws,this.name,func);
	}
	
	static getTimeStamp(){
		return (new Date()).getMilliseconds()+(new Date()).getSeconds()*1000;
	}
}
class Receiver{
	constructor(ws,name,func){
		this.ws=ws?.getSocket?.()??ws;this.name=name;
		this.func=func;
		this.ws.on(this.name,this.func);
	}
	changeWS(ws){
		this.ws=ws;
	}
	changeName(name){
		this.name=name;
	}
}
class WebBridge{
	constructor(namespace,server){
		this.server=server;
		this.id=undefined;
		if(this.server==undefined){
		this.server="";
		}
		if(this.server.startsWith("/")) this.server=this.server.substr(1);
		this.namespace=namespace;
		if(this.namespace==undefined){
		this.namespace="";
		}
		
		if(this.namespace.startsWith("/")) this.namespace=this.namespace.substr(1);
        this.webSocket = io(this.server+"/"+this.namespace,{transports: ['websocket']});
		this.webSocket.on('reconnect_attempt', () => {
 		 	this.webSocket.io.opts.transports = ['polling', 'websocket'];
		});
		console.log("connected at: "+this.server+"/"+this.namespace);
		this.webSocket.on("connect",(laid)=>{
			this.id=laid??laid?.id??this.webSocket.id??undefined;
			if(!this.id) return;
			let mainplayer=Players?.main?.getMainPlayer?.();
			mainplayer&& (mainplayer.id=this.id);
			this.onReconnect?.(laid) || this.onReconnection?.();
		})
	}
	onReconnect(){

	}
	joinRoom(roomid){
		//if(typeof roomid === "string" ||roomid instanceof String)
			new Sender(this.webSocket,"joinroom").send(roomid);
		
	}
	getID(){
		return this.id;
	}
	getSocket(){
		return this.webSocket;
	}
	closeConnection(){
		this.webSocket.close();
	}
	addGetter(name,func){
		this.webSocket.on(name,func);
	}
	addReceiver(receiver){
		receiver.changeWS(this);
	}
	addSender(sender){
		sender.changeWS(this);
	}


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
	static fromJSON(channel,sendonds){
		let web;
		if(typeof channel==="object"){
			web=channel;
		}else if(typeof channel==="string"){
			web=new WebBridge(channel);
		}
		let senders=[];
		sendonds.forEach((so)=>{
			if(so.send||so.sender){
				let sendert=so.send||so.sender;
				let sender=new Sender(web,sendert.name);
				senders[sendert.name]=sender;
				if(sendert.re||sendert.receiver||sendert.rece){
					let rece=sendert.re||sendert.rece||sendert.receiver;
					sender.getReceiver(rece);
				}
				so.send=sender;
				
			}
			if(so.re||so.receiver||so.rece){
				let rece=so.re||so.rece||so.receiver;
				new Receiver(web,rece.name,rece.fun||rece.func||rece.f);
			}
		})
		senders.send=function(canal,msg){
			new Sender(web,canal).emit(msg);
		}
		senders.rece=function(canal,cb){
			new Receiver(web,canal,cb);
		}
		return senders;	
	}
	/***
	 * params = [name,()=>{}],{name:"",rece/f:()=>{}}
	 */
	static fromParams(channel,...params){
		let web;
		if(typeof channel==="object"){
			web=channel;
		}else if(typeof channel==="string"){
			web=new WebBridge(channel);
		}
		var senders=[];
		senders.receivers=[]
		params.forEach((param)=>{
			try {
					
				if(Array.isArray(param)&&param.length>1){
					let sender=new Sender(web,param[0]);
					senders[param[0]]=sender;
					sender.getReceiver(param[1]);
					senders.receivers[param[0]]??=[];
					senders.receivers[param[0]].push(param[1]);
				}else if(typeof param ==="object"){
					
				}else{
					if(Array.isArray(param)) param=param[0]||param;
					if(typeof param==="string"){//es sender
						senders[param]=new Sender(web,param);

					}else if(typeof param ==="function"){//es funcion, pero como no se el nombre nada
						return;
					}else{//no se que es
						return;
					}
				}
			} catch (error) {
				
			}
		})
		senders.send=function(canal,msg){
			new Sender(web,canal).emit(msg);
		}
		senders.emit=function(canal,msg){
			new Sender(web,canal).emit(msg);
		}
		senders.rece=function(canal,cb){
			new Receiver(web,canal,cb);
			senders.receivers[canal]??=[];
			senders.receivers[canal].push(cb);
		}
		senders.isClearing=false;
		let ftime=undefined;
		//turns one message sent from the server called from into lots of messages into the client
		senders.rece("from",(msg)=>{
			if(!msg.from) return;
			if(msg.ftime){
				if(!ftime&&ftime!==0) ftime=msg.ftime;
				if(msg.ftime<ftime&&!(ftime>55000&&msg.ftime<5000)){
					// console.log("return",msg.ftime,ftime)
					return;
				}else{
					ftime=msg.ftime;
				}
			}
			if(typeof msg.from === "string" ){
				senders.receivers[msg?.from]?.forEach?.(cb=>cb?.(msg));
			}else if(Array.isArray(msg.from)){
				for (let i = 0; i < msg.from.length; i++) {
					const from = msg.from[i];
					from && (typeof from==="string")
						&& senders.receivers[from]?.forEach?.(cb=>{
							// let callcb=()=>{
							// if(Math.random()>0.7)
							// setTimeout(()=>{
								cb?.(msg?.msgs?.[i]??msg);
							// },Math.random()*1500);
							// 	callcb.called=true;
							// };
							// if(typeof msg?.msgs?.[i]?.time === "number"){
							// 	let nowdate=new Date();
							// 	let retard=nowdate.getMilliseconds()+nowdate.getSeconds()*1000;
							// 	if(retard<firsttime)
							// 		retard+=60000;
							// 	let retardtime=retard-firsttime;
							// 	if((msg.time??msg?.msgs?.[i]?.time??0)-retardtime >= 0)
							// 	//send it retarded if there is a time
							// 	// let timeout=
							// 	setTimeout(callcb
							// 		,(msg.time??msg?.msgs?.[i]?.time??0)-retardtime);
							// 	// senders.receivers[from].timeouts.push({
							// 	// 	timeout,
							// 	// 	cb:callcb
							// 	// })
							// }else
							// 	callcb();
						});
					// senders.getReceiver(from)?.(msg); //msg?.msgs[from]
				}
			}
		})
		return senders;	
	}
}


class Players{
	static main;

	constructor(ismain=true){
		this.ps=[];
		if(ismain) Players.main=this;
	}
	/**
	 * Tells the .create method to create a Player of this class
	 * @param {Class} clase 
	 */
	setCreateClass(clase){
		this.create=(id,...params)=>{
			let nplayer=new clase(...params)
			nplayer.id=id;
			nplayer.main=false;
			this.push(id,nplayer);
			return nplayer;
		}
	}
	getMainPlayer(){
		return this.mainPlayer;
	}
	setMainPlayer(id){
		if(typeof id==="string" || id instanceof String){
			this.mainPlayer=this.get(id);
		}else if(typeof id==="object"){
			this.mainPlayer=id;
		}
	}
	get(id){
		return this.ps[id];
	}
	add(id,obj){
		return this.push(id,obj);
	}
	push(id,obj){
		let was=this.ps[id]===undefined;
		this.ps[id]=obj;
		return was;
	}
	remove(id){
		this.ps=this.ps.filter((p)=>{return p.id!==id});
	}
	getAll(){
		return this.ps;
	}
	getArr(){
		return Object.values(this.ps);
	}
	getIDS(){
		return Object.keys(this.ps);
	}
}

class GameObjectAdapter{
	static PositionProps=[["setMsg","BotTick","setPos"],["x","y"],["x","y"]]
	static VelocityProps=[["setMsg","BotTick","setPos"],["x","y",["vel","x"],["vel","y"]],["x","y","vx","vy"]]
	static interpolate=true;
	static apply(obj,delay=300,funcNames=["setMsg","BotTick","setPos"],props=["x","y","vx","vy"],propsmsg=props){
		let num=delay;
		if(typeof delay=="number") delay=()=>num;
		obj[funcNames[0]??"setMsg"]=(msg)=>{//*adds a message to the window
			if(obj.bottime===undefined||isNaN(obj.bottime)) obj.bottime=msg.time-(delay()||num);
			let decobjtime=~~(obj.bottime/1000);
			let decmsgtime=~~(msg.time/1000);
			if(decobjtime>decmsgtime&&!(decobjtime===59&&decmsgtime===0)){
				return;
			}else if(decobjtime===decmsgtime){
				if((obj.bottime)%1000>(msg.time)%1000){
					return;
				}
			}
			if(obj.lasttimereceived===undefined||isNaN(obj.lasttimereceived)) obj.lasttimereceived=msg.time; //the most future time of pck received
			if(msg.time>obj.lasttimereceived||(msg.time<obj.lasttimereceived&&(60000+msg.time-obj.lasttimereceived<29000))){
				obj.lasttimereceived=msg.time;
			}
			
			if(!obj.msgwindow) obj.msgwindow=[];
			obj.msgwindow[msg.time]=msg;
		}
		obj[funcNames[1]??"BotTick"]=(dt)=>{//*updates the window
			if(dt>0.1) {
				obj.msgwindow=[];
				obj.frtlstpck=undefined;
				obj.lasmsg=undefined;
			}
			if(obj.bottime===undefined||isNaN(obj.bottime)) return;
			let tdelay=delay()||100;
			// obj.bottime+=dt*1000;
			// obj.bottime=obj.bottime%60000;
			let date=new Date();
			obj.bottime=(60000+(date.getMilliseconds())+1000*(date.getSeconds())-(delay()||num)-100)%(60000);
			
			// let difftime=obj.lasttimereceived-obj.bottime;
					
			// if(obj.lasttimereceived<obj.bottime)
			// 	difftime+=60000;
			// if(difftime<(delay()||num)-100||difftime>(delay()||num)+100){
			// 	let lastbottime=obj.bottime;
			// 	obj.bottime=(60000+(obj.lasttimereceived-(delay()||num)))%60000;
			// 	// console.log(difftime,(obj.lasttimereceived-(delay()||num)),(60000+(obj.lasttimereceived-(delay()||num)))%60000)
				// for (let ctime = obj.lastbottime-10000; ctime < (obj.bottime<obj.lastbottime?obj.bottime+60000:obj.bottime); ctime++) {
				// 	delete obj.msgwindow[ctime%60000]
				// 	obj.msgwindow[ctime%60000]=undefined;
					
				// }
				if(obj.bottime>tdelay+30)
					obj.alrdyClearedWindow=false;
				if(obj.bottime<tdelay+20&&obj.bottime>tdelay&&
					// !!obj.msgwindow[59999]&&!!obj.msgwindow[59998]&&!!obj.msgwindow[59997]&&!!obj.msgwindow[59996]&&!!obj.msgwindow[59996]
					!obj.alrdyClearedWindow
					){
					let window2=[];
					for (let i = 0; i < tdelay+20; i++) {
						window2[i]=obj.msgwindow[i]
					}
					obj.msgwindow=[];
					
					for (let i = 0; i < tdelay+20; i++) {
						obj.msgwindow[i]=window2[i]
					}
					obj.alrdyClearedWindow=true
				}
			// }
				
			if(!obj.lastmsg){//if no prior msg, find it (this happens for the firsts milliseconds)
				for (let ctime = obj.bottime-150; ctime < obj.bottime; ctime++) {
					let cctime=(60000+ctime)%60000;
					if(obj.msgwindow[cctime]){
						let msg=obj.msgwindow[cctime];
						if(msg)
							obj.lastmsg=msg;
					}
					
				}
			}
			let hasPck=false;//*if current time stamp package exists set the pos
			for (let ctime = obj.bottime-dt*1300; ctime < obj.bottime; ctime++) {
				let cctime=(60000+ctime)%60000;
				if(obj.msgwindow[cctime]){
					let msg=obj.msgwindow[cctime];
					if(msg)
						obj.lastmsg=msg
					obj[funcNames[2]??"setPos"](msg);
					
					hasPck=true;
					delete obj.msgwindow[cctime];
					obj.msgwindow[cctime]=undefined;
				}
				
			}
			if(GameObjectAdapter.interpolate&&!hasPck&&obj.lastmsg){//* if not and obj have received messages before, lerp the values
				let dtfut;
				if(obj.frtlstpck){
					dtfut=obj.frtlstpck.ctime-obj.bottime;
					if(dtfut+((obj.frtlstpck.ctime<delay&&obj.bottime>60000-delay)?60000:0)<0){
						obj.lastmsg=obj.frtlstpck;
						obj.frtlstpck=undefined;
						//find next (happens when obj.frtlstpck > last obj.time )
						let lastTimeReceived=obj.lasttimereceived;
						if(lastTimeReceived<delay&&obj.bottime>60000-delay){
							lastTimeReceived+=60000;
						}
						for (let ctime = obj.bottime; ctime < lastTimeReceived; ctime++) {
							if(obj.msgwindow[ctime%60000]){
								obj.frtlstpck=obj.msgwindow[ctime%60000]
								obj.frtlstpck.ctime=ctime%60000;
								break;
							}
						}
					}
				}
				if(obj.frtlstpck){//*REVIEW - if future package exist interpolate the values
					
					dtfut=(obj.frtlstpck.ctime-obj.bottime+60000)%60000;
					let dtpre=(obj.bottime-(obj.lastmsg?.time||0)+60000)%60000;
					// console.log(obj.lastmsg.time)
					// let {x:prex,y:prey,vx:prevx,vy:prevy}=pre;
					// let {x:futx,y:futy,vx:futvx,vy:futvy}=fut;
					// if(dtpre<0){
					// 	obj.bottime=obj.lastmsg.time+200;
					// }
					
					let interpolPosMsg=obj.lastmsg||{};
					for (let i = 0; i < props.length; i++) {
						interpolPosMsg[props[i]]=lerp(obj.lastmsg[propsmsg[i]],obj.frtlstpck[propsmsg[i]],dtpre/(dtpre+dtfut));
					}
					obj[funcNames[2]??"setPos"](interpolPosMsg,false)

					
				}else{
					//find next (this will fire for other reasons, except when obj.frtlstpck > last obj.time )
					for (let ctime = obj.bottime; ctime < obj.lasttimereceived; ctime++) {
						if(obj.msgwindow[ctime]){
							obj.frtlstpck=obj.msgwindow[ctime]
							obj.frtlstpck.ctime=ctime;
							break;
						}
					}
				}
				
			}
			
		}
		obj.isMultiplayer=true;
	}

}

class NPCs{
	static main;

	constructor(){
		this.npc=[];
		this.typelist=[];
		this.GOAdapterOptions=[];
		this.delay=300;
	}
	/**
	 * 
	 * @param {[Class][]} clase 
	 * @param {Class} defaultclase 
	 */
	setCreateClasses(clases,defaultclase){
		if(!Array.isArray(clases)&&typeof (clases)!=="object"){
			clases["default"] = clases;
		} 
		this.create=(id,type,...params)=>{
			let clase=clases[type]||defaultclase;
			if(!clase) return;
			this.typelist[id]=type||"default"
			let nplayer=new clase(...params)
			nplayer.id=id;
			nplayer.main=false;
			this.push(id,nplayer);
			this.setPos(id)
			return nplayer;
		}
	}
	get(id){
		return this.npc[id];
	}
	add(id,obj){
		return this.push(id,obj);
	}
	push(id,obj){
		let was=this.npc[id]===undefined;
		this.npc[id]=obj;
		return was;
	}
	remove(id){
		this.npc=this.npc.filter((p)=>{return p.id!==id});
	}
	getAll(){
		return this.npc;
	}
	getArr(){
		return Object.values(this.npc);
	}
	getIDS(){
		return Object.keys(this.npc);
	}
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
	setGroupGOAdapterOptions(groupName="ALL",delay=200,funcNames=["setMsg","BotTick","setPos"],props=["x","y","vx","vy"],propsmsg=props){
		this.GOAdapterOptions[groupName]=[delay,funcNames,props,propsmsg];
	}
	/**
	 * !Important For this to work you have to call BotTick every tick
	 * @param {string} id 
	 */
	setPos(id){
		let cps=this.get(id);
		if(!cps) return;
		let GOAdapterProps=this.GOAdapterOptions[this.typelist[id]]||this.GOAdapterOptions["ALL"]||
									[300,["setMsg","BotTick","setPos"],["x","y"],["x","y"]];
		GameObjectAdapter.apply(cps,...GOAdapterProps);
        
	}
}

function lerp(a,b,t) {
	if(typeof a!=="number"||typeof b!=="number") return a;
	return a + (b-a)*t;
}
function log(msg, color, bgc) {
    color = color || "black";
    bgc = bgc || "White";
    switch (color) {
        case "success":  color = "Green";      bgc = "LimeGreen";       break;
        case "info":     color = "DodgerBlue"; bgc = "Turquoise";       break;
        case "error":    color = "Red";        bgc = "Black";           break;
        case "start":    color = "OliveDrab";  bgc = "PaleGreen";       break;
        case "warning":  color = "Tomato";     bgc = "Black";           break;
        case "end":      color = "Orchid";     bgc = "MediumVioletRed"; break;
        default: color = color;
    }

    if (typeof msg == "object") {
        console.log(msg);
    } else if (typeof color == "object") {
        console.log("%c" + msg, "color: PowderBlue;font-weight:bold; background-color: RoyalBlue;");
        console.log(color);
    } else {
        console.log("%c" + msg, "color:" + color + ";font-weight:bold; background-color: " + bgc + ";");
    }
}