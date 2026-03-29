import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Themeselector } from "../components/themeselector/themeselector";

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, Themeselector],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private router = inject(Router);

  goToHome(){
    this.router.navigate(['']);
  }

  goToClubsList(){
    this.router.navigate(['/clubs-list']);
  }

  goToSignUp(){
    this.router.navigate(['/sign-up']);
  }

}
