"use strict";
let data = "Hello";
if (typeof data === "string") {
    console.log(data.toUpperCase());
}
function printValue(value) {
    if (typeof value === "string") {
        console.log("String:", value);
    }
    else if (typeof value === "number") {
        console.log("Number:", value);
    }
    else {
        console.log("Unknown type");
    }
}
printValue("John");
printValue(25);
printValue(true);
let a = "Hello";
console.log(a.toUpperCase()); // 
let b = "Hello";
// console.log(b.toUpperCase()); // error
if (typeof b === "string") {
    console.log(b.toUpperCase()); // 
}
