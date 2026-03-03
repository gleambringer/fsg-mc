const http = require('http');
const httpProxy = require('http-proxy');

// --- AUTO-ROTATION CONFIG ---
const START_DATE = new Date('2026-03-03T16:00:00'); // The date you start with fsg-01
const ROTATION_DAYS = 3; 

function getTargetUrl() {
    const now = new Date();
    // Calculate difference in days
    const diffInMs = now - START_DATE;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Calculate which 3-day block we are in (0, 1, 2...)
    // If it's been 0-2 days, block is 0. If 3-5 days, block is 1.
    const blockIndex = Math.max(0, Math.floor(diffInDays / ROTATION_DAYS));
    
    // Server number is blockIndex + 1 (01, 02, 03...)
    const serverNum = (blockIndex + 1).toString().padStart(2, '0');
    
    return `http://fsg-${serverNum}.eagler.host`;
}

const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true,
    secure: false,
    followRedirects: true,
    xfwd: true
});

const server = http.createServer((req, res) => {
    const target = getTargetUrl();
    
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Proxy is Active. Current Target: ${target}`);
        return;
    }

    proxy.web(req, res, { target }, (err) => {
        res.writeHead(502);
        res.end();
    });
});

server.on('upgrade', (req, socket, head) => {
    const target = getTargetUrl();
    proxy.ws(req, socket, head, { target }, (err) => {
        socket.destroy();
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT);
