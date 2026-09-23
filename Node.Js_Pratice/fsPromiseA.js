const fs  = require('fs').promises;

// write file
async function writeFile() {
     try{
           await fs.writeFile("promiseA.txt", "This is a promise based file write operations Updated",'utf8');
           console.log('File written Successfully');
     }catch(err){
         console.error("Error writing file:", err);
     }
}

writeFile();

// READ file
async function readFile() {
    try{
        const data = await fs.readFile("promiseA.txt", 'utf8');
        console.log('File read Successfully:', data);
    }   
catch(err){     
    console.error("Error reading file:", err);
    }
}
readFile();


// CRUD fILE

async function crudFile() {
    try{
        // CREATE file
        await fs.writeFile("crudFile.txt", "This is a promise based file write operations Updated",'utf8');
        console.log('File written Successfully');
    }
    catch(err){
        console.error("Error writing file:", err);
    }

    try{
        // READ file
        const data = await fs.readFile("crudFile.txt", 'utf8');
        console.log('File read Successfully:', data);
    }
    catch(err){
        console.error("Error reading file:", err);
    }

    try{
        // UPDATE file
        await fs.appendFile("crudFile.txt", "\nThis is an updated line.", 'utf8');
        console.log('File updated Successfully');
    }
    catch(err){
        console.error("Error updating file:", err);
    }

    try{
        // DELETE file
        await fs.unlink("crudFile.txt");
        console.log('File deleted Successfully');
    }
    catch(err){
        console.error("Error deleting file:", err);
    }
}

crudFile();
