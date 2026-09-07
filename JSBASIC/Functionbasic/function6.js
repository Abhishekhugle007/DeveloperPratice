function add(x,y=5 ,z){
    console.log(x);
    console.log(y);
    console.log(z);
    return x+y;

}

console.log(add(10,55,3));

// y=5 is default parameter

 // in functions we can define default parameter value if are do not manually pass anything to the parameter it will automatically pick the default value or if we passed something then it will take the passed value