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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FlagService } from '../../../../services/service-flag';
import { Flag } from '../../../../models/model-flag';

@Component({
  selector: 'app-modal-report',
  templateUrl: './modalReport.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class ModalReportComponent implements OnInit {
  userId = input.required<string>();
  reserveId = input.required<string>();
  userName = input<string>('');
  close = output<void>();
  reported = output<void>();

  private readonly flagService = inject(FlagService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly flags = signal<Flag[]>([]);
  protected readonly loadingFlags = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly form = new FormGroup({
    flagId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  ngOnInit(): void {
    this.flagService
      .getFlags()
      .pipe(
        finalize(() => this.loadingFlags.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (flags) => this.flags.set(flags),
        error: () => this.loadError.set('Não foi possível carregar os motivos de report.'),
      });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { flagId, notes } = this.form.getRawValue();
    this.submitting.set(true);
    this.submitError.set(null);

    this.flagService
      .reportUser(this.userId(), {
        flagId,
        reserveId: this.reserveId(),
        notes: notes.trim(),
      })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.success.set(true);
          this.reported.emit();
        },
        error: () => this.submitError.set('Não foi possível reportar o usuário. Tente novamente.'),
      });
  }
}