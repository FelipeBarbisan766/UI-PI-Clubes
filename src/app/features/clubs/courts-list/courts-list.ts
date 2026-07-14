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
import { NgOptimizedImage } from '@angular/common';
import { debounceTime, skip, switchMap, take } from 'rxjs';
import { ServiceCourt } from '../services/service-court';
import { CourtQueryDTO, ResponseCourtDTO } from '../models/model-court';
import { TypeEnum } from '../models/model-court';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-courts-list',
  imports: [NgOptimizedImage],
  templateUrl: './courts-list.html',
  styleUrl: './courts-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourtsList {
  private readonly courtService = inject(ServiceCourt);
  private readonly router      = inject(Router);
  private readonly destroyRef  = inject(DestroyRef);

  readonly courts       = this.courtService.courts;
  readonly loading     = this.courtService.loading;
  readonly error       = this.courtService.error;
  readonly isEmpty     = this.courtService.isEmpty;
  readonly courtsCount  = this.courtService.courtsCount;
  readonly totalPages  = this.courtService.totalPages;

  readonly searchTerm    = signal('');
  readonly cityFilter    = signal('');
  readonly selectedTypes = signal<TypeEnum[]>([]);
  readonly currentPage   = signal(1);

  // Indica se a localização foi detectada automaticamente (para mostrar badge)
  readonly detectedCity  = signal<string | null>(null);

  private readonly query = computed<CourtQueryDTO>(() => ({
    name:     this.searchTerm() || undefined,
    city:     this.cityFilter() || undefined,
    types:    this.selectedTypes().length > 0 ? this.selectedTypes() : undefined,
    page:     this.currentPage(),
    pageSize: PAGE_SIZE,
  }));

  readonly visiblePages = computed<(number | '...')[]>(() => {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const around = new Set(
      [1, total, current - 1, current, current + 1].filter(p => p >= 1 && p <= total),
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
  // Recargas reativas (debounced)
  toObservable(this.query)
    .pipe(
      skip(1),
      debounceTime(400),
      switchMap(query => this.courtService.getAll(query)),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe();

  this.courtService
    .getAll(this.query())
    .pipe(take(1), takeUntilDestroyed(this.destroyRef))
    .subscribe();

  this.resolveInitialCity().then(city => {
    if (!city) return; // permissão negada/timeout → não faz nada
    this.cityFilter.set(city);
    this.detectedCity.set(city);
  });
}

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
        { timeout: 4000, maximumAge: 5 * 60 * 1000 }, // cache de 5 min
      );
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res  = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'SeuAppNome/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.city
        ?? data.address?.town
        ?? data.address?.municipality
        ?? data.address?.village
        ?? null;
  }

  clearDetectedCity(): void {
    this.detectedCity.set(null);
    this.cityFilter.set('');
    this.currentPage.set(1);
  }

  // --- Handlers de filtro ---

  onSearchChange(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onCityChange(event: Event): void {
    this.cityFilter.set((event.target as HTMLInputElement).value);
    this.detectedCity.set(null);
    this.currentPage.set(1);
  }

  toggleType(type: TypeEnum): void {
    const current = this.selectedTypes();
    this.selectedTypes.set(
      current.includes(type) ? current.filter(t => t !== type) : [...current, type],
    );
    this.currentPage.set(1);
  }

  isTypeSelected(type: TypeEnum): boolean {
    return this.selectedTypes().includes(type);
  }

  goToPage(page: number | '...'): void {
    if (typeof page !== 'number') return;
    const total = this.totalPages();
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
  }

  selectCourt(court: ResponseCourtDTO): void {
    this.router.navigate(['/courts', court.id]);
  }

  getFirstImage(court: ResponseCourtDTO): string | null {
    return court.images?.length > 0 ? court.images[0].thumbUrl : null;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  clearError(): void {
    this.courtService.clearError();
  }

  readonly typeLabels: Record<TypeEnum, string> = {
    [TypeEnum.None]:         'Outro',
    [TypeEnum.Futsal]:       'Futsal',
    [TypeEnum.Basquetebol]:  'Basquetebol',
    [TypeEnum.Basquete]:     'Basquete',
    [TypeEnum.Voleibol]:     'Vôlei',
    [TypeEnum.VôleiSentado]: 'Vôlei Sentado',
    [TypeEnum.Handebol]:     'Handebol',
    [TypeEnum.Netball]:      'Netball',
    [TypeEnum.Tênis]:        'Tênis',
    [TypeEnum.Badminton]:    'Badminton',
    [TypeEnum.Squash]:       'Squash',
    [TypeEnum.Padel]:        'Padel',
    [TypeEnum.Pickleball]:   'Pickleball',
    [TypeEnum.TênisDeMesa]:  'Tênis de Mesa',
    [TypeEnum.Judô]:         'Judô',
    [TypeEnum.Karatê]:       'Karatê',
    [TypeEnum.Taekwondo]:    'Taekwondo',
    [TypeEnum.Esgrima]:      'Esgrima',
    [TypeEnum.SepakTakraw]:  'Sepak Takraw',
    [TypeEnum.Hóquei]:       'Hóquei',
    [TypeEnum.Dodgeball]:    'Dodgeball',
    [TypeEnum.Raquetebol]:   'Raquetebol',
    [TypeEnum.PelotaBasca]:  'Pelota Basca',
    [TypeEnum.Floorball]:    'Floorball',
    [TypeEnum.Korfball]:     'Korfball',
    [TypeEnum.Tchoukball]:   'Tchoukball',
    [TypeEnum.Goalball]:     'Goalball',
    [TypeEnum.Futebol]:      'Futebol',
  };

  readonly availableTypes = Object.entries(this.typeLabels)
    .filter(([value]) => value !== TypeEnum.None)
    .map(([value, label]) => ({ value: value as TypeEnum, label }));

  getTypeName(type: TypeEnum | string): string {
    return this.typeLabels[type as TypeEnum] ?? 'Outro';
  }
}