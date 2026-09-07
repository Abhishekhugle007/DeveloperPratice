let arr1 =[];// empty array
let arr2=["Abhishekh",true, 10,-1,null,"stop"];
console.log(arr1,arr2);

let arr3 =new Array(10,20,30);
console.log(arr3);

let arr4 = new Array(3);// filled with undefined
console.log(arr4);

let arr5 = new Array(4).fill(-1); // filled with -1
console.log(arr5);



console.log(arr2[3]);// access element at an index

//we can update it aslo
arr2[3] =100;
console.log(arr2);

arr2[10]="js";
console.log(arr2);