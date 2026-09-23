const fs = require('fs').promises;

// const fs = require('fs/promises');

fs.writeFile("promise.txt", "This is a promise based file write operations Updated",'utf8')
.then(()=>{
    console.log('File written Successfully');
})
.catch((err)=>{
    console.error("Error writing file:", err);
});


fs.readFile("promise.txt", 'utf8')
.then((data)=>{
    console.log("file data:", data);
})
.catch((err)=>{
    console.error("Error reading file:", err);
});