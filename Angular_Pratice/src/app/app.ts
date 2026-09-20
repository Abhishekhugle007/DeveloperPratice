import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component,computed, signal, Type,effect, inject, NgModule } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Card } from './card/card';
import { Button } from './button/button';
import { email, form, FORM_FIELD, FormField, isFieldTree } from '@angular/forms/signals';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header-component/header-component';
import { Child } from './child/child';
import { Form } from '@angular/forms';
import { User } from './user';

import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from './services/user-service';

//import { single } from 'rxjs';
// import { Events } from './events/events';
// import { Login } from './login/login';


// interface User{
//   name: string;
//   age:number;
// }

@Component({
  selector: 'app-root',
  imports: [],
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


  // counter: number =0;
  // handleAdd(){

  //   this.counter++;
  // }
  // handleMinus(){
  //   if(this.counter > 0){
  //   this.counter--;

  //   }
  // }
  // handleReset(){
  //   this.counter=0;
  // }
  

  // name:string = "";
  // city:string = "";
  // email:string = "";
  // updateName(val:string){
  //   this.name = val;
    
  // }
  // getEmail(val:string){
  //   this.email = val;
  // }

// isLoggedIn = false;

// marks =56;

// showBox = true;


// toggleBox(){
//    this.showBox = !this.showBox;
// }

//  age =0;
//  updateAge(val :string){
//   this.age = Number(val);
//  }


// status:string ="processing";
  
  // age:number= 0;
  // updateAge(val:string){
  //   this.age =parseInt(val);
  // }


  // section ="home";

  // value:string ='home';

  // items=['Html', 'css','javascript','Angular'];
  
  // users=[
    
  //     {name: 'Mohit', age: 24},
  //     {name: 'Jhon', age: 30},
  //     {name: 'Alie', age: 29}
    
  // ];

  // items=['Apple', 'Banana', 'Cherry', 'Date'];

  // removeItem(i:number){
  //   this.items.splice(i,1);
  // }

  // numbers=[10,20,30,40,50,22,44,7];


  // items=['Html','css','Javascript','TypeScript','Angular'];

  // numbers =[1,2,3,4,5,6,7];

  // count = signal(10); // signal created
  // val =20;
  // // count.update(c => c + 1); //Signal Update

  // increment(){
  //   this.count.update(c => c + 1);

  // }
  // decrement(){
  //   this.count.update(c => c -1);
  // }
  // reset(){
  //   this.count.set(0);
  // }

//   count =signal<number>(0);
//   name =signal<string>('Angular');
//   isAdmin =signal<boolean>(true);

//   number =signal<number[]>([1,20,30,40]);
//   user =signal<User>({
//     name:'Mogit',
//     age:24
//   })

//   directUpdate(){
//   this.number.set([100,200,300]);
// }
   
//    addNumber(){
//     this.number.update(arr => [...arr, 400]);
//    }


  // count = signal<number>(2);

  // doubleCount = computed<number>(() => this.count() * 2);

  // tripleCount = computed<number>(() => this.count() * 3);

  // increment() {
  //   this.count.set(this.count() + 1);
  // }


  // firstName =signal<string>('Mohit');
  // lastName= signal<string>('Kumar');

  // fullName = computed<string>(() =>`${this.firstName()} ${this.lastName()}`)


  // price = signal<number[]>([10,20,30,40,50]);
  // total = computed<number>(() =>{
  //   return this.price().reduce((acc, curr) => acc + curr, 0);
  // });

  // count = signal(0);
  // constructor(){
  //   effect(() =>{
  //      console.log("count value:", this.count());
       
  //   });
  // }
  //   increment(){
  //      this.count.update(c => c + 1);
  //   }


  // isDarkMode = signal(false);

  // constructor() {
  //   effect(() =>{
  //     if(this.isDarkMode()){
  //       document.body.style.backgroundColor ='black';
  //       document.body.style.color ='White'
  //     }
  //     else{
  //       document.body.style.backgroundColor ='white';
  //       document.body.style.color ='black';
  //     }
  //   });
  // }
  // toggle(){
  //   this.isDarkMode.update(mode => !mode);
  // }
  // message =signal(" ");

  // constructor() {
  //   effect(() =>{
  //     if(this.message()){
  //       setTimeout(() =>{
  //         this.message.set("");
  //       }, 1000);
  //     }
  //   });
    
  // }

  // showMessage(){
  //   this.message.set("Hello, this is a temporary message");
  // }


  //  lName ="abhishekh"
  //  uName ="Abhishekh"

  //  today =new Date();

  //  amount =2500;

  // count =signal(0);
  // name = signal('Angular');

  // setCount(){
  //    this.count.update(c => c + 1);
  // }

  // count =signal(2);

  // doubleCount = computed(() => this.count() * 2);

  // constructor(){
  //   effect(() =>{
  //     console.log("Double Count:", this.doubleCount());
  //   })
  // }
  // increment(){
  //   this.count.update(c => c + 1);
  // }
  

  // username= 'Abhi';
  // name =signal('Mohit');
  

  // user =signal<{ name :string; age :number}>({
  //   name: 'Abhi',
  //   age: 25
  // })
  // updateName(value: string){
  //   this.user.update(user => ({
  //     ...user, name: value
  //   }));
  // }

  //   updateAge(){
  //   this.user.update(user =>({ ...user, age: user.age+1}));
    
  // }
  
  
    newTodo =signal('');
    todos =signal<{text: string; done: boolean}[]>([]);

    addTodo(){
      const text = this.newTodo().trim();
       
      if( text === ''){
        return;
      }

       this.todos.update(list => [...list,{ text, done: false }]);

       this.newTodo.set('');


    }
    toggleTodo(index: number){
      this.todos.update( list =>
        list.map(( item, i) =>
          i === index ? { ...item,done: !item.done} : item
        )
      );
    }
    deleteTodo(index : number){
      this.todos.update(list =>
        list.filter(( _, i)=> i !== index)
      );
    }
    editTodo(index: number) {
    const text = prompt('Edit todo:', this.todos()[index].text);
    if (text === null || text.trim() === '') {
    return;
  }
    this.todos.update(list =>
    list.map((item, i) => i === index ? { ...item, text: text.trim() }: item)
  );
}


  //  count =signal(0);

  //  isLoggedIn= signal(false);

  //  items=signal<string[]>(['Angular', 'ReactJs', 'Javascript']);

  //  addItem(){
  //   this.items.update(items =>[...items,"HTML"]);
    
  //  }

  //  role =signal<'admin' | 'user' >('user');

  // features =signal<string[]>([
  //   "Dashboard", "Profile", "Settings"
  // ]);
   
  // makeAdmin(){
  //   this.role.set('admin');
  //   this.features.set([
  //     "Dashborad",
  //     "Profile",
  //     "Settings",
  //     "Admin Panel",
  //     "User Mangement"
  //   ]);
  // }

  // makeUser(){
  //   this.role.set('user');
  //   this.features.set([
  //     "Dashborad",
  //     "Profile",
  //     "Settings"
  //   ]);
  // }


  // username:string ="Angular"
  
  // message:string =' ';
  // onMessage(msg:string){
  //   this.message = msg;
  // }


  // name= signal(' ');
  // email = signal(' ');

  // submitForm(){
  //    console.log(`Name: ${this.name()}, Email: ${this.email()}`);
  // }

//  userSignal = signal({
//     name: '',
//     email: ''
//   });

//   form: any;

//   constructor(private fb: FormBuilder) {
//     this.form = this.fb.group({
//       name: [''],
//       email: ['']
//     });
//     this.form.valueChanges.subscribe((value: any) =>{
//       this.userSignal.set(value);
//     });
//   }
//   submitForm(){
//     console.log(`Name: ${this.userSignal().name}, Email: ${this.userSignal().email}`);
//   }

   

// saveData(){
//   console.log("Data Fetch");
// }

// message= " ";
// onSave(msg:string){
//   console.log(msg);
//   this.message= msg;

// }
 
  

// constructor(){
//   console.log("1.Constructor");
// }

  //  title =signal("Hello from App Components");
  //  show =signal(true);

  //  changeTitle(){
  //   this.title.set("Title Changed!");
  //  }
  //  toggle(){
  //   this.show.set(!this.show);
  //  }


  // loginModel =signal({
  //   email: '',
  //   password: ''
  // })
  // loginForm =form(this.loginModel)

  // submit(){
  //   console.log(this.loginModel)
  // }


  // users: any[] = [];

  // constructor(private userService: User) {}

  // ngOnInit(): void {
  //   this.userService.getUsers().subscribe((data: any) => {
  //     this.users = data;
  //   });
  // }

  // userService = inject(UserService);

  // users = toSignal<User[]>(this.userService.getUsers())

  // name=signal('Abhishekj');
  // submitForm(){
  //   alert(`user ${this.name()} saved successfully`);
  // }
   
   

  // selectorColor=signal('#3498db');
  // onColorChange(newColor: string){
  //  this.selectorColor.set(newColor);
  // }
  // copyColor(){
  //   navigator.clipboard.writeText(this.selectorColor());
  // }

}
