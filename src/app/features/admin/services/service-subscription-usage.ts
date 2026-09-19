import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResourceUsageDTO, SubscriptionUsageDTO } from '../models/model-subscription-usage';

@Injectable({
  providedIn: 'root',
})
export class ServiceSubscriptionUsage {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Subscription/me/usage`;

  // --- State ---
  private readonly _usage = signal<SubscriptionUsageDTO | null>(null);
  private readonly _loading = signal<boolean>(false);

  // --- Selectors ---
  readonly usage = this._usage.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly planName = computed(() => this._usage()?.planName ?? '');

  /** Uso de clubes do plano (null enquanto não carregou). */
  readonly clubsUsage = computed<ResourceUsageDTO | null>(() => this._usage()?.clubs ?? null);

  /**
   * Fail-open: se o uso ainda não carregou (ou falhou), NÃO bloqueia na tela.
   * Quem decide de verdade é o backend (403 LIMITS_EXCEEDING).
   */
  readonly canCreateClub = computed(() => {
    const clubs = this.clubsUsage();
    return clubs === null || clubs.used < clubs.limit;
  });

  /** Uso de quadras de um clube específico (null enquanto não carregou). */
  courtUsageFor(clubId: string): ResourceUsageDTO | null {
    const usage = this._usage();
    if (!usage) return null;

    const entry = usage.clubsCourtUsage.find(
      (c) => c.clubId.toLowerCase() === clubId.toLowerCase(),
    );

    // Clube sem registro no array = ainda sem quadras
    return {
      used: entry?.used ?? 0,
      limit: entry?.limit ?? usage.courtLimitPerClub,
    };
  }

  // --- Actions ---

  load(): Observable<SubscriptionUsageDTO> {
    this._loading.set(true);

    return this.http.get<SubscriptionUsageDTO>(this.apiUrl).pipe(
      tap((usage) => {
        this._usage.set(usage);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /** Dispara o reload sem precisar de subscribe no componente. */
  refresh(): void {
    this.load().subscribe({
      error: (err: unknown) => console.error('Erro ao carregar uso do plano', err),
    });
  }
}