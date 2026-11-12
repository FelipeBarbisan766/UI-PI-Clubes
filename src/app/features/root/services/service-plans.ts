import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { CreatePlanDTO, Plan, UpdatePlanDTO } from '../models/model-plan';

@Injectable({
  providedIn: 'root',
})
export class ServicePlan {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/plan`;

  // --- State ---
  private readonly _plans = signal<Plan[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly plans = this._plans.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._plans().length === 0);
  readonly plansCount = computed(() => this._plans().length);

  // --- CRUD ---
  // Rotas assumidas (ajuste aqui se o controller for diferente):
  //   GET    /plan
  //   POST   /plan/root
  //   PUT    /plan/{id}/root
  //   DELETE /plan/{id}/root

  getAll(): Observable<Plan[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Plan[]>(this.apiUrl).pipe(
      tap((plans) => {
        this._plans.set(plans);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  create(dto: CreatePlanDTO): Observable<Plan> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Plan>(`${this.apiUrl}/root`, dto).pipe(
      tap((newPlan) => {
        this._plans.update((plans) => [...plans, newPlan]);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  update(id: string, dto: UpdatePlanDTO): Observable<Plan> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Plan>(`${this.apiUrl}/${id}/root`, dto).pipe(
      tap((updated) => {
        this._plans.update((plans) => plans.map((p) => (p.id === id ? updated : p)));
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  delete(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    // Soft delete no backend: some da lista local imediatamente.
    return this.http.patch<void>(`${this.apiUrl}/${id}/set-active/root?isActive=false`, null).pipe(
      tap(() => {
        this._plans.update((plans) => plans.filter((p) => p.id !== id));
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