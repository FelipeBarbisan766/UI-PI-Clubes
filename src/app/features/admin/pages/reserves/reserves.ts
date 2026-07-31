import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, merge, switchMap } from 'rxjs';

import { ReserveService } from '../../services/service-reserve';
import { Reservation, StatusEnum } from '../../models/model-reserve';

interface StatusConfig {
  label:      string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<StatusEnum, StatusConfig> = {
  [StatusEnum.Pendente]:   { label: 'Pendente',   badgeClass: 'badge-warning' },
  [StatusEnum.Confirmada]: { label: 'Confirmada', badgeClass: 'badge-success' },
  [StatusEnum.Recusada]:   { label: 'Cancelada',  badgeClass: 'badge-error'   },
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

@Component({
  selector: 'app-reserve',
  templateUrl: './reserves.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class Reserve implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly reserveService = inject(ReserveService);
  private readonly destroyRef     = inject(DestroyRef);

  // ── Service state (exposto ao template) ──────────────────────────────────
  protected readonly isLoading       = this.reserveService.isLoading;
  protected readonly error           = this.reserveService.error;
  protected readonly totalPages      = this.reserveService.totalPages;
  protected readonly reservations    = this.reserveService.reservations;
  protected readonly statusConfig    = STATUS_CONFIG;
  protected readonly StatusEnum      = StatusEnum;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // ── Filtros / paginação ───────────────────────────────────────────────────
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filterControl = new FormControl<'all' | StatusEnum>('all', { nonNullable: true });

  private readonly clubId     = signal<string | null>(null);
  protected readonly page     = signal(1);
  protected readonly pageSize = signal<number>(PAGE_SIZE_OPTIONS[0]);

  private readonly search$       = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );
  private readonly filterStatus$ = toSignal(this.filterControl.valueChanges, { initialValue: 'all' as const });

  private readonly queryState = computed(() => ({
    clubId:   this.clubId(),
    page:     this.page(),
    pageSize: this.pageSize(),
    name:     this.search$(),
    status:   this.filterStatus$(),
  }));

  private readonly queryState$ = toObservable(this.queryState);

  protected readonly pendingCount = computed(
    () => this.reservations().filter(r => r.status === StatusEnum.Pendente).length
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const clubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';

    if (clubId) this.clubId.set(clubId);

    // Busca ou filtro de status mudaram → volta pra página 1
    merge(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.filterControl.valueChanges,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.page.set(1));

    // Qualquer mudança relevante (clubId/page/pageSize/name/status) → recarrega do backend
    this.queryState$.pipe(
      filter((state): state is typeof state & { clubId: string } => state.clubId !== null),
      switchMap(state =>
        this.reserveService.loadByClubId(state.clubId, {
          page:     state.page,
          pageSize: state.pageSize,
          name:     state.name || undefined,
          status:   state.status === 'all' ? undefined : state.status,
        })
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  protected confirm(id: string): void {
    this.reserveService.confirm(id);
  }

  protected cancel(id: string): void {
    this.reserveService.cancel(id);
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
    }
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  // ── Formatters ────────────────────────────────────────────────────────────
  protected formatDate(dateStr: string): string {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  protected formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected trackById(_index: number, item: Reservation): string {
    return item.id;
  }
}