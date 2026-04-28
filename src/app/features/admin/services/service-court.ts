import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseCourtDTO, CreateCourtDTO, UpdateCourtDTO } from '../models/model-court';
import { environment } from '../../../../environments/environment';

export interface CourtState {
  courts: ResponseCourtDTO[];
  selectedCourt: ResponseCourtDTO | null;
  loading: boolean;
  error: string | null;
}

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

  // --- Selectors (public, readonly) ---
  readonly courts = this._courts.asReadonly();
  readonly selectedCourt = this._selectedCourt.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._courts().length === 0);
  readonly courtsCount = computed(() => this._courts().length);

  // --- CRUD ---

  getAll(params?: Record<string, string>): Observable<ResponseCourtDTO[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseCourtDTO[]>(this.apiUrl, { params: httpParams }).pipe(
      tap((courts) => {
        this._courts.set(courts);
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

  create(dto: CreateCourtDTO): Observable<ResponseCourtDTO> {
    this._loading.set(true);
    this._error.set(null);

    const formData = new FormData();
    formData.append('name', dto.name);
    formData.append('type', dto.type.toString());
    formData.append('surface', dto.surface.toString());
    formData.append('isCovered', String(dto.isCovered));
    formData.append('pricePerHour', dto.pricePerHour.toString());
    formData.append('description', dto.description);
    formData.append('clubId', dto.clubId);
    dto.images.forEach(img => formData.append('images', img));

    return this.http.post<ResponseCourtDTO>(this.apiUrl, formData).pipe(
      tap((newCourt) => {
        this._courts.update((courts) => [...courts, newCourt]);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  update(id: string, dto: UpdateCourtDTO): Observable<ResponseCourtDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<ResponseCourtDTO>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this._courts.update((courts) =>
          courts.map((c) => (c.id === id ? updated : c)),
        );
        if (this._selectedCourt()?.id === id) {
          this._selectedCourt.set(updated);
        }
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  delete(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._courts.update((courts) => courts.filter((c) => c.id !== id));
        if (this._selectedCourt()?.id === id) {
          this._selectedCourt.set(null);
        }
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  // --- Helpers ---

  selectCourt(court: ResponseCourtDTO | null): void {
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
