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
import { NgClass } from '@angular/common';
import { catchError, EMPTY, map, of, switchMap, tap, timer } from 'rxjs';
import { ServiceCourt } from '../services/service-court';
import { CourtQueryDTO, ResponseCourtDTO } from '../models/model-court';
import { ImageCarousel } from '../../../shared/components/image-carousel/image-carousel';
import { SearchFilters } from '../../../shared/components/search-filters/search-filters';
import { ServiceGeolocation } from '../../../core/services/service-geolocation';

const PAGE_SIZE = 10;

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

@Component({
  selector: 'app-courts-list',
  imports: [ImageCarousel, SearchFilters, NgClass],
  templateUrl: './courts-list.html',
  styleUrl: './courts-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourtsList {
  private readonly courtService = inject(ServiceCourt);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly geo = inject(ServiceGeolocation);
  private readonly urlParams = this.route.snapshot.queryParamMap;

  readonly courts = this.courtService.courts;
  readonly loading = this.courtService.loading;
  readonly error = this.courtService.error;
  readonly isEmpty = this.courtService.isEmpty;
  readonly courtsCount = this.courtService.courtsCount;
  readonly totalPages = this.courtService.totalPages;

  readonly searchTerm = signal(this.urlParams.get('name') ?? '');
  readonly cityFilter = signal(this.urlParams.get('city') ?? '');
  readonly selectedSportIds = signal<string[]>(this.urlParams.getAll('sports'));
  readonly currentPage = signal(parsePage(this.urlParams.get('page')));

  readonly detectedCity = signal<string | null>(null);
  readonly suggestedCity = signal<string | null>(null);
  readonly isMobileFilterOpen = signal(false);

  private readonly query = computed<CourtQueryDTO>(() => ({
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
        switchMap((query) => this.courtService.getAll(query).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    void this.loadCitySuggestion();
  }

  /** Só sugere. Nunca altera filtros nem dispara GET. */
  private async loadCitySuggestion(): Promise<void> {
    if (this.cityFilter()) return;
    if ((await this.geo.getPermissionState()) === 'denied') return;

    const city = await this.geo.resolveCity();
    if (city && !this.cityFilter()) this.suggestedCity.set(city);
  }

  private syncUrl(query: CourtQueryDTO): void {
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

  // --- Handlers de filtro ---

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
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  selectCourt(court: ResponseCourtDTO): void {
    void this.router.navigate(['clubs', court.clubId, 'court', court.id]);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  clearError(): void {
    this.courtService.clearError();
  }
}