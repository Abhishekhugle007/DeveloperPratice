class IPhone {
  private _price: number;
  private _model: string;

  constructor(model: string, price: number) {
    this._model = model;
    this._price = price;
  }

  // Getter for model
  get model(): string {
    return this._model;
  }

  // Setter for model
  set model(newModel: string) {
    this._model = newModel;
  }

  // Getter for price
  get price(): number {
    return this._price;
  }

  // Setter for price
  set price(newPrice: number) {
    if (newPrice < 0) {
      console.log("Invalid price");
      return;
    }

    this._price = newPrice;
  }

  display(): void {
    console.log("Model:", this._model);
    console.log("Price:", this._price);
  }
}

const iphone = new IPhone(
  "iPhone 17",
  80000
);

iphone.display();

console.log("Price:", iphone.price);

iphone.price = 90000;

console.log("New Price:", iphone.price);

iphone.model = "iPhone 17 Pro";

console.log("New Model:", iphone.model);
