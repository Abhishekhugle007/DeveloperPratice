// in js functions are first class citizens
// in js function can be returned from a function and function can be passed as an argument to another function

function someFunction(){
    return function x(){
        return 10;
    }
}
function anotherFunction(f1){
    f1(); 
    console.log("called f1");
}

function hello(){
    console.log("hello");
}
anotherFunction(hello);

