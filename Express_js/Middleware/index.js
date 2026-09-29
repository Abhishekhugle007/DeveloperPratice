import express from 'express';
const app = express();

const PORT = 3001;


app.use((req, res,next) =>{
    console.log(`[${new Date().toLocaleDateString()}] ${req.method} ${req.url}`);
    next();

});



app.use('/admin',(req, res, next) =>{
    console.log('Admin Section Accessed');
    next();
    
})

app.get('/',(req, res)=>{
    res.send('Hello Home!');

});

app.get('/admin/dashboard', (req, res) => {
  res.send('Hello Admin Page');
})

app.get('/about',(req, res)=>{
    res.send('Hello About!');

});

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost: ${PORT}`);
    
})