import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { SportDTO } from '../models/model-sport';

export interface CreatePlayerRequest {
  userName: string;
  contactNumber: string;
  description: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Player`;

  createPlayer(userId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}`, { userId }, { withCredentials: true }).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && typeof error.error === 'string' && error.error.trim()) {
          return throwError(() => new Error(error.error));
        }
        return throwError(() => new Error('Não foi possível salvar o perfil de jogador.'));
      })
    );
  }
  getFavoriteSports(): Observable<SportDTO[]> {
    return this.http
      .get<SportDTO[]>(`${this.baseUrl}/favorite-sports`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: unknown): Observable<never> {
    return throwError(() => err);
  }
}