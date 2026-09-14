interface IPhone14 {
  model: string;
  price: number;

  display(): void;
}

class Apple14 implements IPhone14 {

  model: string;
  price: number;

  constructor(model: string, price: number) {
    this.model = model;
    this.price = price;
  }

  display(): void {
    console.log("Model:", this.model);
    console.log("Price:", this.price);
  }
}

const iphone14 = new Apple14(
  "iPhone 17 Pro",
  120000
);

iphone14.display();
