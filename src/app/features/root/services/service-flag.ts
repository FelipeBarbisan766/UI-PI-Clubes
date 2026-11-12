import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { CreateFlagDTO, Flag } from '../models/model-flags';

@Injectable({
  providedIn: 'root',
})
export class ServiceFlag {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Flags`;

  // --- State ---
  private readonly _flags = signal<Flag[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly flags = this._flags.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._flags().length === 0);
  readonly flagsCount = computed(() => this._flags().length);


  getAll(): Observable<Flag[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Flag[]>(this.apiUrl).pipe(
      tap((flags) => {
        this._flags.set(flags);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  create(dto: CreateFlagDTO): Observable<Flag> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Flag>(`${this.apiUrl}/root`, dto).pipe(
      tap((newFlag) => {
        this._flags.update((flags) => [...flags, newFlag]);
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
        this._flags.update((flags) => flags.filter((f) => f.id !== id));
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