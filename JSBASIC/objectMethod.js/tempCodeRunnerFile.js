const product = { name: "IPhone 14 pro", price: 12500 };

Object.defineProperty(product, "name",{configurable:false});

product.name="adf";

delete product.name;

console.log(product);

delete product.price;

console.log(product);

