import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResourceTable } from '../../../shared/components/resource-table/resource-table';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { Field } from '../models/resource-table.model';
import { ResponseSportDTO } from '../models/model-sport';
import { ServiceSport } from '../services/service-sport';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-root-sports',
  imports: [ResourceTable, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-sports.html',
})
export class RootSports implements OnInit {
  protected readonly sportService = inject(ServiceSport);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly toast = signal<ToastState | null>(null);

  protected readonly fields: Field<ResponseSportDTO>[] = [{ key: 'name', label: 'Esporte' }];

  protected readonly searchKeys: (keyof ResponseSportDTO & string)[] = ['name'];

  protected readonly newSport = (): ResponseSportDTO => ({ id: '', name: '' });

  ngOnInit(): void {
    this.loadSports();
  }

  private loadSports(): void {
    this.sportService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) => {
          this.sportService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onCreate(sport: ResponseSportDTO): void {
    this.sportService
      .create({ name: sport.name.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Esporte criado com sucesso!', 'success');
          this.loadSports();
        },
        error: (err: unknown) => {
          this.sportService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onDelete(sport: ResponseSportDTO): void {
    this.sportService
      .delete(sport.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showToast(`"${sport.name}" removido.`, 'success'),
        error: (err: unknown) => {
          this.sportService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }

  private showToast(message: string, type: ToastState['type']): void {
    this.toast.set({ message, type });
  }
}