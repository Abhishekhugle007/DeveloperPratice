class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

const person1 = new Person("Abhi");

console.log(person instanceof Person); 