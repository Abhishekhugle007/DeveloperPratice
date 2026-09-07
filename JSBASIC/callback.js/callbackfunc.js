function h(x , fn){
    // h--> is a  higher order function
    // x-->number
    //fn -->callback 
    console.log(x*x);
    fn(x*x);
}

h(10,exec)

function exec(n){
     console.log("squared value is ",n)
}


