import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResourceTable } from '../../../shared/components/resource-table/resource-table';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { Field } from '../models/resource-table.model';
import { User, roleLabel } from '../models/model-user';
import { ServiceUser } from '../services/service-user';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-root-users',
  imports: [ResourceTable, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-users.html',
})
export class RootUsers implements OnInit {
  protected readonly userService = inject(ServiceUser);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly toast = signal<ToastState | null>(null);

  protected readonly fields: Field<User>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Telefone', format: (r) => r.phoneNumber || '—' },
    { key: 'role', label: 'Perfil', format: (r) => roleLabel(r.role) },
  ];

  protected readonly searchKeys: (keyof User & string)[] = ['name', 'email', 'phoneNumber'];

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.userService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) => {
          this.userService.clearError();
          this.toast.set({ message: getApiErrorMessage(err), type: 'error' });
        },
      });
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }
}