import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface CreatePlayerRequest {
  userName: string;
  contactNumber: string;
  description: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class FormPlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Player`;

  createPlayer(payload: CreatePlayerRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}`, payload, { withCredentials: true }).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string' && error.error.trim()) {
          return throwError(() => new Error(error.error));
        }
        return throwError(() => new Error('Não foi possível salvar o perfil de jogador.'));
      })
    );
  }
}