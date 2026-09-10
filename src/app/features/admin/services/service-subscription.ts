import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  quantClub: number;
  quantCourt: number;
  durationDays: number;
  isActive: boolean;
}

export interface PaymentInitiateResult {
  paymentId: string;
  checkoutUrl: string;
}

export type PaymentMethod = 'Pix' | 'CreditCard' | 'Boleto';
export type PaymentStatus = 'Pending' | 'Confirmed' | 'Failed' | 'Refunded';
export type TypeAccess = 'Owner' | 'Manager' | 'Staff';

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId: string | null;
}

export interface ActiveSubscription {
  id: string;
  adminId: string;
  planId: string;
  planName: string;
  typeAccess: TypeAccess;
  startDate: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CheckAccessResult {
  hasAccess: boolean;
}

/**
 * Error thrown by ServiceSubscription methods. Extends the native `Error` so
 * every existing `err.message` usage keeps working unchanged; `status` is
 * optional and only present when the failure came from an HTTP response,
 * letting callers branch on specific status codes (e.g. 409 Conflict).
 */
export class SubscriptionApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'SubscriptionApiError';
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class ServiceSubscription {
  private readonly http = inject(HttpClient);

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<Plan[]>(`${environment.apiUrl}/plan`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  initiatePayment(
    planId: string,
    method: PaymentMethod
  ): Observable<PaymentInitiateResult> {
    return this.http
      .post<PaymentInitiateResult>(
        `${environment.apiUrl}/payment/initiate`,
        { planId, method },
        { withCredentials: true },
      )
      .pipe(catchError(this.handleError));
  }

  getPaymentHistory(): Observable<PaymentHistory[]> {
    return this.http
      .get<PaymentHistory[]>(`${environment.apiUrl}/payment/history`, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Returns null (instead of throwing) when the admin has no active subscription (HTTP 404).
   * All other errors are propagated normally.
   */
  getActiveSubscription(): Observable<ActiveSubscription | null> {
    return this.http
      .get<ActiveSubscription>(`${environment.apiUrl}/subscription/active`, {
        withCredentials: true,
      })
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }
          return this.handleError(error);
        })
      );
  }

  checkAccess(): Observable<CheckAccessResult> {
    return this.http
      .get<CheckAccessResult>(`${environment.apiUrl}/subscription/check-access`, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  cancelSubscription(subscriptionId: string): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiUrl}/subscription/cancel/${subscriptionId}`,
        null,
        { withCredentials: true },
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message =
        typeof error.error === 'string'
          ? error.error
          : error.message || 'Ocorreu um erro inesperado.';
      return throwError(() => new SubscriptionApiError(message, error.status));
    }
    return throwError(() => new SubscriptionApiError('Ocorreu um erro inesperado.'));
  }
}