function infiniteLoop(): never {
    while (true) {
        console.log("Running...");
    }
}
//console.log(infiniteLoop());

function errorMessage(message: string): never {
    throw new Error(message);
}

errorMessage("Something went wrong");
