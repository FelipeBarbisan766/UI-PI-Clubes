import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  ActiveSubscription,
  PaymentHistory,
  PaymentMethod,
  PaymentStatus,
  TypeAccess,
  ServiceSubscription,
} from '../../services/service-subscription';
import { AuthService } from '../../../../core/services/auth-service';

// ─── Display maps (pure constants, no globals) ────────────────────────────────

const METHOD_LABEL: Record<PaymentMethod, string> = {
  Pix: 'PIX',
  CreditCard: 'Cartão de Crédito',
  Boleto: 'Boleto',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  Confirmed: 'Confirmado',
  Pending: 'Pendente',
  Failed: 'Falhou',
  Refunded: 'Reembolsado',
};

const STATUS_BADGE: Record<PaymentStatus, string> = {
  Confirmed: 'badge-success',
  Pending: 'badge-warning',
  Failed: 'badge-error',
  Refunded: 'badge-info',
};

const ACCESS_LABEL: Record<TypeAccess, string> = {
  Owner: 'Proprietário',
  Manager: 'Gerente',
  Staff: 'Funcionário',
};

@Component({
  selector: 'app-subscription',
  templateUrl: './subscriptions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscriptions implements OnInit {
  private readonly router = inject(Router);
  private readonly subscriptionService = inject(ServiceSubscription);

  // ─── Cancel modal reference ────────────────────────────────────────────
  private readonly cancelModalEl =
    viewChild<ElementRef<HTMLDialogElement>>('cancelModal');

  private readonly authService = inject(AuthService);
  private adminId: string | null = null;

  // ─── State signals ─────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly isCancelling = signal(false);
  readonly errorMessage = signal('');
  readonly cancelError = signal('');

  readonly subscription = signal<ActiveSubscription | null>(null);
  readonly paymentHistory = signal<PaymentHistory[]>([]);

  // ─── Derived state ─────────────────────────────────────────────────────

  readonly hasSubscription = computed(() => this.subscription() !== null);

  /**
   * Days until expiry — computed without `new Date()` in template.
   * Calculation happens here, in the class.
   */
  readonly daysUntilExpiry = computed(() => {
    const sub = this.subscription();
    if (!sub) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    const expiry = new Date(sub.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((expiry - now) / msPerDay));
  });

  readonly isExpiringSoon = computed(() => this.daysUntilExpiry() <= 7);

  readonly expiryAlertClass = computed(() =>
    this.isExpiringSoon() ? 'alert-warning' : 'alert-info'
  );

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    
    this.authService.getAdminMe().subscribe({
      next: (admin) => {
        this.adminId = admin.id;
      },
      error: (err: unknown) => {
        console.error('Não foi possível obter o perfil do administrador.', err);
      },
    });
    if (this.adminId) {
        forkJoin({
        subscription: this.subscriptionService.getActiveSubscription(this.adminId),
        history: this.subscriptionService.getPaymentHistory(this.adminId),
        })
        .pipe(take(1))
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
  }

  // ─── Cancel modal ──────────────────────────────────────────────────────

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
      .pipe(take(1))
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

  // ─── Navigation ────────────────────────────────────────────────────────

  changePlan(): void {
    this.router.navigate(['/pricing']);
  }

  // ─── Display helpers ───────────────────────────────────────────────────

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

  methodLabel(method: PaymentMethod): string {
    return METHOD_LABEL[method] ?? method;
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