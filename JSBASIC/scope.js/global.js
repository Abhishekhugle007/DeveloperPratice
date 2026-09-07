let x = 10;

function fun() {
    console.log(x);
}

function gun() {
    for (let i = 0; i < x; i++) {
        // Loop body is empty
    }
}

fun();
gun();

console.log("value of x is", x);
