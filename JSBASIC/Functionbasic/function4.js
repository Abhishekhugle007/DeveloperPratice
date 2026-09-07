function isEvenOrOdd(x){
    if(x%2==0){
        // if x is divisible by 2
        return "even"
    } else{
        return "odd";
    }
}

const ans =isEvenOrOdd(10);
console.log(ans);