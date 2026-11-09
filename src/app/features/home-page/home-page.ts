import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { ServiceClub } from '../clubs/services/service-club';
import { ResponseClubDTO } from '../clubs/models/model-club';
import { SearchHome } from '../../shared/components/search-home/search-home';
import { AuthService } from '../../core/services/auth-service';
import { ProfileAlertModal } from '../../shared/components/profile-alert-modal/profile-alert-modal';
import { ImageCarousel } from '../../shared/components/image-carousel/image-carousel'; // Ajuste o caminho conforme seu projeto
import { PlayerService } from '../../core/services/player-service';
import { SportDTO } from '../../core/models/model-sport';
import { catchError, of } from 'rxjs';
import { ServiceGeolocation } from '../../core/services/service-geolocation'; 

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProfileAlertModal, ImageCarousel],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly clubService = inject(ServiceClub);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerService = inject(PlayerService);
  private readonly geo = inject(ServiceGeolocation);

  readonly isLoggedIn = this.authService.isAuthenticated;

  readonly userName = computed(() => {
    const user = this.authService.me();
    const fullName = user ? (user as any).name?.trim() : '';

    return fullName ? fullName.split(' ')[0] : 'Jogador';
  });

  readonly starIndexes = [0, 1, 2, 3, 4] as const;

  readonly detectedCity = signal<string | null>(null);
  readonly localClubs = signal<ResponseClubDTO[]>([]);
  readonly featuredClubs = signal<ResponseClubDTO[]>([]);
  readonly recommendedSportName = signal<string | null>(null);
  
  // Opcional: caso queira usar sugestão de cidade também na Home igual à listagem
  readonly suggestedCity = signal<string | null>(null);

  ngOnInit(): void {
    this.authService
      .resolveSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.initAuthenticatedArea();
          this.loadRecommendedClubs();
        } else {
          this.loadFeaturedClubs();
        }
      });
  }

  private async initAuthenticatedArea(): Promise<void> {
    if ((await this.geo.getPermissionState()) === 'denied') return;

    const city = await this.geo.resolveCity();
    if (city) {
      this.detectedCity.set(city);
      this.loadLocalClubs(city);
    }
  }

  private loadRecommendedClubs(): void {
    this.playerService
      .getFavoriteSports()
      .pipe(
        catchError(() => of([] as SportDTO[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((sports) => {
        if (sports.length === 0) {
          this.recommendedSportName.set(null);
          this.loadFeaturedClubs();
          return;
        }

        this.tryLoadBySport(this.shuffle(sports), 0);
      });
  }

  private tryLoadBySport(sports: SportDTO[], index: number): void {
    if (index >= sports.length) {
      this.recommendedSportName.set(null);
      this.loadFeaturedClubs();
      return;
    }

    const sport = sports[index];

    this.clubService
      .getAll({ pageSize: 3, sportIds: [sport.id] })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        const clubs = response.data ?? (response as any);

        if (clubs.length > 0) {
          this.recommendedSportName.set(sport.name);
          this.featuredClubs.set(clubs);
        } else {
          this.tryLoadBySport(sports, index + 1);
        }
      });
  }

  private loadFeaturedClubs(): void {
    this.clubService
      .getAll({ pageSize: 3 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.featuredClubs.set(response.data || (response as any));
      });
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private loadLocalClubs(city: string): void {
    this.clubService
      .getAll({ city, pageSize: 4 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.localClubs.set(response.data || (response as any));
      });
  }

  // --- Funções Auxiliares para o Template ---

  starFillPercent(rating: number | undefined | null, starIndex: number): number {
    const value = rating ?? 0;
    const diff = value - starIndex;
    if (diff >= 1) return 100;
    if (diff <= 0) return 0;
    return diff * 100;
  }

  getCoverImage(club: ResponseClubDTO): string {
    return club.images && club.images.length > 0
      ? club.images[0].thumbUrl
      : 'assets/placeholder-club.jpg';
  }

  formatLocation(club: ResponseClubDTO): string {
    return `${club.city}, ${club.state}`;
  }

  goToRegister(): void {
    this.router.navigate(['/register-club']);
  }
}