import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, take, takeWhile, timer, switchMap } from 'rxjs';
import {
  Plan,
  PaymentStatus,
  ServiceSubscription,
  SubscriptionApiError,
} from '../../services/service-subscription';
import { AuthService } from '../../../../core/services/auth-service';

type PaymentStep = 'review' | 'redirecting' | 'success' | 'pending' | 'failure';
type TrackedStatus = PaymentStatus | 'Unknown';

const PENDING_PAYMENT_KEY = 'clubera:pendingPaymentId';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // 20 × 3 s ≈ 60 s

@Component({
  selector: 'app-payment',
  templateUrl: './payment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payment implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionService = inject(ServiceSubscription);
  private readonly authService = inject(AuthService);

  // ─── State signals ──────────────────────────────────────────────────────
  readonly step = signal<PaymentStep>('review');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly hasActiveSubscriptionConflict = signal(false);
  readonly selectedPlan = signal<Plan | null>(null);

  // Acompanhamento do pagamento (página de retorno)
  readonly paymentStatus = signal<TrackedStatus>('Pending');
  readonly isPolling = signal(false);
  readonly pollTimedOut = signal(false);

  readonly canSubmit = computed(() => this.selectedPlan() !== null && !this.isLoading());

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.data.pipe(take(1)).subscribe((data) => {
      const step = (data['paymentStep'] as PaymentStep) ?? 'review';
      this.step.set(step);

      if (step === 'success') {
        this.startPolling();
      } else if (step === 'review') {
        this.loadPlanFromQueryParams();
      }
    });
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  initiatePayment(): void {
    const plan = this.selectedPlan();
    if (!plan || this.isLoading()) return; // evita clique duplo (cada clique cria uma order)

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hasActiveSubscriptionConflict.set(false);
    this.step.set('redirecting');

    this.subscriptionService
      .initiatePayment(plan.id)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ paymentId, checkoutUrl }) => {
          // Na volta do Mercado Pago o app recarrega do zero: o paymentId diz o que acompanhar.
          sessionStorage.setItem(PENDING_PAYMENT_KEY, paymentId);
          window.location.href = checkoutUrl;
        },
        error: (err: SubscriptionApiError) => {
          this.isLoading.set(false);
          this.step.set('review');

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
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
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
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
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

  /**
   * A página de retorno NÃO confirma pagamento: quem confirma é o webhook.
   * Aqui só acompanhamos o status do paymentId guardado até sair de Pending.
   */
  private startPolling(): void {
    const paymentId = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!paymentId) {
      this.paymentStatus.set('Unknown'); // abriu a página direto, sem iniciar pagamento
      return;
    }

    this.isPolling.set(true);
    let attempts = 0;

    timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.subscriptionService.getPaymentHistory()),
        map((list): TrackedStatus => list.find((p) => p.id === paymentId)?.status ?? 'Unknown'),
        takeWhile((status) => {
          attempts++;
          return status === 'Pending' && attempts < MAX_POLL_ATTEMPTS;
        }, true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (status) => this.paymentStatus.set(status),
        error: () => {
          this.isPolling.set(false);
          this.pollTimedOut.set(true);
        },
        complete: () => {
          this.isPolling.set(false);
          if (this.paymentStatus() === 'Pending') {
            this.pollTimedOut.set(true);
          } else {
            sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          }
        },
      });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}