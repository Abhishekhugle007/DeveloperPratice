

// console.log(__dirname) // output the directory name of the current 

// console.log(__filename); 

// const filePath = "C:/Users/HP/Desktop/Node.Js_Pratice/app.js"
// console.log(path.basename(filePath)); // output the file name with extension
// console.log(path.basename(filePath, '.js')); // output the file name without extension


// console.log(path.dirname(filePath)); // output the directory name of the file


// console.log(path.extname(filePath)); //output the file extension


// const finalPath = path.join('/Users/HP/Desktop', 'Node.Js_Pratice', 'app.js'); // join the path segments into a single path
// console.log(finalPath);


// const resolvedPath = path.resolve('app.js'); // resolve the path to an absolute path
// console.log(resolvedPath);

// console.log(path.parse(filePath));


//Real World Examples
// Import the built-in 'path' module
const path = require('path');

// Import the built-in 'fs' (File System) module
const fs = require('fs');

// Create the path to data/info.txt
const filePath = path.join(__dirname, 'data', 'info.txt');



// Write "Hello World!" to the file
fs.writeFileSync(filePath, 'Hello World!');

// Read the file using UTF-8 encoding
const data = fs.readFileSync(filePath, 'utf-8');

// Display the data
console.log(data);
