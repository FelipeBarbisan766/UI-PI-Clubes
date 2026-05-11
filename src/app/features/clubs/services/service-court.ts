import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ResponseCourtDTO} from '../models/model-court';
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
  readonly selectedcourt = this._selectedCourt.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => this._courts().length === 0);
  readonly courtsCount = computed(() => this._courts().length);

  // --- CRUD ---

  getAll(clubId: string): Observable<ResponseCourtDTO[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ResponseCourtDTO[]>(`${this.apiUrl}/club/${clubId}`).pipe(
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
