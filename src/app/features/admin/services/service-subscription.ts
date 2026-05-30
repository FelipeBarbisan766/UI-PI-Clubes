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

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class ServiceSubscription {
  private readonly http = inject(HttpClient);

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<Plan[]>(`${environment.apiUrl}/plan`)
      .pipe(catchError(this.handleError));
  }

  initiatePayment(
    adminId: string,
    planId: string,
    method: PaymentMethod
  ): Observable<PaymentInitiateResult> {
    return this.http
      .post<PaymentInitiateResult>(`${environment.apiUrl}/payment/initiate`, {
        adminId,
        planId,
        method,
      })
      .pipe(catchError(this.handleError));
  }

  getPaymentHistory(adminId: string): Observable<PaymentHistory[]> {
    return this.http
      .get<PaymentHistory[]>(`${environment.apiUrl}/payment/history/${adminId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Returns null (instead of throwing) when the admin has no active subscription (HTTP 404).
   * All other errors are propagated normally.
   */
  getActiveSubscription(adminId: string): Observable<ActiveSubscription | null> {
    return this.http
      .get<ActiveSubscription>(
        `${environment.apiUrl}/subscription/active/${adminId}`
      )
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }
          return this.handleError(error);
        })
      );
  }

  checkAccess(adminId: string): Observable<CheckAccessResult> {
    return this.http
      .get<CheckAccessResult>(
        `${environment.apiUrl}/subscription/check-access/${adminId}`
      )
      .pipe(catchError(this.handleError));
  }

  cancelSubscription(subscriptionId: string): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiUrl}/subscription/cancel/${subscriptionId}`,
        null
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message =
        typeof error.error === 'string'
          ? error.error
          : error.message || 'Ocorreu um erro inesperado.';
      return throwError(() => new Error(message));
    }
    return throwError(() => new Error('Ocorreu um erro inesperado.'));
  }
}