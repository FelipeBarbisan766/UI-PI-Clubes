import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { UserMenu } from '../components/user-menu/user-menu';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, UserMenu],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  goToHome(): void {
    void this.router.navigate(['']);
  }

  goToClubsList(): void {
    void this.router.navigate(['/clubs']);
  }

  goToCourtsList(): void {
    void this.router.navigate(['/courts']);
  }

  goToSignUp(): void {
    void this.router.navigate(['/sign-up']);
  }
}