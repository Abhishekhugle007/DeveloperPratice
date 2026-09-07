class Product {
    #name;
    #price;
    #description;

    constructor(builder) {
        // validations before object creation 
        console.log("calling product constructor")
        this.#name = builder.name;
        if (builder.price > 0 && typeof builder.price === "number") {
            this.#price = builder.price;
        } else {
            console.log("Invalid price");
            this.#price = 0; // Set a default value or handle it as needed
        }
        this.#description = builder.description;
    }

    displayProduct(){
        console.log("product displayed", this.#name,this.#price,this.#description);
    }

    static get Builder() {
         class Builder {
            constructor() {
                this.name = "";
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
        return Builder;
    }
}

// Example usage:
/**
 * product.builder() calls the builder getter 
 */
const p = new Product.Builder()
    .setName("iPhone")
    .setPrice(1000)
    .setDescription("Apple iPhone")
    .build();

console.log(p);
p.displayProduct();