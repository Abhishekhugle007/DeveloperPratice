"use strict";
function checkData(data) {
    if (typeof data === "number") {
        console.log("this is a number");
    }
    else {
        console.log("this is a string");
    }
}
checkData(100);
checkData("Hello");
