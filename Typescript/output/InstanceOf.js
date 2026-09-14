"use strict";
class Person {
    constructor(name) {
        this.name = name;
    }
}
const person1 = new Person("Abhi");
console.log(person instanceof Person);
