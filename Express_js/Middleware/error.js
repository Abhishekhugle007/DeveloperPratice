import express from 'express';
const app = express();

const PORT =3005;
app.get('/', (req, res) =>{
    res.send('Hello page');
});

app.get('/fail',(req, res , next)=>{{
     //Artificial error creation

     const err = new Error('something went wrong');
     err.statusCode= 500; // Custom status code
     next(err);

}})

// Error handling middleware

app.use((err, req, res, next) =>{
    console.log("Error caught by middleware:", err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server Error'
    });
});

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
    
})