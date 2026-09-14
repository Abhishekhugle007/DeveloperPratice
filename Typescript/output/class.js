"use strict";
class Student {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    display() {
        console.log("Name:", this.name);
        console.log("Age:", this.age);
    }
}
const student1 = new Student("Abhi", 22);
student1.display();
