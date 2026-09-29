import express from "express";
const app = express();

const PORT = 3004;


app.post('api/user',(req,res) =>{
    console.log('Json Body', req.body);
    res.json({msg: 'Json data received', data: req.body})
    
})
app.get('/',(req, res) =>{
    res.send('Hello from the express Server!');
});


app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost: ${PORT}`);
    
})