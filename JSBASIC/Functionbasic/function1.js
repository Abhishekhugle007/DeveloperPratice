//using the below syntax we can define our function /blackbox

function greetingToEveryone(){
    console.log("My logic line 1");
    console.log("My logic line 2");
    console.log("My logic line 3.....");
}

greetingToEveryone();// calling our function 
greetingToEveryone();
greetingToEveryone();
greetingToEveryone();

console.log(Math.sqrt(100));

function isEvenOrOdd(x){
    
    if (x % 2 === 0) {
        console.log(`${x} is Even`);
    } else {
        console.log(`${x} is Odd`);
    }
}


isEvenOrOdd(97); // Output: 97 is Odd
isEvenOrOdd(2);  // Output: 2 is Even

