"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
class user {
    name;
    email;
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
    login() {
        console.log(this.name, "logged in");
    }
}
exports.user = user;
