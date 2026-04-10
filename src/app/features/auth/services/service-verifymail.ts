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
  private readonly verifyPath = '/Auth/verify';

  verifyEmail(token: string): Observable<VerifyEmailResult> {
    const url = `${environment.apiUrl}${this.verifyPath}?token=${encodeURIComponent(token)}`;

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((message: string) => ({
        success: true,
        message: (message || '').trim() || 'E-mail verificado com sucesso.',
      })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string') {
          return throwError(() => new Error(error.error || 'Link inválido ou expirado.'));
        }
        return throwError(() => new Error('Link inválido ou expirado.'));
      })
    );
  }
}
