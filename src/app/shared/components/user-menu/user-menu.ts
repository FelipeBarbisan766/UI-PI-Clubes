import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { UserConfigService } from '../../../features/user/services/service-user';
import { ThemeService } from '../themeselector/theme-service';

interface ThemeColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  private readonly configService = inject(UserConfigService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly themeService = inject(ThemeService);

  readonly user = this.configService.user;
  readonly me = this.authService.me;
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly displayName = computed(() => this.me()?.name?.trim() || 'Minha conta');
  readonly initials = computed(() =>
    this.displayName()
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
  );

  readonly isAdmin = computed(() => {
    const role = this.me()?.role?.trim().toLowerCase();
    return role === 'admin';
  });

  onLogout(): void {
    this.authService.logout().pipe(take(1)).subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  goToAccount(): void {
    void this.router.navigate(['/user-config']);
  }

  goToReserves(): void {
    void this.router.navigate(['/user-reserves']);
  }

  goToAdmin(): void {
    void this.router.navigate(['/admin/clubs']);
  }

}