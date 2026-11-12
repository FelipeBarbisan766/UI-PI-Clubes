import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { User } from '../models/model-user';

@Injectable({
  providedIn: 'root',
})
export class ServiceUser {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/User`;

  // --- State ---
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._users().length === 0);
  readonly usersCount = computed(() => this._users().length);

  // --- Read (por enquanto o root só lista) ---

  // GET {apiUrl}/root
  getAll(): Observable<User[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<User[]>(`${this.apiUrl}/root`).pipe(
      tap((users) => {
        this._users.set(users);
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