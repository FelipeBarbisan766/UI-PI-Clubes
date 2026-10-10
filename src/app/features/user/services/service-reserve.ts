import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable, tap, throwError } from 'rxjs';

import {
  ApiReservation,
  PagedResult,
  Reservation,
  ReserveQueryParams,
  StatusEnum,
} from '../models/model-reserve';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';

@Injectable({ providedIn: 'root' })
export class UserReserveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _reservations = signal<Reservation[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _totalPages = signal(1);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isCancelling = signal(false);

  readonly isCancelling = this._isCancelling.asReadonly();
  readonly reservations = this._reservations.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ── Load ─────────────────────────────────────────────────────────────────
  loadByPlayerId(
    playerId: string,
    params: ReserveQueryParams,
  ): Observable<PagedResult<ApiReservation>> {
    this._isLoading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);

    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<PagedResult<ApiReservation>>(`${this.apiUrl}/reserve/player/${playerId}/details`, {
        params: httpParams,
        withCredentials: true,
      })
      .pipe(
        catchError((err) => this.handleError(err)),
        tap((result) => {
          this._reservations.set(result.data.map((r) => this.mapReservation(r)));
          this._totalCount.set(result.totalCount);
          this._totalPages.set(result.totalPages);
        }),
        finalize(() => this._isLoading.set(false)),
      );
  }

  cancel(id: string): Observable<void> {
    this._isCancelling.set(true);

    return this.http
      .put<void>(`${this.apiUrl}/reserve/status/${id}?status=Cancelada`, null, {
        withCredentials: true,
      })
      .pipe(
        tap(() =>
          this._reservations.update((list) =>
            list.map((r) =>
              r.id === id ? { ...r, status: StatusEnum.Cancelada, canCancel: false } : r,
            ),
          ),
        ),
        catchError((err) =>
          throwError(
            () => new Error(getApiErrorMessage(err, 'Não foi possível cancelar a reserva.')),
          ),
        ),
        finalize(() => this._isCancelling.set(false)),
      );
  }

  private mapReservation(r: ApiReservation): Reservation {
    return {
      id: r.id,
      club: r.club.name,
      phone: r.club.phoneNumber,
      court: r.schedule.court.name,
      date: r.date.slice(0, 10),
      time: `${r.schedule.startTime.slice(0, 5)} – ${r.schedule.endTime.slice(0, 5)}`,
      status: StatusEnum[r.status as keyof typeof StatusEnum],
      pricePerHour: r.schedule.court.pricePerHour,
      canCancel: r.canCancel,
    };
  }

  private handleError(err: unknown): Observable<never> {
    console.error('[ReserveService]', err);
    this._error.set('Erro ao carregar reservas. Tente novamente.');
    return EMPTY;
  }
}
