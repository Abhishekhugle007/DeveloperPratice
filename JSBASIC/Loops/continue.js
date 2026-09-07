let i = 1;
    while (i <= 10) {
        if (i % 7 == 0) { // Number 7 is skipped because it is divisible by 7.
            i++;
            continue;
        }
        console.log(i);
        i ++;
    }

