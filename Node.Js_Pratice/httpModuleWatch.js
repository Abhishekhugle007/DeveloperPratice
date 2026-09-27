const http = require('http');
let age =25;

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href=""
          rel="stylesheet"
        />
        <title></title>
      </head>
      <body>
        <h1>Hello, Worl</h1>
        <p>Refresh the page to see the updated content.</p>
      </body>
    </html>
    `);
    res.end();
    process.exit();
}); server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});