import express from "express";

const app = express.Router();

app.get('/', (req, res) =>{
    res.send('<h1>Hello, Home!</h1>');
});


app.get('/profile', (req, res) =>{
    res.send('<h1>Hello,  User Profiles Home!</h1>');
});


export default app;