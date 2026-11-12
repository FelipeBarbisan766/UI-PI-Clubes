import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResourceTable } from '../../../shared/components/resource-table/resource-table';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { Field } from '../models/resource-table.model';
import { Flag } from '../models/model-flags';
import { ServiceFlag } from '../services/service-flag';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-root-flags',
  imports: [ResourceTable, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-flags.html',
})
export class RootFlags implements OnInit {
  protected readonly flagService = inject(ServiceFlag);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly toast = signal<ToastState | null>(null);

  protected readonly fields: Field<Flag>[] = [
    { key: 'name', label: 'Nome', display: 'code' },
    { key: 'description', label: 'Descrição' },
  ];

  protected readonly searchKeys: (keyof Flag & string)[] = ['name', 'description'];

  // id vazio: o backend gera o id real no create.
  protected readonly newFlag = (): Flag => ({ id: '', name: '', description: '' });

  ngOnInit(): void {
    this.loadFlags();
  }

  private loadFlags(): void {
    this.flagService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) => {
          this.flagService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onCreate(flag: Flag): void {
    this.flagService
      .create({ name: flag.name.trim(), description: flag.description.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Flag criada com sucesso!', 'success');
          this.loadFlags();
        },
        error: (err: unknown) => {
          this.flagService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onDelete(flag: Flag): void {
    this.flagService
      .delete(flag.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showToast(`"${flag.name}" removida.`, 'success'),
        error: (err: unknown) => {
          this.flagService.clearError();
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