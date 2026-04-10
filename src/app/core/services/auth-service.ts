import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse, LoginPayload } from '../models/auth-model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Auth`;

  readonly me = signal<MeResponse | null>(null);
  readonly isAuthenticated = signal(false);

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post(`${this.baseUrl}/login`, payload, {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(
        tap(() => this.isAuthenticated.set(true)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              return throwError(() => new Error('Credenciais inválidas.'));
            }
            if (typeof error.error === 'string' && error.error.trim()) {
              return throwError(() => new Error(error.error));
            }
          }
          return throwError(() => new Error('Erro ao realizar login.'));
        })
      );
  }

  getMe(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.me.set(user);
          this.isAuthenticated.set(true);
        })
      );
  }

  logout(): Observable<string> {
  return this.http
    .get(`${this.baseUrl}/logout`, { responseType: 'text', withCredentials: true })
    .pipe(
      map((message) => message || 'Logout realizado com sucesso.'),
      tap(() => {
        this.me.set(null);
        this.isAuthenticated.set(false);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string' && error.error.trim()) {
          return throwError(() => new Error(error.error));
        }
        return throwError(() => new Error('Erro ao realizar logout.'));
      })
    );
}
}
