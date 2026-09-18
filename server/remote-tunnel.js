const { WebSocket } = require('ws');
const http = require('http');
const { exec } = require('child_process');

const CASA_IP = 'MIIP';
const TUNNEL_PORT = 8080;
const LOCAL_NODE_PORT = 3030;

const VIEWER_PORT = 9090;

let ws = null;
let ultimoFrame = null;


// ============================================================
// ABRIR EL VIEWER EN EL NAVEGADOR DEL PORTÁTIL
// ============================================================

function abrirViewer() {
    const url = `http://localhost:${VIEWER_PORT}/`;

    let command;

    if (process.platform === 'win32') {
        command = `start "" "${url}"`;
    } else if (process.platform === 'darwin') {
        command = `open "${url}"`;
    } else {
        command = `xdg-open "${url}"`;
    }

    exec(command, (error) => {
        if (error) {
            console.error(
                '[Portátil] No se pudo abrir el navegador:',
                error.message
            );

            console.log(
                `[Portátil] Abre manualmente: ${url}`
            );
        }
    });
}


// ============================================================
// CONECTAR AL TÚNEL
// ============================================================

function conectarTunel() {

    console.log(
        `[Portátil] Conectando a ${CASA_IP}:${TUNNEL_PORT}...`
    );

    ws = new WebSocket(
        `ws://${CASA_IP}:${TUNNEL_PORT}`
    );

    ws.on('open', () => {

        console.log(
            '[Portátil] ¡Conectado al PC de casa!'
        );

        console.log(
            '[Portátil] Pasando tráfico a puerto ' +
            LOCAL_NODE_PORT
        );

        abrirViewer();
    });


    ws.on('message', (message) => {

        let msg;

        try {
            msg = JSON.parse(message);
        } catch (err) {
            console.error(
                '[Portátil] Mensaje inválido recibido.'
            );
            return;
        }


        // ====================================================
        // PETICIÓN HTTP DESDE CASA
        // ====================================================

        if (msg.type === 'request') {

            procesarPeticionHTTP(msg);

            return;
        }


        // ====================================================
        // FRAME DE LA PÁGINA REMOTA
        // ====================================================

        if (msg.type === 'frame') {

            ultimoFrame = msg.data;

            return;
        }
    });


    ws.on('close', () => {

        console.log(
            '[Portátil] Conexión cerrada.'
        );

        ws = null;

        console.log(
            '[Portátil] Reintentando en 5 segundos...'
        );

        setTimeout(conectarTunel, 5000);
    });


    ws.on('error', (err) => {

        console.error(
            '[Portátil] Error WebSocket:',
            err.message
        );
    });
}


// ============================================================
// PROCESAR PETICIÓN HTTP
// ============================================================

function procesarPeticionHTTP(msg) {

    const headers = {
        ...msg.headers
    };

    // El servidor local debe creer que la petición
    // procede de localhost.

    headers.host =
        `localhost:${LOCAL_NODE_PORT}`;


    const options = {
        hostname: 'localhost',
        port: LOCAL_NODE_PORT,
        path: msg.url,
        method: msg.method,
        headers: headers
    };


    const localReq = http.request(
        options,
        (localRes) => {

            if (
                !ws ||
                ws.readyState !== WebSocket.OPEN
            ) {
                return;
            }


            // Enviar cabeceras

            ws.send(JSON.stringify({
                type: 'response',
                id: msg.id,
                statusCode: localRes.statusCode,
                headers: localRes.headers,
                end: false
            }));


            // Enviar datos

            localRes.on('data', (chunk) => {

                if (
                    !ws ||
                    ws.readyState !== WebSocket.OPEN
                ) {
                    return;
                }

                ws.send(JSON.stringify({
                    type: 'response',
                    id: msg.id,
                    data: chunk.toString('base64'),
                    end: false
                }));

            });


            // Fin

            localRes.on('end', () => {

                if (
                    !ws ||
                    ws.readyState !== WebSocket.OPEN
                ) {
                    return;
                }

                ws.send(JSON.stringify({
                    type: 'response',
                    id: msg.id,
                    end: true
                }));

            });

        }
    );


    localReq.on('error', (err) => {

        console.error(
            '[Portátil] Error en petición local:',
            err.message
        );


        if (
            ws &&
            ws.readyState === WebSocket.OPEN
        ) {

            ws.send(JSON.stringify({
                type: 'response',
                id: msg.id,
                statusCode: 502,
                headers: {
                    'Content-Type':
                        'text/plain; charset=utf-8'
                },
                data: Buffer.from(
                    'Error conectando al servidor interno'
                ).toString('base64'),
                end: true
            }));

        }
    });


    // Cuerpo de la petición

    if (msg.body) {

        localReq.write(
            Buffer.from(
                msg.body,
                'base64'
            )
        );

    }


    localReq.end();
}


// ============================================================
// SERVIDOR DEL VIEWER
// ============================================================

const viewerServer = http.createServer(
    (req, res) => {


        // ====================================================
        // PÁGINA PRINCIPAL
        // ====================================================

        if (
            req.url === '/' ||
            req.url === '/index.html'
        ) {

            res.writeHead(200, {
                'Content-Type':
                    'text/html; charset=utf-8',

                'Cache-Control':
                    'no-cache'
            });


            res.end(`<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>Remote Browser</title>

<style>

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;

    width: 100%;
    height: 100%;

    background: #111;

    overflow: hidden;
}

body {
    display: flex;

    align-items: center;
    justify-content: center;
}

#screen {
    display: block;

    width: 1280px;
    height: 720px;

    max-width: 100vw;
    max-height: 100vh;

    object-fit: contain;

    background: #222;

    user-select: none;

    -webkit-user-drag: none;

    cursor: default;
}

</style>

</head>


<body>

<img
    id="screen"
    src=""
    draggable="false"
    alt="Pantalla remota"
>


<script>

const screen =
    document.getElementById('screen');


// ========================================================
// RECIBIR FRAMES
// ========================================================

let frameRequest = false;


async function actualizarFrame() {

    if (frameRequest) {
        return;
    }

    frameRequest = true;

    try {

        const response =
            await fetch(
                '/frame?t=' + Date.now(),
                {
                    cache: 'no-store'
                }
            );


        if (response.ok) {

            const blob =
                await response.blob();


            if (blob.size > 0) {

                const url =
                    URL.createObjectURL(blob);


                const oldSrc =
                    screen.src;


                screen.src = url;


                screen.onload = () => {

                    URL.revokeObjectURL(url);

                };

            }

        }

    } catch (err) {

        // El servidor puede estar momentáneamente
        // sin frame. No hacemos nada.

    } finally {

        frameRequest = false;

    }
}


// Aproximadamente 20 FPS de consulta.
// El servidor sólo tiene disponible el último frame.

setInterval(
    actualizarFrame,
    50
);


// ========================================================
// COORDENADAS
// ========================================================

function obtenerCoordenadas(e) {

    const rect =
        screen.getBoundingClientRect();


    // La página remota tiene 1280x720.

    const x =
        (e.clientX - rect.left) *
        (1280 / rect.width);


    const y =
        (e.clientY - rect.top) *
        (720 / rect.height);


    return {
        x: Math.max(
            0,
            Math.min(1280, x)
        ),

        y: Math.max(
            0,
            Math.min(720, y)
        )
    };
}


// ========================================================
// ENVIAR INPUT
// ========================================================

function enviarInput(data) {

    fetch(
        '/input',
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body: JSON.stringify(data)
        }
    ).catch(() => {});

}


// ========================================================
// MOUSE MOVE
// ========================================================

screen.addEventListener(
    'mousemove',
    (e) => {

        const p =
            obtenerCoordenadas(e);


        enviarInput({
            event: 'mouseMoved',

            x: p.x,
            y: p.y
        });

    }
);


// ========================================================
// MOUSE DOWN
// ========================================================

screen.addEventListener(
    'mousedown',
    (e) => {

        const p =
            obtenerCoordenadas(e);


        let button = 'left';


        if (e.button === 1) {
            button = 'middle';
        }

        if (e.button === 2) {
            button = 'right';
        }


        enviarInput({

            event: 'mousePressed',

            x: p.x,
            y: p.y,

            button: button,

            buttons: e.buttons,

            clickCount: 1
        });


        e.preventDefault();

    }
);


// ========================================================
// MOUSE UP
// ========================================================

screen.addEventListener(
    'mouseup',
    (e) => {

        const p =
            obtenerCoordenadas(e);


        let button = 'left';


        if (e.button === 1) {
            button = 'middle';
        }

        if (e.button === 2) {
            button = 'right';
        }


        enviarInput({

            event: 'mouseReleased',

            x: p.x,
            y: p.y,

            button: button,

            clickCount: 1
        });


        e.preventDefault();

    }
);


// ========================================================
// RUEDA
// ========================================================

screen.addEventListener(
    'wheel',
    (e) => {

        const p =
            obtenerCoordenadas(e);


        enviarInput({

            event: 'mouseWheel',

            x: p.x,
            y: p.y,

            deltaX: e.deltaX,

            deltaY: e.deltaY
        });


        e.preventDefault();

    },
    {
        passive: false
    }
);


// ========================================================
// TECLADO
// ========================================================

document.addEventListener(
    'keydown',
    (e) => {

        enviarInput({

            event: 'keyDown',

            key: e.key,

            code: e.code,

            keyCode: e.keyCode,

            text:
                e.key.length === 1
                    ? e.key
                    : ''
        });


        e.preventDefault();

    }
);


document.addEventListener(
    'keyup',
    (e) => {

        enviarInput({

            event: 'keyUp',

            key: e.key,

            code: e.code,

            keyCode: e.keyCode
        });


        e.preventDefault();

    }
);


// ========================================================
// DESACTIVAR MENÚ CONTEXTUAL
// ========================================================

screen.addEventListener(
    'contextmenu',
    (e) => {

        e.preventDefault();

    }
);


// ========================================================
// EVITAR ARRASTRAR LA IMAGEN
// ========================================================

screen.addEventListener(
    'dragstart',
    (e) => {

        e.preventDefault();

    }
);

</script>

</body>

</html>`);

            return;
        }


        // ====================================================
        // ÚLTIMO FRAME
        // ====================================================

        if (req.url.startsWith('/frame')) {

            if (!ultimoFrame) {

                res.writeHead(204);
                res.end();

                return;
            }


            const buffer =
                Buffer.from(
                    ultimoFrame,
                    'base64'
                );


            res.writeHead(200, {

                'Content-Type':
                    'image/jpeg',

                'Cache-Control':
                    'no-store, no-cache, must-revalidate',

                'Pragma':
                    'no-cache'
            });


            res.end(buffer);

            return;
        }


        // ====================================================
        // INPUT
        // ====================================================

        if (
            req.url === '/input' &&
            req.method === 'POST'
        ) {

            let body = '';


            req.on(
                'data',
                chunk => {
                    body += chunk.toString();
                }
            );


            req.on(
                'end',
                () => {

                    try {

                        const input =
                            JSON.parse(body);


                        if (
                            ws &&
                            ws.readyState ===
                                WebSocket.OPEN
                        ) {

                            ws.send(
                                JSON.stringify({
                                    type: 'input',
                                    ...input
                                })
                            );

                        }

                    } catch (err) {

                        console.error(
                            '[Portátil] Input inválido:',
                            err.message
                        );

                    }


                    res.writeHead(204);
                    res.end();

                }
            );

            return;
        }


        // ====================================================
        // 404
        // ====================================================

        res.writeHead(404);
        res.end('Not found');
    }
);


// ============================================================
// SERVIDOR VIEWER
// ============================================================

viewerServer.listen(
    VIEWER_PORT,
    () => {

        console.log(
            `[Portátil] Viewer listo en ` +
            `http://localhost:${VIEWER_PORT}/`
        );

    }
);


// ============================================================
// INICIAR TÚNEL
// ============================================================

conectarTunel();