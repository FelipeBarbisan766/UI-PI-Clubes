import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseClubDTO, ResponseClubByIdDTO, CreateClubDTO, UpdateClubDTO } from '../models/model-club';
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

  create(dto: CreateClubDTO): Observable<ResponseClubDTO> {
    this._loading.set(true);
    this._error.set(null);

    const formData = new FormData();
    formData.append('adminId', dto.adminId);
    formData.append('name', dto.name);
    formData.append('phoneNumber', dto.phoneNumber);
    formData.append('description', dto.description);
    formData.append('zipCode', dto.zipCode);
    formData.append('street', dto.street);
    formData.append('number', dto.number);
    formData.append('neighborhood', dto.neighborhood);
    if (dto.complement) formData.append('complement', dto.complement);
    formData.append('city', dto.city);
    formData.append('state', dto.state);
    formData.append('country', dto.country);
    dto.images.forEach((img) => formData.append('images', img));

    return this.http.post<ResponseClubDTO>(this.apiUrl, formData).pipe(
      tap((newClub) => {
        this._clubs.update((clubs) => [...clubs, newClub]);
        this._loading.set(false);
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  update(id: string, dto: UpdateClubDTO): Observable<ResponseClubDTO> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<ResponseClubDTO>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this._clubs.update((clubs) =>
          clubs.map((c) => (c.id === id ? updated : c)),
        );
        if (this._selectedClub()) {
          this._selectedClub.set({ ...this._selectedClub()!, ...dto, imagesUrls: this._selectedClub()!.imagesUrls, courts: this._selectedClub()!.courts });
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
        this._clubs.update((clubs) => clubs.filter((c) => c.id !== id));
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
