interface CollegeType{
    name:string,
    location:string,
    student:number,
    branch:number
}

let CollegeData3:Partial<CollegeType>={
    name:'iit delhi',
    location:'delhi',
    student:600,
}

// Partial   ->optional
// Required  -> required
// Readonly  -> cannot change
// Pick      ->choose
// Omit      ->remove
// Record    -> create key/value structure


// type Iphone = {
//     model: string;
//     price: number;
//     color: string;
//     storage: number;
// };

// // Partial makes all properties optional
// type IphoneUpdate = Partial<Iphone>;

// const update: IphoneUpdate = {
//     price: 99999
// };



// console.log(update);



// type Iphone = {
//     model: string;
//     price?: number;
//     color?: string;
//     storage?: number;
// };

// type RequiredIphone = Required<Iphone>;

// const iphone18: RequiredIphone = {
//     model: "iPhone 17 Pro",
//     price: 129999,
//     color: "Black",
//     storage: 256
// };

// console.log(iphone18);



// type Iphone = {
//     model: string;
//     price: number;
//     color: string;
//     storage: number;
// };

// type ReadonlyIphone = Readonly<Iphone>;

// const iphone18: ReadonlyIphone = {
//     model: "iPhone 17 Pro",
//     price: 129999,
//     color: "Black",
//     storage: 256
// };

// console.log(iphone18.model);
// console.log(iphone18.price);

//  Error
// iphone.price = 99999;

//  Error
// iphone.color = "White";


// type Iphone = {
//     model: string;
//     price: number;
//     color: string;
//     storage: number;
// };

// type IphoneBasicInfo = Pick<Iphone, "model" | "price">;

// const iphone18: IphoneBasicInfo = {
//     model: "iPhone 17 Pro",
//     price: 129999
// };

// console.log(iphone18);


// type Iphone = {
//     model: string;
//     price: number;
//     color: string;
//     storage: number;
// };

// type IphoneWithoutPrice = Omit<Iphone, "price">;

// const iphone18: IphoneWithoutPrice = {
//     model: "iPhone 17 Pro",
//     color: "Black",
//     storage: 256
// };

// console.log(iphone18);


type IphonePrices = Record<string, number>;

const prices: IphonePrices = {
    iphone17: 79999,
    iphone17Pro: 129999,
    iphone17ProMax: 149999
};

console.log(prices);
console.log(prices.iphone17Pro);





