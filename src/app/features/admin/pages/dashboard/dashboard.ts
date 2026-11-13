import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ServiceClub } from '../../services/service-club';
import { ResponseReserveDetailDTO, StatusEnum } from '../../models/model-reserve';

interface StatusConfig {
  label: string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<StatusEnum, StatusConfig> = {
  [StatusEnum.Confirmada]: { label: 'Confirmada', badgeClass: 'badge-success' },
  [StatusEnum.Cancelada]: { label: 'Cancelada', badgeClass: 'badge-error' },
};

interface RecentReserve {
  id: string;
  playerName: string;
  courtName: string;
  sports: string[];
  dateLabel: string;
  timeLabel: string;
  statusLabel: string;
  statusBadgeClass: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly serviceClub = inject(ServiceClub);

  private clubId = '';

  readonly dashboard = this.serviceClub.dashboard;
  readonly loading = this.serviceClub.loading;
  readonly error = this.serviceClub.error;

  /** Reservas já formatadas para exibição (evita lógica e chamadas de função no template). */
  readonly recentReserves = computed<RecentReserve[]>(() => {
    const data = this.dashboard();
    if (!data) return [];

    const today = new Date();

    return data.clubReserve.map((reserve) => {
      const status = STATUS_CONFIG[reserve.status] ?? {
        label: reserve.status,
        badgeClass: 'badge-ghost',
      };

      return {
        id: reserve.id,
        playerName: reserve.name,
        courtName: reserve.schedule.court.name,
        sports: reserve.schedule.court.sports.map((sport) => sport.name),
        dateLabel: this.formatReserveDate(reserve.date, today),
        timeLabel: this.timeRange(reserve),
        statusLabel: status.label,
        statusBadgeClass: status.badgeClass,
      };
    });
  });

  ngOnInit(): void {
    this.clubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';

    this.load();
  }

  load(): void {
    if (!this.clubId) return;

    this.serviceClub
      .getDashboard(this.clubId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // o erro já é exposto pelo signal `error` do service
        error: () => undefined,
      });
  }

  private formatReserveDate(dateIso: string, today: Date): string {
    // Usa só a parte da data + meio-dia local para não "voltar um dia" por causa do fuso (UTC-3)
    const date = new Date(`${dateIso.slice(0, 10)}T12:00:00`);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (this.isSameDay(date, today)) return 'Hoje';
    if (this.isSameDay(date, tomorrow)) return 'Amanhã';

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  private timeRange(reserve: ResponseReserveDetailDTO): string {
    const start = reserve.schedule.startTime.slice(0, 5);
    const end = reserve.schedule.endTime.slice(0, 5);
    return `${start} - ${end}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}