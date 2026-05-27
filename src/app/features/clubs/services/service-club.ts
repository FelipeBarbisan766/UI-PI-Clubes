import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseClubDTO, ResponseClubByIdDTO } from '../models/model-club';
import { environment } from '../../../../environments/environment';

export interface ClubQueryDTO {
  name?: string;
  city?: string;
  types?: number[];   
  page?: number;
  pageSize?: number;
}

export interface PagedResultDTO<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceClub {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/club`;

  // --- State ---
  private readonly _clubs      = signal<ResponseClubDTO[]>([]);
  private readonly _selectedClub = signal<ResponseClubByIdDTO | null>(null);
  private readonly _loading    = signal<boolean>(false);
  private readonly _error      = signal<string | null>(null);
  private readonly _totalCount = signal<number>(0);
  private readonly _totalPages = signal<number>(1);
  private readonly _page       = signal<number>(1);

  // --- Selectors (public, readonly) ---
  readonly clubs        = this._clubs.asReadonly();
  readonly selectedClub = this._selectedClub.asReadonly();
  readonly loading      = this._loading.asReadonly();
  readonly error        = this._error.asReadonly();
  readonly totalCount   = this._totalCount.asReadonly();
  readonly totalPages   = this._totalPages.asReadonly();
  readonly page         = this._page.asReadonly();

  readonly isEmpty    = computed(() => this._totalCount() === 0);
  readonly clubsCount = computed(() => this._totalCount());

  // --- CRUD ---

  getAll(query: ClubQueryDTO = {}): Observable<PagedResultDTO<ResponseClubDTO>> {
    let params = new HttpParams();

    if (query.name)     params = params.set('name', query.name);
    if (query.city)     params = params.set('city', query.city);
    if (query.page)     params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));

    query.types?.forEach(t => (params = params.append('types', String(t))));

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<PagedResultDTO<ResponseClubDTO>>(this.apiUrl, { params })
      .pipe(
        tap((result) => {
          this._clubs.set(result.data);
          this._totalCount.set(result.totalCount);
          this._totalPages.set(result.totalPages);
          this._page.set(result.page);
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