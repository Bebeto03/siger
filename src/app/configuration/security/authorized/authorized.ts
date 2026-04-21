import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-authorized',
  standalone: true,
  imports: [],
  template: ''
})
export class Authorized implements OnInit {
  private router = inject(Router);
  ngOnInit(): void { this.router.navigate(['/']); }
}