class Employee {
  public name: string;
  private salary: number;
  protected department: string;

  constructor(
    name: string,
    salary: number,
    department: string
  ) {
    this.name = name;
    this.salary = salary;
    this.department = department;
  }

  showDetails(): void {
    console.log(this.name);       //  public
    console.log(this.salary);     //  private
    console.log(this.department); //  protected
  }
}

class Manager extends Employee {

  showManagerDetails(): void {
    console.log(this.name);       //  public
    // console.log(this.salary);  //  private
    console.log(this.department); //  protected
  }
}

const manager = new Manager(
  "Abhi",
  50000,
  "IT"
);

console.log(manager.name); 
// console.log(manager.salary);     
// console.log(manager.department); 
