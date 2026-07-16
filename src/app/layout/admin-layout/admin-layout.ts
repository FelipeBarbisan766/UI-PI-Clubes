import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { BreadCrumb } from "../../shared/components/bread-crumb/bread-crumb";
import { AuthService } from '../../core/services/auth-service';
import { take } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BreadCrumb,NgOptimizedImage],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  private currentClubId: string = '';

  readonly clubName = input('');
  readonly clubCity = input('');

  private readonly me = this.authService.me;
  readonly avatarUrl = computed(() => this.me()?.avatarUrl);
  readonly displayName = computed(() => this.me()?.name?.trim() || 'Usuário');
  readonly initials = computed(() => {
    const name = this.me()?.name?.trim();
    if (!name) {
      return 'U';
    }
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
  



  ngOnInit(): void {
    this.currentClubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';
  }

  isActive(section: string): boolean {
    return this.router.url.includes(section);
  }


  goToOverview(): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'overview']);
  }

  goToCourts(): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'courts']);
  }

  goToReserves(): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'reserves']);
  }

  goToConfig(): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'config']);
  }

  goToSwitchClub(): void {
    this.router.navigate(['/admin/clubs']);
  }

  logout(): void {
    this.authService.logout().pipe(take(1)).subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: () => void this.router.navigateByUrl('/login'),
    });
  }

  closeDrawerOnMobile(): void {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    const el = document.getElementById('admin-drawer') as HTMLInputElement | null;
    if (el) el.checked = false;
  }
}