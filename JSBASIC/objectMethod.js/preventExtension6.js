const product ={ name:"IPhone 14 pro", price:"12500",}
Object.preventExtensions(product);

product.company="Apple";// new addition not allowed
console.log(product); // this will still print --{name:"Iphone 14 pro",price:125000}


delete product.price; // deletion of key-value pair  allowed

console.log(product); // this will still print--{name:"Iphone 14 pro"}

product.name="iphone 15 pro";

console.log(product);

 