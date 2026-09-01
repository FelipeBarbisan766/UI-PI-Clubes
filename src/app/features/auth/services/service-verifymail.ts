import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VerifyEmailResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceVerifymail {
  private readonly http = inject(HttpClient);
  private readonly verifyPath = '/Auth';

  verifyEmail(token: string): Observable<VerifyEmailResult> {
    const url = `${environment.apiUrl}${this.verifyPath}/verify`;

    return this.http.post(url, { token }, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'E-mail verificado com sucesso.',
      })),
      catchError((error: unknown) => {
        // Mensagem de fallback específica para este método
        let defaultMessage = 'Link inválido ou expirado.';

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

  resendVerificationEmail(email: string): Observable<VerifyEmailResult> {
    const url = `${environment.apiUrl}${this.verifyPath}/resend?email=${email}`;
    console.log('Resending verification email to:', email);
    
    return this.http.post(url, null, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'E-mail de verificação reenviado com sucesso.',
      })),
      catchError((error: unknown) => {
        let defaultMessage = 'Não foi possível reenviar o e-mail de verificação.';

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