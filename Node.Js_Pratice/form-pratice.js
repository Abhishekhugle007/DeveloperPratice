const http = require('http');
const fs = require('fs');
const path = require('path');
const queryString = require('querystring');
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[character]));

http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/submit') {
        let body = '';
        req.on('data', (chunk) => body += chunk);
        req.on('end', () => {
            const formData = queryString.parse(body);
            const username = formData.username?.trim();
            const password = formData.password;

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end('<h1>Username and password are required.</h1>');
            }

            try {
                fs.writeFileSync(path.join(__dirname, 'form.txt'), `Username: ${username}\n`, { flag: 'a' });
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end('<h1>Could not save form data.</h1>');
            }

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Form Submitted Successfully</h1><p>Welcome, ${escapeHtml(username)}!</p>`);
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'form.html'), 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end('404 Not Found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('404 Not Found');
}).listen(process.env.PORT || 3000);