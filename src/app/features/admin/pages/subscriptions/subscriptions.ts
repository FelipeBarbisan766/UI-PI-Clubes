import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  ActiveSubscription,
  PaymentHistory,
  PaymentStatus,
  TypeAccess,
  ServiceSubscription,
} from '../../services/service-subscription';
import { PaymentMethodPipe } from '../../../../shared/pipes/paymentMethodPipe';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  Confirmed: 'Confirmado',
  Pending: 'Pendente',
  Failed: 'Não aprovado',
};

const STATUS_BADGE: Record<PaymentStatus, string> = {
  Confirmed: 'badge-success',
  Pending: 'badge-warning',
  Failed: 'badge-error',
};

const ACCESS_LABEL: Record<TypeAccess, string> = {
  Owner: 'Proprietário',
  Manager: 'Gerente',
  Staff: 'Funcionário',
};

@Component({
  selector: 'app-subscription',
  imports: [PaymentMethodPipe],
  templateUrl: './subscriptions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscriptions implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionService = inject(ServiceSubscription);

  private readonly cancelModalEl = viewChild<ElementRef<HTMLDialogElement>>('cancelModal');

  readonly isLoading = signal(true);
  readonly isCancelling = signal(false);
  readonly errorMessage = signal('');
  readonly cancelError = signal('');

  readonly subscription = signal<ActiveSubscription | null>(null);
  readonly paymentHistory = signal<PaymentHistory[]>([]);

  readonly hasSubscription = computed(() => this.subscription() !== null);

  readonly daysUntilExpiry = computed(() => {
    const sub = this.subscription();
    if (!sub) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / msPerDay));
  });

  readonly isExpiringSoon = computed(() => this.daysUntilExpiry() <= 7);

  ngOnInit(): void {
    forkJoin({
      subscription: this.subscriptionService.getActiveSubscription(),
      history: this.subscriptionService.getPaymentHistory(),
    })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ subscription, history }) => {
          this.subscription.set(subscription);
          this.paymentHistory.set(history);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message);
        },
      });
  }

  openCancelModal(): void {
    this.cancelError.set('');
    this.cancelModalEl()?.nativeElement.showModal();
  }

  closeCancelModal(): void {
    this.cancelModalEl()?.nativeElement.close();
  }

  confirmCancel(): void {
    const sub = this.subscription();
    if (!sub) return;

    this.isCancelling.set(true);
    this.cancelError.set('');

    this.subscriptionService
      .cancelSubscription(sub.id)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCancelling.set(false);
          this.subscription.set(null);
          this.closeCancelModal();
        },
        error: (err: Error) => {
          this.isCancelling.set(false);
          this.cancelError.set(err.message);
        },
      });
  }

  changePlan(): void {
    this.router.navigate(['/plans']); 
  }

  formatPrice(amount: number): string {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  statusLabel(status: PaymentStatus): string {
    return STATUS_LABEL[status] ?? status;
  }

  statusBadgeClass(status: PaymentStatus): string {
    return STATUS_BADGE[status] ?? 'badge-ghost';
  }

  accessLabel(type: TypeAccess): string {
    return ACCESS_LABEL[type] ?? type;
  }
}