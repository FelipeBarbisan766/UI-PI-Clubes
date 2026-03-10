import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private router = inject(Router);

  goToHome(){
    this.router.navigate(['']);
  }

  goToClubs(){
    this.router.navigate(['/clubs']);
  }

}
