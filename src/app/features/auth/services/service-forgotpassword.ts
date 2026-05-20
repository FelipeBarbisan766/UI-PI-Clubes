import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceForgotPassword {
  private readonly http = inject(HttpClient);
  private readonly requestPath = '/Auth/requestPassword';
  private readonly resetPath = '/Auth/resetPassword';

  requestResetPassword(email: string): Observable<ForgotPasswordResult> {
    const url = `${environment.apiUrl}${this.requestPath}?email=${encodeURIComponent(email)}`;

    return this.http.post(url, null, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'Verifique seu e-mail para continuar.',
      })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string') {
          return throwError(() => new Error(error.error || 'Não foi possível enviar o e-mail.'));
        }
        return throwError(() => new Error('Não foi possível enviar o e-mail.'));
      })
    );
  }

  resetPassword(token: string, password: string): Observable<ForgotPasswordResult> {
    const url = `${environment.apiUrl}${this.resetPath}?token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`;

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'Senha recuperada com sucesso!',
      })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string') {
          return throwError(() => new Error(error.error || 'O link de verificação é inválido ou expirou.'));
        }
        return throwError(() => new Error('O link de verificação é inválido ou expirou.'));
      })
    );
  }
}