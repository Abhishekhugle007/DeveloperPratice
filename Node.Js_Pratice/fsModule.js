
const fs = require('fs');


//Async
// fs.readFile('text.txt','utf8',(err,data) =>{
//     if(err){
//         console.error('Enter reading files:', err);
//     }
//     else{
//         console.log('File content:', data);
//     }
// })

//Sync

// const data = fs.readFileSync('text.txt','utf8');
// console.log('File Content:', data);


//Write Files

// fs.writeFile('data.txt', 'Abhishekh Ugle Working in Etech Global Service ',(err) =>{
//     if(err){
//         console.error('Enter Writing Files', err);
//     }
//     else{
//         console.log('File Written Successfully');
//     }
// })



// Append Files

fs.appendFile('data.txt','\n I am developer',(err)=>{
    if(err){
        console.log('Error Appending to files:', err);
        
    }
    else{
        console.log('Files appended Successfully');
        
    }
})



// Delete Files

// fs.unlink('data.txt', (err)=>{
//     if(err){
//         console.log('Error deleting file:', err);
        
//     }
//     else{
//         console.log('File deleted Successfully');
        
//     }
// })


//rename Files

// fs.rename('text.txt','newText.txt', (err)=>{
//     if(err){
//         console.log('Error renaming File:', err);
        
//     }
//     else{
//         console.log('File renamed Successfully');
//     }
// })