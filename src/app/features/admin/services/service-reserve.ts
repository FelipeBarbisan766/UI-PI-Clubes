import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';

import {
  ApiReservation,
  Reservation,
  StatusEnum,
} from '../models/model-reserve';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ReserveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _reservations = signal<Reservation[]>([]);
  private readonly _isLoading    = signal(false);
  private readonly _error        = signal<string | null>(null);

  readonly reservations = this._reservations.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();
  readonly error        = this._error.asReadonly();

  // ── Load ─────────────────────────────────────────────────────────────────
  loadByClubId(clubId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .get<ApiReservation[]>(`${this.apiUrl}/reserve/club/${clubId}/details`, {
        withCredentials: true,
      })
      .pipe(
        catchError(err => this.handleError(err)),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe(data =>
        this._reservations.set(data.map(r => this.mapReservation(r)))
      );
  }

  confirm(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.put(`${this.apiUrl}/reserve/status/${id}?status=Confirmada`, null, {
      withCredentials: true,
    }).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => this._isLoading.set(false)),
    )
    .subscribe(() => {
      // Atualiza o status da reserva localmente
      const updatedReservations = this._reservations().map(r =>
        r.id === id ? { ...r, status: StatusEnum.Confirmada } : r
      );
      this._reservations.set(updatedReservations);
    });
  }
  

  cancel(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.put(`${this.apiUrl}/reserve/status/${id}?status=Recusada`, null, {
      withCredentials: true,
    }).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => this._isLoading.set(false)),
    )
    .subscribe(() => {
      // Atualiza o status da reserva localmente
      const updatedReservations = this._reservations().map(r =>
        r.id === id ? { ...r, status: StatusEnum.Recusada } : r
      );
      this._reservations.set(updatedReservations);
    });
  }

  

  private mapReservation(r: ApiReservation): Reservation {
    return {
      id:     r.id,
      player: r.player.name,
      court:  r.schedule.court.name,
      date:   r.date.slice(0, 10),
      time:   `${r.schedule.startTime.slice(0, 5)} – ${r.schedule.endTime.slice(0, 5)}`,
      status: StatusEnum[r.status as keyof typeof StatusEnum] ?? StatusEnum.Pendente,
      pricePerHour:  r.schedule.court.pricePerHour,
    };
  }

  private handleError(err: unknown): Observable<never> {
    console.error('[ReserveService]', err);
    this._error.set('Erro ao carregar reservas. Tente novamente.');
    return EMPTY;
  }
}