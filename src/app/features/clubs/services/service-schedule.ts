import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseScheduleDTO} from '../models/model-schedule';
import { environment } from '../../../../environments/environment';

export interface ScheduleState {
  schedules: ResponseScheduleDTO[];
  selectedSchedule: ResponseScheduleDTO | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceSchedule {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/schedule`;

  // --- State ---
  private readonly _schedules = signal<ResponseScheduleDTO[]>([]);
  private readonly _selectedSchedule = signal<ResponseScheduleDTO | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly schedules = this._schedules.asReadonly();
  readonly selectedschedule = this._selectedSchedule.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._schedules().length === 0);
  readonly schedulesCount = computed(() => this._schedules().length);

  // --- CRUD ---

  getByCourtId(courtId: string): Observable<ResponseScheduleDTO[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseScheduleDTO[]>(`${this.apiUrl}/court/${courtId}`).pipe(
      tap((schedules) => {
        this._schedules.set(schedules);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  getById(id: string): Observable<ResponseScheduleDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseScheduleDTO>(`${this.apiUrl}/${id}`).pipe(
      tap((schedule) => {
        this._selectedSchedule.set(schedule);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }


  // --- Helpers ---

  selectschedule(schedule: ResponseScheduleDTO | null): void {
    this._selectedSchedule.set(schedule);
  }

  clearError(): void {
    this._error.set(null);
  }

  private handleError(err: unknown): Observable<never> {
    const message =
      err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    this._error.set(message);
    this._loading.set(false);
    return throwError(() => err);
  }
}
