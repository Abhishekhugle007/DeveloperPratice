namespace Iphone {

    export const model = "iPhone 17 Pro";
    export const price = 129999;

    export function showDetails() {
        console.log("Model:", model);
        console.log("Price:", price);
    }
}

console.log(Iphone.model);
console.log(Iphone.price);

Iphone.showDetails();


namespace Company {

    export namespace HR {
        export function getEmployee() {
            console.log("HR Employee");
        }
    }

    export namespace IT {
        export function getDeveloper() {
            console.log("IT Developer");
        }
    }
}

Company.HR.getEmployee();
Company.IT.getDeveloper();
