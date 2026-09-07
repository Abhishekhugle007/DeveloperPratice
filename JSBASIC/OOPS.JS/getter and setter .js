class CreateUser {
    constructor(firstName, lastName, age) { // Fixed constructor name
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
    }
    
    getBirthYear() {
        return new Date().getFullYear() - this.age;
    }
    
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    
    set fullName(value) {
        const [firstName, lastName] = value.split(' '); // Fixed splitting
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

const user1 = new CreateUser('Ugale', 'Abhi', 24);
const user2 = new CreateUser('Etech', 'Developer', 32);

console.log(user1.fullName ); // John Doe
console.log(user2.fullName); // Jane Doe
console.log(user1.age);//24
console.log(user2.age);//32
console.log(user1.getBirthYear()); // 1993 (if current year is 2025)
console.log(user2.getBirthYear()); // 1988 (if current year is 2025)
