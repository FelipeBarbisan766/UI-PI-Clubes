import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActiveSubscription,
  CheckAccessResult,
  CreatePaymentRequest,
  CustomPlanCalculationRequest,
  CustomPlanCalculationResponse,
  CustomPlanResponse,
  PaymentHistory,
  PaymentInitiateResult,
  Plan,
} from '../models/model-plan-payment';

export class SubscriptionApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
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

  /** O adminId vem do cookie e o valor é calculado pela API a partir do plano. */
  initiatePayment(planId: string): Observable<PaymentInitiateResult> {
    const body: CreatePaymentRequest = { planId };
    return this.http
      .post<PaymentInitiateResult>(`${environment.apiUrl}/payment/initiate`, body, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getPaymentHistory(): Observable<PaymentHistory[]> {
    return this.http
      .get<PaymentHistory[]>(`${environment.apiUrl}/payment/history`, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  
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
        }),
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
      .post<void>(`${environment.apiUrl}/subscription/cancel/${subscriptionId}`, null, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  activateFreePlan(adminId: string, planId: string): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/subscription/activate-free`, { adminId, planId })
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

  calculateCustomPlan(
    request: CustomPlanCalculationRequest,
  ): Observable<CustomPlanCalculationResponse> {
    return this.http.post<CustomPlanCalculationResponse>(
      `${environment.apiUrl}/Plan/custom/calculate`,
      request,
    );
  }
  createCustomPlan(request: CustomPlanCalculationRequest): Observable<CustomPlanResponse> {
    return this.http
      .post<CustomPlanResponse>(`${environment.apiUrl}/plan/custom`, request)
      .pipe(catchError(this.handleError));
  }
}
