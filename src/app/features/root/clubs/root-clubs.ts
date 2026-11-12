import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { ServiceSport } from '../services/service-sport';
// TODO: ajuste os dois caminhos abaixo para a pasta onde estão o ServiceClub e o model-club.
import { ServiceClub } from '../../clubs/services/service-club';
import { ResponseClubDTO } from '../../clubs/models/model-club';

type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-root-clubs',
  imports: [ReactiveFormsModule, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-clubs.html',
})
export class RootClubs implements OnInit {
  protected readonly clubService = inject(ServiceClub);
  protected readonly sportService = inject(ServiceSport);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly PAGE_SIZE = 10;

  protected readonly toast = signal<ToastState | null>(null);
  protected readonly detailLoading = signal(false);

  private readonly detailDialog = viewChild.required<ElementRef<HTMLDialogElement>>('detailDialog');

  // --- Filtros (enviados ao servidor ao clicar em "Buscar") ---
  protected readonly filters = this.fb.group({
    name: [''],
    city: [''],
    sportId: [''],
  });

  // --- Paginação (estado vem do service) ---
  protected readonly hasPrev = computed(() => this.clubService.page() > 1);
  protected readonly hasNext = computed(() => this.clubService.page() < this.clubService.totalPages());

  // Imagens do clube aberto no detalhe, na ordem em que o backend devolve
  protected readonly detailImages = computed(() => this.clubService.selectedClub()?.images ?? []);

  ngOnInit(): void {
    this.loadClubs(1);
    this.sportService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this.sportService.clearError() });
  }

  // --- Lista ---

  private loadClubs(page: number): void {
    const { name, city, sportId } = this.filters.getRawValue();

    this.clubService
      .getAll({
        name: name.trim() || undefined,
        city: city.trim() || undefined,
        sportIds: sportId ? [sportId] : undefined,
        page,
        pageSize: this.PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err: unknown) => this.showError(err) });
  }

  protected onSearch(): void {
    this.loadClubs(1);
  }

  protected clearFilters(): void {
    this.filters.reset({ name: '', city: '', sportId: '' });
    this.loadClubs(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.clubService.totalPages()) return;
    this.loadClubs(page);
  }

  // --- Detalhe ---

  protected openDetail(club: ResponseClubDTO): void {
    this.clubService.selectClub(null);
    this.detailLoading.set(true);
    this.detailDialog().nativeElement.showModal();

    this.clubService
      .getById(club.id)
      .pipe(
        finalize(() => this.detailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (err: unknown) => {
          this.closeDetail();
          this.showError(err);
        },
      });
  }

  protected closeDetail(): void {
    this.detailDialog().nativeElement.close();
  }

  /** Disparado pelo evento `close` do <dialog> (botão, ESC ou backdrop). */
  protected onDetailClosed(): void {
    this.clubService.selectClub(null);
  }

  // --- Helpers de exibição ---

  protected firstThumb(club: ResponseClubDTO): string | null {
    return club.images?.[0]?.thumbUrl ?? null;
  }

  protected formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /** "GramaSintética" → "Grama Sintética"; valores já com espaço ficam como estão. */
  protected surfaceLabel(surface: string): string {
    return String(surface).replace(/([a-zà-ú])([A-Z])/g, '$1 $2');
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }

  private showError(err: unknown): void {
    this.clubService.clearError();
    this.toast.set({ message: getApiErrorMessage(err), type: 'error' });
  }
}