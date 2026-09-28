
//common js

// const express = require('express');

// const app =express();
// const PORT =3000;
// //Home Route
// app.get('/',(req, res) =>{
//     res.send('Hello World! Express Js Tutorial ');
// })

// //about

// app.get('/about',(req, res) =>{
//     res.send('About  page ');
// })


// app.listen(PORT,()=>{
//     console.log(`Server is running on http://localhost:${PORT}`);
    
// });


// Modules

// import express from 'express'
// import {add, sub} from './math.js';
// const app =express();
// const port = 3000;

// app.get('/',(req,res)=>{
//     res.send('Hello world ExpressJs!');
//     console.log(add(2,3));
//     console.log(sub(2,9));
    

// })

// app.get('/about',(req,res)=>{
//     res.send(`<h1>Hello aboutExpressJs!</h1>`);

// })

// app.listen(port,()=>{
//     console.log(`App listening on port ${port}`);
// })
                                                                                                                                                                                                                                                                                                                                                                       

import express from 'express';
import path from 'path';

const app =express();
const PORT = 3000;

app.get('/',(req,res) =>{
    console.log(path.resolve('index.html'));
    const filePath = path.resolve('index.html');
     res.sendFile(filePath);
    
})

app.listen(PORT,()=>{
    console.log(`App listening on http://localhost:${PORT}`);
})
