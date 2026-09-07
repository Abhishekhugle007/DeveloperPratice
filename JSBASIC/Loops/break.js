
let i = 1;
while (i <= 10) {
    if (i %  6 == 0) { // Check divisibility by 7
        i++;
        break;          // Exit the loop when i is divisible by 7
    }
    console.log(i);    // Print the current value of i
    i++;               // Increment i by 1
}
console.log("end"); 
