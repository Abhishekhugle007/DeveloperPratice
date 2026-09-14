
/* Any 
  if you use any  = "I don't care about the type."
  don`t mentioned the types


*/

// let value: any = 10;

// console.log(value);

// value = "Hello";
// console.log(value);

// value = true;
// console.log(value);


/* unknown
unknown also means the value can be any type, but it is safer than any

*/


// let value: unknown = "Hello";

// console.log(value);


//  assign different types:

// let value: unknown = 100;

// value = "Hello";
// value = true;

// console.log(value);



/*  But you cannot directly use an unknown value as a specific type first we need to check the types */
let value: unknown = "Hello";

//console.log(value.toUpperCase()); // Error 



// let value: unknown = "Hello";

// if (typeof value === "string") {
//   console.log(value.toUpperCase());
// }


/* void
void is mainly used for a function that doesn't return a value. */

function greet(): void {
  console.log("Hello");
}

greet();

/* never
never means the function never successfully finishes/returns a value. */

// function errorMessage(): never {
//   throw new Error("Something went wrong!");
// }

// errorMessage();

function infiniteLoop(): never {
  while (true) {
    console.log("Running...");
  }
}







