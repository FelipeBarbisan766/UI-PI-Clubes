import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import {
  ResponseReserveDetailDTO,
  PagedResult,
  Reservation,
  ReserveQueryParams,
  StatusEnum,
} from '../models/model-reserve';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReserveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _reservations = signal<Reservation[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _totalPages = signal(1);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reservations = this._reservations.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ── Load ─────────────────────────────────────────────────────────────────
  loadByClubId(
    clubId: string,
    params: ReserveQueryParams,
  ): Observable<PagedResult<ResponseReserveDetailDTO>> {
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
      .get<PagedResult<ResponseReserveDetailDTO>>(`${this.apiUrl}/reserve/club/${clubId}/details`, {
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

  confirm(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .put(`${this.apiUrl}/reserve/status/${id}?status=Confirmada`, null, {
        withCredentials: true,
      })
      .pipe(
        catchError((err) => this.handleError(err)),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe(() => {
        const updatedReservations = this._reservations().map((r) =>
          r.id === id ? { ...r, status: StatusEnum.Confirmada } : r,
        );
        this._reservations.set(updatedReservations);
      });
  }

  cancel(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .put(`${this.apiUrl}/reserve/status/${id}?status=Cancelada`, null, {
        withCredentials: true,
      })
      .pipe(
        catchError((err) => this.handleError(err)),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe(() => {
        const updatedReservations = this._reservations().map((r) =>
          r.id === id ? { ...r, status: StatusEnum.Cancelada } : r,
        );
        this._reservations.set(updatedReservations);
      });
  }

  private mapReservation(r: ResponseReserveDetailDTO): Reservation {
    return {
      id: r.id,
      name: r.name,
      phoneNumber: r.phoneNumber,
      userId: r.userId,
      dateOfReservation: r.dateOfReservation,
      court: r.schedule.court.name,
      date: r.date.slice(0, 10),
      time: `${r.schedule.startTime.slice(0, 5)} – ${r.schedule.endTime.slice(0, 5)}`,
      status: StatusEnum[r.status as keyof typeof StatusEnum],
      pricePerHour: r.schedule.court.pricePerHour,
    };
  }

  private handleError(err: unknown): Observable<never> {
    console.error('[ReserveService]', err);
    this._error.set('Erro ao carregar reservas. Tente novamente.');
    return EMPTY;
  }
}
