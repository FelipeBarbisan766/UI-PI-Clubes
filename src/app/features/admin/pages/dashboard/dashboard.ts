import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ServiceClub } from '../../services/service-club';
import { ResponseReserveDetailDTO, StatusEnum } from '../../models/model-reserve';

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

  readonly dashboard = this.serviceClub.dashboard;
  readonly loading = this.serviceClub.loading;
  readonly error = this.serviceClub.error;

  ngOnInit(): void {
   const clubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';

    if (!clubId) {
      return;
    }

    this.serviceClub
      .getDashboard(clubId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }


  formatReserveDate(dateIso: string): string {
    const date = new Date(dateIso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (this.isSameDay(date, today)) return 'Hoje';
    if (this.isSameDay(date, tomorrow)) return 'Amanhã';

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  timeRange(reserve: ResponseReserveDetailDTO): string {
    const start = reserve.schedule.startTime.slice(0, 5);
    const end = reserve.schedule.endTime.slice(0, 5);
    return `${start} - ${end}`;
  }

  courtLabel(reserve: ResponseReserveDetailDTO): string {
    return `${reserve.schedule.court.name} - ${reserve.schedule.court.type}`;
  }

  statusBadgeClasses(status: StatusEnum): string {
    switch (status) {
      case 'Confirmada':
        return 'text-green-600 bg-base-50 border-green-100';
      case 'Cancelada':
        return 'text-red-500 bg-base-50 border-red-100';
      default:
        return 'text-gray-600 bg-base-50 border-gray-100';
    }
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}