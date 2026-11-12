import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SportDTO } from '../../../core/models/model-sport';
import { AuthService } from '../../../core/services/auth-service';

export interface ResponseUserDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phoneNumber: string;
}

export interface UpdateConfigDTO {
  name: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class UserConfigService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/user`;

  private readonly _user = signal<ResponseUserDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // --- Esportes favoritos ---
  private readonly _favoriteSports = signal<SportDTO[]>([]);
  private readonly _favoriteSportsLoading = signal(false);
  private readonly _favoriteSportsError = signal<string | null>(null);

  readonly favoriteSports = this._favoriteSports.asReadonly();
  readonly favoriteSportsLoading = this._favoriteSportsLoading.asReadonly();
  readonly favoriteSportsError = this._favoriteSportsError.asReadonly();

  getById(id: string): Observable<ResponseUserDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<ResponseUserDTO>(`${this.baseUrl}/${id}`, { withCredentials: true })
      .pipe(
        tap((user) => this._user.set(user)),
        catchError((err) => this.handleError('Não foi possível carregar o perfil.', err)),
        finalize(() => this._loading.set(false)),
      );
  }

  update(dto: UpdateConfigDTO): Observable<ResponseUserDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ResponseUserDTO>(`${this.baseUrl}/`, dto, { withCredentials: true })
      .pipe(
        tap((user) => this._user.set(user)),
        // Atualiza o `me` (navbar / user-menu). Se o refresh falhar, o salvamento continua valendo.
        switchMap((user) => this.syncMe().pipe(map(() => user))),
        catchError((err) => this.handleError('Não foi possível salvar as alterações.', err)),
        finalize(() => this._loading.set(false)),
      );
  }

  updateAvatar(id: string, file: File): Observable<ResponseUserDTO> {
    const formData = new FormData();
    formData.append('AvatarImage', file);

    return this.http.put(`${this.baseUrl}/avatar`, formData, { withCredentials: true }).pipe(
      switchMap(() => this.getById(id)),
      switchMap((user) => this.syncMe({ bustAvatarCache: true }).pipe(map(() => user))),
    );
  }

  // --- Esportes favoritos ---

  getFavoriteSports(): Observable<SportDTO[]> {
    this._favoriteSportsLoading.set(true);
    this._favoriteSportsError.set(null);

    return this.http
      .get<SportDTO[]>(`${environment.apiUrl}/Player/favorite-sports`, {
        withCredentials: true,
      })
      .pipe(
        tap((sports) => this._favoriteSports.set(sports)),
        catchError((err) =>
          this.handleFavoriteSportsError('Não foi possível carregar os esportes favoritos.', err),
        ),
        finalize(() => this._favoriteSportsLoading.set(false)),
      );
  }

  updateFavoriteSports(sportIds: string[]): Observable<SportDTO[]> {
    this._favoriteSportsLoading.set(true);
    this._favoriteSportsError.set(null);

    const payload = { sportIds };

    return this.http
      .put<SportDTO[]>(`${environment.apiUrl}/Player/favorite-sports`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((updated) => this._favoriteSports.set(updated)),
        catchError((err) =>
          this.handleFavoriteSportsError('Não foi possível salvar os esportes favoritos.', err),
        ),
        finalize(() => this._favoriteSportsLoading.set(false)),
      );
  }

  /**
   * Recarrega o `me` do AuthService para que navbar e user-menu reflitam
   * o nome/foto novos. Nunca propaga erro: o salvamento já aconteceu.
   * Com `bustAvatarCache`, acrescenta ?v= na URL do avatar para o navegador
   * não mostrar a imagem antiga quando o backend devolve o mesmo caminho.
   */
  private syncMe(options: { bustAvatarCache?: boolean } = {}): Observable<unknown> {
    return this.authService.refreshMe().pipe(
      tap(() => {
        if (!options.bustAvatarCache) return;
        this.authService.me.update((me) =>
          me?.avatarUrl ? { ...me, avatarUrl: this.withCacheBuster(me.avatarUrl) } : me,
        );
      }),
      catchError(() => of(null)),
    );
  }

  private withCacheBuster(url: string): string {
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
  }

  private handleFavoriteSportsError(message: string, err: unknown): Observable<never> {
    this._favoriteSportsError.set(message);
    return throwError(() => err);
  }

  private handleError(message: string, err: unknown): Observable<never> {
    this._error.set(message);
    return throwError(() => err);
  }
}