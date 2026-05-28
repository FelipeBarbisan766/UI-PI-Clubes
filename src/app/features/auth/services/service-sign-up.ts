import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SignUpPayload } from '../models/model-sign-up';

@Injectable({
  providedIn: 'root',
})
export class ServiceSignUp {
  // ✅ readonly em todos os campos privados
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  signUp(data: SignUpPayload): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/register`, data, { responseType: 'text' })
      // ✅ catchError centralizado no service, igual ao service-club
      .pipe(catchError((err) => this.handleError(err)));
  }

  signUpWithGoogle(payload: { idToken: string }): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/google/signup`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  // ✅ handleError padronizado igual ao service-club
  private handleError(err: unknown): Observable<never> {
    const message =
      err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    return throwError(() => new Error(message));
  }
}