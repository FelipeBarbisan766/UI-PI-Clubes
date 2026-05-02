import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseClubDTO, ResponseClubByIdDTO} from '../models/model-club';
import { environment } from '../../../../environments/environment';

export interface ClubState {
  clubs: ResponseClubDTO[];
  selectedClub: ResponseClubByIdDTO | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceClub {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/club`;

  // --- State ---
  private readonly _clubs = signal<ResponseClubDTO[]>([]);
  private readonly _selectedClub = signal<ResponseClubByIdDTO | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // --- Selectors (public, readonly) ---
  readonly clubs = this._clubs.asReadonly();
  readonly selectedClub = this._selectedClub.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._clubs().length === 0);
  readonly clubsCount = computed(() => this._clubs().length);

  // --- CRUD ---

  getAll(params?: Record<string, string>): Observable<ResponseClubDTO[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseClubDTO[]>(this.apiUrl, { params: httpParams }).pipe(
      tap((clubs) => {
        this._clubs.set(clubs);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  getById(id: string): Observable<ResponseClubByIdDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseClubByIdDTO>(`${this.apiUrl}/${id}`).pipe(
      tap((club) => {
        this._selectedClub.set(club);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  
  // --- Helpers ---

  selectClub(club: ResponseClubByIdDTO | null): void {
    this._selectedClub.set(club);
  }

  clearError(): void {
    this._error.set(null);
  }

  private handleError(err: unknown): Observable<never> {
    const message =
      err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    this._error.set(message);
    this._loading.set(false);
    return throwError(() => err);
  }
}
