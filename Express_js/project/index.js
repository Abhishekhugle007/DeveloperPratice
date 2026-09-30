import express from "express";
const app = express();
const PORT = 3005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let notes = []

//all notes'

app.get('/notes',(req,res) =>{
    res.json({
    success:true,
    data:notes
    });
    
});

//update a notes

app.put('/notes/:id',(req,res)=>{
    const note = notes.find(n => n.id === parseInt(req.params.id));
    if(!note){
      return res.status(404).json({
        success:false,
        message:'Notes not found'
      });
    }

    const {title, content} = req.body;
    note.title =title || note.title;
    note.content = content || note.content;
    res.json({
        success:true,
        message:'Notes updated successfully',
        data:note
    });
});

//delete

app.delete('/notes/:id',(req,res) =>{
    const noteIndex = notes.find(n => n.id === parseInt(req.params.id));
    if(noteIndex === -1){
      return res.status(404).json({
        success:false,
        message:'Notes not found'
      });
    }
    const deleted =notes.splice(noteIndex,1);
    res.json({
        success:true,
        message: 'note deleted Successfully',
        data: deleted
    });
});

app.post('/notes',(req, res)=>{
    const { title, content } = req.body ?? {};
    if (!title || !content) {
     return res.status(400).json({
        success: false,
        message: 'Title and content are required'
     });
    }
   const newNotes = {id:notes.length + 1, title, content};
   notes.push(newNotes);
   res.status(201).json({
    success:true,
    message:'Note added successfully'
   })
})
app.get('/notes/:id',(req,res)=>{
    const note = notes.find(n => n.id === parseInt(req.params.id));
    if(!note){
        return res.status(404).json({
            success:false,
            message:'Note not found'
        });
    }
    res.json({
        success:true,
        data:note
    })
})
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


