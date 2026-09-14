import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { debounceTime, skip, switchMap, take } from 'rxjs';
import { ServiceClub } from '../services/service-club';
import { ClubQueryDTO, ResponseClubDTO } from '../models/model-club';
import { ImageCarousel } from '../../../shared/components/image-carousel/image-carousel';
import { SearchFilters } from '../../../shared/components/search-filters/search-filters';
import { NgClass } from '@angular/common';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-clubs-list',
  imports: [ImageCarousel, SearchFilters, NgClass],
  templateUrl: './clubs-list.html',
  styleUrl: './clubs-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsList {
  private readonly clubService = inject(ServiceClub);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly clubs = this.clubService.clubs;
  readonly loading = this.clubService.loading;
  readonly error = this.clubService.error;
  readonly isEmpty = this.clubService.isEmpty;
  readonly clubsCount = this.clubService.clubsCount;
  readonly totalPages = this.clubService.totalPages;

  readonly isMobileFilterOpen = signal(false);

  readonly searchTerm = signal('');
  readonly cityFilter = signal('');
  readonly selectedSportIds = signal<string[]>([]);
  readonly currentPage = signal(1);

  readonly detectedCity = signal<string | null>(null);

  private readonly query = computed<ClubQueryDTO>(() => ({
    name: this.searchTerm() || undefined,
    city: this.cityFilter() || undefined,
    sportIds: this.selectedSportIds().length > 0 ? this.selectedSportIds() : undefined,
    page: this.currentPage(),
    pageSize: PAGE_SIZE,
  }));

  readonly visiblePages = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const around = new Set(
      [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total),
    );
    const sorted = [...around].sort((a, b) => a - b);
    const result: (number | '...')[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
      result.push(sorted[i]);
    }
    return result;
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        skip(1),
        debounceTime(400),
        switchMap((query) => this.clubService.getAll(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.clubService
      .getAll(this.query())
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.resolveInitialCity().then((city) => {
      if (!city) return;
      this.cityFilter.set(city);
      this.detectedCity.set(city);
    });
  }

  private resolveInitialCity(): Promise<string | null> {
    return new Promise((resolve) => {
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
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { timeout: 4000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'SeuAppNome/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.city ??
      data.address?.town ??
      data.address?.municipality ??
      data.address?.village ??
      null
    );
  }

  clearDetectedCity(): void {
    this.detectedCity.set(null);
    this.cityFilter.set('');
    this.currentPage.set(1);
  }

  // --- Handlers de filtro ---

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onCityChange(value: string): void {
    this.cityFilter.set(value);
    this.detectedCity.set(null);
    this.currentPage.set(1);
  }

  toggleSport(id: string): void {
    const current = this.selectedSportIds();
    this.selectedSportIds.set(
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
    this.currentPage.set(1);
  }

  clearSports(): void {
    this.selectedSportIds.set([]);
    this.currentPage.set(1);
  }

  goToPage(page: number | '...'): void {
    if (typeof page !== 'number') return;
    const total = this.totalPages();
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
  }

  selectClub(club: ResponseClubDTO): void {
    this.router.navigate(['/clubs', club.id]);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  clearError(): void {
    this.clubService.clearError();
  }
}
