import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { NotificationIcon } from '../components/notification-icon/notification-icon';
import { UserMenu } from '../components/user-menu/user-menu';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, NotificationIcon, UserMenu],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly me = this.authService.me;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly displayName = computed(() => this.me()?.name?.trim() || 'Minha conta');
  readonly inlineLinksClass = computed(() =>
    this.isAuthenticated()
      ? 'hidden min-[400px]:flex lg:hidden'
      : 'hidden min-[355px]:flex lg:hidden',
  );

  readonly hamburgerClass = computed(() =>
    this.isAuthenticated() ? 'min-[400px]:hidden' : 'min-[355px]:hidden',
  );
  goToHome() {
    void this.router.navigate(['']);
  }

  goToClubsList() {
    void this.router.navigate(['/clubs']);
  }

  goToCourtsList() {
    void this.router.navigate(['/courts']);
  }

  goToSignUp() {
    void this.router.navigate(['/sign-up']);
  }
}
