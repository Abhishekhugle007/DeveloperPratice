import express from "express";
const app =express();
const PORT = 3004;


let users = [
    {id:1, name:'Mohit', age:24},
    {id:2, name:'Abhi', age:26},
    {id:3, name:'Alice', age:27}
]


app.use(express.json());

app.get('/users',(req, res) =>{
    res.json(users);
})

app.post('/users',(req, res) =>{
   const newUser = {id:Date.now(), ...req.body};
   users.push(newUser);
   res.status(201).json(newUser);
   
})

app.put('/users/:id',(req,res) =>{
    const userId =parseInt(req.params.id);
    const index = users.findIndex(user => user.id == userId);

    if(index === -1){
        return res.status(404).json({message: 'User not found'});

    }
    users[index]={id:userId, ...req.body};
    res.json(users[index]);

})

app.delete('/users/:id',(req,res) =>{
    const userId =parseInt(req.params.id);
    const index = users.findIndex(user => user.id == userId);

     if(index === -1){
        return res.status(404).json({message: 'User not found'});

    }

    users.splice(index,1);
    res.json({message: 'User deleted Successfully'});
});


app.listen(PORT,() =>{
    console.log(`Server is running on http://localhost:${PORT}`);
    
})