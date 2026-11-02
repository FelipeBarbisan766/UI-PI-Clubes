import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs';
import {
  CustomPlanCalculationRequest,
  ServiceSubscription,
} from '../../../features/admin/services/service-subscription';

export interface CustomPlanSelection extends CustomPlanCalculationRequest {
  totalPrice: number;
}

interface DurationOption {
  readonly value: number;
  readonly label: string;
}

@Component({
  selector: 'app-plan-calculator-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './plan-calculator-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCalculatorModal {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionService = inject(ServiceSubscription);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** Emitido quando o usuário confirma o plano calculado. O modal fecha antes de emitir. */
  readonly confirmed = output<CustomPlanSelection>();

  readonly maxClubs = 50;
  readonly maxCourts = 50;

  readonly durationOptions: readonly DurationOption[] = [
    { value: 1, label: '1 mês' },
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '12 meses' },
  ];

  readonly form = this.fb.group({
    clubQuantity: [1, [Validators.required, Validators.min(1), Validators.max(this.maxClubs)]],
    courtQuantity: [1, [Validators.required, Validators.min(1), Validators.max(this.maxCourts)]],
    durationMonths: [1, [Validators.required, Validators.min(1)]],
  });

  readonly clubQuantityControl = this.form.controls.clubQuantity;
  readonly courtQuantityControl = this.form.controls.courtQuantity;

  readonly totalPrice = signal<number | null>(null);
  readonly isCalculating = signal(false);
  readonly errorMessage = signal('');

  readonly formattedPrice = computed(() => {
    const price = this.totalPrice();
    return price === null
      ? ''
      : price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  });

  readonly canConfirm = computed(() => this.totalPrice() !== null && !this.isCalculating());

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.totalPrice.set(null);
      this.errorMessage.set('');
    });
  }

  blockNonDigits(event: InputEvent): void {
    if (event.data && /\D/.test(event.data)) {
      event.preventDefault();
    }
  }

  blockNonDigitsPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(text)) {
      event.preventDefault();
    }
  }

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  calculate(): void {
    if (this.isCalculating()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isCalculating.set(true);
    this.errorMessage.set('');
    this.totalPrice.set(null);

    this.subscriptionService
      .calculateCustomPlan(this.form.getRawValue())
      .pipe(
        take(1),
        finalize(() => this.isCalculating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => this.totalPrice.set(res.totalPrice),
        error: (err: unknown) =>
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Não foi possível calcular o valor.',
          ),
      });
  }

  confirm(): void {
    const price = this.totalPrice();
    if (price === null || this.form.invalid) return;

    const selection: CustomPlanSelection = { ...this.form.getRawValue(), totalPrice: price };
    this.close();
    this.confirmed.emit(selection);
  }
}