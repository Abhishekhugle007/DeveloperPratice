const http = require('http');

const userData = [
    {
        id: 1,
        name: 'John Doe',
        email: 'test@example.com',
        age: 25
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 30
    }
];

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    res.end(JSON.stringify(userData));
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
