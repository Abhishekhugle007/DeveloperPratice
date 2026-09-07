
class product{
         
    static x=10;

    constructor(name , price){
        this.name = name;
        this.price = price;
        console.log(product.x);
    }
}
let p1 = new product("iPhone", 1000);
console.log(p1.x);

console.log(product.x);

product.x=40;
console.log(product.x);


// static variables only associate with class not with object
// static variables are shared by all objects of class
// static variables are accessed using class name
// static variables are declared using static keyword
// static variables are not instance variables
// static variables are not accessed using this keyword
// static variables are accessed using class name
// static variables private to class
// static variables are declared outside constructor