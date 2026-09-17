import { Component, Input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-child',
  styleUrl: './child.css',
  templateUrl: './child.html',
})
export class Child {
  @Input() title!:string;
  constructor(){
    console.log("1")
  }
}
