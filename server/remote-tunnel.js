require("dotenv").config();
const http=require("http"),fs=require("fs"),path=require("path");
const {WebSocketServer,WebSocket}=require("ws");

const CASA_IP=process.env.CASA_IP;
if(!CASA_IP)throw new Error("CASA_IP no definida. Revisa .env");
const CONTROL_PORT=8080,VIDEO_PORT=8084,LOCAL_NODE_PORT=3030,VIEWER_PORT=3031;
const MAX_VIEWER_BUFFER=1024*1024;
let controlTunnel=null,videoTunnel=null,shuttingDown=false,controlTimer=null,videoTimer=null;
const viewers=new Set(),state=new Map(),pending=new Map();
let lastFrameAt=0;
let frameRequestTimer=null;

const viewerServer=http.createServer((req,res)=>{
  const p=new URL(req.url||"/","http://127.0.0.1").pathname;
  if(p!=="/"&&p!=="/viewer.html"){res.writeHead(404);res.end();return}
  fs.readFile(path.join(__dirname,"viewer.html"),(e,d)=>{
    if(e){res.writeHead(500);res.end("No se pudo cargar viewer.html");return}
    res.writeHead(200,{"Content-Type":"text/html;charset=utf-8","Cache-Control":"no-store"});res.end(d)
  })
});
const vws=new WebSocketServer({server:viewerServer,perMessageDeflate:false,maxPayload:16*1024*1024});
vws.on("connection",ws=>{
  console.log("[Portátil] VIEWER conectado", {remote: ws._socket?.remoteAddress || "?"});
  viewers.add(ws);state.set(ws,{pending:null,sending:false,dropped:0,lastSentFrameAt:0});
  setTimeout(()=>{ if(open(ws) && !lastFrameAt) requestFrame("viewer-connect"); },1200);
  send(ws,{type:"status",control:open(controlTunnel),video:open(videoTunnel),casa:CASA_IP});
  ws.on("message",r=>{
    console.log("[Portátil] VIEWER mensaje recibido:", String(r).slice(0,500));
    viewerMsg(ws,r);
  });ws.on("close",()=>{viewers.delete(ws);state.delete(ws)})
});
viewerServer.listen(VIEWER_PORT,"127.0.0.1",()=>console.log(`[Portátil] Viewer v22 en http://127.0.0.1:${VIEWER_PORT}/`));

// IMPORTANTE: 3030 NO es un proxy aquí.
// Debe quedar libre para el servidor local de la página que Chromium ejecuta.
// Cuando casa.js recibe una petición HTTP de Chromium, la reenvía por el
// túnel de control y este proceso la atiende en localhost:3030.

function open(ws){return !!ws&&ws.readyState===WebSocket.OPEN}
function send(ws,v){if(!open(ws))return false;try{ws.send(JSON.stringify(v));return true}catch{return false}}
function broadcast(v){for(const ws of viewers)if(open(ws))send(ws,v)}

function viewerMsg(ws,raw){
  let m;try{m=JSON.parse(raw.toString())}catch{return}
  if(m.type==="viewerReady"){console.log("[Portátil] VIEWER listo para comandos",{version:m.version||null});send(ws,{type:"viewerReadyAck",version:"v22"});return}
  if(m.type==="ping"){send(ws,{type:"pong",timestamp:Date.now()});return}
  if(m.type==="input"&&open(controlTunnel))send(controlTunnel,{...m,timestamp:Number(m.timestamp)||Date.now()});
  if(m.type==="refresh"){
    const requestId=m.requestId||Date.now();
    console.log("[Portátil] REFRESH RECIBIDO DEL VIEWER",{requestId,control:open(controlTunnel)});
    if(open(controlTunnel)){
      const ok=send(controlTunnel,{type:"refresh",requestId});
      console.log("[Portátil] REFRESH ENVIADO A CASA",{ok,requestId});
      send(ws,{type:"refreshAck",stage:"portatil",ok,requestId});
    } else {
      console.warn("[Portátil] REFRESH NO ENVIADO: CONTROL CERRADO",{requestId});
      send(ws,{type:"refreshAck",stage:"portatil",ok:false,requestId,error:"control-cerrado"});
    }
    return;
  }
  if(m.type==="requestFrame"){
    requestFrame("viewer");
    return;
  }
}
function connectControl(){
  if(shuttingDown||open(controlTunnel))return;
  const ws=new WebSocket(`ws://${CASA_IP}:${CONTROL_PORT}`,{perMessageDeflate:false,maxPayload:16*1024*1024});controlTunnel=ws;
  ws.on("open",()=>{console.log("[Portátil] CONTROL conectado con casa",CASA_IP);broadcast({type:"status",control:true,video:open(videoTunnel),casa:CASA_IP});});
  ws.on("message",raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}
    if(m.type==="response")httpResponse(m);
    else if(m.type==="request")procesarPeticionHTTP(m);
    else if(m.type==="console")broadcast(m);
    else if(m.type==="consoleClear")broadcast(m);
    else if(m.type==="resources"||m.type==="resourcesError"||m.type==="refreshAck")broadcast(m);
    else if(m.type==="frame")frame(raw);
  });
  ws.on("close",()=>{if(controlTunnel===ws)controlTunnel=null;broadcast({type:"status",control:false,video:open(videoTunnel),casa:CASA_IP});scheduleControl()});
  ws.on("error",e=>console.error("[Portátil] CONTROL:",e.message))
}
function connectVideo(){
  if(shuttingDown||open(videoTunnel))return;
  const ws=new WebSocket(`ws://${CASA_IP}:${VIDEO_PORT}`,{perMessageDeflate:false,maxPayload:20*1024*1024});videoTunnel=ws;
  ws.on("open",()=>broadcast({type:"status",control:open(controlTunnel),video:true,casa:CASA_IP}));
  ws.on("message",raw=>frame(raw));
  ws.on("close",()=>{if(videoTunnel===ws)videoTunnel=null;for(const s of state.values())s.pending=null;broadcast({type:"status",control:open(controlTunnel),video:false,casa:CASA_IP});scheduleVideo()});
  ws.on("error",e=>console.error("[Portátil] VIDEO:",e.message))
}
function scheduleControl(){if(controlTimer||shuttingDown)return;controlTimer=setTimeout(()=>{controlTimer=null;connectControl()},3000)}
function scheduleVideo(){if(videoTimer||shuttingDown)return;videoTimer=setTimeout(()=>{videoTimer=null;connectVideo()},3000)}

function frame(raw){
  let m;try{m=JSON.parse(raw.toString())}catch{return}
  if(m.type!=="frame"||typeof m.data!=="string")return;
  lastFrameAt=Date.now();
  if(!frame._logged){frame._logged=true;console.log("[Portátil] PRIMER FRAME RECIBIDO DE CASA",{bytes:m.data.length,frame:m.frame||null});}
  const t=Number(m.timestamp)||Date.now();
  for(const ws of viewers){if(!open(ws))continue;const s=state.get(ws);if(!s)continue;if(s.pending)s.dropped++;
    s.pending={...m,timestamp:t};flush(ws)}
}
function flush(ws){
  const s=state.get(ws);if(!s||s.sending||!open(ws)||!s.pending)return;
  if(ws.bufferedAmount>MAX_VIEWER_BUFFER){try{ws.close(1013,"viewer backpressure")}catch{}return}
  const f=s.pending;s.pending=null;
  s.sending=true;try{ws.send(JSON.stringify(f),e=>{s.sending=false;if(e){try{ws.close()}catch{};return}if(s.pending)setImmediate(()=>flush(ws))})}catch{s.sending=false;try{ws.close()}catch{}}
}
function requestFrame(reason="timer") {
  if(!open(controlTunnel)){console.warn(`[Portátil] FRAME solicitado (${reason}) pero control no conectado`);return false}
  return send(controlTunnel,{type:"requestFrame",reason});
}

if(frameRequestTimer)clearInterval(frameRequestTimer);
frameRequestTimer=setInterval(()=>{
  if(shuttingDown||!viewers.size)return;
  if(!lastFrameAt || Date.now()-lastFrameAt>1500) requestFrame("no-frame");
},1500);

function procesarPeticionHTTP(m){
  const headers={...(m.headers||{})};
  headers.host=`localhost:${LOCAL_NODE_PORT}`;
  delete headers.connection;
  delete headers["content-length"];
  delete headers["transfer-encoding"];

  const options={
    hostname:"127.0.0.1",
    port:LOCAL_NODE_PORT,
    path:m.url||"/",
    method:m.method||"GET",
    headers
  };

  const finishError=(status,msg)=>{
    if(open(controlTunnel)){
      send(controlTunnel,{type:"response",id:m.id,statusCode:status,
        headers:{"content-type":"text/plain; charset=utf-8"},
        data:Buffer.from(msg).toString("base64"),end:true});
    }
  };

  let req;
  try{
    req=http.request(options,res=>{
      if(!open(controlTunnel))return;
      send(controlTunnel,{type:"response",id:m.id,statusCode:res.statusCode||200,headers:res.headers||{},end:false});
      const MAX_CHUNK=256*1024;
      res.on("data",chunk=>{
        if(!open(controlTunnel))return;
        for(let i=0;i<chunk.length;i+=MAX_CHUNK){
          const part=chunk.subarray(i,Math.min(i+MAX_CHUNK,chunk.length));
          if(!send(controlTunnel,{type:"response",id:m.id,data:part.toString("base64"),end:false}))break;
        }
      });
      res.on("end",()=>{
        if(open(controlTunnel))send(controlTunnel,{type:"response",id:m.id,end:true});
      });
    });
    req.on("error",e=>finishError(502,`Servidor local 3030 no disponible: ${e.message}`));
    if(m.body)req.write(Buffer.from(m.body,"base64"));
    req.end();
  }catch(e){
    finishError(502,`Error HTTP local: ${e.message}`);
  }
}

function httpResponse(m){
  const res=pending.get(m.id);if(!res)return;
  if(!res.headersSent&&m.headers){const h={...m.headers};delete h["content-length"];delete h["transfer-encoding"];delete h.connection;try{res.writeHead(m.statusCode||200,h)}catch{pending.delete(m.id);try{res.end()}catch{};return}}
  if(m.data)try{res.write(Buffer.from(m.data,"base64"))}catch{}
  if(m.end){try{res.end()}catch{}pending.delete(m.id)}
}
setInterval(()=>{if(open(controlTunnel))send(controlTunnel,{type:"ping",timestamp:Date.now()});broadcast({type:"status",control:open(controlTunnel),video:open(videoTunnel),casa:CASA_IP})},5000).unref();
connectControl();connectVideo();
function shutdown(sig){if(shuttingDown)return;shuttingDown=true;try{controlTunnel?.close()}catch{}try{videoTunnel?.close()}catch{}try{vws.close()}catch{}try{viewerServer.close()}catch{}setTimeout(()=>process.exit(0),300)}
process.on("SIGINT",()=>shutdown("SIGINT"));process.on("SIGTERM",()=>shutdown("SIGTERM"));
console.log(`[Portátil] v22 CASA_IP=${CASA_IP}`);
