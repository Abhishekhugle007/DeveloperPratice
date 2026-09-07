const product = { name: "IPhone 14 pro", price: 12500 };
console.log(product);
Object.defineProperty(product , "name", { writable: true});

product.name = "adf"; // This will change the name property due to writable: false

console.log(product); // Output: { name: "IPhone 14 pro", price: 12500 }

product.price = 13500; // This will successfully update the price

console.log(product); // Output: { name: "IPhone 14 pro", price: 13500 }

 /*-------------------------------------------------------------------------------------------------------*/

const product = { name: "IPhone 14 pro", price: 12500 };

Object.defineProperty(product, "name",{configurable:false});

product.name="adf";

delete product.name;

console.log(product);

delete product.price;

console.log(product);

