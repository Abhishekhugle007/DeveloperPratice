import express from "express";
const app =express();
const PORT = 3004;

app.use(express.json());

app.get('/',(req, res) =>{
    res.send('Hello Home Page From Express!');
})
app.get('/about',(req, res) =>{
    res.send('Hello About Page From Express!');
})

app.get('/search',(req, res) =>{
    const {item} =req.query;
    res.send(`You searched for: ${item}`);
})

app.post('/users',(req,res) =>{
    const {name,email}= req.body;
    res.send(`User ${name} with email ${email} created Successful`)
})
app.listen(PORT,() =>{
    console.log(`Server is running on http://localhost:${PORT}`);
})
