import { User } from "./User.js";
export class Employee extends User {
    constructor(name, email, company) {
        super(name, email);
        this.company = company;
    }
    work() {
        console.log(this.name, "is working at", this.company);
    }
}
