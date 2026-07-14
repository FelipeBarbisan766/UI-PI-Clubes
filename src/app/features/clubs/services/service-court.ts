import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CourtQueryDTO, PagedResultDTO, ResponseCourtDTO} from '../models/model-court';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServiceCourt {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/court`;

  // --- State ---
  private readonly _courts = signal<ResponseCourtDTO[]>([]);
  private readonly _selectedCourt = signal<ResponseCourtDTO | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalCount = signal<number>(0);
  private readonly _totalPages = signal<number>(1);
  private readonly _page       = signal<number>(1);

  // --- Selectors (public, readonly) ---
  readonly courts = this._courts.asReadonly();
  readonly selectedcourt = this._selectedCourt.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount   = this._totalCount.asReadonly();
  readonly totalPages   = this._totalPages.asReadonly();
  readonly page         = this._page.asReadonly();

  readonly isEmpty = computed(() => this._courts().length === 0);
  readonly courtsCount = computed(() => this._courts().length);

  // --- CRUD ---

  getAll(query: CourtQueryDTO = {}): Observable<PagedResultDTO<ResponseCourtDTO>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (query.name)     params = params.set('name', query.name);
    if (query.city)     params = params.set('city', query.city);
    if (query.page)     params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));

    query.types?.forEach(t => (params = params.append('types', String(t))));


    return this.http.get<PagedResultDTO<ResponseCourtDTO>>(this.apiUrl, { params }).pipe(
      tap((result) => {
        this._courts.set(result.data);
        this._totalCount.set(result.totalCount);
        this._totalPages.set(result.totalPages);
        this._page.set(result.page);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  getById(id: string): Observable<ResponseCourtDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseCourtDTO>(`${this.apiUrl}/${id}`).pipe(
      tap((court) => {
        this._selectedCourt.set(court);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }


  // --- Helpers ---

  selectcourt(court: ResponseCourtDTO | null): void {
    this._selectedCourt.set(court);
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
