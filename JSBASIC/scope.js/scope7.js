var x=10; //global
function fun (){ //global
    var x=20; //fun
    console.log(x); //20
}

var x=30;// same x has above in global scope -x-30
fun();
console.log(x); //30
/*-----------------------------------------------------------*/
  
var x=30; // global
for(var x=1;x<3;x++) //global 
    console.log(x);

console.log("x after loop is",x);
