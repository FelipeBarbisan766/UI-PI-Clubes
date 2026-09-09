import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SportDTO } from '../models/model-sport';

@Injectable({
  providedIn: 'root',
})
export class ServiceSport {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sport`;

  // --- State ---
  private readonly _sports = signal<SportDTO[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal<boolean>(false);

  // --- Selectors (public, readonly) ---
  readonly sports = this._sports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._sports().length === 0);

  getAll(force = false): Observable<SportDTO[]> {
    if (this._loaded() && !force) {
      return of(this._sports());
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<SportDTO[]>(this.apiUrl).pipe(
      tap((sports) => {
        this._sports.set(sports);
        this._loaded.set(true);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  getNameById(id: string): string {
    return this._sports().find((s) => s.id === id)?.name ?? 'Desconhecido';
  }

  clearError(): void {
    this._error.set(null);
  }

  private handleError(err: unknown): Observable<never> {
    const message = err instanceof Error ? err.message : 'Não foi possível carregar os esportes.';
    this._error.set(message);
    this._loading.set(false);
    return throwError(() => err);
  }
}