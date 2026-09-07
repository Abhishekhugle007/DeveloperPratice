const o1 = { a: 1, b: 2 };
const o2 = { c: 3, d: 4 };
const o3 = { e: 5 };

const result = { ...o1, ...o2, ...o3 };


const clone = { ...result };

console.log(clone); // clone spread
console.log(typeof result); // "object"
console.log(typeof clone);  // "object"

console.log(clone === result); // false ,  contents are the same, but the objects are different.


