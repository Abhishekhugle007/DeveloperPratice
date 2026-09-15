import { Component, signal } from '@angular/core';
// import { Events } from './events/events';
// import { Login } from './login/login';




@Component({
   selector: 'app-root',
   //imports:[Events,Login],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // protected readonly title = signal('Angular_Pratice');
  // //name='Angular'
  // username="mohit kumar"
  // isAdmin=true;

  // count =5;
  // price=1333;
  // isLogin = true;
  

  // getUser(){
  //   return "Abhishekh";
  // }
   
  
  // // handleClick(){
  // //   let abc='Hii Abhishekh';
  // //   console.log("Button Clicked",abc);
  // //   this.helloWorld();
  // // }
  // helloWorld(){
  //  console.log("Hello World");
   
  // }
  // name:string="Abhi";
  // value =10;
  // value1="Mohit";


  // handleClick(){
  //  console.log('Button Clicked');
  // }

  // onTyping(event:any){
  //   console.log("typed",event.target.value);
  // }
  // onKeyUp(event: any){
  //   console.log("Key Up Event", event.key);
  // }

  // onHover(){
  //   console.log("Hover Event");
  // }

  // onLeave(){
  //   console.log("Leave Event");
  // }
  // onBlur(){
  //   console.log("Blur Event");
  // }
  // onFocus(){
  //   console.log("Focus Event");
  // }


  counter: number =0;
  handleAdd(){

    this.counter++;
  }
  handleMinus(){
    if(this.counter > 0){
    this.counter--;

    }
  }
  handleReset(){
    this.counter=0;
  }
  
}
