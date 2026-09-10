import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import {
  Plan,
  PaymentMethod,
  ServiceSubscription,
  SubscriptionApiError,
} from '../../services/service-subscription';
import { AuthService } from '../../../../core/services/auth-service';

type PaymentStep = 'select-method' | 'redirecting' | 'success' | 'pending' | 'failure';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  Pix: 'PIX',
  CreditCard: 'Cartão de Crédito',
  Boleto: 'Boleto Bancário',
};

const METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  Pix: 'Aprovação imediata',
  CreditCard: 'Parcelamento disponível',
  Boleto: 'Vence em 3 dias úteis',
};

@Component({
  selector: 'app-payment',
  templateUrl: './payment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payment implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptionService = inject(ServiceSubscription);
  private readonly authService = inject(AuthService);

  // ─── State signals ──────────────────────────────────────────────────────
  readonly step = signal<PaymentStep>('select-method');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly hasActiveSubscriptionConflict = signal(false);
  readonly selectedMethod = signal<PaymentMethod | null>(null);
  readonly selectedPlan = signal<Plan | null>(null);
  readonly isPolling = signal(false);
  readonly accessConfirmed = signal(false);
  readonly pollTimedOut = signal(false);

  // ─── Derived state ──────────────────────────────────────────────────────
  readonly methodOptions: PaymentMethod[] = ['Pix', 'CreditCard', 'Boleto'];

  readonly methodLabels = METHOD_LABELS;
  readonly methodDescriptions = METHOD_DESCRIPTIONS;

  readonly canSubmit = computed(
    () => this.selectedMethod() !== null && !this.isLoading()
  );

  // ─── Polling config ─────────────────────────────────────────────────────
  private readonly MAX_POLL_ATTEMPTS = 20; // 20 × 3 s = 60 s max
  private pollAttempts = 0;
  private pollingSubscription?: Subscription;

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.data.pipe(take(1)).subscribe((data) => {
      const step = (data['paymentStep'] as PaymentStep) ?? 'select-method';
      this.step.set(step);

      if (step === 'success') {
        this.startPolling();
      } else if (step === 'select-method') {
        this.loadPlanFromQueryParams();
      }
    });
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
  }

  initiatePayment(): void {
    const method = this.selectedMethod();
    const plan = this.selectedPlan();

    if (!method || !plan) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hasActiveSubscriptionConflict.set(false);
    this.step.set('redirecting');

    this.subscriptionService
      .initiatePayment(plan.id, method)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          window.location.href = result.checkoutUrl;
        },
        error: (err: SubscriptionApiError) => {
          this.isLoading.set(false);
          this.step.set('select-method');

          if (err.status === 409) {
            this.hasActiveSubscriptionConflict.set(true);
            this.errorMessage.set(
              'Você já possui uma assinatura ativa. Acesse "Minha assinatura" para gerenciar ou renovar seu plano.',
            );
          } else {
            this.errorMessage.set(err.message);
          }
        },
      });
  }

  goToPricing(): void {
    this.router.navigate(['/plans']);
  }

  goToSubscription(): void {
    this.router.navigate(['/subscriptions']);
  }

  retryPayment(): void {
    this.router.navigate(['/plans']);
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private loadPlanFromQueryParams(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const planId = params.get('planId');
      if (!planId) {
        this.router.navigate(['/plans']);
        return;
      }

      this.subscriptionService
        .getPlans()
        .pipe(take(1))
        .subscribe({
          next: (plans) => {
            const plan = plans.find((p) => p.id === planId) ?? null;
            if (!plan) {
              this.router.navigate(['/plans']);
              return;
            }
            this.selectedPlan.set(plan);
          },
          error: () => this.router.navigate(['/plans']),
        });
    });
  }


  private startPolling(): void {
    this.isPolling.set(true);
    this.pollAttempts = 0;

    this.pollingSubscription = interval(3000)
      .pipe(
        switchMap(() => this.subscriptionService.checkAccess()),
        take(this.MAX_POLL_ATTEMPTS)
      )
      .subscribe({
        next: (result) => {
          this.pollAttempts++;
          if (result.hasAccess) {
            this.isPolling.set(false);
            this.accessConfirmed.set(true);
            this.pollingSubscription?.unsubscribe();
          }
        },
        error: () => {
          this.isPolling.set(false);
        },
        complete: () => {
          if (!this.accessConfirmed()) {
            this.isPolling.set(false);
            this.pollTimedOut.set(true);
          }
        },
      });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}