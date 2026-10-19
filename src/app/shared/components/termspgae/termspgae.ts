import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-termspgae',
  imports: [],
  templateUrl: './termspgae.html',
  styleUrl: './termspgae.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Termspgae {
  /** Quando true, remove o espaçamento de página para caber dentro de um modal. */
  readonly embedded = input(false);
}