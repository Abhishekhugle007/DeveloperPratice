// function greet(name, callback){
//     console.log("Hello" + name);
//     callback();

// }

// function callme(){
//     console.log("I a, callback function");
// }
    
//     greet("Abhishekh", callme);



// const fs =require('fs');
// fs.readFile('call.txt', 'utf-8', function(err,data){
//     if(err) return console.error(err);
//     console.log(data);
// });

const fs = require('fs').promises;
const path = require('path');

async function readFiles() {
    try {
        const firstData = await fs.readFile(path.join(__dirname, 'input1.txt'), 'utf-8');
        console.log(firstData);

        const secondData = await fs.readFile(path.join(__dirname, 'input2.txt'), 'utf-8');
        console.log(secondData);
    } catch (error) {
        console.error('Could not read the input files:', error.message);
    }
}

readFiles();


