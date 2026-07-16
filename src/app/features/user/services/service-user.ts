import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ResponseUserDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phoneNumber: string;
}

export interface UpdateProfileDTO {
  name: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/user`;

  private readonly _user = signal<ResponseUserDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

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

  update(id: string, dto: UpdateProfileDTO): Observable<ResponseUserDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ResponseUserDTO>(`${this.baseUrl}/${id}`, dto, { withCredentials: true })
      .pipe(
        tap(user => this._user.set(user)),
        catchError(err => this.handleError('Não foi possível salvar as alterações.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  private handleError(message: string, err: unknown): Observable<never> {
    this._error.set(message);
    return throwError(() => err);
  }
}