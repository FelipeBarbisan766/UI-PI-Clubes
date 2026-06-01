import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    return (
      this.http
        .post(`${this.apiUrl}/register`, data, { responseType: 'text' })
        // ✅ catchError centralizado no service, igual ao service-club
        .pipe(catchError((err) => this.handleError(err)))
    );
  }

  signUpWithGoogle(payload: { idToken: string }): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/google/signup`, payload, {
        responseType: 'text', // ← combina com o que o backend retorna
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: unknown): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      const message =
        typeof err.error === 'string' && err.error.trim()
          ? err.error
          : 'Ocorreu um erro inesperado.';
      return throwError(() => new Error(message));
    }

    const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    return throwError(() => new Error(message));
  }
}
