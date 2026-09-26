const http = require('http');
// const server  = http.createServer((req, res)=>{
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     res.write('Hello,World');
//     res.end();
// });

const server  = http.createServer((req, res)=>{
    if(req.url === '/'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Hello, World!</h1>');
        res.end();
    }
    else if(req.url === '/about'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>About Page</h1>');
        res.end();
    }
    else if(req.url === '/api/data'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        const data = {
            name: 'John Doe',
            age: 30,
            city: 'New York'    
        };
        res.write(JSON.stringify(data));
        res.end();
    }
    else{
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('<h1>404 Not Found</h1>');
        res.end();
    }
});
server.listen(3000,()=>{
    console.log("Server is listening on port 3000");
});


