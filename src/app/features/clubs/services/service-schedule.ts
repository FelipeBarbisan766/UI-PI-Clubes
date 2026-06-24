import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { ScheduleAvailabilityDTO } from '../models/model-schedule';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceSchedule {
  private readonly http = inject(HttpClient);
 private readonly apiUrl = `${environment.apiUrl}`;

  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error   = this._error.asReadonly();

  /**
   * Busca os horários disponíveis de uma quadra em uma data específica.
   * @param courtId  UUID da quadra
   * @param date     Data no formato 'YYYY-MM-DD'
   */
  getAvailability(courtId: string, date: string): Observable<ScheduleAvailabilityDTO[]> {
    this._loading.set(true);
    this._error.set(null);
    

    return this.http
      .get<ScheduleAvailabilityDTO[]>(
        `${this.apiUrl}/schedule/court/${courtId}/availability`,
        { params: { date }, withCredentials: true },
      )
      .pipe(
        catchError(err => {
          const message =
            err?.error?.message ?? 'Não foi possível carregar os horários disponíveis.';
          this._error.set(message);
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }
}