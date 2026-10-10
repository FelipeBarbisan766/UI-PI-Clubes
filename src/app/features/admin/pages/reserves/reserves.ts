import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, merge, switchMap } from 'rxjs';

import { ReserveService } from '../../services/service-reserve';
import { FlagService } from '../../services/service-flag';
import { Reservation, StatusEnum } from '../../models/model-reserve';
import { ModalUserComponent } from './components/modalUser/modalUser';
import { ModalAlertComponent } from './components/modalAlert/modalAlert';
import { ModalReportComponent } from './components/modalReport/modalReport';
import { ModalActionsComponent } from './components/modalActions/modalActions';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';

interface StatusConfig {
  label: string;
  badgeClass: string;
}

interface ReportTarget {
  userId: string;
  reserveId: string;
  userName: string;
}

const STATUS_CONFIG: Record<StatusEnum, StatusConfig> = {
  [StatusEnum.Confirmada]: { label: 'Confirmada', badgeClass: 'badge-success' },
  [StatusEnum.Cancelada]: { label: 'Cancelada', badgeClass: 'badge-error' },
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

@Component({
  selector: 'app-reserve',
  templateUrl: './reserves.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ModalUserComponent,
    ModalAlertComponent,
    ModalReportComponent,
    ModalActionsComponent,
    ToastAlert
],
})
export class Reserve implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reserveService = inject(ReserveService);
  private readonly flagService = inject(FlagService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Service state (exposto ao template) ──────────────────────────────────
  protected readonly isLoading = this.reserveService.isLoading;
  protected readonly error = this.reserveService.error;
  protected readonly totalPages = this.reserveService.totalPages;
  protected readonly reservations = this.reserveService.reservations;
  protected readonly statusConfig = STATUS_CONFIG;
  protected readonly StatusEnum = StatusEnum;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // ── Filtros / paginação ───────────────────────────────────────────────────
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filterControl = new FormControl<'all' | StatusEnum>('all', {
    nonNullable: true,
  });

  // ── Modal ─────────────────────────────────────────────────────────────────
  readonly ModalOpen = signal(false);
  readonly selectedReservationId = signal<string | null>(null);
  readonly selectedUserId = signal<string | null>(null);
  readonly selectedReport = signal<ReportTarget | null>(null);
  readonly selectedActions = signal<Reservation | null>(null);
  protected readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  private readonly refresh = signal(0);
  // ── Reservas já reportadas (ids de reserva) ───────────────────────────────
  private readonly reportedReserveIds = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedActionsReported = computed(() => {
    const reservation = this.selectedActions();
    return reservation ? this.reportedReserveIds().has(reservation.id) : false;
  });

  private readonly clubId = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(PAGE_SIZE_OPTIONS[0]);

  private readonly search$ = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );
  private readonly filterStatus$ = toSignal(this.filterControl.valueChanges, {
    initialValue: 'all' as const,
  });

  private readonly queryState = computed(() => ({
    clubId: this.clubId(),
    page: this.page(),
    pageSize: this.pageSize(),
    name: this.search$(),
    status: this.filterStatus$(),
    refresh: this.refresh(),
  }));

  private readonly queryState$ = toObservable(this.queryState);

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
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.page.set(1));

    // Qualquer mudança relevante (clubId/page/pageSize/name/status) → recarrega do backend
    // e, em seguida, descobre quais reservas da página já foram reportadas
    this.queryState$
      .pipe(
        filter((state): state is typeof state & { clubId: string } => state.clubId !== null),
        switchMap((state) =>
          this.reserveService
            .loadByClubId(state.clubId, {
              page: state.page,
              pageSize: state.pageSize,
              name: state.name || undefined,
              status: state.status === 'all' ? undefined : state.status,
            })
            .pipe(
              switchMap((result) =>
                this.flagService.getReportedReserveIds([
                  ...new Set(result.data.map((r) => r.userId)),
                ]),
              ),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((reserveIds) => this.markAsReported(reserveIds));
  }

  // ── Reportados ────────────────────────────────────────────────────────────
  protected isReported(reserveId: string): boolean {
    return this.reportedReserveIds().has(reserveId);
  }

  private markAsReported(reserveIds: string[]): void {
    this.reportedReserveIds.update((current) => new Set([...current, ...reserveIds]));
  }

  protected onReported(reserveId: string): void {
    this.markAsReported([reserveId]);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  closeModal(): void {
    this.ModalOpen.set(false);
  }

  private resetSelection(): void {
    this.selectedUserId.set(null);
    this.selectedReservationId.set(null);
    this.selectedReport.set(null);
    this.selectedActions.set(null);
  }

  openActionsModal(r: Reservation): void {
    this.resetSelection();
    this.selectedActions.set(r);
    this.ModalOpen.set(true);
  }

  openAlertModal(reservationId: string): void {
    this.resetSelection();
    this.selectedReservationId.set(reservationId);
    this.ModalOpen.set(true);
  }

  openUserModal(userId: string): void {
    this.resetSelection();
    this.selectedUserId.set(userId);
    this.ModalOpen.set(true);
  }

  openReportModal(r: Reservation): void {
    if (this.isReported(r.id)) return;
    this.resetSelection();
    this.selectedReport.set({ userId: r.userId, reserveId: r.id, userName: r.name });
    this.ModalOpen.set(true);
  }

  onModalTransitionEnd(): void {
    if (!this.ModalOpen()) {
      this.resetSelection();
    }
  }

  protected confirm(id: string): void {
    this.reserveService.confirm(id);
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
  protected onCancelled(): void {
    this.toast.set({ message: 'Reserva cancelada com sucesso.', type: 'success' });
  }

  protected onCancelFailed(message: string): void {
    this.toast.set({ message, type: 'error' });
    this.refresh.update((n) => n + 1);
  }

  protected dismissToast(): void {
    this.toast.set(null);
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
