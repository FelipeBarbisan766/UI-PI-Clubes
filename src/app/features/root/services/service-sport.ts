import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { CreateSportDTO, ResponseSportDTO } from '../models/model-sport';

@Injectable({
  providedIn: 'root',
})
export class ServiceSport {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Sport`;

  // --- State ---
  private readonly _sports = signal<ResponseSportDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly sports = this._sports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._sports().length === 0);
  readonly sportsCount = computed(() => this._sports().length);

  // --- CRUD (sport não tem update) ---

  getAll(): Observable<ResponseSportDTO[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseSportDTO[]>(this.apiUrl).pipe(
      tap((sports) => {
        this._sports.set(sports);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  create(dto: CreateSportDTO): Observable<ResponseSportDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ResponseSportDTO>(`${this.apiUrl}/root`, dto).pipe(
      tap((newSport) => {
        this._sports.update((sports) => [...sports, newSport]);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  delete(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    // Soft delete no backend: some da lista local imediatamente.
    return this.http.delete<void>(`${this.apiUrl}/${id}/root`).pipe(
      tap(() => {
        this._sports.update((sports) => sports.filter((s) => s.id !== id));
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  // --- Helpers ---

  clearError(): void {
    this._error.set(null);
  }

  private handleError(err: unknown): Observable<never> {
    this._error.set(getApiErrorMessage(err));
    this._loading.set(false);
    return throwError(() => err);
  }
}