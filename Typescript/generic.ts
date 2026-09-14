function fruits<T>(name: T): T {
    return name;
}

// TypeScript automatically understands the type
let onlyFruit = fruits("apple");
let onlyNum = fruits(100);
let onlyBoolean = fruits(true);

console.log(onlyFruit);    // apple
console.log(onlyNum);      // 100
console.log(onlyBoolean);  // true

// We can also explicitly specify the type
let fruit = fruits<string>("mango");
//let num = fruits<number>(500);
let bool = fruits<boolean>(false);

console.log(fruit); // mango
console.log(num);   // 500
console.log(bool);  // false
