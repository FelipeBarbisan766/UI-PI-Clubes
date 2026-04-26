import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, map, shareReplay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse, LoginPayload } from '../models/auth-model';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Auth`;

  readonly me = signal<MeResponse | null>(null);
  readonly isAuthenticated = signal(false);
  readonly authStatus = signal<AuthStatus>('unknown');

  private meRequest$: Observable<MeResponse | null> | null = null;

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

  resolveSession(): Observable<MeResponse | null> {
    if (this.authStatus() === 'authenticated') {
      return of(this.me());
    }

    if (this.authStatus() === 'unauthenticated') {
      return of(null);
    }

    if (!this.meRequest$) {
      this.meRequest$ = this.http
        .get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true })
        .pipe(
          tap((user) => {
            this.me.set(user);
            this.authStatus.set('authenticated');
          }),
          map((user) => user),
          catchError(() => {
            this.me.set(null);
            this.authStatus.set('unauthenticated');
            return of(null);
          }),
          shareReplay(1)
        );
    }

    return this.meRequest$;
  }

  markAuthenticated(user: MeResponse): void {
    this.me.set(user);
    this.authStatus.set('authenticated');
    this.meRequest$ = null;
  }

  clearSession(): void {
    this.me.set(null);
    this.authStatus.set('unauthenticated');
    this.meRequest$ = null;
  }

  // opcional: após login com sucesso
  refreshMe(): Observable<MeResponse> {
    this.meRequest$ = null;
    return this.http.get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => this.markAuthenticated(user)),
      catchError((error: unknown) => {
        this.clearSession();
        if (error instanceof HttpErrorResponse && typeof error.error === 'string' && error.error.trim()) {
          return throwError(() => new Error(error.error));
        }
        return throwError(() => new Error('Não foi possível carregar usuário.'));
      })
    );
  }
}
