import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SportDTO } from '../../../core/models/model-sport';

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
        tap(user => this._user.set(user)),
        catchError(err => this.handleError('Não foi possível carregar o perfil.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  update(dto: UpdateConfigDTO): Observable<ResponseUserDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ResponseUserDTO>(`${this.baseUrl}/`, dto, { withCredentials: true })
      .pipe(
        tap(user => this._user.set(user)),
        catchError(err => this.handleError('Não foi possível salvar as alterações.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  updateAvatar(id: string, file: File): Observable<ResponseUserDTO> {
    const formData = new FormData();
    formData.append('AvatarImage', file);
    return this.http
      .put(`${this.baseUrl}/avatar`, formData, { withCredentials: true })
      .pipe(switchMap(() => this.getById(id)));
  }

  // --- Esportes favoritos ---

  getFavoriteSports(playerId: string): Observable<SportDTO[]> {
    this._favoriteSportsLoading.set(true);
    this._favoriteSportsError.set(null);

    return this.http
      .get<SportDTO[]>(`${environment.apiUrl}/Player/${playerId}/favorite-sports`, {
        withCredentials: true,
      })
      .pipe(
        tap(sports => this._favoriteSports.set(sports)),
        catchError(err =>
          this.handleFavoriteSportsError('Não foi possível carregar os esportes favoritos.', err),
        ),
        finalize(() => this._favoriteSportsLoading.set(false)),
      );
  }

  updateFavoriteSports(playerId: string, sportIds: string[]): Observable<SportDTO[]> {
    this._favoriteSportsLoading.set(true);
    this._favoriteSportsError.set(null);

    const payload = { sportIds };

    return this.http
      .put<SportDTO[]>(
        `${environment.apiUrl}/Player/${playerId}/favorite-sports`,
        payload, 
        { withCredentials: true },
      )
      .pipe(
        tap(updated => this._favoriteSports.set(updated)),
        catchError(err =>
          this.handleFavoriteSportsError('Não foi possível salvar os esportes favoritos.', err),
        ),
        finalize(() => this._favoriteSportsLoading.set(false)),
      );
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