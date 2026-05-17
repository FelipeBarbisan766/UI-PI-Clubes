import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, computed, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, map, shareReplay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse, AdminMeResponse, PlayerMeResponse, LoginPayload } from '../models/auth-model';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Auth`;
  private readonly adminBaseUrl = `${environment.apiUrl}/Admin`;
  private readonly playerBaseUrl = `${environment.apiUrl}/Player`;

  readonly me = signal<MeResponse | null>(null);
  readonly authStatus = signal<AuthStatus>('unknown');

  readonly isAuthenticated = computed(() => this.authStatus() === 'authenticated');

  private meRequest$: Observable<MeResponse | null> | null = null;

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post(`${this.baseUrl}/login`, payload, {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.authStatus.set('authenticated');
          this.meRequest$ = null;
        }),
        catchError(this.handleHttpError('Erro ao realizar login.'))
      );
  }

  googleLogin(idToken: string): Observable<string> {
    return this.http
      .post(`${this.baseUrl}/google/login`, { idToken }, {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.authStatus.set('authenticated');
          this.meRequest$ = null;
        }),
        catchError(this.handleHttpError('Erro ao realizar login com Google.'))
      );
  }

  googleSignUp(idToken: string): Observable<string> {
    return this.http
      .post(`${this.baseUrl}/google/signup`, { idToken }, {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.authStatus.set('authenticated');
          this.meRequest$ = null;
        }),
        catchError(this.handleHttpError('Erro ao criar conta com Google.'))
      );
  }

  getMe(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.me.set(user);
          this.authStatus.set('authenticated');
        })
      );
  }

  logout(): Observable<string> {
    return this.http
      .get(`${this.baseUrl}/logout`, { responseType: 'text', withCredentials: true })
      .pipe(
        map((message) => message || 'Logout realizado com sucesso.'),
        tap(() => this.clearSession()),
        catchError((error: unknown) => {
          this.clearSession();
          return this.handleHttpError('Erro ao realizar logout.')(error);
        })
      );
  }

  resolveSession(): Observable<MeResponse | null> {
    if (this.authStatus() === 'authenticated') return of(this.me());
    if (this.authStatus() === 'unauthenticated') return of(null);

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
            this.clearSession();
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

  refreshMe(): Observable<MeResponse> {
    this.meRequest$ = null;
    return this.http
      .get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap((user) => this.markAuthenticated(user)),
        catchError(this.handleHttpError('Não foi possível carregar usuário.'))
      );
  }

  getAdminMe(): Observable<AdminMeResponse> {
    return this.http
      .get<AdminMeResponse>(`${this.adminBaseUrl}/me`, { withCredentials: true })
      .pipe(
        catchError(this.handleHttpError('Não foi possível carregar o perfil do administrador.'))
      );
  }

  getPlayerMe(): Observable<PlayerMeResponse> {
    return this.http
      .get<PlayerMeResponse>(`${this.playerBaseUrl}/me`, { withCredentials: true })
      .pipe(
        catchError(this.handleHttpError('Não foi possível carregar o perfil do jogador.'))
      );
  }

  // Centraliza o tratamento de erro HTTP — evita repetição nos métodos acima
  private handleHttpError(fallback: string) {
    return (error: unknown): Observable<never> => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401)
          return throwError(() => new Error('Credenciais inválidas.'));

        if (typeof error.error === 'string' && error.error.trim())
          return throwError(() => new Error(error.error));
      }
      return throwError(() => new Error(fallback));
    };
  }
}