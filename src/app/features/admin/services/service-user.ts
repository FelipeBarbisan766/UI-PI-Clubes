import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../models/model-user';




@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/user`;

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  getById(id: string): Observable<User> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<User>(`${this.baseUrl}/${id}`, { withCredentials: true })
      .pipe(
        tap(user => this._user.set(user)),
        catchError(err => this.handleError('Não foi possível carregar o perfil.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  private handleError(message: string, err: unknown): Observable<never> {
    this._error.set(message);
    return throwError(() => err);
  }
}