import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Themeselector } from '../components/themeselector/themeselector';
import { AuthService } from '../../core/services/auth-service';
import { take } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, Themeselector],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly me = this.authService.me;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly displayName = computed(() => this.me()?.name?.trim() || 'Minha conta');

  goToHome() {
    void this.router.navigate(['']);
  }

  goToClubsList() {
    void this.router.navigate(['/clubs-list']);
  }

  goToSignUp() {
    void this.router.navigate(['/sign-up']);
  }

  onLogout(): void {
    this.authService.logout().pipe(take(1)).subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}