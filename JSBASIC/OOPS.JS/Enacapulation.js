class Product {
    #name;
    #price;
    #category;
    #description;
    rating;

    constructor(productName, productPrice, productCategory, productDescription, productRating) {
        this.#name = productName;
        this.#price = productPrice;
        this.#category = productCategory;
        this.#description = productDescription;
        this.rating = productRating;
    }

    displayProduct() {
        console.log("Product displayed:", this.#name, this.#price, this.#category, this.#description, this.rating);
    }

    // Getter for name
    getName() {
        return this.#name;
    }

    // Setter for name
    setName(newName) {
        this.#name = newName;
    }

    // Getter for price
    getPrice() {
        return this.#price;
    }

    // Setter for price
    setPrice(newPrice) {
        this.#price = newPrice;
    }

    // Getter for description
    get description() {
        console.log("Getter Called");
        return this.#description;
    }

    // Setter for description
    set description(newDescription) {
        if (newDescription.length === 0) {
            console.log("Invalid description");
            return;
        }
        this.#description = newDescription;  // Corrected assignment
    }
}

const product = new Product("Laptop", 1000, "Electronics", "High performance", 4.5);
product.displayProduct();  //  Correct output

console.log(product.getName());  // Correct getter usage
console.log(product.getPrice());  //  Correct getter usage

product.setName("Gaming Laptop");  //  Correct setter usage
console.log(product.getName());  // Updated name
product.setPrice(1500);  //  Correct setter usage
console.log(product.getPrice());  // Updated price

product.description = "";  // Invalid description
console.log(product.description);  //  Still "High performance"

product.description = "Powerful gaming laptop";  //  Correct setter usage
console.log(product.description);  //  "Powerful gaming laptop"
