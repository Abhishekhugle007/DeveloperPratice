import { Component } from '@angular/core';


@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  imageUrl ="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuPBe0ZWpJo5Tsy_3O_MqbzG0okzPiG35X-emWHCnaXaeP6-huw9WfCmg&s=10"
  isDisabled =false;
  userName="Mohit"
  isActive=true;
  boxWidth=100;
  bgColor='red';
}


