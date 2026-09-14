export class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
    login() {
        console.log(this.name, "logged in");
    }
}
