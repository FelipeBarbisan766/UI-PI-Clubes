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
        let defaultMessage = 'Não foi possível reenviar o e-mail de redefinição de senha.';

        if (error instanceof HttpErrorResponse && typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            defaultMessage = parsedError.Message || parsedError.message || defaultMessage;
          } catch {
            defaultMessage = error.error || defaultMessage;
          }
        }

        return throwError(() => new Error(defaultMessage));
      }),
    );
  }

  resetPassword(token: string, password: string): Observable<ForgotPasswordResult> {
    const url = `${environment.apiUrl}${this.resetPath}?token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`;
    return this.http.post(url, null, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'Senha recuperada com sucesso!',
      })),
       catchError((error: unknown) => {
        let defaultMessage = 'Não foi possível resetar a senha.';

        if (error instanceof HttpErrorResponse && typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            defaultMessage = parsedError.Message || parsedError.message || defaultMessage;
          } catch {
            defaultMessage = error.error || defaultMessage;
          }
        }

        return throwError(() => new Error(defaultMessage));
      }),
    );
  }
}