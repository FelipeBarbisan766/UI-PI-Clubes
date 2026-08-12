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

  loading = signal(false);
  error = signal<string | null>(null);

  private reserveService = inject(ReserveService);

  protected cancel(id: string): void {
    this.reserveService.cancel(id);
    this.close.emit();
  }
 

}
