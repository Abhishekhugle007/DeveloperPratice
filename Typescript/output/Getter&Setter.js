"use strict";
class IPhone {
    constructor(model, price) {
        this._model = model;
        this._price = price;
    }
    // Getter for model
    get model() {
        return this._model;
    }
    // Setter for model
    set model(newModel) {
        this._model = newModel;
    }
    // Getter for price
    get price() {
        return this._price;
    }
    // Setter for price
    set price(newPrice) {
        if (newPrice < 0) {
            console.log("Invalid price");
            return;
        }
        this._price = newPrice;
    }
    display() {
        console.log("Model:", this._model);
        console.log("Price:", this._price);
    }
}
const iphone = new IPhone("iPhone 17", 80000);
iphone.display();
console.log("Price:", iphone.price);
iphone.price = 90000;
console.log("New Price:", iphone.price);
iphone.model = "iPhone 17 Pro";
console.log("New Model:", iphone.model);
