import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { CreateReserveDTO, ResponseReserveDTO } from '../models/model-reserve';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceReserve {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reserve`;

  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error   = this._error.asReadonly();

  create(dto: CreateReserveDTO): Observable<ResponseReserveDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ResponseReserveDTO>(this.baseUrl, dto, { withCredentials: true })
      .pipe(
        finalize(() => this._loading.set(false)),
        catchError(this.handleError()),
      );
  }

  private handleError() {
    return (error: unknown): Observable<never> => {
      const msg =
        error instanceof HttpErrorResponse && typeof error.error === 'string' && error.error.trim()
          ? error.error
          : 'Não foi possível criar a reserva.';
      this._error.set(msg);
      return throwError(() => new Error(msg));
    };
  }
}