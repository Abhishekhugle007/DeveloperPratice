"use strict";
class Employee {
    constructor(name, salary, department) {
        this.name = name;
        this.salary = salary;
        this.department = department;
    }
    showDetails() {
        console.log(this.name); //  public
        console.log(this.salary); //  private
        console.log(this.department); //  protected
    }
}
class Manager extends Employee {
    showManagerDetails() {
        console.log(this.name); //  public
        // console.log(this.salary);  //  private
        console.log(this.department); //  protected
    }
}
const manager = new Manager("Abhi", 50000, "IT");
console.log(manager.name);
// console.log(manager.salary);     
// console.log(manager.department); 
