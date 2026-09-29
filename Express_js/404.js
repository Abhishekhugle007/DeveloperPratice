import express from 'express';
import path from 'path';

const app = express();
const port = 3000;
const basePath = path.resolve();

app.use('/Express_js/public', express.static(path.join(basePath, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'page', 'home.html'));
});

app.get('/about', (req, res) => {
    res.send('<h1>Home About</h1><p>Welcome to the About page</p>');
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(basePath, 'page', '404.html'));
});

app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
});