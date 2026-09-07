const product ={ name:"IPhone 14 pro", price:12500}
Object.freeze(product);

product.company="Apple";// new addition not allowed
console.log(product); // this will still print --{name:"Iphone 14 pro",price:125000}


delete product.price; // deletion of key-value pair not allowed

console.log(product); // this will still print--{name:"Iphone 14 pro",price:125000}

product.name="iphone 15 pro";
console.log(product);

console.log(Object.isFrozen(product));
console.log(Object.isSealed(product)); 