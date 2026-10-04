import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Reservation, StatusEnum } from '../../../../models/model-reserve';

@Component({
  selector: 'app-modal-actions',
  templateUrl: './modalActions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalActionsComponent {
  reservation = input.required<Reservation>();
  isReported = input(false);

  cancelReserve = output<void>();
  reportUser = output<void>();
  close = output<void>();

  protected readonly StatusEnum = StatusEnum;
}