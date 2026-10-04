import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateUserFlagRequest, Flag, UserFlag } from '../models/model-flag';

@Injectable({ providedIn: 'root' })
export class FlagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Flags`;

  // Os tipos de flag mudam raramente: cache em memória evita refetch a cada abertura do modal
  private readonly _flags = signal<Flag[]>([]);

  getFlags(): Observable<Flag[]> {
    if (this._flags().length > 0) {
      return of(this._flags());
    }
    return this.http
      .get<Flag[]>(this.baseUrl, { withCredentials: true })
      .pipe(tap((flags) => this._flags.set(flags)));
  }

  reportUser(userId: string, body: CreateUserFlagRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/user/${userId}`, body, {
      withCredentials: true,
    });
  }

  getUserFlags(userId: string): Observable<UserFlag[]> {
    return this.http.get<UserFlag[]>(`${this.baseUrl}/user/${userId}`, {
      withCredentials: true,
    });
  }

  /**
   * Busca os reports de cada usuário informado e devolve os ids das reservas
   * que já foram reportadas. Falha em um usuário não derruba os demais.
   */
  getReportedReserveIds(userIds: string[]): Observable<string[]> {
    if (userIds.length === 0) {
      return of([]);
    }
    return forkJoin(
      userIds.map((id) => this.getUserFlags(id).pipe(catchError(() => of([] as UserFlag[])))),
    ).pipe(map((lists) => lists.flatMap((flags) => flags.map((f) => f.reserveId))));
  }
}