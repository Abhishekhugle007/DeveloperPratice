console.log(10 && 30);
console.log(0  && 30);
console.log(40 && null);
console.log("" && -0); 

console.log(10 || 30);
console.log(0  || 30);
console.log(40 || null);
console.log("" || -0);// Since both operands are falsy, the last operand (-0) is returned.




/*
Falsy Values

These values are considered false when evaluated in a Boolean context:

1)false
2)0 (the number zero)
3)-0 (negative zero)
4)"" (empty string)
5)null
6)undefined
7)NaN (Not-a-Number)

*/