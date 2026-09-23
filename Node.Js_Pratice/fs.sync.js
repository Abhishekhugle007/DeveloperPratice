const fs = require('fs');


fs.writeFileSync("sync.txt", "This is a synchronous file write operations Updated",'utf8');
console.log('File written Successfully');


const data = fs.readFileSync("sync.txt", 'utf8');
console.log(data);


fs.appendFileSync("sync.txt", "\nThis is a synchronous file append operations Updated",'utf8');


// Create directory
// fs.mkdirSync("syncDir");
// console.log('Directory created Successfully');

//remove directory

// fs.rmdirSync("syncDir");
// console.log('Directory removed Successfully');


if(fs.existsSync("sync.txt")){
    console.log('File exists');
} else {
    console.log('File does not exist');
}



