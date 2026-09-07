
function fun() {
    console.log(x);
    let x = 10;

}

function gun() {
    for (let i = 0; i < x; i++) { // x is not visible here
        // Loop body is empty
    }
}

fun();
gun();

console.log("value of x is", x); // x is not visible here also
