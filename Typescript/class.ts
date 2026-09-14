class Student {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  display(): void {
    console.log("Name:", this.name);
    console.log("Age:", this.age);
  }
}

const student1 = new Student("Abhi", 22);

student1.display();
