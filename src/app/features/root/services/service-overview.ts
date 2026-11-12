import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { ModelOverview } from '../models/model-overview';

@Injectable({
  providedIn: 'root',
})
export class ServiceOverview {
  private readonly http = inject(HttpClient);
  // GET {apiUrl}/root/overview
  private readonly apiUrl = `${environment.apiUrl}/Root/overview`;

  // --- State ---
  private readonly _overview = signal<ModelOverview | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly overview = this._overview.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // --- Read ---

  get(): Observable<ModelOverview> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ModelOverview>(this.apiUrl).pipe(
      tap((overview) => {
        this._overview.set(overview);
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