"use strict";
function getName() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Abhi");
        }, 2000);
    });
}
async function main() {
    const name = await getName();
    console.log(name);
}
main();
