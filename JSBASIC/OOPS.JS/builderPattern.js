class product {
    constructor(builder) {
        this.name = builder.name;

        if (builder.price > 0 && typeof builder.price === "number") {
            this.price = builder.price;
        } else {
            return {}; // This will cause an issue when trying to access properties later
        }
        
        this.description = builder.description;
        this.category = builder.category;
        this.rating = builder.rating;
    }

 
 get price() {
    return this._price;
 }
 set price(p) {
    if (p > 0 ) {
        this._price = p;
    } else {
        console.log("Invalid price");
    }
 }
}

const p = new product({
    name: "iPhone",
    price: 1000,
    description: "Apple iPhone",
    category: "Electronics",
    rating: 4.5
});

console.log(p);
