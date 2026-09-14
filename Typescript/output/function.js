"use strict";
function fn() {
    return 'Apple';
}
fn();
function simple() {
}
function complex() {
    let data = 10;
    let type = "age";
    let name = "Anil";
    if (type == "age") {
        return data; // number
    }
    else {
        return name; // string
    }
}
console.log(complex());
