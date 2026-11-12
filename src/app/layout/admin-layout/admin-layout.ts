import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { BreadCrumb } from '../../shared/components/bread-crumb/bread-crumb';
import { ServiceClub } from '../../features/admin/services/service-club';  // ajuste o caminho

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BreadCrumb],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly clubService = inject(ServiceClub);

  private readonly currentClubId =
    this.route.snapshot.paramMap.get('clubId') ??
    this.route.parent?.snapshot.paramMap.get('clubId') ??
    '';

  readonly clubName = computed(() => this.clubService.selectedClub()?.name ?? '');
  readonly clubCity = computed(() => this.clubService.selectedClub()?.city ?? '');

  constructor() {
    // Garante que o clube selecionado é o da rota (e carrega se abriu a URL direto).
    // Depois disso, qualquer update() no ServiceClub atualiza sidebar e header sozinho.
    if (this.currentClubId) {
      this.clubService.getById(this.currentClubId).subscribe({ error: () => {} });
    }
  }

  isActive(section: string): boolean {
    return this.router.url.includes(section);
  }

  goToOverview(): void {
    void this.router.navigate(['/admin/club', this.currentClubId, 'dashboard']);
  }

  goToCourts(): void {
    void this.router.navigate(['/admin/club', this.currentClubId, 'courts']);
  }

  goToReserves(): void {
    void this.router.navigate(['/admin/club', this.currentClubId, 'reserves']);
  }

  goToConfig(): void {
    void this.router.navigate(['/admin/club', this.currentClubId, 'config']);
  }

  goToSwitchClub(): void {
    void this.router.navigate(['/admin/clubs']);
  }

  closeDrawerOnMobile(): void {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    const el = document.getElementById('admin-drawer') as HTMLInputElement | null;
    if (el) el.checked = false;
  }
}