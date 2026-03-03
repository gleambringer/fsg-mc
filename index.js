const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = 'http://fsg-01.eagler.host'; 

const proxy = httpProxy.createProxyServer({
    target: TARGET,
    ws: true,
    changeOrigin: true,
    secure: false,
    followRedirects: true,
    xfwd: true
});

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('FSG MC Proxy is Active');
        return;
    }

    proxy.web(req, res, (err) => {
        res.writeHead(502);
        res.end();
    });
});

server.on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head, (err) => {
        socket.destroy();
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT);
