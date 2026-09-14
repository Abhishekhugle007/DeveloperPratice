/* String */

let name1: string = "Abhishekh";
console.log(name1);


/*number */

let age: number = 25;
let price: number = 99.99;
console.log(age, price);

/* boolean – true or false */

let isActive: boolean = true;
console.log(isActive);

/* symbol – unique values */

let id: symbol = Symbol("id");
console.log(id);

/* null – intentional absence of a value */

// let data: null = null;
// console.log(data);

/* undefined – value has not been assigned */

let value: undefined = undefined;
console.log(value);

var oct:number =0o100001;
var hexa:number=0b00001;
console.log(oct+10);

/* string converted */
var item:number =100;
var item2 ="50";
// var item2Converted =Number(item2)
// console.log(item+item2Converted);

var item2Converted =+item2;
console.log(item+ +item2Converted);


/* Types inference With Number */

var data: number | string = 30;
data = "Abhi";
console.log(data);


