import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  ResponseScheduleDTO,
  CreateScheduleDTO,
  UpdateScheduleDTO,
  CreateBulkScheduleDTO,
  ResponseBulkScheduleDTO,
} from '../models/model-schedule';
import { environment } from '../../../../environments/environment';

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
  readonly selectedSchedule = this._selectedSchedule.asReadonly();
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

  create(dto: CreateScheduleDTO): Observable<ResponseScheduleDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ResponseScheduleDTO>(this.apiUrl, dto).pipe(
      tap((newSchedule) => {
        this._schedules.update((schedules) => [...schedules, newSchedule]);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }
  createBulk(courtId: string, dto: CreateBulkScheduleDTO): Observable<ResponseBulkScheduleDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ResponseBulkScheduleDTO>(`${this.apiUrl}/court/${courtId}/bulk`, dto)
      .pipe(
        tap((result) => {
          this._schedules.update((schedules) => [...schedules, ...result.created]);
          this._loading.set(false);
        }),
        catchError((err) => this.handleError(err)),
      );
  }
  update(id: string, dto: UpdateScheduleDTO): Observable<ResponseScheduleDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<ResponseScheduleDTO>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this._schedules.update((schedules) => schedules.map((s) => (s.id === id ? updated : s)));
        if (this._selectedSchedule()?.id === id) {
          this._selectedSchedule.set(updated);
        }
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  delete(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._schedules.update((schedules) => schedules.filter((s) => s.id !== id));
        if (this._selectedSchedule()?.id === id) {
          this._selectedSchedule.set(null);
        }
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  // --- Helpers ---

  selectSchedule(schedule: ResponseScheduleDTO | null): void {
    this._selectedSchedule.set(schedule);
  }

  clearError(): void {
    this._error.set(null);
  }

  private handleError(err: unknown): Observable<never> {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    this._error.set(message);
    this._loading.set(false);
    return throwError(() => err);
  }
}
