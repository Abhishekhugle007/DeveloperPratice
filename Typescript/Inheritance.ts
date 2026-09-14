// class User {
//   constructor(
//     public name: string,
//     public email: string
//   ) {}

//   login(): void {
//     console.log(this.name, "logged in");
//   }
// }

// class Employee extends User {
//   constructor(
//     name: string,
//     email: string,
//     public company: string
//   ) {
//     super(name, email);
//   }

//   work(): void {
//     console.log(this.name, "is working at", this.company);
//   }
//   showEmail(): void {
//     console.log("Email:", this.email);
//   }
// }

// const employee = new Employee(
//   "Abhi",
//   "abhi@gmail.com",
//   "ABC Company"
// );

// employee.login();
// employee.work();
// employee.showEmail();
