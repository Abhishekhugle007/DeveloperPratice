"use strict";
class Apple14 {
    constructor(model, price) {
        this.model = model;
        this.price = price;
    }
    display() {
        console.log("Model:", this.model);
        console.log("Price:", this.price);
    }
}
const iphone14 = new Apple14("iPhone 17 Pro", 120000);
iphone14.display();
