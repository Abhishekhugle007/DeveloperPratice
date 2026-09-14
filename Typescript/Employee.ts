import { User } from "./User.js";

export class Employee extends User {

  constructor(
    name: string,
    email: string,
    public company: string
  ) {
    super(name, email);
  }

  work(): void {
    console.log(
      this.name,
      "is working at",
      this.company
    );
  }
}
