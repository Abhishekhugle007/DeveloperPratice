export class User {
  constructor(
    public name: string,
    public email: string
  ) {}

  login(): void {
    console.log(this.name, "logged in");
  }
}
