import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChangePasswordDTO {
  password: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ChangePasswordService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Auth/changePassword`;

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  changePassword(dto: ChangePasswordDTO): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<void>(this.baseUrl, dto, { withCredentials: true })
      .pipe(
        catchError(err => this.handleError('Não foi possível alterar a senha.', err)),
        finalize(() => this._loading.set(false)),
      );
  }

  private handleError(message: string, err: unknown): Observable<never> {
    this._error.set(message);
    return throwError(() => err);
  }
}