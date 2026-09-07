// logical AND operator
console.log(false&&false);
console.log(false&&true);
console.log(true&&false);
console.log(true&&true);

console.log((3<5) &&(5>7));

// logical  OR operator
console.log(false||false);
console.log(false||true);
console.log(true||false);
console.log(true||true);

console.log((3<5)||(5>7));

// logical NOT operator
console.log(!true);//false
console.log(!false);//true

// logical NULLISH
let x=null ?? 90;//Since null is on the left side, the right-hand value 90 is used.
console.log(x);

let a=undefined ?? 90;//Since undefined is on the left side, the right-hand value 90 is used.
console.log(a);

let b=100 ?? 90;//Since 100 is not null or undefined, the left-hand operand (100) is used.
console.log(b);

let c="abhi" ?? 90;
console.log(c);



