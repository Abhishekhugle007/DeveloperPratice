import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-comp',
  standalone: true, // If using Angular 14+ standalone components
  imports: [],
  styleUrl: './product-comp.css',
  templateUrl: './product-comp.html',
})
export class ProductComp implements OnInit {
  productId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
   
    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id') || '';
    });
  }
}
