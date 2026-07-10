import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UserReserveService } from '../services/service-reserve';
import { Reservation, StatusEnum } from '../models/model-reserve';
import { AuthService } from '../../../core/services/auth-service';
import { switchMap } from 'rxjs';


interface StatusConfig {
  label:      string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<StatusEnum, StatusConfig> = {
  [StatusEnum.Pendente]:   { label: 'Pendente',   badgeClass: 'badge-warning' },
  [StatusEnum.Confirmada]: { label: 'Confirmada', badgeClass: 'badge-success' },
  [StatusEnum.Recusada]: { label: 'Cancelada',  badgeClass: 'badge-error'   },
};

@Component({
  selector: 'app-reserve',
  templateUrl: './user-reserves.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class UserReserve implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly reserveService = inject(UserReserveService);
  private readonly authService = inject(AuthService);

  // ── Service state (exposto ao template) ──────────────────────────────────
  protected readonly isLoading    = this.reserveService.isLoading;
  protected readonly error        = this.reserveService.error;
  protected readonly statusConfig = STATUS_CONFIG;

  // ── Filtros ───────────────────────────────────────────────────────────────
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filterControl = new FormControl<'all' | StatusEnum >('all', { nonNullable: true });

  private readonly search$       = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  private readonly filterStatus$ = toSignal(this.filterControl.valueChanges, { initialValue: 'all' as const });

  // ── Estado derivado ───────────────────────────────────────────────────────
  protected readonly filtered = computed(() => {
    const query  = this.search$().toLowerCase();
    const status = this.filterStatus$();

    return this.reserveService.reservations().filter(r => {
      const matchSearch = r.club.toLowerCase().includes(query)
                       || r.court.toLowerCase().includes(query);
      const matchStatus = status === 'all' || r.status === status;
      return matchSearch && matchStatus;
    });
  });

  protected readonly pendingCount = computed(
    () => this.reserveService.reservations().filter(r => r.status === 'AguardandoConfirmacao').length
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.authService.getPlayerMe().pipe(
      switchMap(async (player) => this.reserveService.loadByPlayerId(player.id))
    ).subscribe({
      next: () => {
      },
      error: (err: Error) => {
        console.error('Erro ao carregar reservas do jogador:', err);},
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  
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