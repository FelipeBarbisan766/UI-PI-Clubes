import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { ServiceClub } from '../clubs/services/service-club';
import { ResponseClubDTO } from '../clubs/models/model-club';
import { SearchHome } from '../../shared/components/search-home/search-home';
import { AuthService } from '../../core/services/auth-service'; // Ajuste o caminho conforme seu projeto

@Component({
  selector: 'app-home-page',
  imports: [NgOptimizedImage, RouterLink, SearchHome],
  templateUrl: './home-page.html',
  // NOTA: standalone: true é o padrão no Angular v20+, então não o declaramos.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly clubService = inject(ServiceClub);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly destroyRef  = inject(DestroyRef);

  readonly isLoggedIn = this.authService.isAuthenticated; 
  
  readonly userName = computed(() => {
    const user = this.authService.me();
    return user ? (user as any).name : 'Jogador'; 
  });

  readonly detectedCity  = signal<string | null>(null);
  readonly localClubs    = signal<ResponseClubDTO[]>([]);
  readonly featuredClubs = signal<ResponseClubDTO[]>([]);

  ngOnInit(): void {
    this.authService.resolveSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.initAuthenticatedArea();
        }
      });

    this.loadFeaturedClubs();
  }

  private initAuthenticatedArea(): void {
    this.resolveInitialCity().then(city => {
      if (city) {
        this.detectedCity.set(city);
        this.loadLocalClubs(city);
      }
    });
  }

  private loadFeaturedClubs(): void {
    this.clubService.getAll({ pageSize: 3 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(response => {
        this.featuredClubs.set(response.data || response as any); 
      });
  }

  private loadLocalClubs(city: string): void {
    this.clubService.getAll({ city, pageSize: 4 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(response => {
        this.localClubs.set(response.data || response as any);
      });
  }

  // --- Funções Auxiliares para o Template ---
  
  getCoverImage(club: ResponseClubDTO): string {
    return club.imagesUrls && club.imagesUrls.length > 0 
      ? club.imagesUrls[0] 
      : 'assets/placeholder-club.jpg'; // Substitua pelo caminho do seu placeholder padrão
  }

  formatLocation(club: ResponseClubDTO): string {
    return `${club.city}, ${club.state}`;
  }

  // --- Lógica de Geolocalização ---

  private resolveInitialCity(): Promise<string | null> {
    return new Promise(resolve => {
      if (!navigator?.geolocation) return resolve(null);

      const timer = setTimeout(() => resolve(null), 4000);

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          clearTimeout(timer);
          try {
            const city = await this.reverseGeocode(coords.latitude, coords.longitude);
            resolve(city);
          } catch {
            resolve(null);
          }
        },
        () => { clearTimeout(timer); resolve(null); },
        { timeout: 4000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'CluberaApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.city ?? data.address?.town ?? data.address?.municipality ?? data.address?.village ?? null;
  }

  goTo(): void {
    this.router.navigate(['/register-club']);
  }
}