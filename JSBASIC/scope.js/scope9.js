function hello(x) {
    let ans; // Initialize variable undefined
    if (x % 2 == 0) { // Check if x is even
        ans = x * 2; // Double the value
    } else { // If x is odd
        ans = x * 3; // Triple the value
    }
    return ans; // Return the result
}

// Example usage
console.log(hello(4)); // Output: 8
console.log(hello(5)); // Output: 15
