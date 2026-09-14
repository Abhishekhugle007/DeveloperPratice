type Data = string | number;

function checkData(data: Data) {
    if (typeof data === "number") {
        console.log("this is a number");
    } else {
        console.log("this is a string");
    }
}

checkData(100);
checkData("Hello");
