var num =10;
var x = num.valueOf();
var y ={a:10};
console.log(x-y);// NAN

y.toString =function(){
    return"99"
};
console.log(x-y);
y.valueOf=function(){
    return 3000
}
console.log(x-y);
