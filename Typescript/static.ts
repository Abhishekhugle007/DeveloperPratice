class IPhone16{
  static brand2: string = "Apple";

  constructor(
    public model: string,
    public price: number
  ) {}

  display(): void {
    console.log(
      IPhone16.brand2,
      this.model,
      this.price
    );
  }
}
const iphone1 = new IPhone16("iPhone 17", 80000);

const iphone2 = new IPhone16("iPhone 17 Pro", 120000);

const iphone3 = new IPhone16("iPhone 17 Pro Max", 150000);

iphone1.display();
iphone2.display();
iphone3.display();


