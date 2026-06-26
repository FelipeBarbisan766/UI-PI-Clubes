import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';

import {
  ApiReservation,
  Reservation,
  ReservationStatus,
  STATUS_MAP,
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

  // ── Mutations (atualização local otimista — adicione chamadas PATCH aqui
  //   quando os endpoints de status estiverem disponíveis) ──────────────────
  confirm(id: string): void {
    this.updateStatus(id, 'confirmed');
  }

  cancel(id: string): void {
    this.updateStatus(id, 'cancelled');
  }

  // ── Private helpers ──────────────────────────────────────────────────────
  private updateStatus(id: string, status: ReservationStatus): void {
    this._reservations.update(list =>
      list.map(r => r.id === id ? { ...r, status } : r)
    );
  }

  private mapReservation(r: ApiReservation): Reservation {
    return {
      id:     r.id,
      player: r.player.name,
      court:  r.schedule.court.name,
      date:   r.date.slice(0, 10),
      time:   `${r.schedule.startTime.slice(0, 5)} – ${r.schedule.endTime.slice(0, 5)}`,
      status: STATUS_MAP[r.status] ?? 'pending',
      pricePerHour:  r.schedule.court.pricePerHour,
    };
  }

  private handleError(err: unknown): Observable<never> {
    console.error('[ReserveService]', err);
    this._error.set('Erro ao carregar reservas. Tente novamente.');
    return EMPTY;
  }
}