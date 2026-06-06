const http = require('http');
const net = require('net');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8286;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Tunnel Server Running');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    let serverSocket = null;
    
    ws.on('message', (message, isBinary) => {
        if (!serverSocket) {
            const target = message.toString();
            const [host, port] = target.split(':');
            
            serverSocket = net.connect(port || 443, host, () => {
                ws.send('CONNECTED');
            });
            
            serverSocket.on('data', (chunk) => {
                if (ws.readyState === ws.OPEN) ws.send(chunk);
            });
            
            serverSocket.on('end', () => ws.close());
            serverSocket.on('error', () => ws.close());
            return;
        }
        
        if (isBinary) {
            serverSocket.write(message);
        } else {
            serverSocket.write(Buffer.from(message));
        }
    });
    
    ws.on('close', () => {
        if (serverSocket) serverSocket.end();
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
