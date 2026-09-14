let data: unknown = "Hello";

if (typeof data === "string") {
  console.log(data.toUpperCase()); 
}

function printValue(value: unknown) {
  if (typeof value === "string") {
    console.log("String:", value);
  } else if (typeof value === "number") {
    console.log("Number:", value);
  } else {
    console.log("Unknown type");
  }
}

printValue("John");
printValue(25);
printValue(true);

let a: any = "Hello";
console.log(a.toUpperCase()); // 

let b: unknown = "Hello";

// console.log(b.toUpperCase()); // error
if (typeof b === "string") {
  console.log(b.toUpperCase()); // 
}
