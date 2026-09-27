// const http = require('http');
// const port = process.env.PORT || 3000;

// const server = http.createServer((req, res) => {
//     res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
//     res.end('Hello, World!\n');
// });

// server.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}/`);
// });


const https = require('https');
const fs = require('fs');
const path = require('path');

const passphrase = process.env.TLS_PASSPHRASE || 'local-dev-only';
const options = {
    pfx: fs.readFileSync(path.join(__dirname, 'server.pfx')),
    passphrase
};

const port = process.env.PORT || 3443;
const server = https.createServer(options, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hello, secure world!\n');
});

server.listen(port, () => {
    console.log(`HTTPS server running at https://localhost:${port}/`);
});

