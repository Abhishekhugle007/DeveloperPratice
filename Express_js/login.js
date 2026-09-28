import express from 'express';
import home from './pages/home.js';
import login from './pages/index.js';
import submit from './pages/submit.js';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send(home());
});

app.get('/login', (req, res) => {
    res.send(login());
});

app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    res.send(submit({ username, password }));
});

app.get('/about', (req, res) => {
    res.send('<h1>Hello About Express.js!</h1>');
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
