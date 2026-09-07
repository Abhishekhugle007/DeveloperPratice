function Sum(...TheArgs) {
    let total = 0;

    for (const arg of TheArgs) {
        total += arg;
    }

    return total;
}

console.log(Sum(1, 2, 3));
console.log(Sum(1, 2, 3, 4));
