"use strict";
/* String */
let name1 = "Abhishekh";
console.log(name1);
/*number */
let age = 25;
let price = 99.99;
console.log(age, price);
/* boolean – true or false */
let isActive = true;
console.log(isActive);
/* symbol – unique values */
let id = Symbol("id");
console.log(id);
/* null – intentional absence of a value */
// let data: null = null;
// console.log(data);
/* undefined – value has not been assigned */
let value = undefined;
console.log(value);
var oct = 0o100001;
var hexa = 0b00001;
console.log(oct + 10);
/* string converted */
var item = 100;
var item2 = "50";
// var item2Converted =Number(item2)
// console.log(item+item2Converted);
var item2Converted = +item2;
console.log(item + +item2Converted);
/* Types inference With Number */
var data = 30;
data = "Abhi";
console.log(data);
