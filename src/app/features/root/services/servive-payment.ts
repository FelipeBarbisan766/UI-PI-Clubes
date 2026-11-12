import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { PaymentHistoryDto } from '../models/model-overview';

@Injectable({
  providedIn: 'root',
})
export class ServicePayment {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Payment
`;

  // --- State ---
  private readonly _payments = signal<PaymentHistoryDto[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly payments = this._payments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._payments().length === 0);

  // --- Read ---

  // GET {apiUrl}/overview
  getOverview(): Observable<PaymentHistoryDto[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<PaymentHistoryDto[]>(
        `${this.apiUrl}/overview
`,
      )
      .pipe(
        tap((payments) => {
          this._payments.set(payments);
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
