"use strict";
function infiniteLoop() {
    while (true) {
        console.log("Running...");
    }
}
//console.log(infiniteLoop());
function errorMessage(message) {
    throw new Error(message);
}
errorMessage("Something went wrong");
