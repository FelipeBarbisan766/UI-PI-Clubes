import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Themeselector } from "../components/themeselector/themeselector";
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, Themeselector],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private router = inject(Router);

  private readonly authService = inject(AuthService);

  readonly me = this.authService.me;
  readonly isAuthenticated = computed(() => this.authService.authStatus() === 'authenticated');
  readonly displayName = computed(() => this.me()?.name?.trim() || 'Minha conta');

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
