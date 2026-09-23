const fs = require('fs');

fs.writeFile("async.txt", "This is an asynchronous file write operations Updated",'utf8', (err)=>{
    if(err){
        console.error("Error writing file:", err);
    } else {
        console.log('File written Successfully');
    }
});

fs.readFile("async.txt", 'utf8', (err, data)=>{
    if(err){
        console.error("Error reading file:", err);
    } else {
        console.log("file data:", data);
    }
});


fs.appendFile("async.txt", "\nThis is an asynchronous file append operations Updated",'utf8', (err)=>{
    if(err){
        console.error(err);
    } else {
        console.log('File appended Successfully');
    }
});