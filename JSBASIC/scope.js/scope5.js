
var x=10; //global
console.log(x,y);
if(true){
    var x=20; // var can't defined as block 
    var y=30;
    console.log(x,y);
}

console.log(x,y);