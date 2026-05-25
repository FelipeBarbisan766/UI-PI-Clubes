import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { BreadCrumb } from "../../shared/components/bread-crumb/bread-crumb";
import { clubNameResolver } from '../../shared/components/resolvers/club-name.resolver';


@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BreadCrumb],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); 

 private currentClubId: string = '';

ngOnInit(): void {
    this.currentClubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';
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

  closeDrawerOnMobile(): void {
  if (window.matchMedia('(min-width: 1024px)').matches) return;

  const el = document.getElementById('admin-drawer') as HTMLInputElement | null;
  if (el) el.checked = false;
}

  

}
