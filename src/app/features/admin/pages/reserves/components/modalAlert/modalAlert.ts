import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { UserService } from '../../../../services/service-user';
import { ReserveService } from '../../../../services/service-reserve';

@Component({
  selector: 'app-modal-alert',
  templateUrl: './modalAlert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalAlertComponent {
  reservationId = input.required<string>();
  close = output<void>();
  cancelled = output<void>();
  failed = output<string>();

  loading = signal(false);
  private reserveService = inject(ReserveService);

  protected cancel(id: string): void {
    this.loading.set(true);
    this.reserveService
      .cancel(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.cancelled.emit();
          this.close.emit();
        },
        error: (err: Error) => {
          this.failed.emit(err.message);
          this.close.emit();
        },
      });
  }
}
