class Product {
    #name;
    #price;
    #description;

    constructor(builder) {
        // validations before object creation 
        console.log("Calling Product constructor");
        
        this.#name = builder.name;

        if (builder.price > 0 && typeof builder.price === "number") {
            this.#price = builder.price;
        } else {
            console.log("Invalid price");
            this.#price = 0; // default fallback    
        }

        this.#description = builder.description;
    }

    displayProduct() {
        console.log("Product displayed:", this.#name, this.#price, this.#description);
    }

    static get Builder() {
        class Builder {
            constructor() {
                this.name = ""; //default values
                this.price = 0;
                this.description = "";
            }

            setName(incomingName) {
                this.name = incomingName;
                return this;
            }

            setPrice(incomingPrice) {
                this.price = incomingPrice;
                return this;
            }

            setDescription(incomingDescription) {
                this.description = incomingDescription;
                return this;
            }

            build() {
                return new Product(this); 
            }
        }
        return new Builder(); //   return instance, not class
    }
}

// Example usage:
const p = Product.Builder
    .setName("iPhone")
    .setPrice(1000)
    .setDescription("Apple iPhone")
    .build();

console.log(p);
p.displayProduct();
 