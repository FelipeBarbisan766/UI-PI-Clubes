import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ReserveService } from '../../services/service-reserve';
import { Reservation, ReservationStatus } from '../../models/model-reserve';

interface StatusConfig {
  label:      string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<ReservationStatus, StatusConfig> = {
  pending:   { label: 'Pendente',   badgeClass: 'badge-warning' },
  confirmed: { label: 'Confirmada', badgeClass: 'badge-success' },
  cancelled: { label: 'Cancelada',  badgeClass: 'badge-error'   },
};

@Component({
  selector: 'app-reserve',
  templateUrl: './reserves.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class Reserve implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly reserveService = inject(ReserveService);

  // ── Service state (exposto ao template) ──────────────────────────────────
  protected readonly isLoading    = this.reserveService.isLoading;
  protected readonly error        = this.reserveService.error;
  protected readonly statusConfig = STATUS_CONFIG;

  // ── Filtros ───────────────────────────────────────────────────────────────
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filterControl = new FormControl<'all' | ReservationStatus>('all', { nonNullable: true });

  private readonly search$       = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  private readonly filterStatus$ = toSignal(this.filterControl.valueChanges, { initialValue: 'all' as const });

  // ── Estado derivado ───────────────────────────────────────────────────────
  protected readonly filtered = computed(() => {
    const query  = this.search$().toLowerCase();
    const status = this.filterStatus$();

    return this.reserveService.reservations().filter(r => {
      const matchSearch = r.player.toLowerCase().includes(query)
                       || r.court.toLowerCase().includes(query);
      const matchStatus = status === 'all' || r.status === status;
      return matchSearch && matchStatus;
    });
  });

  protected readonly pendingCount = computed(
    () => this.reserveService.reservations().filter(r => r.status === 'pending').length
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const clubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';
    console.log('Club ID:', clubId); // Adicione este log para depuração
    if (clubId) this.reserveService.loadByClubId(clubId);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  protected confirm(id: string): void {
    this.reserveService.confirm(id);
  }

  protected cancel(id: string): void {
    this.reserveService.cancel(id);
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