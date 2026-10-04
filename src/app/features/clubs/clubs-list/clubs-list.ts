import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, from, map, of, switchMap, tap, timer } from 'rxjs';
import { ServiceClub } from '../services/service-club';
import { ClubQueryDTO, ResponseClubDTO } from '../models/model-club';
import { ImageCarousel } from '../../../shared/components/image-carousel/image-carousel';
import { SearchFilters } from '../../../shared/components/search-filters/search-filters';
import { NgClass } from '@angular/common';
import { ServiceGeolocation } from '../../../core/services/service-geolocation';

const PAGE_SIZE = 10;

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

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
  private readonly route = inject(ActivatedRoute);
  private readonly geo = inject(ServiceGeolocation);

  readonly clubs = this.clubService.clubs;
  readonly loading = this.clubService.loading;
  readonly error = this.clubService.error;
  readonly isEmpty = this.clubService.isEmpty;
  readonly clubsCount = this.clubService.clubsCount;
  readonly totalPages = this.clubService.totalPages;
  private readonly urlParams = this.route.snapshot.queryParamMap;

  readonly searchTerm = signal(this.urlParams.get('name') ?? '');
  readonly cityFilter = signal(this.urlParams.get('city') ?? '');
  readonly selectedSportIds = signal<string[]>(this.urlParams.getAll('sports'));
  readonly currentPage = signal(parsePage(this.urlParams.get('page')));
  readonly detectedCity = signal<string | null>(null);
  readonly suggestedCity = signal<string | null>(null);

  readonly isMobileFilterOpen = signal(false);

  readonly starIndexes = [0, 1, 2, 3, 4] as const;

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
        switchMap((query, index) => (index === 0 ? of(query) : timer(400).pipe(map(() => query)))),
        tap((query) => this.syncUrl(query)),
        switchMap((query) => this.clubService.getAll(query).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    void this.loadCitySuggestion();
  }

  private async loadCitySuggestion(): Promise<void> {
    if (this.cityFilter()) return; 
    if ((await this.geo.getPermissionState()) === 'denied') return;

    const city = await this.geo.resolveCity();
    if (city && !this.cityFilter()) this.suggestedCity.set(city);
  }

  acceptSuggestedCity(): void {
    const city = this.suggestedCity();
    if (!city) return;
    this.cityFilter.set(city);
    this.detectedCity.set(city);
    this.suggestedCity.set(null);
    this.currentPage.set(1);
  }

  dismissSuggestedCity(): void {
    this.suggestedCity.set(null);
  }

  clearDetectedCity(): void {
    this.detectedCity.set(null);
    this.cityFilter.set('');
    this.currentPage.set(1);
  }
  private syncUrl(query: ClubQueryDTO): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        name: query.name ?? null,
        city: query.city ?? null,
        sports: query.sportIds ?? null,
        page: query.page && query.page > 1 ? query.page : null,
      },
      replaceUrl: true,
    });
  }
  // --- Handlers de filtro ---

  starFillPercent(rating: number | undefined | null, starIndex: number): number {
    const value = rating ?? 0;
    const diff = value - starIndex;
    if (diff >= 1) return 100;
    if (diff <= 0) return 0;
    return diff * 100;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onCityChange(value: string): void {
    this.cityFilter.set(value);
    this.detectedCity.set(null);
    this.suggestedCity.set(null);
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
