function hello(x) {
    if (x % 2 == 0) {   // if x is even
        var ans = x * 2;
    } else {            // if x is odd
        var ans = x * 3;
    }
    return ans;
}

console.log(hello(4)); // Output: 8
console.log(hello(5)); // Output: 15
